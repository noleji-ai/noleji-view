import { INITIAL_FOLDERS } from '../data/initialWorkspace';
import { SAMPLE_CONTENTS } from '../data/sampleContents';
import type { DocwiseUser } from '../types/auth';
import type { FileItem, WorkspaceState } from '../types/workspace';
import { updateStoredUserSyncTimestamp } from './accountStore';
import { getSupabaseBrowserClient } from '../lib/supabase';

const WORKSPACE_KEY = 'noleji-view-workspace-v1';
const LEGACY_WORKSPACE_KEY = 'docwise-workspace-v1';
const CLOUD_KEY_PREFIX = 'noleji-view-cloud-workspace-v1:';
const LEGACY_CLOUD_KEY_PREFIX = 'docwise-cloud-workspace-v1:';

function cloneFile(file: FileItem): FileItem {
  return { ...file };
}

function cloneFolders<T extends { files: FileItem[]; subfolders?: T[] }>(folders: T[]): T[] {
  return folders.map((folder) => ({
    ...folder,
    files: folder.files.map(cloneFile),
    subfolders: folder.subfolders ? cloneFolders(folder.subfolders) : undefined,
  }));
}

function currentTimestamp(): string {
  return new Date().toISOString();
}

export function createSeedWorkspace(): WorkspaceState {
  const documents = { ...SAMPLE_CONTENTS };
  return {
    version: 1,
    folders: cloneFolders(INITIAL_FOLDERS),
    documents,
    selectedFolderId: INITIAL_FOLDERS[0].id,
    selectedFileId: INITIAL_FOLDERS[0].files[0].id,
    recentFileIds: [INITIAL_FOLDERS[0].files[0].id],
    lastSessionAt: currentTimestamp(),
    cloudSync: {
      status: 'local-only',
      lastSyncedAt: null,
      lastError: null,
    },
  };
}

function parseWorkspace(raw: string | null): WorkspaceState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WorkspaceState;
    if (parsed.version !== 1 || !Array.isArray(parsed.folders) || !parsed.documents) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getCloudKey(userId: string): string {
  return `${CLOUD_KEY_PREFIX}${userId}`;
}

function getLegacyCloudKey(userId: string): string {
  return `${LEGACY_CLOUD_KEY_PREFIX}${userId}`;
}

function mergeDocuments(localDocs: Record<string, string>, cloudDocs: Record<string, string>): Record<string, string> {
  return {
    ...cloudDocs,
    ...localDocs,
  };
}

export function hydrateSampleContents(documents: Record<string, string>): void {
  Object.entries(documents).forEach(([fileId, value]) => {
    SAMPLE_CONTENTS[fileId] = value;
  });
}

async function loadSupabaseWorkspace(userId: string): Promise<WorkspaceState | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('workspace_snapshots')
    .select('workspace_state, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.workspace_state) {
    return null;
  }

  const parsed = data.workspace_state as WorkspaceState;
  if (parsed.version !== 1 || !Array.isArray(parsed.folders) || !parsed.documents) {
    return null;
  }

  return {
    ...parsed,
    cloudSync: {
      status: 'synced',
      lastSyncedAt: data.updated_at ?? parsed.cloudSync.lastSyncedAt,
      lastError: null,
    },
  };
}

export async function loadWorkspaceState(user: DocwiseUser | null): Promise<WorkspaceState> {
  const localWorkspace = parseWorkspace(localStorage.getItem(WORKSPACE_KEY) ?? localStorage.getItem(LEGACY_WORKSPACE_KEY)) ?? createSeedWorkspace();
  if (!user?.entitlements.cloudSync) {
    hydrateSampleContents(localWorkspace.documents);
    return localWorkspace;
  }

  const cloudWorkspace = await loadSupabaseWorkspace(user.uid)
    ?? parseWorkspace(localStorage.getItem(getCloudKey(user.uid)) ?? localStorage.getItem(getLegacyCloudKey(user.uid)));

  if (!cloudWorkspace) {
    hydrateSampleContents(localWorkspace.documents);
    return localWorkspace;
  }

  const localIsNewer = new Date(localWorkspace.lastSessionAt).getTime() >= new Date(cloudWorkspace.lastSessionAt).getTime();
  const merged: WorkspaceState = localIsNewer
    ? {
        ...localWorkspace,
        documents: mergeDocuments(localWorkspace.documents, cloudWorkspace.documents),
        cloudSync: {
          status: 'sync-pending',
          lastSyncedAt: cloudWorkspace.cloudSync.lastSyncedAt,
          lastError: null,
        },
      }
    : {
        ...cloudWorkspace,
        documents: mergeDocuments(cloudWorkspace.documents, localWorkspace.documents),
        cloudSync: {
          status: 'synced',
          lastSyncedAt: cloudWorkspace.cloudSync.lastSyncedAt,
          lastError: null,
        },
      };

  hydrateSampleContents(merged.documents);
  return merged;
}

export function buildWorkspaceSnapshot(params: {
  folders: WorkspaceState['folders'];
  selectedFolderId: string;
  selectedFileId: string;
  cloudSync: WorkspaceState['cloudSync'];
}): WorkspaceState {
  const documents: Record<string, string> = {};

  const collectFiles = (files: FileItem[]): void => {
    files.forEach((file) => {
      documents[file.id] = SAMPLE_CONTENTS[file.id] ?? file.content ?? '';
    });
  };

  params.folders.forEach((folder) => {
    collectFiles(folder.files);
    folder.subfolders?.forEach((subfolder) => collectFiles(subfolder.files));
  });

  return {
    version: 1,
    folders: cloneFolders(params.folders),
    documents,
    selectedFolderId: params.selectedFolderId,
    selectedFileId: params.selectedFileId,
    recentFileIds: [params.selectedFileId],
    lastSessionAt: currentTimestamp(),
    cloudSync: params.cloudSync,
  };
}

export function saveWorkspaceState(workspace: WorkspaceState): void {
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
}

export async function syncWorkspaceToCloud(workspace: WorkspaceState, user: DocwiseUser | null): Promise<WorkspaceState['cloudSync']> {
  if (!user?.entitlements.cloudSync) {
    return {
      status: 'local-only',
      lastSyncedAt: null,
      lastError: null,
    };
  }

  const syncedAt = currentTimestamp();
  const cloudWorkspace: WorkspaceState = {
    ...workspace,
    cloudSync: {
      status: 'synced',
      lastSyncedAt: syncedAt,
      lastError: null,
    },
    lastSessionAt: syncedAt,
  };

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase
      .from('workspace_snapshots')
      .upsert({
        user_id: user.uid,
        workspace_state: cloudWorkspace,
        updated_at: syncedAt,
      }, { onConflict: 'user_id' });

    if (error) {
      throw error;
    }
  }

  localStorage.setItem(getCloudKey(user.uid), JSON.stringify(cloudWorkspace));
  updateStoredUserSyncTimestamp(syncedAt);
  return cloudWorkspace.cloudSync;
}
