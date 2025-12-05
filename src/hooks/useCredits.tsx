import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useBilling } from '@/hooks/useBilling';
import { BILLING_CONFIG } from '@/config/billing';
import { toast } from 'sonner';

type CreditAction = 'view_startup_details' | 'export_csv' | 'api_call';

const ACTION_COSTS: Record<CreditAction, number> = {
  view_startup_details: 1,
  export_csv: 5,
  api_call: 1,
};

// Thresholds for warnings
const LOW_CREDIT_PERCENT_THRESHOLD = 20; // Show modal at 20%
const CRITICAL_CREDIT_THRESHOLD = 10;

export const useCredits = () => {
  const { session, user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const { subscription } = useBilling();
  const hasShownModalThisSession = useRef<boolean>(false);
  const hasShownCriticalToast = useRef<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const credits = profile?.credits_remaining ?? 0;
  const monthlyCredits = subscription.plan 
    ? BILLING_CONFIG.plans[subscription.plan].monthlyCredits 
    : 0;
  
  const percentRemaining = monthlyCredits > 0 ? (credits / monthlyCredits) * 100 : 100;

  // Check and show upgrade modal at 20% or below
  useEffect(() => {
    if (!user || monthlyCredits === 0) return;
    
    // Only show modal once per session when crossing 20% threshold
    if (hasShownModalThisSession.current) return;
    
    if (percentRemaining <= LOW_CREDIT_PERCENT_THRESHOLD && credits > 0) {
      hasShownModalThisSession.current = true;
      setShowUpgradeModal(true);
    }
  }, [percentRemaining, credits, user, monthlyCredits]);

  // Show critical toast separately - only once per session
  useEffect(() => {
    if (!user || credits === 0) return;
    if (hasShownCriticalToast.current) return;
    
    if (credits <= CRITICAL_CREDIT_THRESHOLD && credits > 0) {
      hasShownCriticalToast.current = true;
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
    }
  }, [credits, user]);

  // Mark critical toast as shown if deduction results in critical level
  const markCriticalShown = useCallback(() => {
    hasShownCriticalToast.current = true;
  }, []);

  const checkCredits = useCallback((action: CreditAction): boolean => {
    const cost = ACTION_COSTS[action];
    return credits >= cost;
  }, [credits]);

  const deductCredits = useCallback(async (
    action: CreditAction,
    options?: { description?: string; resourceId?: string }
  ): Promise<{ success: boolean; creditsRemaining?: number }> => {
    if (!session?.access_token) {
      toast.error('Please sign in to continue');
      return { success: false };
    }

    const cost = ACTION_COSTS[action];
    
    // Check if user has enough credits
    if (credits < cost) {
      toast.error(
        `Insufficient credits`,
        {
          description: `This action requires ${cost} credit${cost > 1 ? 's' : ''}. You have ${credits}.`,
          action: {
            label: 'Get Credits',
            onClick: () => window.location.href = '/billing',
          },
          duration: 8000,
        }
      );
      return { success: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('deduct-credits', {
        body: {
          action,
          description: options?.description,
          resourceId: options?.resourceId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Refresh profile to update credit display
        await refreshProfile();
        
        // Check for low credits after deduction - only show if not already shown this session
        const remaining = data.creditsRemaining;
        if (remaining <= CRITICAL_CREDIT_THRESHOLD && remaining > 0 && !hasShownCriticalToast.current) {
          hasShownCriticalToast.current = true;
          toast.warning(
            `Only ${remaining} credits left!`,
            {
              description: 'Running low on credits.',
              action: {
                label: 'Get More',
                onClick: () => window.location.href = '/billing',
              },
            }
          );
        }
        
        return { success: true, creditsRemaining: remaining };
      } else if (data.error === 'insufficient_credits') {
        toast.error(
          'Insufficient credits',
          {
            description: `You need ${data.creditsRequired} credits but only have ${data.creditsRemaining}.`,
            action: {
              label: 'Upgrade Plan',
              onClick: () => window.location.href = '/billing',
            },
          }
        );
        return { success: false };
      }

      return { success: false };
    } catch (error) {
      console.error('Error deducting credits:', error);
      toast.error('Failed to process action');
      return { success: false };
    }
  }, [session?.access_token, credits, refreshProfile]);

  const getCost = useCallback((action: CreditAction): number => {
    return ACTION_COSTS[action];
  }, []);

  return {
    credits,
    monthlyCredits,
    checkCredits,
    deductCredits,
    getCost,
    percentRemaining,
    isLow: percentRemaining <= LOW_CREDIT_PERCENT_THRESHOLD,
    isCritical: credits <= CRITICAL_CREDIT_THRESHOLD,
    showUpgradeModal,
    setShowUpgradeModal,
    currentPlan: subscription.plan,
  };
};
