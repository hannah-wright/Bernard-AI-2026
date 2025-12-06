/**
 * BernardAI API Service Layer
 * Centralizes all Supabase function invocations for better maintainability
 * and consistent error handling
 */

import { supabase } from '@/integrations/supabase/client';
import type { CreditAction } from '@/config/constants';

// ============================================================================
// Types
// ============================================================================

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

export interface SubscriptionData {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  subscriptionId: string | null;
}

export interface CreditDeductionResult {
  success: boolean;
  creditsDeducted?: number;
  creditsRemaining?: number;
  error?: string;
  creditsRequired?: number;
}

export interface CheckoutResult {
  url?: string;
  error?: string;
}

export interface InviteRedemptionResult {
  success: boolean;
  credits?: number;
  message?: string;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a fresh access token for API calls
 */
async function getFreshToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

/**
 * Create authorization headers for edge function calls
 */
function createAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

// ============================================================================
// Billing API
// ============================================================================

export const billingApi = {
  /**
   * Check current subscription status
   */
  async checkSubscription(): Promise<ApiResult<SubscriptionData>> {
    const token = await getFreshToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: createAuthHeaders(token),
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check subscription';
      return { data: null, error: message };
    }
  },

  /**
   * Create a Stripe checkout session
   */
  async createCheckout(priceId: string): Promise<ApiResult<CheckoutResult>> {
    const token = await getFreshToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: createAuthHeaders(token),
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout';
      return { data: null, error: message };
    }
  },

  /**
   * Open Stripe customer portal
   */
  async openCustomerPortal(): Promise<ApiResult<{ url: string }>> {
    const token = await getFreshToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: createAuthHeaders(token),
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open customer portal';
      return { data: null, error: message };
    }
  },

  /**
   * Purchase additional credits
   */
  async purchaseCredits(priceId: string, credits: number): Promise<ApiResult<CheckoutResult>> {
    const token = await getFreshToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { priceId, credits },
        headers: createAuthHeaders(token),
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to purchase credits';
      return { data: null, error: message };
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    action: 'cancel' | 'pause' | 'resume' | 'reactivate',
    reason?: string,
    feedback?: string
  ): Promise<ApiResult<{ success: boolean }>> {
    const token = await getFreshToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { action, reason, feedback },
        headers: createAuthHeaders(token),
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { data: { success: true }, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update subscription';
      return { data: null, error: message };
    }
  },

  /**
   * Upgrade subscription to new plan
   */
  async upgradeSubscription(newPriceId: string): Promise<ApiResult<{ success: boolean }>> {
    const token = await getFreshToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('upgrade-subscription', {
        body: { newPriceId },
        headers: createAuthHeaders(token),
      });

      if (error) throw error;
      return { data: { success: true }, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upgrade subscription';
      return { data: null, error: message };
    }
  },
};

// ============================================================================
// Credits API
// ============================================================================

export const creditsApi = {
  /**
   * Deduct credits for an action
   */
  async deductCredits(
    action: CreditAction,
    options?: { description?: string; resourceId?: string }
  ): Promise<ApiResult<CreditDeductionResult>> {
    const token = await getFreshToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('deduct-credits', {
        body: {
          action,
          description: options?.description,
          resourceId: options?.resourceId,
        },
        headers: createAuthHeaders(token),
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deduct credits';
      return { data: null, error: message };
    }
  },
};

// ============================================================================
// Invite API
// ============================================================================

export const inviteApi = {
  /**
   * Validate an invite code (without redeeming)
   */
  async validateInviteCode(code: string): Promise<ApiResult<{ valid: boolean; credits?: number }>> {
    try {
      const { data, error } = await supabase.rpc('check_invite_code', {
        code_to_check: code.toUpperCase(),
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: { valid: false }, error: null };
      }

      const inviteData = data[0];
      return {
        data: {
          valid: inviteData.is_valid,
          credits: inviteData.credits_granted,
        },
        error: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate invite code';
      return { data: null, error: message };
    }
  },

  /**
   * Redeem an invite code
   */
  async redeemInviteCode(code: string): Promise<ApiResult<InviteRedemptionResult>> {
    const token = await getFreshToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('redeem-invite', {
        body: { code },
        headers: createAuthHeaders(token),
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to redeem invite code';
      return { data: null, error: message };
    }
  },
};

// ============================================================================
// Startups API
// ============================================================================

export const startupsApi = {
  /**
   * Trigger a manual scrape of startups
   */
  async scrapeStartups(): Promise<ApiResult<{ stats: { saved_to_database: number } }>> {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-startups');
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scrape startups';
      return { data: null, error: message };
    }
  },
};

