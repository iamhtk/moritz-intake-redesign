/**
 * Mock address-lookup data for the onboarding address step.
 *
 * The playground has no backend, so these helpers stand in for a real
 * country-aware address provider. In production this seam maps onto a provider
 * such as getAddress.io / Royal Mail PAF (UK postcode lookup) or Loqate / Smarty
 * (international type-ahead) — see PORTING.md. The shapes here mirror what those
 * APIs return (a list of structured addresses) so the UI doesn't change when the
 * real lookup is wired in.
 */

export interface StructuredAddress {
  line1: string;
  line2?: string;
  city: string;
  /** County (UK/IE), state (US/AU), or region — labelled per country. */
  region: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
}

/**
 * How a country captures an address:
 * - `postcode-lookup`: enter a postcode, pick from the addresses at it (UK/IE).
 * - `typeahead`: search-as-you-type single-line suggestions (US and most others).
 */
export type AddressLookupMode = 'postcode-lookup' | 'typeahead';

export interface CountryAddressConfig {
  mode: AddressLookupMode;
  labels: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
  };
  /** Placeholder for the single-line type-ahead search field. */
  searchPlaceholder: string;
  /** Placeholder for the postcode-lookup field (postcode-lookup mode only). */
  postcodePlaceholder: string;
  /** Whether the manual form shows the region/state/county field. */
  showRegion: boolean;
}

const DEFAULT_CONFIG: CountryAddressConfig = {
  mode: 'typeahead',
  labels: {
    line1: 'Address line 1',
    line2: 'Address line 2 (optional)',
    city: 'City',
    region: 'Region / State',
    postalCode: 'Postal code',
  },
  searchPlaceholder: 'Start typing your address',
  postcodePlaceholder: 'Enter your postal code',
  showRegion: true,
};

const COUNTRY_CONFIG: Record<string, CountryAddressConfig> = {
  GB: {
    mode: 'postcode-lookup',
    labels: {
      line1: 'Address line 1',
      line2: 'Address line 2 (optional)',
      city: 'Town / City',
      region: 'County',
      postalCode: 'Postcode',
    },
    searchPlaceholder: 'Start typing your address',
    postcodePlaceholder: 'e.g. SW1A 1AA',
    showRegion: true,
  },
  IE: {
    mode: 'postcode-lookup',
    labels: {
      line1: 'Address line 1',
      line2: 'Address line 2 (optional)',
      city: 'Town / City',
      region: 'County',
      postalCode: 'Eircode',
    },
    searchPlaceholder: 'Start typing your address',
    postcodePlaceholder: 'e.g. D02 AF30',
    showRegion: true,
  },
  US: {
    mode: 'typeahead',
    labels: {
      line1: 'Street address',
      line2: 'Apt, suite, unit (optional)',
      city: 'City',
      region: 'State',
      postalCode: 'ZIP code',
    },
    searchPlaceholder: 'Start typing your address',
    postcodePlaceholder: 'ZIP code',
    showRegion: true,
  },
  AU: {
    mode: 'typeahead',
    labels: {
      line1: 'Street address',
      line2: 'Unit / level (optional)',
      city: 'Suburb / City',
      region: 'State / Territory',
      postalCode: 'Postcode',
    },
    searchPlaceholder: 'Start typing your address',
    postcodePlaceholder: 'Postcode',
    showRegion: true,
  },
  NO: {
    mode: 'typeahead',
    labels: {
      line1: 'Street address',
      line2: 'C/O, apartment (optional)',
      city: 'City',
      region: 'County',
      postalCode: 'Postal code',
    },
    searchPlaceholder: 'Start typing your address',
    postcodePlaceholder: 'Postal code',
    showRegion: false,
  },
};

export function getCountryAddressConfig(
  countryCode: string,
): CountryAddressConfig {
  return COUNTRY_CONFIG[countryCode] ?? DEFAULT_CONFIG;
}

/** Single-line summary of a structured address (used in confirmation copy). */
export function formatAddressSummary(address: StructuredAddress): string {
  return [
    address.line1,
    address.line2,
    address.city,
    address.region,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(', ');
}

// --- deterministic mock generation ------------------------------------------

const STREETS = [
  'High Street',
  'Station Road',
  'Church Lane',
  'Victoria Road',
  'Park Avenue',
  'Kings Road',
  'Queens Road',
  'Mill Lane',
  'The Green',
  'Market Square',
];

const HOUSE_NUMBERS = [1, 2, 3, 5, 8, 12];

const PLACES: Record<string, { city: string; region: string }[]> = {
  GB: [
    { city: 'London', region: 'Greater London' },
    { city: 'Manchester', region: 'Greater Manchester' },
    { city: 'Bristol', region: 'Bristol' },
    { city: 'Edinburgh', region: 'City of Edinburgh' },
  ],
  IE: [
    { city: 'Dublin', region: 'Co. Dublin' },
    { city: 'Cork', region: 'Co. Cork' },
    { city: 'Galway', region: 'Co. Galway' },
  ],
  US: [
    { city: 'San Francisco', region: 'CA' },
    { city: 'New York', region: 'NY' },
    { city: 'Austin', region: 'TX' },
    { city: 'Seattle', region: 'WA' },
  ],
  AU: [
    { city: 'Sydney', region: 'NSW' },
    { city: 'Melbourne', region: 'VIC' },
    { city: 'Brisbane', region: 'QLD' },
  ],
  NO: [
    { city: 'Oslo', region: 'Oslo' },
    { city: 'Bergen', region: 'Vestland' },
    { city: 'Trondheim', region: 'Trøndelag' },
  ],
};

/** Tiny stable string hash so the same input yields the same mock results. */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function placesFor(country: string): { city: string; region: string }[] {
  return PLACES[country] ?? PLACES.US!;
}

/**
 * Mock postcode lookup (UK/IE pattern). Returns the addresses "registered" at a
 * postcode — a short list of premises on one street in one town, all sharing the
 * entered postcode, exactly like a PAF / Eircode response.
 */
export function getAddressesForPostcode(
  postcode: string,
  country: string,
): StructuredAddress[] {
  const normalized = postcode.trim().toUpperCase().replace(/\s+/g, ' ');
  if (normalized.length < 3) return [];

  const seed = hash(normalized + country);
  const street = STREETS[seed % STREETS.length]!;
  const places = placesFor(country);
  const place = places[seed % places.length]!;

  return HOUSE_NUMBERS.map((n) => ({
    line1: `${n} ${street}`,
    city: place.city,
    region: place.region,
    postalCode: normalized,
    country,
  }));
}

/**
 * Mock single-line type-ahead (Loqate / Smarty pattern). Returns address
 * suggestions that incorporate what the user has typed so the field feels
 * responsive. Returns nothing until there are enough characters to search.
 */
export function searchAddresses(
  query: string,
  country: string,
): StructuredAddress[] {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const places = placesFor(country);
  const seed = hash(trimmed + country);

  // Surface a few streets, biased by the query, each with a house number and a
  // plausible city/region/postcode so selecting one fills the whole form.
  return HOUSE_NUMBERS.slice(0, 5).map((n, i) => {
    const street = STREETS[(seed + i) % STREETS.length]!;
    const place = places[(seed + i) % places.length]!;
    return {
      line1: `${n} ${street}`,
      city: place.city,
      region: place.region,
      postalCode: mockPostcode(country, seed + i),
      country,
    };
  });
}

function mockPostcode(country: string, seed: number): string {
  const n = seed % 9000;
  switch (country) {
    case 'GB':
      return `SW1A ${(n % 9) + 1}AA`;
    case 'IE':
      return `D0${(n % 9) + 1} AF30`;
    case 'US':
      return `9${String(4000 + (n % 1000)).padStart(4, '0')}`;
    case 'AU':
      return String(2000 + (n % 1000));
    case 'NO':
      return String(1000 + (n % 9000)).padStart(4, '0');
    default:
      return String(10000 + (n % 90000));
  }
}
