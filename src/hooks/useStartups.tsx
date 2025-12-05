import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Startup, RoundType, Sector, ConfidenceLevel, FounderBackground, TeamComposition, TractionMetrics, UnitEconomics, ProductInfo, DefensibilitySignals, MarketContext, CompetitiveLandscape, SocialProof, RiskFlags } from '@/types/startup';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface DatabaseFundingRound {
  id: string;
  startup_id: string;
  amount: number;
  round_type: string;
  date: string;
  lead_investors: string[] | null;
}

interface DatabaseDataSource {
  id: string;
  startup_id: string;
  name: string;
  confidence: string;
  url: string | null;
}

const PAGE_SIZE = 20;

// Helper to safely parse JSON fields
function parseJsonField<T>(field: Json | null | undefined): T | undefined {
  if (!field || typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
    return undefined;
  }
  return field as T;
}

async function fetchStartupsPage(pageParam: number): Promise<{ startups: Startup[]; nextPage: number | null }> {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Fetch startups with pagination
  const { data: startups, error: startupsError } = await supabase
    .from('startups')
    .select('*')
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

  // Group funding rounds and data sources by startup_id
  const fundingByStartup = (fundingRounds || []).reduce<Record<string, DatabaseFundingRound>>((acc, fr) => {
    if (!acc[fr.startup_id] || new Date(fr.date) > new Date(acc[fr.startup_id].date)) {
      acc[fr.startup_id] = fr;
    }
    return acc;
  }, {});

  const sourcesByStartup = (dataSources || []).reduce<Record<string, DatabaseDataSource[]>>((acc, ds) => {
    if (!acc[ds.startup_id]) acc[ds.startup_id] = [];
    acc[ds.startup_id].push(ds);
    return acc;
  }, {});

  // Transform to Startup type
  const transformedStartups = startups.map((s): Startup => {
    const funding = fundingByStartup[s.id];
    const sources = sourcesByStartup[s.id] || [];

    return {
      id: s.id,
      name: s.name,
      logo: s.logo || undefined,
      description: s.description,
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
      metrics: {
        estimatedRevenue: s.estimated_revenue || undefined,
        estimatedSize: s.estimated_size || undefined,
        buzzScore: s.buzz_score || 0,
      },
      dataSources: sources.map(ds => ({
        name: ds.name,
        confidence: ds.confidence as ConfidenceLevel,
        url: ds.url || undefined,
      })),
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

  // Flatten all pages into a single array
  const startups = query.data?.pages.flatMap(page => page.startups) ?? [];

  return {
    ...query,
    data: startups,
    startups,
  };
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
