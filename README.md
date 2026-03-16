ai-slack-bot

An AI-powered Slack knowledge management bot that captures, processes, and retrieves information using Claude AI (Anthropic) and Supabase.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [End-to-End Flow](#end-to-end-flow)
4. [Setup & Installation](#setup--installation)
5. [Event Loop / Single-Thread Risk Analysis](#event-loop--single-thread-risk-analysis)

---

## Project Overview

The bot listens to a single Slack channel via Socket Mode (WebSocket, no public HTTP endpoint required). When users post messages or upload files, it:

- **Extracts and structures** knowledge items using Claude AI
- **Stores** raw messages and AI-processed knowledge in Supabase PostgreSQL
- **Answers questions** by searching the knowledge base and combining it with local docs context
- **Processes files** (images, PDFs, text/CSV) by extracting content via Claude's vision and document APIs

Commands:

| Command | Description |
|---|---|
| `!save <text>` | Extract and store text as a knowledge item |
| `!ask <question>` | Search KB + docs and answer with Claude |
| `!kb` | Show help |
| _(file upload)_ | Auto-process and save any uploaded file |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Slack (Socket Mode)                   │
│                    WebSocket — no open port                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ message / file_shared events
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     @slack/bolt App                          │
│  src/slack/app.ts  — Socket Mode factory                     │
│  src/index.ts      — bootstrap + handler registration        │
└───────────┬───────────────────────────┬─────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────┐       ┌───────────────────────┐
│  handlers/        │       │  handlers/             │
│  message.ts       │       │  file.ts               │
│  (command router) │       │  (download + process)  │
└─────┬──────┬──────┘       └──────────┬─────────────┘
      │      │                         │
      │      │  !ask                   │ file buffer
      │      ▼                         ▼
      │  ┌──────────────┐   ┌──────────────────────┐
      │  │ ai/answer.ts │   │ ai/fileProcessor.ts  │
      │  │ (RAG answer) │   │ (image/PDF/text→text)│
      │  └──────┬───────┘   └──────────┬───────────┘
      │         │                      │
      │  !save  │                      │ extracted text
      ▼         ▼                      ▼
  ┌──────────────────────────────────────────────┐
  │              ai/extract.ts                   │
  │  Claude claude-sonnet-4-6 → structured JSON  │
  │  { title, cleaned_content, category, tags }  │
  └────────────────────┬─────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         ▼                            ▼
┌─────────────────┐        ┌──────────────────────┐
│ supabase/       │        │  docs/loader.ts       │
│ knowledge.ts    │        │  Local .md/.txt/.csv  │
│ messages.ts     │        │  files from DOCS_PATH │
│ (DB operations) │        └──────────────────────┘
└────────┬────────┘
         ▼
┌─────────────────────────────────────────────────┐
│              Supabase PostgreSQL                 │
│  raw_messages    — verbatim message storage      │
│  knowledge_items — AI-structured, FTS-indexed    │
└─────────────────────────────────────────────────┘
```

### Source map

| File | Responsibility |
|---|---|
| `src/index.ts` | Entry point — creates app, registers handlers, starts Socket Mode |
| `src/config.ts` | Reads and validates all required env vars at startup (fails fast) |
| `src/slack/app.ts` | Bolt `App` factory configured for Socket Mode |
| `src/handlers/message.ts` | Parses incoming messages, routes to `!save`, `!ask`, `!kb`, file handlers |
| `src/handlers/file.ts` | Downloads Slack file (follows 302 redirects), calls `processFile` + `extractKnowledge` |
| `src/ai/client.ts` | Shared Anthropic SDK instance |
| `src/ai/extract.ts` | Calls Claude to produce structured JSON from raw text; retries once on parse error |
| `src/ai/answer.ts` | Fetches KB items + docs in parallel, builds prompt, calls Claude for answer |
| `src/ai/fileProcessor.ts` | Dispatches images/PDFs/text to Claude with appropriate content block types |
| `src/supabase/client.ts` | Shared Supabase client instance |
| `src/supabase/knowledge.ts` | `insertKnowledgeItem`, `searchKnowledge` (full-text search via `to_tsvector`) |
| `src/supabase/messages.ts` | `insertRawMessage` (unique on `slack_ts + channel_id`) |
| `src/docs/loader.ts` | Reads `DOCS_PATH` directory for `.md`, `.txt`, `.csv` files |
| `src/types/index.ts` | Shared TypeScript interfaces (`ExtractedKnowledge`, `DocFile`, etc.) |

### Database schema

```sql
-- raw_messages: verbatim, idempotent (unique on slack_ts + channel_id)
raw_messages (id, slack_ts, slack_user_id, channel_id, raw_text, file_urls, has_files, created_at)

-- knowledge_items: AI-processed, full-text searchable
knowledge_items (id, raw_message_id→raw_messages, title, cleaned_content,
                 category CHECK IN ('question','task','idea','note','bookmark'),
                 tags text[], source, source_filename, created_at)

-- Indexes
raw_messages_slack_ts_channel  UNIQUE (slack_ts, channel_id)
knowledge_items_category       BTREE (category)
knowledge_items_fts            GIN  to_tsvector(title || cleaned_content)
knowledge_items_tags           GIN  (tags)
```

---

## End-to-End Flow

### Startup

```
tsx src/index.ts
  → config.ts validates all env vars (throws on missing)
  → createSlackApp() initialises Bolt with Socket Mode
  → registerMessageHandler(app) attaches the message event listener
  → app.start() opens WebSocket to Slack
```

### `!save <text>`

```
User posts "!save Buy milk tomorrow"
  → message event → parseCommand() → { command: 'save', body: 'Buy milk tomorrow' }
  → runP0():
      1. insertRawMessage()  → raw_messages row (idempotent by slack_ts+channel)
      2. extractKnowledge()  → Claude JSON: { title, cleaned_content, category, tags }
      3. insertKnowledgeItem() → knowledge_items row
      4. say() → "Saved as *task*: _Buy milk tomorrow_"
```

### `!ask <question>`

```
User posts "!ask What tasks do I have?"
  → parseCommand() → { command: 'ask', body: 'What tasks do I have?' }
  → runP1():
      1. say("Thinking...")
      2. answerQuestion():
           Promise.all([
             searchKnowledge(question),   ← Supabase FTS query
             loadDocs(),                  ← reads DOCS_PATH files
           ])
           → build context string
           → Claude API call → answer text
      3. say(answer)
```

### File upload

```
User uploads report.pdf
  → message event detects files[] array
  → handleFileUpload():
      1. downloadFile()     ← HTTPS GET with Bearer token, follows 302 to S3
      2. processFile()      ← Claude: document block → extracted text summary
      3. insertRawMessage() ← stores [File: report.pdf]\n<extracted text>
      4. extractKnowledge() ← Claude: JSON metadata
      5. insertKnowledgeItem(source='file_upload', source_filename='report.pdf')
  → say("File *report.pdf* processed and saved to knowledge base.")
```

### `!kb` help

```
User posts "!kb"
  → parseCommand() → { command: 'help' }
  → say() with formatted command list
```

---

## Setup & Installation

### Prerequisites

- Node.js 20+
- A Slack app with **Socket Mode** enabled, subscribed to `message.channels` or `message.groups` events
- Supabase project
- Anthropic API key

### Environment variables

Copy `.env.example` to `.env` and fill in all values:

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
SLACK_CHANNEL_ID=C...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=...
DOCS_PATH=./docs          # optional, defaults to ./docs
```

### Install & run

```bash
npm install

# Run the database migration (creates raw_messages + knowledge_items tables)
npm run migrate

# Development (hot reload)
npm run dev

# Production
npm start

# Type-check only
npm run typecheck
```

---

## Event Loop / Single-Thread Risk Analysis

Node.js runs JavaScript on a single thread. Any synchronous CPU work or unbounded I/O concurrency can delay all other pending callbacks — including Slack's WebSocket heartbeats and in-flight responses.

### Identified risks in this codebase

#### 1. Synchronous `Buffer.toString('base64')` — `src/ai/fileProcessor.ts:14,36`

`fileBuffer.toString('base64')` is a synchronous, CPU-bound V8 call. It runs entirely on the main thread and blocks proportionally to file size. A 10 MB PDF encodes to ~13 MB of base64 in one synchronous step.

**Impact:** High for large files. Blocks all other callbacks during encoding.

#### 2. Full file buffer accumulation — `src/handlers/file.ts:16–38`

The `downloadFile` function collects all HTTPS chunks into a `Buffer[]` array and resolves only when the stream ends (`'end'` event). The entire file lives in memory before any processing begins.

**Impact:** Memory pressure under concurrent large uploads; GC pauses can indirectly stall the event loop.

#### 3. No concurrency limit on Claude API calls — `src/handlers/message.ts`

Each `!save`/`!ask`/file-upload command spawns one or more Anthropic API calls independently. Under burst traffic, N simultaneous commands create N×(1–3) concurrent inflight HTTP requests with no queue or semaphore. Node's `http.Agent` default `maxSockets` is `Infinity`.

**Impact:** Unbounded open sockets; rate-limit errors from Anthropic; potential OOM from accumulated response buffers.

#### 4. Serial `readFile` loop — `src/docs/loader.ts:14–17`

Files in `DOCS_PATH` are read one at a time (`for...of` with `await readFile`). Each iteration yields to the event loop between files, so this is not a hard block, but it is slower than `Promise.all` for many files.

**Impact:** Low (I/O-bound, yields between reads) but suboptimal at scale.

#### 5. `setTimeout` retry in `src/ai/extract.ts:34`

The 500 ms retry delay uses `new Promise(r => setTimeout(r, 500))`. This is fully async — the event loop is free during the delay. No blocking risk.

**Impact:** None. This is the correct pattern.

#### 6. `JSON.parse()` in `src/ai/extract.ts:23`

Synchronous, but operates on a small string (Claude's 512-token response). Negligible CPU time.

**Impact:** None in practice.

### Recommended mitigations

| Risk | Mitigation |
|---|---|
| Unbounded parallel Claude calls | Add `p-limit` or `p-queue` with a concurrency cap (e.g. 3) around all `anthropic.messages.create` calls |
| Base64 CPU block | Offload `fileBuffer.toString('base64')` to a `worker_thread` for files > ~1 MB, or use streaming multipart upload if the Anthropic SDK supports it |
| Full file buffer in memory | Stream the HTTPS response directly to a temp file, then read lazily; or enforce a max file size guard before downloading |
| No request timeouts | Wrap all `https.get` and `anthropic.messages.create` calls with `AbortController` + `setTimeout` timeouts (e.g. 30 s) |
| Serial doc reads | Replace the `for...of` loop with `Promise.all(files.map(...))` |
| No rate limiting per user | Add per-user or per-channel rate limiting (e.g. token bucket) at the top of `registerMessageHandler` |
| Observability | Run with `--inspect` and monitor event loop lag via `perf_hooks.monitorEventLoopDelay()` |
