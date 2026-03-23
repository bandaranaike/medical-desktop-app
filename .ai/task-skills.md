# Task Skills

These are repo-local skills for future work. Use the relevant section as a checklist before editing code.

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
- Add a preload bridge method for the smallest useful API surface.
- Keep renderer code free of direct Node/Prisma access.
- Update preload typings if the renderer-facing API changes.
- Verify the renderer only uses APIs exposed on `window.api` or `window.electron`.

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

- Add or update one or more task files under `.ai/tasks/`.
- Combine closely related work into a single task file when practical.
- Keep task files short and execution-oriented.
- Reflect major scope changes in `.ai/tasks/` before implementation drifts too far.

## Skill: Packaging Awareness

Use when changing native modules, assets, or build config.

- Check `electron.vite.config.ts` for externals.
- Check `electron-builder.yml` for packaging exclusions and unpack rules.
- Be careful with Prisma client output paths in production builds.
- Treat updater settings as incomplete unless the user asks to finish them.

## Skill: Task Startup Routine

Before substantial work:

- Read `AGENTS.md`.
- Read `.ai/project-context.md`.
- Read the most relevant section in this file.
- Re-open `.ai/product-spec.md` if the task affects behavior, terminology, or data.
- Create or update the relevant file in `.ai/tasks/`.
