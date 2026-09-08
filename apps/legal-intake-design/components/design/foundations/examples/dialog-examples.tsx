'use client';

import * as React from 'react';
import { ChevronDown } from '@repo/ui/icons';
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
} from '@/components/design/foundations/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import { Input } from '@/components/design/foundations/components/input';

/**
 * Stateful dialog demos used by the foundation showcase page. The
 * "opening from dropdown" pattern requires a controlled dialog (`open` /
 * `onOpenChange`) rendered as a sibling of — not inside — the dropdown, so it
 * lives here as a client component while the showcase page itself can stay a
 * server component.
 */
export function DialogFromDropdownExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Options
            <ChevronDown data-icon="inline-end" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40">
          <DropdownMenuItem onSelect={() => setIsOpen(true)}>
            Refund
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Download</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund payment</DialogTitle>
            <DialogDescription>
              The refund will be reflected in the customer&rsquo;s bank account
              2 to 3 business days after processing.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="dropdown-refund-amount">Amount</FieldLabel>
              <Input
                id="dropdown-refund-amount"
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
    </>
  );
}
