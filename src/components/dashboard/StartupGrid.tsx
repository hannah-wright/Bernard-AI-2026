import { Startup, FilterState } from '@/types/startup';
import { StartupCard } from './StartupCard';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface StartupGridProps {
  startups: Startup[];
  filters: FilterState;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export const StartupGrid = ({ 
  startups, 
  filters, 
  hasNextPage,
  isFetchingNextPage,
  onLoadMore 
}: StartupGridProps) => {
  const { user } = useAuth();
  
  // Filter startups based on current filters
  const filteredStartups = startups.filter((startup) => {
    // Date range filter
    const daysAgo = parseInt(filters.dateRange);
    const fundingDate = new Date(startup.fundingRound.date);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    if (fundingDate < cutoffDate) return false;

    // Funding amount filter
    const amountInMillions = startup.fundingRound.amount / 1000000;
    if (filters.fundingMin !== undefined && amountInMillions < filters.fundingMin) return false;
    if (filters.fundingMax !== undefined && amountInMillions > filters.fundingMax) return false;

    // Round type filter
    if (filters.roundTypes.length > 0 && !filters.roundTypes.includes(startup.fundingRound.type)) {
      return false;
    }

    // Sector filter
    if (
      filters.sectors.length > 0 &&
      !startup.sector.some((s) => filters.sectors.includes(s))
    ) {
      return false;
    }

    // Location filter
    if (filters.location && filters.location !== 'any') {
      const locationMap: Record<string, string[]> = {
        usa: ['USA', 'United States'],
        uk: ['UK', 'United Kingdom'],
        eu: ['Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Poland'],
        asia: ['China', 'Japan', 'India', 'Singapore', 'South Korea'],
      };
      const validCountries = locationMap[filters.location] || [];
      if (!validCountries.includes(startup.location.country)) return false;
    }

    return true;
  }).sort((a, b) => {
    return new Date(b.fundingRound.date).getTime() - new Date(a.fundingRound.date).getTime();
  });

  // Authenticated users (trial or paid) see all data; unauthenticated see first 6 only
  const blurStartIndex = user ? Infinity : 6;

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Recent Funding Rounds</h2>
          <p className="text-sm text-muted-foreground">
            {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} match your criteria
          </p>
        </div>
      </div>

      {filteredStartups.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStartups.map((startup, index) => {
              const isBlurred = index >= blurStartIndex;
              
              return (
                <div
                  key={startup.id}
                  className="animate-fade-in relative"
                  style={{ animationDelay: `${Math.min(index, 20) * 50}ms` }}
                >
                  <div className={isBlurred ? 'blur-sm pointer-events-none select-none' : ''}>
                    <StartupCard startup={startup} />
                  </div>
                  
                  {isBlurred && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-lg">
                      <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-foreground">Get full access</p>
                        <Button size="sm">Request Access</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Load More Button - only for authenticated users */}
          {user && hasNextPage && onLoadMore && (
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                className="min-w-[200px]"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Startups'
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="font-medium text-foreground mb-1">No startups found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your filters to see more results. You can change the date range, funding amount, or sectors.
          </p>
        </div>
      )}
    </div>
  );
};
