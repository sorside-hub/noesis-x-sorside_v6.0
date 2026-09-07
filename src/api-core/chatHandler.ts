import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getSmartCascade } from '../lib/ai/cascadeProfiles';

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
1. FOKUS & RESPONSIF: Tanggapi langsung inti pembicaraan tanpa basa-basi pembuka yang klise atau penutup template berulang. DILARANG KERAS mengakhiri pesan dengan pertanyaan template klise (seperti "Ada yang mau dibuatkan catatan baru?", "Semoga membantu!", "Apakah ada hal lain yang bisa saya bantu?"), KECUALI jika pengguna secara eksplisit meminta panduan lanjutan atau meminta brainstorming terbuka.
2. ADAPTIF TERHADAP PERAN:
   - Jika diajak brainstorming: eksplorasi ide secara kreatif, elaboratif, dan berbobot.
   - Jika diminta menguji argumen / ide: bertindaklah sebagai 'Devil's Advocate' yang kritis, analitis, dan mencari celah/risiko secara tajam dan konstruktif.
   - Jika bertanya fakta atau pertanyaan langsung: jawablah secara padat, lugas, dan akurat.
   - Jika meminta sintesis / ringkasan: buatlah struktur yang jelas, ringkas, dan berwawasan tajam.
   - Jika menyapa atau chit-chat ringan: tanggapi dengan ramah, cerdas, dan hangat tanpa bertele-tele.
3. HUBUNGAN DENGAN VAULT (CATATAN PENGGUNA):
${
  hasVaultContext
    ? `   - Terdapat catatan relevan dari Vault pengguna yang dilampirkan. Jadikan catatan tersebut sebagai rujukan utama secara natural dan kontekstual. Rujuk atau sebutkan judul/konsep catatannya dengan wajar jika relevan. Sintesiskan dengan wawasanmu secara proporsional tanpa mendominasi atau mengubah informasi asli catatan.`
    : `   - Saat ini TIDAK ADA catatan relevan dari Vault untuk topik ini.
     * Jika pengguna secara EKSPLISIT menanyakan keberadaan catatan di vault (misal: "apakah ada catatan saya tentang X?", "apa yang kutulis tentang Y?"): jelaskan secara singkat dan ramah bahwa catatan tersebut belum ditemukan di vault, lalu bantu jawab berdasarkan pengetahuan umummu.
     * Jika pengguna bertanya hal umum, berdiskusi, meminta ide, atau pertanyaan bebas lainnya: JAWAB LANGSUNG secara cerdas, luwes, dan solutif menggunakan wawasanmu TANPA perlu mengumumkan atau meminta maaf bahwa topik tidak ada di vault.`
}
${
  hasMemory
    ? `4. MEMORI PERCAKAPAN: Kamu memiliki memori ringkas dari bagian awal percakapan ini. Gunakan fakta, preferensi, dan keputusan di memori tersebut untuk menjaga kontinuitas obrolan jangka panjang.`
    : ''
}
5. FORMAT: Gunakan format Markdown yang bersih, rapi, dan mudah dibaca.`;
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
    { cascade: getSmartCascade(), customKeys, envObj },
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
    { cascade: getSmartCascade(), customKeys, envObj },
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
