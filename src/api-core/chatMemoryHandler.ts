import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getGeminiFirstCascade } from '../lib/ai/cascadeProfiles';
import { ChatHistoryMessage } from './chatHandler';

export interface SummarizeChatMemoryParams {
  existingSummary?: string;
  olderMessages: ChatHistoryMessage[];
  customKeys?: Partial<Record<KeySlotId, string>>;
}

/**
 * Distills older chat history into an ultra-compact, high-density conversational memory summary.
 * Preserves key user preferences, agreed facts, explored ideas, decisions, and context without token bloat.
 */
export async function handleSummarizeChatMemory(
  params: SummarizeChatMemoryParams,
  envObj: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {}
) {
  const { existingSummary, olderMessages, customKeys } = params;

  let conversationText = '';
  for (const m of olderMessages) {
    const role = m.role === 'user' ? 'Pengguna' : 'Noesis';
    conversationText += `${role}: ${m.content}\n`;
  }

  const prompt = `Kamu adalah Cognitive Memory Compressor untuk AI Noesis.
Tugasmu adalah membuat atau memperbarui RANGKUMAN MEMORI PERCAKAPAN yang sangat padat, ringkas, dan terstruktur dari obrolan sebelumnya.

${existingSummary ? `=== MEMORI SEBELUMNYA ===\n${existingSummary}\n\n` : ''}
=== RIWAYAT OBROLAN LAMA YANG INGIN DIRANGKUM ===
${conversationText}
==================================================

INSTRUKSI:
1. Rangkum inti percakapan di atas dalam bentuk poin-poin padat (maksimal 150 kata). Ini akan menjadi "otak jangka panjang" bagi AI.
2. Fokuskan pada 3 elemen krusial berikut:
   - INTISARI AKTIF: Topik utama apa yang sedang dikerjakan dan apa tujuannya?
   - PARAMETER PENGGUNA: Apakah ada gaya bahasa khusus, format, preferensi, atau instruksi/pantangan yang diminta Pengguna?
   - PENCAPAIAN & KEPUTUSAN: Solusi, rumusan konsep, atau kesepakatan apa yang sudah dicapai agar AI utama tidak mengusulkannya ulang atau berputar-putar di poin yang sama?
3. Buat dalam Bahasa Indonesia yang lugas dan informatif.
4. JANGAN menyertakan basa-basi atau kata pengantar/penutup, langsung berikan poin-poin ringkasan memorinya.`;

  return executeWithFailover(
    { cascade: getGeminiFirstCascade(), customKeys, envObj },
    async (client, _slotId, model) => {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.2, // Low temperature for deterministic, factual distillation
        },
      });

      return {
        summary: response.text?.trim() || '',
        modelUsed: model,
      };
    }
  );
}
