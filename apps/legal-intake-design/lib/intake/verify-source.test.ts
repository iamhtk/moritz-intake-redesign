import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractText, getDocumentProxy } from 'unpdf';
import {
  MINIMUM_QUOTE_LENGTH,
  findSourceDocument,
  locateQuote,
  normalizeForMatch,
  verifySourceQuote,
} from './verify-source';

const CONTRACT = `Either party may terminate this Agreement for convenience by giving not less
than ninety (90) days written notice to the other party.`;

describe('normalizeForMatch', () => {
  it('turns ligatures back into plain letters', () => {
    expect(normalizeForMatch('notiﬁcation')).toBe('notification');
    expect(normalizeForMatch('the oﬃce')).toBe('the office');
  });

  it('rejoins a word broken across a line break', () => {
    expect(normalizeForMatch('termi-\nnation clause')).toBe(
      'termination clause',
    );
  });

  it('flattens curly quotes and dashes', () => {
    expect(normalizeForMatch('the “Customer’s” rights')).toBe(
      'the "customer\'s" rights',
    );
    expect(normalizeForMatch('30–60 days')).toBe('30-60 days');
  });

  it('collapses every kind of whitespace to single spaces', () => {
    expect(normalizeForMatch(' ninety (90)\n\tdays ')).toBe('ninety (90) days');
  });
});

describe('verifySourceQuote', () => {
  it('accepts a quote that is really there', () => {
    expect(verifySourceQuote('ninety (90) days written notice', CONTRACT)).toBe(
      true,
    );
  });

  it('accepts a quote that spans a line break in the document', () => {
    expect(verifySourceQuote('giving not less than ninety', CONTRACT)).toBe(
      true,
    );
  });

  it('accepts a quote whose punctuation drifted', () => {
    expect(verifySourceQuote('ninety 90 days, written notice', CONTRACT)).toBe(
      true,
    );
  });

  it('rejects a quote the model invented', () => {
    expect(verifySourceQuote('thirty (30) days written notice', CONTRACT)).toBe(
      false,
    );
    expect(verifySourceQuote('governed by the laws of Germany', CONTRACT)).toBe(
      false,
    );
  });

  it('rejects a quote too short to prove anything', () => {
    expect(verifySourceQuote('party', CONTRACT)).toBe(false);
    expect(verifySourceQuote('Agreement', CONTRACT)).toBe(false);
    // Long enough to be evidence, and present.
    expect('this Agreement'.length).toBeGreaterThanOrEqual(
      MINIMUM_QUOTE_LENGTH,
    );
    expect(verifySourceQuote('this Agreement', CONTRACT)).toBe(true);
  });

  it('rejects everything when there is no document text to check against', () => {
    expect(verifySourceQuote('ninety (90) days written notice', '')).toBe(
      false,
    );
    expect(verifySourceQuote('ninety (90) days written notice', ' ')).toBe(
      false,
    );
  });

  it('accepts two real clauses joined by an ellipsis', () => {
    const doc =
      'Clause 2.1 The term is twenty-four (24) months. Clause 9.1 Either party may terminate on ninety (90) days notice.';
    expect(
      verifySourceQuote(
        'The term is twenty-four (24) months... Either party may terminate on ninety (90) days notice',
        doc,
      ),
    ).toBe(true);
  });

  it('rejects a real clause stitched to an invented one', () => {
    const doc =
      'Clause 2.1 The term is twenty-four (24) months. Clause 9.1 Either party may terminate on ninety (90) days notice.';
    expect(
      verifySourceQuote(
        'The term is twenty-four (24) months... governed by the laws of Germany',
        doc,
      ),
    ).toBe(false);
  });

  it('survives junk input', () => {
    expect(verifySourceQuote(null as never, CONTRACT)).toBe(false);
    expect(verifySourceQuote('a quote', null as never)).toBe(false);
  });
});

describe('against the real seeded contract', () => {
  it('matches quotes taken from the PDF and rejects plausible inventions', async () => {
    const bytes = new Uint8Array(
      readFileSync('public/demo/northwind-acme-msa.pdf'),
    );
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });

    // Real phrases from the document.
    for (const quote of [
      'ACME HOLDINGS LTD, a company incorporated in England',
      'ninety (90) days written notice',
      'GBP 480,000 per annum exclusive of VAT',
      'minimum on-time delivery rate of 98.5%',
      'governed by the laws of England and Wales',
    ]) {
      expect(verifySourceQuote(quote, text), quote).toBe(true);
    }

    // Wrong in ways a model plausibly gets wrong: right shape, wrong facts.
    for (const quote of [
      'sixty (60) days written notice to terminate',
      'GBP 940,000 per annum exclusive of VAT',
      'ACME TRADING LTD, a company incorporated in Scotland',
      'governed by the laws of New York',
    ]) {
      expect(verifySourceQuote(quote, text), quote).toBe(false);
    }
  });
});

/**
 * Which file a value came from, once there can be more than one (multi-file
 * upload). The failure mode this guards is naming the wrong document, which is
 * worse than naming none: the client opens the order form looking for a clause
 * that lives in the MSA and concludes the brief is wrong about everything.
 */
describe('findSourceDocument', () => {
  const msa = {
    name: 'northwind-acme-msa.pdf',
    text: 'BETWEEN: (1) NORTHWIND LOGISTICS LIMITED ("the Supplier"); and (2) ACME HOLDINGS LTD ("the Customer"). 9.1 Either party may terminate for convenience by giving not less than 90 days written notice.',
  };
  const orderForm = {
    name: 'order-form.pdf',
    text: 'ORDER FORM. Annual charges: GBP 480,000 payable quarterly in advance. Exit assistance fee: GBP 25,000.',
  };
  const photo = { name: 'photo-of-letter.jpg', text: '' };

  it('names the document the quote is actually in', () => {
    expect(
      findSourceDocument('giving not less than 90 days written notice', [
        msa,
        orderForm,
      ])?.name,
    ).toBe('northwind-acme-msa.pdf');

    expect(
      findSourceDocument('Annual charges: GBP 480,000 payable quarterly', [
        msa,
        orderForm,
      ])?.name,
    ).toBe('order-form.pdf');
  });

  /*
   * The one that matters. Sourcing by position would name whichever file was
   * dropped first, and a client dragging a folder has no control over that
   * order at all.
   */
  it('is decided by content, not by the order files were attached in', () => {
    const quote = 'giving not less than 90 days written notice';
    expect(findSourceDocument(quote, [msa, orderForm])?.name).toBe(
      'northwind-acme-msa.pdf',
    );
    expect(findSourceDocument(quote, [orderForm, msa])?.name).toBe(
      'northwind-acme-msa.pdf',
    );
  });

  it('names nothing when the quote is in none of them', () => {
    expect(
      findSourceDocument('a clause nobody ever wrote', [msa, orderForm]),
    ).toBeNull();
  });

  // A fabricated quote must not be rescued by there being several documents.
  it('does not become easier to satisfy as documents are added', () => {
    const invented = 'the Supplier shall indemnify the Customer without limit';
    expect(findSourceDocument(invented, [msa])).toBeNull();
    expect(findSourceDocument(invented, [msa, orderForm, photo])).toBeNull();
  });

  /*
   * A photo has no text layer, so there is nothing to check a quote against and
   * nothing can be claimed about it. It must never be named as a source, not
   * even when it is the only attachment.
   */
  it('never names a document with no text layer', () => {
    expect(findSourceDocument('anything at all', [photo])).toBeNull();
    expect(
      findSourceDocument('Annual charges: GBP 480,000 payable quarterly', [
        photo,
        orderForm,
      ])?.name,
    ).toBe('order-form.pdf');
  });

  it('says nothing when nothing was attached', () => {
    expect(findSourceDocument('anything', [])).toBeNull();
  });

  // Near-duplicates are real (a renewal beside the original it renews). Either
  // name is true, so the earlier one is used rather than reporting both.
  it('takes the first of two documents that both contain the quote', () => {
    const copy = { name: 'msa-copy.pdf', text: msa.text };
    expect(findSourceDocument('ACME HOLDINGS LTD', [msa, copy])?.name).toBe(
      'northwind-acme-msa.pdf',
    );
    expect(findSourceDocument('ACME HOLDINGS LTD', [copy, msa])?.name).toBe(
      'msa-copy.pdf',
    );
  });
});

/**
 * L3: the quote, shown where it sits in the document.
 *
 * Every assertion here is about the slices being *verbatim* and the boundaries
 * being real. That is the whole claim of the feature: if the passage were
 * reconstructed, normalised or windowed by character count, it would be an
 * account of the document rather than the document, and the client could not
 * use it to check anything.
 */
describe('locating a quote in the document', () => {
  const AGREEMENT = [
    'This Agreement is made on 1 March 2026.',
    'The Supplier shall provide warehousing and last-mile distribution services to the Customer.',
    'Either party may terminate this Agreement on ninety days written notice.',
    'Notices shall be sent to the addresses set out in Schedule 2.',
  ].join(' ');

  it('returns the sentence the quote is in, and one either side', () => {
    const found = locateQuote(
      'terminate this Agreement on ninety days written notice',
      AGREEMENT,
    );
    expect(found?.match).toBe(
      'Either party may terminate this Agreement on ninety days written notice.',
    );
    expect(found?.before).toBe(
      'The Supplier shall provide warehousing and last-mile distribution services to the Customer.',
    );
    expect(found?.after).toBe(
      'Notices shall be sent to the addresses set out in Schedule 2.',
    );
  });

  /*
   * The slices are cut from the original, never rebuilt. Asserted by checking
   * the document literally contains each of them: a reconstructed passage would
   * pass a fuzzy comparison and fail this.
   */
  it('cuts all three slices verbatim out of the real text', () => {
    const found = locateQuote('ninety days written notice', AGREEMENT);
    expect(found).not.toBeNull();
    for (const slice of [found!.before, found!.match, found!.after]) {
      expect(AGREEMENT).toContain(slice);
    }
  });

  it('has nothing before the first sentence or after the last', () => {
    const opening = locateQuote('made on 1 March 2026', AGREEMENT);
    expect(opening?.before).toBe('');
    expect(opening?.match).toBe('This Agreement is made on 1 March 2026.');

    const closing = locateQuote('addresses set out in Schedule 2', AGREEMENT);
    expect(closing?.after).toBe('');
  });

  /*
   * The same normalisation the verifier uses. A quote the verifier accepted
   * must be locatable, or a row would show a source it then cannot display —
   * which is worse than showing no source at all.
   */
  it('finds a quote the PDF hyphenated across a line break', () => {
    const hyphenated =
      'Either party may termi-\nnate this Agreement on ninety days notice. Schedule 2 applies.';
    const found = locateQuote(
      'terminate this Agreement on ninety days',
      hyphenated,
    );
    expect(found?.match).toContain('termi-');
  });

  it('finds a quote whose curly quotes the model straightened', () => {
    const curly =
      'The parties agree the “Services” are those in Schedule 1. Nothing else applies.';
    const found = locateQuote('the "Services" are those in Schedule 1', curly);
    expect(found?.match).toBe(
      'The parties agree the “Services” are those in Schedule 1.',
    );
  });

  /*
   * Numbered clauses with no full stop between them. Contracts are mostly this
   * shape, which is why newlines are boundaries too — without that the whole
   * document would be one sentence and every passage would be the entire file.
   */
  it('treats a numbered clause on its own line as a sentence', () => {
    const clauses =
      '11.2 The Customer shall pay within thirty days\n11.3 Late payment bears interest at four per cent\n11.4 Set-off is not permitted';
    const found = locateQuote(
      'Late payment bears interest at four per cent',
      clauses,
    );
    expect(found?.match).toBe(
      '11.3 Late payment bears interest at four per cent',
    );
    expect(found?.before).toBe(
      '11.2 The Customer shall pay within thirty days',
    );
    expect(found?.after).toBe('11.4 Set-off is not permitted');
  });

  it('spans two sentences when the quote crosses a boundary', () => {
    const found = locateQuote(
      'services to the Customer. Either party may terminate',
      AGREEMENT,
    );
    expect(found?.match).toContain('services to the Customer.');
    expect(found?.match).toContain('Either party may terminate');
  });

  /*
   * The shortest run wins, so a quote inside one sentence does not return the
   * paragraph around it.
   */
  it('prefers the shortest run that contains the quote', () => {
    const found = locateQuote('ninety days written notice', AGREEMENT);
    expect(found?.match).toBe(
      'Either party may terminate this Agreement on ninety days written notice.',
    );
  });

  describe('the cases it refuses', () => {
    it.each([
      ['a quote that is not there', 'a clause about penguins', AGREEMENT],
      ['a quote under the minimum length', 'Ltd', AGREEMENT],
      ['an empty document', 'ninety days written notice', ''],
      [
        'a document with no text layer',
        'ninety days written notice',
        '   \n  ',
      ],
      ['an empty quote', '', AGREEMENT],
    ])('gives nothing back for %s', (_name, quote, text) => {
      expect(locateQuote(quote, text)).toBeNull();
    });
  });
});

/**
 * The invariant the implementation got wrong first time, against the real PDF.
 *
 * **Anything the verifier accepts, the locator must be able to find.** Break
 * that and you get the worst available outcome: `findSourceDocument` believes
 * the quote, so the row renders a source link, and the passage behind it is
 * empty — a control the client presses to be told nothing, on the one row that
 * exists to prove the value is real.
 *
 * It failed on a word the PDF had hyphenated across a line break. The verifier
 * normalises the whole document at once, so its rejoin rule fires; the locator
 * was joining independently-normalised sentences, and a newline is also a
 * sentence boundary, so the two halves of the word ended up in different
 * sentences where that rule could never run. The fix was to normalise a
 * contiguous slice of the original instead. This test is why that stays fixed.
 */
describe('the verifier and the locator agree', () => {
  it('locates every quote the verifier accepts, in the real contract', async () => {
    const bytes = new Uint8Array(
      readFileSync('public/demo/northwind-acme-msa.pdf'),
    );
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });

    const quotes = [
      'ACME HOLDINGS LTD, a company incorporated in England',
      'ninety (90) days written notice',
      'GBP 480,000 per annum exclusive of VAT',
      'minimum on-time delivery rate of 98.5%',
      'governed by the laws of England and Wales',
    ];

    const unlocatable: string[] = [];
    for (const quote of quotes) {
      expect(
        verifySourceQuote(quote, text),
        `verifier rejected: ${quote}`,
      ).toBe(true);
      const found = locateQuote(quote, text);
      if (found === null || found.match.trim() === '') unlocatable.push(quote);
    }
    expect(unlocatable).toEqual([]);
  });

  /*
   * The specific regression, kept as its own case so a failure names the cause
   * rather than just the symptom.
   */
  it('locates a quote the PDF broke across a line, like the verifier does', () => {
    const broken = 'The Supplier shall pay a termi-\nnation fee of GBP 20,000.';
    expect(verifySourceQuote('termination fee of GBP 20,000', broken)).toBe(
      true,
    );
    expect(locateQuote('termination fee of GBP 20,000', broken)).not.toBeNull();
  });
});

/**
 * V40: the flow never renders a client's document at full length.
 *
 * `MAX_RUN_SENTENCES` is most of the bound and it is not all of it. A
 * "sentence" here is whatever the boundary rule found, and a document with no
 * terminators and no clause numbers — a scanned page through OCR, a table
 * flattened into prose — puts the whole page into one. On that document
 * "three sentences" is the entire file, travelling over the wire in an
 * `/api/extract` response and rendering on a brief row.
 *
 * So the cap is in characters as well, and it is asserted here rather than
 * trusted, because this is a privacy bound and the failure is invisible on
 * every well-formed contract.
 */
const PLAIN_CONTRACT = [
  'This Agreement is made on 1 March 2026.',
  'Either party may terminate this Agreement on ninety days written notice.',
  'Notices shall be sent to the addresses set out in Schedule 2.',
].join(' ');

describe('the confidentiality bound on a passage', () => {
  /** One clause, no terminator, no numbering: a single 4,000-char "sentence". */
  const WALL = `The Supplier shall indemnify the Customer against ${'any and all losses howsoever arising '.repeat(
    100,
  )}and nothing else`;

  it('never returns a slice longer than the bound', () => {
    const found = locateQuote(
      'The Supplier shall indemnify the Customer',
      WALL,
    );
    expect(found).not.toBeNull();
    for (const slice of [found!.before, found!.match, found!.after]) {
      expect(slice.length).toBeLessThanOrEqual(601);
    }
  });

  /*
   * Marked, not silent. The client has to be able to tell they are reading an
   * extract; a passage that simply stops looks like a document that says less
   * than it does, which on a contract is the worse of the two errors.
   */
  it('says when it cut something', () => {
    const found = locateQuote(
      'The Supplier shall indemnify the Customer',
      WALL,
    );
    expect(found!.match).toContain('…');
  });

  /*
   * The quote has to survive the trim, or the panel shows context for something
   * the client cannot find in it. The match keeps its start, which is where the
   * quote was located.
   */
  it('keeps the quoted words themselves', () => {
    const found = locateQuote(
      'The Supplier shall indemnify the Customer',
      WALL,
    );
    expect(found!.match).toContain('The Supplier shall indemnify the Customer');
  });

  it('leaves an ordinary contract untouched', () => {
    const found = locateQuote('ninety days written notice', PLAIN_CONTRACT);
    for (const slice of [found!.before, found!.match, found!.after]) {
      expect(slice).not.toContain('…');
    }
  });

  /*
   * Cut on a word boundary. A bound that slices mid-word reads as a rendering
   * bug, and a rendering bug on the one panel whose job is to be trustworthy is
   * expensive out of all proportion to the fix.
   */
  it('cuts between words', () => {
    const found = locateQuote(
      'The Supplier shall indemnify the Customer',
      WALL,
    );
    /*
     * Checked against the source rather than against the string's own shape.
     * "ends in a word character" is not the test — cutting *at* a boundary
     * means the ellipsis follows a complete word, so it always does. What
     * matters is that the kept text is a prefix of the real document and that
     * the document carries on with a space, which is the definition of not
     * having sliced a word in half.
     */
    const kept = found!.match.replace(/…$/, '');
    expect(WALL.startsWith(kept)).toBe(true);
    expect(WALL[kept.length]).toBe(' ');
  });
});
