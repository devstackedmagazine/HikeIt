import { env } from "@/config/env";
import { getPaddle, isPaddleConfigured } from "@/lib/paddle/client";
import { captureError } from "@/lib/sentry";
import {
  handleSubscriptionCanceled,
  handleSubscriptionChanged,
  handleSubscriptionPastDue,
  handleTransactionCompleted,
  handleTransactionPaymentFailed,
} from "@/server/services/paddle-webhooks";

export const dynamic = "force-dynamic";

/**
 * Paddle webhook endpoint.
 *
 * **Every request is signature-verified. No exceptions, no bypass.** Paddle
 * signs `Paddle-Signature: ts=<unix>;h1=<hex>` where the HMAC-SHA256 payload
 * is `timestamp + ":" + rawBody`. This differs from Stripe's scheme, so it is
 * verified with Paddle's own `webhooks.unmarshal()` rather than anything
 * adapted from the old handler — it does the HMAC, the timing-safe compare and
 * a replay-window check on the timestamp, and returns the parsed event only if
 * all three pass.
 *
 * The raw body must be read with `request.text()` and handed over untouched.
 * Parsing it first and re-serialising would change the bytes and break every
 * signature.
 */
export async function POST(request: Request) {
  if (!isPaddleConfigured() || !env.PADDLE_WEBHOOK_SECRET) {
    return Response.json({ error: "Paddle not configured" }, { status: 503 });
  }

  const signature = request.headers.get("paddle-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  // Raw, unparsed, unmodified — the signature is over these exact bytes.
  const body = await request.text();

  let event;
  try {
    event = await getPaddle().webhooks.unmarshal(
      body,
      env.PADDLE_WEBHOOK_SECRET,
      signature,
    );
  } catch {
    // Verification failed: bad secret, tampered payload, or a replayed event
    // outside the timestamp window. Never say which.
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!event) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handlers are awaited but defensively wrapped: a thrown handler must not
  // make us return non-200, or Paddle will retry the same broken payload
  // indefinitely.
  try {
    switch (event.eventType) {
      // Both write the subscription's current state onto the club, so they
      // share a handler — Paddle can deliver `updated` before `created` on a
      // retry, and two code paths that must agree is a bug waiting to happen.
      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionChanged(event.data);
        break;
      case "subscription.canceled":
        await handleSubscriptionCanceled(event.data);
        break;
      case "subscription.past_due":
        await handleSubscriptionPastDue(event.data);
        break;
      case "transaction.completed":
        await handleTransactionCompleted(event.data);
        break;
      case "transaction.payment_failed":
        await handleTransactionPaymentFailed(event.data);
        break;
      default:
        // Paddle sends more event types than we subscribe to. Ignoring an
        // unhandled one is expected and not worth reporting.
        break;
    }
  } catch (error) {
    captureError(error, {
      action: "paddleWebhook",
      extra: { eventType: event.eventType, eventId: event.eventId },
    });
    // Still 200: the signature verified, so this is our processing bug, not a
    // delivery problem. Retrying the same payload won't fix it, and a 500
    // would make Paddle hammer us. Sentry has it for follow-up.
  }

  return Response.json({ received: true });
}
