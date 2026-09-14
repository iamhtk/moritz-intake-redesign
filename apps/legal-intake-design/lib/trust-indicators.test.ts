import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import {
  ALL_TRUST_INDICATORS,
  CERTIFICATIONS,
  TRUSTED_BY,
} from './trust-indicators';

/**
 * The audited claims, pinned.
 *
 * A trust indicator is the one kind of copy where being approximately right is
 * worse than saying nothing: "SOC 2" is a different claim from "SOC 2 Type 2",
 * and a tidy-up that rounds "200+" to "hundreds" has quietly replaced a
 * checkable fact with a boast. Nothing here can be verified against the live
 * site from a test, so what is asserted instead is that the specific,
 * falsifiable parts have not drifted.
 */
describe('the audited trust indicators', () => {
  it('all carry a source path on moritzlegal.com', () => {
    for (const indicator of ALL_TRUST_INDICATORS) {
      expect(indicator.text.trim(), indicator.text).not.toBe('');
      expect(indicator.source, indicator.text).toMatch(/^\//);
    }
  });

  // The number is the whole claim. Without it this is "trusted by teams".
  it('keeps the number in the scale claim', () => {
    expect(TRUSTED_BY.text).toContain('200+');
    expect(TRUSTED_BY.text).toContain('in-house legal');
  });

  /*
   * Type 2 is an audit over a period; Type 1 is a point in time. Dropping the
   * suffix understates a real certification, and adding one to a lesser audit
   * would be a lie, so the exact string is the thing worth guarding.
   */
  it('names the certifications exactly as they are certified', () => {
    const named = CERTIFICATIONS.map((one) => one.text);
    expect(named).toContain('SOC 2 Type 2');
    expect(named).toContain('ISO 27001');
    expect(CERTIFICATIONS.every((one) => one.source === '/security')).toBe(
      true,
    );
  });

  /*
   * The Fortune 500 case study is real, published, and about one client. On a
   * marketing page that is understood; shown to a client about to submit their
   * own matter it reads as a promise about theirs, so none of its numbers are
   * allowed into the in-product set.
   */
  it('carries no single-client outcome as if it were general', () => {
    const joined = ALL_TRUST_INDICATORS.map((one) => one.text).join(' ');
    for (const claim of ['77%', '$917K', '$213K', '13 days', '$2BN']) {
      expect(joined, claim).not.toContain(claim);
    }
  });

  /*
   * The regression this module exists for. `en.json` shipped a trust bar
   * claiming "500+ Matters handled" and a "4.9/5 Client rating"; neither number
   * is anywhere on the real site, and nothing rendered them, so two invented
   * statistics sat in the copy file waiting to be wired up.
   */
  it('has no invented statistics left in the copy file', () => {
    const copy = JSON.stringify(messages);
    for (const invented of ['4.9/5', '500+', 'Matters handled']) {
      expect(copy, invented).not.toContain(invented);
    }
  });
});
