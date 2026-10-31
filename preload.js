const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('winread', {
  // Window Titlebar Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onWindowStateChange: (callback) => {
    ipcRenderer.on('window:stateChange', (_, isMaximized) => callback(isMaximized));
  },

  // File Dialogs
  openFileDialog: () => ipcRenderer.invoke('dialog:openBook'),
  openReadEraBackupDialog: () => ipcRenderer.invoke('dialog:openReadEraBackup'),

  // Book Navigation & Reading
  openBook: (filePath) => ipcRenderer.invoke('worker:request', { action: 'openBook', payload: { filePath } }),
  loadChapter: (chapterIndex) => ipcRenderer.invoke('worker:request', { action: 'loadChapter', payload: { chapterIndex } }),
  closeBook: () => ipcRenderer.invoke('worker:request', { action: 'closeBook' }),

  // Progress & State
  updateProgress: (bookId, progressData) => ipcRenderer.invoke('worker:request', { action: 'updateProgress', payload: { bookId, progressData } }),
  setReadingStatus: (bookId, status) => ipcRenderer.invoke('worker:request', { action: 'setReadingStatus', payload: { bookId, status } }),
  getLibrary: (filter = 'all') => ipcRenderer.invoke('worker:request', { action: 'getLibrary', payload: { filter } }),

  // Bookmarks & Quotes
  getBookmarks: (bookId) => ipcRenderer.invoke('worker:request', { action: 'getBookmarks', payload: { bookId } }),
  addBookmark: (bookmark) => ipcRenderer.invoke('worker:request', { action: 'addBookmark', payload: bookmark }),
  deleteBookmark: (id) => ipcRenderer.invoke('worker:request', { action: 'deleteBookmark', payload: { id } }),

  getQuotes: (bookId) => ipcRenderer.invoke('worker:request', { action: 'getQuotes', payload: { bookId } }),
  addQuote: (quote) => ipcRenderer.invoke('worker:request', { action: 'addQuote', payload: quote }),
  deleteQuote: (id) => ipcRenderer.invoke('worker:request', { action: 'deleteQuote', payload: { id } }),

  // Sync Engine (MTP USB, Wi-Fi QR, ADB Bridge, Bluetooth, File import)
  getSyncInfo: (preferredIp = null) => ipcRenderer.invoke('worker:request', { action: 'getSyncInfo', payload: { preferredIp } }),
  openBluetoothReceive: () => ipcRenderer.invoke('sync:openBluetoothReceive'),
  connectAdbWireless: (ip) => ipcRenderer.invoke('worker:request', { action: 'connectAdbWireless', payload: { ip } }),
  syncFromMtp: (deviceName = '') => ipcRenderer.invoke('worker:request', { action: 'syncFromMtp', payload: { deviceName } }),
  fetchBookFromPhone: ({ bookId, title, format }) => ipcRenderer.invoke('worker:request', { action: 'fetchBookFromPhone', payload: { bookId, title, format } }),
  associateBookFile: (bookId, filePath) => ipcRenderer.invoke('worker:request', { action: 'associateBookFile', payload: { bookId, filePath } }),
  setupAdbForward: (serial = null) => ipcRenderer.invoke('worker:request', { action: 'setupAdbForward', payload: { serial } }),
  importReadEraBackup: (filePath) => ipcRenderer.invoke('worker:request', { action: 'importReadEraBackup', payload: { filePath } }),

  // Event Listeners from Worker (Sync, connection, errors)
  onSyncEvent: (callback) => {
    const events = ['sync:started', 'sync:updated', 'sync:error', 'sync:connected', 'sync:disconnected'];
    events.forEach(eventName => {
      ipcRenderer.on(eventName, (_, data) => callback(eventName, data));
    });
  }
});
