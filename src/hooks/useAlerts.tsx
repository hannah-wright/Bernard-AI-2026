/**
 * useAlerts Hook
 * 
 * Manages user alert subscriptions for startup matches.
 * Users can create alerts based on filter criteria and receive
 * daily/weekly email summaries of new matches.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/startup';
import { toast } from 'sonner';

export interface Alert {
  id: string;
  userId: string;
  name: string;
  description?: string;
  filters: Partial<FilterState>;
  isActive: boolean;
  frequency: 'daily' | 'weekly' | 'instant';
  lastSentAt?: string;
  lastMatchCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlertMatch {
  id: string;
  alertId: string;
  startupId: string;
  matchedAt: string;
  wasNotified: boolean;
  notifiedAt?: string;
  // Joined startup data
  startup?: {
    id: string;
    name: string;
    sector: string[];
    fundingStage?: string;
    location?: string;
  };
}

export function useAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's alerts
  const {
    data: alerts = [],
    isLoading,
  } = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: async (): Promise<Alert[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        name: a.name,
        description: a.description,
        filters: a.filters,
        isActive: a.is_active,
        frequency: a.frequency,
        lastSentAt: a.last_sent_at,
        lastMatchCount: a.last_match_count || 0,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      }));
    },
    enabled: !!user,
  });

  // Create alert
  const createAlert = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      filters: Partial<FilterState>;
      frequency?: 'daily' | 'weekly' | 'instant';
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('user_alerts')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description,
          filters: input.filters,
          frequency: input.frequency || 'daily',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert created! You\'ll receive email notifications for new matches.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update alert
  const updateAlert = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      filters?: Partial<FilterState>;
      isActive?: boolean;
      frequency?: 'daily' | 'weekly' | 'instant';
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('user_alerts')
        .update({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.filters && { filters: input.filters }),
          ...(input.isActive !== undefined && { is_active: input.isActive }),
          ...(input.frequency && { frequency: input.frequency }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete alert
  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle alert active status
  const toggleAlert = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) throw new Error('Must be logged in');

      const alert = alerts.find(a => a.id === alertId);
      if (!alert) throw new Error('Alert not found');

      const { data, error } = await supabase
        .from('user_alerts')
        .update({ 
          is_active: !alert.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(data.is_active ? 'Alert activated' : 'Alert paused');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Get active alerts count
  const activeAlertsCount = alerts.filter(a => a.isActive).length;

  return {
    alerts,
    isLoading,
    activeAlertsCount,
    
    // Actions
    createAlert: createAlert.mutate,
    updateAlert: updateAlert.mutate,
    deleteAlert: deleteAlert.mutate,
    toggleAlert: toggleAlert.mutate,
    
    // Loading states
    isCreating: createAlert.isPending,
    isUpdating: updateAlert.isPending,
    isDeleting: deleteAlert.isPending,
  };
}

// Helper to describe filters in human-readable form
export function describeFilters(filters: Partial<FilterState>): string[] {
  const descriptions: string[] = [];
  
  if (filters.sectors && filters.sectors.length > 0) {
    descriptions.push(`Sectors: ${filters.sectors.join(', ')}`);
  }
  if (filters.roundTypes && filters.roundTypes.length > 0) {
    descriptions.push(`Stages: ${filters.roundTypes.join(', ')}`);
  }
  if (filters.fundingMin || filters.fundingMax) {
    const min = filters.fundingMin ? `$${(filters.fundingMin / 1000000).toFixed(1)}M` : '';
    const max = filters.fundingMax ? `$${(filters.fundingMax / 1000000).toFixed(1)}M` : '';
    descriptions.push(`Funding: ${min}${min && max ? ' - ' : ''}${max}`);
  }
  if (filters.unicornScoreMin) {
    descriptions.push(`Unicorn Score: ${filters.unicornScoreMin}+`);
  }
  if (filters.only10xBets) {
    descriptions.push('10x Bets only');
  }
  if (filters.backerScoreMin) {
    descriptions.push(`Backer Score: ${filters.backerScoreMin}+`);
  }
  if (filters.backerHotStreakOnly) {
    descriptions.push('Hot Streak Backers only');
  }
  if (filters.hiddenGemOnly) {
    descriptions.push('Hidden Gems only');
  }
  if (filters.countries && filters.countries.length > 0) {
    descriptions.push(`Countries: ${filters.countries.join(', ')}`);
  }
  if (filters.hasFaangAlumni) {
    descriptions.push('FAANG Alumni');
  }
  if (filters.hasPriorExit) {
    descriptions.push('Prior Exit');
  }
  
  return descriptions.length > 0 ? descriptions : ['All startups'];
}

