import type { App } from '@slack/bolt';
import { handleFileUpload } from './file.js';

interface SlackFile {
  id: string;
  name: string;
  mimetype: string;
  url_private_download: string;
}

// Handles file uploads posted as messages — slash commands don't cover this,
// so we still listen to the message event but ONLY act when files are present.
export function registerEventHandlers(app: App): void {
  app.event('message', async ({ event, say }) => {
    if (event.subtype != null) return;
    if (!('user' in event) || !event.user) return;

    const files = (event as { files?: SlackFile[] }).files ?? [];
    if (files.length === 0) return;

    const { user, ts, channel } = event as { user: string; ts: string; channel: string };

    for (const file of files) {
      try {
        await handleFileUpload(file, ts, user, channel);
        await say({ text: `File *${file.name}* processed and saved to knowledge base.`, thread_ts: ts });
      } catch (err) {
        console.error('File processing error:', err);
        await say({ text: `Failed to process file *${file.name}*.`, thread_ts: ts });
      }
    }
  });
}
