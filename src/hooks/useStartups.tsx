import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Startup, 
  RoundType, 
  Sector, 
  ConfidenceLevel, 
  FounderBackground, 
  TeamComposition, 
  TractionMetrics, 
  UnitEconomics, 
  ProductInfo, 
  DefensibilitySignals, 
  MarketContext, 
  CompetitiveLandscape, 
  SocialProof, 
  RiskFlags,
  FundingRoundFull,
  PriorExit,
  PriorIPODetails,
  HeadcountGrowth,
  FoundingTeamSignal,
  TeamStructureType
} from '@/types/startup';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface DatabaseFundingRound {
  id: string;
  startup_id: string;
  amount: number;
  round_type: string;
  date: string;
  lead_investors: string[] | null;
  all_investors?: string[] | null;
  valuation?: number | null;
  valuation_type?: string | null;
}

interface DatabaseDataSource {
  id: string;
  startup_id: string;
  name: string;
  confidence: string;
  url: string | null;
}

const PAGE_SIZE = 50;

// Helper to safely parse JSON fields
function parseJsonField<T>(field: Json | null | undefined): T | undefined {
  if (field === null || field === undefined) {
    return undefined;
  }
  // If it's a string, try to parse it as JSON (Supabase sometimes returns JSONB as string)
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      return undefined;
    }
  }
  // If it's a primitive (number, boolean), return undefined
  if (typeof field === 'number' || typeof field === 'boolean') {
    return undefined;
  }
  // Otherwise it's already an object
  return field as T;
}

async function fetchStartupsPage(pageParam: number): Promise<{ startups: Startup[]; nextPage: number | null }> {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Fetch startups with pagination - only show FULLY enriched startups (version 3+)
  // This ensures Market tab, Team tab, and all VC intelligence data is complete
  const { data: startups, error: startupsError } = await supabase
    .from('startups')
    .select('*')
    .gte('enrichment_version', 3) // Only show startups with full enrichment
    .order('created_at', { ascending: false })
    .range(from, to);

  if (startupsError) throw startupsError;
  if (!startups || startups.length === 0) return { startups: [], nextPage: null };

  // Fetch funding rounds for these startups
  const { data: fundingRounds, error: fundingError } = await supabase
    .from('funding_rounds')
    .select('*')
    .in('startup_id', startups.map(s => s.id));

  if (fundingError) throw fundingError;

  // Fetch data sources for these startups
  const { data: dataSources, error: sourcesError } = await supabase
    .from('data_sources')
    .select('*')
    .in('startup_id', startups.map(s => s.id));

  if (sourcesError) throw sourcesError;

  // Group funding rounds by startup_id - keep all rounds sorted by date (newest first)
  const allFundingByStartup = (fundingRounds || []).reduce<Record<string, DatabaseFundingRound[]>>((acc, fr) => {
    if (!acc[fr.startup_id]) acc[fr.startup_id] = [];
    acc[fr.startup_id].push(fr);
    return acc;
  }, {});
  
  // Sort each startup's funding rounds by date (newest first)
  Object.keys(allFundingByStartup).forEach(id => {
    allFundingByStartup[id].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  
  // Get just the latest funding round for backward compatibility
  const fundingByStartup = Object.fromEntries(
    Object.entries(allFundingByStartup).map(([id, rounds]) => [id, rounds[0]])
  );

  const sourcesByStartup = (dataSources || []).reduce<Record<string, DatabaseDataSource[]>>((acc, ds) => {
    if (!acc[ds.startup_id]) acc[ds.startup_id] = [];
    acc[ds.startup_id].push(ds);
    return acc;
  }, {});

  // Transform to Startup type
  const transformedStartups = startups.map((s): Startup => {
    const funding = fundingByStartup[s.id];
    const allFunding = allFundingByStartup[s.id] || [];
    const sources = sourcesByStartup[s.id] || [];

    // Transform all funding rounds to FundingRoundFull
    const fundingHistory: FundingRoundFull[] = allFunding.map(fr => ({
      id: fr.id,
      type: fr.round_type as RoundType,
      amount: fr.amount,
      date: fr.date,
      leadInvestors: fr.lead_investors || [],
      allInvestors: fr.all_investors || undefined,
      valuation: fr.valuation || undefined,
      valuationType: fr.valuation_type as 'pre-money' | 'post-money' | undefined,
    }));

    // Build headcount growth data if available
    const headcountGrowth: HeadcountGrowth | undefined = s.headcount_current ? {
      current: s.headcount_current,
      sixMonthsAgo: s.headcount_6mo_ago || undefined,
      twelveMonthsAgo: s.headcount_1_year_ago || s.headcount_12mo_ago || undefined, // LinkedIn YoY data
      engineeringCurrent: s.engineering_headcount_current || undefined,
      engineeringSixMonthsAgo: s.engineering_headcount_6mo_ago || undefined,
      growthRate12Mo: s.employee_growth_yoy_percent || undefined, // LinkedIn YoY %
      linkedinCompanyUrl: s.linkedin_company_url || undefined,
      linkedinLastScraped: s.linkedin_last_scraped || undefined,
    } : undefined;

    // Build founding team signal data if available
    const foundingTeamSignal: FoundingTeamSignal | undefined = s.founding_team_signal_score ? {
      score: s.founding_team_signal_score,
      structureType: s.team_structure_type as TeamStructureType | undefined,
      cofoundersWorkedTogetherBefore: s.cofounders_worked_together_before || undefined,
      hasTechnicalCofounder: s.has_technical_cofounder || undefined,
      hasCommercialCofounder: s.has_commercial_cofounder || undefined,
      combinedYearsExperience: s.combined_years_experience || undefined,
      networkStrengthScore: s.network_strength_score || undefined,
    } : undefined;

    return {
      id: s.id,
      name: s.name,
      logo: s.logo || undefined,
      description: s.description,
      createdAt: s.created_at || undefined,
      eli5: s.eli5,
      website: s.website,
      sector: s.sectors as Sector[],
      location: {
        city: s.city,
        state: s.state || undefined,
        country: s.country,
      },
      fundingRound: funding ? {
        type: funding.round_type as RoundType,
        amount: funding.amount,
        date: funding.date,
        leadInvestors: funding.lead_investors || [],
      } : {
        type: 'Seed' as RoundType,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        leadInvestors: [],
      },
      // All funding rounds history
      fundingHistory: fundingHistory.length > 0 ? fundingHistory : undefined,
      metrics: {
        estimatedRevenue: s.estimated_revenue || undefined,
        revenueConfidence: (s.revenue_confidence as 'verified' | 'estimated' | 'unknown') || 'estimated',
        revenueSource: s.revenue_source || undefined,
        estimatedSize: s.estimated_size || undefined,
        buzzScore: s.buzz_score || 0,
      },
      // Ensure at least 1 data source (if none exist, show default)
      dataSources: sources.length > 0 
        ? sources.map(ds => ({
            name: ds.name,
            confidence: ds.confidence as ConfidenceLevel,
            url: ds.url || undefined,
          }))
        : [{ name: 'BernardAI Discovery', confidence: 'medium' as ConfidenceLevel }],
      // Geography & Business Model fields
      region: s.region as Startup['region'],
      primaryMarket: s.primary_market as Startup['primaryMarket'],
      businessModel: s.business_model as Startup['businessModel'],
      companyType: s.company_type as Startup['companyType'],
      targetCustomer: s.target_customer as Startup['targetCustomer'],
      // Team & Signal fields
      founderType: s.founder_type as Startup['founderType'],
      isSerialFounder: s.is_serial_founder ?? undefined,
      accelerator: s.accelerator as Startup['accelerator'],
      hasFaangAlumni: s.has_faang_alumni ?? undefined,
      hasPriorExit: s.has_prior_exit ?? undefined,
      priorExitCount: s.prior_exit_count ?? undefined,
      investorQuality: s.investor_quality as Startup['investorQuality'],
      // Enhanced prior exit details
      priorExits: parseJsonField<PriorExit[]>(s.prior_exits),
      hasPriorIPO: s.has_prior_ipo ?? undefined,
      priorIPODetails: parseJsonField<PriorIPODetails>(s.prior_ipo_details),
      // Hiring velocity & headcount
      headcountGrowth,
      hiringVelocityScore: s.hiring_velocity_score ?? undefined,
      employeeGrowthYoYPercent: s.employee_growth_yoy_percent ?? undefined, // LinkedIn YoY %
      linkedinCompanyUrl: s.linkedin_company_url ?? undefined,
      // Founding team signal profile
      foundingTeamSignal,
      teamStructureType: s.team_structure_type as TeamStructureType | undefined,
      cofoundersWorkedTogetherBefore: s.cofounders_worked_together_before ?? undefined,
      // Capital efficiency fields
      totalRaised: s.total_raised ?? undefined,
      currentRoundSize: s.current_round_size ?? undefined,
      arrRaisedRatio: s.arr_raised_ratio ? Number(s.arr_raised_ratio) : undefined,
      runwayBand: s.runway_band as Startup['runwayBand'],
      burnMultipleBand: s.burn_multiple_band as Startup['burnMultipleBand'],
      roundStatus: s.round_status as Startup['roundStatus'],
      hasLead: s.has_lead ?? undefined,
      // Advanced ML Scores
      unicornLikelihoodScore: s.unicorn_likelihood_score ?? undefined,
      is10xBet: s.is_10x_bet ?? false,
      unicornScoreFactors: parseJsonField(s.unicorn_score_factors),
      backerQualityScore: s.backer_quality_score ?? undefined,
      backerHotStreak: s.backer_hot_streak ?? false,
      backerScoreFactors: parseJsonField(s.backer_score_factors),
      leadInvestorExitRate: s.lead_investor_exit_rate ? Number(s.lead_investor_exit_rate) : undefined,
      investorsWithUnicornExits: s.investors_with_unicorn_exits ?? [],
      isHiddenGem: s.is_hidden_gem ?? false,
      hiddenGemScore: s.hidden_gem_score ?? undefined,
      hiddenGemSignals: parseJsonField(s.hidden_gem_signals),
      isBootstrappedGrowth: s.is_bootstrapped_growth ?? false,
      hasIndiePresence: s.has_indie_presence ?? false,
      hasNoCrunchbase: s.has_no_crunchbase ?? false,
      recentPatentFilings: s.recent_patent_filings ?? 0,
      hiringStreakWeeks: s.hiring_streak_weeks ?? 0,
      // VC Intelligence Fields
      founderBackground: parseJsonField<FounderBackground>(s.founder_background),
      teamComposition: parseJsonField<TeamComposition>(s.team_composition),
      teamQualityScore: s.team_quality_score ?? undefined,
      tractionMetrics: parseJsonField<TractionMetrics>(s.traction_metrics),
      unitEconomics: parseJsonField<UnitEconomics>(s.unit_economics),
      productInfo: parseJsonField<ProductInfo>(s.product_info),
      defensibilitySignals: parseJsonField<DefensibilitySignals>(s.defensibility_signals),
      marketContext: parseJsonField<MarketContext>(s.market_context),
      competitiveLandscape: parseJsonField<CompetitiveLandscape>(s.competitive_landscape),
      socialProof: parseJsonField<SocialProof>(s.social_proof),
      riskFlags: parseJsonField<RiskFlags>(s.risk_flags),
      unicornProbability: s.unicorn_probability ?? undefined,
      productMarketFitScore: s.product_market_fit_score ?? undefined,
      investmentReadinessScore: s.investment_readiness_score ?? undefined,
    };
  });

  // If we got a full page, there might be more
  const nextPage = startups.length === PAGE_SIZE ? pageParam + 1 : null;

  return { startups: transformedStartups, nextPage };
}

export function useStartups() {
  const query = useInfiniteQuery({
    queryKey: ['startups'],
    queryFn: ({ pageParam }) => fetchStartupsPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Flatten all pages into a single array AND deduplicate by ID
  // This prevents duplicates when pagination boundaries shift due to data changes
  const startups = query.data?.pages.flatMap(page => page.startups) ?? [];
  const uniqueStartups = Array.from(
    new Map(startups.map(s => [s.id, s])).values()
  );

  return {
    ...query,
    data: uniqueStartups,
    startups: uniqueStartups,
  };
}

// Server-side search for finding startups across ALL data (not just loaded pages)
export function useStartupSearch(searchQuery: string) {
  return useQuery({
    queryKey: ['startup-search', searchQuery],
    queryFn: async (): Promise<Startup[]> => {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      // Search by name, description, city, country, or sectors
      const { data: startups, error: startupsError } = await supabase
        .from('startups')
        .select('*')
        .gte('enrichment_version', 3)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (startupsError) throw startupsError;
      if (!startups || startups.length === 0) return [];

      // Sort results by relevance: exact name match > starts with > contains
      const queryLower = searchQuery.toLowerCase();
      startups.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Exact match comes first
        if (aName === queryLower && bName !== queryLower) return -1;
        if (bName === queryLower && aName !== queryLower) return 1;
        
        // Starts with query comes second
        const aStartsWith = aName.startsWith(queryLower);
        const bStartsWith = bName.startsWith(queryLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (bStartsWith && !aStartsWith) return 1;
        
        // Name contains query comes third (vs description/location match)
        const aContainsInName = aName.includes(queryLower);
        const bContainsInName = bName.includes(queryLower);
        if (aContainsInName && !bContainsInName) return -1;
        if (bContainsInName && !aContainsInName) return 1;
        
        // If same relevance, sort alphabetically
        return aName.localeCompare(bName);
      });

      // Fetch funding rounds for search results
      const { data: fundingRounds } = await supabase
        .from('funding_rounds')
        .select('*')
        .in('startup_id', startups.map(s => s.id));

      // Fetch data sources for search results
      const { data: dataSources } = await supabase
        .from('data_sources')
        .select('*')
        .in('startup_id', startups.map(s => s.id));

      // Group funding by startup
      const allFundingByStartup = (fundingRounds || []).reduce<Record<string, DatabaseFundingRound[]>>((acc, fr) => {
        if (!acc[fr.startup_id]) acc[fr.startup_id] = [];
        acc[fr.startup_id].push(fr);
        return acc;
      }, {});

      Object.keys(allFundingByStartup).forEach(id => {
        allFundingByStartup[id].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });

      const fundingByStartup = Object.fromEntries(
        Object.entries(allFundingByStartup).map(([id, rounds]) => [id, rounds[0]])
      );

      const sourcesByStartup = (dataSources || []).reduce<Record<string, DatabaseDataSource[]>>((acc, ds) => {
        if (!acc[ds.startup_id]) acc[ds.startup_id] = [];
        acc[ds.startup_id].push(ds);
        return acc;
      }, {});

      // Transform to Startup type (reusing same transform logic)
      return startups.map((s): Startup => {
        const funding = fundingByStartup[s.id];
        const sources = sourcesByStartup[s.id] || [];
        const allFunding = allFundingByStartup[s.id] || [];

        const fundingHistory = allFunding.map(fr => ({
          id: fr.id,
          type: fr.round_type as RoundType,
          amount: fr.amount,
          date: fr.date,
          leadInvestors: fr.lead_investors || [],
          allInvestors: fr.all_investors || undefined,
          valuation: fr.valuation || undefined,
          valuationType: fr.valuation_type as 'pre-money' | 'post-money' | undefined,
        }));

        const headcountGrowth: HeadcountGrowth | undefined = s.headcount_current ? {
          current: s.headcount_current,
          sixMonthsAgo: s.headcount_6mo_ago || undefined,
          twelveMonthsAgo: s.headcount_1_year_ago || s.headcount_12mo_ago || undefined,
          engineeringCurrent: s.engineering_headcount_current || undefined,
          engineeringSixMonthsAgo: s.engineering_headcount_6mo_ago || undefined,
          growthRate12Mo: s.employee_growth_yoy_percent || undefined,
          linkedinCompanyUrl: s.linkedin_company_url || undefined,
          linkedinLastScraped: s.linkedin_last_scraped || undefined,
        } : undefined;

        const foundingTeamSignal: FoundingTeamSignal | undefined = s.founding_team_signal_score ? {
          score: s.founding_team_signal_score,
          structureType: s.team_structure_type as TeamStructureType | undefined,
          cofoundersWorkedTogetherBefore: s.cofounders_worked_together_before || undefined,
        } : undefined;

        return {
          id: s.id,
          name: s.name,
          logo: s.logo || undefined,
          description: s.description,
          createdAt: s.created_at || undefined,
          eli5: s.eli5,
          website: s.website,
          sector: s.sectors as Sector[],
          location: { city: s.city, state: s.state || undefined, country: s.country },
          fundingRound: funding ? {
            type: funding.round_type as RoundType,
            amount: funding.amount,
            date: funding.date,
            leadInvestors: funding.lead_investors || [],
          } : { type: 'Seed' as RoundType, amount: 0, date: new Date().toISOString().split('T')[0], leadInvestors: [] },
          fundingHistory,
          metrics: {
            estimatedRevenue: s.estimated_revenue || undefined,
            revenueConfidence: s.revenue_confidence as 'verified' | 'estimated' | 'unknown' || 'unknown',
            revenueSource: s.revenue_source || undefined,
            estimatedSize: s.estimated_size || undefined,
            buzzScore: s.buzz_score || 0,
          },
          dataSources: sources.length > 0 ? sources.map(ds => ({
            name: ds.name,
            confidence: ds.confidence as ConfidenceLevel,
            url: ds.url || undefined,
          })) : [{ name: 'BernardAI Discovery', confidence: 'medium' }],
          headcountGrowth,
          hiringVelocityScore: s.hiring_velocity_score ?? undefined,
          employeeGrowthYoYPercent: s.employee_growth_yoy_percent ?? undefined,
          linkedinCompanyUrl: s.linkedin_company_url ?? undefined,
          foundingTeamSignal,
          unicornLikelihoodScore: s.unicorn_likelihood_score ?? undefined,
          is10xBet: s.is_10x_bet ?? false,
          totalRaised: s.total_raised ?? undefined,
          hasPriorExit: s.has_prior_exit ?? undefined,
          hasFaangAlumni: s.has_faang_alumni ?? undefined,
          isHiddenGem: s.is_hidden_gem ?? undefined,
          // VC Intelligence Fields - WERE MISSING!
          founderBackground: parseJsonField<FounderBackground>(s.founder_background),
          teamComposition: parseJsonField<TeamComposition>(s.team_composition),
          competitiveLandscape: parseJsonField<CompetitiveLandscape>(s.competitive_landscape),
          tractionMetrics: parseJsonField<TractionMetrics>(s.traction_metrics),
          unitEconomics: parseJsonField<UnitEconomics>(s.unit_economics),
          productInfo: parseJsonField<ProductInfo>(s.product_info),
          defensibilitySignals: parseJsonField<DefensibilitySignals>(s.defensibility_signals),
          marketContext: parseJsonField<MarketContext>(s.market_context),
          socialProof: parseJsonField<SocialProof>(s.social_proof),
          riskFlags: parseJsonField<RiskFlags>(s.risk_flags),
          priorExits: parseJsonField<PriorExit[]>(s.prior_exits),
          hasPriorIPO: s.has_prior_ipo ?? undefined,
          priorIPODetails: parseJsonField<PriorIPODetails>(s.prior_ipo_details),
          teamStructureType: s.team_structure_type as TeamStructureType | undefined,
          cofoundersWorkedTogetherBefore: s.cofounders_worked_together_before ?? undefined,
        };
      });
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useScrapeStartups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('scrape-startups');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['startups'] });
      toast.success(`Scraped ${data?.stats?.saved_to_database || 0} new startups`);
    },
    onError: (error) => {
      console.error('Scraping failed:', error);
      toast.error('Failed to scrape startups');
    },
  });
}
