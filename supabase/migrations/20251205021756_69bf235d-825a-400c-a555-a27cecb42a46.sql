-- Add new columns for enhanced VC intelligence filtering

-- Geography fields
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS primary_market text;

-- Business model fields
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS business_model text; -- B2B, B2C, B2B2C
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS company_type text; -- SaaS, Marketplace, Fintech, etc.
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS target_customer text; -- SMB, Mid-market, Enterprise, Consumer

-- Team & signal fields
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS founder_type text; -- solo, team
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS is_serial_founder boolean DEFAULT false;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS accelerator text; -- YC, Techstars, etc.
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS has_faang_alumni boolean DEFAULT false;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS has_prior_exit boolean DEFAULT false;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS prior_exit_count integer DEFAULT 0;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS investor_quality text; -- Tier 1, Tier 2, Tier 3, Angels only

-- Capital efficiency & round dynamics
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS total_raised bigint;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS current_round_size bigint;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS arr_raised_ratio numeric(5,2); -- ARR / total equity raised
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS runway_band text; -- <6 months, 6-12 months, 12-18 months, 18+ months
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS burn_multiple_band text; -- <1x, 1-2x, 2-3x, >3x
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS round_status text; -- raising, recently_closed, exploring
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS has_lead boolean;