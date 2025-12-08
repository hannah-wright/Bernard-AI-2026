/**
 * useCredits Hook
 * 
 * Manages credit-based operations for the application.
 * Uses centralized configuration from config/constants.ts.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useBilling } from '@/hooks/useBilling';
import { BILLING_CONFIG, hasUnlimitedCredits } from '@/config/billing';
import { ACTION_COSTS, CREDIT_THRESHOLDS, CreditAction } from '@/config/constants';
import { creditsApi } from '@/services/api';
import { toast } from 'sonner';

export const useCredits = () => {
  const { user } = useAuth();
  const { profile, updateCredits } = useProfile();
  const { subscription } = useBilling();
  
  // Refs to track toast/modal state within session
  const hasShownModalThisSession = useRef<boolean>(false);
  const hasShownCriticalToast = useRef<boolean>(false);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Derived values
  const credits = profile?.credits_remaining ?? 0;
  const unlimitedCredits = hasUnlimitedCredits(subscription.plan);
  const monthlyCredits = subscription.plan 
    ? BILLING_CONFIG.plans[subscription.plan].monthlyCredits 
    : 0;
  const percentRemaining = unlimitedCredits ? 100 : (monthlyCredits > 0 ? (credits / monthlyCredits) * 100 : 100);

  // -------------------------------------------------------------------------
  // Effects for credit warnings
  // -------------------------------------------------------------------------
  
  // Show upgrade modal when credits drop to low threshold
  useEffect(() => {
    if (!user || monthlyCredits === 0 || unlimitedCredits) return;
    if (hasShownModalThisSession.current) return;
    
    if (percentRemaining <= CREDIT_THRESHOLDS.lowPercentThreshold && credits > 0) {
      hasShownModalThisSession.current = true;
      setShowUpgradeModal(true);
    }
  }, [percentRemaining, credits, user, monthlyCredits, unlimitedCredits]);

  // Show critical toast when credits are very low
  useEffect(() => {
    if (!user || unlimitedCredits || credits === 0 || credits > CREDIT_THRESHOLDS.criticalThreshold) return;
    if (hasShownCriticalToast.current) return;
    
    hasShownCriticalToast.current = true;
    
    // Use setTimeout to avoid React strict mode double-invoke issues
    const timeoutId = setTimeout(() => {
      toast.warning(
        `Critical: Only ${credits} credits remaining!`,
        {
          description: 'Upgrade your plan or purchase credits to continue.',
          action: {
            label: 'Go to Billing',
            onClick: () => window.location.href = '/billing',
          },
          duration: 10000,
        }
      );
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [credits, user]);

  // -------------------------------------------------------------------------
  // Credit Operations
  // -------------------------------------------------------------------------

  /**
   * Check if user has enough credits for an action
   */
  const checkCredits = useCallback((action: CreditAction): boolean => {
    if (unlimitedCredits) return true;
    const cost = ACTION_COSTS[action];
    return credits >= cost;
  }, [credits, unlimitedCredits]);

  /**
   * Get the cost of an action
   */
  const getCost = useCallback((action: CreditAction): number => {
    return ACTION_COSTS[action];
  }, []);

  /**
   * Deduct credits for an action
   */
  const deductCredits = useCallback(async (
    action: CreditAction,
    options?: { description?: string; resourceId?: string }
  ): Promise<{ success: boolean; creditsRemaining?: number }> => {
    if (!user) {
      toast.error('Please sign in to continue');
      return { success: false };
    }

    // Scale plan users have unlimited credits - still track usage but don't deduct
    if (unlimitedCredits) {
      // Optionally track the action for analytics without deducting
      await creditsApi.deductCredits(action, { ...options, skipDeduction: true });
      return { success: true, creditsRemaining: -1 }; // -1 indicates unlimited
    }

    const cost = ACTION_COSTS[action];
    
    // Pre-check credits locally to avoid unnecessary API calls
    if (credits < cost) {
      toast.error('Insufficient credits', {
        description: `This action requires ${cost} credit${cost > 1 ? 's' : ''}. You have ${credits}.`,
        action: {
          label: 'Get Credits',
          onClick: () => window.location.href = '/billing',
        },
        duration: 8000,
      });
      return { success: false };
    }

    // Use centralized API service
    const result = await creditsApi.deductCredits(action, options);
    
    if (result.error) {
      // If Edge Function fails, allow action but log the error
      // This prevents blocking users when there's a temporary server issue
      console.warn('Credit deduction API error:', result.error);
      
      // For trial/free users, be lenient - allow the action
      // Credits will be reconciled on next successful call
      if (subscription.plan === 'trial' || subscription.plan === 'free' || !subscription.plan) {
        // Optimistically deduct locally
        updateCredits(Math.max(0, credits - cost));
        return { success: true, creditsRemaining: credits - cost };
      }
      
      toast.error('Failed to process action. Please try again.');
      return { success: false };
    }

    const data = result.data;
    
    if (!data) {
      // Same fallback for missing data
      if (subscription.plan === 'trial' || subscription.plan === 'free' || !subscription.plan) {
        updateCredits(Math.max(0, credits - cost));
        return { success: true, creditsRemaining: credits - cost };
      }
      return { success: false };
    }

    if (data.success) {
      // Fast update: use returned credits directly instead of full profile refetch
      const remaining = data.creditsRemaining ?? 0;
      updateCredits(remaining);
      
      // Mark critical as shown if we're now at critical level
      if (remaining <= CREDIT_THRESHOLDS.criticalThreshold && remaining > 0) {
        hasShownCriticalToast.current = true;
      }
      
      return { success: true, creditsRemaining: remaining };
    }
    
    if (data.error === 'insufficient_credits') {
      toast.error('Insufficient credits', {
        description: `You need ${data.creditsRequired} credits but only have ${data.creditsRemaining}.`,
        action: {
          label: 'Upgrade Plan',
          onClick: () => window.location.href = '/billing',
        },
      });
      return { success: false };
    }

    return { success: false };
  }, [user, credits, unlimitedCredits, updateCredits, subscription.plan]);

  // -------------------------------------------------------------------------
  // Return API
  // -------------------------------------------------------------------------
  
  return {
    // Current state
    credits,
    monthlyCredits,
    percentRemaining,
    currentPlan: subscription.plan,
    unlimitedCredits,
    
    // Status flags
    isLow: !unlimitedCredits && percentRemaining <= CREDIT_THRESHOLDS.lowPercentThreshold,
    isCritical: !unlimitedCredits && credits <= CREDIT_THRESHOLDS.criticalThreshold,
    
    // Operations
    checkCredits,
    getCost,
    deductCredits,
    
    // Modal state
    showUpgradeModal,
    setShowUpgradeModal,
  };
};

// Re-export CreditAction type for convenience
export type { CreditAction };
