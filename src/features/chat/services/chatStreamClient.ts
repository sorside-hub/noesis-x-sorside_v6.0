import { getAllLocalKeyOverrides } from '../../../lib/ai/keyManager';

export interface ChatStreamOptions {
  query: string;
  contextText: string;
  chatHistory: Array<{ role: string; content: string }>;
  memorySummary?: string;
  onChunk: (chunk: string, currentFullText: string) => void;
}

export interface ChatStreamResult {
  finalContent: string;
  failoverResult: any;
}

export async function executeChatStream({
  query,
  contextText,
  chatHistory,
  memorySummary,
  onChunk,
}: ChatStreamOptions): Promise<ChatStreamResult> {
  const customKeys = getAllLocalKeyOverrides();

  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      contextText,
      chatHistory,
      memorySummary,
      customKeys,
      temperature: 0.3,
    }),
  });

  if (!res.ok || !res.body) {
    console.error('[API/Chat] Request failed with status', res.status);
    const errText = `⚠️ Maaf, Server mengembalikan status HTTP ${res.status}`;
    onChunk(errText, errText);
    return {
      finalContent: errText,
      failoverResult: { success: false, error: `HTTP ${res.status}` },
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let failoverResult: any = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (part.startsWith('data: ')) {
          const dataStr = part.slice(6);
          try {
            const data = JSON.parse(dataStr);

            if (data.chunk) {
              fullText += data.chunk;
              onChunk(data.chunk, fullText);
            }

            if (data.done) {
              failoverResult = { success: true, data: data.data, attempts: data.cascadeLog };
            }

            if (data.error) {
              failoverResult = { success: false, attempts: data.cascadeLog, error: data.error };
              const attempts = data.cascadeLog || [];
              const lastError = attempts[attempts.length - 1]?.error || data.error;
              fullText = `⚠️ Error API: ${lastError}`;
              onChunk('', fullText);
            }
          } catch {
            // Ignore JSON parse errors for incomplete chunks
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[API/Chat] Stream read error:', err);
    if (!fullText) {
      fullText = '⚠️ Terjadi kendala saat membaca respon streaming.';
      onChunk('', fullText);
    }
  }

  return {
    finalContent: fullText,
    failoverResult,
  };
}

export async function summarizeChatMemory(
  olderMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
  existingSummary?: string
): Promise<string | null> {
  try {
    const customKeys = getAllLocalKeyOverrides();
    const res = await fetch('/api/chat/summarize-memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        olderMessages,
        existingSummary,
        customKeys,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.summary || data.summary || null;
  } catch (err) {
    console.warn('[ChatMemory] Failed to summarize memory:', err);
    return null;
  }
}

