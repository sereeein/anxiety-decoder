import { randomBytes } from 'node:crypto';
import { getServerSupabase } from './supabase';

export interface Verification {
  id: string;
  worry_item_id: string;
  scheduled_for: string;
  sent_at: string | null;
  token: string;
  did_happen: boolean | null;
  user_note: string | null;
  responded_at: string | null;
  created_at: string;
}

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function buildVerifyUrl(appUrl: string, token: string): string {
  const base = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
  return `${base}/verify/${token}`;
}

export async function createVerification(args: {
  worryItemId: string;
  scheduledFor: Date;
}): Promise<Verification> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('verifications')
    .insert({
      worry_item_id: args.worryItemId,
      scheduled_for: args.scheduledFor.toISOString(),
      token: generateToken(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Verification;
}

export async function listDueUnsent(limit = 50): Promise<Verification[]> {
  const sb = getServerSupabase();
  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from('verifications')
    .select('*')
    .lte('scheduled_for', nowIso)
    .is('sent_at', null)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Verification[];
}

export async function markSent(id: string): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb
    .from('verifications')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function getByToken(token: string): Promise<Verification | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('verifications')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  return data as Verification | null;
}

export async function respond(args: {
  id: string;
  didHappen: boolean;
  userNote: string | null;
}): Promise<Verification> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('verifications')
    .update({
      did_happen: args.didHappen,
      user_note: args.userNote,
      responded_at: new Date().toISOString(),
    })
    .eq('id', args.id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Verification;
}

/**
 * List verifications for catastrophic worries belonging to sessions owned by a
 * given fingerprint, where no response has been recorded yet.
 * Used by the in-app PendingBanner fallback (for users who didn't opt into email).
 */
export async function listPendingForFingerprint(
  fingerprint: string,
): Promise<Verification[]> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('verifications')
    .select(
      'id, worry_item_id, scheduled_for, sent_at, token, did_happen, user_note, responded_at, created_at, worry_items!inner ( session_id, decode_sessions!inner ( anonymous_users!inner ( fingerprint ) ) )',
    )
    .is('responded_at', null)
    .lte('scheduled_for', new Date().toISOString())
    .eq('worry_items.decode_sessions.anonymous_users.fingerprint', fingerprint);
  if (error) throw error;
  // The embedded fields are just used for filtering; return only the verification columns.
  return ((data ?? []) as unknown as Verification[]).map((v) => ({
    id: v.id,
    worry_item_id: v.worry_item_id,
    scheduled_for: v.scheduled_for,
    sent_at: v.sent_at,
    token: v.token,
    did_happen: v.did_happen,
    user_note: v.user_note,
    responded_at: v.responded_at,
    created_at: v.created_at,
  }));
}
