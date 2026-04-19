interface ElectronAPI {
  isElectron: true;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<string>;
  getViewerSettings(): Promise<import('../shared/viewerSettings').ViewerSettings>;
  setViewerSettings(settings: import('../shared/viewerSettings').ViewerSettings): Promise<void>;
  onSettingsChanged(callback: (settings: import('../shared/viewerSettings').ViewerSettings) => void): () => void;
  onOpenInEditor(callback: (filePath: string) => void): () => void;
  notifyEditorFileReady(filePath: string): void;
  onEditorOpened(callback: (filePath: string) => void): () => void;
  openInEditor(filePath: string): void;
  saveFile(fileName: string, content: string): Promise<string | null>;
  openViewer(content: string, fileName: string): void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
