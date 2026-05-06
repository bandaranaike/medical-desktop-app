# erbitron-medical-center-app

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

## Installed Windows App Configuration

For a packaged and installed Windows build, the app does not read the project `.env` file. It reads a `config.env` file from the Electron `userData` folder.

Use this file path:

```text
C:\Users\<your-user>\AppData\Roaming\erbitron-medical-center-app\config.env
```

Example on the current machine:

```text
C:\Users\eragr\AppData\Roaming\erbitron-medical-center-app\config.env
```

Do not place `config.env` or `.env` inside the install folder:

```text
C:\Users\eragr\AppData\Local\Programs\erbitron-medical-center-app
```

Notes:

- In development, the app reads `.env` from the project root.
- In the installed Windows app, the app reads `config.env` from `AppData\Roaming\erbitron-medical-center-app`.
- If `config.env` does not exist yet, the app creates a template automatically on first launch.

## When Changes Take Effect

- If you change `config.env` values such as `API_BASE_URL`, `API_KEY`, `API_REFERER`, `API_AUTH_TOKEN`, `PRINTER_BASE_URL`, `PRINTER_PORT`, or `PRINTER_FOLDER`, close the app completely and open it again.
- You do not need to reinstall the app for `config.env` changes.
- If you change packaged app metadata such as `productName`, `appId`, executable name, installer settings, or updater settings, rebuild and reinstall the app.
- For app-name or installer changes already made in source, the installed app will reflect them only after a new build is installed.
