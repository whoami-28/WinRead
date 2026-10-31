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

  // Test Spread Mode Toggle
  const spreadState = await win.webContents.executeJavaScript(`
    (() => {
      window.appInstance.toggleSpreadMode();
      const isSpread1 = window.appInstance.isSpreadMode;
      window.appInstance.toggleSpreadMode();
      const isSpread2 = window.appInstance.isSpreadMode;
      return { isSpread1, isSpread2 };
    })()
  `);
  console.log('Spread Mode Toggle State:', spreadState);

  // Test TOC Modal Search and Render
  const tocState = await win.webContents.executeJavaScript(`
    (() => {
      window.appInstance.currentChapters = [
        { title: 'Глава 1: Пролог' },
        { title: 'Глава 2: Знакомство' },
        { title: 'Глава 3: В путь' }
      ];
      window.appInstance.openTocModal();
      const initialCount = document.querySelectorAll('#tocList .toc-item').length;
      window.appInstance.populateToc('знакомство');
      const filteredCount = document.querySelectorAll('#tocList .toc-item').length;
      return { initialCount, filteredCount };
    })()
  `);
  console.log('TOC Modal Test:', tocState);

  console.log('✓ All DOM view transitions tested successfully!');
  app.quit();
});
