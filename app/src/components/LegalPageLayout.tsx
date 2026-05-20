import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicFooter from './PublicFooter';

interface LegalSection {
  title: string;
  body: ReactNode;
}

interface LegalPageLayoutProps {
  eyebrow: string;
  title: string;
  summary: string;
  effectiveDate: string;
  sections: LegalSection[];
}

export default function LegalPageLayout({ eyebrow, title, summary, effectiveDate, sections }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#1A202C] font-[Inter,sans-serif] antialiased">
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A202C] text-sm font-bold text-white shadow-lg shadow-black/10">v</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#10B981]">Noleji View</p>
              <h1 className="text-sm font-black tracking-tight">출시 필수 정책 문서</h1>
            </div>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[11px] font-bold text-[#1A202C]/60 transition-colors hover:border-[#10B981]/40 hover:text-[#10B981]">
            <ArrowLeft size={14} />
            홈페이지로
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#10B981]">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#1A202C]/70">{summary}</p>
          <p className="mt-4 text-[11px] font-bold text-[#1A202C]/35">시행일: {effectiveDate}</p>
        </section>

        <section className="mt-6 space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-7">
              <h3 className="text-lg font-black tracking-tight">{section.title}</h3>
              <div className="mt-3 space-y-3 text-sm leading-7 text-[#1A202C]/75">{section.body}</div>
            </article>
          ))}
        </section>
      </main>

      <PublicFooter compact />
    </div>
  );
}
