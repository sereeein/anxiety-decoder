// app/api/sessions/[id]/route.ts
import { NextResponse } from 'next/server';
import { deleteSession, getSession } from '@/lib/db/sessions';
import { listBySession } from '@/lib/db/worryItems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }
  const worries = await listBySession(id);
  return NextResponse.json({
    id: session.id,
    state: session.state,
    status: session.status,
    conversation: session.conversation,
    primary_action: session.primary_action,
    card_headline: session.card_headline,
    worries: worries.map((w) => ({
      id: w.id,
      content: w.content,
      category: w.category,
      was_manually_edited: w.was_manually_edited,
    })),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteSession(id);
  return NextResponse.json({ ok: true });
}
