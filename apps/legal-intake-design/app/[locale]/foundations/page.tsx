import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/foundations/components/card';
import { FOUNDATION_ITEMS } from '@/components/design/foundations/showcase/foundations-nav';

export const metadata: Metadata = { title: 'Foundations' };

export default function FoundationsIndexPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Design Library</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Foundation components for the Moritz design system. Each component is
          prototyped here before flowing back into the production app. Pick a
          component from the sidebar or a card below.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {FOUNDATION_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="focus-visible:outline-ring rounded-2xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Card className="hover:border-ring/40 h-full transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {item.title}
                  {item.wip ? (
                    <span className="text-muted-foreground rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide">
                      WIP
                    </span>
                  ) : null}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
