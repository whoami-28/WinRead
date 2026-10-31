const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

function createIcoBuffer(images) {
  const headerSize = 6;
  const entrySize = 16;
  const count = images.length;

  let offset = headerSize + entrySize * count;
  const dir = Buffer.alloc(headerSize);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // icon type (1 = icon)
  dir.writeUInt16LE(count, 4);

  const entries = [];
  const buffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
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
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const svgContent = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 512px;
    height: 512px;
    background: transparent !important;
    overflow: hidden;
  }
  svg {
    width: 512px;
    height: 512px;
    display: block;
    background: transparent !important;
  }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise(r => setTimeout(r, 400));

  const captured = await win.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  
  // Resize to exact 512x512
  const masterImage = captured.resize({ width: 512, height: 512, quality: 'best' });
  const masterPng = masterImage.toPNG();
  const pngPath = path.join(__dirname, 'icon.png');
  fs.writeFileSync(pngPath, masterPng);
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
  const icoPath = path.join(__dirname, 'icon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`Saved multi-resolution Windows ICO (${icoBuffer.length} bytes) to assets/icon.ico`);

  app.quit();
});
