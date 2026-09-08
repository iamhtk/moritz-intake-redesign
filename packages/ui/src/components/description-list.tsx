import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

/**
 * Description List — a key/value list built on native `dl`/`dt`/`dd`. It
 * stacks to a single column on small screens and splits into a
 * `term | details` grid from `sm` up, with hairline row separators. Promoted
 * from the design playground's foundation Description List (its
 * `TODO(@repo/ui)`).
 */
function DescriptionList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dl'>) {
  return (
    <dl
      data-slot="description-list"
      {...props}
      className={cn(
        'grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,--spacing(80))_auto] sm:text-sm/6',
        className,
      )}
    />
  );
}

function DescriptionTerm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dt'>) {
  return (
    <dt
      data-slot="description-term"
      {...props}
      className={cn(
        'text-muted-foreground border-border col-start-1 border-t pt-3 first:border-none sm:border-t sm:py-3',
        className,
      )}
    />
  );
}

function DescriptionDetails({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <dd
      data-slot="description-details"
      {...props}
      className={cn(
        'text-foreground border-border sm:nth-2:border-none pb-3 pt-1 sm:border-t sm:py-3',
        className,
      )}
    />
  );
}

export { DescriptionList, DescriptionTerm, DescriptionDetails };
