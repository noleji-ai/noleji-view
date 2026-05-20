import { Link } from 'react-router-dom';

interface PublicFooterProps {
  compact?: boolean;
  labels?: {
    privacy: string;
    terms: string;
    support: string;
    accountDeletion: string;
    copyright: string;
  };
}

const defaultLabels = {
  privacy: '개인정보처리방침',
  terms: '이용약관',
  support: '지원/문의',
  accountDeletion: '계정 삭제',
  copyright: '© 2026 Noleji View. All rights reserved.',
};

export default function PublicFooter({ compact = false, labels = defaultLabels }: PublicFooterProps) {
  const links = [
    { to: '/privacy', label: labels.privacy },
    { to: '/terms', label: labels.terms },
    { to: '/support', label: labels.support },
    { to: '/account-deletion', label: labels.accountDeletion },
  ];

  return (
    <footer className={`border-t border-[#E2E8F0] ${compact ? 'bg-white' : 'bg-[#F7FAFC]'}`}>
      <div
        className={`mx-auto flex max-w-7xl flex-col gap-4 px-4 ${
          compact ? 'py-6 sm:flex-row sm:items-center sm:justify-between' : 'py-8 sm:flex-row sm:items-center sm:justify-between'
        } sm:px-6 lg:px-8`}
      >
        <div className="flex items-center space-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1A202C] text-[10px] font-bold text-white">v</div>
          <span className="text-[11px] font-black uppercase italic tracking-tighter text-[#1A202C]/50">Noleji View</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-[#1A202C]/45">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-[#10B981]">
              {link.label}
            </Link>
          ))}
        </div>

        <p className="text-[11px] font-bold text-[#1A202C]/25">{labels.copyright}</p>
      </div>
    </footer>
  );
}
