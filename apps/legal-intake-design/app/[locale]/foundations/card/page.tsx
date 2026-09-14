import type { Metadata } from 'next';
import { Field, FieldLabel } from '@repo/ui/components/field';

import { Button } from '@/components/design/foundations/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/design/foundations/components/card';
import { Input } from '@/components/design/foundations/components/input';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Card · Foundations' };

// Inline SVG placeholder so the media example has no network dependency.
const COVER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23cbd5e1'/%3E%3Cstop offset='1' stop-color='%2394a3b8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='480' height='240' fill='url(%23g)'/%3E%3C/svg%3E";

export default function CardFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Card</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation card, built on the shadcn Card: a bordered surface with
          composable header, title, description, action, content, and footer
          parts. Used across the app for panels, settings sections, and dialogs.
        </p>
      </header>

      <Section
        title="Anatomy"
        description="Every part in one card — a header (title, description, and a top-right action), a body, and a bordered footer with actions."
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account.
            </CardDescription>
            <CardAction>
              <Button variant="link" size="sm">
                Sign up
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="card-email">Email</FieldLabel>
              <Input id="card-email" type="email" placeholder="m@example.com" />
            </Field>
            <Field>
              <FieldLabel htmlFor="card-password">Password</FieldLabel>
              <Input id="card-password" type="password" />
            </Field>
          </CardContent>
          <CardFooter className="border-field flex-col gap-2 border-t">
            <Button className="w-full">Login</Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section
        title="Content only"
        description="A card needs no header — drop straight into CardContent for simple surfaces."
      >
        <Card className="w-full max-w-sm">
          <CardContent>
            <p className="text-sm font-medium">12 active cases</p>
            <p className="text-muted-foreground text-sm">
              3 awaiting your response.
            </p>
          </CardContent>
        </Card>
      </Section>

      <Section
        title="Header action"
        description="Place a control in the top-right of the header with CardAction; it spans both header rows."
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose how you hear about case updates.
            </CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Email and in-app notifications are currently enabled.
            </p>
          </CardContent>
        </Card>
      </Section>

      <Section
        title="Sizes"
        description="Pass size='sm' for a denser surface — spacing and the title size step down, and the change propagates to the header, content, and footer."
      >
        <div className="flex flex-wrap items-start gap-6">
          <Card className="w-full max-w-xs">
            <CardHeader>
              <CardTitle>Default</CardTitle>
              <CardDescription>Standard spacing.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                The default size used across most surfaces.
              </p>
            </CardContent>
          </Card>

          <Card size="sm" className="w-full max-w-xs">
            <CardHeader>
              <CardTitle>Small</CardTitle>
              <CardDescription>Compact spacing.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                The sm size for dense lists and side panels.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section
        title="With media"
        description="An image as the first child sits flush to the top edge with matching corner rounding."
      >
        <Card className="w-full max-w-sm">
          <img
            src={COVER_IMAGE}
            alt="Event cover"
            className="aspect-video w-full object-cover"
          />
          <CardHeader>
            <CardTitle>Design systems meetup</CardTitle>
            <CardDescription>
              A practical talk on component APIs, accessibility, and shipping
              faster.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button size="sm">View event</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section
        title="Destructive (danger zone)"
        description="A destructive-bordered card for irreversible actions — used today via a border-destructive/50 override."
      >
        <Card className="border-destructive/50 w-full max-w-sm">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              These actions are permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="destructive" size="sm">
              Delete account
            </Button>
          </CardFooter>
        </Card>
      </Section>
    </>
  );
}
