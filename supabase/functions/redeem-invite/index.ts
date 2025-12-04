import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REDEEM-INVITE] ${step}${detailsStr}`);
};

const TRIAL_CREDITS = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get invite code from request body
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      throw new Error("Invalid invite code");
    }
    logStep("Invite code received", { code: code.toUpperCase() });

    // Check if user already has a paid subscription or has redeemed a code
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier, credits_remaining")
      .eq("id", user.id)
      .single();

    if (profile?.subscription_tier && !["free", "trial"].includes(profile.subscription_tier)) {
      throw new Error("You already have an active subscription");
    }

    // Check if user already redeemed any invite code
    const { data: existingRedemption } = await supabaseAdmin
      .from("invite_redemptions")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingRedemption) {
      throw new Error("You have already redeemed an invite code");
    }

    // Find the invite code
    const { data: inviteCode, error: codeError } = await supabaseAdmin
      .from("invite_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (codeError || !inviteCode) {
      logStep("Invalid code", { code: code.toUpperCase() });
      throw new Error("Invalid invite code");
    }

    // Check if code has uses remaining
    if (inviteCode.max_uses && inviteCode.times_used >= inviteCode.max_uses) {
      throw new Error("This invite code has reached its maximum uses");
    }

    // Check if code is expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      throw new Error("This invite code has expired");
    }

    logStep("Valid invite code found", { codeId: inviteCode.id, creditsGranted: inviteCode.credits_granted });

    // Record the redemption
    const { error: redemptionError } = await supabaseAdmin
      .from("invite_redemptions")
      .insert({
        invite_code_id: inviteCode.id,
        user_id: user.id,
      });

    if (redemptionError) {
      logStep("Redemption insert error", { error: redemptionError.message });
      throw new Error("Failed to redeem invite code");
    }

    // Increment times_used on the invite code
    await supabaseAdmin
      .from("invite_codes")
      .update({ times_used: inviteCode.times_used + 1 })
      .eq("id", inviteCode.id);

    // Update user profile with trial credits
    const creditsToGrant = inviteCode.credits_granted || TRIAL_CREDITS;
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: "trial",
        credits_remaining: creditsToGrant,
      })
      .eq("id", user.id);

    if (profileError) {
      logStep("Profile update error", { error: profileError.message });
      throw new Error("Failed to apply trial credits");
    }

    // Log the credit transaction
    await supabaseAdmin
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: creditsToGrant,
        type: "trial_grant",
        description: `Trial credits from invite code: ${code.toUpperCase()}`,
      });

    logStep("Trial activated successfully", { credits: creditsToGrant });

    return new Response(
      JSON.stringify({
        success: true,
        credits: creditsToGrant,
        message: `Welcome! You've received ${creditsToGrant} trial credits.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
