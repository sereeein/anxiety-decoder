// app/api/sessions/[id]/feedback/route.ts
import { NextResponse } from 'next/server';
import { saveReturnFeedback, type FeedbackEmoji } from '@/lib/db/returnFeedback';
import { setStatus } from '@/lib/db/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: FeedbackEmoji[] = ['🙂', '😐', '😣'];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { emoji, oneLiner } = body as { emoji?: string; oneLiner?: string };
  if (!emoji || !VALID.includes(emoji as FeedbackEmoji)) {
    return NextResponse.json({ error: 'invalid emoji' }, { status: 400 });
  }
  const safeOneLiner =
    typeof oneLiner === 'string' && oneLiner.trim().length > 0 ? oneLiner.trim() : null;

  await saveReturnFeedback({
    sessionId: id,
    emoji: emoji as FeedbackEmoji,
    oneLiner: safeOneLiner,
  });
  await setStatus(id, 'completed');

  return NextResponse.json({ ok: true });
}
