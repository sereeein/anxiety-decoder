// app/api/sessions/[id]/decode/route.ts
import { NextResponse } from 'next/server';
import { getSession, markDecoded } from '@/lib/db/sessions';
import { insertWorryItems } from '@/lib/db/worryItems';
import { createVerification } from '@/lib/db/verifications';
import { callClassifyAndCompose } from '@/lib/core/decodeEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_DELAY_DAYS = 3;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Optional body: { delayDays?: number } (1-7). Falls back to default.
  let delayDays = DEFAULT_DELAY_DAYS;
  try {
    const body = (await req.json()) as { delayDays?: number };
    if (typeof body.delayDays === 'number' && body.delayDays >= 1 && body.delayDays <= 7) {
      delayDays = body.delayDays;
    }
  } catch {
    // no body is fine
  }

  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }
  if (!session.state) {
    return NextResponse.json({ error: 'session has no state' }, { status: 409 });
  }
  if (session.status !== 'conversing' && session.status !== 'draft') {
    return NextResponse.json({ error: `cannot decode in status ${session.status}` }, { status: 409 });
  }

  const out = await callClassifyAndCompose(session.state, session.conversation);

  await markDecoded({
    id,
    primaryAction: out.primary_action,
    cardHeadline: out.headline,
  });
  const inserted = await insertWorryItems(id, out.worries);

  // Schedule verifications for every catastrophic worry.
  const scheduledFor = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);
  await Promise.all(
    inserted
      .filter((w) => w.category === 'catastrophic')
      .map((w) => createVerification({ worryItemId: w.id, scheduledFor })),
  );

  return NextResponse.json({
    headline: out.headline,
    primary_action: out.primary_action,
    worries: inserted.map((w) => ({ id: w.id, content: w.content, category: w.category })),
  });
}
