import { describe, expect, it } from 'vitest';
import { createBrief, confirmField, type Brief } from './brief';
import { confirmationEmail } from './confirmation-email';

function brief(): Brief {
  return createBrief('contract', [
    { key: 'matter-type', label: 'What you need', required: true },
    { key: 'other-side', label: 'Other side', required: true },
    { key: 'reference', label: 'Your reference', required: false },
  ]);
}

function filled(): Brief {
  let current = brief();
  current = confirmField(current, 'matter-type', 'Review an MSA');
  current = confirmField(current, 'other-side', 'Acme Technologies');
  return current;
}

const base = {
  reference: 'M-2026-0126',
  fallbackName: 'Contract review',
};

describe('confirmationEmail', () => {
  it('names the case from the recap', () => {
    const email = confirmationEmail({
      ...base,
      brief: { ...filled(), title: 'MSA early exit: Acme' },
    });
    expect(email.caseName).toBe('MSA early exit: Acme');
  });

  it('falls back when the recap never named it', () => {
    const email = confirmationEmail({ ...base, brief: filled() });
    expect(email.caseName).toBe('Contract review');
  });

  // A recap that returns a blank string is a failed recap wearing a value.
  it('falls back on a blank or whitespace title', () => {
    const email = confirmationEmail({
      ...base,
      brief: { ...filled(), title: '   ' },
    });
    expect(email.caseName).toBe('Contract review');
  });

  it('carries the reference through', () => {
    const email = confirmationEmail({ ...base, brief: filled() });
    expect(email.reference).toBe('M-2026-0126');
  });

  it('has no summary when the recap wrote no description', () => {
    expect(confirmationEmail({ ...base, brief: filled() }).summary).toBeNull();
  });

  it('carries the recap description as the summary', () => {
    const email = confirmationEmail({
      ...base,
      brief: { ...filled(), description: 'The client signed an MSA.' },
    });
    expect(email.summary).toBe('The client signed an MSA.');
  });

  // The email restates the case, so an empty row would be a claim about a
  // field nobody answered.
  it('lists only fields with a value, in brief order', () => {
    const email = confirmationEmail({ ...base, brief: filled() });
    expect(email.lines.map((line) => line.label)).toEqual([
      'What you need',
      'Other side',
    ]);
    expect(email.lines[0]?.value).toBe('Review an MSA');
  });

  it('marks every confirmed line as confirmed', () => {
    const email = confirmationEmail({ ...base, brief: filled() });
    expect(email.lines.every((line) => line.confirmed)).toBe(true);
  });

  /*
   * An optional field is the only way an unconfirmed value reaches a sent
   * brief: `canSubmit` gates on required fields alone. It still belongs in the
   * email (a lawyer would want it), but it must not be presented as something
   * the client checked, because it is the one line on the page that could be
   * the model's invention.
   */
  it('does not claim an unconfirmed optional value was checked', () => {
    const current = filled();
    const email = confirmationEmail({
      ...base,
      brief: {
        ...current,
        fields: current.fields.map((field) =>
          field.key === 'reference'
            ? { ...field, value: 'PO-4471', source: 'document' as const }
            : field,
        ),
      },
    });
    const line = email.lines.find((one) => one.label === 'Your reference');
    expect(line?.value).toBe('PO-4471');
    expect(line?.confirmed).toBe(false);
  });

  it('drops a field holding only whitespace', () => {
    const current = filled();
    const email = confirmationEmail({
      ...base,
      brief: {
        ...current,
        fields: current.fields.map((field) =>
          field.key === 'reference' ? { ...field, value: '  ' } : field,
        ),
      },
    });
    expect(email.lines).toHaveLength(2);
  });
});
