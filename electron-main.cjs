const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 8080;
const BACKEND_HOST = '127.0.0.1';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'static', 'favicon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    backgroundColor: '#0f0f0f',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://docs.openwebui.com/');
          }
        },
        {
          label: 'GitHub Repository',
          click: () => {
            shell.openExternal('https://github.com/open-webui/open-webui');
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            const packageJson = require('./package.json');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Open WebUI',
              message: 'Open WebUI',
              detail: `Version: ${packageJson.version}\n\nAn extensible, feature-rich, and user-friendly self-hosted AI platform.`
            });
          }
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);

  waitForBackend()
    .then(() => {
      mainWindow.loadURL(BACKEND_URL);
    })
    .catch((err) => {
      console.error('Failed to start backend:', err);
      dialog.showErrorBox(
        'Backend Error',
        'Failed to start the backend server. Please check the logs and try again.'
      );
      app.quit();
    });
}

  function startBackend() {
  return new Promise((resolve, reject) => {
    const backendDir = path.join(__dirname, 'backend');
    const startScript = path.join(backendDir, 'start.sh');
    const startScriptWindows = path.join(backendDir, 'start_windows.bat');

    let command;
    let args = [];
    let options = {
      cwd: backendDir,
      env: {
      ...process.env,
      PORT: BACKEND_PORT.toString(),
      HOST: BACKEND_HOST,
      WEBUI_SECRET_KEY: process.env.WEBUI_SECRET_KEY || '',
        DATA_DIR: path.join(app.getPath('userData'), 'data')
      },
      shell: true 
    };

    if (!fs.existsSync(options.env.DATA_DIR)) {
      fs.mkdirSync(options.env.DATA_DIR, { recursive: true });
    }

    // Automatically detect and use Python virtual environment if it exists
    const venvBinDir = process.platform === 'win32'
      ? path.join(backendDir, '.venv', 'Scripts')
      : path.join(backendDir, '.venv', 'bin');
    
    if (fs.existsSync(venvBinDir)) {
      console.log('Detected Python virtual environment at:', venvBinDir);
      // Prepend venv bin directory to PATH so Python commands use the venv
      options.env.PATH = `${venvBinDir}${path.delimiter}${options.env.PATH}`;
    } else {
      console.log('No virtual environment detected. Using system Python.');
    }

    if (process.platform === 'win32') {
      if (fs.existsSync(startScriptWindows)) {
        command = startScriptWindows;
      } else {
        command = 'python';
        args = ['-m', 'uvicorn', 'open_webui.main:app', '--host', BACKEND_HOST, '--port', BACKEND_PORT.toString()];
      }
    } else {
      if (fs.existsSync(startScript)) {
        command = startScript;
      } else {
        command = 'python3';
        args = ['-m', 'uvicorn', 'open_webui.main:app', '--host', BACKEND_HOST, '--port', BACKEND_PORT.toString()];
      }
    }

    console.log('Starting backend:', command, args.join(' '));

    backendProcess = spawn(command, args, options);

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend stdout: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend stderr: ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend process:', error);
      reject(error);
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend process exited with code ${code} and signal ${signal}`);
      if (code !== 0 && code !== null) {
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    resolve();
  });
}

function waitForBackend(maxAttempts = 60, interval = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkBackend = () => {
      attempts++;
      console.log(`Checking backend (attempt ${attempts}/${maxAttempts})...`);

      const req = http.get(`${BACKEND_URL}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('Backend is ready!');
          resolve();
        } else {
          if (attempts < maxAttempts) {
            setTimeout(checkBackend, interval);
          } else {
            reject(new Error('Backend health check failed'));
          }
        }
      });

      req.on('error', (err) => {
        if (attempts < maxAttempts) {
          setTimeout(checkBackend, interval);
        } else {
          reject(new Error(`Backend not responding after ${maxAttempts} attempts: ${err.message}`));
        }
      });

      req.end();
    };

    checkBackend();
  });
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend process...');
    backendProcess.kill();
    backendProcess = null;
  }
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (err) {
    console.error('Failed to initialize app:', err);
    dialog.showErrorBox(
      'Initialization Error',
      'Failed to start the application. Please check the logs and try again.'
    );
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});

process.on('SIGINT', () => {
  stopBackend();
  app.quit();
});

process.on('SIGTERM', () => {
  stopBackend();
  app.quit();
});
