import type { Metadata } from 'next';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@repo/ui/components/field';

import { Button } from '@/components/design/foundations/components/button';
import { Section } from '@/components/design/foundations/showcase/section';
import { Textarea } from '@/components/design/foundations/components/textarea';
import { ControlledExample } from '@/components/design/foundations/examples/textarea-examples';

export const metadata: Metadata = { title: 'Textareas · Foundations' };

export default function TextareasFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Text Area</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation textarea, built on the shadcn Textarea and shared{' '}
          <code>Field</code> primitives: labels, descriptions, validation,
          auto-resize, and a mobile-first size scale.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Use the Textarea on its own to render a standalone textarea — provide an aria-label for assistive technology."
      >
        <div className="w-full max-w-sm">
          <Textarea aria-label="Description" placeholder="Description" />
        </div>
      </Section>

      <Section
        title="With label"
        description="Wrap a label and textarea in a Field to associate them with a generated id."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="label-description">Description</FieldLabel>
          <Textarea id="label-description" />
        </Field>
      </Section>

      <Section
        title="With description"
        description="Use FieldDescription to add a helper description above or below the textarea."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="desc-description">Description</FieldLabel>
          <FieldDescription>
            This will be shown under the product title.
          </FieldDescription>
          <Textarea id="desc-description" />
        </Field>
      </Section>

      <Section
        title="Disabled state"
        description="Add data-disabled to the Field and disabled to the textarea to disable it and dim its label."
      >
        <Field className="max-w-sm" data-disabled="true">
          <FieldLabel htmlFor="disabled-description">Description</FieldLabel>
          <Textarea id="disabled-description" disabled />
        </Field>
      </Section>

      <Section
        title="Validation errors"
        description="Mark the field with aria-invalid for the destructive border and render the message with FieldError."
      >
        <Field className="max-w-sm" data-invalid="true">
          <FieldLabel htmlFor="invalid-description">Description</FieldLabel>
          <Textarea id="invalid-description" aria-invalid />
          <FieldError>This field is required.</FieldError>
        </Field>
      </Section>

      <Section
        title="With custom layout"
        description="Place the label and description in their own column beside the textarea with a grid layout."
      >
        <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <FieldLabel htmlFor="custom-description">Description</FieldLabel>
            <FieldDescription className="mt-1">
              This will be shown under the product title.
            </FieldDescription>
          </div>
          <div className="sm:col-span-7">
            <Textarea id="custom-description" rows={3} />
          </div>
        </div>
      </Section>

      <Section
        title="Controlled component"
        description="Use the value and onChange props to drive the textarea from React state."
      >
        <ControlledExample />
      </Section>

      <Section
        title="Read-only"
        description="A read-only textarea keeps its value but cannot be edited."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="readonly-terms">Terms</FieldLabel>
          <Textarea
            id="readonly-terms"
            readOnly
            defaultValue="These terms are provided for your records and cannot be edited here."
          />
        </Field>
      </Section>

      <Section
        title="Required"
        description="Mark required textareas with the required attribute and an asterisk."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="required-feedback">
            Feedback <span className="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            id="required-feedback"
            placeholder="Share your feedback"
            required
          />
          <FieldDescription>This field must be filled out.</FieldDescription>
        </Field>
      </Section>

      <Section
        title="Auto-resize"
        description="field-sizing-content grows the textarea with its content as you type."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="autosize-message">Message</FieldLabel>
          <Textarea
            id="autosize-message"
            defaultValue={
              'This textarea grows as you type.\nAdd more lines and watch it expand to fit the content.'
            }
          />
          <FieldDescription>
            Start typing — the field expands to fit.
          </FieldDescription>
        </Field>
      </Section>

      <Section
        title="Resizable"
        description="Textareas can be dragged taller by default (resize-y); pass [&_textarea]:resize-none to lock the size."
      >
        <div className="grid w-full max-w-sm gap-4">
          <Field>
            <FieldLabel htmlFor="resizable-on">Resizable (default)</FieldLabel>
            <Textarea
              id="resizable-on"
              placeholder="Drag the bottom-right corner."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="resizable-off">Not resizable</FieldLabel>
            <Textarea
              id="resizable-off"
              placeholder="Fixed size."
              className="[&_textarea]:resize-none"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Form"
        description="A composed form with a textarea and actions using the foundation Button."
      >
        <form className="w-full max-w-sm">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="form-message">Message</FieldLabel>
              <Textarea
                id="form-message"
                placeholder="Type your message here."
              />
              <FieldDescription>
                We&apos;ll get back to you within two business days.
              </FieldDescription>
            </Field>
            <Field orientation="horizontal" className="justify-end">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </Field>
          </FieldGroup>
        </form>
      </Section>
    </>
  );
}
