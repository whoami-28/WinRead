const path = require('path');
const { RandomAccessZip } = require('./zip-stream');
const {
  calculateFastHashFromPath,
  sanitizeHtml,
  decodeXmlEntities,
  estimateBlockHeight
} = require('./base');

/**
 * Fast Regex-based XML/HTML element parser (avoiding bloated DOM/XML libraries)
 */
function getTagContent(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? decodeXmlEntities(match[1].trim()) : '';
}

function getTagAttr(xml, tagName, attrName) {
  const regex = new RegExp(`<${tagName}[^>]*\\b${attrName}=["']([^"']*)["'][^>]*>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function resolveZipPath(basePath, relativePath) {
  const dir = path.posix.dirname(basePath);
  const cleanRel = relativePath.split('#')[0].split('?')[0];
  const resolved = path.posix.normalize(dir === '.' || dir === '/' ? cleanRel : `${dir}/${cleanRel}`);
  return resolved.replace(/^\/+/, '');
}

async function resolveImageAsDataUrl(zip, chapterHref, rawSrc) {
  if (!rawSrc || rawSrc.startsWith('data:')) return rawSrc;
  try {
    const zipPath = resolveZipPath(chapterHref, rawSrc);
    const buf = await zip.readFile(zipPath);
    const ext = path.extname(zipPath).toLowerCase();
    const mime = ext === '.png' ? 'image/png'
      : ext === '.webp' ? 'image/webp'
      : ext === '.gif' ? 'image/gif'
      : ext === '.svg' ? 'image/svg+xml'
      : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (_) {
    return rawSrc;
  }
}

class EpubBook {
  constructor(zip, filePath, meta) {
    this.zip = zip;
    this.filePath = filePath;
    this.id = meta.id;
    this.title = meta.title || 'Untitled';
    this.author = meta.author || 'Unknown Author';
    this.language = meta.language || 'en';
    this.format = 'epub';
    this.coverDataUrl = meta.coverDataUrl || null;
    this.chapters = meta.chapters || [];
    this.spineItems = meta.spineItems || [];
    this.manifest = meta.manifest || {};
    this.opfDir = meta.opfDir || '';
  }

  static async open(filePath) {
    const { id, size } = calculateFastHashFromPath(filePath);
    const zip = RandomAccessZip.fromPath(filePath);
    await zip.init();

    // 1. Read container.xml
    const containerXml = await zip.readText('META-INF/container.xml');
    const opfPath = getTagAttr(containerXml, 'rootfile', 'full-path');
    if (!opfPath) throw new Error('Invalid EPUB: no rootfile in container.xml');

    const opfDir = path.dirname(opfPath).replace(/\\/g, '/');
    const opfXml = await zip.readText(opfPath);

    // 2. Metadata
    const title = getTagContent(opfXml, 'dc:title') || path.basename(filePath, '.epub');
    const author = getTagContent(opfXml, 'dc:creator') || 'Unknown Author';
    const language = getTagContent(opfXml, 'dc:language') || 'en';

    // 3. Manifest
    const manifest = {};
    const itemRegex = /<item\b([^>]+)\/?>/gi;
    let itemMatch;
    let coverId = null;

    while ((itemMatch = itemRegex.exec(opfXml)) !== null) {
      const attrs = itemMatch[1];
      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      const typeMatch = attrs.match(/media-type=["']([^"']+)["']/i);
      const propsMatch = attrs.match(/properties=["']([^"']+)["']/i);

      if (idMatch && hrefMatch) {
        const itemId = idMatch[1];
        const rawHref = hrefMatch[1];
        const normHref = opfDir ? `${opfDir}/${rawHref}`.replace(/\/+/g, '/') : rawHref;
        const mediaType = typeMatch ? typeMatch[1] : '';
        const properties = propsMatch ? propsMatch[1] : '';

        manifest[itemId] = { href: normHref, mediaType, properties };

        if (properties.includes('cover-image') || itemId.toLowerCase().includes('cover')) {
          coverId = itemId;
        }
      }
    }

    // Cover meta tag check: <meta name="cover" content="id"/>
    const metaCoverMatch = opfXml.match(/<meta\b[^>]*name=["']cover["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (metaCoverMatch && manifest[metaCoverMatch[1]]) {
      coverId = metaCoverMatch[1];
    }

    let coverDataUrl = null;
    if (coverId && manifest[coverId]) {
      try {
        const coverBuf = await zip.readFile(manifest[coverId].href);
        const mime = manifest[coverId].mediaType || 'image/jpeg';
        coverDataUrl = `data:${mime};base64,${coverBuf.toString('base64')}`;
      } catch (_) {}
    }

    // Fallback: search files in zip for cover image
    if (!coverDataUrl) {
      const allFiles = zip.getFileList();
      const coverFile = allFiles.find(f => /cover.*\.(jpe?g|png|webp)$/i.test(f) || /titlepage.*\.(jpe?g|png|webp)$/i.test(f));
      if (coverFile) {
        try {
          const coverBuf = await zip.readFile(coverFile);
          const ext = path.extname(coverFile).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          coverDataUrl = `data:${mime};base64,${coverBuf.toString('base64')}`;
        } catch (_) {}
      }
    }

    // 4. Spine items
    const spineItems = [];
    const itemrefRegex = /<itemref\b[^>]*idref=["']([^"']+)["'][^>]*\/?>/gi;
    let refMatch;
    while ((refMatch = itemrefRegex.exec(opfXml)) !== null) {
      const idref = refMatch[1];
      if (manifest[idref]) {
        spineItems.push(manifest[idref].href);
      }
    }

    // 5. Table of contents (from NCX or spine item titles)
    const chapters = [];
    for (let i = 0; i < spineItems.length; i++) {
      chapters.push({
        index: i,
        title: `Chapter ${i + 1}`,
        href: spineItems[i],
        startBlockIndex: 0
      });
    }

    // Attempt to extract richer chapter titles from NCX if available
    let ncxItem = Object.values(manifest).find(
      m => m.mediaType === 'application/x-dtbncx+xml' || m.href.endsWith('.ncx')
    );
    if (ncxItem) {
      try {
        const ncxXml = await zip.readText(ncxItem.href);
        const navPointRegex = /<navPoint[\s\S]*?<text>([\s\S]*?)<\/text>[\s\S]*?<content\s+src=["']([^"']+)["'][\s\S]*?<\/navPoint>/gi;
        let npMatch;
        let cIdx = 0;
        while ((npMatch = navPointRegex.exec(ncxXml)) !== null) {
          const navTitle = decodeXmlEntities(npMatch[1].trim());
          const navSrc = npMatch[2].split('#')[0];
          const matchedChapter = chapters.find(c => c.href.endsWith(navSrc) || navSrc.endsWith(c.href));
          if (matchedChapter) {
            matchedChapter.title = navTitle;
          } else if (cIdx < chapters.length) {
            chapters[cIdx].title = navTitle;
          }
          cIdx++;
        }
      } catch (_) {}
    }

    return new EpubBook(zip, filePath, {
      id,
      title,
      author,
      language,
      coverDataUrl,
      chapters,
      spineItems,
      manifest,
      opfDir
    });
  }

  /**
   * Lazily loads and tokenizes a chapter's XHTML into atomic blocks
   * @param {number} chapterIndex
   * @returns {Promise<Array<{ id: string, chapterIndex: number, blockIndex: number, type: string, text: string, html: string, estimatedHeight: number }>>}
   */
  async loadChapterBlocks(chapterIndex) {
    if (chapterIndex < 0 || chapterIndex >= this.spineItems.length) {
      return [];
    }

    const chapterHref = this.spineItems[chapterIndex];
    let htmlContent = '';
    try {
      htmlContent = await this.zip.readText(chapterHref);
    } catch (err) {
      return [
        {
          id: `ch${chapterIndex}_b0`,
          chapterIndex,
          blockIndex: 0,
          type: 'p',
          text: `[Error loading chapter: ${err.message}]`,
          html: `<p class="error">[Error loading chapter: ${err.message}]</p>`,
          estimatedHeight: 40
        }
      ];
    }

    // Extract body content
    const bodyMatch = htmlContent.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    const content = bodyMatch ? bodyMatch[1] : htmlContent;

    // Tokenize into paragraphs, headings, blockquotes, and images
    const blockRegex = /<(h[1-6]|p|blockquote|li|hr|div|section)\b([^>]*)>([\s\S]*?)<\/\1>|<(img|image)\b([^>]*)\/?>/gi;
    const blocks = [];
    let match;
    let bIdx = 0;

    while ((match = blockRegex.exec(content)) !== null) {
      const tag = (match[1] || match[4] || '').toLowerCase();
      const rawInner = match[3] || '';

      // Check for standalone or inline image
      const isImgTag = tag === 'img' || tag === 'image';
      const hasInnerImg = !isImgTag && (rawInner.includes('<img') || rawInner.includes('<image'));

      if (isImgTag || hasInnerImg) {
        const imgAttrs = isImgTag ? match[5] : rawInner;
        const srcMatch = imgAttrs.match(/(?:src|href|xlink:href)=["']([^"']+)["']/i);
        if (srcMatch) {
          const resolvedDataUrl = await resolveImageAsDataUrl(this.zip, chapterHref, srcMatch[1]);
          blocks.push({
            id: `ch${chapterIndex}_b${bIdx}`,
            chapterIndex,
            blockIndex: bIdx,
            type: 'image',
            text: '[Иллюстрация]',
            html: `<div class="reader-image-wrap"><img src="${resolvedDataUrl}" alt="Иллюстрация" loading="lazy" /></div>`,
            estimatedHeight: 340
          });
          bIdx++;
        }
        if (isImgTag) continue;
      }

      // Strip inner tags to compute clean text for search and height estimation
      const plainText = decodeXmlEntities(rawInner.replace(/<[^>]+>/g, '')).trim();
      if (!plainText && tag !== 'hr') continue;

      const cleanHtml = sanitizeHtml(rawInner);
      const estHeight = estimateBlockHeight(plainText, tag);

      blocks.push({
        id: `ch${chapterIndex}_b${bIdx}`,
        chapterIndex,
        blockIndex: bIdx,
        type: tag,
        text: plainText,
        html: `<${tag} class="reader-block reader-${tag}">${cleanHtml}</${tag}>`,
        estimatedHeight: estHeight
      });
      bIdx++;
    }

    // Fallback if no block tags matched (e.g., plain text wrapped in body)
    if (blocks.length === 0) {
      const paragraphs = content.split(/\n\s*\n/);
      paragraphs.forEach((pText, i) => {
        const clean = decodeXmlEntities(pText.replace(/<[^>]+>/g, '')).trim();
        if (clean) {
          blocks.push({
            id: `ch${chapterIndex}_b${i}`,
            chapterIndex,
            blockIndex: i,
            type: 'p',
            text: clean,
            html: `<p class="reader-block reader-p">${sanitizeHtml(clean)}</p>`,
            estimatedHeight: estimateBlockHeight(clean, 'p')
          });
        }
      });
    }

    return blocks;
  }

  close() {
    this.zip.close();
  }
}

module.exports = { EpubBook };
