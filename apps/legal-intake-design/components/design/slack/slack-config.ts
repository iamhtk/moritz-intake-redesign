import { toast } from 'sonner';
import {
  CreditCard,
  FileSignature,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from '@repo/ui/icons';
import type { LucideIcon } from '@repo/ui/icons';

/**
 * Static, demo-only Slack config. There is no real workspace behind this — the
 * names mirror an enterprise (DoorDash) setup so the integration reads
 * convincingly in a demo.
 */
export const SLACK_WORKSPACE = 'DoorDash HQ';
export const SLACK_CHANNEL = '#doordash-legal';

/**
 * The Moritz lifecycle events that post a notification to Slack. These are the
 * same events surfaced in-app on the notifications page — Slack is a mirror of
 * them, never a place where legal work or chat happens.
 */
export type SlackUpdateCategory = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const SLACK_UPDATE_CATEGORIES: readonly SlackUpdateCategory[] = [
  {
    id: 'lawyer-reply',
    label: 'Lawyer replies or needs info',
    description: 'A Moritz lawyer responded or has a question on your case.',
    icon: MessageSquare,
  },
  {
    id: 'ai-draft',
    label: 'AI first draft ready',
    description: 'Moritz has prepared the initial draft for lawyer review.',
    icon: Sparkles,
  },
  {
    id: 'document-ready',
    label: 'Document ready to review or sign',
    description: 'A document is ready for your review or signature.',
    icon: FileSignature,
  },
  {
    id: 'payment',
    label: 'Payment required',
    description: 'A quote is ready to approve or an invoice needs payment.',
    icon: CreditCard,
  },
  {
    id: 'status',
    label: 'Case status changed',
    description: 'Your case moved to a new stage.',
    icon: RefreshCw,
  },
] as const;

/**
 * "Launch Slack" for the demo. Opens Slack in a new tab (never navigates the
 * current one — a `slack://` deep link on the current tab would blank the app
 * or trigger a browser error when the app isn't installed) and confirms with a
 * toast. No real channel routing — this only needs to feel like it jumps to
 * Slack.
 */
export function openSlack(context?: string): void {
  if (typeof window !== 'undefined') {
    window.open('https://slack.com', '_blank', 'noopener,noreferrer');
  }
  toast.success(context ? `Opening ${context} in Slack…` : 'Opening Slack…', {
    description: `${SLACK_WORKSPACE} · ${SLACK_CHANNEL}`,
  });
}
