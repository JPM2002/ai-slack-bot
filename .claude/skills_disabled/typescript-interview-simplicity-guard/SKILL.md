---
name: typescript-interview-simplicity-guard
description: 'Refactors Node.js and TypeScript solutions into smaller, clearer, interview-ready code. Use when the user asks to simplify, reduce overengineering, keep it clean, make it easier to explain, or make the solution more appropriate for a timed coding interview. Focus on minimal file count, explicit flow, readable typing, and easy verbal explanation. Do not use for production hardening or enterprise architecture expansion.'
---

# TypeScript Interview Simplicity Guard

## Goal
Make the solution easier to finish, debug, and explain in a live interview.

## Core rules
Prefer:
- fewer files,
- fewer abstractions,
- one obvious control flow,
- explicit variable names,
- direct async code,
- basic interfaces or inferred types where enough.

Avoid unless explicitly requested:
- factories,
- service layers,
- dependency injection,
- generic-heavy utilities,
- custom architecture patterns,
- premature optimization.

## Refactor checklist
When using this skill, review the solution and simplify in this order:
1. Remove unnecessary files
2. Inline tiny wrappers that hide logic
3. Collapse deep call chains
4. Rename variables for clarity
5. Replace clever type tricks with plain types
6. Keep one straightforward error-handling path
7. Ensure the result can be explained quickly

## Output format
Return:
1. what is too complex,
2. the simplified structure,
3. the revised code,
4. a 15 to 30 second explanation.

## Heuristics
A solution is too complex for the interview if:
- the file count is high relative to the task,
- most functions are one-line wrappers,
- important logic is hidden behind abstractions,
- the user would need several minutes just to explain the structure,
- the code looks more like a framework than a submission.

## Example prompt patterns
Use this skill for prompts like:
- "Make this simpler"
- "Keep it interview-ready"
- "This feels overengineered"
- "Refactor this to the minimum clean version"
- "Help me reduce the structure"

## Guardrail
Do not remove correctness just to make code shorter. The goal is simple and explainable, not compressed or clever.
