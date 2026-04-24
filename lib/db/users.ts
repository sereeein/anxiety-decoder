// lib/db/users.ts
import { getServerSupabase } from './supabase';

export interface AnonymousUser {
  id: string;
  fingerprint: string;
  email: string | null;
  created_at: string;
}

export async function getOrCreateUserByFingerprint(
  fingerprint: string,
): Promise<AnonymousUser> {
  const sb = getServerSupabase();
  const { data: existing, error: selErr } = await sb
    .from('anonymous_users')
    .select('*')
    .eq('fingerprint', fingerprint)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing as AnonymousUser;

  const { data: created, error: insErr } = await sb
    .from('anonymous_users')
    .insert({ fingerprint })
    .select('*')
    .single();
  if (insErr) throw insErr;
  return created as AnonymousUser;
}
