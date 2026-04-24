// app/api/sessions/[id]/turns/route.ts
import { NextResponse } from 'next/server';
import { getSession, updateSessionConversation } from '@/lib/db/sessions';
import { needMoreInfo } from '@/lib/rules/needMoreInfo';
import { callAskFollowUpAgain } from '@/lib/core/decodeEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FOLLOWUPS = 2;

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
  const { reply } = body as { reply?: string };
  if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
    return NextResponse.json({ error: 'reply required' }, { status: 400 });
  }

  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }
  if (!session.state) {
    return NextResponse.json({ error: 'session has no state' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const conversation = [...session.conversation, { role: 'user' as const, content: reply, ts: now }];

  const assistantTurns = conversation.filter((t) => t.role === 'assistant').length;

  if (needMoreInfo(reply) && assistantTurns < MAX_FOLLOWUPS) {
    const question = await callAskFollowUpAgain(session.state, conversation);
    conversation.push({ role: 'assistant', content: question, ts: new Date().toISOString() });
    await updateSessionConversation(id, conversation);
    return NextResponse.json({ done: false, question });
  }

  await updateSessionConversation(id, conversation);
  return NextResponse.json({ done: true });
}
