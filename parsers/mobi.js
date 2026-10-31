const fs = require('fs');
const path = require('path');
const {
  calculateFastHashFromPath,
  sanitizeHtml,
  decodeXmlEntities,
  estimateBlockHeight
} = require('./base');

/**
 * PalmDOC LZ77 decompressor
 */
function decompressPalmDoc(buf) {
  const out = [];
  let i = 0;
  const len = buf.length;

  while (i < len) {
    const b = buf[i++];
    if (b === 0x00) {
      out.push(0x00);
    } else if (b >= 0x01 && b <= 0x08) {
      for (let k = 0; k < b && i < len; k++) {
        out.push(buf[i++]);
      }
    } else if (b >= 0x09 && b <= 0x7f) {
      out.push(b);
    } else if (b >= 0x80 && b <= 0xbf) {
      if (i >= len) break;
      const b2 = buf[i++];
      const pair = ((b << 8) | b2) & 0x3fff;
      const distance = pair >> 3;
      const length = (pair & 0x07) + 3;
      for (let k = 0; k < length; k++) {
        const srcIdx = out.length - distance;
        out.push(srcIdx >= 0 ? out[srcIdx] : 0x20);
      }
    } else if (b >= 0xc0) {
      out.push(0x20);
      out.push(b ^ 0x80);
    }
  }
  return Buffer.from(out);
}

class MobiBook {
  constructor(filePath, meta) {
    this.filePath = filePath;
    this.id = meta.id;
    this.title = meta.title || 'Untitled';
    this.author = meta.author || 'Unknown Author';
    this.language = meta.language || 'en';
    this.format = 'mobi';
    this.coverDataUrl = meta.coverDataUrl || null;
    this.chapters = meta.chapters || [];
    this.textChunks = meta.textChunks || [];
  }

  static async open(filePath) {
    const { id } = calculateFastHashFromPath(filePath);
    const fd = fs.openSync(filePath, 'r');
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    try {
      // Read Palm Database Header (78 bytes)
      const headerBuf = Buffer.alloc(78);
      fs.readSync(fd, headerBuf, 0, 78, 0);

      const numRecords = headerBuf.readUInt16BE(76);
      if (numRecords === 0) throw new Error('Invalid MOBI: 0 records found');

      // Read record list (each entry is 8 bytes)
      const recordListBuf = Buffer.alloc(numRecords * 8);
      fs.readSync(fd, recordListBuf, 0, numRecords * 8, 78);

      const recordOffsets = [];
      for (let i = 0; i < numRecords; i++) {
        recordOffsets.push(recordListBuf.readUInt32BE(i * 8));
      }

      // Read Record 0 (PalmDOC + MOBI Header)
      const rec0Offset = recordOffsets[0];
      const rec0Len = (recordOffsets[1] || fileSize) - rec0Offset;
      const rec0Buf = Buffer.alloc(rec0Len);
      fs.readSync(fd, rec0Buf, 0, rec0Len, rec0Offset);

      const compression = rec0Buf.readUInt16BE(0);
      const textRecordCount = rec0Buf.readUInt16BE(8);

      // Title & Author extraction
      let title = path.basename(filePath, path.extname(filePath));
      let author = 'Unknown Author';

      // Check if MOBI header exists at offset 16
      if (rec0Buf.length >= 40 && rec0Buf.toString('ascii', 16, 20) === 'MOBI') {
        const mobiHeaderLen = rec0Buf.readUInt32BE(20);
        const titleOffset = rec0Buf.readUInt32BE(84);
        const titleLen = rec0Buf.readUInt32BE(88);

        if (titleLen > 0 && titleLen < 256) {
          if (titleOffset + titleLen <= rec0Buf.length) {
            const rawTitle = rec0Buf.toString('utf8', titleOffset, titleOffset + titleLen).trim();
            if (rawTitle) title = rawTitle;
          } else if (16 + titleOffset + titleLen <= rec0Buf.length) {
            const rawTitle = rec0Buf.toString('utf8', 16 + titleOffset, 16 + titleOffset + titleLen).trim();
            if (rawTitle) title = rawTitle;
          }
        }

        // Check for EXTH header
        const exthStart = 16 + mobiHeaderLen;
        if (exthStart + 12 <= rec0Buf.length && rec0Buf.toString('ascii', exthStart, exthStart + 4) === 'EXTH') {
          const exthRecordCount = rec0Buf.readUInt32BE(exthStart + 8);
          let exthPos = exthStart + 12;

          for (let r = 0; r < exthRecordCount && exthPos + 8 <= rec0Buf.length; r++) {
            const recType = rec0Buf.readUInt32BE(exthPos);
            const recLen = rec0Buf.readUInt32BE(exthPos + 4);
            const dataLen = recLen - 8;

            if (dataLen > 0 && exthPos + recLen <= rec0Buf.length) {
              const recVal = rec0Buf.slice(exthPos + 8, exthPos + recLen);
              if (recType === 100) {
                // Author
                author = recVal.toString('utf8');
              } else if (recType === 503) {
                // Updated Title
                title = recVal.toString('utf8');
              }
            }
            exthPos += recLen;
          }
        }
      }

      // Read and decompress text records
      const textChunks = [];
      const actualTextCount = Math.min(textRecordCount, numRecords - 1);

      for (let i = 1; i <= actualTextCount; i++) {
        const rOffset = recordOffsets[i];
        const rNext = (i + 1 < numRecords) ? recordOffsets[i + 1] : fileSize;
        const rLen = rNext - rOffset;
        if (rLen <= 0) continue;

        const rBuf = Buffer.alloc(rLen);
        fs.readSync(fd, rBuf, 0, rLen, rOffset);

        let decompressed;
        if (compression === 1) {
          decompressed = rBuf;
        } else if (compression === 2) {
          decompressed = decompressPalmDoc(rBuf);
        } else {
          decompressed = rBuf;
        }
        textChunks.push(decompressed.toString('utf8'));
      }

      // Group text into chapters
      const fullText = textChunks.join('');
      const chapters = [];
      const rawSplits = fullText.split(/<mbp:pagebreak\s*\/?>|(?=<h[1-2][^>]*>)|<div class="chapter">/gi)
        .map(s => s.trim())
        .filter(Boolean);
      const chapterSplits = rawSplits.length > 0 ? rawSplits : [fullText];

      const sectionCount = Math.max(1, chapterSplits.length);
      for (let c = 0; c < sectionCount; c++) {
        chapters.push({
          index: c,
          title: `Section ${c + 1}`,
          startBlockIndex: 0
        });
      }

      return new MobiBook(filePath, {
        id,
        title,
        author,
        chapters,
        textChunks: chapterSplits
      });
    } finally {
      fs.closeSync(fd);
    }
  }

  async loadChapterBlocks(chapterIndex) {
    if (chapterIndex < 0 || chapterIndex >= this.textChunks.length) {
      return [];
    }

    const html = this.textChunks[chapterIndex];
    const cleanBlocks = [];
    const paragraphs = html.split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>|\n\s*\n/gi);

    let bIdx = 0;
    for (const p of paragraphs) {
      const plainText = decodeXmlEntities(p.replace(/<[^>]+>/g, '')).trim();
      if (!plainText) continue;

      const estHeight = estimateBlockHeight(plainText, 'p');
      cleanBlocks.push({
        id: `ch${chapterIndex}_b${bIdx}`,
        chapterIndex,
        blockIndex: bIdx,
        type: 'p',
        text: plainText,
        html: `<p class="reader-block reader-p">${sanitizeHtml(plainText)}</p>`,
        estimatedHeight: estHeight
      });
      bIdx++;
    }

    return cleanBlocks;
  }

  close() {
    this.textChunks = [];
  }
}

module.exports = { MobiBook };
