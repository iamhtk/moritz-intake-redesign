/**
 * Every distinct wait in the intake, and what each one is called (E, D10).
 *
 * Written down as a list before the copy was, because the thing being fixed is
 * a counting failure rather than a wording one. The original product used one
 * vague indicator for ten different waits and four of them were invisible, and
 * the way that happens is not that somebody chose a bad label: it is that
 * nobody ever listed the waits, so a new call reached for the spinner that was
 * already there.
 *
 * A wait earns a line here when the work behind it is different work, not when
 * it happens somewhere else on screen. Reading three documents and reading one
 * is the same wait with a count in it. Writing the first reply and writing the
 * fourth are different: on the first there is no brief to place anything
 * against, so Moritz is reading what was said, and after it he is checking it
 * against what is already written down.
 *
 * `copy-key` is the key under `intake` that names it. The test beside this file
 * asserts every key resolves and that no two waits share a sentence, which is
 * the rule "no shared spinner, no reused label" written as something that
 * fails the build.
 */
export type Wait = {
  /** Stable id, for the test's failure messages. */
  id: string;
  /** The key under `intake` that holds the label. */
  copyKey: string;
  /** Where the client sees it, so a reviewer can go and look. */
  where: string;
};

export const INTAKE_WAITS: readonly Wait[] = [
  {
    id: 'first-turn',
    copyKey: 'chat.waitFirst',
    where: 'the first reply bubble, before there is a brief to check against',
  },
  {
    id: 'later-turn',
    copyKey: 'chat.waitReply',
    where: 'every reply bubble after the first',
  },
  {
    id: 'read-documents',
    copyKey: 'chat.waitDocuments',
    where: 'a Moritz bubble that waits while /api/extract reads the set',
  },
  {
    /*
     * The wait after the case has gone, which is different work from either of
     * the two above it and was previously borrowing the second one's sentence.
     *
     * "Checking that against the rest of your case" is true of a turn that has
     * a brief to check against. On a sealed case there is nothing to check and
     * nothing to write: Moritz is looking up an answer about a case that has
     * already left. Reusing the reply label there is the precise failure this
     * registry exists to make visible, and it had gone unnoticed because the
     * post-submit composer had no prompt of its own either.
     */
    id: 'waiting-turn',
    copyKey: 'chat.waitSent',
    where:
      'a Moritz bubble on the confirmation screen, answering about the sent case',
  },
  {
    id: 'recap',
    copyKey: 'brief.writingNotes',
    where: 'the brief heading, while /api/recap names the case',
  },
  {
    id: 'sending',
    copyKey: 'send.sending',
    where: 'the brief footer, in place of the button, while the case is sent',
  },
];
