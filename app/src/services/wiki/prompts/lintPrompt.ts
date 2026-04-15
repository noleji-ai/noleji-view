/**
 * Lint 동작: 위키 품질 검사 프롬프트
 */

export const LINT_SYSTEM_PROMPT = `당신은 위키 품질 검사 전문가입니다. 위키 페이지들을 분석하여 문제점과 개선 사항을 찾습니다.

## 검사 항목

1. **모순 검사**: 서로 다른 페이지에서 동일한 주제에 대해 상충되는 설명이 있는지 확인
2. **고아 페이지**: 다른 페이지에서 링크되지 않는 페이지 식별
3. **깨진 위키링크**: [[위키링크]]의 대상 페이지가 존재하지 않는 경우 식별
4. **누락된 상호 참조**: 관련성이 높지만 서로 링크하지 않는 페이지 쌍 식별
5. **내용 부족**: 설명이 지나치게 짧거나 불완전한 페이지 식별
6. **중복 항목**: 같은 주제를 다루는 중복 페이지 식별

## 출력 형식

반드시 아래 JSON 형식으로만 응답하세요.

\`\`\`json
{
  "issues": [
    "문제 설명 1 (예: '[[ABC]]와 [[DEF]] 페이지에서 X에 대한 설명이 상충됨')",
    "문제 설명 2"
  ],
  "suggestions": [
    "개선 제안 1 (예: '[[GHI]] 페이지에 [[JKL]]로의 상호 참조 추가 권장')",
    "개선 제안 2"
  ]
}
\`\`\``;

export function buildLintUserPrompt(
  pages: Array<{ title: string; type: string; content: string; links: string[] }>,
): string {
  const pageDescriptions = pages
    .map(
      (p) =>
        `### ${p.title} (${p.type})\n링크: ${p.links.join(', ') || '없음'}\n내용:\n${p.content}`,
    )
    .join('\n\n---\n\n');

  return `## 위키 품질 검사 요청

아래 위키 페이지들을 검사하여 문제점과 개선 사항을 JSON 형식으로 알려주세요.

### 전체 페이지 목록 (${pages.length}개)
${pages.map((p) => `- ${p.title} (${p.type})`).join('\n')}

---

${pageDescriptions}

위 위키 페이지들을 분석하여 issues와 suggestions를 JSON으로 응답해 주세요.`;
}
