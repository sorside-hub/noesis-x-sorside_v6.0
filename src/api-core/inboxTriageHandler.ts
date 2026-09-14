import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getSmartCascade } from '../lib/ai/cascadeProfiles';

export interface InboxTriageItem {
  id: string;
  title: string;
  content: string;
}

export interface TriageResult {
  id: string;
  verdict: 'keeper' | 'refine';
  confidence: number;
  reason: string;
}

export async function handleInboxTriage(
  notes: InboxTriageItem[],
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
): Promise<{ results: TriageResult[]; modelUsed: string }> {
  if (!notes || notes.length === 0) {
    return { results: [], modelUsed: 'none' };
  }

  // Build notes summary payload to keep tokens concise and fast
  const notesPayload = notes.map((n, idx) => {
    const cleanContent = (n.content || '').slice(0, 1500).trim();
    return `--- Note ${idx + 1} ---
ID: ${n.id}
Judul: ${n.title}
Konten:
${cleanContent || '(Konten kosong)'}
`;
  }).join('\n');

  const execution = await executeWithFailover(
    { cascade: getSmartCascade(), customKeys, envObj },
    async (client, _slotId, model) => {
      const prompt = `Kamu adalah kurator pengetahuan pribadi (Personal Knowledge Management Curator).

Tugasmu adalah menilai setiap catatan mentah dari Inbox dan menentukan apakah catatan tersebut sudah layak dipertahankan sebagai bagian dari knowledge base pribadi atau masih membutuhkan penyempurnaan.

Gunakan hanya informasi yang tersedia di dalam catatan. Jangan mengarang konteks, maksud, fakta, atau informasi yang tidak tertulis.

Untuk setiap catatan, pilih salah satu verdict:

"keeper"
Catatan sudah memiliki nilai yang cukup jelas untuk dipertahankan. Catatan tidak harus panjang atau sempurna. Catatan pendek tetap dapat menjadi keeper jika mengandung:
- insight atau pemikiran yang jelas
- informasi yang berguna
- observasi atau pengalaman yang bermakna
- ide yang dapat dikembangkan
- kesimpulan atau prinsip yang sudah cukup jelas
- referensi yang memiliki konteks atau alasan jelas untuk disimpan

"refine"
Catatan belum memiliki konteks atau substansi yang cukup untuk berguna jika disimpan apa adanya. Contohnya:
- fragmen yang tidak jelas maksudnya
- pertanyaan yang belum memiliki konteks
- ide yang terlalu kabur untuk dipahami kembali
- link/referensi tanpa konteks
- catatan yang membutuhkan informasi penting agar maknanya dapat dipahami
- catatan yang jelas masih berupa bahan mentah dan belum menyampaikan gagasan yang dapat dipertahankan

PENTING:
- Jangan menggunakan panjang catatan sebagai penentu utama.
- Catatan pendek tidak otomatis menjadi "refine".
- Catatan panjang tidak otomatis menjadi "keeper".
- Nilai dan kejelasan informasi lebih penting daripada panjang tulisan.
- Jangan menganggap catatan sebagai "refine" hanya karena gaya penulisannya informal atau tidak rapi.
- Jangan mengubah atau memperbaiki isi catatan.
- Jangan memberikan saran pengembangan dalam reason. Jelaskan hanya alasan kenapa catatan tersebut termasuk keeper atau refine.
- Jika konten terlihat terpotong, jangan menganggap bagian yang tidak terlihat sebagai informasi yang tidak ada.
- Jika informasi tidak cukup untuk memastikan kualitas catatan, pilih verdict berdasarkan apa yang benar-benar tersedia dan gunakan confidence yang lebih rendah.

CONFIDENCE:
90-95 = sangat yakin terhadap verdict
75-89 = cukup yakin
60-74 = ambigu atau membutuhkan interpretasi

WAJIB mengembalikan HANYA objek JSON valid dengan struktur berikut:

{
  "results": [
    {
      "id": "ID catatan yang bersangkutan",
      "verdict": "keeper" atau "refine",
      "confidence": integer 60-95,
      "reason": "1 kalimat penjelasan tajam dan ramah dalam Bahasa Indonesia"
    }
  ]
}

Pastikan setiap catatan memiliki tepat satu hasil.
Pertahankan ID persis seperti yang diberikan.
Jangan menambahkan field lain.

Daftar catatan Inbox yang akan dikurasi:
${notesPayload}`;

      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      let parsed: { results: TriageResult[] } = { results: [] };
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch (err) {
        console.warn('[InboxTriage] Failed to parse JSON response:', err);
      }

      return {
        results: Array.isArray(parsed.results) ? parsed.results : [],
        modelUsed: model,
      };
    }
  );

  return execution.data || { results: [], modelUsed: 'none' };
}
