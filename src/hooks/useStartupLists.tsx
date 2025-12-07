/**
 * useStartupLists Hook
 * 
 * Manages startup lists/collections functionality.
 * Features:
 * - Create, edit, delete lists
 * - Add/remove startups with notes
 * - Share lists with team members
 * - Activity tracking
 * - Export to CSV
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export interface StartupList {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  organizationId?: string;
  visibility: 'private' | 'team';
  isDefault: boolean;
  position: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  // Computed
  isOwner: boolean;
  canEdit: boolean;
  permission?: 'owner' | 'edit' | 'view';
}

export interface StartupListItem {
  id: string;
  listId: string;
  startupId: string;
  addedBy?: string;
  addedByName?: string;
  notes?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  // Joined startup data
  startup?: {
    id: string;
    name: string;
    logoUrl?: string;
    description?: string;
    industry?: string;
    fundingStage?: string;
    location?: string;
    totalRaised?: number;
  };
}

export interface ListShare {
  id: string;
  listId: string;
  userId: string;
  permission: 'view' | 'edit';
  sharedBy?: string;
  notifiedAt?: string;
  createdAt: string;
  // Joined user data
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export interface ListActivity {
  id: string;
  listId: string;
  userId?: string;
  userName?: string;
  action: 'added_startup' | 'removed_startup' | 'updated_notes' | 'shared' | 'edited';
  startupId?: string;
  startupName?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Color options for lists
export const LIST_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
];

// Icon options for lists
export const LIST_ICONS = [
  'folder', 'star', 'heart', 'bookmark', 'flag', 'target', 
  'zap', 'rocket', 'trophy', 'crown', 'gem', 'briefcase'
];

export function useStartupLists() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  // Fetch all accessible lists
  const {
    data: lists = [],
    isLoading: listsLoading,
    error: listsError,
  } = useQuery({
    queryKey: ['startup-lists', user?.id, organization?.id],
    queryFn: async (): Promise<StartupList[]> => {
      if (!user) return [];

      // Get lists owned by user
      const { data: ownedLists, error: ownedError } = await supabase
        .from('startup_lists')
        .select(`
          *,
          profiles:owner_id (full_name, email),
          startup_list_items (count)
        `)
        .eq('owner_id', user.id)
        .order('position');

      if (ownedError) throw ownedError;

      // Get team-visible lists from org
      let teamLists: any[] = [];
      if (organization?.id) {
        const { data, error } = await supabase
          .from('startup_lists')
          .select(`
            *,
            profiles:owner_id (full_name, email),
            startup_list_items (count)
          `)
          .eq('organization_id', organization.id)
          .eq('visibility', 'team')
          .neq('owner_id', user.id)
          .order('position');

        if (!error && data) {
          teamLists = data;
        }
      }

      // Get shared lists
      const { data: shares } = await supabase
        .from('startup_list_shares')
        .select('list_id, permission')
        .eq('user_id', user.id);

      const shareMap = new Map(shares?.map(s => [s.list_id, s.permission]) || []);

      let sharedLists: any[] = [];
      if (shares && shares.length > 0) {
        const { data, error } = await supabase
          .from('startup_lists')
          .select(`
            *,
            profiles:owner_id (full_name, email),
            startup_list_items (count)
          `)
          .in('id', shares.map(s => s.list_id))
          .neq('owner_id', user.id);

        if (!error && data) {
          sharedLists = data;
        }
      }

      // Combine and transform
      const allLists = [...(ownedLists || []), ...teamLists, ...sharedLists];
      
      // Remove duplicates
      const uniqueLists = Array.from(new Map(allLists.map(l => [l.id, l])).values());

      return uniqueLists.map((list: any) => {
        const isOwner = list.owner_id === user.id;
        const sharePermission = shareMap.get(list.id);
        const isTeamVisible = list.visibility === 'team' && list.organization_id === organization?.id;
        
        return {
          id: list.id,
          name: list.name,
          description: list.description,
          color: list.color,
          icon: list.icon,
          ownerId: list.owner_id,
          ownerName: list.profiles?.full_name,
          ownerEmail: list.profiles?.email,
          organizationId: list.organization_id,
          visibility: list.visibility,
          isDefault: list.is_default,
          position: list.position,
          itemCount: list.startup_list_items?.[0]?.count || 0,
          createdAt: list.created_at,
          updatedAt: list.updated_at,
          isOwner,
          canEdit: isOwner || sharePermission === 'edit',
          permission: isOwner ? 'owner' : (sharePermission || (isTeamVisible ? 'view' : undefined)),
        };
      });
    },
    enabled: !!user,
  });

  // Create list
  const createList = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
      visibility?: 'private' | 'team';
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('startup_lists')
        .insert({
          name: input.name,
          description: input.description,
          color: input.color || '#6366f1',
          icon: input.icon || 'folder',
          owner_id: user.id,
          organization_id: organization?.id,
          visibility: input.visibility || 'private',
          position: lists.length,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-lists'] });
      toast.success('List created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update list
  const updateList = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      visibility?: 'private' | 'team';
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('startup_lists')
        .update({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.color && { color: input.color }),
          ...(input.icon && { icon: input.icon }),
          ...(input.visibility && { visibility: input.visibility }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-lists'] });
      toast.success('List updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete list
  const deleteList = useMutation({
    mutationFn: async (listId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('startup_lists')
        .delete()
        .eq('id', listId)
        .eq('owner_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-lists'] });
      toast.success('List deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Duplicate list
  const duplicateList = useMutation({
    mutationFn: async (listId: string) => {
      if (!user) throw new Error('Must be logged in');

      // Get original list
      const { data: original, error: fetchError } = await supabase
        .from('startup_lists')
        .select('*, startup_list_items(*)')
        .eq('id', listId)
        .single();

      if (fetchError) throw fetchError;

      // Create new list
      const { data: newList, error: createError } = await supabase
        .from('startup_lists')
        .insert({
          name: `${original.name} (Copy)`,
          description: original.description,
          color: original.color,
          icon: original.icon,
          owner_id: user.id,
          organization_id: organization?.id,
          visibility: 'private',
          position: lists.length,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Copy items
      if (original.startup_list_items && original.startup_list_items.length > 0) {
        const itemsToInsert = original.startup_list_items.map((item: any) => ({
          list_id: newList.id,
          startup_id: item.startup_id,
          added_by: user.id,
          notes: item.notes,
          position: item.position,
        }));

        await supabase.from('startup_list_items').insert(itemsToInsert);
      }

      return newList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-lists'] });
      toast.success('List duplicated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add startup to list
  const addToList = useMutation({
    mutationFn: async (input: { listId: string; startupId: string; notes?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('startup_list_items')
        .insert({
          list_id: input.listId,
          startup_id: input.startupId,
          added_by: user.id,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Startup is already in this list');
        }
        throw error;
      }

      // Log activity
      await supabase.from('startup_list_activity').insert({
        list_id: input.listId,
        user_id: user.id,
        action: 'added_startup',
        startup_id: input.startupId,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-lists'] });
      queryClient.invalidateQueries({ queryKey: ['startup-list-items'] });
      toast.success('Added to list');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove startup from list
  const removeFromList = useMutation({
    mutationFn: async (input: { listId: string; startupId: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('startup_list_items')
        .delete()
        .eq('list_id', input.listId)
        .eq('startup_id', input.startupId);

      if (error) throw error;

      // Log activity
      await supabase.from('startup_list_activity').insert({
        list_id: input.listId,
        user_id: user.id,
        action: 'removed_startup',
        startup_id: input.startupId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-lists'] });
      queryClient.invalidateQueries({ queryKey: ['startup-list-items'] });
      toast.success('Removed from list');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update item notes
  const updateItemNotes = useMutation({
    mutationFn: async (input: { listId: string; startupId: string; notes: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('startup_list_items')
        .update({ notes: input.notes, updated_at: new Date().toISOString() })
        .eq('list_id', input.listId)
        .eq('startup_id', input.startupId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('startup_list_activity').insert({
        list_id: input.listId,
        user_id: user.id,
        action: 'updated_notes',
        startup_id: input.startupId,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-list-items'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reorder items
  const reorderItems = useMutation({
    mutationFn: async (input: { listId: string; itemIds: string[] }) => {
      if (!user) throw new Error('Must be logged in');

      // Update positions
      const updates = input.itemIds.map((id, index) => ({
        id,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from('startup_list_items')
          .update({ position: update.position })
          .eq('id', update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-list-items'] });
    },
  });

  // Share list
  const shareList = useMutation({
    mutationFn: async (input: { 
      listId: string; 
      userId: string; 
      permission: 'view' | 'edit';
      sendEmail?: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('startup_list_shares')
        .upsert({
          list_id: input.listId,
          user_id: input.userId,
          permission: input.permission,
          shared_by: user.id,
          notified_at: input.sendEmail ? new Date().toISOString() : null,
        }, { onConflict: 'list_id,user_id' })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('startup_list_activity').insert({
        list_id: input.listId,
        user_id: user.id,
        action: 'shared',
        metadata: { shared_with: input.userId, permission: input.permission },
      });

      // Send email notification via Edge Function
      if (input.sendEmail) {
        try {
          await supabase.functions.invoke('notify-list-share', {
            body: {
              listId: input.listId,
              recipientUserId: input.userId,
              permission: input.permission,
            },
          });
        } catch (err) {
          console.error('Failed to send notification:', err);
          // Don't fail the share operation if notification fails
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-list-shares'] });
      toast.success('List shared');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove share
  const removeShare = useMutation({
    mutationFn: async (input: { listId: string; userId: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('startup_list_shares')
        .delete()
        .eq('list_id', input.listId)
        .eq('user_id', input.userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-list-shares'] });
      toast.success('Share removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Check if startup is in any list
  const getStartupLists = (startupId: string): string[] => {
    // This would need to be tracked separately or computed from list items
    return [];
  };

  return {
    lists,
    isLoading: listsLoading,
    error: listsError,

    // List CRUD
    createList: createList.mutate,
    updateList: updateList.mutate,
    deleteList: deleteList.mutate,
    duplicateList: duplicateList.mutate,

    // Item management
    addToList: addToList.mutate,
    removeFromList: removeFromList.mutate,
    updateItemNotes: updateItemNotes.mutate,
    reorderItems: reorderItems.mutate,

    // Sharing
    shareList: shareList.mutate,
    removeShare: removeShare.mutate,

    // Loading states
    isCreating: createList.isPending,
    isUpdating: updateList.isPending,
    isDeleting: deleteList.isPending,
    isDuplicating: duplicateList.isPending,
    isAddingToList: addToList.isPending,
    isRemovingFromList: removeFromList.isPending,
    isSharing: shareList.isPending,
  };
}

// Hook to fetch items for a specific list
export function useStartupListItems(listId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['startup-list-items', listId],
    queryFn: async (): Promise<StartupListItem[]> => {
      if (!listId || !user) return [];

      const { data, error } = await supabase
        .from('startup_list_items')
        .select(`
          *,
          profiles:added_by (full_name),
          startups (
            id,
            name,
            logo_url,
            description,
            industry,
            funding_stage,
            location,
            total_raised
          )
        `)
        .eq('list_id', listId)
        .order('position');

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        listId: item.list_id,
        startupId: item.startup_id,
        addedBy: item.added_by,
        addedByName: item.profiles?.full_name,
        notes: item.notes,
        position: item.position,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        startup: item.startups ? {
          id: item.startups.id,
          name: item.startups.name,
          logoUrl: item.startups.logo_url,
          description: item.startups.description,
          industry: item.startups.industry,
          fundingStage: item.startups.funding_stage,
          location: item.startups.location,
          totalRaised: item.startups.total_raised,
        } : undefined,
      }));
    },
    enabled: !!listId && !!user,
  });
}

// Hook to fetch shares for a specific list
export function useStartupListShares(listId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['startup-list-shares', listId],
    queryFn: async (): Promise<ListShare[]> => {
      if (!listId || !user) return [];

      const { data, error } = await supabase
        .from('startup_list_shares')
        .select(`
          *,
          profiles:user_id (full_name, email, avatar_url)
        `)
        .eq('list_id', listId);

      if (error) throw error;

      return (data || []).map((share: any) => ({
        id: share.id,
        listId: share.list_id,
        userId: share.user_id,
        permission: share.permission,
        sharedBy: share.shared_by,
        notifiedAt: share.notified_at,
        createdAt: share.created_at,
        userName: share.profiles?.full_name,
        userEmail: share.profiles?.email,
        userAvatar: share.profiles?.avatar_url,
      }));
    },
    enabled: !!listId && !!user,
  });
}

// Hook to fetch activity for a specific list
export function useStartupListActivity(listId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['startup-list-activity', listId],
    queryFn: async (): Promise<ListActivity[]> => {
      if (!listId || !user) return [];

      const { data, error } = await supabase
        .from('startup_list_activity')
        .select(`
          *,
          profiles:user_id (full_name),
          startups:startup_id (name)
        `)
        .eq('list_id', listId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((activity: any) => ({
        id: activity.id,
        listId: activity.list_id,
        userId: activity.user_id,
        userName: activity.profiles?.full_name,
        action: activity.action,
        startupId: activity.startup_id,
        startupName: activity.startups?.name,
        metadata: activity.metadata,
        createdAt: activity.created_at,
      }));
    },
    enabled: !!listId && !!user,
  });
}

// Hook to check which lists contain a specific startup
export function useStartupInLists(startupId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['startup-in-lists', startupId],
    queryFn: async (): Promise<string[]> => {
      if (!startupId || !user) return [];

      const { data, error } = await supabase
        .from('startup_list_items')
        .select('list_id')
        .eq('startup_id', startupId);

      if (error) throw error;

      return (data || []).map((item: any) => item.list_id);
    },
    enabled: !!startupId && !!user,
  });
}

