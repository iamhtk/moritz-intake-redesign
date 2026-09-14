'use client';

import { toast } from 'sonner';
import { BriefFieldRow } from '@/components/design/intake-v2/brief-field-row';
import type { FieldReceipt } from '@/components/design/intake-v2/use-brief';
import {
  applyFieldUpdates,
  confirmField,
  createBrief,
  type BriefField,
} from '@/lib/intake/brief';

/**
 * The case brief's field row, in the states the confirm interaction moves
 * through. Here rather than in the intake because the panel can only ever show
 * one of them at a time, and the point of the layout is that they are all the
 * same height.
 *
 * Every fixture below is built by running a real `FieldUpdate` through
 * `applyFieldUpdates`, and confirmed through `confirmField`, so this page
 * cannot drift from what the brief actually produces — including the pinned
 * confidence score, which is why the reading stays put across all four states
 * of the document field. A quote verified but not located, rated 7 by the
 * model, reads 88%.
 */

const DEFS = [{ key: 'notice-period', label: 'Notice period', required: true }];
const KEY = 'notice-period';

/** Read from a document, quote verified. Asked about, because it is not theirs. */
const FROM_DOCUMENT = applyFieldUpdates(createBrief('contract', DEFS), [
  {
    key: KEY,
    value: '60 days',
    source: 'document',
    confidence: 7,
    sourceNote: 'vendor-agreement.pdf, page 6, clause 11.3',
    sourceQuote:
      'The Customer may terminate this Agreement on not less than sixty (60) days written notice',
  },
]);

const NEEDS_CHECK = FROM_DOCUMENT.fields[0] as BriefField;
const ACCEPTED = confirmField(FROM_DOCUMENT, KEY).fields[0] as BriefField;
const EDITED = confirmField(FROM_DOCUMENT, KEY, '90 days')
  .fields[0] as BriefField;

/** Said by the client, near-verbatim. The only thing that goes in unasked. */
const FROM_CLIENT = applyFieldUpdates(createBrief('contract', DEFS), [
  {
    key: KEY,
    value: '60 days',
    source: 'client',
    confidence: 10,
  },
]).fields[0] as BriefField;

/** 14:02 today, so the receipt reads the same on every render. */
const AT = new Date().setHours(14, 2, 0, 0);

const ACCEPTED_RECEIPT: FieldReceipt = {
  kind: 'accepted',
  at: AT,
  previous: NEEDS_CHECK,
};

const EDITED_RECEIPT: FieldReceipt = {
  kind: 'edited',
  at: AT,
  previous: NEEDS_CHECK,
};

function State({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-foreground text-sm font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{note}</p>
      </div>
      {/* The brief column's own width, so the row wraps where it really wraps. */}
      <div className="border-border max-w-[30rem] rounded-lg border border-dashed p-4">
        {children}
      </div>
    </section>
  );
}

export default function BriefFieldFoundationPage() {
  const noop = () => {};
  const openSource = () =>
    toast('The document viewer is not built yet', {
      description: 'vendor-agreement.pdf, page 6, clause 11.3',
    });

  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Case brief field</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          One field of the case brief. The value and its controls are a single
          flex row with a 30px minimum height, so accepting, editing or undoing
          a value never changes how tall the field is. What needs checking is
          decided by where the value came from, not by what it scored, and the
          score is pinned when the value arrives — so it reads the same in all
          four states below.
        </p>
      </header>

      <State
        title="Needs a check"
        note="Read from a document, quote verified, 78%. It still asks: a verified quote proves the words are in the file, not that they mean what the model took them to mean. Accept is the solid control, Edit the outline beside it, both on the value's line — and the source line opens the document."
      >
        <BriefFieldRow
          field={NEEDS_CHECK}
          onConfirm={noop}
          onEdit={noop}
          onUndo={noop}
          onOpenSource={openSource}
        />
      </State>

      <State
        title="Editing"
        note="A single-line input at the height of the text it replaced, focused with its value selected. Save and Cancel take the slots Accept and Edit were in. Enter saves, Escape cancels."
      >
        <BriefFieldRow
          field={NEEDS_CHECK}
          startEditing
          onConfirm={noop}
          onEdit={noop}
          onUndo={noop}
          onOpenSource={openSource}
        />
      </State>

      <State
        title="Checked"
        note="The receipt takes the same slot. Accepted, because the value was not changed — and still 78%, because agreeing with a value is not the model becoming more confident about it."
      >
        <BriefFieldRow
          field={ACCEPTED}
          receipt={ACCEPTED_RECEIPT}
          onConfirm={noop}
          onEdit={noop}
          onUndo={noop}
          onOpenSource={openSource}
        />
      </State>

      <State
        title="Checked, after an edit"
        note="Edited, so a lawyer can tell this apart from agreement. The brief stops claiming the document as the source, and the reading still does not move: an edit is a human override, not a 100%."
      >
        <BriefFieldRow
          field={EDITED}
          receipt={EDITED_RECEIPT}
          onConfirm={noop}
          onEdit={noop}
          onUndo={noop}
          onOpenSource={openSource}
        />
      </State>

      <State
        title="Settled"
        note="The client's own words, in on arrival with nothing to agree with. Edit drops its label and its outline but keeps the pencil, at the size it has on the rows above, so the least important control on a finished brief is not the loudest thing on the panel."
      >
        <BriefFieldRow
          field={FROM_CLIENT}
          onConfirm={noop}
          onEdit={noop}
          onUndo={noop}
          onOpenSource={openSource}
        />
      </State>
    </>
  );
}
