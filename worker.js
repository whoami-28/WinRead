const path = require('path');
const fs = require('fs');
const { ReaderDatabase } = require('./db/database');
const { BookParser } = require('./parsers/index');
const { SyncServer } = require('./sync/sync-server');
const { AdbBridge } = require('./sync/adb-bridge');
const { MtpBridge } = require('./sync/mtp-bridge');
const { ReadEraParser } = require('./sync/readera-parser');

// IPC port adapter: works with Electron utilityProcess (process.parentPort) or Node child_process
const ipcPort = process.parentPort || process;

function sendToMain(action, payload, correlationId = null) {
  const msg = { action, payload, correlationId };
  if (process.parentPort) {
    process.parentPort.postMessage(msg);
  } else if (process.send) {
    process.send(msg);
  }
}

// Global state in worker thread
let db = null;
let syncServer = null;
let adbBridge = null;
let mtpBridge = null;
let currentBook = null;
let initPromise = null;
let userStoragePath = null;

async function initWorker(userDataPath) {
  if (initPromise) return initPromise;
  userStoragePath = userDataPath;
  initPromise = (async () => {
    const dbDir = userDataPath || path.join(__dirname, 'data');
    const dbPath = path.join(dbDir, 'winread.sqlite');

    db = new ReaderDatabase(dbPath);
    await db.init();

    // Initialize bridges
    adbBridge = new AdbBridge();
    mtpBridge = new MtpBridge();

    // Initialize and start Sync Server
    syncServer = new SyncServer(db, { port: 8765 });
    syncServer.setEventListener((eventName, payload) => {
      sendToMain(eventName, payload);
    });

    const syncInfo = await syncServer.start();
    return { dbPath, syncInfo };
  })();
  return initPromise;
}

async function ensureInitialized() {
  if (initPromise) {
    await initPromise;
  }
}

// Handle incoming commands
async function handleMessage(message) {
  const { action, payload, correlationId } = message;

  try {
    if (action !== 'init') {
      await ensureInitialized();
    }

    switch (action) {
      case 'init': {
        const result = await initWorker(payload.userDataPath);
        sendToMain('init:response', result, correlationId);
        break;
      }

      case 'getLibrary': {
        const books = db.getLibrary(payload?.filter);

        // Auto-match books with files in data/books and populate missing covers
        const booksDir = path.join(userStoragePath || path.join(__dirname, 'data'), 'books');
        if (fs.existsSync(booksDir)) {
          const files = fs.readdirSync(booksDir);
          for (const book of books) {
            if (!book.path || !fs.existsSync(book.path)) {
              const cleanTitle = (book.title || '').toLowerCase().replace(/[^\w\dа-яё]/gi, '');
              const matched = files.find(f => {
                const cf = f.toLowerCase().replace(/[^\w\dа-яё]/gi, '');
                return cleanTitle.length > 3 && (cf.includes(cleanTitle) || cleanTitle.includes(cf));
              });
              if (matched) {
                const fullP = path.join(booksDir, matched);
                book.path = fullP;
                db.run('UPDATE books SET path = ? WHERE id = ?', [fullP, book.id]);
              }
            }

            // Extract cover if missing but path exists
            if (book.path && !book.cover_data && fs.existsSync(book.path)) {
              try {
                BookParser.open(book.path).then(pBook => {
                  if (pBook && pBook.coverDataUrl) {
                    book.cover_data = pBook.coverDataUrl;
                    db.run('UPDATE books SET cover_data = ? WHERE id = ?', [pBook.coverDataUrl, book.id]);
                  }
                  if (pBook && typeof pBook.close === 'function') pBook.close();
                }).catch(() => {});
              } catch (_) {}
            }
          }
        }

        sendToMain('getLibrary:response', { books }, correlationId);
        break;
      }

      case 'openBook': {
        const { filePath } = payload;
        // Clean up previous book instance to prevent memory leaks
        if (currentBook) {
          try {
            currentBook.close();
          } catch (_) {}
          currentBook = null;
        }

        const book = await BookParser.open(filePath);
        currentBook = book;

        // Upsert into database
        const stat = fs.statSync(filePath);
        let existingBook = db.get('SELECT * FROM books WHERE path = ?', [filePath]);
        if (!existingBook && book.title) {
          existingBook = db.get('SELECT * FROM books WHERE title = ? AND format = ?', [book.title, book.format]);
        }
        if (existingBook) {
          book.id = existingBook.id;
        }

        const savedBook = db.upsertBook({
          id: book.id,
          title: book.title,
          author: book.author,
          format: book.format,
          path: filePath,
          file_size: stat.size,
          cover_data: book.coverDataUrl,
          total_chapters: book.chapters.length
        });

        // Normalize current_chapter if out of bounds (e.g. from ReadEra mobile page count)
        if (savedBook && book.chapters.length > 0 && savedBook.current_chapter >= book.chapters.length) {
          const ratio = (savedBook.progress_percent || 0) / 100;
          savedBook.current_chapter = Math.max(0, Math.min(book.chapters.length - 1, Math.floor(ratio * book.chapters.length)));
          db.run('UPDATE books SET current_chapter = ? WHERE id = ?', [savedBook.current_chapter, savedBook.id]);
        }

        sendToMain('openBook:response', {
          bookInfo: {
            id: book.id,
            title: book.title,
            author: book.author,
            format: book.format,
            chapters: book.chapters,
            totalChapters: book.chapters.length,
            readingState: savedBook
          }
        }, correlationId);
        break;
      }

      case 'loadChapter': {
        const { chapterIndex } = payload;
        if (!currentBook) {
          throw new Error('No book currently open');
        }

        const blocks = await currentBook.loadChapterBlocks(chapterIndex);
        sendToMain('loadChapter:response', { chapterIndex, blocks }, correlationId);
        break;
      }

      case 'closeBook': {
        if (currentBook) {
          try {
            currentBook.close();
          } catch (_) {}
          currentBook = null;
        }
        sendToMain('closeBook:response', { success: true }, correlationId);
        break;
      }

      case 'updateProgress': {
        const { bookId, progressData } = payload;
        db.updateProgress(bookId, progressData);
        sendToMain('updateProgress:response', { success: true }, correlationId);
        break;
      }

      case 'setReadingStatus': {
        const { bookId, status } = payload;
        db.setReadingStatus(bookId, status);
        sendToMain('setReadingStatus:response', { success: true }, correlationId);
        break;
      }

      // Bookmarks & Quotes
      case 'getBookmarks': {
        const bookmarks = db.getBookmarks(payload.bookId);
        sendToMain('getBookmarks:response', { bookmarks }, correlationId);
        break;
      }

      case 'addBookmark': {
        const bookmark = db.addBookmark(payload);
        sendToMain('addBookmark:response', { bookmark }, correlationId);
        break;
      }

      case 'deleteBookmark': {
        db.deleteBookmark(payload.id);
        sendToMain('deleteBookmark:response', { success: true }, correlationId);
        break;
      }

      case 'getQuotes': {
        const quotes = db.getQuotes(payload.bookId);
        sendToMain('getQuotes:response', { quotes }, correlationId);
        break;
      }

      case 'addQuote': {
        const quote = db.addQuote(payload);
        sendToMain('addQuote:response', { quote }, correlationId);
        break;
      }

      case 'deleteQuote': {
        db.deleteQuote(payload.id);
        sendToMain('deleteQuote:response', { success: true }, correlationId);
        break;
      }

      // Sync Operations
      case 'getSyncInfo': {
        const info = syncServer ? await syncServer.getInfo(payload?.preferredIp) : null;
        const adbStatus = await adbBridge.checkAdbAvailable();
        const adbDevices = adbStatus.available ? await adbBridge.getConnectedDevices() : [];
        const mtpDevices = await mtpBridge.detectDevices();

        sendToMain('getSyncInfo:response', {
          server: info,
          adb: { ...adbStatus, devices: adbDevices },
          mtp: {
            available: mtpDevices.length > 0,
            devices: mtpDevices
          }
        }, correlationId);
        break;
      }

      case 'connectAdbWireless': {
        const ip = payload?.ip;
        const result = await adbBridge.connectWireless(ip);
        sendToMain('connectAdbWireless:response', result, correlationId);
        break;
      }

      case 'syncFromMtp': {
        sendToMain('sync:started', { source: 'USB Phone (MTP / ReadEra)' });
        const { deviceName } = payload || {};
        const destDir = userStoragePath || path.join(__dirname, 'data');
        const { localPath } = await mtpBridge.pullLatestBackup(deviceName, destDir);
        const bundle = await ReadEraParser.parseBackupFile(localPath);
        const result = db.applyLwwSyncBundle(bundle);

        sendToMain('sync:updated', { appliedCount: result.appliedCount });
        sendToMain('syncFromMtp:response', {
          success: true,
          appliedCount: result.appliedCount,
          counts: {
            books: bundle.books.length,
            bookmarks: bundle.bookmarks.length,
            quotes: bundle.quotes.length
          }
        }, correlationId);
        break;
      }

      case 'fetchBookFromPhone': {
        const { bookId, title, format } = payload;
        const booksDir = path.join(userStoragePath || path.join(__dirname, 'data'), 'books');
        if (!fs.existsSync(booksDir)) {
          fs.mkdirSync(booksDir, { recursive: true });
        }
        let foundPath = null;

        // Transliteration helper for Russian book titles vs Latin filenames
        const translit = (text) => {
          if (!text) return '';
          const ru = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
          const lat = ['a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','ts','ch','sh','shch','','y','','e','yu','ya'];
          let res = '';
          for (const ch of text.toLowerCase()) {
            const idx = ru.indexOf(ch);
            res += (idx >= 0 ? lat[idx] : ch);
          }
          return res;
        };

        // Check if already in data/books
        if (fs.existsSync(booksDir)) {
          const files = fs.readdirSync(booksDir);
          const cleanTitle = (title || '').toLowerCase().replace(/[^\w\dа-яё]/gi, '');
          const translitTitle = translit(cleanTitle);

          const match = files.find(f => {
            const cleanF = f.toLowerCase().replace(/[^\w\dа-яё]/gi, '');
            if (cleanTitle.length > 3 && (cleanF.includes(cleanTitle) || cleanTitle.includes(cleanF))) return true;
            if (translitTitle.length > 3 && (cleanF.includes(translitTitle) || translitTitle.includes(cleanF))) return true;
            return false;
          });
          if (match) {
            foundPath = path.join(booksDir, match);
          }
        }

        if (!foundPath) {
          try {
            const result = await mtpBridge.pullBook(title, format, booksDir);
            foundPath = result.filePath;
          } catch (err) {
            console.warn('MTP pullBook warning:', err.message);
          }
        }

        if (foundPath) {
          db.run('UPDATE books SET path = ? WHERE id = ?', [foundPath, bookId]);
          sendToMain('fetchBookFromPhone:response', { filePath: foundPath }, correlationId);
        } else {
          sendToMain('fetchBookFromPhone:response', { filePath: null }, correlationId);
        }
        break;
      }

      case 'associateBookFile': {
        const { bookId, filePath } = payload;
        db.run('UPDATE books SET path = ? WHERE id = ?', [filePath, bookId]);
        sendToMain('associateBookFile:response', { success: true }, correlationId);
        break;
      }

      case 'setupAdbForward': {
        const result = await adbBridge.setupPortForwarding(syncServer.activePort, payload?.serial);
        sendToMain('setupAdbForward:response', result, correlationId);
        break;
      }

      case 'importReadEraBackup': {
        sendToMain('sync:started', { source: 'ReadEra Backup File' });
        const bundle = await ReadEraParser.parseBackupFile(payload.filePath);
        const result = db.applyLwwSyncBundle(bundle);
        sendToMain('sync:updated', { appliedCount: result.appliedCount });
        sendToMain('importReadEraBackup:response', {
          success: true,
          appliedCount: result.appliedCount,
          counts: {
            books: bundle.books.length,
            bookmarks: bundle.bookmarks.length,
            quotes: bundle.quotes.length
          }
        }, correlationId);
        break;
      }

      default:
        console.warn(`Unknown worker action: ${action}`);
    }
  } catch (err) {
    sendToMain('error', { error: err.message, action }, correlationId);
  }
}

// Attach listener
if (process.parentPort) {
  process.parentPort.on('message', (event) => handleMessage(event.data));
} else {
  process.on('message', (data) => handleMessage(data));
}
