import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXTRA_ROUTES } from '@/components/navigation/sidebar-nav-items';
import { isMatterId } from '@/components/design/new-case/intake-types';
import { lawyerById } from '@/components/design/new-case/lawyers';
import { MORITZ_AI, toCaseTranscript } from './case-transcript';
import type { ParticipantRef } from '@/lib/types';

/**
 * *Talk to a person* — the exit, and whether it leaves a trace (V22, G6).
 *
 * The exit is a screen of its own now (`/client/talk`), which is better in
 * every way but moves the one thing that keeps going wrong here. Three times
 * running, the failure has been the same shape: the client is shown a
 * confirmation and a promise that somebody reads their message within four
 * hours, and the words themselves end up somewhere nothing durable reads.
 *
 * - As a dialog, a handoff sent *after* submission went into React state only,
 *   because the case transcript is snapshotted once at send.
 * - As a screen, a handoff sent *before* submission would go the same way,
 *   because it is no longer in the intake's `messages` to be snapshotted.
 *
 * So both directions are pinned: `carryPersonMessagesToCase` for the first,
 * `addSubmittedCaseTurns` for the second, and the card for whether any of it is
 * visible once it arrives.
 */

const CLIENT: ParticipantRef = {
  id: 'usr_client_001',
  name: 'Alex Morgan',
  email: 'alex.morgan@northwindltd.com',
  image: null,
  actor: 'client',
  companyName: 'Northwind Ltd.',
};

const HANDOFF = { lawyerId: 'intake-lawyer-priya' };

describe('a handoff on a case', () => {
  it('becomes a card rather than a bubble', () => {
    const messages = toCaseTranscript({
      caseId: 'case_009',
      turns: [
        { role: 'client', text: 'My supplier may walk.', at: '2026-09-13' },
        { role: 'assistant' as never, text: 'ignored', at: '2026-09-13' },
        {
          role: 'client',
          text: 'I would rather explain this on a call.',
          at: '2026-09-13',
          handoff: HANDOFF,
        },
      ],
      client: CLIENT,
    });

    expect(messages[2]!.handoffEvent).toEqual(HANDOFF);
    // The client's own words stay on `body`: the card quotes them, unlike
    // `paymentEvent`, whose copy is derived and whose body is ignored.
    expect(messages[2]!.body).toBe('I would rather explain this on a call.');
    expect(messages[2]!.author).toEqual(CLIENT);
  });

  /* The negative that makes the marker mean anything. */
  it('leaves every other turn an ordinary message', () => {
    const messages = toCaseTranscript({
      caseId: 'case_009',
      turns: [
        { role: 'client', text: 'Here is the contract.', at: '2026-09-13' },
        { role: 'moritz', text: 'Thank you.', at: '2026-09-13' },
      ],
      client: CLIENT,
    });
    expect(messages).toHaveLength(2);
    for (const message of messages) {
      expect(message.handoffEvent).toBeUndefined();
    }
    expect(messages[1]!.author).toEqual(MORITZ_AI);
  });
});

/**
 * The store behind the screen.
 *
 * Module scope, not `localStorage`, so a refresh is a reset. `vi.resetModules()`
 * plus a re-import is that reload: it is the same boundary
 * `submitted-cases.test.ts` uses to prove the opposite about *its* store, which
 * is what makes the pair of tests meaningful rather than decorative.
 */
describe('messages written on the Talk screen', () => {
  async function freshModule() {
    vi.resetModules();
    return import('@/lib/mocks/person-messages');
  }

  afterEach(() => {
    vi.resetModules();
  });

  it('keeps what was sent, so the screen can show it back', async () => {
    const store = await freshModule();
    store.recordPersonMessage({
      id: 'pm_1',
      text: 'I would rather explain this on a call.',
      at: '2026-09-13T10:00:00.000Z',
      lawyerId: 'intake-lawyer-priya',
    });
    expect(store.readPersonMessages()).toHaveLength(1);
    expect(store.readPersonMessages()[0]!.text).toBe(
      'I would rather explain this on a call.',
    );
  });

  it('ignores an empty message rather than storing a blank card', async () => {
    const store = await freshModule();
    store.recordPersonMessage({ id: 'pm_1', text: '   ', at: 'now' });
    expect(store.readPersonMessages()).toHaveLength(0);
  });

  /*
   * ⭐ The reset. A reviewer opening this screen must not find cards left by
   * whoever clicked it before them — "somebody reads this within four hours"
   * reads as a live commitment, not as stale demo state. `NOTE.md` opens by
   * promising the demo URLs work "in one tab, in any order", and this is the
   * same promise one screen along.
   */
  it('is empty again after a reload', async () => {
    const before = await freshModule();
    before.recordPersonMessage({ id: 'pm_1', text: 'Sent.', at: 'now' });
    expect(before.readPersonMessages()).toHaveLength(1);

    const after = await freshModule();
    expect(after.readPersonMessages()).toHaveLength(0);
  });

  /*
   * The other half, and the reason this is module scope rather than plain
   * component state: going to look at your cases and coming back is a remount,
   * not a reload, and the message has to still be there.
   */
  it('survives a remount within the same session', async () => {
    const store = await freshModule();
    store.recordPersonMessage({ id: 'pm_1', text: 'Sent.', at: 'now' });
    // A second read through the same module instance is what a remounted
    // component does.
    expect(store.readPersonMessages()).toHaveLength(1);
    expect(store.readPersonMessages()).toBe(store.readPersonMessages());
  });

  it('does not touch localStorage at all', async () => {
    const store = await freshModule();
    const setItem = vi.fn();
    vi.stubGlobal('window', {
      localStorage: { getItem: () => null, setItem, removeItem: vi.fn() },
    });
    store.recordPersonMessage({ id: 'pm_1', text: 'Sent.', at: 'now' });
    expect(setItem).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  /*
   * ⭐ A message written while the brief was still open has to reach the case
   * at submission, or the exit goes nowhere for the client who got stuck
   * halfway.
   */
  it('carries un-landed messages onto the case at submission', async () => {
    const store = await freshModule();
    store.recordPersonMessage({
      id: 'pm_1',
      text: 'Can someone call me?',
      at: '2026-09-13T10:00:00.000Z',
      lawyerId: 'intake-lawyer-priya',
    });

    const turns = store.carryPersonMessagesToCase('case_009');
    expect(turns).toHaveLength(1);
    expect(turns[0]!.role).toBe('client');
    expect(turns[0]!.text).toBe('Can someone call me?');
    // Marked as a handoff, or it arrives on the case as a plain bubble.
    expect(turns[0]!.handoff).toEqual({ lawyerId: 'intake-lawyer-priya' });
  });

  it('never carries the same message twice', async () => {
    const store = await freshModule();
    store.recordPersonMessage({ id: 'pm_1', text: 'Once.', at: 'now' });

    expect(store.carryPersonMessagesToCase('case_009')).toHaveLength(1);
    expect(store.carryPersonMessagesToCase('case_009')).toHaveLength(0);
  });

  /* Marked, not removed: the screen still shows the client their own message. */
  it('keeps a carried message visible on the screen', async () => {
    const store = await freshModule();
    store.recordPersonMessage({ id: 'pm_1', text: 'Once.', at: 'now' });
    store.carryPersonMessagesToCase('case_009');

    expect(store.readPersonMessages()).toHaveLength(1);
    expect(store.readPersonMessages()[0]!.caseId).toBe('case_009');
  });

  it('resets on demand', async () => {
    const store = await freshModule();
    store.recordPersonMessage({ id: 'pm_1', text: 'Sent.', at: 'now' });
    store.resetPersonMessages();
    expect(store.readPersonMessages()).toHaveLength(0);
  });
});

describe('the ?matter= guard', () => {
  /*
   * The value is in a URL a reader can edit. A cast would let `?matter=nonsense`
   * resolve to the default lead as though the matter were known.
   */
  it('accepts a real matter and rejects anything else', () => {
    expect(isMatterId('employment')).toBe(true);
    expect(isMatterId('nonsense')).toBe(false);
    expect(isMatterId(undefined)).toBe(false);
  });
});

describe('the nav never calls this screen a new case', () => {
  const talk = EXTRA_ROUTES.find((route) => route.url === '/client/talk');

  /*
   * `EXTRA_ROUTES` is read by both the page title and the command palette's
   * "Jump to" group, so one entry covers both. Without it the screen falls back
   * to a less specific match and a client who asked to speak to a human sits
   * under a heading offering to start another matter.
   */
  it('gives it its own title', () => {
    expect(talk).toBeDefined();
    expect(talk!.title).toBe('Talk to a person');
  });

  it('does not match the new-case route', () => {
    expect(talk!.url.startsWith('/client/new')).toBe(false);
    const newCase = EXTRA_ROUTES.find((route) => route.url === '/client/new');
    expect(newCase!.title).toBe('New case');
  });
});

/**
 * The wiring, read as source — the same discipline the Ask route's tests use.
 * These are components and hooks, this project's suite is the node environment
 * over `lib/**`, and the claims are textual. The defects above are *missing
 * calls*, which is exactly what type-checks, builds and ships.
 */
describe('the wiring', () => {
  const read = (relativePath: string) =>
    readFileSync(join(process.cwd(), relativePath), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

  it('carries the waiting messages when the case is recorded', () => {
    const intake = read('components/design/intake-v2/intake-v2.tsx');
    const record = intake.slice(
      intake.indexOf('recordSubmittedCase({'),
      intake.indexOf('clearIntakeSession()'),
    );
    expect(record).toContain('carryPersonMessagesToCase');
  });

  /*
   * Asserted on the shared hook now rather than on the screen. The screen
   * delegates, and so does the overlay — see 'shares one send path' below,
   * which is what stops the two surfaces drifting.
   */
  it('puts a message sent after submission straight onto the case', () => {
    const hook = read('components/design/talk/use-send-person-message.ts');
    expect(hook).toContain('addSubmittedCaseTurns');
    expect(hook).toContain('recordPersonMessage');
  });

  it('renders the handoff as a card in the case thread', () => {
    expect(read('components/cases/case-chat.tsx')).toContain('HandoffCard');
  });

  /*
   * The exit opens over the page and *sending* navigates.
   *
   * Both halves matter and they used to be one. A dialog that wrote back into
   * the transcript was the original defect — the exit did not go anywhere. A
   * straight navigation on the first click fixed that and broke the entrance:
   * the page went away before the client had written a word, behind a discard
   * prompt about work they had not asked to abandon.
   */
  it('opens the overlay rather than navigating on the first click', () => {
    const trigger = read('components/design/intake-v2/talk-to-a-person.tsx');
    expect(trigger).toContain('overlay.openTalk');
    // No compose surface of its own: the overlay owns the message.
    expect(trigger).not.toContain('Textarea');
  });

  it('navigates to the screen when the message is sent', () => {
    const overlay = read('components/design/talk/talk-overlay.tsx');
    expect(overlay).toContain('/client/talk');
    expect(overlay).toContain('navigationGuard.navigate');
  });

  /*
   * A named click is a choice already made. Offering a roster afterwards asks
   * the same question twice and lets the second answer contradict the first,
   * which is how an employment matter gets addressed to the commercial lead.
   */
  it('hides the roster when the request names a lawyer', () => {
    const overlay = read('components/design/talk/talk-overlay.tsx');
    expect(overlay).toContain("step === 'pick' && !lockedLawyer");
  });

  /*
   * The label follows the face on screen, not `matterId`.
   *
   * The trigger used to resolve its own first name through `leadForMatter`,
   * which returns the default lead for an unknown matter — so every one of the
   * eleven rotating faces carried "Ask Daniel something" underneath it.
   */
  it('never resolves its own name from the matter', () => {
    const trigger = read('components/design/intake-v2/talk-to-a-person.tsx');
    expect(trigger).not.toContain('leadForMatter');
    expect(trigger).toContain('triggerAnyone');
    // Named only once the rotation has settled on a real lead.
    expect(trigger).toContain('pinned && lawyer');
  });

  it('passes the face it is showing down to the trigger', () => {
    const note = read('components/design/intake-v2/intake-lawyer-note.tsx');
    expect(note).toContain('lawyer={lawyer}');
    expect(note).toContain('pinned={isSettled}');
  });

  /*
   * One send path, or a message written in the overlay reaches the Talk screen
   * and never reaches the case — which looks correct on both screens.
   */
  it('shares one send path between the overlay and the screen', () => {
    expect(read('components/design/talk/talk-screen.tsx')).toContain(
      'useSendPersonMessage',
    );
    expect(read('components/design/talk/talk-overlay.tsx')).toContain(
      'useSendPersonMessage',
    );
    const hook = read('components/design/talk/use-send-person-message.ts');
    expect(hook).toContain('recordPersonMessage');
    expect(hook).toContain('addSubmittedCaseTurns');
  });

  /*
   * Priya is the one lawyer this flow names to a client by design, and she is
   * not in `ONBOARDING_LAWYERS` — so the lookup the handoff card draws a face
   * from has to read the full roster or *Ask Priya* records an id that
   * resolves to nobody.
   */
  it('resolves every roster lawyer by id, not just the onboarding five', () => {
    expect(lawyerById('intake-lawyer-priya')?.name).toBe('Priya Shah');
    expect(lawyerById('onboarding-lawyer-daniel')).not.toBeNull();
    expect(lawyerById('not-a-lawyer')).toBeNull();
  });

  /* One column. A brief panel here would be about work this screen is not doing. */
  it('leaves the brief column out of the Talk screen', () => {
    const screen = read('components/design/talk/talk-screen.tsx');
    expect(screen).not.toContain('BriefColumn');
    expect(screen).not.toContain('brief-column');
    // Capped and centred instead.
    expect(screen).toContain('mx-auto');
  });

  /*
   * The way back goes to the list, not to a case.
   *
   * It pointed at `SUBMITTED_CASE.href` — `/client/cases/case_009`, the one
   * mock the intake's submission stands for. Right for the confirmation
   * screen's "Go to case", wrong here: this screen is not about any one case,
   * and a client who arrived from the nav had never seen that case.
   */
  it('sends the client back to the cases list', () => {
    const screen = read('components/design/talk/talk-screen.tsx');
    expect(screen).toContain('href="/client/cases"');
    // Not a specific case, and not the intake either — offering "start a new
    // case" to someone who just asked for a human answers the wrong question.
    expect(screen).not.toContain('SUBMITTED_CASE.href');
    expect(screen).not.toContain('/client/new');
  });

  /*
   * The highlighted row has to be readable. `SelectItem` goes dark on focus
   * (`focus:bg-primary`) and relies on the text inheriting
   * `text-primary-foreground` — which these rows defeated by setting their own
   * colours, so the one row the client was looking at rendered black on black.
   */
  it('inverts the picker row text on the highlighted option', () => {
    const picker = read('components/design/talk/lawyer-picker.tsx');
    // Both lines, or the quieter one stays dark on the dark fill.
    expect(picker).toContain('group-focus:text-primary-foreground truncate');
    expect(picker).toContain('group-focus:text-primary-foreground/75');
    // And the monogram, which is the third thing with its own colour.
    expect(picker).toContain('group-focus:bg-primary-foreground/20');
  });

  /*
   * The full roster, not the onboarding five. A client can watch any of eleven
   * faces rotate beside the composer, so a picker that offers five of them is
   * a list that contradicts the screen above it — and the one it left out was
   * Priya, the only lawyer this flow names to a client by design.
   */
  it('offers the roster with faces rather than one resolved lawyer', () => {
    const picker = read('components/design/talk/lawyer-picker.tsx');
    expect(picker).toContain('INTAKE_NOTE_ROSTER');
    expect(picker).toContain('AvatarImage');
    // "Anyone at Moritz" is the default, so the exit is not a quiz.
    expect(picker).toContain('ANY_LAWYER');
    expect(read('components/design/talk/talk-screen.tsx')).toContain(
      'useState<string>(ANY_LAWYER)',
    );
  });
});
