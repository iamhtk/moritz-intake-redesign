/**
 * The tour, as data.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * KEYED BY SCREEN, AND A SCREEN IS A DEMO LINK PLUS A PHASE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The obvious shape for a guided tour is one flat array of stops, and it is
 * wrong here for a reason this flow makes unusually plain: the intake is five
 * screens that share one route. `?demo=quote` and the confirmation you press
 * *back to the confirmation* from are the same URL, and the composer on the
 * opening screen and the composer under a live transcript are the same
 * element in two different worlds. A flat array cannot say which of those a
 * stop belongs to, so it cannot say what has to be true before the stop is
 * shown and it cannot survive a reload.
 *
 * So the unit is a `TourScreen`: a `demo` parameter and an `IntakePhase`.
 * Between them they name exactly one state of `IntakeV2`, which is what makes
 * the cursor in `cursor.ts` meaningful across a navigation — it stores a
 * screen id, and the screen id resolves to both the address to be at and the
 * phase to wait for.
 *
 * Two screens share `demo=quote` (`quote` and `back`) and that is the case
 * that forced the pair. The reviewer never navigates between them: stop 26
 * presses the prototype's *back to the confirmation* link, which moves the
 * phase from `quoted` to `sent` and leaves the address alone. The phase is
 * what tells them apart.
 *
 * ## Targets are `data-tour`, never a class
 *
 * Every target below is a `data-tour` value. Classes in this app are Tailwind
 * utilities that change whenever somebody adjusts a gap, so a tour built on
 * them breaks silently and looks like the tour is broken rather than like the
 * layout moved. `data-tour` is a contract: `registry.test.ts` asserts every
 * value here is present in the source, so deleting an attribute fails the
 * build instead of the demo.
 *
 * ## Actions
 *
 * Three kinds, and no more, because each one is a thing the reviewer could do
 * themselves with a mouse:
 *
 *   - `click`   press a real control, named by its own `data-tour`
 *   - `navigate` go to another demo link, carrying the tour with it
 *   - none      just advance
 *
 * The tour never reaches into component state. Opening the document panel is
 * pressing the citation; going back to the confirmation is pressing the link
 * that goes back to the confirmation. That is what keeps the tour honest: if
 * a control stops working, the tour stops working in the same place.
 */

import type { IntakePhase } from '@/lib/intake/phase';

/** A `data-tour` value. */
export type TourTarget = string;

/** What pressing Next does, beyond moving on. */
export type TourAction =
  | { readonly kind: 'click'; readonly target: TourTarget }
  | { readonly kind: 'navigate'; readonly to: TourScreenId };

/** Which side of the target the popover prefers. */
export type TourSide = 'top' | 'right' | 'bottom' | 'left' | 'over';

export type TourStop = {
  /**
   * The stop's id, which is also its copy key: `tour.stop.<id>.title` and
   * `.body`. One name rather than two so a stop cannot end up pointing at one
   * element and describing another.
   */
  readonly id: string;
  /** The `data-tour` value to highlight. `null` centres the popover. */
  readonly target: TourTarget | null;
  readonly side?: TourSide;
  /** Performed on Next, before the tour moves on. */
  readonly action?: TourAction;
  /**
   * Extra actions performed on Next, in order, before `action`.
   *
   * One stop needs two presses (close the *seems high* panel, then go back to
   * the confirmation) and writing that as a second field rather than as an
   * array of one keeps the common case a single object to read.
   */
  readonly before?: readonly TourAction[];
  /**
   * Milliseconds to wait for the target to appear before giving up.
   *
   * Set only on the stops that follow an action, which are the only ones whose
   * element does not exist yet when the step is scheduled. Everything else
   * resolves on the first try and a wait would be latency for nothing.
   */
  readonly waitMs?: number;
};

export type TourScreenId = 'home' | 'describe' | 'sent' | 'quote' | 'back';

/**
 * Which half of the tour a screen belongs to, and the value of `?tour=`.
 *
 * Two parts, named in the address rather than five: the reviewer is handed
 * `?demo=1&tour=case` in the walkthrough docs and has to be able to read it.
 * *Which* stop inside the part is the cursor's business and lives in session
 * storage, where a copied link cannot carry somebody else's position into a
 * fresh browser.
 */
export type TourPart = 'home' | 'case';

export type TourScreen = {
  readonly id: TourScreenId;
  readonly part: TourPart;
  /**
   * The `?demo=` value this screen needs, or `null` for a fresh intake.
   *
   * `href()` below is the only thing that turns this into an address, so the
   * `tour` parameter cannot be forgotten on one of them.
   */
  readonly demo: string | null;
  /**
   * The phase `IntakeV2` is in on this screen.
   *
   * Not read at runtime — the cursor says which screen we are on, and the
   * targets say when the screen is ready. It is here so `registry.test.ts` can
   * hold the registry against `lib/intake/phase.ts`, which is the document
   * that decides what a phase is. A screen claiming a phase that no `?demo=`
   * link produces is a stop nobody will ever see.
   */
  readonly phase: IntakePhase;
  readonly stops: readonly TourStop[];
};

/** The intake's own route. The tour does not visit any other. */
export const TOUR_ROUTE = '/client/new';

/** The query parameter that says a tour is in progress on this screen. */
export const TOUR_PARAM = 'tour';

/**
 * Part one: the opening screen, with nothing typed.
 *
 * Eight stops on the things a client can reach before saying a word, then a
 * ninth that asks whether to carry on. The ninth has no target on purpose: it
 * is a question about the tour rather than about the page, and highlighting
 * something while asking it would suggest the answer is over there.
 */
const HOME: TourScreen = {
  id: 'home',
  part: 'home',
  demo: null,
  phase: 'start',
  stops: [
    { id: 'composer', target: 'composer', side: 'bottom' },
    { id: 'composerTools', target: 'composer-tools', side: 'bottom' },
    { id: 'matterChips', target: 'matter-chips', side: 'bottom' },
    { id: 'talkToAPerson', target: 'talk-to-a-person', side: 'bottom' },
    { id: 'howItWorks', target: 'how-it-works', side: 'top' },
    { id: 'askNora', target: 'ask-nora', side: 'bottom' },
    { id: 'commandPalette', target: 'command-palette', side: 'bottom' },
    { id: 'notifications', target: 'notifications', side: 'bottom' },
    {
      id: 'continueToCase',
      target: null,
      action: { kind: 'navigate', to: 'describe' },
    },
  ],
};

/**
 * Part two, screen one: the conversation and the brief filling in.
 *
 * The citation stop and the document stop are one movement split in two. The
 * first points at the words *read from*; pressing Next presses them, which is
 * the only way the panel opens for a client too, and the second points at what
 * that opened. Neither stop describes a thing the other one is showing.
 */
const DESCRIBE: TourScreen = {
  id: 'describe',
  part: 'case',
  demo: '1',
  phase: 'building',
  stops: [
    { id: 'journeyRail', target: 'journey-rail', side: 'right' },
    { id: 'briefFields', target: 'brief-fields', side: 'left' },
    {
      id: 'briefSource',
      target: 'brief-source',
      side: 'left',
      action: { kind: 'click', target: 'brief-source' },
    },
    {
      id: 'documentPassage',
      target: 'document-panel',
      side: 'left',
      waitMs: 2000,
    },
    { id: 'briefRowActions', target: 'brief-row-actions', side: 'left' },
    { id: 'briefProgress', target: 'brief-progress', side: 'left' },
    {
      id: 'reviewAndSend',
      target: 'brief-action',
      side: 'top',
      action: { kind: 'navigate', to: 'sent' },
    },
  ],
};

/**
 * Part two, screen two: the confirmation.
 *
 * The email is opened and closed again inside the tour rather than left open,
 * because the two stops after it point at things the panel would be covering.
 * Closing it is the same X a client would press.
 */
const SENT: TourScreen = {
  id: 'sent',
  part: 'case',
  demo: 'sent',
  phase: 'sent',
  stops: [
    { id: 'sentReceipt', target: 'sent-receipt', side: 'left' },
    { id: 'railQuoteStep', target: 'journey-step-quote', side: 'right' },
    { id: 'closeTab', target: 'close-tab', side: 'left' },
    {
      id: 'emailReceipt',
      target: 'email-trigger',
      side: 'left',
      action: { kind: 'click', target: 'email-trigger' },
    },
    {
      id: 'emailOpen',
      target: 'document-panel',
      side: 'left',
      waitMs: 2000,
      action: { kind: 'click', target: 'document-close' },
    },
    { id: 'pricingTeam', target: 'sent-lawyers', side: 'left', waitMs: 2000 },
    { id: 'sentDropzone', target: 'sent-dropzone', side: 'left' },
    {
      id: 'prototypeOnly',
      target: 'prototype-link',
      side: 'top',
      action: { kind: 'navigate', to: 'quote' },
    },
  ],
};

/**
 * Part two, screen three: the quote that a person writes.
 *
 * The last stop here walks the reviewer back out of the two panels it opened,
 * in reverse order, so the tour leaves the screen the way it found it. The
 * confirmation it lands on is the `back` screen below: same address, one phase
 * earlier.
 */
const QUOTE: TourScreen = {
  id: 'quote',
  part: 'case',
  demo: 'quote',
  phase: 'quoted',
  stops: [
    { id: 'quoteCard', target: 'quote-card', side: 'left' },
    {
      id: 'seemsHigh',
      target: 'quote-too-high',
      side: 'left',
      action: { kind: 'click', target: 'quote-too-high' },
    },
    {
      id: 'seemsHighReasons',
      target: 'quote-too-high-reasons',
      side: 'left',
      waitMs: 2000,
      before: [{ kind: 'click', target: 'quote-back' }],
      action: { kind: 'click', target: 'prototype-back' },
    },
  ],
};

/**
 * The last stop, and the reason a screen is a demo *and* a phase.
 *
 * Same address as `quote`; the phase has gone back to `sent` because the
 * prototype link put it there. Nothing navigates here and nothing navigates
 * away: Finish clears the cursor and the reviewer is left on the confirmation
 * with *Go to case* under the cursor, which is where the intake ends.
 */
const BACK: TourScreen = {
  id: 'back',
  part: 'case',
  demo: 'quote',
  phase: 'sent',
  stops: [
    { id: 'goToCase', target: 'brief-action', side: 'top', waitMs: 2000 },
  ],
};

export const TOUR_SCREENS: readonly TourScreen[] = [
  HOME,
  DESCRIBE,
  SENT,
  QUOTE,
  BACK,
];

/** The screens, by id, so a cursor can be resolved without a scan at each use. */
export function screenById(id: TourScreenId): TourScreen | undefined {
  return TOUR_SCREENS.find((screen) => screen.id === id);
}

/** The screen that follows this one, or `undefined` at the end of the tour. */
export function nextScreen(id: TourScreenId): TourScreen | undefined {
  const index = TOUR_SCREENS.findIndex((screen) => screen.id === id);
  return index === -1 ? undefined : TOUR_SCREENS[index + 1];
}

/** Every stop, in order, across every screen. */
export function allStops(): readonly TourStop[] {
  return TOUR_SCREENS.flatMap((screen) => screen.stops);
}

/** How many stops the whole tour has. The dots count this. */
export const TOUR_STOP_COUNT = allStops().length;

/**
 * How far into the whole tour a screen's first stop is.
 *
 * The dots are a readout of the tour, not of the screen, so a stop has to know
 * its absolute position. Computed rather than written down, because a number
 * written beside a list is a number that disagrees with the list eventually.
 */
export function stopOffset(id: TourScreenId): number {
  let offset = 0;
  for (const screen of TOUR_SCREENS) {
    if (screen.id === id) return offset;
    offset += screen.stops.length;
  }
  return offset;
}

/**
 * The address for a screen, locale-less, for `@/i18n/navigation`'s router.
 *
 * Every screen carries the `tour` parameter, including the first, so "is a
 * tour running here" is one question with one answer rather than a special
 * case for the screen the tour happens to start on. It carries the *part*
 * rather than the screen id, which is the form the walkthrough docs hand out:
 * `?demo=1&tour=case`.
 */
export function href(screen: TourScreen): string {
  const query = new URLSearchParams();
  if (screen.demo !== null) query.set('demo', screen.demo);
  query.set(TOUR_PARAM, screen.part);
  return `${TOUR_ROUTE}?${query.toString()}`;
}

/** The CSS selector for a `data-tour` value. Attribute, never a class. */
export function selectorFor(target: TourTarget): string {
  return `[data-tour="${target}"]`;
}
