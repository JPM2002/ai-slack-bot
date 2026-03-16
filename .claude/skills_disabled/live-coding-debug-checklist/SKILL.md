---
name: live-coding-debug-checklist
description: 'Diagnoses the most likely failures in a small Node.js and TypeScript live-coding app that uses Slack Bolt, an AI SDK, dotenv, ngrok or public callbacks, and Supabase. Use when the user says the app is not working, the event is not arriving, the AI call fails, the database insert fails, TypeScript is complaining, or asks for a fast debugging checklist during a coding round. Do not use for broad product design or feature planning.'
---

# Live Coding Debug Checklist

## Goal
Triage the failure quickly, restore the minimum success path, and help the user explain the fix clearly.

## Default response structure
When using this skill, answer in this order:
1. Most likely root cause
2. Exact checks to run now
3. Smallest code or config fix
4. What to say aloud in an interview
5. Next check if the first fix fails

## Debugging order
Always debug from the outside in:
1. Environment variables
2. App startup and package issues
3. Slack connectivity
4. Handler registration
5. AI call
6. Database insert
7. TypeScript or module issues

## Fast checklist
### 1. Environment sanity
Verify that required env vars exist and are loaded before client initialization.
Typical variables:
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_APP_TOKEN` if socket mode is used
- `ANTHROPIC_API_KEY` or chosen AI provider key
- `ANTHROPIC_MODEL` or chosen model env
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or the intended key

### 2. Startup sanity
Check:
- app starts without import errors,
- TypeScript compiles under the chosen module settings,
- `dotenv.config()` runs before clients are created,
- the listening or startup log actually appears.

### 3. Slack connectivity
Check:
- request URL or socket mode settings,
- app is installed to the workspace,
- required scopes are granted,
- events or slash commands are enabled,
- ngrok or public tunnel URL matches the Slack app config.

### 4. Handler path
Check:
- the correct handler type is registered,
- slash commands call `ack()`,
- message listeners are not filtered out accidentally,
- bot-loop guards are not blocking all messages.

### 5. AI call
Check:
- API key is valid,
- model name exists,
- request payload shape is correct,
- response parsing matches the SDK response shape.

### 6. Database insert
Check:
- client initialization values,
- table exists,
- insert payload fields exist,
- permissions or RLS do not block the write.

### 7. TypeScript and module issues
Common fixes:
- align `module` and runtime strategy,
- use `tsx` to avoid build friction,
- switch to `NodeNext` only if needed,
- prefer consistent import style.

## Common symptom map
### Symptom: slash command times out
Likely cause: `ack()` missing or delayed.

### Symptom: app starts but nothing reaches handler
Likely cause: Slack event or command not configured, wrong URL, or missing scopes.

### Symptom: handler runs but AI reply missing
Likely cause: API key, model, or response parsing issue.

### Symptom: Slack reply works but database row is missing
Likely cause: wrong table, bad key, or permissions.

### Symptom: TypeScript import error before runtime
Likely cause: module mismatch or wrong tsconfig choices.

## Interview narration guidance
When relevant, help the user say:
- "I’m checking the integration in dependency order: env, Slack ingress, AI call, then persistence."
- "I want the smallest fix that restores the end-to-end path first."
- "Once the happy path works, I can tighten structure if needed."

## Example prompt patterns
Use this skill for prompts like:
- "Why is Slack not receiving messages?"
- "The AI call fails"
- "Supabase insert is not working"
- "Give me a debugging checklist for the live coding round"
- "What should I check first?"
