import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { config } from '../config.js';
import type { DocFile } from '../types/index.js';

const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.csv']);

export async function loadDocs(): Promise<DocFile[]> {
  const docsPath = config.DOCS_PATH;
  const docs: DocFile[] = [];

  try {
    const files = await readdir(docsPath);
    for (const filename of files) {
      if (!SUPPORTED_EXTENSIONS.has(extname(filename).toLowerCase())) continue;
      const content = await readFile(join(docsPath, filename), 'utf-8');
      docs.push({ filename, content });
    }
  } catch (err) {
    console.error('Failed to load docs:', err);
  }

  return docs;
}
