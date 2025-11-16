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
3. **Python Dependencies**: Install backend requirements
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

## Development

### Running in Development Mode

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
- Start the Python backend server
- Open the Electron window

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
   npm install
   ```

3. Look for error messages in the terminal

### Build Errors

If you encounter build errors:

1. Ensure all dependencies are up to date:
   ```bash
   npm install
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
