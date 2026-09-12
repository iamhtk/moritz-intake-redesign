import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractText, getDocumentProxy } from 'unpdf';
import {
  MINIMUM_QUOTE_LENGTH,
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
