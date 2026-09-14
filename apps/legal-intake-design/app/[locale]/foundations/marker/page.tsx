import type { Metadata } from 'next';
import { Section } from '@/components/design/foundations/showcase/section';
import {
  MarkerBorderExample,
  MarkerDemo,
  MarkerIconExample,
  MarkerLinkButtonExample,
  MarkerSeparatorExample,
  MarkerShimmerExample,
  MarkerStatusExample,
  MarkerVariantsExample,
} from '@/components/design/foundations/examples/marker-examples';

export const metadata: Metadata = { title: 'Marker · Foundations' };

export default function MarkerFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Marker</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Displays inline conversation markers such as status updates, system
          notes, bordered rows, and labeled separators. Compose it with messages
          in a conversation thread.
        </p>
      </header>

      <Section
        title="Basic example"
        description="An inline marker, a streaming status with a shimmer, a labeled separator, and an explored-files note."
      >
        <MarkerDemo />
      </Section>

      <Section
        title="Variants"
        description="Use variant to switch between an inline marker, a bordered row, and a labeled separator."
      >
        <MarkerVariantsExample />
      </Section>

      <Section
        title="Status"
        description="Set role='status' and include a Spinner for streaming or in-progress markers so updates are announced."
      >
        <MarkerStatusExample />
      </Section>

      <Section
        title="Shimmer"
        description="Add the shimmer utility to MarkerContent for an animated streaming-text effect."
      >
        <MarkerShimmerExample />
      </Section>

      <Section
        title="Separator"
        description="Use the separator variant for labeled dividers, such as dates or section breaks, in a conversation."
      >
        <MarkerSeparatorExample />
      </Section>

      <Section
        title="Border"
        description="Use the border variant for status rows that keep the default alignment while separating the next row."
      >
        <MarkerBorderExample />
      </Section>

      <Section
        title="With icon"
        description="Use MarkerIcon to render a decorative icon alongside the content. Use flex-col to stack the icon above the content."
      >
        <MarkerIconExample />
      </Section>

      <Section
        title="Links and buttons"
        description="Turn a marker into a link or button with the asChild prop on Marker so it is focusable and exposes the correct role."
      >
        <MarkerLinkButtonExample />
      </Section>
    </>
  );
}
