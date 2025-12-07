/**
 * Team Tab Content for Startup Detail Dialog
 */

import { Building2, GraduationCap, Briefcase, AlertTriangle, Award, TrendingUp, Users, Star, Rocket, DollarSign, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SectionTitle, ScoreBadge } from './shared';
import type { StartupDetailTabProps } from './types';
import { formatCurrency } from '@/lib/formatters';

export const TeamTab = ({ startup }: StartupDetailTabProps) => {
  const hasTeamData = startup.founderBackground?.founders?.length || startup.teamComposition;

  // Calculate hiring velocity label
  const getHiringVelocityLabel = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return { label: 'Explosive Growth', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' };
    if (score >= 60) return { label: 'Strong Hiring', color: 'text-green-500', bgColor: 'bg-green-500/10' };
    if (score >= 40) return { label: 'Moderate Growth', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
    if (score >= 20) return { label: 'Stable', color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
    return { label: 'Declining', color: 'text-red-500', bgColor: 'bg-red-500/10' };
  };

  // Calculate founding team signal label
  const getTeamSignalLabel = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return { label: 'Exceptional', color: 'text-emerald-500', icon: Crown };
    if (score >= 60) return { label: 'Strong', color: 'text-green-500', icon: Star };
    if (score >= 40) return { label: 'Good', color: 'text-yellow-500', icon: Users };
    return { label: 'Average', color: 'text-muted-foreground', icon: Users };
  };

  const hiringVelocity = getHiringVelocityLabel(startup.hiringVelocityScore);
  const teamSignal = getTeamSignalLabel(startup.foundingTeamSignal?.score);

  return (
    <div className="space-y-6 mt-4">
      {/* Founding Team Signal Profile - NEW */}
      {startup.foundingTeamSignal && (
        <div>
          <SectionTitle tooltip="Composite score based on prior exits, FAANG experience, network strength, and team dynamics. Higher scores correlate with better outcomes.">
            Founding Team Signal
          </SectionTitle>
          <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4 space-y-4">
            {/* Main Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {teamSignal && <teamSignal.icon className={cn("h-6 w-6", teamSignal.color)} />}
                <div>
                  <p className="font-semibold text-lg">{teamSignal?.label || 'Team Signal'}</p>
                  <p className="text-xs text-muted-foreground">Founder quality composite score</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">{startup.foundingTeamSignal.score}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
            
            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
              {startup.hasPriorExit && (
                <div className="flex items-center gap-2 text-sm">
                  <Rocket className="h-4 w-4 text-emerald-500" />
                  <span>Prior Exit</span>
                  <Badge variant="secondary" className="text-xs">+30</Badge>
                </div>
              )}
              {startup.hasFaangAlumni && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>Ex-FAANG</span>
                  <Badge variant="secondary" className="text-xs">+20</Badge>
                </div>
              )}
              {startup.cofoundersWorkedTogetherBefore && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Worked Together</span>
                  <Badge variant="secondary" className="text-xs">+15</Badge>
                </div>
              )}
              {startup.foundingTeamSignal.structureType && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="capitalize">{startup.foundingTeamSignal.structureType.replace(/-/g, ' ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prior Exit Details - Enhanced */}
      {startup.hasPriorExit && startup.priorExits && startup.priorExits.length > 0 && (
        <div>
          <SectionTitle>Prior Exit Details</SectionTitle>
          <div className="space-y-2">
            {startup.priorExits.map((exit, idx) => (
              <div key={idx} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">{exit.company_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exit.exit_type === 'acquisition' && exit.acquirer ? `Acquired by ${exit.acquirer}` : 
                       exit.exit_type === 'ipo' ? 'IPO' : 'Exit'}
                      {exit.exit_year && ` (${exit.exit_year})`}
                    </p>
                    {exit.founder_role && (
                      <p className="text-xs text-muted-foreground mt-1">Role: {exit.founder_role}</p>
                    )}
                  </div>
                  {exit.exit_amount && (
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatCurrency(exit.exit_amount)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prior IPO Details - NEW */}
      {startup.hasPriorIPO && startup.priorIPODetails && (
        <div>
          <SectionTitle>Prior IPO Experience</SectionTitle>
          <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-purple-600 dark:text-purple-400">{startup.priorIPODetails.company_name}</p>
                {startup.priorIPODetails.ticker_symbol && (
                  <p className="text-sm font-mono text-muted-foreground">{startup.priorIPODetails.ticker_symbol}</p>
                )}
                {startup.priorIPODetails.ipo_year && (
                  <p className="text-sm text-muted-foreground">IPO Year: {startup.priorIPODetails.ipo_year}</p>
                )}
                {startup.priorIPODetails.founder_role && (
                  <p className="text-xs text-muted-foreground mt-1">Role: {startup.priorIPODetails.founder_role}</p>
                )}
              </div>
              {startup.priorIPODetails.market_cap_at_ipo && (
                <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">
                  Market Cap: {formatCurrency(startup.priorIPODetails.market_cap_at_ipo)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hiring Velocity - NEW */}
      {(startup.hiringVelocityScore || startup.headcountGrowth) && (
        <div>
          <SectionTitle tooltip="Hiring velocity is a strong signal for startups. Rapid engineering hiring often indicates product-market fit and growth.">
            Hiring Velocity
          </SectionTitle>
          <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
            {/* Velocity Score */}
            {startup.hiringVelocityScore && hiringVelocity && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className={cn("h-5 w-5", hiringVelocity.color)} />
                  <span className={cn("font-medium", hiringVelocity.color)}>{hiringVelocity.label}</span>
                </div>
                <Badge className={cn(hiringVelocity.bgColor, hiringVelocity.color, "border-0")}>
                  {startup.hiringVelocityScore}/100
                </Badge>
              </div>
            )}
            
            {/* Headcount Details */}
            {startup.headcountGrowth && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                <div className="rounded-lg bg-secondary/30 p-3 text-center">
                  <p className="text-xl font-semibold">{startup.headcountGrowth.current}</p>
                  <p className="text-xs text-muted-foreground">Current Headcount</p>
                </div>
                {startup.headcountGrowth.engineeringCurrent && (
                  <div className="rounded-lg bg-blue-500/10 p-3 text-center">
                    <p className="text-xl font-semibold text-blue-500">{startup.headcountGrowth.engineeringCurrent}</p>
                    <p className="text-xs text-muted-foreground">Engineering</p>
                  </div>
                )}
                {startup.headcountGrowth.sixMonthsAgo && (
                  <div className="col-span-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">6 months ago</span>
                    <span>{startup.headcountGrowth.sixMonthsAgo} employees</span>
                    {startup.headcountGrowth.current && startup.headcountGrowth.sixMonthsAgo && (
                      <Badge variant="secondary" className="text-xs">
                        +{Math.round(((startup.headcountGrowth.current - startup.headcountGrowth.sixMonthsAgo) / startup.headcountGrowth.sixMonthsAgo) * 100)}%
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Founders */}
      {startup.founderBackground?.founders?.length ? (
        <div>
          <SectionTitle>Founders</SectionTitle>
          <div className="space-y-3">
            {startup.founderBackground.founders.map((founder, idx) => (
              <div key={idx} className="rounded-lg bg-secondary/30 p-4">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-foreground">{founder.name}</p>
                  {founder.role && (
                    <Badge variant="outline" className="text-xs">{founder.role}</Badge>
                  )}
                </div>
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

      {!hasTeamData && (
        <div className="rounded-lg bg-secondary/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">Team data not yet available for this startup.</p>
        </div>
      )}
    </div>
  );
};

