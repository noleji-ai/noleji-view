export type LLMAccessMode = 'managed' | 'local';
export type LLMProvider = 'docwise' | 'lmstudio';

export interface LLMConfig {
  accessMode: LLMAccessMode;
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
  docwise: { accessMode: 'managed', baseUrl: '', model: 'noleji-view-auto', temperature: 0.7, maxTokens: 4096 },
  lmstudio: { accessMode: 'local', baseUrl: 'http://localhost:1234/v1', model: 'local-model', apiKey: '', temperature: 0.7, maxTokens: 4096 },
};

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  docwise: 'Noleji View Managed AI',
  lmstudio: 'LM Studio (Local)',
};

export const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  docwise: ['noleji-view-auto', 'noleji-view-writing', 'noleji-view-analysis'],
  lmstudio: ['local-model'],
};
