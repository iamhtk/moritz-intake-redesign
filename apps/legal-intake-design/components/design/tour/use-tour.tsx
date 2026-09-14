'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { driver, type DriveStep, type Driver, type Side } from 'driver.js';

import { usePathname, useRouter } from '@/i18n/navigation';
import {
  TOUR_PARAM,
  TOUR_ROUTE,
  TOUR_SCREENS,
  TOUR_STOP_COUNT,
  href,
  nextScreen,
  screenById,
  selectorFor,
  stopOffset,
  type TourAction,
  type TourScreen,
  type TourScreenId,
  type TourStop,
} from '@/lib/tour/registry';
import {
  clearCursor,
  readCursor,
  writeCursor,
  writeDismissal,
  type TourCursor,
} from '@/lib/tour/cursor';

import '@/lib/tour/driver-theme.css';

/**
 * The tour engine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE TOUR IS A CURSOR, AND THE URL SAYS WHETHER TO READ IT.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * driver.js is a single-page library: it highlights elements that exist in
 * the DOM it was handed. The tour walks five screens that share one route and
 * three of the moves between them are real navigations, so the engine has to
 * survive its own driver being destroyed and rebuilt. The arrangement:
 *
 *   - `?tour=` in the address means "a tour is running on this page". Every
 *     screen's `href()` carries it, so the check is one parameter, not a
 *     per-screen special case.
 *   - `sessionStorage` carries *where*. On every URL change the engine reads
 *     the cursor, resolves it to a screen, waits for that screen's phase to
 *     be on the page, and drives from the stop it names.
 *   - Pressing Next on the last stop of a screen either navigates (writing
 *     the next cursor first) or, when the next screen is the same address one
 *     phase later, rebuilds in place.
 *
 * Nothing here reaches into component state. The engine sees the page the
 * way a client does: an element is there or it is not, and a phase is a
 * `data-intake-phase` attribute on the intake's root. That is what keeps the
 * tour honest — if a control stops working, the tour stops working in the
 * same place, and the registry test that asserts every target exists is the
 * only coupling.
 *
 * ## Why the driver is rebuilt per screen rather than configured once
 *
 * driver.js takes one flat `steps` array and a `drive(index)`. The registry's
 * unit is a screen, so each screen becomes its own steps array and its own
 * driver instance. A single instance spanning navigations would need its
 * `steps` to reference elements on pages that are not mounted, which the
 * library handles by skipping them — and a skipped stop is indistinguishable
 * from a broken one to the person watching. Per screen, every step's element
 * is on the page or about to be.
 */

/** How long a screen may take to reach its phase before the tour gives up. */
const PHASE_TIMEOUT_MS = 8000;

/** How long a stop waits for its element when nothing says otherwise. */
const DEFAULT_WAIT_MS = 400;

/** Marks the trigger so focus can return to it when the tour ends. */
export const TOUR_TRIGGER_ATTR = 'data-tour-trigger';

export type TourControls = {
  /** Start from the beginning, from anywhere. */
  start: () => void;
  /** Whether a popover is on screen right now. */
  running: boolean;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Resolves when the intake root reports the phase, or rejects at the timeout.
 *
 * A `MutationObserver` on the attribute rather than a poll, so the tour picks
 * up the moment `sent` lands rather than up to a tick later. The observer is
 * disconnected on both exits.
 */
function waitForPhase(phase: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const matches = () =>
      document.querySelector(`[data-intake-phase="${phase}"]`) !== null;
    if (matches()) {
      resolve();
      return;
    }
    const observer = new MutationObserver(() => {
      if (matches()) {
        observer.disconnect();
        window.clearTimeout(timer);
        resolve();
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-intake-phase'],
    });
    const timer = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(`tour: phase "${phase}" did not arrive`));
    }, timeoutMs);
  });
}

/** Presses a control by its `data-tour` value. Returns whether it was there. */
function press(target: string): boolean {
  const el = document.querySelector<HTMLElement>(selectorFor(target));
  if (!el) return false;
  el.click();
  return true;
}

function returnFocusToTrigger() {
  document.querySelector<HTMLElement>(`[${TOUR_TRIGGER_ATTR}]`)?.focus();
}

/** The screen a plain `?demo=` address belongs to, when there is no cursor. */
function screenForDemo(demo: string | null): TourScreen {
  return (
    TOUR_SCREENS.find((screen) => screen.demo === demo) ?? TOUR_SCREENS[0]!
  );
}

export function useTour(): TourControls {
  const t = useTranslations('tour');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const driverRef = useRef<Driver | null>(null);
  /** True from "resume asked" until the driver exists or the wait gave up. */
  const pendingRef = useRef(false);
  const [running, setRunning] = useState(false);
  const tourParam = searchParams.get(TOUR_PARAM);
  const demoParam = searchParams.get('demo');
  const onTourRoute = pathname === TOUR_ROUTE;

  const destroy = useCallback(() => {
    driverRef.current?.destroy();
    driverRef.current = null;
    setRunning(false);
  }, []);

  const end = useCallback(
    (reason: 'skipped' | 'finished') => {
      destroy();
      clearCursor();
      writeDismissal(reason);
      returnFocusToTrigger();
      // Take `tour` out of the address, keeping the demo the reviewer is on,
      // so a refresh does not restart the tour they just closed.
      const query = new URLSearchParams(searchParams.toString());
      query.delete(TOUR_PARAM);
      const rest = query.toString();
      router.replace(rest ? `${TOUR_ROUTE}?${rest}` : TOUR_ROUTE);
    },
    [destroy, router, searchParams],
  );

  /** Run the actions a stop names, in order. Missing controls are skipped. */
  const perform = useCallback((actions: readonly TourAction[]) => {
    for (const action of actions) {
      if (action.kind === 'click') press(action.target);
    }
  }, []);

  /**
   * Leave this screen for the next, or, when the next screen is the same
   * address one phase later, rebuild in place. `resume` is passed in rather
   * than closed over because the two are mutually recursive.
   */
  const advanceScreen = useCallback(
    (
      screen: TourScreen,
      stop: TourStop,
      resume: (cursor: TourCursor) => void,
    ) => {
      perform(stop.before ?? []);
      const action = stop.action;
      if (action?.kind === 'navigate') {
        const to = screenById(action.to);
        if (!to) return end('finished');
        writeCursor({ screen: to.id, stop: 0 });
        destroy();
        router.push(href(to));
        return;
      }
      if (action?.kind === 'click') press(action.target);
      const next = nextScreen(screen.id);
      if (!next) return end('finished');
      const cursor: TourCursor = { screen: next.id, stop: 0 };
      writeCursor(cursor);
      destroy();
      resume(cursor);
    },
    [destroy, end, perform, router],
  );

  const resume = useCallback(
    (cursor: TourCursor) => {
      const screen = screenById(cursor.screen);
      if (!screen) return end('finished');
      const stops = screen.stops;
      const isLastScreen = nextScreen(screen.id) === undefined;
      const offset = stopOffset(screen.id);

      pendingRef.current = true;
      void waitForPhase(screen.phase, PHASE_TIMEOUT_MS)
        .then(() => {
          pendingRef.current = false;
          const steps: DriveStep[] = stops.map((stop, index) => {
            const isLast = index === stops.length - 1;
            const isFirst = index === 0;
            const continueQuestion = stop.target === null;
            return {
              ...(stop.target ? { element: selectorFor(stop.target) } : {}),
              waitForElement: stop.waitMs ?? DEFAULT_WAIT_MS,
              skipMissingElement: true,
              popover: {
                title: t(`stop.${stop.id}.title`),
                description: t(`stop.${stop.id}.body`),
                side: (stop.side ?? 'bottom') as Side,
                align: 'start',
                showButtons: ['previous', 'next', 'close'],
                // Back cannot cross a screen boundary: the previous screen is
                // a navigation away and its phase would have to be rebuilt.
                // Rather than a Back that sometimes reloads, it is off on the
                // first stop of each screen and says so by being absent.
                disableButtons: isFirst ? ['previous'] : [],
                nextBtnText: continueQuestion
                  ? t('yes')
                  : isLast && isLastScreen
                    ? t('finish')
                    : t('next'),
                prevBtnText: t('back'),
                doneBtnText: t('finish'),
                onNextClick: () => {
                  if (isLast) {
                    advanceScreen(screen, stop, resume);
                    return;
                  }
                  perform(stop.before ?? []);
                  if (stop.action?.kind === 'click') press(stop.action.target);
                  writeCursor({ screen: screen.id, stop: index + 1 });
                  driverRef.current?.moveNext();
                },
                onPrevClick: () => {
                  if (isFirst) return;
                  writeCursor({ screen: screen.id, stop: index - 1 });
                  driverRef.current?.movePrevious();
                },
                onCloseClick: () => end('skipped'),
                onPopoverRender: (popover) => {
                  const absolute = offset + index;
                  // Dots, never a count. `.mz-tour-dot` lives in the theme.
                  popover.progress.replaceChildren(
                    ...Array.from({ length: TOUR_STOP_COUNT }, (_, i) => {
                      const dot = document.createElement('span');
                      dot.className = 'mz-tour-dot';
                      dot.dataset.state =
                        i < absolute
                          ? 'done'
                          : i === absolute
                            ? 'current'
                            : 'future';
                      dot.setAttribute('aria-hidden', 'true');
                      return dot;
                    }),
                  );
                  popover.progress.setAttribute('aria-hidden', 'true');
                  // The popover is a dialog: named by its title, focusable so
                  // the step is announced, and Tab stays inside it.
                  const wrapper = popover.wrapper;
                  const titleId = `tour-title-${stop.id}`;
                  popover.title.id = titleId;
                  wrapper.setAttribute('role', 'dialog');
                  wrapper.setAttribute('aria-modal', 'true');
                  wrapper.setAttribute('aria-labelledby', titleId);
                  wrapper.tabIndex = -1;
                  // The close control is the tour's Skip; say so.
                  popover.closeButton.textContent = continueQuestion
                    ? t('notNow')
                    : t('skip');
                  popover.closeButton.setAttribute('aria-label', t('skip'));
                  window.requestAnimationFrame(() => {
                    (continueQuestion ? popover.nextButton : wrapper).focus();
                  });
                },
              },
            };
          });

          const instance = driver({
            animate: !prefersReducedMotion(),
            allowClose: true,
            overlayOpacity: 0.32,
            stagePadding: 6,
            stageRadius: 8,
            showProgress: true,
            popoverClass: 'mz-tour',
            steps,
            // Escape and an overlay click land here. driver does not call
            // this for its own `destroy()`, so `end` cannot re-enter.
            onDestroyStarted: () => end('skipped'),
            onHighlighted: (_el, _step, opts) => {
              const index = opts.index ?? 0;
              writeCursor({ screen: screen.id, stop: index });
              setRunning(true);
            },
          });
          driverRef.current = instance;
          instance.drive(Math.min(cursor.stop, stops.length - 1));
        })
        .catch(() => {
          // The screen never arrived. Say nothing on screen — the reviewer
          // is looking at whatever did load — and forget the tour.
          pendingRef.current = false;
          clearCursor();
          setRunning(false);
        });
    },
    [advanceScreen, end, perform, t],
  );

  /*
   * The one effect: whenever the address changes, decide whether a tour is
   * running here and, if so, from where.
   */
  useEffect(() => {
    if (!onTourRoute || tourParam === null) {
      if (driverRef.current) destroy();
      return;
    }
    if (driverRef.current || pendingRef.current) return;
    const cursor = readCursor() ?? {
      screen: screenForDemo(demoParam).id,
      stop: 0,
    };
    // A cursor pointing at a different demo than the address is stale — a
    // copied link, or a tab restored a week later. Start that screen over.
    const named = screenById(cursor.screen);
    const fresh: TourCursor =
      named && named.demo === demoParam
        ? cursor
        : { screen: screenForDemo(demoParam).id, stop: 0 };
    writeCursor(fresh);
    resume(fresh);
  }, [onTourRoute, tourParam, demoParam, destroy, resume]);

  useEffect(() => () => driverRef.current?.destroy(), []);

  const start = useCallback(() => {
    clearCursor();
    const home = TOUR_SCREENS[0]!;
    const cursor: TourCursor = { screen: home.id, stop: 0 };
    writeCursor(cursor);
    if (driverRef.current) destroy();
    // Already at the start address: a push to the same URL changes nothing
    // the effect can see, so drive directly.
    if (onTourRoute && tourParam === home.part && demoParam === home.demo) {
      resume(cursor);
      return;
    }
    router.push(href(home));
  }, [destroy, router, resume, onTourRoute, tourParam, demoParam]);

  return useMemo(() => ({ start, running }), [start, running]);
}

export type { TourScreenId };
