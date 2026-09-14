import type { Metadata } from 'next';
import { Slider } from '@/components/design/foundations/components/slider';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Slider · Foundations' };

export default function SliderFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Slider</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A draggable range control with one thumb per value. Use it for
          continuous values such as a volume level, a peek distance, or a price
          range.
        </p>
      </header>

      <Section
        title="Single value"
        description="A single thumb with a default value."
      >
        <div className="w-full max-w-sm">
          <Slider defaultValue={[50]} max={100} step={1} aria-label="Value" />
        </div>
      </Section>

      <Section
        title="Range"
        description="Provide two values to render two thumbs for a min/max range."
      >
        <div className="w-full max-w-sm">
          <Slider defaultValue={[25, 75]} max={100} step={1} />
        </div>
      </Section>

      <Section
        title="Steps"
        description="Use step to snap the thumb to discrete increments."
      >
        <div className="w-full max-w-sm">
          <Slider
            defaultValue={[40]}
            max={100}
            step={10}
            aria-label="Stepped"
          />
        </div>
      </Section>

      <Section
        title="Disabled"
        description="Set disabled to dim the slider and block interaction."
      >
        <div className="w-full max-w-sm">
          <Slider defaultValue={[60]} max={100} step={1} disabled />
        </div>
      </Section>
    </>
  );
}
