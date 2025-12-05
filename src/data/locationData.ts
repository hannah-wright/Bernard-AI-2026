// Location data for geography filters
// Metro areas are grouped by country and represent major VC hubs

export interface MetroArea {
  id: string;
  name: string;
  cities: string[]; // Cities that belong to this metro
}

export interface CountryData {
  code: string;
  name: string;
  metros: MetroArea[];
}

export const locationData: CountryData[] = [
  {
    code: 'US',
    name: 'United States',
    metros: [
      { id: 'sf-bay', name: 'SF Bay Area', cities: ['San Francisco', 'Palo Alto', 'Mountain View', 'San Jose', 'Menlo Park', 'Sunnyvale', 'Santa Clara', 'Redwood City', 'Oakland', 'Berkeley', 'Fremont'] },
      { id: 'nyc', name: 'NYC Metro', cities: ['New York', 'New York City', 'Brooklyn', 'Manhattan', 'Jersey City', 'Newark'] },
      { id: 'la', name: 'Los Angeles', cities: ['Los Angeles', 'Santa Monica', 'Venice', 'Culver City', 'Pasadena', 'Long Beach'] },
      { id: 'boston', name: 'Boston', cities: ['Boston', 'Cambridge', 'Somerville'] },
      { id: 'seattle', name: 'Seattle', cities: ['Seattle', 'Bellevue', 'Redmond', 'Kirkland'] },
      { id: 'austin', name: 'Austin', cities: ['Austin', 'Round Rock'] },
      { id: 'chicago', name: 'Chicago', cities: ['Chicago', 'Evanston'] },
      { id: 'denver', name: 'Denver', cities: ['Denver', 'Boulder'] },
      { id: 'miami', name: 'Miami', cities: ['Miami', 'Fort Lauderdale', 'Boca Raton'] },
      { id: 'dc', name: 'Washington DC', cities: ['Washington', 'Washington DC', 'Arlington', 'Bethesda', 'Reston'] },
    ],
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    metros: [
      { id: 'london', name: 'London', cities: ['London'] },
      { id: 'manchester', name: 'Manchester', cities: ['Manchester'] },
      { id: 'cambridge-uk', name: 'Cambridge', cities: ['Cambridge'] },
      { id: 'edinburgh', name: 'Edinburgh', cities: ['Edinburgh'] },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    metros: [
      { id: 'toronto', name: 'Toronto', cities: ['Toronto', 'Waterloo', 'Kitchener'] },
      { id: 'vancouver', name: 'Vancouver', cities: ['Vancouver'] },
      { id: 'montreal', name: 'Montreal', cities: ['Montreal'] },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    metros: [
      { id: 'berlin', name: 'Berlin', cities: ['Berlin'] },
      { id: 'munich', name: 'Munich', cities: ['Munich', 'München'] },
      { id: 'frankfurt', name: 'Frankfurt', cities: ['Frankfurt'] },
      { id: 'hamburg', name: 'Hamburg', cities: ['Hamburg'] },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    metros: [
      { id: 'paris', name: 'Paris', cities: ['Paris'] },
      { id: 'lyon', name: 'Lyon', cities: ['Lyon'] },
    ],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    metros: [
      { id: 'amsterdam', name: 'Amsterdam', cities: ['Amsterdam'] },
      { id: 'rotterdam', name: 'Rotterdam', cities: ['Rotterdam'] },
    ],
  },
  {
    code: 'IL',
    name: 'Israel',
    metros: [
      { id: 'tel-aviv', name: 'Tel Aviv', cities: ['Tel Aviv', 'Tel Aviv-Yafo', 'Herzliya', 'Ramat Gan'] },
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    metros: [
      { id: 'singapore', name: 'Singapore', cities: ['Singapore'] },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    metros: [
      { id: 'sydney', name: 'Sydney', cities: ['Sydney'] },
      { id: 'melbourne', name: 'Melbourne', cities: ['Melbourne'] },
    ],
  },
  {
    code: 'IN',
    name: 'India',
    metros: [
      { id: 'bangalore', name: 'Bangalore', cities: ['Bangalore', 'Bengaluru'] },
      { id: 'mumbai', name: 'Mumbai', cities: ['Mumbai'] },
      { id: 'delhi', name: 'Delhi NCR', cities: ['Delhi', 'New Delhi', 'Gurgaon', 'Gurugram', 'Noida'] },
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    metros: [
      { id: 'sao-paulo', name: 'São Paulo', cities: ['São Paulo', 'Sao Paulo'] },
    ],
  },
  {
    code: 'MX',
    name: 'Mexico',
    metros: [
      { id: 'mexico-city', name: 'Mexico City', cities: ['Mexico City', 'Ciudad de México'] },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    metros: [
      { id: 'tokyo', name: 'Tokyo', cities: ['Tokyo'] },
    ],
  },
  {
    code: 'CN',
    name: 'China',
    metros: [
      { id: 'beijing', name: 'Beijing', cities: ['Beijing'] },
      { id: 'shanghai', name: 'Shanghai', cities: ['Shanghai'] },
      { id: 'shenzhen', name: 'Shenzhen', cities: ['Shenzhen'] },
    ],
  },
  {
    code: 'KR',
    name: 'South Korea',
    metros: [
      { id: 'seoul', name: 'Seoul', cities: ['Seoul'] },
    ],
  },
  {
    code: 'SE',
    name: 'Sweden',
    metros: [
      { id: 'stockholm', name: 'Stockholm', cities: ['Stockholm'] },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    metros: [
      { id: 'barcelona', name: 'Barcelona', cities: ['Barcelona'] },
      { id: 'madrid', name: 'Madrid', cities: ['Madrid'] },
    ],
  },
  {
    code: 'IE',
    name: 'Ireland',
    metros: [
      { id: 'dublin', name: 'Dublin', cities: ['Dublin'] },
    ],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    metros: [
      { id: 'zurich', name: 'Zurich', cities: ['Zurich', 'Zürich'] },
      { id: 'geneva', name: 'Geneva', cities: ['Geneva'] },
    ],
  },
  {
    code: 'AE',
    name: 'UAE',
    metros: [
      { id: 'dubai', name: 'Dubai', cities: ['Dubai'] },
    ],
  },
  {
    code: 'REMOTE',
    name: 'Remote / Global',
    metros: [],
  },
];

// Helper to get country by code
export const getCountryByCode = (code: string): CountryData | undefined => {
  return locationData.find(c => c.code === code);
};

// Helper to get all metros for selected countries
export const getMetrosForCountries = (countryCodes: string[]): MetroArea[] => {
  return locationData
    .filter(c => countryCodes.includes(c.code))
    .flatMap(c => c.metros);
};

// Helper to check if a city belongs to a metro
export const cityBelongsToMetro = (city: string, metro: MetroArea): boolean => {
  return metro.cities.some(c => c.toLowerCase() === city.toLowerCase());
};

// Helper to find which metro a city belongs to
export const findMetroForCity = (city: string, countryCode: string): MetroArea | undefined => {
  const country = getCountryByCode(countryCode);
  if (!country) return undefined;
  return country.metros.find(m => cityBelongsToMetro(city, m));
};

// Map country names to codes for filtering
export const countryNameToCode: Record<string, string> = {
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
