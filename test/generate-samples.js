const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const samplesDir = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// 1. Generate sample.txt
const txtContent = `Война и мир (Том 1)
Лев Николаевич Толстой

Глава 1
— Eh bien, mon prince. Gênes et Lucques ne sont plus que des apanages, des поместья, de la famille Buonaparte.
Так говорила в июле 1805 года известная Анна Павловна Шерер, фрейлина и приближенная императрицы Марии Феодоровны, встречая важного и чиновного князя Василия.
Анна Павловна кашляла несколько дней, у нее был грипп, как она говорила (грипп был тогда новое слово, употреблявшееся только редкими).

Глава 2
Гостиная Анны Павловны начала понемногу наполняться. Приехала высшая петербургская знать, самая разнородная по возрастам и характерам, но одинаковая по обществу, в каком все обращались.
Приехала дочь князя Василия, красавица Элен, заехавшая за отцом, чтобы с ним вместе ехать на праздник посланника.
Она была в шифре и бальном платье.

Глава 3
Пьер только что приехал в Петербург из-за границы, где он воспитывался, и был первый раз в обществе.
Князь Василий исполнил обещание, данное Анне Павловне, сказав:
— Mon cher Pierre, вы должны познакомиться с хозяевами этого дома.
`;

fs.writeFileSync(path.join(samplesDir, 'sample_tolstoy.txt'), txtContent, 'utf8');

// 2. Generate sample.fb2
const fb2Content = `<?xml version="1.0" encoding="utf-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">
  <description>
    <title-info>
      <genre>prose_classic</genre>
      <author>
        <first-name>Александр</first-name>
        <last-name>Пушкин</last-name>
      </author>
      <book-title>Евгений Онегин</book-title>
      <lang>ru</lang>
    </title-info>
  </description>
  <body>
    <section>
      <title><p>Глава первая</p></title>
      <p>«Мой дядя самых честных правил,</p>
      <p>Когда не в шутку занемог,</p>
      <p>Он уважать себя заставил</p>
      <p>И лучше выдумать не мог.</p>
      <empty-line/>
      <p>Его пример другим наука;</p>
      <p>Но, боже мой, какая скука</p>
      <p>С больным сидеть и день и ночь,</p>
      <p>Не отходя ни шагу прочь!</p>
    </section>
    <section>
      <title><p>Глава вторая</p></title>
      <p>Деревня, где скучал Евгений,</p>
      <p>Была прелестный уголок;</p>
      <p>Там друг невинных наслаждений</p>
      <p>Благословить бы небо мог.</p>
      <p>Господский дом уединенный,</p>
      <p>Горой от ветров огражденный,</p>
      <p>Стоял над речкою...</p>
    </section>
  </body>
</FictionBook>`;

fs.writeFileSync(path.join(samplesDir, 'sample_pushkin.fb2'), fb2Content, 'utf8');

// 3. Helper to write simple ZIP archives
function createSimpleZip(files) {
  // files: array of { name: string, content: Buffer|string }
  const fileEntries = [];
  let offset = 0;

  const localHeaders = [];
  for (const f of files) {
    const dataBuf = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content, 'utf8');
    const nameBuf = Buffer.from(f.name, 'utf8');
    const crc = crc32(dataBuf);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // signature
    header.writeUInt16LE(20, 4); // min version
    header.writeUInt16LE(0, 6); // flags
    header.writeUInt16LE(0, 8); // method = stored
    header.writeUInt16LE(0, 10); // time
    header.writeUInt16LE(0, 12); // date
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(dataBuf.length, 18); // compressed size
    header.writeUInt32LE(dataBuf.length, 22); // uncompressed size
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28); // extra len

    fileEntries.push({
      name: f.name,
      nameBuf,
      dataBuf,
      crc,
      offset
    });

    localHeaders.push(Buffer.concat([header, nameBuf, dataBuf]));
    offset += header.length + nameBuf.length + dataBuf.length;
  }

  const cdHeaders = [];
  let cdSize = 0;
  for (const f of fileEntries) {
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(f.crc, 16);
    cd.writeUInt32LE(f.dataBuf.length, 20);
    cd.writeUInt32LE(f.dataBuf.length, 24);
    cd.writeUInt16LE(f.nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(f.offset, 42);

    const fullCd = Buffer.concat([cd, f.nameBuf]);
    cdHeaders.push(fullCd);
    cdSize += fullCd.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(fileEntries.length, 8);
  eocd.writeUInt16LE(fileEntries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...cdHeaders, eocd]);
}

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ~crc >>> 0;
}

// 4. Generate sample_pushkin.fb2.zip
const fb2ZipBuf = createSimpleZip([
  { name: 'pushkin.fb2', content: fb2Content }
]);
fs.writeFileSync(path.join(samplesDir, 'sample_pushkin.fb2.zip'), fb2ZipBuf);

// 5. Generate sample_sherlock.epub
const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>The Adventures of Sherlock Holmes</dc:title>
    <dc:creator>Arthur Conan Doyle</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch2" href="ch2.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="ch1"/>
    <itemref idref="ch2"/>
  </spine>
</package>`;

const ch1Html = `<!DOCTYPE html>
<html>
<head><title>A Scandal in Bohemia</title></head>
<body>
  <h1>I. A Scandal in Bohemia</h1>
  <p>To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name.</p>
  <p>In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler.</p>
  <p>All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.</p>
</body>
</html>`;

const ch2Html = `<!DOCTYPE html>
<html>
<head><title>The Red-Headed League</title></head>
<body>
  <h1>II. The Red-Headed League</h1>
  <p>I had called upon my friend, Mr. Sherlock Holmes, one day in the autumn of last year and found him in deep conversation with a very stout, florid-faced, elderly gentleman with fiery red hair.</p>
  <p>With an apology for my intrusion, I was about to withdraw when Holmes pulled me abruptly into the room and closed the door behind me.</p>
</body>
</html>`;

const epubBuf = createSimpleZip([
  { name: 'mimetype', content: 'application/epub+zip' },
  { name: 'META-INF/container.xml', content: containerXml },
  { name: 'OEBPS/content.opf', content: contentOpf },
  { name: 'OEBPS/ch1.xhtml', content: ch1Html },
  { name: 'OEBPS/ch2.xhtml', content: ch2Html }
]);
fs.writeFileSync(path.join(samplesDir, 'sample_sherlock.epub'), epubBuf);

// 6. Generate sample_sample.mobi
// Simple uncompressed PalmDOC database file
const dbName = Buffer.alloc(32);
dbName.write('MobiSampleBook', 'ascii');
const pdbHeader = Buffer.alloc(78);
dbName.copy(pdbHeader, 0);
pdbHeader.writeUInt16BE(0, 32); // attributes
pdbHeader.writeUInt16BE(0, 34); // version
pdbHeader.write('BOOKMOBI', 60, 'ascii'); // Type + Creator
pdbHeader.writeUInt16BE(2, 76); // 2 records: Rec0 (header) and Rec1 (text)

// Rec 0: PalmDOC header (16 bytes) + MOBI header (ident 'MOBI' + len)
const rec0 = Buffer.alloc(160);
rec0.writeUInt16BE(1, 0); // compression = 1 (uncompressed)
rec0.writeUInt32BE(200, 4); // text length
rec0.writeUInt16BE(1, 8); // 1 text record
rec0.writeUInt16BE(4096, 10); // record size
rec0.write('MOBI', 16, 'ascii');
rec0.writeUInt32BE(104, 20); // mobi header length
rec0.writeUInt32BE(120, 84); // title offset at byte 120
rec0.writeUInt32BE(16, 88); // title length
rec0.write('Sample MOBI Book', 120, 'ascii');

// Rec 1: text content
const textContent = Buffer.from(`<h1>Chapter One</h1><p>This is a sample MOBI book text parsed with ultra-fast PalmDOC extraction.</p><p>The desktop reader reproduces the ReadEra experience with instantaneous virtual scrolling.</p>`, 'utf8');

const rec0Offset = 78 + 2 * 8;
const rec1Offset = rec0Offset + rec0.length;

const recList = Buffer.alloc(16);
recList.writeUInt32BE(rec0Offset, 0);
recList.writeUInt32BE(rec1Offset, 8);

const mobiBuf = Buffer.concat([pdbHeader, recList, rec0, textContent]);
fs.writeFileSync(path.join(samplesDir, 'sample_mobi.mobi'), mobiBuf);

console.log('Sample books generated successfully in:', samplesDir);
