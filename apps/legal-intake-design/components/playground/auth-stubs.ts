import { cookies } from 'next/headers';
import { mockUserFor } from '@/lib/mocks/users';
import type { AuthUser, Role } from '@/lib/types';
import {
  PLAYGROUND_ROLE_COOKIE,
  DEFAULT_ROLE,
  isRole,
} from '@/lib/playground/role';

export async function getCurrentRole(): Promise<Role> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PLAYGROUND_ROLE_COOKIE)?.value;
  if (value && isRole(value)) return value;
  return DEFAULT_ROLE;
}

export async function getMockUser(): Promise<AuthUser> {
  const role = await getCurrentRole();
  return mockUserFor(role);
}

// Mirrors prod auth helpers — always returns a user in the playground.
export const getUser = getMockUser;
export const getUserWithRedirect = getMockUser;

export async function getCurrentClient(): Promise<AuthUser> {
  return mockUserFor('NON_LEGAL');
}
export async function getCurrentLawyer(): Promise<AuthUser> {
  return mockUserFor('LEGAL');
}
export async function getCurrentAdmin(): Promise<AuthUser> {
  return mockUserFor('INTERNAL_ADMIN');
}

export function companyTypeToPath(type: AuthUser['company']['type']) {
  switch (type) {
    case 'INTERNAL_ADMIN':
      return 'admin';
    case 'INTERNAL_ASSISTANT':
      return 'user';
    case 'LEGAL':
      return 'legal';
    case 'NON_LEGAL':
      return 'client';
  }
}
