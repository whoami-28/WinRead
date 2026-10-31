const crypto = require('crypto');
const fs = require('fs');

/**
 * Composite Fast Hash Calculator
 * Formula: sha256(fileSize + ":" + sha256(first 64KB) + ":" + sha256(last 64KB))
 * Bypasses reading multi-megabyte files in full.
 */
function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compute fast composite hash from a local file path
 * @param {string} filePath
 * @returns {{ id: string, size: number }}
 */
function calculateFastHashFromPath(filePath) {
  const stat = fs.statSync(filePath);
  const size = stat.size;
  const CHUNK_SIZE = 64 * 1024; // 64KB

  const fd = fs.openSync(filePath, 'r');
  try {
    if (size <= CHUNK_SIZE * 2) {
      const buf = Buffer.alloc(size);
      fs.readSync(fd, buf, 0, size, 0);
      const fullHash = sha256Buffer(buf);
      return { id: `hash_${size}_${fullHash.slice(0, 24)}`, size };
    }

    const headBuf = Buffer.alloc(CHUNK_SIZE);
    fs.readSync(fd, headBuf, 0, CHUNK_SIZE, 0);
    const headHash = sha256Buffer(headBuf);

    const tailBuf = Buffer.alloc(CHUNK_SIZE);
    fs.readSync(fd, tailBuf, 0, CHUNK_SIZE, size - CHUNK_SIZE);
    const tailHash = sha256Buffer(tailBuf);

    const composite = crypto
      .createHash('sha256')
      .update(`${size}:${headHash}:${tailHash}`)
      .digest('hex');

    return { id: `fast_${size}_${composite.slice(0, 24)}`, size };
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Compute fast composite hash from an in-memory buffer or remote range provider
 * @param {number} size
 * @param {Buffer} headBuf (at least up to 64KB)
 * @param {Buffer} tailBuf (last 64KB)
 */
function calculateFastHashFromBuffers(size, headBuf, tailBuf) {
  const headHash = sha256Buffer(headBuf.slice(0, 64 * 1024));
  const tailHash = sha256Buffer(tailBuf.slice(Math.max(0, tailBuf.length - 64 * 1024)));

  const composite = crypto
    .createHash('sha256')
    .update(`${size}:${headHash}:${tailHash}`)
    .digest('hex');

  return `fast_${size}_${composite.slice(0, 24)}`;
}

/**
 * Sanitize HTML text to prevent XSS while preserving safe formatting
 * Allowed inline tags: em, i, strong, b, code, sup, sub, span, a, br
 */
function sanitizeHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^"']*/gi, '');
}

/**
 * Clean plain text from XML/HTML entities
 */
function decodeXmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Estimate block height based on character length and type
 * Baseline: 16px font, 1.6 line height (~26px per line), ~75 chars per line on average desktop width
 */
function estimateBlockHeight(text, type = 'p') {
  if (type.startsWith('h1')) return 64;
  if (type.startsWith('h2')) return 52;
  if (type.startsWith('h3')) return 42;
  if (type === 'hr') return 24;
  if (type === 'image') return 280;

  const len = text ? text.length : 0;
  if (len === 0) return 20;

  const lines = Math.max(1, Math.ceil(len / 75));
  return lines * 26 + 16; // 16px paragraph bottom margin
}

module.exports = {
  sha256Buffer,
  calculateFastHashFromPath,
  calculateFastHashFromBuffers,
  sanitizeHtml,
  decodeXmlEntities,
  estimateBlockHeight
};
