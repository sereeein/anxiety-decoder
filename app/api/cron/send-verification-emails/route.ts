// app/api/cron/send-verification-emails/route.ts
import { NextResponse } from 'next/server';
import { listDueUnsent, markSent, buildVerifyUrl } from '@/lib/db/verifications';
import { getServerSupabase } from '@/lib/db/supabase';
import { getResendClient, FROM_ADDRESS } from '@/lib/ai/resendClient';
import { callComposeVerificationEmail } from '@/lib/core/decodeEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Security: Vercel Cron sends an Authorization header with CRON_SECRET,
  // or a custom header. We accept either x-cron-secret (manual trigger) or
  // the Vercel-signed request.
  const authHeader = req.headers.get('authorization') ?? '';
  const customHeader = req.headers.get('x-cron-secret') ?? '';
  const secret = process.env.CRON_SECRET ?? '';
  const expected = `Bearer ${secret}`;
  const ok =
    (secret && customHeader === secret) ||
    (secret && authHeader === expected);
  if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const due = await listDueUnsent(50);
  if (due.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const sb = getServerSupabase();
  const resend = getResendClient();
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  let sent = 0;
  let skipped = 0;

  for (const v of due) {
    // Fetch the worry content + user email via joined query
    const { data, error } = await sb
      .from('worry_items')
      .select(
        'content, decode_sessions!inner ( created_at, anonymous_users!inner ( email ) )',
      )
      .eq('id', v.worry_item_id)
      .maybeSingle();
    if (error || !data) {
      skipped++;
      continue;
    }
    const worryContent = (data as unknown as { content: string }).content;
    const createdAt = (data as unknown as {
      decode_sessions: { created_at: string };
    }).decode_sessions.created_at;
    const email = (data as unknown as {
      decode_sessions: { anonymous_users: { email: string | null } };
    }).decode_sessions.anonymous_users.email;

    if (!email) {
      // User did not opt into email — skip sending. The in-app PendingBanner picks this up.
      // Still mark sent to avoid rescanning forever.
      await markSent(v.id);
      skipped++;
      continue;
    }

    const daysElapsed = Math.max(
      1,
      Math.round((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000)),
    );
    const quote = await callComposeVerificationEmail({
      worryContent,
      daysElapsed,
    });
    const url = buildVerifyUrl(appUrl, v.token);

    const subject = `给 ${daysElapsed} 天前的自己一个回复`;
    const html = [
      `<p style="margin:0 0 16px 0">那天你写："${quote}"</p>`,
      `<p style="margin:0 0 16px 0">${daysElapsed} 天过去了。发生了或没发生，说什么都行 —— 这一题会进记忆库，是你给那天的自己的一个回应。</p>`,
      `<p style="margin:0 0 24px 0"><a href="${url}" style="color:#1f2937;text-decoration:underline">回去看那天 →</a></p>`,
      `<p style="color:#9ca3af;font-size:12px;margin:0">—— 焦虑解码器</p>`,
    ].join('');

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject,
      html,
    });
    await markSent(v.id);
    sent++;
  }

  return NextResponse.json({ sent, skipped });
}
