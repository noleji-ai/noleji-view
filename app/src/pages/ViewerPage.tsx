import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { Sun, Moon, Pencil, RefreshCw, X } from 'lucide-react';
import type { ViewerSettings } from '../shared/viewerSettings';
import { DEFAULT_VIEWER_SETTINGS } from '../shared/viewerSettings';
import { loadViewerSettings } from '../shared/settingsStore';
import { DESIGN_TEMPLATES } from '../data/designTemplates';

/* ── Markdown processor (same pipeline as useMarkdownParser) ── */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeHighlight, { detect: true, ignoreMissing: true })
  .use(rehypeStringify);

/* ── CSS generator (same pattern as EditorPage iframeMdStyles) ── */
function generateViewerCSS(settings: ViewerSettings): string {
  const template = DESIGN_TEMPLATES.find(t => t.id === settings.templateId) ?? DESIGN_TEMPLATES[5];
  const accent = template.accent;
  const dark = settings.isDark;
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
      font-family: ${template.font}, 'Source Serif 4', serif;
      font-size: ${settings.fontSize}px;
      line-height: ${settings.lineHeight};
      color: ${fg};
      background: ${bg};
      padding: ${settings.padding}px;
      -webkit-font-smoothing: antialiased;
      word-break: keep-all;
      overflow-wrap: break-word;
    }
    ::selection { background: ${accent}30; }

    h1 {
      font-family: 'Inter', sans-serif;
      font-weight: 900; font-size: 2.6em; letter-spacing: -0.04em;
      color: ${fgStrong};
      border-bottom: 4px solid ${accent}; padding-bottom: 20px; margin-bottom: 32px; line-height: 1.15;
    }
    h1 + p::first-letter {
      font-size: 3em; font-weight: 700; float: left; line-height: 1;
      margin-right: 8px; margin-top: 4px; color: ${accent}; font-family: 'Inter', sans-serif;
    }

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

    h5 {
      font-family: 'Inter', sans-serif;
      font-weight: 700; font-size: 0.8em;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: ${dimFg}; opacity: 0.8;
      margin-top: 24px; margin-bottom: 8px;
    }

    h6 {
      font-family: 'Inter', sans-serif;
      font-weight: 600; font-size: 0.75em;
      text-transform: uppercase; letter-spacing: 0.15em;
      color: ${dimFg}; opacity: 0.6;
      margin-top: 20px; margin-bottom: 6px;
    }

    p { margin-bottom: 1.2em; line-height: ${settings.lineHeight}; }

    strong { color: ${fgStrong}; font-weight: 700; }
    em { font-style: italic; color: ${dimFg}; }
    del { text-decoration: line-through; color: ${dimFg}; opacity: 0.5; }

    a { color: ${accent}; text-decoration: none; border-bottom: 1px solid ${accent}40; transition: all 0.2s; font-weight: 500; }
    a:hover { border-bottom-color: ${accent}; }

    hr {
      border: none; height: 2px; margin: 2.5em 0; border-radius: 1px;
      background: linear-gradient(to right, transparent, ${accent}50, transparent);
    }

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

    ul { margin: 1em 0 1.5em; padding-left: 0; list-style: none; }
    ul > li { position: relative; padding-left: 1.5em; margin-bottom: 0.45em; line-height: 1.7; }
    ul > li::before { content: '\\2726'; position: absolute; left: 0; color: ${accent}; font-size: 0.65em; top: 0.5em; }

    ol { margin: 1em 0 1.5em; padding-left: 0; list-style: none; counter-reset: ol-counter; }
    ol > li { position: relative; padding-left: 2.2em; margin-bottom: 0.45em; line-height: 1.7; counter-increment: ol-counter; }
    ol > li::before {
      content: counter(ol-counter); position: absolute; left: 0; top: 0.1em;
      width: 1.5em; height: 1.5em; background: ${fgStrong}; color: ${bg};
      border-radius: 50%; font-size: 0.72em; font-weight: 700;
      display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;
    }

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
      content: '\\2713'; color: white; font-size: 11px; font-weight: 700;
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    }

    code:not(pre code) {
      font-family: 'JetBrains Mono', monospace; font-size: 0.86em;
      background: ${dark ? '#2D3748' : '#EDF2F7'}; color: ${dark ? '#FC8181' : '#E53E3E'};
      padding: 0.15em 0.5em; border-radius: 6px; font-weight: 500;
      border: 1px solid ${borderClr};
    }

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

    .hljs-keyword { color: #B794F4; }
    .hljs-string { color: #68D391; }
    .hljs-number { color: #F6AD55; }
    .hljs-comment { color: #718096; font-style: italic; }
    .hljs-function, .hljs-title { color: #63B3ED; }
    .hljs-built_in, .hljs-type { color: #F6AD55; }
    .hljs-literal { color: #FC8181; }
    .hljs-attr { color: #B794F4; }
    .hljs-variable, .hljs-params { color: #E2E8F0; }
    .hljs-meta { color: #718096; }
    .hljs-property { color: #63B3ED; }

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

    img { max-width: 100%; border-radius: 12px; margin: 1.5em 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid ${borderClr}; }

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
}

export default function ViewerPage() {
  const location = useLocation();
  const filePath = new URLSearchParams(location.search).get('file');
  const fileName = filePath ? filePath.split('/').pop() ?? filePath : '';

  const [content, setContent] = useState<string>('');
  const [html, setHtml] = useState<string>('');
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULT_VIEWER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOpeningInEditor, setIsOpeningInEditor] = useState(false);
  const [editorSessionState, setEditorSessionState] = useState<'idle' | 'opening' | 'opened'>('idle');

  const isHtmlFile = useMemo(() => {
    if (!filePath) return false;
    const lower = filePath.toLowerCase();
    return lower.endsWith('.html') || lower.endsWith('.htm');
  }, [filePath]);

  /* ── Load viewer settings ── */
  useEffect(() => {
    loadViewerSettings().then(setSettings);
  }, []);

  /* ── Listen for settings changes from Electron ── */
  useEffect(() => {
    if (window.electronAPI?.onSettingsChanged) {
      const cleanup = window.electronAPI.onSettingsChanged((s) => setSettings(s as ViewerSettings));
      return cleanup;
    }
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.onEditorOpened || !filePath) return undefined;
    return window.electronAPI.onEditorOpened((openedPath) => {
      if (openedPath === filePath) {
        setEditorSessionState('opened');
        setIsOpeningInEditor(false);
      }
    });
  }, [filePath]);

  useEffect(() => {
    setEditorSessionState('idle');
    setIsOpeningInEditor(false);
  }, [filePath]);

  const reloadViewerContent = useCallback(async () => {
    if (!filePath || !window.electronAPI?.readFile) return;
    setLoading(true);
    try {
      const nextContent = await window.electronAPI.readFile(filePath);
      setContent(nextContent);
      setError(null);
    } catch {
      setError('파일을 다시 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  /* ── Load file content ── */
  useEffect(() => {
    if (!filePath) {
      setError('파일 경로가 지정되지 않았습니다.');
      setLoading(false);
      return;
    }

    if (!window.electronAPI) {
      setError('Electron 전용 기능입니다.');
      setLoading(false);
      return;
    }

    setLoading(true);
    window.electronAPI.readFile(filePath)
      .then((text) => {
        setContent(text);
        setError(null);
      })
      .catch(() => {
        setError('파일을 읽을 수 없습니다.');
      })
      .finally(() => setLoading(false));
  }, [filePath]);

  /* ── Parse markdown to HTML ── */
  const parseMarkdown = useCallback(async (md: string) => {
    const stripped = md.replace(/^---[\s\S]*?---\n?/, '');
    const file = await processor.process(stripped);
    return String(file);
  }, []);

  useEffect(() => {
    if (isHtmlFile || !content) return;
    parseMarkdown(content)
      .then(setHtml)
      .catch(() => setError('마크다운 파싱 중 오류가 발생했습니다.'));
  }, [content, isHtmlFile, parseMarkdown]);

  /* ── Build srcDoc ── */
  const srcDoc = useMemo(() => {
    if (isHtmlFile) {
      const trimmed = content.trim().toLowerCase();
      if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
        return content;
      }
      return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">${generateViewerCSS(settings)}</head><body>${content}</body></html>`;
    }
    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">${generateViewerCSS(settings)}</head><body>${html}</body></html>`;
  }, [content, html, isHtmlFile, settings]);

  /* ── Open in editor handler ── */
  const handleEditInApp = useCallback(() => {
    if (window.electronAPI?.openInEditor) {
      setEditorSessionState('opening');
      setIsOpeningInEditor(true);
      window.electronAPI.openInEditor(filePath!);
      window.setTimeout(() => {
        setIsOpeningInEditor(false);
        setEditorSessionState((prev) => (prev === 'opening' ? 'idle' : prev));
      }, 3000);
    } else {
      setShowInstallPrompt(true);
    }
  }, [filePath]);

  /* ── Error state ── */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="text-center p-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1A202C] flex items-center justify-center text-white font-bold text-2xl">d</div>
          <h1 className="text-2xl font-black text-[#1A202C] mb-2">{error}</h1>
          <p className="text-sm text-[#1A202C]/50">
            {error === 'Electron 전용 기능입니다.'
              ? '뷰어 모드는 docwise 데스크톱 앱에서만 사용할 수 있습니다.'
              : '파일 경로를 확인하고 다시 시도해주세요.'}
          </p>
        </div>
      </div>
    );
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-white overflow-hidden">
      {/* ── Top bar ── */}
      <header className="h-10 flex-shrink-0 border-b border-[#E2E8F0] flex items-center justify-between px-5 bg-white electron-drag electron-titlebar-pad">
        <div className="flex items-center space-x-3 electron-no-drag">
          <div className="w-6 h-6 rounded-md bg-[#1A202C] flex items-center justify-center text-white font-bold text-[10px]">d</div>
          <span className="text-[12px] font-bold text-[#1A202C] truncate max-w-[400px]">{fileName}</span>
          <span className="text-[9px] font-black text-[#1A202C]/20 uppercase tracking-wider">
            {isHtmlFile ? 'HTML' : 'MARKDOWN'}
          </span>
        </div>
        <div className="flex items-center space-x-2 electron-no-drag">
          {/* Edit button */}
          <button
            onClick={handleEditInApp}
            disabled={isOpeningInEditor}
            className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-[#10B981]/10 transition-all electron-no-drag disabled:opacity-60 disabled:cursor-wait"
          >
            <Pencil size={11} className="text-[#10B981]" />
            <span className="text-[9px] font-black text-[#10B981] uppercase tracking-wider">
              {isOpeningInEditor ? '에디터 여는 중' : '수정하기'}
            </span>
          </button>
          {settings.isDark
            ? <Moon size={12} className="text-[#1A202C]/30" />
            : <Sun size={12} className="text-[#1A202C]/30" />}
          <span className="text-[9px] font-black text-[#1A202C]/20 uppercase">
            {settings.isDark ? 'Dark' : 'Light'}
          </span>
        </div>
      </header>

      {editorSessionState !== 'idle' && (
        <div className="flex-shrink-0 border-b border-[#10B981]/15 bg-[#F0FFF4] px-5 py-2.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#10B981]">
              {editorSessionState === 'opened' ? 'Editing In Editor' : 'Opening Editor'}
            </p>
            <p className="text-[12px] font-semibold text-[#1A202C]">
              {editorSessionState === 'opened'
                ? '이 창은 참고용 뷰어로 유지되고 있습니다.'
                : '에디터 창으로 파일을 넘기는 중입니다.'}
            </p>
            <p className="text-[10px] text-[#1A202C]/45">
              {editorSessionState === 'opened'
                ? '저장 후 다시 불러오기를 누르면 최신 원본 파일 내용을 이 창에서 확인할 수 있습니다.'
                : '에디터가 실제로 파일을 열면 이 상태가 자동으로 전환됩니다.'}
            </p>
          </div>
          <div className="flex items-center gap-2 electron-no-drag">
            <button
              onClick={() => { void reloadViewerContent(); }}
              className="inline-flex items-center gap-1 rounded-lg border border-[#10B981]/25 bg-white px-2.5 py-1.5 text-[10px] font-black text-[#10B981] transition-colors hover:bg-[#ECFDF5]"
            >
              <RefreshCw size={11} />
              <span>다시 불러오기</span>
            </button>
            <button
              onClick={() => window.close()}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[10px] font-black text-[#1A202C]/55 transition-colors hover:bg-[#F7FAFC] hover:text-[#1A202C]"
            >
              <X size={11} />
              <span>창 닫기</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Document viewer ── */}
      <div className="flex-grow overflow-y-auto bg-[#F7FAFC] flex justify-center">
        <div
          className="bg-white shadow-lg min-h-full"
          style={{ width: settings.docWidth, maxWidth: '100%' }}
        >
          <iframe
            title="docwise-viewer"
            className="w-full h-full border-none"
            style={{ minHeight: '100vh' }}
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* ── Install prompt modal ── */}
      {showInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowInstallPrompt(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#1A202C] flex items-center justify-center text-white font-bold text-xl">d</div>
            <h2 className="text-lg font-black text-[#1A202C] text-center mb-2">데스크톱 앱이 필요합니다</h2>
            <p className="text-sm text-[#1A202C]/60 text-center mb-6">
              docwise 데스크톱 앱에서 편집할 수 있습니다.
            </p>
            <div className="space-y-2">
              <a
                href="https://github.com/noleji-ai/docwise/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] transition-colors text-center block"
              >
                다운로드 페이지로 이동
              </a>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="w-full py-2.5 rounded-xl bg-white text-[#1A202C] text-sm font-bold border border-[#E2E8F0] hover:bg-[#F7FAFC] transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
