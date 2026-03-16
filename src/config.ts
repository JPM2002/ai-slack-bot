import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  SLACK_BOT_TOKEN: required('SLACK_BOT_TOKEN'),
  SLACK_APP_TOKEN: required('SLACK_APP_TOKEN'),
  SLACK_SIGNING_SECRET: required('SLACK_SIGNING_SECRET'),
  ANTHROPIC_API_KEY: required('ANTHROPIC_API_KEY'),
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY'),
  DOCS_PATH: process.env['DOCS_PATH'] ?? './docs',
} as const;
