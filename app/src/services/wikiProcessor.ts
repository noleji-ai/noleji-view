import type { LLMConfig, LLMMessage } from '../types/llm';
import { callLLM } from './llmClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileItem {
  id: string;
  name: string;
  type: 'md' | 'html';
}

interface KnowledgeResult {
  overview: string;      // _개요.md content
  glossary: string;      // _핵심용어.md content
  structured: string;    // _구조화_지식.md content
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip HTML tags using a basic regex (suitable for browser-only use). */
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

/** Truncate text to approximately `maxChars` while trying to break at a sentence. */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastPeriod = cut.lastIndexOf('.');
  if (lastPeriod > maxChars * 0.6) {
    return cut.slice(0, lastPeriod + 1) + '\n\n[... 이하 생략 ...]';
  }
  return cut + '\n\n[... 이하 생략 ...]';
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const OVERVIEW_SYSTEM_PROMPT =
  'You are a knowledge analyst. Analyze the following documents and create a structured overview in Korean markdown format. Include: title, one-paragraph summary, list of 5-10 key concepts, and relationships between concepts.';

const GLOSSARY_SYSTEM_PROMPT =
  'Based on these documents, create a glossary of key terms in Korean markdown format. Each term should have: definition, related concepts, and which source document it appears in. Format as a markdown table.';

const STRUCTURED_SYSTEM_PROMPT =
  'Create a comprehensive wiki-style knowledge document in Korean markdown. Organize by topics, include cross-references between sections, use hierarchical headings (h2, h3, h4). Include code examples if relevant. Make it a standalone reference document.';

// ---------------------------------------------------------------------------
// processFolder
// ---------------------------------------------------------------------------

export async function processFolder(
  files: FileItem[],
  contents: Record<string, string>,
  config: LLMConfig,
  onProgress?: (step: string, percent: number) => void,
): Promise<KnowledgeResult> {
  // 1. Collect and normalize all file contents
  const sections: string[] = [];
  for (const file of files) {
    const raw = contents[file.id];
    if (!raw) continue;

    const text = file.type === 'html' ? stripHtmlTags(raw) : raw;
    sections.push(`--- 파일: ${file.name} ---\n${text}`);
  }

  const combined = sections.join('\n\n');
  const documentText = truncate(combined, 8000);

  const fileListSummary = files.map((f) => `- ${f.name} (${f.type})`).join('\n');

  const userContext =
    `## 분석 대상 파일 목록\n${fileListSummary}\n\n## 문서 내용\n${documentText}`;

  // Result accumulator — partial results on error
  const result: KnowledgeResult = {
    overview: '',
    glossary: '',
    structured: '',
  };

  // -------------------------------------------------------------------
  // Step 1: Overview (30%)
  // -------------------------------------------------------------------
  onProgress?.('개요 생성 중...', 10);
  try {
    const overviewMessages: LLMMessage[] = [
      { role: 'system', content: OVERVIEW_SYSTEM_PROMPT },
      { role: 'user', content: userContext },
    ];
    const overviewRes = await callLLM(config, overviewMessages);
    result.overview = overviewRes.content;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.overview = `> ⚠️ 개요 생성 중 오류 발생: ${msg}\n\n자동 생성에 실패했습니다. LLM 설정을 확인해 주세요.`;
  }
  onProgress?.('개요 생성 완료', 30);

  // -------------------------------------------------------------------
  // Step 2: Glossary (60%)
  // -------------------------------------------------------------------
  onProgress?.('핵심 용어 추출 중...', 40);
  try {
    const glossaryMessages: LLMMessage[] = [
      { role: 'system', content: GLOSSARY_SYSTEM_PROMPT },
      { role: 'user', content: userContext },
    ];
    const glossaryRes = await callLLM(config, glossaryMessages);
    result.glossary = glossaryRes.content;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.glossary = `> ⚠️ 용어집 생성 중 오류 발생: ${msg}\n\n자동 생성에 실패했습니다. LLM 설정을 확인해 주세요.`;
  }
  onProgress?.('핵심 용어 추출 완료', 60);

  // -------------------------------------------------------------------
  // Step 3: Structured wiki (90%)
  // -------------------------------------------------------------------
  onProgress?.('구조화 지식 문서 생성 중...', 70);
  try {
    const structuredMessages: LLMMessage[] = [
      { role: 'system', content: STRUCTURED_SYSTEM_PROMPT },
      { role: 'user', content: userContext },
    ];
    const structuredRes = await callLLM(config, structuredMessages);
    result.structured = structuredRes.content;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.structured = `> ⚠️ 구조화 지식 문서 생성 중 오류 발생: ${msg}\n\n자동 생성에 실패했습니다. LLM 설정을 확인해 주세요.`;
  }
  onProgress?.('지식 문서 생성 완료', 90);

  onProgress?.('완료', 100);
  return result;
}
