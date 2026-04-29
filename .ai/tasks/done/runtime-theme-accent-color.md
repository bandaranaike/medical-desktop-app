# Runtime Theme Accent Color

## Meta

- ID: `TASK-118`
- Status: `done`
- Owner: `agent`
- Source: chat request on `2026-04-28`
- Last Updated: `2026-04-28`

## Goal

Make the app theme accent configurable from `.env` so a second branded theme such as `#522e90` can drive both dark and light modes.

## Scope

- add runtime config support for a theme base color
- expose the runtime theme config through main/preload to the renderer
- generate accent-aware tokens for dark and light theme modes
- remove hard-coded cyan accent styling where it would block the new theme

## Constraints

- preserve the existing light/dark theme toggle behavior
- keep runtime config compatible with development `.env` and packaged `config.env`

## Dependencies

- `src/main/index.ts`
- `src/preload/index.ts`
- `src/preload/index.d.ts`
- `src/renderer/src/App.tsx`
- `src/renderer/src/assets/main.css`

## Open Questions

- none; use a safe default accent when the env variable is missing or invalid

## Done When

- the accent color can be changed from runtime env config
- dark and light theme variants both adopt the configured accent coherently
- the default UI no longer depends on hard-coded blue/cyan accent values
