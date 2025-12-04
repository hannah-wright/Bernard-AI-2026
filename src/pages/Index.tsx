import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/dashboard/Hero';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { FilterSidebar } from '@/components/dashboard/FilterSidebar';
import { StartupGrid } from '@/components/dashboard/StartupGrid';
import { useStartups, useScrapeStartups } from '@/hooks/useStartups';
import { FilterState } from '@/types/startup';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { data: startups = [], isLoading } = useStartups();
  const { mutate: scrapeStartups, isPending: isScraping } = useScrapeStartups();
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '9999',
    fundingMin: undefined,
    fundingMax: undefined,
    roundTypes: [],
    sectors: [],
    location: '',
  });

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero onStartScouting={scrollToDashboard} />
        <StatsBar />
        
        <div ref={dashboardRef} className="container mx-auto px-4 py-8">
          {user && (
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                onClick={() => scrapeStartups()}
                disabled={isScraping}
              >
                {isScraping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Scrape New Startups
                  </>
                )}
              </Button>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-6">
            <FilterSidebar filters={filters} onFiltersChange={setFilters} />
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <StartupGrid startups={startups} filters={filters} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
