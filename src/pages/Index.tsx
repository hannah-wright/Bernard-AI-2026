import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { FilterSidebar } from '@/components/dashboard/FilterSidebar';
import { StartupGrid } from '@/components/dashboard/StartupGrid';
import { useStartups } from '@/hooks/useStartups';
import { FilterState } from '@/types/startup';
import { Loader2 } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { CsvExportCta } from '@/components/billing/CsvExportCta';

const Index = () => {
  const { 
    startups = [], 
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useStartups();
  const { 
    credits, 
    monthlyCredits, 
    showUpgradeModal, 
    setShowUpgradeModal, 
    currentPlan 
  } = useCredits();

  const handleCsvExport = () => {
    const escapeCSV = (value: string | undefined | null) => {
      if (!value) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatCurrency = (amount: number) => {
      if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
      if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
      return `$${amount}`;
    };

    const headers = [
      'Name', 'Website', 'City', 'State', 'Country', 'Sectors',
      'Funding Round', 'Funding Amount', 'Funding Date', 'Lead Investors',
      'ELI5 Description', 'Est. Revenue', 'Est. Size', 'Buzz Score'
    ].join(',');

    const csvContent = startups.map(s => [
      escapeCSV(s.name),
      escapeCSV(s.website),
      escapeCSV(s.location.city),
      escapeCSV(s.location.state),
      escapeCSV(s.location.country),
      escapeCSV(s.sector.join('; ')),
      escapeCSV(s.fundingRound.type),
      escapeCSV(formatCurrency(s.fundingRound.amount)),
      escapeCSV(s.fundingRound.date),
      escapeCSV(s.fundingRound.leadInvestors.join('; ')),
      escapeCSV(s.eli5),
      escapeCSV(s.metrics.estimatedRevenue),
      escapeCSV(s.metrics.estimatedSize),
      s.metrics.buzzScore
    ].join(',')).join('\n');

    const blob = new Blob([`${headers}\n${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bernardai-startups-${new Date().toISOString().split('T')[0]}.csv`;
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
    regions: [],
    primaryMarkets: [],
    businessModels: [],
    companyTypes: [],
    targetCustomers: [],
    founderTypes: [],
    isSerialFounder: undefined,
    accelerators: [],
    hasFaangAlumni: undefined,
    hasPriorExit: undefined,
    investorQualities: [],
    totalRaisedMin: undefined,
    totalRaisedMax: undefined,
    runwayBands: [],
    burnMultipleBands: [],
    roundStatuses: [],
    hasLead: undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <CsvExportCta onExport={handleCsvExport} startupCount={startups.length} />
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <FilterSidebar filters={filters} onFiltersChange={setFilters} />
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <StartupGrid 
                startups={startups} 
                filters={filters}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
              />
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
