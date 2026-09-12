import { describe, expect, it } from 'vitest';
import { stripDashes } from './text';

describe('stripDashes', () => {
  it('replaces an em dash with a comma', () => {
    expect(stripDashes('Got it — a contract matter.')).toBe(
      'Got it, a contract matter.',
    );
  });

  it('handles en dashes and double hyphens too', () => {
    expect(stripDashes('30 – 60 days')).toBe('30, 60 days');
    expect(stripDashes('Contract review -- Acme')).toBe(
      'Contract review, Acme',
    );
  });

  it('does not leave doubled punctuation behind', () => {
    expect(stripDashes('the term — , twelve months')).toBe(
      'the term, twelve months',
    );
    expect(stripDashes('Acme Ltd —. Next')).toBe('Acme Ltd. Next');
  });

  it('collapses the double spaces it can create', () => {
    expect(stripDashes('a  b   c')).toBe('a b c');
  });

  it('leaves ordinary hyphens alone', () => {
    expect(stripDashes('pick-and-pack last-mile services')).toBe(
      'pick-and-pack last-mile services',
    );
    expect(stripDashes('twenty-four (24) months')).toBe(
      'twenty-four (24) months',
    );
  });

  it('leaves clean text untouched', () => {
    expect(stripDashes('Who is on the other side?')).toBe(
      'Who is on the other side?',
    );
  });
});
