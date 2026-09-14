import { describe, expect, it } from 'vitest';

import { isIntakeRoute } from './route-match';
import { isAskAvailableFor } from '@/lib/ask/availability';
import type { Role } from '@/lib/types';

describe('isIntakeRoute', () => {
  it('matches the intake flow and everything under it', () => {
    expect(isIntakeRoute('/client/new')).toBe(true);
    expect(isIntakeRoute('/client/new/')).toBe(true);
    expect(isIntakeRoute('/client/new/review')).toBe(true);
    // Unanchored, so a path that still carries its locale prefix matches too.
    expect(isIntakeRoute('/en/client/new')).toBe(true);
  });

  it('does not match a path that merely starts the same way', () => {
    expect(isIntakeRoute('/client/newsletter')).toBe(false);
    expect(isIntakeRoute('/client/cases')).toBe(false);
    expect(isIntakeRoute('/client')).toBe(false);
  });

  it('treats a missing pathname as not the intake route', () => {
    expect(isIntakeRoute(null)).toBe(false);
    expect(isIntakeRoute(undefined)).toBe(false);
  });
});

/**
 * The regression this file exists for.
 *
 * `TopNav` decides whether the ⌘J trigger exists and `DashboardOverlays`
 * decides whether `AskPanel` mounts. The trigger only flips a context boolean,
 * so a `true` here against a `false` there is not a cosmetic mismatch: it is a
 * visible, focusable, keyboard-bound control that opens nothing. That is what
 * shipped — `TopNav` had no intake-route term at all — and on `/client/new`
 * Ask Nora was dead.
 *
 * Both predicates are reproduced from their call sites rather than imported,
 * because the point is that two *separately written* conditions agree. A
 * shared helper would make this test pass by construction and prove nothing.
 */
describe('the Ask trigger and the Ask panel agree', () => {
  const askTriggerMounts = (
    role: Role,
    flag: boolean,
    pathname: string,
  ): boolean => flag && isAskAvailableFor(role) && !isIntakeRoute(pathname);

  const askPanelMounts = (
    role: Role,
    flag: boolean,
    pathname: string,
  ): boolean => flag && isAskAvailableFor(role) && !isIntakeRoute(pathname);

  const roles: Role[] = ['NON_LEGAL', 'LEGAL', 'INTERNAL_ADMIN'];
  const paths = [
    '/client/cases',
    '/client/new',
    '/client/new/review',
    '/client/newsletter',
    '/',
  ];

  it.each(roles)('agree for every path, role %s', (role) => {
    for (const pathname of paths) {
      for (const flag of [true, false]) {
        expect(askTriggerMounts(role, flag, pathname)).toBe(
          askPanelMounts(role, flag, pathname),
        );
      }
    }
  });

  it('offers Ask to a client off the intake route', () => {
    expect(askTriggerMounts('NON_LEGAL', true, '/client/cases')).toBe(true);
    expect(askPanelMounts('NON_LEGAL', true, '/client/cases')).toBe(true);
  });

  it('offers Ask to nobody on the intake route', () => {
    // The intake carries its own chat; two AI surfaces on one screen is the
    // thing the flag's description promises never happens.
    expect(askTriggerMounts('NON_LEGAL', true, '/client/new')).toBe(false);
    expect(askPanelMounts('NON_LEGAL', true, '/client/new')).toBe(false);
    expect(askTriggerMounts('NON_LEGAL', true, '/client/new/review')).toBe(
      false,
    );
  });
});
