
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getGeminiOnlyCascade } from '../lib/ai/cascadeProfiles';
import { KeySlotId } from '../lib/ai/types';

export async function handleVoiceToNote(
  audioBase64: string,
  mimeType: string,
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
) {
  if (audioBase64.length < 500) {
    throw new Error('Rekaman terlalu pendek atau tidak valid. Silakan bicara lebih lama.');
  }

  const cleanMimeType = mimeType.split(';')[0]; // remove codecs for file typing

  // Use Gemini's native audio understanding via Gemini Only Cascade
  const result = await executeWithFailover(
    { cascade: getGeminiOnlyCascade(), customKeys, envObj },
    async (client, slotId, model) => {
      const prompt = `Saya baru saja merekam "brain dump" atau catatan suara. Dengarkan rekaman audio terlampir dan proses menjadi "Catatan Utama" dan "Transkrip Asli".

ATURAN KETAT:
1. BAHASA: WAJIB gunakan Bahasa Indonesia untuk Catatan Utama. Untuk Transkrip, ketikkan sesuai bahasa aslinya.
2. FORMAT OUTPUT: JANGAN membungkus hasil dengan markdown code block (\`\`\`).
3. JIKA SUARA TIDAK JELAS: Jika audio hanya berisi keheningan, suara bising, atau tidak ada ucapan yang dapat dipahami, KEMBALIKAN HANYA TEKS INI TEPAT SEPERTI INI: "Audio tidak terdengar jelas. Silakan coba rekam kembali." (Jangan berikan format lain).

INSTRUKSI CATATAN UTAMA:
- Ekstrak ide utama dan konteks pembicaraan.
- Buang kata pengisi (filler) seperti "hmm", "ee", pengulangan, atau kalimat tidak bermakna.
- Restrukturisasi alur pikiran yang berantakan menjadi alur logika yang sistematis dan rapi.
- Mengelompokkan topik yang sejenis.
- Pertahankan gaya bahasa/nuansa asli saya.
- Gunakan kombinasi paragraf padat dan bullet points.

FORMAT KELUARAN WAJIB (Tanpa basa-basi pembuka/penutup):

# [Judul yang Sesuai]

[Isi catatan utama yang sudah direstrukturisasi...]

---
### 🎙️ Transkrip Asli
> [Tuliskan transkrip mentah kata-per-kata di sini]`;

      const response = await client.models.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: audioBase64,
                  mimeType: cleanMimeType,
                },
              },
              {
                text: prompt
              }
            ]
          }
        ],
        model,
      });
      return response.text;
    }
  );

  if (!result.success) {
    throw new Error('Gagal memproses audio dengan AI: ' + (result.attempts.slice(-1)[0]?.error || 'Unknown error'));
  }

  return {
    rawTranscript: "Transkripsi diproses langsung oleh Gemini 3.5 Flash.",
    structuredNote: result.data
  };
}
