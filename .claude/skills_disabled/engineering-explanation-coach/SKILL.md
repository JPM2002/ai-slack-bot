---
name: engineering-explanation-coach
description: 'Produces short, high-signal engineering talk tracks for a coding interview or technical walkthrough. Use when the user asks what to say before coding, while coding, when explaining tradeoffs, when summarizing architecture, or when discussing next steps after a minimal implementation. Works especially well for Node.js, TypeScript, Slack, AI integration, and database persistence tasks.'
---

# Engineering Explanation Coach

## Goal
Help the user sound structured, calm, and engineering-focused while keeping answers short.

## Output modes
Choose the mode that matches the request:
- Before coding
- While coding
- Explaining a tradeoff
- Explaining architecture
- Explaining an error or fix
- Explaining what would be next with more time

## Style rules
- Keep spoken answers short.
- Prefer 1 to 4 sentences per answer.
- Use concrete engineering language.
- Mention tradeoffs only if relevant.
- Do not sound rehearsed or overly formal.
- Favor correctness, readability, and delivery order.

## Templates
### Before coding
Use a short structure:
- confirm the goal,
- name the minimum flow,
- state the implementation order.

### While coding
Describe:
- what part you are wiring now,
- why this is the next dependency,
- what success looks like.

### Tradeoff explanation
Use:
- what you chose,
- why it fits the time-box,
- what you would expand later.

### Architecture explanation
Use:
- ingress,
- processing,
- persistence,
- response.

### Debugging explanation
Use:
- symptom,
- hypothesis,
- check,
- fix.

## Output format
When using this skill, return:
1. exactly what to say,
2. optional backup version if the user wants a shorter or stronger variant.

## Example prompt patterns
Use this skill for prompts like:
- "What should I say before coding?"
- "How do I explain this architecture?"
- "Give me the talk track"
- "What do I say if they ask why I kept it simple?"
- "How do I explain the fix?"

## Special guidance for this stack
For Slack plus AI plus database flows, emphasize:
- clear data path,
- minimum viable correctness,
- readable async handling,
- storing the interaction for traceability.
