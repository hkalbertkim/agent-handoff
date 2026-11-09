# Agent Handoff

**One AI task. Multiple humans. No lost context.**

Agent Handoff is a working, **local-first multiplayer AI workflow prototype** built at **[c0mpiled-17 Seoul](https://luma.com/compiled-8lsr)** for YC's **Multiplayer AI** request. Two people share one live task. One person controls it at a time. Handoffs require acceptance, and server-enforced constraints survive the transfer.

**[Run it in 2 minutes](#run-it-in-2-minutes)** · **[Try the live handoff](#try-the-handoff)** · **[See real browser proof](#real-browser-proof)** · **[What works and what does-not](#what-works-and-what-does-not)** · **[Hackathon tracks](#hackathon-tracks)**

## Live workspace interface

The running app uses the **same light visual direction as the hackathon presentation**: an off-white canvas, pale blue and lavender cards, clear participant roles, and a protected-constraint panel. The screenshots in the presentation are concept illustrations; the app itself is a working UI.

What appears on screen:

- **Current task:** shows the real task goal, status, and preserved authentication constraint.
- **Participants:** Developer A and Developer B show which person currently controls the task.
- **Task controls:** start, diagnose, offer handoff, accept handoff, and apply the verified fix.
- **Live activity:** both browser windows receive the same server-authored event updates.
- **Verification:** displays real fixture test status.
- **Developer verification tools:** policy stress-test actions are placed in a collapsible section rather than the main workflow.

The design does **not** imply automatic LLM code execution or gbrain integration. The same server permissions, in-memory session, and deterministic test fixture remain in place.

## Run it in 2 minutes

Requires **Node.js 20+** and Git. No database, Docker, API key, package installation, or signup.

```bash
git clone https://github.com/hkalbertkim/agent-handoff.git
cd agent-handoff
npm start
```

The terminal prints two separate private invitation URLs:

```text
A/controller: http://127.0.0.1:4177/?token=...
B/observer:   http://127.0.0.1:4177/?token=...
```

**Open A in one browser window and B in another.** Keep the terminal open. Both pages connect to the **same local session** and update live.

> The URLs are generated on every server start. Their tokens are private bearer capabilities, not user accounts. **Do not post them or expose this development server on the public internet.** The app binds to localhost by default.

## Try the handoff

| Step | In browser A | In browser B | What you should see |
| --- | --- | --- | --- |
| 1 | **Start task** | Observe | Both windows show the running login-fix task |
| 2 | **Scripted diagnosis** | Observe | The same finding appears in the shared event stream |
| 3 | **Offer handoff** | **Accept handoff** | Both switch to **Controller: B** |
| 4 | **Try instruction as observer** | Observe | A's request is rejected by the server (**HTTP 403**) |
| 5 | Observe | **Attempt: disable auth** | Server policy **blocks** the unsafe change |
| 6 | Observe | **Apply safe fix & test** | Password-boundary fixture passes **3/3 assertions** |

The test fixture changes a password boundary from `password.length > 8` to `password.length >= 8` **without removing authentication**.

## Real browser proof

**[Watch the real two-browser GitHub Actions run](https://github.com/hkalbertkim/agent-handoff/actions/runs/42564397033)** (Browser QC: passed).

Open **Artifacts → `two-browser-evidence`** to download actual Playwright Chromium recordings:

- `developer-a-real-browser.webm` — A's session, handoff and rejected observer command.
- `developer-b-real-browser.webm` — B's acceptance, blocked unsafe command and passing tests.
- `observer.png` and `controller.png` — real post-handoff screenshots.

These are recordings of the **running application**, not generated UI mockups. Browser videos and the 57-second narrated submission video are different artifacts.

## Verify it yourself

```bash
npm test           # No dependencies or API account; unit + HTTP regression tests
```

For an optional **real Chromium two-browser recording** (requires Playwright):

```bash
npm install --no-save playwright
npx playwright install chromium
npm run demo:record
```

Recording output: `artifacts/developer-a-real-browser.webm`, `artifacts/developer-b-real-browser.webm`, plus PNG screenshots. GitHub Actions verifies Node 20 and 22 and runs the browser workflow on pull requests.

## What works and what does not

| Verified now | Not implemented / not claimed |
| --- | --- |
| Two browsers share **one live, server-owned task state** | Arbitrary, autonomous LLM coding |
| Explicit A → B offer / accept and live synchronization | Multiple LLM instances sharing a hidden model context |
| Former controller receives **HTTP 403** on attempted commands | User accounts, teams, permissions for public deployment |
| Constraints remain enforced after handoff | Persistent cross-server memory or gbrain integration |
| Deterministic login fixture change and **3 real assertions** | Generalized multi-agent orchestration |

**Important distinction:** the core task worker is a **deterministic scripted fixture**. This prototype validates multiplayer control and policy enforcement, not a general-purpose AI coding agent.

An **optional** bounded LLM *diagnosis* is available when you configure `OPENAI_API_KEY` locally. It performs read-only analysis and **never** generates or applies code changes. Choose a model available to your API account with `OPENAI_MODEL`; actual provider access has **not** been verified in public CI.

```bash
OPENAI_API_KEY=your_local_key OPENAI_MODEL=your_available_model npm start
```

Do not commit API keys. A ChatGPT subscription by itself does not supply API usage credentials.

## Hackathon tracks

**Primary: YC Request for Startups — Multiplayer AI.** The actual implemented behavior is a **human-to-human handoff of one live task** with server-owned state, explicit acceptance, and enforced control boundaries.

**Extra / sponsor tracks:** [See evidence-based eligibility notes](docs/EXTRA_TRACKS.md). No sponsor SDK, blockchain transaction, on-chain identity, or gbrain implementation is claimed unless code demonstrating it exists. Track eligibility and any required integration must be confirmed against the organizers' current submission form.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `node` not found or version below 20 | Install Node.js 20+ and reopen your terminal |
| `EADDRINUSE` / port 4177 busy | Run `PORT=4180 npm start` (macOS/Linux) and use the newly printed URLs |
| B cannot accept | Start task in A, then click **Offer handoff** in A before accepting in B |
| Both pages show the same person | Open the **two different** A/B invitation URLs, not the same URL twice |
| Browser shows an outdated state | Reload the page; the server is the source of truth |
| Browser recording complains about `playwright` | Run the optional Playwright install commands above |
| Public URL cannot connect | **Expected:** the service is localhost-only for safety; use two windows on the same computer |

## For reviewers and contributors

- [Implementation and engineering review](docs/ENGINEERING_REVIEW.md)
- [Scope and test boundaries](docs/SCOPE.md)
- [Reproducible demo evidence](docs/DEMO_SUBMISSION.md)
- [Extra tracks evidence and gaps](docs/EXTRA_TRACKS.md)

Contributions and reproducible bug reports are welcome. This is a hackathon prototype, **not a production security boundary**.

Built during the **November 9, 2026** c0mpiled-17 Seoul hackathon.
