/**
 * What the confirmation email contains (Decision 22).
 *
 * The email is the substance of "what happens next", and it is the answer to
 * complaint one: people did not know they had submitted anything. A screen can
 * be closed and a tab can be lost; an email is the oldest reliable proof that
 * something happened, and it is the one artefact of this flow the client still
 * has tomorrow.
 *
 * The composition lives here rather than in the component for one reason: what
 * goes in it is a decision about the case, not about layout. Which fields the
 * firm is told about, what the email is called, and whether an unconfirmed
 * value can appear in a document the client will treat as a record, are all
 * things worth a test. The JSX is then only the arrangement of this.
 */

import type { Brief, BriefField } from './brief';

export type EmailLine = {
  label: string;
  value: string;
  /**
   * True where the client agreed to the value.
   *
   * Everything on a sent brief is confirmed by the time it gets here, because
   * `canSubmit` requires it of every required field. Optional fields are the
   * exception: one the client never touched can be filled and unconfirmed, and
   * the email says so rather than quoting it back as though it were checked.
   */
  confirmed: boolean;
};

export type ConfirmationEmail = {
  /** The case name, or the fallback when the recap call failed. */
  caseName: string;
  reference: string;
  /** The recap paragraph, if there is one. */
  summary: string | null;
  /**
   * The one observation, verbatim, or `null` (item 6).
   *
   * Carried into the email because "noted for the lawyer" has to be true
   * somewhere the lawyer will actually look, and the email is the copy of the
   * case that leaves the building. Verbatim rather than summarised: the client
   * was shown this exact sentence, and a record that rephrases it is a record
   * that can be argued with.
   */
  observation: string | null;
  /** Every field with a value, in brief order. */
  lines: EmailLine[];
};

export function confirmationEmail({
  brief,
  reference,
  fallbackName,
}: {
  brief: Brief;
  reference: string;
  /** Used when the recap never named the case. */
  fallbackName: string;
}): ConfirmationEmail {
  return {
    // A title of `''` is as useless as a missing one and is what a trimmed
    // model response can leave behind, so both fall through to the fallback.
    caseName: brief.title?.trim() ? brief.title.trim() : fallbackName,
    reference,
    summary: brief.description?.trim() ? brief.description.trim() : null,
    observation: brief.observation?.trim() ? brief.observation.trim() : null,
    lines: brief.fields.filter(hasValue).map((field) => ({
      label: field.label,
      value: field.value,
      confirmed: field.confirmed,
    })),
  };
}

function hasValue(field: BriefField): field is BriefField & { value: string } {
  return field.value !== null && field.value.trim() !== '';
}
