// app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/supabase';
import { computeEvidenceStats } from '@/lib/core/evidenceStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fingerprint = url.searchParams.get('fingerprint');
  if (!fingerprint) {
    return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
  }
  const sb = getServerSupabase();
  const { data: userRow, error: uErr } = await sb
    .from('anonymous_users')
    .select('id')
    .eq('fingerprint', fingerprint)
    .maybeSingle();
  if (uErr) throw uErr;
  if (!userRow) {
    return NextResponse.json({
      stats: {
        sessions: 0,
        positiveRate: null,
        catastrophicDidNotHappenRate: null,
        catastrophicRespondedCount: 0,
        manualEditRate: null,
        emojiDistribution: {},
      },
    });
  }
  const userId = (userRow as { id: string }).id;

  const [{ data: sessions }, { data: worries }, { data: verifications }, { data: feedbacks }] =
    await Promise.all([
      sb
        .from('decode_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      sb
        .from('worry_items')
        .select('was_manually_edited, decode_sessions!inner ( user_id )')
        .eq('decode_sessions.user_id', userId),
      sb
        .from('verifications')
        .select(
          'did_happen, responded_at, worry_items!inner ( decode_sessions!inner ( user_id ) )',
        )
        .eq('worry_items.decode_sessions.user_id', userId),
      sb
        .from('return_feedback')
        .select('emoji, decode_sessions!inner ( user_id )')
        .eq('decode_sessions.user_id', userId),
    ]);

  const stats = computeEvidenceStats({
    sessionsCount: (sessions ?? []).length,
    worries: (worries ?? []).map((w) => ({
      was_manually_edited: (w as { was_manually_edited: boolean }).was_manually_edited,
    })),
    verifications: (verifications ?? []).map((v) => ({
      did_happen: (v as { did_happen: boolean | null }).did_happen,
      responded_at: (v as { responded_at: string | null }).responded_at,
    })),
    feedbacks: (feedbacks ?? []).map((f) => ({
      emoji: (f as { emoji: string }).emoji,
    })),
  });

  return NextResponse.json({ stats });
}
