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
import { useCredits } from '@/hooks/useCredits';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { CsvExportCta } from '@/components/billing/CsvExportCta';

const Index = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { data: startups = [], isLoading } = useStartups();
  const { mutate: scrapeStartups, isPending: isScraping } = useScrapeStartups();
  const { 
    credits, 
    monthlyCredits, 
    showUpgradeModal, 
    setShowUpgradeModal, 
    currentPlan 
  } = useCredits();

  const handleCsvExport = () => {
    const csvContent = startups.map(s => 
      `${s.name},${s.location.city},${s.location.country},${s.sector.join(';')}`
    ).join('\n');
    const blob = new Blob([`Name,City,Country,Sectors\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'startups-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '365',
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
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <CsvExportCta onExport={handleCsvExport} startupCount={startups.length} />
            </div>
            {user && (
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
            )}
          </div>
          
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
      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        creditsRemaining={credits}
        monthlyCredits={monthlyCredits}
        currentPlan={currentPlan}
      />
    </div>
  );
};

export default Index;
