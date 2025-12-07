import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  credits_remaining: number;
  subscription_tier: string | null;
  // Onboarding fields
  onboarding_completed_at: string | null;
  onboarding_step: number;
  onboarding_data: Record<string, any> | null;
  role: string | null;
  investment_sectors: string[] | null;
  investment_stages: string[] | null;
  investment_geos: string[] | null;
  organization_id: string | null;
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  transactions: CreditTransaction[];
  refreshProfile: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  updateCredits: (newCredits: number) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          credits_remaining: data.credits_remaining ?? 0,
          subscription_tier: data.subscription_tier,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user]);

  // Fast credit update without full profile refetch
  const updateCredits = useCallback((newCredits: number) => {
    setProfile(prev => prev ? { ...prev, credits_remaining: newCredits } : null);
  }, []);

  useEffect(() => {
    if (user) {
      refreshProfile();
    } else {
      setProfile(null);
      setTransactions([]);
    }
  }, [user, refreshProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, transactions, refreshProfile, fetchTransactions, updateCredits }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
