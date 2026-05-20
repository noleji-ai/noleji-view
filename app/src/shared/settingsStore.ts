import type { ViewerSettings } from './viewerSettings';
import { DEFAULT_VIEWER_SETTINGS } from './viewerSettings';

const STORAGE_KEY = 'noleji-view-viewer-settings';
const LEGACY_STORAGE_KEY = 'docwise-viewer-settings';

export async function loadViewerSettings(): Promise<ViewerSettings> {
  // Electron API takes priority
  if (window.electronAPI?.getViewerSettings) {
    try {
      const settings = await window.electronAPI.getViewerSettings();
      return settings;
    } catch {
      // fall through to localStorage
    }
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ViewerSettings;
    }
  } catch {
    // ignore parse errors
  }

  return { ...DEFAULT_VIEWER_SETTINGS };
}

export async function saveViewerSettings(settings: ViewerSettings): Promise<void> {
  // Electron API takes priority
  if (window.electronAPI?.setViewerSettings) {
    try {
      await window.electronAPI.setViewerSettings(settings);
      return;
    } catch {
      // fall through to localStorage
    }
  }

  // Fallback to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}
