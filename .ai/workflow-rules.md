# Workflow Rules

## Default execution rules for future tasks

- Start by reading `AGENTS.md`, then the relevant `.ai/*.md` file.
- Create or refresh `.ai/tasks/*.md` entries before substantial feature work.
- Ground decisions in the actual codebase, not the starter README.
- Preserve user changes already present in the worktree.
- Prefer incremental changes that keep the app runnable.

## When working on feature requests

- Map the request against `.ai/product-spec.md`.
- Note whether the code already supports it, partially supports it, or conflicts with it.
- If implementation and requirement differ, move toward the requirement unless the user says otherwise.

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

## When working on naming

- Existing code uses `User` for patient-like records.
- New work may introduce better domain naming if done consistently.
- Avoid mixing generic and domain-specific names in the same feature without a reason.

## When task details are ambiguous

- Ask the user only if the ambiguity changes data model, billing rules, or printed output in a risky way.
- Otherwise make the smallest reasonable assumption and proceed.
