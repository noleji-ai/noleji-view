# docwise v1.0 — 서비스 설명서

## 개요

**docwise**는 AI 기반 마크다운 지식 관리 도구입니다. 웹 앱과 macOS 데스크톱 앱(Electron)을 모두 제공하며, 마크다운 문서 작성/관리/공유를 위한 올인원 솔루션입니다.

- **웹 데모**: https://noleji-ai.github.io/docwise
- **라이선스**: MIT
- **버전**: 1.0.0

---

## 핵심 기능

### 1. 마크다운 편집기
- Obsidian 스타일 마크다운 툴바 (헤딩, 볼드, 이탤릭, 코드블록, 리스트 등)
- 실시간 미리보기 (unified + remark + rehype 파이프라인)
- GFM(GitHub Flavored Markdown) 완벽 지원 (테이블, 체크리스트, 코드 하이라이팅)
- **리사이즈 가능한 스플릿 패인** — 에디터/미리보기 비율을 드래그로 20~80% 조절

### 2. 폴더/파일 관리
- 워크스페이스 기반 폴더 트리 + 파일 목록
- 파일 생성/이름변경/삭제/다운로드
- **파일 가져오기** — MD/HTML/TXT + 이미지 동시 임포트 (이미지 base64 자동 변환)
- **파일 이동** — 우클릭 "폴더로 이동" 메뉴 + 드래그 앤 드롭
- 컨텍스트 메뉴 (우클릭)

### 3. 6종 프리미엄 디자인 템플릿
- Apple, Stripe, Linear, Vercel, Mistral, Asome 스타일
- 인스펙터 패널에서 원클릭 적용
- 폰트 사이즈, 줄 간격, 여백, 문서 폭 실시간 조절
- 다크/라이트 모드

### 4. AI 지식 체계 생성 (Karpathy Wiki)
- LLM 연동 (OpenAI, Anthropic, 로컬 LLM)
- 폴더 내 문서를 분석하여 엔티티/개념/요약 기반 위키 자동 생성
- 생성된 지식 체계를 서브폴더로 관리

### 5. 내보내기
- **MD 다운로드** — 원본 마크다운
- **HTML 내보내기** — 스타일 적용된 단독 HTML
- **PDF 내보내기** — A4 페이지 가이드, jsPDF + html2canvas

### 6. 공유 (Publish & Share)
- **내부 공유** — HTML 파일 직접 다운로드
- **외부 공유** — 링크 생성 후 클립보드 복사
  - 무료: localStorage 기반 LAN 공유 (같은 네트워크에서만 접근)
  - 유료: **GitHub Gist 기반 영구 링크** (어디서든 접근 가능)
- **문서 포크** — 공유 받은 문서를 내 저장공간에 저장

### 7. macOS 데스크톱 앱 (Electron)
- `.md`, `.html`, `.htm` 파일 더블클릭으로 뷰어 열기
- 뷰어 → "수정하기" 버튼으로 본체 에디터 전환
- **앱 메뉴바** — 파일/편집/보기(줌 인·아웃·리셋)/윈도우
- macOS 트래픽라이트 + 윈도우 드래그 지원
- **미리보기 버튼** — 에디터에서 뷰어 윈도우 직접 열기
- 파일 연결 설정 (기본 앱으로 등록)

### 8. 요금제
| 플랜 | 가격 | 주요 기능 |
|------|------|----------|
| Free | 무료 | 마크다운 편집, 6종 템플릿, 일 5회 프리미엄 기능 |
| Monthly | $9/월 | 무제한 프리미엄, Gist 영구 링크, 무제한 지식 생성 |
| Lifetime | $49 (1회) | Monthly 전체 기능 + 영구 라이선스 |

---

## 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| **프레임워크** | React | 19 |
| **언어** | TypeScript | 6 |
| **빌드** | Vite | 8 |
| **스타일링** | Tailwind CSS | 4 |
| **마크다운** | unified + remark + rehype | 11 |
| **코드 하이라이팅** | rehype-highlight | 7 |
| **PDF** | jsPDF + html2canvas | 4 / 1 |
| **라우팅** | React Router | 7 |
| **아이콘** | Lucide React | 1.8 |
| **데스크톱** | Electron | 33 |
| **패키징** | electron-builder | 25 |

---

## 프로젝트 구조

```
docwise/
├── app/                          # 웹 앱 (React + Vite)
│   ├── src/
│   │   ├── components/           # 공통 컴포넌트
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── InlineEdit.tsx
│   │   │   ├── MarkdownToolbar.tsx
│   │   │   ├── PricingSection.tsx
│   │   │   ├── SettingsModal.tsx  # 설정 (일반/에디터/AI/계정/뷰어)
│   │   │   └── UsageBadge.tsx
│   │   ├── data/
│   │   │   ├── designTemplates.ts # 6종 디자인 템플릿 정의
│   │   │   └── sampleContents.ts  # 샘플 문서 콘텐츠
│   │   ├── hooks/
│   │   │   ├── useAuth.ts        # 인증 (localStorage 기반)
│   │   │   └── useMarkdownParser.ts # unified 파이프라인
│   │   ├── pages/
│   │   │   ├── EditorPage.tsx    # 메인 에디터 (핵심 ~1350줄)
│   │   │   ├── LandingPage.tsx   # 랜딩 페이지
│   │   │   ├── PricingPage.tsx   # 요금제 + Stripe 결제
│   │   │   ├── SharedPage.tsx    # 공유 문서 뷰어
│   │   │   └── ViewerPage.tsx    # 파일 뷰어 (읽기 전용)
│   │   ├── services/
│   │   │   ├── gistStorage.ts    # GitHub Gist API (영구 링크)
│   │   │   ├── llmClient.ts     # LLM 연동 (OpenAI/Anthropic)
│   │   │   ├── stripeCheckout.ts # Stripe Payment Link
│   │   │   └── wiki.ts          # 위키 지식 체계 생성
│   │   ├── shared/
│   │   │   ├── settingsStore.ts  # 뷰어 설정 저장소
│   │   │   └── viewerSettings.ts # 뷰어 설정 타입
│   │   ├── types/
│   │   │   ├── electron.d.ts    # Electron API 타입
│   │   │   └── llm.ts           # LLM 설정 타입
│   │   ├── utils/
│   │   │   ├── featureGate.ts   # 무료/유료 기능 게이팅
│   │   │   └── networkUtils.ts  # LAN IP 조회
│   │   ├── main.tsx             # 앱 엔트리 (HashRouter/BrowserRouter)
│   │   └── index.css            # 전역 스타일 + Electron CSS
│   ├── public/                   # 정적 자산 (favicon 등)
│   ├── vite.config.ts           # Vite 설정 (base: ./ or /docwise/)
│   ├── tsconfig.json
│   └── package.json
├── desktop/                      # Electron 데스크톱 앱
│   ├── src/
│   │   ├── main.ts              # 메인 프로세스 (윈도우, 메뉴, IPC)
│   │   ├── preload.ts           # contextBridge API
│   │   ├── ipc/
│   │   │   ├── fileOpen.ts      # 파일 읽기/저장 IPC
│   │   │   └── settings.ts      # 설정 IPC
│   │   ├── utils/
│   │   │   └── fileAssociation.ts # macOS 파일 연결
│   │   └── viewer/
│   │       └── viewerWindow.ts  # 뷰어 윈도우 팩토리
│   ├── build/                    # 앱 아이콘 (icon.icns)
│   ├── tsconfig.json
│   └── package.json
├── .github/
│   └── workflows/               # GitHub Actions (Pages 배포)
├── BRAND_IDENTITY.md            # 브랜드 디자인 가이드
├── CONTRIBUTING.md
├── LICENSE                       # MIT
├── README.md
└── SERVICE_DESCRIPTION.md       # 이 문서
```

---

## 개발 환경 설정

### 필수 조건
- Node.js 20+
- npm 10+

### 웹 앱 개발
```bash
cd app
npm install
npm run dev
# → http://localhost:5173/docwise/
```

### Electron 앱 개발
```bash
# 1. 웹 앱 빌드 (Electron 모드)
cd app
ELECTRON=true npm run build:electron

# 2. Electron 메인 프로세스 빌드 + 실행
cd ../desktop
npm install
npm run dev
```

### macOS 앱 패키징
```bash
# 웹 앱 + Electron 빌드 + DMG 생성
cd desktop
npm run build
# → desktop/release/docwise-1.0.0-arm64.dmg
```

또는 단계별:
```bash
cd app && ELECTRON=true npm run build:electron
cd ../desktop && npx tsc && ./node_modules/.bin/electron-builder --mac
```

---

## 주요 설정

### Vite (`app/vite.config.ts`)
- `base`: Electron 빌드 시 `'./'` (file:// 프로토콜), 웹 빌드 시 `'/docwise/'`
- 환경변수 `ELECTRON=true`로 전환

### Electron 빌드 (`desktop/package.json` → `build`)
- `appId`: `com.coway.docwise`
- `fileAssociations`: `.md`, `.html`, `.htm`
- `extraResources`: `../app/dist` → `app-dist` (웹 앱 번들 포함)

### 라우팅 (`app/src/main.tsx`)
- Electron: `HashRouter` (file:// 프로토콜 호환)
- 웹: `BrowserRouter` (basename: `/docwise`)
- `window.electronAPI` 존재 여부로 자동 감지

---

## 데이터 저장

모든 데이터는 **로컬** 저장:
- `localStorage` — 문서, 설정, 인증 상태, 사용량 카운터
- `SAMPLE_CONTENTS` 객체 (in-memory) — 현재 세션 문서 내용
- Electron: 로컬 파일 시스템 직접 읽기/쓰기

서버 의존성 없음 (GitHub Gist 영구 링크 제외).

---

## 미구현 / 향후 과제

1. **Stripe 실제 연동** — 현재 플레이스홀더 Payment Link URL 사용
2. **서버 기반 공유** — Gist 외에 자체 서버 기반 공유 옵션
3. **Windows/Linux 빌드** — 현재 macOS만 지원
4. **CodeMirror 에디터** — 현재 `<textarea>`, CodeMirror 6 전환 예정
5. **실시간 협업** — 다중 사용자 동시 편집
6. **코드 사이닝** — Apple Developer ID로 서명 필요 (현재 미서명)

---

*docwise v1.0.0 | 2026-04-15 | Coway OpenWork*
