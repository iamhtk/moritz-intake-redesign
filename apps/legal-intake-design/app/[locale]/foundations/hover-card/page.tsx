import { CalendarDays } from '@repo/ui/icons';

import { Button } from '@/components/design/foundations/components/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/design/foundations/components/hover-card';
import { Section } from '@/components/design/foundations/showcase/section';

export default function HoverCardFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Hover Card</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Reveals rich content when a trigger is hovered or focused, on the same
          translucent surface as the Popover. Use it for previews and contextual
          detail that should not require a click.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Hover or focus the trigger to reveal the card."
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@moritz</Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Moritz Legal Intake</p>
              <p className="text-muted-foreground text-sm">
                The assistant that helps clients start a new case.
              </p>
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                Joined January 2026
              </span>
            </div>
          </HoverCardContent>
        </HoverCard>
      </Section>

      <Section
        title="Alignment"
        description="Use align and side to position the card relative to the trigger."
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="outline">Hover me</Button>
          </HoverCardTrigger>
          <HoverCardContent align="start" side="top">
            <p className="text-sm">Opened above, aligned to the start.</p>
          </HoverCardContent>
        </HoverCard>
      </Section>
    </>
  );
}
