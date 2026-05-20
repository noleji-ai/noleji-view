import type { LLMConfig, LLMMessage, LLMResponse, LLMProvider } from '../types/llm';
import { DEFAULT_LLM_CONFIGS } from '../types/llm';
import { callManagedLLM, testManagedLLMConnection } from './managedLLM';

const STORAGE_KEY = 'docwise-llm-config';

// ---------------------------------------------------------------------------
// callLLM - Managed AI or local OpenAI-compatible model server
// ---------------------------------------------------------------------------

export async function callLLM(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  if (config.accessMode === 'managed') {
    return callManagedLLM(config, messages);
  }

  return callLocalOpenAICompatible(config, messages, false);
}

export async function callLLMWithJSON(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  if (config.accessMode === 'managed') {
    return callManagedLLM(config, messages);
  }

  return callLocalOpenAICompatible(config, messages, true);
}

async function callLocalOpenAICompatible(
  config: LLMConfig,
  messages: LLMMessage[],
  jsonMode: boolean,
): Promise<LLMResponse> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Local LLM API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice) throw new Error('Local LLM API returned no choices');

  return {
    content: choice.message?.content ?? '',
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens ?? 0,
          completionTokens: data.usage.completion_tokens ?? 0,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// testConnection
// ---------------------------------------------------------------------------

export async function testConnection(config: LLMConfig): Promise<boolean> {
  if (config.accessMode === 'managed') {
    return testManagedLLMConnection();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const messages: LLMMessage[] = [
      { role: 'user', content: 'Say hello in one word.' },
    ];

    const result = await Promise.race([
      callLLM(config, messages),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () =>
          reject(new Error('Connection test timed out (10s)')),
        );
      }),
    ]);

    return !!result.content;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

function normalizeLLMConfig(parsed: Partial<LLMConfig>): LLMConfig | null {
  const provider: LLMProvider = parsed.accessMode === 'local' || parsed.provider === 'lmstudio'
    ? 'lmstudio'
    : 'docwise';
  const defaults = DEFAULT_LLM_CONFIGS[provider];

  return {
    accessMode: provider === 'lmstudio' ? 'local' : 'managed',
    provider,
    apiKey: '',
    model: parsed.model && provider === 'lmstudio' ? parsed.model : defaults.model ?? 'noleji-view-auto',
    baseUrl: parsed.baseUrl && provider === 'lmstudio' ? parsed.baseUrl : defaults.baseUrl ?? '',
    temperature: parsed.temperature ?? defaults.temperature ?? 0.7,
    maxTokens: parsed.maxTokens ?? defaults.maxTokens ?? 4096,
    isConnected: false,
  };
}

export function loadLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const normalized = normalizeLLMConfig(JSON.parse(raw) as Partial<LLMConfig>);
      if (normalized) return normalized;
    }
  } catch {
    // Ignore parse errors, fall through to defaults
  }

  const defaults = DEFAULT_LLM_CONFIGS.docwise;
  return {
    accessMode: 'managed',
    provider: 'docwise',
    apiKey: '',
    model: defaults.model ?? 'noleji-view-auto',
    baseUrl: defaults.baseUrl ?? '',
    temperature: defaults.temperature ?? 0.7,
    maxTokens: defaults.maxTokens ?? 4096,
    isConnected: false,
  };
}

export function saveLLMConfig(config: LLMConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, apiKey: '' }));
}
