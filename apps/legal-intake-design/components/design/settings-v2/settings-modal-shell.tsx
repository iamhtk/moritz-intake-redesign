'use client';

import { type CSSProperties, type ReactNode } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { type LucideIcon } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  Heading,
  Subheading,
} from '@/components/design/foundations/components/heading';
import { useMediaQuery } from './use-media-query';
import { DESKTOP_QUERY } from '@/lib/breakpoints';

export type SettingsTabDefinition = {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  title: string;
  description: string;
  content: ReactNode;
  footer?: ReactNode;
};

type SettingsModalShellProps = {
  tabs: SettingsTabDefinition[];
  activeTabId: string;
  onActiveTabChange: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SharedLayoutProps = SettingsModalShellProps & {
  activeTab: SettingsTabDefinition;
};

export function SettingsModalShell({
  tabs,
  activeTabId,
  onActiveTabChange,
  open,
  onOpenChange,
}: SettingsModalShellProps) {
  // The shared threshold, not a local 640. This used to switch a full page
  // earlier than every other overlay in the app, so a 700px tablet got a
  // centred settings dialog beside a bottom-sheet account menu.
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  if (!activeTab) {
    return null;
  }

  if (isDesktop) {
    return (
      <DesktopDialog
        tabs={tabs}
        activeTab={activeTab}
        activeTabId={activeTabId}
        onActiveTabChange={onActiveTabChange}
        open={open}
        onOpenChange={onOpenChange}
      />
    );
  }

  return (
    <MobileDrawer
      tabs={tabs}
      activeTab={activeTab}
      activeTabId={activeTabId}
      onActiveTabChange={onActiveTabChange}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

function DesktopDialog({
  tabs,
  activeTab,
  activeTabId,
  onActiveTabChange,
  open,
  onOpenChange,
}: SharedLayoutProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={
          {
            '--tw-enter-translate-x': '0',
            '--tw-enter-translate-y': '0',
            '--tw-exit-translate-x': '0',
            '--tw-exit-translate-y': '0',
            width: 'min(72rem, calc(100vw - 4rem))',
            height: 'min(720px, calc(100dvh - 2rem))',
            maxWidth: 'none',
          } as CSSProperties
        }
        className="flex gap-0 overflow-hidden p-0 sm:rounded-xl"
      >
        <div className="flex h-full w-full">
          <aside className="bg-muted/40 w-[220px] shrink-0 border-r px-4 py-6 sm:w-[260px]">
            <div className="space-y-6">
              <div className="px-3">
                <Heading className="text-[2rem]!">Settings</Heading>
              </div>

              <nav className="flex flex-col gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.id === activeTabId;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onActiveTabChange(tab.id)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted-foreground/10 hover:text-foreground',
                      )}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
              <div className="mb-6">
                <DialogTitle asChild>
                  <Subheading variant="sans" className="pr-10">
                    {activeTab.title}
                  </Subheading>
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1 pr-10 text-sm">
                  {activeTab.description}
                </DialogDescription>
              </div>

              {activeTab.content}
            </div>

            {activeTab.footer ? (
              <div className="border-t px-6 py-4 sm:px-8">
                <div className="flex justify-end">{activeTab.footer}</div>
              </div>
            ) : null}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MobileDrawer({
  tabs,
  activeTab,
  activeTabId,
  onActiveTabChange,
  open,
  onOpenChange,
}: SharedLayoutProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent style={{ height: '85dvh' }}>
        <DrawerHeader className="gap-4 pb-2 pt-2 text-left">
          <DrawerTitle className="sr-only">Settings</DrawerTitle>
          <DrawerDescription className="sr-only">
            {activeTab.description}
          </DrawerDescription>

          <div className="-mx-4 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2 pl-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTabId;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onActiveTabChange(tab.id)}
                    className={cn(
                      'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-muted',
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span>{tab.shortLabel}</span>
                  </button>
                );
              })}
              <div aria-hidden className="w-2 shrink-0" />
            </div>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-4 space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {activeTab.title}
            </h2>
            <p className="text-muted-foreground text-sm">
              {activeTab.description}
            </p>
          </div>

          {activeTab.content}
        </div>

        {activeTab.footer ? (
          <DrawerFooter className="border-t pt-3">
            {activeTab.footer}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
