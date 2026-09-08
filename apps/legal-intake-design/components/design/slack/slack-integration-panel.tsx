'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import { Switch } from '@/components/design/foundations/components/switch';
import { Muted } from '@/components/design/design-system/typography';
import { SlackColorIcon, SlackIcon } from './slack-icon';
import { useSlackConnection } from './slack-connection-context';
import {
  SLACK_CHANNEL,
  SLACK_UPDATE_CATEGORIES,
  SLACK_WORKSPACE,
} from './slack-config';

/**
 * Settings surface for the enterprise Slack integration. Shows the connection
 * state, which workspace/channel updates post to, and the Moritz events that
 * are mirrored to Slack. Everything is a placeholder: "Connect Slack" flips a
 * localStorage boolean and the per-category switches are cosmetic. Moritz stays
 * the source of truth — copy is deliberately about notifications, not chat.
 */
export function SlackIntegrationPanel() {
  const { connected, connect, disconnect } = useSlackConnection();

  const onConnect = () => {
    connect();
    toast.success('Slack connected (mock).', {
      description: `Updates will post to ${SLACK_WORKSPACE} · ${SLACK_CHANNEL}.`,
    });
  };

  const onDisconnect = () => {
    disconnect();
    toast('Slack disconnected (mock).');
  };

  return (
    <div className="space-y-8">
      <div className="bg-muted/30 flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="bg-background ring-border/60 flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1">
            <SlackColorIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              Slack
              {connected ? (
                <span className="text-success inline-flex items-center gap-1 text-xs font-medium">
                  <Check className="size-3.5" aria-hidden="true" />
                  Connected
                </span>
              ) : null}
            </div>
            <Muted>
              {connected
                ? `Posting to ${SLACK_WORKSPACE} · ${SLACK_CHANNEL}`
                : 'Get case updates in your Slack workspace and jump straight back into Moritz.'}
            </Muted>
          </div>
        </div>
        {connected ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            className="sm:self-center"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={onConnect}
            className="sm:self-center"
          >
            <SlackIcon data-icon="inline-start" aria-hidden="true" />
            Connect Slack
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Updates sent to Slack</h3>
          <Muted>
            Notifications only. All legal collaboration and document editing
            stay in Moritz.
          </Muted>
        </div>
        <ul className="-mx-2 space-y-1">
          {SLACK_UPDATE_CATEGORIES.map((category) => (
            <SlackCategoryRow
              key={category.id}
              category={category}
              disabled={!connected}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SlackCategoryRow({
  category,
  disabled,
}: {
  category: (typeof SLACK_UPDATE_CATEGORIES)[number];
  disabled: boolean;
}) {
  const [enabled, setEnabled] = useState(true);
  const Icon = category.icon;

  return (
    <li
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors',
        disabled ? 'opacity-60' : 'hover:bg-muted/40',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="border-border bg-background text-foreground flex size-9 shrink-0 items-center justify-center rounded-xl border">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium leading-tight">
            {category.label}
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs leading-snug">
            {category.description}
          </div>
        </div>
      </div>
      <Switch
        checked={enabled && !disabled}
        disabled={disabled}
        onCheckedChange={setEnabled}
        aria-label={`Send "${category.label}" to Slack`}
      />
    </li>
  );
}
