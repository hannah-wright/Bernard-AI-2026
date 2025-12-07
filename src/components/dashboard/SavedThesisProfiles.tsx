/**
 * SavedThesisProfiles Component
 * 
 * Displays saved investment thesis profiles with premium teaser for free users.
 * Premium feature unlocked on Growth plan and above.
 */

import { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Check, 
  Trash2, 
  Star, 
  Lock, 
  Sparkles,
  ChevronRight,
  Loader2,
  Edit2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FilterState } from '@/types/startup';
import { useThesisProfiles, ThesisProfile } from '@/hooks/useThesisProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface SavedThesisProfilesProps {
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  matchCount?: number;
}

// Preset thesis examples for teaser
const EXAMPLE_THESES = [
  { name: 'AI Healthcare Founders', description: 'Repeat founders in AI healthcare with pre-seed traction', color: '#10b981' },
  { name: 'Enterprise SaaS', description: 'B2B SaaS with $1M+ ARR and strong NRR', color: '#6366f1' },
  { name: 'Climate Tech Seed', description: 'Climate tech startups at Seed with technical founders', color: '#f59e0b' },
];

// Color options for profiles
const PROFILE_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export const SavedThesisProfiles = ({
  currentFilters,
  onApplyFilters,
  matchCount,
}: SavedThesisProfilesProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    profiles,
    isLoading,
    limit,
    isUnlimited,
    canSaveMore,
    remainingSlots,
    isPremiumFeature,
    createProfile,
    updateProfile,
    deleteProfile,
    useProfile,
    isCreating,
    defaultProfile,
  } = useThesisProfiles();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [newProfileColor, setNewProfileColor] = useState(PROFILE_COLORS[0]);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<ThesisProfile | null>(null);

  // Count active filters to show in badge
  const activeFilterCount = countActiveFilters(currentFilters);

  const handleSaveClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!canSaveMore && !isUnlimited) {
      setShowUpgradeDialog(true);
      return;
    }
    
    setShowSaveDialog(true);
  };

  const handleSaveProfile = () => {
    if (!newProfileName.trim()) return;
    
    createProfile({
      name: newProfileName.trim(),
      description: newProfileDescription.trim() || undefined,
      filters: currentFilters,
      color: newProfileColor,
    });
    
    setShowSaveDialog(false);
    setNewProfileName('');
    setNewProfileDescription('');
    setNewProfileColor(PROFILE_COLORS[0]);
  };

  const handleApplyProfile = (profile: ThesisProfile) => {
    onApplyFilters(profile.filters);
    setActiveProfile(profile.id);
    useProfile(profile.id);
  };

  const handleSetDefault = (profile: ThesisProfile) => {
    updateProfile({
      id: profile.id,
      isDefault: !profile.isDefault,
    });
  };

  const handleDeleteProfile = (profile: ThesisProfile) => {
    if (confirm(`Delete "${profile.name}"?`)) {
      deleteProfile(profile.id);
      if (activeProfile === profile.id) {
        setActiveProfile(null);
      }
    }
  };

  // Generate thesis description from filters
  const generateThesisDescription = (filters: FilterState): string => {
    const parts: string[] = [];
    
    if (filters.sectors.length > 0) parts.push(filters.sectors.slice(0, 2).join(', '));
    if (filters.roundTypes.length > 0) parts.push(filters.roundTypes[0]);
    if (filters.hasPriorExit) parts.push('Prior Exit');
    if (filters.hasFaangAlumni) parts.push('Ex-FAANG');
    if (filters.isSerialFounder) parts.push('Serial Founder');
    if (filters.foundingTeamSignalBands.length > 0) parts.push(`${filters.foundingTeamSignalBands[0]} team`);
    if (filters.countries.length > 0) parts.push(filters.countries.slice(0, 2).join(', '));
    
    return parts.length > 0 ? parts.join(' • ') : 'Custom filters';
  };

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Saved Filters</span>
          {!isUnlimited && limit > 0 && (
            <Badge variant="secondary" className="text-xs">
              {profiles.length}/{limit}
            </Badge>
          )}
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={handleSaveClick}
                disabled={activeFilterCount === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {activeFilterCount === 0 
                ? 'Apply filters first to save a thesis'
                : 'Save current filters as a thesis profile'
              }
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Profiles List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length > 0 ? (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className={cn(
                "group relative rounded-lg border p-3 transition-all cursor-pointer hover:border-primary/50",
                activeProfile === profile.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-card hover:bg-muted/50"
              )}
              onClick={() => handleApplyProfile(profile)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="h-3 w-3 rounded-full shrink-0" 
                    style={{ backgroundColor: profile.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{profile.name}</span>
                      {profile.isDefault && (
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.description || generateThesisDescription(profile.filters)}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSetDefault(profile); }}>
                      <Star className={cn("h-4 w-4 mr-2", profile.isDefault && "fill-current")} />
                      {profile.isDefault ? 'Remove default' : 'Set as default'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile); }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {activeProfile === profile.id && (
                <div className="absolute top-1/2 -translate-y-1/2 right-8">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          ))
        ) : (
          // Empty state with teaser
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            {isPremiumFeature ? (
              // Premium teaser for free/starter users
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm">Save Your Investment Criteria Filter(s)</p>
                </div>
                
                {/* Example theses teaser */}
                <div className="space-y-1.5 text-left">
                  {EXAMPLE_THESES.map((thesis, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50 opacity-60"
                    >
                      <div 
                        className="h-2.5 w-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: thesis.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{thesis.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{thesis.description}</p>
                      </div>
                      <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => setShowUpgradeDialog(true)}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Unlock on Growth Plan
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              // Empty state for premium users
              <div className="space-y-2">
                <Bookmark className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No saved thesis profiles yet</p>
                <p className="text-xs text-muted-foreground">
                  Apply filters and click "Save" to create your first saved filter
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Investment Criteria Filter</DialogTitle>
            <DialogDescription>
              Save your current filters as a reusable thesis profile
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., AI Healthcare Seed"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                maxLength={50}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="e.g., Repeat founders in AI healthcare with strong traction"
                value={newProfileDescription}
                onChange={(e) => setNewProfileDescription(e.target.value)}
                rows={2}
                maxLength={200}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {PROFILE_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-6 w-6 rounded-full transition-all",
                      newProfileColor === color 
                        ? "ring-2 ring-offset-2 ring-primary" 
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewProfileColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} will be saved:
              </p>
              <p className="text-xs text-muted-foreground">
                {generateThesisDescription(currentFilters)}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={!newProfileName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Thesis'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {limit === 0 ? 'Unlock Saved Thesis Profiles' : 'Unlock Unlimited Profiles'}
            </DialogTitle>
            <DialogDescription>
              {limit === 0 
                ? 'Save your investment criteria as reusable thesis profiles'
                : `You've used all ${limit} of your saved thesis profiles`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {limit === 0 ? (
              // For Free/Starter users - show Growth plan
              <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
                <p className="font-medium mb-2">Upgrade to Growth Plan</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    3 saved thesis profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    1,000 credits/month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    3 team members
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    CSV export
                  </li>
                </ul>
              </div>
            ) : (
              // For Growth users - show Scale plan
              <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
                <p className="font-medium mb-2">Upgrade to Scale Plan</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <strong>Unlimited</strong> saved thesis profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    1,800 credits/month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Unlimited team members
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    API access & priority support
                  </li>
                </ul>
              </div>
            )}
            
            {limit === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Or upgrade to Scale for unlimited thesis profiles
              </p>
            )}
            
            {limit > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Tip: Delete an existing profile to make room for a new one
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Maybe Later
            </Button>
            <Button onClick={() => navigate('/billing')}>
              View Plans
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper to count active filters
function countActiveFilters(filters: FilterState): number {
  let count = 0;
  
  if (filters.dateAddedRange && filters.dateAddedRange !== 'all') count++;
  if (filters.dateRange && filters.dateRange !== '9999') count++;
  if (filters.fundingMin !== undefined) count++;
  if (filters.fundingMax !== undefined) count++;
  count += filters.roundTypes.length;
  count += filters.sectors.length;
  count += filters.countries.length;
  count += filters.metros.length;
  count += filters.regions.length;
  count += filters.primaryMarkets.length;
  count += filters.businessModels.length;
  count += filters.companyTypes.length;
  count += filters.targetCustomers.length;
  count += filters.founderTypes.length;
  if (filters.isSerialFounder !== undefined) count++;
  count += filters.accelerators.length;
  if (filters.hasFaangAlumni !== undefined) count++;
  if (filters.hasPriorExit !== undefined) count++;
  if (filters.hasPriorIPO !== undefined) count++;
  count += filters.investorQualities.length;
  count += filters.hiringVelocityBands.length;
  count += filters.foundingTeamSignalBands.length;
  if (filters.cofoundersWorkedTogether !== undefined) count++;
  if (filters.totalRaisedMin !== undefined) count++;
  if (filters.totalRaisedMax !== undefined) count++;
  count += filters.runwayBands.length;
  count += filters.burnMultipleBands.length;
  count += filters.roundStatuses.length;
  if (filters.hasLead !== undefined) count++;
  
  return count;
}

