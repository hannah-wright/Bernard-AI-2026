/**
 * useStartupVoting Hook
 * 
 * Manages partner voting for startups (Deal Score).
 * Each org member can vote 1-10 on startups.
 * Deal Score = average of all org votes.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export interface StartupVote {
  id: string;
  startupId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  organizationId?: string;
  score: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealScore {
  average: number;
  count: number;
  votes: StartupVote[];
  userVote?: StartupVote;
}

export function useStartupVoting(startupId: string | null) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  // Fetch votes for a startup
  const {
    data: dealScore,
    isLoading,
  } = useQuery({
    queryKey: ['startup-votes', startupId, organization?.id],
    queryFn: async (): Promise<DealScore | null> => {
      if (!startupId || !user) return null;

      // Get all votes for this startup in the org
      const query = supabase
        .from('startup_votes')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('startup_id', startupId);

      // If user is in an org, get org votes; otherwise just their own
      if (organization?.id) {
        query.eq('organization_id', organization.id);
      } else {
        query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const votes: StartupVote[] = (data || []).map((v: any) => ({
        id: v.id,
        startupId: v.startup_id,
        userId: v.user_id,
        userName: v.profiles?.full_name,
        userAvatar: v.profiles?.avatar_url,
        organizationId: v.organization_id,
        score: v.score,
        comment: v.comment,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      }));

      const userVote = votes.find(v => v.userId === user.id);
      const average = votes.length > 0 
        ? votes.reduce((sum, v) => sum + v.score, 0) / votes.length 
        : 0;

      return {
        average: Math.round(average * 10) / 10, // Round to 1 decimal
        count: votes.length,
        votes,
        userVote,
      };
    },
    enabled: !!startupId && !!user,
  });

  // Submit or update vote
  const submitVote = useMutation({
    mutationFn: async (input: { score: number; comment?: string }) => {
      if (!user || !startupId) throw new Error('Must be logged in');

      const voteData = {
        startup_id: startupId,
        user_id: user.id,
        organization_id: organization?.id || null,
        score: input.score,
        comment: input.comment,
        updated_at: new Date().toISOString(),
      };

      // Upsert - insert or update if exists
      const { data, error } = await supabase
        .from('startup_votes')
        .upsert(voteData, { 
          onConflict: 'startup_id,user_id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update the cached deal score on the startup
      await updateStartupDealScore(startupId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-votes', startupId] });
      queryClient.invalidateQueries({ queryKey: ['startups'] });
      toast.success('Vote recorded');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove vote
  const removeVote = useMutation({
    mutationFn: async () => {
      if (!user || !startupId) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('startup_votes')
        .delete()
        .eq('startup_id', startupId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update the cached deal score on the startup
      await updateStartupDealScore(startupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-votes', startupId] });
      queryClient.invalidateQueries({ queryKey: ['startups'] });
      toast.success('Vote removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    dealScore,
    isLoading,
    submitVote: submitVote.mutate,
    removeVote: removeVote.mutate,
    isSubmitting: submitVote.isPending,
    isRemoving: removeVote.isPending,
    hasVoted: !!dealScore?.userVote,
    userScore: dealScore?.userVote?.score,
  };
}

// Helper to update the cached deal score on a startup
async function updateStartupDealScore(startupId: string) {
  // Get all votes for this startup
  const { data: votes } = await supabase
    .from('startup_votes')
    .select('score')
    .eq('startup_id', startupId);

  if (!votes || votes.length === 0) {
    // No votes - clear the score
    await supabase
      .from('startups')
      .update({ deal_score: null, deal_score_count: 0 })
      .eq('id', startupId);
  } else {
    // Calculate average
    const average = votes.reduce((sum, v) => sum + v.score, 0) / votes.length;
    await supabase
      .from('startups')
      .update({ 
        deal_score: Math.round(average * 10) / 10,
        deal_score_count: votes.length,
      })
      .eq('id', startupId);
  }
}

// Hook to get deal scores for multiple startups (for grid view)
export function useStartupDealScores(startupIds: string[]) {
  const { user } = useAuth();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ['startup-deal-scores', startupIds, organization?.id],
    queryFn: async (): Promise<Record<string, { average: number; count: number }>> => {
      if (!user || startupIds.length === 0) return {};

      const query = supabase
        .from('startup_votes')
        .select('startup_id, score')
        .in('startup_id', startupIds);

      if (organization?.id) {
        query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by startup and calculate averages
      const scoreMap: Record<string, { total: number; count: number }> = {};
      
      (data || []).forEach((vote: any) => {
        if (!scoreMap[vote.startup_id]) {
          scoreMap[vote.startup_id] = { total: 0, count: 0 };
        }
        scoreMap[vote.startup_id].total += vote.score;
        scoreMap[vote.startup_id].count += 1;
      });

      const result: Record<string, { average: number; count: number }> = {};
      for (const [id, { total, count }] of Object.entries(scoreMap)) {
        result[id] = {
          average: Math.round((total / count) * 10) / 10,
          count,
        };
      }

      return result;
    },
    enabled: !!user && startupIds.length > 0,
  });
}

