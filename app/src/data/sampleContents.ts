/**
 * Noleji View 샘플 콘텐츠
 * 각 파일 ID별 프리셋 콘텐츠 — 다양한 디자인 스타일 쇼케이스
 */

export const SAMPLE_CONTENTS: Record<string, string> = {

/* ═══════════════════════════════════════════════
   📁 개인 지식 보관소
   ═══════════════════════════════════════════════ */

// f1: 시작하기.md — Asome Emerald 스타일, GFM 전시
f1: `# Noleji View v1.0: Launch-ready Workspace

> **Noleji View**는 원본을 훼손하지 않는 로컬 우선 마크다운 워크스페이스입니다.

## 01 하이-피델리티 렌더링

unified + remark + rehype 파이프라인으로 **브라우저 품질** 렌더링을 지원합니다.

### 마크다운 에디터 특징

에디터 상단 **툴바**에서 서식 버튼을 클릭하면 마크다운 문법이 자동 삽입됩니다.

#### 지원하는 서식 요소

모든 GFM(GitHub Flavored Markdown) 요소를 지원합니다.

##### 인라인 서식

\\\`Bold\\\`, *Italic*, ~~Strikethrough~~ 등을 지원합니다.

###### 기타 참고사항

추가 플러그인을 통해 확장 가능합니다.

---

## 02 GFM 요소 테스트

### 표 (Table)

| 기능 | 상태 | 엔진 |
|------|------|------|
| 에디터 | 완료 | CodeMirror 6 |
| 미리보기 | 완료 | unified |
| 검수 | 진행중 | 자체 |
| 내보내기 | 완료 | PDF/HTML |

### 체크리스트

- [x] Phase 1: 기초 레이아웃
- [x] Phase 2: 실시간 미리보기
- [x] Phase 3: 가시적 설정
- [ ] Phase 4: 플러그인 시스템

### 코드블록

\\\`\\\`\\\`typescript
const result = await nolejiView.importFile(
  '/path/to/document.md',
  '코웨이 루틴 업무'
);
console.log(result.workingCopy);
\\\`\\\`\\\`

### 인용문

> *"좋은 문서는 좋은 제품만큼 가치가 있다."*
> — Noleji View 설계 원칙

> 중첩 인용도 가능합니다:
> > 이것은 중첩된 인용문입니다.

---

이 문서를 자유롭게 편집하며 우측 미리보기에서 결과를 확인하세요.
`,

// f2: 마크다운_치트시트.md — 완전한 마크다운 문법 가이드
f2: `# 마크다운 완벽 치트시트

> 이 문서는 Noleji View에서 지원하는 **모든 마크다운 문법**을 정리한 참고 자료입니다.

---

## 1. 제목 (Headings)

\\\`# H1\\\` 부터 \\\`###### H6\\\` 까지 6단계 제목을 지원합니다.

## 2. 텍스트 강조

| 문법 | 결과 | 용도 |
|------|------|------|
| \\\`**굵게**\\\` | **굵게** | 핵심 키워드 |
| \\\`*기울임*\\\` | *기울임* | 강조, 외래어 |
| \\\`~~취소선~~\\\` | ~~취소선~~ | 삭제 표시 |
| \\\`\\\\\\\`인라인 코드\\\\\\\`\\\` | \\\`인라인 코드\\\` | 코드 참조 |

## 3. 링크와 이미지

- 링크: \`[Noleji View GitHub](https://github.com/noleji-ai/docwise)\` → [Noleji View GitHub](https://github.com/noleji-ai/docwise)
- 이미지: \\\`![설명](url)\\\`

## 4. 목록

### 순서 없는 목록
- 첫 번째 항목
- 두 번째 항목
  - 중첩 항목 1
  - 중첩 항목 2
- 세 번째 항목

### 순서 있는 목록
1. 기획 단계
2. 설계 단계
3. 개발 단계
4. 테스트 단계
5. 배포 단계

### 체크리스트
- [x] 마크다운 파서 구현
- [x] GFM 확장 지원
- [ ] 수식 (KaTeX) 지원
- [ ] 다이어그램 (Mermaid) 지원

## 5. 인용문

> 단일 인용문은 이렇게 작성합니다.

> 여러 줄 인용문도 가능합니다.
> 줄을 바꿔도 같은 인용 블록에 속합니다.
>
> > 중첩 인용문도 지원합니다.

## 6. 코드 블록

### JavaScript

\\\`\\\`\\\`javascript
function greet(name) {
  return \\\`Hello, \${name}!\\\`;
}
console.log(greet('Noleji View'));
\\\`\\\`\\\`

### Python

\\\`\\\`\\\`python
def calculate_fibonacci(n: int) -> list[int]:
    """피보나치 수열을 생성합니다."""
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib[:n]

print(calculate_fibonacci(10))
\\\`\\\`\\\`

### SQL

\\\`\\\`\\\`sql
SELECT u.name, COUNT(d.id) AS doc_count
FROM users u
LEFT JOIN documents d ON u.id = d.author_id
WHERE d.created_at > '2026-01-01'
GROUP BY u.name
ORDER BY doc_count DESC
LIMIT 10;
\\\`\\\`\\\`

## 7. 표 (Tables)

| 정렬 왼쪽 | 정렬 가운데 | 정렬 오른쪽 |
|:-----------|:----------:|------------:|
| 데이터 A | 100 | ₩1,200 |
| 데이터 B | 250 | ₩3,500 |
| 데이터 C | 75 | ₩900 |
| **합계** | **425** | **₩5,600** |

## 8. 수평선

세 가지 방식 모두 동일하게 렌더링됩니다:

---

## 9. 유용한 조합 팁

> **💡 팁:** 표 안에서도 \\\`인라인 코드\\\`와 **굵은 텍스트**를 사용할 수 있습니다.

| 기능 | 단축키 |
|------|--------|
| **굵게** | \\\`Ctrl+B\\\` |
| *기울임* | \\\`Ctrl+I\\\` |
| 실행 취소 | \\\`Ctrl+Z\\\` |

---

*이 치트시트는 Noleji View 사용자를 위해 작성되었습니다.*
`,

// f3: 나의_독서노트.md — 블로그 스타일 독서 노트
f3: `# 📚 나의 독서노트

> 읽은 책들의 핵심 내용과 인사이트를 기록합니다.

---

## 「사피엔스」 — 유발 하라리

**평점:** ★★★★★ (5/5)
**읽은 날짜:** 2026년 3월 15일

### 핵심 요약

인류의 역사를 **인지 혁명**, **농업 혁명**, **과학 혁명**의 세 축으로 해석한다.

### 주요 인사이트

1. **허구를 믿는 능력**이 인류 협력의 핵심이다
2. 농업 혁명은 인류 최대의 사기극이었다
3. 제국, 종교, 화폐가 인류를 통합했다
4. 과학 혁명은 "무지의 발견"에서 시작되었다

### 인상 깊은 구절

> *"역사의 몇 안 되는 철칙 가운데 하나는, 사치품은 필수품이 되고 새로운 의무를 낳는 경향이 있다는 것이다."*
> — 유발 하라리, 「사피엔스」 p.112

> *"우리는 밀을 길들인 것이 아니라, 밀이 우리를 길들였다."*
> — 유발 하라리, 「사피엔스」 p.97

### 실천 항목

- [x] 핵심 내용 3줄 요약 작성
- [x] 독서 모임에서 발표
- [ ] 후속작 「호모 데우스」 읽기

---

## 「원씽」 — 게리 켈러

**평점:** ★★★★☆ (4/5)
**읽은 날짜:** 2026년 2월 20일

### 핵심 메시지

> *"지금 내가 할 수 있는 단 하나의 일 — 그것을 하면 나머지 모든 것이 쉬워지거나 불필요해지는 일은 무엇인가?"*

### 독서 기록 테이블

| 장 | 제목 | 핵심 키워드 | 적용도 |
|---|------|------------|--------|
| 1부 | 거짓말 | 멀티태스킹의 신화 | ★★★★★ |
| 2부 | 진실 | 집중의 힘 | ★★★★☆ |
| 3부 | 결과 | 시간 블로킹 | ★★★★★ |

### 적용 계획

1. 매일 아침 **포커싱 질문** 던지기
2. **4시간 시간 블록** 확보하기
3. 에너지 관리: 수면 → 운동 → 영양

---

*"독서는 마음의 양식이다." 꾸준히 기록하자.*
`,

/* ═══════════════════════════════════════════════
   📁 프로젝트 기획
   ═══════════════════════════════════════════════ */

// f4: 2026_신규서비스_기획.md — Linear 스타일 기획서
f4: `# 2026 신규 서비스 기획서

> **Project Codename: Atlas** — 차세대 IoT 통합 플랫폼

---

## 프로젝트 개요

고객의 IoT 기기 사용 데이터를 분석하여 **맞춤형 생활 루틴**을 자동 제안하는 서비스.

### 목표

- 고객 만족도(NPS) **20% 향상**
- 기기 활용률 **35% 증가**
- 월간 활성 사용자(MAU) **50만 돌파**

---

## 타임라인

| 구분 | 기간 | 산출물 | 담당 |
|------|------|--------|------|
| Discovery | 2026.04 ~ 05 | 사용자 리서치 보고서 | UX팀 |
| Define | 2026.05 ~ 06 | PRD, 와이어프레임 | 기획팀 |
| Design | 2026.06 ~ 07 | UI 디자인, 프로토타입 | 디자인팀 |
| Develop | 2026.07 ~ 10 | MVP 개발 | 개발팀 |
| Test | 2026.10 ~ 11 | QA, 베타 테스트 | QA팀 |
| Launch | 2026.12 | 정식 출시 | 전체 |

---

## 마일스톤 체크리스트

- [x] 시장 조사 완료
- [x] 경쟁사 분석 보고서 작성
- [x] 이해관계자 킥오프 미팅
- [ ] 사용자 인터뷰 (20명)
- [ ] PRD 초안 작성
- [ ] 디자인 스프린트
- [ ] MVP 범위 확정
- [ ] 개발 착수

---

## 팀 구성

| 역할 | 담당자 | 책임 |
|------|--------|------|
| PM | 김태현 | 전체 일정/범위 관리 |
| UX 리서치 | 박소연 | 사용자 조사, 테스트 |
| 프론트엔드 | 이준혁 | React Native, 앱 UI |
| 백엔드 | 정민수 | API, 데이터 파이프라인 |
| AI/ML | 한서진 | 추천 알고리즘 |
| 디자인 | 오예린 | UI/UX 디자인 시스템 |

---

## 리스크 평가

| 리스크 | 영향도 | 발생 확률 | 대응 방안 |
|--------|--------|-----------|-----------|
| 일정 지연 | 높음 | 중간 | 2주 버퍼 확보, 스프린트 단축 |
| 데이터 부족 | 높음 | 낮음 | 기존 IoT 로그 활용 |
| 인력 변동 | 중간 | 중간 | 크로스-트레이닝 시행 |
| 기술 난이도 | 중간 | 높음 | POC 선행, 외부 자문 |

---

> *"작게 시작하고, 빠르게 배우고, 지속적으로 개선한다."*
`,

// f5: API_설계_명세.md — Vercel 스타일 기술 문서
f5: `# Atlas API 설계 명세서

> **Version:** 1.0.0-draft | **Base URL:** \\\`https://api.atlas.coway.com/v1\\\`

---

## 인증 (Authentication)

모든 API 요청에 Bearer Token이 필요합니다.

\\\`\\\`\\\`bash
curl -X GET https://api.atlas.coway.com/v1/routines \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"
\\\`\\\`\\\`

---

## 엔드포인트

### GET /routines

사용자의 루틴 목록을 조회합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| \\\`page\\\` | number | N | 페이지 번호 (기본값: 1) |
| \\\`limit\\\` | number | N | 페이지당 항목 수 (기본값: 20) |
| \\\`status\\\` | string | N | 필터: \\\`active\\\`, \\\`paused\\\`, \\\`draft\\\` |

**응답 예시:**

\\\`\\\`\\\`json
{
  "data": [
    {
      "id": "routine_01H8X...",
      "name": "아침 루틴",
      "status": "active",
      "devices": ["air_purifier_01", "water_purifier_03"],
      "schedule": {
        "type": "daily",
        "time": "07:00",
        "timezone": "Asia/Seoul"
      },
      "actions": [
        { "device": "air_purifier_01", "command": "power_on", "params": { "mode": "auto" } },
        { "device": "water_purifier_03", "command": "dispense", "params": { "temp": "warm", "amount": 250 } }
      ],
      "created_at": "2026-04-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
\\\`\\\`\\\`

---

### POST /routines

새 루틴을 생성합니다.

\\\`\\\`\\\`typescript
interface CreateRoutineRequest {
  name: string;
  devices: string[];
  schedule: {
    type: 'daily' | 'weekly' | 'custom';
    time: string;      // HH:mm
    days?: number[];    // 0-6 (일-토), weekly일 때
    timezone?: string;
  };
  actions: {
    device: string;
    command: string;
    params?: Record<string, unknown>;
  }[];
}
\\\`\\\`\\\`

---

### DELETE /routines/:id

루틴을 삭제합니다. \\\`204 No Content\\\` 응답.

---

## 에러 코드

| 코드 | 상태 | 설명 | 대응 |
|------|------|------|------|
| \\\`auth_expired\\\` | 401 | 토큰 만료 | 재로그인 |
| \\\`forbidden\\\` | 403 | 권한 부족 | 관리자 문의 |
| \\\`not_found\\\` | 404 | 리소스 없음 | ID 확인 |
| \\\`rate_limited\\\` | 429 | 요청 초과 | 60초 후 재시도 |
| \\\`server_error\\\` | 500 | 서버 오류 | 재시도, 지속 시 문의 |

\\\`\\\`\\\`json
{
  "error": {
    "code": "auth_expired",
    "message": "Access token has expired. Please re-authenticate.",
    "request_id": "req_01H8X..."
  }
}
\\\`\\\`\\\`

---

> *이 명세는 초안입니다. 변경사항은 Slack #atlas-api 채널에 공유됩니다.*
`,

// f6: 회의록_0414.md — 미니멀 회의록
f6: `# 주간 기획 회의록

**일시:** 2026년 4월 14일 (월) 10:00 ~ 11:00
**장소:** 본사 7층 세미나실 B
**참석자:** 김태현(PM), 박소연(UX), 이준혁(FE), 정민수(BE), 한서진(AI)

---

## 안건

### 1. Atlas 프로젝트 진행 현황

- UX 리서치: 사용자 인터뷰 12/20건 완료
- 프론트엔드: 앱 와이어프레임 1차 완성
- 백엔드: API 스키마 초안 리뷰 필요

### 2. 일정 조정 논의

Discovery 단계가 **1주 지연**되었으나, Define 단계와 병행 가능.

> 김태현: "인터뷰 잔여 8건은 다음 주까지 완료하되, Define 작업 병행하겠습니다."

### 3. 기술 검토

- 추천 알고리즘 POC 결과: 정확도 **78%** → 목표 85%까지 개선 필요
- 한서진: 데이터 추가 수집으로 2주 내 개선 가능

---

## 결정사항

1. Discovery & Define 병행 진행 확정
2. API 명세 리뷰: **4/16 수요일 14:00** 예정
3. 디자인 스프린트: **4/21 주간** 예정

---

## Action Items

- [ ] 사용자 인터뷰 잔여 8건 완료 — **박소연** (~ 4/18)
- [ ] API 스키마 문서 업데이트 — **정민수** (~ 4/16)
- [ ] 추천 알고리즘 학습 데이터 확장 — **한서진** (~ 4/25)
- [ ] 와이어프레임 피드백 반영 — **이준혁** (~ 4/18)
- [x] Atlas 킥오프 자료 공유 — **김태현** (완료)

---

*다음 회의: 4월 21일 (월) 10:00*
`,

/* ═══════════════════════════════════════════════
   📁 디자인 시스템
   ═══════════════════════════════════════════════ */

// f7: Apple_스타일_가이드.html — Apple 디자인 HTML
f7: `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Apple 스타일 가이드</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    background: #000; color: #f5f5f7; line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* Hero */
  .hero {
    min-height: 80vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
    padding: 80px 40px;
    background: linear-gradient(180deg, #000 0%, #1d1d1f 100%);
  }
  .hero-badge {
    display: inline-block; padding: 6px 16px; border-radius: 100px;
    background: rgba(255,255,255,0.08); color: #86868b; font-size: 13px;
    font-weight: 600; letter-spacing: 0.02em; margin-bottom: 24px;
    backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
  }
  .hero h1 {
    font-size: 72px; font-weight: 800; letter-spacing: -0.04em;
    line-height: 1.05; max-width: 800px;
    background: linear-gradient(180deg, #fff 30%, #86868b 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero p {
    font-size: 21px; color: #86868b; max-width: 600px;
    margin-top: 20px; font-weight: 400; line-height: 1.6;
  }

  /* Section */
  .section { padding: 100px 60px; max-width: 1200px; margin: 0 auto; }
  .section-title {
    font-size: 48px; font-weight: 800; letter-spacing: -0.03em;
    color: #f5f5f7; margin-bottom: 16px;
  }
  .section-sub {
    font-size: 18px; color: #86868b; max-width: 600px; margin-bottom: 60px;
  }

  /* Cards */
  .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
  .card {
    background: #1d1d1f; border-radius: 24px; padding: 48px;
    border: 1px solid rgba(255,255,255,0.06);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
  .card-icon {
    width: 48px; height: 48px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin-bottom: 24px;
    background: linear-gradient(135deg, #0071e3, #40a9ff);
  }
  .card h3 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
  .card p { color: #86868b; font-size: 15px; line-height: 1.6; }

  /* Frosted glass */
  .glass-card {
    background: rgba(255,255,255,0.04); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
    padding: 40px; margin-top: 60px;
  }
  .glass-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #0071e3; }
  .glass-card ul { list-style: none; }
  .glass-card li {
    padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
    color: #86868b; font-size: 15px;
  }
  .glass-card li::before { content: "→ "; color: #0071e3; font-weight: 600; }

  /* Footer */
  .footer {
    text-align: center; padding: 60px 40px;
    border-top: 1px solid rgba(255,255,255,0.06);
    color: #86868b; font-size: 13px;
  }
</style>
</head>
<body>
  <div class="hero">
    <span class="hero-badge">Design System v1.0</span>
    <h1>Apple 스타일 가이드</h1>
    <p>미니멀리즘과 명확성을 핵심으로 하는 디자인 언어. 콘텐츠가 주인공이 되는 인터페이스를 만듭니다.</p>
  </div>

  <div class="section">
    <h2 class="section-title">핵심 원칙</h2>
    <p class="section-sub">Apple 디자인의 네 가지 기둥</p>
    <div class="card-grid">
      <div class="card">
        <div class="card-icon">✨</div>
        <h3>명확성 (Clarity)</h3>
        <p>텍스트는 모든 크기에서 읽기 쉽고, 아이콘은 정확하며, 장식은 미묘하고 적절합니다.</p>
      </div>
      <div class="card">
        <div class="card-icon">🎯</div>
        <h3>존중 (Deference)</h3>
        <p>유려한 움직임과 선명한 인터페이스는 콘텐츠의 이해를 돕되, 절대 경쟁하지 않습니다.</p>
      </div>
      <div class="card">
        <div class="card-icon">⚡</div>
        <h3>깊이 (Depth)</h3>
        <p>시각적 레이어와 사실적인 움직임은 계층 구조를 전달하고 활력을 부여합니다.</p>
      </div>
      <div class="card">
        <div class="card-icon">💫</div>
        <h3>일관성 (Consistency)</h3>
        <p>익숙한 패턴과 표준 컨트롤로 사용자가 직관적으로 조작할 수 있게 합니다.</p>
      </div>
    </div>

    <div class="glass-card">
      <h3>타이포그래피 스케일</h3>
      <ul>
        <li>Large Title — 34pt, Bold</li>
        <li>Title 1 — 28pt, Bold</li>
        <li>Title 2 — 22pt, Bold</li>
        <li>Headline — 17pt, Semibold</li>
        <li>Body — 17pt, Regular</li>
        <li>Caption — 12pt, Regular</li>
      </ul>
    </div>
  </div>

  <div class="footer">
    <p>Apple 스타일 가이드 — Noleji View 디자인 시스템 레퍼런스</p>
  </div>
</body>
</html>`,

// f8: Stripe_컴포넌트.html — Stripe 디자인 HTML
f8: `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Stripe 컴포넌트 라이브러리</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #f6f9fc; color: #425466; line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* Header */
  .header {
    background: linear-gradient(135deg, #635bff 0%, #7c3aed 50%, #a855f7 100%);
    padding: 80px 60px; text-align: center; color: white;
  }
  .header h1 { font-size: 42px; font-weight: 800; letter-spacing: -0.03em; }
  .header p { font-size: 18px; opacity: 0.85; margin-top: 12px; max-width: 500px; margin-inline: auto; }

  .container { max-width: 1100px; margin: 0 auto; padding: 60px 40px; }
  .section-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.12em; color: #635bff; margin-bottom: 8px;
  }
  .section-title { font-size: 28px; font-weight: 700; color: #0a2540; margin-bottom: 40px; }

  /* Pricing Cards */
  .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 80px; }
  .pricing-card {
    background: white; border-radius: 16px; padding: 36px;
    border: 1px solid #e3e8ee; transition: all 0.2s;
    position: relative; overflow: hidden;
  }
  .pricing-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.08); transform: translateY(-2px); }
  .pricing-card.featured {
    border-color: #635bff; box-shadow: 0 8px 30px rgba(99,91,255,0.15);
  }
  .pricing-card.featured::before {
    content: "인기"; position: absolute; top: 16px; right: 16px;
    background: #635bff; color: white; font-size: 11px; font-weight: 700;
    padding: 4px 12px; border-radius: 100px;
  }
  .plan-name { font-size: 16px; font-weight: 700; color: #0a2540; }
  .plan-price { font-size: 42px; font-weight: 800; color: #0a2540; margin: 16px 0 4px; }
  .plan-price span { font-size: 16px; font-weight: 500; color: #425466; }
  .plan-desc { font-size: 14px; color: #425466; margin-bottom: 24px; }
  .plan-features { list-style: none; margin-bottom: 32px; }
  .plan-features li {
    padding: 8px 0; font-size: 14px; color: #425466;
    border-bottom: 1px solid #f0f2f5;
  }
  .plan-features li::before { content: "✓ "; color: #635bff; font-weight: 700; }
  .plan-btn {
    display: block; width: 100%; padding: 14px; border: none; border-radius: 10px;
    font-size: 15px; font-weight: 700; cursor: pointer; text-align: center;
    transition: all 0.2s;
  }
  .plan-btn.primary { background: #635bff; color: white; }
  .plan-btn.primary:hover { background: #4f46e5; }
  .plan-btn.secondary { background: #f6f9fc; color: #0a2540; border: 1px solid #e3e8ee; }
  .plan-btn.secondary:hover { background: #e3e8ee; }

  /* Feature Grid */
  .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
  .feature-item { padding: 24px 0; }
  .feature-icon {
    width: 40px; height: 40px; border-radius: 10px; margin-bottom: 16px;
    display: flex; align-items: center; justify-content: center; font-size: 20px;
    background: linear-gradient(135deg, #635bff20, #a855f720);
  }
  .feature-item h4 { font-size: 16px; font-weight: 700; color: #0a2540; margin-bottom: 8px; }
  .feature-item p { font-size: 14px; color: #425466; }

  .footer {
    text-align: center; padding: 40px; color: #8898aa;
    font-size: 13px; border-top: 1px solid #e3e8ee; margin-top: 60px;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>Stripe 컴포넌트 라이브러리</h1>
    <p>결제 인프라를 위한 우아하고 기능적인 UI 컴포넌트</p>
  </div>

  <div class="container">
    <p class="section-label">Pricing</p>
    <h2 class="section-title">요금제</h2>
    <div class="pricing-grid">
      <div class="pricing-card">
        <p class="plan-name">Starter</p>
        <p class="plan-price">무료<span></span></p>
        <p class="plan-desc">소규모 프로젝트에 적합</p>
        <ul class="plan-features">
          <li>월 1,000건 API 호출</li>
          <li>기본 분석 대시보드</li>
          <li>이메일 지원</li>
        </ul>
        <button class="plan-btn secondary">시작하기</button>
      </div>
      <div class="pricing-card featured">
        <p class="plan-name">Professional</p>
        <p class="plan-price">₩49,000<span>/월</span></p>
        <p class="plan-desc">성장하는 비즈니스를 위한 선택</p>
        <ul class="plan-features">
          <li>무제한 API 호출</li>
          <li>고급 분석 + 실시간 알림</li>
          <li>우선 기술 지원</li>
          <li>커스텀 웹훅</li>
        </ul>
        <button class="plan-btn primary">무료 체험</button>
      </div>
      <div class="pricing-card">
        <p class="plan-name">Enterprise</p>
        <p class="plan-price">문의<span></span></p>
        <p class="plan-desc">대규모 조직 맞춤 솔루션</p>
        <ul class="plan-features">
          <li>전용 인프라</li>
          <li>SLA 99.99%</li>
          <li>전담 매니저</li>
          <li>커스텀 통합</li>
        </ul>
        <button class="plan-btn secondary">영업팀 문의</button>
      </div>
    </div>

    <p class="section-label">Features</p>
    <h2 class="section-title">핵심 기능</h2>
    <div class="feature-grid">
      <div class="feature-item">
        <div class="feature-icon">🔒</div>
        <h4>엔드-투-엔드 암호화</h4>
        <p>모든 데이터는 전송 및 저장 시 AES-256으로 암호화됩니다.</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">⚡</div>
        <h4>글로벌 엣지 네트워크</h4>
        <p>전 세계 35개 리전에서 50ms 이하의 응답 시간을 보장합니다.</p>
      </div>
      <div class="feature-item">
        <div class="feature-icon">📊</div>
        <h4>실시간 분석</h4>
        <p>트랜잭션 흐름을 실시간으로 모니터링하고 이상 감지 알림을 받으세요.</p>
      </div>
    </div>
  </div>

  <div class="footer">Stripe 컴포넌트 라이브러리 — Noleji View 디자인 레퍼런스</div>
</body>
</html>`,

// f9: 브랜드_컬러_팔레트.md — Mistral 스타일 컬러 문서
f9: `# 브랜드 컬러 팔레트

> 일관된 브랜드 경험을 위한 **컬러 시스템 가이드라인**

---

## 프라이머리 컬러

| 이름 | HEX | 용도 |
|------|-----|------|
| **Flame Orange** | \\\`#FF5917\\\` | CTA 버튼, 핵심 액센트 |
| **Deep Violet** | \\\`#7C3AED\\\` | 보조 액센트, 그라데이션 |
| **Charcoal** | \\\`#1A202C\\\` | 본문 텍스트, 제목 |
| **Cloud White** | \\\`#FFFFFF\\\` | 배경, 카드 표면 |

## 시맨틱 컬러

| 역할 | 컬러 | HEX | 사용 예시 |
|------|------|-----|-----------|
| Success | 🟢 Green | \\\`#10B981\\\` | 완료 상태, 긍정 피드백 |
| Warning | 🟡 Amber | \\\`#F59E0B\\\` | 주의 메시지, 경고 배지 |
| Error | 🔴 Red | \\\`#EF4444\\\` | 오류 상태, 삭제 버튼 |
| Info | 🔵 Blue | \\\`#3B82F6\\\` | 정보 메시지, 링크 |

## 그라데이션

### Primary Gradient
\\\`background: linear-gradient(135deg, #FF5917, #7C3AED)\\\`

→ 히어로 섹션, CTA 버튼, 프리미엄 카드에 사용

### Dark Gradient
\\\`background: linear-gradient(180deg, #1A202C, #2D3748)\\\`

→ 다크 모드 배경, 네비게이션 바에 사용

---

## Do's & Don'ts

### ✅ Do's
- 충분한 명암 대비(WCAG AA 이상)를 확보하세요
- 시맨틱 컬러를 의미에 맞게 사용하세요
- 그라데이션은 135° 방향으로 통일하세요
- 컬러 토큰을 CSS 변수로 관리하세요

### ❌ Don'ts
- 프라이머리 컬러를 배경 전체에 사용하지 마세요
- 경고 의미 없이 빨간색을 장식으로 쓰지 마세요
- 3가지 이상의 컬러를 한 컴포넌트에 조합하지 마세요
- 불투명도만으로 텍스트 가독성을 조절하지 마세요

---

## 접근성 체크리스트

- [x] 일반 텍스트: 대비율 4.5:1 이상
- [x] 대형 텍스트: 대비율 3:1 이상
- [ ] 그래프/차트: 색상 외 패턴/레이블 보조
- [ ] 포커스 인디케이터: 3:1 이상 대비

---

> *"컬러는 단순한 장식이 아니라, 사용자와의 대화입니다."*
`,

/* ═══════════════════════════════════════════════
   📁 마케팅 & 콘텐츠
   ═══════════════════════════════════════════════ */

// f10: 랜딩페이지_시안.html — 풀 랜딩페이지 HTML
f10: `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Noleji View — Launch-ready Workspace</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: { accent: '#10B981', dark: '#1A202C' },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    }
  }
}
</script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  body { font-family: 'Inter', sans-serif; }
  .gradient-text {
    background: linear-gradient(135deg, #10B981, #3B82F6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .glow { box-shadow: 0 0 60px rgba(16, 185, 129, 0.15); }
</style>
</head>
<body class="bg-white text-gray-900 antialiased">
  <!-- Hero -->
  <section class="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-white"></div>
    <div class="relative z-10">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-8 border border-emerald-100">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        v2.5 출시 — 에디팅 툴바 & 6가지 디자인 스타일
      </div>
      <h1 class="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">
        <span class="gradient-text">Noleji View</span>
      </h1>
      <p class="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
        원본을 훼손하지 않는 <strong class="text-gray-900">로컬 우선 마크다운 관리 도구</strong>.<br>
        아름답게 작성하고, 완벽하게 렌더링하세요.
      </p>
      <div class="flex items-center gap-4 justify-center">
        <button class="px-8 py-4 bg-dark text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl hover:shadow-2xl active:scale-95">
          무료로 시작하기 →
        </button>
        <button class="px-8 py-4 bg-white text-gray-700 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-emerald-300 transition-all">
          데모 보기
        </button>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="py-24 px-6 bg-gray-50">
    <div class="max-w-6xl mx-auto">
      <p class="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Features</p>
      <h2 class="text-4xl font-black tracking-tight mb-16">왜 Noleji View인가?</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-3xl border border-gray-100 glow">
          <div class="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl mb-6">📝</div>
          <h3 class="text-xl font-bold mb-3">실시간 미리보기</h3>
          <p class="text-gray-500 leading-relaxed">에디터에 작성하는 즉시 우측에서 고품질 렌더링 결과를 확인할 수 있습니다.</p>
        </div>
        <div class="bg-white p-8 rounded-3xl border border-gray-100 glow">
          <div class="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl mb-6">🎨</div>
          <h3 class="text-xl font-bold mb-3">6가지 디자인 테마</h3>
          <p class="text-gray-500 leading-relaxed">Apple, Stripe, Linear 등 세계적 브랜드에서 영감 받은 디자인을 즉시 적용하세요.</p>
        </div>
        <div class="bg-white p-8 rounded-3xl border border-gray-100 glow">
          <div class="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl mb-6">🔒</div>
          <h3 class="text-xl font-bold mb-3">로컬 우선 설계</h3>
          <p class="text-gray-500 leading-relaxed">데이터는 당신의 기기에만 존재합니다. 클라우드 종속 없이 완전한 소유권을 보장합니다.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonial -->
  <section class="py-24 px-6">
    <div class="max-w-3xl mx-auto text-center">
      <div class="text-5xl mb-8">"</div>
      <blockquote class="text-2xl font-semibold text-gray-800 leading-relaxed mb-8">
        Noleji View를 도입한 후 기획 문서 작성 시간이 40% 단축되었습니다. 특히 PDF 내보내기 품질이 놀랍습니다.
      </blockquote>
      <div>
        <p class="font-bold text-lg">김태현</p>
        <p class="text-gray-400 text-sm">IoT기획팀 매니저, 코웨이</p>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-24 px-6 bg-dark text-white text-center">
    <h2 class="text-4xl font-black tracking-tight mb-4">지금 바로 시작하세요</h2>
    <p class="text-gray-400 text-lg mb-10 max-w-lg mx-auto">Mac, Windows, 웹 — 어디서든 동일한 경험으로 문서를 관리하세요.</p>
    <button class="px-10 py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl active:scale-95">
      Noleji View 다운로드 →
    </button>
  </section>

  <!-- Footer -->
  <footer class="py-10 text-center text-gray-400 text-sm border-t border-gray-100">
    <p>© 2026 Noleji View. Launch-ready Markdown Workspace.</p>
  </footer>
</body>
</html>`,

// f11: 뉴스레터_초안.md — 뉴스레터
f11: `# Noleji View 뉴스레터 Vol. 3

> *2026년 4월호 — 새 기능 소식과 활용 팁*

---

## 이번 달 하이라이트

### v2.5 업데이트 출시!

Noleji View v1.0가 정식 출시되었습니다. 이번 업데이트의 핵심 변경사항:

1. **마크다운 에디팅 툴바** — Obsidian 스타일의 직관적인 서식 도구
2. **6가지 디자인 테마** — Apple, Stripe, Linear, Vercel, Mistral, Asome
3. **폴더 트리 사이드바** — 프로젝트 단위 문서 관리
4. **PDF 내보내기 개선** — A4 페이지 가이드, 인쇄 최적화

> *"작은 도구가 큰 변화를 만듭니다."* — Noleji View 팀

---

## 활용 팁: 디자인 스타일 200% 활용하기

같은 마크다운 문서도 디자인 스타일에 따라 **전혀 다른 분위기**로 렌더링됩니다.

| 스타일 | 추천 용도 | 특징 |
|--------|-----------|------|
| Apple Premium | 발표 자료, 보고서 | 다크 배경, 그래디언트 |
| Stripe Elegant | 기술 문서, API 명세 | 보라 계열, 깔끔한 표 |
| Linear Minimal | 회의록, 메모 | 최소 장식, 가독성 |
| Vercel Precise | 개발 가이드 | 모노톤, 코드 중심 |
| Mistral French | 브랜딩 문서 | 오렌지-퍼플 그라데이션 |
| Asome Emerald | 범용 | 에메랄드 액센트, 세리프 |

### 단축키 모음

| 동작 | Mac | Windows |
|------|-----|---------|
| 굵게 | \\\`Cmd+B\\\` | \\\`Ctrl+B\\\` |
| 기울임 | \\\`Cmd+I\\\` | \\\`Ctrl+I\\\` |
| 실행 취소 | \\\`Cmd+Z\\\` | \\\`Ctrl+Z\\\` |
| 저장 | \\\`Cmd+S\\\` | \\\`Ctrl+S\\\` |

---

## 커뮤니티 스포트라이트

이번 달 가장 인기 있었던 커뮤니티 템플릿:

- [x] **주간 업무 보고서** — 김서연님 공유 (다운로드 2,340회)
- [x] **프로젝트 킥오프 문서** — 이재민님 공유 (다운로드 1,890회)
- [ ] **OKR 추적 대시보드** — 다음 호에 소개 예정

---

## 다음 업데이트 예고

- 멀티플랫폼 지원 (Mac / Windows / Web)
- 실시간 협업 기능
- AI 기반 문서 요약

---

*Noleji View를 사용해 주셔서 감사합니다.*
*피드백은 noleji-feedback@noleji.ai 로 보내주세요.*
`,

// f12: SNS_캠페인_보고서.md — 데이터 중심 보고서
f12: `# SNS 마케팅 캠페인 성과 보고서

> **기간:** 2026년 3월 1일 ~ 3월 31일 | **작성자:** 마케팅전략팀

---

## Executive Summary

3월 캠페인은 전월 대비 **인게이지먼트 +32%**, **팔로워 +18%** 성장을 달성했습니다.

---

## 채널별 성과

| 채널 | 팔로워 | 증감 | 도달 | 인게이지먼트율 |
|------|--------|------|------|----------------|
| Instagram | 52,300 | +4,200 (+8.7%) | 284,000 | 4.2% |
| YouTube | 18,700 | +2,100 (+12.6%) | 156,000 | 6.8% |
| Blog | 8,400 | +960 (+12.9%) | 67,000 | 3.1% |
| Twitter/X | 31,200 | +1,800 (+6.1%) | 198,000 | 2.4% |
| **전체** | **110,600** | **+9,060 (+8.9%)** | **705,000** | **4.1%** |

---

## 콘텐츠 유형별 분석

| 유형 | 게시 수 | 평균 도달 | 평균 좋아요 | 평균 댓글 | CTR |
|------|---------|-----------|------------|-----------|-----|
| 이미지 카드 | 24 | 8,200 | 340 | 28 | 2.1% |
| 숏폼 영상 | 12 | 18,500 | 1,200 | 85 | 4.7% |
| 롱폼 영상 | 4 | 12,300 | 680 | 120 | 3.2% |
| 블로그 포스트 | 8 | 5,400 | 180 | 42 | 5.8% |
| 캐러셀 | 16 | 11,700 | 520 | 56 | 3.4% |

### 인사이트

- **숏폼 영상**이 평균 도달과 인게이지먼트 모두 최고 성과
- **블로그 포스트**가 CTR(클릭률) 최고 — 전환에 효과적
- 캐러셀 콘텐츠의 저장률이 전월 대비 **+45%** 증가

---

## TOP 5 콘텐츠

| 순위 | 콘텐츠 | 채널 | 도달 | 인게이지먼트 |
|------|--------|------|------|--------------|
| 1 | "홈IoT 루틴 자동화 영상" | YouTube | 45,200 | 3,840 |
| 2 | "공기청정기 필터 교체 팁" | Instagram | 32,100 | 2,680 |
| 3 | "스마트홈 Before & After" | Instagram | 28,700 | 2,340 |
| 4 | "2026 IoT 트렌드 리포트" | Blog | 21,400 | 1,890 |
| 5 | "직원 인터뷰: 개발자 편" | YouTube | 18,900 | 1,560 |

---

## 광고 캠페인 성과

| 캠페인 | 예산 | 노출 | 클릭 | CPC | 전환 | CPA | ROAS |
|--------|------|------|------|-----|------|-----|------|
| 봄맞이 프로모션 | ₩5,000,000 | 1,240,000 | 31,000 | ₩161 | 620 | ₩8,065 | 3.2x |
| 브랜드 인지도 | ₩3,000,000 | 2,800,000 | 14,000 | ₩214 | 280 | ₩10,714 | 1.8x |
| 리타겟팅 | ₩2,000,000 | 480,000 | 19,200 | ₩104 | 960 | ₩2,083 | 5.1x |

---

## 4월 계획

- [ ] 숏폼 영상 제작 빈도 주 2→3회 증가
- [ ] 인플루언서 콜라보 2건 진행
- [ ] A/B 테스트: CTA 문구 최적화
- [ ] 블로그 SEO 개선 (상위 10 키워드 타겟)
- [x] 3월 캠페인 회고 완료

---

> *데이터 기반의 의사결정이 성과를 만듭니다.*
`,

/* ═══════════════════════════════════════════════
   📁 학습 & 참고자료
   ═══════════════════════════════════════════════ */

// f13: TypeScript_핵심정리.md — 코드 중심 기술 문서
f13: `# TypeScript 핵심 정리

> 실무에서 자주 쓰는 TypeScript 패턴과 타입 시스템 정리

---

## 1. 기본 타입

\\\`\\\`\\\`typescript
// 원시 타입
const name: string = 'noleji-view';
const version: number = 2.5;
const isReady: boolean = true;

// 배열
const features: string[] = ['editor', 'preview', 'export'];
const matrix: number[][] = [[1, 2], [3, 4]];

// 튜플
const entry: [string, number] = ['views', 1024];

// Enum
enum Status {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}
\\\`\\\`\\\`

---

## 2. 인터페이스 vs 타입

\\\`\\\`\\\`typescript
// Interface — 확장 가능, 선언 병합
interface Document {
  id: string;
  title: string;
  content: string;
}

interface Document {
  updatedAt: Date; // 선언 병합으로 필드 추가
}

// Type — 유니온, 인터섹션, 매핑 타입
type FileType = 'md' | 'html' | 'pdf';
type WithMeta<T> = T & { createdAt: Date; author: string };
type DocWithMeta = WithMeta<Document>;
\\\`\\\`\\\`

---

## 3. 제네릭 (Generics)

\\\`\\\`\\\`typescript
// 기본 제네릭 함수
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}

// 제네릭 제약 조건
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 제네릭 클래스
class Repository<T extends { id: string }> {
  private items: Map<string, T> = new Map();

  save(item: T): void {
    this.items.set(item.id, item);
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }

  findAll(): T[] {
    return Array.from(this.items.values());
  }
}
\\\`\\\`\\\`

---

## 4. 유틸리티 타입

| 유틸리티 | 설명 | 예시 |
|----------|------|------|
| \\\`Partial<T>\\\` | 모든 속성 선택적 | 업데이트 DTO |
| \\\`Required<T>\\\` | 모든 속성 필수 | 검증 후 타입 |
| \\\`Pick<T, K>\\\` | 특정 속성만 선택 | 목록 뷰 |
| \\\`Omit<T, K>\\\` | 특정 속성 제외 | 생성 DTO |
| \\\`Record<K, V>\\\` | 키-값 매핑 | 설정 객체 |
| \\\`Readonly<T>\\\` | 읽기 전용 | 상수 설정 |

\\\`\\\`\\\`typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

type CreateUser = Omit<User, 'id'>;
type UpdateUser = Partial<Pick<User, 'name' | 'email'>>;
type UserMap = Record<string, User>;
\\\`\\\`\\\`

---

## 5. 조건부 타입

\\\`\\\`\\\`typescript
type IsString<T> = T extends string ? 'yes' : 'no';

type A = IsString<string>;  // 'yes'
type B = IsString<number>;  // 'no'

// 실전: API 응답 래퍼
type ApiResponse<T> = T extends undefined
  ? { success: boolean; message: string }
  : { success: boolean; data: T; message: string };
\\\`\\\`\\\`

---

## 6. 타입 가드

\\\`\\\`\\\`typescript
interface Markdown { type: 'md'; content: string; }
interface Html { type: 'html'; content: string; styles: string; }
type DocFile = Markdown | Html;

function isHtml(doc: DocFile): doc is Html {
  return doc.type === 'html';
}

function render(doc: DocFile) {
  if (isHtml(doc)) {
    // doc은 Html 타입으로 좁혀짐
    console.log(doc.styles);
  }
}
\\\`\\\`\\\`

---

> *타입은 런타임이 아닌 컴파일 타임에 버그를 잡는 방패입니다.*
`,

// f14: CSS_Grid_레이아웃.html — CSS Grid 데모 HTML
f14: `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CSS Grid 레이아웃 가이드</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif; background: #fafafa;
    color: #333; line-height: 1.6; padding: 60px 40px;
    max-width: 900px; margin: 0 auto;
  }
  h1 {
    font-size: 36px; font-weight: 800; letter-spacing: -0.03em;
    margin-bottom: 8px; color: #111;
  }
  .subtitle { color: #888; font-size: 16px; margin-bottom: 48px; }
  h2 {
    font-size: 22px; font-weight: 700; margin-top: 56px;
    margin-bottom: 16px; color: #111;
    padding-bottom: 8px; border-bottom: 2px solid #eee;
  }
  p { margin-bottom: 16px; color: #555; }
  code {
    font-family: 'JetBrains Mono', monospace; font-size: 13px;
    background: #f0f0f0; padding: 2px 8px; border-radius: 4px;
  }
  pre {
    background: #1a202c; color: #e2e8f0; padding: 20px 24px;
    border-radius: 12px; margin: 16px 0 32px; overflow-x: auto;
    font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.7;
  }

  /* Grid demos */
  .demo { margin: 20px 0 40px; }
  .grid-box {
    display: flex; align-items: center; justify-content: center;
    border-radius: 10px; font-weight: 700; font-size: 14px; color: white;
    min-height: 60px; transition: transform 0.2s;
  }
  .grid-box:hover { transform: scale(1.03); }
  .c1 { background: #10B981; }
  .c2 { background: #3B82F6; }
  .c3 { background: #8B5CF6; }
  .c4 { background: #F59E0B; }
  .c5 { background: #EF4444; }
  .c6 { background: #EC4899; }
  .c7 { background: #14B8A6; }
  .c8 { background: #6366F1; }

  /* Demo 1: Basic Grid */
  .demo-basic {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  }
  /* Demo 2: Unequal */
  .demo-unequal {
    display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px;
  }
  /* Demo 3: Spanning */
  .demo-span {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }
  .span-2 { grid-column: span 2; }
  .span-3 { grid-column: span 3; }
  .row-span-2 { grid-row: span 2; min-height: 132px; }
  /* Demo 4: Named areas */
  .demo-areas {
    display: grid;
    grid-template-areas: "header header header" "sidebar main main" "footer footer footer";
    grid-template-rows: 60px 200px 50px;
    grid-template-columns: 200px 1fr 1fr;
    gap: 12px;
  }
  .area-header { grid-area: header; }
  .area-sidebar { grid-area: sidebar; }
  .area-main { grid-area: main; }
  .area-footer { grid-area: footer; }

  /* Demo 5: auto-fill */
  .demo-autofill {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .tip {
    background: #f0fdf4; border-left: 4px solid #10B981;
    padding: 16px 20px; border-radius: 0 10px 10px 0;
    margin: 20px 0; font-size: 14px; color: #333;
  }
  .footer-note {
    text-align: center; color: #aaa; font-size: 13px;
    margin-top: 60px; padding-top: 24px; border-top: 1px solid #eee;
  }
</style>
</head>
<body>
  <h1>CSS Grid 레이아웃 가이드</h1>
  <p class="subtitle">실전 예제로 배우는 CSS Grid — 보고 바로 쓰는 레이아웃 패턴</p>

  <h2>1. 기본 그리드 (3열)</h2>
  <pre>display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 12px;</pre>
  <div class="demo demo-basic">
    <div class="grid-box c1">1</div>
    <div class="grid-box c2">2</div>
    <div class="grid-box c3">3</div>
    <div class="grid-box c4">4</div>
    <div class="grid-box c5">5</div>
    <div class="grid-box c6">6</div>
  </div>

  <h2>2. 비균등 열 (2fr 1fr 1fr)</h2>
  <pre>grid-template-columns: 2fr 1fr 1fr;</pre>
  <div class="demo demo-unequal">
    <div class="grid-box c2">2fr</div>
    <div class="grid-box c3">1fr</div>
    <div class="grid-box c4">1fr</div>
  </div>

  <h2>3. 열/행 병합 (span)</h2>
  <pre>grid-column: span 2;  /* 2열 병합 */
grid-row: span 2;     /* 2행 병합 */</pre>
  <div class="demo demo-span">
    <div class="grid-box c1 span-2">span 2</div>
    <div class="grid-box c8 row-span-2">row 2</div>
    <div class="grid-box c3">1</div>
    <div class="grid-box c4">2</div>
    <div class="grid-box c5">3</div>
    <div class="grid-box c6 span-3">span 3</div>
  </div>

  <h2>4. 이름 기반 영역 (grid-template-areas)</h2>
  <pre>grid-template-areas:
  "header  header  header"
  "sidebar main    main"
  "footer  footer  footer";</pre>
  <div class="demo demo-areas">
    <div class="grid-box c2 area-header">Header</div>
    <div class="grid-box c3 area-sidebar">Sidebar</div>
    <div class="grid-box c1 area-main">Main Content</div>
    <div class="grid-box c4 area-footer">Footer</div>
  </div>

  <h2>5. 반응형 자동 채움 (auto-fill)</h2>
  <pre>grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));</pre>
  <p>브라우저 너비에 따라 열 수가 자동 조절됩니다.</p>
  <div class="demo demo-autofill">
    <div class="grid-box c1">A</div>
    <div class="grid-box c2">B</div>
    <div class="grid-box c3">C</div>
    <div class="grid-box c4">D</div>
    <div class="grid-box c5">E</div>
    <div class="grid-box c6">F</div>
    <div class="grid-box c7">G</div>
    <div class="grid-box c8">H</div>
  </div>

  <div class="tip">
    <strong>팁:</strong> <code>auto-fill</code>은 빈 열도 공간을 차지하고,
    <code>auto-fit</code>은 빈 열을 접어서 남은 아이템이 늘어납니다.
  </div>

  <p class="footer-note">CSS Grid 레이아웃 가이드 — Noleji View 학습 자료</p>
</body>
</html>`,

// f15: React_19_변경사항.md — 기술 블로그 스타일
f15: `# React 19 주요 변경사항 정리

> React 19가 가져온 핵심 변화와 마이그레이션 가이드

---

## 1. React Compiler (자동 메모이제이션)

React 19의 가장 큰 변화는 **React Compiler**입니다.
\\\`useMemo\\\`, \\\`useCallback\\\`, \\\`memo\\\`를 수동으로 작성할 필요가 없어집니다.

### Before (React 18)

\\\`\\\`\\\`typescript
import { useMemo, useCallback, memo } from 'react';

const ExpensiveList = memo(({ items, onSelect }: Props) => {
  const sorted = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  const handleClick = useCallback(
    (id: string) => onSelect(id),
    [onSelect]
  );

  return (
    <ul>
      {sorted.map(item => (
        <li key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});
\\\`\\\`\\\`

### After (React 19)

\\\`\\\`\\\`typescript
// memo, useMemo, useCallback 불필요 — 컴파일러가 자동 처리
function ExpensiveList({ items, onSelect }: Props) {
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ul>
      {sorted.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
\\\`\\\`\\\`

---

## 2. use() — 새로운 데이터 읽기 API

\\\`use()\\\`는 Promise와 Context를 조건부로 읽을 수 있는 새 API입니다.

\\\`\\\`\\\`typescript
import { use, Suspense } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // 조건문/반복문 내에서도 호출 가능

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// 사용
<Suspense fallback={<Skeleton />}>
  <UserProfile userPromise={fetchUser(id)} />
</Suspense>
\\\`\\\`\\\`

---

## 3. Server Components (안정화)

| 특성 | Server Component | Client Component |
|------|-----------------|-----------------|
| 실행 위치 | 서버 | 브라우저 |
| JS 번들 | 포함 안 됨 | 포함됨 |
| DB 접근 | 직접 가능 | API 필요 |
| 상태 관리 | 불가 (stateless) | 가능 |
| 이벤트 핸들러 | 불가 | 가능 |

\\\`\\\`\\\`typescript
// Server Component (기본값)
async function DocumentList() {
  const docs = await db.documents.findMany(); // 직접 DB 쿼리!

  return (
    <ul>
      {docs.map(doc => (
        <li key={doc.id}>
          <DocCard doc={doc} />     {/* Server Component */}
          <LikeButton id={doc.id} /> {/* Client Component */}
        </li>
      ))}
    </ul>
  );
}
\\\`\\\`\\\`

---

## 4. Actions (폼 처리 혁신)

\\\`\\\`\\\`typescript
'use client';
import { useActionState } from 'react';

async function createDocument(prev: State, formData: FormData) {
  'use server';
  const title = formData.get('title') as string;
  await db.documents.create({ title });
  return { success: true, message: '문서가 생성되었습니다.' };
}

function CreateDocForm() {
  const [state, action, isPending] = useActionState(createDocument, null);

  return (
    <form action={action}>
      <input name="title" placeholder="문서 제목" required />
      <button disabled={isPending}>
        {isPending ? '생성 중...' : '문서 생성'}
      </button>
      {state?.message && <p>{state.message}</p>}
    </form>
  );
}
\\\`\\\`\\\`

---

## 5. 마이그레이션 체크리스트

- [x] React 19, React DOM 19 업그레이드
- [x] TypeScript 5.5+ 확인
- [ ] \\\`forwardRef\\\` → ref를 props로 직접 전달
- [ ] \\\`useContext(Ctx)\\\` → \\\`use(Ctx)\\\` 변환
- [ ] Context.Provider → Context로 직접 렌더링
- [ ] 수동 memo/useMemo/useCallback 제거 (컴파일러 의존)
- [ ] \\\`react-test-renderer\\\` → \\\`@testing-library/react\\\` 전환

---

> *React 19는 "더 적게 작성하고, 더 많이 달성하는" 방향으로의 큰 도약입니다.*
`,

};
