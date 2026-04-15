import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function SharedPage() {
  const { id } = useParams<{ id: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) { setError(true); return; }
    const stored = localStorage.getItem('docwise-shared-' + id);
    if (stored) {
      setHtml(stored);
    } else {
      setError(true);
    }
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="text-center p-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1A202C] flex items-center justify-center text-white font-bold text-2xl">d</div>
          <h1 className="text-2xl font-black text-[#1A202C] mb-2">문서를 찾을 수 없습니다</h1>
          <p className="text-sm text-[#1A202C]/50">공유 링크가 만료되었거나 잘못된 링크입니다.</p>
          <a href="/" className="mt-4 inline-block px-6 py-2 bg-[#10B981] text-white rounded-xl font-bold text-sm">docwise로 이동</a>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      className="w-full h-screen border-none"
      title="docwise shared document"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
