-- Table 1: raw_messages — verbatim storage before AI processing
create table if not exists raw_messages (
  id            uuid primary key default gen_random_uuid(),
  slack_ts      text not null,
  slack_user_id text not null,
  channel_id    text not null,
  raw_text      text not null,
  file_urls     text[],
  has_files     boolean default false,
  created_at    timestamptz default now()
);

create unique index if not exists raw_messages_slack_ts_channel
  on raw_messages (slack_ts, channel_id);

-- Table 2: knowledge_items — AI-processed, structured knowledge
create table if not exists knowledge_items (
  id              uuid primary key default gen_random_uuid(),
  raw_message_id  uuid references raw_messages(id) on delete cascade,
  title           text not null,
  cleaned_content text not null,
  category        text not null
                  check (category in ('question','task','idea','note','bookmark')),
  tags            text[] not null default '{}',
  source          text not null default 'slack',
  source_filename text,
  created_at      timestamptz default now()
);

create index if not exists knowledge_items_category on knowledge_items (category);
create index if not exists knowledge_items_fts
  on knowledge_items
  using gin(to_tsvector('english', title || ' ' || cleaned_content));
create index if not exists knowledge_items_tags on knowledge_items using gin(tags);
