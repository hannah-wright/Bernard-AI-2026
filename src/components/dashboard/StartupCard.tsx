/**
 * StartupCard Component
 * 
 * Displays a startup card in the grid with click-to-expand detail dialog.
 * Uses modular tab components for better maintainability.
 */

import { useState } from 'react';
import { Heart, ExternalLink, MapPin, Calendar, TrendingUp, Building2, Coins, Lock, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Startup, ConfidenceLevel } from '@/types/startup';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Import modular tab components
import { MarketTab, TeamTab, PredictiveTab } from './startup-details';
import { AddToListButton } from './AddToListButton';
import { VotingPanel, DealScoreBadge } from './VotingPanel';

interface StartupCardProps {
  startup: Startup;
  onFavoriteToggle?: (id: string) => void;
}

export const StartupCard = ({ startup, onFavoriteToggle }: StartupCardProps) => {
  const [isFavorite, setIsFavorite] = useState(startup.isFavorite || false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [hasViewedDetails, setHasViewedDetails] = useState(false);
  
  const { user } = useAuth();
  const { deductCredits, credits, getCost } = useCredits();

  // Calculate highest confidence from data sources
  const highestConfidence = startup.dataSources.reduce((highest, source) => {
    const order: Record<ConfidenceLevel, number> = { verified: 4, high: 3, medium: 2, low: 1 };
    return order[source.confidence] > order[highest] ? source.confidence : highest;
  }, 'low' as ConfidenceLevel);

  const viewCost = getCost('view_startup_details');

  // -------------------------------------------------------------------------
  // Event Handlers
  // -------------------------------------------------------------------------

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onFavoriteToggle?.(startup.id);
  };

  const handleCardClick = async () => {
    // If not logged in, show Request Access dialog
    if (!user) {
      setShowAccessDialog(true);
      return;
    }

    // If already viewed this session, open without charging
    if (hasViewedDetails) {
      setIsDialogOpen(true);
      return;
    }

    // Check credits before opening
    if (credits < viewCost) {
      toast.error('Insufficient credits', {
        description: `Viewing details costs ${viewCost} credit. You have ${credits}.`,
        action: {
          label: 'Get Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    // Optimistic update: open dialog immediately for better UX
    setHasViewedDetails(true);
    setIsDialogOpen(true);

    // Deduct credits in background - don't block the UI
    deductCredits('view_startup_details', {
      description: `Viewed ${startup.name} details`,
      resourceId: startup.id,
    }).then((result) => {
      if (!result.success) {
        // Rollback on failure
        setHasViewedDetails(false);
        setIsDialogOpen(false);
      }
    });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      {/* Card */}
      <div 
        onClick={handleCardClick}
        className="group relative rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:shadow-sm cursor-pointer"
      >

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <span className="text-lg font-semibold text-foreground">
                {startup.name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{startup.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {startup.location.city}, {startup.location.country}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {user && (
              <AddToListButton 
                startupId={startup.id} 
                startupName={startup.name}
                variant="icon"
                size="sm"
              />
            )}
            <button
              onClick={handleFavoriteClick}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  isFavorite ? 'fill-foreground text-foreground' : 'text-muted-foreground'
                )}
              />
            </button>
          </div>
        </div>

        {/* Funding Info */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="font-medium">
            {startup.fundingRound.type}
          </Badge>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(startup.fundingRound.amount)}
          </span>
          <ConfidenceBadge level={highestConfidence} showLabel={false} />
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {startup.eli5}
        </p>

        {/* Sectors */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {startup.sector.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {startup.fundingRound.type !== 'Bootstrapped' ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Last Funded {formatDate(startup.fundingRound.date)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>Self-funded</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {/* Deal Score */}
            {user && (
              <DealScoreBadge startupId={startup.id} />
            )}
            {/* Buzz Score */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs font-medium">{startup.metrics.buzzScore}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Buzz Score: measures market interest based on press coverage, social mentions, and industry signals</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center">
                <span className="text-2xl font-semibold text-foreground">
                  {startup.name.charAt(0)}
                </span>
              </div>
              <div>
                <DialogTitle className="text-xl">{startup.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {startup.location.city}
                    {startup.location.state && `, ${startup.location.state}`}, {startup.location.country}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="market" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="predictive">Predictive AI</TabsTrigger>
            </TabsList>

            <TabsContent value="market">
              <MarketTab startup={startup} />
            </TabsContent>

            <TabsContent value="team">
              <TeamTab startup={startup} />
            </TabsContent>

            <TabsContent value="predictive">
              <PredictiveTab startup={startup} />
            </TabsContent>
          </Tabs>

          {/* Partner Voting / Deal Score */}
          {user && (
            <div className="mt-4">
              <VotingPanel startupId={startup.id} startupName={startup.name} />
            </div>
          )}

          {/* Actions - Always visible */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border mt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Website URL</p>
                <p className="text-sm font-medium truncate">{startup.website}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={startup.website} target="_blank" rel="noopener noreferrer">
                  Open website
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </a>
              </Button>
            </div>
            <Button
              variant={isFavorite ? 'secondary' : 'outline'}
              onClick={handleFavoriteClick}
            >
              <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
              {isFavorite ? 'Saved' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Access Dialog for logged out users */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <DialogTitle className="text-xl mb-2">Get Full Access</DialogTitle>
            <p className="text-muted-foreground mb-6">
              Request access to view detailed startup information, AI insights, and more.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Request Access</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
