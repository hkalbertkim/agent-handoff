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
