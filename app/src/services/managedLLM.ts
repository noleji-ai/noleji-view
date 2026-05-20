import type { LLMConfig, LLMMessage, LLMResponse } from '../types/llm';

const MANAGED_BASE_URL_KEY = 'docwise-managed-api-base-url';

export function getManagedApiBaseUrl(): string {
  return localStorage.getItem(MANAGED_BASE_URL_KEY) ?? '';
}

export async function callManagedLLM(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  const baseUrl = getManagedApiBaseUrl().replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('Noleji View managed AI backend is not configured.');
  }

  const response = await fetch(`${baseUrl}/ai/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Noleji View AI gateway error (${response.status}): ${text}`);
  }

  const data = await response.json() as LLMResponse;
  return data;
}

export async function testManagedLLMConnection(): Promise<boolean> {
  const baseUrl = getManagedApiBaseUrl().replace(/\/$/, '');
  if (!baseUrl) return false;

  const response = await fetch(`${baseUrl}/health`, {
    method: 'GET',
  });
  return response.ok;
}

