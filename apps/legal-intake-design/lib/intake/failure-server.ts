import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@anthropic-ai/sdk/resources/messages';
import type { FailureKind } from './failure';

/**
 * Classify a thrown error into a kind the client has copy for.
 *
 * Typed SDK classes rather than matching on `err.message`: the messages are
 * provider strings and change without notice, and the whole point of this
 * module is that no provider string reaches the browser.
 *
 * Most specific first, as the SDK's own guidance has it. `AuthenticationError`
 * and `PermissionDeniedError` both mean the deployment is misconfigured and
 * both must not be presented as something the client can retry;
 * `APIConnectionError` covers a request that never got a response at all,
 * which includes the timeout.
 */
export function failureKind(err: unknown): FailureKind {
  if (err instanceof Anthropic.AuthenticationError) return 'unauthorized';
  if (err instanceof Anthropic.PermissionDeniedError) return 'unauthorized';
  if (err instanceof Anthropic.RateLimitError) return 'busy';
  if (err instanceof Anthropic.APIConnectionError) return 'offline';
  if (err instanceof Anthropic.APIError) {
    // 529 is the API's own overloaded status and is not a distinct SDK class.
    if (err.status !== undefined && err.status >= 500) return 'busy';
    return 'unknown';
  }
  return 'unknown';
}

/**
 * The kind implied by how the model stopped, or `null` when it stopped cleanly.
 *
 * Both of these arrive as an HTTP 200 with a body, which is exactly why they
 * need naming: nothing throws, so a route that only wraps its call in a
 * `try` will go on to `JSON.parse` a refusal message or half a JSON object and
 * report "unreadable JSON" — a true statement about the wrong problem.
 *
 * `refusal` is checked before the content is read at all, per the API's rule
 * for it. It carries `stop_details.category`, which is worth logging and is
 * deliberately not sent on: the category is Anthropic's vocabulary, and a
 * client who has just been declined does not need to be told it was "cyber".
 */
export function stopReasonFailure(message: Message): FailureKind | null {
  if (message.stop_reason === 'refusal') return 'refused';
  if (message.stop_reason === 'max_tokens') return 'truncated';
  return null;
}

/**
 * One line in the server log, and the JSON body that goes back.
 *
 * The real message is logged and dropped. `detail` on the body is for a
 * developer reading the network tab, so it names the kind and the route and
 * nothing from the provider; the client reads `kind` and nothing else.
 */
export function failureResponse(
  route: string,
  kind: FailureKind,
  err?: unknown,
): Response {
  const detail = err instanceof Error ? err.message : String(err ?? '');
  console.error(`[${route}] ${kind}${detail ? `: ${detail}` : ''}`);
  return Response.json(
    { kind, error: `${route} failed (${kind})` },
    // 503 for the ones that are about the upstream being unreachable or
    // unwilling, so a proxy or an uptime check reads them as what they are.
    { status: kind === 'unauthorized' || kind === 'busy' ? 503 : 502 },
  );
}

/**
 * The answer when there is no API key, or `null` when there is one.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY EVERY MODEL ROUTE NEEDS THIS AND WHY IT USED TO BE A 500.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `new Anthropic()` throws at construction when `ANTHROPIC_API_KEY` is unset,
 * and in two of the four routes that call sits outside any `try`. So a
 * playground running without a key answered the first message with an
 * unhandled throw, Next turned it into a 500, and the client — which infers a
 * kind from the status — read `>= 500` as `busy` and said "give it a moment and
 * ask again", with a retry button, about a condition that no amount of waiting
 * or retrying will change.
 *
 * `unauthorized` is the kind the flow already has for exactly this, and
 * `isRetryable`'s own comment names the case: offering a retry on it "would be
 * inviting the client to press a button that cannot succeed until somebody sets
 * an environment variable". The kind existed; the check did not.
 *
 * Checked before the client is constructed rather than caught after, because a
 * missing key is a precondition of the route and not a failure of the call —
 * and because catching it would mean a stack trace in the log where one clear
 * sentence belongs.
 *
 * The client-facing copy stays client-facing: it says something at our end is
 * not working and is not theirs to fix, which is true. The sentence naming the
 * variable and the README goes to the server log, which is where the person who
 * can fix it is looking.
 */
export function missingKeyResponse(route: string): Response | null {
  if (process.env.ANTHROPIC_API_KEY) return null;
  return failureResponse(
    route,
    'unauthorized',
    new Error(
      'ANTHROPIC_API_KEY is not set. The playground runs without it — see ' +
        'the "AI mode" section of the README — but every model-backed surface ' +
        'is off until a key is present.',
    ),
  );
}
