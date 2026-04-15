import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PricingSection from '../components/PricingSection';

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-[#E2E8F0] bg-white/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-[12px] font-bold text-[#1A202C]/40 hover:text-[#10B981] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>앱으로 돌아가기</span>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#1A202C] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-black/10">
              d
            </div>
            <span className="text-sm font-black tracking-tighter uppercase italic text-[#1A202C]">docwise</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black tracking-tight text-[#1A202C] mb-3">
            당신의 지식에 날개를 달아주세요
          </h1>
          <p className="text-[14px] font-medium text-[#1A202C]/40 max-w-lg mx-auto">
            무료로 시작하고, 필요할 때 업그레이드하세요. 모든 플랜에 마크다운 편집과 실시간 미리보기가 포함됩니다.
          </p>
        </div>

        <div className="w-full max-w-4xl">
          <PricingSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#1A202C]/20">
            docwise &copy; 2026. All rights reserved.
          </span>
          <span className="text-[9px] font-black text-[#1A202C]/15 uppercase tracking-widest">
            Markdown Knowledge Engine
          </span>
        </div>
      </footer>
    </div>
  );
}
