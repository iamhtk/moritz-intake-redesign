'use client';

import type { ReactNode } from 'react';

import { AlertTriangle, ArrowLeft, Compass } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { Button } from '@/components/design/foundations/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { Link } from '@/i18n/navigation';

/**
 * The three states every route can be in and none of them had a screen for.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * There were 92 routes in this app and zero `error.tsx`, `not-found.tsx` or
 * `loading.tsx` files. So a slow fetch was a blank page, a mistyped case id
 * was Next's own 404, and anything that threw was the grey "Application
 * error" screen — which carries no branding, no explanation and, worst of the
 * three, **no way back**. A person who hits it has to know to edit the URL.
 *
 * One component behind all three so they cannot drift into three different
 * apologies. Written in plain English rather than through `next-intl`
 * deliberately: an error boundary is the one place that must still render
 * when something upstream is broken, and reaching for a translation provider
 * there is reaching for a thing that might be the reason you are here.
 *
 * Every state offers a way out. That is the whole brief: the screen may be
 * unable to do its job, but it must never be a dead end.
 */
export function RouteState({
  icon,
  title,
  description,
  actions,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[60vh] w-full items-center justify-center px-4 py-10',
        className,
      )}
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="ring">{icon}</EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {actions ? (
          <EmptyContent className="flex flex-row flex-wrap items-center justify-center gap-2">
            {actions}
          </EmptyContent>
        ) : null}
      </Empty>
    </div>
  );
}

/**
 * Something threw.
 *
 * `reset` is offered first and framed as *Try again* rather than *Reload*,
 * because it re-renders the segment without a full page load — which is the
 * difference between losing the rest of the app and losing one panel. The way
 * home is second, for the case where trying again keeps failing.
 *
 * The digest is printed, small and muted. Nobody reading it knows what it
 * means, and that is fine: it is the string that makes a bug report findable
 * in the logs, and asking somebody to describe "the error" without it is
 * asking them to do worse work than a copy-paste.
 */
export function RouteError({
  error,
  reset,
  homeHref = '/',
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
}) {
  return (
    <RouteState
      icon={<AlertTriangle aria-hidden />}
      title="Something went wrong"
      description="This screen could not be shown. Nothing you have sent has been lost — it is safe to try again."
      actions={
        <>
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href={homeHref}>
              <ArrowLeft data-icon="inline-start" aria-hidden />
              Back to home
            </Link>
          </Button>
          {error.digest ? (
            <p className="text-muted-foreground/70 w-full pt-2 text-center font-mono text-[11px]">
              {error.digest}
            </p>
          ) : null}
        </>
      }
    />
  );
}

/** No such page, or no such record. */
export function RouteNotFound({ homeHref = '/' }: { homeHref?: string }) {
  return (
    <RouteState
      icon={<Compass aria-hidden />}
      title="Page not found"
      description="This address does not point at anything. It may have moved, or the link that brought you here may be out of date."
      actions={
        <Button asChild>
          <Link href={homeHref}>
            <ArrowLeft data-icon="inline-start" aria-hidden />
            Back to home
          </Link>
        </Button>
      }
    />
  );
}

/**
 * Waiting.
 *
 * A spinner and one line, centred, rather than a skeleton of the page that is
 * coming. A skeleton is the better pattern when the shape is known and
 * stable; these routes range from a two-column intake to a wide admin table,
 * and a skeleton that guesses wrong reads as the page loading incorrectly and
 * then jumping.
 *
 * `role="status"` so the wait is announced rather than only drawn.
 */
export function RouteLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 px-4 py-10"
    >
      <Spinner className="text-muted-foreground size-5" />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
