'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { useTour, type TourControls } from './use-tour';

/**
 * The tour's engine, mounted once for the shell.
 *
 * The button in the top nav and the popovers on the page are two components
 * with one state between them, and the state has to outlive both: the tour
 * navigates, and a driver owned by the page it started on would die with it.
 * So the engine lives at the shell, like `AskProvider`, and the button asks
 * it to start.
 *
 * `useTourControls` throws outside the provider rather than returning a
 * no-op. A Tour button that renders and does nothing is precisely the defect
 * `lib/tour/availability.ts` is written to prevent, and a thrown render is a
 * louder failure than an inert control.
 */
const TourContext = createContext<TourControls | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const controls = useTour();
  return (
    <TourContext.Provider value={controls}>{children}</TourContext.Provider>
  );
}

export function useTourControls(): TourControls {
  const controls = useContext(TourContext);
  if (!controls) {
    throw new Error('useTourControls must be used inside <TourProvider>');
  }
  return controls;
}
