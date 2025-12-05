import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CountryOption {
  code: string;
  name: string;
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

async function fetchUniqueCountries(): Promise<CountryOption[]> {
  const { data, error } = await supabase
    .from('startups')
    .select('country')
    .not('country', 'is', null);

  if (error) {
    console.error('Error fetching countries:', error);
    return [];
  }

  // Get unique countries
  const uniqueCountries = [...new Set(data.map(s => s.country))];
  
  // Map to country options with codes
  const countryOptions: CountryOption[] = uniqueCountries
    .map(country => {
      // Check if it's already a code
      if (codeToName[country]) {
        return { code: country, name: codeToName[country] };
      }
      // Otherwise map from name to code
      const code = countryNameToCode[country] || country;
      const name = codeToName[code] || country;
      return { code, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return countryOptions;
}

export function useCountries() {
  return useQuery({
    queryKey: ['unique-countries'],
    queryFn: fetchUniqueCountries,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
