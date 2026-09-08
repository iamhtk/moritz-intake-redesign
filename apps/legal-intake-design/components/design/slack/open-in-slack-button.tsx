'use client';

import { Button } from '@/components/design/design-system/button';
import { DropdownMenuItem } from '@/components/design/foundations/components/dropdown-menu';
import { SlackIcon } from './slack-icon';
import { openSlack } from './slack-config';

type OpenInSlackButtonProps = {
  /** Human label for the thing being opened, e.g. a case title. */
  context?: string;
  label?: string;
  variant?: 'outline' | 'ghost' | 'link' | 'secondary' | 'default';
  size?: 'sm' | 'default';
  className?: string;
};

/**
 * "Open in Slack" affordance — the jump-*to*-Slack direction. Placeholder only:
 * launches the Slack app / slack.com and toasts. No channel routing.
 */
export function OpenInSlackButton({
  context,
  label = 'Open in Slack',
  variant = 'outline',
  size = 'sm',
  className,
}: OpenInSlackButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => openSlack(context)}
    >
      <SlackIcon data-icon="inline-start" aria-hidden="true" />
      {label}
    </Button>
  );
}

/** Dropdown-menu variant, for the case actions menu. */
export function OpenInSlackMenuItem({ context }: { context?: string }) {
  return (
    <DropdownMenuItem onSelect={() => openSlack(context)}>
      <SlackIcon className="h-4 w-4" />
      Open in Slack
    </DropdownMenuItem>
  );
}
