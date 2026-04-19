import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FolderOpen, Folder, Settings, ChevronRight, Printer,
  Layout, BookOpen, X, FileCode, Code2, Download, FileDown,
  Sliders, Sun, Moon, Move, Check, AlertCircle, ExternalLink,
  PanelLeftClose, PanelLeftOpen, Trash2, Pencil, Import, Brain, Sparkles, Save,
  FolderPlus, FilePlus, Palette, Eye
} from 'lucide-react';
import { useMarkdownParser } from '../hooks/useMarkdownParser';
import MarkdownToolbar from '../components/MarkdownToolbar';
import { SAMPLE_CONTENTS } from '../data/sampleContents';
import { DESIGN_TEMPLATES } from '../data/designTemplates';
import ContextMenu from '../components/ContextMenu';
import InlineEdit from '../components/InlineEdit';
import SettingsModal from '../components/SettingsModal';
import { useAuth } from '../hooks/useAuth';
import { type LLMConfig } from '../types/llm';
import { loadLLMConfig, saveLLMConfig, testConnection } from '../services/llmClient';
import { ingestFolder } from '../services/wiki';
import type { WikiPage } from '../services/wiki';
import { canUsePremiumAction, trackPremiumAction, getUserPlan } from '../utils/featureGate';
import { publishToGist, getGithubToken } from '../services/gistStorage';
import UsageBadge from '../components/UsageBadge';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getLocalIP } from '../utils/networkUtils';

/**
 * docwise Desktop v1.0
 * 1. Obsidian-style Markdown Editing Toolbar
 * 2. Rich h3-h6, hr, blockquote, code, list styling
 * 3. Folder Tree Sidebar + File List
 * 4. Enhanced PDF Print + Publish Shareable Link
 */

/* ── 타입 정의 ── */
interface FileItem {
  id: string;
  name: string;
  type: 'md' | 'html';
  date: string;
  content?: string;
  sourcePath?: string;
}

interface FolderItem {
  id: string;
  name: string;
  files: FileItem[];
  subfolders?: FolderItem[];
  isKnowledgeFolder?: boolean;
}

interface ExternalFileState {
  savedContent: string;
  lastSavedAt: number | null;
}

/* ── 폴더/파일 Mock 데이터 ── */
const INITIAL_FOLDERS: FolderItem[] = [
  {
    id: 'personal',
    name: '개인 지식 보관소',
    files: [
      { id: 'f1', name: '시작하기.md', type: 'md', date: '2026-04-14' },
      { id: 'f2', name: '마크다운_치트시트.md', type: 'md', date: '2026-04-13' },
      { id: 'f3', name: '나의_독서노트.md', type: 'md', date: '2026-04-12' },
    ],
  },
  {
    id: 'project',
    name: '프로젝트 기획',
    files: [
      { id: 'f4', name: '2026_신규서비스_기획.md', type: 'md', date: '2026-04-14' },
      { id: 'f5', name: 'API_설계_명세.md', type: 'md', date: '2026-04-13' },
      { id: 'f6', name: '회의록_0414.md', type: 'md', date: '2026-04-14' },
    ],
  },
  {
    id: 'design-system',
    name: '디자인 시스템',
    files: [
      { id: 'f7', name: 'Apple_스타일_가이드.html', type: 'html', date: '2026-04-11' },
      { id: 'f8', name: 'Stripe_컴포넌트.html', type: 'html', date: '2026-04-10' },
      { id: 'f9', name: '브랜드_컬러_팔레트.md', type: 'md', date: '2026-04-09' },
    ],
  },
  {
    id: 'marketing',
    name: '마케팅 & 콘텐츠',
    files: [
      { id: 'f10', name: '랜딩페이지_시안.html', type: 'html', date: '2026-04-12' },
      { id: 'f11', name: '뉴스레터_초안.md', type: 'md', date: '2026-04-11' },
      { id: 'f12', name: 'SNS_캠페인_보고서.md', type: 'md', date: '2026-04-10' },
    ],
  },
  {
    id: 'learning',
    name: '학습 & 참고자료',
    files: [
      { id: 'f13', name: 'TypeScript_핵심정리.md', type: 'md', date: '2026-04-13' },
      { id: 'f14', name: 'CSS_Grid_레이아웃.html', type: 'html', date: '2026-04-12' },
      { id: 'f15', name: 'React_19_변경사항.md', type: 'md', date: '2026-04-11' },
    ],
  },
];

const A4_HEIGHT_PX = 1122;
const EXTERNAL_FILES_FOLDER_ID = 'desktop-external-files';

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
  const { authState, signIn, signOut } = useAuth();

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
  const [selectedStyle, setSelectedStyle] = useState(DESIGN_TEMPLATES[5]);

  // 새 기능 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shareMode, setShareMode] = useState<'internal' | 'external'>('external');
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(() => loadLLMConfig());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'folder' | 'file'; targetId: string } | null>(null);
  const [moveTargetModal, setMoveTargetModal] = useState<{ fileId: string; fileName: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = useState(false);
  const [knowledgeProgress, setKnowledgeProgress] = useState('');

  // View Settings
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [docWidth, setDocWidth] = useState('800px');
  const [docPadding, setDocPadding] = useState(60);
  const [isDarkPreview, setIsDarkPreview] = useState(false);
  const [showPageGuides, setShowPageGuides] = useState(false);

  // Split pane
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const splitContainerRef = useRef<HTMLElement>(null);

  // Toast / Upload
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [externalFileStates, setExternalFileStates] = useState<Record<string, ExternalFileState>>({});

  // unified 파이프라인 파서
  const { setMarkdown, result, isParsing } = useMarkdownParser(250);

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

  const updateEditorContent = useCallback((nextContent: string) => {
    SAMPLE_CONTENTS[selectedFileId] = nextContent;
    setContent(nextContent);
  }, [selectedFileId]);

  // 파일 선택 시 샘플 콘텐츠 로드
  useEffect(() => {
    const sampleContent = SAMPLE_CONTENTS[selectedFileId];
    if (sampleContent) {
      setContent(sampleContent);
    }
  }, [selectedFileId]);

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

      // Convert WikiPages to FileItems, organized by type
      const knowledgeFiles: FileItem[] = [];
      const entityPages = wikiResult.pages.filter((p: WikiPage) => p.type === 'entity');
      const conceptPages = wikiResult.pages.filter((p: WikiPage) => p.type === 'concept');
      const sourcePages = wikiResult.pages.filter((p: WikiPage) => p.type === 'source-summary');
      const overviewPage = wikiResult.pages.find((p: WikiPage) => p.type === 'overview');
      const indexPage = wikiResult.pages.find((p: WikiPage) => p.type === 'index');
      const logPage = wikiResult.pages.find((p: WikiPage) => p.type === 'log');

      // Add special pages first
      if (indexPage) {
        const fid = `${knowledgeFolderId}-index`;
        knowledgeFiles.push({ id: fid, name: 'index.md', type: 'md', date: today });
        SAMPLE_CONTENTS[fid] = indexPage.content;
      }
      if (overviewPage) {
        const fid = `${knowledgeFolderId}-overview`;
        knowledgeFiles.push({ id: fid, name: '_overview.md', type: 'md', date: today });
        SAMPLE_CONTENTS[fid] = overviewPage.content;
      }
      if (logPage) {
        const fid = `${knowledgeFolderId}-log`;
        knowledgeFiles.push({ id: fid, name: 'log.md', type: 'md', date: today });
        SAMPLE_CONTENTS[fid] = logPage.content;
      }

      // Add entity pages
      for (const page of entityPages) {
        const fid = `${knowledgeFolderId}-e-${page.id}`;
        knowledgeFiles.push({ id: fid, name: `[엔티티] ${page.title}.md`, type: 'md', date: today });
        SAMPLE_CONTENTS[fid] = page.content;
      }

      // Add concept pages
      for (const page of conceptPages) {
        const fid = `${knowledgeFolderId}-c-${page.id}`;
        knowledgeFiles.push({ id: fid, name: `[개념] ${page.title}.md`, type: 'md', date: today });
        SAMPLE_CONTENTS[fid] = page.content;
      }

      // Add source summary pages
      for (const page of sourcePages) {
        const fid = `${knowledgeFolderId}-s-${page.id}`;
        knowledgeFiles.push({ id: fid, name: `[요약] ${page.title}.md`, type: 'md', date: today });
        SAMPLE_CONTENTS[fid] = page.content;
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

      const { stats } = wikiResult;
      setToast({ message: `지식 체계 생성 완료! (엔티티 ${stats.entityCount}개, 개념 ${stats.conceptCount}개, 총 ${stats.totalPages}페이지)`, type: 'success' });
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
      @media print {
        @page { margin: 2cm; size: A4; }
        body { font-size: 12pt !important; color: #000 !important; background: #fff !important; padding: 0 !important; }
      }
    </style>
  `, [selectedStyle, fontSize, lineHeight, isDarkPreview, docPadding]);

  /* ── Markdown srcDoc ── */
  const mdSrcDoc = useMemo(() => `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">${iframeMdStyles}</head><body>${result.html}</body></html>`, [result.html, iframeMdStyles]);

  /* ── HTML srcDoc ── */
  const htmlSrcDoc = useMemo(() => {
    const trimmed = content.trim().toLowerCase();
    if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) return content;
    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"><\/script>${iframeHtmlStyles}</head><body>${content}</body></html>`;
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
    const iframe = document.getElementById('docwise-render') as HTMLIFrameElement;
    const body = iframe?.contentDocument?.body;
    if (!body) {
      setToast({ message: 'PDF 생성 실패: 렌더링 영역을 찾을 수 없습니다.', type: 'error' });
      return;
    }
    setToast({ message: 'PDF 생성 중...', type: 'success' });
    try {
      const canvas = await html2canvas(body, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const pdfName = currentFile.name.replace(/\.(md|html)$/, '') + '.pdf';
      pdf.save(pdfName);
      setToast({ message: `${pdfName} 다운로드 완료`, type: 'success' });
    } catch (err) {
      setToast({ message: 'PDF 생성 중 오류가 발생했습니다.', type: 'error' });
    }
  }, [currentFile]);

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
    await new Promise(r => setTimeout(r, 500));

    if (shareMode === 'internal') {
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shared-${currentFile.name.replace(/\.(md|html)$/, '')}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: '공유용 HTML 파일이 다운로드되었습니다. 내부 서버에 업로드하여 공유하세요.', type: 'success' });
    } else {
      const plan = getUserPlan();
      const isPaid = plan === 'monthly' || plan === 'lifetime';
      const token = isPaid ? getGithubToken() : null;

      if (isPaid && token) {
        // Paid user with GitHub token → permanent Gist link
        try {
          const gistId = await publishToGist(fullHtml, currentFile.name, token);
          const baseUrl = window.location.hostname === 'localhost'
            ? `${window.location.protocol}//${window.location.host}`
            : 'https://noleji-ai.github.io/docwise';
          const shareUrl = `${baseUrl}/shared/gist:${gistId}`;
          await navigator.clipboard.writeText(shareUrl);
          setToast({ message: `영구 링크가 복사되었습니다!`, type: 'success' });
        } catch (err) {
          setToast({ message: `Gist 업로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, type: 'error' });
        }
      } else {
        // Free user or no token → local sharing
        const shareId = Date.now().toString(36);
        localStorage.setItem('docwise-shared-' + shareId, fullHtml);
        const ip = await getLocalIP();
        const shareUrl = `${window.location.protocol}//${ip}:${window.location.port}/shared/${shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        const notice = isPaid && !token
          ? '로컬 링크가 복사되었습니다. (영구 링크는 설정에서 GitHub 토큰을 등록하세요)'
          : '로컬 링크가 복사되었습니다. (같은 네트워크에서만 접근 가능)';
        setToast({ message: notice, type: 'success' });
      }
    }
    setIsUploading(false);
  }, [renderMode, mdSrcDoc, htmlSrcDoc, shareMode, currentFile]);

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

  // When the viewer asks the main window to edit a file, load that exact file into the editor state.
  useEffect(() => {
    if (!window.electronAPI?.onOpenInEditor) return undefined;

    return window.electronAPI.onOpenInEditor(async (filePath) => {
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
  }, []);

  // Open preview in viewer (Electron) or toggle fullscreen preview (web)
  const handleOpenPreview = useCallback(() => {
    const api = (window as any).electronAPI;
    if (api?.openViewer) {
      const srcDoc = renderMode === 'md' ? mdSrcDoc : htmlSrcDoc;
      api.openViewer(srcDoc, currentFile.name);
    } else {
      setIsEditorVisible(false);
    }
  }, [renderMode, mdSrcDoc, htmlSrcDoc, currentFile.name]);

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
            <div className="w-9 h-9 rounded-xl bg-[#1A202C] flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-black/10">d</div>
            <div>
              <h1 className="text-base font-black tracking-tighter uppercase italic">docwise</h1>
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
            <div className="mt-3 pt-3 border-t border-[#E2E8F0]/50">
              <button
                onClick={handleGenerateKnowledge}
                disabled={isGeneratingKnowledge || !llmConfig.isConnected}
                className={`w-full px-3 py-2.5 text-[11px] font-bold rounded-xl transition-all flex items-center space-x-2 ${
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
            </div>
          </div>
        </nav>

        <footer className="border-t border-[#E2E8F0] bg-white">
          <UsageBadge />
          <div className="p-4 pt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-1.5 h-1.5 rounded-full ${llmConfig.isConnected ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'} animate-pulse`} />
              <span className="text-[9px] font-black text-[#1A202C]/30 uppercase tracking-tighter">{llmConfig.isConnected ? 'LLM Connected' : 'System Online'}</span>
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
              <div className="h-9 flex-shrink-0 border-b border-[#E2E8F0] bg-[#F7FAFC]/50 flex items-center justify-between px-3">
                <span className="text-[9px] font-black text-[#1A202C]/25 uppercase tracking-[0.2em]">Editor</span>
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
                id="docwise-render"
                title="docwise-render"
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
                  <input type="range" min="12" max="28" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer" style={{ accentColor: selectedStyle.accent }} />
                </div>
                {/* 줄 간격 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black"><span className="opacity-30 uppercase">Line Height</span><span style={{ color: selectedStyle.accent }}>{lineHeight.toFixed(1)}</span></div>
                  <input type="range" min="14" max="26" value={lineHeight * 10} onChange={(e) => setLineHeight(parseInt(e.target.value) / 10)} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer" style={{ accentColor: selectedStyle.accent }} />
                </div>
                {/* 여백 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black"><span className="opacity-30 uppercase">Padding</span><span style={{ color: selectedStyle.accent }}>{docPadding}px</span></div>
                  <input type="range" min="20" max="100" step="10" value={docPadding} onChange={(e) => setDocPadding(parseInt(e.target.value))} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer" style={{ accentColor: selectedStyle.accent }} />
                </div>
                {/* 문서 폭 */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black opacity-30 uppercase">Width</span>
                  <div className="grid grid-cols-4 gap-1">
                    {['640px', '800px', '1200px', '100%'].map(w => (
                      <button key={w} onClick={() => setDocWidth(w)} className={`py-1.5 text-[7px] font-black border rounded-md transition-all ${docWidth === w ? 'bg-[#1A202C] text-white border-[#1A202C]' : 'bg-white text-[#1A202C]/30 border-[#E2E8F0] hover:border-[#10B981]'}`}>
                        {w === '100%' ? 'FULL' : w}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 다크모드 + 페이지 가이드 */}
                <div className="flex gap-1.5">
                  <button onClick={() => setIsDarkPreview(!isDarkPreview)} className={`flex-1 py-2 rounded-lg border font-black text-[8px] transition-all flex items-center justify-center space-x-1 ${isDarkPreview ? 'bg-[#1A202C] border-[#1A202C] text-white' : 'bg-white border-[#E2E8F0] text-[#1A202C]/30'}`}>
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
                <div key={tmpl.id} onClick={() => { setSelectedStyle(tmpl); setIsStyleModalOpen(false); }}
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
