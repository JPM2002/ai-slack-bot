import type { App } from '@slack/bolt';
import { insertRawMessage } from '../supabase/messages.js';
import { insertKnowledgeItem } from '../supabase/knowledge.js';
import { extractKnowledge } from '../ai/extract.js';
import { answerQuestion } from '../ai/answer.js';
import { handleFileUpload } from './file.js';

interface SlackFile {
  id: string;
  name: string;
  mimetype: string;
  url_private_download: string;
}

// Keyword routing — all commands are case-insensitive
// !save <text>  → P0: extract + store in knowledge base (no reply)
// !ask <text>   → P1: search KB + answer (always replies)
// file upload   → P2: auto-detected by presence of files (no keyword needed)
const SAVE_PREFIX = /^!save\s+/i;
const ASK_PREFIX  = /^!ask\s+/i;
const HELP_CMD    = /^!kb\s*$/i;

function parseCommand(text: string): { command: 'save' | 'ask' | 'help' | 'ignore'; body: string } {
  if (HELP_CMD.test(text))        return { command: 'help',   body: '' };
  if (SAVE_PREFIX.test(text))     return { command: 'save',   body: text.replace(SAVE_PREFIX, '').trim() };
  if (ASK_PREFIX.test(text))      return { command: 'ask',    body: text.replace(ASK_PREFIX, '').trim() };
  return { command: 'ignore', body: '' };
}

async function runP0(
  body: string,
  ts: string,
  user: string,
  channel: string,
  say: (msg: { text: string; thread_ts: string }) => Promise<unknown>,
) {
  let rawMessage;
  try {
    rawMessage = await insertRawMessage({
      slack_ts: ts,
      slack_user_id: user,
      channel_id: channel,
      raw_text: body,
      has_files: false,
      file_urls: [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      await say({ text: 'Already saved.', thread_ts: ts });
      return;
    }
    console.error('Failed to save raw message:', err);
    await say({ text: 'Failed to save — database error.', thread_ts: ts });
    return;
  }

  try {
    const knowledge = await extractKnowledge(body);
    await insertKnowledgeItem({
      raw_message_id: rawMessage.id,
      ...knowledge,
      source: 'slack',
    });
    await say({ text: `Saved as *${knowledge.category}*: _${knowledge.title}_`, thread_ts: ts });
  } catch (err) {
    console.error('Failed to extract/save knowledge:', err);
    await say({ text: 'Saved raw message but failed to extract knowledge.', thread_ts: ts });
  }
}

async function runP1(
  body: string,
  ts: string,
  say: (msg: { text: string; thread_ts: string }) => Promise<unknown>,
) {
  await say({ text: 'Thinking...', thread_ts: ts });
  try {
    const answer = await answerQuestion(body);
    await say({ text: answer, thread_ts: ts });
  } catch (err) {
    console.error('Failed to answer question:', err);
    await say({ text: 'Sorry, I ran into an error while answering your question.', thread_ts: ts });
  }
}

export function registerMessageHandler(app: App): void {
  app.event('message', async ({ event, say }) => {
    // Only handle regular user messages (ignore bot messages, edits, deletions)
    if (event.subtype != null) return;
    if (!('user' in event) || !event.user) return;

    const { user, ts, channel } = event as {
      text?: string;
      user: string;
      ts: string;
      channel: string;
      files?: SlackFile[];
    };

    const text = ('text' in event && typeof event.text === 'string') ? event.text : '';
    const files = (event as { files?: SlackFile[] }).files ?? [];

    // P2 — file uploads are always processed regardless of keyword
    if (files.length > 0) {
      for (const file of files) {
        try {
          await handleFileUpload(file, ts, user, channel);
          await say({ text: `File *${file.name}* processed and saved to knowledge base.`, thread_ts: ts });
        } catch (err) {
          console.error('File processing error:', err);
          await say({ text: `Failed to process file *${file.name}*.`, thread_ts: ts });
        }
      }
      // If the message also has text with a command, fall through to handle it
      if (!text.trim()) return;
    }

    const { command, body } = parseCommand(text);

    if (command === 'help') {
      await say({
        text: [
          '*Knowledge Base Bot — Commands:*',
          '`!save <text>` — Save a note, idea, task, or bookmark to the knowledge base',
          '`!ask <question>` — Ask a question and get an answer from the knowledge base',
          '_Upload any file_ — Automatically extracted and saved',
          '`!kb` — Show this help',
        ].join('\n'),
        thread_ts: ts,
      });
      return;
    }

    if (command === 'ignore') return;

    if (command === 'save') {
      if (!body) {
        await say({ text: 'Usage: `!save <text to save>`', thread_ts: ts });
        return;
      }
      await runP0(body, ts, user, channel, say);
    }

    if (command === 'ask') {
      if (!body) {
        await say({ text: 'Usage: `!ask <your question>`', thread_ts: ts });
        return;
      }
      await runP1(body, ts, say);
    }
  });
}
