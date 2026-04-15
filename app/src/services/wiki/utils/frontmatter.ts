/**
 * YAML frontmatter 생성 및 파싱 유틸리티
 */

import type { WikiPage } from '../types';

/**
 * WikiPage.frontmatter 객체로부터 YAML frontmatter 문자열을 생성합니다.
 */
export function generateFrontmatter(fm: WikiPage['frontmatter']): string {
  const lines: string[] = ['---'];

  lines.push(`title: "${fm.title}"`);
  lines.push(`type: "${fm.type}"`);
  lines.push(`tags: [${fm.tags.map((t) => `"${t}"`).join(', ')}]`);
  lines.push(`sources: [${fm.sources.map((s) => `"${s}"`).join(', ')}]`);
  lines.push(`created: "${fm.created}"`);
  lines.push(`updated: "${fm.updated}"`);
  lines.push(`related: [${fm.related.map((r) => `"${r}"`).join(', ')}]`);

  lines.push('---');

  return lines.join('\n');
}

/**
 * frontmatter + 본문을 합쳐 완전한 마크다운 문자열을 생성합니다.
 */
export function buildFullPage(page: WikiPage): string {
  const fm = generateFrontmatter(page.frontmatter);
  return `${fm}\n\n${page.content}`;
}

/**
 * YAML frontmatter 문자열을 파싱하여 객체로 변환합니다.
 */
export function parseFrontmatter(
  markdown: string,
): { frontmatter: Partial<WikiPage['frontmatter']>; body: string } {
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!fmMatch) {
    return { frontmatter: {}, body: markdown };
  }

  const yamlStr = fmMatch[1];
  const body = fmMatch[2].trim();
  const fm: Partial<WikiPage['frontmatter']> = {};

  // Simple YAML line parser (not a full YAML parser)
  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Remove surrounding quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    // Parse arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1);
      const items = inner
        .split(',')
        .map((s) => s.trim().replace(/^"/, '').replace(/"$/, ''))
        .filter(Boolean);

      switch (key) {
        case 'tags':
          fm.tags = items;
          break;
        case 'sources':
          fm.sources = items;
          break;
        case 'related':
          fm.related = items;
          break;
      }
    } else {
      switch (key) {
        case 'title':
          fm.title = value;
          break;
        case 'type':
          fm.type = value;
          break;
        case 'created':
          fm.created = value;
          break;
        case 'updated':
          fm.updated = value;
          break;
      }
    }
  }

  return { frontmatter: fm, body };
}
