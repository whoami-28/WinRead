const fs = require('fs');
const path = require('path');
const {
  calculateFastHashFromPath,
  sanitizeHtml,
  estimateBlockHeight
} = require('./base');

/**
 * Detect text file encoding: UTF-8 vs Windows-1251 vs UTF-16
 */
function detectEncoding(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return 'utf8';
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return 'utf16le';
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return 'utf16be';
  }

  // Heuristic: check if buffer is valid UTF-8
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(buffer.slice(0, Math.min(buffer.length, 32768)));
    return 'utf8';
  } catch (_) {
    // Contains invalid UTF-8 bytes; check for CP1251
    return 'latin1'; // Fallback; or decode via windows-1251 mapping
  }
}

/**
 * Decode Windows-1251 single-byte buffer to JS string
 */
function decodeCp1251(buf) {
  // Mapping for 0x80 to 0xFF in Windows-1251
  const cp1251Table = [
    0x0402, 0x0403, 0x201a, 0x0453, 0x201e, 0x2026, 0x2020, 0x2021,
    0x20ac, 0x2030, 0x0409, 0x2039, 0x040a, 0x040c, 0x040b, 0x040f,
    0x0452, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
    0x0098, 0x2122, 0x0459, 0x203a, 0x045a, 0x045c, 0x045b, 0x045f,
    0x00a0, 0x040e, 0x045e, 0x0408, 0x00a4, 0x0490, 0x00a6, 0x00a7,
    0x0401, 0x00a9, 0x0404, 0x00ab, 0x00ac, 0x00ad, 0x00ae, 0x0407,
    0x00b0, 0x00b1, 0x0406, 0x0456, 0x0491, 0x00b5, 0x00b6, 0x00b7,
    0x0451, 0x2116, 0x0454, 0x00bb, 0x0458, 0x0405, 0x0455, 0x0457
  ];

  let str = '';
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b < 0x80) {
      str += String.fromCharCode(b);
    } else if (b < 0xc0) {
      str += String.fromCharCode(cp1251Table[b - 0x80]);
    } else {
      // 0xC0..0xFF maps to 0x0410..0x044F (Russian alphabet А-я)
      str += String.fromCharCode(0x0410 + (b - 0xc0));
    }
  }
  return str;
}

class TxtBook {
  constructor(filePath, meta) {
    this.filePath = filePath;
    this.id = meta.id;
    this.title = meta.title || 'Untitled';
    this.author = meta.author || 'Unknown Author';
    this.format = 'txt';
    this.chapters = meta.chapters || [];
    this.chapterTexts = meta.chapterTexts || [];
  }

  static async open(filePath) {
    const { id } = calculateFastHashFromPath(filePath);
    const rawBuf = fs.readFileSync(filePath);
    const enc = detectEncoding(rawBuf);

    let fullText = '';
    if (enc === 'utf8') {
      fullText = rawBuf.toString('utf8');
    } else if (enc === 'latin1') {
      fullText = decodeCp1251(rawBuf);
    } else {
      fullText = rawBuf.toString(enc);
    }

    // Heuristic chapter detector
    const lines = fullText.split(/\r?\n/);
    const chapterRegex = /^\s*(Глава|Часть|Раздел|Section|Chapter|Act|Book|\b[IVXLCDM]+\b)[\s\d.:]*.*$/i;

    const chapters = [];
    const chapterTexts = [];
    let currentChapterTitle = 'Beginning';
    let currentLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 0 && line.length < 80 && chapterRegex.test(line)) {
        if (currentLines.length > 0) {
          chapterTexts.push(currentLines.join('\n'));
          chapters.push({
            index: chapters.length,
            title: currentChapterTitle,
            startBlockIndex: 0
          });
          currentLines = [];
        }
        currentChapterTitle = line;
      }
      currentLines.push(lines[i]);
    }

    if (currentLines.length > 0) {
      chapterTexts.push(currentLines.join('\n'));
      chapters.push({
        index: chapters.length,
        title: currentChapterTitle,
        startBlockIndex: 0
      });
    }

    const title = path.basename(filePath, path.extname(filePath));

    return new TxtBook(filePath, {
      id,
      title,
      chapters,
      chapterTexts
    });
  }

  async loadChapterBlocks(chapterIndex) {
    if (chapterIndex < 0 || chapterIndex >= this.chapterTexts.length) {
      return [];
    }

    const raw = this.chapterTexts[chapterIndex];
    const rawParagraphs = raw.split(/\n\s*\n+/);
    const blocks = [];
    let bIdx = 0;

    for (const p of rawParagraphs) {
      const trimmed = p.trim();
      if (!trimmed) continue;

      const isHeading = trimmed.length < 80 && /^(Глава|Часть|Раздел|Section|Chapter|Act|Book|\b[IVXLCDM]+\b)/i.test(trimmed);
      const type = isHeading ? 'h2' : 'p';
      const cleanHtml = sanitizeHtml(trimmed).replace(/\n/g, '<br/>');
      const estHeight = estimateBlockHeight(trimmed, type);

      blocks.push({
        id: `ch${chapterIndex}_b${bIdx}`,
        chapterIndex,
        blockIndex: bIdx,
        type,
        text: trimmed,
        html: `<${type} class="reader-block reader-${type}">${cleanHtml}</${type}>`,
        estimatedHeight: estHeight
      });
      bIdx++;
    }

    return blocks;
  }

  close() {
    this.chapterTexts = [];
  }
}

module.exports = { TxtBook };
