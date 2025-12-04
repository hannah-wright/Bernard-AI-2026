import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Credit amounts per plan (monthly)
const PLAN_CREDITS: Record<string, number> = {
  'prod_TXoPZKDe4a3oSG': 500,   // Starter Monthly
  'prod_TXoPssn5zCmlc5': 500,   // Starter Annual
  'prod_TXoPYwpa9g662R': 1000,  // Growth Monthly
  'prod_TXoPBxijSeRR6U': 1000,  // Growth Annual
  'prod_TXoPCC5z4kbhda': 1800,  // Scale Monthly
  'prod_TXoQm30KS0qUD7': 1800,  // Scale Annual
};

// Credit pack amounts
const CREDIT_PACKS: Record<string, number> = {
  'prod_TXoQJTtrJbmR7W': 100,   // 100 Credit Pack
  'prod_TXoQVlFqdFX8dd': 250,   // 250 Credit Pack
  'prod_TXoQFuxAlRQXYa': 500,   // 500 Credit Pack
};

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR: No signature");
      return new Response("No signature", { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR: No webhook secret configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      logStep("ERROR: Signature verification failed", { error: String(err) });
      return new Response(`Webhook signature verification failed: ${err}`, { status: 400 });
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { 
          mode: session.mode, 
          customerId: session.customer,
          clientReferenceId: session.client_reference_id 
        });

        // Handle one-time credit purchases
        if (session.mode === "payment") {
          const metadata = session.metadata;
          if (metadata?.type === "credit_purchase" && metadata?.credits) {
            const creditsToAdd = parseInt(metadata.credits, 10);
            const userId = session.client_reference_id;

            if (userId && creditsToAdd > 0) {
              // Get current credits
              const { data: profile } = await supabase
                .from("profiles")
                .select("credits_remaining")
                .eq("id", userId)
                .maybeSingle();

              const currentCredits = profile?.credits_remaining || 0;
              const newCredits = currentCredits + creditsToAdd;

              // Update credits
              await supabase
                .from("profiles")
                .update({ credits_remaining: newCredits })
                .eq("id", userId);

              // Log transaction
              await supabase.from("credit_transactions").insert({
                user_id: userId,
                amount: creditsToAdd,
                type: "purchase",
                description: `Purchased ${creditsToAdd} credits`,
                stripe_payment_id: session.payment_intent as string,
              });

              logStep("Credits added for purchase", { userId, creditsToAdd, newCredits });
            }
          }
        }

        // Handle subscription creation
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const productId = subscription.items.data[0]?.price.product as string;
          const userId = session.client_reference_id;
          const creditsToAdd = PLAN_CREDITS[productId] || 0;

          if (userId && creditsToAdd > 0) {
            // Set credits for new subscription
            await supabase
              .from("profiles")
              .update({ 
                credits_remaining: creditsToAdd,
                subscription_tier: productId 
              })
              .eq("id", userId);

            // Log transaction
            await supabase.from("credit_transactions").insert({
              user_id: userId,
              amount: creditsToAdd,
              type: "subscription_start",
              description: `Subscription started - ${creditsToAdd} credits`,
              stripe_subscription_id: subscription.id,
            });

            logStep("Credits set for new subscription", { userId, productId, creditsToAdd });
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Only handle subscription renewals (not initial payments)
        if (invoice.billing_reason === "subscription_cycle" && invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const productId = subscription.items.data[0]?.price.product as string;
          const creditsToAdd = PLAN_CREDITS[productId] || 0;

          // Get user by customer email
          const customerEmail = invoice.customer_email;
          if (customerEmail && creditsToAdd > 0) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, credits_remaining")
              .eq("email", customerEmail)
              .maybeSingle();

            if (profile) {
              // Add credits (could also reset - business decision)
              // Here we're adding to existing to not lose unused credits
              const newCredits = (profile.credits_remaining || 0) + creditsToAdd;

              await supabase
                .from("profiles")
                .update({ credits_remaining: newCredits })
                .eq("id", profile.id);

              // Log transaction
              await supabase.from("credit_transactions").insert({
                user_id: profile.id,
                amount: creditsToAdd,
                type: "subscription_renewal",
                description: `Monthly renewal - ${creditsToAdd} credits added`,
                stripe_subscription_id: subscription.id,
              });

              logStep("Credits added for renewal", { 
                userId: profile.id, 
                productId, 
                creditsToAdd,
                newCredits 
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription>;
        
        // Check if plan changed (upgrade/downgrade)
        if (previousAttributes?.items) {
          const newProductId = subscription.items.data[0]?.price.product as string;
          const customerEmail = subscription.metadata?.email || 
            (await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer).email;

          if (customerEmail) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", customerEmail)
              .maybeSingle();

            if (profile) {
              await supabase
                .from("profiles")
                .update({ subscription_tier: newProductId })
                .eq("id", profile.id);

              logStep("Subscription tier updated", { userId: profile.id, newProductId });
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerEmail = (await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer).email;

        if (customerEmail) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle();

          if (profile) {
            // Reset to free tier
            await supabase
              .from("profiles")
              .update({ 
                subscription_tier: 'free',
                // Keep remaining credits - they paid for them
              })
              .eq("id", profile.id);

            // Log transaction
            await supabase.from("credit_transactions").insert({
              user_id: profile.id,
              amount: 0,
              type: "subscription_cancelled",
              description: "Subscription cancelled",
              stripe_subscription_id: subscription.id,
            });

            logStep("Subscription cancelled", { userId: profile.id });
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
