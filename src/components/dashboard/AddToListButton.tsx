/**
 * AddToListButton Component
 * 
 * Quick action to add a startup to a list.
 * Shows in startup cards and detail views.
 */

import { useState } from 'react';
import {
  FolderPlus,
  Check,
  Plus,
  Loader2,
  Folder,
  Star,
  Heart,
  Bookmark,
  Flag,
  Target,
  Zap,
  Rocket,
  Trophy,
  Crown,
  Gem,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useStartupLists, useStartupInLists, LIST_COLORS } from '@/hooks/useStartupLists';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Icon component map
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  target: Target,
  zap: Zap,
  rocket: Rocket,
  trophy: Trophy,
  crown: Crown,
  gem: Gem,
  briefcase: Briefcase,
};

interface AddToListButtonProps {
  startupId: string;
  startupName: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'default';
  className?: string;
}

export const AddToListButton = ({ 
  startupId, 
  startupName,
  variant = 'icon',
  size = 'default',
  className,
}: AddToListButtonProps) => {
  const { user } = useAuth();
  const { 
    lists, 
    createList, 
    addToList, 
    removeFromList,
    isCreating,
    isAddingToList,
  } = useStartupLists();
  const { data: startupListIds = [] } = useStartupInLists(startupId);

  const [open, setOpen] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newListName, setNewListName] = useState('');

  const isInAnyList = startupListIds.length > 0;
  
  // Only show lists user owns or can edit
  const editableLists = lists.filter(l => l.canEdit);

  const handleToggleList = (listId: string) => {
    const isInList = startupListIds.includes(listId);
    if (isInList) {
      removeFromList({ listId, startupId });
    } else {
      addToList({ listId, startupId });
    }
  };

  const handleCreateAndAdd = () => {
    if (!newListName.trim()) return;
    createList({ 
      name: newListName,
      color: LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)].value,
    });
    setNewListName('');
    setShowCreateNew(false);
    // Note: The startup will need to be added separately after the list is created
    // This is handled by the mutation's onSuccess
  };

  if (!user) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size={size === 'sm' ? 'sm' : 'icon'}
            className={cn(
              "relative",
              isInAnyList && "text-primary",
              className
            )}
            title="Add to list"
          >
            <FolderPlus className={cn("h-4 w-4", size === 'sm' && "h-3.5 w-3.5")} />
            {isInAnyList && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        ) : (
          <Button
            variant={isInAnyList ? "secondary" : "outline"}
            size={size}
            className={className}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            {isInAnyList ? `In ${startupListIds.length} list${startupListIds.length > 1 ? 's' : ''}` : 'Add to List'}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search lists..." />
          <CommandList>
            <CommandEmpty>
              {editableLists.length === 0 
                ? "No lists yet" 
                : "No matching lists"
              }
            </CommandEmpty>
            <CommandGroup heading="Your Lists">
              {editableLists.map((list) => {
                const IconComponent = iconMap[list.icon] || Folder;
                const isInList = startupListIds.includes(list.id);
                return (
                  <CommandItem
                    key={list.id}
                    onSelect={() => handleToggleList(list.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <IconComponent 
                        className="h-4 w-4 shrink-0" 
                        style={{ color: list.color }} 
                      />
                      <span className="truncate">{list.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {list.itemCount}
                      </span>
                    </div>
                    {isInList && (
                      <Check className="h-4 w-4 text-primary ml-2" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {showCreateNew ? (
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="List name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateAndAdd();
                      }
                      if (e.key === 'Escape') {
                        setShowCreateNew(false);
                        setNewListName('');
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={handleCreateAndAdd}
                      disabled={!newListName.trim() || isCreating}
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Create'
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setShowCreateNew(false);
                        setNewListName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <CommandItem
                  onSelect={() => setShowCreateNew(true)}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New List
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

