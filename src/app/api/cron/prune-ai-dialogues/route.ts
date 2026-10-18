import { NextRequest } from 'next/server';
import { AI_DIALOGUE_RETENTION_DAYS, pruneDialogues } from '@/lib/ai/dialogueLog';

/**
 * Retention for assistant transcripts.
 *
 * The log in `dialogueLog.ts` keeps what visitors typed, so it cannot be
 * allowed to accumulate for ever: this deletes every conversation untouched for
 * `AI_DIALOGUE_RETENTION_DAYS`, which is the period the privacy policy states.
 * Runs daily from `vercel.json`, 500 documents per run — a backlog clears over
 * a few nights rather than in one mutation the size of a dataset.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Vercel cron sends Authorization: Bearer <CRON_SECRET>. Optional ?secret= for manual runs. */
function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${cronSecret}`) return true;
  const secret = new URL(request.url).searchParams.get('secret');
  return secret === cronSecret;
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { deleted } = await pruneDialogues();
    return Response.json({ ok: true, deleted, retentionDays: AI_DIALOGUE_RETENTION_DAYS });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Prune failed';
    return Response.json({ error: 'Prune failed', detail }, { status: 500 });
  }
}
