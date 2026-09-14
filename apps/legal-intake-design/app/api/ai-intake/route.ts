import {
  runRecap,
  runTurn,
} from '@/components/design/new-case/ai/anthropic-intake';
import type {
  AiRecapRequest,
  AiTurnRequest,
} from '@/components/design/new-case/ai/types';

// Server-only proxy so the shared ANTHROPIC_API_KEY never reaches the browser.
// Playground is stubbed (no persistence), so there is no audit-log surface.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/*
 * Vercel ends a function at its plan's default limit, which is shorter than
 * a turn with thinking can take, and a function ended mid-stream reaches the
 * client as a reply that stops. 60s is the ceiling every plan allows.
 */
export const maxDuration = 60;

type TurnBody = { task: 'turn' } & AiTurnRequest;
type RecapBody = { task: 'recap' } & AiRecapRequest;
type Body = TurnBody | RecapBody;

export async function POST(request: Request): Promise<Response> {
  // No key configured -> signal unavailable; the client falls back to the script.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false });
  }

  try {
    if (body.task === 'turn') {
      const result = await runTurn(body);
      return Response.json(result ? { ok: true, result } : { ok: false });
    }
    if (body.task === 'recap') {
      const result = await runRecap(body);
      return Response.json(result ? { ok: true, result } : { ok: false });
    }
    return Response.json({ ok: false });
  } catch {
    return Response.json({ ok: false });
  }
}
