import type { App } from '@slack/bolt';
import { insertRawMessage } from '../supabase/messages.js';
import { insertKnowledgeItem } from '../supabase/knowledge.js';
import { extractKnowledge } from '../ai/extract.js';
import { answerQuestion } from '../ai/answer.js';

export function registerCommandHandlers(app: App): void {
  // /save <text> — extract and store as knowledge item (visible to channel)
  app.command('/save', async ({ command, ack, respond }) => {
    await ack();

    const text = command.text.trim();
    if (!text) {
      await respond({ text: 'Usage: `/save <text to save>`', response_type: 'ephemeral' });
      return;
    }

    let rawMessage;
    try {
      rawMessage = await insertRawMessage({
        slack_ts: command.trigger_id,
        slack_user_id: command.user_id,
        channel_id: command.channel_id,
        raw_text: text,
        has_files: false,
        file_urls: [],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('unique') || msg.includes('duplicate')) {
        await respond({ text: 'Already saved.', response_type: 'ephemeral' });
        return;
      }
      console.error('Failed to save raw message:', err);
      await respond({ text: 'Failed to save — database error.', response_type: 'ephemeral' });
      return;
    }

    try {
      const knowledge = await extractKnowledge(text);
      await insertKnowledgeItem({
        raw_message_id: rawMessage.id,
        ...knowledge,
        source: 'slack',
      });
      await respond({
        text: `<@${command.user_id}> saved as *${knowledge.category}*: _${knowledge.title}_`,
        response_type: 'in_channel',
      });
    } catch (err) {
      console.error('Failed to extract/save knowledge:', err);
      await respond({
        text: 'Saved raw message but failed to extract knowledge.',
        response_type: 'ephemeral',
      });
    }
  });

  // /ask <question> — search KB + docs and answer (ephemeral, only asker sees it)
  app.command('/ask', async ({ command, ack, respond }) => {
    await ack();

    const question = command.text.trim();
    if (!question) {
      await respond({ text: 'Usage: `/ask <your question>`', response_type: 'ephemeral' });
      return;
    }

    await respond({ text: ':thought_balloon: Thinking...', response_type: 'ephemeral' });

    try {
      const answer = await answerQuestion(question);
      await respond({
        text: answer,
        response_type: 'ephemeral',
        replace_original: true,
      });
    } catch (err) {
      console.error('Failed to answer question:', err);
      await respond({
        text: 'Sorry, I ran into an error while answering your question.',
        response_type: 'ephemeral',
        replace_original: true,
      });
    }
  });

  // /kb — show help (ephemeral)
  app.command('/kb', async ({ ack, respond }) => {
    await ack();
    await respond({
      text: [
        '*Knowledge Base Bot — Commands:*',
        '`/save <text>` — Save a note, idea, task, or bookmark to the knowledge base',
        '`/ask <question>` — Ask a question; answer is private to you',
        '_Upload any file_ — Automatically extracted and saved to the knowledge base',
        '`/kb` — Show this help',
      ].join('\n'),
      response_type: 'ephemeral',
    });
  });
}
