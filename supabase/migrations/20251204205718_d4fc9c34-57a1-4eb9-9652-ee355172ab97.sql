-- Create invite_codes table for trial access
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  credits_granted integer NOT NULL DEFAULT 50,
  max_uses integer DEFAULT 1,
  times_used integer DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Track which users redeemed which codes
CREATE TABLE public.invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id uuid REFERENCES public.invite_codes(id) NOT NULL,
  user_id uuid NOT NULL,
  redeemed_at timestamp with time zone DEFAULT now(),
  UNIQUE(invite_code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Admins can manage invite codes
CREATE POLICY "Admins can manage invite codes"
ON public.invite_codes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Anyone can view valid codes (for redemption check)
CREATE POLICY "Anyone can view invite codes"
ON public.invite_codes FOR SELECT
USING (true);

-- Users can view their own redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.invite_redemptions FOR SELECT
USING (auth.uid() = user_id);

-- Update user_alerts policies to restrict to paid users only
DROP POLICY IF EXISTS "Users can insert their own alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.user_alerts;

-- New policies: only paid users (non-free, non-trial) can use alerts
CREATE POLICY "Paid users can view their own alerts"
ON public.user_alerts FOR SELECT
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND subscription_tier NOT IN ('free', 'trial')
  )
);

CREATE POLICY "Paid users can insert their own alerts"
ON public.user_alerts FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND subscription_tier NOT IN ('free', 'trial')
  )
);

CREATE POLICY "Paid users can update their own alerts"
ON public.user_alerts FOR UPDATE
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND subscription_tier NOT IN ('free', 'trial')
  )
);

CREATE POLICY "Paid users can delete their own alerts"
ON public.user_alerts FOR DELETE
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND subscription_tier NOT IN ('free', 'trial')
  )
);