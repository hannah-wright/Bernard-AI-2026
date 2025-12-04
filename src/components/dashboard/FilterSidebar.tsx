import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            <Label className="text-sm text-muted-foreground">Funding Amount (M)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.fundingMin ?? ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    fundingMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.fundingMax ?? ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    fundingMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
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
