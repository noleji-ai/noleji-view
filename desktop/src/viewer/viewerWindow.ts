import { BrowserWindow } from 'electron';
import * as path from 'path';

const viewerWindows = new Map<string, BrowserWindow>();

export function createViewerWindow(
  filePath: string,
  appDistPath: string,
  preloadPath: string,
): BrowserWindow {
  // Reuse existing window for the same file
  const existing = viewerWindows.get(filePath);
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return existing;
  }

  const fileName = path.basename(filePath);

  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 400,
    minHeight: 300,
    title: `${fileName} — docwise Viewer`,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const encodedPath = encodeURIComponent(filePath);
  win.loadFile(path.join(appDistPath, 'index.html'), {
    hash: `/viewer?file=${encodedPath}`,
  });

  viewerWindows.set(filePath, win);
  win.on('closed', () => {
    viewerWindows.delete(filePath);
  });

  return win;
}
