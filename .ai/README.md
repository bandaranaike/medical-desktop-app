# AI Knowledge Center

This `.ai/` folder is the working knowledge center for this repository.

## Folder Map

- `project-context.md`
  - current implementation snapshot and practical assumptions
- `product-spec.md`
  - product truth for medical-center workflows
- `architecture-notes.md`
  - Electron, preload, renderer, Prisma, and packaging boundaries
- `task-skills.md`
  - repo-local working checklists
- `workflow-rules.md`
  - execution rules for feature, UI, data, and API work
- `resources/`
  - stable reference material such as API docs, route inventory, DB schema, screenshots, and design assets
- `tasks/`
  - task intake, structured task files, registry, and status workflow
- `mcp/`
  - MCP-related repo configuration

## Startup Reading Order

Before substantial work:

1. Read `AGENTS.md`.
2. Read `.ai/README.md`.
3. Read `.ai/project-context.md`.
4. Read `.ai/task-skills.md`.
5. Re-read `.ai/product-spec.md` if the task affects features, labels, billing, search, reports, or print output.
6. Read `.ai/resources/routes.json`, `.ai/resources/API_ENDPOINTS.md`, and `.ai/resources/api-database.sql` before API-backed work.
7. Read `.ai/tasks/registry.md`.
8. Create or update the relevant structured task file under `.ai/tasks/`.

## Task Workflow

- Raw task notes from the user go into `.ai/tasks/inbox/raw-user-tasks.md`.
- The user can write those notes in any language.
- The agent should convert raw notes into structured task files and combine related requests into one task file when practical.
- Structured task files should live in a status folder such as:
  - `.ai/tasks/planned/`
  - `.ai/tasks/active/`
  - `.ai/tasks/blocked/`
  - `.ai/tasks/done/`
- Older task notes with unclear current state belong in `.ai/tasks/triage/` until reviewed.
- Every structured task should be reflected in `.ai/tasks/registry.md`.

## Status Rules

See `.ai/tasks/task-statuses.md` for the canonical task statuses and how they should be used.
