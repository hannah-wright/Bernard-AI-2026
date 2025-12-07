/**
 * VotingPanel Component
 * 
 * Partner voting UI for startups.
 * Shows Deal Score (average) and allows voting 1-10.
 */

import { useState } from 'react';
import {
  Star,
  StarHalf,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStartupVoting } from '@/hooks/useStartupVoting';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface VotingPanelProps {
  startupId: string;
  startupName: string;
  variant?: 'compact' | 'full';
}

export const VotingPanel = ({ 
  startupId, 
  startupName,
  variant = 'full',
}: VotingPanelProps) => {
  const { user } = useAuth();
  const {
    dealScore,
    isLoading,
    submitVote,
    removeVote,
    isSubmitting,
    hasVoted,
    userScore,
  } = useStartupVoting(startupId);

  const [showDetails, setShowDetails] = useState(false);
  const [voteValue, setVoteValue] = useState(userScore || 7);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmitVote = () => {
    submitVote({ score: voteValue, comment: comment || undefined });
    setIsEditing(false);
    setComment('');
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    if (score >= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 8) return 'bg-green-500/10 border-green-500/20';
    if (score >= 6) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score >= 4) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  if (!user) return null;

  // Compact variant - just shows the score badge
  if (variant === 'compact') {
    if (!dealScore || dealScore.count === 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Star className="h-3 w-3" />
                --
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>No team votes yet</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn("gap-1", getScoreBg(dealScore.average))}
            >
              <Star className={cn("h-3 w-3", getScoreColor(dealScore.average))} />
              <span className={getScoreColor(dealScore.average)}>
                {dealScore.average.toFixed(1)}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Deal Score: {dealScore.average.toFixed(1)}/10</p>
            <p className="text-xs text-muted-foreground">{dealScore.count} vote{dealScore.count !== 1 ? 's' : ''}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant
  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Header with Deal Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center border",
            dealScore && dealScore.count > 0 ? getScoreBg(dealScore.average) : "bg-muted"
          )}>
            <Star className={cn(
              "h-6 w-6",
              dealScore && dealScore.count > 0 ? getScoreColor(dealScore.average) : "text-muted-foreground"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-2xl font-bold",
                dealScore && dealScore.count > 0 ? getScoreColor(dealScore.average) : "text-muted-foreground"
              )}>
                {dealScore && dealScore.count > 0 ? dealScore.average.toFixed(1) : '--'}
              </span>
              <span className="text-muted-foreground">/10</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Deal Score
              {dealScore && dealScore.count > 0 && (
                <span> • {dealScore.count} vote{dealScore.count !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>

        {!hasVoted && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Star className="h-4 w-4 mr-2" />
            Vote
          </Button>
        )}
        {hasVoted && !isEditing && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Your vote: {userScore}/10
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => {
              setVoteValue(userScore || 7);
              setIsEditing(true);
            }}>
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Voting UI */}
      {isEditing && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your rating</span>
              <span className={cn("text-2xl font-bold", getScoreColor(voteValue))}>
                {voteValue}
              </span>
            </div>
            <Slider
              value={[voteValue]}
              onValueChange={([v]) => setVoteValue(v)}
              min={1}
              max={10}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pass</span>
              <span>Strong Interest</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comment (optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts on this deal..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button onClick={handleSubmitVote} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {hasVoted ? 'Update Vote' : 'Submit Vote'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
            {hasVoted && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive"
                onClick={() => {
                  removeVote();
                  setIsEditing(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Team Votes */}
      {dealScore && dealScore.votes.length > 0 && (
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between" size="sm">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Votes ({dealScore.count})
              </span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-2">
              {dealScore.votes.map((vote) => (
                <div
                  key={vote.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={vote.userAvatar} />
                    <AvatarFallback className="text-xs">
                      {vote.userName?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{vote.userName || 'Team Member'}</span>
                      <Badge variant="outline" className={cn("text-xs", getScoreBg(vote.score))}>
                        <span className={getScoreColor(vote.score)}>{vote.score}/10</span>
                      </Badge>
                    </div>
                    {vote.comment && (
                      <p className="text-sm text-muted-foreground mt-1">
                        "{vote.comment}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(vote.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

// Compact Deal Score Badge for startup cards
export const DealScoreBadge = ({ 
  startupId,
  className,
}: { 
  startupId: string;
  className?: string;
}) => {
  return (
    <VotingPanel 
      startupId={startupId} 
      startupName="" 
      variant="compact" 
    />
  );
};

