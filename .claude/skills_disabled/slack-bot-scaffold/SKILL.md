---
name: slack-bot-scaffold
description: 'Scaffolds a minimal Node.js and TypeScript Slack bot or internal tool using Slack Bolt, an AI SDK call, Supabase, dotenv, and tsx. Use when the user asks to bootstrap, scaffold, start, set up, or create a small Slack app, slash command tool, or message handler that sends input to an AI model and stores results. Prefer a simple interview-ready structure with minimal files. Do not use for Python implementations or large production architecture redesigns.'
---

# Slack Bot Scaffold

## Goal
Create the smallest clean project that can:
1. start successfully,
2. receive Slack input,
3. call an AI model,
4. send a response back to Slack,
5. persist the interaction.

## Default assumptions
Unless the user asks otherwise, optimize for:
- Node.js 20+
- TypeScript
- `tsx` for local execution
- `@slack/bolt`
- `@anthropic-ai/sdk` or a compatible AI SDK the user already selected
- `@supabase/supabase-js`
- `dotenv`
- one main `src/index.ts` entrypoint
- one SQL file only if persistence schema is requested

## Output format
When using this skill, produce the answer in this order:
1. Brief architecture summary in 3 to 6 lines
2. Final file tree
3. Full contents of each file
4. Exact install or run commands
5. Quick manual test steps
6. Optional next improvements, only if asked or clearly useful

## Scaffold rules
- Prefer 3 to 6 files total for interview work.
- Keep imports explicit.
- Keep env var names obvious and uppercase.
- Use one handler path unless the user explicitly asks for both message events and slash commands.
- Favor readability over abstractions.
- Do not introduce classes, DI containers, queues, background jobs, or multi-service architecture unless requested.
- Add only the minimum typing needed for clarity.

## Recommended minimal file set
Use this by default:
- `package.json`
- `tsconfig.json`
- `.env.example`
- `src/index.ts`
- `schema.sql` only if database table creation is requested

## Build sequence
### Step 1: Confirm the simplest flow
Choose one:
- Slack message event -> AI call -> Slack reply -> Supabase insert
- Slack slash command -> AI call -> Slack reply -> Supabase insert

If the user is unsure, default to the simplest event or slash-command flow that matches their prompt.

### Step 2: Generate configuration
Create:
- `package.json` with dev script using `tsx`
- `tsconfig.json` for a straightforward Node + TS setup
- `.env.example` listing every required variable

### Step 3: Generate the app entrypoint
In `src/index.ts`:
- load dotenv immediately
- initialize Slack Bolt app
- initialize AI client
- initialize Supabase client
- register one clear handler
- include basic try/catch error handling
- log startup success

### Step 4: Keep persistence simple
If persistence is requested:
- use one table for interactions
- store at least user input, AI output, and timestamp
- optionally store Slack user or channel metadata

### Step 5: Add run instructions
Always provide exact commands such as:
```bash
npm run dev
```
and the Slack or local steps needed to verify the workflow.

## Quality checklist
Before finalizing, verify that the generated solution:
- has no missing imports,
- uses env vars consistently,
- starts from a single command,
- can be explained in under 30 seconds,
- meets the minimum success path.

## What to avoid
Avoid these unless the user explicitly wants them:
- NestJS
- Prisma
- test frameworks
- Docker
- advanced logging packages
- retry frameworks
- custom error hierarchies
- repository or service layers

## Example prompt patterns
This skill is a fit for prompts like:
- "Scaffold a minimal Slack bot in Node and TypeScript"
- "Set up the project for Slack plus AI plus Supabase"
- "Bootstrap the live coding app with Slack Bolt"
- "Create the initial files for a slash command bot"

## Troubleshooting guidance
If scaffolding fails because requirements are ambiguous, choose the narrowest valid implementation and state the assumption clearly.

If a package name or SDK usage looks stale, prefer the user's requested stack and keep the integration minimal.
