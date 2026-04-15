/**
 * Lint Engine - 위키 품질 검사
 *
 * 모순, 고아 페이지, 깨진 링크, 누락된 상호 참조 등을 검사합니다.
 */

import type { LLMConfig } from '../../types/llm';
import { callLLMWithJSON } from '../llmClient';
import type { WikiPage } from './types';
import { LINT_SYSTEM_PROMPT, buildLintUserPrompt } from './prompts/lintPrompt';
import { parseWikilinks, countLinks, nameToId } from './utils/wikilinks';

/**
 * 정적 분석: LLM 호출 없이 구조적 문제를 검사합니다.
 */
function staticLint(pages: WikiPage[]): { issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const pageTitleSet = new Set(pages.map((p) => p.title));
  const pageIdSet = new Set(pages.map((p) => p.id));

  // Check for broken wikilinks
  for (const page of pages) {
    const links = parseWikilinks(page.content);
    for (const link of links) {
      if (!pageTitleSet.has(link) && !pageIdSet.has(nameToId(link))) {
        issues.push(`깨진 위키링크: [[${link}]] (${page.title} 페이지에서)`);
      }
    }
  }

  // Check for orphan pages (no incoming links)
  const linkStats = countLinks(
    pages.map((p) => ({ id: p.id, title: p.title, content: p.content })),
  );

  for (const [title, stats] of linkStats) {
    const page = pages.find((p) => p.title === title);
    if (!page) continue;

    // Skip index, log, overview - they're expected to have no incoming
    if (page.type === 'index' || page.type === 'log' || page.type === 'overview') continue;

    if (stats.incoming === 0) {
      suggestions.push(`고아 페이지: [[${title}]]는 다른 페이지에서 링크되지 않습니다`);
    }

    if (stats.outgoing === 0 && page.type !== 'source-summary') {
      suggestions.push(`[[${title}]] 페이지에 다른 페이지로의 위키링크를 추가하면 좋겠습니다`);
    }
  }

  // Check for empty/very short content
  for (const page of pages) {
    if (page.type === 'index' || page.type === 'log') continue;
    if (page.content.length < 50) {
      issues.push(`내용 부족: [[${page.title}]] 페이지의 본문이 너무 짧습니다 (${page.content.length}자)`);
    }
  }

  // Check for duplicate titles
  const titleCount = new Map<string, number>();
  for (const page of pages) {
    const lower = page.title.toLowerCase();
    titleCount.set(lower, (titleCount.get(lower) || 0) + 1);
  }
  for (const [title, count] of titleCount) {
    if (count > 1) {
      issues.push(`중복 페이지: "${title}" 제목을 가진 페이지가 ${count}개 있습니다`);
    }
  }

  return { issues, suggestions };
}

/**
 * 위키 페이지들의 품질을 검사합니다.
 * 정적 분석 + LLM 기반 의미적 분석을 수행합니다.
 */
export async function lintWiki(
  pages: WikiPage[],
  config: LLMConfig,
): Promise<{ issues: string[]; suggestions: string[] }> {
  // Start with static analysis
  const staticResult = staticLint(pages);

  // Filter pages for LLM analysis (skip index, log)
  const contentPages = pages.filter((p) => p.type !== 'index' && p.type !== 'log');

  if (contentPages.length === 0) {
    return staticResult;
  }

  // Prepare page data for LLM
  const pageData = contentPages.map((p) => ({
    title: p.title,
    type: p.frontmatter.type,
    content: p.content.slice(0, 1000), // Truncate for context
    links: parseWikilinks(p.content),
  }));

  try {
    const messages = [
      { role: 'system' as const, content: LINT_SYSTEM_PROMPT },
      { role: 'user' as const, content: buildLintUserPrompt(pageData) },
    ];

    const res = await callLLMWithJSON(config, messages);

    // Parse JSON response
    const jsonStr = res.content.match(/\{[\s\S]*\}/)?.[0] || res.content;
    const parsed = JSON.parse(jsonStr) as { issues?: string[]; suggestions?: string[] };

    // Merge static + LLM results
    return {
      issues: [...staticResult.issues, ...(parsed.issues || [])],
      suggestions: [...staticResult.suggestions, ...(parsed.suggestions || [])],
    };
  } catch (err) {
    // If LLM fails, return static results only
    const msg = err instanceof Error ? err.message : String(err);
    return {
      issues: [...staticResult.issues, `LLM 기반 분석 실패: ${msg}`],
      suggestions: staticResult.suggestions,
    };
  }
}
