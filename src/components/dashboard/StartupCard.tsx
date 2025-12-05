import { useState } from 'react';
import { Heart, ExternalLink, MapPin, Calendar, TrendingUp, Users, DollarSign, Coins, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Startup } from '@/types/startup';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface StartupCardProps {
  startup: Startup;
  onFavoriteToggle?: (id: string) => void;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}k`;
  }
  return `$${amount}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const StartupCard = ({ startup, onFavoriteToggle }: StartupCardProps) => {
  const [isFavorite, setIsFavorite] = useState(startup.isFavorite || false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasViewedDetails, setHasViewedDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { deductCredits, credits, getCost } = useCredits();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onFavoriteToggle?.(startup.id);
  };

  const handleCardClick = async () => {
    // If not logged in, prompt to sign in
    if (!user) {
      toast.info('Sign in to view startup details', {
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth',
        },
      });
      return;
    }

    // If already viewed this session, open without charging
    if (hasViewedDetails) {
      setIsDialogOpen(true);
      return;
    }

    // Check credits before opening
    const cost = getCost('view_startup_details');
    if (credits < cost) {
      toast.error('Insufficient credits', {
        description: `Viewing details costs ${cost} credit. You have ${credits}.`,
        action: {
          label: 'Get Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    setIsLoading(true);
    const result = await deductCredits('view_startup_details', {
      description: `Viewed ${startup.name} details`,
      resourceId: startup.id,
    });
    setIsLoading(false);

    if (result.success) {
      setHasViewedDetails(true);
      setIsDialogOpen(true);
    }
  };

  const highestConfidence = startup.dataSources.reduce((highest, source) => {
    const order = { verified: 4, high: 3, medium: 2, low: 1 };
    return order[source.confidence] > order[highest] ? source.confidence : highest;
  }, 'low' as const);

  const viewCost = getCost('view_startup_details');

  return (
    <>
      <div 
        onClick={handleCardClick}
        className={cn(
          "group relative rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:border-foreground/20 hover:shadow-sm cursor-pointer",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        {/* Credit cost indicator */}
        {user && !hasViewedDetails && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground bg-secondary/80 rounded-full px-2 py-0.5">
            <Coins className="h-3 w-3" />
            <span>{viewCost}</span>
          </div>
        )}

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
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(startup.fundingRound.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-xs font-medium">{startup.metrics.buzzScore}</span>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
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

          <div className="space-y-6 mt-4">
            {/* Funding Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Funding Round</span>
                </div>
                <p className="text-2xl font-semibold">{formatCurrency(startup.fundingRound.amount)}</p>
                <Badge className="mt-2">{startup.fundingRound.type}</Badge>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Lead Investors</span>
                </div>
                <div className="space-y-1">
                  {startup.fundingRound.leadInvestors.map((investor) => (
                    <p key={investor} className="text-sm font-medium">{investor}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Industry */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Industry</h4>
              <div className="flex flex-wrap gap-1.5">
                {startup.sector.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {/* ELI5 */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">What they do (ELI5)</h4>
              <p className="text-foreground">{startup.eli5}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Est. Revenue</p>
                <p className="font-medium">{startup.metrics.estimatedRevenue || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Est. Size</p>
                <p className="font-medium">{startup.metrics.estimatedSize || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Buzz Score</p>
                <p className="font-medium">{startup.metrics.buzzScore}/100</p>
              </div>
            </div>

            {/* Data Verification */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Data Verification</h4>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                <ConfidenceBadge level={highestConfidence} />
                <span className="text-sm text-muted-foreground">
                  Verified from {startup.dataSources.length} independent source{startup.dataSources.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
