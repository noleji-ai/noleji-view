import type { FolderItem } from '../types/workspace';

export const EXTERNAL_FILES_FOLDER_ID = 'desktop-external-files';

export const INITIAL_FOLDERS: FolderItem[] = [
  {
    id: 'personal',
    name: '개인 지식 보관소',
    files: [
      { id: 'f1', name: '시작하기.md', type: 'md', date: '2026-04-14', origin: 'sample' },
      { id: 'f2', name: '마크다운_치트시트.md', type: 'md', date: '2026-04-13', origin: 'sample' },
      { id: 'f3', name: '나의_독서노트.md', type: 'md', date: '2026-04-12', origin: 'sample' },
    ],
  },
  {
    id: 'project',
    name: '프로젝트 기획',
    files: [
      { id: 'f4', name: '2026_신규서비스_기획.md', type: 'md', date: '2026-04-14', origin: 'sample' },
      { id: 'f5', name: 'API_설계_명세.md', type: 'md', date: '2026-04-13', origin: 'sample' },
      { id: 'f6', name: '회의록_0414.md', type: 'md', date: '2026-04-14', origin: 'sample' },
    ],
  },
  {
    id: 'design-system',
    name: '디자인 시스템',
    files: [
      { id: 'f7', name: 'Apple_스타일_가이드.html', type: 'html', date: '2026-04-11', origin: 'sample' },
      { id: 'f8', name: 'Stripe_컴포넌트.html', type: 'html', date: '2026-04-10', origin: 'sample' },
      { id: 'f9', name: '브랜드_컬러_팔레트.md', type: 'md', date: '2026-04-09', origin: 'sample' },
    ],
  },
  {
    id: 'marketing',
    name: '마케팅 & 콘텐츠',
    files: [
      { id: 'f10', name: '랜딩페이지_시안.html', type: 'html', date: '2026-04-12', origin: 'sample' },
      { id: 'f11', name: '뉴스레터_초안.md', type: 'md', date: '2026-04-11', origin: 'sample' },
      { id: 'f12', name: 'SNS_캠페인_보고서.md', type: 'md', date: '2026-04-10', origin: 'sample' },
    ],
  },
  {
    id: 'learning',
    name: '학습 & 참고자료',
    files: [
      { id: 'f13', name: 'TypeScript_핵심정리.md', type: 'md', date: '2026-04-13', origin: 'sample' },
      { id: 'f14', name: 'CSS_Grid_레이아웃.html', type: 'html', date: '2026-04-12', origin: 'sample' },
      { id: 'f15', name: 'React_19_변경사항.md', type: 'md', date: '2026-04-11', origin: 'sample' },
    ],
  },
];
