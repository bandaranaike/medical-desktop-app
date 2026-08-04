# Dev Blank Window Fix

## Meta

- ID: TASK-123
- Status: done
- Owner: agent
- Last Updated: 2026-08-04

## Completed

- Diagnosed the default dev launch failure as a Windows Electron GPU/sandbox initialization crash.
- Updated `pnpm dev` to use Electron Vite's `--noSandbox` development compatibility mode.
- Kept production BrowserWindow security settings enabled: no Node integration, context isolation, and sandbox enabled.
- Verified the dev process remains running and no longer reaches the fatal GPU error.
