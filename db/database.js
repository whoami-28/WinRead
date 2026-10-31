const fs = require('fs');
const path = require('path');

let SQL_ENGINE = null;

/**
 * Universal SQLite Database Wrapper supporting better-sqlite3 and sql.js
 */
class ReaderDatabase {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.rawDb = null;
    this.isSqlJs = false;
  }

  async init() {
    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Try better-sqlite3 first
    try {
      const BetterSqlite = require('better-sqlite3');
      this.rawDb = new BetterSqlite(this.dbPath);
      this.rawDb.pragma('journal_mode = WAL');
      this.rawDb.pragma('synchronous = NORMAL');
      this.isSqlJs = false;
    } catch (_) {
      // Fallback to sql.js (WebAssembly SQLite)
      const initSqlJs = require('sql.js');
      const SQL = await initSqlJs();
      SQL_ENGINE = SQL;
      this.isSqlJs = true;

      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.rawDb = new SQL.Database(fileBuffer);
      } else {
        this.rawDb = new SQL.Database();
        this.persist();
      }
    }

    this.createTables();
  }

  persist() {
    if (this.isSqlJs && this.rawDb) {
      try {
        const data = this.rawDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
      } catch (err) {
        console.error('Failed to persist sql.js database:', err);
      }
    }
  }

  createTables() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT,
        author TEXT,
        format TEXT,
        path TEXT,
        file_size INTEGER,
        cover_data TEXT,
        total_chapters INTEGER DEFAULT 1,
        reading_status TEXT DEFAULT 'reading',
        progress_percent REAL DEFAULT 0,
        current_chapter INTEGER DEFAULT 0,
        current_paragraph INTEGER DEFAULT 0,
        current_char_offset INTEGER DEFAULT 0,
        last_read_at INTEGER DEFAULT 0,
        updated_at INTEGER,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        book_id TEXT,
        chapter_index INTEGER,
        paragraph_index INTEGER,
        char_offset INTEGER DEFAULT 0,
        title TEXT,
        snippet TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        book_id TEXT,
        chapter_index INTEGER,
        paragraph_index INTEGER,
        selected_text TEXT,
        color TEXT DEFAULT 'amber',
        note TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        direction TEXT,
        status TEXT,
        records_synced INTEGER,
        timestamp INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_books_status ON books(reading_status);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_book ON bookmarks(book_id);
      CREATE INDEX IF NOT EXISTS idx_quotes_book ON quotes(book_id);
    `);
  }

  exec(sql) {
    if (this.isSqlJs) {
      this.rawDb.run(sql);
      this.persist();
    } else {
      this.rawDb.exec(sql);
    }
  }

  all(sql, params = []) {
    if (this.isSqlJs) {
      const stmt = this.rawDb.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } else {
      return this.rawDb.prepare(sql).all(...params);
    }
  }

  get(sql, params = []) {
    if (this.isSqlJs) {
      const rows = this.all(sql, params);
      return rows.length > 0 ? rows[0] : null;
    } else {
      return this.rawDb.prepare(sql).get(...params) || null;
    }
  }

  run(sql, params = []) {
    if (this.isSqlJs) {
      this.rawDb.run(sql, params);
      this.persist();
      return { changes: 1 };
    } else {
      return this.rawDb.prepare(sql).run(...params);
    }
  }

  // --- Books operations ---

  upsertBook(book) {
    const now = Date.now();
    const existing = this.get('SELECT * FROM books WHERE id = ?', [book.id]);

    if (existing) {
      this.run(
        `UPDATE books SET
          title = COALESCE(?, title),
          author = COALESCE(?, author),
          format = COALESCE(?, format),
          path = COALESCE(?, path),
          file_size = COALESCE(?, file_size),
          cover_data = COALESCE(?, cover_data),
          total_chapters = COALESCE(?, total_chapters),
          updated_at = ?
         WHERE id = ?`,
        [
          book.title || null,
          book.author || null,
          book.format || null,
          book.path || null,
          book.file_size || null,
          book.cover_data || null,
          book.total_chapters || null,
          now,
          book.id
        ]
      );
      return this.get('SELECT * FROM books WHERE id = ?', [book.id]);
    } else {
      this.run(
        `INSERT INTO books (
          id, title, author, format, path, file_size, cover_data,
          total_chapters, reading_status, progress_percent,
          current_chapter, current_paragraph, current_char_offset,
          last_read_at, updated_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          book.id,
          book.title || 'Untitled',
          book.author || 'Unknown Author',
          book.format || 'unknown',
          book.path || '',
          book.file_size || 0,
          book.cover_data || null,
          book.total_chapters || 1,
          book.reading_status || 'reading',
          book.progress_percent || 0,
          book.current_chapter || 0,
          book.current_paragraph || 0,
          book.current_char_offset || 0,
          book.last_read_at || now,
          now,
          now
        ]
      );
      return this.get('SELECT * FROM books WHERE id = ?', [book.id]);
    }
  }

  updateProgress(bookId, progressData) {
    const now = Date.now();
    this.run(
      `UPDATE books SET
        progress_percent = ?,
        current_chapter = ?,
        current_paragraph = ?,
        current_char_offset = ?,
        reading_status = CASE WHEN ? >= 99.5 THEN 'have_read' ELSE reading_status END,
        last_read_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        progressData.percentage || 0,
        progressData.chapterIndex || 0,
        progressData.paragraphIndex || 0,
        progressData.charOffset || 0,
        progressData.percentage || 0,
        now,
        now,
        bookId
      ]
    );
  }

  setReadingStatus(bookId, status) {
    const now = Date.now();
    this.run(
      `UPDATE books SET reading_status = ?, updated_at = ? WHERE id = ?`,
      [status, now, bookId]
    );
  }

  getLibrary(statusFilter = null) {
    if (statusFilter && statusFilter !== 'all') {
      return this.all(
        'SELECT * FROM books WHERE reading_status = ? ORDER BY last_read_at DESC',
        [statusFilter]
      );
    }
    return this.all('SELECT * FROM books ORDER BY last_read_at DESC');
  }

  getBook(id) {
    return this.get('SELECT * FROM books WHERE id = ?', [id]);
  }

  // --- Bookmarks operations ---

  addBookmark({ id, bookId, chapterIndex, paragraphIndex, charOffset, title, snippet }) {
    const now = Date.now();
    const bId = id || `bm_${now}_${Math.random().toString(36).substring(2, 8)}`;
    this.run(
      `INSERT INTO bookmarks (
        id, book_id, chapter_index, paragraph_index, char_offset,
        title, snippet, created_at, updated_at, deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [bId, bookId, chapterIndex, paragraphIndex, charOffset || 0, title || '', snippet || '', now, now]
    );
    return this.get('SELECT * FROM bookmarks WHERE id = ?', [bId]);
  }

  deleteBookmark(id) {
    const now = Date.now();
    // Soft delete for LWW sync
    this.run('UPDATE bookmarks SET deleted = 1, updated_at = ? WHERE id = ?', [now, id]);
  }

  getBookmarks(bookId) {
    return this.all('SELECT * FROM bookmarks WHERE book_id = ? AND deleted = 0 ORDER BY chapter_index, paragraph_index', [bookId]);
  }

  // --- Quotes operations ---

  addQuote({ id, bookId, chapterIndex, paragraphIndex, selectedText, color, note }) {
    const now = Date.now();
    const qId = id || `qt_${now}_${Math.random().toString(36).substring(2, 8)}`;
    this.run(
      `INSERT INTO quotes (
        id, book_id, chapter_index, paragraph_index, selected_text,
        color, note, created_at, updated_at, deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [qId, bookId, chapterIndex, paragraphIndex, selectedText, color || 'amber', note || '', now, now]
    );
    return this.get('SELECT * FROM quotes WHERE id = ?', [qId]);
  }

  deleteQuote(id) {
    const now = Date.now();
    this.run('UPDATE quotes SET deleted = 1, updated_at = ? WHERE id = ?', [now, id]);
  }

  getQuotes(bookId) {
    return this.all('SELECT * FROM quotes WHERE book_id = ? AND deleted = 0 ORDER BY chapter_index, paragraph_index', [bookId]);
  }

  // --- Last-Write-Wins (LWW) Sync Engine Operations ---

  getSyncBundle(sinceTimestamp = 0) {
    const books = this.all('SELECT * FROM books WHERE updated_at > ?', [sinceTimestamp]);
    const bookmarks = this.all('SELECT * FROM bookmarks WHERE updated_at > ?', [sinceTimestamp]);
    const quotes = this.all('SELECT * FROM quotes WHERE updated_at > ?', [sinceTimestamp]);

    return {
      timestamp: Date.now(),
      books,
      bookmarks,
      quotes
    };
  }

  applyLwwSyncBundle(bundle) {
    let appliedCount = 0;
    const now = Date.now();

    // 1. Sync Books
    if (Array.isArray(bundle.books)) {
      for (const remote of bundle.books) {
        const local = this.getBook(remote.id);
        if (!local) {
          // New book from remote
          this.run(
            `INSERT INTO books (
              id, title, author, format, path, file_size, cover_data,
              total_chapters, reading_status, progress_percent,
              current_chapter, current_paragraph, current_char_offset,
              last_read_at, updated_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              remote.id,
              remote.title || 'Untitled',
              remote.author || 'Unknown Author',
              remote.format || 'unknown',
              remote.path || '',
              remote.file_size || 0,
              remote.cover_data || null,
              remote.total_chapters || 1,
              remote.reading_status || 'reading',
              remote.progress_percent || 0,
              remote.current_chapter || 0,
              remote.current_paragraph || 0,
              remote.current_char_offset || 0,
              remote.last_read_at || now,
              remote.updated_at || now,
              remote.created_at || now
            ]
          );
          appliedCount++;
        } else if ((remote.updated_at || 0) > (local.updated_at || 0)) {
          // Remote is newer (LWW)
          this.run(
            `UPDATE books SET
              reading_status = ?,
              progress_percent = ?,
              current_chapter = ?,
              current_paragraph = ?,
              current_char_offset = ?,
              last_read_at = ?,
              updated_at = ?
             WHERE id = ?`,
            [
              remote.reading_status,
              remote.progress_percent,
              remote.current_chapter,
              remote.current_paragraph,
              remote.current_char_offset,
              remote.last_read_at,
              remote.updated_at,
              remote.id
            ]
          );
          appliedCount++;
        }
      }
    }

    // 2. Sync Bookmarks
    if (Array.isArray(bundle.bookmarks)) {
      for (const remote of bundle.bookmarks) {
        const local = this.get('SELECT * FROM bookmarks WHERE id = ?', [remote.id]);
        if (!local) {
          if (!remote.deleted) {
            this.run(
              `INSERT INTO bookmarks (
                id, book_id, chapter_index, paragraph_index, char_offset,
                title, snippet, created_at, updated_at, deleted
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                remote.id,
                remote.book_id,
                remote.chapter_index,
                remote.paragraph_index,
                remote.char_offset || 0,
                remote.title || '',
                remote.snippet || '',
                remote.created_at || now,
                remote.updated_at || now,
                remote.deleted ? 1 : 0
              ]
            );
            appliedCount++;
          }
        } else if ((remote.updated_at || 0) > (local.updated_at || 0)) {
          this.run(
            `UPDATE bookmarks SET
              title = ?,
              snippet = ?,
              deleted = ?,
              updated_at = ?
             WHERE id = ?`,
            [
              remote.title,
              remote.snippet,
              remote.deleted ? 1 : 0,
              remote.updated_at,
              remote.id
            ]
          );
          appliedCount++;
        }
      }
    }

    // 3. Sync Quotes
    if (Array.isArray(bundle.quotes)) {
      for (const remote of bundle.quotes) {
        const local = this.get('SELECT * FROM quotes WHERE id = ?', [remote.id]);
        if (!local) {
          if (!remote.deleted) {
            this.run(
              `INSERT INTO quotes (
                id, book_id, chapter_index, paragraph_index, selected_text,
                color, note, created_at, updated_at, deleted
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                remote.id,
                remote.book_id,
                remote.chapter_index,
                remote.paragraph_index,
                remote.selected_text || '',
                remote.color || 'amber',
                remote.note || '',
                remote.created_at || now,
                remote.updated_at || now,
                remote.deleted ? 1 : 0
              ]
            );
            appliedCount++;
          }
        } else if ((remote.updated_at || 0) > (local.updated_at || 0)) {
          this.run(
            `UPDATE quotes SET
              selected_text = ?,
              color = ?,
              note = ?,
              deleted = ?,
              updated_at = ?
             WHERE id = ?`,
            [
              remote.selected_text,
              remote.color,
              remote.note,
              remote.deleted ? 1 : 0,
              remote.updated_at,
              remote.id
            ]
          );
          appliedCount++;
        }
      }
    }

    return { success: true, appliedCount };
  }

  close() {
    if (this.rawDb) {
      if (this.isSqlJs) {
        this.persist();
      } else {
        this.rawDb.close();
      }
      this.rawDb = null;
    }
  }
}

module.exports = { ReaderDatabase };
