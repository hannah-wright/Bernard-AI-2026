/**
 * useThesisProfiles Hook
 * 
 * Manages saved investment thesis profiles (filter combinations).
 * Premium feature with limits based on subscription plan.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBilling } from '@/hooks/useBilling';
import { FilterState } from '@/types/startup';
import { BILLING_CONFIG, TRIAL_CONFIG } from '@/config/billing';
import { toast } from 'sonner';

export interface ThesisProfile {
  id: string;
  userId: string;
  name: string;
  description?: string;
  filters: FilterState;
  isDefault: boolean;
  color: string;
  icon: string;
  matchCount?: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseThesisProfile {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  filters: FilterState;
  is_default: boolean;
  color: string;
  icon: string;
  match_count: number | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// Transform database record to ThesisProfile
function transformProfile(db: DatabaseThesisProfile): ThesisProfile {
  return {
    id: db.id,
    userId: db.user_id,
    name: db.name,
    description: db.description || undefined,
    filters: db.filters,
    isDefault: db.is_default,
    color: db.color,
    icon: db.icon,
    matchCount: db.match_count || undefined,
    lastUsedAt: db.last_used_at || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function useThesisProfiles() {
  const { user } = useAuth();
  const { subscription } = useBilling();
  const queryClient = useQueryClient();

  // Determine saved filters limit based on plan
  // Free/Trial/Starter: 0, Growth: 3, Scale: unlimited
  const getSavedFiltersLimit = (): number => {
    if (!subscription.plan) {
      return 0; // Free/Trial: no saved filters
    }
    const planConfig = BILLING_CONFIG.plans[subscription.plan];
    return planConfig?.savedFilters ?? 0;
  };

  const limit = getSavedFiltersLimit();
  const isUnlimited = limit === -1;

  // Check if user can save more profiles
  const canSaveMore = (currentCount: number): boolean => {
    if (limit === 0) return false; // Feature not available
    if (isUnlimited) return true;
    return currentCount < limit;
  };

  // Check if this is a premium feature for current plan (Growth+ only)
  const isPremiumFeature = !subscription.plan || subscription.plan === 'starter';
  const requiredPlan = 'growth';

  // Fetch user's thesis profiles
  const {
    data: profiles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['thesis-profiles', user?.id],
    queryFn: async (): Promise<ThesisProfile[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('thesis_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data || []).map(transformProfile);
    },
    enabled: !!user,
  });

  // Create new profile
  const createProfile = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      filters: FilterState;
      color?: string;
      icon?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Check limit
      if (!canSaveMore(profiles.length)) {
        throw new Error(`You've reached your limit of ${limit} saved thesis profiles. Upgrade to Growth for more.`);
      }

      const { data, error } = await supabase
        .from('thesis_profiles')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description,
          filters: input.filters,
          color: input.color || '#6366f1',
          icon: input.icon || 'filter',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A profile with this name already exists');
        }
        throw error;
      }
      return transformProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thesis-profiles'] });
      toast.success('Thesis profile saved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      filters?: FilterState;
      isDefault?: boolean;
      color?: string;
      icon?: string;
      matchCount?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // If setting as default, unset other defaults first
      if (input.isDefault) {
        await supabase
          .from('thesis_profiles')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', input.id);
      }

      const { data, error } = await supabase
        .from('thesis_profiles')
        .update({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.filters && { filters: input.filters }),
          ...(input.isDefault !== undefined && { is_default: input.isDefault }),
          ...(input.color && { color: input.color }),
          ...(input.icon && { icon: input.icon }),
          ...(input.matchCount !== undefined && { match_count: input.matchCount }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return transformProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thesis-profiles'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update profile');
      console.error(error);
    },
  });

  // Delete profile
  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('thesis_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thesis-profiles'] });
      toast.success('Thesis profile deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete profile');
      console.error(error);
    },
  });

  // Mark profile as used (updates last_used_at)
  const useProfile = useMutation({
    mutationFn: async (profileId: string) => {
      if (!user) return;

      await supabase
        .from('thesis_profiles')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', profileId)
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thesis-profiles'] });
    },
  });

  // Get default profile
  const defaultProfile = profiles.find(p => p.isDefault);

  return {
    profiles,
    isLoading,
    error,
    
    // Limits
    limit,
    isUnlimited,
    canSaveMore: canSaveMore(profiles.length),
    remainingSlots: isUnlimited ? Infinity : Math.max(0, limit - profiles.length),
    
    // Premium feature info
    isPremiumFeature,
    requiredPlan,
    
    // Actions
    createProfile: createProfile.mutate,
    updateProfile: updateProfile.mutate,
    deleteProfile: deleteProfile.mutate,
    useProfile: useProfile.mutate,
    
    // Loading states
    isCreating: createProfile.isPending,
    isUpdating: updateProfile.isPending,
    isDeleting: deleteProfile.isPending,
    
    // Helpers
    defaultProfile,
  };
}

