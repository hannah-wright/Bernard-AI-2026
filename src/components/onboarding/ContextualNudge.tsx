/**
 * ContextualNudge Component
 * 
 * Shows one-time contextual tips to help users discover features.
 * Stores dismissed state in localStorage.
 */

import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextualNudgeProps {
  id: string; // Unique ID for localStorage
  children: React.ReactNode;
  tip: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  showOnce?: boolean; // Only show once ever (default true)
  delay?: number; // Delay before showing (ms)
}

const NUDGE_STORAGE_KEY = 'bernardai_nudges_dismissed';

function getDismissedNudges(): string[] {
  try {
    const stored = localStorage.getItem(NUDGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function dismissNudge(id: string) {
  const dismissed = getDismissedNudges();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify(dismissed));
  }
}

export const ContextualNudge = ({
  id,
  children,
  tip,
  position = 'bottom',
  className,
  showOnce = true,
  delay = 1000,
}: ContextualNudgeProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (showOnce) {
      const dismissed = getDismissedNudges();
      if (dismissed.includes(id)) {
        return;
      }
    }

    // Show after delay
    const timer = setTimeout(() => {
      setShouldShow(true);
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [id, showOnce, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (showOnce) {
      dismissNudge(id);
    }
  };

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-primary border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-primary border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-primary border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {children}
      
      {shouldShow && isVisible && (
        <div
          className={cn(
            "absolute z-50 w-64 animate-in fade-in-0 zoom-in-95",
            positionClasses[position]
          )}
        >
          <div className="bg-primary text-primary-foreground rounded-lg p-3 shadow-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{tip}</p>
              <button
                onClick={handleDismiss}
                className="shrink-0 hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-0 h-0 border-[6px]",
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
};

// Predefined nudges for common features
export const NUDGE_IDS = {
  FIRST_STARTUP_CLICK: 'first_startup_click',
  FIRST_FILTER_USE: 'first_filter_use',
  FIRST_LIST_VIEW: 'first_list_view',
  FIRST_VOTE: 'first_vote',
  UNICORN_FILTER: 'unicorn_filter',
  HIDDEN_GEM_FILTER: 'hidden_gem_filter',
  CREATE_ALERT: 'create_alert',
  INVITE_TEAM: 'invite_team',
} as const;

export const NUDGE_TIPS = {
  [NUDGE_IDS.FIRST_STARTUP_CLICK]: 'Add notes after meetings to remember key insights',
  [NUDGE_IDS.FIRST_FILTER_USE]: 'Save this filter to quickly access it later',
  [NUDGE_IDS.FIRST_LIST_VIEW]: 'Drag startups here from the discovery feed',
  [NUDGE_IDS.FIRST_VOTE]: "Your team's average vote becomes the Deal Score",
  [NUDGE_IDS.UNICORN_FILTER]: 'Try the 🦄 Unicorn Score filter to find high-potential deals',
  [NUDGE_IDS.HIDDEN_GEM_FILTER]: '💎 Hidden Gems are bootstrapped startups with strong signals but low visibility',
  [NUDGE_IDS.CREATE_ALERT]: 'Set up alerts to get notified when new startups match your criteria',
  [NUDGE_IDS.INVITE_TEAM]: 'Teams using BernardAI together review 47% more startups',
} as const;

// Helper to reset all nudges (for testing)
export function resetAllNudges() {
  localStorage.removeItem(NUDGE_STORAGE_KEY);
}

