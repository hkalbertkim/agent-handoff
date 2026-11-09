# gStack-Style Engineering Review — Agent Handoff

## Status
Design review: scoped; implementation and QC not yet proven. This report is independent of Why Math.

## Design decision: server authority
Alternative A: Browser-owned session and realtime broadcasts. Rejected: user can bypass controls; racing controllers and stale state.
Alternative B: Server-owned session state + append-only events + server command gate. Chosen: one authority for permissions, task state and handoff.

## Core state
Session {id, version, controllerId, pendingHandoff, task, constraints, eventSeq, events[]}
Command {sessionId, actor, expectedVersion, idempotencyKey, action, payload}

## Atomic transitions
- PROPOSE: only current controller chooses specific recipient.
- ACCEPT: only named recipient may accept current proposal. Increment version before announcing change.
- INSTRUCT: requires current controller, matching version, valid policy; serialize commands.
- STALE: 403 / conflict, no tool call, no side effects.
- RECONNECT: snapshot + events after last observed seq.

## Enforce original constraints
An LLM prompt is advisory, not an enforcement boundary. Demo tasks use a fixed file fixture and deterministic policy checks; attempted authentication bypass must be rejected. Show actual acceptance test for safe fixes.

## Architecture
Browser A / Browser B
 -> HTTP/WebSocket
 -> SessionEngine (single state writer)
 -> Task Runner (bounded fixture)
 -> Policy Gate
 -> Event log + broadcasts

## Failure tests
1. Two simultaneous handoff ACCEPTs cannot create two controllers.
2. Old A command after B accepts is rejected.
3. Stale version rejected without executing a tool.
4. Duplicate idempotency key does not double execute.
5. Disconnected B can reconnect and see canonical state.
6. Constraint persists after handoff and is enforced by a test, not UI alone.

## Risks
Critical: UI-only authorization; model prompt treated as policy.
Major: duplicate execution on retries; stale event rendering; misleading simulated agent output.
Non-goal: multi-host concurrency.

## Demo shot plan
0-15s A starts a constrained task
15-30s B joins; identical canonical session ID and stream
30-45s A requests transfer; B accepts
45-60s A tries a command and receives a server denial
60-75s B attempts prohibited action, policy blocks it
75-90s B submits safe fix; actual tests pass

## Go / No-Go
GO on implementation if exact-scope architecture and 3 acceptance tests fit.
NO-GO for claims of general human-proof, multi-model chat transfer or unsandboxed production automation.
