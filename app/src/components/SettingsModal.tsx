import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, AlertCircle, Wifi, WifiOff, UserCircle, LogOut, Crown, Sun, Moon } from 'lucide-react';
import type { LLMAccessMode, LLMConfig, LLMProvider } from '../types/llm';
import { DEFAULT_LLM_CONFIGS, PROVIDER_MODELS } from '../types/llm';
import type { AuthState } from '../types/auth';
import { PRICING_PLANS } from '../data/pricingPlans';
import type { ViewerSettings } from '../shared/viewerSettings';
import { DEFAULT_VIEWER_SETTINGS } from '../shared/viewerSettings';
import { loadViewerSettings, saveViewerSettings } from '../shared/settingsStore';
import { DESIGN_TEMPLATES } from '../data/designTemplates';
import { canUseManagedAI } from '../utils/featureGate';

/* ── Tab 정의 ── */
type SettingsTab = 'general' | 'share' | 'llm' | 'auth' | 'viewer';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: '일반' },
  { id: 'share', label: '공유' },
  { id: 'llm', label: 'LLM' },
  { id: 'auth', label: '계정' },
  { id: 'viewer', label: '뷰어' },
];

const BRAND_NAME = 'Noleji View';
const DOC_WIDTH_OPTIONS: ViewerSettings['docWidth'][] = ['640px', '800px', '1000px', '1200px', '100%'];

const ACCESS_MODE_OPTIONS: { value: LLMAccessMode; label: string; description: string }[] = [
  { value: 'managed', label: 'Noleji View AI', description: '유료 구독으로 별도 키 입력 없이 관리형 AI를 사용합니다.' },
  { value: 'local', label: 'Local LM Studio', description: '무료로 로컬 모델 서버를 직접 연결합니다.' },
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
  onEmailAuth: (email: string, password: string, mode: 'signin' | 'signup') => Promise<{ requiresConfirmation: boolean }>;
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
  onEmailAuth,
  onSignOut,
}: SettingsModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failure' | null>(null);
  const managedAIEnabled = authState.status === 'authenticated' ? authState.user.entitlements.managedAI : canUseManagedAI();

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
        accessMode: provider === 'lmstudio' ? 'local' : 'managed',
        provider,
        model: (defaults.model as string) ?? llmConfig.model,
        baseUrl: (defaults.baseUrl as string) ?? llmConfig.baseUrl,
        temperature: defaults.temperature ?? llmConfig.temperature,
        maxTokens: defaults.maxTokens ?? llmConfig.maxTokens,
        apiKey: '',
        isConnected: false,
      });
      setTestResult(null);
    },
    [llmConfig, setLLMConfig],
  );

  const handleAccessModeChange = useCallback((mode: LLMAccessMode) => {
    if (mode === 'managed') {
      handleProviderChange('docwise');
      return;
    }
    if (mode === 'local') {
      handleProviderChange('lmstudio');
      return;
    }
    handleProviderChange('docwise');
  }, [handleProviderChange]);

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
            <p className="text-[8px] font-black text-[#1A202C]/25 uppercase tracking-[0.25em] mt-0.5">{BRAND_NAME} preferences</p>
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
              onAccessModeChange={handleAccessModeChange}
              onTestConnection={handleTestConnection}
              isTesting={isTesting}
              testResult={testResult}
              managedAIEnabled={managedAIEnabled}
            />
          )}
          {activeTab === 'auth' && (
            <AuthTab authState={authState} onSignIn={onSignIn} onEmailAuth={onEmailAuth} onSignOut={onSignOut} onClose={onClose} onNavigate={(path) => { onClose(); navigate(path); }} />
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
  return (
    <div className="space-y-6">
      <Section label="Welcome">
        <div className="rounded-[24px] border border-[#E2E8F0] bg-[linear-gradient(135deg,#1A202C_0%,#0F172A_55%,#10B981_160%)] p-5 text-white shadow-xl shadow-[#1A202C]/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/55">Open Design setup guide</p>
              <h3 className="mt-2 text-lg font-black tracking-tight">처음 설치한 뒤 바로 보기 좋게 시작하는 순서</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-white/70">
                {BRAND_NAME}는 로컬 우선 마크다운 워크스페이스입니다. 아래 3단계만 끝내면
                .md / .html 문서를 더블클릭으로 열고, 동일한 뷰 스타일로 미리보기와 뷰어를 함께 사용할 수 있습니다.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-black">v</div>
          </div>
        </div>
      </Section>

      <Section label="First-launch checklist">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              step: '01',
              title: '앱 설치 확인',
              desc: '/Applications 폴더에 Noleji View.app 이 있는지 먼저 확인하세요. 목록에 안 보이면 Finder에서 앱을 한 번 직접 실행해 두면 선택이 쉬워집니다.',
            },
            {
              step: '02',
              title: '기본 앱 연결',
              desc: 'Finder에서 .md 파일 하나를 선택한 뒤 정보 가져오기 → 다음으로 열기 → Noleji View → 모두 변경 순서로 설정하세요.',
            },
            {
              step: '03',
              title: '뷰 스타일 맞추기',
              desc: '설정 > 뷰어에서 템플릿, 폭, 여백, 다크 모드를 정하면 편집 화면과 별도 뷰어가 같은 기준으로 맞춰집니다.',
            },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">Step {item.step}</div>
              <h3 className="mt-2 text-sm font-black text-[#1A202C]">{item.title}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-[#1A202C]/55">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="macOS default app guide">
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F7FAFC] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
              <p className="text-[11px] font-black text-[#1A202C]">Markdown (.md)</p>
              <ol className="mt-3 space-y-2 text-[12px] leading-relaxed text-[#1A202C]/60 list-decimal pl-4">
                <li>Finder에서 아무 .md 파일이나 하나 선택합니다.</li>
                <li>마우스 오른쪽 버튼 → 정보 가져오기 를 엽니다.</li>
                <li>다음으로 열기 항목에서 Noleji View를 선택합니다.</li>
                <li>모두 변경...을 눌러 모든 Markdown 파일에 적용합니다.</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
              <p className="text-[11px] font-black text-[#1A202C]">HTML (.html / .htm)</p>
              <ol className="mt-3 space-y-2 text-[12px] leading-relaxed text-[#1A202C]/60 list-decimal pl-4">
                <li>.html 또는 .htm 파일 하나를 선택합니다.</li>
                <li>정보 가져오기에서 다음으로 열기를 펼칩니다.</li>
                <li>Noleji View를 선택한 뒤 모두 변경...을 누릅니다.</li>
                <li>이후에는 더블클릭만으로 같은 뷰어에서 열 수 있습니다.</li>
              </ol>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-[#10B981]/15 bg-[#ECFDF5] px-4 py-3 text-[12px] leading-relaxed text-[#065F46]">
            팁: 앱 목록에 Noleji View가 보이지 않으면 /Applications/Noleji View.app 을 먼저 실행하거나,
            정보 가져오기 창에서 직접 앱을 선택해 주세요.
          </div>
        </div>
      </Section>

      <Section label="Current theme">
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
              링크를 클립보드에 복사하고, 지원 환경에서는 시스템 공유 시트로 바로 전달합니다.
            </p>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-[#1A202C]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>복사 + 시스템 공유 방식 &mdash; HTML 다운로드는 보조 내보내기로 분리 예정</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#1A202C]/70">
              기본 동작은 링크 복사입니다. 지원되는 플랫폼에서는 바로 시스템 공유 메뉴도 함께 사용할 수 있습니다.
            </p>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-[#1A202C]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>유료 플랜은 계정 기반 링크, 무료 플랜은 로컬 링크를 우선 사용합니다.</span>
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
  onAccessModeChange,
  onTestConnection,
  isTesting,
  testResult,
  managedAIEnabled,
}: {
  config: LLMConfig;
  updateConfig: (patch: Partial<LLMConfig>) => void;
  onAccessModeChange: (mode: LLMAccessMode) => void;
  onTestConnection: () => void;
  isTesting: boolean;
  testResult: 'success' | 'failure' | null;
  managedAIEnabled: boolean;
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

      <Section label="접속 방식">
        <div className="grid grid-cols-1 gap-2.5">
          {ACCESS_MODE_OPTIONS.map((option) => {
            const disabled = option.value === 'managed' && !managedAIEnabled;

            return (
              <button
                key={option.value}
                onClick={() => !disabled && onAccessModeChange(option.value)}
                disabled={disabled}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  config.accessMode === option.value
                    ? 'border-[#10B981] bg-[#10B981]/5'
                    : 'border-[#E2E8F0] bg-white'
                } ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:border-[#10B981]/40'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-black text-[#1A202C]">{option.label}</span>
                  {disabled && <span className="text-[9px] font-black uppercase tracking-wider text-[#1A202C]/25">업그레이드 필요</span>}
                </div>
                <p className="mt-1 text-[10px] font-medium text-[#1A202C]/45">{option.description}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {config.accessMode === 'managed' && (
        <Section label="Noleji View AI 상태">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F7FAFC]/30 p-4">
            <p className="text-[12px] font-bold text-[#1A202C]/70">
              {BRAND_NAME} 계정과 요금제 기반으로 서버 제공 AI를 사용합니다.
            </p>
            <p className="mt-1 text-[10px] font-medium text-[#1A202C]/35">
              백엔드가 연결되면 별도 모델 키 입력 없이 바로 사용할 수 있습니다.
            </p>
          </div>
        </Section>
      )}

      {/* Model */}
      <Section label="Model">
        {config.accessMode === 'managed' ? (
          <select
            value={config.model}
            onChange={(e) => updateConfig({ model: e.target.value })}
            className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#1A202C] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all cursor-pointer"
          >
            {PROVIDER_MODELS.docwise.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={config.model}
            onChange={(e) => updateConfig({ model: e.target.value })}
            placeholder="Model name..."
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#1A202C] placeholder-[#1A202C]/15 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
          />
        )}
      </Section>

      {/* Base URL */}
      {config.accessMode === 'local' && (
        <Section label="Base URL">
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => updateConfig({ baseUrl: e.target.value })}
            placeholder="http://localhost:1234/v1"
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[12px] font-mono text-[#1A202C] placeholder-[#1A202C]/15 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
          />
        </Section>
      )}

      {/* Provider */}
      <Section label="Provider">
        <div className="relative">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F7FAFC]/30 px-4 py-2.5 text-[12px] font-bold text-[#1A202C]">
            {config.accessMode === 'managed' ? 'Noleji View Managed AI' : 'LM Studio (Local)'}
          </div>
        </div>
        <p className="text-[10px] font-bold text-[#1A202C]/25 mt-1.5">
          {config.accessMode === 'managed'
            ? '로그인 사용자에게 서버가 모델 라우팅과 과금을 대신 처리합니다.'
            : '로컬 서버를 직접 연결합니다.'}
        </p>
      </Section>

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
            <span>{config.accessMode === 'managed' ? '서비스 연결 확인 완료' : '연결 테스트 완료'}</span>
          </>
        ) : testResult === 'failure' ? (
          <>
            <AlertCircle size={14} />
            <span>{config.accessMode === 'managed' ? '재시도: 서비스 연결 확인' : '재시도: 연결 테스트'}</span>
          </>
        ) : (
          <span>{config.accessMode === 'managed' ? '서비스 연결 확인' : '연결 테스트'}</span>
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
  onEmailAuth,
  onSignOut,
  onNavigate,
}: {
  authState: AuthState;
  onSignIn: (provider: 'google' | 'github') => void;
  onEmailAuth: (email: string, password: string, mode: 'signin' | 'signup') => Promise<{ requiresConfirmation: boolean }>;
  onSignOut: () => void;
  onClose?: () => void;
  onNavigate?: (path: string) => void;
}) {
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  if (authState.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[#E2E8F0] border-t-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

  const handleEmailAuth = async () => {
    setAuthMessage(null);
    setAuthError(null);

    if (!email.trim() || !password.trim()) {
      setAuthError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (emailMode === 'signup' && password !== confirmPassword) {
      setAuthError('비밀번호 확인 값이 일치하지 않습니다.');
      return;
    }

    setIsSubmittingEmail(true);
    try {
      const result = await onEmailAuth(email.trim(), password, emailMode);
      setAuthMessage(
        emailMode === 'signup'
          ? result.requiresConfirmation
            ? '회원가입이 접수되었습니다. Supabase 이메일 확인 후 로그인해주세요.'
            : '회원가입과 로그인에 성공했습니다.'
          : '로그인에 성공했습니다.',
      );
      if (emailMode === 'signup' && result.requiresConfirmation) {
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '이메일 인증 중 오류가 발생했습니다.';
      setAuthError(message);
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  if (authState.status === 'unauthenticated') {
    return (
      <div className="space-y-6">
        <Section label="로그인">
          <p className="text-[12px] font-medium text-[#1A202C]/50 mb-4">
            로그인하면 이 기기의 문서 작업본과 최근 세션이 계정 작업공간에 동기화됩니다.
          </p>

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F7FAFC] p-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEmailMode('signin');
                  setAuthMessage(null);
                  setAuthError(null);
                }}
                className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black transition-all ${
                  emailMode === 'signin'
                    ? 'bg-white text-[#10B981] border border-[#10B981]/20 shadow-sm'
                    : 'bg-transparent text-[#1A202C]/45 border border-transparent'
                }`}
              >
                이메일 로그인
              </button>
              <button
                onClick={() => {
                  setEmailMode('signup');
                  setAuthMessage(null);
                  setAuthError(null);
                }}
                className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black transition-all ${
                  emailMode === 'signup'
                    ? 'bg-white text-[#10B981] border border-[#10B981]/20 shadow-sm'
                    : 'bg-transparent text-[#1A202C]/45 border border-transparent'
                }`}
              >
                이메일 회원가입
              </button>
            </div>

            <div className="space-y-2">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[12px] font-medium text-[#1A202C] placeholder:text-[#1A202C]/25 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/20"
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={emailMode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="비밀번호"
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[12px] font-medium text-[#1A202C] placeholder:text-[#1A202C]/25 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/20"
              />
              {emailMode === 'signup' && (
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호 확인"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[12px] font-medium text-[#1A202C] placeholder:text-[#1A202C]/25 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/20"
                />
              )}
            </div>

            {authMessage && (
              <p className="rounded-xl border border-[#10B981]/15 bg-[#ECFDF5] px-3 py-2 text-[11px] font-bold text-[#059669]">
                {authMessage}
              </p>
            )}
            {authError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-500">
                {authError}
              </p>
            )}

            <button
              onClick={() => void handleEmailAuth()}
              disabled={isSubmittingEmail}
              className="w-full rounded-xl bg-[#10B981] px-4 py-3 text-[12px] font-black text-white transition-all hover:bg-[#0ea371] disabled:cursor-not-allowed disabled:bg-[#10B981]/50"
            >
              {isSubmittingEmail
                ? '처리 중...'
                : emailMode === 'signup'
                  ? '이메일로 회원가입'
                  : '이메일로 로그인'}
            </button>
            <p className="text-[10px] font-bold text-[#1A202C]/30">
              Supabase URL/Anon Key가 설정된 환경에서 실제 계정 로그인이 동작합니다.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1A202C]/25">OAuth</p>
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
            <p className="text-[10px] font-bold text-[#1A202C]/30">
              참고: 현재 Electron 환경에서는 OAuth redirect 구성이 추가로 필요하므로, 즉시 검증은 이메일 로그인 경로를 우선 사용하세요.
            </p>
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

      <Section label="동기화 상태">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F7FAFC]/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-[#1A202C]/45">클라우드 백업</span>
            <span className={user.entitlements.cloudSync ? 'text-[#10B981]' : 'text-[#1A202C]/25'}>
              {user.entitlements.cloudSync ? '사용 가능' : '비활성'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-[#1A202C]/45">공유 링크</span>
            <span className={user.entitlements.linkSharing ? 'text-[#10B981]' : 'text-[#1A202C]/25'}>
              {user.entitlements.linkSharing ? '계정 링크 공유 가능' : '유료 플랜 필요'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-[#1A202C]/45">마지막 동기화</span>
            <span className="text-[#1A202C]/60">
              {user.lastSyncedAt ? new Date(user.lastSyncedAt).toLocaleString('ko-KR') : '아직 없음'}
            </span>
          </div>
        </div>
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
        <div className="grid grid-cols-5 gap-1.5">
          {DOC_WIDTH_OPTIONS.map((w) => (
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
