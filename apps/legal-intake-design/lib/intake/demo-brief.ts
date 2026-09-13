/**
 * Sample values covering all four field states, so the brief can be reviewed
 * before the conversation is wired up.
 *
 * Reached with `?demo=1` on the intake route, a documented query parameter
 * rather than a design flag buried in a list of twenty (Decision 28).
 *
 * `?demo=review` and `?demo=sent` were added in Wave 5 and land on the last two
 * phases with a finished brief. They exist because the surfaces built there,
 * the forced pass, the confirmation email, the notification and the post-submit
 * drop target, are all several minutes and four live model calls from the
 * opening screen. Something that costs that much to look at gets looked at
 * once, and a screen nobody reviews is a screen nobody designed.
 *
 * Every quote below is real text from `public/demo/northwind-acme-msa.pdf`, so
 * the demo shows the same thing a genuine verified extraction would, and
 * `demo-quotes.test.ts` holds that claim to the real verifier. The party names
 * are the document's too: NORTHWIND LOGISTICS LIMITED is the client and ACME
 * HOLDINGS LTD is the counterparty.
 */

import type { FieldUpdate } from './brief';
import type { SourcePassage } from './verify-source';

/**
 * The passage behind the demo's one document value (L3).
 *
 * Seeded rather than computed, because the demo never uploads a file: the real
 * passage is cut server-side from the PDF's text layer during extraction
 * (`locateQuote` in `verify-source.ts`), and there is no extraction on this
 * path. Without a seed, the one row in the flow that exists to prove a value
 * came from somewhere would look, in the demo, exactly as it did before the
 * feature.
 *
 * **These are not plausible-looking sentences, they are the document.** All
 * three slices are the verbatim output of running `locateQuote` against
 * `public/demo/northwind-acme-msa.pdf`, line breaks included — and
 * `demo-brief.test.ts` re-runs that against the real file and fails if this
 * drifts from it. A hand-written passage would have been the one place in the
 * whole flow where a "source" was invented, on the feature whose entire claim
 * is that sources are not.
 */
/**
 * The file the demo's document values were read from.
 *
 * Named here rather than spelled out in each `sourceNote`, because the viewer
 * finds a document by looking for a file name inside the note — which is the
 * format `/api/extract` writes ("vendor-agreement.pdf, clause 11.3") — and a
 * name that drifts from the file in `public/` would silently stop the demo's
 * source links opening anything.
 */
export const DEMO_DOCUMENT = {
  name: 'northwind-acme-msa.pdf',
  path: '/demo/northwind-acme-msa.pdf',
  mediaType: 'application/pdf',
} as const;

const DEMO_SERVICES_PASSAGE: SourcePassage = {
  before: 'SERVICES',
  match:
    '1.1 The Supplier shall provide warehousing, pick-and-pack and last-mile\ndistribution services (the "Services") to the Customer in accordance with\nthe service levels set out in Schedule 2.',
  after:
    '1.2 The Supplier shall perform the Services with reasonable care and skill and\nin accordance with good industry practice.',
};

export const DEMO_FIELD_UPDATES: FieldUpdate[] = [
  // Will be confirmed on arrival, so it lands in the `confirmed` state.
  {
    key: 'matter-type',
    value: 'Contract',
    source: 'client',
    confidence: 10,
  },
  // Verified document extraction: shows its source, with the quote on tap.
  {
    key: 'situation',
    value:
      'Review a master services agreement for warehousing and last-mile distribution, and advise on exiting it early.',
    source: 'document',
    // Read straight off clause 1.1, but the value is a sentence written from
    // the clause rather than the clause itself, so it is not a 10.
    confidence: 8,
    sourceNote: `${DEMO_DOCUMENT.name}, Services clause 1.1, page 1`,
    sourceQuote:
      'The Supplier shall provide warehousing, pick-and-pack and last-mile distribution services (the "Services") to the Customer',
    sourcePassage: DEMO_SERVICES_PASSAGE,
  },
  /*
   * Worked out from the conversation, so it has no source to show — and so it
   * is the one row in the demo that carries a reason instead (L4).
   *
   * This seed is the reason the demo is worth loading at all for that feature:
   * an inferred value is the only kind that gets a reason, and it is also the
   * only kind that is hard to produce on demand from a live conversation.
   * Leaving it off would mean the row the feature exists for looked, in a
   * demo, exactly like it did before.
   */
  {
    key: 'otherSide',
    value: 'Northwind Logistics Limited',
    source: 'inferred',
    // Low on purpose: this is the row the demo wants the eye to land on, and
    // it is also the row the client goes on to correct.
    confidence: 4,
    reasoning:
      'You mentioned the warehousing contract was with Northwind, so I have put them down as the other side.',
  },
  // `outcome` and `urgency` are left alone, so they stay missing.
];

/** The field confirmed as soon as the demo loads. */
export const DEMO_CONFIRMED_KEY = 'matter-type';

/**
 * A finished brief, for the two phases that need one.
 *
 * Every required field is filled and the optional one is not confirmed, which
 * is deliberate: an unconfirmed optional value is the only way a value the
 * client never agreed with can reach a sent case, so it is the state the
 * confirmation email's "not yet checked by you" marker exists for. Seeding it
 * means that marker is visible rather than theoretical.
 */
const DEMO_COMPLETE_UPDATES: FieldUpdate[] = [
  {
    key: 'matter-type',
    value: 'Contract',
    source: 'client',
    confidence: 10,
  },
  {
    key: 'situation',
    value:
      'Review a master services agreement for warehousing and last-mile distribution, and advise on exiting it early.',
    source: 'document',
    // Read straight off clause 1.1, but the value is a sentence written from
    // the clause rather than the clause itself, so it is not a 10.
    confidence: 8,
    sourceNote: `${DEMO_DOCUMENT.name}, Services clause 1.1, page 1`,
    sourceQuote:
      'The Supplier shall provide warehousing, pick-and-pack and last-mile distribution services (the "Services") to the Customer',
    sourcePassage: DEMO_SERVICES_PASSAGE,
  },
  {
    key: 'otherSide',
    value: 'Northwind Logistics Limited',
    source: 'document',
    // Named outright in the recital, so the quote plainly says it. That the
    // model picked the wrong one of the two parties is a different mistake,
    // and one a rating cannot catch — which is why the client is asked.
    confidence: 9,
    sourceNote: `${DEMO_DOCUMENT.name}, Parties clause, page 1`,
    /*
     * Verbatim from the recital, and it has to be.
     *
     * This used to read "Northwind Logistics Limited (company number
     * 09182736)", which appears nowhere in the PDF: the number was invented
     * and the phrasing was not the document's. Checked against
     * `verifySourceQuote` and it fails, which means the demo was showing a
     * state the real pipeline cannot produce, in the one feature whose whole
     * claim is that provenance is verified rather than asserted. A reviewer
     * comparing the quote to the file would have found it missing.
     *
     * `demo-quotes.test.ts` now runs both demo quotes through the real
     * verifier against the real PDF, so the next invented one fails the build.
     */
    sourceQuote:
      'NORTHWIND LOGISTICS LIMITED, a company incorporated in England and Wales with company number 09847213',
  },
  {
    key: 'outcome',
    value:
      'A short list of the clauses that actually matter, rather than a full review.',
    source: 'inferred',
    confidence: 6,
    // The second inferred row, and deliberately a reason of a different shape:
    // the one above names a thing the client said, this one names what they
    // ruled out. Both are arguable, which is the whole point of showing them.
    reasoning:
      'You said you did not want a full review, so I have narrowed it to the clauses that matter.',
  },
  {
    key: 'urgency',
    value: 'This week, the renewal date is close.',
    source: 'client',
    confidence: 10,
  },
];

/**
 * The correction that makes the "Worth knowing" block real.
 *
 * The document names the counterparty as Northwind Logistics Limited, which is
 * the client's own company: exactly the two-party confusion recorded against
 * T13a. A client fixing it is the normal case, and the disagreement it leaves
 * behind is a fact a lawyer wants, so the demo carries one rather than
 * pretending the model always gets the parties right.
 */
const DEMO_CORRECTION = {
  key: 'otherSide',
  // The actual counterparty on the seeded contract. It said "Acme Technologies
  // Inc." until wave 6, a company that appears nowhere in the PDF the rest of
  // this seed quotes, so a reviewer opening the file alongside `?demo=review`
  // found the brief naming a party the document had never heard of.
  value: 'Acme Holdings Ltd',
} as const;

/** What the recap call would have written for this brief. */
const DEMO_RECAP = {
  title: 'MSA review and early exit: Acme Holdings',
  description:
    'The client signed a master services agreement with Acme Holdings for warehousing and last-mile distribution, and wants to know what exiting it early would take after repeated service level failures. They want a practical read on the termination and notice provisions rather than a full review, and the renewal date is close.',
} as const;

export type DemoStage = 'intake' | 'review' | 'sent' | 'quoted';

export type DemoSeed = {
  updates: FieldUpdate[];
  /** Confirmed as it arrives, so the row lands in the confirmed state. */
  confirmKeys: string[];
  /** Confirmed with a different value, which is what records a disagreement. */
  corrections: { key: string; value: string }[];
  recap: { title: string; description: string } | null;
  stage: DemoStage;
  /** True where the brief is finished and every unsure value has been agreed. */
  confirmAll: boolean;
  /**
   * Which quote outcome to show, on the `quoted` stage only (G3, G2).
   *
   * `null` everywhere else. The quote is written by a person after submission,
   * so there is no run of this prototype in which one arrives — these two
   * screens exist to design the client's side of that moment, and a query
   * string is the honest way to reach a state the flow cannot otherwise
   * produce. It is the same device `?demo=review` and `?demo=sent` already use.
   */
  quote: 'quoted' | 'no-quote' | null;
};

/**
 * What `?demo=<value>` seeds, as data rather than as branches in the component.
 *
 * `?demo=1` is unchanged and still the default for anything unrecognised, so an
 * older link or a typo lands on the four field states rather than on nothing.
 */
export function demoSeed(param: string | null): DemoSeed | null {
  if (param === null) return null;

  /*
   * The two quote outcomes (G3, G2). Both sit on a finished, submitted brief,
   * because that is the only state a quote can arrive into — so they reuse the
   * completed seed and change only the stage and which outcome is shown.
   */
  if (param === 'quote' || param === 'noquote') {
    return {
      updates: DEMO_COMPLETE_UPDATES,
      confirmKeys: [],
      corrections: [DEMO_CORRECTION],
      recap: DEMO_RECAP,
      stage: 'quoted',
      confirmAll: true,
      quote: param === 'quote' ? 'quoted' : 'no-quote',
    };
  }

  /*
   * The confirmation with a gap in it, for the one thing that would help most
   * (item 7).
   *
   * A documented state rather than a test-only one, because otherwise the
   * feature cannot be reviewed: `?demo=sent` is a complete case with the
   * contract attached and the outcome given, so `oneMoreThing` correctly finds
   * nothing to ask for and correctly renders nothing. A reviewer clicking the
   * documented URLs would conclude the block was never built — which is the
   * failure `demo-session.ts` was written to stop happening for a different
   * reason.
   *
   * The gap is the optional field, left as a client would leave it: everything
   * else is the same finished case. It is `confirmAll`, so nothing on screen
   * suggests an unanswered question — the difference is a value the client
   * chose not to give, which is exactly the case the ask exists for.
   */
  if (param === 'sentgap') {
    return {
      updates: DEMO_COMPLETE_UPDATES.filter(
        (update) => update.key !== 'outcome',
      ),
      confirmKeys: [],
      corrections: [DEMO_CORRECTION],
      recap: DEMO_RECAP,
      stage: 'sent',
      confirmAll: true,
      quote: null,
    };
  }

  if (param === 'review' || param === 'sent') {
    return {
      updates: DEMO_COMPLETE_UPDATES,
      confirmKeys: [],
      corrections: [DEMO_CORRECTION],
      recap: DEMO_RECAP,
      stage: param,
      // Everything agreed: the review screen shows its clean case and the send
      // gate is open, which is the state both of these phases are about.
      confirmAll: true,
      quote: null,
    };
  }

  return {
    updates: DEMO_FIELD_UPDATES,
    confirmKeys: [DEMO_CONFIRMED_KEY],
    corrections: [],
    recap: null,
    stage: 'intake',
    confirmAll: false,
    quote: null,
  };
}
