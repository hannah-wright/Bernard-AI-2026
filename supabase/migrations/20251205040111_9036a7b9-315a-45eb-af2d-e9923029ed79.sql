-- Update admin_update_profile to allow service role calls (for edge functions)
CREATE OR REPLACE FUNCTION public.admin_update_profile(target_user_id uuid, new_credits integer DEFAULT NULL::integer, new_tier text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow if admin OR if auth.uid() is null (service role call from edge functions)
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update credits and subscription tier';
  END IF;
  
  UPDATE profiles
  SET 
    credits_remaining = COALESCE(new_credits, credits_remaining),
    subscription_tier = COALESCE(new_tier, subscription_tier),
    updated_at = now()
  WHERE id = target_user_id;
END;
$function$;

-- Fix your account: Set Starter plan (500 credits, prod_TXoPZKDe4a3oSG)
UPDATE profiles 
SET credits_remaining = 500, subscription_tier = 'prod_TXoPZKDe4a3oSG', updated_at = now()
WHERE id = '85df260b-bb64-4591-90b9-dc88d0300a94';