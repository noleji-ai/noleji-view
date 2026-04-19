import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true as const,

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('file:read', filePath),

  writeFile: (filePath: string, content: string): Promise<string> =>
    ipcRenderer.invoke('file:write', filePath, content),

  getViewerSettings: (): Promise<unknown> =>
    ipcRenderer.invoke('settings:get'),

  setViewerSettings: (settings: unknown): Promise<void> =>
    ipcRenderer.invoke('settings:set', settings),

  onSettingsChanged: (callback: (settings: unknown) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, settings: unknown) => callback(settings);
    ipcRenderer.on('settings:changed', handler);
    return () => { ipcRenderer.removeListener('settings:changed', handler); };
  },

  onOpenInEditor: (callback: (filePath: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath);
    ipcRenderer.on('editor:open-file', handler);
    return () => { ipcRenderer.removeListener('editor:open-file', handler); };
  },

  notifyEditorFileReady: (filePath: string): void => {
    ipcRenderer.send('editor:open-file-ready', filePath);
  },

  onEditorOpened: (callback: (filePath: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath);
    ipcRenderer.on('viewer:editor-opened', handler);
    return () => { ipcRenderer.removeListener('viewer:editor-opened', handler); };
  },

  openInEditor: (filePath: string): void => {
    ipcRenderer.send('viewer:open-in-editor', filePath);
  },

  saveFile: (fileName: string, content: string): Promise<string | null> =>
    ipcRenderer.invoke('file:save', fileName, content),

  openViewer: (content: string, fileName: string): void =>
    ipcRenderer.send('viewer:open-preview', content, fileName),
});
