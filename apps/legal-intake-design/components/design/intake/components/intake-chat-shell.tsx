'use client';

import { type ReactNode, useCallback, useState } from 'react';
import { cn } from '@repo/ui/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/design/foundations/components/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useIntakeProgressPanel,
  useRegisterIntakeProgressPanel,
} from '../intake-progress-panel-context';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/design/foundations/components/message-scroller';

type IntakeChatShellProps = {
  /** Title shown in the header and the docked panel. */
  title: string;
  /** Chat turns (assistant/user bubbles + inline controls) and typing dots. */
  children: ReactNode;
  /** Suggestion pills + composer, pinned under the transcript. */
  footer: ReactNode;
  /** Body rendered inside the docked progress panel. */
  panel: ReactNode;
  /** Optional actions pinned to the bottom of the panel (Sheet/Drawer footer). */
  panelFooter?: ReactNode;
};

/**
 * Layout for the Co-Work-style matter intake: a centred chat column that is
 * pushed left by a docked right-side panel on md+. Owns the progress-panel
 * registration (so the header toggle appears) and the panel chrome; the
 * orchestrator supplies the transcript, composer, and panel body.
 *
 * The panel is intentionally an exception to the modal-Drawer treatment: on
 * desktop it is a non-modal, non-dimmed Sheet docked to the side (portaled into
 * a clipping container so the slide animation stays within the content bounds),
 * and on mobile it is the foundation Drawer, modal and dimmed.
 */
export function IntakeChatShell({
  title,
  children,
  footer,
  panel,
  panelFooter,
}: IntakeChatShellProps) {
  useRegisterIntakeProgressPanel();
  const intakePanel = useIntakeProgressPanel();
  const isPanelOpen = intakePanel?.isOpen ?? true;
  const hasInteracted = intakePanel?.hasInteracted ?? false;
  const isMobile = useIsMobile();
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  const handlePanelOpenChange = useCallback(
    (next: boolean) => {
      intakePanel?.setOpen(next);
    },
    [intakePanel],
  );

  return (
    <div
      className={cn(
        'h-full',
        // On md+ the panel is docked open at all times (no header toggle there),
        // so the content is always inset to make room for it.
        'md:pr-[376px]',
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-6">
        <div className="min-h-0 flex-1">
          <MessageScrollerProvider autoScroll>
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="flex flex-col gap-8 px-2 pb-6 pt-4">
                  {children}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>

        {/* On md+ a negative bottom margin lets the flex-1 transcript grow and
            bleeds the composer into the dashboard wrapper's pb-10 so it anchors
            at the bottom edge like the case detail composer. On phones there is
            no inset frame and the viewport is tighter, so the bleed would push
            the composer under the fold — keep it within main's bottom padding. */}
        <div className="space-y-3 md:-mb-8">{footer}</div>
      </div>

      <div
        ref={setPortalContainer}
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed inset-0 z-40 overflow-hidden [transform:translateZ(0)]',
          // Start below the app header (and the inset gutter) so the docked
          // panel sits beside the content, not over the nav. `--header-height`
          // is supplied by the surrounding layout (sidebar or top-nav chrome).
          // Only the bottom corners need to match the app frame's radius — the
          // container's top sits mid-frame (just below the header), so rounding
          // it there would clip the panel's top edge and break the outline.
          'md:bottom-2 md:left-2 md:right-2 md:top-[calc(var(--header-height,3rem)+0.5rem)] md:rounded-b-xl',
        )}
      />

      {isMobile ? (
        <Drawer
          open={isPanelOpen}
          onOpenChange={handlePanelOpenChange}
          direction="right"
        >
          <DrawerContent className="sm:max-w-md">
            <DrawerHeader>
              <DrawerTitle>{title || 'New matter'}</DrawerTitle>
              <DrawerDescription>
                Track what Moritz has captured so far.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-6">{panel}</div>
            {panelFooter ? <DrawerFooter>{panelFooter}</DrawerFooter> : null}
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open onOpenChange={handlePanelOpenChange} modal={false}>
          <SheetContent
            side="right"
            showOverlay={false}
            showCloseButton={false}
            container={portalContainer}
            className={cn(
              'sm:max-w-md',
              // Docked card treatment matching the foundation Drawer: a hairline
              // outline with the inner edge rounded, so the panel reads as a card
              // whose outline runs the full height. Borders (drawn inside the box)
              // are used instead of a ring so the top/bottom edges — which sit
              // flush with the `overflow-hidden` container — aren't clipped. The
              // right edge hugs the frame, so it carries no border.
              'md:border-foreground/10 md:inset-y-0 md:right-0 md:w-[360px] md:rounded-l-2xl md:border md:border-r-0',
            )}
            style={!hasInteracted ? { animation: 'none' } : undefined}
            onPointerDownOutside={(event) => {
              event.preventDefault();
            }}
            onInteractOutside={(event) => {
              event.preventDefault();
            }}
          >
            <SheetHeader>
              <SheetTitle>{title || 'New matter'}</SheetTitle>
              <SheetDescription>
                Track what Moritz has captured so far.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-6">{panel}</div>
            {panelFooter ? (
              <SheetFooter className="items-start">{panelFooter}</SheetFooter>
            ) : null}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
