import { App } from '@slack/bolt';
import { config } from '../config.js';

export function createSlackApp(): App {
  return new App({
    token: config.SLACK_BOT_TOKEN,
    appToken: config.SLACK_APP_TOKEN,
    signingSecret: config.SLACK_SIGNING_SECRET,
    socketMode: true,
  });
}
