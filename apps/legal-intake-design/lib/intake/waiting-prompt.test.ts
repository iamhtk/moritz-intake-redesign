import { describe, expect, it } from 'vitest';
import { WAITING_SYSTEM_PROMPT } from './waiting-prompt';
import { WAITING_TURN_SCHEMA } from './turn-schema';
import { INTAKE_SYSTEM_PROMPT } from './system-prompt';
import { NO_DASH_RULE } from './text';

/**
 * The refusals, as something that fails the build.
 *
 * This file exists because its absence was a lie. `waiting-prompt.ts` carried
 * the sentence "`waiting-prompt.test.ts` pins both refusals" in its own header
 * and no such file was ever written, so the two things this prompt most needs
 * to never do were protected by a comment claiming they were protected. A
 * client with nothing to do but wait is the likeliest person in the whole flow
 * to ask what it will cost and whether they have a case, and a prompt is a
 * string: the only thing standing between a tightened edit and a chatbot
 * pricing legal work is a test that reads it.
 *
 * These are assertions about the prompt's text rather than about a model's
 * behaviour, and the distinction is worth being honest about. A test here
 * cannot prove Moritz refuses; `end-to-end.live.test.ts` is where the live API
 * is actually asked. What it can prove is that the instruction is still in the
 * prompt, which is the failure mode a refactor produces.
 */
describe('the waiting prompt', () => {
  it('refuses to price the work, in every form the question takes', () => {
    // Not a figure, not a range, not a reassurance about the range. The last
    // of those is the one a well-meaning edit adds back.
    expect(WAITING_SYSTEM_PROMPT).toContain(
      'Never quote, estimate, hint at, or comment on a price',
    );
    expect(WAITING_SYSTEM_PROMPT).toContain('A person writes the quote');
  });

  it('refuses to give legal advice or assess the matter', () => {
    expect(WAITING_SYSTEM_PROMPT).toContain('Never give legal advice');
    expect(WAITING_SYSTEM_PROMPT).toContain('You collected the matter');
  });

  it('refuses to name a lawyer or promise one is next', () => {
    /*
     * The commercial order is the thing most easily got wrong in a friendly
     * sentence: the quote is next, not a person. Every surface says so, and
     * this is the surface where it would be easiest to be warm and wrong.
     */
    expect(WAITING_SYSTEM_PROMPT).toContain(
      'Never name the lawyer who will take the case',
    );
    expect(WAITING_SYSTEM_PROMPT).toContain(
      'Never promise a lawyer will be in touch next',
    );
    expect(WAITING_SYSTEM_PROMPT).toContain(
      'Nobody is assigned to the case until the quote is accepted',
    );
  });

  it('refuses to narrate work it cannot see, or to time it', () => {
    // The reference product's unresolving "Uploading" is the failure this is
    // written against: a product narrating work nobody is watching.
    expect(WAITING_SYSTEM_PROMPT).toContain(
      'Never claim to know something has happened',
    );
    expect(WAITING_SYSTEM_PROMPT).toContain('you must not narrate it');
    expect(WAITING_SYSTEM_PROMPT).toContain(
      "Never say how long the lawyer's review or the delivery will take",
    );
    expect(WAITING_SYSTEM_PROMPT).toContain('must not be given one');
  });

  it('agrees with the rail about when the drafting happens', () => {
    /*
     * The contradiction this closes was between two surfaces rather than inside
     * one. `case-stages.ts` puts drafting alongside the pricing row, following
     * Garzai's "the drafting agent starts on the first draft straight away";
     * the prompt put it after acceptance, following the brief's numbered list.
     * Asked how long things take, Moritz said "once you accept, work starts" on
     * a screen whose rail said a draft already existed.
     *
     * Both halves are asserted: that the prompt says drafting is under way now,
     * and that it does not put it after the quote.
     */
    expect(WAITING_SYSTEM_PROMPT).toContain('Already under way');
    expect(WAITING_SYSTEM_PROMPT).toContain('It started');
    expect(WAITING_SYSTEM_PROMPT).toContain('twenty to fifty minutes');

    const afterAcceptance = WAITING_SYSTEM_PROMPT.slice(
      WAITING_SYSTEM_PROMPT.indexOf('After the quote is accepted'),
    );
    expect(afterAcceptance).toContain('A lawyer is assigned');
    // The thing that must no longer be in that section.
    expect(afterAcceptance).not.toContain('A first draft is produced');
  });

  it('closes the fact list and says what to do past the end of it', () => {
    /*
     * The structural half of the same problem. A concierge asked open questions
     * about a law firm is a generator of plausible firm facts unless the list
     * is finite and the prompt is told what to do when a question falls
     * outside it.
     */
    expect(WAITING_SYSTEM_PROMPT).toContain(
      'THE LIST ABOVE IS THE END OF WHAT YOU KNOW',
    );
    expect(WAITING_SYSTEM_PROMPT).toContain('say you do not know it');
    expect(WAITING_SYSTEM_PROMPT).toContain('Do not fill the gap');
  });

  it('tells the model the brief is sealed and collects nothing', () => {
    // The defect this prompt was written for: an interviewer still trying to
    // ask about a notice period on a case that had already left the building.
    /*
     * Matched without crossing a line break. The prompt is a hard-wrapped
     * template literal, so any phrase long enough to be unambiguous is also
     * long enough to straddle a newline and fail on a wrap that changed
     * nothing. Short, distinctive fragments are the right unit here.
     */
    expect(WAITING_SYSTEM_PROMPT).toContain('collecting anything');
    expect(WAITING_SYSTEM_PROMPT).toContain(
      'Never invite the client to change',
    );
  });

  it('names no property the waiting schema does not have', () => {
    /*
     * The leak, as a test. This prompt used to brief the model on the intake's
     * other properties — none of which are in `WAITING_TURN_SCHEMA` — and a
     * live run answered a client with a reply ending "(reply only)".
     *
     * Asserted against the schema rather than against a hard-coded list, so a
     * property added to the waiting turn later is allowed to be described and
     * one removed from it cannot linger in the prose.
     */
    const allowed = new Set(Object.keys(WAITING_TURN_SCHEMA.properties));
    const intakeOnly = [
      'fieldUpdates',
      'askingAbout',
      'observation',
      'nothingRequiredMissing',
    ];
    for (const property of intakeOnly) {
      if (allowed.has(property)) continue;
      expect(WAITING_SYSTEM_PROMPT).not.toContain(property);
    }
  });

  it('forbids annotating the reply, which is how the leak read', () => {
    expect(WAITING_SYSTEM_PROMPT).toContain('do not add a note in brackets');
  });

  it('answers the three questions the confirmation offers as taps', () => {
    /*
     * `waiting-questions.ts` puts three questions in the client's mouth. Each
     * has to be answerable from the closed fact list, or the flow is baiting
     * somebody into being told no. Checked as the facts rather than as the
     * phrasing: the chips can be reworded, the facts behind them cannot go
     * missing.
     */
    // How long does this take.
    expect(WAITING_SYSTEM_PROMPT).toContain('within four hours');
    // What will the quote cover.
    expect(WAITING_SYSTEM_PROMPT).toContain('Nothing is charged until');
    // Can I still send a document.
    expect(WAITING_SYSTEM_PROMPT).toContain(
      'A document dropped anywhere on this page still reaches the team',
    );
  });

  it('carries the same typographic rule as the intake', () => {
    expect(WAITING_SYSTEM_PROMPT).toContain(NO_DASH_RULE);
  });

  it('is a separate prompt from the intake, not a variant of it', () => {
    /*
     * Two prompts rather than one with a mode paragraph, for the cache: the
     * intake prompt is sent byte-identically every turn and carries the
     * breakpoint, so splicing a phase sentence into it would throw away the
     * session's cached tokens at the exact moment the client crosses into
     * `sent`. If these two ever start sharing a prefix, that saving is gone
     * and nothing else would notice.
     */
    expect(WAITING_SYSTEM_PROMPT).not.toBe(INTAKE_SYSTEM_PROMPT);
    expect(WAITING_SYSTEM_PROMPT.slice(0, 200)).not.toBe(
      INTAKE_SYSTEM_PROMPT.slice(0, 200),
    );
  });

  it('does not itself contain the dash it forbids', () => {
    // The rule is about the model's output, and a prompt that breaks its own
    // rule is the worst available example to set.
    const body = WAITING_SYSTEM_PROMPT.replace(NO_DASH_RULE, '');
    expect(body).not.toContain('—');
  });
});
