'use client';

import { Field, FieldLabel } from '@repo/ui/components/field';

import { Button } from '@/components/design/foundations/components/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/design/foundations/components/dialog';
import { Input } from '@/components/design/foundations/components/input';
import { DialogFromDropdownExample } from '@/components/design/foundations/examples/dialog-examples';
import { Section } from '@/components/design/foundations/showcase/section';

export default function DialogFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Dialog</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation dialog, built on the shadcn Dialog: title, description,
          body, footer actions, sizes, and a mobile bottom-sheet treatment.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Compose DialogTitle, DialogDescription, DialogBody, and DialogFooter to build a dialog."
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Refund payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund payment</DialogTitle>
              <DialogDescription>
                The refund will be reflected in the customer&rsquo;s bank
                account 2 to 3 business days after processing.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field>
                <FieldLabel htmlFor="basic-amount">Amount</FieldLabel>
                <Input id="basic-amount" name="amount" placeholder="$0.00" />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Refund</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section
        title="Dialog width"
        description="The size prop (xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl — default lg) controls the max-width of the dialog on larger screens."
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Extra small (xs)</Button>
          </DialogTrigger>
          <DialogContent size="xs">
            <DialogHeader>
              <DialogTitle>Refund payment</DialogTitle>
              <DialogDescription>
                The customer will be notified by email.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field>
                <FieldLabel htmlFor="xs-amount">Amount</FieldLabel>
                <Input id="xs-amount" name="amount" placeholder="$0.00" />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Refund</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Extra large (xl)</Button>
          </DialogTrigger>
          <DialogContent size="xl">
            <DialogHeader>
              <DialogTitle>Refund payment</DialogTitle>
              <DialogDescription>
                The refund will be reflected in the customer&rsquo;s bank
                account 2 to 3 business days after processing.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field>
                <FieldLabel htmlFor="xl-amount">Amount</FieldLabel>
                <Input id="xl-amount" name="amount" placeholder="$0.00" />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Refund</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section
        title="Opening from dropdown"
        description="When opening a dialog from a dropdown menu, render the dialog as a sibling of the dropdown (controlled with open / onOpenChange) so it isn't unmounted when the menu closes."
      >
        <DialogFromDropdownExample />
      </Section>

      <Section
        title="Auto-focusing elements"
        description="Add autoFocus to any form control or button to focus it when the dialog opens. (Elements aren't auto-focused on touch devices, to avoid the keyboard shifting the layout.)"
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Refund payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund payment</DialogTitle>
              <DialogDescription>
                The refund will be reflected in the customer&rsquo;s bank
                account 2 to 3 business days after processing.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field>
                <FieldLabel htmlFor="autofocus-amount">Amount</FieldLabel>
                <Input
                  autoFocus
                  id="autofocus-amount"
                  name="amount"
                  placeholder="$0.00"
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Refund</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section
        title="With scrolling content"
        description="Dialogs automatically become scrollable when their content is taller than the viewport — the whole panel scrolls within the page."
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Agree to terms</Button>
          </DialogTrigger>
          <DialogContent size="xl">
            <DialogHeader>
              <DialogTitle>Terms and conditions</DialogTitle>
              <DialogDescription>
                Please agree to the following terms and conditions to continue.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="text-muted-foreground space-y-4 text-sm">
                {Array.from({ length: 12 }).map((_, index) => (
                  <p key={index}>
                    {index + 1}. By accessing and using our services, you are
                    agreeing to these terms, which have been meticulously
                    tailored for our benefit and your compliance. Your continued
                    use acts as a silent nod of agreement to any and all
                    stipulations outlined herein.
                  </p>
                ))}
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>I agree</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>
    </>
  );
}
