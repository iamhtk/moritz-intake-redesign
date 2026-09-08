'use client';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { Landmark } from '@repo/ui/icons';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import { FOUNDATION_ITEMS } from './foundations-nav';

/**
 * Design-library navigation rail, built on the foundation Tabs: a header band,
 * a "Components" section heading, and a vertical tab set whose sliding indicator
 * marks the current page. Each trigger is a real next-intl `Link` (via Tabs
 * `asChild`), and the active tab is driven by the current pathname. Below `sm`
 * the Tabs collapses to its built-in Select dropdown; on md+ it is a sticky
 * vertical rail. No `dark:` variants — the app has no class-based dark mode.
 * Scoped to the foundation playground only.
 */
function WipBadge() {
  return (
    <span className="ml-auto rounded-full border border-current px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide opacity-60">
      WIP
    </span>
  );
}

export function LibrarySidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      aria-label="Design library"
      className="bg-sidebar sticky top-0 z-30 shrink-0 border-b md:h-svh md:w-60 md:self-start md:border-b-0 md:border-r"
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Header band */}
        <div className="flex flex-col p-4 md:border-b md:p-6">
          <div className="flex items-center gap-2">
            <Landmark className="text-foreground size-7 shrink-0" aria-hidden />
            <p className="heading-2">Foundation</p>
          </div>
        </div>

        {/* Body: Select dropdown below sm, vertical tab rail on sm+ */}
        <div className="flex flex-1 flex-col gap-1 p-4 md:overflow-y-auto md:p-6">
          <p className="text-muted-foreground mb-1 hidden px-2 text-xs/6 font-medium md:block">
            Components
          </p>
          <Tabs
            orientation="vertical"
            value={pathname}
            onValueChange={(href) => router.push(href)}
            className="w-full"
          >
            <TabsList className="w-full">
              {FOUNDATION_ITEMS.map((item) => (
                <TabsTrigger key={item.href} value={item.href} asChild>
                  <Link href={item.href}>
                    <span className="truncate">{item.title}</span>
                    {item.wip ? <WipBadge /> : null}
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </nav>
  );
}
