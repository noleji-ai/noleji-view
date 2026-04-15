import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import type { ParseResult } from './types';

/**
 * Create a reusable Markdown processor backed by the unified pipeline:
 *
 *   remarkParse -> remarkGfm -> remarkRehype -> rehypeRaw -> rehypeHighlight -> rehypeStringify
 *
 * Features:
 * - GFM: tables, checklists, strikethrough, autolinks
 * - rehypeHighlight: code-block syntax highlighting (auto-detect)
 * - rehypeRaw: inline HTML pass-through
 * - YAML frontmatter stripping (--- ... --- blocks)
 * - Statistics extraction: word count, char count, line count, heading hierarchy
 *
 * This is a framework-agnostic function with no React dependency.
 *
 * @example
 * ```ts
 * const md = createMarkdownProcessor();
 * const result = await md.process('# Hello\n\nWorld');
 * console.log(result.html);       // '<h1>Hello</h1>\n<p>World</p>'
 * console.log(result.wordCount);  // 2
 * ```
 */
export function createMarkdownProcessor() {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify);

  return {
    /**
     * Process a Markdown string and return rendered HTML plus statistics.
     */
    async process(markdown: string): Promise<ParseResult> {
      // Strip YAML frontmatter (--- ... --- block at start of document)
      const stripped = markdown.replace(/^---[\s\S]*?---\n?/, '');

      const file = await processor.process(stripped);
      const html = String(file);

      // Statistics extraction
      const plainText = stripped.replace(/[#*`\[\]()>|_~-]/g, '').trim();
      const words = plainText.split(/\s+/).filter(Boolean);
      const lines = markdown.split('\n');

      // Heading hierarchy extraction
      const headings: { level: number; text: string }[] = [];
      for (const line of lines) {
        const match = line.match(/^(#{1,6})\s+(.+)/);
        if (match) {
          headings.push({
            level: match[1].length,
            text: match[2].replace(/[*`]/g, ''),
          });
        }
      }

      return {
        html,
        wordCount: words.length,
        charCount: markdown.length,
        lineCount: lines.length,
        headings,
      };
    },
  };
}
