// app/api/sessions/[id]/worries/[wid]/route.ts
import { NextResponse } from 'next/server';
import { reclassifyWorry, type WorryCategory } from '@/lib/db/worryItems';
import {
  createVerification,
  deletePendingByWorryItemId,
  existsByWorryItemId,
} from '@/lib/db/verifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: WorryCategory[] = ['real', 'catastrophic', 'fog'];
const DEFAULT_DELAY_DAYS = 3;

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

  const { worry, previousCategory } = await reclassifyWorry({
    id: wid,
    category: category as WorryCategory,
  });

  if (worry.category === 'catastrophic' && previousCategory !== 'catastrophic') {
    const exists = await existsByWorryItemId(worry.id);
    if (!exists) {
      const scheduledFor = new Date(
        Date.now() + DEFAULT_DELAY_DAYS * 24 * 60 * 60 * 1000,
      );
      await createVerification({ worryItemId: worry.id, scheduledFor });
    }
  } else if (
    previousCategory === 'catastrophic' &&
    worry.category !== 'catastrophic'
  ) {
    await deletePendingByWorryItemId(worry.id);
  }

  return NextResponse.json({
    id: worry.id,
    content: worry.content,
    category: worry.category,
    was_manually_edited: worry.was_manually_edited,
  });
}
