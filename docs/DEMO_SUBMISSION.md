# Agent Handoff — c0mpiled-17 Demo

**One AI task. Multiple humans. No lost context.**

## Verified live-browser recording

The [two-browser Playwright QC run](https://github.com/hkalbertkim/agent-handoff/actions/runs/42564397033) captures two **real Chromium browser videos** while the local Agent Handoff server executes the workflow. Open its `two-browser-evidence` artifact to obtain:

- `developer-a-real-browser.webm` — Developer A's actual UI.
- `developer-b-real-browser.webm` — Developer B's actual UI.
- `observer.png` and `controller.png` — real post-handoff state snapshots.

The captured sequence shows session start, A requesting a handoff, B accepting, former-controller command rejection, forbidden authentication removal blocked, and passing login fixture assertions.

The videos contain demo invitation tokens in the local URL; these are **ephemeral test-only tokens** and do not authorize any public hosted deployment.

## Submission presentation

The final presentation uses a **white / off-white background with pale lavender and blue accents**. Product diagrams are illustrative. The on-screen browser recordings are genuine automated test footage, not generated UI.

Sequence:

1. The problem with separate personal AI tasks.
2. Introduce one shared Agent task.
3. **Real split-screen capture of Developer A and Developer B in Chromium.**
4. Explicit control handoff.
5. Only B may issue active commands.
6. Existing authentication constraints still apply.
7. Three fixture tests pass.
8. Product name and repository URL.

## Honest limitations

The demonstrated code fix runs on a deterministic test fixture. It is **not** evidence that two independent LLMs share a model context, and it is **not** proof of arbitrary free-form code execution. Server-owned task state, control rights, policy checks, and browser synchronization **are** tested.

## Reproduce

```bash
npm test
npm install --no-save playwright
npx playwright install chromium
node tests/browser-smoke.mjs
```

The browser test emits video and screenshots under `artifacts/`. The **Browser QC** GitHub Actions workflow uploads this directory as `two-browser-evidence`.

**Video target:** under 120 seconds, English Nikki narration, no subtitle overlay. The edited MP4 and slide deck are authored separately; verify assets before claiming they are hosted in this repository.
