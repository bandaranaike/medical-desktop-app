# Startup Error Toasts

- Add a shared app notification channel from Electron main to renderer through preload.
- Fix ignored startup promises in `src/main/index.ts` by routing failures through a common reporter.
- Add reusable top-right toast notifications for `error`, `warning`, `info`, and `success`.
- Keep styling aligned with the current dark glassy dashboard theme and cyan accent direction.
