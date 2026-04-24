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
