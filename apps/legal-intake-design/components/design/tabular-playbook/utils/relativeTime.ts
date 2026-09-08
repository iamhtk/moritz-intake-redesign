/** Below this a count of minutes reads odd, so the label stays vague. */
const JUST_NOW_SECONDS = 45;

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

const relativeTimeFormat = new Intl.RelativeTimeFormat('en-US', {
  numeric: 'auto',
});

const absoluteFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * "just now", "2 minutes ago", "yesterday", "3 days ago" — the reading used
 * wherever the playbook says when something last happened.
 */
export function formatRelativeTime(date: Date, now: number = Date.now()) {
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  for (const [unit, secondsInUnit] of UNITS) {
    if (seconds >= secondsInUnit) {
      return relativeTimeFormat.format(
        -Math.floor(seconds / secondsInUnit),
        unit,
      );
    }
  }
  return seconds < JUST_NOW_SECONDS ? 'just now' : 'a moment ago';
}

/** The full reading, for the tooltip behind a relative one. */
export function formatAbsoluteTime(date: Date) {
  return absoluteFormat.format(date);
}
