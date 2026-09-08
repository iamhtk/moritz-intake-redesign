import { CheckCircle, AlertTriangle, Info } from '@repo/ui/icons';

import {
  Badge,
  BadgeButton,
} from '@/components/design/foundations/components/badge';
import { Section } from '@/components/design/foundations/showcase/section';

export default function BadgeFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Badge</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation badge, built on the shadcn Badge and restyled to a soft
          tinted-pill look: a translucent palette wash with a deepened label,
          with our semantic variants mapped onto Tailwind colors. A compact pill
          for statuses, counts, and labels, used throughout the app for case and
          quote statuses. See it in context on the Table page.
        </p>
      </header>

      <Section
        title="Variants"
        description="Soft tinted pills across the full status palette: default, secondary, destructive, success, warning, info, accent, and outline. Reach for accent when a label classifies rather than reports state, so a taxonomy chip is neither grey nor mistaken for a status."
      >
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="outline">Outline</Badge>
      </Section>

      <Section
        title="Sizes"
        description="The default pill drops to 12px medium text; lg is 13px regular, for badges sitting inline with body-size content — a data grid cell, say — where the label should not shout over the text beside it."
      >
        <Badge variant="secondary">Default</Badge>
        <Badge variant="secondary" size="lg">
          Large
        </Badge>
        <Badge variant="destructive" size="lg">
          Critical
        </Badge>
      </Section>

      <Section
        title="With icon"
        description="Drop a lucide icon before the label; it is sized and spaced automatically."
      >
        <Badge variant="success">
          <CheckCircle />
          Accepted
        </Badge>
        <Badge variant="warning">
          <AlertTriangle />
          Action needed
        </Badge>
        <Badge variant="info">
          <Info />
          Draft
        </Badge>
      </Section>

      <Section
        title="As a link"
        description="Use asChild to render the badge as an anchor — the hover styles only apply to the link variant."
      >
        <Badge asChild>
          <a href="#">View case</a>
        </Badge>
        <Badge variant="secondary" asChild>
          <a href="#">12 open</a>
        </Badge>
        <Badge variant="outline" asChild>
          <a href="#">Filter</a>
        </Badge>
      </Section>

      <Section
        title="Interactive (BadgeButton)"
        description="BadgeButton wraps the badge in a focusable button — or a link when href is set — with a focus ring and hover darkening."
      >
        <BadgeButton>Dismiss</BadgeButton>
        <BadgeButton variant="success">
          <CheckCircle />
          Approve
        </BadgeButton>
        <BadgeButton variant="outline" href="#">
          View case
        </BadgeButton>
        <BadgeButton variant="info" href="#">
          12 open
        </BadgeButton>
      </Section>
    </>
  );
}
