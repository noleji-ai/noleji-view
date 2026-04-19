import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';
import { loadFromGist } from '../services/gistStorage';
import { getUserPlan, canUsePremiumAction, trackPremiumAction } from '../utils/featureGate';

export default function SharedPage() {
  const { id } = useParams<{ id: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!id) { setError(true); setLoading(false); return; }

    if (id.startsWith('gist:')) {
      const gistId = id.slice(5);
      loadFromGist(gistId)
        .then((content) => { setHtml(content); setLoading(false); })
        .catch(() => { setError(true); setLoading(false); });
    } else {
      const stored = localStorage.getItem('docwise-shared-' + id);
      if (stored) {
        setHtml(stored);
      } else {
        setError(true);
      }
      setLoading(false);
    }
  }, [id]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleFork = useCallback(async () => {
    if (!html || !id) return;

    const plan = getUserPlan();
    const isPaid = plan === 'monthly' || plan === 'lifetime';

    if (!isPaid) {
      const { allowed } = canUsePremiumAction();
      if (!allowed) {
        setToast({ message: '오늘의 무료 사용 횟수를 모두 소진했습니다. 업그레이드하세요!', type: 'error' });
        return;
      }
      trackPremiumAction('share_link');
    }

    // Electron mode: save as file
    if (window.electronAPI?.saveFile) {
      const fileName = `docwise-fork-${id.replace('gist:', '')}.html`;
      const result = await window.electronAPI.saveFile(fileName, html);
      if (result) {
        setToast({ message: `파일이 저장되었습니다: ${result}`, type: 'success' });
      }
      return;
    }

    // Web mode: save to localStorage
    localStorage.setItem('docwise-fork-' + id, html);
    setToast({ message: '내 저장공간에 저장되었습니다.', type: 'success' });
  }, [html, id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="text-center p-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1A202C] flex items-center justify-center text-white font-bold text-2xl">d</div>
          <h1 className="text-2xl font-black text-[#1A202C] mb-2">문서를 찾을 수 없습니다</h1>
          <p className="text-sm text-[#1A202C]/50 mb-1">공유 링크가 만료되었거나 잘못된 링크입니다.</p>
          {!id?.startsWith('gist:') && (
            <p className="text-xs text-[#1A202C]/30 mb-4">로컬 링크는 같은 브라우저에서만 접근 가능합니다.</p>
          )}
          <Link to="/" className="mt-4 inline-block px-6 py-2 bg-[#10B981] text-white rounded-xl font-bold text-sm">docwise로 이동</Link>
        </div>
      </div>
    );
  }

  if (loading || !html) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
          <p className="text-[11px] font-bold text-[#1A202C]/30">문서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F7FAFC] overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-[12px] font-bold ${
          toast.type === 'success' ? 'bg-[#10B981] text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Top bar */}
      <header className="h-11 flex-shrink-0 border-b border-[#E2E8F0] flex items-center justify-between px-5 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-md bg-[#1A202C] flex items-center justify-center text-white font-bold text-[10px]">d</div>
          <span className="text-[11px] font-bold text-[#1A202C]/60">공유 문서</span>
          {id?.startsWith('gist:') && (
            <span className="text-[8px] font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">영구 링크</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleFork}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1A202C] text-white hover:bg-[#10B981] transition-all text-[10px] font-bold"
          >
            <Download size={12} />
            <span>내 저장공간에 저장</span>
          </button>
          <Link
            to="/"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#10B981]/40 transition-all text-[10px] font-bold text-[#1A202C]/50"
          >
            <ExternalLink size={11} />
            <span>docwise</span>
          </Link>
        </div>
      </header>

      {/* Document */}
      <iframe
        srcDoc={html}
        className="flex-grow border-none"
        title="docwise shared document"
        sandbox="allow-scripts"
      />
    </div>
  );
}
