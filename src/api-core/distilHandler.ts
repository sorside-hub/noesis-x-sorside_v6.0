import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getGeminiFirstCascade } from '../lib/ai/cascadeProfiles';

export async function handleDistil(
  content: string,
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
) {
  return executeWithFailover(
    { cascade: getGeminiFirstCascade(), customKeys, envObj }, 
    async (client, slotId, model) => {
      const prompt = `Lakukan distilasi (penyaringan inti sari) pada teks berikut. 

ATURAN KETAT:
1. WAJIB gunakan Bahasa Indonesia yang lugas, profesional, dan mudah dipahami.
2. Format balasan HARUS terdiri dari dua bagian:
   - **Ringkasan Inti:** (1-2 paragraf padat yang merangkum esensi utama teks)
   - **Poin Kunci (Takeaways):** (3-5 bullet points berisi ide, fakta, atau kesimpulan paling krusial)
3. PERTAHANKAN esensi dan makna asli dari teks. JANGAN menambahkan opini pribadi AI.
4. Kembalikan HANYA teks hasil distilasi tanpa kata pengantar/penutup.
5. JANGAN membungkus hasil akhir dengan markdown code block (\`\`\`)!

Teks yang akan didistilasi:
${content}`;
      
      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
      });
      return { text: response.text, modelUsed: model };
    }
  );
}
