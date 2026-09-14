import type { Metadata } from 'next';
import { ArrowRight, CircleCheck, Plus, Settings } from '@repo/ui/icons';

import { Button } from '@/components/design/foundations/components/button';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Buttons · Foundations' };

const SIZES = ['sm', 'default', 'lg', 'xl', '2xl'] as const;
const ICON_SIZES = ['icon-sm', 'icon', 'icon-lg'] as const;

export default function ButtonsFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Buttons</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation button, built on the shadcn Button: variants, sizes,
          icons, rounded pills, and icon-only buttons, with a mobile-first size
          scale.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Use the Button component to build a basic button."
      >
        <Button>Save changes</Button>
      </Section>

      <Section
        title="Solid variants"
        description="Use the variant prop to set the solid color treatment — default (primary), secondary, and destructive."
      >
        <Button variant="default">Save changes</Button>
        <Button variant="secondary">Save changes</Button>
        <Button variant="destructive">Delete</Button>
      </Section>

      <Section
        title="Outline"
        description="Use the outline variant for a secondary button style with no fill — just a border."
      >
        <Button variant="outline">Save draft</Button>
      </Section>

      <Section
        title="Ghost"
        description="Use the ghost variant for a plain button style with no border, shadow, or background."
      >
        <Button variant="ghost">Save draft</Button>
      </Section>

      <Section
        title="Disabled states"
        description="Use the disabled prop to disable a button — reduced opacity and a not-allowed cursor on hover."
      >
        <Button disabled>Save changes</Button>
        <Button variant="outline" disabled>
          Save draft
        </Button>
        <Button variant="ghost" disabled>
          Save draft
        </Button>
        <Button disabled>
          <CircleCheck data-icon="inline-start" aria-hidden="true" />
          Save changes
        </Button>
      </Section>

      <Section
        title="Loading / pending"
        description="Use the isPending prop to disable the button and show a spinner while an action is in flight."
      >
        <Button isPending>Saving…</Button>
        <Button variant="secondary" isPending>
          Saving…
        </Button>
        <Button variant="outline" isPending>
          Saving…
        </Button>
      </Section>

      <Section
        title="With icon"
        description='Pass an icon as a child with data-icon="inline-start" or data-icon="inline-end" to place it at the start or end.'
      >
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add item
        </Button>
        <Button>
          Continue
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </Section>

      <Section
        title="Using as a link"
        description="Use asChild to render an anchor with button styling, or the link variant for a plain text link."
      >
        <Button asChild>
          <a href="#get-started">Get started</a>
        </Button>
        <Button variant="link">Learn more</Button>
      </Section>

      <Section
        title="Sizes"
        description="Use the size prop for the mobile-first size scale (sm → 2xl), with xl and 2xl for large CTAs."
      >
        {SIZES.map((size) => (
          <Button key={size} size={size}>
            Button text
          </Button>
        ))}
      </Section>

      <Section
        title="Rounded"
        description="Add the rounded-full class for pill buttons across the solid, outline, and ghost variants."
      >
        <Button className="rounded-full">Solid</Button>
        <Button variant="outline" className="rounded-full">
          Outline
        </Button>
        <Button variant="ghost" className="rounded-full">
          Ghost
        </Button>
      </Section>

      <Section
        title="Icon-only"
        description="Use the icon sizes (optionally with rounded-full for circular buttons) across variants and sizes."
      >
        <Button size="icon" className="rounded-full" aria-label="Add">
          <Plus aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          aria-label="Settings"
        >
          <Settings aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Confirm"
        >
          <CircleCheck aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Add"
        >
          <Plus aria-hidden="true" />
        </Button>
        {ICON_SIZES.map((size) => (
          <Button
            key={size}
            size={size}
            className="rounded-full"
            aria-label="Add"
          >
            <Plus aria-hidden="true" />
          </Button>
        ))}
      </Section>
    </>
  );
}
