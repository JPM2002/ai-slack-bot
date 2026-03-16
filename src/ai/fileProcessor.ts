import Anthropic from '@anthropic-ai/sdk';
import { anthropic } from './client.js';

function isImageMime(mime: string): mime is 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  return mime.startsWith('image/');
}

export async function processFile(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  if (isImageMime(mimeType)) {
    const base64 = fileBuffer.toString('base64');
    const content: Anthropic.ContentBlockParam[] = [
      {
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: base64 },
      },
      {
        type: 'text',
        text: `Describe this image in detail. Extract any text or structured data visible. Filename: ${filename}`,
      },
    ];
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    });
    const result = response.content[0];
    if (result.type !== 'text') throw new Error('Unexpected response type');
    return result.text;
  }

  if (mimeType === 'application/pdf') {
    const base64 = fileBuffer.toString('base64');
    const content: Anthropic.ContentBlockParam[] = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      } as Anthropic.ContentBlockParam,
      {
        type: 'text',
        text: `Summarize and extract key information from this PDF. Filename: ${filename}`,
      },
    ];
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    });
    const result = response.content[0];
    if (result.type !== 'text') throw new Error('Unexpected response type');
    return result.text;
  }

  // CSV or plain text — pass as-is
  const textContent = fileBuffer.toString('utf-8');
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Summarize and extract key information from this file.\n\nFilename: ${filename}\n\nContent:\n${textContent}`,
      },
    ],
  });
  const result = response.content[0];
  if (result.type !== 'text') throw new Error('Unexpected response type');
  return result.text;
}
