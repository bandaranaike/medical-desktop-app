# Light Theme Toggle

## Meta

- ID: `TASK-117`
- Status: `done`
- Owner: `agent`
- Source: chat request on `2026-04-01`
- Last Updated: `2026-04-01`

## Goal

Add a polished light theme that matches the current dark dashboard design and let the user switch themes from a top-menu icon button.

## Scope

- add app theme state with persistence
- define light theme design tokens that match the current visual language
- update the top menu/header with an icon button to switch theme
- ensure shared UI surfaces, tabs, forms, and summary cards remain legible in both themes

## Constraints

- preserve the current dark theme as the default visual baseline
- avoid a generic whitewashed theme; the light theme should still feel intentional and branded

## Dependencies

- `src/renderer/src/App.tsx`
- `src/renderer/src/assets/main.css`
- shared renderer components used by the dashboard

## Open Questions

- none at the moment; implement a local persisted theme toggle unless a wider app settings system is introduced later

## Done When

- the app supports both dark and light themes
- the top menu has an icon button that toggles between themes
- the key dashboard screens remain readable and visually coherent in both modes

