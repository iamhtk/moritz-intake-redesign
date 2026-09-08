import { Card, CardContent } from '@repo/ui/components/card';
import { cn } from '@repo/ui/lib/utils';

import { Button } from '@/components/design/foundations/components/button';
import {
  Heading,
  Subheading,
} from '@/components/design/foundations/components/heading';
import { Section } from '@/components/design/foundations/showcase/section';
import {
  Code,
  Strong,
  Text,
  TextLink,
} from '@/components/design/foundations/components/text';

/** The three typefaces the playground ships, with the role each one plays. */
const TYPEFACES = [
  {
    name: 'Cormorant Garamond',
    role: 'Serif · Display',
    className: 'font-serif',
  },
  {
    name: 'Inter',
    role: 'Sans · Body & UI',
    className: 'font-sans',
  },
  {
    name: 'IBM Plex Mono',
    role: 'Mono · Code',
    className: 'font-mono',
  },
] as const;

export default function TypographyFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Typography</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The Heading and Text primitives used across the dashboard — serif page
          titles and subheadings, and the body Text family with emphasis, links,
          and inline code.
        </p>
      </header>

      <Section
        title="Typefaces"
        description="Three faces carry the whole system: a serif display face for headings, a sans face for body and UI, and a monospace face for code."
      >
        <div className="grid w-full gap-4 sm:grid-cols-3">
          {TYPEFACES.map((face) => (
            <Card
              key={face.name}
              className="border-border/60 gap-0 rounded-lg py-0 shadow-none"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <span
                  className={cn(
                    'text-foreground text-4xl leading-none',
                    face.className,
                  )}
                >
                  Ag
                </span>
                <div className="space-y-0.5">
                  <p className="text-foreground text-sm font-semibold">
                    {face.name}
                  </p>
                  <p className="text-muted-foreground text-xs">{face.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Heading"
        description="Use the Heading component for a primary page title. It renders an h1 by default in the Cormorant Garamond serif face."
      >
        <Heading>Recent orders</Heading>
      </Section>

      <Section
        title="Subheading"
        description="Use the Subheading component for a section title. It renders an h2 by default. Pass the variant prop to switch between the serif display face (default) and the Inter body face, which is optically tuned to sit alongside the serif on denser surfaces."
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Serif (default)
            </p>
            <Subheading>Recent orders</Subheading>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Sans
            </p>
            <Subheading variant="sans">Recent orders</Subheading>
          </div>
        </div>
      </Section>

      <Section
        title="With custom level"
        description="Use the level prop to render a different heading element for semantics while keeping the same visual style — here a Heading rendered as an h2."
      >
        <Heading level={2}>Recent orders</Heading>
      </Section>

      <Section
        title="Page header"
        description="Compose a Heading with trailing actions over a divider for a dashboard page header."
      >
        <div className="flex w-full flex-wrap items-end justify-between gap-4 border-b pb-6">
          <Heading>Order #1011</Heading>
          <div className="flex gap-4">
            <Button variant="outline">Refund</Button>
            <Button>Resend invoice</Button>
          </div>
        </div>
      </Section>

      <Section
        title="Text"
        description="Use the Text component for any custom paragraph copy that should match the style of the text built into the other components."
      >
        <Text className="max-w-2xl">
          Deleting your account is permanent, and your data will not be able to
          be recovered.
        </Text>
      </Section>

      <Section
        title="With link"
        description="Use the TextLink component for any links within a Text block."
      >
        <Text className="max-w-2xl">
          Deleting your account is permanent, and your data will not be able to
          be recovered. If you still want to use this account in the future,
          learn about <TextLink href="#">pausing your subscription</TextLink>{' '}
          instead.
        </Text>
      </Section>

      <Section
        title="With strong"
        description="Use the Strong component to emphasize text within a Text block."
      >
        <Text className="max-w-2xl">
          Deleting your account is permanent, and{' '}
          <Strong>your account data cannot be recovered</Strong>.
        </Text>
      </Section>

      <Section
        title="With code"
        description="Use the Code component for any inline code symbols within a Text block."
      >
        <Text className="max-w-2xl">
          Import shared primitives from <Code>@repo/ui</Code> wherever possible,
          and your new API token is <Code>BaVrRKpRMS_ndKU</Code>.
        </Text>
      </Section>
    </>
  );
}
