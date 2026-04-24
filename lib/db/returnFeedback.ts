// lib/db/returnFeedback.ts
import { getServerSupabase } from './supabase';

export type FeedbackEmoji = '🙂' | '😐' | '😣';

export interface ReturnFeedback {
  session_id: string;
  emoji: FeedbackEmoji;
  one_liner: string | null;
  created_at: string;
}

export async function saveReturnFeedback(args: {
  sessionId: string;
  emoji: FeedbackEmoji;
  oneLiner: string | null;
}): Promise<ReturnFeedback> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('return_feedback')
    .upsert({
      session_id: args.sessionId,
      emoji: args.emoji,
      one_liner: args.oneLiner,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ReturnFeedback;
}
