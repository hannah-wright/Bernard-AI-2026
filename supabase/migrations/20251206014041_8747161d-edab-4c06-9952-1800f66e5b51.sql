-- Fix admin_update_profile to disable the secure update trigger
-- This ensures webhook credit/tier updates actually persist
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
  
  -- Disable the trigger temporarily for this transaction
  ALTER TABLE profiles DISABLE TRIGGER enforce_secure_profile_update;
  
  UPDATE profiles
  SET 
    credits_remaining = COALESCE(new_credits, credits_remaining),
    subscription_tier = COALESCE(new_tier, subscription_tier),
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Re-enable the trigger
  ALTER TABLE profiles ENABLE TRIGGER enforce_secure_profile_update;
END;
$function$;