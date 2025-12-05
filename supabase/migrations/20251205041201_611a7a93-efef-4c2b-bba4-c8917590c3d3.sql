-- Change default credits from 10 to 0
ALTER TABLE public.profiles ALTER COLUMN credits_remaining SET DEFAULT 0;

-- Update handle_new_user function to check for invite code in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_code_value TEXT;
  invite_record RECORD;
  credits_to_grant INTEGER := 0;
BEGIN
  -- Get invite code from user metadata
  invite_code_value := NEW.raw_user_meta_data ->> 'invite_code';
  
  -- If invite code provided, validate and get credits
  IF invite_code_value IS NOT NULL AND invite_code_value != '' THEN
    SELECT * INTO invite_record
    FROM public.invite_codes
    WHERE code = UPPER(invite_code_value)
      AND (max_uses IS NULL OR times_used < max_uses)
      AND (expires_at IS NULL OR expires_at > now());
    
    IF invite_record.id IS NOT NULL THEN
      credits_to_grant := COALESCE(invite_record.credits_granted, 50);
      
      -- Increment times_used on the invite code
      UPDATE public.invite_codes
      SET times_used = times_used + 1
      WHERE id = invite_record.id;
      
      -- Record the redemption
      INSERT INTO public.invite_redemptions (invite_code_id, user_id)
      VALUES (invite_record.id, NEW.id);
    END IF;
  END IF;
  
  -- Create profile with appropriate credits
  INSERT INTO public.profiles (id, email, full_name, credits_remaining, subscription_tier)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name',
    credits_to_grant,
    CASE WHEN credits_to_grant > 0 THEN 'trial' ELSE 'free' END
  );
  
  -- Log credit transaction if credits granted
  IF credits_to_grant > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, credits_to_grant, 'trial_grant', 'Trial credits from invite code: ' || UPPER(invite_code_value));
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;