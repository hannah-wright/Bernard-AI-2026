/**
 * NotificationBell Component
 * 
 * Bell icon with dropdown showing notifications history.
 * Supports @mentions, list shares, votes, etc.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AtSign,
  FolderHeart,
  Star,
  Users,
  Check,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons: Record<Notification['type'], React.ReactNode> = {
  mention: <AtSign className="h-4 w-4 text-blue-500" />,
  list_shared: <FolderHeart className="h-4 w-4 text-purple-500" />,
  vote: <Star className="h-4 w-4 text-yellow-500" />,
  team_invite: <Users className="h-4 w-4 text-green-500" />,
  system: <Bell className="h-4 w-4 text-muted-foreground" />,
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto py-1 px-2 text-xs"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You'll see @mentions, list shares, and team votes here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    !notification.isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm",
                          !notification.isRead && "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

