# Frozen Scope — 2026-11-09

## Goal
Demonstrate a **single live task** shared by two people, with an explicit, correct, and auditable controller handoff. This is more than two users viewing a transcript.

## Acceptance Criteria
1. Browser A starts a bounded task. Both browsers see the same session ID and a consistent ordered event stream.
2. A proposes handoff to B. Only B can accept. On acceptance, B becomes Controller, A becomes Observer.
3. An executable command from A after handoff is rejected **server-side**, including racing/stale commands.
4. A's original constraint (e.g. 'never remove authentication') survives handoff. The system enforces it through a policy gate/test, not the agent prompt alone.
5. B can continue the same task; real acceptance tests pass. Logs contain the controlling actor and event sequence.

## Three mandatory tests
- T1: Same task, handoff A -> B, B's command succeeds.
- T2: Old controller command after handoff cannot execute.
- T3: Forbidden change blocked despite handoff; safe change validated by test.

## Safety
- Never execute arbitrary user-supplied shell commands on the host.
- No production credentials or production systems.
- Sandbox a fixed demo fixture and allowlist tool operations.
- LLM output is **not** a security boundary.
- Do not label a simulation as actual LLM execution.

## Deferred
Multiple sessions, broad team membership, external account integrations, general coding agents, durable distributed infrastructure, custom model adapters, production write operations, sophisticated UI.

