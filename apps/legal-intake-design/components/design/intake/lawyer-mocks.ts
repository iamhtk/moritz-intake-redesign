/**
 * Playground-only mock lawyer data for the intake success screens.
 *
 * Nothing here calls a real backend. Before a matter is paid for, the success
 * screen rotates through the lawyers whose `specialties` match the matter's
 * sub-type — the actual lawyer is only assigned once payment clears. Each
 * matter definition picks a roster + specialty via `getLawyerShortlist`.
 */

import type { Lawyer } from './intake-types';

export type { Lawyer };

/** Commercial / contracts bench. */
export const COMMERCIAL_ROSTER: readonly Lawyer[] = [
  {
    id: 'mock-lawyer-1',
    name: 'Henrik Sørensen',
    title: 'Senior Commercial Counsel',
    initials: 'HS',
    credentials: [
      '12 years at Schjødt & Wikborg Rein',
      'M&A and commercial contracts',
      'Bar admitted: Norway, England & Wales',
    ],
    bio: 'Henrik leads our commercial team. He previously closed transactions for Visma, Aker BP, and several Series B+ SaaS companies.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: ['services', 'vendor', 'sales', 'partnership'],
  },
  {
    id: 'mock-lawyer-2',
    name: 'Amara Okafor',
    title: 'Commercial & Privacy Counsel',
    initials: 'AO',
    credentials: [
      'NDAs and data agreements',
      'Ex-DLA Piper, 9 years',
      'Bar admitted: England & Wales',
    ],
    bio: 'Amara handles confidentiality and data work day in, day out — from one-off NDAs to enterprise DPAs.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: ['nda', 'services', 'vendor', 'saas'],
  },
  {
    id: 'mock-lawyer-3',
    name: 'Daniel Brecht',
    title: 'IP & Licensing Counsel',
    initials: 'DB',
    credentials: [
      'IP licensing and tech transfer',
      '11 years in-house at a SaaS scale-up',
      'Bar admitted: Germany, New York',
    ],
    bio: 'Daniel focuses on licensing and IP-heavy deals, balancing protection with commercial momentum.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: ['licensing', 'nda', 'sales'],
  },
  {
    id: 'mock-lawyer-4',
    name: 'Priya Nair',
    title: 'Real Estate & Commercial Counsel',
    initials: 'PN',
    credentials: [
      'Leasing and asset finance',
      'Ex-CMS, 10 years',
      'Bar admitted: India, England & Wales',
    ],
    bio: 'Priya covers leases and asset-backed agreements, with a sharp eye for term and exit risk.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: ['lease', 'vendor', 'partnership', 'goods'],
  },
];

/** Employment / people bench. */
export const EMPLOYMENT_ROSTER: readonly Lawyer[] = [
  {
    id: 'mock-lawyer-emp-1',
    name: 'Lena Vogt',
    title: 'Employment Counsel',
    initials: 'LV',
    credentials: [
      'Offers, exits, and equity',
      'Ex-Freshfields, 10 years',
      'Bar admitted: Germany, England & Wales',
    ],
    bio: 'Lena advises founders and people teams on hiring, terminations, and equity compensation across the EU and UK.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: ['offer', 'termination', 'policy'],
  },
  {
    id: 'mock-lawyer-emp-2',
    name: 'Marcus Hale',
    title: 'Equity & Benefits Counsel',
    initials: 'MH',
    credentials: [
      'ISO/NSO/RSU plan design',
      '9 years at a US tech firm',
      'Bar admitted: New York, California',
    ],
    bio: 'Marcus designs and reviews equity grants and benefit plans for scaling teams.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: ['equity', 'offer'],
  },
  {
    id: 'mock-lawyer-emp-3',
    name: 'Sofia Marchetti',
    title: 'Employment Disputes Counsel',
    initials: 'SM',
    credentials: [
      'Disputes and investigations',
      'Ex-Littler, 11 years',
      'Bar admitted: Italy, England & Wales',
    ],
    bio: 'Sofia handles sensitive exits, claims, and workplace investigations with a steady hand.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: ['dispute', 'termination'],
  },
];

/** Corporate / M&A bench. */
export const CORPORATE_ROSTER: readonly Lawyer[] = [
  {
    id: 'mock-lawyer-corp-1',
    name: 'Theo Lindqvist',
    title: 'Corporate Counsel',
    initials: 'TL',
    credentials: [
      'Formations and governance',
      'Ex-Vinge, 12 years',
      'Bar admitted: Sweden, Delaware',
    ],
    bio: 'Theo sets up entities and governance structures for startups and holding companies.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: ['formation', 'governance', 'compliance'],
  },
  {
    id: 'mock-lawyer-corp-2',
    name: 'Nadia Rahman',
    title: 'Financing & M&A Counsel',
    initials: 'NR',
    credentials: [
      'Venture financings and M&A',
      'Ex-Cooley, 10 years',
      'Bar admitted: New York, England & Wales',
    ],
    bio: 'Nadia leads venture rounds and acquisitions, from term sheet to closing.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: [
      'financing',
      'equity',
      'acquire',
      'sell',
      'investment',
      'merger',
    ],
  },
  {
    id: 'mock-lawyer-corp-3',
    name: 'Henrik Sørensen',
    title: 'Senior Commercial & M&A Counsel',
    initials: 'HS',
    credentials: [
      '12 years at Schjødt & Wikborg Rein',
      'M&A and commercial contracts',
      'Bar admitted: Norway, England & Wales',
    ],
    bio: 'Henrik closes complex transactions and advises on deal structure and risk.',
    imageUrl: null,
    responseTime: 'within 24 hours',
    specialties: ['acquire', 'sell', 'merger', 'investment', 'financing'],
  },
];

/**
 * Lawyers worth surfacing for a matter: filters a roster by a specialty value,
 * falling back to the whole roster when nothing matches (or none is known yet).
 */
export function shortlistBySpecialty(
  roster: readonly Lawyer[],
  specialty?: string,
): Lawyer[] {
  if (!specialty) return [...roster];
  const matches = roster.filter((lawyer) =>
    lawyer.specialties?.includes(specialty),
  );
  return matches.length > 0 ? matches : [...roster];
}
