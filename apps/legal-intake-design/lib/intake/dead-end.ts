/**
 * The turn that asked nothing, and what to do about it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE BUG THIS CLOSES, AS A CLIENT EXPERIENCES IT.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Client: "Cross river"
 * Moritz: "Got it, I've put Cross River Bank down as the other side."
 *
 * And then nothing. The brief still had two empty rows, the panel still said
 * "asking now" against one of them, and the conversation had stopped without
 * anybody saying it had. There is no error on screen, no retry to press, and
 * nothing to answer, so the client is left to guess whether it is their turn.
 * They will usually guess wrong and wait.
 *
 * It is the worst failure this flow has, because it is the only one that looks
 * like success. A `busy` failure says what happened and offers a button; this
 * says "Got it" and abandons them.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY IT IS NOT ONLY A PROMPT PROBLEM.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The prompt now states the rule outright (see `system-prompt.ts`, EVERY TURN
 * ENDS ON A QUESTION) and that is where the good version of this behaviour
 * comes from: a question the model wrote, about the row it chose, in the words
 * this client's case earned. This module is not trying to do that job better.
 *
 * It is here because a prompt rule is a tendency and the client is owed a
 * guarantee. "The conversation never stops while the brief has a gap in it" is
 * an invariant of the product, in the same family as "only the client can
 * confirm a value", and the flow already refuses to trust the prompt with
 * those: `applyFieldUpdates` drops a `confirmed` flag off the payload rather
 * than asking the model not to send one, and `WAITING_TURN_SCHEMA` removes
 * `fieldUpdates` rather than asking the model not to fill them in.
 *
 * So the repair is deliberately dull. It does not write a question, it looks
 * up the one the design team already wrote for that row in `matters/*.ts` and
 * appends it, which is the same copy the keyless interviewer uses and the same
 * copy the row's ready-made answers belong to. A dull question on the end of a
 * real reply is worth a great deal more than a clever one nobody asked, and it
 * is worth incomparably more than silence.
 */

import { applyFieldUpdates, missingRequiredKeys, type Brief } from './brief';
import { answersOf, askFor, matterOfBrief, nextGap } from './next-question';
import type { IntakeTurn } from './turn-schema';

/**
 * Whether the reply actually asks the client something.
 *
 * A question mark, anywhere in it. Crude on purpose, and the crudeness is the
 * point: anything cleverer (the last sentence, an interrogative opener, a
 * verb-first clause) is a guess about English that would eventually decide a
 * real question was not one and append a second question underneath it. Two
 * questions in a turn is a defect the prompt spends a paragraph avoiding, so
 * the test that triggers the repair has to be the one that cannot produce it.
 *
 * The false positives are harmless. A reply that quotes the client's own
 * question back, or explains what a term means and ends on "does that make
 * sense?", passes this test and is left alone, which is correct: both of those
 * hand the turn back to the client, which is the whole property being
 * defended.
 */
export function endsOnQuestion(reply: string): boolean {
  return reply.includes('?');
}

/**
 * The field the reply says it is asking about, if that is a thing it could be.
 *
 * Three ways it is not, and all three have been seen:
 *
 * - a key no brief row has, which highlights nothing and quietly disables the
 *   panel's "asking now" marker;
 * - a row that already has a value, which points the marker at a row the
 *   client has already dealt with;
 * - a row this very turn just filled in, which is the model narrating a value
 *   and claiming to be asking about it in the same breath.
 *
 * `after` rather than the brief as it arrived, so the third case is caught.
 */
function askedRow(turn: IntakeTurn, after: Brief) {
  if (turn.askingAbout === '') return undefined;
  const row = after.fields.find((field) => field.key === turn.askingAbout);
  return row && row.value === null ? row : undefined;
}

/**
 * The turn, made to hold its own contract.
 *
 * Runs on every intake turn, not only on broken ones, because two of the three
 * things it fixes are quiet rather than visible: an `askingAbout` pointing at a
 * filled row, and a `nothingRequiredMissing` that disagrees with the brief it
 * was computed from. Neither shows up as a failure, and both make the panel and
 * the prose say different things about the same case.
 *
 * Returns the same object's shape either way, so the route can apply it
 * unconditionally and nothing downstream needs to know whether a repair
 * happened. `changed` says whether one did, for the log.
 */
export function repairTurn(
  turn: IntakeTurn,
  brief: Brief,
): { turn: IntakeTurn; changed: string | null } {
  /*
   * The brief as it will stand once this turn's updates land, which is the
   * only state worth measuring against. Measured against the brief as it
   * arrived, a turn that filled the last required row would be told it still
   * had a gap and would have a question for that row appended to a reply that
   * had just answered it.
   *
   * `applyFieldUpdates` is pure, and the client runs it on the same inputs a
   * moment later (see `runTurn`), so the two cannot disagree.
   */
  const after = applyFieldUpdates(brief, turn.fieldUpdates);
  const row = askedRow(turn, after);

  const base: IntakeTurn = {
    ...turn,
    /*
     * The model's claim, replaced by the brief's own answer. Advisory either
     * way, `canSubmit` decides, but a value that can be computed exactly is
     * not worth carrying a guess for.
     */
    nothingRequiredMissing: missingRequiredKeys(after).length === 0,
    askingAbout: row?.key ?? '',
  };

  if (endsOnQuestion(turn.reply)) {
    return {
      turn: base,
      changed: base.askingAbout === turn.askingAbout ? null : 'askingAbout',
    };
  }

  /*
   * Nothing was asked, and whether that is a defect depends entirely on what
   * the client can do next.
   *
   * The line drawn here is the required set, not the whole brief. With a
   * required row still empty the client cannot send, so a reply that asks
   * nothing leaves them with no move at all: that is the dead end, and it gets
   * a question. With the required set complete they can send, the panel says
   * so, and the button is live, so a reply that stops is the correct turn and
   * appending an optional question to it would be the flow refusing to take
   * yes for an answer. The prompt's own rule, and `oneMoreThing` exists to ask
   * the one optional thing worth asking, once, after the case is safely in.
   */
  if (missingRequiredKeys(after).length === 0) {
    return {
      turn: { ...base, askingAbout: '' },
      /*
       * Cleared rather than left pointing at an empty optional row. The panel
       * renders `askingAbout` as "asking now", and marking a row that way
       * beside a reply that asked nothing is the contradiction the client saw
       * on screen in the first place.
       */
      changed: turn.askingAbout === '' ? null : 'askingAbout cleared',
    };
  }

  /*
   * The row the model said it was asking about, where that was a real empty
   * row, and the next gap otherwise. Preferring its own choice matters: it had
   * this client's case in front of it, and overriding a considered choice of
   * row with the first one in brief order would make the repair worse than
   * the thing it is repairing.
   */
  const target = row ?? nextGap(after);
  if (!target) return { turn: base, changed: null };

  /*
   * The answers this turn produced go in, so an authored prompt that leans on
   * an earlier answer reads correctly on the turn that filled it.
   */
  const authored = askFor(matterOfBrief(after), target, answersOf(after));

  return {
    turn: {
      ...base,
      reply: `${turn.reply.trim()} ${authored.ask}`.trim(),
      askingAbout: target.key,
      /*
       * The model's own options win when it wrote a usable row of them, even
       * though it wrote no question: it had this client's case in front of it
       * and the authored list did not. Below two, `parseOptions` has already
       * emptied the row, and the authored answers are better than none.
       */
      options: turn.options.length >= 2 ? turn.options : authored.options,
    },
    changed: `appended the ${target.key} question`,
  };
}
