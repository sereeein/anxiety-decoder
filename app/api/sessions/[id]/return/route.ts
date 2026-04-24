// app/api/sessions/[id]/return/route.ts
import { NextResponse } from 'next/server';
import { setStatus } from '@/lib/db/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await setStatus(id, 'returned');
  return NextResponse.json({ ok: true });
}
