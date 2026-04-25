import { NextResponse } from 'next/server';
import { purgeAllForFingerprint } from '@/lib/db/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { fingerprint } = body as { fingerprint?: string };
  if (!fingerprint) {
    return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
  }
  await purgeAllForFingerprint(fingerprint);
  return NextResponse.json({ ok: true });
}
