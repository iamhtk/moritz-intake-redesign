import { describe, expect, it } from 'vitest';

import { isIntakeRoute } from './route-match';

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
 * What still reads this, now that Ask does not.
 *
 * This matcher used to gate three things: the shell's two layout branches, the
 * support launcher, and Ask. The Ask term is gone — it hid Nora on the one
 * screen she is wanted on most, and the rule now lives route-free in
 * `components/design/ask/use-ask-available.ts`, which has its own test saying
 * so. The two survivors are genuinely about the route.
 */
describe('the intake route still owns its layout and its support launcher', () => {
  it('switches the shell to the intake layout', () => {
    // `dashboard-shell.tsx` uses this to drop the page padding and let the
    // intake run full height.
    expect(isIntakeRoute('/client/new')).toBe(true);
    expect(isIntakeRoute('/client/cases')).toBe(false);
  });

  it('withholds the floating support launcher', () => {
    // Unlike Ask, this one really would be a second support surface over a
    // flow that already has its own way to reach a person.
    const supportLauncherShows = (pathname: string) => !isIntakeRoute(pathname);
    expect(supportLauncherShows('/client/new')).toBe(false);
    expect(supportLauncherShows('/client/new/review')).toBe(false);
    expect(supportLauncherShows('/client/cases')).toBe(true);
  });
});
