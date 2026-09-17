import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getGroqFirstCascade } from '../lib/ai/cascadeProfiles';

export type EditorActionType = 'grammar' | 'summarize' | 'tone' | 'translate' | 'expand' | 'custom' | 'ask';

export async function handleEditorAction(
  action: EditorActionType,
  text: string,
  extraContext?: string,
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
) {
  return executeWithFailover(
    { cascade: getGroqFirstCascade(), customKeys, envObj }, 
    async (client, slotId, model) => {
      let prompt = '';

      switch (action) {
        case 'grammar':
          prompt = `Perbaiki ejaan, tata bahasa, dan tipografi pada teks berikut. 
ATURAN KETAT:
1. Pertahankan bahasa asli teks (jangan mengubah bahasa).
2. Jangan mengubah makna aslinya.
3. PERTAHANKAN semua format Markdown (bold, italic, list, heading, dll) jika ada.
4. Kembalikan HANYA teks yang sudah diperbaiki tanpa pembukaan/penjelasan.
5. JANGAN membungkus hasil dengan markdown code block (\`\`\`)!

Teks:
${text}`;
          break;
        case 'summarize':
          prompt = `Buatlah ringkasan dari teks berikut secara singkat dan padat. 
ATURAN KETAT:
1. Gunakan bahasa yang sama dengan teks aslinya.
2. Jika teks panjang, gunakan poin-poin (bullet points) agar mudah dibaca.
3. PERTAHANKAN elemen format Markdown penting jika relevan.
4. Kembalikan HANYA ringkasan tanpa pembukaan/penjelasan.
5. JANGAN membungkus hasil dengan markdown code block (\`\`\`)!

Teks:
${text}`;
          break;
        case 'tone':
          const targetTone = extraContext || 'professional';
          prompt = `Tulis ulang teks berikut dengan gaya bahasa / nada yang ${targetTone}. 
ATURAN KETAT:
1. Pertahankan bahasa asli teks.
2. JANGAN merombak total teks atau menghilangkan esensi aslinya.
3. Hanya ubah pilihan kata (diksi) dan susunan kalimat secukupnya agar sesuai dengan gaya yang diminta.
4. PERTAHANKAN semua format Markdown asli (bold, italic, dll).
5. Kembalikan HANYA teks yang sudah ditulis ulang tanpa pembukaan/penjelasan.
6. JANGAN membungkus hasil dengan markdown code block (\`\`\`)!

Teks:
${text}`;
          break;
        case 'translate':
          prompt = `Deteksi bahasa dari teks berikut. Jika bahasa Indonesia, terjemahkan ke bahasa Inggris yang natural. Jika selain Indonesia, terjemahkan ke bahasa Indonesia yang natural. 
ATURAN KETAT:
1. Terjemahkan dengan luwes dan natural (tidak kaku seperti mesin).
2. PERTAHANKAN semua format Markdown (bold, italic, list, dll).
3. Kembalikan HANYA teks hasil terjemahan tanpa pembukaan/penjelasan.
4. JANGAN membungkus hasil dengan markdown code block (\`\`\`)!

Teks:
${text}`;
          break;
        case 'expand':
          prompt = `Kembangkan teks berikut dengan menambahkan lebih banyak detail dan konteks. 
ATURAN KETAT:
1. Tirulah gaya penulisan (tone) dari teks aslinya agar organik dan menyatu.
2. Pertahankan pesan utamanya, jangan berbelok ke topik yang tidak relevan.
3. Gunakan bahasa yang sama dengan teks aslinya.
4. PERTAHANKAN semua format Markdown asli.
5. Kembalikan HANYA teks yang sudah dikembangkan tanpa pembukaan/penjelasan.
6. JANGAN membungkus hasil dengan markdown code block (\`\`\`)!

Teks:
${text}`;
          break;
        case 'custom':
          prompt = `Lakukan instruksi berikut pada teks yang diberikan. 
ATURAN KETAT:
1. Kecuali instruksi meminta sebaliknya, gunakan bahasa yang sama dengan teks aslinya.
2. PERTAHANKAN format Markdown kecuali instruksi meminta diubah.
3. Kembalikan HANYA teks hasil akhir tanpa pembukaan/penjelasan.
4. JANGAN membungkus hasil dengan markdown code block (\`\`\`)!

Instruksi: ${extraContext || 'Proses teks ini'}

Teks:
${text}`;
          break;
        case 'ask':
          // For 'ask', the 'text' is the note context, and 'extraContext' is the user's question.
          prompt = `Berdasarkan isi catatan berikut, jawablah pertanyaan/instruksi yang diberikan secara membantu, jelas, dan langsung. 
ATURAN KETAT:
1. Jawab menggunakan bahasa yang sama dengan instruksi/pertanyaan.
2. Gunakan format Markdown (bold, list, dll) jika membantu memperjelas jawaban.
3. Kembalikan HANYA jawaban tanpa teks pembuka/penutup yang tidak perlu.
4. JANGAN membungkus jawaban utuh dengan markdown code block (\`\`\`), kecuali untuk menyajikan kode program.

Instruksi/Pertanyaan: ${extraContext || 'Buat ringkasan'}

Isi Catatan:
${text}`;
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
