# Workflow Rules

## Default execution rules for future tasks

- Start by reading `AGENTS.md`, then the relevant `.ai/*.md` file.
- Read `.ai/README.md` and `.ai/tasks/registry.md` before substantial feature work.
- Create or refresh structured task entries under `.ai/tasks/` before substantial feature work.
- Ground decisions in the actual codebase, not the starter README.
- Preserve user changes already present in the worktree.
- Prefer incremental changes that keep the app runnable.

## When working on feature requests

- Map the request against `.ai/product-spec.md`.
- Note whether the code already supports it, partially supports it, or conflicts with it.
- If implementation and requirement differ, move toward the requirement unless the user says otherwise.
- For API-backed features, verify whether an existing route already supports the need before proposing a new one.

## When working on UI tasks

- Favor simple operator workflows.
- Minimize typing and repeated data entry.
- Prefer explicit labels over clever compact UI.
- Keep desktop layout practical; this is an Electron app first.
- Preserve the current Tailwind dashboard direction unless the user asks to change it.
- Prefer reusable sections/components over one-off styling.

## When working on data or reporting

- Think through persistence, search, print output, and auditability together.
- Keep patient lookup behavior consistent across name, telephone, and registration number when relevant.
- Report generation should produce deterministic results from persisted data, not only transient UI state.
- After Prisma dependency or schema changes, regenerate the Prisma client before assuming the app runtime is healthy.
- If the feature persists through the API, verify the request/response shape against `.ai/resources/routes.json` and `.ai/resources/api-database.sql`.
- Keep the backend base URL configurable via `.env`. Current local value is `http://test-b.local/`.

## When working on API integration

- Route backend access through the Electron main/preload boundary.
- Prefer existing API routes from `.ai/resources/routes.json`.
- Confirm auth/header requirements in `.ai/resources/API_ENDPOINTS.md` before choosing an endpoint.
- If a missing route is necessary, specify the exact request, response, and persistence behavior before changing the UI around assumptions.
- Backend project path is `\\wsl.localhost\Ubuntu-24.04\home\eranda\test\test-b`.
- If backend filesystem access is unavailable, stop at a precise backend change request for the user instead of claiming the route exists.

## When working on naming

- Existing code uses `User` for patient-like records.
- New work may introduce better domain naming if done consistently.
- Avoid mixing generic and domain-specific names in the same feature without a reason.

## When task details are ambiguous

- Ask the user only if the ambiguity changes data model, billing rules, or printed output in a risky way.
- Otherwise make the smallest reasonable assumption and proceed.

## Task intake and tracking

- Raw user notes belong in `.ai/tasks/inbox/raw-user-tasks.md` and may be written in any language.
- Convert raw notes into structured task files before implementation when the work is substantial.
- Combine closely related raw notes into one structured task file when practical.
- Track each structured task in `.ai/tasks/registry.md`.
- If an older task note has an unclear state, keep it in `triage` instead of guessing whether it is open or done.
