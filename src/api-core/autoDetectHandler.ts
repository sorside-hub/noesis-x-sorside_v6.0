import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getSmartCascade } from '../lib/ai/cascadeProfiles';

export interface ExistingFolderInfo {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
}

export interface AutoDetectFolderDecision {
  action: 'existing' | 'new';
  existingFolderId?: string;
  existingFolderPath?: string;
  newFolderName?: string;
  newFolderParentId?: string | null;
  reasoning: string;
}

export interface AutoDetectResult {
  suggestedTitle: string;
  noteType: string;
  tags: string[];
  aliases: string[];
  folderDecision: AutoDetectFolderDecision;
}

/**
 * 3 Folder Root Utama yang boleh diakses dan dikelola oleh AI:
 * - 01-Pengetahuan
 * - 02-Refleksi
 * - 03-Gagasan
 * Folder lain (00-Inbox, 04-Proyek, 05-Karya) DILINDUNGI dan diabaikan dari AI.
 */
const ALLOWED_ROOT_NAMES = ['01-Pengetahuan', '02-Refleksi', '03-Gagasan'];

export function isAllowedFolderPath(folderPath: string): boolean {
  if (!folderPath) return false;
  return ALLOWED_ROOT_NAMES.some(
    (root) =>
      folderPath === root ||
      folderPath.startsWith(`${root}/`) ||
      folderPath.toLowerCase() === root.toLowerCase() ||
      folderPath.toLowerCase().startsWith(`${root.toLowerCase()}/`)
  );
}

function findBestFallbackFolder(
  parsed: AutoDetectResult,
  allowedFolders: ExistingFolderInfo[],
  rootPengetahuan?: ExistingFolderInfo,
  rootRefleksi?: ExistingFolderInfo,
  rootGagasan?: ExistingFolderInfo
): ExistingFolderInfo | undefined {
  const text = `${parsed.suggestedTitle || ''} ${parsed.noteType || ''} ${parsed.folderDecision?.reasoning || ''} ${parsed.folderDecision?.newFolderName || ''}`.toLowerCase();

  if (
    text.includes('refleksi') ||
    text.includes('jurnal') ||
    text.includes('diri') ||
    text.includes('emosi') ||
    text.includes('renungan') ||
    text.includes('evaluasi')
  ) {
    return (
      rootRefleksi ||
      allowedFolders.find((f) => f.path.startsWith('02-Refleksi')) ||
      rootPengetahuan
    );
  }
  if (
    text.includes('gagasan') ||
    text.includes('ide') ||
    text.includes('kreatif') ||
    text.includes('konsep') ||
    text.includes('rencana') ||
    text.includes('inspirasi')
  ) {
    return (
      rootGagasan ||
      allowedFolders.find((f) => f.path.startsWith('03-Gagasan')) ||
      rootPengetahuan
    );
  }
  return (
    rootPengetahuan ||
    allowedFolders.find((f) => f.path.startsWith('01-Pengetahuan')) ||
    rootRefleksi ||
    rootGagasan ||
    allowedFolders[0]
  );
}

export async function handleAutoDetect(
  params: {
    title?: string;
    content: string;
    currentNoteType?: string;
    existingFolders: ExistingFolderInfo[];
    existingTags?: string[];
    existingNoteTypes?: string[];
    customKeys?: Partial<Record<KeySlotId, string>>;
  },
  envObj: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {}
) {
  const {
    title,
    content,
    currentNoteType,
    existingFolders,
    existingTags,
    existingNoteTypes,
    customKeys,
  } = params;

  // 1. FILTERING WHITELIST: AI hanya boleh melihat dan mengelola 3 root (01-Pengetahuan, 02-Refleksi, 03-Gagasan)
  const allowedFolders = existingFolders.filter((f) => isAllowedFolderPath(f.path));

  const rootPengetahuan = allowedFolders.find(
    (f) =>
      f.path === '01-Pengetahuan' ||
      f.name === '01-Pengetahuan' ||
      f.name.toLowerCase().includes('pengetahuan')
  );
  const rootRefleksi = allowedFolders.find(
    (f) =>
      f.path === '02-Refleksi' ||
      f.name === '02-Refleksi' ||
      f.name.toLowerCase().includes('refleksi')
  );
  const rootGagasan = allowedFolders.find(
    (f) =>
      f.path === '03-Gagasan' ||
      f.name === '03-Gagasan' ||
      f.name.toLowerCase().includes('gagasan')
  );

  // Kompresi data untuk efisiensi token, dengan penanda tegas mana ROOT dan mana SUBFOLDER
  const compactFolders =
    allowedFolders.length > 0
      ? allowedFolders
          .map((f) => {
            const isRoot =
              ALLOWED_ROOT_NAMES.includes(f.name) ||
              ALLOWED_ROOT_NAMES.includes(f.path) ||
              !f.path.includes('/');
            const label = isRoot
              ? '(ROOT - HANYA UNTUK INDUK/PARENT, DILARANG MENARUH NOTE LANGSUNG DI SINI)'
              : '(SUBFOLDER - Boleh dipilih untuk catatan)';
            return `[ID: ${f.id}] Path: ${f.path} ${label}`;
          })
          .join('\n')
      : '(Belum ada subfolder. Wajib buat subfolder baru di bawah salah satu: 01-Pengetahuan, 02-Refleksi, 03-Gagasan)';
  const compactTags = (existingTags || []).join(', ');
  const compactNoteTypes = (existingNoteTypes || []).join(', ');

  // Top & Tail Smart Truncation (Max ~4000 chars)
  let truncatedContent = content;
  if (content.length > 4000) {
    truncatedContent =
      content.slice(0, 3000) +
      '\n\n...[TEKS DIPOTONG UNTUK EFISIENSI]...\n\n' +
      content.slice(-1000);
  }

  return executeWithFailover(
    { cascade: getSmartCascade(), customKeys, envObj },
    async (client, _slotId, model) => {
      const prompt = `Anda adalah Noesis Knowledge Librarian, kurator sistem Personal Knowledge Management (PKM) berbasis fungsi pemikiran (cognitive purpose).
Analisis judul dan isi catatan ini, lalu tentukan judul terbaik (suggestedTitle), jenis catatan (noteType), tags, aliases, dan penempatan folder.
PENTING: Gunakan bahasa yang sama dengan isi catatan. JIKA CATATAN BERBAHASA INDONESIA, MAKA 'suggestedTitle', 'noteType', 'tags', 'aliases', dan nama subfolder BARU WAJIB MENGGUNAKAN BAHASA INDONESIA.

DETAIL CATATAN:
- Judul Saat Ini: ${title || 'Untitled'}
- Note Type Saat Ini: ${currentNoteType || 'None'}
- Isi Catatan:
"""
${truncatedContent}
"""

DAFTAR METADATA EKSISTING DI VAULT:
- Tags Eksisting: ${compactTags || '(Belum ada tag eksisting)'}
- Note Types Eksisting: ${compactNoteTypes || '(Belum ada note type eksisting)'}
- Folder Eksisting yang Diizinkan:
${compactFolders}

======================================================================
ATURAN STRUKTUR FOLDER BERBASIS FUNGSI PEMIKIRAN (CRITICAL MANDATE)
======================================================================
Noesis menggunakan struktur folder berbasis FUNGSI PEMIKIRAN, bukan sekadar topik permukaan.
Pahami tujuan utama catatan sebelum memilih folder.
Folder tingkat utama (root) HANYA ADA 3:

1. "01-Pengetahuan"
   Fungsi: Informasi, pembelajaran, studi, dan pemahaman dari dunia luar.
   Contoh: Ringkasan buku/artikel, konsep sains/teknologi/coding, filosofi & teori akademis, teori musik/chord lagu musisi lain, tutorial & dokumentasi.

2. "02-Refleksi"
   Fungsi: Catatan tentang diri sendiri, pengalaman pribadi, dan olahan batin.
   Contoh: Jurnal harian, evaluasi diri, hikmah pengalaman, renungan emosi & perasaan personal.

3. "03-Gagasan"
   Fungsi: Gagasan mentah, konsep kreatif, atau kemungkinan sesuatu yang ingin diciptakan di masa depan.
   Contoh: Ide lagu/chord orisinal ciptaan sendiri, ide cerita/naskah, ide fitur aplikasi, konsep produk kreatif mentah.

======================================================================
ATURAN PENEMPATAN SUBFOLDER (STRICT & ABSOLUTE):
======================================================================
1. CATATAN WAJIB DILETAKKAN DI DALAM SUBFOLDER!
   DILARANG KERAS menempatkan catatan langsung di folder root ("01-Pengetahuan", "02-Refleksi", "03-Gagasan"). Folder root murni sebagai wadah pengelompokan tingkat atas, bukan tempat file catatan berserakan.
2. Pilihan keputusan folder HANYA:
   A. "existing": Pilih HANYA jika ada SUBFOLDER yang sudah ada di daftar "Folder Eksisting yang Diizinkan" yang cocok (>70%).
      * "existingFolderId" dan "existingFolderPath" WAJIB menunjuk ke sebuah SUBFOLDER (yang path-nya memiliki tanda '/', misal "01-Pengetahuan/Musik").
      * DILARANG memilih ID folder root utama sebagai existingFolderId!
   B. "new": Pilih jika BELUM ADA subfolder yang cocok untuk topik catatan ini.
      AI WAJIB MEMBUAT SUBFOLDER BARU!
      * "newFolderParentId": WAJIB diisi ID dari folder root yang sesuai (ID '01-Pengetahuan', '02-Refleksi', atau '03-Gagasan', atau ID subfolder induk jika bertingkat). DILARANG mengosongkan field ini.
      * "newFolderName": Nama subfolder baru yang ringkas, bersih, dan representatif (contoh: "Teori Musik", "Buku", "Tutorial", "Jurnal", "Ide Lagu", "Pemrograman", dll. TANPA awalan nomor urut).

======================================================================
ATURAN PRIORITAS PENENTUAN:
======================================================================
1. Pelajari karya orang lain / teori umum → Subfolder di bawah "01-Pengetahuan".
2. Pengalaman pribadi / jurnal batin → Subfolder di bawah "02-Refleksi".
3. Rancangan orisinal ciptaan sendiri yang belum tuntas → Subfolder di bawah "03-Gagasan".
4. Khusus Musik/Lagu:
   - Chord & lirik musisi lain (referensi belajar) → Subfolder di bawah "01-Pengetahuan" (misal: "Musik" atau "Lirik & Chord").
   - Draft ide lirik / progresi chord ciptaan sendiri → Subfolder di bawah "03-Gagasan" (misal: "Ide Lagu" atau "Progresi Chord").

======================================================================
ATURAN METADATA LAINNYA:
======================================================================
- "suggestedTitle": Buat judul yang jelas, spesifik, dan padat. Jika judul saat ini masih "Untitled" atau generik (misal "Capture 19 Aug..."), ekstrak inti topik catatan menjadi judul yang bermakna.
- "noteType": PRIORITASKAN memilih dari "Note Types Eksisting" jika ada yang relevan. Jika terpaksa membuat baru, gunakan kategori singkat (contoh: Konsep, Rapat, Referensi, Jurnal, Tutorial, Panduan, Ide, Lagu, Refleksi).
- "tags": 2 hingga 5 tag (huruf kecil semua, tanpa awalan '#'). PRIORITASKAN memilih dari "Tags Eksisting" jika relevan dengan isi catatan.
- "aliases": 1 hingga 3 judul alternatif, sinonim, atau istilah kunci untuk keperluan tautan wikilink.

Berikan respons HANYA dalam format JSON yang valid sesuai dengan schema.`;

      const schema = {
        type: 'OBJECT' as const,
        properties: {
          suggestedTitle: { type: 'STRING' as const },
          noteType: { type: 'STRING' as const },
          tags: {
            type: 'ARRAY' as const,
            items: { type: 'STRING' as const },
          },
          aliases: {
            type: 'ARRAY' as const,
            items: { type: 'STRING' as const },
          },
          folderDecision: {
            type: 'OBJECT' as const,
            properties: {
              action: { type: 'STRING' as const, enum: ['existing', 'new'] },
              existingFolderId: { type: 'STRING' as const },
              existingFolderPath: { type: 'STRING' as const },
              newFolderName: { type: 'STRING' as const },
              newFolderParentId: { type: 'STRING' as const },
              reasoning: { type: 'STRING' as const },
            },
            required: ['action', 'reasoning'],
          },
        },
        required: ['suggestedTitle', 'noteType', 'tags', 'aliases', 'folderDecision'],
      };

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText) as AutoDetectResult;

      // ===================================================================
      // KEAMANAN & PENEGAKAN STRUKTUR (Post-Validation Safeguard)
      // ===================================================================
      const allowedIdSet = new Set(allowedFolders.map((f) => f.id));

      if (parsed.folderDecision) {
        if (parsed.folderDecision.action === 'existing') {
          let selectedFolder = allowedFolders.find(
            (f) => f.id === parsed.folderDecision.existingFolderId
          );

          if (!selectedFolder) {
            const fallbackRoot = findBestFallbackFolder(
              parsed,
              allowedFolders,
              rootPengetahuan,
              rootRefleksi,
              rootGagasan
            );
            selectedFolder = fallbackRoot;
          }

          // CEK: Apakah folder ini merupakan ROOT? (Catatan dilarang ditaruh di root)
          const isRoot =
            !selectedFolder ||
            ALLOWED_ROOT_NAMES.includes(selectedFolder.name) ||
            ALLOWED_ROOT_NAMES.includes(selectedFolder.path) ||
            !selectedFolder.path.includes('/');

          if (isRoot && selectedFolder) {
            // Catatan tidak boleh di root! Cari apakah ada subfolder di bawah root ini yang cocok
            const rootId = selectedFolder.id;
            const rootPath = selectedFolder.path;
            const textToMatch = `${parsed.suggestedTitle || ''} ${parsed.noteType || ''} ${parsed.tags?.join(' ') || ''}`.toLowerCase();

            const childSubfolders = allowedFolders.filter(
              (f) =>
                f.id !== rootId &&
                (f.parentId === rootId || f.path.startsWith(`${rootPath}/`))
            );

            // Coba cari subfolder yang namanya terkandung dalam teks/topik
            const matchedSubfolder = childSubfolders.find((sub) =>
              textToMatch.includes(sub.name.toLowerCase())
            );

            if (matchedSubfolder) {
              parsed.folderDecision.existingFolderId = matchedSubfolder.id;
              parsed.folderDecision.existingFolderPath = matchedSubfolder.path;
              parsed.folderDecision.reasoning += ` (Dialihkan ke subfolder '${matchedSubfolder.name}' agar catatan tidak ditaruh di root).`;
            } else {
              // Jika belum ada subfolder yang cocok di bawah root ini, wajib buat subfolder baru!
              const subName =
                parsed.noteType && parsed.noteType !== 'None'
                  ? parsed.noteType.charAt(0).toUpperCase() + parsed.noteType.slice(1)
                  : 'Umum';
              parsed.folderDecision.action = 'new';
              parsed.folderDecision.newFolderName = subName;
              parsed.folderDecision.newFolderParentId = rootId;
              delete parsed.folderDecision.existingFolderId;
              delete parsed.folderDecision.existingFolderPath;
              parsed.folderDecision.reasoning += ` (Membuat subfolder baru '${subName}' di bawah '${selectedFolder.name}' karena catatan wajib berada di dalam subfolder).`;
            }
          } else if (selectedFolder) {
            parsed.folderDecision.existingFolderId = selectedFolder.id;
            parsed.folderDecision.existingFolderPath = selectedFolder.path;
          }
        } else if (parsed.folderDecision.action === 'new') {
          // Bersihkan nama folder dari prefix angka atau karakter aneh
          if (parsed.folderDecision.newFolderName) {
            parsed.folderDecision.newFolderName = parsed.folderDecision.newFolderName
              .replace(/^[0-9]+[\s\-_]*/, '')
              .replace(/[\/\\]/g, '-')
              .trim();
          }
          if (!parsed.folderDecision.newFolderName) {
            parsed.folderDecision.newFolderName =
              parsed.noteType && parsed.noteType !== 'None'
                ? parsed.noteType.charAt(0).toUpperCase() + parsed.noteType.slice(1)
                : 'Umum';
          }

          // AI DILARANG membuat folder di root! newFolderParentId WAJIB valid
          if (
            !parsed.folderDecision.newFolderParentId ||
            !allowedIdSet.has(parsed.folderDecision.newFolderParentId)
          ) {
            const fallbackParent = findBestFallbackFolder(
              parsed,
              allowedFolders,
              rootPengetahuan,
              rootRefleksi,
              rootGagasan
            );
            parsed.folderDecision.newFolderParentId =
              fallbackParent?.id || rootPengetahuan?.id || null;
          }
        }
      }

      return {
        result: parsed,
        modelUsed: model,
      };
    }
  );
}
