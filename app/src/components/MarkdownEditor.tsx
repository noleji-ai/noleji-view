import { useRef, useEffect, useMemo } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection, crosshairCursor, highlightSpecialChars, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, indentOnInput, bracketMatching, foldGutter, foldKeymap, HighlightStyle } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { tags } from '@lezer/highlight';

/* ── docwise 에디터 테마 (라이트, asome-design 계열) ── */
const docwiseTheme = EditorView.theme({
  '&': {
    fontSize: '15px',
    fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", "Menlo", monospace',
    height: '100%',
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    caretColor: '#10B981',
    padding: '24px 32px',
    lineHeight: '1.8',
    maxWidth: '800px',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#10B981',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#10B98120',
  },
  '.cm-activeLine': {
    backgroundColor: '#10B98108',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#10B98108',
    color: '#10B981',
  },
  '.cm-gutters': {
    backgroundColor: '#F7FAFC',
    color: '#CBD5E0',
    border: 'none',
    paddingRight: '8px',
    fontSize: '12px',
    fontFamily: '"JetBrains Mono", monospace',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
    minWidth: '40px',
  },
  '.cm-foldGutter .cm-gutterElement': {
    padding: '0 4px',
    cursor: 'pointer',
    color: '#A0AEC0',
  },
  '.cm-foldGutter .cm-gutterElement:hover': {
    color: '#10B981',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-searchMatch': {
    backgroundColor: '#FEF3C7',
    outline: '1px solid #F59E0B40',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#10B98115',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#10B98130',
    outline: '1px solid #10B98160',
  },
  '.cm-placeholder': {
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  // 스크롤바
  '.cm-scroller::-webkit-scrollbar': {
    width: '6px',
  },
  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: '#CBD5E0',
    borderRadius: '3px',
  },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: '#A0AEC0',
  },
}, { dark: false });

/* ── Markdown 구문 하이라이팅 ── */
const markdownHighlight = HighlightStyle.define([
  // 헤딩
  { tag: tags.heading1, color: '#1A202C', fontWeight: '800', fontSize: '1.6em' },
  { tag: tags.heading2, color: '#1A202C', fontWeight: '700', fontSize: '1.35em' },
  { tag: tags.heading3, color: '#2D3748', fontWeight: '700', fontSize: '1.15em' },
  { tag: tags.heading4, color: '#2D3748', fontWeight: '600', fontSize: '1.05em' },
  // 강조
  { tag: tags.strong, fontWeight: '700', color: '#1A202C' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#4A5568' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#A0AEC0' },
  // 코드
  { tag: tags.monospace, fontFamily: '"JetBrains Mono", monospace', backgroundColor: '#EDF2F7', padding: '2px 4px', borderRadius: '3px', color: '#E53E3E' },
  // 링크
  { tag: tags.link, color: '#10B981', textDecoration: 'underline' },
  { tag: tags.url, color: '#10B981', textDecoration: 'underline' },
  // 리스트
  { tag: tags.list, color: '#718096' },
  // 인용
  { tag: tags.quote, color: '#718096', fontStyle: 'italic' },
  // 메타 (frontmatter, HTML 태그)
  { tag: tags.meta, color: '#A0AEC0' },
  { tag: tags.processingInstruction, color: '#10B981' },
  // 구분선
  { tag: tags.contentSeparator, color: '#CBD5E0' },
  // 코드블록 내부 키워드
  { tag: tags.keyword, color: '#805AD5' },
  { tag: tags.string, color: '#10B981' },
  { tag: tags.number, color: '#DD6B20' },
  { tag: tags.comment, color: '#A0AEC0', fontStyle: 'italic' },
  { tag: tags.bool, color: '#DD6B20' },
  { tag: tags.null, color: '#DD6B20' },
]);

/* ── 샘플 콘텐츠 ── */
const DEFAULT_CONTENT = `---
title: Noleji View 시작하기
author: Noleji AI
date: 2026-04-14
tags: [가이드, 문서관리, 위키]
---

# Noleji View 시작하기

> 원본을 훼손하지 않는 **로컬 우선** 마크다운 관리 도구입니다.

## 핵심 기능

**Noleji View**는 다음과 같은 기능을 제공합니다:

1. **비파괴 워크스페이스** — 원본 파일을 읽기만 하며, 앱 내부 폴더에 복사본을 생성
2. **실시간 품질 검수** — 링크, 이미지, 헤더 구조 오류를 실시간 탐지
3. **전문가 스타일 출력** — 클릭 한 번으로 고품질 PDF 및 HTML로 변환
4. **프로젝트별 위키화** — 문서를 지식 자산으로 체계적으로 관리

## 사용 예시

\`\`\`typescript
// 문서를 프로젝트에 할당하기
const result = await nolejiView.importFile(
  '/path/to/document.md',
  '코웨이 루틴 업무'
);
console.log(result.workingCopy);
\`\`\`

## 마크다운 요소 테스트

### 표 (Table)

| 기능 | 상태 | 비고 |
|------|------|------|
| 에디터 | ✅ 완료 | CodeMirror 6 |
| 미리보기 | ✅ 완료 | 실시간 파싱 |
| 검수 | 🔄 진행중 | 8개 항목 |
| 내보내기 | 📋 예정 | PDF/HTML |

### 체크리스트

- [x] Phase 1: 기초 레이아웃
- [x] Phase 2: CodeMirror + 실시간 미리보기
- [ ] Phase 3: 검수 엔진 고도화
- [ ] Phase 4: 내보내기 기능

### 인용문

> *"좋은 문서는 좋은 제품만큼 가치가 있다."*
> — Noleji View 설계 원칙

---

이 문서를 자유롭게 편집하며 우측 미리보기에서 결과를 확인하세요.
`;

/* ── Props ── */
interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

/* ── 컴포넌트 ── */
export default function MarkdownEditor({ initialContent, onChange }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const handleChange = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          onChange(update.state.doc.toString());
        }
      }),
    [onChange],
  );

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialContent ?? DEFAULT_CONTENT,
      extensions: [
        // 기본 편집 기능
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        rectangularSelection(),
        crosshairCursor(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightActiveLine(),
        highlightSelectionMatches(),

        // 키맵
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),

        // Markdown 언어 지원 (코드블록 내 하이라이팅 포함)
        markdown({
          base: markdownLanguage,
          codeLanguages: languages,
        }),

        // 테마 + 하이라이팅
        docwiseTheme,
        syntaxHighlighting(markdownHighlight),

        // placeholder
        placeholder('마크다운을 작성하세요...'),

        // 변경 이벤트
        handleChange,

        // 줄 바꿈
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // 초기 콘텐츠 전달
    if (onChange) {
      onChange(state.doc.toString());
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-hidden bg-white"
    />
  );
}
