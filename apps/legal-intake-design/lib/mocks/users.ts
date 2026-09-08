import type { AuthUser, Role } from '@/lib/types';

const baseProfile = {
  enabled: true,
  emailVerified: '2026-01-12T10:00:00.000Z',
  phone: '+1 (415) 555-0142',
  phoneVerified: '2026-01-12T10:01:00.000Z',
  image: null,
  description: null,
  role: 'OWNER' as const,
};

export const MOCK_CLIENT_USER: AuthUser = {
  ...baseProfile,
  id: 'usr_client_001',
  name: 'Alex Morgan',
  display_name: 'Alex Morgan',
  email: 'alex.morgan@northwindltd.com',
  description: 'Operations lead at Northwind Ltd.',
  company: {
    id: 'cmp_client_001',
    name: 'Northwind Ltd.',
    type: 'NON_LEGAL',
    whitelisted: true,
  },
};

export const MOCK_LEGAL_USER: AuthUser = {
  ...baseProfile,
  id: 'usr_legal_001',
  name: 'Priya Shah',
  display_name: 'Priya Shah',
  email: 'priya.shah@moritz.legal',
  description: 'Partner at Moritz, Commercial Litigation',
  company: {
    id: 'cmp_legal_001',
    name: 'Moritz',
    type: 'LEGAL',
    whitelisted: true,
  },
};

export const MOCK_ADMIN_USER: AuthUser = {
  ...baseProfile,
  id: 'usr_admin_001',
  name: 'Jordan Pierce',
  display_name: 'Jordan Pierce',
  email: 'jordan@moritz.legal',
  description: 'Moritz operations',
  company: {
    id: 'cmp_admin_001',
    name: 'Moritz',
    type: 'INTERNAL_ADMIN',
    whitelisted: true,
  },
};

export const MOCK_ASSISTANT_USER: AuthUser = {
  ...baseProfile,
  id: 'usr_assistant_001',
  name: 'Sam Rivera',
  display_name: 'Sam Rivera',
  email: 'sam@moritz.legal',
  description: 'Moritz internal assistant',
  company: {
    id: 'cmp_admin_001',
    name: 'Moritz',
    type: 'INTERNAL_ASSISTANT',
    whitelisted: true,
  },
};

export function mockUserFor(role: Role): AuthUser {
  switch (role) {
    case 'NON_LEGAL':
      return MOCK_CLIENT_USER;
    case 'LEGAL':
      return MOCK_LEGAL_USER;
    case 'INTERNAL_ADMIN':
      return MOCK_ADMIN_USER;
    case 'INTERNAL_ASSISTANT':
      return MOCK_ASSISTANT_USER;
  }
}

// All known users, for admin panels.
export const MOCK_USERS: AuthUser[] = [
  MOCK_CLIENT_USER,
  MOCK_LEGAL_USER,
  MOCK_ADMIN_USER,
  MOCK_ASSISTANT_USER,
  {
    ...baseProfile,
    id: 'usr_legal_002',
    name: 'Marcus Lee',
    display_name: 'Marcus Lee',
    email: 'marcus.lee@moritz.legal',
    description: 'Associate at Moritz',
    role: 'MEMBER',
    company: {
      id: 'cmp_legal_001',
      name: 'Moritz',
      type: 'LEGAL',
      whitelisted: true,
    },
  },
  {
    ...baseProfile,
    id: 'usr_client_002',
    name: 'Reena Patel',
    display_name: 'Reena Patel',
    email: 'reena.patel@oakworks.io',
    description: 'CEO of Oakworks',
    company: {
      id: 'cmp_client_002',
      name: 'Oakworks',
      type: 'NON_LEGAL',
      whitelisted: true,
    },
  },
  {
    ...baseProfile,
    id: 'usr_legal_003',
    name: 'Anders Holm',
    display_name: 'Anders Holm',
    email: 'anders@nordic-counsel.no',
    description: 'Senior counsel — Nordic Counsel',
    company: {
      id: 'cmp_legal_002',
      name: 'Nordic Counsel',
      type: 'LEGAL',
      whitelisted: true,
    },
  },
];
