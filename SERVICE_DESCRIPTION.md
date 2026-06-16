# Noleji View v1.0 — 서비스 설명서

## 개요

**Noleji View**는 Markdown/HTML 문서를 작성하고, 디자인 스타일을 적용해 미리보기/내보내기하며, 문서 폴더를 탐색 가능한 지식 체계로 바꾸는 로컬 우선 문서 워크스페이스입니다.

- 웹 데모: https://noleji.synology.me/apps/noleji-view
- GitHub: https://github.com/noleji-ai/noleji-view
- macOS 번들 ID: `com.noleji.view`
- 배포 파일: `Noleji-View-1.0.0-arm64.dmg`
- 라이선스: MIT

## 현재 기능

### 1. Markdown/HTML 편집과 미리보기

- Markdown 편집, HTML 문서 모드, 실시간 미리보기
- GFM 테이블, 체크리스트, 코드블록, 코드 하이라이팅
- 찾기/바꾸기, 툴바 기반 Markdown 서식 삽입
- 에디터/미리보기 스플릿 패인 조절

### 2. 6개 디자인 스타일

Noleji View는 문서 성격에 맞춰 다음 6개 스타일을 적용할 수 있습니다.

- Apple
- Stripe
- Linear
- Vercel
- Mistral
- Asome

스타일은 미리보기, viewer, HTML/PDF 내보내기 흐름에서 일관되게 사용됩니다.

### 3. macOS 파일 연결

Electron 데스크톱 앱은 Markdown/HTML viewer 역할로 등록됩니다.

- `.md`, `.markdown`
- `.html`, `.htm`
- Info.plist `CFBundleDocumentTypes`
- app id `com.noleji.view`
- product name `Noleji View`

Finder의 "다음으로 열기"와 기본 앱 설정 안내를 통해 문서를 Noleji View로 열 수 있습니다.

### 4. 첫 실행 3스텝 튜토리얼

데스크톱 첫 실행 시 사용자는 다음 흐름을 안내받습니다.

1. Markdown/HTML 파일 열기
2. 문서 디자인 스타일 선택
3. macOS 기본 앱 설정 방법 확인

미공증/ad-hoc 배포를 고려해 우클릭 후 "열기" 안내도 DMG와 앱 내 튜토리얼에 포함됩니다.

### 5. Karpathy Wiki 스타일 지식 체계

선택한 폴더의 Markdown/HTML 문서를 분석해 `_지식체계` 하위 폴더를 생성합니다.

생성 산출물은 항상 핵심 5개 파일로 정리됩니다.

- `index.md` — 전체 구조와 이동 허브
- `_overview.md` — 종합 개요와 원본 문서 요약
- `_entities.md` — 핵심 엔티티 묶음
- `_concepts.md` — 핵심 개념 묶음
- `log.md` — 처리 로그와 생성 기록

사용법 안내는 좌측 패널 hover 팝오버가 아니라 중앙 모달로 표시됩니다. 모달은 반투명 backdrop, 닫기 버튼, Esc 닫기, backdrop 클릭 닫기, `80vh` 높이 제한, 내부 스크롤을 사용해 작은 화면에서도 안내가 잘리지 않습니다.

### 6. 내보내기와 공유

- Markdown 다운로드
- standalone HTML 내보내기
- PDF 내보내기
- Electron viewer 창 열기
- 계정 기반 공유 링크 준비

### 7. 요금제

| 플랜 | 가격 | 주요 기능 |
| --- | ---: | --- |
| Free | ₩0 | Markdown/HTML 편집, 로컬 자동저장, 클라우드 백업 준비, 3개 폴더, 폴더당 10개 파일, 2종 디자인 템플릿, 프리미엄 기능 하루 10회 체험 |
| Monthly | ₩5,000/월 | 무제한 폴더/파일, 6종 디자인 템플릿, PDF/HTML 내보내기 무제한, Managed AI + Wiki 생성, 계정 기반 공유 링크 |
| Lifetime | ₩30,000 1회 | 월간 기능 전체, 커스텀 디자인 템플릿, 우선 지원, 새 기능 얼리 액세스, 평생 업데이트 |

## 기술 스택

| 분류 | 기술 |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript 6 |
| Build | Vite 8 |
| Desktop | Electron 33 |
| Packaging | electron-builder 25 + hdiutil UDZO |
| Markdown | unified / remark / rehype |
| Export | jsPDF / html2canvas |
| Icons | Lucide React |

## 개발

```bash
cd app
npm install
npm run dev
```

데스크톱 빌드:

```bash
cd desktop
npm install
npm run build
npm run package:dmg
```

`npm run package:dmg`는 다음을 수행합니다.

1. `codesign --force --deep --sign -`로 ad-hoc 재서명
2. `hdiutil`로 UDZO DMG 생성
3. `hdiutil verify`로 이미지 검증
4. quarantine xattr 시뮬레이션 후 `codesign --verify --deep --strict` 검증
5. `deploy/nas-homepage-2026-05-25/apps/noleji-view/download/`에 DMG 출력

## 프로젝트 구조

```text
noleji-view/
├── app/                    # React + Vite 앱
│   ├── src/components/     # 공통 UI
│   ├── src/data/           # 디자인 템플릿, 샘플 문서, 요금제
│   ├── src/pages/          # Editor, Viewer, Pricing, Landing 등
│   ├── src/services/wiki/  # Karpathy Wiki 스타일 지식 생성
│   └── src/shared/         # viewer settings
├── desktop/                # Electron shell
│   ├── src/main.ts         # 메인 프로세스
│   ├── src/preload.ts      # contextBridge API
│   ├── src/ipc/            # 파일/설정 IPC
│   ├── src/utils/          # 파일 연결 안내
│   └── scripts/create-dmg.sh
├── README.md
├── SERVICE_DESCRIPTION.md
└── BRAND_IDENTITY.md
```

## 정체성 기준

- 제품명은 항상 **Noleji View**로 표기합니다.
- repository는 `noleji-ai/noleji-view`입니다.
- macOS app id는 `com.noleji.view`입니다.
- 과거 제품명, 과거 macOS app id, 이전 외부 브랜드 표기는 신규 문서/메타데이터에 사용하지 않습니다.

---

Noleji View v1.0.0 | 2026-06-16 | noleji-ai
