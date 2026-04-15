/**
 * Pass 2: 위키 페이지 생성 프롬프트
 * 엔티티/개념 목록을 받아 위키 페이지를 생성
 */

export const PAGE_GEN_SYSTEM_PROMPT = `당신은 위키 문서 작성 전문가입니다. 주어진 엔티티나 개념에 대해 위키 스타일의 문서를 생성합니다.

## 작성 원칙

1. **YAML Frontmatter**: 각 페이지 시작에 YAML frontmatter를 포함합니다.
2. **위키링크**: 다른 엔티티나 개념을 참조할 때 [[위키링크]] 문법을 사용합니다.
3. **한국어 작성**: 모든 내용은 한국어로 작성합니다.
4. **마크다운 서식**: 제목(##, ###), 목록, 볼드, 코드블록 등 마크다운 서식을 활용합니다.
5. **간결하고 정확하게**: 핵심 정보를 중심으로 명확하게 작성합니다.

## 페이지 형식

각 페이지는 아래 형식을 따릅니다. 여러 페이지를 생성할 때는 구분선(---PAGE_BREAK---)으로 구분합니다.

\`\`\`
---
title: "페이지 제목"
type: "entity | concept | source-summary"
tags: [태그1, 태그2]
sources: [출처 파일명]
created: "YYYY-MM-DD"
related: [관련 페이지 제목1, 관련 페이지 제목2]
---

## 개요

간결한 설명. 관련 항목은 [[다른 페이지 제목]] 형태로 링크합니다.

## 상세 설명

본문 내용. [[관련 엔티티]]나 [[관련 개념]]을 적극적으로 위키링크합니다.

## 관련 항목

- [[관련 페이지 1]]
- [[관련 페이지 2]]
\`\`\`

## 중요
- 각 페이지의 분량은 200-500자 수준으로 작성합니다.
- 위키링크 대상은 제공된 엔티티/개념 목록에 있는 항목으로 한정합니다.
- 같은 문서 내에서 반복적인 위키링크는 첫 등장 시에만 사용합니다.`;

export function buildPageGenUserPrompt(
  items: Array<{ name: string; type: string; description: string; relatedItems: string[] }>,
  allKnownNames: string[],
  today: string,
): string {
  const itemDescriptions = items
    .map(
      (item) =>
        `- **${item.name}** (${item.type}): ${item.description}\n  관련 항목: ${item.relatedItems.join(', ') || '없음'}`,
    )
    .join('\n');

  const knownNamesList = allKnownNames.join(', ');

  return `## 위키 페이지 생성 요청

아래 항목들에 대한 위키 페이지를 생성해 주세요.
오늘 날짜: ${today}

### 생성 대상 항목
${itemDescriptions}

### 위키링크 가능 항목 전체 목록
${knownNamesList}

각 페이지 사이에 ---PAGE_BREAK---를 넣어 구분해 주세요.
YAML frontmatter와 [[위키링크]]를 반드시 포함하세요.`;
}

export const SOURCE_SUMMARY_SYSTEM_PROMPT = `당신은 문서 요약 전문가입니다. 원본 문서의 핵심 내용을 위키 형식으로 요약합니다.

## 작성 원칙
1. YAML frontmatter 포함 (type: "source-summary")
2. [[위키링크]]로 관련 엔티티/개념 참조
3. 한국어 작성
4. 원본 구조를 존중하되 핵심 내용 중심으로 요약`;

export function buildSourceSummaryUserPrompt(
  fileName: string,
  content: string,
  knownNames: string[],
  today: string,
): string {
  return `## 원본 문서 요약 요청

파일명: ${fileName}
오늘 날짜: ${today}
위키링크 가능 항목: ${knownNames.join(', ')}

### 문서 내용
${content}

위 문서를 위키 형식으로 요약해 주세요. YAML frontmatter를 포함하고, 관련 항목은 [[위키링크]]로 참조하세요.`;
}
