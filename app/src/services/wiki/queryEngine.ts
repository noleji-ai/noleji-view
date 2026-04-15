/**
 * Query Engine - 위키 검색 및 답변 합성
 *
 * 사용자 질문에 대해 관련 위키 페이지를 찾아 종합 답변을 생성합니다.
 */

import type { LLMConfig } from '../../types/llm';
import { callLLM } from '../llmClient';
import type { WikiPage } from './types';
import { QUERY_SYSTEM_PROMPT, buildQueryUserPrompt } from './prompts/queryPrompt';
import { parseWikilinks } from './utils/wikilinks';

/**
 * 질문과 위키 페이지의 관련도를 계산합니다 (간단한 키워드 매칭 기반).
 */
function scoreRelevance(query: string, page: WikiPage): number {
  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 1);

  let score = 0;

  // Title match (highest weight)
  const titleLower = page.title.toLowerCase();
  if (titleLower.includes(queryLower)) {
    score += 10;
  }
  for (const token of queryTokens) {
    if (titleLower.includes(token)) {
      score += 5;
    }
  }

  // Tag match
  for (const tag of page.frontmatter.tags) {
    const tagLower = tag.toLowerCase();
    for (const token of queryTokens) {
      if (tagLower.includes(token)) {
        score += 3;
      }
    }
  }

  // Content match
  const contentLower = page.content.toLowerCase();
  for (const token of queryTokens) {
    if (contentLower.includes(token)) {
      score += 1;
    }
  }

  // Penalize index/log pages
  if (page.type === 'index' || page.type === 'log') {
    score *= 0.1;
  }

  // Boost overview
  if (page.type === 'overview') {
    score *= 1.2;
  }

  return score;
}

/**
 * 위키 페이지를 검색하고 질문에 대한 답변을 생성합니다.
 */
export async function queryWiki(
  query: string,
  pages: WikiPage[],
  config: LLMConfig,
): Promise<{ answer: string; citations: string[] }> {
  if (pages.length === 0) {
    return {
      answer: '위키에 검색 가능한 페이지가 없습니다.',
      citations: [],
    };
  }

  // Score and rank pages
  const scored = pages
    .map((page) => ({ page, score: scoreRelevance(query, page) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Select top relevant pages (limit to ~5 to fit context window)
  const topPages = scored.slice(0, 5).map((s) => s.page);

  // If no pages matched, include overview at least
  if (topPages.length === 0) {
    const overview = pages.find((p) => p.type === 'overview');
    if (overview) {
      topPages.push(overview);
    } else {
      // Pick first few non-index, non-log pages
      const content = pages.filter((p) => p.type !== 'index' && p.type !== 'log');
      topPages.push(...content.slice(0, 3));
    }
  }

  const relevantPages = topPages.map((p) => ({
    title: p.title,
    content: p.content.slice(0, 2000), // Truncate for context window
  }));

  try {
    const messages = [
      { role: 'system' as const, content: QUERY_SYSTEM_PROMPT },
      { role: 'user' as const, content: buildQueryUserPrompt(query, relevantPages) },
    ];

    const res = await callLLM(config, messages);

    // Extract citations from wikilinks in the answer
    const citations = parseWikilinks(res.content);

    return {
      answer: res.content,
      citations,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      answer: `질문 처리 중 오류가 발생했습니다: ${msg}`,
      citations: [],
    };
  }
}
