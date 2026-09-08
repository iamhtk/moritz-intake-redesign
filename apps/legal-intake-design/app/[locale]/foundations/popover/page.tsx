import { Button } from '@/components/design/foundations/components/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/design/foundations/components/popover';
import { Section } from '@/components/design/foundations/showcase/section';

export default function PopoverFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Popover</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Floats rich content next to a trigger on a translucent, blurred
          surface. Use it to surface details, secondary actions, or a small form
          on demand.
        </p>
      </header>

      <Section
        title="Basic example"
        description="A trigger button that opens a popover with free-form content."
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className="text-sm">
              Popovers can hold any content — text, controls, or a short form.
            </p>
          </PopoverContent>
        </Popover>
      </Section>

      <Section
        title="With header"
        description="Compose PopoverHeader, PopoverTitle, and PopoverDescription for a titled popover."
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Show details</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle className="text-sm">Command failed</PopoverTitle>
              <PopoverDescription className="text-sm">
                ENOENT: no such file or directory, open pnpm-lock.yaml
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </Section>

      <Section
        title="Alignment"
        description="Use align and side to position the popover relative to the trigger."
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Align start</Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <p className="text-sm">Aligned to the start edge of the trigger.</p>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Align end</Button>
          </PopoverTrigger>
          <PopoverContent align="end">
            <p className="text-sm">Aligned to the end edge of the trigger.</p>
          </PopoverContent>
        </Popover>
      </Section>
    </>
  );
}
