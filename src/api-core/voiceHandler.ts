
import { executeWithFailover, resolveServerKeyForSlot } from '../lib/ai/failoverAdapter';
import { getHeavyCascade } from '../lib/ai/cascadeProfiles';
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

  // Use Gemini's native audio understanding via Smart Cascade
  const result = await executeWithFailover(
    { cascade: getHeavyCascade(), customKeys, envObj },
    async (client, slotId, model) => {
      const prompt = `Saya baru saja merekam "brain dump" atau catatan suara (terlampir pada audio ini).

Tugas Anda:
1. Dengarkan rekaman audio tersebut dan hasilkan DUA bagian: "Catatan Utama" dan "Transkrip Asli".

2. Pada bagian pertama, buatlah Catatan Utama. Anda HARUS:
   - Mengekstrak ide utama, poin penting, dan konteks dari pembicaraan.
   - Membuang kata-kata pengisi (filler), pengulangan kalimat, dan kalimat yang tidak bermakna.
   - Merestrukturisasi (menyusun ulang) alur pikiran yang berantakan menjadi alur cerita/logika yang mudah dibaca.
   - Mengelompokkan topik yang sejenis.
   - Berikan Judul yang relevan (H1: # Judul).
   - Format isinya secara dinamis (Gunakan kombinasi paragraf yang nyaman dibaca dan bullet points untuk rincian).

3. Pada bagian kedua, berikan Transkrip Asli (Raw Transcript) dari apa yang saya ucapkan persis kata per kata. Jangan mengubah tata bahasanya, biarkan apa adanya sebagai referensi.

4. JANGAN membalas dengan kata-kata pengantar, langsung berikan output dengan format persis seperti ini:

# [Judul yang Sesuai]

[Isi catatan utama yang sudah direstrukturisasi, padat, dan jelas...]

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
