import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Alert,
  AlertAction,
  AlertCancel,
  AlertContent,
  AlertHeader,
  AlertTitle,
  AlertTrigger,
} from '../alert.js';

/**
 * Focus on close.
 *
 * Radix's modal Content restores focus to its trigger and calls preventDefault
 * while doing it, so a controlled Alert with no `AlertTrigger` used to leave
 * the reader on document.body. Both shapes are pinned because both are in use,
 * and the controlled one is the easier shape to reach for.
 */
describe('AlertContent focus restoration', () => {
  it('returns focus to the control that opened a controlled alert', async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Discard
          </button>
          <Alert open={open} onOpenChange={setOpen}>
            <AlertContent>
              <AlertHeader>
                <AlertTitle>Discard this?</AlertTitle>
              </AlertHeader>
              <AlertCancel>Keep</AlertCancel>
            </AlertContent>
          </Alert>
        </>
      );
    }

    render(<Controlled />);
    const opener = screen.getByRole('button', { name: 'Discard' });
    opener.focus();
    fireEvent.click(opener);

    fireEvent.click(await screen.findByRole('button', { name: 'Keep' }));

    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('still returns focus to an AlertTrigger, as Radix would have', async () => {
    render(
      <Alert>
        <AlertTrigger asChild>
          <button type="button">Open</button>
        </AlertTrigger>
        <AlertContent>
          <AlertHeader>
            <AlertTitle>Sure?</AlertTitle>
          </AlertHeader>
          <AlertCancel>Keep</AlertCancel>
        </AlertContent>
      </Alert>,
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.click(await screen.findByRole('button', { name: 'Keep' }));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('leaves focus alone when the caller places it themselves', async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <button type="button" data-testid="elsewhere">
            Elsewhere
          </button>
          <Alert open={open} onOpenChange={setOpen}>
            <AlertContent
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                screen.getByTestId('elsewhere').focus();
              }}
            >
              <AlertHeader>
                <AlertTitle>Sure?</AlertTitle>
              </AlertHeader>
              <AlertAction>Go</AlertAction>
            </AlertContent>
          </Alert>
        </>
      );
    }

    render(<Controlled />);
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    fireEvent.click(opener);

    fireEvent.click(await screen.findByRole('button', { name: 'Go' }));

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId('elsewhere')),
    );
  });
});
