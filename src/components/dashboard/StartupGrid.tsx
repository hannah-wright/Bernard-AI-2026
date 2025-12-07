import { useState, useMemo, useEffect } from 'react';
import { Startup, FilterState, SortOption } from '@/types/startup';
import { StartupCard } from './StartupCard';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { locationData, countryNameToCode, getMetrosForCountries, cityBelongsToMetro } from '@/data/locationData';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 50;

interface StartupGridProps {
  startups: Startup[];
  filters: FilterState;
  searchQuery?: string;
  sortBy?: SortOption;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export const StartupGrid = ({ 
  startups, 
  filters, 
  searchQuery = '',
  sortBy = 'date_added',
  hasNextPage,
  isFetchingNextPage,
  onLoadMore 
}: StartupGridProps) => {
  const { user } = useAuth();
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  // Reset display count when filters or search changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchQuery, filters, sortBy]);
  
  // Memoize filtered startups to avoid recalculating on every render
  // Only recalculate when startups, filters, searchQuery, or sortBy change
  const filteredStartups = useMemo(() => startups.filter((startup) => {
    // Search filter - match name, sectors, location, or description
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = startup.name.toLowerCase().includes(query);
      const matchesSector = startup.sector.some(s => s.toLowerCase().includes(query));
      const matchesLocation = 
        startup.location.city.toLowerCase().includes(query) ||
        startup.location.country.toLowerCase().includes(query) ||
        (startup.location.state?.toLowerCase().includes(query) ?? false);
      const matchesDescription = startup.eli5?.toLowerCase().includes(query);
      
      if (!matchesName && !matchesSector && !matchesLocation && !matchesDescription) {
        return false;
      }
    }

    // Date Added filter - filter by when startup was added to database
    if (filters.dateAddedRange && filters.dateAddedRange !== 'all') {
      const createdAt = startup.createdAt ? new Date(startup.createdAt) : null;
      if (!createdAt) return false;
      
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.dateAddedRange) {
        case 'this_week':
          cutoffDate = new Date(now);
          cutoffDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'this_month':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_month': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          if (createdAt < lastMonth || createdAt > endOfLastMonth) return false;
          cutoffDate = lastMonth; // Won't be used, but set for safety
          break;
        }
        case 'this_year':
          cutoffDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'last_30_days':
          cutoffDate = new Date(now);
          cutoffDate.setDate(now.getDate() - 30);
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'last_90_days':
          cutoffDate = new Date(now);
          cutoffDate.setDate(now.getDate() - 90);
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        default:
          cutoffDate = new Date(0); // All time
      }
      
      if (filters.dateAddedRange !== 'last_month' && createdAt < cutoffDate) return false;
    }

    // Date range filter (Last Round Date) - skip for bootstrapped startups (they don't have funding dates)
    if (startup.fundingRound.type !== 'Bootstrapped') {
      const fundingDateStr = startup.fundingRound.date.split('T')[0]; // Get YYYY-MM-DD
      const [fundingYear, month, day] = fundingDateStr.split('-').map(Number);
      const fundingDate = new Date(fundingYear, month - 1, day); // Local timezone
      
      // Handle year-specific filters (2025, 2024, 2023, 2022)
      if (['2025', '2024', '2023', '2022'].includes(filters.dateRange)) {
        const filterYear = parseInt(filters.dateRange);
        if (fundingYear !== filterYear) return false;
      } else if (filters.dateRange === 'ytd') {
        // Year to date: from January 1st of current year
        const cutoffDate = new Date(new Date().getFullYear(), 0, 1);
        cutoffDate.setHours(0, 0, 0, 0);
        if (fundingDate < cutoffDate) return false;
      } else if (filters.dateRange !== '9999') {
        // Days-based filter (7, 30, 90, 180, 365)
        const daysAgo = parseInt(filters.dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        cutoffDate.setHours(0, 0, 0, 0);
        if (fundingDate < cutoffDate) return false;
      }
      // If '9999' (All time), no filtering needed
    }

    // Current round size filter (fundingMin/Max) - skip for bootstrapped startups
    if (startup.fundingRound.type !== 'Bootstrapped') {
      if (filters.fundingMin !== undefined && startup.fundingRound.amount < filters.fundingMin) return false;
      if (filters.fundingMax !== undefined && startup.fundingRound.amount > filters.fundingMax) return false;
    }

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

    // Country filter - new drill-down pattern
    if (filters.countries.length > 0) {
      const startupCountryCode = countryNameToCode[startup.location.country] || startup.location.country;
      if (!filters.countries.includes(startupCountryCode)) {
        return false;
      }

      // Metro filter - only apply if metros are selected
      if (filters.metros.length > 0) {
        const availableMetros = getMetrosForCountries(filters.countries);
        const selectedMetros = availableMetros.filter(m => filters.metros.includes(m.id));
        const cityMatchesMetro = selectedMetros.some(m => cityBelongsToMetro(startup.location.city, m));
        if (!cityMatchesMetro) {
          return false;
        }
      }
    }

    // HQ Region filter
    if (filters.regions.length > 0 && startup.region && !filters.regions.includes(startup.region)) {
      return false;
    }

    // Primary Market filter
    if (filters.primaryMarkets.length > 0 && startup.primaryMarket && !filters.primaryMarkets.includes(startup.primaryMarket)) {
      return false;
    }

    // Business Model filter
    if (filters.businessModels.length > 0 && startup.businessModel && !filters.businessModels.includes(startup.businessModel)) {
      return false;
    }

    // Company Type filter
    if (filters.companyTypes.length > 0 && startup.companyType && !filters.companyTypes.includes(startup.companyType)) {
      return false;
    }

    // Target Customer filter
    if (filters.targetCustomers.length > 0 && startup.targetCustomer && !filters.targetCustomers.includes(startup.targetCustomer)) {
      return false;
    }

    // Founder Type filter
    if (filters.founderTypes.length > 0 && startup.founderType && !filters.founderTypes.includes(startup.founderType)) {
      return false;
    }

    // Serial Founder filter
    if (filters.isSerialFounder !== undefined && startup.isSerialFounder !== filters.isSerialFounder) {
      return false;
    }

    // FAANG Alumni filter
    if (filters.hasFaangAlumni !== undefined && startup.hasFaangAlumni !== filters.hasFaangAlumni) {
      return false;
    }

    // Prior Exit filter
    if (filters.hasPriorExit !== undefined && startup.hasPriorExit !== filters.hasPriorExit) {
      return false;
    }

    // Prior IPO filter
    if (filters.hasPriorIPO !== undefined && startup.hasPriorIPO !== filters.hasPriorIPO) {
      return false;
    }

    // Cofounders Worked Together filter
    if (filters.cofoundersWorkedTogether !== undefined && startup.cofoundersWorkedTogetherBefore !== filters.cofoundersWorkedTogether) {
      return false;
    }

    // Founding Team Signal filter
    if (filters.foundingTeamSignalBands.length > 0 && startup.foundingTeamSignal?.score !== undefined) {
      const score = startup.foundingTeamSignal.score;
      const matchesBand = filters.foundingTeamSignalBands.some(band => {
        switch (band) {
          case 'exceptional': return score >= 80;
          case 'strong': return score >= 60 && score < 80;
          case 'good': return score >= 40 && score < 60;
          case 'average': return score < 40;
          default: return false;
        }
      });
      if (!matchesBand) return false;
    }

    // Hiring Velocity filter
    if (filters.hiringVelocityBands.length > 0 && startup.hiringVelocityScore !== undefined) {
      const score = startup.hiringVelocityScore;
      const matchesBand = filters.hiringVelocityBands.some(band => {
        switch (band) {
          case 'explosive': return score >= 80;
          case 'strong': return score >= 60 && score < 80;
          case 'moderate': return score >= 40 && score < 60;
          case 'stable': return score >= 20 && score < 40;
          case 'declining': return score < 20;
          default: return false;
        }
      });
      if (!matchesBand) return false;
    }

    // ==========================================================================
    // ADVANCED ML SCORE FILTERS
    // ==========================================================================

    // Unicorn Likelihood Score filter
    if (filters.unicornScoreMin !== undefined && 
        (startup.unicornLikelihoodScore === undefined || startup.unicornLikelihoodScore < filters.unicornScoreMin)) {
      return false;
    }
    if (filters.unicornScoreMax !== undefined && 
        startup.unicornLikelihoodScore !== undefined && 
        startup.unicornLikelihoodScore > filters.unicornScoreMax) {
      return false;
    }
    
    // 10x Bets only filter
    if (filters.only10xBets && !startup.is10xBet) {
      return false;
    }

    // Backer Quality Score filter
    if (filters.backerScoreMin !== undefined && 
        (startup.backerQualityScore === undefined || startup.backerQualityScore < filters.backerScoreMin)) {
      return false;
    }
    if (filters.backerScoreMax !== undefined && 
        startup.backerQualityScore !== undefined && 
        startup.backerQualityScore > filters.backerScoreMax) {
      return false;
    }
    
    // Backer Hot Streak filter
    if (filters.backerHotStreakOnly && !startup.backerHotStreak) {
      return false;
    }

    // Hidden Gem filters
    if (filters.hiddenGemOnly && !startup.isHiddenGem) {
      return false;
    }
    if (filters.isBootstrappedGrowth && !startup.isBootstrappedGrowth) {
      return false;
    }
    if (filters.hasIndiePresence && !startup.hasIndiePresence) {
      return false;
    }
    if (filters.hasNoCrunchbase && !startup.hasNoCrunchbase) {
      return false;
    }
    if (filters.minPatentFilings !== undefined && 
        (startup.recentPatentFilings === undefined || startup.recentPatentFilings < filters.minPatentFilings)) {
      return false;
    }
    if (filters.minHiringStreakWeeks !== undefined && 
        (startup.hiringStreakWeeks === undefined || startup.hiringStreakWeeks < filters.minHiringStreakWeeks)) {
      return false;
    }

    // ==========================================================================

    // Accelerator filter
    if (filters.accelerators.length > 0 && startup.accelerator && !filters.accelerators.includes(startup.accelerator)) {
      return false;
    }

    // Investor Quality filter
    if (filters.investorQualities.length > 0 && startup.investorQuality && !filters.investorQualities.includes(startup.investorQuality)) {
      return false;
    }

    // Total Raised filter
    if (filters.totalRaisedMin !== undefined && startup.totalRaised !== undefined && startup.totalRaised < filters.totalRaisedMin) {
      return false;
    }
    if (filters.totalRaisedMax !== undefined && startup.totalRaised !== undefined && startup.totalRaised > filters.totalRaisedMax) {
      return false;
    }

    // Runway Band filter
    if (filters.runwayBands.length > 0 && startup.runwayBand && !filters.runwayBands.includes(startup.runwayBand)) {
      return false;
    }

    // Burn Multiple filter
    if (filters.burnMultipleBands.length > 0 && startup.burnMultipleBand && !filters.burnMultipleBands.includes(startup.burnMultipleBand)) {
      return false;
    }

    // Round Status filter
    if (filters.roundStatuses.length > 0 && startup.roundStatus && !filters.roundStatuses.includes(startup.roundStatus)) {
      return false;
    }

    // Has Lead filter
    if (filters.hasLead !== undefined && startup.hasLead !== filters.hasLead) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'date_added') {
      // Sort by when the startup was added to the database (created_at)
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    } else {
      // Sort by last funding date
      return new Date(b.fundingRound.date).getTime() - new Date(a.fundingRound.date).getTime();
    }
  }), [startups, filters, searchQuery, sortBy]);

  // Paginate: show only displayCount items
  const paginatedStartups = useMemo(() => {
    return filteredStartups.slice(0, displayCount);
  }, [filteredStartups, displayCount]);
  
  const hasMoreToShow = filteredStartups.length > displayCount;
  const remainingCount = filteredStartups.length - displayCount;

  // Authenticated users see all data; unauthenticated see first 4 only
  const blurStartIndex = user ? Infinity : 4;
  
  // For logged out users, show placeholder blurred cards to fill the grid
  const placeholderCount = !user ? Math.max(0, 6 - paginatedStartups.length) : 0;
  
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
    // If we need more data from the server, fetch it
    if (onLoadMore && hasNextPage) {
      onLoadMore();
    }
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Startups to Explore:</h2>
          <p className="text-sm text-muted-foreground">
            Showing {paginatedStartups.length} of {filteredStartups.length} startups
          </p>
        </div>
      </div>

      {filteredStartups.length > 0 || !user ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedStartups.map((startup, index) => {
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
                        <Button size="sm" asChild>
                          <Link to="/auth">Request Access</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Placeholder blurred cards for logged out users */}
            {!user && Array.from({ length: placeholderCount }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="animate-fade-in relative"
                style={{ animationDelay: `${Math.min(paginatedStartups.length + index, 20) * 50}ms` }}
              >
                <div className="blur-sm pointer-events-none select-none">
                  <div className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary" />
                        <div>
                          <div className="h-4 w-24 bg-secondary rounded" />
                          <div className="h-3 w-20 bg-secondary rounded mt-1" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-5 w-16 bg-secondary rounded" />
                      <div className="h-5 w-12 bg-secondary rounded" />
                    </div>
                    <div className="h-8 w-full bg-secondary rounded mb-3" />
                    <div className="flex gap-1.5 mb-3">
                      <div className="h-5 w-12 bg-secondary rounded" />
                      <div className="h-5 w-14 bg-secondary rounded" />
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between">
                      <div className="h-3 w-24 bg-secondary rounded" />
                      <div className="h-3 w-8 bg-secondary rounded" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-lg">
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">Get full access</p>
                    <Button size="sm" asChild>
                      <Link to="/auth">Request Access</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More Button - show when there are more results (either locally filtered or from server) */}
          {user && (hasMoreToShow || hasNextPage) && (
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="min-w-[200px] gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Load More {hasMoreToShow ? `(${remainingCount} remaining)` : ''}
                  </>
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
