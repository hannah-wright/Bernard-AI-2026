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
import { BILLING_CONFIG } from '@/config/billing';
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
  const monthlyCredits = subscription.plan 
    ? BILLING_CONFIG.plans[subscription.plan].monthlyCredits 
    : 0;
  const percentRemaining = monthlyCredits > 0 ? (credits / monthlyCredits) * 100 : 100;

  // -------------------------------------------------------------------------
  // Effects for credit warnings
  // -------------------------------------------------------------------------
  
  // Show upgrade modal when credits drop to low threshold
  useEffect(() => {
    if (!user || monthlyCredits === 0) return;
    if (hasShownModalThisSession.current) return;
    
    if (percentRemaining <= CREDIT_THRESHOLDS.lowPercentThreshold && credits > 0) {
      hasShownModalThisSession.current = true;
      setShowUpgradeModal(true);
    }
  }, [percentRemaining, credits, user, monthlyCredits]);

  // Show critical toast when credits are very low
  useEffect(() => {
    if (!user || credits === 0 || credits > CREDIT_THRESHOLDS.criticalThreshold) return;
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
    const cost = ACTION_COSTS[action];
    return credits >= cost;
  }, [credits]);

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
      toast.error('Failed to process action');
      return { success: false };
    }

    const data = result.data;
    
    if (!data) {
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
  }, [user, credits, updateCredits]);

  // -------------------------------------------------------------------------
  // Return API
  // -------------------------------------------------------------------------
  
  return {
    // Current state
    credits,
    monthlyCredits,
    percentRemaining,
    currentPlan: subscription.plan,
    
    // Status flags
    isLow: percentRemaining <= CREDIT_THRESHOLDS.lowPercentThreshold,
    isCritical: credits <= CREDIT_THRESHOLDS.criticalThreshold,
    
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
