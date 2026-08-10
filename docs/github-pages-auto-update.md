# Electron Auto-Updates with GitHub Pages

This guide explains how to publish updates for the Erbitron Medical Center Electron application using GitHub Pages.

The application currently uses `electron-updater` with the `generic` provider. GitHub Pages is used as a static HTTPS file host for the generated installer, `latest.yml`, and optional blockmap files.

## How the update works

The packaged application reads this setting from its runtime configuration:

```env
UPDATE_SERVER_URL=https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/updates
```

When the application starts, it checks that URL for `latest.yml`. If the version listed there is newer than the installed version, the application downloads the installer. The operator can then restart the application to install the update.

Development builds do not check for updates.

## One-time GitHub Pages setup

### 1. Create or choose a GitHub repository

The repository can be public or private for source-code storage, but the GitHub Pages update files must be publicly downloadable by the installed application. For a private repository, use a separate public Pages host or another authenticated update provider.

### 2. Enable GitHub Pages

In GitHub:

1. Open the repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose the branch that will contain the update files, usually `gh-pages`.
5. Choose the folder `/ (root)`.
6. Save the settings.

GitHub will provide a URL similar to:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

### 3. Create an update folder

Place the update artifacts in a stable folder such as `updates/` in the Pages branch:

```text
updates/
  latest.yml
  erbitron-medical-center-app-1.0.1-setup.exe
  erbitron-medical-center-app-1.0.1-setup.exe.blockmap
```

The final update feed URL is therefore:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/updates
```

Do not use the normal GitHub repository page URL. The URL must point to a folder from which `latest.yml` and the installer can be downloaded directly.

## Configure the installed application

Packaged applications use this file:

```text
%APPDATA%\erbitron-medical-center-app\config.env
```

Add or update:

```env
UPDATE_SERVER_URL=https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/updates
```

The application creates a template `config.env` on first launch if it does not exist. After changing this value, restart the application.

The development `.env` file is not used by an installed packaged build.

## Create a new release

### 1. Make and commit code changes

Use Git to track the source changes:

```powershell
git add .
git commit -m "Describe the change"
git push origin main
```

Git does not automatically create an Electron update. A new installer and update metadata must be generated for every release.

### 2. Increase the application version

Edit `package.json` and increase the version:

```json
{
  "version": "1.0.1"
}
```

Every update must have a higher version than the version currently installed on the client computer.

### 3. Build the Windows installer

From the project root, run:

```powershell
cmd /c npm run build:win
```

The generated files will be placed in `dist/`. The important files are:

- the Windows installer `.exe`
- `latest.yml`
- the `.blockmap` file, when generated

Keep the generated filenames unchanged. `latest.yml` refers to those filenames.

### 4. Publish the artifacts to GitHub Pages

Copy the contents of `dist/` into the Pages branch's `updates/` folder. The folder should contain the newest installer and metadata:

```text
updates/latest.yml
updates/erbitron-medical-center-app-1.0.1-setup.exe
updates/erbitron-medical-center-app-1.0.1-setup.exe.blockmap
```

Commit and push the Pages branch:

```powershell
git add updates
git commit -m "Publish application version 1.0.1"
git push origin gh-pages
```

If the source and Pages files are stored in separate repositories or branches, push the update artifacts to whichever branch GitHub Pages is configured to serve.

## Verify a release before testing the app

Open this URL in a browser:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/updates/latest.yml
```

It must return YAML text, not a GitHub HTML page or a 404 error.

Also verify that the installer URL mentioned inside `latest.yml` opens successfully. GitHub Pages can take a short time to publish changes, so wait for the new files to become available before checking from the Electron app.

## Test the update

1. Install an older packaged version, for example `1.0.0`.
2. Confirm its `config.env` contains the GitHub Pages update URL.
3. Publish version `1.0.1` and wait until `latest.yml` is available.
4. Start the older application.
5. Use the application's manual **Check for updates** action, or wait for the startup check.
6. Wait for the download to finish.
7. Choose the restart/install action.
8. Confirm that the application version is now `1.0.1`.

Do not test this using `npm run dev`; updater checks are intentionally disabled in development mode.

## Release checklist

- [ ] `package.json` version was increased.
- [ ] `cmd /c npm run build:win` completed successfully.
- [ ] `latest.yml` was uploaded.
- [ ] The installer referenced by `latest.yml` was uploaded.
- [ ] The blockmap referenced by `latest.yml` was uploaded, if present.
- [ ] `UPDATE_SERVER_URL` points to the GitHub Pages `updates` folder.
- [ ] `latest.yml` opens directly in a browser.
- [ ] The installed application is an earlier version.
- [ ] The update was tested from the installed application.

## Common mistakes

### Using the GitHub repository URL

This is incorrect:

```text
https://github.com/YOUR-USERNAME/YOUR-REPOSITORY
```

Use the GitHub Pages URL instead:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/updates
```

### Uploading only the installer

The updater needs `latest.yml` to discover the new version. Upload the metadata and all referenced files together.

### Forgetting to increase the version

If the new build has the same version as the installed build, the updater will correctly report that no update is available.

### Editing the wrong configuration file

Installed builds read `config.env` from the application user's `%APPDATA%` directory. They do not read the repository `.env` file.

### Replacing `latest.yml` before uploading the installer

Upload the installer and its blockmap before or at the same time as `latest.yml`. Otherwise clients may discover an update whose download file is not available yet.

### Publishing GitHub Pages files in a non-public location

The installed application must be able to download the files without an interactive GitHub login.
