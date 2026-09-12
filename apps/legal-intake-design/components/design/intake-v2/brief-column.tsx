'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { Brief } from '@/lib/intake/brief';
import { BriefFieldRow } from './brief-field-row';

function percent(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.min(100, (part / total) * 100)}%`;
}

/**
 * The brief: a document, not a card.
 *
 * No border, no rounded corners, no fill. It sits on the page, and the only
 * lines on it are hairlines between fields. The chat is separated from it by a
 * single vertical rule, which the parent owns.
 *
 * Green appears here and nowhere else in the flow. The brief argues that green
 * has to earn its place, and a bar that only moves when the client has actually
 * agreed to something is the one place it does.
 */
export function BriefColumn({
  brief,
  hints,
  progress,
  footer,
  onConfirm,
  onEdit,
}: {
  brief: Brief;
  hints: Record<string, string>;
  progress: { confirmed: number; filled: number; total: number };
  /** Anchored to the bottom of the column: the quote line, or how this works. */
  footer?: ReactNode;
  onConfirm: (key: string) => void;
  onEdit: (key: string, value: string) => void;
}) {
  const t = useTranslations('intake.brief');

  return (
    <section aria-label={t('title')} className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3">
        <h2 className="text-foreground font-serif text-[25px] font-medium tracking-[-0.01em]">
          {brief.title ?? t('title')}
        </h2>

        <div className="flex items-baseline justify-between gap-4">
          <span className="text-muted-foreground text-xs">{t('label')}</span>
          <span className="text-muted-foreground font-mono text-[11.5px]">
            {progress.confirmed} / {progress.total}
          </span>
        </div>

        <div
          className="bg-muted h-[3px] w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={progress.confirmed}
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-label={t('progressLabel')}
        >
          <div
            className="bg-success h-full rounded-full transition-[width] duration-[550ms] ease-out motion-reduce:transition-none"
            style={{ width: percent(progress.confirmed, progress.total) }}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-col">
        {brief.fields.map((field) => (
          <BriefFieldRow
            key={field.key}
            field={field}
            hint={hints[field.key]}
            onConfirm={() => onConfirm(field.key)}
            onEdit={(value) => onEdit(field.key, value)}
          />
        ))}
      </div>

      {/* Pushed to the bottom of the column, so the brief fills its height. */}
      {footer ? <div className="mt-auto pt-8">{footer}</div> : null}
    </section>
  );
}
