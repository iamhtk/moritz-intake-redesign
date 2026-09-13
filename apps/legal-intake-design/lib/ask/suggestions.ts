/**
 * Opening questions, built from the projection rather than from a list (N8).
 *
 * The distinction is small and it is the whole value. A static chip reading
 * *"What is the status of my case?"* is a guess that happens to be right most
 * of the time; offered to a lawyer with nothing assigned, or a client with no
 * cases at all, it is an invitation to watch the quiet state fire. A chip built
 * from the scope only appears when there is something for it to be about, so a
 * reader never presses one and gets told there is nothing.
 *
 * It also means the chips are honest about scale. *"Which cases are unquoted?"*
 * is offered to an admin **only if some are**, and carries the number, so the
 * chip itself is already part of the answer.
 *
 * §8.10 lists this as cuttable — "three static chips per role, nobody can tell
 * from one session". True, but it came in at well under the estimate because
 * the projection was already built and typed, so there was nothing to cut.
 */

import type { AskScope } from './scope';

/**
 * One suggestion. `text` is the question that will be sent verbatim, so it is
 * phrased as a reader would type it rather than as a heading.
 */
export type AskSuggestion = {
  id: string;
  text: string;
};

/** At most three. A fourth chip is a menu, and this is meant to be a nudge. */
const MAX_SUGGESTIONS = 3;

/**
 * Suggestions for a scope, most specific first.
 *
 * Returns `[]` when the projection holds nothing worth asking about — which is
 * the right answer and is §8.6 rule 4 applied to the empty state: nothing to
 * say, so say nothing. A row of chips over an empty transcript, each of which
 * leads to "there is nothing on your side about that", is worse than no chips.
 */
export function buildAskSuggestions(scope: AskScope): AskSuggestion[] {
  const suggestions: AskSuggestion[] = [];
  const push = (id: string, text: string) => {
    if (suggestions.length < MAX_SUGGESTIONS) suggestions.push({ id, text });
  };

  const cases = scope.cases;
  if (cases.length === 0 && scope.claimable.length === 0) {
    // No cases at all. Nothing case-shaped can be suggested without setting up
    // a dead end, so the panel opens with its empty state and no chips.
    return [];
  }

  switch (scope.role) {
    case 'NON_LEGAL': {
      /*
       * Named rather than counted where there is exactly one, because "my case"
       * is how someone with one matter thinks about it, and a chip saying
       * "all 1 of my cases" is a computer talking.
       */
      if (cases.length === 1) {
        push('status-one', `What is happening with ${cases[0]!.caseNumber}?`);
      } else {
        push('status-many', `Which of my ${cases.length} cases need me?`);
      }

      const waiting = cases.filter((c) => c.unreadCount > 0);
      if (waiting.length > 0) {
        push('unread', 'What have I not read yet?');
      }

      /*
       * Answered from `case.quoteAmount`, the figure on the client's own
       * screen. Worth saying plainly because this chip used to be grounded on
       * the QUOTE ROUNDS section, which held a lawyer's bid and Moritz's
       * internal benchmark rather than the client's price. `scope.ts` has the
       * detail; the chip is unchanged and now gets the right number.
       */
      const quoted = cases.filter((c) => c.quoteAmount !== null);
      if (quoted.length > 0) {
        push('quotes', 'What am I being charged for?');
      }

      /*
       * Last, so it only lands when one of the three above did not. "Who is
       * working on this" is the question a client asks once and then stops
       * asking, which is exactly the shape of a chip: useful on an empty
       * thread, not worth a permanent row.
       */
      const staffed = cases.filter((c) => c.assignedLawyer !== null);
      if (staffed.length > 0) {
        push('lawyer', 'Who is working on my case?');
      }
      break;
    }

    case 'LEGAL': {
      push('waiting', 'What is waiting on me?');

      if (scope.claimable.length > 0) {
        push('claimable', `What work could I take on?`);
      }

      const expiring = scope.quoteRounds.filter(
        (round) => round.yourQuoteStatus === 'NONE',
      );
      if (expiring.length > 0) {
        push('unquoted', 'Which quote rounds have I not answered?');
      }
      break;
    }

    case 'INTERNAL_ADMIN':
    case 'INTERNAL_ASSISTANT': {
      const unquoted = cases.filter((c) => c.quoteAmount === null);
      if (unquoted.length > 0) {
        push('unquoted', `Which of the ${unquoted.length} cases are unquoted?`);
      }

      const unassigned = cases.filter((c) => c.assignedLawyer === null);
      if (unassigned.length > 0) {
        push('unassigned', 'Which cases have no lawyer yet?');
      }

      push('busiest', 'Which lawyers are carrying the most work?');
      break;
    }
  }

  return suggestions;
}
