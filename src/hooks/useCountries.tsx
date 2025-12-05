import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { locationData, MetroArea } from '@/data/locationData';

interface CountryOption {
  code: string;
  name: string;
}

export interface MetroOption {
  id: string;
  name: string;
  countryCode: string;
}

// Map database country names to codes
const countryNameToCode: Record<string, string> = {
  'United States': 'US',
  'USA': 'US',
  'United Kingdom': 'UK',
  'UK': 'UK',
  'Canada': 'CA',
  'Germany': 'DE',
  'France': 'FR',
  'Netherlands': 'NL',
  'Israel': 'IL',
  'Singapore': 'SG',
  'Australia': 'AU',
  'India': 'IN',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'Japan': 'JP',
  'China': 'CN',
  'South Korea': 'KR',
  'Sweden': 'SE',
  'Spain': 'ES',
  'Ireland': 'IE',
  'Switzerland': 'CH',
  'UAE': 'AE',
  'United Arab Emirates': 'AE',
};

// Get display name from code
const codeToName: Record<string, string> = {
  'US': 'United States',
  'UK': 'United Kingdom',
  'CA': 'Canada',
  'DE': 'Germany',
  'FR': 'France',
  'NL': 'Netherlands',
  'IL': 'Israel',
  'SG': 'Singapore',
  'AU': 'Australia',
  'IN': 'India',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'JP': 'Japan',
  'CN': 'China',
  'KR': 'South Korea',
  'SE': 'Sweden',
  'ES': 'Spain',
  'IE': 'Ireland',
  'CH': 'Switzerland',
  'AE': 'UAE',
};

// Helper to find metro for a city
function findMetroForCity(city: string, countryCode: string): MetroArea | undefined {
  const country = locationData.find(c => c.code === countryCode);
  if (!country) return undefined;
  return country.metros.find(m => 
    m.cities.some(c => c.toLowerCase() === city.toLowerCase())
  );
}

// Case-insensitive lookup helper
function normalizeCountryToCode(country: string): string {
  const trimmed = country.trim();
  
  // Check if it's already a valid code
  if (codeToName[trimmed]) {
    return trimmed;
  }
  
  // Try direct lookup
  if (countryNameToCode[trimmed]) {
    return countryNameToCode[trimmed];
  }
  
  // Try case-insensitive lookup
  const lowerCountry = trimmed.toLowerCase();
  for (const [name, code] of Object.entries(countryNameToCode)) {
    if (name.toLowerCase() === lowerCountry) {
      return code;
    }
  }
  
  // Return as-is if no match found
  return trimmed;
}

async function fetchUniqueCountries(): Promise<CountryOption[]> {
  const { data, error } = await supabase
    .from('startups')
    .select('country')
    .not('country', 'is', null);

  if (error) {
    console.error('Error fetching countries:', error);
    return [];
  }

  // Get unique countries and normalize to codes first, then deduplicate
  const normalizedCodes = new Set<string>();
  data.forEach(s => {
    const code = normalizeCountryToCode(s.country);
    normalizedCodes.add(code);
  });
  
  // Map to country options with codes, putting United States first
  const countryOptions: CountryOption[] = Array.from(normalizedCodes)
    .map(code => ({
      code,
      name: codeToName[code] || code,
    }))
    .sort((a, b) => {
      // United States always first
      if (a.code === 'US') return -1;
      if (b.code === 'US') return 1;
      return a.name.localeCompare(b.name);
    });

  return countryOptions;
}

async function fetchUniqueMetros(): Promise<MetroOption[]> {
  const { data, error } = await supabase
    .from('startups')
    .select('city, country')
    .not('city', 'is', null)
    .not('country', 'is', null);

  if (error) {
    console.error('Error fetching cities:', error);
    return [];
  }

  // Map cities to metros
  const metroMap = new Map<string, MetroOption>();
  
  data.forEach(startup => {
    const countryCode = countryNameToCode[startup.country] || startup.country;
    const metro = findMetroForCity(startup.city, countryCode);
    
    if (metro && !metroMap.has(metro.id)) {
      metroMap.set(metro.id, {
        id: metro.id,
        name: metro.name,
        countryCode,
      });
    }
  });

  return Array.from(metroMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function useCountries() {
  return useQuery({
    queryKey: ['unique-countries'],
    queryFn: fetchUniqueCountries,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useMetros() {
  return useQuery({
    queryKey: ['unique-metros'],
    queryFn: fetchUniqueMetros,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
