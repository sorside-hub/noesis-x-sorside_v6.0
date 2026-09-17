import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getGeminiFirstCascade } from '../lib/ai/cascadeProfiles';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatHandlerParams {
  query: string;
  contextText?: string;
  chatHistory?: ChatHistoryMessage[];
  memorySummary?: string;
  customKeys?: Partial<Record<KeySlotId, string>>;
  temperature?: number;
}

/**
 * Builds the intelligent, adaptive Noesis Persona system prompt.
 * Strictly avoids canned/templated closings while maintaining RAG-first vault context.
 */
export function buildChatSystemPrompt(contextText?: string, memorySummary?: string): string {
  const hasVaultContext = Boolean(contextText && contextText.trim().length > 0);
  const hasMemory = Boolean(memorySummary && memorySummary.trim().length > 0);

  return `Kamu adalah Noesis, asisten berpikir dan mitra kognitif yang cerdas, tajam, dan adaptif (Second Brain AI).

PRINSIP UTAMA:
1. FOKUS & RESPONSIF: Tanggapi langsung inti pembicaraan tanpa basa-basi pembuka. Hindari penutup template berulang (seperti "Ada yang bisa dibantu lagi?") kecuali pengguna meminta panduan eksplisit.
2. ADAPTIF TERHADAP PERAN:
   - Brainstorming: Eksplorasi ide secara kreatif, elaboratif, dan berbobot.
   - Menguji Argumen: Bertindak sebagai 'Devil's Advocate' yang kritis, mencari celah/risiko secara konstruktif.
   - Fakta & Sintesis: Jawab padat, terstruktur, dan akurat.
3. HUBUNGAN DENGAN VAULT & REFERENSI MASA LALU:
${
  hasVaultContext
    ? `   - Terdapat referensi yang dilampirkan ([Catatan Vault] dan/atau [Referensi Percakapan Sebelumnya]).
   - PERHATIKAN INTENSI PENGGUNA:
     * Jika mencari informasi/fakta: Jadikan referensi sebagai rujukan utama.
     * Jika meminta pengembangan, revisi, atau opini kritis: Posisikan Catatan Vault sebagai draf pemikiran atau objek evaluasi. Bedah, rombak, atau sanggah argumen di dalamnya menggunakan wawasan eksternalmu secara tajam dan berbobot. Jangan hanya menyalin/memparafrase.
     * Terhadap Percakapan Sebelumnya: Ini adalah rekam jejak diskusimu. Bebas ekstrak, gunakan ulang, atau kembangkan poin-poin brilian dan rumusan kalimat bagus dari masa lalumu untuk merangkai jawaban yang utuh saat ini.`
    : `   - Saat ini TIDAK ADA referensi relevan (catatan/chat lama) yang ditemukan untuk topik ini.
     * Jika pengguna EKSPLISIT menanyakan isi catatannya, jujurlah bahwa data tersebut belum ditemukan di memori; JANGAN mengarang isi catatan.
     * Jika berdiskusi atau meminta ide umum, langsung jawab secara luwes menggunakan wawasanmu tanpa perlu mengumumkan ketiadaan data dari vault.`
}
${
  hasMemory
    ? `4. KONTINUITAS SESI AKTIF: Kamu dilengkapi dengan memori ringkas dari awal percakapan ini. Jadikan intisari ini sebagai landasan konteks (mencakup topik, keputusan, dan ide yang sudah dibahas) agar pemahamanmu tetap utuh, obrolan terasa mengalir nyambung, dan hindari mengulang-ulang poin yang sudah diselesaikan.`
    : ''
}
5. FORMAT & GAYA BAHASA: Gunakan format Markdown yang bersih. Berbahasalah secara profesional, analitis, luwes, dan *conversational*. Sesuaikan dengan gaya bahasa pengguna tanpa kehilangan ketajaman intelektual.`;
}

/**
 * Prepares the full structured prompt content with context, memory summary, and recent history
 */
export function prepareChatPrompt(params: ChatHandlerParams): string {
  const { query, contextText, chatHistory, memorySummary } = params;
  const systemPrompt = buildChatSystemPrompt(contextText, memorySummary);

  let fullPrompt = `${systemPrompt}\n\n`;

  if (memorySummary && memorySummary.trim().length > 0) {
    fullPrompt += `=== MEMORI INTISARI PERCAKAPAN SEBELUMNYA ===\n${memorySummary.trim()}\n============================================\n\n`;
  }

  if (contextText && contextText.trim().length > 0) {
    fullPrompt += `=== KONTEKS CATATAN VAULT ===\n${contextText.trim()}\n=============================\n\n`;
  }

  if (chatHistory && chatHistory.length > 0) {
    fullPrompt += `=== RIWAYAT PERCAKAPAN TERBARU ===\n`;
    // Take up to the last 8-10 messages to preserve immediate conversational nuance
    const recentHistory = chatHistory.slice(-8);
    for (const h of recentHistory) {
      const roleLabel = h.role === 'user' ? 'Pengguna' : 'Noesis';
      fullPrompt += `${roleLabel}: ${h.content}\n`;
    }
    fullPrompt += `===================================\n\n`;
  }

  fullPrompt += `Pengguna: ${query}\nNoesis:`;
  return fullPrompt;
}

/**
 * Handle streaming chat response via Multi-Provider Cascade (Gemini -> Groq)
 */
export async function handleChatStream(
  params: ChatHandlerParams,
  onChunk: (chunkText: string, accumulatedContent: string) => void,
  envObj: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {}
) {
  const { customKeys, temperature = 0.4 } = params;
  const prompt = prepareChatPrompt(params);

  return executeWithFailover<string>(
    { cascade: getGeminiFirstCascade(), customKeys, envObj },
    async (client, _slotId, model) => {
      const responseStream = await client.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature,
        },
      });

      let fullContent = '';
      for await (const chunk of responseStream) {
        const textChunk = chunk.text;
        if (textChunk) {
          fullContent += textChunk;
          onChunk(textChunk, fullContent);
        }
      }

      return fullContent;
    }
  );
}

/**
 * Handle standard (non-streaming) chat generation
 */
export async function handleChatGenerate(
  params: ChatHandlerParams,
  envObj: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {}
) {
  const { customKeys, temperature = 0.4 } = params;
  const prompt = prepareChatPrompt(params);

  return executeWithFailover<string>(
    { cascade: getGeminiFirstCascade(), customKeys, envObj },
    async (client, _slotId, model) => {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature,
        },
      });

      return response.text || '';
    }
  );
}
