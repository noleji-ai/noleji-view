import { ipcMain, BrowserWindow } from 'electron';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const SETTINGS_FILE = 'viewer-settings.json';

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

const DEFAULT_SETTINGS = {
  templateId: 'asome',
  fontSize: 18,
  lineHeight: 1.8,
  padding: 60,
  docWidth: '800px',
  isDark: false,
};

function readSettings(): unknown {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(settings: unknown): void {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => {
    return readSettings();
  });

  ipcMain.handle('settings:set', (_event, settings: unknown) => {
    writeSettings(settings);
    // Broadcast to ALL windows
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('settings:changed', settings);
    }
  });
}
