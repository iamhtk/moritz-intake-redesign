'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Download } from '@repo/ui/icons';

import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/components/button';

/**
 * Attachment — a compact card that previews a file or image, its name, and
 * metadata, with optional actions and an upload lifecycle. Used for files/images
 * in upload lists, chat composers, and message threads. A port of shadcn's
 * `Attachment`; `AttachmentMedia`'s `icon`/`downloadable` props are a local
 * extension beyond that port.
 *
 * Built on the shadcn foundation pattern (`cva` + `Slot`/`asChild` + `data-slot`)
 * to match the rest of the library. The root shares its `state`/`size`/
 * `orientation` with the parts via a small context so:
 * - `AttachmentMedia` can size an icon box vs. a full-width image preview, and
 * - `AttachmentTitle` can switch on the streaming `shimmer` while uploading or
 *   processing (the `shimmer` utility, when present, lives in the app stylesheet).
 *
 * `AttachmentAction` renders `Button` at the `icon-sm` ghost size trimmed to
 * `size-7`. `AttachmentTrigger` is a full-card overlay rendered last so it sits
 * above the static media/content but below the `relative z-10` actions — both
 * stay independently clickable.
 */

type AttachmentState = 'idle' | 'uploading' | 'processing' | 'error' | 'done';
type AttachmentSize = 'default' | 'sm' | 'xs';
type AttachmentOrientation = 'horizontal' | 'vertical';

type AttachmentContextValue = {
  state: AttachmentState;
  size: AttachmentSize;
  orientation: AttachmentOrientation;
};

const AttachmentContext = React.createContext<AttachmentContextValue | null>(
  null,
);

function useAttachmentContext() {
  const context = React.useContext(AttachmentContext);

  if (!context) {
    throw new Error('Attachment parts must be used within an <Attachment>.');
  }

  return context;
}

const attachmentVariants = cva(
  'group/attachment relative isolate flex w-fit overflow-hidden rounded-lg border bg-card text-left text-card-foreground transition-colors',
  {
    variants: {
      size: {
        default: 'gap-3 p-2',
        sm: 'gap-2.5 p-1.5',
        xs: 'gap-2 p-1',
      },
      orientation: {
        horizontal: 'flex-row items-center',
        vertical: 'flex-col items-stretch',
      },
      state: {
        idle: '',
        uploading: '',
        processing: '',
        error: 'border-destructive/50 bg-destructive/5',
        done: '',
      },
    },
    defaultVariants: {
      size: 'default',
      orientation: 'horizontal',
      state: 'done',
    },
  },
);

type AttachmentProps = React.ComponentProps<'div'> &
  VariantProps<typeof attachmentVariants>;

function Attachment({
  className,
  size = 'default',
  orientation = 'horizontal',
  state = 'done',
  ...props
}: AttachmentProps) {
  const context = React.useMemo<AttachmentContextValue>(
    () => ({
      state: state ?? 'done',
      size: size ?? 'default',
      orientation: orientation ?? 'horizontal',
    }),
    [state, size, orientation],
  );

  return (
    <AttachmentContext.Provider value={context}>
      <div
        data-slot="attachment"
        data-state={context.state}
        data-size={context.size}
        data-orientation={context.orientation}
        className={cn(
          attachmentVariants({ size, orientation, state }),
          className,
        )}
        {...props}
      />
    </AttachmentContext.Provider>
  );
}

const ICON_BOX_SIZE: Record<AttachmentSize, string> = {
  default: 'size-10',
  sm: 'size-9',
  xs: 'size-8',
};

type AttachmentMediaProps = React.ComponentProps<'div'> & {
  variant?: 'icon' | 'image';
  icon?: React.ReactNode;
  downloadable?: boolean;
};

const SWAP_GLYPH =
  'absolute inset-0 flex items-center justify-center transition-all duration-150 motion-reduce:transition-none [&>svg]:size-5';

function AttachmentMedia({
  className,
  variant = 'icon',
  icon,
  downloadable = false,
  children,
  ...props
}: AttachmentMediaProps) {
  const { orientation, size } = useAttachmentContext();
  const isImage = variant === 'image';
  const swaps = downloadable && icon != null;

  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(
        'bg-muted text-muted-foreground flex shrink-0 items-center justify-center overflow-hidden rounded-md',
        variant === 'icon' && '[&>svg]:size-5',
        variant === 'icon' && ICON_BOX_SIZE[size],
        isImage && '[&>img]:size-full [&>img]:object-cover',
        isImage &&
          orientation === 'vertical' &&
          'aspect-video w-full rounded-[calc(0.5rem-0.25rem)]',
        isImage && orientation === 'horizontal' && ICON_BOX_SIZE[size],
        swaps && 'relative',
        className,
      )}
      {...props}
    >
      {swaps ? (
        <>
          <span
            className={cn(
              SWAP_GLYPH,
              'group-focus-within/attachment:scale-90 group-focus-within/attachment:opacity-0',
              'group-hover/attachment:scale-90 group-hover/attachment:opacity-0',
            )}
          >
            {icon}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              SWAP_GLYPH,
              'scale-90 opacity-0',
              'group-focus-within/attachment:scale-100 group-focus-within/attachment:opacity-100',
              'group-hover/attachment:scale-100 group-hover/attachment:opacity-100',
            )}
          >
            <Download />
          </span>
        </>
      ) : (
        icon
      )}
      {children}
    </div>
  );
}

function AttachmentContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-content"
      className={cn(
        'flex min-w-0 flex-1 flex-col justify-center gap-0.5',
        className,
      )}
      {...props}
    />
  );
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<'p'>) {
  const { state, size } = useAttachmentContext();
  const isStreaming = state === 'uploading' || state === 'processing';

  return (
    <p
      data-slot="attachment-title"
      className={cn(
        'truncate font-medium',
        size === 'xs' ? 'text-xs' : 'text-sm',
        isStreaming && 'shimmer',
        className,
      )}
      {...props}
    />
  );
}

function AttachmentDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  const { state } = useAttachmentContext();

  return (
    <p
      data-slot="attachment-description"
      className={cn(
        'truncate text-xs',
        state === 'error' ? 'text-destructive' : 'text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function AttachmentActions({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-actions"
      // `relative z-10` raises the actions above the full-card trigger overlay so
      // both stay independently clickable.
      className={cn(
        'relative z-10 flex shrink-0 items-center gap-0.5 self-start',
        className,
      )}
      {...props}
    />
  );
}

type AttachmentActionProps = React.ComponentProps<typeof Button>;

function AttachmentAction({
  className,
  variant = 'ghost',
  size = 'icon-sm',
  ...props
}: AttachmentActionProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'text-muted-foreground not-disabled:hover:text-foreground size-7',
        className,
      )}
      {...props}
    />
  );
}

type AttachmentTriggerProps = React.ComponentProps<'button'> & {
  asChild?: boolean;
};

function AttachmentTrigger({
  className,
  asChild = false,
  type,
  ...props
}: AttachmentTriggerProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="attachment-trigger"
      // Fills the card behind the actions (which raise themselves with `z-10`).
      className={cn(
        'focus-visible:ring-ring/50 absolute inset-0 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-[3px]',
        className,
      )}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        'flex gap-3 overflow-x-auto pb-1',
        'snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        '[&>*]:shrink-0 [&>*]:snap-start',
        // Edge fade so off-screen attachments hint at more content on either side.
        '[mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)]',
        className,
      )}
      {...props}
    />
  );
}

export {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
  AttachmentGroup,
  attachmentVariants,
};
