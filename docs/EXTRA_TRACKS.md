# Hackathon tracks — evidence and eligibility

## What we can claim today

**Primary YC track: Multiplayer AI** — **implemented and tested**.

Agent Handoff allows two *humans* to view one live task, transfer control with recipient acceptance, and enforce exclusive control and original constraints on the server. Real Chromium A/B recordings plus passing CI are available from the [Browser QC run](https://github.com/hkalbertkim/agent-handoff/actions/runs/42564397033).

This is a **two-human / one-task** prototype; it is not multi-LLM orchestration or general autonomous software development.

## Extra-track screening

The public [c0mpiled-17 Seoul event description](https://luma.com/compiled-8lsr) lists the nine YC RFS themes and general judging rules but **does not publish a definitive sponsor Extra Tracks rubric**. An extra-track checkbox is **not** proof of eligibility.

| Potential alignment | Current evidence | Claim / action |
| --- | --- | --- |
| Collaboration / Multiplayer AI | Two synchronized Chromium sessions, explicit handoff, tested server control | **Ready for primary theme** |
| AI / Agent tools | Optional bounded read-only API model-diagnosis adapter; fixture worker is deterministic | **Prototype only**; don't claim live-model execution without provider evidence |
| Developer productivity / tooling | Local Node app; automated unit, HTTP, Chromium tests and recordings | Can demonstrate reproducibility |
| MCP / shared memory / gbrain | No MCP adapter or gbrain storage in the app | **Not eligible on integration alone**; needs code + tests |
| Blockchain / crypto / on-chain proof | No wallet, smart contract, on-chain action or transactions | **Not eligible on integration alone** |
| Sponsor-specific SDK / APIs | No verified sponsor SDK integration | **Do not select an integration-required track** |

**Before ticking an Extra Track:** read the **exact track name**, sponsor, and mandatory SDK/API/chain requirements in the live submission form. Select only tracks whose requirements the current commit can demonstrate; do not retrofit claims in the README to win another track.

## How to evaluate new eligibility quickly

1. Record the organizer's exact track wording.
2. Identify any *mandatory* implementation, API call or platform requirement.
3. Point to a commit, executable example, and test output that proves it.
4. If any requirement is missing, leave the track unselected or implement it honestly **before** claiming eligibility.

## Honest MVP boundary

- The shared session is in memory for one local Node process, not durable across restarts.
- Task edits are deterministic fixture operations, not LLM-generated code.
- Bearer invitation URLs are test credentials; do not publish them or run the demo on an open network.
- The model-diagnosis path is optional and not live-provider verified in CI.
- The demo's **real-browser recordings** and any **illustrated concept slides** are distinct.

This document is intentionally evidence-based. It can be updated once organizer-confirmed Extra Tracks and completed integrations are available.
