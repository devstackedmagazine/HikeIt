import type Stripe from "stripe";

import { env } from "@/config/env";
import { captureError } from "@/lib/sentry";
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
      case "payment_intent.succeeded":
        if (event.data.object.metadata?.tripId) {
          await handleTripPaymentSucceeded(event.data.object);
        }
        break;
      case "payment_intent.payment_failed":
        if (event.data.object.metadata?.tripId) {
          await handleTripPaymentFailed(event.data.object);
        }
        break;
      case "account.updated":
        await handleConnectAccountUpdated(event.data.object);
        break;
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
