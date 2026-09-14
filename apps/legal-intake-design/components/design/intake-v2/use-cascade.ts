'use client';

import { useEffect, useRef, useState } from 'react';
import type { BriefField } from '@/lib/intake/brief';

/**
 * How long a cascade's indices stay assigned.
 *
 * Has to outlast the longest delay in the sequence plus the arrival itself:
 * eight capped steps at 100ms plus a 260ms arrival is a little over a second.
 * Clearing early pulls the class off the last rows mid-flight.
 */
const HOLD_MS = 1400;

/** Below this it is not a cascade, it is one value arriving. */
const MINIMUM = 2;

/**
 * Which rows a single document just answered, and in what order to show them.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * #11 IS THE ARGUMENT OF THE WHOLE PRODUCT, MADE IN ONE GESTURE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * "Drop in your contract and we will read it" is the claim the intake is
 * built on, and the moment it either lands or does not is the moment four
 * rows of the brief fill in at once. Filling them *simultaneously* squanders
 * it: four values appearing in the same frame reads as a re-render, which is
 * a thing software does, not a thing a document did. Filling them in sequence
 * reads as reading — the eye follows the fill down the panel and the claim is
 * demonstrated rather than asserted.
 *
 * So the stagger is the whole feature, and it only applies when there is a
 * sequence to show. One value arriving on its own gets the plain arrival
 * (#7); two or more from a document get indices and go in order.
 *
 * **Document-sourced only.** A client typing an answer fills one row and
 * knows they did it; the cascade is for the values they did not know they had
 * given us. `source === 'document'` is exactly that set.
 *
 * The indices are *within the cascade*, not within the panel. A read that
 * fills rows 2, 5 and 9 should look like three things happening one after
 * another, not like rows of a longer sequence with two gaps and a pause in
 * the middle of it.
 *
 * Like `use-landed.ts`, the first observation is recorded and never animated:
 * a restored draft has a brief full of document-sourced values and none of
 * them arrived while anybody was watching.
 */
export function useCascade(fields: BriefField[]): Record<string, number> {
  const previous = useRef<Record<string, string | null> | null>(null);
  const [indices, setIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    const current: Record<string, string | null> = {};
    for (const field of fields) current[field.key] = field.value;

    const before = previous.current;
    previous.current = current;

    if (before === null) return;

    const landed = fields.filter(
      (field) =>
        field.source === 'document' &&
        field.value !== null &&
        before[field.key] !== field.value,
    );

    if (landed.length < MINIMUM) return;

    const next: Record<string, number> = {};
    landed.forEach((field, index) => {
      next[field.key] = index;
    });
    setIndices(next);

    const timer = window.setTimeout(() => setIndices({}), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [fields]);

  return indices;
}
