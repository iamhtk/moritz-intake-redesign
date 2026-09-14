import type { Metadata } from 'next';
import { Globe, ImageIcon, Pencil, Sparkles } from '@repo/ui/icons';

import { Chip } from '@/components/design/foundations/components/chip';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Chip · Foundations' };

export default function ChipFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Chip</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A spacious, outlined, pill-shaped trigger that pairs a leading icon
          with a label. Used for composer quick actions. Roomier than a Button
          and stateless — it fires an action on click rather than holding a
          selected state.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Use the Chip component for a lightweight, outlined action affordance."
      >
        <Chip>
          <Sparkles aria-hidden="true" />
          Quick action
        </Chip>
      </Section>

      <Section
        title="Variants"
        description="Use outline (default) for a hairline-stroked chip, or ghost for a borderless, de-emphasized affordance."
      >
        <Chip variant="outline">
          <Sparkles aria-hidden="true" />
          Outline
        </Chip>
        <Chip variant="ghost">
          <Sparkles aria-hidden="true" />
          Ghost
        </Chip>
      </Section>

      <Section
        title="With icon"
        description="Pass a lucide icon as the first child; it is sized and spaced automatically."
      >
        <Chip>
          <ImageIcon aria-hidden="true" />
          Create an image
        </Chip>
        <Chip>
          <Pencil aria-hidden="true" />
          Write or edit
        </Chip>
        <Chip>
          <Globe aria-hidden="true" />
          Look something up
        </Chip>
      </Section>

      <Section
        title="Composer actions"
        description="A wrapping row of chips beneath a chat composer, mirroring the ChatGPT prompt-starter pattern."
      >
        <div className="flex flex-wrap gap-2">
          <Chip>
            <ImageIcon aria-hidden="true" />
            Create an image
          </Chip>
          <Chip>
            <Pencil aria-hidden="true" />
            Write or edit
          </Chip>
          <Chip>
            <Globe aria-hidden="true" />
            Look something up
          </Chip>
        </div>
      </Section>

      <Section
        title="Without an icon"
        description="The icon is optional — pass just a label for a plain text chip."
      >
        <Chip>Quick action</Chip>
        <Chip variant="ghost">Ghost</Chip>
      </Section>

      <Section
        title="Sizes"
        description="Use the size prop for a compact (sm), default, or roomier (lg) chip."
      >
        <Chip size="sm">
          <Sparkles aria-hidden="true" />
          Small
        </Chip>
        <Chip>
          <Sparkles aria-hidden="true" />
          Default
        </Chip>
        <Chip size="lg">
          <Sparkles aria-hidden="true" />
          Large
        </Chip>
      </Section>

      <Section
        title="Disabled state"
        description="Use the disabled prop to show a non-interactive chip with reduced opacity."
      >
        <Chip disabled>
          <ImageIcon aria-hidden="true" />
          Create an image
        </Chip>
      </Section>

      <Section
        title="As a link"
        description="Use asChild to render the chip as an anchor while keeping the chip styling."
      >
        <Chip asChild>
          <a href="#">
            <Globe aria-hidden="true" />
            Look something up
          </a>
        </Chip>
      </Section>
    </>
  );
}
