export type RoundType = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C' | 'Series D+' | 'Bootstrapped';

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
// Neutral, data-based investor track record labels
export type InvestorTrackRecord = 'Unicorn-backers' | 'Multi-exit fund' | 'Established fund' | 'Angel/Seed-focus';
// Legacy alias for backwards compatibility with database
export type InvestorQuality = InvestorTrackRecord;
export type RunwayBand = '<6 months' | '6-12 months' | '12-18 months' | '18+ months';
export type BurnMultipleBand = '<1x' | '1-2x' | '2-3x' | '>3x';
export type RoundStatus = 'Raising' | 'Recently Closed' | 'Exploring';

export interface DataSource {
  name: string;
  confidence: ConfidenceLevel;
  url?: string;
}

// VC Intelligence Types

// Enhanced prior exit details
export interface PriorExit {
  company_name: string;
  exit_year?: number;
  exit_type: 'acquisition' | 'ipo' | 'other';
  acquirer?: string;
  exit_amount?: number;
  founder_role?: string;
}

// IPO details for founders with prior IPO experience
export interface PriorIPODetails {
  company_name: string;
  ipo_year?: number;
  ticker_symbol?: string;
  market_cap_at_ipo?: number;
  founder_role?: string;
}

export interface FounderInfo {
  name: string;
  role?: string; // 'CEO', 'CTO', 'COO', etc.
  prior_startups?: { name: string; outcome?: string; exit_value?: number }[];
  prior_exits?: PriorExit[]; // Detailed exit information
  notable_employers?: string[];
  education?: string[];
  patents?: string[];
  publications?: string[];
  years_in_industry?: number;
  linkedin_url?: string;
  is_technical?: boolean;
  is_commercial?: boolean;
  senior_faang_role?: boolean; // Director+ level at FAANG
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

// Hiring velocity and headcount growth
export interface HeadcountGrowth {
  current: number;
  sixMonthsAgo?: number;
  twelveMonthsAgo?: number;
  engineeringCurrent?: number;
  engineeringSixMonthsAgo?: number;
  growthRate6Mo?: number; // percentage
  growthRate12Mo?: number;
  engineeringGrowthRate6Mo?: number;
}

// Funding round with all investors
export interface FundingRoundFull {
  id?: string;
  type: RoundType;
  amount: number;
  date: string;
  leadInvestors: string[];
  allInvestors?: string[];
  valuation?: number;
  valuationType?: 'pre-money' | 'post-money';
}

// Team structure archetypes
export type TeamStructureType = 
  | 'solo-technical'
  | 'solo-commercial'
  | 'technical-ceo-commercial-coo'
  | 'commercial-ceo-technical-cto'
  | 'balanced-cofounders'
  | 'technical-heavy'
  | 'commercial-heavy';

// Founding team signal profile
export interface FoundingTeamSignal {
  score: number; // 0-100 composite score
  structureType?: TeamStructureType;
  cofoundersWorkedTogetherBefore?: boolean;
  hasTechnicalCofounder?: boolean;
  hasCommercialCofounder?: boolean;
  combinedYearsExperience?: number;
  networkStrengthScore?: number;
  // Signal breakdown
  priorExitBonus?: number; // +30 max
  faangSeniorBonus?: number; // +20 max
  networkBonus?: number; // +15 max
  workedTogetherBonus?: number; // +15 max
  teamStructureBonus?: number; // +10 max
  experienceBonus?: number; // +10 max
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
  cap_table_quality?: InvestorTrackRecord;
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

export type SortOption = 'date_added' | 'last_funded';

// Unicorn Score factors breakdown
export interface UnicornScoreFactors {
  tractionScore?: number; // 0-25
  marketSizeScore?: number; // 0-25
  founderPedigreeScore?: number; // 0-25
  backerTrackRecordScore?: number; // 0-25
  capitalEfficiencyBonus?: number; // 0-10
  defensibilityBonus?: number; // 0-10
}

// Backer Quality Score factors
export interface BackerScoreFactors {
  leadInvestorExitRate?: number; // 0-1 (60% = 0.6)
  exitsWith5xPlus?: number; // Count of 5x+ exits
  totalExits?: number;
  coInvestorsWithUnicorns?: string[];
  hasHotStreak?: boolean; // 2+ exits in last 2 years
  averagePortfolioMultiple?: number;
}

// Hidden Gem signals
export interface HiddenGemSignals {
  isBootstrappedWithTraction?: boolean;
  hasIndieHackersPresence?: boolean;
  hasStarterStoryFeature?: boolean;
  hasProductHuntLaunch?: boolean;
  noCrunchbaseProfile?: boolean;
  patentFilingsRecent?: number;
  hiringStreakWeeks?: number;
  organicGrowthSignals?: string[];
  underTheRadarScore?: number; // 0-100
}

export interface Startup {
  id: string;
  name: string;
  logo?: string;
  description: string;
  createdAt?: string;
  eli5: string;
  website: string;
  sector: Sector[];
  location: {
    city: string;
    state?: string;
    country: string;
  };
  // Current/most recent funding round (for backward compatibility)
  fundingRound: {
    type: RoundType;
    amount: number;
    date: string;
    leadInvestors: string[];
  };
  // All funding rounds history
  fundingHistory?: FundingRoundFull[];
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
  
  // Enhanced prior exit details
  priorExits?: PriorExit[];
  hasPriorIPO?: boolean;
  priorIPODetails?: PriorIPODetails;
  
  // Hiring velocity & headcount
  headcountGrowth?: HeadcountGrowth;
  hiringVelocityScore?: number; // 0-100
  
  // Founding team signal profile
  foundingTeamSignal?: FoundingTeamSignal;
  teamStructureType?: TeamStructureType;
  cofoundersWorkedTogetherBefore?: boolean;
  
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
  
  // =============================================================================
  // Advanced Scores (ML-powered)
  // =============================================================================
  
  // Unicorn Likelihood Score - ML model blending traction, market, founder, backers
  unicornLikelihoodScore?: number; // 0-100
  is10xBet?: boolean; // Top 5% flagged
  unicornScoreFactors?: UnicornScoreFactors;
  
  // Backer Quality Score - Lead investor exit rate, co-investors with unicorns
  backerQualityScore?: number; // 0-100
  backerHotStreak?: boolean; // Recent successful exits
  backerScoreFactors?: BackerScoreFactors;
  leadInvestorExitRate?: number; // e.g., 0.6 = 60%
  investorsWithUnicornExits?: string[];
  
  // Hidden Gem Radar - Bootstrapped, obscure signals
  isHiddenGem?: boolean;
  hiddenGemScore?: number; // 0-100
  hiddenGemSignals?: HiddenGemSignals;
  isBootstrappedGrowth?: boolean;
  hasIndiePresence?: boolean;
  hasNoCrunchbase?: boolean;
  recentPatentFilings?: number;
  hiringStreakWeeks?: number;
}

// Hiring velocity filter bands
export type HiringVelocityBand = 'explosive' | 'strong' | 'moderate' | 'stable' | 'declining';

// Founding team signal filter bands
export type FoundingTeamSignalBand = 'exceptional' | 'strong' | 'good' | 'average';

// Score bands for filtering
export type UnicornScoreBand = 'exceptional' | 'high' | 'moderate' | 'low';
export type BackerScoreBand = 'elite' | 'strong' | 'good' | 'standard';
export type HiddenGemStatus = 'hidden-gem' | 'emerging' | 'none';

export interface FilterState {
  dateRange: string;
  dateAddedRange: string;
  fundingMin?: number;
  fundingMax?: number;
  roundTypes: RoundType[];
  sectors: Sector[];
  // Geography - new drill-down pattern
  countries: string[];
  metros: string[];
  // Legacy region filters
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
  hasPriorIPO?: boolean; // Filter for founders with prior IPO
  investorQualities: InvestorQuality[];
  // Hiring & team signals
  hiringVelocityBands: HiringVelocityBand[];
  foundingTeamSignalBands: FoundingTeamSignalBand[];
  cofoundersWorkedTogether?: boolean;
  // Capital efficiency
  totalRaisedMin?: number;
  totalRaisedMax?: number;
  runwayBands: RunwayBand[];
  burnMultipleBands: BurnMultipleBand[];
  roundStatuses: RoundStatus[];
  hasLead?: boolean;
  
  // =============================================================================
  // Advanced Score Filters
  // =============================================================================
  
  // Unicorn Likelihood Score filter
  unicornScoreMin?: number; // 0-100
  unicornScoreMax?: number;
  unicornScoreBands: UnicornScoreBand[];
  only10xBets?: boolean; // Show only top 5% flagged as "10x bets"
  
  // Backer Quality Score filter
  backerScoreMin?: number; // 0-100
  backerScoreMax?: number;
  backerScoreBands: BackerScoreBand[];
  backerHotStreakOnly?: boolean; // Only show hot streak backers
  
  // Hidden Gem Radar filter
  hiddenGemOnly?: boolean; // Show only hidden gems
  hiddenGemStatuses: HiddenGemStatus[];
  isBootstrappedGrowth?: boolean; // Bootstrapped with traction
  hasIndiePresence?: boolean; // IndieHackers, StarterStory, etc.
  hasNoCrunchbase?: boolean; // No Crunchbase profile
  minPatentFilings?: number;
  minHiringStreakWeeks?: number;
}

// =============================================================================
// VC Deal Intelligence Types (Competitor Activity Alerts)
// =============================================================================

export type VCTier = 'tier1' | 'tier2' | 'tier3' | 'angel';
export type DealType = 'lead' | 'co-lead' | 'follow-on' | 'angel';

export interface VCFirm {
  id: string;
  name: string;
  tier: VCTier;
  aumUsd?: number;
  notableExits?: string[];
  focusSectors?: string[];
  focusStages?: string[];
  headquarters?: string;
  website?: string;
}

export interface VCDeal {
  id: string;
  vcFirm: string;
  vcTier?: VCTier;
  startupName: string;
  startupId?: string;
  dealType: DealType;
  roundType?: string;
  amount?: number;
  dealDate: string;
  sector?: string[];
  geography?: string;
  sourceUrl?: string;
  sourceName?: string;
}

export interface AngelInvestor {
  id: string;
  name: string;
  isProminent: boolean;
  notableInvestments?: string[];
  sectors?: string[];
  typicalCheckSizeMin?: number;
  typicalCheckSizeMax?: number;
  twitterHandle?: string;
  linkedinUrl?: string;
}

export interface StartupAngelInvestment {
  id: string;
  startupId: string;
  angelId: string;
  angelName?: string;
  roundType?: string;
  investmentDate?: string;
}
