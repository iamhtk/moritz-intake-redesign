import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MOCK_ADMIN_USER,
  MOCK_ASSISTANT_USER,
  MOCK_CLIENT_USER,
  MOCK_LEGAL_USER,
} from '@/lib/mocks/users';
import type { AuthUser, Role } from '@/lib/types';
import { ASK_ROLES, isAskAvailableFor } from './availability';
import { askSystemPrompt, buildAskContext } from './context';
import { buildAskScope } from './scope';
import { buildAskSuggestions } from './suggestions';

/**
 * Ask is a client surface, and the other three roles are off rather than gone.
 *
 * This file asserts both halves, because the second is the one that rots. "We
 * can switch the other roles on later" is only true while the code behind them
 * still works, and code nothing exercises stops working quietly. So the
 * reactivation path is tested *now*, with the roles off: every projection still
 * builds, every prompt still resolves, every chip still comes out. If one of
 * them breaks, it breaks here rather than on the day someone edits `ASK_ROLES`
 * and discovers a year of drift.
 */

const USERS: Record<Role, AuthUser> = {
  NON_LEGAL: MOCK_CLIENT_USER,
  LEGAL: MOCK_LEGAL_USER,
  INTERNAL_ADMIN: MOCK_ADMIN_USER,
  INTERNAL_ASSISTANT: MOCK_ASSISTANT_USER,
};

const ROLES = Object.keys(USERS) as Role[];
const OFF_ROLES = ROLES.filter((role) => !isAskAvailableFor(role));

describe('who Ask is offered to', () => {
  it('is the client, and only the client', () => {
    expect(ASK_ROLES).toEqual(['NON_LEGAL']);
    expect(isAskAvailableFor('NON_LEGAL')).toBe(true);
  });

  it.each(['LEGAL', 'INTERNAL_ADMIN', 'INTERNAL_ASSISTANT'] as const)(
    'is not offered to %s',
    (role) => {
      expect(isAskAvailableFor(role)).toBe(false);
    },
  );

  /* Guards the reactivation suite below from passing on an empty list. */
  it('leaves three roles switched off', () => {
    expect(OFF_ROLES).toHaveLength(3);
  });
});

/**
 * The surfaces that have to agree. Asserted from source because mounting the
 * shell means mounting the whole dashboard, and the claim is a textual one: the
 * gate is read, not reimplemented.
 */
describe('every surface reads the same gate', () => {
  const read = (relativePath: string) =>
    readFileSync(join(process.cwd(), relativePath), 'utf8');

  /*
   * The two client surfaces now read the gate through `useAskAvailable`, which
   * is the one place the whole rule lives. They used to each spell it out, and
   * the copies drifted twice: first `TopNav` was missing a term the shell had,
   * which left a dead ⌘J trigger over an unmounted panel on `/client/new`;
   * then the term was added to both, which removed Nora from that screen
   * entirely. Asserting the *indirection* is the point — a surface that
   * mentions `isAskAvailableFor` itself is a surface building its own answer
   * again.
   */
  it.each([
    'components/design/top-nav/top-nav.tsx',
    'components/navigation/dashboard-shell.tsx',
  ])('%s reads the shared useAskAvailable hook', (relativePath) => {
    const source = read(relativePath);
    expect(source).toContain('useAskAvailable');
    expect(source).not.toContain('isAskAvailableFor');
  });

  it('the hook is the one place the client-side rule is read', () => {
    const source = read('components/design/ask/use-ask-available.ts');
    expect(source).toContain('askOffered');
    expect(source).toContain('useAskNora');
  });

  it('the route gates on isAskAvailableFor, read from the cookie', () => {
    expect(read('app/api/ask/route.ts')).toContain('isAskAvailableFor');
  });

  /*
   * The important one, and the reason a component-level check is not enough:
   * "the button is not rendered" has never been an access control. The route
   * has to decline before it builds a scope or spends a token.
   */
  it('the route declines before it builds a scope', () => {
    const source = read('app/api/ask/route.ts')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    const gate = source.indexOf('isAskAvailableFor');
    const scope = source.indexOf('buildAskScope(');
    expect(gate).toBeGreaterThan(-1);
    expect(scope).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(scope);
    expect(source).toContain('status: 403');
  });

  /*
   * The palette's *Ask Nora* row is derived from the panel being mounted
   * (`onAskNora` is only passed when it is), so gating the panel gates the row.
   * Pinned because splitting them into two conditions is the obvious "tidy"
   * and would reintroduce the offered-and-inert case.
   */
  it('the palette row is derived from the panel, not gated separately', () => {
    const shell = read('components/navigation/dashboard-shell.tsx');
    expect(shell).toContain('onAskNora={askAvailable ? openAsk : undefined}');
    expect(shell).toContain('{askAvailable ? <AskPanel user={user} /> : null}');
  });
});

/**
 * ⭐ The reactivation path, kept alive.
 *
 * Nothing in the app reaches these code paths today. They are tested anyway,
 * so that adding a role to `ASK_ROLES` is the whole change.
 */
describe('the switched-off roles still work, so they can be switched on', () => {
  const NOW = new Date('2026-09-13T10:00:00.000Z');

  it.each(OFF_ROLES)('%s still builds a projection', (role) => {
    const scope = buildAskScope(role, USERS[role]);
    expect(scope.role).toBe(role);
    expect(Array.isArray(scope.cases)).toBe(true);
  });

  it.each(OFF_ROLES)('%s still serialises a grounding block', (role) => {
    const context = buildAskContext(buildAskScope(role, USERS[role]), NOW);
    expect(context).toContain('MORITZ CONTEXT');
    expect(context).toContain(`role: ${role}`);
    // The sections a client's block deliberately drops are still here.
    expect(context).toContain('CLAIMABLE (');
    expect(context).toContain('QUOTE ROUNDS (');
    expect(context).toContain('AUDIT LOG (');
  });

  it.each(OFF_ROLES)('%s still resolves the internal prompt', (role) => {
    expect(askSystemPrompt(role)).toContain('You are Nora');
    expect(askSystemPrompt(role)).not.toBe(askSystemPrompt('NON_LEGAL'));
  });

  it.each(OFF_ROLES)('%s still builds its chips', (role) => {
    const chips = buildAskSuggestions(buildAskScope(role, USERS[role]));
    expect(Array.isArray(chips)).toBe(true);
    for (const chip of chips) expect(chip.text.endsWith('?')).toBe(true);
  });

  /*
   * And the privacy boundary still holds for them, which is the part that would
   * be genuinely dangerous to let rot: a role switched back on after its
   * projection had quietly widened would leak on the first question.
   */
  it('an admin still sees everything and a lawyer still does not', () => {
    const admin = buildAskScope('INTERNAL_ADMIN', MOCK_ADMIN_USER);
    const lawyer = buildAskScope('LEGAL', {
      ...MOCK_LEGAL_USER,
      id: 'usr_legal_003',
    });
    expect(admin.cases.length).toBeGreaterThan(lawyer.cases.length);
    for (const legalCase of lawyer.cases) {
      expect(legalCase.assignedLawyer?.id).toBe('usr_legal_003');
    }
  });
});
