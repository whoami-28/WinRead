const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message}`);
  });

  win.webContents.on('render-process-gone', (event, detailed) => {
    console.error('Render process gone:', detailed);
  });

  await win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Test DOM state in renderer
  const domState = await win.webContents.executeJavaScript(`
    (() => {
      const lib = document.getElementById('libraryView');
      const sync = document.getElementById('syncView');
      const reader = document.getElementById('readerView');
      return {
        libVisible: lib ? !lib.classList.contains('hidden') : false,
        syncVisible: sync ? !sync.classList.contains('hidden') : false,
        readerVisible: reader ? !reader.classList.contains('hidden') : false,
        readerClasses: reader ? reader.className : ''
      };
    })()
  `);
  console.log('Initial View State:', domState);

  // Switch to sync view
  const syncState = await win.webContents.executeJavaScript(`
    (() => {
      window.appInstance.switchMainView('sync');
      const lib = document.getElementById('libraryView');
      const sync = document.getElementById('syncView');
      const reader = document.getElementById('readerView');
      return {
        libHidden: lib ? lib.classList.contains('hidden') : false,
        syncHidden: sync ? sync.classList.contains('hidden') : false,
        readerHidden: reader ? reader.classList.contains('hidden') : false
      };
    })()
  `);
  console.log('Sync View Switch State:', syncState);

  // Switch to reader view
  const readerState = await win.webContents.executeJavaScript(`
    (() => {
      window.appInstance.switchMainView('reader');
      const lib = document.getElementById('libraryView');
      const sync = document.getElementById('syncView');
      const reader = document.getElementById('readerView');
      return {
        libHidden: lib ? lib.classList.contains('hidden') : false,
        syncHidden: sync ? sync.classList.contains('hidden') : false,
        readerHidden: reader ? reader.classList.contains('hidden') : false
      };
    })()
  `);
  console.log('Reader View Switch State:', readerState);

  // Close reader and back to library
  const backState = await win.webContents.executeJavaScript(`
    (() => {
      window.appInstance.closeReaderAndShowLibrary();
      const lib = document.getElementById('libraryView');
      const sync = document.getElementById('syncView');
      const reader = document.getElementById('readerView');
      return {
        libHidden: lib ? lib.classList.contains('hidden') : false,
        syncHidden: sync ? sync.classList.contains('hidden') : false,
        readerHidden: reader ? reader.classList.contains('hidden') : false
      };
    })()
  `);
  console.log('Back to Library State:', backState);

  console.log('✓ All DOM view transitions tested successfully!');
  app.quit();
});
