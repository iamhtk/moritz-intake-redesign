'use client';

import {
  Button,
  buttonVariants,
} from '@/components/design/foundations/components/button';
import {
  Alert,
  AlertAction,
  AlertBody,
  AlertCancel,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
  AlertTrigger,
} from '@/components/design/foundations/components/alert';
import { Input } from '@/components/design/foundations/components/input';
import { Section } from '@/components/design/foundations/showcase/section';

export default function AlertFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Alert</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation alert, built on the shadcn Alert Dialog: a modal
          confirmation with title, description, body, sizes, and cancel and
          confirm actions.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Compose AlertTitle, AlertDescription, and AlertFooter with a cancel and a confirm action."
      >
        <Alert>
          <AlertTrigger asChild>
            <Button variant="outline">Refund payment</Button>
          </AlertTrigger>
          <AlertContent>
            <AlertHeader>
              <AlertTitle>
                Are you sure you want to refund this payment?
              </AlertTitle>
              <AlertDescription>
                The refund will be reflected in the customer&rsquo;s bank
                account 2 to 3 business days after processing.
              </AlertDescription>
            </AlertHeader>
            <AlertFooter>
              <AlertCancel>Cancel</AlertCancel>
              <AlertAction>Refund</AlertAction>
            </AlertFooter>
          </AlertContent>
        </Alert>
      </Section>

      <Section
        title="Destructive confirmation"
        description="Use a destructive trigger and confirm action for irreversible, dangerous actions."
      >
        <Alert>
          <AlertTrigger asChild>
            <Button variant="destructive">Delete account</Button>
          </AlertTrigger>
          <AlertContent>
            <AlertHeader>
              <AlertTitle>Delete your account?</AlertTitle>
              <AlertDescription>
                This permanently deletes your account and removes your data from
                our servers. This action cannot be undone.
              </AlertDescription>
            </AlertHeader>
            <AlertFooter>
              <AlertCancel>Cancel</AlertCancel>
              <AlertAction
                className={buttonVariants({ variant: 'destructive' })}
              >
                Delete account
              </AlertAction>
            </AlertFooter>
          </AlertContent>
        </Alert>
      </Section>

      <Section
        title="With a body"
        description="Add AlertBody for supporting content (e.g. a form control) between the description and the actions. Add autoFocus to any control to focus it when the dialog opens."
      >
        <Alert>
          <AlertTrigger asChild>
            <Button variant="outline">Delete repository</Button>
          </AlertTrigger>
          <AlertContent size="sm">
            <AlertHeader>
              <AlertTitle>Verification required</AlertTitle>
              <AlertDescription>
                To continue, please enter your password.
              </AlertDescription>
            </AlertHeader>
            <AlertBody>
              <Input
                autoFocus
                name="password"
                type="password"
                aria-label="Password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              />
            </AlertBody>
            <AlertFooter>
              <AlertCancel>Cancel</AlertCancel>
              <AlertAction>Continue</AlertAction>
            </AlertFooter>
          </AlertContent>
        </Alert>
      </Section>

      <Section
        title="Width"
        description="The size prop (xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl — default md) caps the panel width on larger screens."
      >
        <Alert>
          <AlertTrigger asChild>
            <Button variant="outline">Extra small (xs)</Button>
          </AlertTrigger>
          <AlertContent size="xs">
            <AlertHeader>
              <AlertTitle>Refund this payment?</AlertTitle>
              <AlertDescription>
                The customer will be notified by email.
              </AlertDescription>
            </AlertHeader>
            <AlertFooter>
              <AlertCancel>Cancel</AlertCancel>
              <AlertAction>Refund</AlertAction>
            </AlertFooter>
          </AlertContent>
        </Alert>

        <Alert>
          <AlertTrigger asChild>
            <Button variant="outline">Large (lg)</Button>
          </AlertTrigger>
          <AlertContent size="lg">
            <AlertHeader>
              <AlertTitle>Refund this payment?</AlertTitle>
              <AlertDescription>
                The refund will be reflected in the customer&rsquo;s bank
                account 2 to 3 business days after processing.
              </AlertDescription>
            </AlertHeader>
            <AlertFooter>
              <AlertCancel>Cancel</AlertCancel>
              <AlertAction>Refund</AlertAction>
            </AlertFooter>
          </AlertContent>
        </Alert>

        <Alert>
          <AlertTrigger asChild>
            <Button variant="outline">Extra large (2xl)</Button>
          </AlertTrigger>
          <AlertContent size="2xl">
            <AlertHeader>
              <AlertTitle>Refund this payment?</AlertTitle>
              <AlertDescription>
                The refund will be reflected in the customer&rsquo;s bank
                account 2 to 3 business days after processing.
              </AlertDescription>
            </AlertHeader>
            <AlertFooter>
              <AlertCancel>Cancel</AlertCancel>
              <AlertAction>Refund</AlertAction>
            </AlertFooter>
          </AlertContent>
        </Alert>
      </Section>

      <Section
        title="Long content"
        description="When the body is taller than the viewport, the panel caps at the screen height and the body scrolls on its own — the title and actions stay pinned and on-screen."
      >
        <Alert>
          <AlertTrigger asChild>
            <Button variant="outline">Review terms</Button>
          </AlertTrigger>
          <AlertContent>
            <AlertHeader>
              <AlertTitle>Accept the updated terms?</AlertTitle>
              <AlertDescription>
                Please review the full agreement before continuing.
              </AlertDescription>
            </AlertHeader>
            <AlertBody>
              <div className="text-muted-foreground space-y-3 text-sm">
                {Array.from({ length: 12 }).map((_, index) => (
                  <p key={index}>
                    {index + 1}. Lorem ipsum dolor sit amet, consectetur
                    adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis
                    nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                    commodo consequat.
                  </p>
                ))}
              </div>
            </AlertBody>
            <AlertFooter>
              <AlertCancel>Decline</AlertCancel>
              <AlertAction>Accept</AlertAction>
            </AlertFooter>
          </AlertContent>
        </Alert>
      </Section>
    </>
  );
}
