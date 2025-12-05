import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BILLING_CONFIG, getPlanByProductId, PlanKey } from '@/config/billing';
import { toast } from 'sonner';

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  subscriptionId: string | null;
  plan: PlanKey | null;
  isAnnual: boolean;
}

interface BillingContextType {
  subscription: SubscriptionState;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  createCheckout: (priceId: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  purchaseCredits: (priceId: string, credits: number) => Promise<void>;
  cancelSubscription: (reason: string, feedback?: string) => Promise<void>;
  pauseSubscription: (reason: string) => Promise<void>;
  resumeSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  upgradeSubscription: (newPriceId: string) => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

const defaultSubscription: SubscriptionState = {
  subscribed: false,
  productId: null,
  priceId: null,
  subscriptionEnd: null,
  subscriptionStatus: null,
  cancelAtPeriodEnd: false,
  currentPeriodStart: null,
  subscriptionId: null,
  plan: null,
  isAnnual: false,
};

export const BillingProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [loading, setLoading] = useState(false);

  const refreshSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscription(defaultSubscription);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const planInfo = data.productId ? getPlanByProductId(data.productId) : null;

      setSubscription({
        subscribed: data.subscribed,
        productId: data.productId,
        priceId: data.priceId,
        subscriptionEnd: data.subscriptionEnd,
        subscriptionStatus: data.subscriptionStatus,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        currentPeriodStart: data.currentPeriodStart,
        subscriptionId: data.subscriptionId,
        plan: planInfo?.plan || null,
        isAnnual: planInfo?.isAnnual || false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      setSubscription(defaultSubscription);
    }
  }, [user, refreshSubscription]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, refreshSubscription]);

  const createCheckout = async (priceId: string) => {
    if (!session?.access_token) {
      toast.error('Please sign in to subscribe');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout');
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open billing portal');
    }
  };

  const purchaseCredits = async (priceId: string, credits: number) => {
    if (!session?.access_token) {
      toast.error('Please sign in');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { priceId, credits },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast.error('Failed to start credit purchase');
    }
  };

  const cancelSubscription = async (reason: string, feedback?: string) => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { action: 'cancel', reason, feedback },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Cancel response:', { data, error });

      // Check for invocation error
      if (error) throw error;
      
      // Check for error in response body
      if (data?.error) throw new Error(data.error);
      
      // Success
      toast.success('Subscription will be cancelled at the end of the billing period');
      await refreshSubscription();
    } catch (error: unknown) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
      await refreshSubscription();
    }
  };

  const pauseSubscription = async (reason: string) => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { action: 'pause', reason },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success('Subscription paused');
      await refreshSubscription();
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast.error('Failed to pause subscription');
      await refreshSubscription();
    }
  };

  const resumeSubscription = async () => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { action: 'resume' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success('Subscription resumed');
      await refreshSubscription();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error('Failed to resume subscription');
      await refreshSubscription();
    }
  };

  const reactivateSubscription = async () => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { action: 'reactivate' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Reactivate response:', { data, error });

      // Check for invocation error
      if (error) throw error;
      
      // Check for error in response body
      if (data?.error) throw new Error(data.error);
      
      // Success
      toast.success('Subscription reactivated!');
      await refreshSubscription();
    } catch (error: unknown) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate subscription');
      await refreshSubscription();
    }
  };

  const upgradeSubscription = async (newPriceId: string) => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('upgrade-subscription', {
        body: { newPriceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      toast.success('Plan updated successfully');
      await refreshSubscription();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to update plan');
    }
  };

  return (
    <BillingContext.Provider
      value={{
        subscription,
        loading,
        refreshSubscription,
        createCheckout,
        openCustomerPortal,
        purchaseCredits,
        cancelSubscription,
        pauseSubscription,
        resumeSubscription,
        reactivateSubscription,
        upgradeSubscription,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};
