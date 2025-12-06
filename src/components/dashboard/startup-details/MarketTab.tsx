/**
 * Market Tab Content for Startup Detail Dialog
 */

import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { methodologyText, DataLabel } from '../DataMethodologyTooltips';
import { SectionTitle } from './shared';
import type { StartupDetailTabProps } from './types';

export const MarketTab = ({ startup }: StartupDetailTabProps) => {
  const hasMarketData = startup.marketContext || startup.competitiveLandscape || startup.tractionMetrics;

  return (
    <div className="space-y-6 mt-4">
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
          <SectionTitle tooltip="Traction data derived from public disclosures, news, and AI analysis. Figures are estimates unless verified.">
            Traction & Unit Economics
          </SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {startup.tractionMetrics?.arr && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <DataLabel label="ARR" isEstimated tooltip={methodologyText.arr} />
                <p className="font-semibold text-foreground/80">{formatCurrency(startup.tractionMetrics.arr)}</p>
              </div>
            )}
            {startup.tractionMetrics?.paying_customers && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <DataLabel label="Paying Customers" isEstimated tooltip={methodologyText.payingCustomers} />
                <p className="font-semibold text-foreground/80">{startup.tractionMetrics.paying_customers}</p>
              </div>
            )}
            {startup.tractionMetrics?.net_revenue_retention_pct && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <DataLabel label="NRR" isEstimated tooltip={methodologyText.nrr} />
                <p className="font-semibold text-foreground/80">{startup.tractionMetrics.net_revenue_retention_pct}%</p>
              </div>
            )}
            {startup.unitEconomics?.ltv_cac_ratio && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <DataLabel label="LTV:CAC" isEstimated tooltip={methodologyText.ltvCac} />
                <p className="font-semibold text-foreground/80">{startup.unitEconomics.ltv_cac_ratio}x</p>
              </div>
            )}
            {startup.unitEconomics?.gross_margin_pct && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <DataLabel label="Gross Margin" isEstimated tooltip={methodologyText.grossMargin} />
                <p className="font-semibold text-foreground/80">{startup.unitEconomics.gross_margin_pct}%</p>
              </div>
            )}
            {startup.unitEconomics?.runway_months && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <DataLabel label="Runway" isEstimated tooltip={methodologyText.runway} />
                <p className="font-semibold text-foreground/80">{startup.unitEconomics.runway_months} mo</p>
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

      {!hasMarketData && (
        <div className="rounded-lg bg-secondary/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">Market data not yet available for this startup.</p>
        </div>
      )}
    </div>
  );
};

