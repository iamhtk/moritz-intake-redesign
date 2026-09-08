import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@repo/ui/lib/utils';

type AsChildProps = { asChild?: boolean };

function H1({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'h1'> & AsChildProps) {
  const Comp = asChild ? Slot : 'h1';
  return (
    <Comp
      data-slot="typography-h1"
      className={cn(
        'scroll-m-20 text-balance text-center text-4xl font-extrabold tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function H2({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'h2'> & AsChildProps) {
  const Comp = asChild ? Slot : 'h2';
  return (
    <Comp
      data-slot="typography-h2"
      className={cn(
        'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        className,
      )}
      {...props}
    />
  );
}

function H3({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'h3'> & AsChildProps) {
  const Comp = asChild ? Slot : 'h3';
  return (
    <Comp
      data-slot="typography-h3"
      className={cn(
        'scroll-m-20 text-2xl font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function H4({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'h4'> & AsChildProps) {
  const Comp = asChild ? Slot : 'h4';
  return (
    <Comp
      data-slot="typography-h4"
      className={cn(
        'scroll-m-20 text-xl font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function P({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'p'> & AsChildProps) {
  const Comp = asChild ? Slot : 'p';
  return (
    <Comp
      data-slot="typography-p"
      className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}
      {...props}
    />
  );
}

function Blockquote({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'blockquote'> & AsChildProps) {
  const Comp = asChild ? Slot : 'blockquote';
  return (
    <Comp
      data-slot="typography-blockquote"
      className={cn('mt-6 border-l-2 pl-6 italic', className)}
      {...props}
    />
  );
}

function InlineCode({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'code'> & AsChildProps) {
  const Comp = asChild ? Slot : 'code';
  return (
    <Comp
      data-slot="typography-inline-code"
      className={cn(
        'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        className,
      )}
      {...props}
    />
  );
}

function Lead({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'p'> & AsChildProps) {
  const Comp = asChild ? Slot : 'p';
  return (
    <Comp
      data-slot="typography-lead"
      className={cn('text-muted-foreground text-xl', className)}
      {...props}
    />
  );
}

function Large({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & AsChildProps) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-slot="typography-large"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  );
}

function Small({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'small'> & AsChildProps) {
  const Comp = asChild ? Slot : 'small';
  return (
    <Comp
      data-slot="typography-small"
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    />
  );
}

function Muted({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'p'> & AsChildProps) {
  const Comp = asChild ? Slot : 'p';
  return (
    <Comp
      data-slot="typography-muted"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export { H1, H2, H3, H4, P, Blockquote, InlineCode, Lead, Large, Small, Muted };
