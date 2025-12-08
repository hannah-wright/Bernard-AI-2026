/**
 * OnboardingFlow Component
 * 
 * 7-step onboarding flow for new users to maximize activation and stickiness.
 * Collects investment thesis, shows immediate value, creates first list/filter.
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Bell,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Rocket,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStartups } from '@/hooks/useStartups';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RoundType } from '@/types/startup';

// Types
interface OnboardingData {
  role?: string;
  sectors: string[];
  stages: string[];
  geos: string[];
  listName?: string;
  listColor?: string;
  teamEmail?: string;
  alertsEnabled?: boolean;
  alertFrequency?: 'daily' | 'weekly';
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Constants
const ROLES = [
  { id: 'partner', label: 'Partner at VC', icon: '👔' },
  { id: 'principal', label: 'Principal / Associate', icon: '📊' },
  { id: 'analyst', label: 'Analyst / Scout', icon: '🔍' },
  { id: 'angel', label: 'Angel Investor', icon: '😇' },
  { id: 'other', label: 'Other', icon: '👤' },
];

const SECTORS: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'All Industries', icon: '🌐' },
  { id: 'AI/ML', label: 'AI / ML', icon: '🤖' },
  { id: 'SaaS', label: 'SaaS', icon: '☁️' },
  { id: 'Fintech', label: 'Fintech', icon: '💳' },
  { id: 'Healthcare', label: 'Healthcare', icon: '🏥' },
  { id: 'Enterprise', label: 'Enterprise', icon: '🏢' },
  { id: 'Consumer', label: 'Consumer', icon: '🛒' },
];

// Simplified stage groups for onboarding (maps to multiple actual stages)
const STAGE_GROUPS = [
  { id: 'all', label: 'All Stages', description: 'Show everything', stages: [] as RoundType[] },
  { id: 'early', label: 'Early Stage', description: 'Bootstrapped → Seed', stages: ['Bootstrapped', 'Pre-Seed', 'Seed'] as RoundType[] },
  { id: 'growth', label: 'Growth Stage', description: 'Series A → B', stages: ['Series A', 'Series B'] as RoundType[] },
  { id: 'late', label: 'Late Stage', description: 'Series C+', stages: ['Series C', 'Series D+'] as RoundType[] },
];

const GEOS = [
  { id: 'US', label: 'United States', flag: '🇺🇸' },
  { id: 'EU', label: 'Europe', flag: '🇪🇺' },
  { id: 'LATAM', label: 'Latin America', flag: '🌎' },
  { id: 'APAC', label: 'Asia Pacific', flag: '🌏' },
  { id: 'MEA', label: 'Middle East & Africa', flag: '🌍' },
  { id: 'global', label: 'Global (no preference)', flag: '🌐' },
];

const LIST_COLORS = [
  { id: 'blue', color: '#3B82F6' },
  { id: 'green', color: '#10B981' },
  { id: 'purple', color: '#8B5CF6' },
  { id: 'orange', color: '#F59E0B' },
  { id: 'pink', color: '#EC4899' },
  { id: 'cyan', color: '#06B6D4' },
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const { startups } = useStartups();
  const { inviteMemberAsync, createOrganizationAsync, organization } = useOrganization();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedStartups, setMatchedStartups] = useState<typeof startups>([]);
  
  const [data, setData] = useState<OnboardingData>({
    sectors: ['all'], // Default to "All Industries"
    stages: ['all'], // Default to "All Stages"
    geos: [],
    listColor: 'blue',
    alertsEnabled: false, // Default to off to avoid issues
    alertFrequency: 'daily',
  });

  const totalSteps = 7;
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  // Calculate matched startups based on selections (lenient matching)
  useEffect(() => {
    if (step === 5 && startups.length > 0) {
      // Expand stage groups into actual stages
      const expandedStages: string[] = [];
      data.stages.forEach(stageId => {
        if (stageId === 'all') return; // All stages means no filter
        const group = STAGE_GROUPS.find(g => g.id === stageId);
        if (group) {
          expandedStages.push(...group.stages);
        }
      });
      
      const filtered = startups.filter(s => {
        // Sector match - skip if "all" selected or no sectors
        if (data.sectors.length > 0 && !data.sectors.includes('all')) {
          const hasMatchingSector = s.sector.some(sec => data.sectors.includes(sec));
          if (!hasMatchingSector) return false;
        }
        // Stage match - skip if "all" selected or no stages
        if (expandedStages.length > 0) {
          if (!expandedStages.includes(s.fundingRound.type)) return false;
        }
        // Geo match - skip if "global" selected
        if (data.geos.length > 0 && !data.geos.includes('global')) {
          // Lenient geo matching - check if ANY geo matches
          const matchesGeo = data.geos.some(geo => {
            if (geo === 'US') return s.location.country === 'United States';
            if (geo === 'EU') return ['Germany', 'France', 'UK', 'Netherlands', 'Spain', 'Italy', 'Sweden', 'Ireland'].includes(s.location.country || '');
            return true; // Other geos are lenient
          });
          if (!matchesGeo) return false;
        }
        return true;
      });
      setMatchedStartups(filtered.slice(0, 20)); // Show more results
    }
  }, [step, startups, data.sectors, data.stages, data.geos]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (key: 'sectors' | 'stages' | 'geos', item: string) => {
    setData(prev => {
      const arr = prev[key];
      if (arr.includes(item)) {
        return { ...prev, [key]: arr.filter(i => i !== item) };
      } else {
        return { ...prev, [key]: [...arr, item] };
      }
    });
  };

  const goNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!data.role;
      case 2: return data.sectors.length > 0; // At least one (can be "all")
      case 3: return data.stages.length > 0; // At least one (can be "all")
      case 4: return data.geos.length > 0; // At least one (can be "global")
      case 5: return true;
      case 6: return true;
      case 7: return true;
      default: return true;
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Expand stage groups into actual stages for storage
      const expandedStages: string[] = [];
      data.stages.forEach(stageId => {
        if (stageId === 'all') return; // All stages means no filter
        const group = STAGE_GROUPS.find(g => g.id === stageId);
        if (group) {
          expandedStages.push(...group.stages);
        }
      });

      // Clean sectors (remove "all" if present)
      const cleanSectors = data.sectors.filter(s => s !== 'all');

      // 1. Save profile data (CRITICAL - must succeed)
      const { error: profileError } = await supabase.from('profiles').update({
        role: data.role,
        investment_sectors: cleanSectors.length > 0 ? cleanSectors : null,
        investment_stages: expandedStages.length > 0 ? expandedStages : null,
        investment_geos: data.geos.filter(g => g !== 'global'),
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: totalSteps,
        onboarding_data: data,
      }).eq('id', user?.id);

      if (profileError) {
        console.error('Profile update failed:', profileError);
        throw new Error('Failed to save profile. Please try again.');
      }

      // 2. Create saved filter from thesis (non-blocking)
      if (cleanSectors.length > 0 || expandedStages.length > 0) {
        try {
          await supabase.from('user_thesis_profiles').insert({
            user_id: user?.id,
            name: 'My Investment Thesis',
            filters: {
              sectors: cleanSectors,
              roundTypes: expandedStages,
              regions: data.geos.filter(g => g !== 'global'),
            },
          });
        } catch (err) {
          console.warn('Saved filter creation failed:', err);
          // Non-blocking - user can create later
        }
      }

      // 3. Create list if name provided (non-blocking)
      if (data.listName?.trim()) {
        try {
          // Use direct insert instead of mutation to avoid RLS issues
          await supabase.from('startup_lists').insert({
            name: data.listName,
            color: LIST_COLORS.find(c => c.id === data.listColor)?.color || '#3B82F6',
            owner_id: user?.id,
            visibility: 'private',
            icon: 'folder',
            position: 0,
          });
        } catch (err) {
          console.warn('List creation failed during onboarding:', err);
          // Non-blocking - user can create later
        }
      }

      // 4. Create alert if enabled (non-blocking)
      if (data.alertsEnabled) {
        try {
          // Insert directly - the table has: user_id, name, filters, is_active, notification_email
          await supabase.from('user_alerts').insert({
            user_id: user?.id,
            name: 'My Thesis Alerts',
            filters: {
              sectors: cleanSectors,
              roundTypes: expandedStages,
              regions: data.geos.filter(g => g !== 'global'),
            },
            is_active: true,
            notification_email: true,
          });
        } catch (err) {
          console.warn('Alert creation failed during onboarding:', err);
          // Non-blocking - user can create later from dashboard
        }
      }

      // 5. Send team invite if provided (non-blocking)
      if (data.teamEmail?.trim()) {
        try {
          // Create org if doesn't exist
          if (!organization) {
            await createOrganizationAsync(`${firstName}'s Team`);
            // Give time for org to be fully created
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          await inviteMemberAsync({ email: data.teamEmail!, role: 'member' });
        } catch (err) {
          console.warn('Team invite failed during onboarding:', err);
          // Non-blocking - user can invite later
        }
      }

      // Refresh profile and complete
      await refreshProfile();
      toast.success('Welcome to BernardAI! 🚀');
      onComplete();
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Progress bar
  const progress = (step / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div className="w-full max-w-2xl">
          <div
            key={step}
            className="w-full animate-in fade-in-0 slide-in-from-right-4 duration-300"
          >
              {/* Step 1: Role */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">👋 Welcome to BernardAI, {firstName}!</h1>
                    <p className="text-muted-foreground text-lg">
                      Let's personalize your experience. What best describes your role?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ROLES.map(role => (
                      <button
                        key={role.id}
                        onClick={() => updateData({ role: role.id })}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          data.role === role.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-2xl">{role.icon}</span>
                        <p className="font-medium mt-2">{role.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Sectors */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">📊 What industries interest you?</h1>
                    <p className="text-muted-foreground text-lg">
                      Select multiple to see more startups
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SECTORS.map(sector => (
                      <button
                        key={sector.id}
                        onClick={() => {
                          // If selecting "all", clear others. If selecting specific, remove "all"
                          if (sector.id === 'all') {
                            setData(prev => ({ ...prev, sectors: ['all'] }));
                          } else {
                            setData(prev => ({
                              ...prev,
                              sectors: prev.sectors.includes(sector.id)
                                ? prev.sectors.filter(s => s !== sector.id)
                                : [...prev.sectors.filter(s => s !== 'all'), sector.id]
                            }));
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-center",
                          data.sectors.includes(sector.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                          sector.id === 'all' && "col-span-2 md:col-span-4"
                        )}
                      >
                        <span className="text-xl">{sector.icon}</span>
                        <p className="font-medium text-sm mt-1">{sector.label}</p>
                        {data.sectors.includes(sector.id) && (
                          <Check className="h-4 w-4 text-primary mx-auto mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    💡 Pick "All Industries" to see everything, or select 2-3 for focused results
                  </p>
                </div>
              )}

              {/* Step 3: Stages (simplified) */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">💰 What funding stages?</h1>
                    <p className="text-muted-foreground text-lg">
                      Select one or more
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {STAGE_GROUPS.map(group => (
                      <button
                        key={group.id}
                        onClick={() => {
                          // If selecting "all", clear others. If selecting specific, remove "all"
                          if (group.id === 'all') {
                            setData(prev => ({ ...prev, stages: ['all'] }));
                          } else {
                            setData(prev => ({
                              ...prev,
                              stages: prev.stages.includes(group.id)
                                ? prev.stages.filter(s => s !== group.id)
                                : [...prev.stages.filter(s => s !== 'all'), group.id]
                            }));
                          }
                        }}
                        className={cn(
                          "p-5 rounded-xl border-2 transition-all text-left",
                          data.stages.includes(group.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                          group.id === 'all' && "col-span-2"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-lg">{group.label}</p>
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                          </div>
                          {data.stages.includes(group.id) && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Geography */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">🌎 Where do you invest?</h1>
                    <p className="text-muted-foreground text-lg">
                      Select your geographic focus
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {GEOS.map(geo => (
                      <button
                        key={geo.id}
                        onClick={() => toggleArrayItem('geos', geo.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                          data.geos.includes(geo.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-xl">{geo.flag}</span>
                        <span className="font-medium">{geo.label}</span>
                        {data.geos.includes(geo.id) && (
                          <Check className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Matched Startups (The "Aha" Moment) */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">✨ Here are some startups that match your criteria!</h1>
                    <p className="text-muted-foreground">
                      Based on: {data.sectors.slice(0, 3).join(', ')} • {data.stages.slice(0, 2).join(', ')}
                    </p>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {matchedStartups.slice(0, 5).map((startup, i) => (
                      <div
                        key={startup.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {startup.is10xBet && <span className="text-sm">🦄</span>}
                              {startup.backerHotStreak && <span className="text-sm">🔥</span>}
                              {startup.isHiddenGem && <span className="text-sm">💎</span>}
                              <span className="font-semibold">{startup.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {startup.eli5}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{startup.fundingRound.type}</Badge>
                            {startup.unicornLikelihoodScore && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Score: {startup.unicornLikelihoodScore}/100
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {matchedStartups.length > 5 && (
                      <p className="text-center text-sm text-muted-foreground py-2">
                        + More
                      </p>
                    )}
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm font-medium">
                      💡 We'll save this as your investment thesis filter so you can quickly find matching startups.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 6: Create First List */}
              {step === 6 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">📁 Create your first list</h1>
                    <p className="text-muted-foreground text-lg">
                      VCs who create lists track 3x more deals
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>List name</Label>
                      <Input
                        placeholder="e.g., AI Healthcare Targets"
                        value={data.listName || ''}
                        onChange={e => updateData({ listName: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        {LIST_COLORS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => updateData({ listColor: color.id })}
                            className={cn(
                              "h-10 w-10 rounded-lg transition-all",
                              data.listColor === color.id && "ring-2 ring-offset-2 ring-primary"
                            )}
                            style={{ backgroundColor: color.color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateData({ listName: '' })}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              )}

              {/* Step 7: Team Invite & Alerts */}
              {step === 7 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">🚀 Almost there!</h1>
                    <p className="text-muted-foreground text-lg">
                      Two more things to supercharge your deal flow
                    </p>
                  </div>

                  {/* Team Invite */}
                  <div className="rounded-xl border-2 border-dashed p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Invite a team member</p>
                        <p className="text-sm text-muted-foreground">Share deal flow with a colleague</p>
                      </div>
                    </div>
                    <Input
                      type="email"
                      placeholder="colleague@vcfirm.com"
                      value={data.teamEmail || ''}
                      onChange={e => updateData({ teamEmail: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Teams using BernardAI together review 47% more startups per week.
                      You can invite up to 3 team members!
                    </p>
                  </div>

                  {/* Alerts */}
                  <div className="rounded-xl border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Get new match alerts</p>
                          <p className="text-sm text-muted-foreground">Email when new startups match your thesis</p>
                        </div>
                      </div>
                      <Switch
                        checked={data.alertsEnabled}
                        onCheckedChange={checked => updateData({ alertsEnabled: checked })}
                      />
                    </div>
                    {data.alertsEnabled && (
                      <Select
                        value={data.alertFrequency}
                        onValueChange={v => updateData({ alertFrequency: v as 'daily' | 'weekly' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily Summary</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Footer with navigation */}
      <div className="border-t p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button variant="ghost" onClick={goBack} disabled={isLoading}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i + 1 === step ? "bg-primary" : i + 1 < step ? "bg-primary/50" : "bg-muted"
                )}
              />
            ))}
          </div>

          <div>
            {step < totalSteps ? (
              <Button onClick={goNext} disabled={!canProceed()}>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Start Exploring
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;

