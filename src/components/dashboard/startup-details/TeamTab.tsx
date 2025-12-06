/**
 * Team Tab Content for Startup Detail Dialog
 */

import { Building2, GraduationCap, Briefcase, AlertTriangle, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SectionTitle } from './shared';
import type { StartupDetailTabProps } from './types';

export const TeamTab = ({ startup }: StartupDetailTabProps) => {
  const hasTeamData = startup.founderBackground?.founders?.length || startup.teamComposition;

  return (
    <div className="space-y-6 mt-4">
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

      {!hasTeamData && (
        <div className="rounded-lg bg-secondary/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">Team data not yet available for this startup.</p>
        </div>
      )}
    </div>
  );
};

