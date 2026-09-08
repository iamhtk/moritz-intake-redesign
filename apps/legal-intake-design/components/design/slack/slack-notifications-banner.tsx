'use client';

import { toast } from 'sonner';
import { Button } from '@/components/design/design-system/button';
import { useSlackConnection } from './slack-connection-context';
import { OpenInSlackButton } from './open-in-slack-button';
import { SlackIcon } from './slack-icon';
import { SLACK_CHANNEL, SLACK_WORKSPACE } from './slack-config';

/**
 * Slack affordance for the notifications page. When connected, it reassures the
 * client that these same updates also land in their Slack channel and offers a
 * jump-back; when not, it prompts them to connect. Notifications are exactly the
 * events mirrored to Slack — nothing is authored or answered from Slack.
 */
export function SlackNotificationsBanner() {
  const { connected, connect } = useSlackConnection();

  const onConnect = () => {
    connect();
    toast.success('Slack connected (mock).', {
      description: `Updates will post to ${SLACK_WORKSPACE} · ${SLACK_CHANNEL}.`,
    });
  };

  return (
    <div className="border-border flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="bg-muted text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <SlackIcon className="size-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">
            {connected
              ? `Also delivered to ${SLACK_CHANNEL} in Slack`
              : 'Get these updates in Slack'}
          </div>
          <div className="text-muted-foreground text-xs">
            {connected
              ? `Posting to ${SLACK_WORKSPACE}. Jump back into Moritz anytime.`
              : 'Connect Slack to mirror case updates to your workspace.'}
          </div>
        </div>
      </div>
      {connected ? (
        <OpenInSlackButton className="sm:self-center" />
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
  );
}
