# Dev Window Show Resilience

## Meta

- ID: TASK-124
- Status: done
- Owner: agent
- Last Updated: 2026-08-04

## Completed

- Diagnosed the blank renderer as a sandboxed preload failure: the generated preload bundle retained an unsupported runtime `require('@electron-toolkit/preload')`.
- Configured Electron Vite to bundle `@electron-toolkit/preload` while retaining `sandbox: true`, context isolation, and disabled Node integration.
- Removed the extra global GPU/software-compositing override; development continues to use Electron Vite's `--noSandbox` Windows compatibility mode.
- Added resilient window-show fallbacks and terminal diagnostics for renderer load, process, preload, and console failures.
- Verified the live app exposed `window.api`, mounted one React root child, and rendered visible body text.
- Verified TypeScript checks pass.
