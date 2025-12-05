import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronRight } from 'lucide-react';
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
  RoundStatus
} from '@/types/startup';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { locationData, getMetrosForCountries } from '@/data/locationData';

type FundingUnit = 'K' | 'M';

const roundTypes: RoundType[] = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+'];
const sectors: Sector[] = ['AI/ML', 'Fintech', 'Healthcare', 'SaaS', 'E-commerce', 'Biotech', 'Climate Tech', 'Enterprise', 'Consumer'];
const regions: Region[] = ['US', 'EU', 'LATAM', 'APAC', 'MEA', 'Remote/Global'];
const businessModels: BusinessModel[] = ['B2B', 'B2C', 'B2B2C'];
const companyTypes: CompanyType[] = ['SaaS', 'Marketplace', 'Fintech', 'Hardware', 'Services', 'Other'];
const targetCustomers: TargetCustomer[] = ['SMB', 'Mid-market', 'Enterprise', 'Consumer', 'All'];
const founderTypes: FounderType[] = ['Solo', 'Team'];
const accelerators: Accelerator[] = ['YC', 'Techstars', 'a16z', '500 Startups', 'Other Tier-1', 'None'];
const investorQualities: InvestorQuality[] = ['Tier 1', 'Tier 2', 'Tier 3', 'Angels only'];
const runwayBands: RunwayBand[] = ['<6 months', '6-12 months', '12-18 months', '18+ months'];
const burnMultipleBands: BurnMultipleBand[] = ['<1x', '1-2x', '2-3x', '>3x'];
const roundStatuses: RoundStatus[] = ['Raising', 'Recently Closed', 'Exploring'];

const dateRanges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
  { value: '9999', label: 'All time' },
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
      investorQualities: [],
      totalRaisedMin: undefined,
      totalRaisedMax: undefined,
      runwayBands: [],
      burnMultipleBands: [],
      roundStatuses: [],
      hasLead: undefined,
    });
  };

  const hasActiveFilters =
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
    filters.investorQualities.length > 0 ||
    filters.totalRaisedMin !== undefined ||
    filters.totalRaisedMax !== undefined ||
    filters.runwayBands.length > 0 ||
    filters.burnMultipleBands.length > 0 ||
    filters.roundStatuses.length > 0 ||
    filters.hasLead !== undefined;

  const activeFilterCount = [
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
    filters.investorQualities.length,
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
      {/* Date Range */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Date Range</Label>
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

      {/* Round Type */}
      <FilterSection title="Round Type" defaultOpen>
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

      {/* Geography */}
      <FilterSection title="HQ Region">
        {renderCheckboxGroup(regions, 'regions', 'region')}
      </FilterSection>

      <FilterSection title="Primary Market">
        {renderCheckboxGroup(regions, 'primaryMarkets', 'market')}
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
      </FilterSection>

      <FilterSection title="Accelerator">
        {renderCheckboxGroup(accelerators, 'accelerators', 'accel')}
      </FilterSection>

      <FilterSection title="Investor Quality">
        {renderCheckboxGroup(investorQualities, 'investorQualities', 'invq')}
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

      {/* Location - Country & Metro drill-down */}
      <FilterSection title="Location" defaultOpen>
        <div className="space-y-3">
          {/* Country selector */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Country</span>
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border border-border p-2">
              {locationData.map((country) => (
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
              ))}
            </div>
          </div>

          {/* Metro selector - only show when countries are selected */}
          {filters.countries.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Metro Area (optional)</span>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border border-border p-2">
                {filters.countries.map(countryCode => {
                  const country = locationData.find(c => c.code === countryCode);
                  if (!country || country.metros.length === 0) return null;
                  return (
                    <div key={countryCode} className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground px-1">{country.name}</span>
                      {country.metros.map((metro) => (
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
                const country = locationData.find(c => c.code === code);
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
                const metro = getMetrosForCountries(filters.countries).find(m => m.id === metroId);
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
    </div>
  );

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
