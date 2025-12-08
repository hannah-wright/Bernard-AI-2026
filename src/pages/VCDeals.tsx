/**
 * VC Deal Intelligence Page
 * 
 * Shows recent deals from top VCs, helping users track competitor activity
 * and identify emerging trends in the market.
 * 
 * Free/trial users see a limited preview with upgrade prompt.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Globe,
  Lock,
  Crown,
  Sparkles,
  ArrowRight,
  Bell,
  BellRing,
  Bookmark,
  BookmarkCheck,
  Trash2,
  MoreVertical,
  Mail,
  LogIn,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VCDeal, VCFirm, VCTier } from '@/types/startup';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { isPaidPlan, canAccessAlerts } from '@/config/billing';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Number of preview deals for free/trial users
const FREE_PREVIEW_LIMIT = 3;

// Request Access URL for logged out users
const REQUEST_ACCESS_URL = 'https://your-domain.example/request-access';

// Interface for VC Deal alerts/saved filters
interface VCDealFilter {
  id: string;
  userId: string;
  name: string;
  tier: string;
  firm: string;
  sector: string;
  timeRange: string;
  emailAlerts: boolean;
  frequency: 'daily' | 'weekly';
  createdAt: string;
}

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedFirm, setSelectedFirm] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30');
  
  // Saved filter dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState<'daily' | 'weekly'>('daily');

  // Check if user has full access (paid plan)
  const hasFullAccess = isPaidPlan(profile?.subscription_tier);
  const canUseAlerts = canAccessAlerts(profile?.subscription_tier);
  const isLoggedIn = !!user;

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['vc-deals'],
    queryFn: fetchVCDeals,
  });

  const { data: firms = [] } = useQuery({
    queryKey: ['vc-firms'],
    queryFn: fetchVCFirms,
  });

  // Fetch saved VC deal filters
  const { data: savedFilters = [] } = useQuery({
    queryKey: ['vc-deal-filters', user?.id],
    queryFn: async (): Promise<VCDealFilter[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('vc_deal_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((f: any) => ({
        id: f.id,
        userId: f.user_id,
        name: f.name,
        tier: f.tier || 'all',
        firm: f.firm || 'all',
        sector: f.sector || 'all',
        timeRange: f.time_range || '30',
        emailAlerts: f.email_alerts ?? true,
        frequency: f.frequency || 'daily',
        createdAt: f.created_at,
      }));
    },
    enabled: !!user,
  });

  // Save filter mutation
  const saveFilterMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      const { data, error } = await supabase
        .from('vc_deal_alerts')
        .insert({
          user_id: user.id,
          name: filterName,
          tier: selectedTier,
          firm: selectedFirm,
          sector: selectedSector,
          time_range: timeRange,
          email_alerts: enableEmailAlerts,
          frequency: alertFrequency,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vc-deal-filters'] });
      setShowSaveDialog(false);
      setFilterName('');
      toast.success(
        enableEmailAlerts 
          ? `Alert saved! You'll receive ${alertFrequency} email updates for matching VC deals.`
          : 'Filter saved!'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete filter mutation
  const deleteFilterMutation = useMutation({
    mutationFn: async (filterId: string) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('vc_deal_alerts')
        .delete()
        .eq('id', filterId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vc-deal-filters'] });
      toast.success('Filter deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle email alerts mutation
  const toggleAlertsMutation = useMutation({
    mutationFn: async ({ filterId, enabled }: { filterId: string; enabled: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('vc_deal_alerts')
        .update({ email_alerts: enabled })
        .eq('id', filterId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['vc-deal-filters'] });
      toast.success(enabled ? 'Email alerts enabled' : 'Email alerts paused');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Load a saved filter
  const loadFilter = (filter: VCDealFilter) => {
    setSelectedTier(filter.tier);
    setSelectedFirm(filter.firm);
    setSelectedSector(filter.sector);
    setTimeRange(filter.timeRange);
    toast.success(`Loaded filter: ${filter.name}`);
  };

  // Check if current filters have any selections
  const hasActiveFilters = selectedTier !== 'all' || selectedFirm !== 'all' || selectedSector !== 'all';

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
          <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary" />
                VC Deal Intelligence
              </h1>
              <p className="text-muted-foreground">
                Track what top VCs are investing in. See deals from Sequoia, a16z, and other leading firms.
              </p>
            </div>
            
            {/* Actions: Saved Filters & Alerts */}
            <div className="flex items-center gap-2">
              {isLoggedIn && (
                <>
                  {/* Saved Filters Dropdown */}
                  {savedFilters.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Bookmark className="h-4 w-4 mr-2" />
                          Saved ({savedFilters.length})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-72">
                        {savedFilters.map((filter) => (
                          <div key={filter.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-muted rounded-sm">
                            <button
                              onClick={() => loadFilter(filter)}
                              className="flex-1 text-left text-sm font-medium truncate"
                            >
                              {filter.name}
                              {filter.emailAlerts && (
                                <BellRing className="h-3 w-3 inline ml-2 text-primary" />
                              )}
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => loadFilter(filter)}>
                                  Load Filter
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => toggleAlertsMutation.mutate({ 
                                    filterId: filter.id, 
                                    enabled: !filter.emailAlerts 
                                  })}
                                >
                                  {filter.emailAlerts ? 'Pause Alerts' : 'Enable Alerts'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => deleteFilterMutation.mutate(filter.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {/* Save Current Filter Button */}
                  <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant={hasActiveFilters ? "default" : "outline"} 
                        size="sm"
                        disabled={!hasActiveFilters && !canUseAlerts}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        {hasActiveFilters ? 'Save & Get Alerts' : 'Create Alert'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <BellRing className="h-5 w-5 text-primary" />
                          Save VC Deal Alert
                        </DialogTitle>
                        <DialogDescription>
                          Get notified when new deals match your criteria. Perfect for tracking competitor activity.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="filter-name">Alert Name</Label>
                          <Input
                            id="filter-name"
                            placeholder="e.g., Tier 1 AI Deals"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                          />
                        </div>

                        {/* Current Filter Summary */}
                        <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                          <p className="font-medium">Current Filters:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedTier !== 'all' && (
                              <Badge variant="secondary">{tierLabels[selectedTier as VCTier] || selectedTier}</Badge>
                            )}
                            {selectedFirm !== 'all' && (
                              <Badge variant="secondary">{selectedFirm}</Badge>
                            )}
                            {selectedSector !== 'all' && (
                              <Badge variant="secondary">{selectedSector}</Badge>
                            )}
                            {selectedTier === 'all' && selectedFirm === 'all' && selectedSector === 'all' && (
                              <span className="text-muted-foreground">All deals (no filters)</span>
                            )}
                          </div>
                        </div>

                        {/* Email Alerts Toggle */}
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <Label className="text-base">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when new deals match
                            </p>
                          </div>
                          <Switch
                            checked={enableEmailAlerts}
                            onCheckedChange={setEnableEmailAlerts}
                          />
                        </div>

                        {/* Frequency Selection */}
                        {enableEmailAlerts && (
                          <div className="space-y-2">
                            <Label>Notification Frequency</Label>
                            <Select value={alertFrequency} onValueChange={(v) => setAlertFrequency(v as 'daily' | 'weekly')}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Daily Summary
                                  </div>
                                </SelectItem>
                                <SelectItem value="weekly">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Weekly Digest
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {!canUseAlerts && (
                          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
                            <p className="font-medium text-primary">Upgrade for Email Alerts</p>
                            <p className="text-muted-foreground mt-1">
                              Email notifications are available on paid plans. You can still save filters.
                            </p>
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => saveFilterMutation.mutate()}
                          disabled={!filterName.trim() || saveFilterMutation.isPending}
                        >
                          {saveFilterMutation.isPending ? 'Saving...' : 'Save Alert'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
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
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {allSectors.map(sector => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Free/Trial/Logged-out User Teaser Banner */}
          {!hasFullAccess && filteredDeals.length > 0 && (
            <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Preview Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Showing {Math.min(FREE_PREVIEW_LIMIT, filteredDeals.length)} of {filteredDeals.length} deals. 
                        {isLoggedIn ? ' Upgrade for full access.' : ' Request access to unlock.'}
                      </p>
                    </div>
                  </div>
                  {isLoggedIn ? (
                    <Button onClick={() => navigate('/billing')} className="shrink-0">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Button>
                  ) : (
                    <Button asChild className="shrink-0">
                      <a href={REQUEST_ACCESS_URL} target="_blank" rel="noopener noreferrer">
                        <LogIn className="h-4 w-4 mr-2" />
                        Request Access
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deals List */}
          {dealsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDeals.length === 0 ? (
            /* Show different content for logged-out vs logged-in users */
            !isLoggedIn ? (
              /* Logged-out: Show blurred teaser with Request Access CTA */
              <div className="space-y-4">
                {/* Blurred placeholder deals */}
                {[1, 2, 3].map((i) => (
                  <Card key={`placeholder-${i}`} className="relative overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-md bg-background/70 z-10" />
                    <CardContent className="p-4 opacity-40">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-5 w-32 bg-muted rounded" />
                            <div className="h-5 w-16 bg-muted rounded" />
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-4 w-20 bg-muted rounded" />
                          </div>
                        </div>
                        <div className="h-6 w-16 bg-muted rounded" />
                      </div>
                    </CardContent>
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  </Card>
                ))}

                {/* Request Access CTA */}
                <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Don't have an account?</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Get access to real-time VC deal tracking, email alerts, and competitive intelligence from top firms like Sequoia, a16z, and Accel.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button size="lg" asChild>
                        <a href={REQUEST_ACCESS_URL} target="_blank" rel="noopener noreferrer">
                          <LogIn className="h-4 w-4 mr-2" />
                          Request Access
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Get started for free
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Logged-in: Show normal "no deals found" message */
              <Card className="p-8 text-center">
                <CardTitle className="mb-2">No deals found</CardTitle>
                <CardDescription>
                  {deals.length === 0 
                    ? "VC deal data will appear here once enrichment starts tracking deals."
                    : "Try adjusting your filters to see more results."}
                </CardDescription>
              </Card>
            )
          ) : (
            <div className="space-y-4">
              {/* Visible deals (all for paid, limited for free) */}
              {(hasFullAccess ? filteredDeals : filteredDeals.slice(0, FREE_PREVIEW_LIMIT)).map(deal => (
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

              {/* Blurred/Locked deals teaser for free users */}
              {!hasFullAccess && filteredDeals.length > FREE_PREVIEW_LIMIT && (
                <>
                  {/* Show 2 blurred deal teasers */}
                  {filteredDeals.slice(FREE_PREVIEW_LIMIT, FREE_PREVIEW_LIMIT + 2).map((deal, idx) => (
                    <Card key={`locked-${deal.id}`} className="relative overflow-hidden">
                      <div className="absolute inset-0 backdrop-blur-md bg-background/60 z-10" />
                      <CardContent className="p-4 opacity-50">
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
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {deal.amount && (
                              <div className="flex items-center gap-1 text-xl font-bold text-primary">
                                <DollarSign className="h-5 w-5" />
                                {formatCurrency(deal.amount)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      {/* Lock overlay */}
                      <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    </Card>
                  ))}

                  {/* Upgrade/Request Access CTA */}
                  <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
                    <CardContent className="p-8 text-center">
                      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                        {isLoggedIn ? <Crown className="h-8 w-8 text-primary" /> : <Zap className="h-8 w-8 text-primary" />}
                      </div>
                      <h3 className="text-xl font-bold mb-2">
                        {isLoggedIn 
                          ? `Unlock ${filteredDeals.length - FREE_PREVIEW_LIMIT}+ More Deals`
                          : "Don't have an account?"
                        }
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {isLoggedIn
                          ? 'Get full access to VC Deal Intelligence with real-time tracking of deals from Sequoia, a16z, Accel, and other top-tier firms.'
                          : 'Track what leading VCs are investing in, save custom alerts, and get daily email reports on new deals matching your criteria.'
                        }
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-2xl mx-auto text-left">
                        <div className="flex items-start gap-2">
                          <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Real-time Deals</p>
                            <p className="text-xs text-muted-foreground">Updated daily</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">20+ Top VCs</p>
                            <p className="text-xs text-muted-foreground">Tracked firms</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <BellRing className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Email Alerts</p>
                            <p className="text-xs text-muted-foreground">Daily/weekly reports</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <BookmarkCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Saved Filters</p>
                            <p className="text-xs text-muted-foreground">Quick access</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {isLoggedIn ? (
                          <>
                            <Button size="lg" onClick={() => navigate('/billing')}>
                              <Crown className="h-4 w-4 mr-2" />
                              Upgrade to Unlock
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                            <p className="text-sm text-muted-foreground">
                              Starting at $249/month
                            </p>
                          </>
                        ) : (
                          <>
                            <Button size="lg" asChild>
                              <a href={REQUEST_ACCESS_URL} target="_blank" rel="noopener noreferrer">
                                <LogIn className="h-4 w-4 mr-2" />
                                Request Access
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </a>
                            </Button>
                            <p className="text-sm text-muted-foreground">
                              Get started for free
                            </p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VCDeals;

