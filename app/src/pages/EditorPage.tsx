import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FolderOpen, Folder, Settings, ChevronRight, Printer,
  Layout, BookOpen, X, FileCode, Code2, Download, FileDown,
  Sliders, Sun, Moon, Move, Check, AlertCircle, ExternalLink,
  PanelLeftClose, PanelLeftOpen, Trash2, Pencil, Import, Brain, Sparkles, Save,
  FolderPlus, FilePlus, Palette, Eye, Search, Info
} from 'lucide-react';
import { useMarkdownParser } from '../hooks/useMarkdownParser';
import MarkdownToolbar from '../components/MarkdownToolbar';
import { SAMPLE_CONTENTS } from '../data/sampleContents';
import { DESIGN_TEMPLATES } from '../data/designTemplates';
import { EXTERNAL_FILES_FOLDER_ID, INITIAL_FOLDERS } from '../data/initialWorkspace';
import ContextMenu from '../components/ContextMenu';
import InlineEdit from '../components/InlineEdit';
import SettingsModal from '../components/SettingsModal';
import { useAuth } from '../hooks/useAuth';
import { getAppBasePath, getAppUrl } from '../config/env';
import type { LLMConfig } from '../types/llm';
import { loadLLMConfig, saveLLMConfig, testConnection } from '../services/llmClient';
import { ingestFolder } from '../services/wiki';
import type { WikiPage } from '../services/wiki';
import { buildFullPage } from '../services/wiki/utils/frontmatter';
import { canUsePremiumAction, trackPremiumAction } from '../utils/featureGate';
import UsageBadge from '../components/UsageBadge';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getLocalIP } from '../utils/networkUtils';
import { createSharedDocument } from '../services/shareStore';
import { buildWorkspaceSnapshot, hydrateSampleContents, loadWorkspaceState, saveWorkspaceState, syncWorkspaceToCloud } from '../services/workspaceStore';
import type { FileItem, FolderItem, WorkspaceSyncState } from '../types/workspace';
import type { ViewerSettings } from '../shared/viewerSettings';
import { DEFAULT_VIEWER_SETTINGS } from '../shared/viewerSettings';
import { loadViewerSettings, saveViewerSettings } from '../shared/settingsStore';

/**
 * Noleji View Desktop v1.0
 * 1. Obsidian-style Markdown Editing Toolbar
 * 2. Rich h3-h6, hr, blockquote, code, list styling
 * 3. Folder Tree Sidebar + File List
 * 4. Enhanced PDF Print + Publish Shareable Link
 */

interface ExternalFileState {
  savedContent: string;
  lastSavedAt: number | null;
}

interface WorkspaceFileSearchResult {
  folderId: string;
  folderName: string;
  file: FileItem;
  snippet: string;
}

interface KnowledgeOutputItem {
  key: 'index' | 'overview' | 'entities' | 'concepts' | 'log';
  label: string;
  fileName: string;
  fileId: string | null;
  description: string;
  countLabel: string;
}

interface KnowledgeFolderSummary {
  folderId: string;
  parentFolderId: string;
  parentFolderName: string;
  totalFiles: number;
  generatedAt: string | null;
  sourceCount: number;
  outputs: KnowledgeOutputItem[];
}

const A4_HEIGHT_PX = 1122;
const BRAND_NAME = 'Noleji View';
const DOC_WIDTH_OPTIONS = ['640px', '800px', '1000px', '1200px', '100%'];

function collectWorkspaceSearchResults(
  folders: FolderItem[],
  query: string,
): WorkspaceFileSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const results: WorkspaceFileSearchResult[] = [];
  const visitFolder = (folder: FolderItem) => {
    for (const file of folder.files) {
      const documentText = SAMPLE_CONTENTS[file.id] ?? '';
      const searchable = `${folder.name}\n${file.name}\n${documentText}`.toLowerCase();
      if (!searchable.includes(normalizedQuery)) continue;

      const contentIndex = documentText.toLowerCase().indexOf(normalizedQuery);
      const snippetStart = contentIndex >= 0 ? Math.max(0, contentIndex - 32) : 0;
      const rawSnippet = contentIndex >= 0
        ? documentText.slice(snippetStart, contentIndex + normalizedQuery.length + 56)
        : file.name;

      results.push({
        folderId: folder.id,
        folderName: folder.name,
        file,
        snippet: rawSnippet.replace(/\s+/g, ' ').trim(),
      });
    }

    for (const subfolder of folder.subfolders ?? []) {
      visitFolder(subfolder);
    }
  };

  folders.forEach(visitFolder);
  return results;
}

function summarizeKnowledgeFolder(parentFolder: FolderItem): KnowledgeFolderSummary | null {
  const knowledgeFolder = parentFolder.subfolders?.find((subfolder) => subfolder.isKnowledgeFolder);
  if (!knowledgeFolder) return null;

  const getFileByName = (name: string) => knowledgeFolder.files.find((file) => file.name === name) ?? null;
  const entityDigest = getFileByName('_entities.md');
  const conceptDigest = getFileByName('_concepts.md');
  const sourceCount = (() => {
    const overviewFileId = getFileByName('_overview.md')?.id;
    if (!overviewFileId) return 0;
    const overviewText = SAMPLE_CONTENTS[overviewFileId] ?? '';
    return (overviewText.match(/^###\s+/gm) ?? []).length;
  })();

  return {
    folderId: knowledgeFolder.id,
    parentFolderId: parentFolder.id,
    parentFolderName: parentFolder.name,
    totalFiles: knowledgeFolder.files.length,
    generatedAt: knowledgeFolder.files[0]?.date ?? null,
    sourceCount,
    outputs: [
      {
        key: 'index',
        label: '인덱스',
        fileName: 'index.md',
        fileId: getFileByName('index.md')?.id ?? null,
        description: '전체 구조와 문서 이동 출발점',
        countLabel: '허브',
      },
      {
        key: 'overview',
        label: '종합 개요',
        fileName: '_overview.md',
        fileId: getFileByName('_overview.md')?.id ?? null,
        description: '핵심 요약과 원본 문서별 요약 정리',
        countLabel: `${sourceCount}개 요약`,
      },
      {
        key: 'entities',
        label: '엔티티 묶음',
        fileName: '_entities.md',
        fileId: entityDigest?.id ?? null,
        description: '인물, 도구, 서비스, 조직 등 핵심 객체 정리',
        countLabel: (() => {
          const text = entityDigest ? (SAMPLE_CONTENTS[entityDigest.id] ?? '') : '';
          const count = (text.match(/^##\s+/gm) ?? []).length;
          return `${Math.max(0, count)}개 항목`;
        })(),
      },
      {
        key: 'concepts',
        label: '개념 묶음',
        fileName: '_concepts.md',
        fileId: conceptDigest?.id ?? null,
        description: '핵심 개념, 정의, 관련 연결을 한 문서로 정리',
        countLabel: (() => {
          const text = conceptDigest ? (SAMPLE_CONTENTS[conceptDigest.id] ?? '') : '';
          const count = (text.match(/^##\s+/gm) ?? []).length;
          return `${Math.max(0, count)}개 항목`;
        })(),
      },
      {
        key: 'log',
        label: '처리 로그',
        fileName: 'log.md',
        fileId: getFileByName('log.md')?.id ?? null,
        description: '생성 규칙, 처리 시간, 결과 메모 확인',
        countLabel: '기록',
      },
    ],
  };
}

const DEFAULT_MD_CONTENT = SAMPLE_CONTENTS['f1'] || '';

/* ── Toast 컴포넌트 ── */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-bottom duration-300 max-w-md ${
      type === 'success' ? 'bg-[#10B981] text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      <span className="truncate">{message}</span>
    </div>
  );
}

/* ══════════════════════════════════ */
/*            메인 앱               */
/* ══════════════════════════════════ */
const EditorPage: React.FC = () => {
  const [content, setContent] = useState(DEFAULT_MD_CONTENT);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth
  const { authState, signIn, signInWithEmail, signOut } = useAuth();

  // 폴더/파일 상태
  const [folders, setFolders] = useState<FolderItem[]>(INITIAL_FOLDERS);
  const [_expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['personal']));
  const [selectedFolderId, setSelectedFolderId] = useState('personal');
  const [selectedFileId, setSelectedFileId] = useState('f1');

  // UI 상태
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [renderMode, setRenderMode] = useState<'md' | 'html'>('md');
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

  // 새 기능 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shareMode, setShareMode] = useState<'internal' | 'external'>('external');
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(() => loadLLMConfig());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'folder' | 'file'; targetId: string } | null>(null);
  const [moveTargetModal, setMoveTargetModal] = useState<{ fileId: string; fileName: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = useState(false);
  const [knowledgeProgress, setKnowledgeProgress] = useState('');
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const [documentFindQuery, setDocumentFindQuery] = useState('');
  const [documentReplaceQuery, setDocumentReplaceQuery] = useState('');
  const [documentFindIndex, setDocumentFindIndex] = useState(0);

  // View Settings
  const [selectedStyle, setSelectedStyle] = useState(() => DESIGN_TEMPLATES.find((template) => template.id === DEFAULT_VIEWER_SETTINGS.templateId) ?? DESIGN_TEMPLATES[5]);
  const [fontSize, setFontSize] = useState(DEFAULT_VIEWER_SETTINGS.fontSize);
  const [lineHeight, setLineHeight] = useState(DEFAULT_VIEWER_SETTINGS.lineHeight);
  const [docWidth, setDocWidth] = useState(DEFAULT_VIEWER_SETTINGS.docWidth);
  const [docPadding, setDocPadding] = useState(DEFAULT_VIEWER_SETTINGS.padding);
  const [isDarkPreview, setIsDarkPreview] = useState(DEFAULT_VIEWER_SETTINGS.isDark);
  const [showPageGuides, setShowPageGuides] = useState(false);

  // Split pane
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const splitContainerRef = useRef<HTMLElement>(null);

  // Toast / Upload
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [externalFileStates, setExternalFileStates] = useState<Record<string, ExternalFileState>>({});
  const [workspaceSyncState, setWorkspaceSyncState] = useState<WorkspaceSyncState>({
    status: 'local-only',
    lastSyncedAt: null,
    lastError: null,
  });
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);

  // unified 파이프라인 파서
  const { setMarkdown, result, isParsing } = useMarkdownParser(250);
  const authWorkspaceKey = authState.status === 'authenticated' ? authState.user.uid : 'guest';

  // 현재 선택된 폴더/파일
  const currentFolder = useMemo(() => {
    for (const f of folders) {
      if (f.id === selectedFolderId) return f;
      const sub = f.subfolders?.find(sf => sf.id === selectedFolderId);
      if (sub) return sub;
    }
    return folders[0];
  }, [folders, selectedFolderId]);
  const currentFile = useMemo(() => {
    for (const folder of folders) {
      const file = folder.files.find(f => f.id === selectedFileId);
      if (file) return file;
      for (const sub of folder.subfolders || []) {
        const subFile = sub.files.find(f => f.id === selectedFileId);
        if (subFile) return subFile;
      }
    }
    return folders[0].files[0];
  }, [folders, selectedFileId]);
  const isExternalFile = !!currentFile?.sourcePath;
  const currentExternalFileState = isExternalFile ? externalFileStates[currentFile.id] : undefined;
  const isExternalDirty = isExternalFile
    ? content !== (currentExternalFileState?.savedContent ?? SAMPLE_CONTENTS[currentFile.id] ?? '')
    : false;
  const externalSaveStatusLabel = isExternalFile
    ? isExternalDirty
      ? '저장 필요'
      : currentExternalFileState?.lastSavedAt
        ? '저장 완료'
        : '원본과 동일'
    : null;
  const externalSaveStatusTone = isExternalFile
    ? isExternalDirty
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-[#10B981]/20 bg-[#ECFDF5] text-[#059669]'
    : '';
  const externalSaveStatusMessage = isExternalFile
    ? isExternalDirty
      ? '아직 원본 파일에 반영되지 않은 변경사항이 있습니다.'
      : currentExternalFileState?.lastSavedAt
        ? `방금 저장됨 · ${new Date(currentExternalFileState.lastSavedAt).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : '현재 에디터 내용이 원본 파일과 같습니다.'
    : null;
  const workspaceStatusLabel = authState.status === 'authenticated'
    ? workspaceSyncState.status === 'synced'
      ? '클라우드 동기화 완료'
      : workspaceSyncState.status === 'syncing'
        ? '클라우드 동기화 중'
        : '클라우드 동기화 대기'
    : '로컬 자동저장';
  const workspaceStatusTone = authState.status === 'authenticated'
    ? workspaceSyncState.status === 'synced'
      ? 'border-[#10B981]/20 bg-[#ECFDF5] text-[#059669]'
      : 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-[#E2E8F0] bg-[#F7FAFC] text-[#1A202C]/55';
  const workspaceSearchResults = useMemo(
    () => collectWorkspaceSearchResults(folders, workspaceSearchQuery),
    [folders, workspaceSearchQuery, content],
  );
  const activeKnowledgeSummary = useMemo(() => {
    const directParent = folders.find((folder) => folder.id === selectedFolderId);
    if (directParent) return summarizeKnowledgeFolder(directParent);

    const parentFolder = folders.find((folder) => folder.subfolders?.some((subfolder) => subfolder.id === selectedFolderId));
    return parentFolder ? summarizeKnowledgeFolder(parentFolder) : null;
  }, [folders, selectedFolderId]);
  const documentFindMatches = useMemo(() => {
    const query = documentFindQuery.trim().toLowerCase();
    if (!query) return [] as number[];
    const source = content.toLowerCase();
    const matches: number[] = [];
    let index = source.indexOf(query);
    while (index !== -1) {
      matches.push(index);
      index = source.indexOf(query, index + Math.max(1, query.length));
    }
    return matches;
  }, [content, documentFindQuery]);

  const applyViewerSettings = useCallback((settings: ViewerSettings) => {
    const nextTemplate = DESIGN_TEMPLATES.find((template) => template.id === settings.templateId) ?? DESIGN_TEMPLATES[5];
    setSelectedStyle(nextTemplate);
    setFontSize(settings.fontSize);
    setLineHeight(settings.lineHeight);
    setDocWidth(settings.docWidth);
    setDocPadding(settings.padding);
    setIsDarkPreview(settings.isDark);
  }, []);

  const currentViewerSettings = useMemo<ViewerSettings>(() => ({
    templateId: selectedStyle.id,
    fontSize,
    lineHeight,
    padding: docPadding,
    docWidth: docWidth as ViewerSettings['docWidth'],
    isDark: isDarkPreview,
  }), [selectedStyle.id, fontSize, lineHeight, docPadding, docWidth, isDarkPreview]);

  const persistViewerSettings = useCallback((patch: Partial<ViewerSettings>) => {
    const nextSettings: ViewerSettings = {
      ...currentViewerSettings,
      ...patch,
    };
    applyViewerSettings(nextSettings);
    void saveViewerSettings(nextSettings);
  }, [applyViewerSettings, currentViewerSettings]);

  const focusFindInput = useCallback(() => {
    const input = document.getElementById('noleji-document-find') as HTMLInputElement | null;
    if (!input) return;
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }, []);

  const updateEditorContent = useCallback((nextContent: string) => {
    SAMPLE_CONTENTS[selectedFileId] = nextContent;
    setContent(nextContent);
  }, [selectedFileId]);

  const handleSelectSearchResult = useCallback((result: WorkspaceFileSearchResult) => {
    setSelectedFolderId(result.folderId);
    setSelectedFileId(result.file.id);
    setWorkspaceSearchQuery('');
  }, []);

  const openKnowledgeFolder = useCallback((summary: KnowledgeFolderSummary | null) => {
    if (!summary) return;
    setSelectedFolderId(summary.folderId);
    const preferredFile = summary.outputs.find((output) => output.key === 'index')?.fileId ?? summary.outputs[0]?.fileId ?? null;
    if (preferredFile) {
      setSelectedFileId(preferredFile);
    }
  }, []);

  const openKnowledgeOutput = useCallback((summary: KnowledgeFolderSummary | null, fileId: string | null) => {
    if (!summary || !fileId) return;
    setSelectedFolderId(summary.folderId);
    setSelectedFileId(fileId);
  }, []);

  const focusDocumentMatch = useCallback((nextIndex: number) => {
    if (!textareaRef.current || documentFindMatches.length === 0) return;
    const safeIndex = ((nextIndex % documentFindMatches.length) + documentFindMatches.length) % documentFindMatches.length;
    const start = documentFindMatches[safeIndex];
    const end = start + documentFindQuery.trim().length;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(start, end);
    textareaRef.current.scrollTop = Math.max(0, textareaRef.current.scrollHeight * (start / Math.max(1, content.length)) - textareaRef.current.clientHeight / 2);
    setDocumentFindIndex(safeIndex);
    window.requestAnimationFrame(() => {
      focusFindInput();
    });
  }, [content.length, documentFindMatches, documentFindQuery, focusFindInput]);

  const handleDocumentFindNext = useCallback(() => {
    focusDocumentMatch(documentFindIndex + 1);
  }, [documentFindIndex, focusDocumentMatch]);

  const handleDocumentFindPrevious = useCallback(() => {
    focusDocumentMatch(documentFindIndex - 1);
  }, [documentFindIndex, focusDocumentMatch]);

  const handleDocumentReplace = useCallback((replaceAll = false) => {
    const query = documentFindQuery.trim();
    if (!query) return;

    if (replaceAll) {
      if (!content.includes(query)) return;
      const nextContent = content.split(query).join(documentReplaceQuery);
      updateEditorContent(nextContent);
      setToast({ message: '문서의 모든 일치 항목을 바꿨습니다.', type: 'success' });
      return;
    }

    if (documentFindMatches.length === 0) return;

    const safeIndex = Math.min(documentFindIndex, documentFindMatches.length - 1);
    const start = documentFindMatches[safeIndex];
    const end = start + query.length;
    const nextContent = `${content.slice(0, start)}${documentReplaceQuery}${content.slice(end)}`;
    updateEditorContent(nextContent);
    setToast({ message: '현재 일치 항목을 바꿨습니다.', type: 'success' });

    window.requestAnimationFrame(() => {
      focusFindInput();
    });
  }, [content, documentFindIndex, documentFindMatches, documentFindQuery, documentReplaceQuery, focusFindInput, updateEditorContent]);

  useEffect(() => {
    if (authState.status === 'loading') return;

    let cancelled = false;

    void loadWorkspaceState(authState.status === 'authenticated' ? authState.user : null).then((workspace) => {
      if (cancelled) return;
      hydrateSampleContents(workspace.documents);
      setFolders(workspace.folders);
      setSelectedFolderId(workspace.selectedFolderId);
      setSelectedFileId(workspace.selectedFileId);
      setContent(workspace.documents[workspace.selectedFileId] ?? DEFAULT_MD_CONTENT);
      setWorkspaceSyncState(workspace.cloudSync);
      setIsWorkspaceReady(true);
    }).catch(() => {
      if (cancelled) return;
      const fallbackDocuments = { ...SAMPLE_CONTENTS };
      setFolders(INITIAL_FOLDERS);
      setSelectedFolderId(INITIAL_FOLDERS[0].id);
      setSelectedFileId(INITIAL_FOLDERS[0].files[0].id);
      setContent(fallbackDocuments[INITIAL_FOLDERS[0].files[0].id] ?? DEFAULT_MD_CONTENT);
      setWorkspaceSyncState({ status: 'local-only', lastSyncedAt: null, lastError: '워크스페이스를 불러오지 못했습니다.' });
      setIsWorkspaceReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authState, authWorkspaceKey]);

  useEffect(() => {
    if (!isWorkspaceReady || authState.status === 'loading') return;

    const timeout = window.setTimeout(async () => {
      const provisionalSyncState: WorkspaceSyncState = authState.status === 'authenticated'
        ? {
            status: 'sync-pending',
            lastSyncedAt: workspaceSyncState.lastSyncedAt,
            lastError: null,
          }
        : {
            status: 'local-only',
            lastSyncedAt: null,
            lastError: null,
          };

      const snapshot = buildWorkspaceSnapshot({
        folders,
        selectedFolderId,
        selectedFileId,
        cloudSync: provisionalSyncState,
      });
      saveWorkspaceState(snapshot);

      if (authState.status === 'authenticated') {
        setWorkspaceSyncState({
          status: 'syncing',
          lastSyncedAt: provisionalSyncState.lastSyncedAt,
          lastError: null,
        });
        try {
          const synced = await syncWorkspaceToCloud(snapshot, authState.user);
          saveWorkspaceState({ ...snapshot, cloudSync: synced });
          setWorkspaceSyncState(synced);
        } catch {
          setWorkspaceSyncState({
            status: 'sync-pending',
            lastSyncedAt: provisionalSyncState.lastSyncedAt,
            lastError: '동기화 실패',
          });
        }
        return;
      }

      setWorkspaceSyncState(provisionalSyncState);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [folders, selectedFolderId, selectedFileId, content, authState, authWorkspaceKey, isWorkspaceReady]);

  useEffect(() => {
    let active = true;

    void loadViewerSettings().then((settings) => {
      if (!active) return;
      applyViewerSettings(settings);
    });

    if (!window.electronAPI?.onSettingsChanged) {
      return () => {
        active = false;
      };
    }

    const unsubscribe = window.electronAPI.onSettingsChanged((settings) => {
      applyViewerSettings(settings);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [applyViewerSettings]);

  // 파일 선택 시 샘플 콘텐츠 로드
  useEffect(() => {
    const sampleContent = SAMPLE_CONTENTS[selectedFileId];
    if (sampleContent) {
      setContent(sampleContent);
    }
  }, [selectedFileId]);

  useEffect(() => {
    setDocumentFindIndex(0);
  }, [documentFindQuery]);

  useEffect(() => {
    if (documentFindMatches.length === 0) {
      setDocumentFindIndex(0);
      return;
    }
    setDocumentFindIndex((prev) => Math.min(prev, documentFindMatches.length - 1));
  }, [documentFindMatches.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        const input = document.getElementById('noleji-document-find') as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = document.getElementById('noleji-workspace-search') as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // content → 파서 전달
  useEffect(() => {
    if (renderMode === 'md') setMarkdown(content);
  }, [content, renderMode, setMarkdown]);

  // 자동 모드 감지
  useEffect(() => {
    const trimmed = content.trim().toLowerCase();
    if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
      setRenderMode('html');
    } else {
      setRenderMode('md');
    }
  }, [content]);

  /* ── 폴더/파일 CRUD 핸들러 ── */
  const handleAddFolder = useCallback(() => {
    const newFolder: FolderItem = { id: `folder-${Date.now()}`, name: '새 폴더', files: [] };
    setFolders(prev => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
    setExpandedFolders(prev => new Set([...prev, newFolder.id]));
    setEditingId(newFolder.id);
  }, []);

  const handleRenameFolder = useCallback((folderId: string, newName: string) => {
    if (!newName.trim()) return;
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName.trim() } : f));
  }, []);

  const handleDeleteFolder = useCallback((folderId: string) => {
    setFolders(prev => {
      const next = prev.filter(f => f.id !== folderId);
      if (selectedFolderId === folderId && next.length > 0) {
        setSelectedFolderId(next[0].id);
        if (next[0].files.length > 0) setSelectedFileId(next[0].files[0].id);
      }
      return next;
    });
  }, [selectedFolderId]);

  const handleAddFile = useCallback((folderId: string, type: 'md' | 'html' = 'md') => {
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name: type === 'md' ? '새 문서.md' : '새 문서.html',
      type, date: new Date().toISOString().slice(0, 10),
    };
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, files: [...f.files, newFile] } : f));
    setSelectedFileId(newFile.id);
    setContent('');
    SAMPLE_CONTENTS[newFile.id] = '';
    setEditingId(newFile.id);
  }, []);

  const handleRenameFile = useCallback((fileId: string, newName: string) => {
    if (!newName.trim()) return;
    setFolders(prev => prev.map(f => ({
      ...f, files: f.files.map(file => file.id === fileId ? { ...file, name: newName.trim() } : file)
    })));
  }, []);

  const handleDeleteFile = useCallback((fileId: string) => {
    setFolders(prev => prev.map(f => ({
      ...f, files: f.files.filter(file => file.id !== fileId)
    })));
    if (selectedFileId === fileId) {
      const folder = folders.find(f => f.id === selectedFolderId);
      const remaining = folder?.files.filter(f => f.id !== fileId);
      if (remaining && remaining.length > 0) setSelectedFileId(remaining[0].id);
    }
  }, [selectedFileId, selectedFolderId, folders]);

  const handleMoveFile = useCallback((fileId: string, targetFolderId: string) => {
    let movedFile: FileItem | null = null;
    setFolders(prev => {
      // Find and remove file from source folder
      const updated = prev.map(f => {
        const file = f.files.find(file => file.id === fileId);
        if (file) movedFile = file;
        return { ...f, files: f.files.filter(file => file.id !== fileId) };
      });
      // Add file to target folder
      if (!movedFile) return prev;
      return updated.map(f => f.id === targetFolderId ? { ...f, files: [...f.files, movedFile!] } : f);
    });
    setMoveTargetModal(null);
    setToast({ message: '파일이 이동되었습니다.', type: 'success' });
  }, []);

  const handleImportFile = useCallback((folderId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.html,.htm,.txt,.png,.jpg,.jpeg,.gif,.svg,.webp';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      // Separate images and text files
      const imageFiles: File[] = [];
      const textFiles: File[] = [];
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        } else {
          textFiles.push(file);
        }
      }

      // Convert images to base64 map (filename → data URL)
      const imageMap: Record<string, string> = {};
      for (const img of imageFiles) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(img);
        });
        imageMap[img.name] = dataUrl;
      }

      // Process text files
      for (const file of textFiles) {
        let text = await file.text();
        const type: 'md' | 'html' = (file.name.endsWith('.html') || file.name.endsWith('.htm')) ? 'html' : 'md';

        // Replace relative image paths with base64 data URLs
        if (type === 'md' && Object.keys(imageMap).length > 0) {
          text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
            // Extract filename from path (e.g., "./images/photo.png" → "photo.png")
            const fileName = src.split('/').pop() || src;
            if (imageMap[fileName]) {
              return `![${alt}](${imageMap[fileName]})`;
            }
            return match;
          });
        }

        const newFile: FileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name, type, date: new Date().toISOString().slice(0, 10),
        };
        SAMPLE_CONTENTS[newFile.id] = text;
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, files: [...f.files, newFile] } : f));
        setSelectedFileId(newFile.id);
        setContent(text);
      }

      setToast({ message: `${textFiles.length}개 파일 가져오기 완료${imageFiles.length > 0 ? ` (${imageFiles.length}개 이미지 포함)` : ''}`, type: 'success' });
    };
    input.click();
  }, []);

  const handleFolderDoubleClick = useCallback((_folderId: string) => {
    setToast({ message: '폴더 열기는 데스크톱 앱에서 사용 가능합니다.', type: 'success' });
  }, []);

  const handleFolderContextMenu = useCallback((e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', targetId: folderId });
  }, []);

  const handleFileContextMenu = useCallback((e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'file', targetId: fileId });
  }, []);

  const handleDownloadFile = useCallback((fileId: string) => {
    let targetFile: FileItem | undefined;
    for (const folder of folders) {
      targetFile = folder.files.find(f => f.id === fileId);
      if (targetFile) break;
      for (const sub of folder.subfolders || []) {
        targetFile = sub.files.find(f => f.id === fileId);
        if (targetFile) break;
      }
      if (targetFile) break;
    }
    if (!targetFile) return;
    const content = SAMPLE_CONTENTS[fileId] || '';
    const mimeType = targetFile.type === 'html' ? 'text/html;charset=utf-8' : 'text/markdown;charset=utf-8';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = targetFile.name;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: `${targetFile.name} 다운로드 완료`, type: 'success' });
  }, [folders]);

  /* ── LLM 연결 테스트 ── */
  const handleTestConnection = useCallback(async () => {
    try {
      const result = await testConnection(llmConfig);
      const updatedConfig = { ...llmConfig, isConnected: result };
      setLLMConfig(updatedConfig);
      saveLLMConfig(updatedConfig);
      return result;
    } catch {
      return false;
    }
  }, [llmConfig]);

  /* ── 지식 체계 생성 (Karpathy Wiki 패턴) ── */
  const handleGenerateKnowledge = useCallback(async () => {
    if (!llmConfig.isConnected) {
      setToast({ message: '설정에서 LLM을 먼저 연결하세요.', type: 'error' });
      return;
    }
    const { allowed } = canUsePremiumAction();
    if (!allowed) {
      setToast({ message: '오늘의 무료 사용 횟수를 모두 소진했습니다. 업그레이드하세요!', type: 'error' });
      return;
    }
    const folder = folders.find(f => f.id === selectedFolderId);
    if (!folder || folder.files.length === 0) {
      setToast({ message: '분석할 파일이 없습니다.', type: 'error' });
      return;
    }

    setIsGeneratingKnowledge(true);
    setKnowledgeProgress('준비 중...');
    try {
      const fileContents: Record<string, string> = {};
      for (const file of folder.files) {
        fileContents[file.id] = SAMPLE_CONTENTS[file.id] || '';
      }

      const wikiResult = await ingestFolder(
        folder.files, fileContents, llmConfig,
        (step, _percent) => setKnowledgeProgress(step)
      );

      trackPremiumAction('wiki_generate');

      const knowledgeFolderId = `knowledge-${selectedFolderId}-${Date.now()}`;
      const today = new Date().toISOString().slice(0, 10);

      // Convert WikiPages to 5 workspace knowledge assets
      const knowledgeFiles: FileItem[] = [];
      const entityPages = wikiResult.pages.filter((p: WikiPage) => p.type === 'entity');
      const conceptPages = wikiResult.pages.filter((p: WikiPage) => p.type === 'concept');
      const sourcePages = wikiResult.pages.filter((p: WikiPage) => p.type === 'source-summary');
      const overviewPage = wikiResult.pages.find((p: WikiPage) => p.type === 'overview');
      const indexPage = wikiResult.pages.find((p: WikiPage) => p.type === 'index');
      const logPage = wikiResult.pages.find((p: WikiPage) => p.type === 'log');
      const saveKnowledgePage = (fid: string, name: string, page: WikiPage) => {
        knowledgeFiles.push({ id: fid, name, type: 'md', date: today, origin: 'generated' });
        SAMPLE_CONTENTS[fid] = buildFullPage(page);
      };
      const buildDigestPage = (
        id: string,
        title: string,
        type: WikiPage['type'],
        tags: string[],
        body: string,
        related: string[],
      ): WikiPage => ({
        id,
        title,
        type,
        content: body,
        frontmatter: {
          title,
          type,
          tags,
          sources: folder.files.map((file) => file.name),
          created: today,
          updated: today,
          related,
        },
      });
      const buildCollectionBody = (
        heading: string,
        intro: string,
        pages: WikiPage[],
        emptyMessage: string,
      ) => {
        if (pages.length === 0) {
          return `# ${heading}\n\n${intro}\n\n> ${emptyMessage}`;
        }

        const toc = pages.map((page, index) => `${index + 1}. ${page.title}`).join('\n');
        const sections = pages.map((page) => `## ${page.title}\n\n${page.content}`).join('\n\n---\n\n');
        return `# ${heading}\n\n${intro}\n\n## 포함 항목\n${toc}\n\n---\n\n${sections}`;
      };

      const overviewBodyParts = [overviewPage?.content ?? '# 종합 개요\n\n> 생성된 지식 체계의 상위 요약입니다.'];
      if (sourcePages.length > 0) {
        const sourceSummarySections = sourcePages
          .map((page) => `### ${page.title}\n\n${page.content}`)
          .join('\n\n');
        overviewBodyParts.push(`## 원본 문서 요약\n\n${sourceSummarySections}`);
      }

      const overviewDocumentPage = buildDigestPage(
        'overview-digest',
        overviewPage?.title ?? '종합 개요',
        'overview',
        overviewPage?.frontmatter.tags ?? ['개요', '종합'],
        overviewBodyParts.join('\n\n---\n\n'),
        overviewPage?.frontmatter.related ?? [],
      );
      const entityDigestPage = buildDigestPage(
        'entities-digest',
        '엔티티 묶음',
        'entity',
        ['엔티티', '묶음'],
        buildCollectionBody('엔티티 묶음', '폴더에서 추출된 핵심 엔티티를 한 문서에서 빠르게 훑어볼 수 있도록 묶었습니다.', entityPages, '추출된 엔티티가 없습니다.'),
        entityPages.map((page) => page.title),
      );
      const conceptDigestPage = buildDigestPage(
        'concepts-digest',
        '개념 묶음',
        'concept',
        ['개념', '묶음'],
        buildCollectionBody('개념 묶음', '핵심 개념과 정의, 관련 연결을 한 문서에서 연속적으로 읽을 수 있게 정리했습니다.', conceptPages, '추출된 개념이 없습니다.'),
        conceptPages.map((page) => page.title),
      );

      const fallbackIndexPage = buildDigestPage(
        'index-fallback',
        '인덱스',
        'index',
        ['인덱스', '목차'],
        wikiResult.indexContent || '# 인덱스\n\n> 생성된 지식 체계의 문서 진입점입니다.',
        [],
      );
      const fallbackLogPage = buildDigestPage(
        'log-fallback',
        '처리 로그',
        'log',
        ['로그', '처리기록'],
        wikiResult.logContent || '# 처리 로그\n\n> 이번 지식 체계 생성 기록입니다.',
        [],
      );

      // Save exactly 5 files
      {
        const fid = `${knowledgeFolderId}-index`;
        saveKnowledgePage(fid, 'index.md', indexPage ?? fallbackIndexPage);
      }
      {
        const fid = `${knowledgeFolderId}-overview`;
        saveKnowledgePage(fid, '_overview.md', overviewDocumentPage);
      }
      {
        const fid = `${knowledgeFolderId}-entities`;
        saveKnowledgePage(fid, '_entities.md', entityDigestPage);
      }
      {
        const fid = `${knowledgeFolderId}-concepts`;
        saveKnowledgePage(fid, '_concepts.md', conceptDigestPage);
      }
      {
        const fid = `${knowledgeFolderId}-log`;
        saveKnowledgePage(fid, 'log.md', logPage ?? fallbackLogPage);
      }

      const knowledgeSubfolder: FolderItem = {
        id: knowledgeFolderId, name: '_지식체계', files: knowledgeFiles, isKnowledgeFolder: true,
      };

      setFolders(prev => prev.map(f => {
        if (f.id !== selectedFolderId) return f;
        const existingSubs = (f.subfolders || []).filter(sf => !sf.isKnowledgeFolder);
        return { ...f, subfolders: [...existingSubs, knowledgeSubfolder] };
      }));

      const firstFileId = knowledgeFiles[0]?.id;
      if (firstFileId) {
        setSelectedFileId(firstFileId);
        setContent(SAMPLE_CONTENTS[firstFileId] || '');
      }

      setToast({
        message: `_지식체계에 5개의 핵심 Markdown 산출물을 생성했습니다. index.md부터 열어 전체 구조를 확인하세요.`,
        type: 'success',
      });
    } catch (err) {
      setToast({ message: '지식 체계 생성 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsGeneratingKnowledge(false);
      setKnowledgeProgress('');
    }
  }, [llmConfig, folders, selectedFolderId]);

  /* ── iframe 스타일 (Markdown 모드) ── */
  const iframeMdStyles = useMemo(() => {
    const accent = selectedStyle.accent;
    const dark = isDarkPreview;
    const bg = dark ? '#1A202C' : '#FFFFFF';
    const fg = dark ? '#E2E8F0' : '#2D3748';
    const fgStrong = dark ? '#F7FAFC' : '#1A202C';
    const dimFg = dark ? '#A0AEC0' : '#718096';
    const subtleBg = dark ? '#2D3748' : '#F7FAFC';
    const borderClr = dark ? '#4A5568' : '#E2E8F0';
    const codeBg = dark ? '#0D1117' : '#1A202C';

    return `<style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:ital,wght@0,400;0,700;0,900;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: ${selectedStyle.font}, 'Source Serif 4', serif;
        font-size: ${fontSize}px;
        line-height: ${lineHeight};
        color: ${fg};
        background: ${bg};
        padding: ${docPadding}px;
        -webkit-font-smoothing: antialiased;
        word-break: keep-all;
        overflow-wrap: break-word;
      }
      ::selection { background: ${accent}30; }

      /* ── H1 ── */
      h1 {
        font-family: 'Inter', sans-serif;
        font-weight: 900; font-size: 2.6em; letter-spacing: -0.04em;
        color: ${fgStrong};
        border-bottom: 4px solid ${accent}; padding-bottom: 20px; margin-bottom: 32px; line-height: 1.15;
      }
      /* 드롭캡 */
      h1 + p::first-letter {
        font-size: 3em; font-weight: 700; float: left; line-height: 1;
        margin-right: 8px; margin-top: 4px; color: ${accent}; font-family: 'Inter', sans-serif;
      }

      /* ── H2 ── */
      h2 {
        font-family: 'Inter', sans-serif;
        font-weight: 800; font-size: 1.7em; letter-spacing: -0.03em;
        color: ${fgStrong};
        margin-top: 48px; margin-bottom: 16px;
        padding-bottom: 10px; border-bottom: 1px solid ${borderClr};
        display: flex; align-items: center;
      }
      h2::before {
        content: ""; width: 5px; height: 0.85em; background: ${accent};
        margin-right: 14px; border-radius: 3px; flex-shrink: 0;
      }

      /* ── H3 ── */
      h3 {
        font-family: 'Inter', sans-serif;
        font-weight: 700; font-size: 1.3em;
        color: ${fgStrong};
        margin-top: 36px; margin-bottom: 12px;
        display: flex; align-items: center;
      }
      h3::before {
        content: ""; width: 3px; height: 0.7em; background: ${accent}60;
        margin-right: 10px; border-radius: 2px; flex-shrink: 0;
      }

      /* ── H4 ── */
      h4 {
        font-family: 'Inter', sans-serif;
        font-weight: 700; font-size: 0.88em;
        text-transform: uppercase; letter-spacing: 0.08em;
        color: ${dimFg};
        margin-top: 28px; margin-bottom: 10px;
        display: flex; align-items: center;
      }
      h4::before {
        content: "●"; margin-right: 8px; color: ${accent}; font-size: 0.5em;
      }

      /* ── H5 ── */
      h5 {
        font-family: 'Inter', sans-serif;
        font-weight: 700; font-size: 0.8em;
        text-transform: uppercase; letter-spacing: 0.12em;
        color: ${dimFg}; opacity: 0.8;
        margin-top: 24px; margin-bottom: 8px;
      }

      /* ── H6 ── */
      h6 {
        font-family: 'Inter', sans-serif;
        font-weight: 600; font-size: 0.75em;
        text-transform: uppercase; letter-spacing: 0.15em;
        color: ${dimFg}; opacity: 0.6;
        margin-top: 20px; margin-bottom: 6px;
      }

      /* ── 단락 ── */
      p { margin-bottom: 1.2em; line-height: ${lineHeight}; }

      /* ── 강조 ── */
      strong { color: ${fgStrong}; font-weight: 700; }
      em { font-style: italic; color: ${dimFg}; }
      del { text-decoration: line-through; color: ${dimFg}; opacity: 0.5; }

      /* ── 링크 ── */
      a { color: ${accent}; text-decoration: none; border-bottom: 1px solid ${accent}40; transition: all 0.2s; font-weight: 500; }
      a:hover { border-bottom-color: ${accent}; }

      /* ── 수평선 ── */
      hr {
        border: none; height: 2px; margin: 2.5em 0; border-radius: 1px;
        background: linear-gradient(to right, transparent, ${accent}50, transparent);
      }

      /* ── 인용문 ── */
      blockquote {
        margin: 1.5em 0; padding: 1em 1.5em;
        background: ${dark ? '#2D374820' : 'linear-gradient(135deg, #F0FFF4 0%, #F7FAFC 100%)'};
        border-left: 4px solid ${accent}; border-radius: 0 14px 14px 0;
        color: ${dimFg}; font-style: italic;
      }
      blockquote p { margin: 0; }
      blockquote p + p { margin-top: 0.6em; }
      blockquote blockquote {
        opacity: 0.75; border-left-color: ${accent}60;
        background: ${dark ? '#1A202C40' : '#F7FAFC'};
        margin-top: 0.8em;
      }

      /* ── 리스트 (순서없는) ── */
      ul { margin: 1em 0 1.5em; padding-left: 0; list-style: none; }
      ul > li { position: relative; padding-left: 1.5em; margin-bottom: 0.45em; line-height: 1.7; }
      ul > li::before { content: '✦'; position: absolute; left: 0; color: ${accent}; font-size: 0.65em; top: 0.5em; }

      /* ── 리스트 (순서있는) ── */
      ol { margin: 1em 0 1.5em; padding-left: 0; list-style: none; counter-reset: ol-counter; }
      ol > li { position: relative; padding-left: 2.2em; margin-bottom: 0.45em; line-height: 1.7; counter-increment: ol-counter; }
      ol > li::before {
        content: counter(ol-counter); position: absolute; left: 0; top: 0.1em;
        width: 1.5em; height: 1.5em; background: ${fgStrong}; color: ${bg};
        border-radius: 50%; font-size: 0.72em; font-weight: 700;
        display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;
      }

      /* ── 체크리스트 ── */
      ul:has(> li > input[type="checkbox"]) > li { padding-left: 0.5em; }
      ul:has(> li > input[type="checkbox"]) > li::before { display: none; }
      input[type="checkbox"] {
        appearance: none; width: 17px; height: 17px;
        border: 2px solid ${borderClr}; border-radius: 4px;
        vertical-align: middle; margin-right: 8px; position: relative;
        cursor: default; transition: all 0.2s;
      }
      input[type="checkbox"]:checked { background: ${accent}; border-color: ${accent}; }
      input[type="checkbox"]:checked::after {
        content: '✓'; color: white; font-size: 11px; font-weight: 700;
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      }

      /* ── 인라인 코드 ── */
      code:not(pre code) {
        font-family: 'JetBrains Mono', monospace; font-size: 0.86em;
        background: ${dark ? '#2D3748' : '#EDF2F7'}; color: ${dark ? '#FC8181' : '#E53E3E'};
        padding: 0.15em 0.5em; border-radius: 6px; font-weight: 500;
        border: 1px solid ${borderClr};
      }

      /* ── 코드블록 ── */
      pre {
        margin: 1.5em 0; border-radius: 14px; overflow: hidden; position: relative;
        background: ${codeBg}; border: 1px solid ${dark ? '#30363D' : '#2D3748'};
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      }
      pre code {
        display: block; padding: 1.2em 1.5em; padding-top: 2.2em;
        font-family: 'JetBrains Mono', monospace; font-size: 0.86em; line-height: 1.7;
        color: #E2E8F0; overflow-x: auto; background: transparent;
        border: none;
      }
      /* 언어 라벨 */
      pre code[class*="language-"]::before,
      pre code[class*="hljs"]::before {
        position: absolute; top: 0; right: 0;
        padding: 3px 12px; font-size: 0.65em; font-weight: 700;
        background: ${accent}; color: white; border-radius: 0 14px 0 8px;
        text-transform: uppercase; letter-spacing: 0.05em;
      }
      pre code.language-typescript::before, pre code.hljs.language-typescript::before { content: "TypeScript"; }
      pre code.language-javascript::before, pre code.hljs.language-javascript::before { content: "JavaScript"; }
      pre code.language-python::before, pre code.hljs.language-python::before { content: "Python"; }
      pre code.language-html::before, pre code.hljs.language-html::before { content: "HTML"; }
      pre code.language-css::before, pre code.hljs.language-css::before { content: "CSS"; }
      pre code.language-json::before, pre code.hljs.language-json::before { content: "JSON"; }
      pre code.language-bash::before, pre code.hljs.language-bash::before { content: "Bash"; }
      pre code.language-sql::before, pre code.hljs.language-sql::before { content: "SQL"; }
      pre code.language-yaml::before, pre code.hljs.language-yaml::before { content: "YAML"; }
      pre code.language-markdown::before, pre code.hljs.language-markdown::before { content: "Markdown"; }
      pre code.language-go::before, pre code.hljs.language-go::before { content: "Go"; }
      pre code.language-rust::before, pre code.hljs.language-rust::before { content: "Rust"; }
      pre code.language-java::before, pre code.hljs.language-java::before { content: "Java"; }

      /* hljs 구문 하이라이팅 */
      .hljs-keyword { color: #B794F4; }
      .hljs-string { color: #68D391; }
      .hljs-number { color: #F6AD55; }
      .hljs-comment { color: #718096; font-style: italic; }
      .hljs-function, .hljs-title { color: #63B3ED; }
      .hljs-built_in, .hljs-type { color: #F6AD55; }
      .hljs-literal { color: #FC8181; }
      .hljs-attr, .hljs-keyword { color: #B794F4; }
      .hljs-variable, .hljs-params { color: #E2E8F0; }
      .hljs-meta { color: #718096; }
      .hljs-property { color: #63B3ED; }

      /* ── 표 ── */
      table {
        width: 100%; border-collapse: separate; border-spacing: 0;
        margin: 1.5em 0; font-size: 0.92em; overflow: hidden;
        border-radius: 12px; border: 1px solid ${borderClr};
        font-family: 'Inter', sans-serif;
      }
      thead { background: ${subtleBg}; }
      th {
        padding: 12px 16px; text-align: left; font-weight: 700;
        color: ${fgStrong}; border-bottom: 2px solid ${borderClr};
        font-size: 0.82em; text-transform: uppercase; letter-spacing: 0.05em;
      }
      td { padding: 12px 16px; border-bottom: 1px solid ${dark ? '#2D3748' : '#EDF2F7'}; color: ${dimFg}; }
      tbody tr:last-child td { border-bottom: none; }
      tbody tr:hover { background: ${dark ? '#2D374830' : '#F0FFF4'}; transition: background 0.15s; }

      /* ── 이미지 ── */
      img { max-width: 100%; border-radius: 12px; margin: 1.5em 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid ${borderClr}; }

      @media (max-width: 768px) {
        body { padding: 20px !important; font-size: ${Math.max(14, fontSize - 2)}px !important; }
        h1 { font-size: 2em !important; }
        h2 { font-size: 1.45em !important; }
        h3 { font-size: 1.18em !important; }
        table { display: block; overflow-x: auto; white-space: nowrap; }
        pre { overflow-x: auto; }
      }

      /* ── 인쇄 ── */
      @media print {
        @page { margin: 2cm; size: A4; }
        body { font-size: 12pt !important; color: #000 !important; background: #fff !important; padding: 0 !important; }
        h1, h2, h3, h4, h5, h6 { page-break-after: avoid; color: #000 !important; }
        h1 { border-bottom-color: #000 !important; }
        h2::before, h3::before { background: #000 !important; }
        pre, blockquote, table, img { page-break-inside: avoid; }
        pre { background: #F7FAFC !important; border: 1px solid #E2E8F0 !important; box-shadow: none !important; }
        pre code { color: #1A202C !important; }
        a { color: #000 !important; text-decoration: underline !important; }
        a[href]::after { content: " (" attr(href) ")"; font-size: 0.8em; color: #666; }
        img { box-shadow: none !important; }
      }
    </style>`;
  }, [selectedStyle, fontSize, lineHeight, isDarkPreview, docPadding]);

  /* ── iframe 스타일 (HTML 모드) ── */
  const iframeHtmlStyles = useMemo(() => `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:ital,wght@0,400;0,700;0,900;1,400&display=swap');
      * { box-sizing: border-box; }
      body {
        font-family: ${selectedStyle.font}, 'Inter', system-ui, sans-serif;
        font-size: ${fontSize}px; line-height: ${lineHeight};
        color: ${isDarkPreview ? '#E2E8F0' : '#1A202C'};
        background: ${isDarkPreview ? '#1A202C' : '#FFFFFF'};
        padding: ${docPadding}px; margin: 0; -webkit-font-smoothing: antialiased;
      }
      h1 { font-size: 2.5em; font-weight: 800; margin: 0.5em 0; letter-spacing: -0.03em; }
      h2 { font-size: 1.8em; font-weight: 700; margin: 0.5em 0; }
      h3 { font-size: 1.4em; font-weight: 600; margin: 0.5em 0; }
      p { margin: 0.8em 0; }
      a { color: ${selectedStyle.accent}; }
      img { max-width: 100%; height: auto; }
      table { border-collapse: collapse; width: 100%; margin: 1em 0; }
      th, td { border: 1px solid ${isDarkPreview ? '#4A5568' : '#E2E8F0'}; padding: 10px 14px; text-align: left; }
      th { background: ${isDarkPreview ? '#2D3748' : '#F7FAFC'}; font-weight: 600; }
      @media (max-width: 768px) {
        body { padding: 20px !important; font-size: ${Math.max(14, fontSize - 2)}px !important; }
        h1 { font-size: 2em !important; }
        h2 { font-size: 1.45em !important; }
        h3 { font-size: 1.18em !important; }
        table { display: block; overflow-x: auto; white-space: nowrap; }
        pre { overflow-x: auto; }
      }
      @media print {
        @page { margin: 2cm; size: A4; }
        body { font-size: 12pt !important; color: #000 !important; background: #fff !important; padding: 0 !important; }
      }
    </style>
  `, [selectedStyle, fontSize, lineHeight, isDarkPreview, docPadding]);

  /* ── Markdown srcDoc ── */
  const mdSrcDoc = useMemo(() => `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${iframeMdStyles}</head><body>${result.html}</body></html>`, [result.html, iframeMdStyles]);

  /* ── HTML srcDoc ── */
  const htmlSrcDoc = useMemo(() => {
    const trimmed = content.trim().toLowerCase();
    if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) return content;
    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"><\/script>${iframeHtmlStyles}</head><body>${content}</body></html>`;
  }, [content, iframeHtmlStyles]);

  /* ── 페이지 가이드 ── */
  const pageGuides = useMemo(() => {
    if (!showPageGuides) return null;
    return Array.from({ length: 10 }, (_, i) => (
      <div key={i} className="absolute left-0 w-full flex justify-center z-50 pointer-events-none" style={{ top: `${A4_HEIGHT_PX * (i + 1)}px` }}>
        <div className="border-t-2 border-dashed border-red-400/40 w-full absolute top-0" />
        <span className="bg-red-400/80 text-white text-[9px] font-black px-2 py-0.5 rounded-b-lg relative top-0">PAGE {i + 1} END</span>
      </div>
    ));
  }, [showPageGuides]);

  /* ── 핸들러: MD 저장 ── */
  const handleSaveMD = useCallback(async () => {
    if (currentFile.sourcePath && window.electronAPI?.writeFile) {
      try {
        await window.electronAPI.writeFile(currentFile.sourcePath, content);
        SAMPLE_CONTENTS[currentFile.id] = content;
        setExternalFileStates((prev) => ({
          ...prev,
          [currentFile.id]: {
            savedContent: content,
            lastSavedAt: Date.now(),
          },
        }));
        setToast({ message: `${currentFile.name} 원본 파일을 저장했습니다.`, type: 'success' });
        return;
      } catch {
        setToast({ message: '원본 파일 저장 중 오류가 발생했습니다.', type: 'error' });
        return;
      }
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name.endsWith('.md') ? currentFile.name : `${currentFile.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: `${currentFile.name} 저장 완료`, type: 'success' });
  }, [content, currentFile]);

  /* ── 핸들러: HTML 내보내기 ── */
  const handleExportHTML = useCallback(() => {
    const { allowed } = canUsePremiumAction();
    if (!allowed) {
      setToast({ message: '오늘의 무료 사용 횟수를 모두 소진했습니다. 업그레이드하세요!', type: 'error' });
      return;
    }
    trackPremiumAction('html_export');
    const fullHtml = renderMode === 'md' ? mdSrcDoc : htmlSrcDoc;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFile.name.replace(/\.(md|html)$/, '')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'HTML 내보내기 완료', type: 'success' });
  }, [renderMode, mdSrcDoc, htmlSrcDoc, currentFile]);

  /* ── 핸들러: PDF 다운로드 ── */
  const handlePrintPDF = useCallback(async () => {
    const { allowed } = canUsePremiumAction();
    if (!allowed) {
      setToast({ message: '오늘의 무료 사용 횟수를 모두 소진했습니다. 업그레이드하세요!', type: 'error' });
      return;
    }
    trackPremiumAction('pdf');
    const iframe = document.getElementById('noleji-view-render') as HTMLIFrameElement;
    const body = iframe?.contentDocument?.body;
    if (!body) {
      setToast({ message: 'PDF 생성 실패: 렌더링 영역을 찾을 수 없습니다.', type: 'error' });
      return;
    }
    setToast({ message: 'PDF 생성 중...', type: 'success' });
    try {
      const scale = Math.min(1.5, Math.max(1.1, window.devicePixelRatio || 1));
      const canvas = await html2canvas(body, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.72);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'MEDIUM');
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'MEDIUM');
        heightLeft -= pageHeight;
      }
      const pdfName = currentFile.name.replace(/\.(md|html)$/, '') + '.pdf';
      pdf.save(pdfName);
      setToast({ message: `${pdfName} 다운로드 완료`, type: 'success' });
    } catch {
      setToast({ message: 'PDF 생성 중 오류가 발생했습니다.', type: 'error' });
    }
  }, [currentFile]);

  const shareLinkWithSystem = useCallback(async (shareUrl: string, toastMessage: string) => {
    try {
      if (window.electronAPI?.shareLink) {
        await window.electronAPI.shareLink({
          url: shareUrl,
          title: `${BRAND_NAME} 공유 링크`,
          text: `${BRAND_NAME}에서 공유한 문서 링크입니다.`,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${BRAND_NAME} 공유 링크`,
              text: `${BRAND_NAME}에서 공유한 문서 링크입니다.`,
              url: shareUrl,
            });
          } catch {
            // 사용자가 시트를 닫은 경우에도 링크 복사는 유지한다.
          }
        }
      }
      setToast({ message: toastMessage, type: 'success' });
    } catch {
      setToast({ message: '공유 링크 복사 중 오류가 발생했습니다.', type: 'error' });
    }
  }, []);

  /* ── 핸들러: Publish (공유) ── */
  const handlePublish = useCallback(async () => {
    if (shareMode === 'external') {
      const { allowed } = canUsePremiumAction();
      if (!allowed) {
        setToast({ message: '오늘의 무료 사용 횟수를 모두 소진했습니다. 업그레이드하세요!', type: 'error' });
        return;
      }
      trackPremiumAction('share_link');
    }

    setIsUploading(true);
    const fullHtml = renderMode === 'md' ? mdSrcDoc : htmlSrcDoc;
    await new Promise((resolve) => setTimeout(resolve, 250));

    try {
      if (authState.status === 'authenticated' && authState.user.entitlements.linkSharing && shareMode === 'external') {
        const sharedRecord = await createSharedDocument({
          title: currentFile.name,
          html: fullHtml,
          ownerId: authState.user.uid,
          visibility: 'link',
        });
        const baseUrl = getAppUrl();
        const shareUrl = `${baseUrl}/shared/${sharedRecord.id}`;
        await shareLinkWithSystem(shareUrl, '계정 기반 공유 링크를 복사했고, 가능한 환경에서는 시스템 공유 메뉴를 열었습니다.');
      } else {
        const sharedRecord = await createSharedDocument({
          title: currentFile.name,
          html: fullHtml,
          ownerId: authState.status === 'authenticated' ? authState.user.uid : null,
          visibility: 'local',
        });
        const basePath = getAppBasePath();
        const origin = window.location.hostname === 'localhost'
          ? `${window.location.protocol}//${window.location.host}`
          : `${window.location.protocol}//${await getLocalIP()}:${window.location.port}`;
        const baseUrl = `${origin}${basePath}`;
        const shareUrl = `${baseUrl}/shared/${sharedRecord.id}`;
        await shareLinkWithSystem(
          shareUrl,
          authState.status === 'authenticated'
            ? '로컬 공유 링크를 복사했고, 가능한 환경에서는 시스템 공유 메뉴를 열었습니다.'
            : '로컬 공유 링크를 복사했고, 가능한 환경에서는 시스템 공유 메뉴를 열었습니다.'
        );
      }
    } finally {
      setIsUploading(false);
    }
  }, [authState, currentFile.name, htmlSrcDoc, mdSrcDoc, renderMode, shareLinkWithSystem, shareMode]);

  // Split pane drag handler
  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Split pane resize effect
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const container = splitContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.min(80, Math.max(20, (x / rect.width) * 100));
      setSplitRatio(ratio);
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isEditorVisible || isDragging || docWidth === '100%') return;
    const container = splitContainerRef.current;
    if (!container) return;

    const containerWidth = container.getBoundingClientRect().width;
    const docPixelWidth = Number.parseInt(docWidth, 10);
    if (!containerWidth || Number.isNaN(docPixelWidth)) return;

    const previewChromeAllowance = 140;
    const minEditorWidth = 340;
    const desiredPreviewPaneWidth = Math.min(containerWidth - minEditorWidth, docPixelWidth + previewChromeAllowance);
    const nextEditorWidth = Math.max(minEditorWidth, containerWidth - desiredPreviewPaneWidth);
    const nextRatio = Math.min(72, Math.max(22, (nextEditorWidth / containerWidth) * 100));
    setSplitRatio(nextRatio);
  }, [docWidth, isDragging, isEditorVisible]);

  // When the viewer asks the main window to edit a file, load that exact file into the editor state.
  useEffect(() => {
    if (!window.electronAPI?.onOpenInEditor) return undefined;

    const cleanup = window.electronAPI.onOpenInEditor(async (filePath) => {
      try {
        const nextContent = await window.electronAPI!.readFile(filePath);
        const fileName = filePath.split(/[/\\]/).pop() || 'opened-file.md';
        const normalizedName = fileName.toLowerCase();
        const type: 'md' | 'html' = normalizedName.endsWith('.html') || normalizedName.endsWith('.htm') ? 'html' : 'md';
        const fileId = `external:${filePath}`;
        const importedFile: FileItem = {
          id: fileId,
          name: fileName,
          type,
          date: new Date().toISOString().slice(0, 10),
          sourcePath: filePath,
          origin: 'external',
        };

        SAMPLE_CONTENTS[fileId] = nextContent;
        setExternalFileStates((prev) => ({
          ...prev,
          [fileId]: {
            savedContent: nextContent,
            lastSavedAt: null,
          },
        }));

        setFolders((prev) => {
          const externalFolder = prev.find((folder) => folder.id === EXTERNAL_FILES_FOLDER_ID);
          if (!externalFolder) {
            return [
              ...prev,
              {
                id: EXTERNAL_FILES_FOLDER_ID,
                name: '외부에서 연 문서',
                files: [importedFile],
              },
            ];
          }

          return prev.map((folder) => {
            if (folder.id !== EXTERNAL_FILES_FOLDER_ID) return folder;
            return {
              ...folder,
              files: [
                importedFile,
                ...folder.files.filter((file) => file.id !== fileId),
              ],
            };
          });
        });

        setSelectedFolderId(EXTERNAL_FILES_FOLDER_ID);
        setSelectedFileId(fileId);
        setContent(nextContent);
        setIsEditorVisible(true);
        window.electronAPI?.notifyEditorFileReady?.(filePath);
        setToast({ message: `${fileName} 문서를 에디터에서 열었습니다.`, type: 'success' });
      } catch {
        setToast({ message: '문서를 에디터로 여는 중 오류가 발생했습니다.', type: 'error' });
      }
    });

    window.electronAPI.notifyEditorRendererReady?.();

    return cleanup;
  }, []);

  // Open preview in viewer (Electron) or toggle fullscreen preview (web)
  const handleOpenPreview = useCallback(() => {
    const api = (window as any).electronAPI;
    if (api?.openViewer) {
      api.openViewer(content, currentFile.name, renderMode);
    } else {
      setIsEditorVisible(false);
    }
  }, [content, renderMode, currentFile.name]);

  return (
    <div className="flex h-screen w-screen bg-[#F7FAFC] text-[#1A202C] overflow-hidden selection:bg-[#10B981]/20 font-sans antialiased">

      {/* ═══ 사이드바 ═══ */}
      <aside className="w-72 flex-shrink-0 border-r border-[#E2E8F0] bg-[#F7FAFC] flex flex-col z-20">
        {/* 로고 */}
        <header className="flex flex-col border-b border-[#E2E8F0]/50 bg-white/50">
          {/* Traffic light drag area — only visible in Electron */}
          <div className="h-8 flex-shrink-0 electron-drag electron-titlebar-pad" />
          {/* Logo row */}
          <div className="flex items-center space-x-3 px-5 pb-4">
            <div className="w-9 h-9 rounded-xl bg-[#1A202C] flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-black/10">v</div>
            <div>
              <h1 className="text-base font-black tracking-tighter uppercase italic">{BRAND_NAME}</h1>
              <p className="text-[8px] text-[#10B981] font-black uppercase tracking-widest leading-none mt-0.5">Desktop v1.0</p>
            </div>
          </div>
        </header>

        <nav className="flex-grow overflow-y-auto custom-scrollbar">
          {/* 상단: 폴더 트리 (폴더만 표시) */}
          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-[9px] font-black text-[#1A202C]/30 uppercase tracking-[0.3em]">Workspaces</h2>
              <button onClick={handleAddFolder} className="text-[#1A202C]/20 hover:text-[#10B981] transition-colors" title="새 폴더"><FolderPlus size={13} /></button>
            </div>
            <div className="relative mb-3">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A202C]/25" />
              <input
                id="noleji-workspace-search"
                value={workspaceSearchQuery}
                onChange={(e) => setWorkspaceSearchQuery(e.target.value)}
                placeholder="문서 검색... ⌘K"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pl-8 pr-3 text-[11px] font-bold text-[#1A202C] placeholder:text-[#1A202C]/20 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/20"
              />
            </div>
            {workspaceSearchQuery.trim() && (
              <div className="mb-3 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-sm">
                <div className="mb-1 px-1 text-[8px] font-black uppercase tracking-[0.24em] text-[#1A202C]/25">Search Results</div>
                {workspaceSearchResults.length === 0 ? (
                  <p className="px-1 py-2 text-[10px] font-bold text-[#1A202C]/35">검색 결과가 없습니다.</p>
                ) : workspaceSearchResults.slice(0, 8).map((result) => (
                  <button
                    key={`${result.folderId}:${result.file.id}`}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#F0FFF4]"
                  >
                    <div className="flex items-center gap-2">
                      {result.file.type === 'html'
                        ? <Code2 size={12} className="text-amber-500" />
                        : <FileCode size={12} className="text-[#10B981]" />}
                      <span className="truncate text-[11px] font-black text-[#1A202C]">{result.file.name}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[9px] font-bold text-[#1A202C]/35">{result.folderName} · {result.snippet}</p>
                  </button>
                ))}
              </div>
            )}
            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              return (
                <div key={folder.id}>
                  <button
                    onClick={() => { setSelectedFolderId(folder.id); if (folder.files.length > 0) setSelectedFileId(folder.files[0].id); }}
                    onDoubleClick={() => handleFolderDoubleClick(folder.id)}
                    onContextMenu={(e) => handleFolderContextMenu(e, folder.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const fileId = e.dataTransfer.getData('text/plain'); if (fileId) handleMoveFile(fileId, folder.id); }}
                    className={`w-full px-3 py-2 text-[13px] font-semibold rounded-xl transition-all flex items-center space-x-2.5 group ${
                      isSelected ? 'bg-white shadow-sm border border-[#E2E8F0] text-[#1A202C]' : 'text-[#1A202C]/50 hover:bg-white/60 hover:text-[#1A202C]'
                    }`}
                  >
                    {isSelected
                      ? <FolderOpen size={16} className="text-[#10B981] flex-shrink-0" />
                      : <Folder size={16} className="text-[#1A202C]/30 flex-shrink-0" />}
                    <InlineEdit
                      value={folder.name}
                      isEditing={editingId === folder.id}
                      onStartEdit={() => setEditingId(folder.id)}
                      onCancelEdit={() => setEditingId(null)}
                      onConfirm={(name) => handleRenameFolder(folder.id, name)}
                      className="truncate"
                    />
                    <span className="ml-auto text-[10px] font-bold text-[#1A202C]/20">{folder.files.length}</span>
                  </button>
                  {/* 서브폴더 (지식체계) */}
                  {isSelected && folder.subfolders?.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => { setSelectedFolderId(sub.id); if (sub.files.length > 0) setSelectedFileId(sub.files[0].id); }}
                      className="w-full ml-5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center space-x-2 text-[#7C3AED]/60 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED]"
                    >
                      <Brain size={12} className="flex-shrink-0" />
                      <span className="truncate">{sub.name}</span>
                      <span className="ml-auto text-[9px] font-bold opacity-40">{sub.files.length}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* 구분선 */}
          <div className="mx-4 border-t border-[#E2E8F0]" />

          {/* 하단: 현재 폴더 파일 목록 */}
          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-[9px] font-black text-[#1A202C]/30 uppercase tracking-[0.3em]">
                {currentFolder?.name ?? 'Files'}
              </h2>
              <div className="flex items-center space-x-1">
                <button onClick={() => handleImportFile(selectedFolderId)} className="text-[#1A202C]/20 hover:text-[#10B981] transition-colors" title="파일 가져오기"><Import size={12} /></button>
                <button onClick={() => handleAddFile(selectedFolderId)} className="text-[#1A202C]/20 hover:text-[#10B981] transition-colors" title="새 파일"><FilePlus size={13} /></button>
              </div>
            </div>
            {currentFolder?.files.map((file) => (
              <button
                key={file.id}
                draggable="true"
                onDragStart={(e) => e.dataTransfer.setData('text/plain', file.id)}
                onClick={() => setSelectedFileId(file.id)}
                onContextMenu={(e) => handleFileContextMenu(e, file.id)}
                className={`w-full px-3 py-2.5 text-[13px] rounded-xl transition-all flex items-center space-x-2.5 group ${
                  selectedFileId === file.id
                    ? 'bg-[#1A202C] text-white font-bold shadow-lg shadow-black/10'
                    : 'text-[#1A202C]/50 hover:bg-white hover:text-[#1A202C]'
                }`}
              >
                {file.type === 'html'
                  ? <Code2 size={15} className={selectedFileId === file.id ? 'text-amber-400' : 'text-amber-500/50'} />
                  : <FileCode size={15} className={selectedFileId === file.id ? 'text-[#10B981]' : 'text-[#10B981]/50'} />}
                <InlineEdit
                  value={file.name}
                  isEditing={editingId === file.id}
                  onStartEdit={() => setEditingId(file.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onConfirm={(name) => handleRenameFile(file.id, name)}
                  className={`truncate ${selectedFileId === file.id ? 'text-white' : ''}`}
                />
                <span className={`ml-auto text-[9px] font-bold ${selectedFileId === file.id ? 'text-white/40' : 'text-[#1A202C]/15'}`}>{file.date.slice(5)}</span>
              </button>
            ))}

            {/* 지식 체계 생성 버튼 */}
            <div className="mt-3 pt-3 border-t border-[#E2E8F0]/50 space-y-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateKnowledge}
                  disabled={isGeneratingKnowledge || !llmConfig.isConnected}
                  className={`flex-1 px-3 py-2.5 text-[11px] font-bold rounded-xl transition-all flex items-center space-x-2 ${
                    llmConfig.isConnected
                      ? 'bg-[#7C3AED]/5 text-[#7C3AED] hover:bg-[#7C3AED]/10 border border-[#7C3AED]/20'
                      : 'bg-[#F7FAFC] text-[#1A202C]/20 border border-[#E2E8F0] cursor-not-allowed'
                  }`}
                  title={!llmConfig.isConnected ? '설정에서 LLM을 먼저 연결하세요' : '폴더 내 문서를 분석하여 지식 체계 생성'}
                >
                  {isGeneratingKnowledge
                    ? <><div className="w-3 h-3 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" /><span>{knowledgeProgress}</span></>
                    : <><Sparkles size={13} /><span>지식 체계 생성</span></>}
                </button>
                <div className="relative group">
                  <button
                    type="button"
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#7C3AED]/20 bg-white text-[#7C3AED] transition-colors hover:bg-[#FAF5FF]"
                    aria-label="지식 체계 사용 방법"
                  >
                    <Info size={14} />
                  </button>
                  <div className="pointer-events-none absolute right-0 top-[48px] z-20 hidden w-80 rounded-2xl border border-[#7C3AED]/15 bg-white p-4 text-left shadow-2xl group-hover:block">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7C3AED]/55">Knowledge Guide</p>
                    <h4 className="mt-1 text-[13px] font-black text-[#1A202C]">지식 체계 사용 방법</h4>
                    <div className="mt-3 space-y-3 text-[10px] font-bold text-[#1A202C]/60">
                      <div>
                        <p className="text-[#1A202C]">1. 무엇을 분석하나요?</p>
                        <p className="mt-1">현재 선택한 폴더 안의 Markdown/HTML 파일을 기준으로 엔티티, 개념, 원본 요약을 추출합니다.</p>
                      </div>
                      <div>
                        <p className="text-[#1A202C]">2. 결과는 어디에 생기나요?</p>
                        <p className="mt-1">선택한 폴더 바로 아래에 `_지식체계` 하위폴더가 만들어지고, 항상 5개의 핵심 산출물만 정리됩니다.</p>
                      </div>
                      <div>
                        <p className="text-[#1A202C]">3. 생성되는 5개 산출물</p>
                        <ul className="mt-1 space-y-1 list-disc pl-4">
                          <li><span className="text-[#1A202C]">index.md</span> — 전체 구조와 이동 허브</li>
                          <li><span className="text-[#1A202C]">_overview.md</span> — 종합 개요 + 원본 문서 요약</li>
                          <li><span className="text-[#1A202C]">_entities.md</span> — 핵심 엔티티 묶음</li>
                          <li><span className="text-[#1A202C]">_concepts.md</span> — 핵심 개념 묶음</li>
                          <li><span className="text-[#1A202C]">log.md</span> — 처리 로그와 생성 기록</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-[#1A202C]">4. 어떻게 읽으면 좋나요?</p>
                        <p className="mt-1">처음에는 index.md → overview → entities/concepts 순서로 보는 것을 추천합니다. 결과가 마음에 들지 않으면 원본 폴더를 수정한 뒤 다시 생성하면 됩니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {activeKnowledgeSummary && (
                <div className="rounded-2xl border border-[#7C3AED]/15 bg-gradient-to-br from-[#FAF5FF] to-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#7C3AED]/55">Knowledge Output</p>
                      <h3 className="mt-1 text-[12px] font-black text-[#1A202C]">{activeKnowledgeSummary.parentFolderName} / _지식체계</h3>
                      <p className="mt-1 text-[10px] font-bold text-[#1A202C]/45">
                        폴더 단위 결과 허브 · 총 {activeKnowledgeSummary.totalFiles}개 산출물 · 원본 문서 요약 {activeKnowledgeSummary.sourceCount}개 반영
                      </p>
                    </div>
                    <button
                      onClick={() => openKnowledgeFolder(activeKnowledgeSummary)}
                      className="rounded-xl border border-[#7C3AED]/20 bg-white px-2.5 py-1.5 text-[9px] font-black text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/5"
                    >
                      허브 열기
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {activeKnowledgeSummary.outputs.map((output) => (
                      <button
                        key={output.key}
                        onClick={() => openKnowledgeOutput(activeKnowledgeSummary, output.fileId)}
                        className="w-full rounded-2xl border border-[#E9D8FD] bg-white/90 px-3 py-3 text-left transition-all hover:border-[#7C3AED]/30 hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#7C3AED]/45">{output.fileName}</p>
                            <h4 className="mt-1 text-[11px] font-black text-[#1A202C]">{output.label}</h4>
                            <p className="mt-1 text-[10px] font-bold text-[#1A202C]/45">{output.description}</p>
                          </div>
                          <span className="rounded-full bg-[#FAF5FF] px-2 py-1 text-[8px] font-black text-[#7C3AED]">{output.countLabel}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        <footer className="border-t border-[#E2E8F0] bg-white">
          <UsageBadge />
          <div className="p-4 pt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                authState.status === 'authenticated' || llmConfig.isConnected ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'
              } animate-pulse`} />
              <span className="text-[9px] font-black text-[#1A202C]/30 uppercase tracking-tighter">
                {authState.status === 'authenticated'
                  ? 'Cloud Workspace'
                  : llmConfig.isConnected
                    ? 'LLM Connected'
                    : 'Local Workspace'}
              </span>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="text-[#1A202C]/20 hover:text-[#1A202C] transition-colors"><Settings size={14} /></button>
          </div>
        </footer>
      </aside>

      {/* ═══ 메인 작업 영역 ═══ */}
      <main className="flex-grow flex flex-col min-w-0 bg-white relative z-10 shadow-2xl">
        {/* 헤더 */}
        <header className="h-14 border-b border-[#E2E8F0] flex items-center justify-between px-6 bg-white/90 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-2 text-[12px] font-bold">
              <span className="text-[#1A202C]/25 uppercase tracking-widest">{currentFolder?.name}</span>
              <ChevronRight size={12} className="text-[#E2E8F0]" />
              <span className="text-[#1A202C]">{currentFile.name}</span>
            </div>
            <div className="flex bg-[#F7FAFC] p-0.5 rounded-lg border border-[#E2E8F0]">
              <button onClick={() => setRenderMode('md')} className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${renderMode === 'md' ? 'bg-white shadow-sm text-[#10B981]' : 'text-[#1A202C]/30'}`}>MARKDOWN</button>
              <button onClick={() => setRenderMode('html')} className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${renderMode === 'html' ? 'bg-white shadow-sm text-amber-500' : 'text-[#1A202C]/30'}`}>HTML</button>
            </div>
            {isParsing && <div className="flex items-center space-x-1"><div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /><span className="text-[8px] font-bold text-[#10B981]">PARSING</span></div>}
            {!isExternalFile && (
              <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${workspaceStatusTone}`}>
                {workspaceStatusLabel}
              </div>
            )}
            {isExternalFile && externalSaveStatusLabel && (
              <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${externalSaveStatusTone}`}>
                {externalSaveStatusLabel}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleSaveMD}
              title={isExternalFile ? (isExternalDirty ? '원본 파일 저장' : '저장된 상태입니다') : '마크다운 다운로드'}
              disabled={isExternalFile && !isExternalDirty}
              className={`flex items-center space-x-1 px-2.5 py-1.5 text-[9px] font-black rounded-lg border transition-all active:scale-95 ${
                isExternalFile && !isExternalDirty
                  ? 'bg-[#F7FAFC] border-[#E2E8F0] text-[#1A202C]/35 cursor-not-allowed'
                  : 'bg-white border-[#E2E8F0] hover:bg-[#F7FAFC]'
              }`}
            >
              {isExternalFile
                ? <Save size={12} className="text-[#10B981]" />
                : <Download size={12} className="text-[#1A202C]/30" />}
              <span>{isExternalFile ? (isExternalDirty ? '저장 필요' : '저장 완료') : 'MD'}</span>
            </button>
            <button onClick={handleExportHTML} className="flex items-center space-x-1 px-2.5 py-1.5 text-[9px] font-black bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F7FAFC] transition-all active:scale-95">
              <FileDown size={12} className="text-amber-500/60" /><span>HTML</span>
            </button>
            <button onClick={handlePrintPDF} className="flex items-center space-x-1.5 px-3 py-1.5 text-[9px] font-black bg-[#1A202C] text-white rounded-lg hover:bg-[#10B981] transition-all shadow-sm active:scale-95">
              <Printer size={12} /><span>PDF</span>
            </button>
            <div className="w-px h-5 bg-[#E2E8F0] mx-1" />
            <button onClick={handleOpenPreview} className="flex items-center space-x-1 px-2.5 py-1.5 text-[9px] font-black bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] rounded-lg hover:bg-[#10B981]/20 transition-all active:scale-95" title="미리보기 실행">
              <Eye size={12} /><span>미리보기</span>
            </button>
            <button onClick={() => setIsInspectorOpen(!isInspectorOpen)} className={`p-1.5 rounded-lg border transition-all ${isInspectorOpen ? 'bg-[#10B981] border-[#10B981] text-white' : 'bg-white border-[#E2E8F0] text-[#1A202C]/30 hover:border-[#10B981]'}`}>
              <Layout size={14} />
            </button>
          </div>
        </header>

        {isExternalFile && (
          <div className="border-b border-[#10B981]/15 bg-[#F0FFF4] px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#10B981]">External Edit Mode</p>
              <p className="text-[12px] font-semibold text-[#1A202C] truncate">{currentFile.name}</p>
              <p className="text-[10px] text-[#1A202C]/45 truncate">
                {currentFile.sourcePath} · 저장 버튼을 누르면 원본 파일에 바로 반영됩니다.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 whitespace-nowrap">
              <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${externalSaveStatusTone}`}>
                {externalSaveStatusLabel}
              </div>
              <div className="text-[10px] font-bold text-[#1A202C]/45">
                {externalSaveStatusMessage}
              </div>
            </div>
          </div>
        )}

        <section ref={splitContainerRef} className={`flex-grow flex overflow-hidden bg-[#F7FAFC] ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
          {/* 에디터 접기 버튼 (에디터 숨김 상태) */}
          {!isEditorVisible && (
            <button
              onClick={() => setIsEditorVisible(true)}
              className="h-full w-8 flex-shrink-0 bg-white border-r border-[#E2E8F0] flex items-center justify-center hover:bg-[#F0FFF4] hover:border-[#10B981] transition-all group"
              title="에디터 열기"
            >
              <PanelLeftOpen size={14} className="text-[#1A202C]/20 group-hover:text-[#10B981] transition-colors" />
            </button>
          )}

          {/* 에디터 영역 */}
          {isEditorVisible && (
            <div className="h-full border-r border-[#E2E8F0] flex flex-col bg-white flex-shrink-0" style={{ width: `${splitRatio}%` }}>
              {/* 에디터 헤더: 라벨 + 접기 버튼 */}
              <div className="flex-shrink-0 h-9 border-b border-[#E2E8F0] bg-[#F7FAFC]/50 flex items-center justify-between px-3 gap-2">
                <span className="text-[9px] font-black text-[#1A202C]/25 uppercase tracking-[0.2em]">Editor</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <input
                    id="noleji-document-find"
                    value={documentFindQuery}
                    onChange={(e) => setDocumentFindQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.shiftKey ? handleDocumentFindPrevious() : handleDocumentFindNext();
                      }
                    }}
                    placeholder="찾기 ⌘F"
                    className="h-6 w-28 rounded-md border border-[#E2E8F0] bg-white px-2 text-[9px] font-bold text-[#1A202C] placeholder:text-[#1A202C]/20 focus:border-[#10B981] focus:outline-none"
                  />
                  <input
                    value={documentReplaceQuery}
                    onChange={(e) => setDocumentReplaceQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleDocumentReplace(e.shiftKey);
                      }
                    }}
                    placeholder="바꾸기"
                    className="h-6 w-24 rounded-md border border-[#E2E8F0] bg-white px-2 text-[9px] font-bold text-[#1A202C] placeholder:text-[#1A202C]/20 focus:border-[#10B981] focus:outline-none"
                  />
                  <span className="min-w-12 text-right text-[8px] font-black text-[#1A202C]/25">
                    {documentFindQuery.trim() ? `${documentFindMatches.length ? documentFindIndex + 1 : 0}/${documentFindMatches.length}` : ''}
                  </span>
                  <button
                    onClick={handleDocumentFindPrevious}
                    disabled={documentFindMatches.length === 0}
                    className="rounded-md px-1.5 py-1 text-[9px] font-black text-[#1A202C]/35 hover:bg-[#10B981]/10 hover:text-[#10B981] disabled:opacity-25"
                    title="이전 찾기"
                  >
                    이전
                  </button>
                  <button
                    onClick={handleDocumentFindNext}
                    disabled={documentFindMatches.length === 0}
                    className="rounded-md px-1.5 py-1 text-[9px] font-black text-[#1A202C]/35 hover:bg-[#10B981]/10 hover:text-[#10B981] disabled:opacity-25"
                    title="다음 찾기"
                  >
                    다음
                  </button>
                  <button
                    onClick={() => handleDocumentReplace(false)}
                    disabled={documentFindMatches.length === 0}
                    className="rounded-md px-1.5 py-1 text-[9px] font-black text-[#1A202C]/35 hover:bg-[#10B981]/10 hover:text-[#10B981] disabled:opacity-25"
                    title="현재 항목 바꾸기"
                  >
                    바꾸기
                  </button>
                  <button
                    onClick={() => handleDocumentReplace(true)}
                    disabled={documentFindMatches.length === 0}
                    className="rounded-md px-1.5 py-1 text-[9px] font-black text-[#1A202C]/35 hover:bg-[#10B981]/10 hover:text-[#10B981] disabled:opacity-25"
                    title="모두 바꾸기"
                  >
                    모두
                  </button>
                </div>
                <button
                  onClick={() => setIsEditorVisible(false)}
                  className="flex items-center space-x-1 px-2 py-1 text-[9px] font-black rounded-md text-[#1A202C]/30 hover:text-[#10B981] hover:bg-[#10B981]/10 transition-all"
                  title="에디터 접기"
                >
                  <PanelLeftClose size={13} />
                </button>
              </div>
              {/* Markdown 툴바 (MD 모드일 때만) */}
              {renderMode === 'md' && (
                <MarkdownToolbar textareaRef={textareaRef} content={content} setContent={updateEditorContent} />
              )}
              <textarea
                ref={textareaRef}
                className="flex-grow p-8 bg-transparent border-none focus:ring-0 focus:outline-none text-[14px] font-mono leading-relaxed text-[#1A202C]/70 resize-none placeholder-[#1A202C]/15 custom-scrollbar"
                value={content}
                onChange={(e) => updateEditorContent(e.target.value)}
                spellCheck={false}
                placeholder="마크다운 또는 HTML을 작성하세요..."
              />
              <div className="flex-shrink-0 h-7 border-t border-[#E2E8F0] bg-[#F7FAFC]/50 flex items-center px-4 gap-4 text-[9px] font-bold text-[#A0AEC0]">
                <span>{result.wordCount.toLocaleString()} 단어</span>
                <span>{result.charCount.toLocaleString()} 자</span>
                <span>{result.lineCount} 줄</span>
                <span>{result.headings.length} 섹션</span>
              </div>
            </div>
          )}

          {/* Split divider */}
          {isEditorVisible && (
            <div
              onMouseDown={handleSplitMouseDown}
              className={`w-1.5 flex-shrink-0 cursor-col-resize transition-colors ${isDragging ? 'bg-[#10B981]' : 'bg-[#E2E8F0] hover:bg-[#10B981]/50'}`}
            />
          )}

          {/* 미리보기 (iframe) */}
          <div className={`${isEditorVisible ? 'flex-1 min-w-0' : 'w-full'} h-full overflow-y-auto custom-scrollbar bg-[#F7FAFC] p-10 transition-all duration-500 relative`}>
            <div className={`mx-auto bg-white shadow-2xl transition-all duration-500 relative rounded-sm ${showPageGuides ? 'ring-1 ring-red-200' : ''}`} style={{ width: docWidth, minWidth: '380px' }}>
              <iframe
                id="noleji-view-render"
                title="noleji-view-render"
                className="w-full border-none"
                style={{ minHeight: 'calc(100vh - 160px)', height: '100%' }}
                srcDoc={renderMode === 'md' ? mdSrcDoc : htmlSrcDoc}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
              {pageGuides}
            </div>
          </div>
        </section>
      </main>

      {/* ═══ 인스펙터 패널 ═══ */}
      {isInspectorOpen && (
        <aside className="w-72 flex-shrink-0 border-l border-[#E2E8F0] bg-white flex flex-col z-20 shadow-2xl">
          <header className="p-5 border-b border-[#E2E8F0]/50">
            <h2 className="text-base font-black text-[#1A202C] tracking-tight flex items-center space-x-2"><Palette size={16} className="text-[#10B981]" /><span>Detail 디자인 조정</span></h2>
            <p className="text-[8px] text-[#1A202C]/30 font-bold mt-0.5 uppercase tracking-[0.2em]">Design Adjustment</p>
          </header>

          <section className="flex-grow overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {/* 디자인 스타일 */}
            <div className="space-y-2">
              <h3 className="text-[8px] font-black text-[#1A202C]/25 uppercase tracking-widest flex items-center space-x-1.5"><BookOpen size={10} /><span>Design Style</span></h3>
              <button onClick={() => setIsStyleModalOpen(true)} className="w-full p-3 rounded-xl border-2 bg-white flex items-center space-x-2.5 group hover:shadow-lg transition-all" style={{ borderColor: selectedStyle.accent }}>
                <div className="flex space-x-1"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedStyle.color }} /><div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedStyle.accent }} /></div>
                <span className="text-[12px] font-black tracking-tight" style={{ color: selectedStyle.accent }}>{selectedStyle.name}</span>
              </button>
            </div>

            {/* View Settings */}
            <div className="space-y-3">
              <h3 className="text-[8px] font-black text-[#1A202C]/25 uppercase tracking-widest flex items-center space-x-1.5"><Sliders size={10} /><span>View Settings</span></h3>
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F7FAFC]/30 space-y-4">
                {/* 폰트 사이즈 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black"><span className="opacity-30 uppercase">Font Size</span><span style={{ color: selectedStyle.accent }}>{fontSize}px</span></div>
                  <input type="range" min="12" max="28" value={fontSize} onChange={(e) => persistViewerSettings({ fontSize: parseInt(e.target.value, 10) })} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer" style={{ accentColor: selectedStyle.accent }} />
                </div>
                {/* 줄 간격 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black"><span className="opacity-30 uppercase">Line Height</span><span style={{ color: selectedStyle.accent }}>{lineHeight.toFixed(1)}</span></div>
                  <input type="range" min="14" max="26" value={lineHeight * 10} onChange={(e) => persistViewerSettings({ lineHeight: parseInt(e.target.value, 10) / 10 })} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer" style={{ accentColor: selectedStyle.accent }} />
                </div>
                {/* 여백 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black"><span className="opacity-30 uppercase">Padding</span><span style={{ color: selectedStyle.accent }}>{docPadding}px</span></div>
                  <input type="range" min="20" max="100" step="10" value={docPadding} onChange={(e) => persistViewerSettings({ padding: parseInt(e.target.value, 10) })} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer" style={{ accentColor: selectedStyle.accent }} />
                </div>
                {/* 문서 폭 */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black opacity-30 uppercase">Width</span>
                  <div className="grid grid-cols-5 gap-1">
                    {DOC_WIDTH_OPTIONS.map(w => (
                      <button key={w} onClick={() => persistViewerSettings({ docWidth: w as ViewerSettings['docWidth'] })} className={`py-1.5 text-[7px] font-black border rounded-md transition-all ${docWidth === w ? 'bg-[#1A202C] text-white border-[#1A202C]' : 'bg-white text-[#1A202C]/30 border-[#E2E8F0] hover:border-[#10B981]'}`}>
                        {w === '100%' ? 'FULL' : w}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 다크모드 + 페이지 가이드 */}
                <div className="flex gap-1.5">
                  <button onClick={() => persistViewerSettings({ isDark: !isDarkPreview })} className={`flex-1 py-2 rounded-lg border font-black text-[8px] transition-all flex items-center justify-center space-x-1 ${isDarkPreview ? 'bg-[#1A202C] border-[#1A202C] text-white' : 'bg-white border-[#E2E8F0] text-[#1A202C]/30'}`}>
                    {isDarkPreview ? <Moon size={10} /> : <Sun size={10} />}<span>{isDarkPreview ? 'DARK' : 'LIGHT'}</span>
                  </button>
                  <button onClick={() => setShowPageGuides(!showPageGuides)} className={`flex-1 py-2 rounded-lg border-2 font-black text-[8px] transition-all flex items-center justify-center space-x-1 ${showPageGuides ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-[#E2E8F0] text-[#1A202C]/30'}`}>
                    <Move size={10} /><span>PAGES</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Render Info */}
            <div className="space-y-2">
              <h3 className="text-[8px] font-black text-[#1A202C]/25 uppercase tracking-widest">Render Info</h3>
              <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F7FAFC]/50 space-y-1.5 text-[9px] font-bold">
                <div className="flex justify-between"><span className="opacity-30">Mode</span><span className="text-[#10B981] font-black">{renderMode.toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="opacity-30">Engine</span><span>unified + rehype</span></div>
                <div className="flex justify-between"><span className="opacity-30">Sections</span><span>{result.headings.length}</span></div>
                <div className="flex justify-between"><span className="opacity-30">Words</span><span>{result.wordCount.toLocaleString()}</span></div>
              </div>
            </div>
          </section>

          <footer className="p-5 border-t border-[#E2E8F0] bg-[#F7FAFC]/50 space-y-2">
            <button onClick={handlePublish} disabled={isUploading} className="w-full py-3.5 bg-[#1A202C] text-white rounded-xl font-black text-[9px] tracking-[0.15em] hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-2.5 uppercase group disabled:opacity-50">
              {isUploading ? (
                <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>PUBLISHING...</span></>
              ) : (
                <><ExternalLink size={13} className="group-hover:-translate-y-0.5 transition-transform" /><span>Publish &amp; Share</span></>
              )}
            </button>
          </footer>
        </aside>
      )}

      {/* ═══ 스타일 갤러리 모달 ═══ */}
      {isStyleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-[#1A202C]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl h-[560px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20">
            <header className="p-8 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F7FAFC]/50">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#1A202C]">Design Style Gallery</h2>
                <p className="text-xs font-bold opacity-30 mt-1 uppercase tracking-widest">Select your knowledge aesthetic</p>
              </div>
              <button onClick={() => setIsStyleModalOpen(false)} className="p-2.5 bg-white rounded-xl border border-[#E2E8F0] hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
            </header>
            <div className="flex-grow overflow-y-auto p-8 grid grid-cols-3 gap-6 custom-scrollbar">
              {DESIGN_TEMPLATES.map((tmpl) => (
                <div key={tmpl.id} onClick={() => { persistViewerSettings({ templateId: tmpl.id }); setIsStyleModalOpen(false); }}
                  className={`relative h-40 rounded-[24px] border-4 p-5 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl flex flex-col justify-between overflow-hidden group ${selectedStyle.id === tmpl.id ? 'border-[#10B981]' : 'border-[#E2E8F0]'}`}>
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:rotate-12 transition-transform"><BookOpen size={60} /></div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Template</span>
                    <h3 className="text-lg font-black mt-0.5" style={{ color: tmpl.color }}>{tmpl.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tmpl.color }} />
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tmpl.accent }} />
                    <span className="text-[9px] font-bold text-[#1A202C]/30 ml-auto uppercase">Select</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 컨텍스트 메뉴 ═══ */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={
            contextMenu.type === 'folder'
              ? [
                  { label: '이름 변경', icon: <Pencil size={13} />, onClick: () => setEditingId(contextMenu.targetId) },
                  { label: '새 폴더', icon: <FolderPlus size={13} />, onClick: handleAddFolder },
                  { label: '새 파일', icon: <FilePlus size={13} />, onClick: () => handleAddFile(contextMenu.targetId) },
                  { label: '파일 가져오기', icon: <Import size={13} />, onClick: () => handleImportFile(contextMenu.targetId) },
                  { label: '', onClick: () => {}, divider: true },
                  { label: '폴더 삭제', icon: <Trash2 size={13} />, onClick: () => handleDeleteFolder(contextMenu.targetId), danger: true },
                ]
              : [
                  { label: '이름 변경', icon: <Pencil size={13} />, onClick: () => setEditingId(contextMenu.targetId) },
                  { label: '다운로드', icon: <Download size={13} />, onClick: () => handleDownloadFile(contextMenu.targetId) },
                  { label: '폴더로 이동', icon: <Move size={13} />, onClick: () => {
                    const file = currentFolder?.files.find(f => f.id === contextMenu!.targetId);
                    setMoveTargetModal({ fileId: contextMenu!.targetId, fileName: file?.name || '' });
                  }},
                  { label: '', onClick: () => {}, divider: true },
                  { label: '파일 삭제', icon: <Trash2 size={13} />, onClick: () => handleDeleteFile(contextMenu.targetId), danger: true },
                ]
          }
        />
      )}

      {/* ═══ Settings 모달 ═══ */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        shareMode={shareMode}
        setShareMode={setShareMode}
        llmConfig={llmConfig}
        setLLMConfig={(config) => { setLLMConfig(config); saveLLMConfig(config); }}
        onTestConnection={handleTestConnection}
        authState={authState}
        onSignIn={signIn}
        onEmailAuth={signInWithEmail}
        onSignOut={signOut}
      />

      {/* ═══ 폴더 이동 모달 ═══ */}
      {moveTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setMoveTargetModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-[#1A202C] mb-1">폴더로 이동</h3>
            <p className="text-[10px] text-[#1A202C]/40 mb-4">"{moveTargetModal.fileName}" 파일을 이동할 폴더를 선택하세요.</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {folders.filter(f => f.id !== selectedFolderId).map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleMoveFile(moveTargetModal.fileId, folder.id)}
                  className="w-full px-3 py-2.5 text-left rounded-xl text-[12px] font-semibold text-[#1A202C]/70 hover:bg-[#10B981]/10 hover:text-[#10B981] transition-all flex items-center space-x-2"
                >
                  <Folder size={14} className="text-[#1A202C]/30" />
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMoveTargetModal(null)}
              className="w-full mt-3 py-2 rounded-xl bg-[#F7FAFC] text-[#1A202C]/50 text-[11px] font-bold border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* 전역 스타일 */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #10B981; }
        @media print {
          aside, header, .custom-scrollbar { display: none !important; }
          main { box-shadow: none !important; }
          section { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default EditorPage;
