// app/api/sessions/pending/route.ts
import { NextResponse } from 'next/server';
import { listPendingForFingerprint } from '@/lib/db/verifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fingerprint = url.searchParams.get('fingerprint');
  if (!fingerprint) {
    return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
  }
  const pending = await listPendingForFingerprint(fingerprint);
  return NextResponse.json({
    count: pending.length,
    tokens: pending.map((v) => v.token),
  });
}
