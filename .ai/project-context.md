# Project Context

## What this project is

- Desktop application built with Electron, React, TypeScript, and `electron-vite`.
- Intended business domain: medical center / clinic billing and appointment reporting.
- Current implementation is partially scaffold-derived and does not yet fully match the business requirement in `.ai/product-spec.md`.

## Current stack

- Electron main process: `src/main/index.ts`
- Preload bridge: `src/preload/index.ts`
- Renderer app: `src/renderer/src/App.tsx`
- Styling: Tailwind CSS v4 plus custom CSS in `src/renderer/src/assets/main.css`
- Database: SQLite via Prisma + `@prisma/adapter-better-sqlite3`
- Prisma schema: `prisma/schema.prisma`
- Packaging: `electron-builder.yml`

## Current data model snapshot

- Only `User` exists in Prisma right now.
- `User` stores patient-like fields:
  - `name`
  - `email`
  - `telephone`
  - `registrationNo`
  - `gender`
  - `address`
- No doctor, appointment, billing, shift, service catalog, or report models exist yet.

## Current app behavior snapshot

- Renderer now uses a dark Tailwind-based dashboard layout inspired by a modern SaaS control panel aesthetic.
- Home page is organized around:
  - patient information
  - date and shift selection
  - operation tabs: OPD, Channeling, Dental, Others
  - operation-specific billing inputs
  - summary and print action
- Patient lookup is implemented through preload IPC and Prisma search.
- Search supports `name`, `email`, `telephone`, and `registrationNo` through the current backend search handler.
- Doctor data shown on the home page is currently temporary UI-side seed data, not persisted database data.
- Dental charges support in-house and referred split calculations in the UI.
- Print currently uses `window.print()`.

## Requirement alignment guidance

- Treat `.ai/product-spec.md` as the primary product requirement.
- When the code conflicts with `.ai/product-spec.md`, prefer the requirement unless the user explicitly asks otherwise.
- Do not assume the current `User` model is the final domain model.
- Prefer designing around these business concepts for future work:
  - patients
  - doctors
  - visit types: OPD, Channeling, Dental, Others
  - shift selection: Morning / Evening
  - billing split rules for Dental
  - printable reports

## Working assumptions for future tasks

- This app targets non-technical operators, so workflows must stay simple and low-friction.
- Search/autofill by telephone and patient name is a core behavior, not a nice-to-have.
- Reporting and print output are first-class features.
- New features should be wired through main/preload/renderer boundaries instead of bypassing Electron security patterns.
- When doing substantial feature work, create or update `.ai/tasks/*.md` first.
