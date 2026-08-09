# Self-Update Support

## Meta

- ID: `TASK-129`
- Status: `done`
- Owner: `agent`
- Source: user request on `2026-08-08`
- Last Updated: `2026-08-08`

## Goal

Allow installed Windows builds to check for, download, and install newer published application versions without a physical reinstall visit.

## Scope

- wire `electron-updater` through the Electron main process
- keep the update feed configurable through packaged runtime configuration
- check automatically for packaged builds and expose a manual check action
- notify operators when an update is available, downloaded, unavailable, or failed
- offer restart-and-install only after a complete download
- document the publishing prerequisite and feed format

## Constraints

- do not check or download updates in development mode
- do not put updater access in the renderer beyond the narrow preload bridge
- never auto-restart while a bill or print operation is in progress; installation is operator-triggered
- generic provider requires published artifacts and a matching latest.yml on the update server

## Done When

- packaged builds can check the configured feed and download updates
- the operator can manually check and restart to install
- updater failures are visible but do not prevent normal billing
- typecheck/build pass

## Release Handoff

- Set `UPDATE_SERVER_URL` in the packaged runtime config to the HTTPS folder hosting the generated generic-provider files.
- Publish the installer and `latest.yml` (plus the blockmap when generated) from each release build.
- Increase `package.json` version for every release before running the Windows packaging command.
- Existing installations need one manually installed build containing this updater wiring; later releases can update themselves.
