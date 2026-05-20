import { getSupabaseBrowserClient } from '../lib/supabase';

export interface SharedDocumentRecord {
  id: string;
  title: string;
  html: string;
  ownerId: string | null;
  createdAt: string;
  visibility: 'local' | 'link';
}

const SHARED_KEY = 'noleji-view-shared-records-v1';
const LEGACY_SHARED_KEY = 'docwise-shared-records-v1';

function loadAll(): Record<string, SharedDocumentRecord> {
  try {
    const raw = localStorage.getItem(SHARED_KEY) ?? localStorage.getItem(LEGACY_SHARED_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SharedDocumentRecord>;
  } catch {
    return {};
  }
}

function saveAll(records: Record<string, SharedDocumentRecord>): void {
  localStorage.setItem(SHARED_KEY, JSON.stringify(records));
}

function saveLocalRecord(record: SharedDocumentRecord): SharedDocumentRecord {
  const next = loadAll();
  next[record.id] = record;
  saveAll(next);
  return record;
}

export async function createSharedDocument(params: {
  title: string;
  html: string;
  ownerId: string | null;
  visibility: 'local' | 'link';
}): Promise<SharedDocumentRecord> {
  const supabase = getSupabaseBrowserClient();

  if (supabase && params.ownerId && params.visibility === 'link') {
    const { data, error } = await supabase
      .from('shared_links')
      .insert({
        owner_id: params.ownerId,
        title: params.title,
        rendered_html: params.html,
        visibility: params.visibility,
      })
      .select('id, owner_id, title, rendered_html, visibility, created_at')
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      html: data.rendered_html,
      ownerId: data.owner_id,
      createdAt: data.created_at,
      visibility: data.visibility,
    };
  }

  const record: SharedDocumentRecord = {
    id: Math.random().toString(36).slice(2, 10),
    title: params.title,
    html: params.html,
    ownerId: params.ownerId,
    createdAt: new Date().toISOString(),
    visibility: params.visibility,
  };

  return saveLocalRecord(record);
}

export async function loadSharedDocument(id: string): Promise<SharedDocumentRecord | null> {
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('shared_links')
      .select('id, owner_id, title, rendered_html, visibility, created_at')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        html: data.rendered_html,
        ownerId: data.owner_id,
        createdAt: data.created_at,
        visibility: data.visibility,
      };
    }
  }

  return loadAll()[id] ?? null;
}
