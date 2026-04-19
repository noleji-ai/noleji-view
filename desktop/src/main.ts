import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { registerSettingsHandlers } from './ipc/settings';
import { registerFileHandlers } from './ipc/fileOpen';
import { createViewerWindow } from './viewer/viewerWindow';
import { showFileAssociationPrompt } from './utils/fileAssociation';

let mainWindow: BrowserWindow | null = null;
let pendingFilePath: string | null = null;
let pendingEditorFilePath: string | null = null;
const pendingEditorAckTargets = new Map<string, Electron.WebContents>();

// Path to the Vite-built app
function getAppDistPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app-dist');
  }
  return path.join(__dirname, '..', '..', 'app', 'dist');
}

function getPreloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const distPath = getAppDistPath();
  mainWindow.loadFile(path.join(distPath, 'index.html'), { hash: '/app' });

  mainWindow.webContents.on('did-finish-load', () => {
    if (!pendingEditorFilePath || !mainWindow || mainWindow.isDestroyed()) return;
    const nextFilePath = pendingEditorFilePath;
    pendingEditorFilePath = null;
    mainWindow.focus();
    mainWindow.webContents.send('editor:open-file', nextFilePath);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function openFileInEditor(filePath: string): void {
  pendingEditorFilePath = filePath;

  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
    return;
  }

  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();

  if (mainWindow.webContents.isLoadingMainFrame()) return;

  const nextFilePath = pendingEditorFilePath;
  pendingEditorFilePath = null;
  if (nextFilePath) {
    mainWindow.webContents.send('editor:open-file', nextFilePath);
  }
}

// macOS: file opened via double-click or "Open With"
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (app.isReady()) {
    createViewerWindow(filePath, getAppDistPath(), getPreloadPath());
  } else {
    pendingFilePath = filePath;
  }
});

// Single instance lock (for main window only)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    // On second instance, focus main window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // Check if a file path was passed as argument
    const filePath = argv.find(arg => arg.endsWith('.md') || arg.endsWith('.html') || arg.endsWith('.htm'));
    if (filePath) {
      createViewerWindow(filePath, getAppDistPath(), getPreloadPath());
    }
  });
}

app.whenReady().then(async () => {
  // Register IPC handlers
  registerSettingsHandlers();
  registerFileHandlers();

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: '파일',
      submenu: [
        { role: 'close' },
      ],
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '보기',
      submenu: [
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: '윈도우',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  ipcMain.on('viewer:open-in-editor', (event, filePath: string) => {
    pendingEditorAckTargets.set(filePath, event.sender);
    openFileInEditor(filePath);
  });

  ipcMain.on('editor:open-file-ready', (_event, filePath: string) => {
    const target = pendingEditorAckTargets.get(filePath);
    if (target && !target.isDestroyed()) {
      target.send('viewer:editor-opened', filePath);
    }
    pendingEditorAckTargets.delete(filePath);
  });

  ipcMain.on('viewer:open-preview', (_event, content: string, fileName: string) => {
    const tmpDir = path.join(os.tmpdir(), 'docwise-preview');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, fileName.replace(/\.md$/, '.html'));
    fs.writeFileSync(tmpFile, content, 'utf-8');
    createViewerWindow(tmpFile, getAppDistPath(), getPreloadPath());
  });

  // Create main window
  createMainWindow();

  // Handle pending file from open-file event
  if (pendingFilePath) {
    createViewerWindow(pendingFilePath, getAppDistPath(), getPreloadPath());
    pendingFilePath = null;
  }

  // First-launch file association prompt
  await showFileAssociationPrompt(mainWindow!);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createMainWindow();
});
