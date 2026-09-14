import type { Metadata } from 'next';
import { Section } from '@/components/design/foundations/showcase/section';
import {
  AttachmentDemo,
  AttachmentGroupExample,
  AttachmentImageExample,
  AttachmentSizesExample,
  AttachmentStatesExample,
  AttachmentTriggerExample,
} from '@/components/design/foundations/examples/attachment-examples';

export const metadata: Metadata = { title: 'Attachment · Foundations' };

export default function AttachmentFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Attachment</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Displays a file or image attachment — its media, name, and metadata —
          with optional actions and an upload state. Use it for files and images
          in chat composers, message threads, and upload lists.
        </p>
      </header>

      <Section
        title="Basic example"
        description="An image group plus an uploading and an idle file attachment with a remove action."
      >
        <AttachmentDemo />
      </Section>

      <Section
        title="Image"
        description="Set variant='image' on AttachmentMedia and render an <img> inside it. Use orientation='vertical' to stack the media above the content."
      >
        <AttachmentImageExample />
      </Section>

      <Section
        title="States"
        description="Set state to reflect the upload lifecycle. uploading and processing shimmer the title; error switches to a destructive treatment with the reason kept in text."
      >
        <AttachmentStatesExample />
      </Section>

      <Section
        title="Sizes"
        description="Use size to switch between default, sm, and xs."
      >
        <AttachmentSizesExample />
      </Section>

      <Section
        title="Group"
        description="Wrap attachments in AttachmentGroup to lay them out in a horizontally scrollable, snapping row with an edge fade."
      >
        <AttachmentGroupExample />
      </Section>

      <Section
        title="Trigger"
        description="Add an AttachmentTrigger to make the whole card open a link or dialog. It fills the card behind the actions, so the actions stay clickable."
      >
        <AttachmentTriggerExample />
      </Section>
    </>
  );
}
