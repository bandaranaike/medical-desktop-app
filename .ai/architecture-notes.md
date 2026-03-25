# Architecture Notes

## Process boundaries

- `src/main/index.ts` owns:
  - Electron app lifecycle
  - window creation
  - Prisma client creation
  - IPC handlers
  - API client/configuration for backend-integrated workflows
- `src/preload/index.ts` owns:
  - narrow API exposure to the renderer through `contextBridge`
- `src/renderer/src/*` owns:
  - UI state
  - form interactions
  - presentation logic

## Database notes

- Prisma client output is generated into `src/generated/prisma`.
- Main process currently imports Prisma from `../generated/prisma/client`.
- SQLite file path is based on `app.getPath('userData')` and stored as `dev.db`.
- `better-sqlite3` and Prisma adapter packages are marked external in `electron.vite.config.ts`.
- Prisma package upgrades must be followed by client regeneration so `src/generated/prisma` stays in sync with the installed runtime.
- API backend schema reference is in `.ai/resources/api-database.sql`.

## IPC pattern to follow

- Add DB logic in main process first.
- Add API integration logic in main process first.
- Expose only small, explicit preload methods.
- Consume those methods from the renderer.
- Keep raw Prisma access out of renderer code.
- Keep raw HTTP/API calls out of renderer code when the call needs configuration, credentials, or backend coordination.

## API integration notes

- Treat the app as capable of working against an external/local API, not only the embedded SQLite path.
- The API base URL must remain configurable. Current localhost-style development URL: `http://test-b.local/`.
- Read the API base URL from `.env`.
- Backend source lives in WSL at `\\wsl.localhost\Ubuntu-24.04\home\eranda\test\test-b`.
- Available API routes can be inspected in `.ai/resources/routes.json`.
- API headers, auth gates, and route behavior notes are in `.ai/resources/API_ENDPOINTS.md`.
- If a required route is missing, it is acceptable to add one in the backend project.
- If WSL filesystem access is unavailable from the current environment, stop short of pretending the backend was changed and ask the user to apply the backend patch.

## Packaging notes

- Build config excludes source files from packaged output.
- `resources/**` and `node_modules/better-sqlite3/**` are unpacked.
- Auto-update config exists but points at a placeholder URL and should not be treated as production-ready.

## Important inconsistencies to remember

- README still describes the generic starter project.
- Business requirement says "medical center", while some code still uses generic `User` naming.
- Renderer contains hardcoded demo-like service data that should not be mistaken for finalized domain logic.

## Safe extension points

- New data models: `prisma/schema.prisma`
- New Electron handlers: `src/main/index.ts`
- New preload API surface: `src/preload/index.ts` and `src/preload/index.d.ts`
- UI pages/components: `src/renderer/src/*`
- Home dashboard reusable UI: `src/renderer/src/components/home/*`
- App styles and tokens: `src/renderer/src/assets/main.css`
