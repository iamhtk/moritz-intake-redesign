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
  FieldTitle,
} from '@repo/ui/components/field';

import { Section } from '@/components/design/foundations/showcase/section';
import { Switch } from '@/components/design/foundations/components/switch';
import { ControlledSwitchExample } from '@/components/design/foundations/examples/switch-examples';

export const metadata: Metadata = { title: 'Switch · Foundations' };

export default function SwitchFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Switch</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation switch, built on the shadcn Switch and shared{' '}
          <code>Field</code> primitives: labels, descriptions, choice cards,
          groups, fieldsets, sizes, validation, and a mobile-first size scale.
        </p>
      </header>

      <Section
        title="Basic example"
        description="An unlabeled switch. Provide an aria-label for assistive technology."
      >
        <Switch aria-label="Toggle setting" />
      </Section>

      <Section
        title="With label"
        description="Pair the switch with a FieldLabel (wrapped in FieldContent) in a horizontal Field so only the text is clickable and the control sits at the end of the row."
      >
        <Field orientation="horizontal" className="max-w-sm">
          <FieldContent>
            <FieldLabel htmlFor="switch-label">Allow embedding</FieldLabel>
          </FieldContent>
          <Switch id="switch-label" />
        </Field>
      </Section>

      <Section
        title="With description"
        description="Wrap the label and a FieldDescription in FieldContent to add helper text beside the switch."
      >
        <Field orientation="horizontal" className="max-w-sm">
          <FieldContent>
            <FieldLabel htmlFor="switch-description">
              Allow embedding
            </FieldLabel>
            <FieldDescription>
              Allow others to embed your event details on their own site.
            </FieldDescription>
          </FieldContent>
          <Switch id="switch-description" defaultChecked />
        </Field>
      </Section>

      <Section
        title="Choice card"
        description="Wrap the whole Field in a FieldLabel to turn it into a clickable card that highlights when checked. The surface matches the foundation Card (rounded-2xl, border-field, shadow)."
      >
        {/*
          TODO(@repo/ui): the shared FieldLabel renders choice cards as
          `rounded-md` + a default `border` + no shadow. Align it with the
          foundation Card surface (rounded-2xl, border-field, shadow). Until
          then we override those surface tokens here so the choice card stays
          consistent with the new Card component.
        */}
        <FieldLabel
          htmlFor="switch-card"
          className="has-[>[data-slot=field]]:border-field max-w-sm has-[>[data-slot=field]]:rounded-2xl has-[>[data-slot=field]]:shadow"
        >
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Share across devices</FieldTitle>
              <FieldDescription>
                Focus is shared across devices, and turns off when you leave the
                app.
              </FieldDescription>
            </FieldContent>
            <Switch id="switch-card" defaultChecked />
          </Field>
        </FieldLabel>
      </Section>

      <Section
        title="Multiple switches"
        description="Stack related switches in a FieldGroup so they read as a single list."
      >
        <FieldGroup className="max-w-sm">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="switch-events">
                Show on events page
              </FieldLabel>
              <FieldDescription>
                Make this event visible on your profile.
              </FieldDescription>
            </FieldContent>
            <Switch id="switch-events" defaultChecked />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="switch-embed">Allow embedding</FieldLabel>
              <FieldDescription>
                Allow others to embed your event details on their own site.
              </FieldDescription>
            </FieldContent>
            <Switch id="switch-embed" />
          </Field>
        </FieldGroup>
      </Section>

      <Section
        title="With fieldset"
        description="Add a FieldLegend and description above a FieldGroup to give a set of switches a shared title."
      >
        <FieldSet className="max-w-sm">
          <FieldLegend>Discoverability</FieldLegend>
          <FieldDescription>
            Decide where your events can be found across the web.
          </FieldDescription>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="switch-fs-events">
                  Show on events page
                </FieldLabel>
                <FieldDescription>
                  Make this event visible on your profile.
                </FieldDescription>
              </FieldContent>
              <Switch id="switch-fs-events" defaultChecked />
            </Field>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="switch-fs-embed">
                  Allow embedding
                </FieldLabel>
                <FieldDescription>
                  Allow others to embed your event details on their own site.
                </FieldDescription>
              </FieldContent>
              <Switch id="switch-fs-embed" />
            </Field>
          </FieldGroup>
        </FieldSet>
      </Section>

      <Section
        title="Sizes"
        description="Use the size prop to render a denser switch (sm) alongside the default."
      >
        <div className="flex items-center gap-2">
          <Switch size="sm" defaultChecked aria-label="Small" />
          <span className="text-muted-foreground text-sm">Small</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch defaultChecked aria-label="Default" />
          <span className="text-muted-foreground text-sm">Default</span>
        </div>
      </Section>

      <Section
        title="Default on"
        description="Use defaultChecked to render the switch in its on state initially."
      >
        <Switch defaultChecked aria-label="Toggle setting" />
      </Section>

      <Section
        title="Disabled state"
        description="Add disabled to prevent interaction — works for both the off and on states."
      >
        <Switch disabled aria-label="Toggle setting (off)" />
        <Switch disabled defaultChecked aria-label="Toggle setting (on)" />
      </Section>

      <Section
        title="Validation error"
        description="Mark the Field with data-invalid and the switch with aria-invalid for the destructive ring and label, then render the message with FieldError."
      >
        <Field
          orientation="horizontal"
          className="max-w-sm"
          data-invalid="true"
        >
          <FieldContent>
            <FieldLabel htmlFor="switch-invalid">
              Accept terms and conditions
            </FieldLabel>
            <FieldError>
              You must accept the terms and conditions to continue.
            </FieldError>
          </FieldContent>
          <Switch id="switch-invalid" aria-invalid />
        </Field>
      </Section>

      <Section
        title="Controlled"
        description="Use the checked and onCheckedChange props to drive the switch from React state."
      >
        <ControlledSwitchExample />
      </Section>
    </>
  );
}
