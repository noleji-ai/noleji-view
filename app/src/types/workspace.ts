export type WorkspaceFileType = 'md' | 'html';

export interface FileItem {
  id: string;
  name: string;
  type: WorkspaceFileType;
  date: string;
  content?: string;
  sourcePath?: string;
  origin?: 'sample' | 'local' | 'cloud' | 'external' | 'generated';
  cloudDocumentId?: string | null;
}

export interface FolderItem {
  id: string;
  name: string;
  files: FileItem[];
  subfolders?: FolderItem[];
  isKnowledgeFolder?: boolean;
}

export type WorkspaceSyncStatus = 'local-only' | 'sync-pending' | 'syncing' | 'synced';

export interface WorkspaceSyncState {
  status: WorkspaceSyncStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface WorkspaceState {
  version: 1;
  folders: FolderItem[];
  documents: Record<string, string>;
  selectedFolderId: string;
  selectedFileId: string;
  recentFileIds: string[];
  lastSessionAt: string;
  cloudSync: WorkspaceSyncState;
}
