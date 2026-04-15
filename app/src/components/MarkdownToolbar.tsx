import React, { useCallback } from 'react';
import {
  Undo2, Redo2, Bold, Italic, Strikethrough, Code, Link, Image,
  List, ListOrdered, CheckSquare, Quote, FileCode2, Table2, Minus,
  IndentIncrease, IndentDecrease,
} from 'lucide-react';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  setContent: (value: string) => void;
}

type ToolAction =
  | { type: 'wrap'; prefix: string; suffix: string }
  | { type: 'linePrefix'; prefix: string }
  | { type: 'blockInsert'; block: string };

interface ToolButton {
  id: string;
  title: string;
  icon?: React.ReactNode;
  text?: string;
  action: ToolAction | 'undo' | 'redo';
}

const SZ = 15;

const TABLE_TEMPLATE = `\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`;
const CODE_BLOCK_TEMPLATE = '\n```\n\n```\n';

const GROUPS: ToolButton[][] = [
  [
    { id: 'undo', title: 'Undo (Ctrl+Z)', icon: <Undo2 size={SZ} />, action: 'undo' },
    { id: 'redo', title: 'Redo (Ctrl+Shift+Z)', icon: <Redo2 size={SZ} />, action: 'redo' },
  ],
  [
    { id: 'h1', title: 'Heading 1', text: 'H1', action: { type: 'linePrefix', prefix: '# ' } },
    { id: 'h2', title: 'Heading 2', text: 'H2', action: { type: 'linePrefix', prefix: '## ' } },
    { id: 'h3', title: 'Heading 3', text: 'H3', action: { type: 'linePrefix', prefix: '### ' } },
    { id: 'h4', title: 'Heading 4', text: 'H4', action: { type: 'linePrefix', prefix: '#### ' } },
  ],
  [
    { id: 'bold', title: 'Bold (Ctrl+B)', icon: <Bold size={SZ} />, action: { type: 'wrap', prefix: '**', suffix: '**' } },
    { id: 'italic', title: 'Italic (Ctrl+I)', icon: <Italic size={SZ} />, action: { type: 'wrap', prefix: '*', suffix: '*' } },
    { id: 'strike', title: 'Strikethrough', icon: <Strikethrough size={SZ} />, action: { type: 'wrap', prefix: '~~', suffix: '~~' } },
    { id: 'code', title: 'Inline Code', icon: <Code size={SZ} />, action: { type: 'wrap', prefix: '`', suffix: '`' } },
  ],
  [
    { id: 'link', title: 'Insert Link', icon: <Link size={SZ} />, action: { type: 'wrap', prefix: '[', suffix: '](url)' } },
    { id: 'image', title: 'Insert Image', icon: <Image size={SZ} />, action: { type: 'wrap', prefix: '![', suffix: '](url)' } },
  ],
  [
    { id: 'ul', title: 'Bullet List', icon: <List size={SZ} />, action: { type: 'linePrefix', prefix: '- ' } },
    { id: 'ol', title: 'Numbered List', icon: <ListOrdered size={SZ} />, action: { type: 'linePrefix', prefix: '1. ' } },
    { id: 'check', title: 'Checkbox', icon: <CheckSquare size={SZ} />, action: { type: 'linePrefix', prefix: '- [ ] ' } },
  ],
  [
    { id: 'quote', title: 'Blockquote', icon: <Quote size={SZ} />, action: { type: 'linePrefix', prefix: '> ' } },
    { id: 'codeblock', title: 'Code Block', icon: <FileCode2 size={SZ} />, action: { type: 'blockInsert', block: CODE_BLOCK_TEMPLATE } },
    { id: 'table', title: 'Insert Table', icon: <Table2 size={SZ} />, action: { type: 'blockInsert', block: TABLE_TEMPLATE } },
    { id: 'hr', title: 'Horizontal Rule', icon: <Minus size={SZ} />, action: { type: 'blockInsert', block: '\n---\n' } },
  ],
  [
    { id: 'indent', title: 'Indent', icon: <IndentIncrease size={SZ} />, action: { type: 'linePrefix', prefix: '  ' } },
    { id: 'outdent', title: 'Outdent', icon: <IndentDecrease size={SZ} />, action: 'undo' },
  ],
];

export default function MarkdownToolbar({ textareaRef, content, setContent }: MarkdownToolbarProps) {
  const getLineStart = useCallback((text: string, pos: number): number => {
    const idx = text.lastIndexOf('\n', pos - 1);
    return idx === -1 ? 0 : idx + 1;
  }, []);

  const applyWrap = useCallback((prefix: string, suffix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const before = content.slice(0, start);
    const after = content.slice(end);
    setContent(before + prefix + selected + suffix + after);
    const cursorStart = start + prefix.length;
    const cursorEnd = cursorStart + selected.length;
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(cursorStart, cursorEnd); });
  }, [textareaRef, content, setContent]);

  const applyLinePrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = getLineStart(content, start);
    const lineEnd = content.indexOf('\n', start);
    const realEnd = lineEnd === -1 ? content.length : lineEnd;
    const line = content.slice(lineStart, realEnd);

    let newLine: string;
    let cursorOffset: number;

    const headingMatch = prefix.match(/^(#{1,6})\s$/);
    if (headingMatch) {
      const stripped = line.replace(/^#{1,6}\s*/, '');
      const existing = line.match(/^(#{1,6})\s/);
      if (existing && existing[1] === headingMatch[1]) {
        newLine = stripped;
        cursorOffset = -existing[0].length;
      } else {
        newLine = prefix + stripped;
        cursorOffset = existing ? prefix.length - existing[0].length : prefix.length;
      }
    } else {
      newLine = prefix + line;
      cursorOffset = prefix.length;
    }

    setContent(content.slice(0, lineStart) + newLine + content.slice(realEnd));
    const newCursor = Math.max(lineStart, start + cursorOffset);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(newCursor, newCursor); });
  }, [textareaRef, content, setContent, getLineStart]);

  const applyBlockInsert = useCallback((block: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    setContent(content.slice(0, pos) + block + content.slice(pos));
    const cursorPos = pos + block.indexOf('\n', 1) + 1;
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(cursorPos, cursorPos); });
  }, [textareaRef, content, setContent]);

  const applyOutdent = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = getLineStart(content, start);
    const lineEnd = content.indexOf('\n', start);
    const realEnd = lineEnd === -1 ? content.length : lineEnd;
    const line = content.slice(lineStart, realEnd);
    let newLine: string;
    let removed: number;
    if (line.startsWith('  ')) { newLine = line.slice(2); removed = 2; }
    else if (line.startsWith('\t')) { newLine = line.slice(1); removed = 1; }
    else return;
    setContent(content.slice(0, lineStart) + newLine + content.slice(realEnd));
    const newCursor = Math.max(lineStart, start - removed);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(newCursor, newCursor); });
  }, [textareaRef, content, setContent, getLineStart]);

  const handleAction = useCallback((btn: ToolButton) => {
    const ta = textareaRef.current;
    if (btn.id === 'outdent') { applyOutdent(); return; }
    if (btn.action === 'undo' || btn.action === 'redo') {
      if (ta) ta.focus();
      document.execCommand(btn.action);
      return;
    }
    const action = btn.action as ToolAction;
    switch (action.type) {
      case 'wrap': applyWrap(action.prefix, action.suffix); break;
      case 'linePrefix': applyLinePrefix(action.prefix); break;
      case 'blockInsert': applyBlockInsert(action.block); break;
    }
  }, [textareaRef, applyWrap, applyLinePrefix, applyBlockInsert, applyOutdent]);

  return (
    <div className="h-10 flex-shrink-0 border-b border-[#E2E8F0] bg-white flex items-center px-2.5 gap-0.5 overflow-x-auto">
      {GROUPS.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <div className="h-5 w-px bg-[#E2E8F0] mx-0.5 flex-shrink-0" />}
          {group.map((btn) => (
            <button
              key={btn.id}
              title={btn.title}
              onClick={() => handleAction(btn)}
              className="w-[28px] h-[28px] flex items-center justify-center rounded-md text-[#1A202C]/35 hover:text-[#10B981] hover:bg-[#10B981]/10 transition-colors flex-shrink-0 active:scale-90"
            >
              {btn.text
                ? <span className="font-black text-[9px] leading-none select-none">{btn.text}</span>
                : btn.icon}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
