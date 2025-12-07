/**
 * StartupLists Page
 * 
 * View and manage startup lists/collections.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  useStartupLists, 
  useStartupListItems,
  useStartupListShares,
  useStartupListActivity,
  StartupList,
  LIST_COLORS,
  LIST_ICONS,
} from '@/hooks/useStartupLists';
import { useOrganization } from '@/hooks/useOrganization';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MentionInput, extractMentions } from '@/components/ui/MentionInput';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
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
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Share2,
  Users,
  Lock,
  Globe,
  Download,
  ArrowLeft,
  Search,
  StickyNote,
  Clock,
  ExternalLink,
  Loader2,
  FolderPlus,
} from 'lucide-react';
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

const StartupLists = () => {
  const navigate = useNavigate();
  const { listId } = useParams();
  const { user } = useAuth();
  const { organization, members } = useOrganization();
  const { 
    lists, 
    isLoading,
    createList,
    updateList,
    deleteList,
    duplicateList,
    removeFromList,
    updateItemNotes,
    shareList,
    removeShare,
    isCreating,
    isDeleting,
    isDuplicating,
  } = useStartupLists();

  const selectedList = lists.find(l => l.id === listId);
  const { data: items = [], isLoading: itemsLoading } = useStartupListItems(listId || null);
  const { data: shares = [] } = useStartupListShares(listId || null);
  const { data: activity = [] } = useStartupListActivity(listId || null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<any>(null);

  // Form states
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListColor, setNewListColor] = useState('#6366f1');
  const [newListIcon, setNewListIcon] = useState('folder');
  const [newListVisibility, setNewListVisibility] = useState<'private' | 'team'>('private');
  const [itemNotes, setItemNotes] = useState('');
  const [shareUserId, setShareUserId] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    createList({
      name: newListName,
      description: newListDescription,
      color: newListColor,
      icon: newListIcon,
      visibility: newListVisibility,
    });
    resetForm();
    setShowCreateDialog(false);
  };

  const handleEditList = () => {
    if (!selectedList || !newListName.trim()) return;
    updateList({
      id: selectedList.id,
      name: newListName,
      description: newListDescription,
      color: newListColor,
      icon: newListIcon,
      visibility: newListVisibility,
    });
    resetForm();
    setShowEditDialog(false);
  };

  const handleDeleteList = () => {
    if (!selectedList) return;
    deleteList(selectedList.id);
    setShowDeleteDialog(false);
    navigate('/lists');
  };

  const handleDuplicateList = (list: StartupList) => {
    duplicateList(list.id);
  };

  const handleShareList = () => {
    if (!selectedList || !shareUserId) return;
    shareList({
      listId: selectedList.id,
      userId: shareUserId,
      permission: sharePermission,
      sendEmail: true,
    });
    setShareUserId('');
    setSharePermission('view');
  };

  const handleSaveNotes = async () => {
    if (!selectedItemForNotes || !selectedList || !user) return;
    
    // Save the notes
    updateItemNotes({
      listId: selectedList.id,
      startupId: selectedItemForNotes.startupId,
      notes: itemNotes,
    });

    // Process @mentions and create notifications
    const mentionedUserIds = extractMentions(itemNotes, members);
    
    if (mentionedUserIds.length > 0) {
      // Call the mention notification edge function
      try {
        await supabase.functions.invoke('notify-mention', {
          body: {
            mentionedUserIds,
            listId: selectedList.id,
            listName: selectedList.name,
            startupId: selectedItemForNotes.startupId,
            startupName: selectedItemForNotes.startup?.name,
            notePreview: itemNotes.slice(0, 100),
          },
        });
      } catch (err) {
        console.error('Failed to send mention notifications:', err);
      }
    }
    
    setShowNotesDialog(false);
    setSelectedItemForNotes(null);
    setItemNotes('');
  };

  const openEditDialog = (list: StartupList) => {
    setNewListName(list.name);
    setNewListDescription(list.description || '');
    setNewListColor(list.color);
    setNewListIcon(list.icon);
    setNewListVisibility(list.visibility);
    setShowEditDialog(true);
  };

  const openNotesDialog = (item: any) => {
    setSelectedItemForNotes(item);
    setItemNotes(item.notes || '');
    setShowNotesDialog(true);
  };

  const resetForm = () => {
    setNewListName('');
    setNewListDescription('');
    setNewListColor('#6366f1');
    setNewListIcon('folder');
    setNewListVisibility('private');
  };

  const exportListToCSV = () => {
    if (!selectedList || items.length === 0) return;

    const headers = ['Name', 'Industry', 'Funding Stage', 'Location', 'Total Raised', 'Notes', 'Added'];
    const rows = items.map(item => [
      item.startup?.name || '',
      item.startup?.industry || '',
      item.startup?.fundingStage || '',
      item.startup?.location || '',
      item.startup?.totalRaised ? `$${item.startup.totalRaised.toLocaleString()}` : '',
      item.notes || '',
      new Date(item.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedList.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.startup?.name?.toLowerCase().includes(query) ||
      item.startup?.industry?.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query)
    );
  });

  // My lists vs Team lists
  const myLists = lists.filter(l => l.isOwner);
  const teamLists = lists.filter(l => !l.isOwner && l.visibility === 'team');
  const sharedWithMe = lists.filter(l => !l.isOwner && l.permission && l.visibility !== 'team');

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Please sign in</h1>
          <p className="text-muted-foreground">You need to be logged in to view your lists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar - List Navigation */}
          <aside className="w-64 shrink-0">
            <div className="sticky top-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Lists</h2>
                <Button size="sm" variant="ghost" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-1 pr-4">
                  {/* Lists */}
                  {myLists.map((list) => {
                    const IconComponent = iconMap[list.icon] || Folder;
                    return (
                      <button
                        key={list.id}
                        onClick={() => navigate(`/lists/${list.id}`)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                          listId === list.id 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <IconComponent 
                          className="h-4 w-4 shrink-0" 
                          style={{ color: list.color }} 
                        />
                        <span className="truncate flex-1 text-sm">{list.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {list.itemCount}
                        </Badge>
                        {list.visibility === 'team' && (
                          <Users className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}

                  {myLists.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2 px-3">
                      No lists yet
                    </p>
                  )}

                  {/* Team Lists */}
                  {teamLists.length > 0 && (
                    <>
                      <div className="pt-4 pb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3">
                          Team Lists
                        </p>
                      </div>
                      {teamLists.map((list) => {
                        const IconComponent = iconMap[list.icon] || Folder;
                        return (
                          <button
                            key={list.id}
                            onClick={() => navigate(`/lists/${list.id}`)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                              listId === list.id 
                                ? "bg-primary/10 text-primary" 
                                : "hover:bg-muted"
                            )}
                          >
                            <IconComponent 
                              className="h-4 w-4 shrink-0" 
                              style={{ color: list.color }} 
                            />
                            <div className="flex-1 min-w-0">
                              <span className="truncate block text-sm">{list.name}</span>
                              <span className="text-xs text-muted-foreground truncate block">
                                by {list.ownerName || list.ownerEmail}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {list.itemCount}
                            </Badge>
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Shared With Me */}
                  {sharedWithMe.length > 0 && (
                    <>
                      <div className="pt-4 pb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3">
                          Shared With Me
                        </p>
                      </div>
                      {sharedWithMe.map((list) => {
                        const IconComponent = iconMap[list.icon] || Folder;
                        return (
                          <button
                            key={list.id}
                            onClick={() => navigate(`/lists/${list.id}`)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                              listId === list.id 
                                ? "bg-primary/10 text-primary" 
                                : "hover:bg-muted"
                            )}
                          >
                            <IconComponent 
                              className="h-4 w-4 shrink-0" 
                              style={{ color: list.color }} 
                            />
                            <div className="flex-1 min-w-0">
                              <span className="truncate block text-sm">{list.name}</span>
                              <span className="text-xs text-muted-foreground truncate block">
                                by {list.ownerName || list.ownerEmail}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {list.permission === 'edit' ? 'Edit' : 'View'}
                            </Badge>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Create List Button */}
              <Button 
                onClick={() => setShowCreateDialog(true)} 
                className="w-full"
                variant="outline"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New List
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {!listId ? (
              // No list selected - show overview
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Select a list</h2>
                <p className="text-muted-foreground mb-6">
                  Choose a list from the sidebar or create a new one
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First List
                </Button>
              </div>
            ) : selectedList ? (
              // List view
              <div className="space-y-6">
                {/* List Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div 
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${selectedList.color}20` }}
                    >
                      {(() => {
                        const IconComponent = iconMap[selectedList.icon] || Folder;
                        return <IconComponent className="h-6 w-6" style={{ color: selectedList.color }} />;
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold">{selectedList.name}</h1>
                        {selectedList.visibility === 'team' ? (
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            Team
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Private
                          </Badge>
                        )}
                      </div>
                      {selectedList.description && (
                        <p className="text-muted-foreground mt-1">{selectedList.description}</p>
                      )}
                      {!selectedList.isOwner && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Created by {selectedList.ownerName || selectedList.ownerEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedList.canEdit && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowShareDialog(true)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportListToCSV}
                          disabled={items.length === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </>
                    )}
                    
                    {selectedList.isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(selectedList)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit List
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateList(selectedList)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete List
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="startups">
                  <TabsList>
                    <TabsTrigger value="startups">
                      Startups ({items.length})
                    </TabsTrigger>
                    {selectedList.isOwner && (
                      <TabsTrigger value="sharing">
                        Sharing ({shares.length})
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="activity">
                      Activity
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="startups" className="mt-6">
                    {/* Search */}
                    {items.length > 0 && (
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search startups in this list..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    )}

                    {/* Items */}
                    {itemsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg bg-muted/20">
                        <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium mb-1">
                          {searchQuery ? 'No matches found' : 'This list is empty'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery 
                            ? 'Try a different search term'
                            : 'Add startups to this list from the main dashboard'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={item.startup?.logoUrl} />
                              <AvatarFallback>
                                {item.startup?.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{item.startup?.name}</h3>
                                {item.startup?.fundingStage && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.startup.fundingStage}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                {item.startup?.industry && (
                                  <span>{item.startup.industry}</span>
                                )}
                                {item.startup?.location && (
                                  <span>{item.startup.location}</span>
                                )}
                              </div>
                              {item.notes && (
                                <p className="text-sm mt-1 text-muted-foreground italic">
                                  "{item.notes}"
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openNotesDialog(item)}
                                title="Add/edit notes"
                              >
                                <StickyNote className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/?startup=${item.startupId}`)}
                                title="View startup"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              {selectedList.canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromList({ 
                                    listId: selectedList.id, 
                                    startupId: item.startupId 
                                  })}
                                  className="text-destructive hover:text-destructive"
                                  title="Remove from list"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {selectedList.isOwner && (
                    <TabsContent value="sharing" className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Share with Team Members</CardTitle>
                          <CardDescription>
                            Give others access to view or edit this list
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Add share */}
                          {members.length > 1 && (
                            <div className="flex gap-2">
                              <Select value={shareUserId} onValueChange={setShareUserId}>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                  {members
                                    .filter(m => m.userId !== user?.id && !shares.find(s => s.userId === m.userId))
                                    .map((member) => (
                                      <SelectItem key={member.userId} value={member.userId}>
                                        {member.fullName || member.email}
                                      </SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                              <Select value={sharePermission} onValueChange={(v) => setSharePermission(v as 'view' | 'edit')}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="view">Can view</SelectItem>
                                  <SelectItem value="edit">Can edit</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button onClick={handleShareList} disabled={!shareUserId}>
                                Share
                              </Button>
                            </div>
                          )}

                          {/* Current shares */}
                          {shares.length > 0 ? (
                            <div className="space-y-2">
                              {shares.map((share) => (
                                <div
                                  key={share.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={share.userAvatar} />
                                      <AvatarFallback>
                                        {(share.userName || share.userEmail)?.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {share.userName || share.userEmail}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {share.permission === 'edit' ? 'Can edit' : 'Can view'}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeShare({ 
                                      listId: selectedList.id, 
                                      userId: share.userId 
                                    })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              This list hasn't been shared with anyone yet
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  <TabsContent value="activity" className="mt-6">
                    {activity.length > 0 ? (
                      <div className="space-y-2">
                        {activity.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 border rounded-lg"
                          >
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-medium">{item.userName || 'Someone'}</span>
                                {' '}
                                {item.action === 'added_startup' && (
                                  <>added <span className="font-medium">{item.startupName}</span></>
                                )}
                                {item.action === 'removed_startup' && (
                                  <>removed <span className="font-medium">{item.startupName}</span></>
                                )}
                                {item.action === 'updated_notes' && (
                                  <>updated notes on <span className="font-medium">{item.startupName}</span></>
                                )}
                                {item.action === 'shared' && (
                                  <>shared this list</>
                                )}
                                {item.action === 'edited' && (
                                  <>edited list settings</>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No activity yet
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">List not found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Create a list to save and organize startups
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., AI Healthcare Startups"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this list for?"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {LIST_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewListColor(color.value)}
                      className={cn(
                        "h-6 w-6 rounded-full transition-transform",
                        newListColor === color.value && "ring-2 ring-offset-2 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {LIST_ICONS.map((icon) => {
                    const IconComponent = iconMap[icon] || Folder;
                    return (
                      <button
                        key={icon}
                        onClick={() => setNewListIcon(icon)}
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                          newListIcon === icon 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        <IconComponent className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {organization && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {newListVisibility === 'team' ? (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {newListVisibility === 'team' ? 'Team Visible' : 'Private'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {newListVisibility === 'team' 
                        ? 'Anyone in your org can see this list'
                        : 'Only you can see this list'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={newListVisibility === 'team'}
                  onCheckedChange={(checked) => setNewListVisibility(checked ? 'team' : 'private')}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowCreateDialog(false); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={!newListName.trim() || isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit List Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {LIST_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewListColor(color.value)}
                      className={cn(
                        "h-6 w-6 rounded-full transition-transform",
                        newListColor === color.value && "ring-2 ring-offset-2 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {LIST_ICONS.map((icon) => {
                    const IconComponent = iconMap[icon] || Folder;
                    return (
                      <button
                        key={icon}
                        onClick={() => setNewListIcon(icon)}
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                          newListIcon === icon 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        <IconComponent className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {organization && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {newListVisibility === 'team' ? <Users className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  <span className="text-sm">
                    {newListVisibility === 'team' ? 'Team Visible' : 'Private'}
                  </span>
                </div>
                <Switch
                  checked={newListVisibility === 'team'}
                  onCheckedChange={(checked) => setNewListVisibility(checked ? 'team' : 'private')}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditList} disabled={!newListName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete list?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedList?.name}" and remove all {selectedList?.itemCount} startups from it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteList}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share List</DialogTitle>
            <DialogDescription>
              Give team members access to this list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {members.length > 1 ? (
              <>
                <div className="flex gap-2">
                  <Select value={shareUserId} onValueChange={setShareUserId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter(m => m.userId !== user?.id && !shares.find(s => s.userId === m.userId))
                        .map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.fullName || member.email}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <Select value={sharePermission} onValueChange={(v) => setSharePermission(v as 'view' | 'edit')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">Can view</SelectItem>
                      <SelectItem value="edit">Can edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {sharePermission === 'edit' 
                    ? 'They can add/remove startups and edit notes'
                    : 'They can only view the list'
                  }
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No team members to share with. Invite team members from the Billing page.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareList} disabled={!shareUserId}>
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes for {selectedItemForNotes?.startup?.name}</DialogTitle>
            <DialogDescription>
              Add notes about this startup. Use @mention to notify team members.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <MentionInput
              value={itemNotes}
              onChange={setItemNotes}
              placeholder="e.g., Met founder at TechCrunch Disrupt. @John should follow up next week..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StartupLists;

