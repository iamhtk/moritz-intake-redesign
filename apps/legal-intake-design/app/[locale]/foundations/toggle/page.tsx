import {
  AlignLeft,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from '@repo/ui/icons';

import { Section } from '@/components/design/foundations/showcase/section';
import { Toggle } from '@/components/design/foundations/components/toggle';
import { ControlledToggleExample } from '@/components/design/foundations/examples/toggle-examples';

export default function ToggleFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Toggle</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A two-state button that can be on or off, built on the shadcn Toggle.
          It shares the foundation Button&apos;s radius, focus ring, and
          mobile-first sizing, with default and outline variants.
        </p>
      </header>

      <Section
        title="Basic example"
        description="An icon-only toggle. Provide an aria-label for assistive technology."
      >
        <Toggle aria-label="Toggle bold">
          <Bold aria-hidden="true" />
        </Toggle>
      </Section>

      <Section
        title="Outline"
        description="Use variant='outline' for a bordered toggle with a layered surface."
      >
        <Toggle variant="outline" aria-label="Toggle italic">
          <Italic aria-hidden="true" />
        </Toggle>
      </Section>

      <Section
        title="With text"
        description="Pair an icon with a label for a self-describing toggle."
      >
        <Toggle variant="outline" aria-label="Toggle italic">
          <Italic aria-hidden="true" />
          Italic
        </Toggle>
      </Section>

      <Section
        title="Text only"
        description="A toggle can hold text without an icon."
      >
        <Toggle variant="outline">Bold</Toggle>
      </Section>

      <Section
        title="Sizes"
        description="Use the size prop to scale the toggle — sm, default, and lg."
      >
        <Toggle variant="outline" size="sm" aria-label="Toggle bold (small)">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle variant="outline" aria-label="Toggle bold (default)">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle variant="outline" size="lg" aria-label="Toggle bold (large)">
          <Bold aria-hidden="true" />
        </Toggle>
      </Section>

      <Section
        title="Disabled state"
        description="Add disabled to prevent interaction — works for both the off and pressed states."
      >
        <Toggle variant="outline" disabled aria-label="Toggle bold">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle
          variant="outline"
          disabled
          defaultPressed
          aria-label="Toggle italic"
        >
          <Italic aria-hidden="true" />
        </Toggle>
      </Section>

      <Section
        title="Default pressed"
        description="Use defaultPressed to render the toggle in its on state initially."
      >
        <Toggle variant="outline" defaultPressed aria-label="Toggle underline">
          <Underline aria-hidden="true" />
          Underline
        </Toggle>
      </Section>

      <Section
        title="Controlled"
        description="Use the pressed and onPressedChange props to drive the toggle from React state."
      >
        <ControlledToggleExample />
      </Section>

      <Section
        title="Toolbar"
        description="Group related toggles into a formatting toolbar."
      >
        <div className="flex flex-wrap items-center gap-1">
          <Toggle aria-label="Toggle bold">
            <Bold aria-hidden="true" />
          </Toggle>
          <Toggle aria-label="Toggle italic">
            <Italic aria-hidden="true" />
          </Toggle>
          <Toggle aria-label="Toggle underline">
            <Underline aria-hidden="true" />
          </Toggle>
          <Toggle aria-label="Toggle strikethrough">
            <Strikethrough aria-hidden="true" />
          </Toggle>
          <Toggle aria-label="Toggle align left">
            <AlignLeft aria-hidden="true" />
          </Toggle>
        </div>
      </Section>
    </>
  );
}
