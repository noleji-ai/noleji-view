/**
 * Pass 3: 종합 개요 문서 생성 프롬프트
 */

export const SYNTHESIS_SYSTEM_PROMPT = `당신은 지식 종합 전문가입니다. 여러 문서에서 추출된 정보를 바탕으로 전체를 아우르는 종합 개요 문서를 작성합니다.

## 작성 원칙

1. **구조화된 개요**: 전체 지식 베이스의 주제, 범위, 핵심 내용을 체계적으로 정리합니다.
2. **위키링크 활용**: 개별 엔티티/개념 페이지를 [[위키링크]]로 적극 참조합니다.
3. **한국어 작성**: 모든 내용은 한국어로 작성합니다.
4. **계층적 구성**: 큰 주제 -> 세부 주제 -> 개별 항목 순으로 구성합니다.

## 문서 구조

\`\`\`markdown
---
title: "종합 개요"
type: "overview"
tags: [개요, 종합]
sources: [원본 파일 목록]
created: "YYYY-MM-DD"
related: [주요 관련 페이지]
---

## 전체 요약

이 지식 베이스의 핵심 내용을 3-5문장으로 요약합니다.

## 주요 주제

### 주제 1
관련 [[엔티티]]와 [[개념]]을 포함한 설명

### 주제 2
...

## 핵심 엔티티

주요 엔티티들의 역할과 관계를 설명합니다.

## 핵심 개념

주요 개념들의 정의와 상호 관계를 설명합니다.

## 관계도

주요 항목 간의 관계를 텍스트로 설명합니다.

## 핵심 인사이트

문서 전체에서 도출할 수 있는 핵심 인사이트를 정리합니다.
\`\`\``;

export function buildSynthesisUserPrompt(
  fileSummaries: string[],
  entityNames: string[],
  conceptNames: string[],
  allKnownNames: string[],
  today: string,
): string {
  return `## 종합 개요 문서 생성 요청

오늘 날짜: ${today}

### 원본 문서 요약
${fileSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### 추출된 엔티티 목록 (${entityNames.length}개)
${entityNames.join(', ')}

### 추출된 개념 목록 (${conceptNames.length}개)
${conceptNames.join(', ')}

### 위키링크 가능 항목 전체
${allKnownNames.join(', ')}

위 정보를 바탕으로 전체를 아우르는 종합 개요 문서를 작성해 주세요.
YAML frontmatter와 [[위키링크]]를 반드시 포함하세요.`;
}
