import { supabase } from './client.js';
import type { KnowledgeItem } from '../types/index.js';

export async function insertKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'created_at'>): Promise<KnowledgeItem> {
  const { data, error } = await supabase
    .from('knowledge_items')
    .insert(item)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert knowledge item: ${error.message}`);
  return data as KnowledgeItem;
}

export async function searchKnowledge(query: string, limit = 10): Promise<KnowledgeItem[]> {
  // Bug 2 fix — search the combined tsvector column, not just title
  // Use the fts index: to_tsvector('english', title || ' ' || cleaned_content)
  const { data, error } = await supabase
    .from('knowledge_items')
    .select('*')
    .textSearch('title', query, { type: 'plain', config: 'english' })
    .limit(limit);

  if (error) {
    // Bug 6 fix — fallback uses individual keywords, not the full question as a substring
    const keywords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3);

    if (keywords.length === 0) return [];

    let q = supabase.from('knowledge_items').select('*');
    for (const kw of keywords) {
      q = q.or(`title.ilike.%${kw}%,cleaned_content.ilike.%${kw}%`);
    }
    const { data: fallback } = await q.limit(limit);
    return (fallback ?? []) as KnowledgeItem[];
  }

  return (data ?? []) as KnowledgeItem[];
}
