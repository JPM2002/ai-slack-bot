import { anthropic } from './client.js';
import { searchKnowledge } from '../supabase/knowledge.js';
import { loadDocs } from '../docs/loader.js';

export async function answerQuestion(question: string): Promise<string> {
  const [knowledgeItems, docs] = await Promise.all([
    searchKnowledge(question),
    loadDocs(),
  ]);

  const kbContext = knowledgeItems
    .map((item) => `[KB: ${item.title}]\n${item.cleaned_content}`)
    .join('\n\n');

  const docsContext = docs
    .map((doc) => `[File: ${doc.filename}]\n${doc.content}`)
    .join('\n\n');

  const context = [kbContext, docsContext].filter(Boolean).join('\n\n---\n\n');

  const prompt = `Answer the question using ONLY the provided context.
If the answer is not in the context, say so honestly.
Cite sources where possible.

Format your response using Slack mrkdwn:
- Bold: *text* (single asterisk, NOT double)
- Italic: _text_
- Bullet lists: start lines with • or -
- No markdown headers (no ## or ###)
- No HTML

Context:
${context || 'No context available.'}

Question: ${question}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const result = response.content[0];
  if (result.type !== 'text') throw new Error('Unexpected response type from Claude');
  return result.text;
}
