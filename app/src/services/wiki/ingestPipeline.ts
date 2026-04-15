/**
 * Ingest Pipeline - Karpathy의 LLM Wiki 패턴 구현
 *
 * 3-Pass 파이프라인:
 *   Pass 1 (0-30%):  각 파일에서 엔티티/개념 추출 (JSON)
 *   Pass 2 (30-70%): 고유 엔티티/개념별 위키 페이지 생성 + 원본 요약 페이지
 *   Pass 3 (70-100%): 종합 개요, index.md, log.md 생성
 */

import type { LLMConfig } from '../../types/llm';
import { callLLM, callLLMWithJSON } from '../llmClient';
import type {
  WikiPage,
  WikiResult,
  ExtractedEntity,
  ExtractedConcept,
  ExtractionResult,
  FileItem,
} from './types';
import {
  EXTRACT_SYSTEM_PROMPT,
  EXTRACT_TEMPERATURE,
  buildExtractUserPrompt,
} from './prompts/extractPrompt';
import {
  PAGE_GEN_SYSTEM_PROMPT,
  buildPageGenUserPrompt,
  SOURCE_SUMMARY_SYSTEM_PROMPT,
  buildSourceSummaryUserPrompt,
} from './prompts/pageGenPrompt';
import {
  SYNTHESIS_SYSTEM_PROMPT,
  buildSynthesisUserPrompt,
} from './prompts/synthesisPrompt';
import { nameToId } from './utils/wikilinks';
import { parseFrontmatter } from './utils/frontmatter';
import { buildIndex } from './utils/indexBuilder';
import { buildLogDocument, type LogEntry } from './utils/logWriter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** HTML 태그 제거 (브라우저 전용, 간단한 정규식 기반) */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** 텍스트를 ~maxChars로 잘라냅니다. */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastPeriod = cut.lastIndexOf('.');
  if (lastPeriod > maxChars * 0.6) {
    return cut.slice(0, lastPeriod + 1) + '\n\n[... 이하 생략 ...]';
  }
  return cut + '\n\n[... 이하 생략 ...]';
}

/** 오늘 날짜 (YYYY-MM-DD) */
function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** LLM 응답에서 JSON을 추출합니다. */
function extractJSON(text: string): string {
  // Try to find JSON in code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
}

/** 엔티티 이름 기준 중복 제거 */
function deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const seen = new Map<string, ExtractedEntity>();
  for (const e of entities) {
    const key = e.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, e);
    } else {
      // 더 긴 설명을 유지
      const existing = seen.get(key)!;
      if (e.description.length > existing.description.length) {
        seen.set(key, e);
      }
    }
  }
  return Array.from(seen.values());
}

/** 개념 이름 기준 중복 제거 */
function deduplicateConcepts(concepts: ExtractedConcept[]): ExtractedConcept[] {
  const seen = new Map<string, ExtractedConcept>();
  for (const c of concepts) {
    const key = c.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, c);
    } else {
      const existing = seen.get(key)!;
      if (c.definition.length > existing.definition.length) {
        seen.set(key, c);
      }
    }
  }
  return Array.from(seen.values());
}

/** 배열을 chunk로 분할 */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/** LLM 응답에서 여러 페이지를 파싱 */
function parsePagesFromResponse(
  response: string,
  defaultType: WikiPage['type'],
  today: string,
): WikiPage[] {
  const pageTexts = response.split('---PAGE_BREAK---').map((t) => t.trim()).filter(Boolean);
  const pages: WikiPage[] = [];

  for (const pageText of pageTexts) {
    const { frontmatter: fm, body } = parseFrontmatter(pageText);

    const title = fm.title || extractTitleFromBody(body);
    if (!title) continue;

    const page: WikiPage = {
      id: nameToId(title),
      title,
      type: (fm.type as WikiPage['type']) || defaultType,
      content: body,
      frontmatter: {
        title,
        type: fm.type || defaultType,
        tags: fm.tags || [],
        sources: fm.sources || [],
        created: fm.created || today,
        updated: fm.updated || today,
        related: fm.related || [],
      },
    };

    pages.push(page);
  }

  return pages;
}

/** 본문에서 제목 추출 (# 또는 ## 으로 시작하는 첫 줄) */
function extractTitleFromBody(body: string): string {
  const lines = body.split('\n');
  for (const line of lines) {
    const match = line.match(/^#+\s+(.+)/);
    if (match) return match[1].trim();
  }
  return '';
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

export async function ingestFolder(
  files: FileItem[],
  contents: Record<string, string>,
  config: LLMConfig,
  onProgress?: (step: string, percent: number) => void,
): Promise<WikiResult> {
  const startTime = Date.now();
  const today = getToday();
  const errors: string[] = [];

  // Prepare file contents
  const fileContents: Array<{ name: string; text: string }> = [];
  for (const file of files) {
    const raw = contents[file.id];
    if (!raw) continue;
    const text = file.type === 'html' ? stripHtmlTags(raw) : raw;
    fileContents.push({ name: file.name, text: truncate(text, 6000) });
  }

  if (fileContents.length === 0) {
    return {
      pages: [],
      indexContent: '',
      logContent: '',
      overviewContent: '',
      stats: {
        entityCount: 0,
        conceptCount: 0,
        sourceCount: 0,
        totalPages: 0,
        processingTime: 0,
      },
    };
  }

  // ===================================================================
  // Pass 1: Entity/Concept Extraction (0-30%)
  // ===================================================================
  onProgress?.('Pass 1: 엔티티/개념 추출 중...', 5);

  let allEntities: ExtractedEntity[] = [];
  let allConcepts: ExtractedConcept[] = [];
  const fileSummaries: string[] = [];

  const extractConfig: LLMConfig = {
    ...config,
    temperature: EXTRACT_TEMPERATURE,
  };

  for (let i = 0; i < fileContents.length; i++) {
    const file = fileContents[i];
    const pct = 5 + Math.round((i / fileContents.length) * 25);
    onProgress?.(`Pass 1: ${file.name} 분석 중... (${i + 1}/${fileContents.length})`, pct);

    try {
      const messages = [
        { role: 'system' as const, content: EXTRACT_SYSTEM_PROMPT },
        { role: 'user' as const, content: buildExtractUserPrompt(file.name, file.text) },
      ];

      const res = await callLLMWithJSON(extractConfig, messages);
      const jsonStr = extractJSON(res.content);
      const parsed: ExtractionResult = JSON.parse(jsonStr);

      // Attach sourceFile
      const entities = (parsed.entities || []).map((e) => ({
        ...e,
        sourceFile: file.name,
      }));
      const concepts = (parsed.concepts || []).map((c) => ({
        ...c,
        sourceFile: file.name,
      }));

      allEntities.push(...entities);
      allConcepts.push(...concepts);
      fileSummaries.push(parsed.summary || `${file.name}: 요약 없음`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Pass 1 오류 (${file.name}): ${msg}`);
      fileSummaries.push(`${file.name}: 추출 실패`);
    }
  }

  // Deduplicate
  allEntities = deduplicateEntities(allEntities);
  allConcepts = deduplicateConcepts(allConcepts);

  onProgress?.(`Pass 1 완료: 엔티티 ${allEntities.length}개, 개념 ${allConcepts.length}개 추출`, 30);

  // ===================================================================
  // Pass 2: Wiki Page Generation (30-70%)
  // ===================================================================
  onProgress?.('Pass 2: 위키 페이지 생성 중...', 32);

  const allPages: WikiPage[] = [];
  const allKnownNames = [
    ...allEntities.map((e) => e.name),
    ...allConcepts.map((c) => c.name),
  ];

  // 2a. Entity + Concept pages (batched)
  const entityItems = allEntities.map((e) => ({
    name: e.name,
    type: `entity:${e.type}`,
    description: e.description,
    relatedItems: [] as string[],
  }));

  const conceptItems = allConcepts.map((c) => ({
    name: c.name,
    type: 'concept',
    description: c.definition,
    relatedItems: [...c.relatedEntities, ...c.relatedConcepts],
  }));

  const allItems = [...entityItems, ...conceptItems];
  const batches = chunk(allItems, 4); // 4 items per batch

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const pct = 32 + Math.round((batchIdx / batches.length) * 25);
    const names = batch.map((b) => b.name).join(', ');
    onProgress?.(`Pass 2: 페이지 생성 중 [${names}]... (배치 ${batchIdx + 1}/${batches.length})`, pct);

    try {
      const messages = [
        { role: 'system' as const, content: PAGE_GEN_SYSTEM_PROMPT },
        { role: 'user' as const, content: buildPageGenUserPrompt(batch, allKnownNames, today) },
      ];

      const res = await callLLM(config, messages);
      const pages = parsePagesFromResponse(res.content, 'entity', today);

      // Fix types for concept pages
      for (const page of pages) {
        const matchingConcept = allConcepts.find(
          (c) => c.name.toLowerCase() === page.title.toLowerCase(),
        );
        if (matchingConcept) {
          page.type = 'concept';
          page.frontmatter.type = 'concept';
        }
      }

      allPages.push(...pages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Pass 2 배치 오류 (${names}): ${msg}`);

      // Create stub pages for failed batch items
      for (const item of batch) {
        const isEntity = item.type.startsWith('entity');
        const pageType: WikiPage['type'] = isEntity ? 'entity' : 'concept';
        allPages.push({
          id: nameToId(item.name),
          title: item.name,
          type: pageType,
          content: `## ${item.name}\n\n${item.description}\n\n> 페이지 생성 중 오류가 발생하여 기본 정보만 포함합니다.`,
          frontmatter: {
            title: item.name,
            type: pageType,
            tags: [],
            sources: [],
            created: today,
            updated: today,
            related: item.relatedItems,
          },
        });
      }
    }
  }

  // 2b. Source summary pages
  onProgress?.('Pass 2: 원본 문서 요약 페이지 생성 중...', 58);

  for (let i = 0; i < fileContents.length; i++) {
    const file = fileContents[i];
    const pct = 58 + Math.round((i / fileContents.length) * 10);
    onProgress?.(`Pass 2: ${file.name} 요약 생성 중...`, pct);

    try {
      const messages = [
        { role: 'system' as const, content: SOURCE_SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user' as const,
          content: buildSourceSummaryUserPrompt(file.name, file.text, allKnownNames, today),
        },
      ];

      const res = await callLLM(config, messages);
      const { frontmatter: fm, body } = parseFrontmatter(res.content);

      const title = fm.title || `${file.name} 요약`;
      const page: WikiPage = {
        id: nameToId(title),
        title,
        type: 'source-summary',
        content: body || res.content,
        frontmatter: {
          title,
          type: 'source-summary',
          tags: fm.tags || ['원본 요약'],
          sources: [file.name],
          created: fm.created || today,
          updated: fm.updated || today,
          related: fm.related || [],
        },
      };

      allPages.push(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`원본 요약 오류 (${file.name}): ${msg}`);

      // Stub source summary
      allPages.push({
        id: nameToId(`${file.name}-요약`),
        title: `${file.name} 요약`,
        type: 'source-summary',
        content: `## ${file.name} 요약\n\n원본 요약 생성에 실패했습니다.`,
        frontmatter: {
          title: `${file.name} 요약`,
          type: 'source-summary',
          tags: ['원본 요약'],
          sources: [file.name],
          created: today,
          updated: today,
          related: [],
        },
      });
    }
  }

  onProgress?.('Pass 2 완료', 70);

  // ===================================================================
  // Pass 3: Synthesis, Index, Log (70-100%)
  // ===================================================================
  onProgress?.('Pass 3: 종합 개요 생성 중...', 72);

  let overviewContent = '';

  // 3a. Overview synthesis
  try {
    const entityNames = allEntities.map((e) => e.name);
    const conceptNames = allConcepts.map((c) => c.name);

    const messages = [
      { role: 'system' as const, content: SYNTHESIS_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: buildSynthesisUserPrompt(
          fileSummaries,
          entityNames,
          conceptNames,
          allKnownNames,
          today,
        ),
      },
    ];

    const res = await callLLM(config, messages);
    const { frontmatter: fm, body } = parseFrontmatter(res.content);

    overviewContent = res.content;

    const overviewPage: WikiPage = {
      id: 'overview',
      title: fm.title || '종합 개요',
      type: 'overview',
      content: body || res.content,
      frontmatter: {
        title: fm.title || '종합 개요',
        type: 'overview',
        tags: fm.tags || ['개요', '종합'],
        sources: files.map((f) => f.name),
        created: fm.created || today,
        updated: fm.updated || today,
        related: fm.related || [],
      },
    };

    allPages.push(overviewPage);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`종합 개요 생성 오류: ${msg}`);
    overviewContent = `> 종합 개요 생성 중 오류 발생: ${msg}`;
  }

  onProgress?.('Pass 3: 인덱스 생성 중...', 85);

  // 3b. Build index.md
  const indexContent = buildIndex(allPages, today);
  const indexPage: WikiPage = {
    id: 'index',
    title: '인덱스',
    type: 'index',
    content: indexContent,
    frontmatter: {
      title: '인덱스',
      type: 'index',
      tags: ['인덱스', '목차'],
      sources: [],
      created: today,
      updated: today,
      related: [],
    },
  };
  allPages.push(indexPage);

  onProgress?.('Pass 3: 처리 로그 생성 중...', 90);

  // 3c. Build log.md
  const processingTime = Date.now() - startTime;
  const logEntry: LogEntry = {
    operation: 'ingest',
    folderName: files.length > 0 ? files[0].name.split('/')[0] || 'Documents' : 'Documents',
    filesProcessed: files.map((f) => f.name),
    entitiesFound: allEntities.length,
    conceptsFound: allConcepts.length,
    pagesCreated: allPages.length,
    processingTime,
    errors: errors.length > 0 ? errors : undefined,
  };

  const logContent = buildLogDocument([logEntry], today);
  const logPage: WikiPage = {
    id: 'log',
    title: '처리 로그',
    type: 'log',
    content: logContent,
    frontmatter: {
      title: '처리 로그',
      type: 'log',
      tags: ['로그', '처리기록'],
      sources: [],
      created: today,
      updated: today,
      related: [],
    },
  };
  allPages.push(logPage);

  onProgress?.('완료', 100);

  // ===================================================================
  // Result
  // ===================================================================
  const entityPages = allPages.filter((p) => p.type === 'entity');
  const conceptPages = allPages.filter((p) => p.type === 'concept');
  const sourcePages = allPages.filter((p) => p.type === 'source-summary');

  return {
    pages: allPages,
    indexContent,
    logContent,
    overviewContent,
    stats: {
      entityCount: entityPages.length,
      conceptCount: conceptPages.length,
      sourceCount: sourcePages.length,
      totalPages: allPages.length,
      processingTime,
    },
  };
}
