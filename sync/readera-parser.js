const fs = require('fs');
const path = require('path');
const { RandomAccessZip } = require('../parsers/zip-stream');

/**
 * ReadEra Android Backup Decoder & Importer
 * Supports ReadEra .bak, .backup, .zip, .db, and .json
 */
class ReadEraParser {
  static async parseBackupFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    // 1. Check if it's a ZIP archive (.bak, .backup, .zip)
    const headBuf = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    try {
      fs.readSync(fd, headBuf, 0, 4, 0);
    } finally {
      fs.closeSync(fd);
    }

    const isZip = headBuf.readUInt32LE(0) === 0x04034b50 || ext === '.bak' || ext === '.backup' || ext === '.zip';

    if (isZip) {
      try {
        const zip = RandomAccessZip.fromPath(filePath);
        await zip.init();
        const files = zip.getFileList();

        // Check for official ReadEra docs_*.json files
        const docFiles = files.filter(f => /docs_\d+\.json$/i.test(f));
        if (docFiles.length > 0) {
          const allDocs = [];
          for (const df of docFiles) {
            const text = await zip.readText(df, 'utf8');
            try {
              const arr = JSON.parse(text);
              if (Array.isArray(arr)) allDocs.push(...arr);
            } catch (_) {}
          }
          zip.close();
          return ReadEraParser.parseReadEraDocs(allDocs);
        }

        // Generic JSON file
        const jsonFile = files.find(f => f.endsWith('.json'));
        if (jsonFile) {
          const jsonText = await zip.readText(jsonFile, 'utf8');
          zip.close();
          return ReadEraParser.parseJson(JSON.parse(jsonText));
        }

        // SQLite DB inside backup
        const dbFile = files.find(f => f.endsWith('.db') || f.endsWith('.sqlite'));
        if (dbFile) {
          const dbBuffer = await zip.readFile(dbFile);
          zip.close();
          return await ReadEraParser.parseSqliteBuffer(dbBuffer);
        }
        zip.close();
      } catch (err) {
        console.warn('Failed to parse as ZIP archive:', err.message);
      }
    }

    // 2. Check if raw SQLite database
    const head16 = Buffer.alloc(16);
    const fd2 = fs.openSync(filePath, 'r');
    try {
      fs.readSync(fd2, head16, 0, 16, 0);
    } finally {
      fs.closeSync(fd2);
    }

    if (head16.toString('ascii').startsWith('SQLite format 3')) {
      const dbBuf = fs.readFileSync(filePath);
      return await ReadEraParser.parseSqliteBuffer(dbBuf);
    }

    // 3. Fallback to raw JSON
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      const obj = JSON.parse(text);
      if (Array.isArray(obj)) {
        return ReadEraParser.parseReadEraDocs(obj);
      }
      return ReadEraParser.parseJson(obj);
    } catch (_) {
      throw new Error('Unsupported ReadEra backup format. Expected ReadEra .bak, .backup, .zip, or .db');
    }
  }

  /**
   * Parse official ReadEra docs array from docs_1.json
   */
  static parseReadEraDocs(docs) {
    const books = [];
    const bookmarks = [];
    const quotes = [];
    const now = Date.now();

    for (const item of docs) {
      const d = item.data || {};
      const title = d.doc_title || d.doc_file_name_title || 'Untitled';
      const author = d.doc_authors || 'Unknown Author';
      const format = (d.doc_format || 'epub').toLowerCase();
      const fileSize = d.doc_file_size || 0;
      const lastRead = d.doc_last_read_time || d.doc_activity_time || now;

      // Position ratio (0.0 to 1.0)
      let progressPercent = 0;
      let chapterIdx = 0;
      let paragraphIdx = 0;

      if (d.doc_position) {
        try {
          const pos = typeof d.doc_position === 'string' ? JSON.parse(d.doc_position) : d.doc_position;
          if (pos && typeof pos.ratio === 'number') {
            progressPercent = Math.min(100, Math.max(0, pos.ratio * 100));
          }
          if (pos && pos.page) {
            chapterIdx = pos.page;
          }
        } catch (_) {}
      }

      // Reading status: have_read_time vs to_read_time vs last_read_time
      let status = 'reading';
      if (d.doc_have_read_time > 0 || progressPercent >= 99.5) {
        status = 'have_read';
      } else if (d.doc_to_read_time > 0) {
        status = 'to_read';
      }

      const bookId = `re_${d.doc_sha1 ? d.doc_sha1.slice(0, 20) : Math.abs(hashString(title + author))}`;

      books.push({
        id: bookId,
        title,
        author,
        format,
        path: d.file_path || '',
        file_size: fileSize,
        progress_percent: progressPercent,
        current_chapter: chapterIdx,
        current_paragraph: paragraphIdx,
        current_char_offset: 0,
        reading_status: status,
        last_read_at: lastRead,
        updated_at: now
      });

      // Citations / Highlights
      if (Array.isArray(item.citations)) {
        const markColors = ['amber', 'green', 'blue', 'rose'];
        for (const c of item.citations) {
          if (!c.note_body) continue;
          const color = markColors[c.note_mark % markColors.length] || 'amber';
          quotes.push({
            id: `qt_${c.note_uri || Math.random().toString(36).substring(2, 9)}`,
            book_id: bookId,
            chapter_index: c.note_page || 0,
            paragraph_index: 0,
            selected_text: c.note_body,
            color,
            note: '',
            created_at: c.note_insert_time || now,
            updated_at: c.note_modified_time || now,
            deleted: 0
          });
        }
      }

      // Bookmarks
      if (Array.isArray(item.bookmarks)) {
        for (const bm of item.bookmarks) {
          bookmarks.push({
            id: `bm_${bm.note_uri || Math.random().toString(36).substring(2, 9)}`,
            book_id: bookId,
            chapter_index: bm.note_page || 0,
            paragraph_index: 0,
            char_offset: 0,
            title: bm.note_title || bm.note_body?.slice(0, 40) || 'Bookmark',
            snippet: bm.note_body || '',
            created_at: bm.note_insert_time || now,
            updated_at: bm.note_modified_time || now,
            deleted: 0
          });
        }
      }
    }

    return { books, bookmarks, quotes };
  }

  static async parseSqliteBuffer(dbBuffer) {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    const db = new SQL.Database(dbBuffer);
    const books = [];
    const bookmarks = [];
    const quotes = [];
    const now = Date.now();

    try {
      const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = (tablesRes[0]?.values || []).map(v => v[0].toLowerCase());

      const bookTable = tableNames.find(t => t.includes('book') || t.includes('document') || t.includes('item'));
      if (bookTable) {
        const rows = db.exec(`SELECT * FROM ${bookTable}`);
        if (rows.length > 0) {
          const cols = rows[0].columns.map(c => c.toLowerCase());
          const titleIdx = cols.findIndex(c => c.includes('title') || c.includes('name'));
          const authorIdx = cols.findIndex(c => c.includes('author'));
          const percentIdx = cols.findIndex(c => c.includes('percent') || c.includes('progress'));
          const pathIdx = cols.findIndex(c => c.includes('path') || c.includes('file'));
          const statusIdx = cols.findIndex(c => c.includes('status') || c.includes('state'));
          const timeIdx = cols.findIndex(c => c.includes('time') || c.includes('date') || c.includes('access'));

          for (const val of rows[0].values) {
            const rawTitle = titleIdx >= 0 ? val[titleIdx] : 'Imported Book';
            const rawAuthor = authorIdx >= 0 ? val[authorIdx] : 'Unknown Author';
            const rawPercent = percentIdx >= 0 ? parseFloat(val[percentIdx]) || 0 : 0;
            const rawPath = pathIdx >= 0 ? val[pathIdx] : '';
            const rawStatus = statusIdx >= 0 ? val[statusIdx] : 1;
            const rawTime = timeIdx >= 0 ? parseInt(val[timeIdx], 10) : now;

            let readingStatus = 'reading';
            if (rawStatus === 2 || rawPercent >= 99) readingStatus = 'have_read';
            else if (rawStatus === 3) readingStatus = 'to_read';

            const bookId = `readera_${Math.abs(hashString(rawPath || rawTitle))}`;

            books.push({
              id: bookId,
              title: String(rawTitle || 'Untitled'),
              author: String(rawAuthor || 'Unknown Author'),
              format: path.extname(rawPath || '').replace('.', '') || 'epub',
              path: rawPath || '',
              progress_percent: Math.min(100, Math.max(0, rawPercent > 1 ? rawPercent : rawPercent * 100)),
              reading_status: readingStatus,
              last_read_at: rawTime > 10000000000 ? rawTime : rawTime * 1000,
              updated_at: now
            });
          }
        }
      }
    } finally {
      db.close();
    }

    return { books, bookmarks, quotes };
  }

  static parseJson(json) {
    if (Array.isArray(json)) {
      return ReadEraParser.parseReadEraDocs(json);
    }
    const books = [];
    const bookmarks = [];
    const quotes = [];
    const now = Date.now();

    const rawBooks = json.books || json.documents || json.items || [];
    for (const b of rawBooks) {
      books.push({
        id: b.id || `readera_${Math.abs(hashString(b.title || 'book'))}`,
        title: b.title || 'Untitled',
        author: b.author || 'Unknown Author',
        format: b.format || 'epub',
        path: b.path || '',
        progress_percent: parseFloat(b.progress || b.percent || 0),
        reading_status: b.status || 'reading',
        last_read_at: b.lastRead || now,
        updated_at: now
      });
    }

    return { books, bookmarks, quotes };
  }
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

module.exports = { ReadEraParser };
