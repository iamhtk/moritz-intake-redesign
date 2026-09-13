/**
 * Every way a model call can fail, named for the client rather than for the log.
 *
 * The reason this exists: the three AI routes used to hand `err.message`
 * straight back, and the chat rendered it verbatim under the transcript. So a
 * missing key on the deployment told a client describing a redundancy that
 * "Could not resolve authentication method. Expected either apiKey or
 * authToken to be set", and a rate limit told them about their token bucket.
 * Both are true. Neither is addressed to them, and neither says what to do.
 *
 * So the routes classify the failure into one of these kinds, log the real
 * message server-side, and send the kind. The client owns the sentence, which
 * keeps it in `en.json` with the rest of the copy (D25) and keeps every
 * provider string out of the browser.
 *
 * The kinds are the ones that take *different* sentences, which is the same
 * rule the waits follow (item E). `rateLimited` and `overloaded` are both "come
 * back in a moment" to an engineer and are one line here; `unauthorized` is a
 * fault on our side and has to admit that rather than ask the client to retry
 * something that cannot work.
 */
export type FailureKind =
  /** The request never reached the API. Usually the client's own connection. */
  | 'offline'
  /** No key, or a rejected one. Ours to fix, and retrying will not fix it. */
  | 'unauthorized'
  /** Rate limited or overloaded upstream. Worth trying again shortly. */
  | 'busy'
  /** The model declined to answer (`stop_reason: 'refusal'`). */
  | 'refused'
  /** The reply ran past `max_tokens` and arrived half-written. */
  | 'truncated'
  /** A reply came back, but not in the shape the schema agreed. */
  | 'unreadable'
  /** Anything else, including a bug on our side. */
  | 'unknown';

const KINDS: readonly FailureKind[] = [
  'offline',
  'unauthorized',
  'busy',
  'refused',
  'truncated',
  'unreadable',
  'unknown',
];

/**
 * Whether a value off the wire is a kind we have copy for.
 *
 * The client must never render a kind it does not recognise: an unknown string
 * would resolve to no message and `next-intl` prints the key, so a future
 * server sending `kind: 'quotaExceeded'` would put `intake.error.quotaExceeded`
 * on screen. Anything unrecognised becomes `unknown`, which has a sentence.
 */
export function isFailureKind(value: unknown): value is FailureKind {
  return typeof value === 'string' && KINDS.includes(value as FailureKind);
}

/** The kind carried by a JSON error body, or `unknown` if it carries none. */
export function failureKindOf(body: unknown): FailureKind {
  if (typeof body !== 'object' || body === null) return 'unknown';
  const { kind } = body as Record<string, unknown>;
  return isFailureKind(kind) ? kind : 'unknown';
}

/**
 * The kind for a response that failed, preferring what the route actually said.
 *
 * The routes answer a failure with `{ kind }` (see `failureResponse`), and the
 * streaming clients were throwing that away and inferring a kind from the
 * status instead. That cost the one case the status cannot express: a missing
 * `ANTHROPIC_API_KEY` is reported as `unauthorized` at 503, and 503 infers
 * `busy` — so the client told the reader to "give it a moment and ask again"
 * about a condition no amount of waiting fixes, and offered a retry button,
 * because `busy` is retryable and `unauthorized` is not.
 *
 * Status is still the fallback, and has to be: a proxy, an edge timeout or a
 * cold start answers with a status and a body that is not ours.
 */
export async function failureKindOfResponse(
  response: Response,
): Promise<FailureKind> {
  try {
    const body: unknown = await response.clone().json();
    if (typeof body === 'object' && body !== null && 'kind' in body) {
      const { kind } = body as Record<string, unknown>;
      if (isFailureKind(kind)) return kind;
    }
  } catch {
    // Not JSON, or already consumed. The status is what there is.
  }
  return failureKindOfStatus(response.status);
}

/** The `intake.error.*` key for a kind. One sentence each, no shared fallback. */
export function failureCopyKey(kind: FailureKind): string {
  return `error.${kind}`;
}

/**
 * Whether trying the same thing again could plausibly work.
 *
 * Drives whether a "Try again" appears beside the sentence. Offering it on an
 * `unauthorized` would be inviting the client to press a button that cannot
 * succeed until somebody sets an environment variable, and offering it on a
 * `refused` would be asking them to send the same message and hope.
 *
 * `unreadable` is in, because a schema miss is a re-roll rather than a
 * standing refusal: the same request usually parses on the second attempt.
 * `truncated` is out, because the same request against the same `max_tokens`
 * will run past it again.
 */
export function isRetryable(kind: FailureKind): boolean {
  return (
    kind === 'offline' ||
    kind === 'busy' ||
    kind === 'unreadable' ||
    kind === 'unknown'
  );
}

/**
 * The kind implied by an HTTP status, for a response that never carried one.
 *
 * Needed because not every failure gets as far as a route. A proxy, an edge
 * timeout or a cold start returns its own status with its own body, and
 * `/api/intake` answers a malformed body with a 400 before it opens a stream,
 * so there is no `kind` to read on any of those paths.
 *
 * 401 and 403 are the deployment's own credentials, which is the same fault as
 * `unauthorized` from the route and must not be offered as retryable. A 404 is
 * a route that is not there, which is a build problem rather than a transient
 * one, so it is deliberately not `busy`.
 */
export function failureKindOfStatus(status: number): FailureKind {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429 || status >= 500) return 'busy';
  return 'unknown';
}
