// app/api/verify/[token]/route.ts
import { NextResponse } from 'next/server';
import { getByToken, respond } from '@/lib/db/verifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const v = await getByToken(token);
  if (!v) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({
    id: v.id,
    scheduled_for: v.scheduled_for,
    responded_at: v.responded_at,
    did_happen: v.did_happen,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { didHappen, userNote } = body as { didHappen?: boolean; userNote?: string };
  if (typeof didHappen !== 'boolean') {
    return NextResponse.json({ error: 'didHappen required (boolean)' }, { status: 400 });
  }
  const v = await getByToken(token);
  if (!v) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (v.responded_at) {
    return NextResponse.json({ error: 'already responded' }, { status: 409 });
  }
  const safeNote =
    typeof userNote === 'string' && userNote.trim().length > 0 ? userNote.trim() : null;

  const updated = await respond({ id: v.id, didHappen, userNote: safeNote });
  return NextResponse.json({
    did_happen: updated.did_happen,
    responded_at: updated.responded_at,
  });
}
