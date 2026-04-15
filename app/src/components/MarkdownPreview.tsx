import { useEffect, useRef } from 'react';
import type { ParseResult } from '../hooks/useMarkdownParser';

/**
 * 마크다운 미리보기 패널
 * - asome-design-md 스타일 적용
 * - HTML을 dangerouslySetInnerHTML로 렌더링
 * - 체크박스 인터랙션 지원
 */

interface MarkdownPreviewProps {
  result: ParseResult;
  isParsing: boolean;
}

export default function MarkdownPreview({ result, isParsing }: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 체크박스를 클릭 가능하게 처리
  useEffect(() => {
    if (!containerRef.current) return;
    const checkboxes = containerRef.current.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
      (cb as HTMLInputElement).disabled = true;
      cb.classList.add('asome-checkbox');
    });
  }, [result.html]);

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* 파싱 인디케이터 */}
      {isParsing && (
        <div className="absolute top-3 right-4 z-10">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      )}

      {/* 미리보기 콘텐츠 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-12 py-10 asome-preview"
        dangerouslySetInnerHTML={{ __html: result.html }}
      />

      {/* 하단 통계 바 */}
      <div className="flex-shrink-0 h-8 border-t border-[#E2E8F0] bg-[#F7FAFC]/50 flex items-center px-4 gap-6 text-[11px] font-medium text-[#A0AEC0]">
        <span>{result.wordCount.toLocaleString()} 단어</span>
        <span>{result.charCount.toLocaleString()} 자</span>
        <span>{result.lineCount} 줄</span>
        <span>{result.headings.length} 섹션</span>
      </div>
    </div>
  );
}
