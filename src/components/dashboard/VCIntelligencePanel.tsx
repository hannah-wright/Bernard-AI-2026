import { Startup } from '@/types/startup';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Shield, 
  Globe, 
  Award,
  AlertTriangle,
  Target,
  Zap,
  Building2,
  GraduationCap,
  Briefcase,
  DollarSign,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VCIntelligencePanelProps {
  startup: Startup;
}

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
      <span className={cn('text-2xl font-bold rounded-full px-3 py-1 border', getScoreColor(score))}>
        {score}
      </span>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="h-4 w-4 text-muted-foreground" />
    <h4 className="text-sm font-medium">{title}</h4>
  </div>
);

const formatCurrency = (amount?: number) => {
  if (!amount) return null;
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

export const VCIntelligencePanel = ({ startup }: VCIntelligencePanelProps) => {
  const hasScores = startup.unicornProbability || startup.teamQualityScore || 
                   startup.productMarketFitScore || startup.investmentReadinessScore;
  
  const hasTeamData = startup.founderBackground?.founders?.length || 
                      startup.teamComposition?.total_employees;
  
  const hasTractionData = startup.tractionMetrics?.paying_customers || 
                          startup.tractionMetrics?.arr ||
                          startup.unitEconomics?.ltv_cac_ratio;
  
  const hasProductData = startup.productInfo?.stage || 
                         startup.defensibilitySignals?.proprietary_data !== undefined;
  
  const hasMarketData = startup.marketContext?.category_position || 
                        startup.competitiveLandscape?.direct_competitors?.length;
  
  const hasSocialData = startup.socialProof?.cap_table_quality || 
                        startup.socialProof?.notable_investors?.length;
  
  const hasRiskData = startup.riskFlags && (
    startup.riskFlags.lawsuits?.length ||
    startup.riskFlags.key_person_dependency ||
    startup.riskFlags.single_customer_dependency
  );

  const hasAnyData = hasScores || hasTeamData || hasTractionData || hasProductData || 
                     hasMarketData || hasSocialData || hasRiskData;

  if (!hasAnyData) {
    return (
      <div className="rounded-lg bg-secondary/30 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          VC intelligence data not yet available for this startup.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prior Exit Badge */}
      {startup.hasPriorExit && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-500">Founder with Successful Exit</span>
          </div>
          {startup.founderBackground?.founders?.some(f => f.prior_startups?.some(ps => ps.outcome === 'Acquired' || ps.outcome === 'IPO')) && (
            <div className="flex flex-wrap gap-1">
              {startup.founderBackground.founders
                .flatMap(f => f.prior_startups?.filter(ps => ps.outcome === 'Acquired' || ps.outcome === 'IPO') || [])
                .slice(0, 3)
                .map((exit, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-emerald-500/30 text-emerald-600">
                    {exit.name} ({exit.outcome})
                  </Badge>
                ))}
            </div>
          )}
        </div>
      )}

      {/* AI Scores */}
      {hasScores && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ScoreBadge score={startup.unicornProbability} label="Unicorn Probability" />
          <ScoreBadge score={startup.teamQualityScore} label="Team Quality" />
          <ScoreBadge score={startup.productMarketFitScore} label="PMF Score" />
          <ScoreBadge score={startup.investmentReadinessScore} label="Investment Ready" />
        </div>
      )}

      {/* Team Quality */}
      {hasTeamData && (
        <div>
          <SectionHeader icon={Users} title="Team & Founders" />
          <div className="space-y-3">
            {startup.founderBackground?.founders?.map((founder, idx) => (
              <div key={idx} className="rounded-lg bg-secondary/30 p-3">
                <p className="font-medium text-sm">{founder.name}</p>
                {founder.years_in_industry && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Briefcase className="h-3 w-3" />
                    {founder.years_in_industry} years in industry
                  </p>
                )}
                {founder.notable_employers?.length ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3" />
                    {founder.notable_employers.slice(0, 3).join(', ')}
                  </p>
                ) : null}
                {founder.education?.length ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
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
            {startup.teamComposition && (
              <div className="grid grid-cols-3 gap-2 text-center">
                {startup.teamComposition.total_employees && (
                  <div className="rounded-lg bg-secondary/30 p-2">
                    <p className="text-lg font-semibold">{startup.teamComposition.total_employees}</p>
                    <p className="text-xs text-muted-foreground">Total Team</p>
                  </div>
                )}
                {startup.teamComposition.engineering_count && (
                  <div className="rounded-lg bg-secondary/30 p-2">
                    <p className="text-lg font-semibold">{startup.teamComposition.engineering_count}</p>
                    <p className="text-xs text-muted-foreground">Engineering</p>
                  </div>
                )}
                {startup.teamComposition.sales_count && (
                  <div className="rounded-lg bg-secondary/30 p-2">
                    <p className="text-lg font-semibold">{startup.teamComposition.sales_count}</p>
                    <p className="text-xs text-muted-foreground">Sales</p>
                  </div>
                )}
              </div>
            )}
            {startup.teamComposition && (
              <div className="flex flex-wrap gap-1">
                {startup.teamComposition.has_cto && <Badge variant="secondary">Has CTO</Badge>}
                {startup.teamComposition.has_vp_sales && <Badge variant="secondary">Has VP Sales</Badge>}
                {startup.teamComposition.has_ciso && <Badge variant="secondary">Has CISO</Badge>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Traction & Unit Economics */}
      {hasTractionData && (
        <div>
          <SectionHeader icon={TrendingUp} title="Traction & Unit Economics" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {startup.tractionMetrics?.arr && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">ARR</p>
                <p className="font-semibold">{formatCurrency(startup.tractionMetrics.arr)}</p>
              </div>
            )}
            {startup.tractionMetrics?.paying_customers && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">Paying Customers</p>
                <p className="font-semibold">{startup.tractionMetrics.paying_customers}</p>
              </div>
            )}
            {startup.tractionMetrics?.net_revenue_retention_pct && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">NRR</p>
                <p className="font-semibold">{startup.tractionMetrics.net_revenue_retention_pct}%</p>
              </div>
            )}
            {startup.unitEconomics?.ltv_cac_ratio && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">LTV:CAC</p>
                <p className="font-semibold">{startup.unitEconomics.ltv_cac_ratio}x</p>
              </div>
            )}
            {startup.unitEconomics?.gross_margin_pct && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">Gross Margin</p>
                <p className="font-semibold">{startup.unitEconomics.gross_margin_pct}%</p>
              </div>
            )}
            {startup.unitEconomics?.runway_months && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">Runway</p>
                <p className="font-semibold">{startup.unitEconomics.runway_months} mo</p>
              </div>
            )}
          </div>
          {startup.tractionMetrics?.enterprise_logos?.length ? (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Enterprise Customers</p>
              <div className="flex flex-wrap gap-1">
                {startup.tractionMetrics.enterprise_logos.slice(0, 5).map((logo, i) => (
                  <Badge key={i} variant="outline">{logo}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Product & Defensibility */}
      {hasProductData && (
        <div>
          <SectionHeader icon={Shield} title="Product & Defensibility" />
          <div className="space-y-3">
            {startup.productInfo && (
              <div className="flex flex-wrap gap-2">
                {startup.productInfo.stage && (
                  <Badge variant="secondary">{startup.productInfo.stage}</Badge>
                )}
                {startup.productInfo.deployment_model && (
                  <Badge variant="outline">{startup.productInfo.deployment_model}</Badge>
                )}
                {startup.productInfo.ai_native && (
                  <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">AI Native</Badge>
                )}
              </div>
            )}
            {startup.defensibilitySignals && (
              <div className="grid grid-cols-2 gap-2">
                {startup.defensibilitySignals.proprietary_data && (
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="h-3 w-3 text-green-500" />
                    <span>Proprietary Data</span>
                  </div>
                )}
                {startup.defensibilitySignals.network_effects && (
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="h-3 w-3 text-green-500" />
                    <span>Network Effects</span>
                  </div>
                )}
                {startup.defensibilitySignals.patents_filed && (
                  <div className="flex items-center gap-2 text-xs">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <span>{startup.defensibilitySignals.patents_filed} Patents Filed</span>
                  </div>
                )}
                {startup.defensibilitySignals.switching_cost_level && (
                  <div className="flex items-center gap-2 text-xs">
                    <Target className="h-3 w-3" />
                    <span>{startup.defensibilitySignals.switching_cost_level} Switching Cost</span>
                  </div>
                )}
              </div>
            )}
            {startup.defensibilitySignals?.certifications?.length ? (
              <div className="flex flex-wrap gap-1">
                {startup.defensibilitySignals.certifications.map((cert, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Market Context */}
      {hasMarketData && (
        <div>
          <SectionHeader icon={Globe} title="Market & Competition" />
          <div className="space-y-3">
            {startup.marketContext?.category_position && (
              <Badge variant="secondary">{startup.marketContext.category_position}</Badge>
            )}
            {startup.marketContext?.tam_usd && (
              <p className="text-sm">
                <span className="text-muted-foreground">TAM:</span> {formatCurrency(startup.marketContext.tam_usd)}
              </p>
            )}
            {startup.competitiveLandscape?.direct_competitors?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Direct Competitors</p>
                <div className="flex flex-wrap gap-1">
                  {startup.competitiveLandscape.direct_competitors.slice(0, 4).map((comp, i) => (
                    <Badge key={i} variant="outline">{comp.name}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {startup.competitiveLandscape?.competitive_advantages?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Competitive Advantages</p>
                <ul className="text-xs space-y-1">
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

      {/* Social Proof */}
      {hasSocialData && (
        <div>
          <SectionHeader icon={Award} title="Social Proof" />
          <div className="space-y-3">
            {startup.socialProof?.cap_table_quality && (
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
            {startup.socialProof?.notable_investors?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notable Investors</p>
                <div className="flex flex-wrap gap-1">
                  {startup.socialProof.notable_investors.slice(0, 5).map((inv, i) => (
                    <Badge key={i} variant="secondary">{inv}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {startup.socialProof?.awards?.length ? (
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
      {hasRiskData && (
        <div>
          <SectionHeader icon={AlertTriangle} title="Risk Signals" />
          <div className="space-y-2">
            {startup.riskFlags?.key_person_dependency && (
              <div className="flex items-center gap-2 text-xs text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                <span>Key Person Dependency</span>
              </div>
            )}
            {startup.riskFlags?.single_customer_dependency && (
              <div className="flex items-center gap-2 text-xs text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                <span>Single Customer Dependency</span>
              </div>
            )}
            {startup.riskFlags?.lawsuits?.length ? (
              <div className="flex items-center gap-2 text-xs text-red-500">
                <AlertTriangle className="h-3 w-3" />
                <span>{startup.riskFlags.lawsuits.length} Active Lawsuit(s)</span>
              </div>
            ) : null}
            {startup.riskFlags?.leadership_changes?.length ? (
              <div className="flex items-center gap-2 text-xs text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                <span>Recent Leadership Changes</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
