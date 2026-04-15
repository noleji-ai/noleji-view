export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'lmstudio';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  isConnected: boolean;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export const DEFAULT_LLM_CONFIGS: Record<LLMProvider, Partial<LLMConfig>> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o', temperature: 0.7, maxTokens: 4096 },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514', temperature: 0.7, maxTokens: 4096 },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash', temperature: 0.7, maxTokens: 4096 },
  lmstudio: { baseUrl: 'http://localhost:1234/v1', model: 'local-model', apiKey: '', temperature: 0.7, maxTokens: 4096 },
};

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openai: 'ChatGPT (OpenAI)',
  anthropic: 'Claude (Anthropic)',
  google: 'Gemini (Google)',
  lmstudio: 'LM Studio (Local)',
};

export const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-5-20251001'],
  google: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-flash'],
  lmstudio: ['local-model'],
};
