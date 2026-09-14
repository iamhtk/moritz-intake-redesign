import type { Metadata } from 'next';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@repo/ui/components/field';

import { Checkbox } from '@/components/design/foundations/components/checkbox';
import {
  CheckboxTableExample,
  ControlledCheckboxExample,
} from '@/components/design/foundations/examples/checkbox-examples';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Checkbox · Foundations' };

export default function CheckboxFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Checkbox</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation checkbox, built on the shadcn Checkbox and shared{' '}
          <code>Field</code> primitives: checked, indeterminate, disabled, and
          invalid states, groups, and table row selection.
        </p>
      </header>

      <Section
        title="States"
        description="Unchecked, checked, and indeterminate (a dash, for a partial select-all)."
      >
        <div className="flex items-center gap-2">
          <Checkbox id="cb-unchecked" aria-label="Unchecked" />
          <FieldLabel htmlFor="cb-unchecked">Unchecked</FieldLabel>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="cb-checked" defaultChecked aria-label="Checked" />
          <FieldLabel htmlFor="cb-checked">Checked</FieldLabel>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cb-indeterminate"
            checked="indeterminate"
            aria-label="Indeterminate"
          />
          <FieldLabel htmlFor="cb-indeterminate">Indeterminate</FieldLabel>
        </div>
      </Section>

      <Section
        title="Disabled"
        description="Add disabled to prevent interaction — works for both the off and on states."
      >
        <div className="flex items-center gap-2">
          <Checkbox id="cb-disabled" disabled aria-label="Disabled (off)" />
          <FieldLabel htmlFor="cb-disabled">Disabled</FieldLabel>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cb-disabled-on"
            disabled
            defaultChecked
            aria-label="Disabled (on)"
          />
          <FieldLabel htmlFor="cb-disabled-on">Disabled, checked</FieldLabel>
        </div>
      </Section>

      <Section
        title="With description"
        description="Pair the checkbox with a label and helper text in a horizontal Field."
      >
        <Field orientation="horizontal" className="max-w-sm">
          <Checkbox id="cb-terms" defaultChecked />
          <FieldContent>
            <FieldLabel htmlFor="cb-terms">Email notifications</FieldLabel>
            <FieldDescription>
              Receive an email when a case is updated or assigned to you.
            </FieldDescription>
          </FieldContent>
        </Field>
      </Section>

      <Section
        title="Validation error"
        description="Mark the Field with data-invalid and the checkbox with aria-invalid for the error ring, then render the message with FieldError."
      >
        <Field
          orientation="horizontal"
          className="max-w-sm"
          data-invalid="true"
        >
          <Checkbox id="cb-invalid" aria-invalid />
          <FieldContent>
            <FieldLabel htmlFor="cb-invalid">
              Accept terms and conditions
            </FieldLabel>
            <FieldError>
              You must accept the terms and conditions to continue.
            </FieldError>
          </FieldContent>
        </Field>
      </Section>

      <Section
        title="Controlled"
        description="Drive the checkbox from React state with checked and onCheckedChange."
      >
        <ControlledCheckboxExample />
      </Section>

      <Section
        title="Group"
        description="Compose a checkbox list with FieldSet, FieldLegend, and FieldGroup."
      >
        <FieldSet className="max-w-sm">
          <FieldLegend variant="label">
            Show these items on the desktop
          </FieldLegend>
          <FieldDescription>
            Select the items you want to show on the desktop.
          </FieldDescription>
          <FieldGroup data-slot="checkbox-group">
            <div className="flex items-center gap-2">
              <Checkbox id="cb-grp-hard-disks" defaultChecked />
              <FieldLabel htmlFor="cb-grp-hard-disks">Hard disks</FieldLabel>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="cb-grp-external-disks" />
              <FieldLabel htmlFor="cb-grp-external-disks">
                External disks
              </FieldLabel>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="cb-grp-media" defaultChecked />
              <FieldLabel htmlFor="cb-grp-media">
                CDs, DVDs, and iPods
              </FieldLabel>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="cb-grp-servers" />
              <FieldLabel htmlFor="cb-grp-servers">
                Connected servers
              </FieldLabel>
            </div>
          </FieldGroup>
        </FieldSet>
      </Section>

      <Section
        title="Table"
        description="A row-selection table whose header select-all turns indeterminate when only some rows are checked."
      >
        <CheckboxTableExample />
      </Section>
    </>
  );
}
