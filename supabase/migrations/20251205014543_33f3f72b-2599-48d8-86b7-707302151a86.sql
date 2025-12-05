-- Add comprehensive VC intelligence fields to startups table
-- Team Quality & Founder Signals
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS founder_background JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS team_composition JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS team_quality_score INTEGER DEFAULT NULL;

-- Traction, Retention & Unit Economics
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS traction_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS unit_economics JSONB DEFAULT '{}'::jsonb;

-- Product, Moat & Technology
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS product_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS defensibility_signals JSONB DEFAULT '{}'::jsonb;

-- Market, Momentum & Timing
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS market_context JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS competitive_landscape JSONB DEFAULT '{}'::jsonb;

-- Social Proof & Qualitative Signals
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS social_proof JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS risk_flags JSONB DEFAULT '{}'::jsonb;

-- AI-Generated Scores (0-100)
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS unicorn_probability INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS product_market_fit_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS investment_readiness_score INTEGER DEFAULT NULL;

-- Add comments explaining JSONB structure for each field
COMMENT ON COLUMN public.startups.founder_background IS 'JSONB: {founders: [{name, prior_startups: [{name, outcome, exit_value}], notable_employers: [], education: [], patents: [], publications: [], years_in_industry, linkedin_url}], advisor_network: []}';

COMMENT ON COLUMN public.startups.team_composition IS 'JSONB: {total_employees, engineering_count, sales_count, product_count, ops_count, key_hires: [{role, name, joined_date}], recent_departures: [], has_cto: bool, has_vp_sales: bool, has_ciso: bool}';

COMMENT ON COLUMN public.startups.traction_metrics IS 'JSONB: {paying_customers, enterprise_logos: [], smb_count, mid_market_count, enterprise_count, top_5_customer_concentration_pct, sales_cycle_days, arr, mrr, arr_growth_rate, net_revenue_retention_pct, gross_churn_pct, expansion_revenue_pct, mau, wau, activation_rate_pct}';

COMMENT ON COLUMN public.startups.unit_economics IS 'JSONB: {gross_margin_pct, cac, ltv, ltv_cac_ratio, payback_months, burn_multiple, runway_months, revenue_per_employee, magic_number}';

COMMENT ON COLUMN public.startups.product_info IS 'JSONB: {stage: "MVP"|"Beta"|"GA"|"Multi-product", deployment_model: "SaaS"|"On-prem"|"Hybrid"|"API", release_frequency, last_major_release, roadmap_highlights: [], tech_stack: [], ai_native: bool, open_source_components: []}';

COMMENT ON COLUMN public.startups.defensibility_signals IS 'JSONB: {proprietary_data: bool, network_effects: bool, integrations_ecosystem: [], switching_cost_level: "Low"|"Medium"|"High", regulatory_approvals: [], patents_filed: int, patents_granted: int, certifications: ["SOC2", "ISO27001", "HIPAA", etc]}';

COMMENT ON COLUMN public.startups.market_context IS 'JSONB: {tam_usd, sam_usd, som_usd, market_growth_rate_pct, category_position: "Category-creator"|"Fast-follower"|"Challenger", comparable_public_companies: [], recent_ma_comps: [], regulatory_tailwinds: [], regulatory_headwinds: [], emerging_tech_adjacency: []}';

COMMENT ON COLUMN public.startups.competitive_landscape IS 'JSONB: {direct_competitors: [{name, stage, funding_total, overlap_pct}], incumbent_threats: [], customer_logo_overlap: [], competitive_advantages: []}';

COMMENT ON COLUMN public.startups.social_proof IS 'JSONB: {cap_table_quality: "Tier 1"|"Tier 2"|"Tier 3"|"Angels only", notable_investors: [], repeat_backers: [], notable_advisors: [], press_mentions_90d: int, press_sentiment: "Positive"|"Neutral"|"Negative", conference_presence: [], awards: [], github_stars: int, community_size: int}';

COMMENT ON COLUMN public.startups.risk_flags IS 'JSONB: {lawsuits: [], regulatory_actions: [], data_breaches: [], founder_controversies: [], leadership_changes: [], key_person_dependency: bool, single_customer_dependency: bool, geographic_concentration: bool}';

COMMENT ON COLUMN public.startups.unicorn_probability IS 'AI-generated score (0-100) predicting likelihood of $1B+ valuation';
COMMENT ON COLUMN public.startups.team_quality_score IS 'AI-generated score (0-100) based on founder background, team composition, and founder-market fit';
COMMENT ON COLUMN public.startups.product_market_fit_score IS 'AI-generated score (0-100) based on traction, retention, and unit economics';
COMMENT ON COLUMN public.startups.investment_readiness_score IS 'AI-generated score (0-100) assessing overall investability for current round';