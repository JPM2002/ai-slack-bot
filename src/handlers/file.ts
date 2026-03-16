import https from 'https';
import { config } from '../config.js';
import { processFile } from '../ai/fileProcessor.js';
import { extractKnowledge } from '../ai/extract.js';
import { insertRawMessage } from '../supabase/messages.js';
import { insertKnowledgeItem } from '../supabase/knowledge.js';

interface SlackFile {
  id: string;
  name: string;
  mimetype: string;
  url_private_download: string;
}

// Bug 3 fix — follow HTTP 302 redirects that Slack issues for url_private_download
function downloadFile(url: string, token: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const options = { headers: { Authorization: `Bearer ${token}` } };
    https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers['location'];
        if (!location) return reject(new Error('Redirect with no Location header'));
        // Follow the redirect (no auth header needed for S3 redirects)
        https.get(location, (res2) => {
          const chunks: Buffer[] = [];
          res2.on('data', (chunk: Buffer) => chunks.push(chunk));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

export async function handleFileUpload(
  file: SlackFile,
  slackTs: string,
  slackUserId: string,
  channelId: string,
): Promise<void> {
  const fileBuffer = await downloadFile(file.url_private_download, config.SLACK_BOT_TOKEN);
  const extractedContent = await processFile(fileBuffer, file.mimetype, file.name);

  const rawMsg = await insertRawMessage({
    slack_ts: slackTs,
    slack_user_id: slackUserId,
    channel_id: channelId,
    raw_text: `[File: ${file.name}]\n${extractedContent}`,
    file_urls: [file.url_private_download],
    has_files: true,
  });

  const knowledge = await extractKnowledge(extractedContent);
  await insertKnowledgeItem({
    raw_message_id: rawMsg.id,
    ...knowledge,
    source: 'file_upload',
    source_filename: file.name,
  });
}
