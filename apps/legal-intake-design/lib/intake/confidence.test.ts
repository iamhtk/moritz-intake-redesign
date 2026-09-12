import { describe, expect, it } from 'vitest';
import { applyFieldUpdates, createBrief, type FieldUpdate } from './brief';
import {
  fieldConfidence,
  isAutoApprovable,
  levelFor,
  scoreFor,
} from './confidence';

const DEFS = [{ key: 'otherSide', label: 'Other side', required: true }];

function briefWith(update: Partial<FieldUpdate>) {
  return applyFieldUpdates(createBrief('contract', DEFS), [
    {
      key: 'otherSide',
      value: 'Acme Holdings Ltd',
      source: 'document',
      confidence: 'unsure',
      sourceNote: 'Parties clause, page 1',
      sourceQuote: 'ACME HOLDINGS LTD, a company incorporated in England',
      ...update,
    },
  ]);
}

const readingFor = (update: Partial<FieldUpdate>) =>
  fieldConfidence(briefWith(update).fields[0]!);

describe('scoring', () => {
  it('trusts the client above everything', () => {
    expect(scoreFor('client', 'unsure', false)).toBe(100);
  });

  it('ranks a checked document quote above a guess', () => {
    expect(scoreFor('document', 'sure', true)).toBeGreaterThan(
      scoreFor('inferred', 'sure', false),
    );
  });

  it('treats an unbacked document claim as a guess', () => {
    expect(scoreFor('document', 'unsure', false)).toBe(
      scoreFor('inferred', 'unsure', false),
    );
  });

  it('maps scores to levels at the documented boundaries', () => {
    expect(levelFor(80)).toBe('high');
    expect(levelFor(79)).toBe('medium');
    expect(levelFor(55)).toBe('medium');
    expect(levelFor(54)).toBe('low');
  });
});

describe('what gets accepted without asking', () => {
  it('accepts the client, and a verified document quote', () => {
    expect(isAutoApprovable('client', 'unsure', false)).toBe(true);
    expect(isAutoApprovable('document', 'sure', true)).toBe(true);
    expect(isAutoApprovable('document', 'unsure', true)).toBe(true);
  });

  it('accepts a confident inference, since the client can still edit it', () => {
    expect(isAutoApprovable('inferred', 'sure', false)).toBe(true);
  });

  it('stops on the one case worth stopping for', () => {
    // Worked out, and it says so itself. This is what the client should see.
    expect(isAutoApprovable('inferred', 'unsure', false)).toBe(false);
  });
});

describe('fieldConfidence', () => {
  it('has nothing to report for an empty field', () => {
    expect(
      fieldConfidence(createBrief('contract', DEFS).fields[0]!),
    ).toBeNull();
  });

  it('reads high for a value the client typed', () => {
    const reading = readingFor({ source: 'client', sourceQuote: null });
    expect(reading).toEqual({ level: 'high', score: 100 });
  });

  it('reads high for a verified quote it is sure about', () => {
    expect(readingFor({ confidence: 'sure' })?.level).toBe('high');
  });

  it('reads low for an unsure guess, which is the one that asks to be checked', () => {
    const reading = readingFor({
      source: 'inferred',
      confidence: 'unsure',
      sourceQuote: null,
      sourceNote: null,
    });
    expect(reading?.level).toBe('low');
  });
});
