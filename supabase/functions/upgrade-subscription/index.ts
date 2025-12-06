import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPGRADE-SUBSCRIPTION] ${step}${detailsStr}`);
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { newPriceId } = await req.json();
    if (!newPriceId) throw new Error("newPriceId is required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found");
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }

    const subscription = subscriptions.data[0];
    const subscriptionItemId = subscription.items.data[0].id;
    const oldProductId = subscription.items.data[0].price.product as string;
    logStep("Found subscription", { subscriptionId: subscription.id, itemId: subscriptionItemId, oldProductId });

    // Update subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
      // Remove cancel at period end if it was set
      cancel_at_period_end: false,
    });

    logStep("Subscription updated", {
      newPriceId,
      status: updatedSubscription.status,
    });

    // Get the new product ID for updating the profile
    const newProductId = updatedSubscription.items.data[0].price.product as string;

    // Get current profile credits
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .maybeSingle();

    const currentCredits = profile?.credits_remaining || 0;
    const oldPlanCredits = PLAN_CREDITS[oldProductId] || 0;
    const newPlanCredits = PLAN_CREDITS[newProductId] || 0;

    // Calculate credit adjustment: add the difference between plans
    // This gives the user the additional credits from the upgrade immediately
    let newCredits = currentCredits;
    if (newPlanCredits > oldPlanCredits) {
      const creditDifference = newPlanCredits - oldPlanCredits;
      newCredits = currentCredits + creditDifference;
      logStep("Adding upgrade credits", { currentCredits, creditDifference, newCredits });
    }

    // Use admin_update_profile to bypass security trigger
    const { error: updateError } = await supabaseClient.rpc('admin_update_profile', {
      target_user_id: user.id,
      new_credits: newCredits,
      new_tier: newProductId,
    });

    if (updateError) {
      logStep("ERROR updating profile", { error: updateError.message });
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    logStep("Profile updated", { newProductId, newCredits });

    // Log credit transaction if credits were added
    if (newCredits > currentCredits) {
      await supabaseClient.from("credit_transactions").insert({
        user_id: user.id,
        amount: newCredits - currentCredits,
        type: "plan_upgrade",
        description: `Plan upgrade - ${newCredits - currentCredits} credits added`,
        stripe_subscription_id: subscription.id,
      });
    }

    // Safely get current period end
    let currentPeriodEnd: string | null = null;
    if (updatedSubscription.current_period_end) {
      try {
        currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000).toISOString();
      } catch (e) {
        logStep("Warning: Could not parse current_period_end", { value: updatedSubscription.current_period_end });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        productId: newProductId,
        priceId: newPriceId,
        currentPeriodEnd,
      },
      creditsAdded: newCredits - currentCredits,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
