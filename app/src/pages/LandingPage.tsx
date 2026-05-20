import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Brain,
  ChevronRight,
  ExternalLink,
  FileDown,
  FileText,
  Globe,
  Palette,
  Pencil,
  Share2,
  Sparkles,
  Stars,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import PricingSection from '../components/PricingSection';
import PublicFooter from '../components/PublicFooter';
import { DESIGN_TEMPLATES } from '../data/designTemplates';
import heroAsset from '../assets/hero.png';
import editorScreenshot from '../assets/docwise-editor.png';
import appStoreMockup from '../assets/marketing/app-store-mockup.png';
import type { PricingLocale } from '../types/pricing';

const DOWNLOAD_DMG_URL = '/downloads/Noleji%20View-1.0.0-arm64.dmg';
const DOWNLOAD_ZIP_URL = '/downloads/Noleji%20View-1.0.0-arm64-mac.zip';
const SUPPORT_EMAIL = 'mailto:noleji.ai@gmail.com';
const PUBLIC_WEB_URL = 'https://noleji.synology.me/apps/noleji-view';

const FEATURES = {
  ko: [
    {
      icon: FileText,
      title: 'Markdown 편집에 집중한 작업 공간',
      desc: '폴더·파일·미리보기를 한 화면에서 정리하고, 문서 구조를 잃지 않은 채 바로 쓰기 흐름으로 들어갑니다.',
    },
    {
      icon: Brain,
      title: 'Karpathy Wiki 기반 지식 구조화',
      desc: '문서 묶음을 분석해 엔티티·관계·요약을 생성하고, 팀 위키처럼 다시 탐색할 수 있게 정리합니다.',
    },
    {
      icon: Palette,
      title: '6개 프리미엄 디자인 템플릿',
      desc: 'Apple, Stripe, Linear, Vercel, Mistral, Asome 스타일을 문서와 공유 링크에 바로 적용합니다.',
    },
    {
      icon: Bot,
      title: 'Managed AI + 로컬 LLM 선택형',
      desc: '관리형 AI를 바로 쓰거나, 팀 정책에 맞게 로컬 LLM과 연결해 문서 보강 흐름을 이어갈 수 있습니다.',
    },
    {
      icon: FileDown,
      title: 'PDF·HTML·공유 링크까지 한 번에',
      desc: '배포 직전 산출물 정리 시간을 줄이기 위해 PDF, HTML export와 링크 공유를 동일한 흐름으로 묶었습니다.',
    },
    {
      icon: Share2,
      title: '외부 공유를 고려한 출시형 UX',
      desc: '내부 검토용 링크, 퍼블릭 문서 링크, 계정/지원 페이지까지 제품 외부 표면을 함께 설계했습니다.',
    },
  ],
  en: [
    {
      icon: FileText,
      title: 'A workspace built for focused Markdown writing',
      desc: 'Folders, files, and preview stay in one view so you can keep writing without losing the structure of your document set.',
    },
    {
      icon: Brain,
      title: 'Karpathy Wiki style knowledge structuring',
      desc: 'It analyzes document collections, extracts entities and relationships, and reorganizes them into a browsable team wiki.',
    },
    {
      icon: Palette,
      title: '6 premium presentation templates',
      desc: 'Apply Apple, Stripe, Linear, Vercel, Mistral, and Asome inspired themes directly to documents and shared pages.',
    },
    {
      icon: Bot,
      title: 'Managed AI or local LLM, your choice',
      desc: 'Use the managed AI workflow instantly or connect a local LLM that fits your internal policy and security requirements.',
    },
    {
      icon: FileDown,
      title: 'Export to PDF, HTML, and share links',
      desc: 'Export flows are grouped into one surface so teams can move from draft to review-ready deliverables with less friction.',
    },
    {
      icon: Share2,
      title: 'Launch-ready UX for external sharing',
      desc: 'Support, pricing, policy, and account routes are designed alongside the editor so the public product surface feels complete.',
    },
  ],
} as const;

const STEPS = {
  ko: [
    {
      icon: Pencil,
      title: 'Write',
      desc: '마크다운으로 원문을 작성하고, 폴더 구조와 최근 문서를 바로 이어서 작업합니다.',
    },
    {
      icon: Sparkles,
      title: 'Generate Knowledge',
      desc: 'LLM이 문서에서 핵심 엔티티와 개념을 추출해 위키 구조와 요약 포인트를 만들어줍니다.',
    },
    {
      icon: Globe,
      title: 'Share',
      desc: '디자인 템플릿을 적용한 뒤 PDF, HTML, 공유 링크로 팀/외부에 바로 전달합니다.',
    },
  ],
  en: [
    {
      icon: Pencil,
      title: 'Write',
      desc: 'Draft the source in Markdown and keep moving through folders and recent files without breaking context.',
    },
    {
      icon: Sparkles,
      title: 'Generate Knowledge',
      desc: 'The LLM extracts core entities and concepts, then turns the document set into a usable wiki structure.',
    },
    {
      icon: Globe,
      title: 'Share',
      desc: 'Apply a design template and publish the result as PDF, HTML, or a share link for teammates and reviewers.',
    },
  ],
} as const;

const SHOWCASE_SLIDES = {
  ko: [
    {
      id: 'write',
      eyebrow: 'WRITE FASTER',
      title: '문서를 쓰는 순간부터 구조와 미리보기가 같이 따라옵니다.',
      description:
        '에디터, 폴더, 미리보기, 스타일 토글이 한 화면에 있기 때문에 문서를 쓰다가 결과물이 어떻게 보일지 따로 상상할 필요가 없습니다.',
      bullets: ['폴더 기반 워크스페이스', '실시간 Markdown / HTML / PDF 전환', '문서 길이·섹션 수 즉시 확인'],
      badge: 'EDITOR + PREVIEW',
      accent: 'from-[#0F172A] to-[#1E293B]',
      cardTone: 'bg-[#F8FAFC]',
    },
    {
      id: 'structure',
      eyebrow: 'STRUCTURE WITH AI',
      title: 'LLM이 문서 묶음을 지식 체계로 바꿔, 읽는 문서를 탐색 가능한 위키로 만듭니다.',
      description:
        'Karpathy Wiki 스타일 구조화와 Managed AI / 로컬 LLM 선택지를 조합해, 단순 편집기를 넘는 지식 작업 공간으로 확장합니다.',
      bullets: ['엔티티·개념·관계 추출', '팀 정책에 맞는 로컬 LLM 연결', '문서 보강과 요약 자동화'],
      badge: 'KNOWLEDGE ENGINE',
      accent: 'from-[#10B981] to-[#0F172A]',
      cardTone: 'bg-white',
    },
    {
      id: 'publish',
      eyebrow: 'PUBLISH LIKE A PRODUCT',
      title: '링크 공유와 정책 페이지까지, 소개페이지 바깥의 출시 표면도 함께 정리합니다.',
      description:
        'app-store-screenshots 레퍼런스처럼 한 슬라이드에 한 메시지만 담아, 복잡한 기능보다 결과와 배포 가치를 먼저 보여주는 구조를 적용했습니다.',
      bullets: ['문서 공유 링크 생성', '요금제·지원·계정 삭제 공개 경로', '웹·데스크톱 동시 소개용 카피 구조'],
      badge: 'PUBLIC LAUNCH SURFACE',
      accent: 'from-[#111827] to-[#10B981]',
      cardTone: 'bg-[#F8FAFC]',
    },
  ],
  en: [
    {
      id: 'write',
      eyebrow: 'WRITE FASTER',
      title: 'Structure and preview stay visible from the first paragraph.',
      description:
        'The editor, file tree, preview, and style controls live on one surface, so the final shape of the document never feels hidden.',
      bullets: ['Folder-based workspace', 'Live Markdown / HTML / PDF switching', 'Instant length and section awareness'],
      badge: 'EDITOR + PREVIEW',
      accent: 'from-[#0F172A] to-[#1E293B]',
      cardTone: 'bg-[#F8FAFC]',
    },
    {
      id: 'structure',
      eyebrow: 'STRUCTURE WITH AI',
      title: 'Turn document collections into navigable knowledge, not just longer notes.',
      description:
        'Karpathy Wiki style structuring combined with managed AI or local LLM options helps the product behave like a real knowledge workspace.',
      bullets: ['Entity, concept, and relationship extraction', 'Local LLM support for internal policy fit', 'Automated enrichment and summaries'],
      badge: 'KNOWLEDGE ENGINE',
      accent: 'from-[#10B981] to-[#0F172A]',
      cardTone: 'bg-white',
    },
    {
      id: 'publish',
      eyebrow: 'PUBLISH LIKE A PRODUCT',
      title: 'The launch surface includes support, pricing, and policy pages alongside the app.',
      description:
        'Inspired by the app-store-screenshots pattern, each section delivers one strong message so value lands before technical complexity.',
      bullets: ['Shareable document links', 'Public pricing, support, and account routes', 'Copy that works for both web and desktop review'],
      badge: 'PUBLIC LAUNCH SURFACE',
      accent: 'from-[#111827] to-[#10B981]',
      cardTone: 'bg-[#F8FAFC]',
    },
  ],
} as const;

const TEMPLATE_USE_CASES = {
  ko: {
    apple: '제품 소개 / 깔끔한 리포트',
    stripe: '가격표 / 세일즈 문서',
    linear: '내부 위키 / 제품 스펙',
    vercel: '개발 문서 / changelog',
    mistral: '브랜드 스토리 / 노트',
    asome: '블로그형 공유 / 에세이',
  },
  en: {
    apple: 'Product pitch / clean reports',
    stripe: 'Pricing / sales documents',
    linear: 'Internal wiki / product spec',
    vercel: 'Engineering docs / changelog',
    mistral: 'Brand story / notes',
    asome: 'Essay-style public sharing',
  },
} as const;

const LAUNCH_PILLARS = {
  ko: [
    {
      icon: Globe,
      title: '모바일까지 읽히는 공유 뷰어',
      desc: '웹 베타와 링크 공유를 먼저 공개해도 어색하지 않도록 읽기 경험을 반응형으로 맞췄습니다.',
    },
    {
      icon: Share2,
      title: 'HTML 파일보다 링크 중심',
      desc: '실사용자는 파일을 전달하기보다 링크를 복사하고 공유합니다. 그래서 배포형 UX를 기본값으로 잡았습니다.',
    },
    {
      icon: Stars,
      title: '출시 전 소개면까지 함께 정리',
      desc: '앱 기능만이 아니라 pricing, support, privacy, account deletion 같은 외부 표면도 함께 구성합니다.',
    },
  ],
  en: [
    {
      icon: Globe,
      title: 'A share viewer that still reads well on mobile',
      desc: 'Responsive reading was treated as a launch requirement so the web beta can be reviewed comfortably from any device.',
    },
    {
      icon: Share2,
      title: 'Built around links, not file handoff',
      desc: 'Real users usually copy and share links, so the product surface prioritizes publishable routes over attachment-heavy flows.',
    },
    {
      icon: Stars,
      title: 'Public launch pages are part of the product',
      desc: 'Pricing, support, privacy, and account deletion are presented as first-class public surfaces, not afterthoughts.',
    },
  ],
} as const;

const PAGE_COPY = {
  ko: {
    nav: {
      features: 'Features',
      story: 'Product Story',
      templates: 'Templates',
      pricing: 'Pricing',
      download: 'Download',
      downloadCta: 'Download for macOS',
      openCta: 'Open Web App',
    },
    hero: {
      badge: 'Markdown workspace for launch-ready docs',
      titleLines: ['Markdown 문서를', '공유·배포 직전 품질까지', '끌어올리는 워크스페이스'],
      body:
        'Noleji View는 Markdown 원문을 유지한 채, AI 지식 구조화·디자인 템플릿·공유 링크·PDF export까지 이어주는 로컬 우선 문서 제품입니다. 심사 담당자가 바로 확인할 수 있도록 웹에서 즉시 체험할 수 있게 열어두고, macOS 직접 다운로드도 같은 페이지에서 제공하도록 정리했습니다.',
      primaryCta: '무료로 웹에서 시작하기',
      secondaryCta: 'macOS 다운로드',
      chips: ['웹 베타 즉시 확인 가능', 'macOS DMG / ZIP 직접 다운로드', '결제/지원 문의: noleji.ai@gmail.com'],
      proof: ['Markdown → Viewer → Share 링크를 하나의 흐름으로', '로컬 우선 편집 + 선택형 AI 연동', '웹 베타 + macOS 직접 다운로드 동시 제공'],
      stats: [
        { label: '핵심 템플릿', value: '6개' },
        { label: '내보내기 방식', value: 'PDF · HTML · 링크' },
        { label: '배포 경로', value: '웹 · macOS' },
        { label: '공개 지원 라우트', value: '4개' },
      ],
      desktopTag: 'Noleji View Desktop',
      styleTag: 'docwise style',
      appStoreTag: 'App-store mindset',
      appStoreNote: '한 화면에서 한 가지 가치만 강하게 설명하는 소개 구조',
    },
    features: {
      eyebrow: 'Features',
      title: '지식 관리와 출시 준비를 한 제품 안에',
      body: '단순 편집기가 아니라, 문서 작성 이후에 따라오는 구조화·렌더링·공유·지원 표면까지 끊기지 않게 이어줍니다.',
    },
    story: {
      eyebrow: 'Product Story',
      title: '앱스토어 스크린샷처럼, 섹션마다 제품의 한 가지 장점만 크게 보여줍니다.',
      body: '기능 나열보다 결과를 먼저 설득하는 방식입니다. 실제 앱 캡처를 중심으로 문서 작성, AI 구조화, 퍼블릭 공유 표면을 순서대로 보여줍니다.',
    },
    how: {
      eyebrow: 'How It Works',
      title: '3단계로 바로 시작하세요',
      stepLabel: 'Step',
    },
    templates: {
      eyebrow: 'Design Templates',
      title: '같은 문서도 용도에 따라 다른 결과물로',
      body: '레퍼런스 소개페이지처럼 예쁜 카드만 나열하지 않고, 각 템플릿이 어떤 문서에 잘 어울리는지 바로 이해되도록 사용 맥락을 붙였습니다.',
      fallbackUseCase: '문서 공유',
    },
    pricing: {
      eyebrow: 'Pricing',
      title: '합리적인 요금제로 바로 배포 흐름까지',
      body: '무료 플랜으로 편집과 미리보기를 시작하고, 필요할 때 공유/배포 중심 기능으로 확장하는 구조입니다.',
      note: '월간 플랜은 매월 자동 갱신되며 언제든 해지할 수 있습니다. 결제/환불 문의는 지원 페이지와 이메일에서 접수합니다.',
    },
    download: {
      eyebrow: 'Download & Review',
      title: '실제 동작 확인용 링크를 같은 페이지에서 제공합니다',
      body: '결제 심사 담당자가 제품 소개, 웹 체험, macOS 설치 파일, 지원/정책 링크를 한 번에 검토할 수 있도록 진입 경로를 단순화했습니다.',
      verificationLabel: '브라우저 검증 URL',
      cards: [
        { title: '웹 베타', body: '브라우저에서 바로 편집, 미리보기, 요금제 흐름을 확인할 수 있습니다.' },
        { title: 'macOS 직접 다운로드', body: 'DMG 설치 파일과 ZIP 압축본을 모두 공개해 설치 경로를 명확히 했습니다.' },
      ],
      blocks: {
        dmgEyebrow: 'Primary download',
        dmgTitle: 'macOS DMG',
        dmgBody: 'Noleji View 설치용 디스크 이미지',
        dmgCta: 'DMG 다운로드',
        zipEyebrow: 'Alternative build',
        zipTitle: 'macOS ZIP',
        zipBody: '압축 해제 후 바로 실행 가능한 대체 배포본',
        zipCta: 'ZIP 다운로드',
        webEyebrow: 'Instant review',
        webTitle: '웹에서 바로 체험',
        webBody: '설치 없이 편집 화면과 공유 흐름을 바로 확인할 수 있습니다.',
        webCta: 'Open Web App',
        supportEyebrow: 'Support',
        supportTitle: '결제/지원 문의',
        supportBody: 'noleji.ai@gmail.com 으로 결제, 환불, 계정 이슈를 접수할 수 있습니다.',
        supportCta: '이메일 보내기',
      },
    },
    launch: {
      eyebrow: 'Launch Ready',
      title: '출시 준비용으로 다듬은 핵심 UX',
      body: '앱 기능만 잘 보여주는 데서 끝내지 않고, 공유·지원·정책 경로까지 외부 사용자가 실제로 만나는 면을 정리했습니다.',
    },
    tech: {
      eyebrow: 'Tech Stack',
      title: '최신 웹 스택 위에 구축',
    },
    cta: {
      eyebrow: 'Ready to publish better docs',
      title: 'Noleji View를 지금 바로 검토해보세요',
      body: '소개 페이지, 웹 앱, macOS 다운로드, 지원 메일을 모두 공개해 두었습니다. 외부 사용자나 심사 담당자가 같은 링크에서 전체 흐름을 확인할 수 있습니다.',
      open: '웹 앱 열기',
      download: 'macOS DMG 다운로드',
      support: '결제/지원 문의',
    },
    footer: {
      privacy: '개인정보처리방침',
      terms: '이용약관',
      support: '지원/문의',
      accountDeletion: '계정 삭제',
      copyright: '© 2026 Noleji View. All rights reserved.',
    },
  },
  en: {
    nav: {
      features: 'Features',
      story: 'Product Story',
      templates: 'Templates',
      pricing: 'Pricing',
      download: 'Download',
      downloadCta: 'Download for macOS',
      openCta: 'Open Web App',
    },
    hero: {
      badge: 'Markdown workspace for launch-ready docs',
      titleLines: ['A Markdown workspace', 'that raises docs to', 'share-ready launch quality'],
      body:
        'Noleji View keeps the original Markdown source intact while connecting AI knowledge structuring, design templates, share links, and PDF export in one local-first document workflow. The page is organized so reviewers can test the product instantly on the web and also download the macOS build from the same surface.',
      primaryCta: 'Start free on the web',
      secondaryCta: 'Download for macOS',
      chips: ['Instant web beta review', 'Direct macOS DMG / ZIP download', 'Billing & support: noleji.ai@gmail.com'],
      proof: ['Markdown → Viewer → Share links in one flow', 'Local-first editing with optional AI', 'Web beta and macOS downloads offered together'],
      stats: [
        { label: 'Core templates', value: '6' },
        { label: 'Export modes', value: 'PDF · HTML · Link' },
        { label: 'Delivery paths', value: 'Web · macOS' },
        { label: 'Public support routes', value: '4' },
      ],
      desktopTag: 'Noleji View Desktop',
      styleTag: 'docwise style',
      appStoreTag: 'App-store mindset',
      appStoreNote: 'A product-intro structure that lets one screen carry one strong message',
    },
    features: {
      eyebrow: 'Features',
      title: 'Knowledge work and launch prep in one product surface',
      body: 'It is more than an editor. Structuring, rendering, sharing, and support surfaces are kept in one continuous flow after the writing step.',
    },
    story: {
      eyebrow: 'Product Story',
      title: 'Like App Store screenshots, each section pushes one product advantage hard.',
      body: 'Instead of listing features first, the page sells outcomes. Real app captures are used to show writing, AI structuring, and public sharing surfaces in sequence.',
    },
    how: {
      eyebrow: 'How It Works',
      title: 'Start in 3 clear steps',
      stepLabel: 'Step',
    },
    templates: {
      eyebrow: 'Design Templates',
      title: 'The same document, shaped for different outcomes',
      body: 'Rather than showing pretty cards without context, each template is paired with the kind of document it fits best.',
      fallbackUseCase: 'Document sharing',
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'Start free, then expand into distribution workflows',
      body: 'Begin with editing and preview in the free plan, then unlock the sharing and publishing layer when the workflow needs it.',
      note: 'The monthly plan renews automatically every month and can be cancelled anytime. Billing and refund requests are handled through support.',
    },
    download: {
      eyebrow: 'Download & Review',
      title: 'Product intro, live app, and install files live on the same page',
      body: 'The review path is simplified so anyone checking billing readiness can see the intro page, web experience, macOS build, and support/policy routes from one entry point.',
      verificationLabel: 'Browser verification URL',
      cards: [
        { title: 'Web beta', body: 'Review the editor, preview, and pricing flow directly in the browser.' },
        { title: 'Direct macOS download', body: 'Both the DMG installer and ZIP build are exposed so the install path is explicit.' },
      ],
      blocks: {
        dmgEyebrow: 'Primary download',
        dmgTitle: 'macOS DMG',
        dmgBody: 'Disk image installer for Noleji View',
        dmgCta: 'Download DMG',
        zipEyebrow: 'Alternative build',
        zipTitle: 'macOS ZIP',
        zipBody: 'Alternative distribution build that runs after unzip',
        zipCta: 'Download ZIP',
        webEyebrow: 'Instant review',
        webTitle: 'Try it on the web',
        webBody: 'Open the editor and sharing flow immediately without installing anything.',
        webCta: 'Open Web App',
        supportEyebrow: 'Support',
        supportTitle: 'Billing & support',
        supportBody: 'Questions about payment, refunds, and account issues can be sent to noleji.ai@gmail.com.',
        supportCta: 'Send email',
      },
    },
    launch: {
      eyebrow: 'Launch Ready',
      title: 'Key UX refined for public release',
      body: 'The work does not stop at showing app features. The shared, support, and policy routes are shaped as real public-facing surfaces.',
    },
    tech: {
      eyebrow: 'Tech Stack',
      title: 'Built on a modern web stack',
    },
    cta: {
      eyebrow: 'Ready to publish better docs',
      title: 'Review Noleji View now',
      body: 'The intro page, web app, macOS downloads, and support email are all public, so external users and reviewers can inspect the full flow from one link.',
      open: 'Open Web App',
      download: 'Download macOS DMG',
      support: 'Billing & support',
    },
    footer: {
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      support: 'Support',
      accountDeletion: 'Delete Account',
      copyright: '© 2026 Noleji View. All rights reserved.',
    },
  },
} as const;

const TECH_STACK = [
  { name: 'React 19', color: '#61DAFB' },
  { name: 'Vite 8', color: '#646CFF' },
  { name: 'TypeScript 6', color: '#3178C6' },
  { name: 'Tailwind v4', color: '#06B6D4' },
  { name: 'unified', color: '#E45649' },
  { name: 'Supabase', color: '#10B981' },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const [locale, setLocale] = useState<PricingLocale>('ko');
  const copy = PAGE_COPY[locale];

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif] text-[#111827] antialiased">
      <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111827] text-sm font-black text-white shadow-lg shadow-black/10">
              v
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[#10B981]">Launch Surface</p>
              <span className="text-base font-black tracking-[-0.04em]">Noleji View</span>
            </div>
          </div>

          <div className="hidden items-center gap-7 text-[12px] font-bold text-[#111827]/45 md:flex">
            <a href="#features" className="transition-colors hover:text-[#10B981]">{copy.nav.features}</a>
            <a href="#story" className="transition-colors hover:text-[#10B981]">{copy.nav.story}</a>
            <a href="#templates" className="transition-colors hover:text-[#10B981]">{copy.nav.templates}</a>
            <a href="#pricing" className="transition-colors hover:text-[#10B981]">{copy.nav.pricing}</a>
            <a href="#download" className="transition-colors hover:text-[#10B981]">{copy.nav.download}</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white p-1 shadow-sm">
              {(['ko', 'en'] as PricingLocale[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setLocale(value)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase transition-all ${
                    locale === value ? 'bg-[#111827] text-white' : 'text-[#64748B] hover:text-[#111827]'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <a
              href={DOWNLOAD_DMG_URL}
              className="hidden rounded-xl border border-[#D1D5DB] bg-white px-4 py-2 text-[11px] font-black text-[#111827] transition-all hover:border-[#10B981]/40 hover:text-[#10B981] sm:inline-flex"
            >
              {copy.nav.downloadCta}
            </a>
            <button
              onClick={() => navigate('/app')}
              className="rounded-xl bg-[#111827] px-4 py-2 text-[11px] font-black text-white shadow-sm transition-all hover:bg-[#10B981] active:scale-95"
            >
              {copy.nav.openCta}
            </button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-[#F3F4F6] bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-28 top-14 h-72 w-72 rounded-full bg-[#111827]/[0.04] blur-3xl" />
          <div className="absolute -right-16 top-10 h-[28rem] w-[28rem] rounded-full bg-[#10B981]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#059669]">
                <Zap size={14} />
                {copy.hero.badge}
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.06em] text-[#0F172A] sm:text-5xl lg:text-6xl xl:text-[4.35rem] xl:leading-[0.95]">
                {copy.hero.titleLines[0]}
                <span className="block text-[#10B981]">{copy.hero.titleLines[1]}</span>
                {copy.hero.titleLines[2]}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#334155] sm:text-lg">{copy.hero.body}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/app')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111827] px-7 py-4 text-sm font-black text-white shadow-xl shadow-[#111827]/10 transition-all hover:-translate-y-0.5 hover:bg-[#10B981] hover:shadow-[#10B981]/20 active:translate-y-0"
                >
                  {copy.hero.primaryCta}
                  <ArrowRight size={16} />
                </button>
                <a
                  href={DOWNLOAD_DMG_URL}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D1D5DB] bg-white px-7 py-4 text-sm font-black text-[#111827] transition-all hover:border-[#10B981]/40 hover:bg-[#F8FAFC]"
                >
                  {copy.hero.secondaryCta}
                  <FileDown size={16} />
                </a>
              </div>

              <div className="mt-4 flex flex-col gap-2 text-[12px] font-medium text-[#475569] sm:flex-row sm:flex-wrap sm:items-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-sm ring-1 ring-[#E5E7EB]">
                  <span className="h-2 w-2 rounded-full bg-[#10B981]" /> {copy.hero.chips[0]}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-sm ring-1 ring-[#E5E7EB]">
                  <span className="h-2 w-2 rounded-full bg-[#111827]" /> {copy.hero.chips[1]}
                </span>
                <a
                  href={SUPPORT_EMAIL}
                  className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-sm ring-1 ring-[#E5E7EB] transition-colors hover:text-[#10B981]"
                >
                  {copy.hero.chips[2]}
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {copy.hero.proof.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3.5 py-2 text-[11px] font-bold text-[#334155] shadow-sm"
                  >
                    <CheckCircle2 size={14} className="text-[#10B981]" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {copy.hero.stats.map(({ label, value }) => (
                  <div key={label} className="rounded-2xl border border-[#E5E7EB] bg-white/90 p-4 shadow-sm">
                    <div className="text-2xl font-black tracking-[-0.04em] text-[#111827]">{value}</div>
                    <div className="mt-1 text-[12px] font-medium leading-5 text-[#64748B]">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 top-8 h-40 rounded-full bg-[#10B981]/20 blur-3xl" />

              <div className="relative rounded-[2rem] border border-[#E5E7EB] bg-[#0F172A] p-3 shadow-[0_40px_120px_rgba(15,23,42,0.18)]">
                <div className="rounded-[1.55rem] border border-white/10 bg-[#020617] p-3">
                  <div className="flex items-center justify-between rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-white/70">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.32em]">{copy.hero.desktopTag}</span>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A7F3D0]">
                      {copy.hero.styleTag}
                    </span>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,#0B1220_0%,#111827_100%)] p-4 sm:p-5">
                    <div className="mx-auto max-w-[88%] overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#0F172A] shadow-[0_24px_60px_rgba(2,6,23,0.35)]">
                      <img
                        src={editorScreenshot}
                        alt="Noleji View editor screenshot"
                        className="h-auto w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 right-2 flex w-[250px] items-center gap-3 rounded-[1.4rem] border border-[#E5E7EB] bg-white p-3.5 shadow-xl shadow-[#0F172A]/10 sm:right-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111827]">
                  <img src={heroAsset} alt="Noleji View layered mark" className="h-10 w-10 object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#10B981]">{copy.hero.appStoreTag}</p>
                  <p className="mt-1 text-sm font-bold leading-5 text-[#111827]">{copy.hero.appStoreNote}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#F8FAFC] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[#10B981]">{copy.features.eyebrow}</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0F172A] sm:text-4xl">{copy.features.title}</h2>
            <p className="mt-4 text-sm leading-6 text-[#475569] sm:text-base">{copy.features.body}</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES[locale].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-[1.6rem] border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#10B981]/35 hover:shadow-xl hover:shadow-[#10B981]/8"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111827] transition-colors group-hover:bg-[#10B981]">
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="mt-5 text-lg font-black tracking-[-0.04em] text-[#0F172A]">{title}</h3>
                <p className="mt-3 text-[14px] leading-6 text-[#475569]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="story" className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[#10B981]">{copy.story.eyebrow}</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0F172A] sm:text-4xl lg:text-[2.8rem]">{copy.story.title}</h2>
            <p className="mt-4 text-sm leading-6 text-[#475569] sm:text-base">{copy.story.body}</p>
          </div>

          <div className="mt-12 space-y-6 lg:space-y-8">
            {SHOWCASE_SLIDES[locale].map((slide, index) => (
              <ShowcaseCard key={slide.id} locale={locale} slide={slide} reverse={index % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#F8FAFC] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[#10B981]">{copy.how.eyebrow}</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0F172A] sm:text-4xl">{copy.how.title}</h2>
          </div>

          <div className="mt-12 flex flex-col gap-5 lg:flex-row lg:gap-0">
            {STEPS[locale].map(({ icon: Icon, title, desc }, index) => (
              <div key={title} className="flex flex-1 flex-col lg:flex-row lg:items-center">
                <div className="w-full rounded-[1.8rem] border border-[#E5E7EB] bg-white p-6 text-center shadow-sm sm:p-8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111827]">
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#10B981]">{copy.how.stepLabel} {index + 1}</div>
                  <h3 className="mt-2 text-lg font-black tracking-[-0.04em] text-[#0F172A]">{title}</h3>
                  <p className="mt-3 text-[14px] leading-6 text-[#475569]">{desc}</p>
                </div>
                {index < STEPS[locale].length - 1 && (
                  <>
                    <div className="hidden flex-shrink-0 items-center justify-center px-4 lg:flex">
                      <ChevronRight size={26} className="text-[#CBD5E1]" />
                    </div>
                    <div className="flex items-center justify-center py-2 lg:hidden">
                      <ChevronRight size={22} className="rotate-90 text-[#CBD5E1]" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="templates" className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[#10B981]">{copy.templates.eyebrow}</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0F172A] sm:text-4xl">{copy.templates.title}</h2>
            <p className="mt-4 text-sm leading-6 text-[#475569] sm:text-base">{copy.templates.body}</p>
          </div>

          <div className="-mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0">
            {DESIGN_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                useCase={TEMPLATE_USE_CASES[locale][template.id as keyof typeof TEMPLATE_USE_CASES.ko] ?? copy.templates.fallbackUseCase}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#F8FAFC] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[#10B981]">{copy.pricing.eyebrow}</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0F172A] sm:text-4xl">{copy.pricing.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#475569] sm:text-base">{copy.pricing.body}</p>
            <p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-[#64748B] sm:text-sm">{copy.pricing.note}</p>
          </div>

          <div className="mt-12">
            <PricingSection locale={locale} />
          </div>
        </div>
      </section>

      <section id="download" className="border-y border-[#E5E7EB] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[#10B981]">{copy.download.eyebrow}</span>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0F172A] sm:text-4xl">{copy.download.title}</h2>
              <p className="mt-4 text-sm leading-6 text-[#475569] sm:text-base">{copy.download.body}</p>
              <div className="mt-5 rounded-2xl border border-[#D1FAE5] bg-[#ECFDF5] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#059669]">{copy.download.verificationLabel}</p>
                <a
                  href={PUBLIC_WEB_URL}
                  className="mt-2 inline-flex break-all text-sm font-black text-[#0F172A] underline decoration-[#10B981]/40 underline-offset-4 transition-colors hover:text-[#059669]"
                >
                  {PUBLIC_WEB_URL}
                </a>
              </div>
              <div className="mt-6 space-y-3 text-sm text-[#334155]">
                {copy.download.cards.map((card) => (
                  <div key={card.title} className="flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                    <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-[#10B981]" />
                    <div>
                      <p className="font-black text-[#0F172A]">{card.title}</p>
                      <p className="mt-1 leading-6">{card.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <a
                href={DOWNLOAD_DMG_URL}
                className="group rounded-[1.8rem] border border-[#D1FAE5] bg-[linear-gradient(180deg,#ECFDF5_0%,#FFFFFF_100%)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#10B981]/10"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#059669]">{copy.download.blocks.dmgEyebrow}</p>
                <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-[#0F172A]">{copy.download.blocks.dmgTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[#475569]">{copy.download.blocks.dmgBody}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#0F172A] group-hover:text-[#059669]">
                  {copy.download.blocks.dmgCta} <ArrowRight size={16} />
                </div>
              </a>

              <a
                href={DOWNLOAD_ZIP_URL}
                className="group rounded-[1.8rem] border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#111827]/8"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">{copy.download.blocks.zipEyebrow}</p>
                <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-[#0F172A]">{copy.download.blocks.zipTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[#475569]">{copy.download.blocks.zipBody}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#0F172A] group-hover:text-[#10B981]">
                  {copy.download.blocks.zipCta} <ArrowRight size={16} />
                </div>
              </a>

              <button
                onClick={() => navigate('/app')}
                className="rounded-[1.8rem] border border-[#E5E7EB] bg-[#111827] p-6 text-left text-white shadow-sm transition-all hover:-translate-y-1 hover:bg-[#10B981] hover:shadow-xl hover:shadow-[#10B981]/20"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">{copy.download.blocks.webEyebrow}</p>
                <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{copy.download.blocks.webTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">{copy.download.blocks.webBody}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-black">
                  {copy.download.blocks.webCta} <ArrowRight size={16} />
                </div>
              </button>

              <a
                href={SUPPORT_EMAIL}
                className="rounded-[1.8rem] border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#111827]/8"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">{copy.download.blocks.supportEyebrow}</p>
                <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-[#0F172A]">{copy.download.blocks.supportTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[#475569]">{copy.download.blocks.supportBody}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#0F172A] hover:text-[#10B981]">
                  {copy.download.blocks.supportCta} <ExternalLink size={16} />
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[#10B981]">{copy.launch.eyebrow}</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0F172A] sm:text-4xl">{copy.launch.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#475569] sm:text-base">{copy.launch.body}</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {LAUNCH_PILLARS[locale].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-[1.7rem] border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#111827]/6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111827]">
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="mt-5 text-lg font-black tracking-[-0.04em] text-[#0F172A]">{title}</h3>
                <p className="mt-3 text-[14px] leading-6 text-[#475569]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[#10B981]">{copy.tech.eyebrow}</span>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-[#0F172A] sm:text-3xl">{copy.tech.title}</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {TECH_STACK.map(({ name, color }) => (
              <span
                key={name}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[12px] font-bold text-[#334155] shadow-sm"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-[#DCFCE7] bg-[linear-gradient(135deg,#0f172a_0%,#111827_55%,#10b981_160%)] px-6 py-10 text-center text-white shadow-[0_30px_100px_rgba(15,23,42,0.2)] sm:px-10 lg:px-14 lg:py-14">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#A7F3D0]">{copy.cta.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] sm:text-4xl lg:text-[2.8rem]">{copy.cta.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">{copy.cta.body}</p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => navigate('/app')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black text-[#111827] transition-all hover:-translate-y-0.5 hover:bg-[#ECFDF5] sm:w-auto"
              >
                {copy.cta.open}
                <ArrowRight size={16} />
              </button>
              <a
                href={DOWNLOAD_DMG_URL}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-8 py-4 text-sm font-black text-white transition-all hover:bg-white/14 sm:w-auto"
              >
                <FileDown size={16} />
                {copy.cta.download}
              </a>
              <a
                href={SUPPORT_EMAIL}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-transparent px-8 py-4 text-sm font-black text-white transition-all hover:bg-white/10 sm:w-auto"
              >
                <ExternalLink size={16} />
                {copy.cta.support}
              </a>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter labels={copy.footer} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function ShowcaseCard({
  locale,
  slide,
  reverse,
}: {
  locale: PricingLocale;
  slide: (typeof SHOWCASE_SLIDES)[PricingLocale][number];
  reverse?: boolean;
}) {
  return (
    <div
      className={[
        'grid gap-6 overflow-hidden rounded-[2rem] border border-[#E5E7EB] p-5 shadow-[0_22px_80px_rgba(15,23,42,0.07)] sm:p-7 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-center lg:p-8',
        slide.cardTone,
        reverse ? 'lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]' : '',
      ].join(' ')}
    >
      <div className={reverse ? 'lg:order-2' : ''}>
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#10B981]">{slide.eyebrow}</p>
        <h3 className="mt-4 text-2xl font-black tracking-[-0.05em] text-[#0F172A] sm:text-3xl">{slide.title}</h3>
        <p className="mt-4 text-sm leading-6 text-[#475569] sm:text-[15px]">{slide.description}</p>
        <ul className="mt-6 space-y-3">
          {slide.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-sm text-[#334155]">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#10B981]">
                <CheckCircle2 size={14} />
              </span>
              <span className="leading-6">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={reverse ? 'lg:order-1' : ''}>
        <div className={`relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br ${slide.accent} p-4 sm:p-5`}>
          <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/80 backdrop-blur-sm">
            {slide.badge}
          </div>

          <div className="rounded-[1.45rem] border border-white/15 bg-white/92 p-3 shadow-2xl shadow-black/10">
            <div className="flex items-center justify-between rounded-[1rem] border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#64748B]">
              <span>{locale === 'ko' ? 'docwise / noleji view' : 'docwise / noleji view'}</span>
              <span className="rounded-full bg-[#ECFDF5] px-2 py-1 text-[#059669]">{slide.id}</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-[1.1rem] border border-[#E5E7EB] bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)] p-3 sm:p-4">
              <div className="relative mx-auto aspect-[1125/2436] w-full max-w-[240px] sm:max-w-[260px]">
                <div className="absolute left-[8.8%] top-[5.1%] h-[87.6%] w-[82.4%] overflow-hidden rounded-[1.8rem] bg-[#0F172A] shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                  <img src={editorScreenshot} alt={`${slide.title} screenshot`} className="h-full w-full object-cover object-left-top" />
                </div>
                <img src={appStoreMockup} alt="App Store style iPhone mockup" className="absolute inset-0 h-full w-full object-contain" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {slide.bullets.map((bullet) => (
              <div key={bullet} className="rounded-2xl border border-white/18 bg-white/10 px-3 py-3 text-[11px] font-bold leading-5 text-white backdrop-blur-sm">
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  useCase,
}: {
  template: (typeof DESIGN_TEMPLATES)[number];
  useCase: string;
}) {
  return (
    <div className="min-w-[280px] snap-center overflow-hidden rounded-[1.6rem] border border-[#E5E7EB] bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[#10B981]/30 hover:shadow-xl lg:min-w-0">
      <div
        className="relative h-40 overflow-hidden p-5"
        style={{ background: `linear-gradient(135deg, ${template.color}10, ${template.accent}18)` }}
      >
        <div className="absolute right-4 top-4 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#475569]">
          {useCase}
        </div>

        <div className="space-y-2.5">
          <div className="h-4 w-2/3 rounded" style={{ backgroundColor: template.color }} />
          <div className="h-2 w-full rounded bg-white/70" />
          <div className="h-2 w-5/6 rounded bg-white/70" />
          <div className="mt-4 rounded-xl border bg-white/45 p-3 backdrop-blur-sm" style={{ borderColor: `${template.accent}40` }}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-0.5 rounded" style={{ backgroundColor: template.accent }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-1.5 w-full rounded" style={{ backgroundColor: `${template.accent}40` }} />
                <div className="h-1.5 w-4/5 rounded" style={{ backgroundColor: `${template.accent}28` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black tracking-[-0.03em]" style={{ color: template.color }}>
              {template.name}
            </h3>
            <p className="mt-1 text-[11px] font-medium text-[#64748B]">{template.font}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: template.color }} />
            <span className="h-4 w-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: template.accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}
