import { NextResponse } from 'next/server';
import { exportAllForFingerprint } from '@/lib/db/sessions';

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
  const data = await exportAllForFingerprint(fingerprint);
  return NextResponse.json({ exported_at: new Date().toISOString(), data });
}
