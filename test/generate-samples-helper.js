const fs = require('fs');
const path = require('path');

function generateSamples(samplesDir) {
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  // 1. TXT
  const txtContent = `Война и мир (Том 1)\nЛев Толстой\n\nГлава 1\nТекст первой главы.\n\nГлава 2\nТекст второй главы.\n\nГлава 3\nТекст третьей главы.`;
  fs.writeFileSync(path.join(samplesDir, 'sample_tolstoy.txt'), txtContent, 'utf8');

  // 2. FB2
  const fb2Content = `<?xml version="1.0" encoding="utf-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">
  <description>
    <title-info>
      <genre>prose_classic</genre>
      <author><first-name>Александр</first-name><last-name>Пушкин</last-name></author>
      <book-title>Евгений Онегин</book-title>
    </title-info>
  </description>
  <body>
    <section><title><p>Глава 1</p></title><p>Мой дядя самых честных правил...</p><p>Когда не в шутку занемог...</p><p>Он уважать себя заставил...</p></section>
    <section><title><p>Глава 2</p></title><p>Деревня где скучал Евгений...</p></section>
  </body>
</FictionBook>`;
  fs.writeFileSync(path.join(samplesDir, 'sample_pushkin.fb2'), fb2Content, 'utf8');

  // Simple ZIP generator helper
  function createZip(files) {
    const fileEntries = [];
    let offset = 0;
    const localHeaders = [];
    for (const f of files) {
      const dataBuf = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content, 'utf8');
      const nameBuf = Buffer.from(f.name, 'utf8');
      const crc = crc32(dataBuf);
      const h = Buffer.alloc(30);
      h.writeUInt32LE(0x04034b50, 0);
      h.writeUInt16LE(20, 4);
      h.writeUInt32LE(crc, 14);
      h.writeUInt32LE(dataBuf.length, 18);
      h.writeUInt32LE(dataBuf.length, 24);
      h.writeUInt16LE(nameBuf.length, 26);
      fileEntries.push({ name: f.name, nameBuf, dataBuf, crc, offset });
      localHeaders.push(Buffer.concat([h, nameBuf, dataBuf]));
      offset += h.length + nameBuf.length + dataBuf.length;
    }
    const cdHeaders = [];
    let cdSize = 0;
    for (const f of fileEntries) {
      const cd = Buffer.alloc(46);
      cd.writeUInt32LE(0x02014b50, 0);
      cd.writeUInt16LE(20, 4);
      cd.writeUInt16LE(20, 6);
      cd.writeUInt32LE(f.crc, 16);
      cd.writeUInt32LE(f.dataBuf.length, 20);
      cd.writeUInt32LE(f.dataBuf.length, 24);
      cd.writeUInt16LE(f.nameBuf.length, 28);
      cd.writeUInt32LE(f.offset, 42);
      const fullCd = Buffer.concat([cd, f.nameBuf]);
      cdHeaders.push(fullCd);
      cdSize += fullCd.length;
    }
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(fileEntries.length, 8);
    eocd.writeUInt16LE(fileEntries.length, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(offset, 16);
    return Buffer.concat([...localHeaders, ...cdHeaders, eocd]);
  }

  function crc32(buf) {
    let crc = ~0;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return ~crc >>> 0;
  }

  // 3. FB2.ZIP
  const fb2Zip = createZip([{ name: 'pushkin.fb2', content: fb2Content }]);
  fs.writeFileSync(path.join(samplesDir, 'sample_pushkin.fb2.zip'), fb2Zip);

  // 4. EPUB
  const containerXml = `<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`;
  const contentOpf = `<package xmlns="http://www.idpf.org/2007/opf" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>The Adventures of Sherlock Holmes</dc:title><dc:creator>Arthur Conan Doyle</dc:creator></metadata><manifest><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="c2.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/><itemref idref="c2"/></spine></package>`;
  const c1Html = `<!DOCTYPE html><html><body><h1>I. A Scandal in Bohemia</h1><p>To Sherlock Holmes she is always the woman.</p><p>Second paragraph text.</p><p>Third paragraph text.</p></body></html>`;
  const c2Html = `<!DOCTYPE html><html><body><h1>II. The Red-Headed League</h1><p>Another chapter text.</p></body></html>`;

  const epub = createZip([
    { name: 'mimetype', content: 'application/epub+zip' },
    { name: 'META-INF/container.xml', content: containerXml },
    { name: 'OEBPS/content.opf', content: contentOpf },
    { name: 'OEBPS/c1.xhtml', content: c1Html },
    { name: 'OEBPS/c2.xhtml', content: c2Html }
  ]);
  fs.writeFileSync(path.join(samplesDir, 'sample_sherlock.epub'), epub);

  // 5. MOBI
  const dbName = Buffer.alloc(32);
  dbName.write('MobiSampleBook', 'ascii');
  const pdbHeader = Buffer.alloc(78);
  dbName.copy(pdbHeader, 0);
  pdbHeader.write('BOOKMOBI', 60, 'ascii');
  pdbHeader.writeUInt16BE(2, 76);
  const rec0 = Buffer.alloc(160);
  rec0.writeUInt16BE(1, 0);
  rec0.writeUInt32BE(200, 4);
  rec0.writeUInt16BE(1, 8);
  rec0.writeUInt16BE(4096, 10);
  rec0.write('MOBI', 16, 'ascii');
  rec0.writeUInt32BE(104, 20);
  rec0.writeUInt32BE(120, 84);
  rec0.writeUInt32BE(16, 88);
  rec0.write('Sample MOBI Book', 120, 'ascii');
  const textContent = Buffer.from('<h1>Chapter One</h1><p>Sample MOBI paragraph text.</p><p>Second paragraph.</p>', 'utf8');
  const recList = Buffer.alloc(16);
  recList.writeUInt32BE(78 + 16, 0);
  recList.writeUInt32BE(78 + 16 + 160, 8);
  fs.writeFileSync(path.join(samplesDir, 'sample_mobi.mobi'), Buffer.concat([pdbHeader, recList, rec0, textContent]));
}

module.exports = generateSamples;
