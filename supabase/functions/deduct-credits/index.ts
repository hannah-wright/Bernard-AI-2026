import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEDUCT-CREDITS] ${step}${detailsStr}`);
};

// Credit costs for different actions
const ACTION_COSTS: Record<string, number> = {
  'view_startup_details': 1,
  'export_csv': 5,
  'api_call': 1,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { action, description, resourceId } = await req.json();
    if (!action) throw new Error("action is required");

    const cost = ACTION_COSTS[action];
    if (cost === undefined) throw new Error(`Unknown action: ${action}`);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Use the RPC function to deduct credits (bypasses the secure_profile_update trigger)
    const actionDescription = description || `${action}${resourceId ? ` (${resourceId})` : ''}`;
    
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('deduct_user_credits', {
        target_user_id: user.id,
        amount: cost,
        action_description: actionDescription
      });

    if (rpcError) {
      logStep("RPC error", { error: rpcError.message });
      throw new Error(`Credit deduction failed: ${rpcError.message}`);
    }

    const result = rpcResult?.[0];
    
    if (!result) {
      throw new Error("No result from credit deduction");
    }

    if (!result.success) {
      logStep("Deduction failed", { error: result.error_message });
      
      if (result.error_message === 'Insufficient credits') {
        return new Response(JSON.stringify({
          success: false,
          error: "insufficient_credits",
          creditsRequired: cost,
          creditsRemaining: result.new_balance,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 402,
        });
      }
      
      throw new Error(result.error_message || "Credit deduction failed");
    }

    logStep("Credits deducted successfully", { cost, newCredits: result.new_balance });

    return new Response(JSON.stringify({
      success: true,
      creditsDeducted: cost,
      creditsRemaining: result.new_balance,
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
