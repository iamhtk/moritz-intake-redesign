import type { Metadata } from 'next';
import { Button } from '@/components/design/foundations/components/button';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Spinner · Foundations' };

export default function SpinnerFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Spinner</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A spinning loader icon used inline to signal in-progress work — an
          uploading attachment, a streaming marker, or a busy button. Renders
          with role=&quot;status&quot; and an aria-label so the busy state is
          announced.
        </p>
      </header>

      <Section
        title="Sizes"
        description="The spinner inherits currentColor and scales with the size-* utility."
      >
        <Spinner className="size-4" />
        <Spinner className="size-6" />
        <Spinner className="size-8" />
      </Section>

      <Section
        title="With label"
        description="Pair the spinner with text to describe what is happening."
      >
        <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
          <Spinner />
          Uploading files…
        </span>
      </Section>

      <Section
        title="In a button"
        description="The foundation Button has a built-in isPending spinner; here is a manual composition."
      >
        <Button disabled>
          <Spinner data-icon="inline-start" />
          Saving
        </Button>
      </Section>

      <Section
        title="Color"
        description="The spinner uses currentColor, so it adopts its container's text color."
      >
        <span className="text-primary">
          <Spinner className="size-6" />
        </span>
        <span className="text-destructive">
          <Spinner className="size-6" />
        </span>
        <span className="text-muted-foreground">
          <Spinner className="size-6" />
        </span>
      </Section>
    </>
  );
}
