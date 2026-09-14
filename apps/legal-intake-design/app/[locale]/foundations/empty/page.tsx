import type { Metadata } from 'next';
import { FileText, Inbox, MessageCircleDashed } from '@repo/ui/icons';

import { Button } from '@/components/design/foundations/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Empty · Foundations' };

export default function EmptyFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Empty</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A centered empty-state block with an optional media slot, title,
          description, and actions. Used as the placeholder for a message
          scroller, list, or panel with no content yet.
        </p>
      </header>

      <Section
        title="Basic example"
        description="A title and description, no media."
      >
        <div className="w-full max-w-md rounded-2xl border">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                Try adjusting your filters or search terms.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </Section>

      <Section
        title="With icon media"
        description="Use EmptyMedia variant='icon' to frame a glyph in a muted rounded box."
      >
        <div className="w-full max-w-md rounded-2xl border">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageCircleDashed aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No messages yet</EmptyTitle>
              <EmptyDescription>
                Start the conversation to see messages appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </Section>

      <Section
        title="With ring media"
        description="Use EmptyMedia variant='ring' for the hairline ring the onboarding and intake screens use, where the empty state is the whole view."
      >
        <div className="w-full max-w-md rounded-2xl border">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="ring">
                <Inbox aria-hidden="true" strokeWidth={1.75} />
              </EmptyMedia>
              <EmptyTitle>Nothing to review</EmptyTitle>
              <EmptyDescription>
                Work you are assigned will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </Section>

      <Section
        title="With action"
        description="Add EmptyContent below the header for a primary action."
      >
        <div className="w-full max-w-md rounded-2xl border">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Your inbox is empty</EmptyTitle>
              <EmptyDescription>
                New notifications will show up here as they arrive.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm">
                Refresh
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </Section>

      <Section
        title="Custom media"
        description="The default media variant renders the slot as-is for custom illustrations."
      >
        <div className="w-full max-w-md rounded-2xl border">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <FileText
                  aria-hidden="true"
                  className="text-muted-foreground size-10"
                />
              </EmptyMedia>
              <EmptyTitle>No documents</EmptyTitle>
              <EmptyDescription>Upload a file to get started.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </Section>
    </>
  );
}
