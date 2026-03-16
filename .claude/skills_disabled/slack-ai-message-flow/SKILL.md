---
name: slack-ai-message-flow
description: 'Implements the core Slack to AI to Slack to database workflow in Node.js and TypeScript. Use when the user asks to wire a Slack message event or slash command to an AI response and persist the original input and generated output in Supabase or Postgres. Good for prompts like connect Slack to the AI model, implement the handler, save the interaction, or wire the end-to-end flow. Do not use for broad architecture brainstorming or non-Slack integrations.'
---

# Slack AI Message Flow

## Goal
Implement the exact working path:
Slack input -> AI call -> Slack response -> database insert.

## First decision
Choose the handler type that matches the user request:
- `app.message(...)` for message listeners
- `app.command(...)` for slash commands
- `app.event(...)` only if the user explicitly asks for event-level handling

Default to one handler only.

## Required behavior
A correct implementation should:
1. receive the user text,
2. validate that the text is non-empty,
3. send it to the AI model,
4. extract the model's final text response,
5. send that response back to Slack,
6. insert one row into Supabase,
7. fail gracefully.

## Implementation rules
- Keep the logic inline unless extraction clearly improves readability.
- Use `await` directly instead of wrapping everything in helper layers.
- Acknowledge slash commands immediately with `ack()`.
- For message handlers, avoid bot loops where relevant.
- Prefer a single `try/catch` around the workflow.
- Return a human-readable fallback error message to Slack.
- Never hardcode secrets.

## Suggested database payload
Store at least:
- `user_message`
- `ai_response`
- `created_at`

Store these too if naturally available:
- `slack_user_id`
- `channel_id`
- `source_type` such as `message` or `slash_command`

## AI call guidance
When generating the AI call:
- use the SDK the user selected,
- keep the prompt simple,
- avoid complex system prompts unless requested,
- extract plain text safely,
- keep model choice configurable via env.

## Response guidance
Slack response should be:
- concise,
- directly tied to the AI output,
- safe if the AI returns nothing.

If the AI result is empty, respond with a fallback such as:
- "I received your message, but the model returned no text."

## Output format
When using this skill, answer with:
1. one-paragraph explanation of the flow,
2. exact code changes,
3. env vars required,
4. how to test it,
5. common failure points.

## Common checks before finalizing
Verify:
- the Slack handler function signature is correct,
- `ack()` is present for slash commands,
- the AI SDK method names match the chosen client,
- the Supabase insert targets the intended table,
- the final returned text is a string,
- all async calls are awaited.

## Example prompt patterns
Use this skill for prompts like:
- "Wire Slack to the AI model and save the result"
- "Implement the handler"
- "Connect Slack Bolt, the AI SDK, and Supabase"
- "Save the prompt and response"
- "Make the end-to-end flow work"

## Troubleshooting patterns
### Slack receives input but no reply
Check:
- handler registration,
- slash command `ack()`,
- bot permissions,
- reply method being awaited.

### AI call fails
Check:
- API key,
- model env var,
- request payload shape,
- SDK method name.

### Database insert fails
Check:
- URL and key env vars,
- table name,
- row shape,
- RLS or permissions if applicable.

### Bot replies to itself or loops
Ignore bot messages or add an early return guard.
