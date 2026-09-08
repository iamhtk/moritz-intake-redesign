'use client';

import * as React from 'react';

import * as Legacy from '@/components/typography';
import {
  Heading,
  Subheading,
} from '@/components/design/foundations/components/heading';
import {
  Code,
  Text,
  TextLink as FoundationTextLink,
} from '@/components/design/foundations/components/text';

/**
 * Design-system shim for typography. Drop-in for `@/components/typography` (same
 * export names). The playground standardised on the foundation design system, so
 * the shadcn typography aliases map onto the foundation primitives: H1–H3 → the
 * serif `Heading` (each level keeps the legacy step size, so only the typeface
 * changes), H4 → `Subheading`, Muted → `Text`, InlineCode → `Code`. The
 * foundation `Heading`/`Subheading` support `asChild`, so page titles that wrap
 * their text in a semantic element (e.g. `<H3 asChild><h1>…</h1></H3>`) now
 * render on the foundation serif face instead of falling back to Legacy. Aliases
 * with no foundation equivalent (P, Blockquote, Lead, Large, Small) stay Legacy.
 */

// Strip the legacy-only `asChild` prop before forwarding to a foundation
// primitive that renders a fixed element and would otherwise leak `asChild`
// onto the DOM. Only reached when `asChild` is falsy (guarded by each wrapper).
function withoutAsChild<T extends { asChild?: boolean }>(
  props: T,
): Omit<T, 'asChild'> {
  const rest = { ...props };
  delete rest.asChild;
  return rest;
}

function H1(props: React.ComponentProps<typeof Legacy.H1>) {
  return <Heading level={1} {...props} />;
}

function H2(props: React.ComponentProps<typeof Legacy.H2>) {
  return <Heading level={2} {...props} />;
}

function H3(props: React.ComponentProps<typeof Legacy.H3>) {
  return <Heading level={3} {...props} />;
}

function H4(props: React.ComponentProps<typeof Legacy.H4>) {
  return <Subheading level={4} {...props} />;
}

function Muted(props: React.ComponentProps<typeof Legacy.Muted>) {
  if (props.asChild) {
    return <Legacy.Muted {...props} />;
  }
  return <Text {...withoutAsChild(props)} />;
}

function InlineCode(props: React.ComponentProps<typeof Legacy.InlineCode>) {
  if (props.asChild) {
    return <Legacy.InlineCode {...props} />;
  }
  return <Code {...withoutAsChild(props)} />;
}

// The legacy typography set has no inline-link primitive, so the foundation
// TextLink is the design system's link.
function TextLink(props: React.ComponentProps<typeof FoundationTextLink>) {
  return <FoundationTextLink {...props} />;
}

// Exports with no foundation equivalent stay Legacy.
const { P, Blockquote, Lead, Large, Small } = Legacy;

export {
  H1,
  H2,
  H3,
  H4,
  P,
  Blockquote,
  InlineCode,
  Lead,
  Large,
  Small,
  Muted,
  TextLink,
};
