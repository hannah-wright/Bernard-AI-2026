export type RoundType = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C' | 'Series D+';

export type Sector = 
  | 'AI/ML' 
  | 'Fintech' 
  | 'Healthcare' 
  | 'SaaS' 
  | 'E-commerce' 
  | 'Biotech' 
  | 'Climate Tech'
  | 'Enterprise'
  | 'Consumer';

export type ConfidenceLevel = 'verified' | 'high' | 'medium' | 'low';

export type Region = 'US' | 'EU' | 'LATAM' | 'APAC' | 'MEA' | 'Remote/Global';
export type BusinessModel = 'B2B' | 'B2C' | 'B2B2C';
export type CompanyType = 'SaaS' | 'Marketplace' | 'Fintech' | 'Hardware' | 'Services' | 'Other';
export type TargetCustomer = 'SMB' | 'Mid-market' | 'Enterprise' | 'Consumer' | 'All';
export type FounderType = 'Solo' | 'Team';
export type Accelerator = 'YC' | 'Techstars' | 'a16z' | '500 Startups' | 'Other Tier-1' | 'None';
export type InvestorQuality = 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Angels only';
export type RunwayBand = '<6 months' | '6-12 months' | '12-18 months' | '18+ months';
export type BurnMultipleBand = '<1x' | '1-2x' | '2-3x' | '>3x';
export type RoundStatus = 'Raising' | 'Recently Closed' | 'Exploring';

export interface DataSource {
  name: string;
  confidence: ConfidenceLevel;
  url?: string;
}

// VC Intelligence Types
export interface FounderInfo {
  name: string;
  prior_startups?: { name: string; outcome?: string; exit_value?: number }[];
  notable_employers?: string[];
  education?: string[];
  patents?: string[];
  publications?: string[];
  years_in_industry?: number;
  linkedin_url?: string;
}

export interface FounderBackground {
  founders?: FounderInfo[];
  advisor_network?: string[];
}

export interface TeamComposition {
  total_employees?: number;
  engineering_count?: number;
  sales_count?: number;
  product_count?: number;
  ops_count?: number;
  key_hires?: { role: string; name: string; joined_date?: string }[];
  recent_departures?: string[];
  has_cto?: boolean;
  has_vp_sales?: boolean;
  has_ciso?: boolean;
}

export interface TractionMetrics {
  paying_customers?: number;
  enterprise_logos?: string[];
  smb_count?: number;
  mid_market_count?: number;
  enterprise_count?: number;
  top_5_customer_concentration_pct?: number;
  sales_cycle_days?: number;
  arr?: number;
  mrr?: number;
  arr_growth_rate?: number;
  net_revenue_retention_pct?: number;
  gross_churn_pct?: number;
  expansion_revenue_pct?: number;
  mau?: number;
  wau?: number;
  activation_rate_pct?: number;
}

export interface UnitEconomics {
  gross_margin_pct?: number;
  cac?: number;
  ltv?: number;
  ltv_cac_ratio?: number;
  payback_months?: number;
  burn_multiple?: number;
  runway_months?: number;
  revenue_per_employee?: number;
  magic_number?: number;
}

export interface ProductInfo {
  stage?: 'MVP' | 'Beta' | 'GA' | 'Multi-product';
  deployment_model?: 'SaaS' | 'On-prem' | 'Hybrid' | 'API';
  release_frequency?: string;
  last_major_release?: string;
  roadmap_highlights?: string[];
  tech_stack?: string[];
  ai_native?: boolean;
  open_source_components?: string[];
}

export interface DefensibilitySignals {
  proprietary_data?: boolean;
  network_effects?: boolean;
  integrations_ecosystem?: string[];
  switching_cost_level?: 'Low' | 'Medium' | 'High';
  regulatory_approvals?: string[];
  patents_filed?: number;
  patents_granted?: number;
  certifications?: string[];
}

export interface MarketContext {
  tam_usd?: number;
  sam_usd?: number;
  som_usd?: number;
  market_growth_rate_pct?: number;
  category_position?: 'Category-creator' | 'Fast-follower' | 'Challenger';
  comparable_public_companies?: string[];
  recent_ma_comps?: string[];
  regulatory_tailwinds?: string[];
  regulatory_headwinds?: string[];
  emerging_tech_adjacency?: string[];
}

export interface CompetitiveLandscape {
  direct_competitors?: { name: string; stage?: string; funding_total?: number; overlap_pct?: number }[];
  incumbent_threats?: string[];
  customer_logo_overlap?: string[];
  competitive_advantages?: string[];
}

export interface SocialProof {
  cap_table_quality?: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Angels only';
  notable_investors?: string[];
  repeat_backers?: string[];
  notable_advisors?: string[];
  press_mentions_90d?: number;
  press_sentiment?: 'Positive' | 'Neutral' | 'Negative';
  conference_presence?: string[];
  awards?: string[];
  github_stars?: number;
  community_size?: number;
}

export interface RiskFlags {
  lawsuits?: string[];
  regulatory_actions?: string[];
  data_breaches?: string[];
  founder_controversies?: string[];
  leadership_changes?: string[];
  key_person_dependency?: boolean;
  single_customer_dependency?: boolean;
  geographic_concentration?: boolean;
}

export interface Startup {
  id: string;
  name: string;
  logo?: string;
  description: string;
  eli5: string;
  website: string;
  sector: Sector[];
  location: {
    city: string;
    state?: string;
    country: string;
  };
  fundingRound: {
    type: RoundType;
    amount: number;
    date: string;
    leadInvestors: string[];
  };
  metrics: {
    estimatedRevenue?: string;
    estimatedSize?: string;
    buzzScore: number;
  };
  dataSources: DataSource[];
  isFavorite?: boolean;
  notes?: string;
  
  // Geography fields
  region?: Region;
  primaryMarket?: Region;
  
  // Business model fields
  businessModel?: BusinessModel;
  companyType?: CompanyType;
  targetCustomer?: TargetCustomer;
  
  // Team & signal fields
  founderType?: FounderType;
  isSerialFounder?: boolean;
  accelerator?: Accelerator;
  hasFaangAlumni?: boolean;
  hasPriorExit?: boolean;
  priorExitCount?: number;
  investorQuality?: InvestorQuality;
  
  // Capital efficiency & round dynamics
  totalRaised?: number;
  currentRoundSize?: number;
  arrRaisedRatio?: number;
  runwayBand?: RunwayBand;
  burnMultipleBand?: BurnMultipleBand;
  roundStatus?: RoundStatus;
  hasLead?: boolean;
  
  // VC Intelligence Fields
  founderBackground?: FounderBackground;
  teamComposition?: TeamComposition;
  teamQualityScore?: number;
  tractionMetrics?: TractionMetrics;
  unitEconomics?: UnitEconomics;
  productInfo?: ProductInfo;
  defensibilitySignals?: DefensibilitySignals;
  marketContext?: MarketContext;
  competitiveLandscape?: CompetitiveLandscape;
  socialProof?: SocialProof;
  riskFlags?: RiskFlags;
  unicornProbability?: number;
  productMarketFitScore?: number;
  investmentReadinessScore?: number;
}

export interface FilterState {
  dateRange: string;
  fundingMin?: number;
  fundingMax?: number;
  roundTypes: RoundType[];
  sectors: Sector[];
  location: string;
  // Geography
  regions: Region[];
  primaryMarkets: Region[];
  // Business model
  businessModels: BusinessModel[];
  companyTypes: CompanyType[];
  targetCustomers: TargetCustomer[];
  // Team & signal
  founderTypes: FounderType[];
  isSerialFounder?: boolean;
  accelerators: Accelerator[];
  hasFaangAlumni?: boolean;
  hasPriorExit?: boolean;
  investorQualities: InvestorQuality[];
  // Capital efficiency
  totalRaisedMin?: number;
  totalRaisedMax?: number;
  runwayBands: RunwayBand[];
  burnMultipleBands: BurnMultipleBand[];
  roundStatuses: RoundStatus[];
  hasLead?: boolean;
}
