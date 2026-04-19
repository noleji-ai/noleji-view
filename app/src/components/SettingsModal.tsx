import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, AlertCircle, Wifi, WifiOff, ChevronDown, UserCircle, LogOut, Crown, Sun, Moon } from 'lucide-react';
import type { LLMConfig, LLMProvider } from '../types/llm';
import { DEFAULT_LLM_CONFIGS } from '../types/llm';
import type { AuthState } from '../types/auth';
import { PRICING_PLANS } from '../data/pricingPlans';
import type { ViewerSettings } from '../shared/viewerSettings';
import { DEFAULT_VIEWER_SETTINGS } from '../shared/viewerSettings';
import { loadViewerSettings, saveViewerSettings } from '../shared/settingsStore';
import { DESIGN_TEMPLATES } from '../data/designTemplates';
import { getGithubToken, setGithubToken, removeGithubToken } from '../services/gistStorage';

/* ── Tab 정의 ── */
type SettingsTab = 'general' | 'share' | 'llm' | 'auth' | 'viewer';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: '일반' },
  { id: 'share', label: '공유' },
  { id: 'llm', label: 'LLM' },
  { id: 'auth', label: '계정' },
  { id: 'viewer', label: '뷰어' },
];

/* ── Provider 옵션 ── */
const PROVIDER_OPTIONS: { value: LLMProvider; label: string; description: string }[] = [
  { value: 'openai', label: 'ChatGPT (OpenAI)', description: 'GPT-4o, GPT-4 Turbo' },
  { value: 'anthropic', label: 'Claude (Anthropic)', description: 'Claude Sonnet, Opus, Haiku' },
  { value: 'google', label: 'Gemini (Google)', description: 'Gemini 2.0 Flash, Pro' },
  { value: 'lmstudio', label: 'LM Studio (Local)', description: '로컬 모델 서버' },
];

/* ── Props ── */
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareMode: 'internal' | 'external';
  setShareMode: (mode: 'internal' | 'external') => void;
  llmConfig: LLMConfig;
  setLLMConfig: (config: LLMConfig) => void;
  onTestConnection: () => Promise<boolean>;
  authState: AuthState;
  onSignIn: (provider: 'google' | 'github') => void;
  onSignOut: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  shareMode,
  setShareMode,
  llmConfig,
  setLLMConfig,
  onTestConnection,
  authState,
  onSignIn,
  onSignOut,
}: SettingsModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failure' | null>(null);
  const [showAdvancedUrl, setShowAdvancedUrl] = useState(false);

  /* Close on Escape */
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  /* Reset test result when provider changes */
  React.useEffect(() => {
    setTestResult(null);
  }, [llmConfig.provider]);

  const updateConfig = useCallback(
    (patch: Partial<LLMConfig>) => {
      setLLMConfig({ ...llmConfig, ...patch });
    },
    [llmConfig, setLLMConfig],
  );

  const handleProviderChange = useCallback(
    (provider: LLMProvider) => {
      const defaults = DEFAULT_LLM_CONFIGS[provider];
      setLLMConfig({
        ...llmConfig,
        provider,
        model: (defaults.model as string) ?? llmConfig.model,
        baseUrl: (defaults.baseUrl as string) ?? llmConfig.baseUrl,
        temperature: defaults.temperature ?? llmConfig.temperature,
        maxTokens: defaults.maxTokens ?? llmConfig.maxTokens,
        apiKey: provider === 'lmstudio' ? '' : llmConfig.apiKey,
        isConnected: false,
      });
      setTestResult(null);
      setShowAdvancedUrl(provider === 'lmstudio');
    },
    [llmConfig, setLLMConfig],
  );

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await onTestConnection();
      setTestResult(ok ? 'success' : 'failure');
      updateConfig({ isConnected: ok });
    } catch {
      setTestResult('failure');
      updateConfig({ isConnected: false });
    } finally {
      setIsTesting(false);
    }
  }, [onTestConnection, updateConfig]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1A202C]/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl border border-[#E2E8F0] flex flex-col overflow-hidden max-h-[90vh]">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-8 pt-7 pb-0">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#1A202C]">Settings</h2>
            <p className="text-[8px] font-black text-[#1A202C]/25 uppercase tracking-[0.25em] mt-0.5">docwise preferences</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all text-[#1A202C]/30"
          >
            <X size={18} />
          </button>
        </header>

        {/* ── Tab bar ── */}
        <div className="px-8 pt-5 pb-0">
          <div className="flex bg-[#F7FAFC] p-1 rounded-xl border border-[#E2E8F0]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-[#10B981] border border-[#E2E8F0]'
                    : 'text-[#1A202C]/30 hover:text-[#1A202C]/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-grow overflow-y-auto px-8 py-6 custom-scrollbar">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'share' && (
            <ShareTab shareMode={shareMode} setShareMode={setShareMode} />
          )}
          {activeTab === 'llm' && (
            <LLMTab
              config={llmConfig}
              updateConfig={updateConfig}
              onProviderChange={handleProviderChange}
              onTestConnection={handleTestConnection}
              isTesting={isTesting}
              testResult={testResult}
              showAdvancedUrl={showAdvancedUrl}
              setShowAdvancedUrl={setShowAdvancedUrl}
            />
          )}
          {activeTab === 'auth' && (
            <AuthTab authState={authState} onSignIn={onSignIn} onSignOut={onSignOut} onClose={onClose} onNavigate={(path) => { onClose(); navigate(path); }} />
          )}
          {activeTab === 'viewer' && <ViewerTab />}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*                  General Tab                   */
/* ══════════════════════════════════════════════ */
function GeneralTab() {
  const [defaultFileType, setDefaultFileType] = useState<'md' | 'html'>('md');

  return (
    <div className="space-y-6">
      {/* Version */}
      <Section label="App Version">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A202C] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-black/10">
            d
          </div>
          <div>
            <p className="text-sm font-black text-[#1A202C]">docwise v3.5</p>
            <p className="text-[10px] font-bold text-[#1A202C]/30">Markdown Knowledge Engine</p>
          </div>
        </div>
      </Section>

      {/* Default file type */}
      <Section label="Default File Type">
        <div className="flex bg-[#F7FAFC] p-1 rounded-xl border border-[#E2E8F0] w-fit">
          <button
            onClick={() => setDefaultFileType('md')}
            className={`px-4 py-2 text-[11px] font-black rounded-lg transition-all ${
              defaultFileType === 'md'
                ? 'bg-white shadow-sm text-[#10B981] border border-[#E2E8F0]'
                : 'text-[#1A202C]/30'
            }`}
          >
            Markdown (.md)
          </button>
          <button
            onClick={() => setDefaultFileType('html')}
            className={`px-4 py-2 text-[11px] font-black rounded-lg transition-all ${
              defaultFileType === 'html'
                ? 'bg-white shadow-sm text-amber-500 border border-[#E2E8F0]'
                : 'text-[#1A202C]/30'
            }`}
          >
            HTML (.html)
          </button>
        </div>
      </Section>

      {/* Theme */}
      <Section label="Theme">
        <div className="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#F7FAFC]/30 w-fit">
          <div className="flex space-x-1">
            <div className="w-4 h-4 rounded-full bg-[#1A202C]" />
            <div className="w-4 h-4 rounded-full bg-[#10B981]" />
          </div>
          <span className="text-[12px] font-black text-[#1A202C]">Asome Emerald</span>
          <span className="text-[9px] font-bold text-[#1A202C]/20 uppercase">Active</span>
        </div>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*                  Share Tab                      */
/* ══════════════════════════════════════════════ */
function ShareTab({
  shareMode,
  setShareMode,
}: {
  shareMode: 'internal' | 'external';
  setShareMode: (mode: 'internal' | 'external') => void;
}) {
  return (
    <div className="space-y-6">
      <Section label="Share Mode">
        <div className="flex bg-[#F7FAFC] p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setShareMode('internal')}
            className={`flex-1 py-2.5 text-[11px] font-black rounded-lg transition-all ${
              shareMode === 'internal'
                ? 'bg-white shadow-sm text-[#10B981] border border-[#E2E8F0]'
                : 'text-[#1A202C]/30'
            }`}
          >
            내부용 (Internal)
          </button>
          <button
            onClick={() => setShareMode('external')}
            className={`flex-1 py-2.5 text-[11px] font-black rounded-lg transition-all ${
              shareMode === 'external'
                ? 'bg-white shadow-sm text-[#10B981] border border-[#E2E8F0]'
                : 'text-[#1A202C]/30'
            }`}
          >
            외부용 (External)
          </button>
        </div>
      </Section>

      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F7FAFC]/30">
        {shareMode === 'internal' ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#1A202C]/70">
              공유용 HTML 파일을 다운로드합니다. 내부 서버에 업로드하여 공유하세요.
            </p>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-[#1A202C]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>파일 다운로드 방식 &mdash; 오프라인 접근 가능</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#1A202C]/70">
              새 탭에서 미리보기를 열고 URL을 공유합니다.
            </p>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-[#1A202C]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>URL 공유 방식 &mdash; 인터넷 연결 필요</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*                   LLM Tab                       */
/* ══════════════════════════════════════════════ */
function LLMTab({
  config,
  updateConfig,
  onProviderChange,
  onTestConnection,
  isTesting,
  testResult,
  showAdvancedUrl,
  setShowAdvancedUrl,
}: {
  config: LLMConfig;
  updateConfig: (patch: Partial<LLMConfig>) => void;
  onProviderChange: (provider: LLMProvider) => void;
  onTestConnection: () => void;
  isTesting: boolean;
  testResult: 'success' | 'failure' | null;
  showAdvancedUrl: boolean;
  setShowAdvancedUrl: (v: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Connection status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {config.isConnected ? (
            <>
              <Wifi size={14} className="text-[#10B981]" />
              <span className="text-[11px] font-black text-[#10B981]">Connected</span>
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-[#1A202C]/25" />
              <span className="text-[11px] font-black text-[#1A202C]/25">Disconnected</span>
              <span className="w-2 h-2 rounded-full bg-[#1A202C]/15" />
            </>
          )}
        </div>
        {testResult && (
          <span
            className={`text-[9px] font-black px-2.5 py-1 rounded-full ${
              testResult === 'success'
                ? 'bg-[#10B981]/10 text-[#10B981]'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {testResult === 'success' ? 'TEST PASSED' : 'TEST FAILED'}
          </span>
        )}
      </div>

      {/* Provider */}
      <Section label="Provider">
        <div className="relative">
          <select
            value={config.provider}
            onChange={(e) => onProviderChange(e.target.value as LLMProvider)}
            className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#1A202C] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all cursor-pointer pr-10"
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A202C]/25 pointer-events-none"
          />
        </div>
        <p className="text-[10px] font-bold text-[#1A202C]/25 mt-1.5">
          {PROVIDER_OPTIONS.find((o) => o.value === config.provider)?.description}
        </p>
      </Section>

      {/* API Key (hidden for lmstudio) */}
      {config.provider !== 'lmstudio' && (
        <Section label="API Key">
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => updateConfig({ apiKey: e.target.value })}
            placeholder={`Enter ${config.provider} API key...`}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[12px] font-mono text-[#1A202C] placeholder-[#1A202C]/15 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
          />
        </Section>
      )}

      {/* Model */}
      <Section label="Model">
        <input
          type="text"
          value={config.model}
          onChange={(e) => updateConfig({ model: e.target.value })}
          placeholder="Model name..."
          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#1A202C] placeholder-[#1A202C]/15 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
        />
      </Section>

      {/* Base URL */}
      {config.provider === 'lmstudio' ? (
        <Section label="Base URL">
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => updateConfig({ baseUrl: e.target.value })}
            placeholder="http://localhost:1234/v1"
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[12px] font-mono text-[#1A202C] placeholder-[#1A202C]/15 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
          />
        </Section>
      ) : (
        <div>
          <button
            onClick={() => setShowAdvancedUrl(!showAdvancedUrl)}
            className="text-[9px] font-black text-[#1A202C]/25 uppercase tracking-widest hover:text-[#10B981] transition-colors flex items-center space-x-1"
          >
            <ChevronDown
              size={10}
              className={`transition-transform ${showAdvancedUrl ? 'rotate-180' : ''}`}
            />
            <span>Advanced: Base URL</span>
          </button>
          {showAdvancedUrl && (
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => updateConfig({ baseUrl: e.target.value })}
              className="w-full mt-2 bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[12px] font-mono text-[#1A202C] placeholder-[#1A202C]/15 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
            />
          )}
        </div>
      )}

      {/* Temperature */}
      <Section label={`Temperature: ${config.temperature.toFixed(1)}`}>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={config.temperature * 10}
          onChange={(e) => updateConfig({ temperature: parseInt(e.target.value) / 10 })}
          className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: '#10B981' }}
        />
        <div className="flex justify-between text-[9px] font-bold text-[#1A202C]/20 mt-1">
          <span>0.0 (Precise)</span>
          <span>1.0 (Creative)</span>
        </div>
      </Section>

      {/* Max Tokens */}
      <Section label="Max Tokens">
        <input
          type="number"
          value={config.maxTokens}
          onChange={(e) => updateConfig({ maxTokens: Math.max(1, parseInt(e.target.value) || 1) })}
          min={1}
          step={256}
          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#1A202C] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
        />
      </Section>

      {/* Test connection button */}
      <button
        onClick={onTestConnection}
        disabled={isTesting}
        className="w-full py-3 bg-[#1A202C] text-white rounded-xl font-black text-[10px] tracking-[0.12em] uppercase hover:bg-[#10B981] transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        {isTesting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Testing...</span>
          </>
        ) : testResult === 'success' ? (
          <>
            <Check size={14} />
            <span>연결 테스트 완료</span>
          </>
        ) : testResult === 'failure' ? (
          <>
            <AlertCircle size={14} />
            <span>재시도: 연결 테스트</span>
          </>
        ) : (
          <span>연결 테스트</span>
        )}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*                  Auth Tab                        */
/* ══════════════════════════════════════════════ */
function AuthTab({
  authState,
  onSignIn,
  onSignOut,
  onNavigate,
}: {
  authState: AuthState;
  onSignIn: (provider: 'google' | 'github') => void;
  onSignOut: () => void;
  onClose?: () => void;
  onNavigate?: (path: string) => void;
}) {
  if (authState.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[#E2E8F0] border-t-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

  if (authState.status === 'unauthenticated') {
    return (
      <div className="space-y-6">
        <Section label="로그인">
          <p className="text-[12px] font-medium text-[#1A202C]/50 mb-4">
            로그인하면 설정과 파일이 클라우드에 동기화됩니다.
          </p>
          <div className="space-y-2.5">
            <button
              onClick={() => onSignIn('google')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F7FAFC] hover:border-[#10B981]/40 transition-all text-[12px] font-bold text-[#1A202C]"
            >
              <UserCircle size={18} className="text-[#10B981]" />
              <span>Google 계정으로 로그인</span>
            </button>
            <button
              onClick={() => onSignIn('github')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F7FAFC] hover:border-[#1A202C]/40 transition-all text-[12px] font-bold text-[#1A202C]"
            >
              <UserCircle size={18} className="text-[#1A202C]/50" />
              <span>GitHub 계정으로 로그인</span>
            </button>
          </div>
        </Section>
      </div>
    );
  }

  const { user } = authState;
  const currentPlan = PRICING_PLANS.find((p) => p.tier === user.plan) ?? PRICING_PLANS[0];

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Section label="프로필">
        <div className="flex items-center space-x-4 p-4 rounded-xl border border-[#E2E8F0] bg-[#F7FAFC]/30">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'User'}
              className="w-12 h-12 rounded-full border-2 border-[#E2E8F0]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center text-white text-lg font-black">
              {user.displayName?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#1A202C] truncate">{user.displayName ?? 'User'}</p>
            <p className="text-[10px] font-bold text-[#1A202C]/30 truncate">{user.email ?? 'No email'}</p>
            <p className="text-[9px] font-bold text-[#1A202C]/20 uppercase tracking-wider mt-0.5">
              {user.provider} &middot; {new Date(user.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      </Section>

      {/* Current Plan */}
      <Section label="현재 플랜">
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#E2E8F0] bg-[#F7FAFC]/30">
          <div className="flex items-center space-x-3">
            <Crown size={18} className={user.plan === 'free' ? 'text-[#1A202C]/20' : 'text-[#10B981]'} />
            <div>
              <p className="text-[13px] font-black text-[#1A202C]">{currentPlan.name}</p>
              <p className="text-[10px] font-bold text-[#1A202C]/30">{currentPlan.price} &middot; {currentPlan.priceNote}</p>
            </div>
          </div>
          {user.plan === 'free' && (
            <button
              onClick={() => onNavigate?.('/pricing')}
              className="text-[9px] font-black text-[#10B981] bg-[#10B981]/10 px-3 py-1.5 rounded-full uppercase tracking-wider cursor-pointer hover:bg-[#10B981]/20 transition-all"
            >
              업그레이드
            </button>
          )}
        </div>
      </Section>

      {/* GitHub Token for Permanent Links */}
      <Section label="영구 링크 설정">
        <p className="text-[10px] font-medium text-[#1A202C]/40 mb-3">
          유료 사용자는 GitHub Gist를 통해 만료되지 않는 영구 링크를 생성할 수 있습니다.
        </p>
        <GitHubTokenInput />
      </Section>

      {/* Sign Out */}
      <button
        onClick={onSignOut}
        className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl border border-red-200 text-red-500 font-black text-[11px] hover:bg-red-50 transition-all active:scale-[0.98]"
      >
        <LogOut size={14} />
        <span>로그아웃</span>
      </button>
    </div>
  );
}

function GitHubTokenInput() {
  const [token, setToken] = useState(getGithubToken() ?? '');
  const [saved, setSaved] = useState(!!getGithubToken());
  const [showToken, setShowToken] = useState(false);

  const handleSave = () => {
    if (token.trim()) {
      setGithubToken(token.trim());
      setSaved(true);
    }
  };

  const handleRemove = () => {
    removeGithubToken();
    setToken('');
    setSaved(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type={showToken ? 'text' : 'password'}
          value={token}
          onChange={(e) => { setToken(e.target.value); setSaved(false); }}
          placeholder="ghp_xxxxxxxxxxxx"
          className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[11px] font-mono text-[#1A202C] placeholder-[#1A202C]/20 focus:outline-none focus:border-[#10B981]"
        />
        <button
          onClick={() => setShowToken(!showToken)}
          className="px-2 py-2 rounded-lg border border-[#E2E8F0] text-[9px] font-bold text-[#1A202C]/40 hover:text-[#1A202C] transition-all"
        >
          {showToken ? '숨기기' : '보기'}
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleSave}
          disabled={!token.trim() || saved}
          className="px-3 py-1.5 rounded-lg bg-[#10B981] text-white text-[10px] font-bold disabled:opacity-30 disabled:cursor-default hover:bg-[#059669] transition-all"
        >
          {saved ? '저장됨' : '저장'}
        </button>
        {saved && (
          <button
            onClick={handleRemove}
            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-[10px] font-bold hover:bg-red-50 transition-all"
          >
            삭제
          </button>
        )}
      </div>
      <p className="text-[9px] text-[#1A202C]/25">
        GitHub Personal Access Token (gist 권한 필요) · <a href="https://github.com/settings/tokens/new?scopes=gist&description=docwise" target="_blank" rel="noopener noreferrer" className="text-[#10B981] hover:underline">토큰 생성하기</a>
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*                Viewer Tab                       */
/* ══════════════════════════════════════════════ */
function ViewerTab() {
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULT_VIEWER_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadViewerSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const update = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveViewerSettings(next);
      return next;
    });
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[#E2E8F0] border-t-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template selector */}
      <Section label="디자인 템플릿">
        <div className="grid grid-cols-3 gap-2">
          {DESIGN_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => update({ templateId: tmpl.id })}
              className={`p-3 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                settings.templateId === tmpl.id
                  ? 'border-[#10B981] bg-[#10B981]/5'
                  : 'border-[#E2E8F0] bg-white hover:border-[#10B981]/40'
              }`}
            >
              <div className="flex items-center space-x-1 mb-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tmpl.color }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tmpl.accent }} />
              </div>
              <p className="text-[10px] font-black text-[#1A202C] leading-tight truncate">{tmpl.name}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Font size */}
      <Section label={`글자 크기: ${settings.fontSize}px`}>
        <input
          type="range"
          min="12"
          max="28"
          value={settings.fontSize}
          onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: '#10B981' }}
        />
        <div className="flex justify-between text-[9px] font-bold text-[#1A202C]/20 mt-1">
          <span>12px</span>
          <span>28px</span>
        </div>
      </Section>

      {/* Line height */}
      <Section label={`줄 간격: ${settings.lineHeight.toFixed(1)}`}>
        <input
          type="range"
          min="14"
          max="26"
          step="1"
          value={settings.lineHeight * 10}
          onChange={(e) => update({ lineHeight: parseInt(e.target.value) / 10 })}
          className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: '#10B981' }}
        />
        <div className="flex justify-between text-[9px] font-bold text-[#1A202C]/20 mt-1">
          <span>1.4</span>
          <span>2.6</span>
        </div>
      </Section>

      {/* Padding */}
      <Section label={`여백: ${settings.padding}px`}>
        <input
          type="range"
          min="20"
          max="100"
          step="10"
          value={settings.padding}
          onChange={(e) => update({ padding: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: '#10B981' }}
        />
        <div className="flex justify-between text-[9px] font-bold text-[#1A202C]/20 mt-1">
          <span>20px</span>
          <span>100px</span>
        </div>
      </Section>

      {/* Document width */}
      <Section label="문서 너비">
        <div className="grid grid-cols-4 gap-1.5">
          {['640px', '800px', '1200px', '100%'].map((w) => (
            <button
              key={w}
              onClick={() => update({ docWidth: w })}
              className={`py-2 text-[10px] font-black border rounded-lg transition-all ${
                settings.docWidth === w
                  ? 'bg-[#1A202C] text-white border-[#1A202C]'
                  : 'bg-white text-[#1A202C]/30 border-[#E2E8F0] hover:border-[#10B981]'
              }`}
            >
              {w === '100%' ? 'FULL' : w}
            </button>
          ))}
        </div>
      </Section>

      {/* Dark mode toggle */}
      <Section label="다크 모드">
        <button
          onClick={() => update({ isDark: !settings.isDark })}
          className={`w-full py-3 rounded-xl border-2 font-black text-[11px] transition-all flex items-center justify-center space-x-2 ${
            settings.isDark
              ? 'bg-[#1A202C] border-[#1A202C] text-white'
              : 'bg-white border-[#E2E8F0] text-[#1A202C]/50 hover:border-[#10B981]'
          }`}
        >
          {settings.isDark ? <Moon size={14} /> : <Sun size={14} />}
          <span>{settings.isDark ? 'DARK MODE' : 'LIGHT MODE'}</span>
        </button>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*               Shared Section Wrapper            */
/* ══════════════════════════════════════════════ */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-[#1A202C]/30 uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}
