# AGENTS.md

This repository contains local guidance for future agent work. Read this file first, then open the relevant `.ai` documents before making substantial changes.

## Primary references

- `.ai/product-spec.md`
  - Primary product specification for the medical-center workflow.
- `.ai/project-context.md`
  - Current implementation snapshot, stack, and requirement alignment notes.
- `.ai/architecture-notes.md`
  - Electron, preload, renderer, Prisma, and packaging boundaries.
- `.ai/task-skills.md`
  - Repo-local task skills and startup checklists.
- `.ai/workflow-rules.md`
  - Default execution rules for feature work, UI work, and data/reporting changes.

## Required startup routine

Before editing code:

1. Read this `AGENTS.md`.
2. Read `.ai/project-context.md`.
3. Read `.ai/task-skills.md`.
4. Re-read `.ai/product-spec.md` if the task affects features, data, labels, billing, search, or print/report output.
5. Create or update task notes in `.ai/tasks/` before substantial feature work.

## Routing guide

- For business logic or feature changes:
  - Refer to `.ai/product-spec.md`
  - Refer to `.ai/project-context.md`
  - Refer to `.ai/task-skills.md`
  - Refer to `.ai/tasks/*.md`
- For Electron / IPC / preload work:
  - Refer to `.ai/architecture-notes.md`
  - Refer to `.ai/task-skills.md`
- For renderer / styling / print UI work:
  - Refer to `.ai/project-context.md`
  - Refer to `.ai/task-skills.md`
  - Refer to `.ai/workflow-rules.md`
- For Prisma or database changes:
  - Refer to `.ai/architecture-notes.md`
  - Refer to `.ai/task-skills.md`
  - Refer to `.ai/product-spec.md`

## Repository-specific instructions

- Treat `.ai/product-spec.md` as higher priority than scaffold/starter code.
- Do not assume the current `User` model is the final domain design.
- Keep privileged logic in main/preload layers, not directly in the renderer.
- Preserve existing user changes in the worktree.
- If code and requirement diverge, prefer moving toward the requirement unless the user explicitly directs otherwise.
- For substantial feature work, record the work breakdown in `.ai/tasks/` first.
