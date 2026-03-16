import { createSlackApp } from './slack/app.js';
import { registerCommandHandlers } from './handlers/commands.js';
import { registerEventHandlers } from './handlers/events.js';

async function main() {
  const app = createSlackApp();

  registerCommandHandlers(app);
  registerEventHandlers(app);

  await app.start();
  console.log('Bot is running');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
