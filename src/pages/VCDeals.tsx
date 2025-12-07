/**
 * VC Deal Intelligence Page
 * 
 * Shows recent deals from top VCs, helping users track competitor activity
 * and identify emerging trends in the market.
 */

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Building2, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Search,
  ExternalLink,
  Filter,
  Zap,
  Globe
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VCDeal, VCFirm, VCTier } from '@/types/startup';

// Tier badge colors
const tierColors: Record<VCTier, string> = {
  tier1: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  tier2: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  tier3: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  angel: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

const tierLabels: Record<VCTier, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
  angel: 'Angel',
};

// Fetch VC deals from Supabase
async function fetchVCDeals(): Promise<VCDeal[]> {
  const { data, error } = await supabase
    .from('vc_deals')
    .select('*')
    .order('deal_date', { ascending: false })
    .limit(100);

  if (error) throw error;
  
  return (data || []).map(d => ({
    id: d.id,
    vcFirm: d.vc_firm,
    vcTier: d.vc_tier as VCTier,
    startupName: d.startup_name,
    startupId: d.startup_id,
    dealType: d.deal_type,
    roundType: d.round_type,
    amount: d.amount,
    dealDate: d.deal_date,
    sector: d.sector,
    geography: d.geography,
    sourceUrl: d.source_url,
    sourceName: d.source_name,
  }));
}

// Fetch VC firms for filtering
async function fetchVCFirms(): Promise<VCFirm[]> {
  const { data, error } = await supabase
    .from('vc_firms')
    .select('*')
    .order('tier', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map(f => ({
    id: f.id,
    name: f.name,
    tier: f.tier as VCTier,
    aumUsd: f.aum_usd,
    notableExits: f.notable_exits,
    focusSectors: f.focus_sectors,
    focusStages: f.focus_stages,
    headquarters: f.headquarters,
    website: f.website,
  }));
}

const VCDeals = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedFirm, setSelectedFirm] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30');

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['vc-deals'],
    queryFn: fetchVCDeals,
  });

  const { data: firms = [] } = useQuery({
    queryKey: ['vc-firms'],
    queryFn: fetchVCFirms,
  });

  // Get unique sectors from deals
  const allSectors = useMemo(() => {
    const sectors = new Set<string>();
    deals.forEach(d => d.sector?.forEach(s => sectors.add(s)));
    return Array.from(sectors).sort();
  }, [deals]);

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // Time range filter
      if (timeRange !== 'all') {
        const daysAgo = parseInt(timeRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        if (new Date(deal.dealDate) < cutoffDate) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!deal.vcFirm.toLowerCase().includes(query) &&
            !deal.startupName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Tier filter
      if (selectedTier !== 'all' && deal.vcTier !== selectedTier) {
        return false;
      }

      // Firm filter
      if (selectedFirm !== 'all' && deal.vcFirm !== selectedFirm) {
        return false;
      }

      // Sector filter
      if (selectedSector !== 'all' && (!deal.sector || !deal.sector.includes(selectedSector))) {
        return false;
      }

      return true;
    });
  }, [deals, timeRange, searchQuery, selectedTier, selectedFirm, selectedSector]);

  // Group deals by week for trend analysis
  const dealsByWeek = useMemo(() => {
    const weeks: Record<string, VCDeal[]> = {};
    filteredDeals.forEach(deal => {
      const date = new Date(deal.dealDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(deal);
    });
    return weeks;
  }, [filteredDeals]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalDeals = filteredDeals.length;
    const totalAmount = filteredDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const tier1Deals = filteredDeals.filter(d => d.vcTier === 'tier1').length;
    const uniqueFirms = new Set(filteredDeals.map(d => d.vcFirm)).size;
    
    return { totalDeals, totalAmount, tier1Deals, uniqueFirms };
  }, [filteredDeals]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              VC Deal Intelligence
            </h1>
            <p className="text-muted-foreground">
              Track what top VCs are investing in. See deals from Sequoia, a16z, and other leading firms.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Deals Tracked</CardDescription>
                <CardTitle className="text-2xl">{stats.totalDeals}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Volume</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(stats.totalAmount)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tier 1 Deals</CardDescription>
                <CardTitle className="text-2xl">{stats.tier1Deals}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Firms</CardDescription>
                <CardTitle className="text-2xl">{stats.uniqueFirms}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by VC or startup..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="VC Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="tier1">Tier 1</SelectItem>
                <SelectItem value="tier2">Tier 2</SelectItem>
                <SelectItem value="tier3">Tier 3</SelectItem>
                <SelectItem value="angel">Angel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedFirm} onValueChange={setSelectedFirm}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="VC Firm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Firms</SelectItem>
                {firms.map(firm => (
                  <SelectItem key={firm.id} value={firm.name}>
                    {firm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-[150px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {allSectors.map(sector => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deals List */}
          {dealsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDeals.length === 0 ? (
            <Card className="p-8 text-center">
              <CardTitle className="mb-2">No deals found</CardTitle>
              <CardDescription>
                {deals.length === 0 
                  ? "VC deal data will appear here once enrichment starts tracking deals."
                  : "Try adjusting your filters to see more results."}
              </CardDescription>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDeals.map(deal => (
                <Card key={deal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg">{deal.startupName}</span>
                          {deal.roundType && (
                            <Badge variant="secondary">{deal.roundType}</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium text-foreground">{deal.vcFirm}</span>
                            {deal.vcTier && (
                              <Badge className={tierColors[deal.vcTier]} variant="outline">
                                {tierLabels[deal.vcTier]}
                              </Badge>
                            )}
                          </div>
                          
                          {deal.dealType && (
                            <Badge variant="outline" className="capitalize">
                              {deal.dealType}
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(deal.dealDate)}
                          </div>

                          {deal.geography && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {deal.geography}
                            </div>
                          )}
                        </div>

                        {deal.sector && deal.sector.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {deal.sector.map(s => (
                              <Badge key={s} variant="outline" className="text-xs">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        {deal.amount && (
                          <div className="flex items-center gap-1 text-xl font-bold text-primary">
                            <DollarSign className="h-5 w-5" />
                            {formatCurrency(deal.amount)}
                          </div>
                        )}
                        {deal.sourceUrl && (
                          <Button variant="ghost" size="sm" asChild className="mt-2">
                            <a href={deal.sourceUrl} target="_blank" rel="noopener noreferrer">
                              Source <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VCDeals;

