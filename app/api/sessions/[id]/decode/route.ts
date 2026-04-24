// app/api/sessions/[id]/decode/route.ts
import { NextResponse } from 'next/server';
import { getSession, markDecoded } from '@/lib/db/sessions';
import { insertWorryItems } from '@/lib/db/worryItems';
import { callClassifyAndCompose } from '@/lib/core/decodeEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  return NextResponse.json({
    headline: out.headline,
    primary_action: out.primary_action,
    worries: inserted.map((w) => ({ id: w.id, content: w.content, category: w.category })),
  });
}
