import type { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import { H3, Muted } from '@/components/design/design-system/typography';

export const metadata: Metadata = { title: 'Sentry test' };

export default function SentryTestPage() {
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Sentry Test</h1>
        </H3>
        <Muted>
          Playground replica of the admin Sentry error testing page. Buttons are
          decorative — no errors are actually triggered in the design app.
        </Muted>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Sentry Error Testing</CardTitle>
          <CardDescription>
            Test client-side and server-side error capturing in Sentry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Client-Side Error Test</h3>
            <p className="text-muted-foreground text-sm">
              Trigger an error in the browser with a stack trace.
            </p>
            <Button variant="destructive" disabled>
              Trigger Client Error
            </Button>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Server-Side Error Tests</h3>
            <p className="text-muted-foreground text-sm">
              Test error capturing from API routes.
            </p>
            <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
              <Button variant="destructive" disabled>
                Trigger Server Error (React Query)
              </Button>
              <Button variant="destructive" disabled>
                Trigger Server Error (Fetch)
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Database Error Test</h3>
            <p className="text-muted-foreground text-sm">
              Triggers a Postgres foreign-key violation to verify SQLSTATE
              surfaces on traces and logs.
            </p>
            <Button variant="destructive" disabled>
              Trigger DB Error
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
