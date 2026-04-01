# AGENTS.md

This repository contains local guidance for future agent work. Read this file first, then open the relevant `.ai` documents before making substantial changes.

## Primary references

- `.ai/README.md`
  - Entry point for the `.ai` knowledge center and task workflow.
- `.ai/product-spec.md`
  - Primary product specification for the medical-center workflow.
- `.ai/project-context.md`
  - Current implementation snapshot, stack, and requirement alignment notes.
- `.ai/architecture-notes.md`
  - Electron, preload, renderer, Prisma, and packaging boundaries.
- `.ai/resources/routes.json`
  - Current API route reference for backend-integrated tasks.
- `.ai/resources/API_ENDPOINTS.md`
  - API usage details, headers, auth gates, and request/response guidance.
- `.ai/resources/api-database.sql`
  - Current backend database structure reference.
- `.ai/task-skills.md`
  - Repo-local task skills and startup checklists.
- `.ai/workflow-rules.md`
  - Default execution rules for feature work, UI work, and data/reporting changes.
- `.ai/tasks/README.md`
  - Structured task workflow, status folders, and task maintenance guidance.
- `.ai/tasks/registry.md`
  - Current structured task index.
- `.ai/tasks/inbox/raw-user-tasks.md`
  - User-owned raw task capture file. The user may write here in any language.

## Required startup routine

Before editing code:

1. Read this `AGENTS.md`.
2. Read `.ai/README.md`.
3. Read `.ai/project-context.md`.
4. Read `.ai/task-skills.md`.
5. Re-read `.ai/product-spec.md` if the task affects features, data, labels, billing, search, or print/report output.
6. Read `.ai/resources/routes.json`, `.ai/resources/API_ENDPOINTS.md`, and `.ai/resources/api-database.sql` before API-integrated feature work.
7. Read `.ai/tasks/registry.md`.
8. Create or update the relevant structured task file under `.ai/tasks/` before substantial feature work.

## Routing guide

- For business logic or feature changes:
  - Refer to `.ai/README.md`
  - Refer to `.ai/product-spec.md`
  - Refer to `.ai/project-context.md`
  - Refer to `.ai/resources/routes.json`
  - Refer to `.ai/resources/API_ENDPOINTS.md`
  - Refer to `.ai/resources/api-database.sql`
  - Refer to `.ai/task-skills.md`
  - Refer to `.ai/tasks/registry.md`
  - Refer to `.ai/tasks/active/*.md`, `.ai/tasks/planned/*.md`, `.ai/tasks/blocked/*.md`, and `.ai/tasks/triage/*.md`
- For Electron / IPC / preload work:
  - Refer to `.ai/README.md`
  - Refer to `.ai/architecture-notes.md`
  - Refer to `.ai/resources/routes.json`
  - Refer to `.ai/resources/API_ENDPOINTS.md`
  - Refer to `.ai/task-skills.md`
- For renderer / styling / print UI work:
  - Refer to `.ai/README.md`
  - Refer to `.ai/project-context.md`
  - Refer to `.ai/task-skills.md`
  - Refer to `.ai/workflow-rules.md`
- For Prisma or database changes:
  - Refer to `.ai/README.md`
  - Refer to `.ai/architecture-notes.md`
  - Refer to `.ai/task-skills.md`
  - Refer to `.ai/product-spec.md`
  - Refer to `.ai/resources/api-database.sql`

## Repository-specific instructions

- Treat `.ai/product-spec.md` as higher priority than scaffold/starter code.
- Do not assume the current `User` model is the final domain design.
- Keep privileged logic in main/preload layers, not directly in the renderer.
- Treat the app as API-integrated, not local-database-only.
- Keep the API base URL configurable. Current local backend URL: `http://test-b.local/`.
- Store the API base URL in `.env`, not in hardcoded renderer logic.
- Backend project lives in WSL at `\\wsl.localhost\Ubuntu-24.04\home\eranda\test\test-b`.
- If a required backend route does not exist, it may be added in the backend project. If WSL access is unavailable, ask the user to apply the backend change.
- Preserve existing user changes in the worktree.
- If code and requirement diverge, prefer moving toward the requirement unless the user explicitly directs otherwise.
- Raw user task notes belong in `.ai/tasks/inbox/raw-user-tasks.md`, and the user may write them in any language.
- For substantial feature work, convert raw notes into one or more structured task files, combine related work when practical, and record the status in `.ai/tasks/registry.md`.
