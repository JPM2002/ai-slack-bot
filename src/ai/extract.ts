import { anthropic } from './client.js';
import type { ExtractedKnowledge } from '../types/index.js';

const SYSTEM_PROMPT = `Analyze this message and return JSON with:
- title: short descriptive title (max 60 chars)
- cleaned_content: message rewritten clearly
- category: one of: question, task, idea, note, bookmark
- tags: array of 2-5 lowercase keyword strings

Return ONLY valid JSON. No markdown, no explanation.`;

async function tryExtract(text: string): Promise<ExtractedKnowledge> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  });

  const raw = response.content[0];
  if (raw.type !== 'text') throw new Error('Unexpected response type from Claude');

  return JSON.parse(raw.text) as ExtractedKnowledge;
}

export async function extractKnowledge(text: string): Promise<ExtractedKnowledge> {
  try {
    return await tryExtract(text);
  } catch (err) {
    // Bug 5 fix — only retry on JSON parse errors, not API errors (rate limits, 500s)
    const isParseError = err instanceof SyntaxError;
    if (!isParseError) throw err;
    // Small delay before retry to avoid hammering the API
    await new Promise((r) => setTimeout(r, 500));
    return await tryExtract(text);
  }
}
