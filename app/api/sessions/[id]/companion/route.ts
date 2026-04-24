// app/api/sessions/[id]/companion/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/db/sessions';
import { callCompanionCopy } from '@/lib/core/decodeEngine';

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
  if (!session.state || !session.primary_action) {
    return NextResponse.json({ error: 'session not yet decoded' }, { status: 409 });
  }
  const copy = await callCompanionCopy(session.state, session.primary_action);
  return NextResponse.json({ copy });
}
