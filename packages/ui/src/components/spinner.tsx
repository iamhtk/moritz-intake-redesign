import * as React from 'react';

import { Loader2 } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/**
 * Spinner — a spinning loader icon used inline to signal in-progress work
 * (e.g. an uploading Attachment, a streaming Marker, or a busy Button).
 * Promoted from the design playground's foundation Spinner (its
 * `TODO(@repo/ui)`).
 *
 * Renders a lucide `Loader2` with `animate-spin`, `role="status"`, and an
 * `aria-label` ("Loading" by default) so the busy state is announced.
 * Defaults to `size-4` and `currentColor`, so it inherits text size/color
 * from its container; override either through `className`.
 */
function Spinner({
  className,
  'aria-label': ariaLabel = 'Loading',
  ...props
}: React.ComponentProps<typeof Loader2>) {
  return (
    <Loader2
      role="status"
      aria-label={ariaLabel}
      data-slot="spinner"
      className={cn('size-4 shrink-0 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
