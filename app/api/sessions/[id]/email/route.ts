// app/api/sessions/[id]/email/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/db/sessions';
import { setUserEmail } from '@/lib/db/users';
import { updateScheduledForBySessionId } from '@/lib/db/verifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const { email, delayDays } = body as { email?: string; delayDays?: number };
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }
  await setUserEmail(session.user_id, email);

  if (typeof delayDays === 'number' && delayDays >= 1 && delayDays <= 7) {
    const scheduledFor = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);
    await updateScheduledForBySessionId({ sessionId: id, scheduledFor });
  }

  return NextResponse.json({ ok: true });
}
