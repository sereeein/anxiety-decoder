// app/api/cron/purge-old-raw/route.ts
// Daily Cron: zero out initial_dump and conversation for sessions older than 30 days.
// Keeps derived data (worry_items, card_headline, primary_action) — see spec §18.2.1.

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_DAYS = 30;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') ?? '';
  const customHeader = req.headers.get('x-cron-secret') ?? '';
  const secret = process.env.CRON_SECRET ?? '';
  const expected = `Bearer ${secret}`;
  const ok =
    (secret && customHeader === secret) ||
    (secret && authHeader === expected);
  if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const cutoffIso = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('decode_sessions')
    .update({ initial_dump: null, conversation: [] })
    .lt('created_at', cutoffIso)
    .not('initial_dump', 'is', null)
    .select('id');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ purged: (data ?? []).length });
}
