/**
 * Shared UI components for startup detail tabs
 */

import { cn } from '@/lib/utils';
import { MethodologyTooltip } from '../DataMethodologyTooltips';

interface SectionTitleProps {
  children: React.ReactNode;
  tooltip?: string;
}

export const SectionTitle = ({ children, tooltip }: SectionTitleProps) => (
  <div className="flex items-center gap-2 mb-3">
    <h3 className="text-base font-semibold text-foreground">{children}</h3>
    {tooltip && <MethodologyTooltip text={tooltip} />}
  </div>
);

interface ScoreBadgeProps {
  score?: number;
  label: string;
  tooltip?: string;
}

export const ScoreBadge = ({ score, label, tooltip }: ScoreBadgeProps) => {
  if (score === undefined) return null;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (s >= 60) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    if (s >= 40) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-secondary/30 border border-border relative">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {tooltip && <MethodologyTooltip text={tooltip} />}
      </div>
      <span className={cn('text-xl font-bold rounded-full px-3 py-1 border', getScoreColor(score))}>
        {score}
      </span>
    </div>
  );
};

