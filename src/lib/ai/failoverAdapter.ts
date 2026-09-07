import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { 
  KeySlotId, 
  KeyHealthStatus, 
  FailoverExecutionOptions, 
  FailoverExecutionResult 
} from './types';

export function createGroqClient(apiKey: string) {
  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  
  return {
    raw: groq,
    models: {
      generateContent: async (params: any) => {
        let prompt = '';
        if (typeof params.contents === 'string') {
           prompt = params.contents;
        } else if (Array.isArray(params.contents)) {
           prompt = params.contents.map((c: any) => c.parts.map((p: any) => p.text).join('\n')).join('\n');
        } else {
           prompt = JSON.stringify(params.contents);
        }

        if (params.config?.responseSchema) {
           prompt += '\n\nOutput ONLY valid JSON matching this schema:\n' + JSON.stringify(params.config.responseSchema);
        }

        const messages = [{ role: 'user', content: prompt }];
        const isJson = params.config?.responseMimeType === 'application/json';

        const completion = await groq.chat.completions.create({
          messages: messages as any,
          model: params.model,
          temperature: params.config?.temperature ?? 0.7,
          response_format: isJson ? { type: 'json_object' } : { type: 'text' },
        });

        return {
          text: completion.choices[0]?.message?.content || '',
        };
      },
      generateContentStream: async function* (params: any) {
        let prompt = '';
        if (typeof params.contents === 'string') {
           prompt = params.contents;
        } else if (Array.isArray(params.contents)) {
           prompt = params.contents.map((c: any) => c.parts.map((p: any) => p.text).join('\n')).join('\n');
        } else {
           prompt = JSON.stringify(params.contents);
        }

        const messages = [{ role: 'user', content: prompt }];

        const stream = await groq.chat.completions.create({
          messages: messages as any,
          model: params.model,
          temperature: params.config?.temperature ?? 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          yield { text: chunk.choices[0]?.delta?.content || '' };
        }
      }
    }
  };
}

/**
 * Helper to resolve environment API keys with fallback support
 */
export function resolveServerKeyForSlot(
  slotId: KeySlotId, 
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
): string {
  // 1. First check custom key provided in parameter or request
  if (customKeys && customKeys[slotId]?.trim()) {
    return customKeys[slotId]!.trim();
  }

  // 2. Resolve environment variables
  const getEnv = (name: string) => envObj[name] || '';

  switch (slotId) {
    case 'gemini':
      return getEnv('GEMINI_API_KEY');
    case 'groq_primary':
      return getEnv('GROQ_API_KEY');
    case 'groq_secondary':
      return getEnv('GROQ_API_KEY_SECONDARY');
    default:
      return '';
  }
}

/**
 * Classify API errors into standardized KeyHealthStatus
 */
export function classifyApiError(error: unknown): { status: KeyHealthStatus; message: string } {
  const errStr = error instanceof Error ? error.message : String(error);
  const lowerMsg = errStr.toLowerCase();

  // All errors are mapped internally but simplified at the UI level
  if (
    lowerMsg.includes('429') || 
    lowerMsg.includes('quota') || 
    lowerMsg.includes('resource_exhausted') || 
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('limit reached')
  ) {
    return {
      status: 'quota_exceeded',
      message: 'Quota harian / Rate Limit tercapai (HTTP 429)',
    };
  }

  if (
    lowerMsg.includes('503') ||
    lowerMsg.includes('high demand') ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('overloaded')
  ) {
    return {
      status: 'error',
      message: 'Model sedang mengalami lonjakan trafik (HTTP 503). Mengalihkan ke model cadangan...',
    };
  }

  if (
    lowerMsg.includes('api_key_invalid') || 
    lowerMsg.includes('invalid api key') || 
    lowerMsg.includes('unauthorized') || 
    lowerMsg.includes('permission_denied') ||
    lowerMsg.includes('403') ||
    lowerMsg.includes('401')
  ) {
    return {
      status: 'invalid_key',
      message: 'API Key tidak valid atau tidak memiliki akses (HTTP 401/403)',
    };
  }

  return {
    status: 'error',
    message: errStr || 'Error pada server API',
  };
}

/**
 * Instantiate GoogleGenAI client for a given API key
 */
export function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-failover-adapter',
      },
    },
  });
}

/**
 * Ping check a single key to verify connectivity & quota limit
 */
export async function testKeyHealth(apiKey: string): Promise<{
  status: KeyHealthStatus;
  latencyMs: number;
  message: string;
}> {
  if (!apiKey || !apiKey.trim()) {
    return {
      status: 'missing',
      latencyMs: 0,
      message: 'API Key belum dikonfigurasi',
    };
  }

  const startTime = Date.now();
  try {
    // For now we just check if the key works with Gemini or if it's a Groq key format
    // Groq keys usually start with 'gsk_'
    if (apiKey.startsWith('gsk_')) {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
      });
      if (!res.ok) {
        throw new Error(`Groq API Error: HTTP ${res.status}`);
      }
    } else {
      const ai = createGeminiClient(apiKey.trim());
      await ai.models.get({ model: 'gemini-3.5-flash' });
    }

    const latencyMs = Date.now() - startTime;
    return {
      status: 'active',
      latencyMs,
      message: 'Connected successfully',
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const classified = classifyApiError(err);
    return {
      status: classified.status,
      latencyMs,
      message: classified.message,
    };
  }
}

/**
 * Main Failover Adapter Execution Wrapper:
 * Automatically iterates through the provided cascade plan (switching models and providers)
 * until a successful execution occurs or the cascade is exhausted.
 */
export async function executeWithFailover<T>(
  options: FailoverExecutionOptions,
  taskRunner: (client: any, slotId: KeySlotId, model: string) => Promise<T>
): Promise<FailoverExecutionResult<T>> {
  const attempts: FailoverExecutionResult<T>['attempts'] = [];

  for (let i = 0; i < options.cascade.length; i++) {
    const step = options.cascade[i];
    const slotId = step.provider;
    const targetKey = resolveServerKeyForSlot(slotId, options.customKeys, options.envObj);

    if (!targetKey) {
      attempts.push({
        slotId,
        modelTried: step.model,
        error: `API Key (${slotId}) tidak dikonfigurasi`,
        status: 'missing',
      });
      continue;
    }

    const client = slotId === 'gemini' ? createGeminiClient(targetKey) : createGroqClient(targetKey);

    const MAX_RETRIES = 1; // Up to 1 retry (2 attempts total) for transient/high demand errors

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `[FailoverAdapter] Retry #${attempt} for ${slotId} (${step.model})...`
          );
        }

        const data = await taskRunner(client, slotId, step.model);
        
        attempts.push({
          slotId,
          modelTried: step.model,
          status: 'active',
        });

        return {
          success: true,
          data,
          usedSlot: slotId,
          usedModel: step.model,
          wasFallbackUsed: i > 0,
          attempts,
        };
      } catch (err: unknown) {
        const classified = classifyApiError(err);
        const errStr = err instanceof Error ? err.message : String(err);
        const lowerStr = errStr.toLowerCase();

        const isTransient = 
          classified.status === 'quota_exceeded' || 
          lowerStr.includes('503') ||
          lowerStr.includes('500') ||
          lowerStr.includes('502') ||
          lowerStr.includes('504') ||
          lowerStr.includes('high demand') ||
          lowerStr.includes('overloaded') ||
          lowerStr.includes('unavailable') ||
          lowerStr.includes('resource_exhausted') ||
          lowerStr.includes('resource exhausted') ||
          lowerStr.includes('etimedout') ||
          lowerStr.includes('econnreset') ||
          lowerStr.includes('fetch failed');

        if (isTransient && attempt < MAX_RETRIES) {
          const delayMs = Math.min(600 * Math.pow(2, attempt) + Math.random() * 300, 2000);
          console.warn(
            `[FailoverAdapter] Transient error on ${slotId}:${step.model} (${classified.message}). Retrying in ${Math.round(delayMs)}ms...`
          );
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }

        attempts.push({
          slotId,
          modelTried: step.model,
          error: classified.message,
          status: classified.status,
        });

        console.warn(
          `[FailoverAdapter] Attempt ${i + 1} (${slotId} / ${step.model}) failed after attempt ${attempt + 1}. Status "${classified.status}". Error: ${errStr}`
        );
        break; // Stop retrying this step and fall back to the next model/provider in the cascade
      }
    }
  }

  // If we exhaust the entire cascade and nothing worked
  return {
    success: false,
    usedSlot: 'gemini', // Fallback return format
    wasFallbackUsed: false,
    attempts,
  };
}
