import type { ParseResult } from '../hooks/useMarkdownParser';

/**
 * TOC (Table of Contents) 사이드 네비게이션
 * 미리보기 패널 내 헤딩을 기반으로 자동 생성
 */
interface TocPanelProps {
  headings: ParseResult['headings'];
}

export default function TocPanel({ headings }: TocPanelProps) {
  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1">
      <h3 className="text-[11px] font-bold text-[#1A202C]/40 uppercase tracking-widest px-2 mb-3">
        목차
      </h3>
      {headings.map((h, i) => (
        <div
          key={`${h.text}-${i}`}
          className="flex items-center text-sm cursor-pointer transition-colors group"
          style={{ paddingLeft: `${(h.level - 1) * 16 + 8}px` }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 transition-colors ${
              h.level === 1
                ? 'bg-accent'
                : h.level === 2
                ? 'bg-[#1A202C]/30'
                : 'bg-[#1A202C]/15'
            }`}
          />
          <span
            className={`truncate group-hover:text-accent transition-colors ${
              h.level === 1
                ? 'font-bold text-[#1A202C]'
                : h.level === 2
                ? 'font-semibold text-[#1A202C]/70'
                : 'text-[#1A202C]/50'
            }`}
          >
            {h.text}
          </span>
        </div>
      ))}
    </nav>
  );
}
