import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const SharedPage = lazy(() => import('./pages/SharedPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ViewerPage = lazy(() => import('./pages/ViewerPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const AccountDeletionPage = lazy(() => import('./pages/AccountDeletionPage'));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center text-[#1A202C]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1A202C] flex items-center justify-center text-white font-black shadow-lg shadow-black/10">
          v
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#1A202C]/45">
          Loading Noleji View
        </p>
      </div>
    </div>
  );
}

/**
 * Noleji View v1.0 — Router
 *
 * Routes:
 *   /           → Landing page
 *   /app        → Editor (main app)
 *   /pricing    → Pricing page
 *   /shared/:id → Shared document viewer
 *   /viewer     → Read-only document viewer (Electron)
 *   /privacy    → Privacy policy
 *   /terms      → Terms of service
 *   /support    → Support / contact
 *   /account-deletion → Account / data deletion guide
 */
export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<EditorPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/shared/:id" element={<SharedPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/account-deletion" element={<AccountDeletionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
