import type { Metadata } from 'next';
import { Section } from '@/components/design/foundations/showcase/section';
import {
  BubbleAlignmentExample,
  BubbleCollapsibleExample,
  BubbleDemo,
  BubbleGroupExample,
  BubbleLinkButtonExample,
  BubblePopoverExample,
  BubbleReactionsExample,
  BubbleTooltipExample,
  BubbleVariantsExample,
} from '@/components/design/foundations/examples/bubble-examples';

export const metadata: Metadata = { title: 'Bubble · Foundations' };

export default function BubbleFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Bubble</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Displays framed conversational content. Use it for chat text, short
          structured output, quoted replies, suggestions, and reactions. Keep
          conversation-level semantics (avatars, names, timestamps) on the
          surrounding layout.
        </p>
      </header>

      <Section
        title="Basic example"
        description="A short thread that groups consecutive bubbles, switches sides, and anchors reactions to the bubble edge."
      >
        <BubbleDemo />
      </Section>

      <Section
        title="Variants"
        description="Use variant to change the visual treatment: default, secondary, muted, tinted, outline, ghost, and destructive. Ghost is unframed and full width for assistant text and markdown."
      >
        <BubbleVariantsExample />
      </Section>

      <Section
        title="Alignment"
        description="Use align to place a bubble at the start or end of the conversation."
      >
        <BubbleAlignmentExample />
      </Section>

      <Section
        title="Bubble group"
        description="Use BubbleGroup to group consecutive bubbles from the same sender. Set align on each Bubble, not the group."
      >
        <BubbleGroupExample />
      </Section>

      <Section
        title="Links and buttons"
        description="Turn a bubble into a link or button with asChild on BubbleContent. The accessible name comes from the bubble text."
      >
        <BubbleLinkButtonExample />
      </Section>

      <Section
        title="Reactions"
        description="Use BubbleReactions to display reactions or quick action buttons. Use side and align to position the row; it overlaps the bubble edge, so leave vertical space between rows."
      >
        <BubbleReactionsExample />
      </Section>

      <Section
        title="Show more / collapsible"
        description="Compose long content with Collapsible for a show more / show less interaction."
      >
        <BubbleCollapsibleExample />
      </Section>

      <Section
        title="Tooltip"
        description="Wrap a bubble action in a Tooltip to reveal metadata on hover, such as when a message was read."
      >
        <BubbleTooltipExample />
      </Section>

      <Section
        title="Popover"
        description="Pair a bubble with a Popover to surface more information on demand, such as the full error message for a failed action."
      >
        <BubblePopoverExample />
      </Section>
    </>
  );
}
