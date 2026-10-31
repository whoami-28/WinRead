const path = require('path');
const { EpubBook } = require('./epub');
const { Fb2Book } = require('./fb2');
const { MobiBook } = require('./mobi');
const { TxtBook } = require('./txt');

class BookParser {
  static async open(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const base = path.basename(filePath).toLowerCase();

    if (base.endsWith('.fb2.zip') || ext === '.fb2') {
      return await Fb2Book.open(filePath);
    } else if (ext === '.epub') {
      return await EpubBook.open(filePath);
    } else if (ext === '.mobi' || ext === '.prc' || ext === '.azw') {
      return await MobiBook.open(filePath);
    } else if (ext === '.txt') {
      return await TxtBook.open(filePath);
    } else if (ext === '.zip') {
      // Could be FB2 inside ZIP or EPUB renamed
      try {
        return await Fb2Book.open(filePath);
      } catch (_) {
        return await EpubBook.open(filePath);
      }
    } else {
      throw new Error(`Unsupported book format: ${ext}`);
    }
  }
}

module.exports = { BookParser };
