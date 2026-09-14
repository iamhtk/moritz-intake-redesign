import type { Metadata } from 'next';
import { Section } from '@/components/design/foundations/showcase/section';
import {
  AttachmentsComposerExample,
  BasicComposerExample,
  ConversationComposerExample,
  DisabledComposerExample,
  PlaceholderComposerExample,
  VoiceComposerExample,
} from '@/components/design/foundations/examples/chat-composer-examples';

export const metadata: Metadata = { title: 'Chat composer · Foundations' };

export default function ChatComposerFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Chat Composer</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation chat composer, built on the foundation Textarea and
          Button: an auto-growing field, attach and voice affordances, and a
          send button.
        </p>
      </header>

      <Section
        title="Basic example"
        description="The default composer. Press Enter to send or Shift+Enter to add a new line."
      >
        <BasicComposerExample />
      </Section>

      <Section
        title="Custom placeholder"
        description="Pass a placeholder to tailor the prompt to the conversation."
      >
        <PlaceholderComposerExample />
      </Section>

      <Section
        title="Voice input"
        description="Press the mic to start recording: the control becomes an animated waveform with a stop button. Stopping inserts the transcribed text."
      >
        <VoiceComposerExample />
      </Section>

      <Section
        title="With attachments"
        description="Attached files dock in a scrollable row above the input, built from the foundation Attachment component. Use the paperclip to add files; remove them with the X. Attachments alone are enough to send."
      >
        <AttachmentsComposerExample />
      </Section>

      <Section
        title="Disabled"
        description="Set disabled to dim the composer and block typing, sending, and attachments."
      >
        <DisabledComposerExample />
      </Section>

      <Section
        title="In a conversation"
        description="Sending appends a message to the transcript above while the composer stays pinned to the bottom."
      >
        <ConversationComposerExample />
      </Section>
    </>
  );
}
