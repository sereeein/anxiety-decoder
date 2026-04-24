// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/supabase';
import { getClaudeClient, MODELS } from '@/lib/ai/claudeClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    supabase: 'unknown' as 'ok' | 'fail' | 'unknown',
    anthropic: 'unknown' as 'ok' | 'fail' | 'unknown',
  };

  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.from('anonymous_users').select('id').limit(1);
    checks.supabase = error ? 'fail' : 'ok';
  } catch {
    checks.supabase = 'fail';
  }

  try {
    const client = getClaudeClient();
    if (client && MODELS.HAIKU && MODELS.SONNET) checks.anthropic = 'ok';
  } catch {
    checks.anthropic = 'fail';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks },
    { status: allOk ? 200 : 503 },
  );
}
