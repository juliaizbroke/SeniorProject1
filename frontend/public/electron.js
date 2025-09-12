const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;
let backendProcess;
let splashWindow;

// Enable live reload for Electron in development
if (isDev) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (error) {
    console.log('electron-reload not available in production mode');
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Create a simple splash screen HTML
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: Arial, sans-serif;
          color: white;
        }
        .container {
          text-align: center;
        }
        .spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top: 3px solid white;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        h2 { margin: 0 0 10px 0; }
        p { margin: 0; opacity: 0.8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h2>Exam Generator</h2>
        <p>Starting application...</p>
      </div>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev, // Disable web security in dev for localhost
      preload: path.join(__dirname, 'preload.js')
    },
    icon: getIconPath(),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  // Load the app
  let startUrl;
  
  // Check if we're in true development mode (dev server running)
  if (isDev && process.env.ELECTRON_DEV) {
    startUrl = 'http://localhost:3000';
  } else {
    // For static export, we need to use a static file server
    const express = require('express');
    const path = require('path');
    const staticApp = express();
    const staticPort = 3001;
    
    // Configure Express to serve static files with proper MIME types
    staticApp.use('/_next/static', express.static(path.join(__dirname, '../out/static'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.woff2')) {
          res.setHeader('Content-Type', 'font/woff2');
        } else if (filePath.endsWith('.woff')) {
          res.setHeader('Content-Type', 'font/woff');
        }
      }
    }));
    
    // Also serve static files directly
    staticApp.use('/static', express.static(path.join(__dirname, '../out/static')));
    
    // Serve favicon
    staticApp.get('/favicon.ico', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/favicon.ico'));
    });
    
    // Serve individual HTML pages
    staticApp.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../out/server/app/index.html'));
    });
    
    staticApp.get('/home', (req, res) => {
      res.sendFile(path.join(__dirname, '../out/server/app/home.html'));
    });
    
    staticApp.get('/category', (req, res) => {
      res.sendFile(path.join(__dirname, '../out/server/app/category.html'));
    });
    
    staticApp.get('/edit', (req, res) => {
      res.sendFile(path.join(__dirname, '../out/server/app/edit.html'));
    });
    
    staticApp.get('/preview', (req, res) => {
      res.sendFile(path.join(__dirname, '../out/server/app/preview.html'));
    });
    
    staticApp.get('/similarity', (req, res) => {
      res.sendFile(path.join(__dirname, '../out/server/app/similarity.html'));
    });
    
    staticApp.get('/download', (req, res) => {
      res.sendFile(path.join(__dirname, '../out/server/app/download.html'));
    });
    
    // Start static file server
    staticApp.listen(staticPort, () => {
      console.log(`Static file server running on port ${staticPort} with proper MIME types`);
    });
    
    startUrl = `http://localhost:${staticPort}`;
  }
  
  console.log('Loading URL:', startUrl);
  console.log('isDev:', isDev, 'ELECTRON_DEV:', process.env.ELECTRON_DEV);
  mainWindow.loadURL(startUrl);

  // Show window when ready and hide splash
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    
    // Focus the window
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Create application menu
  createMenu();
}

function getIconPath() {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 
                   process.platform === 'darwin' ? 'icon.icns' : 'icon.png';
  return path.join(__dirname, iconName);
}

function createMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Exam',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-exam');
          }
        },
        { type: 'separator' },
        ...(process.platform === 'darwin' ? [] : [{ role: 'quit' }])
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
        ...(process.platform === 'darwin' ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { type: 'separator' },
          { role: 'selectAll' }
        ])
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
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [])
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Exam Generator',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Exam Generator',
              message: 'Exam Generator v1.0.0',
              detail: 'A desktop application for generating exam papers and answer keys.\n\nBuilt with Electron, Next.js, and Python Flask.'
            });
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            // Placeholder for update functionality
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Updates',
              message: 'You are running the latest version!'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function findPythonExecutable() {
  return new Promise((resolve) => {
    const possiblePaths = [
      'python3',
      'python',
      '/usr/bin/python3',
      '/usr/local/bin/python3',
      process.platform === 'win32' ? 'py' : null
    ].filter(Boolean);

    let tried = 0;
    
    function tryNext() {
      if (tried >= possiblePaths.length) {
        resolve(null);
        return;
      }
      
      const pythonPath = possiblePaths[tried++];
      exec(`${pythonPath} --version`, (error) => {
        if (error) {
          tryNext();
        } else {
          resolve(pythonPath);
        }
      });
    }
    
    tryNext();
  });
}

async function startBackend() {
  if (isDev && process.env.ELECTRON_DEV) {
    console.log('Development mode: Backend should be started manually');
    return;
  }

  try {
    console.log('Starting Python backend...');
    
    // Find Python executable
    const pythonExe = await findPythonExecutable();
    if (!pythonExe) {
      throw new Error('Python not found. Please install Python 3.8 or higher.');
    }

    console.log('Using Python executable:', pythonExe);

    // Get backend path
    const backendPath = isDev 
      ? path.join(__dirname, '../../backend')
      : path.join(process.resourcesPath, 'backend');

    console.log('Backend path:', backendPath);

    // Check if backend directory exists
    if (!fs.existsSync(backendPath)) {
      throw new Error(`Backend directory not found: ${backendPath}`);
    }

    // Check if virtual environment exists, create if not
    const venvPath = path.join(backendPath, 'venv');
    if (!fs.existsSync(venvPath)) {
      console.log('Creating Python virtual environment...');
      const venvProcess = spawn(pythonExe, ['-m', 'venv', 'venv'], {
        cwd: backendPath,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      await new Promise((resolve) => {
        venvProcess.on('close', (code) => {
          if (code === 0) {
            console.log('Virtual environment created successfully');
          } else {
            console.log('Failed to create virtual environment, continuing...');
          }
          resolve(true);
        });
      });
    }

    // Use virtual environment Python
    const venvPython = process.platform === 'win32' 
      ? path.join(venvPath, 'Scripts', 'python.exe')
      : path.join(venvPath, 'bin', 'python');

    // Install requirements using virtual environment
    if (fs.existsSync(venvPython)) {
      console.log('Installing Python requirements in virtual environment...');
      const installProcess = spawn(venvPython, ['-m', 'pip', 'install', '-r', 'requirements.txt'], {
        cwd: backendPath,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      installProcess.stdout.on('data', (data) => {
        console.log(`Install: ${data}`);
      });

      installProcess.stderr.on('data', (data) => {
        console.log(`Install stderr: ${data}`);
      });

      await new Promise((resolve) => {
        installProcess.on('close', (code) => {
          if (code === 0) {
            console.log('Requirements installed successfully');
          } else {
            console.log('Requirements installation failed, continuing anyway...');
          }
          resolve(true);
        });
      });

      // Update pythonExe to use venv python for running the app
      console.log('Using virtual environment Python:', venvPython);
    } else {
      console.log('Virtual environment Python not found, using system Python');
    }

    // Start the backend server
    console.log('Starting Flask server...');
    const finalPythonExe = (fs.existsSync(venvPython)) ? venvPython : pythonExe;
    console.log('Using Python executable for Flask:', finalPythonExe);
    
    backendProcess = spawn(finalPythonExe, ['app.py'], {
      cwd: backendPath,
      env: { 
        ...process.env, 
        PORT: '5001',
        FLASK_ENV: 'production',
        PYTHONPATH: backendPath
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.log(`Backend error: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend process:', error);
    });

    // Wait for backend to be ready
    console.log('Waiting for backend to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('Error starting backend:', error);
    
    dialog.showErrorBox(
      'Backend Error', 
      `Failed to start the backend server: ${error.message}\n\nPlease ensure Python 3.8+ is installed and try again.`
    );
  }
}

// App event handlers
app.whenReady().then(async () => {
  console.log('App is ready, starting...');
  
  // Show splash screen
  createSplashWindow();
  
  // Start backend first
  await startBackend();
  
  // Create main window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Kill backend process
  if (backendProcess) {
    console.log('Killing backend process...');
    backendProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
});

// Handle app updates and other events
app.on('ready', () => {
  // Set app user model id for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.seniorproject.examgenerator');
  }
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Word Documents', extensions: ['docx'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

// Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault();
    }
  });
});
