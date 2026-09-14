'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MatterId } from '@/components/design/new-case/intake-types';

/**
 * What was asked for when the exit was reached for.
 *
 * Two fields and they answer two different questions. `matterId` is what the
 * brief had worked out, and it only ever *marks* a fitting lawyer. `lawyerId`
 * is a decision the client already made by pressing a control with somebody's
 * name on it, and it is the one that removes the choice from the overlay.
 */
export type TalkRequest = {
  matterId?: MatterId;
  /**
   * A locked recipient. Set only when the client pressed a named control — *Ask
   * Priya* — in which case offering a roster to choose from would be asking
   * them to make the same decision twice, and the second answer could
   * contradict the first.
   */
  lawyerId?: string;
};

type TalkOverlayContextValue = {
  /** The open request, or `null` when the overlay is shut. */
  request: TalkRequest | null;
  openTalk: (request?: TalkRequest) => void;
  closeTalk: () => void;
};

const TalkOverlayContext = createContext<TalkOverlayContextValue | null>(null);

/**
 * Open/closed state for *Talk to a person*, lifted out of the overlay.
 *
 * The same split as `CommandPaletteProvider` / `CommandPalette`, and for the
 * same reason: the state has to be readable from anywhere a face or a composer
 * appears, while the dialog itself has to be mounted once, inside
 * `NavigationGuardProvider`, because sending navigates.
 *
 * Why this exists at all: the exit used to navigate on the *first* click, so
 * pressing *Talk to a person* took the screen away before the client had
 * written anything. Half of them are reaching for it to ask one question and
 * carry on; a page change is a bigger commitment than the question. So the
 * first click opens over whatever they were looking at, and the page change
 * happens on send — at which point there is something to show on the other end.
 */
export function TalkOverlayProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<TalkRequest | null>(null);

  const openTalk = useCallback((next?: TalkRequest) => {
    setRequest(next ?? {});
  }, []);
  const closeTalk = useCallback(() => setRequest(null), []);

  const value = useMemo<TalkOverlayContextValue>(
    () => ({ request, openTalk, closeTalk }),
    [request, openTalk, closeTalk],
  );

  return (
    <TalkOverlayContext.Provider value={value}>
      {children}
    </TalkOverlayContext.Provider>
  );
}

/**
 * Read the overlay, or `null` when no provider is mounted.
 *
 * Nullable rather than throwing, unlike `useCommandPalette`. The trigger is
 * rendered inside the intake, on the confirmation, and in the foundations
 * gallery, and the gallery has no dashboard shell around it — so a throw would
 * turn a documentation page into a crash. The trigger falls back to navigating
 * straight to `/client/talk`, which is where the overlay would have sent them.
 */
export function useTalkOverlay(): TalkOverlayContextValue | null {
  return useContext(TalkOverlayContext);
}
