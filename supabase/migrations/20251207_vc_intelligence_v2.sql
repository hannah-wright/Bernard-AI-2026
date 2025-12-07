-- VC Intelligence V2: Enhanced Founder & Team Signals
-- This migration adds comprehensive VC intelligence features

-- 1. Expand funding_rounds table to include all investors
ALTER TABLE public.funding_rounds 
ADD COLUMN IF NOT EXISTS all_investors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS valuation BIGINT,
ADD COLUMN IF NOT EXISTS valuation_type TEXT; -- 'pre-money' or 'post-money'

-- 2. Add expanded prior exit details to startups
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS prior_exits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS has_prior_ipo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prior_ipo_details JSONB DEFAULT NULL;

COMMENT ON COLUMN public.startups.prior_exits IS 'JSONB array: [{company_name, exit_year, exit_type: "acquisition"|"ipo"|"other", acquirer?: string, exit_amount?: number, founder_role?: string}]';
COMMENT ON COLUMN public.startups.prior_ipo_details IS 'JSONB: {company_name, ipo_year, ticker_symbol?, market_cap_at_ipo?, founder_role?}';

-- 3. Add hiring velocity and headcount growth fields
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS headcount_current INTEGER,
ADD COLUMN IF NOT EXISTS headcount_6mo_ago INTEGER,
ADD COLUMN IF NOT EXISTS headcount_12mo_ago INTEGER,
ADD COLUMN IF NOT EXISTS engineering_headcount_current INTEGER,
ADD COLUMN IF NOT EXISTS engineering_headcount_6mo_ago INTEGER,
ADD COLUMN IF NOT EXISTS hiring_velocity_score INTEGER; -- 0-100, based on growth rate

COMMENT ON COLUMN public.startups.hiring_velocity_score IS 'Score 0-100 based on headcount growth rate. >80 = strong signal. Engineering growth weighted heavily.';

-- 4. Add founding team signal profile (composite score)
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS founding_team_signal_score INTEGER, -- 0-100 composite score
ADD COLUMN IF NOT EXISTS team_structure_type TEXT, -- 'technical-ceo', 'commercial-ceo-technical-cto', etc.
ADD COLUMN IF NOT EXISTS cofounders_worked_together_before BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_technical_cofounder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_commercial_cofounder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS combined_years_experience INTEGER,
ADD COLUMN IF NOT EXISTS network_strength_score INTEGER; -- LinkedIn connections, intros, etc.

COMMENT ON COLUMN public.startups.founding_team_signal_score IS 'Composite 0-100 score: prior_exit(+30), faang_senior(+20), strong_network(+15), cofounders_worked_together(+15), technical+commercial_duo(+10), years_experience(+10)';
COMMENT ON COLUMN public.startups.team_structure_type IS 'Team archetype: "solo-technical", "solo-commercial", "technical-ceo-commercial-coo", "commercial-ceo-technical-cto", "balanced-cofounders", "technical-heavy", "commercial-heavy"';

-- 5. Create VC activity tracking table for competitor alerts
CREATE TABLE IF NOT EXISTS public.vc_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vc_firm TEXT NOT NULL,
  vc_tier TEXT, -- 'tier1', 'tier2', 'tier3', 'angel'
  startup_name TEXT NOT NULL,
  startup_id UUID REFERENCES public.startups(id) ON DELETE SET NULL,
  deal_type TEXT NOT NULL, -- 'lead', 'co-lead', 'follow-on', 'angel'
  round_type TEXT,
  amount BIGINT,
  deal_date DATE NOT NULL,
  sector TEXT[],
  geography TEXT,
  source_url TEXT,
  source_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for efficient VC deal queries
CREATE INDEX IF NOT EXISTS idx_vc_deals_firm ON public.vc_deals(vc_firm);
CREATE INDEX IF NOT EXISTS idx_vc_deals_date ON public.vc_deals(deal_date DESC);
CREATE INDEX IF NOT EXISTS idx_vc_deals_sector ON public.vc_deals USING GIN(sector);

-- 6. Create angel investor tracking
CREATE TABLE IF NOT EXISTS public.angel_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_prominent BOOLEAN DEFAULT false,
  notable_investments TEXT[],
  sectors TEXT[],
  typical_check_size_min BIGINT,
  typical_check_size_max BIGINT,
  twitter_handle TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Track which angels backed which startups
CREATE TABLE IF NOT EXISTS public.startup_angel_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  angel_id UUID REFERENCES public.angel_investors(id) ON DELETE CASCADE,
  round_type TEXT,
  investment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(startup_id, angel_id)
);

-- 8. Add prominent VC firms reference table
CREATE TABLE IF NOT EXISTS public.vc_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL, -- 'tier1', 'tier2', 'tier3'
  aum_usd BIGINT, -- Assets under management
  notable_exits TEXT[],
  focus_sectors TEXT[],
  focus_stages TEXT[], -- 'pre-seed', 'seed', 'series-a', etc.
  headquarters TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed prominent VCs
INSERT INTO public.vc_firms (name, tier, focus_sectors, focus_stages) VALUES
  ('Sequoia Capital', 'tier1', ARRAY['AI/ML', 'Enterprise', 'Consumer', 'Fintech'], ARRAY['seed', 'series-a', 'series-b', 'growth']),
  ('Andreessen Horowitz', 'tier1', ARRAY['AI/ML', 'Crypto', 'Enterprise', 'Consumer', 'Fintech'], ARRAY['seed', 'series-a', 'series-b', 'growth']),
  ('Accel', 'tier1', ARRAY['SaaS', 'Enterprise', 'Consumer'], ARRAY['seed', 'series-a', 'series-b']),
  ('Benchmark', 'tier1', ARRAY['Consumer', 'Enterprise', 'SaaS'], ARRAY['seed', 'series-a']),
  ('Founders Fund', 'tier1', ARRAY['AI/ML', 'Deep Tech', 'Fintech'], ARRAY['seed', 'series-a', 'series-b', 'growth']),
  ('Lightspeed', 'tier1', ARRAY['Enterprise', 'Consumer', 'Fintech'], ARRAY['seed', 'series-a', 'series-b']),
  ('Index Ventures', 'tier1', ARRAY['SaaS', 'Fintech', 'Consumer'], ARRAY['seed', 'series-a', 'series-b']),
  ('Greylock', 'tier1', ARRAY['Enterprise', 'Consumer', 'AI/ML'], ARRAY['seed', 'series-a', 'series-b']),
  ('General Catalyst', 'tier1', ARRAY['Enterprise', 'Consumer', 'Healthcare'], ARRAY['seed', 'series-a', 'series-b', 'growth']),
  ('Bessemer Venture Partners', 'tier1', ARRAY['SaaS', 'Cloud', 'Consumer'], ARRAY['seed', 'series-a', 'series-b', 'growth']),
  ('Kleiner Perkins', 'tier1', ARRAY['Climate Tech', 'Healthcare', 'Enterprise'], ARRAY['seed', 'series-a', 'series-b']),
  ('NEA', 'tier1', ARRAY['Healthcare', 'Enterprise', 'Consumer'], ARRAY['series-a', 'series-b', 'growth']),
  ('GGV Capital', 'tier1', ARRAY['Enterprise', 'Consumer'], ARRAY['seed', 'series-a', 'series-b']),
  ('Insight Partners', 'tier1', ARRAY['SaaS', 'Enterprise'], ARRAY['series-b', 'growth']),
  ('Tiger Global', 'tier1', ARRAY['Consumer', 'Enterprise', 'Fintech'], ARRAY['series-b', 'growth']),
  ('Y Combinator', 'tier1', ARRAY['AI/ML', 'SaaS', 'Consumer', 'Fintech', 'Healthcare'], ARRAY['pre-seed', 'seed']),
  ('First Round Capital', 'tier2', ARRAY['SaaS', 'Consumer'], ARRAY['pre-seed', 'seed']),
  ('Initialized Capital', 'tier2', ARRAY['SaaS', 'Consumer', 'Fintech'], ARRAY['pre-seed', 'seed']),
  ('Craft Ventures', 'tier2', ARRAY['SaaS', 'Fintech'], ARRAY['seed', 'series-a']),
  ('Redpoint Ventures', 'tier2', ARRAY['Enterprise', 'Consumer'], ARRAY['seed', 'series-a', 'series-b'])
ON CONFLICT (name) DO NOTHING;

-- 9. Enable RLS on new tables
ALTER TABLE public.vc_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.angel_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_angel_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_firms ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read VC intelligence data
CREATE POLICY "Allow authenticated read vc_deals" ON public.vc_deals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read angel_investors" ON public.angel_investors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read startup_angel_investments" ON public.startup_angel_investments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read vc_firms" ON public.vc_firms
  FOR SELECT TO authenticated USING (true);

-- Allow service role full access for enrichment
CREATE POLICY "Allow service role all vc_deals" ON public.vc_deals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role all angel_investors" ON public.angel_investors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role all startup_angel_investments" ON public.startup_angel_investments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role all vc_firms" ON public.vc_firms
  FOR ALL TO service_role USING (true) WITH CHECK (true);

