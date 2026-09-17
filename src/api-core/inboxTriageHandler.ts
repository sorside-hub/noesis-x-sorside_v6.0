import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getGroqFirstCascade } from '../lib/ai/cascadeProfiles';

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
    // Increased safety truncation from 1500 to 2500 for better context
    const cleanContent = (n.content || '').slice(0, 2500).trim();
    return `--- Note ${idx + 1} ---
ID: ${n.id}
Judul: ${n.title}
Konten:
${cleanContent || '(Konten kosong)'}`;
  }).join('\n\n');

  const execution = await executeWithFailover(
    { cascade: getGroqFirstCascade(), customKeys, envObj },
    async (client, _slotId, model) => {
      const prompt = `Kamu adalah Ahli Kurasi Pengetahuan (Personal Knowledge Management Curator).
Tugasmu adalah menilai kumpulan catatan mentah (Inbox) dan menentukan secara tegas apakah catatan tersebut layak disimpan ("keeper") atau masih terlalu buram/kabur ("refine").

ATURAN KURASI KETAT:
1. "keeper": Catatan memiliki esensi yang jelas (insight, fakta, tugas, ide, atau referensi dengan konteks). Panjang/pendek TIDAK relevan. Jika 1 kalimat sudah bermakna, itu adalah "keeper".
2. "refine": Catatan berupa fragmen terputus, sekadar link tanpa penjelasan, atau ide abstrak yang tidak akan dipahami oleh penulisnya sendiri di masa depan.
3. JANGAN menilai berdasarkan tata bahasa, ejaan, atau kerapian. Fokus murni pada: "Apakah informasi ini punya nilai retensi (guna di masa depan)?"

ATURAN OUTPUT (STRICT JSON):
1. WAJIB kembalikan HANYA objek JSON dengan key "results" berisi array.
2. PENTING: Jumlah item di dalam array "results" WAJIB SAMA PERSIS dengan jumlah catatan yang diberikan. JANGAN ADA CATATAN YANG TERLEWAT!
3. Skema tiap item JSON:
{
  "id": "<String ID catatan persis seperti input>",
  "verdict": "<String, pilih HANYA: 'keeper' atau 'refine'>",
  "confidence": <Integer 60-100 tingkat keyakinanmu>,
  "reason": "<String 1 kalimat analitis, tajam, dan singkat dalam Bahasa Indonesia yang menjelaskan kenapa kamu memilih verdict tersebut>"
}

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
