import type { Metadata } from 'next';
import { CodeBlock } from '@/components/design/foundations/showcase/code-block';
import { ColorSwatch } from '@/components/design/foundations/showcase/color-swatch';
import { GradientSwatch } from '@/components/design/foundations/showcase/gradient-swatch';
import {
  CORE,
  GRADIENTS,
  GRAYSCALE,
  STATUS,
  TINTS,
} from '@/components/design/foundations/tokens/colors';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Colors · Foundations' };

const DEFINE_SNIPPET = `:root {
  --mz-gray-10: #f1f2f2; /* lightest */
  --mz-gray-20: #e6e7e8;
  --mz-gray-30: #dcddde;
  --mz-gray-40: #d1d3d4;
  --mz-gray-50: #c7c8ca;
  --mz-gray-60: #bcbec0;
  --mz-gray-70: #b1b3b6;
  --mz-gray-80: #a7a9ac;
  --mz-gray-90: #9d9fa2;
  --mz-gray-100: #939598;
  --mz-gray-110: #8a8c8e;
  --mz-gray-120: #808285;
  --mz-gray-130: #77787b;
  --mz-gray-140: #6d6e71;
  --mz-gray-150: #636466;
  --mz-gray-160: #58595b;
  --mz-gray-170: #4d4d4f;
  --mz-gray-180: #414042;
  --mz-gray-190: #282829;
  --mz-gray-200: #141414; /* darkest */

  /* Core */
  --mz-black: #000000;
  --mz-white: #ffffff;

  /* Tints */
  --mz-gold: #fbf6ed;
  --mz-sky: #ecf8fe;

  /* Gradients (top -> bottom) */
  --mz-gradient-grey: linear-gradient(180deg, #f1f2f2, #e6e7e8, #d1d3d4);
  --mz-gradient-gold: linear-gradient(180deg, #ffffff, #fbf6ed, #f1f0dd);
  --mz-gradient-sky: linear-gradient(180deg, #ffffff, #ecf8fe, #dcf2fd);

  /* Status */
  --mz-green: #5eae8b;
  --mz-yellow: #e8a952;
  --mz-red: #eb5444;
}

@theme inline {
  --color-mz-gray-10: var(--mz-gray-10);
  --color-mz-gray-20: var(--mz-gray-20);
  --color-mz-gray-30: var(--mz-gray-30);
  --color-mz-gray-40: var(--mz-gray-40);
  --color-mz-gray-50: var(--mz-gray-50);
  --color-mz-gray-60: var(--mz-gray-60);
  --color-mz-gray-70: var(--mz-gray-70);
  --color-mz-gray-80: var(--mz-gray-80);
  --color-mz-gray-90: var(--mz-gray-90);
  --color-mz-gray-100: var(--mz-gray-100);
  --color-mz-gray-110: var(--mz-gray-110);
  --color-mz-gray-120: var(--mz-gray-120);
  --color-mz-gray-130: var(--mz-gray-130);
  --color-mz-gray-140: var(--mz-gray-140);
  --color-mz-gray-150: var(--mz-gray-150);
  --color-mz-gray-160: var(--mz-gray-160);
  --color-mz-gray-170: var(--mz-gray-170);
  --color-mz-gray-180: var(--mz-gray-180);
  --color-mz-gray-190: var(--mz-gray-190);
  --color-mz-gray-200: var(--mz-gray-200);
  --color-mz-black: var(--mz-black);
  --color-mz-white: var(--mz-white);
  --color-mz-gold: var(--mz-gold);
  --color-mz-sky: var(--mz-sky);
  --color-mz-green: var(--mz-green);
  --color-mz-yellow: var(--mz-yellow);
  --color-mz-red: var(--mz-red);
}`;

const USAGE_SNIPPET = `// Tailwind utilities generated from the tokens
<div className="bg-mz-gray-190 text-mz-gray-10">Heading</div>
<p className="text-mz-gray-130">Muted body copy</p>
<span className="bg-mz-green text-mz-white">Success</span>
<hr className="border-mz-gray-50" />`;

export default function ColorsFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Colors</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A clean, minimalist palette built on black, white, and everything in
          between. The monochromatic ramp carries typographic hierarchy, with
          accent colors used sparingly. Click any swatch to copy its hex.
        </p>
      </header>

      <Section
        title="Core"
        description="The anchors of the palette — pure black and white."
      >
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CORE.map((swatch) => (
            <ColorSwatch key={swatch.hex} swatch={swatch} />
          ))}
        </div>
      </Section>

      <Section
        title="Grayscale"
        description="A 19-step ramp from dark to light for surfaces, borders, and text."
      >
        <div className="grid w-full grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10">
          {GRAYSCALE.map((swatch) => (
            <ColorSwatch key={swatch.hex} swatch={swatch} compact />
          ))}
        </div>
      </Section>

      <Section
        title="Tints"
        description="Soft background washes for light surfaces and highlights."
      >
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TINTS.map((swatch) => (
            <ColorSwatch key={swatch.hex} swatch={swatch} />
          ))}
        </div>
      </Section>

      <Section
        title="Status"
        description="Accent colors for success, warning, and failure states."
      >
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {STATUS.map((swatch) => (
            <ColorSwatch key={swatch.hex} swatch={swatch} />
          ))}
        </div>
      </Section>

      <Section
        title="Gradients"
        description="Soft linear gradients (top to bottom) for branded surfaces — grey as the neutral default, gold and sky for the client and lawyer onboarding paths."
      >
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {GRADIENTS.map((swatch) => (
            <GradientSwatch key={swatch.name} swatch={swatch} />
          ))}
        </div>
      </Section>

      <Section
        title="Using the tokens"
        description="Every swatch is defined as a theme token (grayscale runs light → dark, higher = darker), exposing bg-/text-/border- utilities across the playground."
      >
        <div className="w-full space-y-4">
          <CodeBlock label="globals.css" code={DEFINE_SNIPPET} />
          <CodeBlock label="Usage" code={USAGE_SNIPPET} />
        </div>
      </Section>
    </>
  );
}
