'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { SUBMITTED_CASE } from '@/lib/intake/submitted-case';
import {
  addSubmittedCaseTurns,
  useSubmissions,
} from '@/lib/mocks/submitted-cases';
import { recordPersonMessage } from '@/lib/mocks/person-messages';
import { generateId } from '@/lib/utils';
import { ANY_LAWYER } from './lawyer-picker';

/**
 * Sending a message to a human, in one place.
 *
 * There are two surfaces that do it now — the overlay that opens over whatever
 * the client was looking at, and `/client/talk` itself — and what happens to
 * the message is not a property of either of them. It is recorded for the Talk
 * screen to show back, and it is *also* put onto the sent case when there is
 * one, because a client who has submitted and then asks for a human is asking
 * about that matter and the lawyer picking it up reads the case rather than
 * this screen.
 *
 * That second half is the part worth centralising. When the overlay owned its
 * own copy of the logic, a message sent from the overlay would land on the Talk
 * screen and not on the case, and the difference would be invisible until a
 * lawyer failed to see it — the worst kind of divergence, because both screens
 * would look correct.
 */
export function useSendPersonMessage() {
  const t = useTranslations('intake.person');
  const submissions = useSubmissions();

  /*
   * Whether the client has actually sent a case. Read through the hook rather
   * than called in render, so a submission arriving in another tab is picked up
   * instead of the sender deciding off a stale read.
   */
  const hasCase = Boolean(submissions[SUBMITTED_CASE.id]);

  return useCallback(
    /**
     * @param text The client's own words. Trimmed here, so no caller has to.
     * @param lawyerId A roster id, or `ANY_LAWYER` / `undefined` for nobody in
     *   particular. Normalised rather than stored, so "anyone" is an absent
     *   field on the record instead of a sentinel every reader has to know.
     * @returns `false` when there was nothing to send.
     */
    (text: string, lawyerId?: string): boolean => {
      const trimmed = text.trim();
      if (trimmed === '') return false;

      const at = new Date().toISOString();
      const chosen = lawyerId && lawyerId !== ANY_LAWYER ? lawyerId : undefined;

      /*
       * Stamped with the case when there is one, which is what stops it being
       * picked up a second time by `carryPersonMessagesToCase` at a later
       * submission. The screen's own copy and the case's copy are one event.
       */
      recordPersonMessage({
        id: generateId(),
        text: trimmed,
        at,
        ...(chosen ? { lawyerId: chosen } : {}),
        ...(hasCase ? { caseId: SUBMITTED_CASE.id } : {}),
      });

      if (hasCase) {
        addSubmittedCaseTurns(SUBMITTED_CASE.id, [
          {
            role: 'client',
            text: trimmed,
            at,
            handoff: {
              ...(chosen ? { lawyerId: chosen } : {}),
              acknowledgement: t('acknowledgement'),
            },
          },
          { role: 'moritz', text: t('acknowledgement'), at },
        ]);
      }

      return true;
    },
    [hasCase, t],
  );
}
