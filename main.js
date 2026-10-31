const { app, BrowserWindow, ipcMain, dialog, utilityProcess, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Completely remove default application menu ("File Edit View Window Help")
Menu.setApplicationMenu(null);

let mainWindow = null;
let workerProcess = null;
const pendingRequests = new Map();
let correlationCounter = 1;

function createWindow() {
  const icoPath = path.join(__dirname, 'assets', 'icon.ico');
  const pngPath = path.join(__dirname, 'assets', 'icon.png');
  const iconPath = fs.existsSync(icoPath) ? icoPath : (fs.existsSync(pngPath) ? pngPath : undefined);

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 860,
    minHeight: 580,
    backgroundColor: '#0d0d0f',
    title: 'WinRead',
    frame: false, // Frameless custom titlebar
    autoHideMenuBar: true,
    roundedCorners: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    console.log(`[Renderer Console] [${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Notify renderer on maximize / restore to toggle window button icons
  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:stateChange', true);
    }
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:stateChange', false);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function spawnWorker() {
  const workerPath = path.join(__dirname, 'worker.js');
  workerProcess = utilityProcess.fork(workerPath, { stdio: 'inherit' });

  workerProcess.on('message', (message) => {
    const { action, payload, correlationId } = message;

    if (correlationId && pendingRequests.has(correlationId)) {
      const { resolve, reject } = pendingRequests.get(correlationId);
      pendingRequests.delete(correlationId);

      if (action === 'error') {
        reject(new Error(payload.error || 'Worker error'));
      } else {
        resolve(payload);
      }
      return;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(action, payload);
    }
  });

  workerProcess.on('exit', (code) => {
    console.log(`Worker process exited with code ${code}`);
  });

  const userDataPath = app.getPath('userData');
  return sendWorkerRequest('init', { userDataPath }).catch(err => {
    console.error('Failed to initialize worker:', err);
  });
}

function sendWorkerRequest(action, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!workerProcess) {
      return reject(new Error('Worker process not running'));
    }
    const correlationId = correlationCounter++;
    pendingRequests.set(correlationId, { resolve, reject });
    workerProcess.postMessage({ action, payload, correlationId });

    setTimeout(() => {
      if (pendingRequests.has(correlationId)) {
        pendingRequests.delete(correlationId);
        reject(new Error(`Worker request timeout for action: ${action}`));
      }
    }, 30000);
  });
}

// App lifecycle
app.whenReady().then(async () => {
  await spawnWorker();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (workerProcess) {
    try {
      workerProcess.kill();
    } catch (_) {}
  }
});

// IPC Handlers connecting Preload -> Worker
ipcMain.handle('worker:request', async (_, { action, payload }) => {
  return await sendWorkerRequest(action, payload);
});

// Window controls IPC for custom titlebar
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Native file open dialogs
ipcMain.handle('dialog:openBook', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open E-Book',
    properties: ['openFile'],
    filters: [
      { name: 'All Supported Books', extensions: ['epub', 'fb2', 'zip', 'mobi', 'prc', 'txt'] },
      { name: 'EPUB Books (*.epub)', extensions: ['epub'] },
      { name: 'FictionBook (*.fb2, *.fb2.zip)', extensions: ['fb2', 'zip'] },
      { name: 'Mobipocket (*.mobi, *.prc)', extensions: ['mobi', 'prc'] },
      { name: 'Plain Text (*.txt)', extensions: ['txt'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('dialog:openReadEraBackup', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import ReadEra Backup File',
    properties: ['openFile'],
    filters: [
      { name: 'ReadEra Backup (*.bak, *.backup, *.zip, *.db, *.json)', extensions: ['bak', 'backup', 'zip', 'db', 'sqlite', 'json'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});
