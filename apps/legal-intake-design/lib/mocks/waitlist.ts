import type { WaitlistEntry } from '@/lib/types';

export const MOCK_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wl_001',
    email: 'founder@brightline.co',
    country: 'GB',
    companyName: 'Brightline Co.',
    status: 'PENDING',
    createdAt: '2026-05-19T09:00:00.000Z',
  },
  {
    id: 'wl_002',
    email: 'legal@axiomstores.com.au',
    country: 'AU',
    companyName: 'Axiom Stores',
    status: 'PENDING',
    createdAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'wl_003',
    email: 'maria@harbour.legal',
    country: 'GB',
    companyName: 'Harbour Legal',
    status: 'CONVERTED',
    createdAt: '2026-05-12T08:00:00.000Z',
  },
  {
    id: 'wl_004',
    email: 'hello@vesterbro.dk',
    country: 'DK',
    companyName: 'Vesterbro Studio',
    status: 'PENDING',
    createdAt: '2026-05-22T11:00:00.000Z',
  },
  {
    id: 'wl_005',
    email: 'team@reefworks.com.au',
    country: 'AU',
    companyName: 'Reef Works',
    status: 'REJECTED',
    createdAt: '2026-04-29T09:30:00.000Z',
  },
];
