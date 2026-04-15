import { useNavigate } from 'react-router-dom';
import {
  FileText, Brain, Palette, Bot, FileDown, Share2,
  ArrowRight, Pencil, Sparkles, Globe,
  ExternalLink, ChevronRight,
} from 'lucide-react';
import PricingSection from '../components/PricingSection';

/* ── Design Templates data (mirror of EditorPage) ── */
const DESIGN_TEMPLATES = [
  { id: 'apple', name: 'Apple Premium', color: '#000000', accent: '#0071E3', font: 'SF Pro, Inter' },
  { id: 'stripe', name: 'Stripe Elegant', color: '#635BFF', accent: '#00D7FF', font: 'Inter' },
  { id: 'linear', name: 'Linear Minimal', color: '#5E6AD2', accent: '#8A94E9', font: 'Inter' },
  { id: 'vercel', name: 'Vercel Precise', color: '#000000', accent: '#000000', font: 'Geist, sans-serif' },
  { id: 'mistral', name: 'Mistral French', color: '#FF5917', accent: '#7C3AED', font: 'Inter' },
  { id: 'asome', name: 'Asome Emerald', color: '#1A202C', accent: '#10B981', font: 'Source Serif 4' },
];

/* ── Feature items ── */
const FEATURES = [
  { icon: FileText, title: 'MD 편집', desc: 'Obsidian 스타일 마크다운 에디터. unified + rehype 파이프라인으로 실시간 렌더링.' },
  { icon: Brain, title: 'Karpathy Wiki 지식 생성', desc: '폴더 내 문서를 분석하여 엔티티/개념/요약 기반 위키 지식 체계를 자동 생성.' },
  { icon: Palette, title: '6종 디자인 템플릿', desc: 'Apple, Stripe, Linear, Vercel, Mistral, Asome 스타일을 원클릭 적용.' },
  { icon: Bot, title: 'LLM 연동', desc: 'OpenAI, Anthropic, 로컬 LLM을 연결하여 지식 체계 생성 및 문서 보강.' },
  { icon: FileDown, title: 'PDF 내보내기', desc: 'A4 페이지 가이드와 함께 고품질 PDF/HTML 파일로 내보내기.' },
  { icon: Share2, title: 'Publish & Share', desc: '공유 링크를 생성하여 동료에게 즉시 문서를 공유. 내부/외부 모드 지원.' },
];

/* ── How It Works steps ── */
const STEPS = [
  { icon: Pencil, title: 'Write', desc: '마크다운으로 문서를 작성하세요. 실시간 미리보기와 디자인 템플릿을 활용합니다.' },
  { icon: Sparkles, title: 'Generate Knowledge', desc: 'LLM이 문서를 분석하여 엔티티, 개념, 관계를 추출하고 위키 지식 체계를 생성합니다.' },
  { icon: Globe, title: 'Share', desc: 'PDF, HTML로 내보내거나 공유 링크로 동료에게 즉시 전달하세요.' },
];

/* ── Tech Stack badges ── */
const TECH_STACK = [
  { name: 'React 19', color: '#61DAFB' },
  { name: 'Vite 8', color: '#646CFF' },
  { name: 'TypeScript 6', color: '#3178C6' },
  { name: 'Tailwind v4', color: '#06B6D4' },
  { name: 'unified', color: '#E45649' },
  { name: 'highlight.js', color: '#F7DF1E' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#1A202C] font-[Inter,sans-serif] antialiased">

      {/* ═══════════════ Navigation Bar ═══════════════ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A202C] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-black/10">
              d
            </div>
            <span className="text-base font-black tracking-tighter uppercase italic">docwise</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-[12px] font-bold text-[#1A202C]/40">
            <a href="#features" className="hover:text-[#10B981] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#10B981] transition-colors">How It Works</a>
            <a href="#templates" className="hover:text-[#10B981] transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-[#10B981] transition-colors">Pricing</a>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="px-4 py-2 text-[11px] font-black bg-[#1A202C] text-white rounded-lg hover:bg-[#10B981] transition-all active:scale-95 shadow-sm"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ═══════════════ 1. Hero Section ═══════════════ */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 sm:w-[500px] sm:h-[500px] rounded-full bg-[#10B981]/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 sm:w-[400px] sm:h-[400px] rounded-full bg-[#1A202C]/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#10B981]/10 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Knowledge Management Tool</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-[1.05]">
                <span className="italic">docwise</span>
              </h1>
              <p className="mt-3 text-lg sm:text-xl lg:text-2xl font-bold text-[#1A202C]/60 tracking-tight">
                지혜로운 마크다운 관리
              </p>
              <p className="mt-4 text-sm sm:text-base text-[#1A202C]/40 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                마크다운 문서를 작성하고, LLM 기반 지식 체계를 자동 생성하고,
                6종 프리미엄 디자인 템플릿으로 렌더링한 뒤 PDF/HTML로 내보내세요.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={() => navigate('/app')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#1A202C] text-white rounded-2xl font-black text-sm tracking-wide hover:bg-[#10B981] hover:shadow-xl hover:shadow-[#10B981]/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2.5"
                >
                  <span>Start Writing</span>
                  <ArrowRight size={16} />
                </button>
                <a
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 bg-[#F7FAFC] text-[#1A202C]/60 rounded-2xl font-black text-sm tracking-wide hover:bg-[#E2E8F0] transition-all active:scale-[0.98] text-center border border-[#E2E8F0]"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right: visual mock */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="relative">
                {/* Glow behind */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/20 to-[#1A202C]/10 rounded-3xl blur-2xl scale-105" />
                {/* Card */}
                <div className="relative bg-white rounded-2xl sm:rounded-3xl border-2 border-[#E2E8F0] shadow-2xl overflow-hidden">
                  {/* Window chrome */}
                  <div className="h-10 bg-[#F7FAFC] border-b border-[#E2E8F0] flex items-center px-4 space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#FC8181]" />
                    <div className="w-3 h-3 rounded-full bg-[#F6AD55]" />
                    <div className="w-3 h-3 rounded-full bg-[#68D391]" />
                    <span className="ml-3 text-[9px] font-black text-[#1A202C]/20 uppercase tracking-widest">docwise v4.0</span>
                  </div>
                  {/* Editor simulation */}
                  <div className="flex min-h-[240px] sm:min-h-[300px]">
                    {/* Sidebar mock */}
                    <div className="w-1/4 bg-[#F7FAFC] border-r border-[#E2E8F0] p-3 space-y-2 hidden sm:block">
                      {['Personal', 'Projects', 'Design'].map((f, i) => (
                        <div key={f} className={`px-2.5 py-2 rounded-lg text-[9px] font-bold ${i === 0 ? 'bg-white shadow-sm border border-[#E2E8F0] text-[#1A202C]' : 'text-[#1A202C]/30'}`}>
                          {f}
                        </div>
                      ))}
                    </div>
                    {/* Content mock */}
                    <div className="flex-1 p-5 sm:p-6 space-y-3">
                      <div className="h-5 w-3/4 bg-[#1A202C] rounded-md" />
                      <div className="h-3 w-full bg-[#E2E8F0] rounded" />
                      <div className="h-3 w-5/6 bg-[#E2E8F0] rounded" />
                      <div className="h-3 w-2/3 bg-[#E2E8F0] rounded" />
                      <div className="mt-4 h-16 w-full bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5 rounded-xl border border-[#10B981]/20 flex items-center px-4">
                        <div className="w-1 h-8 bg-[#10B981] rounded mr-3" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-2 w-full bg-[#10B981]/20 rounded" />
                          <div className="h-2 w-4/5 bg-[#10B981]/15 rounded" />
                        </div>
                      </div>
                      <div className="h-3 w-full bg-[#E2E8F0] rounded" />
                      <div className="h-3 w-3/4 bg-[#E2E8F0] rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. Features Section ═══════════════ */}
      <section id="features" className="bg-[#F7FAFC] py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.3em]">Features</span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              지식 관리를 위한 모든 것
            </h2>
            <p className="mt-3 text-sm text-[#1A202C]/40 max-w-md mx-auto">
              마크다운 편집부터 AI 지식 생성, 프리미엄 디자인, 공유까지 한 곳에서.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-white p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#10B981]/40 hover:shadow-xl hover:shadow-[#10B981]/5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1A202C] flex items-center justify-center mb-4 group-hover:bg-[#10B981] transition-colors">
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="text-base font-black tracking-tight mb-2">{title}</h3>
                <p className="text-[13px] text-[#1A202C]/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 3. How It Works Section ═══════════════ */}
      <section id="how-it-works" className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.3em]">How It Works</span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              3단계로 시작하세요
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-0">
            {STEPS.map(({ icon: Icon, title, desc }, index) => (
              <div key={title} className="flex-1 flex flex-col lg:flex-row items-center">
                {/* Step card */}
                <div className="w-full bg-[#F7FAFC] rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 text-center hover:shadow-lg transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-[#1A202C] flex items-center justify-center mx-auto mb-5">
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.2em] mb-2">
                    Step {index + 1}
                  </div>
                  <h3 className="text-lg font-black tracking-tight mb-2">{title}</h3>
                  <p className="text-[13px] text-[#1A202C]/40 leading-relaxed">{desc}</p>
                </div>
                {/* Arrow between steps */}
                {index < STEPS.length - 1 && (
                  <>
                    {/* Desktop: horizontal arrow */}
                    <div className="hidden lg:flex items-center justify-center px-4 flex-shrink-0">
                      <ChevronRight size={24} className="text-[#E2E8F0]" />
                    </div>
                    {/* Mobile: vertical arrow */}
                    <div className="flex lg:hidden items-center justify-center py-2">
                      <ChevronRight size={20} className="text-[#E2E8F0] rotate-90" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. Design Templates Gallery ═══════════════ */}
      <section id="templates" className="bg-[#F7FAFC] py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.3em]">Design Templates</span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              6종 프리미엄 디자인
            </h2>
            <p className="mt-3 text-sm text-[#1A202C]/40 max-w-md mx-auto">
              세계적인 브랜드의 디자인 시스템을 마크다운 문서에 원클릭 적용하세요.
            </p>
          </div>

          {/* Mobile: horizontal scroll / Desktop: 3x2 grid */}
          <div className="flex lg:hidden overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {DESIGN_TEMPLATES.map((tmpl) => (
              <TemplateCard key={tmpl.id} template={tmpl} />
            ))}
          </div>
          <div className="hidden lg:grid grid-cols-3 gap-6">
            {DESIGN_TEMPLATES.map((tmpl) => (
              <TemplateCard key={tmpl.id} template={tmpl} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 5. Pricing Section ═══════════════ */}
      <section id="pricing" className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.3em]">Pricing</span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              합리적인 요금제
            </h2>
            <p className="mt-3 text-sm text-[#1A202C]/40 max-w-md mx-auto">
              무료로 시작하고, 필요할 때 업그레이드하세요.
            </p>
          </div>

          <PricingSection />
        </div>
      </section>

      {/* ═══════════════ 6. Tech Stack Section ═══════════════ */}
      <section className="bg-[#F7FAFC] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.3em]">Tech Stack</span>
          <h2 className="mt-3 text-xl sm:text-2xl font-black tracking-tight mb-8">
            최신 기술 스택
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {TECH_STACK.map(({ name, color }) => (
              <span
                key={name}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white rounded-xl border border-[#E2E8F0] text-[12px] font-bold shadow-sm hover:shadow-md transition-all"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[#1A202C]/70">{name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7. CTA Footer ═══════════════ */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Try <span className="italic">docwise</span> today
          </h2>
          <p className="mt-4 text-sm text-[#1A202C]/40 max-w-md mx-auto">
            지혜로운 마크다운 관리를 지금 시작하세요. 무료 플랜으로 바로 사용할 수 있습니다.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="w-full sm:w-auto px-10 py-4 bg-[#10B981] text-white rounded-2xl font-black text-sm tracking-wide hover:bg-[#059669] hover:shadow-xl hover:shadow-[#10B981]/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2.5"
            >
              <span>Start Writing</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-10 py-4 bg-[#F7FAFC] text-[#1A202C]/60 rounded-2xl font-black text-sm tracking-wide hover:bg-[#E2E8F0] transition-all active:scale-[0.98] flex items-center justify-center space-x-2.5 border border-[#E2E8F0]"
            >
              <ExternalLink size={16} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════ Footer ═══════════════ */}
      <footer className="border-t border-[#E2E8F0] bg-[#F7FAFC] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-[#1A202C] flex items-center justify-center text-white text-[10px] font-bold">d</div>
            <span className="text-[11px] font-black tracking-tighter uppercase italic text-[#1A202C]/40">docwise</span>
          </div>
          <p className="text-[11px] text-[#1A202C]/25 font-bold">
            &copy; 2026 docwise. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Scrollbar hide utility */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ── Template Card sub-component ── */
function TemplateCard({ template }: { template: typeof DESIGN_TEMPLATES[number] }) {
  return (
    <div className="min-w-[260px] snap-center lg:min-w-0 bg-white rounded-2xl border-2 border-[#E2E8F0] hover:border-[#10B981]/40 hover:shadow-xl transition-all overflow-hidden group">
      {/* Preview area */}
      <div className="h-36 sm:h-40 p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${template.color}08, ${template.accent}12)` }}>
        <div className="absolute top-3 right-3 opacity-5 group-hover:opacity-10 transition-opacity">
          <Palette size={60} />
        </div>
        {/* Mock document lines */}
        <div className="space-y-2">
          <div className="h-4 w-2/3 rounded" style={{ backgroundColor: template.color }} />
          <div className="h-2 w-full rounded bg-[#E2E8F0]" />
          <div className="h-2 w-5/6 rounded bg-[#E2E8F0]" />
          <div className="h-2 w-3/4 rounded bg-[#E2E8F0]" />
          <div className="mt-3 h-8 w-full rounded-lg border" style={{ borderColor: `${template.accent}30`, background: `${template.accent}08` }}>
            <div className="h-full flex items-center px-3">
              <div className="w-0.5 h-4 rounded mr-2" style={{ backgroundColor: template.accent }} />
              <div className="space-y-1 flex-1">
                <div className="h-1.5 w-full rounded" style={{ backgroundColor: `${template.accent}25` }} />
                <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: `${template.accent}15` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Info */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black tracking-tight" style={{ color: template.color }}>{template.name}</h3>
          <p className="text-[10px] font-bold text-[#1A202C]/25 mt-0.5">{template.font}</p>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: template.color }} />
          <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: template.accent }} />
        </div>
      </div>
    </div>
  );
}
