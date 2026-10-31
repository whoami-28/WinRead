const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

class MtpBridge {
  constructor() {
    const baseDir = __dirname.replace('app.asar', 'app.asar.unpacked');
    this.detectScript = path.join(baseDir, 'detect-mtp.ps1');
    this.pullScript = path.join(baseDir, 'pull-mtp.ps1');
    this.pullBookScript = path.join(baseDir, 'pull-book.ps1');
  }

  async detectDevices() {
    return new Promise((resolve) => {
      execFile(
        'powershell',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', this.detectScript],
        { timeout: 8000 },
        (err, stdout) => {
          if (err || !stdout) {
            return resolve([]);
          }
          try {
            const parsed = JSON.parse(stdout.trim());
            const list = Array.isArray(parsed) ? parsed : (parsed.deviceName ? [parsed] : []);
            resolve(list);
          } catch (_) {
            resolve([]);
          }
        }
      );
    });
  }

  async pullLatestBackup(deviceName = '', destDir = null) {
    const targetDir = destDir || path.join(__dirname, '..', 'data');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const destPath = path.join(targetDir, 'synced_phone_backup.bak');

    return new Promise((resolve, reject) => {
      execFile(
        'powershell',
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          this.pullScript,
          '-DeviceName',
          deviceName,
          '-DestPath',
          destPath
        ],
        { timeout: 15000 },
        (err, stdout) => {
          if (err) {
            return reject(new Error(`Failed to copy backup from phone: ${err.message}`));
          }
          if (fs.existsSync(destPath)) {
            resolve({ localPath: destPath });
          } else {
            reject(new Error('Backup file copy completed but file was not found on desktop'));
          }
        }
      );
    });
  }

  async pullBook(searchName, format = 'fb2', destDir = null) {
    const targetDir = destDir || path.join(__dirname, '..', 'data', 'books');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      execFile(
        'powershell',
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          this.pullBookScript,
          '-SearchName',
          searchName,
          '-DestDir',
          targetDir
        ],
        { timeout: 20000 },
        (err, stdout) => {
          if (err || !stdout) {
            return reject(new Error(`Book "${searchName}" not found on phone storage`));
          }
          const rawPath = stdout.trim().split(/\r?\n/).pop().trim();
          if (fs.existsSync(rawPath)) {
            // If copied without extension, append format
            if (!path.extname(rawPath)) {
              const cleanExt = (format || 'fb2').replace(/^\./, '');
              const newPath = `${rawPath}.${cleanExt}`;
              try {
                if (!fs.existsSync(newPath)) {
                  fs.copyFileSync(rawPath, newPath);
                }
                return resolve({ filePath: newPath });
              } catch (_) {}
            }
            resolve({ filePath: rawPath });
          } else {
            reject(new Error(`Copied book file not found at: ${rawPath}`));
          }
        }
      );
    });
  }
}

module.exports = { MtpBridge };
