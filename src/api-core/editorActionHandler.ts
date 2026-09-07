import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getFastCascade, getSmartCascade } from '../lib/ai/cascadeProfiles';

export type EditorActionType = 'grammar' | 'summarize' | 'tone' | 'translate' | 'expand' | 'custom' | 'ask';

export async function handleEditorAction(
  action: EditorActionType,
  text: string,
  extraContext?: string,
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
) {
  const isComplexAction = ['tone', 'expand', 'custom', 'ask'].includes(action);
  const selectedCascade = isComplexAction ? getSmartCascade() : getFastCascade();

  return executeWithFailover(
    { cascade: selectedCascade, customKeys, envObj }, 
    async (client, slotId, model) => {
      let prompt = '';

      switch (action) {
        case 'grammar':
          prompt = `Perbaiki ejaan, tata bahasa, dan tipografi pada teks berikut. PENTING: Pertahankan bahasa asli teks (jika teks dalam bahasa Indonesia, wajib balas dalam bahasa Indonesia). Jangan mengubah makna aslinya. Kembalikan HANYA teks yang sudah diperbaiki tanpa pembukaan, penjelasan, atau tanda kutip.\n\nTeks:\n${text}`;
          break;
        case 'summarize':
          prompt = `Buatlah ringkasan dari teks berikut secara singkat dan padat. PENTING: Gunakan bahasa yang sama dengan teks aslinya (jika teks bahasa Indonesia, ringkasan wajib bahasa Indonesia). Kembalikan HANYA ringkasan tanpa pembukaan, penjelasan, atau tanda kutip.\n\nTeks:\n${text}`;
          break;
        case 'tone':
          const targetTone = extraContext || 'professional';
          prompt = `Tulis ulang teks berikut dengan gaya bahasa / nada yang ${targetTone}. ATURAN KETAT:\n1. Pertahankan bahasa asli teks.\n2. JANGAN merombak total teks atau menghilangkan esensi/rasa dari tulisan aslinya.\n3. Hanya ubah pilihan kata (diksi) dan susunan kalimat secukupnya agar sesuai dengan gaya yang diminta.\n4. Jangan menambahkan informasi fiktif yang tidak ada di teks asli.\n\nKembalikan HANYA teks yang sudah ditulis ulang tanpa pembukaan, penjelasan, atau tanda kutip.\n\nTeks:\n${text}`;
          break;
        case 'translate':
          prompt = `Deteksi bahasa dari teks berikut. Jika teks dalam bahasa Indonesia, terjemahkan ke bahasa Inggris yang natural. Jika teks dalam bahasa selain Indonesia (termasuk Inggris), terjemahkan ke bahasa Indonesia yang natural dan mudah dipahami. Pertahankan format markdown jika ada. Kembalikan HANYA teks hasil terjemahan tanpa pembukaan, penjelasan, atau tanda kutip.\n\nTeks:\n${text}`;
          break;
        case 'expand':
          prompt = `Kembangkan teks berikut dengan menambahkan lebih banyak detail dan konteks, sambil mempertahankan pesan utamanya. PENTING: Gunakan bahasa yang sama dengan teks aslinya (jika teks bahasa Indonesia, hasil wajib bahasa Indonesia). Kembalikan HANYA teks yang sudah dikembangkan tanpa pembukaan, penjelasan, atau tanda kutip.\n\nTeks:\n${text}`;
          break;
        case 'custom':
          prompt = `Lakukan instruksi berikut pada teks yang diberikan. PENTING: Kecuali instruksi meminta sebaliknya, selalu gunakan bahasa yang sama dengan teks aslinya (jika teks bahasa Indonesia, hasil wajib bahasa Indonesia). Kembalikan HANYA teks hasil akhir tanpa pembukaan, penjelasan, atau tanda kutip.\n\nInstruksi: ${extraContext || 'Proses teks ini'}\n\nTeks:\n${text}`;
          break;
        case 'ask':
          // For 'ask', the 'text' is the note context, and 'extraContext' is the user's question.
          prompt = `Berdasarkan isi catatan berikut, jawablah pertanyaan/instruksi yang diberikan. Berikan jawaban yang membantu, jelas, dan langsung. PENTING: Jawablah menggunakan bahasa yang sama dengan instruksi/pertanyaan (diutamakan bahasa Indonesia). Kembalikan HANYA jawaban tanpa teks tambahan lain.\n\nInstruksi/Pertanyaan: ${extraContext || 'Buat ringkasan'}\n\nIsi Catatan:\n${text}`;
          break;
        default:
          throw new Error(`Unsupported editor action: ${action}`);
      }
      
      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
      });

      return { text: response.text, modelUsed: model };
    }
  );
}
