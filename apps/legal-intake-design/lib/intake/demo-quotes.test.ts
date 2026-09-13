import { readFileSync } from 'node:fs';
import { extractText, getDocumentProxy } from 'unpdf';
import { describe, expect, it } from 'vitest';
import { DEMO_FIELD_UPDATES, demoSeed } from './demo-brief';
import { verifySourceQuote } from './verify-source';

/**
 * Every quote the demo shows is really in the seeded PDF.
 *
 * Found in the wave 6 cross-check. The completed seed carried
 * `sourceQuote: 'Northwind Logistics Limited (company number 09182736)'`. The
 * company number was invented (the document says 09847213) and the phrasing
 * was not the document's, so the quote appears nowhere in the file. Run
 * through the real verifier it fails, which means `?demo=review` was showing a
 * value with a source and a quotation that the actual pipeline would have
 * downgraded and hidden.
 *
 * That is worse than a typo. It is the one feature whose entire claim is that
 * provenance is verified in code rather than asserted by the model, being
 * demonstrated with an asserted quote, on the screen a reviewer is most likely
 * to open. The plan's own rule for the note applies to the demo too: do not
 * show a thing the code disproves.
 *
 * So the same function the route uses, against the same file the demo names.
 * No mock, because a mocked document text would let the next invented quote
 * through.
 */

const PDF = 'public/demo/northwind-acme-msa.pdf';

async function seededDocumentText(): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(readFileSync(PDF)));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/** Every `{ key, sourceQuote }` any `?demo=` value can put on screen. */
function quotedFields(): { where: string; key: string; quote: string }[] {
  const out: { where: string; key: string; quote: string }[] = [];
  const add = (where: string, updates: readonly unknown[]) => {
    for (const update of updates) {
      const { key, sourceQuote } = update as {
        key?: string;
        sourceQuote?: string | null;
      };
      if (typeof key === 'string' && typeof sourceQuote === 'string') {
        out.push({ where, key, quote: sourceQuote });
      }
    }
  };

  add('?demo=1', DEMO_FIELD_UPDATES);
  // `review` and `sent` share one set of updates, so either reaches it.
  add('?demo=review', demoSeed('review')?.updates ?? []);
  return out;
}

describe('the demo quotes', () => {
  it('there are some to check', () => {
    expect(quotedFields().length).toBeGreaterThan(1);
  });

  it('every one verifies against the seeded PDF', async () => {
    const text = await seededDocumentText();
    const fabricated = quotedFields()
      .filter(({ quote }) => !verifySourceQuote(quote, text))
      .map(({ where, key, quote }) => `${where} ${key}: "${quote}"`);

    expect(fabricated).toEqual([]);
  });

  it('names only parties the document actually names', async () => {
    /*
     * The other half of the same problem. The correction and the recap said
     * "Acme Technologies", and the seeded contract says ACME HOLDINGS LTD, so
     * a reviewer opening the file next to the brief found a counterparty the
     * document had never heard of.
     */
    const text = (await seededDocumentText()).toLowerCase();
    const seed = demoSeed('review');
    const named = [
      ...(seed?.corrections ?? []).map((one) => one.value),
      seed?.recap?.title ?? '',
    ].join(' ');

    // The distinctive word out of whatever the seed calls the counterparty.
    const company = named.match(/acme\s+(\w+)/i);
    expect(company).not.toBeNull();
    expect(text).toContain(`acme ${company![1]!.toLowerCase()}`);
  });
});
