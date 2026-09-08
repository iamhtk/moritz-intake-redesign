/**
 * Shared request/result contracts for the AI-powered case intake, used by both
 * the client fetch wrappers ([ai-intake-client.ts](./ai-intake-client.ts)) and
 * the server proxy ([anthropic-intake.ts](./anthropic-intake.ts)). Pure types
 * only — safe to import from either side without pulling in side effects.
 */

import type { AnswersMap, MatterId } from '../intake-types';

export type AiTranscriptTurn = { role: 'assistant' | 'user'; content: string };

export interface AiTurnRequest {
  /** Matter chosen so far (null before the matter-type pick). */
  matterId: MatterId | null;
  /** Key of the question currently awaiting an answer. */
  awaitedKey: string;
  /** Answers captured so far. */
  answers: AnswersMap;
  /** The client's latest message. */
  userMessage: string;
  /** A few recent turns for context (oldest first). */
  transcript: AiTranscriptTurn[];
}

export interface AiTurnResult {
  /** Matter classification (matter-type step only). null when unclear. */
  matterId?: MatterId | null;
  /** Confidently extracted answers for later questions (validated server-side). */
  extracted?: AnswersMap;
  /** One short, warm sentence acknowledging the client's reply. */
  acknowledgement?: string;
  /** Present when the message was a question/aside rather than an answer. */
  offScript?: { answer: string };
}

export interface AiRecapRequest {
  matterId: MatterId | null;
  answers: AnswersMap;
}

export interface AiRecapResult {
  /** Suggested case name. */
  title?: string;
  /** Lawyer-ready 2-3 sentence brief. */
  description?: string;
  /** Concise one-line summaries of free-text answers, keyed by question key. */
  summaries?: Record<string, string>;
}
