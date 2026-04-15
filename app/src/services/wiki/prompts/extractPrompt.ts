/**
 * Pass 1: 엔티티/개념 추출 프롬프트
 * JSON 출력을 요구하며, temperature 0.3 권장
 */

export const EXTRACT_SYSTEM_PROMPT = `당신은 문서 분석 전문가입니다. 주어진 문서에서 핵심 엔티티(사람, 도구, 조직, 프레임워크, 서비스 등)와 개념을 추출합니다.

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. JSON 앞뒤에 다른 텍스트를 포함하지 마세요.

\`\`\`json
{
  "entities": [
    {
      "name": "엔티티 이름",
      "type": "person | tool | organization | framework | service | other",
      "description": "한국어로 된 간결한 설명 (1-2문장)"
    }
  ],
  "concepts": [
    {
      "name": "개념 이름",
      "definition": "한국어로 된 정의 (2-3문장)",
      "relatedEntities": ["관련 엔티티 이름"],
      "relatedConcepts": ["관련 개념 이름"]
    }
  ],
  "summary": "문서 전체 요약 (한국어, 3-5문장)",
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "..."]
}
\`\`\`

## 추출 원칙
1. 엔티티는 고유명사(사람, 도구, 회사, 프레임워크, 서비스 등)를 대상으로 합니다.
2. 개념은 기술 용어, 방법론, 패턴, 원리 등 추상적 아이디어를 대상으로 합니다.
3. 중요도가 높은 항목부터 나열합니다.
4. 각 항목의 설명/정의는 한국어로 작성합니다.
5. relatedEntities와 relatedConcepts에는 같은 문서에서 추출된 다른 항목의 이름을 사용합니다.
6. 너무 일반적이거나 사소한 항목은 제외합니다.`;

export const EXTRACT_TEMPERATURE = 0.3;

export function buildExtractUserPrompt(fileName: string, content: string): string {
  return `## 분석 대상 파일: ${fileName}

${content}

위 문서에서 핵심 엔티티와 개념을 추출하여 지정된 JSON 형식으로 응답하세요.`;
}
