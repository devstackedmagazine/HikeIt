import type Stripe from "stripe";

import { env } from "@/config/env";
import { captureError, captureMessage } from "@/lib/sentry";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import {
  handleCheckoutCompleted,
  handleConnectAccountUpdated,
  handlePaymentFailed,
  handlePaymentSucceeded,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
  handleTripPaymentFailed,
  handleTripPaymentSucceeded,
} from "@/server/services/stripe-webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isStripeConfigured() || !env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Diagnostic: every verified event that reaches the dispatch, with its type
  // and (for Connect) which account it came from.
  captureMessage("webhook event received", "info", {
    eventId: event.id,
    eventType: event.type,
    eventAccount: event.account ?? null,
  });

  // Heavy work is awaited but each handler is defensively wrapped: a thrown
  // handler must not make us return non-200, or Stripe will retry endlessly.
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      // Trip payments (Connect). Only PaymentIntents we created for a trip
      // carry `metadata.tripId`; ignore any others (e.g. future direct charges).
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        // Diagnostic: log entry into the branch BEFORE any guard, so we can
        // see whether the event reaches here at all and what metadata/account
        // it carries.
        captureMessage("webhook payment_intent.succeeded entered", "info", {
          eventId: event.id,
          eventAccount: event.account ?? null,
          intentId: pi.id,
          hasMetadataTripId: Boolean(pi.metadata?.tripId),
          metadataKeys: Object.keys(pi.metadata ?? {}),
        });
        if (pi.metadata?.tripId) {
          await handleTripPaymentSucceeded(pi);
        } else {
          captureMessage(
            "webhook payment_intent.succeeded skipped: no tripId in metadata",
            "warning",
            { eventId: event.id, eventAccount: event.account ?? null, intentId: pi.id },
          );
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        captureMessage("webhook payment_intent.payment_failed entered", "info", {
          eventId: event.id,
          eventAccount: event.account ?? null,
          intentId: pi.id,
          hasMetadataTripId: Boolean(pi.metadata?.tripId),
        });
        if (pi.metadata?.tripId) {
          await handleTripPaymentFailed(pi);
        } else {
          captureMessage(
            "webhook payment_intent.payment_failed skipped: no tripId in metadata",
            "warning",
            { eventId: event.id, eventAccount: event.account ?? null, intentId: pi.id },
          );
        }
        break;
      }
      case "account.updated":
        await handleConnectAccountUpdated(event.data.object);
        break;
      default:
        captureMessage("webhook event type not handled", "info", {
          eventId: event.id,
          eventType: event.type,
        });
    }
  } catch (error) {
    captureError(error, {
      action: "stripeWebhook",
      extra: { eventType: event.type, eventId: event.id },
    });
    // Still 200: the signature verified, so this is our processing bug, not a
    // delivery problem. Retrying the same payload won't fix it, and a 500 would
    // make Stripe hammer us. Sentry has it for follow-up.
  }

  return Response.json({ received: true });
}
