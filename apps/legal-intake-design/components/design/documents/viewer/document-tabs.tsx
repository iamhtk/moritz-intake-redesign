'use client';

import { useTranslations } from 'next-intl';

import { FileText, Image as ImageIcon, Mail, X } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import type { IntakeDocument } from './types';

/**
 * One tab per document, the way the reference viewers do it.
 *
 * Tabs rather than a dropdown because the set is small and bounded — the
 * intake accepts five files — and because comparing two documents is the
 * normal reason to have both open. A dropdown makes that a two-click round
 * trip each way; tabs make it one click and keep the other name in sight,
 * which is what a client moving between an agreement and its order form is
 * actually doing.
 *
 * Every tab carries its own ×. Closing a document is not the same act as
 * putting the panel away, and the panel's own × does the second one.
 */
export function DocumentTabs({
  tabs,
  activeId,
  onSelect,
  onClose,
}: {
  tabs: readonly IntakeDocument[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const t = useTranslations('intake.documents');

  // One document is not a set, and a lone tab with a × beside a panel that
  // already has one reads as two ways to do the same thing.
  if (tabs.length < 2) return null;

  return (
    <div
      role="tablist"
      aria-label={t('tabsLabel')}
      className="border-border mz-scrollbar-on-scroll flex shrink-0 gap-1 overflow-x-auto border-b px-2 pb-1.5"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const Icon =
          tab.kind === 'reader'
            ? Mail
            : tab.kind === 'pdf'
              ? FileText
              : ImageIcon;

        return (
          <div
            key={tab.id}
            className={cn(
              'group/tab flex min-w-0 max-w-[13rem] shrink-0 items-center gap-1.5 rounded-[0.5rem] px-2 py-1.5 text-[12.5px] transition-colors',
              active
                ? 'bg-foreground/[0.06] text-foreground'
                : 'text-muted-foreground hover:bg-foreground/[0.03]',
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(tab.id)}
              className="flex min-w-0 cursor-pointer items-center gap-1.5"
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{tab.name}</span>
            </button>
            <button
              type="button"
              aria-label={t('closeTab', { name: tab.name })}
              onClick={() => onClose(tab.id)}
              /*
               * Always there, not revealed on hover. A × that appears under the
               * pointer is a control a client has to discover twice, and on a
               * touch screen there is no hover to discover it with.
               */
              className="text-muted-foreground hover:text-foreground hover:bg-foreground/10 -me-0.5 shrink-0 cursor-pointer rounded-[0.5rem] p-0.5 transition-colors"
            >
              <X className="size-3" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
