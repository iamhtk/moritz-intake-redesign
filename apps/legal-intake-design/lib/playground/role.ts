import type { Role } from '@/lib/types';

export const PLAYGROUND_ROLE_COOKIE = 'playground_role';
export const PLAYGROUND_ROLE_LS_KEY = 'playground:role';
export const DEFAULT_ROLE: Role = 'NON_LEGAL';

export function isRole(value: string): value is Role {
  return (
    value === 'NON_LEGAL' ||
    value === 'LEGAL' ||
    value === 'INTERNAL_ADMIN' ||
    value === 'INTERNAL_ASSISTANT'
  );
}
