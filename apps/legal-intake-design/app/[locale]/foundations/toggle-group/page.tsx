import type { Metadata } from 'next';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
} from '@repo/ui/icons';

import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/design/foundations/components/toggle-group';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Toggle group · Foundations' };

export default function ToggleGroupFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Toggle Group</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A set of related two-state buttons that act as a single- or
          multi-select control. Reuses the foundation Toggle styling for each
          item.
        </p>
      </header>

      <Section
        title="Single selection"
        description="type='single' lets one item be selected at a time."
      >
        <ToggleGroup
          type="single"
          defaultValue="center"
          aria-label="Text align"
        >
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Section>

      <Section
        title="Multiple selection"
        description="type='multiple' lets several items be toggled at once."
      >
        <ToggleGroup type="multiple" aria-label="Text formatting">
          <ToggleGroupItem value="bold" aria-label="Bold">
            <Bold aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <Italic aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Section>

      <Section
        title="With text"
        description="Items can carry labels instead of icons."
      >
        <ToggleGroup type="single" defaultValue="user" aria-label="Anchor role">
          <ToggleGroupItem value="user">User</ToggleGroupItem>
          <ToggleGroupItem value="assistant">Assistant</ToggleGroupItem>
        </ToggleGroup>
      </Section>

      <Section
        title="Ghost variant"
        description="Use variant='default' for an unframed (ghost) toggle group."
      >
        <ToggleGroup
          type="single"
          variant="default"
          defaultValue="center"
          aria-label="Text align ghost"
        >
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Section>
    </>
  );
}
