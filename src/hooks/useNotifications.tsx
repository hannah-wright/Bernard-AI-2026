/**
 * useNotifications Hook
 * 
 * Manages in-app notifications for mentions, shares, votes, etc.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'list_shared' | 'vote' | 'team_invite' | 'system';
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  metadata?: {
    startupId?: string;
    startupName?: string;
    listId?: string;
    listName?: string;
    mentionedBy?: string;
    mentionedByName?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.is_read,
        metadata: n.metadata,
        createdAt: n.created_at,
      }));
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Create notification (used internally)
  const createNotification = async (input: {
    userId: string;
    type: Notification['type'];
    title: string;
    message?: string;
    link?: string;
    metadata?: Record<string, any>;
  }) => {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: input.metadata,
      });

    if (error) throw error;
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    createNotification,
  };
}

// Utility to parse @mentions from text
export function parseMentions(text: string): string[] {
  const mentionRegex = /@(\w+(?:\s+\w+)?)/g;
  const matches = text.match(mentionRegex) || [];
  return matches.map(m => m.slice(1).trim()); // Remove @ symbol
}

// Utility to render text with highlighted mentions
export function renderWithMentions(text: string): React.ReactNode[] {
  const parts = text.split(/(@\w+(?:\s+\w+)?)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="text-primary font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}

