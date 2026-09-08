'use client';

import { type ReactElement, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CircleCheck, RotateCcw, Share2 } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import {
  Alert,
  AlertAction,
  AlertCancel,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
  AlertTrigger,
} from '@/components/design/foundations/components/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { useSlackConnection } from '@/components/design/slack/slack-connection-context';
import { OpenInSlackButton } from '@/components/design/slack/open-in-slack-button';
import { ShareCaseDialog } from '@/components/cases/share-case-dialog';
import type { LegalCase } from '@/lib/types';

/**
 * Case header actions, surfaced as visible labeled buttons instead of a hidden
 * ellipsis menu. Labels collapse to icon-only below the `@md` container width;
 * `aria-label` keeps the collapsed state accessible. Shared across the client,
 * legal, and admin case headers. Playground-only — actions are mocked.
 */
export function CaseHeaderActions({ legalCase }: { legalCase: LegalCase }) {
  const { flags } = useDesignFlags();
  const { connected } = useSlackConnection();
  const showOpenInSlack = Boolean(flags.useSlackIntegration) && connected;
  const [shareOpen, setShareOpen] = useState(false);
  const isClosed = legalCase.status === 'CLOSED';

  // Labels collapse to icon-only below the header's `@md` container width.
  // Tooltips are only useful in that collapsed state (otherwise they just
  // repeat the visible label), so we mirror the same breakpoint via a hidden
  // sentinel — a portaled TooltipContent can't read the `@container` itself.
  const actionsRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [iconOnly, setIconOnly] = useState(false);

  useEffect(() => {
    const el = actionsRef.current;
    const sentinel = sentinelRef.current;
    if (!el || !sentinel) return;
    const check = () => {
      setIconOnly(window.getComputedStyle(sentinel).display === 'none');
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={actionsRef} className="flex shrink-0 items-center gap-0.5">
        {/* Mirrors the label breakpoint: hidden (display:none) exactly when the
            button labels collapse, so `iconOnly` tracks the real state. */}
        <span
          ref={sentinelRef}
          aria-hidden="true"
          className="@md:block hidden"
        />

        {showOpenInSlack && (
          <OpenInSlackButton
            context={legalCase.title}
            variant="ghost"
            size="sm"
            className="@md:inline-flex hidden"
          />
        )}

        <MaybeTooltip enabled={iconOnly} label="Share">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Share"
            onClick={() => setShareOpen(true)}
            className="@max-md:size-8 @max-md:px-0 gap-1.5"
          >
            <Share2 className="size-4" />
            <span className="@md:inline hidden">Share</span>
          </Button>
        </MaybeTooltip>

        {isClosed ? (
          <Alert>
            <MaybeTooltip enabled={iconOnly} label="Reopen case">
              <AlertTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Reopen case"
                  className="@max-md:size-8 @max-md:px-0 gap-1.5"
                >
                  <RotateCcw className="size-4" />
                  <span className="@md:inline hidden">Reopen case</span>
                </Button>
              </AlertTrigger>
            </MaybeTooltip>
            <AlertContent>
              <AlertHeader>
                <AlertTitle>Reopen this case?</AlertTitle>
                <AlertDescription>
                  The case will be moved back to in progress. You can close it
                  again later.
                </AlertDescription>
              </AlertHeader>
              <AlertFooter>
                <AlertCancel>Cancel</AlertCancel>
                <AlertAction
                  onClick={() => toast.success('Case reopened (mock).')}
                >
                  Reopen case
                </AlertAction>
              </AlertFooter>
            </AlertContent>
          </Alert>
        ) : (
          <Alert>
            <MaybeTooltip enabled={iconOnly} label="Close case">
              <AlertTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Close case"
                  className="@max-md:size-8 @max-md:px-0 gap-1.5"
                >
                  <CircleCheck className="size-4" />
                  <span className="@md:inline hidden">Close case</span>
                </Button>
              </AlertTrigger>
            </MaybeTooltip>
            <AlertContent>
              <AlertHeader>
                <AlertTitle>Close this case?</AlertTitle>
                <AlertDescription>
                  The case will be archived. You can reopen it later.
                </AlertDescription>
              </AlertHeader>
              <AlertFooter>
                <AlertCancel>Cancel</AlertCancel>
                <AlertAction
                  onClick={() => toast.success('Case closed (mock).')}
                >
                  Close case
                </AlertAction>
              </AlertFooter>
            </AlertContent>
          </Alert>
        )}
      </div>

      <ShareCaseDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        caseNumber={legalCase.caseNumber}
      />
    </>
  );
}

/**
 * Wraps a trigger in a tooltip only when `enabled` (i.e. the button is
 * collapsed to icon-only). When the label is visible the tooltip would just
 * repeat it, so we render the child unwrapped.
 */
function MaybeTooltip({
  enabled,
  label,
  children,
}: {
  enabled: boolean;
  label: string;
  children: ReactElement;
}) {
  if (!enabled) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
