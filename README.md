# Agent Handoff

**One AI task. Multiple humans. No lost context.**

Agent Handoff is a multiplayer AI execution experiment for the c0mpiled-17 Seoul hackathon (2026-11-09). Two participants share one live task, explicitly transfer control, preserve constraints, and verify the outcome.

## Scope

- One agent session; two participants (Controller and Observer).
- Shared live event stream with a single source of truth.
- Controller-initiated handoff; named recipient must accept.
- Server-side command authorization and stale command rejection.
- Persistent task constraints and a policy check.
- Automated E2E checks for handoff, unauthorized commands, and constraint retention.

## Out of scope

- Generic multi-tenant product, multi-agent orchestration, production-shell access.
- ChatGPT/Claude account/session transfer, automated deployment, payments.
- Rich dashboards or unrelated collaboration tools.

## Project isolation

This is an independent repository created on the MP host.
It does not import code or history from Why Math.

## Status

Scaffold initialized; implementation and end-to-end QC pending.

## Event

[c0mpiled-17 Seoul](https://luma.com/compiled-8lsr) · YC RFS track: Multiplayer AI.

## Run the local prototype

Requires Node.js 20 or later. No runtime packages or cloud account required.

```bash
npm test
npm start
```

The server binds to `127.0.0.1:4177` by default. The startup output prints two **private** local invitation URLs:
- A: starts as Controller.
- B: starts as Observer; can accept a handoff.

Open each invitation in a separate browser window. These URLs contain access tokens. Never publish them or use them on a public host.

Demo sequence: A starts the task, diagnoses the fixture, offers the handoff; B accepts; verify that A cannot execute instructions; B attempts to remove authentication (policy rejects it), then applies the safe fix and the fixture's three assertions pass.

## Honest demo limits

The local prototype uses a **deterministic scripted fixture worker**, not a real LLM.
It proves the shared session, handoff, server-side control, constraint gate and test execution.
It does **not** yet demonstrate free-form AI agent task continuation, multi-model portability, or durable distributed sessions. Do not claim those capabilities.

Next implementation gate: safely integrate one real model-assisted, allowlisted code task in an isolated workspace while preserving the same server-side authorization checks.
