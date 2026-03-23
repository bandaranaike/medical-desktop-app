# Prisma Runtime Sync Task

## Goal

Fix runtime failures caused by Prisma package upgrades leaving the generated client output out of sync with the installed runtime.

## Scope

- Regenerate the Prisma client in `src/generated/prisma`.
- Ensure project scripts make Prisma generation part of normal install/update workflows.
- Verify that the generated client version matches the installed Prisma packages.
