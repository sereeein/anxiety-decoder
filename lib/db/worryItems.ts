// lib/db/worryItems.ts
import { getServerSupabase } from './supabase';

export type WorryCategory = 'real' | 'catastrophic' | 'fog';

export interface WorryItem {
  id: string;
  session_id: string;
  content: string;
  category: WorryCategory;
  display_order: number;
  was_manually_edited: boolean;
}

export async function insertWorryItems(
  sessionId: string,
  items: Array<{ content: string; category: WorryCategory }>,
): Promise<WorryItem[]> {
  if (items.length === 0) return [];
  const sb = getServerSupabase();
  const rows = items.map((it, i) => ({
    session_id: sessionId,
    content: it.content,
    category: it.category,
    display_order: i,
  }));
  const { data, error } = await sb.from('worry_items').insert(rows).select('*');
  if (error) throw error;
  return data as WorryItem[];
}

export async function listBySession(sessionId: string): Promise<WorryItem[]> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('worry_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorryItem[];
}

export async function reclassifyWorry(args: {
  id: string;
  category: WorryCategory;
}): Promise<{ worry: WorryItem; previousCategory: WorryCategory }> {
  const sb = getServerSupabase();
  const { data: prev, error: prevErr } = await sb
    .from('worry_items')
    .select('category')
    .eq('id', args.id)
    .single();
  if (prevErr) throw prevErr;
  const previousCategory = (prev as { category: WorryCategory }).category;

  const { data, error } = await sb
    .from('worry_items')
    .update({ category: args.category, was_manually_edited: true })
    .eq('id', args.id)
    .select('*')
    .single();
  if (error) throw error;
  return { worry: data as WorryItem, previousCategory };
}
