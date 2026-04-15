import { useState, useEffect, useRef, useCallback } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

/**
 * unified pipeline: Markdown → HTML 실시간 변환
 * 
 * - remarkGfm: 표, 체크리스트, 취소선, 자동 링크
 * - rehypeHighlight: 코드블록 구문 하이라이팅
 * - rehypeRaw: 인라인 HTML 허용
 * - 300ms 디바운스로 타이핑 중 과도한 파싱 방지
 */

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeHighlight, { detect: true, ignoreMissing: true })
  .use(rehypeStringify);

export interface ParseResult {
  html: string;
  wordCount: number;
  charCount: number;
  lineCount: number;
  headings: { level: number; text: string }[];
}

export function useMarkdownParser(debounceMs = 300) {
  const [markdown, setMarkdown] = useState('');
  const [result, setResult] = useState<ParseResult>({
    html: '',
    wordCount: 0,
    charCount: 0,
    lineCount: 0,
    headings: [],
  });
  const [isParsing, setIsParsing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parse = useCallback(async (content: string) => {
    setIsParsing(true);
    try {
      // YAML frontmatter 제거 (--- ... --- 블록)
      const stripped = content.replace(/^---[\s\S]*?---\n?/, '');

      const file = await processor.process(stripped);
      const html = String(file);

      // 통계 추출
      const plainText = stripped.replace(/[#*`\[\]()>|_~-]/g, '').trim();
      const words = plainText.split(/\s+/).filter(Boolean);
      const lines = content.split('\n');

      // 헤딩 목록 추출
      const headings: { level: number; text: string }[] = [];
      for (const line of lines) {
        const match = line.match(/^(#{1,6})\s+(.+)/);
        if (match) {
          headings.push({ level: match[1].length, text: match[2].replace(/[*`]/g, '') });
        }
      }

      setResult({
        html,
        wordCount: words.length,
        charCount: content.length,
        lineCount: lines.length,
        headings,
      });
    } catch (err) {
      console.error('[docwise] Markdown 파싱 오류:', err);
    } finally {
      setIsParsing(false);
    }
  }, []);

  // 디바운스 처리
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => parse(markdown), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [markdown, debounceMs, parse]);

  return { markdown, setMarkdown, result, isParsing };
}
