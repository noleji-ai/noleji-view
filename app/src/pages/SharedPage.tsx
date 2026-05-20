import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Download, ExternalLink, Share2 } from 'lucide-react';
import { loadFromGist } from '../services/gistStorage';
import { getUserPlan, canUsePremiumAction, trackPremiumAction } from '../utils/featureGate';
import { loadSharedDocument } from '../services/shareStore';

export default function SharedPage() {
  const { id } = useParams<{ id: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;

  useEffect(() => {
    if (!id) { setError(true); setLoading(false); return; }

    void loadSharedDocument(id).then((sharedRecord) => {
      if (sharedRecord) {
        setHtml(sharedRecord.html);
        setLoading(false);
        return;
      }

      if (id.startsWith('gist:')) {
        const gistId = id.slice(5);
        loadFromGist(gistId)
          .then((content) => { setHtml(content); setLoading(false); })
          .catch(() => { setError(true); setLoading(false); });
      } else {
        const stored = localStorage.getItem('noleji-view-shared-' + id) ?? localStorage.getItem('docwise-shared-' + id);
        if (stored) {
          setHtml(stored);
        } else {
          setError(true);
        }
        setLoading(false);
      }
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [id]);

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

    if (window.electronAPI?.saveFile) {
      const fileName = `noleji-view-fork-${id.replace('gist:', '')}.html`;
      const result = await window.electronAPI.saveFile(fileName, html);
      if (result) {
        setToast({ message: `파일이 저장되었습니다: ${result}`, type: 'success' });
      }
      return;
    }

    localStorage.setItem('noleji-view-fork-' + id, html);
    setToast({ message: '내 저장공간에 저장되었습니다.', type: 'success' });
  }, [html, id]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast({ message: '공유 링크를 복사했습니다.', type: 'success' });
    } catch {
      setToast({ message: '공유 링크를 복사하지 못했습니다.', type: 'error' });
    }
  }, [shareUrl]);

  const handleSystemShare = useCallback(async () => {
    if (!shareUrl) return;

    if (!navigator.share) {
      await handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: 'Noleji View 공유 문서',
        text: 'Noleji View에서 공유한 문서입니다.',
        url: shareUrl,
      });
      setToast({ message: '시스템 공유 메뉴를 열었습니다.', type: 'success' });
    } catch {
      await handleCopyLink();
    }
  }, [handleCopyLink, shareUrl]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="text-center p-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1A202C] flex items-center justify-center text-white font-bold text-2xl">v</div>
          <h1 className="text-2xl font-black text-[#1A202C] mb-2">문서를 찾을 수 없습니다</h1>
          <p className="text-sm text-[#1A202C]/50 mb-1">공유 링크가 만료되었거나 잘못된 링크입니다.</p>
          {!id?.startsWith('gist:') && (
            <p className="text-xs text-[#1A202C]/30 mb-4">로컬 링크는 같은 브라우저에서만 접근 가능합니다.</p>
          )}
          <Link to="/" className="mt-4 inline-block px-6 py-2 bg-[#10B981] text-white rounded-xl font-bold text-sm">Noleji View로 이동</Link>
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
    <div className="flex flex-col min-h-screen w-screen bg-[#F7FAFC] overflow-hidden">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] px-4 py-3 rounded-xl shadow-2xl text-[12px] font-bold ${
          toast.type === 'success' ? 'bg-[#10B981] text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <header className="flex-shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#1A202C] flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">v</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#1A202C]/70">공유 문서</span>
                {id?.startsWith('gist:') && (
                  <span className="text-[8px] font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">영구 링크</span>
                )}
              </div>
              <p className="text-[10px] text-[#1A202C]/35 truncate">모바일과 macOS 브라우저에서 바로 열 수 있는 읽기 전용 뷰입니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#10B981]/40 transition-all text-[10px] font-bold text-[#1A202C]/60"
            >
              <Copy size={12} />
              <span>링크 복사</span>
            </button>
            <button
              onClick={handleSystemShare}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#10B981]/40 transition-all text-[10px] font-bold text-[#1A202C]/60"
            >
              <Share2 size={12} />
              <span>시스템 공유</span>
            </button>
            <button
              onClick={handleFork}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-[#1A202C] text-white hover:bg-[#10B981] transition-all text-[10px] font-bold"
            >
              <Download size={12} />
              <span>내 저장공간에 저장</span>
            </button>
            <Link
              to="/"
              className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#10B981]/40 transition-all text-[10px] font-bold text-[#1A202C]/50"
            >
              <ExternalLink size={11} />
              <span>Noleji View</span>
            </Link>
          </div>
        </div>
      </header>

      <iframe
        srcDoc={html}
        className="flex-grow border-none bg-white"
        title="Noleji View shared document"
        sandbox="allow-scripts"
      />
    </div>
  );
}
