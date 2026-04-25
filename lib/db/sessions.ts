// lib/db/sessions.ts
import { getServerSupabase } from './supabase';

export type SessionStatus =
  | 'draft'
  | 'conversing'
  | 'decoded'
  | 'launched'
  | 'returned'
  | 'completed';

export type SessionState = 'starting' | 'rescue';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

export interface DecodeSession {
  id: string;
  user_id: string;
  state: SessionState | null;
  initial_dump: string | null;
  conversation: ConversationMessage[];
  primary_action: string | null;
  card_headline: string | null;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export async function createSession(args: {
  userId: string;
  initialDump: string;
  state: SessionState;
  conversation: ConversationMessage[];
}): Promise<DecodeSession> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('decode_sessions')
    .insert({
      user_id: args.userId,
      state: args.state,
      initial_dump: args.initialDump,
      conversation: args.conversation,
      status: 'conversing',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as DecodeSession;
}

export async function getSession(id: string): Promise<DecodeSession | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('decode_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as DecodeSession | null;
}

export async function updateSessionConversation(
  id: string,
  conversation: ConversationMessage[],
): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb
    .from('decode_sessions')
    .update({ conversation })
    .eq('id', id);
  if (error) throw error;
}

export async function markDecoded(args: {
  id: string;
  primaryAction: string;
  cardHeadline: string;
}): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb
    .from('decode_sessions')
    .update({
      primary_action: args.primaryAction,
      card_headline: args.cardHeadline,
      status: 'decoded',
    })
    .eq('id', args.id);
  if (error) throw error;
}

export async function setStatus(id: string, status: SessionStatus): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb.from('decode_sessions').update({ status }).eq('id', id);
  if (error) throw error;
}

export interface SessionSummary {
  id: string;
  created_at: string;
  card_headline: string | null;
  primary_action: string | null;
  status: SessionStatus;
  real_count: number;
  catastrophic_count: number;
  fog_count: number;
  feedback_emoji: string | null;
}

export async function listSessionsByFingerprint(
  fingerprint: string,
): Promise<SessionSummary[]> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('decode_sessions')
    .select(
      `id, created_at, card_headline, primary_action, status,
       anonymous_users!inner ( fingerprint ),
       worry_items ( category ),
       return_feedback ( emoji )`,
    )
    .eq('anonymous_users.fingerprint', fingerprint)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    created_at: string;
    card_headline: string | null;
    primary_action: string | null;
    status: SessionStatus;
    worry_items: Array<{ category: 'real' | 'catastrophic' | 'fog' }>;
    return_feedback: Array<{ emoji: string }> | { emoji: string } | null;
  }>).map((s) => {
    const fb = Array.isArray(s.return_feedback)
      ? s.return_feedback[0] ?? null
      : s.return_feedback;
    return {
      id: s.id,
      created_at: s.created_at,
      card_headline: s.card_headline,
      primary_action: s.primary_action,
      status: s.status,
      real_count: s.worry_items.filter((w) => w.category === 'real').length,
      catastrophic_count: s.worry_items.filter((w) => w.category === 'catastrophic').length,
      fog_count: s.worry_items.filter((w) => w.category === 'fog').length,
      feedback_emoji: fb?.emoji ?? null,
    };
  });
}

export async function deleteSession(id: string): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb.from('decode_sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function exportAllForFingerprint(fingerprint: string): Promise<unknown> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('decode_sessions')
    .select(
      `id, created_at, state, card_headline, primary_action, status,
       conversation,
       worry_items ( id, content, category, was_manually_edited ),
       return_feedback ( emoji, one_liner, created_at ),
       anonymous_users!inner ( fingerprint )`,
    )
    .eq('anonymous_users.fingerprint', fingerprint)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
