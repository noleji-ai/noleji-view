import type { LLMConfig, LLMMessage, LLMResponse, LLMProvider } from '../types/llm';
import { DEFAULT_LLM_CONFIGS } from '../types/llm';

const STORAGE_KEY = 'docwise-llm-config';

// ---------------------------------------------------------------------------
// callLLM - Unified LLM API client (browser fetch-based)
// ---------------------------------------------------------------------------

export async function callLLM(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  switch (config.provider) {
    case 'openai':
    case 'lmstudio':
      return callOpenAICompatible(config, messages);
    case 'anthropic':
      return callAnthropic(config, messages);
    case 'google':
      return callGoogle(config, messages);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

// ---------------------------------------------------------------------------
// callLLMWithJSON - JSON 응답을 강제하는 LLM 호출
// ---------------------------------------------------------------------------

export async function callLLMWithJSON(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  switch (config.provider) {
    case 'openai':
    case 'lmstudio':
      return callOpenAICompatibleJSON(config, messages);
    case 'anthropic':
      return callAnthropicJSON(config, messages);
    case 'google':
      return callGoogleJSON(config, messages);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

// ---------------------------------------------------------------------------
// OpenAI / LM Studio (OpenAI-compatible)
// ---------------------------------------------------------------------------

async function callOpenAICompatible(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `OpenAI API error (${res.status}): ${body}`,
    );
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice) throw new Error('OpenAI API returned no choices');

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
// Anthropic (Claude)
// ---------------------------------------------------------------------------

async function callAnthropic(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/messages`;

  // Anthropic expects system as a top-level field, not in the messages array
  let systemPrompt: string | undefined;
  const filteredMessages = messages.filter((m) => {
    if (m.role === 'system') {
      systemPrompt = m.content;
      return false;
    }
    return true;
  });

  const body: Record<string, unknown> = {
    model: config.model,
    messages: filteredMessages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: config.maxTokens,
    temperature: config.temperature,
  };
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Anthropic API error (${res.status}): ${text}`,
    );
  }

  const data = await res.json();
  const textBlock = data.content?.[0];
  if (!textBlock) throw new Error('Anthropic API returned no content');

  return {
    content: textBlock.text ?? '',
    usage: data.usage
      ? {
          promptTokens: data.usage.input_tokens ?? 0,
          completionTokens: data.usage.output_tokens ?? 0,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Google Gemini
// ---------------------------------------------------------------------------

async function callGoogle(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;

  // Map messages to Gemini format
  // Gemini uses "user" and "model" roles; system instructions are prepended to the first user message
  let systemText = '';
  const geminiContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemText += msg.content + '\n\n';
    } else {
      geminiContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  // Prepend system instructions to the first user message if present
  if (systemText && geminiContents.length > 0 && geminiContents[0].role === 'user') {
    geminiContents[0].parts[0].text = systemText + geminiContents[0].parts[0].text;
  } else if (systemText) {
    // If there's no user message first, insert one
    geminiContents.unshift({
      role: 'user',
      parts: [{ text: systemText.trim() }],
    });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: geminiContents,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Google Gemini API error (${res.status}): ${text}`,
    );
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('Gemini API returned no candidates');

  const content = candidate.content?.parts?.[0]?.text ?? '';

  return {
    content,
    usage: data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount ?? 0,
          completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// OpenAI / LM Studio JSON mode
// ---------------------------------------------------------------------------

async function callOpenAICompatibleJSON(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice) throw new Error('OpenAI API returned no choices');

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
// Anthropic JSON mode (system prompt injection)
// ---------------------------------------------------------------------------

async function callAnthropicJSON(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  const jsonSuffix = '\n\n반드시 유효한 JSON만 응답하세요. JSON 앞뒤에 다른 텍스트를 포함하지 마세요.';

  const augmentedMessages = messages.map((m) => {
    if (m.role === 'system') {
      return { ...m, content: m.content + jsonSuffix };
    }
    return m;
  });

  return callAnthropic(config, augmentedMessages);
}

// ---------------------------------------------------------------------------
// Google Gemini JSON mode
// ---------------------------------------------------------------------------

async function callGoogleJSON(
  config: LLMConfig,
  messages: LLMMessage[],
): Promise<LLMResponse> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;

  let systemText = '';
  const geminiContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemText += msg.content + '\n\n';
    } else {
      geminiContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  if (systemText && geminiContents.length > 0 && geminiContents[0].role === 'user') {
    geminiContents[0].parts[0].text = systemText + geminiContents[0].parts[0].text;
  } else if (systemText) {
    geminiContents.unshift({
      role: 'user',
      parts: [{ text: systemText.trim() }],
    });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: geminiContents,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Gemini API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('Gemini API returned no candidates');

  const content = candidate.content?.parts?.[0]?.text ?? '';

  return {
    content,
    usage: data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount ?? 0,
          completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// testConnection
// ---------------------------------------------------------------------------

export async function testConnection(config: LLMConfig): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    // We create a minimal call manually to respect the abort signal
    const messages: LLMMessage[] = [
      { role: 'user', content: 'Say hello in one word.' },
    ];

    // Build a quick fetch with abort support — reuse provider logic but with timeout
    const promise = callLLM(config, messages);

    // Race the promise against the abort
    const result = await Promise.race([
      promise,
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

export function loadLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LLMConfig;
      // Basic validation
      if (parsed.provider && parsed.baseUrl && parsed.model) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors, fall through to defaults
  }

  // Return default config (OpenAI as default provider)
  const defaultProvider: LLMProvider = 'openai';
  const defaults = DEFAULT_LLM_CONFIGS[defaultProvider];
  return {
    provider: defaultProvider,
    apiKey: '',
    model: defaults.model ?? 'gpt-4o',
    baseUrl: defaults.baseUrl ?? 'https://api.openai.com/v1',
    temperature: defaults.temperature ?? 0.7,
    maxTokens: defaults.maxTokens ?? 4096,
    isConnected: false,
  };
}

export function saveLLMConfig(config: LLMConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
