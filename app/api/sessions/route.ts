// app/api/sessions/route.ts
import { NextResponse } from 'next/server';
import { getOrCreateUserByFingerprint } from '@/lib/db/users';
import { createSession } from '@/lib/db/sessions';
import { callDetectAndAskFirst } from '@/lib/core/decodeEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { fingerprint, dump } = body as { fingerprint?: string; dump?: string };
  if (!fingerprint || typeof fingerprint !== 'string') {
    return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
  }
  if (!dump || typeof dump !== 'string' || dump.trim().length === 0) {
    return NextResponse.json({ error: 'dump required' }, { status: 400 });
  }

  const user = await getOrCreateUserByFingerprint(fingerprint);
  const { state, question } = await callDetectAndAskFirst(dump);

  const now = new Date().toISOString();
  const session = await createSession({
    userId: user.id,
    initialDump: dump,
    state,
    conversation: [
      { role: 'user', content: dump, ts: now },
      { role: 'assistant', content: question, ts: now },
    ],
  });

  return NextResponse.json({
    sessionId: session.id,
    state,
    question,
  });
}
