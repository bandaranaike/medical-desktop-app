# Windows Runtime Config Task

## Goal

Make packaged Windows builds usable on another machine by loading runtime configuration from a stable local file instead of relying on a bundled `.env`.

## Scope

- Keep development `.env` loading unchanged.
- For packaged builds, create and read a `config.env` file from the Electron user-data directory.
- Improve missing-configuration errors so they point to the runtime config file path.
- Update the sample env file to explain the packaged-app behavior.
