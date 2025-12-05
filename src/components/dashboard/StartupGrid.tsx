import { Startup, FilterState, SortOption } from '@/types/startup';
import { StartupCard } from './StartupCard';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { locationData, countryNameToCode, getMetrosForCountries, cityBelongsToMetro } from '@/data/locationData';

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
  sortBy = 'recently_added',
  hasNextPage,
  isFetchingNextPage,
  onLoadMore 
}: StartupGridProps) => {
  const { user } = useAuth();
  
  // Filter startups based on search query and current filters
  const filteredStartups = startups.filter((startup) => {
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

    // Date range filter - skip for bootstrapped startups (they don't have funding dates)
    if (startup.fundingRound.type !== 'Bootstrapped') {
      const fundingDateStr = startup.fundingRound.date.split('T')[0]; // Get YYYY-MM-DD
      const [year, month, day] = fundingDateStr.split('-').map(Number);
      const fundingDate = new Date(year, month - 1, day); // Local timezone
      
      let cutoffDate: Date;
      
      if (filters.dateRange === 'ytd') {
        // Year to date: from January 1st of current year
        cutoffDate = new Date(new Date().getFullYear(), 0, 1);
      } else {
        const daysAgo = parseInt(filters.dateRange);
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      }
      // Set to start of day for fair comparison
      cutoffDate.setHours(0, 0, 0, 0);
      
      if (fundingDate < cutoffDate) return false;
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
    if (sortBy === 'recently_added') {
      // Sort by when the startup was added to the database (created_at)
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    } else {
      // Sort by last funding date
      return new Date(b.fundingRound.date).getTime() - new Date(a.fundingRound.date).getTime();
    }
  });

  // Authenticated users (trial or paid) see all data; unauthenticated see first 6 only
  const blurStartIndex = user ? Infinity : 6;

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Recent Funding Rounds</h2>
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
          
          {/* Load More Button - only for authenticated users when filters aren't reducing results */}
          {user && hasNextPage && onLoadMore && filteredStartups.length === startups.length && (
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
