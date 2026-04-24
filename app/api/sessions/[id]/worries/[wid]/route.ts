// app/api/sessions/[id]/worries/[wid]/route.ts
import { NextResponse } from 'next/server';
import { reclassifyWorry, type WorryCategory } from '@/lib/db/worryItems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: WorryCategory[] = ['real', 'catastrophic', 'fog'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; wid: string }> },
) {
  const { wid } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { category } = body as { category?: string };
  if (!category || !VALID.includes(category as WorryCategory)) {
    return NextResponse.json({ error: 'invalid category' }, { status: 400 });
  }

  const updated = await reclassifyWorry({
    id: wid,
    category: category as WorryCategory,
  });
  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    category: updated.category,
    was_manually_edited: updated.was_manually_edited,
  });
}
