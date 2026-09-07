import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getSmartCascade, getHeavyCascade } from '../lib/ai/cascadeProfiles';

export async function handleAnalyzeNote(
  content: string,
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
) {
  // Pre-flight Routing: Bypass Groq for massive documents
  const selectedCascade = content.length > 6000 ? getHeavyCascade() : getSmartCascade();

  return executeWithFailover(
    { cascade: selectedCascade, customKeys, envObj }, 
    async (client, slotId, model) => {
      const prompt = `Analisis catatan berikut dan ekstrak informasi kuncinya. 
Return ONLY a valid JSON object with the following exact keys and types.
NILAI (values) dari JSON ini WAJIB menggunakan Bahasa Indonesia:
{
  "summary": "string, ringkasan padat dan informatif sebanyak 2-3 kalimat",
  "keywords": ["string", "array berisi 3-7 kata kunci atau tag penting"],
  "concepts": ["string", "array berisi 2-5 konsep utama, model mental, atau topik yang dibahas"],
  "emotion": "string, SATU KATA sifat yang mewakili nada atau emosi dominan (misal: Netral, Antusias, Cemas, Analitis, Reflektif, Kreatif, Mendesak)"
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
