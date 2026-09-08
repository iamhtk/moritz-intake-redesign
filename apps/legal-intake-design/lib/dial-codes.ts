import {
  formatIncompletePhoneNumber,
  isValidPhoneNumber,
} from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

export type DialCodeEntry = {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
};

/** Pinned countries shown at the top of the dropdown. */
export const PINNED_DIAL_CODES: DialCodeEntry[] = [
  {
    code: 'US',
    dialCode: '1',
    name: 'United States',
    flag: '\u{1F1FA}\u{1F1F8}',
  },
  { code: 'NO', dialCode: '47', name: 'Norway', flag: '\u{1F1F3}\u{1F1F4}' },
  {
    code: 'GB',
    dialCode: '44',
    name: 'United Kingdom',
    flag: '\u{1F1EC}\u{1F1E7}',
  },
  { code: 'AU', dialCode: '61', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
];

/** Remaining countries sorted alphabetically by name. */
export const OTHER_DIAL_CODES: DialCodeEntry[] = [
  { code: 'AT', dialCode: '43', name: 'Austria', flag: '\u{1F1E6}\u{1F1F9}' },
  { code: 'BE', dialCode: '32', name: 'Belgium', flag: '\u{1F1E7}\u{1F1EA}' },
  { code: 'BR', dialCode: '55', name: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'CA', dialCode: '1', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'DK', dialCode: '45', name: 'Denmark', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'FI', dialCode: '358', name: 'Finland', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: 'FR', dialCode: '33', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'DE', dialCode: '49', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  {
    code: 'HK',
    dialCode: '852',
    name: 'Hong Kong',
    flag: '\u{1F1ED}\u{1F1F0}',
  },
  { code: 'IS', dialCode: '354', name: 'Iceland', flag: '\u{1F1EE}\u{1F1F8}' },
  { code: 'IN', dialCode: '91', name: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'IE', dialCode: '353', name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}' },
  { code: 'IT', dialCode: '39', name: 'Italy', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'JP', dialCode: '81', name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'MX', dialCode: '52', name: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}' },
  {
    code: 'NL',
    dialCode: '31',
    name: 'Netherlands',
    flag: '\u{1F1F3}\u{1F1F1}',
  },
  {
    code: 'NZ',
    dialCode: '64',
    name: 'New Zealand',
    flag: '\u{1F1F3}\u{1F1FF}',
  },
  { code: 'PL', dialCode: '48', name: 'Poland', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'PT', dialCode: '351', name: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'SG', dialCode: '65', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}' },
  {
    code: 'ZA',
    dialCode: '27',
    name: 'South Africa',
    flag: '\u{1F1FF}\u{1F1E6}',
  },
  {
    code: 'KR',
    dialCode: '82',
    name: 'South Korea',
    flag: '\u{1F1F0}\u{1F1F7}',
  },
  { code: 'ES', dialCode: '34', name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'SE', dialCode: '46', name: 'Sweden', flag: '\u{1F1F8}\u{1F1EA}' },
  {
    code: 'CH',
    dialCode: '41',
    name: 'Switzerland',
    flag: '\u{1F1E8}\u{1F1ED}',
  },
  {
    code: 'AE',
    dialCode: '971',
    name: 'United Arab Emirates',
    flag: '\u{1F1E6}\u{1F1EA}',
  },
];

/** All dial codes (pinned first, then alphabetical). */
export const DIAL_CODES: DialCodeEntry[] = [
  ...PINNED_DIAL_CODES,
  ...OTHER_DIAL_CODES,
];

const DIAL_CODE_BY_COUNTRY = new Map(
  DIAL_CODES.map((d) => [d.code, d.dialCode]),
);

/**
 * Returns the country code to use as the default for phone dial code selection.
 * If the company's country code matches a known dial code entry, use it;
 * otherwise fall back to 'US'.
 */
export function getDefaultCountryCode(countryCode: string | null): string {
  if (countryCode && DIAL_CODE_BY_COUNTRY.has(countryCode)) {
    return countryCode;
  }
  return 'US';
}

export function getDialCodeForCountry(countryCode: string): string {
  return DIAL_CODE_BY_COUNTRY.get(countryCode) ?? '1';
}

export function getEntryForCountry(
  countryCode: string,
): DialCodeEntry | undefined {
  return DIAL_CODES.find((d) => d.code === countryCode);
}

/**
 * Parse an E.164-style phone number (e.g. "+4712345678") into country code + local number.
 * Tries to match the longest dial code first, then picks the first matching country.
 */
export function parsePhoneToCountry(phone: string): {
  countryCode: string;
  localNumber: string;
} {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return { countryCode: '', localNumber: '' };
  }

  // Collect unique dial codes sorted by length descending (longest match first)
  const uniqueDialCodes = [...new Set(DIAL_CODES.map((d) => d.dialCode))].sort(
    (a, b) => b.length - a.length,
  );

  for (const dc of uniqueDialCodes) {
    if (digits.startsWith(dc)) {
      const entry = DIAL_CODES.find((d) => d.dialCode === dc);
      if (entry) {
        return {
          countryCode: entry.code,
          localNumber: digits.slice(dc.length),
        };
      }
    }
  }

  return { countryCode: '', localNumber: digits };
}

/**
 * Formats a national phone number (without the country calling code) for the
 * given country, live as the user types. The dial code is selected separately
 * in the dropdown, so only the national portion is masked here.
 *
 * Uses libphonenumber-js's stateless `formatIncompletePhoneNumber`, which
 * tolerates partial numbers and re-derives the format from the digits on every
 * keystroke, making it safe for a controlled React input.
 */
export function formatNationalNumber(
  value: string,
  countryCode: string,
): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  return (
    formatIncompletePhoneNumber(digits, countryCode as CountryCode) || digits
  );
}

/**
 * Whether a national phone number is valid for the given country. An empty
 * value is treated as valid because the field is optional — callers should
 * only surface an error when a number has actually been entered.
 */
export function isValidNationalNumber(
  value: string,
  countryCode: string,
): boolean {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return true;
  }
  try {
    return isValidPhoneNumber(digits, countryCode as CountryCode);
  } catch {
    return false;
  }
}
