const fs = require('fs');
const path = require('path');
const { RandomAccessZip } = require('./zip-stream');
const {
  calculateFastHashFromPath,
  sanitizeHtml,
  decodeXmlEntities,
  estimateBlockHeight
} = require('./base');

function getXmlTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(regex);
  return m ? m[1].trim() : '';
}

class Fb2Book {
  constructor(filePath, xmlText, meta) {
    this.filePath = filePath;
    this.xmlText = xmlText;
    this.id = meta.id;
    this.title = meta.title || 'Untitled';
    this.author = meta.author || 'Unknown Author';
    this.language = meta.language || 'ru';
    this.format = meta.isZip ? 'fb2.zip' : 'fb2';
    this.coverDataUrl = meta.coverDataUrl || null;
    this.chapters = meta.chapters || [];
    this.sections = meta.sections || [];
    this.binaries = meta.binaries || new Map();
  }

  static async open(filePath) {
    const { id } = calculateFastHashFromPath(filePath);
    const isZip = filePath.toLowerCase().endsWith('.zip') || filePath.toLowerCase().endsWith('.fb2.zip');

    let xmlText = '';
    if (isZip) {
      const zip = RandomAccessZip.fromPath(filePath);
      await zip.init();
      const files = zip.getFileList();
      const fb2File = files.find(f => f.toLowerCase().endsWith('.fb2'));
      if (!fb2File) throw new Error('No .fb2 file found inside ZIP archive');
      xmlText = await zip.readText(fb2File, 'utf8');
      zip.close();
    } else {
      // Direct FB2 file
      // Check encoding: <?xml version="1.0" encoding="windows-1251"?> vs utf-8
      const headBuf = Buffer.alloc(1024);
      const fd = fs.openSync(filePath, 'r');
      try {
        fs.readSync(fd, headBuf, 0, 1024, 0);
      } finally {
        fs.closeSync(fd);
      }
      const headStr = headBuf.toString('ascii');
      const encMatch = headStr.match(/encoding=["']([^"']+)["']/i);
      const encoding = encMatch && encMatch[1].toLowerCase().includes('1251') ? 'latin1' : 'utf8';

      // For Windows-1251 if latin1, decode properly or fallback to utf8
      xmlText = fs.readFileSync(filePath, 'utf8');
    }

    // Parse Description
    const desc = getXmlTag(xmlText, 'description');
    const titleInfo = getXmlTag(desc, 'title-info');
    const title = decodeXmlEntities(getXmlTag(titleInfo, 'book-title')) || path.basename(filePath).replace(/\.fb2(\.zip)?$/i, '');
    const lang = getXmlTag(titleInfo, 'lang') || 'ru';

    // Author
    let author = '';
    const authorBlock = getXmlTag(titleInfo, 'author');
    if (authorBlock) {
      const first = decodeXmlEntities(getXmlTag(authorBlock, 'first-name'));
      const middle = decodeXmlEntities(getXmlTag(authorBlock, 'middle-name'));
      const last = decodeXmlEntities(getXmlTag(authorBlock, 'last-name'));
      author = [first, middle, last].filter(Boolean).join(' ');
    }
    if (!author) author = 'Unknown Author';

    // Parse Cover
    let coverDataUrl = null;
    const coverMatch = titleInfo.match(/<coverpage>[\s\S]*?<image\b[^>]*(?:l:|xlink:)?href=["']#?([^"']+)["']/i);
    const coverId = coverMatch ? coverMatch[1].replace(/^#/, '') : null;

    // Fast binary map parser
    const binaries = new Map();
    const binRegex = /<binary\b[^>]*id=["']([^"']+)["'][^>]*content-type=["']([^"']+)["'][^>]*>([\s\S]*?)<\/binary>/gi;
    let bMatch;
    while ((bMatch = binRegex.exec(xmlText)) !== null) {
      const bId = bMatch[1].replace(/^#/, '');
      const mime = bMatch[2];
      const base64Data = bMatch[3].replace(/\s+/g, '');
      binaries.set(bId, `data:${mime};base64,${base64Data}`);
    }

    if (coverId && binaries.has(coverId)) {
      coverDataUrl = binaries.get(coverId);
    } else {
      for (const [k, v] of binaries.entries()) {
        if (/cover/i.test(k)) {
          coverDataUrl = v;
          break;
        }
      }
      if (!coverDataUrl && binaries.size > 0) {
        coverDataUrl = binaries.values().next().value;
      }
    }

    // Parse Body Sections
    // Find main <body>: skip notes body if present
    const bodyMatch = xmlText.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : '';

    // Split sections or titles
    const sectionRegex = /<section\b[^>]*>([\s\S]*?)<\/section>/gi;
    const rawSections = [];
    let secMatch;
    while ((secMatch = sectionRegex.exec(bodyContent)) !== null) {
      rawSections.push(secMatch[1]);
    }

    // If no explicit <section> tags, treat body as one section
    if (rawSections.length === 0 && bodyContent) {
      rawSections.push(bodyContent);
    }

    const chapters = [];
    const sections = [];

    for (let i = 0; i < rawSections.length; i++) {
      const sContent = rawSections[i];
      let chapterTitle = `Chapter ${i + 1}`;

      const tMatch = sContent.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      if (tMatch) {
        const titleText = decodeXmlEntities(tMatch[1].replace(/<[^>]+>/g, ' ')).trim();
        if (titleText) chapterTitle = titleText;
      }

      chapters.push({
        index: i,
        title: chapterTitle,
        startBlockIndex: 0
      });
      sections.push(sContent);
    }

    return new Fb2Book(filePath, xmlText, {
      id,
      title,
      author,
      language: lang,
      isZip,
      coverDataUrl,
      chapters,
      sections,
      binaries
    });
  }

  /**
   * Lazily loads and tokenizes a section into atomic blocks
   * @param {number} sectionIndex
   */
  async loadChapterBlocks(sectionIndex) {
    if (sectionIndex < 0 || sectionIndex >= this.sections.length) {
      return [];
    }

    const content = this.sections[sectionIndex];
    const blocks = [];
    let bIdx = 0;

    // Check for title block
    const titleMatch = content.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      const tText = decodeXmlEntities(titleMatch[1].replace(/<[^>]+>/g, ' ')).trim();
      if (tText) {
        blocks.push({
          id: `ch${sectionIndex}_b${bIdx}`,
          chapterIndex: sectionIndex,
          blockIndex: bIdx,
          type: 'h2',
          text: tText,
          html: `<h2 class="reader-block reader-h2">${sanitizeHtml(tText)}</h2>`,
          estimatedHeight: estimateBlockHeight(tText, 'h2')
        });
        bIdx++;
      }
    }

    // Strip title to process remaining paragraphs
    const bodyWithoutTitle = content.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '');

    // Tokenize <p>, <subtitle>, <blockquote>, <image>
    const pRegex = /<(p|subtitle|blockquote|empty-line|image)\b([^>]*)>([\s\S]*?)<\/\1>|<(empty-line|image)\b([^>]*)\/?>/gi;
    let match;

    while ((match = pRegex.exec(bodyWithoutTitle)) !== null) {
      const tag = (match[1] || match[4] || '').toLowerCase();
      const attrs = match[2] || match[5] || '';
      const rawInner = match[3] || '';

      if (tag === 'empty-line') {
        blocks.push({
          id: `ch${sectionIndex}_b${bIdx}`,
          chapterIndex: sectionIndex,
          blockIndex: bIdx,
          type: 'hr',
          text: '',
          html: '<div class="reader-empty-line"></div>',
          estimatedHeight: 24
        });
        bIdx++;
        continue;
      }

      // Check for standalone or inline <image> tag
      const hasInlineImage = tag === 'image' || rawInner.includes('<image');
      if (hasInlineImage) {
        const imgTagSrc = tag === 'image' ? attrs : rawInner;
        const hrefMatch = imgTagSrc.match(/(?:l:|xlink:)?href=["']#?([^"']+)["']/i);
        const imgId = hrefMatch ? hrefMatch[1].replace(/^#/, '') : null;
        const imgData = imgId && this.binaries.has(imgId) ? this.binaries.get(imgId) : '';
        if (imgData) {
          blocks.push({
            id: `ch${sectionIndex}_b${bIdx}`,
            chapterIndex: sectionIndex,
            blockIndex: bIdx,
            type: 'image',
            text: '[Иллюстрация]',
            html: `<div class="reader-image-wrap"><img src="${imgData}" alt="Иллюстрация" loading="lazy" /></div>`,
            estimatedHeight: 320
          });
          bIdx++;
        }
        if (tag === 'image') continue;
      }

      const plainText = decodeXmlEntities(rawInner.replace(/<[^>]+>/g, '')).trim();
      if (!plainText) continue;

      const blockType = tag === 'subtitle' ? 'h3' : tag === 'blockquote' ? 'blockquote' : 'p';
      const cleanHtml = sanitizeHtml(rawInner);
      const estHeight = estimateBlockHeight(plainText, blockType);

      blocks.push({
        id: `ch${sectionIndex}_b${bIdx}`,
        chapterIndex: sectionIndex,
        blockIndex: bIdx,
        type: blockType,
        text: plainText,
        html: `<${blockType} class="reader-block reader-${blockType}">${cleanHtml}</${blockType}>`,
        estimatedHeight: estHeight
      });
      bIdx++;
    }

    return blocks;
  }

  close() {
    this.xmlText = null;
    this.binaries.clear();
  }
}

module.exports = { Fb2Book };
