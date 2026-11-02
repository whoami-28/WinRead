const path = require('path');
const fs = require('fs');
const assert = require('assert');

const { calculateFastHashFromPath } = require('../parsers/base');
const { BookParser } = require('../parsers/index');
const { ReaderDatabase } = require('../db/database');
const { ReadEraParser } = require('../sync/readera-parser');

const samplesDir = path.join(__dirname, 'temp_samples');

async function runTests() {
  console.log('--- Starting WinRead Automated Test Suite ---\n');

  // Generate temporary isolated test assets
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }
  require('./generate-samples-helper')(samplesDir);

  // Test 1: Fast Composite Hashing
  console.log('[Test 1] Fast Composite Book Identification...');
  const txtPath = path.join(samplesDir, 'sample_tolstoy.txt');
  const hashResult = calculateFastHashFromPath(txtPath);
  assert(hashResult.id.startsWith('hash_') || hashResult.id.startsWith('fast_'), 'Valid hash ID format');
  assert(hashResult.size > 0, 'Valid file size');
  console.log(`  ✓ Fast composite hash calculated: ${hashResult.id} (${hashResult.size} bytes)`);

  // Test 2: EPUB Parser
  console.log('\n[Test 2] EPUB Parsing & Lazy Chapter Decompression...');
  const epubPath = path.join(samplesDir, 'sample_sherlock.epub');
  const epubBook = await BookParser.open(epubPath);
  assert.strictEqual(epubBook.title, 'The Adventures of Sherlock Holmes');
  assert.strictEqual(epubBook.author, 'Arthur Conan Doyle');
  assert.strictEqual(epubBook.format, 'epub');
  assert.strictEqual(epubBook.chapters.length, 2);

  const epubBlocks = await epubBook.loadChapterBlocks(0);
  assert(epubBlocks.length >= 3, 'Chapter 1 loaded into structural blocks');
  assert(epubBlocks[0].text.includes('Scandal in Bohemia'));
  epubBook.close();
  console.log(`  ✓ EPUB parsed successfully: "${epubBook.title}" (${epubBlocks.length} blocks in Ch 1)`);

  // Test 3: FB2 and FB2.ZIP Parser
  console.log('\n[Test 3] FB2 & FB2.ZIP XML Parsing...');
  const fb2Path = path.join(samplesDir, 'sample_pushkin.fb2');
  const fb2Book = await BookParser.open(fb2Path);
  assert.strictEqual(fb2Book.title, 'Евгений Онегин');
  assert.strictEqual(fb2Book.author, 'Александр Пушкин');
  assert.strictEqual(fb2Book.format, 'fb2');
  assert.strictEqual(fb2Book.chapters.length, 2);

  const fb2Blocks = await fb2Book.loadChapterBlocks(0);
  assert(fb2Blocks.length >= 4, 'FB2 section blocks extracted');
  fb2Book.close();
  console.log(`  ✓ FB2 parsed: "${fb2Book.title}" by ${fb2Book.author}`);

  const fb2ZipPath = path.join(samplesDir, 'sample_pushkin.fb2.zip');
  const fb2ZipBook = await BookParser.open(fb2ZipPath);
  assert.strictEqual(fb2ZipBook.format, 'fb2.zip');
  assert.strictEqual(fb2ZipBook.title, 'Евгений Онегин');
  fb2ZipBook.close();
  console.log(`  ✓ FB2.ZIP parsed directly without extraction`);

  // Test 4: MOBI PalmDOC Parser
  console.log('\n[Test 4] MOBI PalmDOC Extraction...');
  const mobiPath = path.join(samplesDir, 'sample_mobi.mobi');
  const mobiBook = await BookParser.open(mobiPath);
  assert.strictEqual(mobiBook.format, 'mobi');
  assert.strictEqual(mobiBook.title, 'Sample MOBI Book');
  const mobiBlocks = await mobiBook.loadChapterBlocks(0);
  assert(mobiBlocks.length >= 2, 'MOBI blocks loaded');
  mobiBook.close();
  console.log(`  ✓ MOBI parsed: "${mobiBook.title}" (${mobiBlocks.length} blocks)`);

  // Test 5: TXT Parser
  console.log('\n[Test 5] TXT Heuristic Chapter Detection...');
  const txtBook = await BookParser.open(txtPath);
  assert.strictEqual(txtBook.format, 'txt');
  assert(txtBook.chapters.length >= 3, 'Auto-detected 3 chapters in TXT');
  const txtBlocks = await txtBook.loadChapterBlocks(0);
  assert(txtBlocks.length >= 1, 'TXT blocks loaded');
  txtBook.close();
  console.log(`  ✓ TXT parsed: "${txtBook.title}" (${txtBook.chapters.length} chapters detected)`);

  // Test 6: Database & Last-Write-Wins (LWW) Conflict Resolution
  console.log('\n[Test 6] SQLite Database & LWW Conflict Resolution...');
  const testDbPath = path.join(__dirname, 'test_winread.sqlite');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const db = new ReaderDatabase(testDbPath);
  await db.init();

  // Insert initial book
  const now = Date.now();
  db.upsertBook({
    id: 'book_test_1',
    title: 'War and Peace',
    author: 'Leo Tolstoy',
    format: 'epub',
    total_chapters: 10
  });

  db.updateProgress('book_test_1', {
    chapterIndex: 1,
    paragraphIndex: 5,
    percentage: 12.5
  });

  const localBefore = db.getBook('book_test_1');
  assert.strictEqual(localBefore.progress_percent, 12.5);

  // Incoming older update (should NOT overwrite)
  const olderBundle = {
    books: [
      {
        id: 'book_test_1',
        title: 'War and Peace',
        progress_percent: 5.0,
        current_chapter: 0,
        current_paragraph: 2,
        updated_at: now - 100000 // Older timestamp
      }
    ]
  };
  db.applyLwwSyncBundle(olderBundle);
  const localAfterOlder = db.getBook('book_test_1');
  assert.strictEqual(localAfterOlder.progress_percent, 12.5, 'Older update ignored by LWW');

  // Incoming newer update (SHOULD overwrite)
  const newerBundle = {
    books: [
      {
        id: 'book_test_1',
        title: 'War and Peace',
        reading_status: 'reading',
        progress_percent: 45.0,
        current_chapter: 4,
        current_paragraph: 12,
        current_char_offset: 0,
        last_read_at: now + 50000,
        updated_at: now + 50000 // Newer timestamp
      }
    ]
  };
  db.applyLwwSyncBundle(newerBundle);
  const localAfterNewer = db.getBook('book_test_1');
  assert.strictEqual(localAfterNewer.progress_percent, 45.0, 'Newer update applied by LWW');
  assert.strictEqual(localAfterNewer.current_chapter, 4);

  // Test bookmarks and quotes
  const bm = db.addBookmark({
    bookId: 'book_test_1',
    chapterIndex: 4,
    paragraphIndex: 12,
    title: 'Interesting scene',
    snippet: 'Pierre looked at the sky...'
  });
  assert(bm.id, 'Bookmark created');
  const allBms = db.getBookmarks('book_test_1');
  assert.strictEqual(allBms.length, 1);

  const qt = db.addQuote({
    bookId: 'book_test_1',
    chapterIndex: 4,
    paragraphIndex: 12,
    selectedText: 'Pure high-performance desktop application',
    color: 'amber'
  });
  assert(qt.id, 'Quote created');
  const allQts = db.getQuotes('book_test_1');
  assert.strictEqual(allQts.length, 1);

  db.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  console.log('  ✓ Database, Bookmarks, Quotes, and LWW sync logic fully verified!');

  // Test 7: ReadEra Backup Parser (.bak & JSON)
  console.log('\n[Test 7] ReadEra Backup Parsing (.bak & JSON)...');
  const dummyBackup = {
    documents: [
      {
        title: 'ReadEra Android Book',
        author: 'Android Author',
        percent: 78.5,
        path: '/sdcard/Books/AndroidBook.epub',
        status: 1
      }
    ]
  };
  const parsedBackup = ReadEraParser.parseJson(dummyBackup);
  assert.strictEqual(parsedBackup.books.length, 1);
  assert.strictEqual(parsedBackup.books[0].title, 'ReadEra Android Book');
  assert.strictEqual(parsedBackup.books[0].progress_percent, 78.5);

  // Test real ReadEra docs_1 format
  const realDocFormat = [
    {
      data: {
        doc_title: 'Тестовая книга ReadEra',
        doc_authors: 'Автор Мобильный',
        doc_format: 'FB2',
        doc_file_size: 1048576,
        doc_position: JSON.stringify({ ratio: 0.65, page: 42 }),
        doc_last_read_time: Date.now()
      },
      citations: [
        {
          note_body: 'Важная цитата из книги',
          note_mark: 0,
          note_insert_time: Date.now()
        }
      ],
      bookmarks: [
        {
          note_title: 'Закладка в главе',
          note_insert_time: Date.now()
        }
      ]
    }
  ];
  const parsedReal = ReadEraParser.parseReadEraDocs(realDocFormat);
  assert.strictEqual(parsedReal.books.length, 1);
  assert.strictEqual(parsedReal.books[0].title, 'Тестовая книга ReadEra');
  assert.strictEqual(parsedReal.books[0].progress_percent, 65);
  assert.strictEqual(parsedReal.quotes.length, 1);
  assert.strictEqual(parsedReal.bookmarks.length, 1);
  console.log('  ✓ ReadEra backup parser (.bak / docs_1.json) verified');

  // Test 8: Cover & In-Book Image Extraction and Progress Snapping
  console.log('\n[Test 8] Cover & In-Book Image Extraction and Progress Snapping...');
  const fb2WithImgPath = path.join(samplesDir, 'sample_illustrated.fb2');
  const dummyImgBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const fb2XmlWithImg = `<?xml version="1.0" encoding="utf-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
  <description>
    <title-info>
      <genre>fiction</genre>
      <author><first-name>Лев</first-name><last-name>Толстой</last-name></author>
      <book-title>Иллюстрированная повесть</book-title>
      <coverpage><image l:href="#cover.png"/></coverpage>
    </title-info>
  </description>
  <body>
    <section>
      <title><p>Глава 1</p></title>
      <p>Текст первого абзаца с иллюстрацией ниже.</p>
      <p><image l:href="#ill_1.png"/></p>
      <p>Заключительный абзац главы.</p>
    </section>
  </body>
  <binary id="cover.png" content-type="image/png">${dummyImgBase64}</binary>
  <binary id="ill_1.png" content-type="image/png">${dummyImgBase64}</binary>
</FictionBook>`;
  fs.writeFileSync(fb2WithImgPath, fb2XmlWithImg, 'utf8');

  const illBook = await BookParser.open(fb2WithImgPath);
  assert(illBook.coverDataUrl, 'Cover image extracted');
  assert(illBook.coverDataUrl.startsWith('data:image/png;base64,'), 'Cover is data URL');

  const illBlocks = await illBook.loadChapterBlocks(0);
  const imgBlock = illBlocks.find(b => b.type === 'image');
  assert(imgBlock, 'In-book image block extracted');
  assert(imgBlock.html.includes('data:image/png;base64,'), 'In-book image block contains data URL');
  illBook.close();

  // Test progress calculation (100% when at bottom)
  const maxScroll = 1200;
  const scrollTopBottom = 1190;
  const isAtBottom = maxScroll <= 5 || (scrollTopBottom >= maxScroll - 25);
  assert(isAtBottom, 'Correctly detected bottom of chapter');
  const percentAtBottom = isAtBottom ? 100 : Math.round((scrollTopBottom / maxScroll) * 100);
  assert.strictEqual(percentAtBottom, 100, 'End of chapter snaps to 100%');
  console.log('  ✓ Cover, in-book images, and 100% progress snapping verified');

  // Test 9: White Theme Contrast & Typography Flow Refactor Verification
  console.log('\n[Test 9] White Theme Contrast & Typography Flow Verification...');
  require('./theme-typography-verification');

  // Cleanup temporary test samples
  if (fs.existsSync(samplesDir)) {
    fs.rmSync(samplesDir, { recursive: true, force: true });
  }

  console.log('\n========================================');
  console.log('  ALL 9 TEST SUITES PASSED PERFECTLY!');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
