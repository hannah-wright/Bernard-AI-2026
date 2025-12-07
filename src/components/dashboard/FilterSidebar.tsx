import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronRight, Bell, Sparkles, TrendingUp, Eye, Rocket } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  FilterState, 
  RoundType, 
  Sector, 
  Region, 
  BusinessModel, 
  CompanyType, 
  TargetCustomer,
  FounderType,
  Accelerator,
  InvestorQuality,
  RunwayBand,
  BurnMultipleBand,
  RoundStatus,
  HiringVelocityBand,
  FoundingTeamSignalBand,
  UnicornScoreBand,
  BackerScoreBand,
  HiddenGemStatus
} from '@/types/startup';
import { useAlerts, describeFilters } from '@/hooks/useAlerts';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { locationData, getMetrosForCountries } from '@/data/locationData';
import { useCountries, useMetros } from '@/hooks/useCountries';
import { SavedThesisProfiles } from './SavedThesisProfiles';

type FundingUnit = 'K' | 'M';

const roundTypes: RoundType[] = ['Bootstrapped', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+'];
const sectors: Sector[] = ['AI/ML', 'Fintech', 'Healthcare', 'SaaS', 'E-commerce', 'Biotech', 'Climate Tech', 'Enterprise', 'Consumer'];
const regions: Region[] = ['US', 'EU', 'LATAM', 'APAC', 'MEA', 'Remote/Global'];
const businessModels: BusinessModel[] = ['B2B', 'B2C', 'B2B2C'];
const companyTypes: CompanyType[] = ['SaaS', 'Marketplace', 'Fintech', 'Hardware', 'Services', 'Other'];
const targetCustomers: TargetCustomer[] = ['SMB', 'Mid-market', 'Enterprise', 'Consumer', 'All'];
const founderTypes: FounderType[] = ['Solo', 'Team'];
const accelerators: Accelerator[] = ['YC', 'Techstars', 'a16z', '500 Startups', 'Other Tier-1', 'None'];
const investorTrackRecords: InvestorQuality[] = ['Unicorn-backers', 'Multi-exit fund', 'Established fund', 'Angel/Seed-focus'];
const runwayBands: RunwayBand[] = ['<6 months', '6-12 months', '12-18 months', '18+ months'];
const burnMultipleBands: BurnMultipleBand[] = ['<1x', '1-2x', '2-3x', '>3x'];
const roundStatuses: RoundStatus[] = ['Raising', 'Recently Closed', 'Exploring'];

// New: Hiring velocity filter options
const hiringVelocityBands: HiringVelocityBand[] = ['explosive', 'strong', 'moderate', 'stable', 'declining'];
const hiringVelocityLabels: Record<HiringVelocityBand, string> = {
  explosive: 'Explosive (80+)',
  strong: 'Strong (60-79)',
  moderate: 'Moderate (40-59)',
  stable: 'Stable (20-39)',
  declining: 'Declining (<20)'
};

// New: Founding team signal filter options
const foundingTeamSignalBands: FoundingTeamSignalBand[] = ['exceptional', 'strong', 'good', 'average'];
const foundingTeamSignalLabels: Record<FoundingTeamSignalBand, string> = {
  exceptional: 'Exceptional (80+)',
  strong: 'Strong (60-79)',
  good: 'Good (40-59)',
  average: 'Average (<40)'
};

// Unicorn Likelihood Score bands
const unicornScoreBands: UnicornScoreBand[] = ['exceptional', 'high', 'moderate', 'low'];
const unicornScoreBandLabels: Record<UnicornScoreBand, string> = {
  exceptional: '🦄 Top 5% (80+)',
  high: 'High Potential (60-79)',
  moderate: 'Moderate (40-59)',
  low: 'Lower (<40)'
};

// Backer Quality Score bands
const backerScoreBands: BackerScoreBand[] = ['elite', 'strong', 'good', 'standard'];
const backerScoreBandLabels: Record<BackerScoreBand, string> = {
  elite: '🔥 Elite Backers (80+)',
  strong: 'Strong Track Record (60-79)',
  good: 'Good Backers (40-59)',
  standard: 'Standard (<40)'
};

// Hidden Gem status options
const hiddenGemStatuses: HiddenGemStatus[] = ['hidden-gem', 'emerging', 'none'];
const hiddenGemStatusLabels: Record<HiddenGemStatus, string> = {
  'hidden-gem': '💎 Hidden Gem',
  'emerging': 'Emerging Signal',
  'none': 'Standard Profile'
};

const dateRanges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last 12 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '9999', label: 'All time' },
];

const dateAddedRanges = [
  { value: 'all', label: 'All time' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_year', label: 'This Year' },
];

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FilterSection = ({ title, children, defaultOpen = false }: FilterSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        {title}
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const FilterSidebar = ({ filters, onFiltersChange }: FilterSidebarProps) => {
  const [fundingUnit, setFundingUnit] = useState<FundingUnit>('M');
  const [totalRaisedUnit, setTotalRaisedUnit] = useState<FundingUnit>('M');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [alertFrequency, setAlertFrequency] = useState<'daily' | 'weekly'>('daily');
  const { data: dbCountries = [] } = useCountries();
  const { data: dbMetros = [] } = useMetros();
  const { alerts, createAlert, isCreating } = useAlerts();

  const getActualValue = (displayValue: number | undefined, unit: FundingUnit): number | undefined => {
    if (displayValue === undefined) return undefined;
    return unit === 'K' ? displayValue * 1000 : displayValue * 1000000;
  };

  const getDisplayValue = (actualValue: number | undefined, unit: FundingUnit): number | undefined => {
    if (actualValue === undefined) return undefined;
    return unit === 'K' ? actualValue / 1000 : actualValue / 1000000;
  };

  const handleFundingMinChange = (displayValue: string) => {
    const numValue = displayValue ? Number(displayValue) : undefined;
    onFiltersChange({ ...filters, fundingMin: getActualValue(numValue, fundingUnit) });
  };

  const handleFundingMaxChange = (displayValue: string) => {
    const numValue = displayValue ? Number(displayValue) : undefined;
    onFiltersChange({ ...filters, fundingMax: getActualValue(numValue, fundingUnit) });
  };

  const handleUnitChange = (newUnit: FundingUnit) => {
    const currentMinDisplay = getDisplayValue(filters.fundingMin, fundingUnit);
    const currentMaxDisplay = getDisplayValue(filters.fundingMax, fundingUnit);
    setFundingUnit(newUnit);
    onFiltersChange({
      ...filters,
      fundingMin: getActualValue(currentMinDisplay, newUnit),
      fundingMax: getActualValue(currentMaxDisplay, newUnit),
    });
  };

  const handleTotalRaisedMinChange = (displayValue: string) => {
    const numValue = displayValue ? Number(displayValue) : undefined;
    onFiltersChange({ ...filters, totalRaisedMin: getActualValue(numValue, totalRaisedUnit) });
  };

  const handleTotalRaisedMaxChange = (displayValue: string) => {
    const numValue = displayValue ? Number(displayValue) : undefined;
    onFiltersChange({ ...filters, totalRaisedMax: getActualValue(numValue, totalRaisedUnit) });
  };

  const handleTotalRaisedUnitChange = (newUnit: FundingUnit) => {
    const currentMinDisplay = getDisplayValue(filters.totalRaisedMin, totalRaisedUnit);
    const currentMaxDisplay = getDisplayValue(filters.totalRaisedMax, totalRaisedUnit);
    setTotalRaisedUnit(newUnit);
    onFiltersChange({
      ...filters,
      totalRaisedMin: getActualValue(currentMinDisplay, newUnit),
      totalRaisedMax: getActualValue(currentMaxDisplay, newUnit),
    });
  };

  const handleArrayFilterChange = <T extends string>(
    key: keyof FilterState,
    value: T,
    checked: boolean
  ) => {
    const current = filters[key] as T[];
    const updated = checked ? [...current, value] : current.filter((v) => v !== value);
    onFiltersChange({ ...filters, [key]: updated });
  };

  const handleBooleanFilterChange = (key: keyof FilterState, value: boolean | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: '30',
      dateAddedRange: 'this_week',
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
    });
  };

  const hasActiveFilters =
    (filters.dateAddedRange && filters.dateAddedRange !== 'all') ||
    filters.roundTypes.length > 0 ||
    filters.sectors.length > 0 ||
    filters.fundingMin !== undefined ||
    filters.fundingMax !== undefined ||
    filters.countries.length > 0 ||
    filters.metros.length > 0 ||
    filters.regions.length > 0 ||
    filters.primaryMarkets.length > 0 ||
    filters.businessModels.length > 0 ||
    filters.companyTypes.length > 0 ||
    filters.targetCustomers.length > 0 ||
    filters.founderTypes.length > 0 ||
    filters.isSerialFounder !== undefined ||
    filters.accelerators.length > 0 ||
    filters.hasFaangAlumni !== undefined ||
    filters.hasPriorExit !== undefined ||
    filters.hasPriorIPO !== undefined ||
    filters.investorQualities.length > 0 ||
    filters.hiringVelocityBands.length > 0 ||
    filters.foundingTeamSignalBands.length > 0 ||
    filters.cofoundersWorkedTogether !== undefined ||
    filters.totalRaisedMin !== undefined ||
    filters.totalRaisedMax !== undefined ||
    filters.runwayBands.length > 0 ||
    filters.burnMultipleBands.length > 0 ||
    filters.roundStatuses.length > 0 ||
    filters.hasLead !== undefined;

  const activeFilterCount = [
    (filters.dateAddedRange && filters.dateAddedRange !== 'all') ? 1 : 0,
    filters.roundTypes.length,
    filters.sectors.length,
    filters.fundingMin !== undefined ? 1 : 0,
    filters.fundingMax !== undefined ? 1 : 0,
    filters.countries.length,
    filters.metros.length,
    filters.regions.length,
    filters.primaryMarkets.length,
    filters.businessModels.length,
    filters.companyTypes.length,
    filters.targetCustomers.length,
    filters.founderTypes.length,
    filters.isSerialFounder !== undefined ? 1 : 0,
    filters.accelerators.length,
    filters.hasFaangAlumni !== undefined ? 1 : 0,
    filters.hasPriorExit !== undefined ? 1 : 0,
    filters.hasPriorIPO !== undefined ? 1 : 0,
    filters.investorQualities.length,
    filters.hiringVelocityBands.length,
    filters.foundingTeamSignalBands.length,
    filters.cofoundersWorkedTogether !== undefined ? 1 : 0,
    filters.totalRaisedMin !== undefined ? 1 : 0,
    filters.totalRaisedMax !== undefined ? 1 : 0,
    filters.runwayBands.length,
    filters.burnMultipleBands.length,
    filters.roundStatuses.length,
    filters.hasLead !== undefined ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const renderCheckboxGroup = <T extends string>(
    items: T[],
    filterKey: keyof FilterState,
    idPrefix: string
  ) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="flex items-center space-x-2">
          <Checkbox
            id={`${idPrefix}-${item}`}
            checked={(filters[filterKey] as T[]).includes(item)}
            onCheckedChange={(checked) =>
              handleArrayFilterChange(filterKey, item, checked as boolean)
            }
          />
          <label
            htmlFor={`${idPrefix}-${item}`}
            className="text-sm leading-none cursor-pointer"
          >
            {item}
          </label>
        </div>
      ))}
    </div>
  );

  const renderBooleanFilter = (
    label: string,
    filterKey: keyof FilterState,
    id: string
  ) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={filters[filterKey] === true}
        onCheckedChange={(checked) =>
          handleBooleanFilterChange(filterKey, checked ? true : undefined)
        }
      />
      <label htmlFor={id} className="text-sm leading-none cursor-pointer">
        {label}
      </label>
    </div>
  );

  const filterContent = (
    <div className="space-y-4">
      {/* Saved Thesis Profiles */}
      <SavedThesisProfiles 
        currentFilters={filters}
        onApplyFilters={onFiltersChange}
      />

      <div className="border-t border-border pt-4" />

      {/* Date Added */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Date Added</Label>
        <Select
          value={filters.dateAddedRange || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, dateAddedRange: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateAddedRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Last Round Date */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Last Round Date</Label>
        <Select
          value={filters.dateRange}
          onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Funding Type */}
      <FilterSection title="Funding Type" defaultOpen>
        {renderCheckboxGroup(roundTypes, 'roundTypes', 'round')}
      </FilterSection>

      {/* Current Round Size */}
      <FilterSection title="Current Round Size" defaultOpen>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Amount</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => handleUnitChange('K')}
              className={`px-2 py-0.5 text-xs transition-colors ${
                fundingUnit === 'K'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              K
            </button>
            <button
              onClick={() => handleUnitChange('M')}
              className={`px-2 py-0.5 text-xs transition-colors ${
                fundingUnit === 'M'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              M
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`Min (${fundingUnit})`}
            value={getDisplayValue(filters.fundingMin, fundingUnit) ?? ''}
            onChange={(e) => handleFundingMinChange(e.target.value)}
          />
          <Input
            type="number"
            placeholder={`Max (${fundingUnit})`}
            value={getDisplayValue(filters.fundingMax, fundingUnit) ?? ''}
            onChange={(e) => handleFundingMaxChange(e.target.value)}
          />
        </div>
      </FilterSection>

      {/* Industry */}
      <FilterSection title="Industry">
        {renderCheckboxGroup(sectors, 'sectors', 'sector')}
      </FilterSection>

      {/* Location - HQ Location & Metro drill-down */}
      <FilterSection title="HQ Location" defaultOpen>
        <div className="space-y-3">
          {/* Region/Country selector - dynamically loaded from database */}
          <div className="space-y-2">
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border border-border p-2">
              {dbCountries.length === 0 ? (
                <span className="text-xs text-muted-foreground">Loading countries...</span>
              ) : (
                dbCountries.map((country) => (
                  <div key={country.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`country-${country.code}`}
                      checked={filters.countries.includes(country.code)}
                      onCheckedChange={(checked) => {
                        const newCountries = checked 
                          ? [...filters.countries, country.code]
                          : filters.countries.filter(c => c !== country.code);
                        // Clear metros that no longer belong to selected countries
                        const availableMetros = getMetrosForCountries(newCountries);
                        const availableMetroIds = availableMetros.map(m => m.id);
                        const newMetros = filters.metros.filter(m => availableMetroIds.includes(m));
                        onFiltersChange({ ...filters, countries: newCountries, metros: newMetros });
                      }}
                    />
                    <label
                      htmlFor={`country-${country.code}`}
                      className="text-sm leading-none cursor-pointer"
                    >
                      {country.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Metro selector - only show when countries are selected */}
          {filters.countries.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Metro Area (optional)</span>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border border-border p-2">
                {filters.countries.map(countryCode => {
                  const countryData = dbCountries.find(c => c.code === countryCode);
                  const countryMetros = dbMetros.filter(m => m.countryCode === countryCode);
                  if (countryMetros.length === 0) return null;
                  return (
                    <div key={countryCode} className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground px-1">{countryData?.name || countryCode}</span>
                      {countryMetros.map((metro) => (
                        <div key={metro.id} className="flex items-center space-x-2 pl-2">
                          <Checkbox
                            id={`metro-${metro.id}`}
                            checked={filters.metros.includes(metro.id)}
                            onCheckedChange={(checked) => {
                              const newMetros = checked
                                ? [...filters.metros, metro.id]
                                : filters.metros.filter(m => m !== metro.id);
                              onFiltersChange({ ...filters, metros: newMetros });
                            }}
                          />
                          <label
                            htmlFor={`metro-${metro.id}`}
                            className="text-sm leading-none cursor-pointer"
                          >
                            {metro.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location summary */}
          {(filters.countries.length > 0 || filters.metros.length > 0) && (
            <div className="flex flex-wrap gap-1 pt-1">
              {filters.countries.map(code => {
                const country = dbCountries.find(c => c.code === code);
                return country ? (
                  <Badge 
                    key={code} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-destructive/20"
                    onClick={() => {
                      const newCountries = filters.countries.filter(c => c !== code);
                      const availableMetros = getMetrosForCountries(newCountries);
                      const availableMetroIds = availableMetros.map(m => m.id);
                      const newMetros = filters.metros.filter(m => availableMetroIds.includes(m));
                      onFiltersChange({ ...filters, countries: newCountries, metros: newMetros });
                    }}
                  >
                    {country.name} ×
                  </Badge>
                ) : null;
              })}
              {filters.metros.map(metroId => {
                const metro = dbMetros.find(m => m.id === metroId);
                return metro ? (
                  <Badge 
                    key={metroId} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-destructive/20"
                    onClick={() => onFiltersChange({ ...filters, metros: filters.metros.filter(m => m !== metroId) })}
                  >
                    {metro.name} ×
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
      </FilterSection>

      {/* Business Model */}
      <FilterSection title="Business Model">
        {renderCheckboxGroup(businessModels, 'businessModels', 'bmodel')}
      </FilterSection>

      <FilterSection title="Company Type">
        {renderCheckboxGroup(companyTypes, 'companyTypes', 'ctype')}
      </FilterSection>

      <FilterSection title="Target Customer">
        {renderCheckboxGroup(targetCustomers, 'targetCustomers', 'tcust')}
      </FilterSection>

      {/* Team & Signal */}
      <FilterSection title="Founder Type">
        {renderCheckboxGroup(founderTypes, 'founderTypes', 'ftype')}
      </FilterSection>

      <FilterSection title="Team Signals">
        {renderBooleanFilter('Serial Founder', 'isSerialFounder', 'serial-founder')}
        {renderBooleanFilter('Ex-FAANG Alumni', 'hasFaangAlumni', 'faang-alumni')}
        {renderBooleanFilter('Prior Exit', 'hasPriorExit', 'prior-exit')}
        {renderBooleanFilter('Prior IPO', 'hasPriorIPO', 'prior-ipo')}
        {renderBooleanFilter('Cofounders Worked Together', 'cofoundersWorkedTogether', 'cofounders-together')}
      </FilterSection>

      {/* Founding Team Signal Score */}
      <FilterSection title="Founding Team Signal">
        <div className="space-y-2">
          {foundingTeamSignalBands.map((band) => (
            <div key={band} className="flex items-center space-x-2">
              <Checkbox
                id={`fts-${band}`}
                checked={filters.foundingTeamSignalBands.includes(band)}
                onCheckedChange={(checked) =>
                  handleArrayFilterChange('foundingTeamSignalBands', band, checked as boolean)
                }
              />
              <label
                htmlFor={`fts-${band}`}
                className="text-sm leading-none cursor-pointer"
              >
                {foundingTeamSignalLabels[band]}
              </label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Hiring Velocity */}
      <FilterSection title="Hiring Velocity">
        <div className="space-y-2">
          {hiringVelocityBands.map((band) => (
            <div key={band} className="flex items-center space-x-2">
              <Checkbox
                id={`hv-${band}`}
                checked={filters.hiringVelocityBands.includes(band)}
                onCheckedChange={(checked) =>
                  handleArrayFilterChange('hiringVelocityBands', band, checked as boolean)
                }
              />
              <label
                htmlFor={`hv-${band}`}
                className="text-sm leading-none cursor-pointer"
              >
                {hiringVelocityLabels[band]}
              </label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* =================================================================== */}
      {/* ADVANCED ML SCORES - Premium Filters */}
      {/* =================================================================== */}
      
      {/* Unicorn Likelihood Score */}
      <FilterSection title="🦄 Unicorn Likelihood">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Min Score: {filters.unicornScoreMin || 0}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">ML model (0-100) blending traction, market size, founder pedigree, and backer track record</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            value={[filters.unicornScoreMin || 0]}
            min={0}
            max={100}
            step={5}
            onValueChange={([value]) => onFiltersChange({ ...filters, unicornScoreMin: value > 0 ? value : undefined })}
          />
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="10x-bets"
              checked={filters.only10xBets || false}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, only10xBets: checked || undefined })}
            />
            <label htmlFor="10x-bets" className="text-sm cursor-pointer flex items-center gap-1">
              <Rocket className="h-4 w-4 text-primary" />
              <span>10x Bets Only</span>
              <span className="text-xs text-muted-foreground">(Top 5%)</span>
            </label>
          </div>
        </div>
      </FilterSection>

      {/* Backer Quality Score */}
      <FilterSection title="🔥 Backer Quality">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Min Score: {filters.backerScoreMin || 0}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Lead investors' exit rate, co-investors with unicorns, and "hot streak" indicators</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            value={[filters.backerScoreMin || 0]}
            min={0}
            max={100}
            step={5}
            onValueChange={([value]) => onFiltersChange({ ...filters, backerScoreMin: value > 0 ? value : undefined })}
          />
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="hot-streak"
              checked={filters.backerHotStreakOnly || false}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, backerHotStreakOnly: checked || undefined })}
            />
            <label htmlFor="hot-streak" className="text-sm cursor-pointer flex items-center gap-1">
              🔥 Hot Streak Only
              <span className="text-xs text-muted-foreground">(2+ recent exits)</span>
            </label>
          </div>
        </div>
      </FilterSection>

      {/* Hidden Gem Radar */}
      <FilterSection title="💎 Hidden Gem Radar">
        <div className="space-y-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-full text-left">
                <p className="text-xs text-muted-foreground mb-2">
                  Bootstrapped with traction, obscure signals, no Crunchbase
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Find startups with $1M+ ARR, IndieHackers/StarterStory presence, patent filings, hiring streaks - but no traditional VC coverage</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="hidden-gem-only"
              checked={filters.hiddenGemOnly || false}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, hiddenGemOnly: checked || undefined })}
            />
            <label htmlFor="hidden-gem-only" className="text-sm cursor-pointer font-medium">
              💎 Hidden Gems Only
            </label>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bootstrapped-growth"
                checked={filters.isBootstrappedGrowth || false}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, isBootstrappedGrowth: checked as boolean || undefined })}
              />
              <label htmlFor="bootstrapped-growth" className="text-sm cursor-pointer">
                Bootstrapped with traction
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="indie-presence"
                checked={filters.hasIndiePresence || false}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, hasIndiePresence: checked as boolean || undefined })}
              />
              <label htmlFor="indie-presence" className="text-sm cursor-pointer">
                IndieHackers / StarterStory
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="no-crunchbase"
                checked={filters.hasNoCrunchbase || false}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, hasNoCrunchbase: checked as boolean || undefined })}
              />
              <label htmlFor="no-crunchbase" className="text-sm cursor-pointer">
                No Crunchbase profile
              </label>
            </div>
          </div>
        </div>
      </FilterSection>

      {/* =================================================================== */}
      
      <FilterSection title="Accelerator">
        {renderCheckboxGroup(accelerators, 'accelerators', 'accel')}
      </FilterSection>

      <FilterSection title="Investor Track Record">
        {renderCheckboxGroup(investorTrackRecords, 'investorQualities', 'invq')}
      </FilterSection>

      {/* Capital Efficiency */}
      <FilterSection title="Total Raised">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Amount</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => handleTotalRaisedUnitChange('K')}
              className={`px-2 py-0.5 text-xs transition-colors ${
                totalRaisedUnit === 'K'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              K
            </button>
            <button
              onClick={() => handleTotalRaisedUnitChange('M')}
              className={`px-2 py-0.5 text-xs transition-colors ${
                totalRaisedUnit === 'M'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              M
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`Min (${totalRaisedUnit})`}
            value={getDisplayValue(filters.totalRaisedMin, totalRaisedUnit) ?? ''}
            onChange={(e) => handleTotalRaisedMinChange(e.target.value)}
          />
          <Input
            type="number"
            placeholder={`Max (${totalRaisedUnit})`}
            value={getDisplayValue(filters.totalRaisedMax, totalRaisedUnit) ?? ''}
            onChange={(e) => handleTotalRaisedMaxChange(e.target.value)}
          />
        </div>
      </FilterSection>

      <FilterSection title="Runway">
        {renderCheckboxGroup(runwayBands, 'runwayBands', 'runway')}
      </FilterSection>

      <FilterSection title="Burn Multiple">
        {renderCheckboxGroup(burnMultipleBands, 'burnMultipleBands', 'burn')}
      </FilterSection>

      <FilterSection title="Round Status">
        {renderCheckboxGroup(roundStatuses, 'roundStatuses', 'rstatus')}
        {renderBooleanFilter('Has Lead Investor', 'hasLead', 'has-lead')}
      </FilterSection>

      {/* Create Alert Button */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-border mt-4">
          <Button 
            onClick={() => setShowAlertDialog(true)}
            variant="outline"
            className="w-full gap-2"
          >
            <Bell className="h-4 w-4" />
            Create Alert for These Filters
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Get daily email summaries of new matches
          </p>
        </div>
      )}
    </div>
  );

  const handleCreateAlert = () => {
    if (!alertName.trim()) return;
    createAlert({
      name: alertName,
      filters: filters,
      frequency: alertFrequency,
    });
    setAlertName('');
    setShowAlertDialog(false);
  };

  return (
    <>
      {/* Desktop/Tablet: Sticky sidebar */}
      <aside className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-4 rounded-lg border border-border bg-card p-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
          {filterContent}
        </div>
      </aside>

      {/* Create Alert Dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Create Email Alert
            </DialogTitle>
            <DialogDescription>
              Get notified when new startups match your current filters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="alert-name">Alert Name</Label>
              <Input
                id="alert-name"
                placeholder="e.g., AI Healthcare Series A"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email Frequency</Label>
              <Select value={alertFrequency} onValueChange={(v) => setAlertFrequency(v as 'daily' | 'weekly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Summary</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-medium">Current Filter Criteria:</p>
              <div className="flex flex-wrap gap-1">
                {describeFilters(filters).map((desc, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {desc}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAlertDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlert} disabled={!alertName.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile: Floating button + Sheet */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-14 w-14 p-0"
            >
              <SlidersHorizontal className="h-5 w-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span>Filters</span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Clear all
                  </button>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {filterContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
