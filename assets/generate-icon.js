const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

function createIcoBuffer(images) {
  // images: array of { width, height, buffer }
  const headerSize = 6;
  const entrySize = 16;
  const count = images.length;

  let offset = headerSize + entrySize * count;
  const dir = Buffer.alloc(headerSize);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // icon type
  dir.writeUInt16LE(count, 4);

  const entries = [];
  const buffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset

    entries.push(entry);
    buffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([dir, ...entries, ...buffers]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    webPreferences: { offscreen: true }
  });

  const svgPath = path.join(__dirname, 'icon.svg').replace(/\\/g, '/');
  await win.loadURL(`file:///${svgPath}`);

  // Capture master 512x512 PNG
  const masterImage = await win.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  const masterPng = masterImage.toPNG();
  fs.writeFileSync(path.join(__dirname, 'icon.png'), masterPng);
  console.log(`Saved 512x512 PNG (${masterPng.length} bytes) to assets/icon.png`);

  // Generate multi-resolution ICO layers
  const sizes = [256, 128, 64, 48, 32, 16];
  const icoLayers = [];

  for (const s of sizes) {
    const resized = masterImage.resize({ width: s, height: s, quality: 'best' });
    icoLayers.push({
      width: s,
      height: s,
      buffer: resized.toPNG()
    });
  }

  const icoBuffer = createIcoBuffer(icoLayers);
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), icoBuffer);
  console.log(`Saved multi-resolution Windows ICO (${icoBuffer.length} bytes) to assets/icon.ico`);

  app.quit();
});
