import type { Metadata } from 'next';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Terminal,
} from '@repo/ui/icons';

import {
  Banner,
  BannerDescription,
  BannerTitle,
} from '@/components/design/foundations/components/banner';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Banner · Foundations' };

export default function BannerFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Banner</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation banner, built on the shadcn Alert: an inline callout
          for status and contextual messages. It pairs a title and description
          with an optional leading icon across default, destructive, warning,
          and success tones. For a modal confirmation, see Alert Dialog.
        </p>
      </header>

      <Section
        title="Variants"
        description="Four tones cover the status spectrum: default, destructive, warning, and success."
      >
        <div className="w-full max-w-xl space-y-4">
          <Banner>
            <Terminal />
            <BannerTitle>Heads up!</BannerTitle>
            <BannerDescription>
              You can add components to your app using the CLI.
            </BannerDescription>
          </Banner>
          <Banner variant="destructive">
            <AlertCircle />
            <BannerTitle>Unable to process your payment.</BannerTitle>
            <BannerDescription>
              Please verify your billing details and try again.
            </BannerDescription>
          </Banner>
          <Banner variant="warning">
            <AlertTriangle />
            <BannerTitle>Your trial ends in 3 days.</BannerTitle>
            <BannerDescription>
              Add a payment method to keep your workspace active.
            </BannerDescription>
          </Banner>
          <Banner variant="success">
            <CheckCircle />
            <BannerTitle>Payment successful.</BannerTitle>
            <BannerDescription>
              Your receipt has been emailed to you.
            </BannerDescription>
          </Banner>
        </div>
      </Section>

      <Section
        title="Title only"
        description="Drop the description for a compact, single-line callout."
      >
        <div className="w-full max-w-xl space-y-4">
          <Banner>
            <Info />
            <BannerTitle>A new software update is available.</BannerTitle>
          </Banner>
          <Banner variant="success">
            <CheckCircle />
            <BannerTitle>Your changes have been saved.</BannerTitle>
          </Banner>
        </div>
      </Section>

      <Section
        title="Without icon"
        description="Icons are optional — the grid collapses the leading column when there's no svg."
      >
        <div className="w-full max-w-xl space-y-4">
          <Banner>
            <BannerTitle>Note</BannerTitle>
            <BannerDescription>
              This workspace is in read-only mode until the migration completes.
            </BannerDescription>
          </Banner>
        </div>
      </Section>
    </>
  );
}
