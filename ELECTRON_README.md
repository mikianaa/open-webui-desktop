# Open WebUI Desktop Application

This repository now includes Electron support to run Open WebUI as a native desktop application on Windows, macOS, and Linux.

## Features

- **Native Desktop Experience**: Run Open WebUI as a standalone desktop application
- **All Web Features**: Maintains all functionality from the web version
- **Cross-Platform**: Supports Windows, macOS, and Linux
- **Integrated Backend**: Automatically starts and manages the Python backend server
- **Native Menus**: Platform-specific menu bars with keyboard shortcuts
- **Secure**: Uses Electron's security best practices with context isolation

## Prerequisites

Before building or running the desktop app, ensure you have:

1. **Node.js** (v18.13.0 or higher)
2. **Python** (3.11 or higher)

## Installation

### First-Time Setup

Due to peer dependency conflicts in the project, you need to install dependencies with the `--legacy-peer-deps` flag:

```bash
# 1. Clean install (if you have existing node_modules)
rm -rf node_modules package-lock.json

# 2. Install Node.js dependencies with legacy peer deps flag
npm install --legacy-peer-deps

# 3. Create Python virtual environment and install backend dependencies
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..
```

**Why use a virtual environment?**
- Modern Python installations (PEP 668) prevent system-wide package installations to avoid conflicts
- Virtual environments keep dependencies isolated and prevent "externally-managed-environment" errors
- The Electron app automatically detects and uses the `.venv` directory if it exists

**Optional**: To make the `--legacy-peer-deps` flag permanent for this project:
```bash
npm config set legacy-peer-deps true
```

### WSL (Windows Subsystem for Linux) Users

If you're running on WSL:

- **WSLg (GUI support) required**: The Electron app needs a graphical environment to display the window
- **Without WSLg**: Run the Electron app from native Windows PowerShell instead:
  ```powershell
  cd C:\Users\YourUsername\path\to\open-webui-desktop
  npm run electron:dev
  ```
- **Check WSLg**: Run `wslg --version` to verify WSLg is installed

## Development

### Running in Development Mode

The Electron app automatically detects and uses the Python virtual environment in `backend/.venv` if it exists. You don't need to manually activate the venv before running Electron.

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the Electron app:
   ```bash
   npm run electron:dev
   ```

This will:
- Build the SvelteKit frontend
- Automatically use the Python virtual environment (if `backend/.venv` exists)
- Start the Python backend server on localhost:8080
- Open the Electron window

**Note**: If you haven't created the virtual environment yet, the app will try to use system Python, which may fail on systems with PEP 668 protection. See the [Installation](#installation) section for venv setup.

### Quick Development Start

If you already have the frontend built:
```bash
npm run electron
```

## Building Desktop Applications

### Build for All Platforms

```bash
npm run electron:build
```

### Build for Specific Platforms

**macOS:**
```bash
npm run electron:build:mac
```

**Windows:**
```bash
npm run electron:build:win
```

**Linux:**
```bash
npm run electron:build:linux
```

### Build Output

Built applications will be in the `dist-electron/` directory:

- **macOS**: `.dmg` and `.zip` files
- **Windows**: `.exe` installer and portable `.exe`
- **Linux**: `.AppImage`, `.deb`, and `.rpm` packages

## Architecture

The desktop application consists of three main components:

1. **Electron Main Process** (`electron-main.js`):
   - Manages the application lifecycle
   - Starts the Python backend server
   - Creates and manages the browser window
   - Handles system integration (menus, shortcuts)

2. **Electron Preload Script** (`electron-preload.js`):
   - Provides secure bridge between main and renderer processes
   - Exposes limited APIs to the web content

3. **Backend Server** (`backend/`):
   - Python FastAPI server
   - Runs on localhost:8080
   - Automatically started by Electron

## Configuration

### Backend Port

The backend runs on port 8080 by default. To change this, modify the `BACKEND_PORT` constant in `electron-main.js`.

### Data Directory

User data is stored in the platform-specific application data directory:
- **macOS**: `~/Library/Application Support/Open WebUI/`
- **Windows**: `%APPDATA%/Open WebUI/`
- **Linux**: `~/.config/Open WebUI/`

## Keyboard Shortcuts

- **New Chat**: `Cmd/Ctrl + N`
- **Quit**: `Cmd/Ctrl + Q`
- **Reload**: `Cmd/Ctrl + R`
- **Toggle DevTools**: `Cmd/Ctrl + Shift + I` (or F12)
- **Zoom In**: `Cmd/Ctrl + Plus`
- **Zoom Out**: `Cmd/Ctrl + Minus`
- **Reset Zoom**: `Cmd/Ctrl + 0`

## Security

The desktop application follows Electron security best practices:

- **Context Isolation**: Enabled to separate Electron APIs from web content
- **Node Integration**: Disabled in renderer process
- **Web Security**: Enabled
- **Preload Script**: Uses secure IPC communication
- **External Links**: Opened in system browser, not in-app

## Troubleshooting

### "Cannot find package 'pyodide'" Error

This error occurs when npm dependencies are not properly installed. Fix it by:

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### "externally-managed-environment" Error (Python)

This error occurs on modern Python installations (PEP 668) that prevent system-wide package installations. Fix it by using a virtual environment:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..
```

The Electron app will automatically detect and use the `.venv` directory when starting the backend.

**Do NOT use `--break-system-packages`** as it can cause conflicts with your system Python installation.

### Peer Dependency Conflicts

If you see `ERESOLVE could not resolve` errors related to `@tiptap/extension-bubble-menu`:

```bash
npm install --legacy-peer-deps
```

Or set it permanently:
```bash
npm config set legacy-peer-deps true
npm install
```

### Backend Fails to Start

If the backend server fails to start:

1. Check that Python dependencies are installed:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Check the console logs for error messages
3. Ensure port 8080 is not already in use

### Application Won't Launch

1. Try rebuilding the frontend:
   ```bash
   npm run build
   ```

2. Check that all Electron dependencies are installed:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Look for error messages in the terminal

### Electron Window Doesn't Appear (WSL)

If you're on WSL and the Electron window doesn't appear:

1. Check if WSLg is installed: `wslg --version`
2. If WSLg is not available, run from Windows PowerShell instead
3. Alternatively, you can test the frontend separately:
   ```bash
   npm run build
   npm run preview
   # Then open http://localhost:4173 in your Windows browser
   ```

### Build Errors

If you encounter build errors:

1. Ensure all dependencies are up to date:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Clear the build cache:
   ```bash
   rm -rf dist-electron build
   npm run build
   ```

## Development Notes

### Hot Reload

The Electron app does not support hot reload. After making changes:

1. Rebuild the frontend: `npm run build`
2. Restart Electron: `npm run electron`

### Debugging

To debug the Electron app:

1. Open DevTools: `Cmd/Ctrl + Shift + I`
2. Check the main process logs in the terminal
3. Check the renderer process logs in DevTools

### Backend Logs

Backend logs are printed to the terminal where you started the Electron app.

## Contributing

When contributing to the Electron desktop app:

1. Test on multiple platforms if possible
2. Follow Electron security best practices
3. Update this README if adding new features
4. Ensure the app works both in development and production builds

## License

Same as the main Open WebUI project. See [LICENSE](./LICENSE) for details.
