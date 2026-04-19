import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PricingSection from '../components/PricingSection';
import { useAuth } from '../hooks/useAuth';
import { getUserPlan } from '../utils/featureGate';
import { redirectToCheckout } from '../services/stripeCheckout';
import type { PricingTier } from '../types/pricing';

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authState } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const currentTier = authState.status === 'authenticated'
    ? authState.user.plan
    : getUserPlan();

  // Handle payment success/cancel redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // Update user plan (in a real app, this would verify with the server)
      const newPlan = searchParams.get('plan') as PricingTier || 'monthly';
      if (authState.status === 'authenticated') {
        const stored = localStorage.getItem('docwise-user');
        if (stored) {
          const user = JSON.parse(stored);
          user.plan = newPlan;
          localStorage.setItem('docwise-user', JSON.stringify(user));
          localStorage.setItem('docwise-user-plan', newPlan);
        }
      }
      setToast({ message: '결제가 완료되었습니다! 프리미엄 기능을 즐기세요.', type: 'success' });
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('canceled') === 'true') {
      setToast({ message: '결제가 취소되었습니다.', type: 'error' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, authState, setSearchParams]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSelectPlan = useCallback((tier: PricingTier) => {
    if (tier === 'free') return;

    if (authState.status !== 'authenticated') {
      setToast({ message: '로그인이 필요합니다. 앱에서 로그인 후 다시 시도해주세요.', type: 'error' });
      setTimeout(() => navigate('/app'), 1500);
      return;
    }

    if (authState.user.plan === tier) return;

    redirectToCheckout(tier, authState.user.uid);
  }, [authState, navigate]);

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col font-sans antialiased">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-[12px] font-bold flex items-center space-x-2 animate-in slide-in-from-right ${
          toast.type === 'success'
            ? 'bg-[#10B981] text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' && <Check size={14} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#E2E8F0] bg-white/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/app')}
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
          <PricingSection currentTier={currentTier} onSelectPlan={handleSelectPlan} />
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
