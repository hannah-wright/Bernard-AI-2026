import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const { action, reason, feedback } = await req.json();
    // action: 'cancel' | 'pause' | 'resume'
    
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
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No subscription found");
    }

    const subscription = subscriptions.data[0];
    logStep("Found subscription", { subscriptionId: subscription.id, action });

    let result;

    if (action === 'cancel') {
      // Cancel at end of period (not immediately)
      result = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason || 'not_specified',
          cancellation_feedback: feedback || '',
          cancelled_at: new Date().toISOString(),
        },
      });
      logStep("Subscription set to cancel at period end", { reason });
    } else if (action === 'pause') {
      // Pause collection (subscription remains but no charges)
      result = await stripe.subscriptions.update(subscription.id, {
        pause_collection: {
          behavior: 'void',
        },
        metadata: {
          pause_reason: reason || 'not_specified',
          paused_at: new Date().toISOString(),
        },
      });
      logStep("Subscription paused");
    } else if (action === 'resume') {
      // Resume paused subscription
      result = await stripe.subscriptions.update(subscription.id, {
        pause_collection: null as unknown as undefined,
        cancel_at_period_end: false,
      });
      logStep("Subscription resumed");
    } else if (action === 'reactivate') {
      // Reactivate cancelled subscription (before period end)
      result = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });
      logStep("Subscription reactivated");
    } else {
      throw new Error("Invalid action. Use 'cancel', 'pause', 'resume', or 'reactivate'");
    }

    return new Response(JSON.stringify({
      success: true,
      subscription: {
        id: result.id,
        status: result.status,
        cancelAtPeriodEnd: result.cancel_at_period_end,
        pauseCollection: result.pause_collection,
        currentPeriodEnd: new Date(result.current_period_end * 1000).toISOString(),
      },
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
