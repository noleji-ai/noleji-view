# docwise

**AI 기반 마크다운 지식 관리 도구** | AI-Powered Markdown Knowledge Management Tool

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue.svg)](https://tailwindcss.com)

> **Demo**: [https://noleji.synology.me/apps/noleji-view](https://noleji.synology.me/apps/noleji-view)

---

## 주요 기능

- **실시간 마크다운 편집** - CodeMirror 기반 고성능 에디터와 실시간 미리보기
- **다양한 내보내기** - HTML, PDF, Markdown 등 다양한 형식으로 문서 내보내기
- **브랜드 테마 템플릿** - Apple, Stripe, Vercel, Linear, Mistral 등 유명 브랜드 스타일 템플릿
- **GFM 지원** - GitHub Flavored Markdown 완벽 지원 (테이블, 체크리스트, 코드 하이라이팅)
- **로컬 우선** - 서버 불필요, 브라우저 내 localStorage로 데이터 관리
- **반응형 디자인** - 데스크톱/태블릿/모바일 대응

## Quick Start

```bash
cd app
npm install
npm run dev
```

브라우저에서 `http://localhost:5173/apps/noleji-view/` 접속

## Tech Stack

| 분류 | 기술 |
|------|------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Editor | CodeMirror 6 |
| Markdown | unified / remark / rehype |
| Export | jsPDF, html2canvas |
| Routing | React Router 7 |

## Pricing

| Plan | 가격 | 주요 기능 |
|------|------|----------|
| **Free** | 무료 | 마크다운 편집, GFM 지원, 로컬 저장 |
| **Pro** | $9/월 | 브랜드 테마, PDF 내보내기, 무제한 문서 |
| **Team** | $19/월/인 | 팀 협업, 공유 워크스페이스, 우선 지원 |

## Project Structure

```
docwise/
  app/              # Main web application (React + Vite)
  packages/
    docwise-renderer/  # Markdown rendering & export engine
```

## License

[MIT](LICENSE)
