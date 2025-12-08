/**
 * Predictive AI Tab Content for Startup Detail Dialog
 */

import { Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { methodologyText, DataLabel } from '../DataMethodologyTooltips';
import { ConfidenceBadge } from '../ConfidenceBadge';
import { SectionTitle, ScoreBadge } from './shared';
import type { StartupDetailTabProps } from './types';
import type { ConfidenceLevel } from '@/types/startup';
import { cn } from '@/lib/utils';

export const PredictiveTab = ({ startup }: StartupDetailTabProps) => {
  // Calculate highest confidence from data sources
  const highestConfidence = startup.dataSources.reduce((highest, source) => {
    const order: Record<ConfidenceLevel, number> = { verified: 4, high: 3, medium: 2, low: 1 };
    return order[source.confidence] > order[highest] ? source.confidence : highest;
  }, 'low' as ConfidenceLevel);

  // Use unicornLikelihoodScore (new) or fall back to unicornProbability (old)
  const unicornScore = startup.unicornLikelihoodScore ?? startup.unicornProbability;
  const hasAiScores = unicornScore || startup.teamQualityScore || 
                       startup.productMarketFitScore || startup.investmentReadinessScore ||
                       startup.foundingTeamSignal?.score || startup.hiringVelocityScore;

  return (
    <div className="space-y-6 mt-4">
      {/* Unicorn Likelihood - Featured */}
      {unicornScore && (
        <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Unicorn Likelihood Score
              </p>
              <p className="text-xs text-muted-foreground">Based on traction, market size, founder pedigree, and backer track record</p>
            </div>
            <div className="text-right">
              <span className={cn(
                "text-4xl font-bold",
                unicornScore >= 90 ? "text-amber-500" :
                unicornScore >= 70 ? "text-emerald-500" :
                unicornScore >= 50 ? "text-blue-500" : "text-muted-foreground"
              )}>
                {unicornScore}
              </span>
              <span className="text-lg text-muted-foreground">/100</span>
              {startup.is10xBet && (
                <p className="text-xs text-amber-500 font-medium mt-1">⭐ 10x Bet Candidate</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other AI Scores */}
      {(startup.teamQualityScore || startup.productMarketFitScore || startup.investmentReadinessScore) && (
        <div>
          <SectionTitle tooltip="AI-generated scores based on analysis of public data. These are predictive estimates, not guarantees.">
            Additional Scores
          </SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
          <div className={cn(
            "rounded-lg p-3",
            startup.metrics.revenueConfidence === 'verified' 
              ? "bg-emerald-500/10 border border-emerald-500/20" 
              : "bg-secondary/30"
          )}>
            <DataLabel 
              label={startup.metrics.revenueConfidence === 'verified' ? "Revenue ✓ Verified" : "Revenue (Estimated)"} 
              isEstimated={startup.metrics.revenueConfidence !== 'verified'} 
              tooltip={
                startup.metrics.revenueConfidence === 'verified'
                  ? `Source: ${startup.metrics.revenueSource || 'Public disclosure'}`
                  : methodologyText.estimatedRevenue
              } 
            />
            <p className={cn(
              "font-medium",
              startup.metrics.revenueConfidence === 'verified' 
                ? "text-emerald-600 dark:text-emerald-400 text-lg" 
                : "text-foreground/80"
            )}>
              {startup.metrics.estimatedRevenue || 'N/A'}
            </p>
            {startup.metrics.revenueSource && (
              <p className={cn(
                "text-xs mt-1",
                startup.metrics.revenueConfidence === 'verified'
                  ? "text-emerald-600/80 dark:text-emerald-400/80 font-medium"
                  : "text-muted-foreground truncate"
              )} title={startup.metrics.revenueSource}>
                {startup.metrics.revenueConfidence === 'verified' ? '📰 ' : ''}{startup.metrics.revenueSource}
              </p>
            )}
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
        <div className="rounded-lg bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 p-4">
          <div className="flex items-center gap-3">
            <ConfidenceBadge level={highestConfidence} />
            <span className="text-sm font-medium">
              Verified by {startup.dataSources.length} data source{startup.dataSources.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

