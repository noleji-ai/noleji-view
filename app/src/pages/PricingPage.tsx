import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PricingSection from '../components/PricingSection';
import { useAuth } from '../hooks/useAuth';
import { getUserPlan } from '../utils/featureGate';
import { getBillingProviderLabel, startCheckout } from '../services/billing';
import type { PricingTier } from '../types/pricing';
import PublicFooter from '../components/PublicFooter';

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
      const returnedPlan = searchParams.get('plan') as PricingTier || 'monthly';
      const provider = searchParams.get('provider') === 'toss' ? 'toss' : 'manual';
      setToast({
        message: `결제 페이지를 정상적으로 마쳤습니다. ${returnedPlan === 'lifetime' ? '평생' : '월간'} 플랜 상태는 ${getBillingProviderLabel(provider)} → Supabase 동기화 후 반영됩니다.`,
        type: 'success',
      });
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('canceled') === 'true') {
      setToast({ message: '결제가 취소되었습니다.', type: 'error' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

    try {
      startCheckout(tier, authState.user.uid);
    } catch (error) {
      setToast({
        message: error instanceof Error
          ? error.message
          : 'Toss Payments 결제 설정이 아직 완료되지 않았습니다. 클라이언트 키, 결제 플로우 URL, webhook 연동 후 활성화됩니다.',
        type: 'error',
      });
    }
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
              v
            </div>
            <span className="text-sm font-black tracking-tighter uppercase italic text-[#1A202C]">Noleji View</span>
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
            무료로 시작하고, 월 4,900원부터 업그레이드하세요. 모든 플랜에 마크다운 편집과 실시간 미리보기가 포함됩니다.
          </p>
        </div>

        <div className="w-full max-w-4xl">
          <PricingSection currentTier={currentTier} onSelectPlan={handleSelectPlan} />
        </div>
      </main>

      {/* Footer */}
      <PublicFooter compact />
    </div>
  );
}

