import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env');
  console.error('Add: DATABASE_URL=postgresql://postgres:[PASSWORD]@db.lgogfbjljmapqhdljbgu.supabase.co:5432/postgres');
  process.exit(1);
}

async function migrate() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to database');

  const sql = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql'),
    'utf-8',
  );

  await client.query(sql);
  console.log('Schema applied successfully');

  await client.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
