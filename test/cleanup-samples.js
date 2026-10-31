const fs = require('fs');
const path = require('path');
const { ReaderDatabase } = require('../db/database');

async function clean() {
  const dbPath = path.join(__dirname, '..', 'data', 'winread.sqlite');
  if (fs.existsSync(dbPath)) {
    const db = new ReaderDatabase(dbPath);
    await db.init();
    db.run("DELETE FROM books WHERE path LIKE '%samples%' OR id LIKE 'hash_%'");
    console.log('Cleaned dummy books from database. Current books:', db.getLibrary().length);
    db.close();
  }

  const samplesDir = path.join(__dirname, '..', 'samples');
  if (fs.existsSync(samplesDir)) {
    fs.rmSync(samplesDir, { recursive: true, force: true });
    console.log('Removed samples/ directory');
  }
}

clean();
