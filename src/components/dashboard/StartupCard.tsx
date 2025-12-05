import { useState } from 'react';
import { Heart, ExternalLink, MapPin, Calendar, TrendingUp, Users, DollarSign, Coins, Building2, GraduationCap, Briefcase, Globe, Shield, Award, AlertTriangle, Trophy, Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Startup } from '@/types/startup';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface StartupCardProps {
  startup: Startup;
  onFavoriteToggle?: (id: string) => void;
}

const formatCurrency = (amount?: number) => {
  if (!amount) return 'N/A';
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SectionTitle = ({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <h3 className="text-base font-semibold text-foreground">{children}</h3>
    {tooltip && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px] text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);

const EstimatedLabel = ({ tooltip }: { tooltip: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 cursor-help">
          <Sparkles className="h-2.5 w-2.5" />
          Est.
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ScoreBadge = ({ score, label }: { score?: number; label: string }) => {
  if (score === undefined) return null;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (s >= 60) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    if (s >= 40) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-secondary/30 border border-border">
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <span className={cn('text-xl font-bold rounded-full px-3 py-1 border', getScoreColor(score))}>
        {score}
      </span>
    </div>
  );
};

export const StartupCard = ({ startup, onFavoriteToggle }: StartupCardProps) => {
  const [isFavorite, setIsFavorite] = useState(startup.isFavorite || false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasViewedDetails, setHasViewedDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { deductCredits, credits, getCost } = useCredits();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onFavoriteToggle?.(startup.id);
  };

  const handleCardClick = async () => {
    // If not logged in, prompt to sign in
    if (!user) {
      toast.info('Sign in to view startup details', {
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth',
        },
      });
      return;
    }

    // If already viewed this session, open without charging
    if (hasViewedDetails) {
      setIsDialogOpen(true);
      return;
    }

    // Check credits before opening
    const cost = getCost('view_startup_details');
    if (credits < cost) {
      toast.error('Insufficient credits', {
        description: `Viewing details costs ${cost} credit. You have ${credits}.`,
        action: {
          label: 'Get Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    setIsLoading(true);
    const result = await deductCredits('view_startup_details', {
      description: `Viewed ${startup.name} details`,
      resourceId: startup.id,
    });
    setIsLoading(false);

    if (result.success) {
      setHasViewedDetails(true);
      setIsDialogOpen(true);
    }
  };

  const highestConfidence = startup.dataSources.reduce((highest, source) => {
    const order = { verified: 4, high: 3, medium: 2, low: 1 };
    return order[source.confidence] > order[highest] ? source.confidence : highest;
  }, 'low' as const);

  const viewCost = getCost('view_startup_details');

  return (
    <>
      <div 
        onClick={handleCardClick}
        className={cn(
          "group relative rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:shadow-sm cursor-pointer",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        {/* Credit cost indicator */}
        {user && !hasViewedDetails && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground bg-secondary/80 rounded-full px-2 py-0.5">
            <Coins className="h-3 w-3" />
            <span>{viewCost}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <span className="text-lg font-semibold text-foreground">
                {startup.name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{startup.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {startup.location.city}, {startup.location.country}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleFavoriteClick}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                isFavorite ? 'fill-foreground text-foreground' : 'text-muted-foreground'
              )}
            />
          </button>
        </div>

        {/* Funding Info */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="font-medium">
            {startup.fundingRound.type}
          </Badge>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(startup.fundingRound.amount)}
          </span>
          <ConfidenceBadge level={highestConfidence} showLabel={false} />
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {startup.eli5}
        </p>

        {/* Sectors */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {startup.sector.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(startup.fundingRound.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-xs font-medium">{startup.metrics.buzzScore}</span>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center">
                <span className="text-2xl font-semibold text-foreground">
                  {startup.name.charAt(0)}
                </span>
              </div>
              <div>
                <DialogTitle className="text-xl">{startup.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {startup.location.city}
                    {startup.location.state && `, ${startup.location.state}`}, {startup.location.country}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="market" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="predictive">Predictive AI</TabsTrigger>
            </TabsList>

            {/* Predictive AI Tab */}
            <TabsContent value="predictive" className="space-y-6 mt-4">
              {/* Funding Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Funding Round</span>
                  </div>
                  <p className="text-2xl font-semibold">{formatCurrency(startup.fundingRound.amount)}</p>
                  <Badge className="mt-2">{startup.fundingRound.type}</Badge>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Lead Investors</span>
                  </div>
                  <div className="space-y-1">
                    {startup.fundingRound.leadInvestors.map((investor) => (
                      <p key={investor} className="text-sm font-medium">{investor}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Scores */}
              {(startup.unicornProbability || startup.teamQualityScore || startup.productMarketFitScore || startup.investmentReadinessScore) && (
                <div>
                  <SectionTitle tooltip="AI-generated scores based on analysis of public data. These are predictive estimates, not guarantees.">AI Scores</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <ScoreBadge score={startup.unicornProbability} label="Unicorn Prob." />
                    <ScoreBadge score={startup.teamQualityScore} label="Team Quality" />
                    <ScoreBadge score={startup.productMarketFitScore} label="PMF Score" />
                    <ScoreBadge score={startup.investmentReadinessScore} label="Investment Ready" />
                  </div>
                </div>
              )}

              {/* Prior Exit Badge */}
              {startup.hasPriorExit && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-500">Founder with Successful Exit</span>
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div>
                <SectionTitle tooltip="Metrics derived from public sources and AI analysis. Actual figures may vary.">Key Metrics</SectionTitle>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <EstimatedLabel tooltip="Estimated from public data, job postings, and industry benchmarks" />
                    </div>
                    <p className="font-medium">{startup.metrics.estimatedRevenue || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Team Size</p>
                      <EstimatedLabel tooltip="Estimated from LinkedIn data and public sources" />
                    </div>
                    <p className="font-medium">{startup.metrics.estimatedSize || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Buzz Score</p>
                      <EstimatedLabel tooltip="AI-calculated score based on media coverage, social signals, and hiring activity" />
                    </div>
                    <p className="font-medium">{startup.metrics.buzzScore}/100</p>
                  </div>
                </div>
              </div>

              {/* Data Verification */}
              <div>
                <SectionTitle>Data Verification</SectionTitle>
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <ConfidenceBadge level={highestConfidence} />
                  <span className="text-sm text-muted-foreground">
                    Verified from {startup.dataSources.length} independent source{startup.dataSources.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6 mt-4">
              {/* Founders */}
              {startup.founderBackground?.founders?.length ? (
                <div>
                  <SectionTitle>Founders</SectionTitle>
                  <div className="space-y-3">
                    {startup.founderBackground.founders.map((founder, idx) => (
                      <div key={idx} className="rounded-lg bg-secondary/30 p-4">
                        <p className="font-medium text-foreground">{founder.name}</p>
                        {founder.years_in_industry && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Briefcase className="h-3 w-3" />
                            {founder.years_in_industry} years in industry
                          </p>
                        )}
                        {founder.notable_employers?.length ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {founder.notable_employers.slice(0, 3).join(', ')}
                          </p>
                        ) : null}
                        {founder.education?.length ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <GraduationCap className="h-3 w-3" />
                            {founder.education.slice(0, 2).join(', ')}
                          </p>
                        ) : null}
                        {founder.prior_startups?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {founder.prior_startups.slice(0, 3).map((ps, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {ps.name} {ps.outcome && `(${ps.outcome})`}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Team Composition */}
              {startup.teamComposition && (
                <div>
                  <SectionTitle>Team Composition</SectionTitle>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {startup.teamComposition.total_employees && (
                      <div className="rounded-lg bg-secondary/30 p-3 text-center">
                        <p className="text-xl font-semibold">{startup.teamComposition.total_employees}</p>
                        <p className="text-xs text-muted-foreground">Total Team</p>
                      </div>
                    )}
                    {startup.teamComposition.engineering_count && (
                      <div className="rounded-lg bg-secondary/30 p-3 text-center">
                        <p className="text-xl font-semibold">{startup.teamComposition.engineering_count}</p>
                        <p className="text-xs text-muted-foreground">Engineering</p>
                      </div>
                    )}
                    {startup.teamComposition.sales_count && (
                      <div className="rounded-lg bg-secondary/30 p-3 text-center">
                        <p className="text-xl font-semibold">{startup.teamComposition.sales_count}</p>
                        <p className="text-xs text-muted-foreground">Sales</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {startup.teamComposition.has_cto && <Badge variant="secondary">Has CTO</Badge>}
                    {startup.teamComposition.has_vp_sales && <Badge variant="secondary">Has VP Sales</Badge>}
                    {startup.teamComposition.has_ciso && <Badge variant="secondary">Has CISO</Badge>}
                  </div>
                </div>
              )}

              {/* Team Signals */}
              <div>
                <SectionTitle>Team Signals</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {startup.isSerialFounder && <Badge variant="secondary">Serial Founder</Badge>}
                  {startup.hasFaangAlumni && <Badge variant="secondary">Ex-FAANG</Badge>}
                  {startup.hasPriorExit && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Prior Exit</Badge>}
                  {startup.accelerator && <Badge variant="outline">{startup.accelerator}</Badge>}
                </div>
              </div>

              {/* Social Proof */}
              {startup.socialProof && (
                <div>
                  <SectionTitle>Social Proof</SectionTitle>
                  <div className="space-y-3">
                    {startup.socialProof.cap_table_quality && (
                      <Badge 
                        className={cn(
                          startup.socialProof.cap_table_quality === 'Unicorn-backers' && 'bg-green-500/10 text-green-500',
                          startup.socialProof.cap_table_quality === 'Multi-exit fund' && 'bg-blue-500/10 text-blue-500',
                          startup.socialProof.cap_table_quality === 'Established fund' && 'bg-yellow-500/10 text-yellow-500',
                        )}
                      >
                        {startup.socialProof.cap_table_quality}
                      </Badge>
                    )}
                    {startup.socialProof.notable_investors?.length ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notable Investors</p>
                        <div className="flex flex-wrap gap-1">
                          {startup.socialProof.notable_investors.slice(0, 5).map((inv, i) => (
                            <Badge key={i} variant="secondary">{inv}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {startup.socialProof.awards?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {startup.socialProof.awards.slice(0, 3).map((award, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {award}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Risk Flags */}
              {startup.riskFlags && (startup.riskFlags.key_person_dependency || startup.riskFlags.single_customer_dependency || startup.riskFlags.lawsuits?.length || startup.riskFlags.leadership_changes?.length) && (
                <div>
                  <SectionTitle>Risk Signals</SectionTitle>
                  <div className="space-y-2">
                    {startup.riskFlags.key_person_dependency && (
                      <div className="flex items-center gap-2 text-sm text-yellow-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Key Person Dependency</span>
                      </div>
                    )}
                    {startup.riskFlags.single_customer_dependency && (
                      <div className="flex items-center gap-2 text-sm text-yellow-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Single Customer Dependency</span>
                      </div>
                    )}
                    {startup.riskFlags.lawsuits?.length ? (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{startup.riskFlags.lawsuits.length} Active Lawsuit(s)</span>
                      </div>
                    ) : null}
                    {startup.riskFlags.leadership_changes?.length ? (
                      <div className="flex items-center gap-2 text-sm text-yellow-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Recent Leadership Changes</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {!startup.founderBackground?.founders?.length && !startup.teamComposition && (
                <div className="rounded-lg bg-secondary/30 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Team data not yet available for this startup.</p>
                </div>
              )}
            </TabsContent>

            {/* Market Tab */}
            <TabsContent value="market" className="space-y-6 mt-4">
              {/* What they do */}
              <div>
                <SectionTitle>What They Do</SectionTitle>
                <p className="text-foreground">{startup.eli5}</p>
              </div>

              {/* Industry */}
              <div>
                <SectionTitle>Industry</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {startup.sector.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Traction & Unit Economics */}
              {(startup.tractionMetrics?.paying_customers || startup.tractionMetrics?.arr || startup.unitEconomics?.ltv_cac_ratio) && (
                <div>
                  <SectionTitle tooltip="Traction data derived from public disclosures, news, and AI analysis. Figures are estimates unless verified.">Traction & Unit Economics</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {startup.tractionMetrics?.arr && (
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">ARR</p>
                          <EstimatedLabel tooltip="Estimated from public disclosures and funding data" />
                        </div>
                        <p className="font-semibold">{formatCurrency(startup.tractionMetrics.arr)}</p>
                      </div>
                    )}
                    {startup.tractionMetrics?.paying_customers && (
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">Paying Customers</p>
                          <EstimatedLabel tooltip="Estimated from case studies and public mentions" />
                        </div>
                        <p className="font-semibold">{startup.tractionMetrics.paying_customers}</p>
                      </div>
                    )}
                    {startup.tractionMetrics?.net_revenue_retention_pct && (
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">NRR</p>
                          <EstimatedLabel tooltip="Estimated from industry benchmarks" />
                        </div>
                        <p className="font-semibold">{startup.tractionMetrics.net_revenue_retention_pct}%</p>
                      </div>
                    )}
                    {startup.unitEconomics?.ltv_cac_ratio && (
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">LTV:CAC</p>
                          <EstimatedLabel tooltip="Derived from industry averages and available data" />
                        </div>
                        <p className="font-semibold">{startup.unitEconomics.ltv_cac_ratio}x</p>
                      </div>
                    )}
                    {startup.unitEconomics?.gross_margin_pct && (
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">Gross Margin</p>
                          <EstimatedLabel tooltip="Estimated based on business model" />
                        </div>
                        <p className="font-semibold">{startup.unitEconomics.gross_margin_pct}%</p>
                      </div>
                    )}
                    {startup.unitEconomics?.runway_months && (
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">Runway</p>
                          <EstimatedLabel tooltip="Estimated from funding and burn rate analysis" />
                        </div>
                        <p className="font-semibold">{startup.unitEconomics.runway_months} mo</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product & Defensibility */}
              {(startup.productInfo?.stage || startup.defensibilitySignals?.proprietary_data !== undefined) && (
                <div>
                  <SectionTitle>Product & Defensibility</SectionTitle>
                  <div className="space-y-3">
                    {startup.productInfo && (
                      <div className="flex flex-wrap gap-2">
                        {startup.productInfo.stage && <Badge variant="secondary">{startup.productInfo.stage}</Badge>}
                        {startup.productInfo.deployment_model && <Badge variant="outline">{startup.productInfo.deployment_model}</Badge>}
                        {startup.productInfo.ai_native && <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">AI Native</Badge>}
                      </div>
                    )}
                    {startup.defensibilitySignals && (
                      <div className="grid grid-cols-2 gap-2">
                        {startup.defensibilitySignals.proprietary_data && (
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-green-500" />
                            <span>Proprietary Data</span>
                          </div>
                        )}
                        {startup.defensibilitySignals.network_effects && (
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-green-500" />
                            <span>Network Effects</span>
                          </div>
                        )}
                        {startup.defensibilitySignals.patents_filed && (
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span>{startup.defensibilitySignals.patents_filed} Patents Filed</span>
                          </div>
                        )}
                        {startup.defensibilitySignals.switching_cost_level && (
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4" />
                            <span>{startup.defensibilitySignals.switching_cost_level} Switching Cost</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Market Context */}
              {startup.marketContext && (
                <div>
                  <SectionTitle>Market Context</SectionTitle>
                  <div className="space-y-2">
                    {startup.marketContext.category_position && (
                      <Badge variant="secondary">{startup.marketContext.category_position}</Badge>
                    )}
                    {startup.marketContext.tam_usd && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">TAM:</span> {formatCurrency(startup.marketContext.tam_usd)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Competitive Landscape */}
              {startup.competitiveLandscape && (
                <div>
                  <SectionTitle>Competition</SectionTitle>
                  <div className="space-y-3">
                    {startup.competitiveLandscape.direct_competitors?.length ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Direct Competitors</p>
                        <div className="flex flex-wrap gap-1">
                          {startup.competitiveLandscape.direct_competitors.slice(0, 4).map((comp, i) => (
                            <Badge key={i} variant="outline">{comp.name}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {startup.competitiveLandscape.competitive_advantages?.length ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Competitive Advantages</p>
                        <ul className="text-sm space-y-1">
                          {startup.competitiveLandscape.competitive_advantages.slice(0, 3).map((adv, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-green-500">✓</span> {adv}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {!startup.marketContext && !startup.competitiveLandscape && !startup.tractionMetrics && (
                <div className="rounded-lg bg-secondary/30 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Market data not yet available for this startup.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Actions - Always visible */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border mt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Website URL</p>
                <p className="text-sm font-medium truncate">{startup.website}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={startup.website} target="_blank" rel="noopener noreferrer">
                  Open website
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </a>
              </Button>
            </div>
            <Button
              variant={isFavorite ? 'secondary' : 'outline'}
              onClick={handleFavoriteClick}
            >
              <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
              {isFavorite ? 'Saved' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
