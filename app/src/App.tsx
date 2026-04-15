import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import EditorPage from './pages/EditorPage';
import SharedPage from './pages/SharedPage';
import PricingPage from './pages/PricingPage';

/**
 * docwise v4.0 — Router
 *
 * Routes:
 *   /           → Landing page
 *   /app        → Editor (main app)
 *   /pricing    → Pricing page
 *   /shared/:id → Shared document viewer
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<EditorPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/shared/:id" element={<SharedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
