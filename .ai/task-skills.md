# Task Skills

These are repo-local skills for future work. Use the relevant section as a checklist before editing code.

## Knowledge Center

Use `.ai/README.md` as the map for the knowledge center before substantial work.

- Read `.ai/tasks/registry.md` before assuming which task file is current.
- Treat `.ai/tasks/inbox/raw-user-tasks.md` as the raw intake file for user-written notes in any language.
- Convert raw notes into structured task files and combine closely related requests when practical.

## Skill: Domain Alignment

Use when implementing features, data models, labels, or reports.

- Read `.ai/product-spec.md` first.
- Keep the UX simple for non-technical clinic operators.
- Use domain names that match the business requirement where practical.
- Flag places where the current code still reflects scaffold/demo behavior.
- Prefer explicit medical-center terminology over generic names like "user" when introducing new code.

## Skill: Electron Data Flow

Use when adding persistence, search, or commands from the UI.

- Put database and privileged logic in the main process.
- Put API integration logic and host configuration in the main process.
- Add a preload bridge method for the smallest useful API surface.
- Keep renderer code free of direct Node/Prisma access.
- Keep renderer code free of direct backend host assumptions when the main/preload layer can own them.
- Update preload typings if the renderer-facing API changes.
- Verify the renderer only uses APIs exposed on `window.api` or `window.electron`.

## Skill: API Integration

Use when a task depends on backend routes, remote persistence, search suggestions, or bill creation.

- Read `.ai/resources/routes.json` before inventing a new endpoint.
- Read `.ai/resources/API_ENDPOINTS.md` before assuming auth-free or public access.
- Read `.ai/resources/api-database.sql` when the payload or persistence shape is unclear.
- Keep the API base URL configurable in `.env`. Current local value: `http://test-b.local/`.
- Prefer reusing existing routes over creating parallel variants without a reason.
- If one route can return enough patient data for suggestion selection and autofill, prefer that over extra round trips.
- Respect required `X-API-KEY`, `Referer`, and Sanctum requirements when selecting usable endpoints.
- If a required route is missing, define the needed contract clearly and add it in the backend project when access is available.
- Backend project path for route work: `\\wsl.localhost\Ubuntu-24.04\home\eranda\test\test-b`.
- If backend edits are blocked by missing WSL access, document the required change precisely for the user instead of hand-waving it.

## Skill: Prisma Schema Changes

Use when modifying persistence.

- Update `prisma/schema.prisma` first.
- Keep migration intent aligned with the clinic workflow in `.ai/product-spec.md`.
- Check whether the renderer types and preload contracts also need updates.
- Avoid reusing `User` forever if a clearer patient/doctor/billing model is needed.
- Preserve SQLite compatibility.

## Skill: Billing UI Work

Use when editing the renderer or print flow.

- Optimize for fast data entry with low operator cognitive load.
- Support autofill/search behavior from patient identifiers.
- Keep totals, selected services, and bill output easy to audit visually.
- Prefer deterministic printable layouts.
- When adding service logic, distinguish demo placeholders from persisted business data.
- Reuse the dashboard visual language already established on the home page:
  - dark glassy cards
  - cyan accents
  - rounded sections
  - dense but readable desktop-first forms

## Skill: Task Recording

Use before substantial feature or refactor work.

- Read `.ai/tasks/registry.md`.
- Add or update one or more structured task files under the correct status folder in `.ai/tasks/`.
- Combine closely related work into a single structured task file when practical.
- Keep task files short and execution-oriented.
- Reflect major scope changes in both the task file and `.ai/tasks/registry.md` before implementation drifts too far.
- If a task starts as a raw user note, keep the raw note in the inbox and create a normalized task file separately.

## Skill: Packaging Awareness

Use when changing native modules, assets, or build config.

- Check `electron.vite.config.ts` for externals.
- Check `electron-builder.yml` for packaging exclusions and unpack rules.
- Be careful with Prisma client output paths in production builds.
- Treat updater settings as incomplete unless the user asks to finish them.

## Skill: Task Startup Routine

Before substantial work:

- Read `AGENTS.md`.
- Read `.ai/README.md`.
- Read `.ai/project-context.md`.
- Read the most relevant section in this file.
- Re-open `.ai/product-spec.md` if the task affects behavior, terminology, or data.
- Read `.ai/resources/routes.json`, `.ai/resources/API_ENDPOINTS.md`, and `.ai/resources/api-database.sql` for API-backed work.
- Read `.ai/tasks/registry.md`.
- Create or update the relevant structured task file in `.ai/tasks/`.
