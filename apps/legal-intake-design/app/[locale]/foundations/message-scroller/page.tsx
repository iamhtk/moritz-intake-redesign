import type { Metadata } from 'next';
import { Section } from '@/components/design/foundations/showcase/section';
import {
  MessageScrollerAnchoringExample,
  MessageScrollerAnimationExample,
  MessageScrollerCommandsExample,
  MessageScrollerDemo,
  MessageScrollerLoadHistoryExample,
  MessageScrollerOpeningPositionExample,
  MessageScrollerPeekExample,
  MessageScrollerScrollableExample,
  MessageScrollerStreamingExample,
  MessageScrollerVisibilityExample,
} from '@/components/design/foundations/examples/message-scroller-examples';

export const metadata: Metadata = { title: 'Message scroller · Foundations' };

export default function MessageScrollerFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Message Scroller</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A chat transcript scroller built for streaming: opening position,
          follow-the-live-edge auto-scroll, new-turn anchoring, previous-turn
          peek, prepended-history preservation, visibility tracking, and a
          jump-to-latest control. The scroll engine comes from{' '}
          <code>@shadcn/react</code>; this is the foundation-styled wrapper.
        </p>
      </header>

      <Section
        title="Basic example"
        description="A streaming chat with autoScroll. Messages stream in (simulated); the viewport follows the live edge and the scroll button appears when there is unseen content below."
      >
        <MessageScrollerDemo />
      </Section>

      <Section
        title="Following the live edge"
        description="With autoScroll, streamed replies stay in view while the reader is at the bottom. Scroll up to release the view; the jump-to-latest button re-engages following."
      >
        <MessageScrollerStreamingExample />
      </Section>

      <Section
        title="Anchoring turns"
        description="Mark the row that should settle near the top with scrollAnchor. Toggle whether the user or assistant message anchors the next turn."
      >
        <MessageScrollerAnchoringExample />
      </Section>

      <Section
        title="Keeping context visible"
        description="scrollPreviousItemPeek keeps a slice of the previous item visible above the anchor. Adjust the slider to change the peek distance."
      >
        <MessageScrollerPeekExample />
      </Section>

      <Section
        title="Opening saved threads"
        description="defaultScrollPosition controls where a saved transcript opens: start, end, or last-anchor (the last meaningful turn)."
      >
        <MessageScrollerOpeningPositionExample />
      </Section>

      <Section
        title="Loading earlier messages"
        description="preserveScrollOnPrepend keeps the reader's place when older rows are prepended above the current transcript."
      >
        <MessageScrollerLoadHistoryExample />
      </Section>

      <Section
        title="Jumping to messages"
        description="Use useMessageScroller from any control inside the provider to drive the transcript — here a Jump to… menu calls scrollToMessage."
      >
        <MessageScrollerCommandsExample />
      </Section>

      <Section
        title="Tracking the reader's position"
        description="useMessageScrollerVisibility reports the current anchored turn and the visible messages — here an outline highlights and jumps to the active turn."
      >
        <MessageScrollerVisibilityExample />
      </Section>

      <Section
        title="Reading scroll state"
        description="useMessageScrollerScrollable reports which edges the viewport can still scroll toward, for status indicators and custom controls."
      >
        <MessageScrollerScrollableExample />
      </Section>

      <Section
        title="Animating new messages"
        description="Animate the row entrance with transform and opacity (never height/margin/padding). Pick a preset and send; reduced-motion is honored."
      >
        <MessageScrollerAnimationExample />
      </Section>
    </>
  );
}
