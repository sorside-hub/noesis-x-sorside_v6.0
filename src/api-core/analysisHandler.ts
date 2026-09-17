import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getGeminiFirstCascade } from '../lib/ai/cascadeProfiles';

export async function handleAnalyzeNote(
  content: string,
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
) {
  return executeWithFailover(
    { cascade: getGeminiFirstCascade(), customKeys, envObj }, 
    async (client, slotId, model) => {
      const prompt = `Analisis catatan berikut dan ekstrak informasi kuncinya. 
Return ONLY a valid JSON object with the exact keys described below.
PENTING: Nilai (values) WAJIB menggunakan Bahasa Indonesia.

Skema JSON yang diminta:
{
  "summary": "<String. Berikan ringkasan padat dan informatif sebanyak 2-3 kalimat>",
  "keywords": ["<Array of Strings. Berikan 3-7 kata kunci atau tag penting>"],
  "concepts": ["<Array of Strings. Berikan 2-5 konsep utama, model mental, atau topik yang dibahas>"],
  "emotion": "<String. Berikan HANYA SATU KATA sifat yang mewakili nada atau emosi dominan. Contoh: Netral, Antusias, Cemas, Analitis, Reflektif, Kreatif>"
}

Konten catatan untuk dianalisis:
${content}`;
      
      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            temperature: 0.2 // Lower temperature for more consistent analytical output
        }
      });
      return { text: response.text, modelUsed: model };
    }
  );
}
