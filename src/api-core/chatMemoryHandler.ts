import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getHeavyCascade } from '../lib/ai/cascadeProfiles';
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
1. Rangkum inti percakapan di atas dalam 2-4 poin padat (maksimal 150 kata).
2. Fokuskan pada:
   - Topik utama / domain yang sedang dibahas.
   - Fakta penting, preferensi, atau instruksi khusus dari Pengguna.
   - Ide, keputusan, atau kesimpulan yang sudah dicapai bersama.
3. Buat dalam Bahasa Indonesia yang lugas dan informatif.
4. JANGAN menyertakan basa-basi atau kata pengantar/penutup, langsung berikan poin-poin ringkasan memorinya.`;

  return executeWithFailover(
    { cascade: getHeavyCascade(), customKeys, envObj },
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
