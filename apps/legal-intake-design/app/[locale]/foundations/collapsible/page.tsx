import type { Metadata } from 'next';
import { ChevronsUpDown } from '@repo/ui/icons';

import { Button } from '@/components/design/foundations/components/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/design/foundations/components/collapsible';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Collapsible · Foundations' };

export default function CollapsibleFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Collapsible</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          An expandable region toggled by a trigger. Use it for show more / show
          less interactions, optional detail, and progressive disclosure.
        </p>
      </header>

      <Section
        title="Basic example"
        description="A trigger toggles the visibility of the content below it."
      >
        <Collapsible className="w-full max-w-sm space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Recent activity</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Toggle">
                <ChevronsUpDown aria-hidden="true" />
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className="rounded-md border px-4 py-2 text-sm">
            Opened the case file
          </div>
          <CollapsibleContent className="space-y-2">
            <div className="rounded-md border px-4 py-2 text-sm">
              Added a new note
            </div>
            <div className="rounded-md border px-4 py-2 text-sm">
              Assigned to intake team
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Section>

      <Section
        title="Open by default"
        description="Use defaultOpen to render the content expanded on mount."
      >
        <Collapsible defaultOpen className="w-full max-w-sm space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              Toggle details
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="text-muted-foreground text-sm">
              This region starts open. Toggle the trigger to collapse it.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </Section>
    </>
  );
}
