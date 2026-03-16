export interface RawMessage {
  id?: string;
  slack_ts: string;
  slack_user_id: string;
  channel_id: string;
  raw_text: string;
  file_urls?: string[];
  has_files?: boolean;
  created_at?: string;
}

export interface KnowledgeItem {
  id?: string;
  raw_message_id?: string;
  title: string;
  cleaned_content: string;
  category: 'question' | 'task' | 'idea' | 'note' | 'bookmark';
  tags: string[];
  source: string;
  source_filename?: string;
  created_at?: string;
}

export interface ExtractedKnowledge {
  title: string;
  cleaned_content: string;
  category: 'question' | 'task' | 'idea' | 'note' | 'bookmark';
  tags: string[];
}

export interface DocFile {
  filename: string;
  content: string;
}
