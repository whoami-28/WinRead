const fs = require('fs');
const zlib = require('zlib');

/**
 * Universal Byte Source interface for ZIP reading
 */
class LocalByteSource {
  constructor(filePath) {
    this.filePath = filePath;
    this.fd = null;
    this.size = 0;
  }

  async open() {
    const stat = fs.statSync(this.filePath);
    this.size = stat.size;
    this.fd = fs.openSync(this.filePath, 'r');
  }

  async read(offset, length) {
    const actualLen = Math.min(length, Math.max(0, this.size - offset));
    if (actualLen <= 0) return Buffer.alloc(0);
    const buf = Buffer.alloc(actualLen);
    fs.readSync(this.fd, buf, 0, actualLen, offset);
    return buf;
  }

  close() {
    if (this.fd !== null) {
      try {
        fs.closeSync(this.fd);
      } catch (_) {}
      this.fd = null;
    }
  }
}

class RemoteByteSource {
  constructor(url, size, fetchFn = null) {
    this.url = url;
    this.size = size;
    this.fetchFn = fetchFn || (async (u, opts) => await fetch(u, opts));
  }

  async open() {
    if (!this.size) {
      const res = await this.fetchFn(this.url, { method: 'HEAD' });
      const len = res.headers.get('content-length');
      this.size = len ? parseInt(len, 10) : 0;
    }
  }

  async read(offset, length) {
    const end = Math.min(this.size - 1, offset + length - 1);
    if (offset > end) return Buffer.alloc(0);

    const res = await this.fetchFn(this.url, {
      headers: { Range: `bytes=${offset}-${end}` }
    });
    if (!res.ok && res.status !== 206 && res.status !== 200) {
      throw new Error(`Failed to fetch range ${offset}-${end}: HTTP ${res.status}`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  close() {}
}

class BufferByteSource {
  constructor(buffer) {
    this.buffer = buffer;
    this.size = buffer.length;
  }
  async open() {}
  async read(offset, length) {
    return this.buffer.slice(offset, Math.min(this.size, offset + length));
  }
  close() {}
}

/**
 * High-performance random access streaming ZIP reader
 */
class RandomAccessZip {
  constructor(byteSource) {
    this.source = byteSource;
    this.entries = new Map();
  }

  static fromPath(filePath) {
    return new RandomAccessZip(new LocalByteSource(filePath));
  }

  static fromRemote(url, size = 0, fetchFn = null) {
    return new RandomAccessZip(new RemoteByteSource(url, size, fetchFn));
  }

  static fromBuffer(buffer) {
    return new RandomAccessZip(new BufferByteSource(buffer));
  }

  async init() {
    await this.source.open();
    const size = this.source.size;
    if (size < 22) throw new Error('File too small to be a valid ZIP archive');

    // Read end of file (up to 65KB + 22) to locate End of Central Directory (EOCD)
    const readLen = Math.min(size, 65536 + 22);
    const readOffset = size - readLen;
    const tailBuf = await this.source.read(readOffset, readLen);

    // Search backwards for EOCD signature: 0x06054b50 (PK\x05\x06)
    let eocdOffsetInTail = -1;
    for (let i = tailBuf.length - 22; i >= 0; i--) {
      if (
        tailBuf[i] === 0x50 &&
        tailBuf[i + 1] === 0x4b &&
        tailBuf[i + 2] === 0x05 &&
        tailBuf[i + 3] === 0x06
      ) {
        eocdOffsetInTail = i;
        break;
      }
    }

    if (eocdOffsetInTail === -1) {
      throw new Error('EOCD signature not found; not a valid ZIP file');
    }

    const totalEntries = tailBuf.readUInt16LE(eocdOffsetInTail + 10);
    const cdSize = tailBuf.readUInt32LE(eocdOffsetInTail + 12);
    const cdOffset = tailBuf.readUInt32LE(eocdOffsetInTail + 16);

    let cdBuf;
    // Check if the entire Central Directory is already contained within our tailBuf
    const cdAbsEnd = cdOffset + cdSize;
    if (cdOffset >= readOffset && cdAbsEnd <= size) {
      const startInTail = cdOffset - readOffset;
      cdBuf = tailBuf.slice(startInTail, startInTail + cdSize);
    } else {
      // Need to fetch Central Directory explicitly
      cdBuf = await this.source.read(cdOffset, cdSize);
    }

    // Parse Central Directory entries
    let p = 0;
    while (p < cdBuf.length - 46) {
      const sig = cdBuf.readUInt32LE(p);
      if (sig !== 0x02014b50) break; // End of entries or corrupted

      const method = cdBuf.readUInt16LE(p + 10);
      const compressedSize = cdBuf.readUInt32LE(p + 20);
      const uncompressedSize = cdBuf.readUInt32LE(p + 24);
      const nameLen = cdBuf.readUInt16LE(p + 28);
      const extraLen = cdBuf.readUInt16LE(p + 30);
      const commentLen = cdBuf.readUInt16LE(p + 32);
      const localHeaderOffset = cdBuf.readUInt32LE(p + 42);

      const nameBytes = cdBuf.slice(p + 46, p + 46 + nameLen);
      const fileName = nameBytes.toString('utf8');

      this.entries.set(fileName, {
        fileName,
        method,
        compressedSize,
        uncompressedSize,
        localHeaderOffset
      });

      p += 46 + nameLen + extraLen + commentLen;
    }
  }

  hasFile(fileName) {
    if (this.entries.has(fileName)) return true;
    // Normalized path lookup (forward slashes)
    const norm = fileName.replace(/\\/g, '/');
    return this.entries.has(norm);
  }

  getEntry(fileName) {
    if (this.entries.has(fileName)) return this.entries.get(fileName);
    const norm = fileName.replace(/\\/g, '/');
    if (this.entries.has(norm)) return this.entries.get(norm);
    // Case-insensitive fallback
    const lower = norm.toLowerCase();
    for (const [k, v] of this.entries.entries()) {
      if (k.toLowerCase() === lower) return v;
    }
    return null;
  }

  getFileList() {
    return Array.from(this.entries.keys());
  }

  async readFile(fileName) {
    const entry = this.getEntry(fileName);
    if (!entry) {
      throw new Error(`Entry "${fileName}" not found in ZIP`);
    }

    // Read local header (30 bytes) to determine actual data offset
    const localHeader = await this.source.read(entry.localHeaderOffset, 30);
    if (localHeader.readUInt32LE(0) !== 0x04034b50) {
      throw new Error(`Corrupted local header for ${fileName}`);
    }

    const localNameLen = localHeader.readUInt16LE(26);
    const localExtraLen = localHeader.readUInt16LE(28);
    const dataOffset = entry.localHeaderOffset + 30 + localNameLen + localExtraLen;

    const compressedData = await this.source.read(dataOffset, entry.compressedSize);

    if (entry.method === 0) {
      // Stored (no compression)
      return compressedData;
    } else if (entry.method === 8) {
      // Deflated
      return zlib.inflateRawSync(compressedData);
    } else {
      throw new Error(`Unsupported compression method ${entry.method} for ${fileName}`);
    }
  }

  async readText(fileName, encoding = 'utf8') {
    const buf = await this.readFile(fileName);
    return buf.toString(encoding);
  }

  close() {
    this.source.close();
  }
}

module.exports = {
  RandomAccessZip,
  LocalByteSource,
  RemoteByteSource,
  BufferByteSource
};
