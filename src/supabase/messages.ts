import { supabase } from './client.js';
import type { RawMessage } from '../types/index.js';

export async function insertRawMessage(msg: Omit<RawMessage, 'id' | 'created_at'>): Promise<RawMessage> {
  const { data, error } = await supabase
    .from('raw_messages')
    .insert(msg)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert raw message: ${error.message}`);
  return data as RawMessage;
}
