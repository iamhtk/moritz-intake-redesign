import { MOCK_CLIENT_USER } from './users';
import type { ClientEngagementLetter } from '@/lib/types';

export const MOCK_CLIENT_ENGAGEMENT_LETTER: ClientEngagementLetter = {
  id: 'eng_northwind',
  companyId: MOCK_CLIENT_USER.company.id,
  status: 'PENDING',
  requestedAt: '2026-07-22T09:00:00.000Z',
  signedAt: null,
  signedBy: null,
  signedTitle: null,
  signatureMethod: null,
};
