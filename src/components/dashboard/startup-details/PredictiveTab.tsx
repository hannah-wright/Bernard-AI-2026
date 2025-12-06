/**
 * Predictive AI Tab Content for Startup Detail Dialog
 */

import { DollarSign, Users, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { methodologyText, DataLabel } from '../DataMethodologyTooltips';
import { ConfidenceBadge } from '../ConfidenceBadge';
import { SectionTitle, ScoreBadge } from './shared';
import type { StartupDetailTabProps } from './types';
import type { ConfidenceLevel } from '@/types/startup';

export const PredictiveTab = ({ startup }: StartupDetailTabProps) => {
  // Calculate highest confidence from data sources
  const highestConfidence = startup.dataSources.reduce((highest, source) => {
    const order: Record<ConfidenceLevel, number> = { verified: 4, high: 3, medium: 2, low: 1 };
    return order[source.confidence] > order[highest] ? source.confidence : highest;
  }, 'low' as ConfidenceLevel);

  const hasAiScores = startup.unicornProbability || startup.teamQualityScore || 
                       startup.productMarketFitScore || startup.investmentReadinessScore;

  return (
    <div className="space-y-6 mt-4">
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
      {hasAiScores && (
        <div>
          <SectionTitle tooltip="AI-generated scores based on analysis of public data. These are predictive estimates, not guarantees.">
            AI Scores
          </SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ScoreBadge 
              score={startup.unicornProbability} 
              label="Unicorn Prob." 
              tooltip={methodologyText.unicornProbability.detail} 
            />
            <ScoreBadge 
              score={startup.teamQualityScore} 
              label="Team Quality" 
              tooltip={methodologyText.teamQuality.detail} 
            />
            <ScoreBadge 
              score={startup.productMarketFitScore} 
              label="PMF Score" 
              tooltip={methodologyText.pmfScore.detail} 
            />
            <ScoreBadge 
              score={startup.investmentReadinessScore} 
              label="Investment Ready" 
              tooltip={methodologyText.investmentReadiness.detail} 
            />
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
        <SectionTitle tooltip="Metrics derived from public sources and AI analysis. Actual figures may vary.">
          Key Metrics
        </SectionTitle>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-secondary/30 p-3">
            <DataLabel label="Revenue" isEstimated tooltip={methodologyText.estimatedRevenue} />
            <p className="font-medium text-foreground/80">{startup.metrics.estimatedRevenue || 'N/A'}</p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-3">
            <DataLabel label="Team Size" isEstimated tooltip={methodologyText.estimatedSize} />
            <p className="font-medium text-foreground/80">{startup.metrics.estimatedSize || 'N/A'}</p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-3">
            <DataLabel label="Buzz Score" isEstimated tooltip={methodologyText.buzzScore} />
            <p className="font-medium text-foreground/80">{startup.metrics.buzzScore}/100</p>
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
    </div>
  );
};

