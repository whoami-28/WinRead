const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class AdbBridge {
  constructor(customAdbPath = null) {
    this.adbPath = customAdbPath || this.findAdb();
  }

  findAdb() {
    // 1. Check common Android SDK path on Windows
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const defaultSdkAdb = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
      if (fs.existsSync(defaultSdkAdb)) {
        return defaultSdkAdb;
      }
    }

    // 2. Default to 'adb' from PATH
    return 'adb';
  }

  setAdbPath(newPath) {
    if (fs.existsSync(newPath)) {
      this.adbPath = newPath;
      return true;
    }
    return false;
  }

  async checkAdbAvailable() {
    return new Promise((resolve) => {
      exec(`"${this.adbPath}" version`, { timeout: 3000 }, (err, stdout) => {
        if (err) {
          resolve({ available: false, version: null });
        } else {
          const match = stdout.match(/version\s+([\d.]+)/i);
          resolve({
            available: true,
            version: match ? match[1] : 'unknown',
            path: this.adbPath
          });
        }
      });
    });
  }

  async getConnectedDevices() {
    return new Promise((resolve) => {
      exec(`"${this.adbPath}" devices -l`, { timeout: 4000 }, (err, stdout) => {
        if (err) {
          resolve([]);
          return;
        }

        const lines = stdout.split(/\r?\n/);
        const devices = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('List of devices')) continue;

          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            const serial = parts[0];
            const state = parts[1];

            let model = 'Android Device';
            const modelMatch = trimmed.match(/model:(\S+)/);
            if (modelMatch) model = modelMatch[1];

            devices.push({
              serial,
              state,
              model: model.replace(/_/g, ' '),
              raw: trimmed
            });
          }
        }

        resolve(devices);
      });
    });
  }

  async setupPortForwarding(port = 8765, serial = null) {
    const serialArg = serial ? `-s "${serial}"` : '';
    return new Promise((resolve) => {
      exec(`"${this.adbPath}" ${serialArg} reverse tcp:${port} tcp:${port}`, (revErr) => {
        // Also run forward
        exec(`"${this.adbPath}" ${serialArg} forward tcp:${port} tcp:${port}`, (fwdErr) => {
          resolve({
            success: !fwdErr || !revErr,
            reverseOk: !revErr,
            forwardOk: !fwdErr,
            port
          });
        });
      });
    });
  }

  async scanReadEraBackups(serial = null) {
    const serialArg = serial ? `-s "${serial}"` : '';
    const searchDirs = ['/sdcard/ReadEra', '/sdcard/Download/ReadEra', '/sdcard/Download'];

    const foundBackups = [];

    for (const dir of searchDirs) {
      const cmd = `"${this.adbPath}" ${serialArg} shell "ls -la ${dir} 2>/dev/null"`;
      const files = await new Promise((res) => {
        exec(cmd, { timeout: 4000 }, (err, stdout) => {
          if (err || !stdout) return res([]);
          const lines = stdout.split(/\r?\n/);
          const results = [];
          for (const l of lines) {
            if (l.toLowerCase().includes('.backup') || l.toLowerCase().includes('readera') || l.toLowerCase().includes('.zip')) {
              const parts = l.trim().split(/\s+/);
              const fileName = parts[parts.length - 1];
              if (fileName && fileName.length > 2) {
                results.push(`${dir}/${fileName}`);
              }
            }
          }
          res(results);
        });
      });

      foundBackups.push(...files);
    }

    return foundBackups;
  }

  async pullBackup(remotePath, localDestPath, serial = null) {
    const serialArg = serial ? `-s "${serial}"` : '';
    return new Promise((resolve, reject) => {
      exec(`"${this.adbPath}" ${serialArg} pull "${remotePath}" "${localDestPath}"`, (err, stdout) => {
        if (err) reject(err);
        else resolve({ localPath: localDestPath, stdout });
      });
    });
  }
}

module.exports = { AdbBridge };
