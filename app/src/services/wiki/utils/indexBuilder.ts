/**
 * index.md 생성 유틸리티
 * 위키 페이지 목록을 카테고리별로 정리한 인덱스 문서를 생성합니다.
 */

import type { WikiPage } from '../types';

/**
 * WikiPage 배열로부터 index.md 내용을 생성합니다.
 * 카테고리: Entities, Concepts, Source Summaries
 * 각 항목: [[링크]] + 한 줄 요약
 */
export function buildIndex(pages: WikiPage[], today: string): string {
  const entities = pages.filter((p) => p.type === 'entity');
  const concepts = pages.filter((p) => p.type === 'concept');
  const sources = pages.filter((p) => p.type === 'source-summary');
  const overview = pages.find((p) => p.type === 'overview');

  const lines: string[] = [
    '---',
    'title: "인덱스"',
    'type: "index"',
    'tags: ["인덱스", "목차"]',
    'sources: []',
    `created: "${today}"`,
    `updated: "${today}"`,
    'related: []',
    '---',
    '',
    '# 위키 인덱스',
    '',
    `> 전체 ${pages.length}개 페이지 | 엔티티 ${entities.length}개 | 개념 ${concepts.length}개 | 원본 요약 ${sources.length}개`,
    '',
  ];

  // Overview link
  if (overview) {
    lines.push('## 종합 개요');
    lines.push('');
    lines.push(`- [[${overview.title}]]`);
    lines.push('');
  }

  // Entities
  if (entities.length > 0) {
    lines.push('## 엔티티');
    lines.push('');
    for (const page of entities.sort((a, b) => a.title.localeCompare(b.title))) {
      const summary = extractFirstSentence(page.content);
      lines.push(`- [[${page.title}]] - ${summary}`);
    }
    lines.push('');
  }

  // Concepts
  if (concepts.length > 0) {
    lines.push('## 개념');
    lines.push('');
    for (const page of concepts.sort((a, b) => a.title.localeCompare(b.title))) {
      const summary = extractFirstSentence(page.content);
      lines.push(`- [[${page.title}]] - ${summary}`);
    }
    lines.push('');
  }

  // Source summaries
  if (sources.length > 0) {
    lines.push('## 원본 문서 요약');
    lines.push('');
    for (const page of sources.sort((a, b) => a.title.localeCompare(b.title))) {
      const summary = extractFirstSentence(page.content);
      lines.push(`- [[${page.title}]] - ${summary}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 본문에서 첫 번째 문장을 추출합니다.
 * frontmatter와 제목을 건너뜁니다.
 */
function extractFirstSentence(content: string): string {
  // frontmatter 제거
  const body = content.replace(/^---[\s\S]*?---\s*/, '');

  // 빈 줄과 제목 건너뛰기
  const lines = body.split('\n').filter((l) => l.trim() && !l.startsWith('#'));

  if (lines.length === 0) return '';

  const firstLine = lines[0].trim();

  // 첫 문장 추출 (마침표, 물음표, 느낌표 기준)
  const sentenceEnd = firstLine.search(/[.。!?]/);
  if (sentenceEnd > 0 && sentenceEnd < 100) {
    return firstLine.slice(0, sentenceEnd + 1);
  }

  // 100자 제한
  if (firstLine.length > 100) {
    return firstLine.slice(0, 100) + '...';
  }

  return firstLine;
}
