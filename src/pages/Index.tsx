import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { FilterSidebar } from '@/components/dashboard/FilterSidebar';
import { StartupGrid } from '@/components/dashboard/StartupGrid';
import { ValueDashboard } from '@/components/dashboard/ValueDashboard';
import { WhyBernardAIBanner } from '@/components/dashboard/DataDifferentiator';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useStartups } from '@/hooks/useStartups';
import { useOnboarding } from '@/hooks/useOnboarding';
import { FilterState, SortOption, Startup } from '@/types/startup';
import { Loader2, Search, X } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { CsvExportCta } from '@/components/billing/CsvExportCta';
import { CustomExportDialog } from '@/components/billing/CustomExportDialog';
import { EXPORT_COLUMNS } from '@/hooks/useExportTemplates';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

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
  const { needsOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingJustCompleted, setOnboardingJustCompleted] = useState(false);
  const [showCustomExport, setShowCustomExport] = useState(false);

  // Show onboarding for new users (but not if they just completed it)
  useEffect(() => {
    if (!onboardingLoading && needsOnboarding && !onboardingJustCompleted) {
      setShowOnboarding(true);
    }
  }, [needsOnboarding, onboardingLoading, onboardingJustCompleted]);

  const handleOnboardingComplete = () => {
    setOnboardingJustCompleted(true); // Prevent useEffect from re-showing onboarding
    setShowOnboarding(false);
  };

  // Helper functions for CSV export
  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return '';
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const formatPercent = (value: number | undefined | null) => {
    if (value === null || value === undefined) return '';
    return `${(value * 100).toFixed(0)}%`;
  };

  const formatScore = (score: number | undefined | null) => {
    if (score === null || score === undefined) return '';
    return `${score}/100`;
  };

  // Get value for a specific column key
  const getColumnValue = (s: Startup, key: string): string => {
    // Format prior exits
    const priorExitDetails = s.priorExits?.map(e => 
      `${e.company_name}${e.acquirer ? ` (acquired by ${e.acquirer})` : ''}${e.exit_year ? ` ${e.exit_year}` : ''}${e.exit_amount ? ` ${formatCurrency(e.exit_amount)}` : ''}`
    ).join('; ') || '';

    // Format prior IPO
    const priorIPOInfo = s.priorIPODetails ? 
      `${s.priorIPODetails.company_name}${s.priorIPODetails.ipo_year ? ` (${s.priorIPODetails.ipo_year})` : ''}${s.priorIPODetails.ticker_symbol ? ` ${s.priorIPODetails.ticker_symbol}` : ''}` : '';

    // Get all investors from funding history
    const allInvestors = s.fundingHistory?.flatMap(r => [...(r.leadInvestors || []), ...(r.allInvestors || [])]).filter((v, i, a) => a.indexOf(v) === i).join('; ') || s.fundingRound.leadInvestors.join('; ');

    // Get notable investors from social proof
    const notableInvestors = s.socialProof?.notable_investors?.join('; ') || '';

    const valueMap: Record<string, string> = {
      // Basic Info
      name: s.name,
      website: s.website,
      description: s.eli5,
      // Location
      city: s.location.city,
      state: s.location.state || '',
      country: s.location.country,
      region: s.region || '',
      // Business
      sectors: s.sector.join('; '),
      businessModel: s.businessModel || '',
      companyType: s.companyType || '',
      targetCustomer: s.targetCustomer || '',
      // Funding
      currentRound: s.fundingRound.type,
      roundAmount: formatCurrency(s.fundingRound.amount),
      roundDate: s.fundingRound.date,
      leadInvestors: s.fundingRound.leadInvestors.join('; '),
      allInvestors: allInvestors,
      totalRaised: formatCurrency(s.totalRaised),
      fundingRoundsCount: String(s.fundingHistory?.length || 1),
      // Financials
      revenue: s.metrics.estimatedRevenue || '',
      revenueConfidence: s.metrics.revenueConfidence || 'estimated',
      teamSize: s.metrics.estimatedSize || '',
      // Founder Signals
      founderType: s.founderType || '',
      serialFounder: s.isSerialFounder ? 'Yes' : 'No',
      hasFaangAlumni: s.hasFaangAlumni ? 'Yes' : 'No',
      hasPriorExit: s.hasPriorExit ? 'Yes' : 'No',
      priorExitCount: String(s.priorExitCount || 0),
      priorExitDetails: priorExitDetails,
      hasPriorIPO: s.hasPriorIPO ? 'Yes' : 'No',
      priorIPODetails: priorIPOInfo,
      // Team Signals
      teamStructure: s.teamStructureType || '',
      cofoundersWorkedTogether: s.cofoundersWorkedTogetherBefore ? 'Yes' : 'No',
      foundingTeamScore: formatScore(s.foundingTeamSignal?.score),
      // Hiring & Growth
      currentHeadcount: String(s.headcountGrowth?.current || ''),
      headcount6moAgo: String(s.headcountGrowth?.sixMonthsAgo || ''),
      headcountGrowthRate: s.headcountGrowth?.growthRate6Mo ? `${s.headcountGrowth.growthRate6Mo}%` : '',
      engineeringHeadcount: String(s.headcountGrowth?.engineeringCurrent || ''),
      hiringVelocityScore: formatScore(s.hiringVelocityScore),
      // Investors
      investorTrackRecord: s.investorQuality || '',
      notableInvestors: notableInvestors,
      leadInvestorExitRate: formatPercent(s.leadInvestorExitRate),
      investorsWithUnicornExits: s.investorsWithUnicornExits?.join('; ') || '',
      // ML Scores
      unicornScore: formatScore(s.unicornLikelihoodScore),
      is10xBet: s.is10xBet ? 'Yes' : 'No',
      backerQualityScore: formatScore(s.backerQualityScore),
      backerHotStreak: s.backerHotStreak ? 'Yes' : 'No',
      hiddenGemScore: formatScore(s.hiddenGemScore),
      isHiddenGem: s.isHiddenGem ? 'Yes' : 'No',
      // Other Signals
      accelerator: s.accelerator || '',
      buzzScore: String(s.metrics.buzzScore),
      hasIndiePresence: s.hasIndiePresence ? 'Yes' : 'No',
      recentPatentFilings: String(s.recentPatentFilings || ''),
      hiringStreakWeeks: String(s.hiringStreakWeeks || ''),
      // Data Quality
      dataSourcesCount: String(s.dataSources.length),
      primaryDataSource: s.dataSources[0]?.name || '',
    };

    return valueMap[key] || '';
  };

  // Custom export with selected columns
  const handleCustomExport = (selectedColumns: string[], format: 'csv' | 'tsv' = 'csv') => {
    const delimiter = format === 'tsv' ? '\t' : ',';
    const escapeValue = format === 'tsv' 
      ? (v: string) => v.replace(/\t/g, ' ').replace(/\n/g, ' ')
      : escapeCSV;

    // Build headers with (Est) suffix where applicable
    const headers = selectedColumns.map(key => {
      const col = EXPORT_COLUMNS.find(c => c.key === key);
      if (!col) return key;
      return col.isEstimated ? `${col.label} (Est)` : col.label;
    }).join(delimiter);

    // Build rows
    const csvContent = startups.map(s => 
      selectedColumns.map(key => escapeValue(getColumnValue(s, key))).join(delimiter)
    ).join('\n');

    // Download
    const mimeType = format === 'tsv' ? 'text/tab-separated-values' : 'text/csv';
    const blob = new Blob([`${headers}\n${csvContent}`], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bernardai-startups-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick export with all columns (legacy)
  const handleCsvExport = () => {
    const escapeCSV = (value: string | number | undefined | null) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatCurrency = (amount: number | undefined | null) => {
      if (!amount) return '';
      if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
      if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
      return `$${amount}`;
    };

    const formatPercent = (value: number | undefined | null) => {
      if (value === null || value === undefined) return '';
      return `${(value * 100).toFixed(0)}%`;
    };

    const formatScore = (score: number | undefined | null) => {
      if (score === null || score === undefined) return '';
      return `${score}/100`;
    };

    // Comprehensive headers for VC analysis
    const headers = [
      // Basic Info
      'Name', 'Website', 'Description',
      // Location
      'City', 'State', 'Country', 'Region',
      // Sectors & Business
      'Sectors', 'Business Model', 'Company Type', 'Target Customer',
      // Current Funding Round
      'Current Round', 'Round Amount', 'Round Date', 'Lead Investors', 'All Investors',
      // Funding History
      'Total Raised', 'Funding Rounds Count',
      // Financials (marked as estimated where applicable)
      'Revenue (Est)', 'Revenue Confidence', 'Team Size (Est)', 
      // Founder & Team Signals
      'Founder Type', 'Serial Founder', 'Has FAANG Alumni', 
      'Has Prior Exit', 'Prior Exit Count', 'Prior Exit Details',
      'Has Prior IPO', 'Prior IPO Details',
      'Team Structure', 'Cofounders Worked Together Before',
      'Founding Team Signal Score', 
      // Hiring & Growth
      'Current Headcount (Est)', 'Headcount 6mo Ago (Est)', 'Headcount Growth Rate (Est)',
      'Engineering Headcount (Est)', 'Hiring Velocity Score',
      // Investor Quality
      'Investor Track Record', 'Notable Investors',
      'Lead Investor Exit Rate', 'Investors With Unicorn Exits',
      // ML Scores
      'Unicorn Likelihood Score', 'Is 10x Bet',
      'Backer Quality Score', 'Backer Hot Streak',
      'Hidden Gem Score', 'Is Hidden Gem',
      // Other Signals
      'Accelerator', 'Buzz Score',
      'Has Indie Presence', 'Recent Patent Filings', 'Hiring Streak (weeks)',
      // Data Quality
      'Data Sources Count', 'Primary Data Source'
    ].join(',');

    const csvContent = startups.map(s => {
      // Format prior exits
      const priorExitDetails = s.priorExits?.map(e => 
        `${e.company_name}${e.acquirer ? ` (acquired by ${e.acquirer})` : ''}${e.exit_year ? ` ${e.exit_year}` : ''}${e.exit_amount ? ` ${formatCurrency(e.exit_amount)}` : ''}`
      ).join('; ') || '';

      // Format prior IPO
      const priorIPOInfo = s.priorIPODetails ? 
        `${s.priorIPODetails.company_name}${s.priorIPODetails.ipo_year ? ` (${s.priorIPODetails.ipo_year})` : ''}${s.priorIPODetails.ticker_symbol ? ` ${s.priorIPODetails.ticker_symbol}` : ''}` : '';

      // Get all investors from funding history
      const allInvestors = s.fundingHistory?.flatMap(r => [...(r.leadInvestors || []), ...(r.allInvestors || [])]).filter((v, i, a) => a.indexOf(v) === i).join('; ') || s.fundingRound.leadInvestors.join('; ');

      // Get notable investors from social proof
      const notableInvestors = s.socialProof?.notable_investors?.join('; ') || '';

      return [
        // Basic Info
        escapeCSV(s.name),
        escapeCSV(s.website),
        escapeCSV(s.eli5),
        // Location
        escapeCSV(s.location.city),
        escapeCSV(s.location.state),
        escapeCSV(s.location.country),
        escapeCSV(s.region),
        // Sectors & Business
        escapeCSV(s.sector.join('; ')),
        escapeCSV(s.businessModel),
        escapeCSV(s.companyType),
        escapeCSV(s.targetCustomer),
        // Current Funding Round
        escapeCSV(s.fundingRound.type),
        escapeCSV(formatCurrency(s.fundingRound.amount)),
        escapeCSV(s.fundingRound.date),
        escapeCSV(s.fundingRound.leadInvestors.join('; ')),
        escapeCSV(allInvestors),
        // Funding History
        escapeCSV(formatCurrency(s.totalRaised)),
        escapeCSV(s.fundingHistory?.length || 1),
        // Financials
        escapeCSV(s.metrics.estimatedRevenue),
        escapeCSV(s.metrics.revenueConfidence || 'estimated'),
        escapeCSV(s.metrics.estimatedSize),
        // Founder & Team Signals
        escapeCSV(s.founderType),
        escapeCSV(s.isSerialFounder ? 'Yes' : 'No'),
        escapeCSV(s.hasFaangAlumni ? 'Yes' : 'No'),
        escapeCSV(s.hasPriorExit ? 'Yes' : 'No'),
        escapeCSV(s.priorExitCount),
        escapeCSV(priorExitDetails),
        escapeCSV(s.hasPriorIPO ? 'Yes' : 'No'),
        escapeCSV(priorIPOInfo),
        escapeCSV(s.teamStructureType),
        escapeCSV(s.cofoundersWorkedTogetherBefore ? 'Yes' : 'No'),
        escapeCSV(formatScore(s.foundingTeamSignal?.score)),
        // Hiring & Growth
        escapeCSV(s.headcountGrowth?.current),
        escapeCSV(s.headcountGrowth?.sixMonthsAgo),
        escapeCSV(s.headcountGrowth?.growthRate6Mo ? `${s.headcountGrowth.growthRate6Mo}%` : ''),
        escapeCSV(s.headcountGrowth?.engineeringCurrent),
        escapeCSV(formatScore(s.hiringVelocityScore)),
        // Investor Quality
        escapeCSV(s.investorQuality),
        escapeCSV(notableInvestors),
        escapeCSV(formatPercent(s.leadInvestorExitRate)),
        escapeCSV(s.investorsWithUnicornExits?.join('; ')),
        // ML Scores
        escapeCSV(formatScore(s.unicornLikelihoodScore)),
        escapeCSV(s.is10xBet ? 'Yes' : 'No'),
        escapeCSV(formatScore(s.backerQualityScore)),
        escapeCSV(s.backerHotStreak ? 'Yes' : 'No'),
        escapeCSV(formatScore(s.hiddenGemScore)),
        escapeCSV(s.isHiddenGem ? 'Yes' : 'No'),
        // Other Signals
        escapeCSV(s.accelerator),
        escapeCSV(s.metrics.buzzScore),
        escapeCSV(s.hasIndiePresence ? 'Yes' : 'No'),
        escapeCSV(s.recentPatentFilings),
        escapeCSV(s.hiringStreakWeeks),
        // Data Quality
        escapeCSV(s.dataSources.length),
        escapeCSV(s.dataSources[0]?.name)
      ].join(',');
    }).join('\n');

    const blob = new Blob([`${headers}\n${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bernardai-startups-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '9999', // All time - don't filter by funding date by default
    dateAddedRange: 'all', // Show all startups by default, sorted by recently added
    fundingMin: undefined,
    fundingMax: undefined,
    roundTypes: [],
    sectors: [],
    countries: [],
    metros: [],
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
    hasPriorIPO: undefined,
    investorQualities: [],
    hiringVelocityBands: [],
    foundingTeamSignalBands: [],
    cofoundersWorkedTogether: undefined,
    totalRaisedMin: undefined,
    totalRaisedMax: undefined,
    runwayBands: [],
    burnMultipleBands: [],
    roundStatuses: [],
    hasLead: undefined,
    // Advanced ML Score filters
    unicornScoreMin: undefined,
    unicornScoreMax: undefined,
    unicornScoreBands: [],
    only10xBets: undefined,
    backerScoreMin: undefined,
    backerScoreMax: undefined,
    backerScoreBands: [],
    backerHotStreakOnly: undefined,
    hiddenGemOnly: undefined,
    hiddenGemStatuses: [],
    isBootstrappedGrowth: undefined,
    hasIndiePresence: undefined,
    hasNoCrunchbase: undefined,
    minPatentFilings: undefined,
    minHiringStreakWeeks: undefined,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_added');

  // Debounce search query - wait 300ms after user stops typing before filtering
  // This makes search feel much faster and reduces unnecessary re-renders
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Auto-load all pages when filters are active that need complete data
  // This ensures filtering works across all data, not just loaded pages
  const needsFullData = 
    debouncedSearchQuery.trim().length > 0 || 
    filters.roundTypes.includes('Bootstrapped') ||
    (filters.dateRange !== '9999') || // Not "All time" for Last Round Date
    (filters.dateAddedRange && filters.dateAddedRange !== 'all'); // Date Added filter active
  
  useEffect(() => {
    if (needsFullData && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [needsFullData, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Show onboarding flow for new users
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-8">
          {/* Value Dashboard - Shows ROI and value created */}
          <ValueDashboard />
          
          {/* Data Differentiation Banner */}
          <div className="mb-6">
            <WhyBernardAIBanner />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search startups by name, industry, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_added">Date Added</SelectItem>
                    <SelectItem value="last_funded">Last Round Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CsvExportCta 
                onExport={handleCsvExport} 
                onCustomExport={() => setShowCustomExport(true)}
                startupCount={startups.length} 
              />
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
                searchQuery={debouncedSearchQuery}
                sortBy={sortBy}
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

      {/* Custom Export Dialog */}
      <CustomExportDialog
        isOpen={showCustomExport}
        onClose={() => setShowCustomExport(false)}
        startups={startups}
        onExport={handleCustomExport}
        getColumnValue={getColumnValue}
      />
    </div>
  );
};

export default Index;
