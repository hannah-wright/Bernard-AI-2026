import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterState, RoundType, Sector } from '@/types/startup';

type FundingUnit = 'K' | 'M';

const roundTypes: RoundType[] = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+'];
const sectors: Sector[] = ['AI/ML', 'Fintech', 'Healthcare', 'SaaS', 'E-commerce', 'Biotech', 'Climate Tech'];
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

export const FilterSidebar = ({ filters, onFiltersChange }: FilterSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [fundingUnit, setFundingUnit] = useState<FundingUnit>('M');

  // Convert displayed value to actual value based on unit
  const getActualValue = (displayValue: number | undefined, unit: FundingUnit): number | undefined => {
    if (displayValue === undefined) return undefined;
    return unit === 'K' ? displayValue * 1000 : displayValue * 1000000;
  };

  // Convert actual value to display value based on unit
  const getDisplayValue = (actualValue: number | undefined, unit: FundingUnit): number | undefined => {
    if (actualValue === undefined) return undefined;
    return unit === 'K' ? actualValue / 1000 : actualValue / 1000000;
  };

  const handleFundingMinChange = (displayValue: string) => {
    const numValue = displayValue ? Number(displayValue) : undefined;
    onFiltersChange({
      ...filters,
      fundingMin: getActualValue(numValue, fundingUnit),
    });
  };

  const handleFundingMaxChange = (displayValue: string) => {
    const numValue = displayValue ? Number(displayValue) : undefined;
    onFiltersChange({
      ...filters,
      fundingMax: getActualValue(numValue, fundingUnit),
    });
  };

  const handleUnitChange = (newUnit: FundingUnit) => {
    // Convert existing values to new unit
    const currentMinDisplay = getDisplayValue(filters.fundingMin, fundingUnit);
    const currentMaxDisplay = getDisplayValue(filters.fundingMax, fundingUnit);
    
    setFundingUnit(newUnit);
    
    // Recalculate actual values with new unit
    onFiltersChange({
      ...filters,
      fundingMin: getActualValue(currentMinDisplay, newUnit),
      fundingMax: getActualValue(currentMaxDisplay, newUnit),
    });
  };

  const handleRoundTypeChange = (roundType: RoundType, checked: boolean) => {
    const newRoundTypes = checked
      ? [...filters.roundTypes, roundType]
      : filters.roundTypes.filter((r) => r !== roundType);
    onFiltersChange({ ...filters, roundTypes: newRoundTypes });
  };

  const handleSectorChange = (sector: Sector, checked: boolean) => {
    const newSectors = checked
      ? [...filters.sectors, sector]
      : filters.sectors.filter((s) => s !== sector);
    onFiltersChange({ ...filters, sectors: newSectors });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: '30',
      fundingMin: undefined,
      fundingMax: undefined,
      roundTypes: [],
      sectors: [],
      location: '',
    });
  };

  const hasActiveFilters =
    filters.roundTypes.length > 0 ||
    filters.sectors.length > 0 ||
    filters.fundingMin !== undefined ||
    filters.fundingMax !== undefined ||
    filters.location !== '';

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="rounded-lg border border-border bg-card p-4">
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

        <div className="space-y-6">
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

          {/* Funding Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Funding Amount</Label>
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
                className="w-full"
              />
              <Input
                type="number"
                placeholder={`Max (${fundingUnit})`}
                value={getDisplayValue(filters.fundingMax, fundingUnit) ?? ''}
                onChange={(e) => handleFundingMaxChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Round Type */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Round Type</Label>
            <div className="space-y-2">
              {roundTypes.map((roundType) => (
                <div key={roundType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`round-${roundType}`}
                    checked={filters.roundTypes.includes(roundType)}
                    onCheckedChange={(checked) =>
                      handleRoundTypeChange(roundType, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`round-${roundType}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {roundType}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sector */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Sector</Label>
            <div className="space-y-2">
              {sectors.map((sector) => (
                <div key={sector} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sector-${sector}`}
                    checked={filters.sectors.includes(sector)}
                    onCheckedChange={(checked) =>
                      handleSectorChange(sector, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`sector-${sector}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {sector}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Location</Label>
            <Select
              value={filters.location}
              onValueChange={(value) => onFiltersChange({ ...filters, location: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any location</SelectItem>
                <SelectItem value="usa">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </aside>
  );
};
