export const SUPABASE_NOESIS_SQL = `-- ========================================================
-- NOESIS SUPABASE COMPLETE SCHEMA SETUP (TABLES + RLS + RAG)
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- ========================================================

-- 1. AKTIFKAN EKSTENSI VECTOR (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. TABEL CATATAN & FOLDER (Local-First Cloud Sync)
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  "parentId" TEXT,
  content TEXT,
  metadata JSONB,
  "createdAt" BIGINT,
  "updatedAt" BIGINT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE nodes ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nodes' AND policyname = 'Users can manage their own nodes'
  ) THEN
    CREATE POLICY "Users can manage their own nodes" 
    ON nodes FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. TABEL METADATA AI (Ringkasan, Konsep, Kata Kunci)
CREATE TABLE IF NOT EXISTS note_metadata (
  note_id TEXT PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  summary TEXT,
  keywords TEXT[],
  concepts TEXT[],
  emotion TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_note_metadata_nodes' AND table_name = 'note_metadata'
  ) THEN
    DELETE FROM note_metadata WHERE note_id NOT IN (SELECT id FROM nodes);
    ALTER TABLE note_metadata
      ADD CONSTRAINT fk_note_metadata_nodes
      FOREIGN KEY (note_id) REFERENCES nodes(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


ALTER TABLE note_metadata ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'note_metadata' AND policyname = 'Users can manage their own note metadata'
  ) THEN
    CREATE POLICY "Users can manage their own note metadata" 
    ON note_metadata FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. TABEL VEKTOR EMBEDDING (RAG Vector Database - BAAI/bge-m3 1024 Dimensi)
CREATE TABLE IF NOT EXISTS note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'note_embeddings' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE note_embeddings ALTER COLUMN embedding TYPE vector(1024);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_note_embeddings_nodes' AND table_name = 'note_embeddings'
  ) THEN
    DELETE FROM note_embeddings WHERE note_id NOT IN (SELECT id FROM nodes);
    ALTER TABLE note_embeddings
      ADD CONSTRAINT fk_note_embeddings_nodes
      FOREIGN KEY (note_id) REFERENCES nodes(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE note_embeddings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'note_embeddings' AND policyname = 'Users can manage their own note embeddings'
  ) THEN
    CREATE POLICY "Users can manage their own note embeddings" 
    ON note_embeddings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. FUNGSI PENCARI VEKTOR PINTAR (RPC match_note_embeddings 1024-dimensi)
CREATE OR REPLACE FUNCTION match_note_embeddings (
  query_embedding vector(1024),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  "noteId" text,
  "chunkIndex" integer,
  "sourceType" text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    note_id as "noteId",
    chunk_index as "chunkIndex",
    source_type as "sourceType",
    note_embeddings.content,
    1 - (note_embeddings.embedding <=> query_embedding) AS similarity
  FROM note_embeddings
  WHERE 1 - (note_embeddings.embedding <=> query_embedding) > match_threshold
    AND user_id = auth.uid()
  ORDER BY note_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. TABEL RIWAYAT CHAT (Local-First Cloud Sync)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "isPinned" BOOLEAN DEFAULT false,
  "memorySummary" TEXT,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Migrasi jika tabel chat_sessions sudah ada sebelumnya
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS "memorySummary" TEXT;

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users can manage their own chat sessions'
  ) THEN
    CREATE POLICY "Users can manage their own chat sessions" 
    ON chat_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


CREATE TABLE IF NOT EXISTS media_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at timestamp with time zone
);

-- RLS for media_attachments
ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own media attachments" ON media_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own media attachments" ON media_attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own media attachments" ON media_attachments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media attachments" ON media_attachments FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  chunks JSONB,
  "createdAt" BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can manage their own chat messages'
  ) THEN
    CREATE POLICY "Users can manage their own chat messages" 
    ON chat_messages FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. AKTIFKAN SUPABASE REALTIME (Sinkronisasi Antar Device)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'nodes') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE nodes';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_sessions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'media_attachments') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE media_attachments';
  END IF;
END $$;
`;

export const SUPABASE_SORSIDE_CMS_SQL = `-- =======================================================
-- SORSIDE SUPABASE SCHEMA & INITIAL SEED (CMS WEBSITE)
-- =======================================================
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- Khusus untuk CMS Website Sorside (Releases, Tracks & Articles).
-- =======================================================

-- 1. TABEL RELEASES (RILISAN MUSIK: SINGLE / EP / ALBUM)
CREATE TABLE IF NOT EXISTS public.releases (
    id TEXT PRIMARY KEY,                       -- e.g. 'titik-koma', 'catatan-malam'
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('SINGLE', 'EP', 'ALBUM')),
    release_date TEXT,
    year TEXT,
    song_count TEXT DEFAULT '1 SONG',
    duration TEXT,
    cover_url TEXT DEFAULT 'https://res.cloudinary.com/sorside/image/upload/v1784875625/cover-all.webp',            -- Cloudinary ID atau URL langsung
    audio_url TEXT DEFAULT '',
    tagline TEXT,
    concept_story TEXT,
    lyrics TEXT DEFAULT '',
    credits JSONB DEFAULT '{}'::jsonb,
    stream_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL TRACKS (TREK LAGU UNTUK EP / ALBUM)
CREATE TABLE IF NOT EXISTS public.tracks (
    id TEXT PRIMARY KEY,                       -- e.g. 'cm-1', 'lt-1'
    release_id TEXT REFERENCES public.releases(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    duration TEXT,
    audio_url TEXT DEFAULT '',
    story TEXT,
    lyrics TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tracks_release_id ON public.tracks(release_id);

-- 3. TABEL ARTICLES (JURNAL & CATATAN THE SIDE)
-- Dirancang agar bisa langsung terhubung dengan aplikasi Note Anda!
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,                       -- e.g. 'malam-dan-pertanyaan'
    title TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('INNER', 'HUMAN', 'PASSION', 'SORSIDE')),
    side_number TEXT DEFAULT '01',
    side_name TEXT DEFAULT 'INNER SIDE',
    date TEXT,                                 -- e.g. '20 JULI 2026'
    read_time TEXT DEFAULT '2 MIN BACA',
    snippet TEXT,
    full_text TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    cover TEXT,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_side ON public.articles(side);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING GIN(tags);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read releases" ON public.releases FOR SELECT USING (true);
CREATE POLICY "Allow public read tracks" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "Allow public read articles" ON public.articles FOR SELECT USING (published = true);

-- Izinkan write jika menggunakan Service Role / API Note Anda:
CREATE POLICY "Allow full access for authenticated service" ON public.releases FOR ALL USING (true);
CREATE POLICY "Allow full access for authenticated service tracks" ON public.tracks FOR ALL USING (true);
CREATE POLICY "Allow full access for authenticated service articles" ON public.articles FOR ALL USING (true);

-- =======================================================
-- INITIAL SEED DATA (MIGRASI DATA DARI DECAP KE SUPABASE)
-- =======================================================

-- SEED RELEASES:
INSERT INTO public.releases (id, title, type, release_date, year, song_count, duration, cover, audio_url, tagline, concept_story, lyrics, credits, stream_links)
VALUES
(
  'titik-koma',
  'TITIK KOMA.',
  'SINGLE',
  '15 November 2024',
  '2024',
  '1 SONG',
  '3:42',
  'https://res.cloudinary.com/sorside/image/upload/v1784875625/cover-all.webp',
  '',
  'Sebuah pengingat bahwa saat kamu merasa lelah, yang kamu butuhkan adalah jeda — bukan akhir.',
  'Ditulis di tengah keputusasaan dan kelelahan mental sepulang kerja. "TITIK KOMA." lahir dari refleksi sederhana: ketika seseorang merasa ingin mengakhiri segalanya, yang sejatinya ia butuhkan bukanlah titik akhir dari kehidupannya, melainkan sebuah titik koma — ruang untuk bernafas, beristirahat sejenak, lalu melanjutkan bait cerita yang belum selesai.',
  E'[Verse 1]\\nLangkah terasa berat di jalan yang sama\\nLampu kota meredup, menyapa senyapnya jiwa\\nPertanyaan yang sama berulang di kepala\\nApakah semua ini ada artinya?\\n\\n[Pre-Chorus]\\nNafas terengah di ruang yang sempit\\nIngin berlari tapi kaki terikat\\nSuara di kepala berbisik ingin berhenti\\nNamun hati kecil berseru, "Jangan sekarang."\\n\\n[Chorus]\\nBukan akhir, ini cuma titik koma\\nKita belum selesai, cuma butuh jeda\\nHapus air matamu, istirahatlah sejenak\\nBesok matahari masih akan terbit untukmu.\\n\\n[Verse 2]\\nRencana yang patah, harapan yang gugur\\nKadang kita harus jatuh untuk tahu cara bangun\\nJangan salahkan dirimu atas yang tak kau genggam\\nBeberapa beban memang tak untuk kau pikul sendiri.\\n\\n[Chorus]\\nBukan akhir, ini cuma titik koma\\nKita belum selesai, cuma butuh jeda\\nHapus air matamu, istirahatlah sejenak\\nBesok matahari masih akan terbit untukmu.\\n\\n[Outro]\\nTarik nafas... hembuskan...\\nKamu sudah bertahan sejauh ini.\\nTitik koma, bukan titik akhir.',
  '{"writer": "sor", "producer": "sorside", "mixing": "sorside", "mastering": "sorside", "label": "Independent"}'::jsonb,
  '{"spotify": "https://open.spotify.com", "appleMusic": "https://music.apple.com", "youtube": "https://youtu.be/VzCrs1vf4fI?si=-VdycA_PRuyAjE7N", "soundcloud": "https://on.soundcloud.com/ztDXlCeZrxoy8ydjHU"}'::jsonb
),
(
  'catatan-malam',
  'CATATAN MALAM',
  'EP',
  '20 Mei 2022',
  '2022',
  '6 SONGS',
  '',
  'https://res.cloudinary.com/sorside/image/upload/v1784875625/cover-all.webp',
  '',
  '6 trek akustik mentah yang ditulis di atas kertas binder tua tanpa proses editing rumit.',
  'Kumpulan jurnal audio pertama Sorside. 6 lagu akustik mentah yang menangkap keheningan malam, suara hujan di atap, dan refleksi jujur seorang perantau.',
  '',
  '{"writer": "sor", "producer": "Sorside Creative", "mixing": "Sorside Studio", "mastering": "Sorside Studio", "label": "Independent / Sorside Music"}'::jsonb,
  '{"spotify": "https://open.spotify.com", "appleMusic": "https://music.apple.com", "youtube": "https://youtube.com", "soundcloud": "https://on.soundcloud.com/ztDXlCeZrxoy8ydjHU"}'::jsonb
),
(
  'lawan-takdir',
  'LAWAN TAKDIR.',
  'ALBUM',
  '10 Oktober 2021',
  '2021',
  '11 SONGS',
  '',
  'https://res.cloudinary.com/sorside/image/upload/v1784875625/cover-all.webp',
  '',
  'Album eksperimental tentang keteguhan hati menembus batas keterbatasan.',
  'Lahir dari riff gitar akustik raw dan puisi-puisi malam. Album ini menjadi pondasi awal identitas Sorside dalam menyuarakan harapan bagi mereka yang hampir menyerah.',
  '',
  '{"writer": "sor", "producer": "Sorside Creative", "mixing": "Sorside Studio", "mastering": "Sorside Studio", "label": "Independent / Sorside Music"}'::jsonb,
  '{"spotify": "https://open.spotify.com", "appleMusic": "https://music.apple.com", "youtube": "https://youtube.com", "soundcloud": "https://on.soundcloud.com/ztDXlCeZrxoy8ydjHU"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  release_date = EXCLUDED.release_date,
  year = EXCLUDED.year,
  song_count = EXCLUDED.song_count,
  cover = EXCLUDED.cover,
  tagline = EXCLUDED.tagline,
  concept_story = EXCLUDED.concept_story,
  lyrics = EXCLUDED.lyrics,
  credits = EXCLUDED.credits,
  stream_links = EXCLUDED.stream_links;

-- SEED TRACKS (Catatan Malam & Lawan Takdir):
INSERT INTO public.tracks (id, release_id, number, title, duration, audio_url, story, lyrics)
VALUES
(
  'cm-1',
  'catatan-malam',
  1,
  'Coretan Pertama',
  '2:50',
  '',
  'Pembuka EP berupa petikan gitar akustik jujur.',
  E'[Verse 1]\\nBuka lembar binder tua di sudut meja\\nLampu kamar redup menemani jeda\\nJari menari di atas dawai senar lima\\nMenulis nada yang lama terpendam di dada\\n\\n[Chorus]\\nIni coretan pertama\\nDi malam yang sunyi tanpa suara\\nTak perlu sempurna, tak perlu dipaksa\\nHanya jujur menyuarakan apa adanya\\n\\n[Verse 2]\\nDunia di luar riuh dengan irama\\nTapi di kamar ini, aku temukan ruang bernafas lega\\nSetiap petikan menyimpan cerita\\nTentang langkah kecil yang baru saja dimulai\\n\\n[Outro]\\nCoretan pertama...\\nLangkah awal untuk cerita berikutnya.'
),
(
  'cm-2',
  'catatan-malam',
  2,
  'Suara Hujan di Atap',
  '3:40',
  '',
  'Refleksi kenangan lama di kala hujan malam.',
  ''
),
(
  'cm-3',
  'catatan-malam',
  3,
  'Di Balik Kaca Jendela',
  '3:15',
  '',
  'Melihat orang-orang berlalu lalang di bawah gerimis.',
  ''
),
(
  'cm-4',
  'catatan-malam',
  4,
  'Tarik Nafas',
  '4:00',
  '',
  'Lagu tenang untuk meredakan ketakutan dan cemas.',
  ''
),
(
  'cm-5',
  'catatan-malam',
  5,
  'Kopi Dingin',
  '3:22',
  '',
  'Teman setia mengarungi malam yang panjang.',
  ''
),
(
  'cm-6',
  'catatan-malam',
  6,
  'Penutup Halaman',
  '3:05',
  '',
  'Doa sederhana sebelum akhirnya bisa tertidur.',
  ''
),
(
  'lt-1',
  'lawan-takdir',
  1,
  'Takdir & Kehendak',
  '3:20',
  '',
  'Pembuka album yang mempertanyakan batas antara takdir yang diterima dan kehendak untuk berjuang.',
  E'[Verse 1]\\nMalam berbisik tentang takdir yang tertulis\\nDi antara lembar masa lalu yang tak bisa dihindari\\nApakah kita hanya penonton di jalan ini?\\nAtaukah kita pemegang pena cerita sendiri?\\n\\n[Pre-Chorus]\\nLangkah ragu di persimpangan jalan\\nMenatap langit hitam penuh pertanyaan\\nApakah garis tangan ini takdir mutlak?\\nAtau bisikan hati yang belum terucap?\\n\\n[Chorus]\\nDi antara takdir dan kehendak\\nAda langkah kecil yang tak pernah padam\\nMeski badai menghadang di depan mata\\nKita memilih berdiri dan melawan.\\n\\n[Verse 2]\\nTersungkur di tanah tak berarti kalah\\nSetiap helai nafas adalah kesempatan baru'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  story = EXCLUDED.story,
  lyrics = EXCLUDED.lyrics;

-- SEED ARTICLES (THE SIDE):
INSERT INTO public.articles (id, title, side, side_number, side_name, date, read_time, snippet, full_text, tags, cover, published)
VALUES
(
  'malam-dan-pertanyaan',
  'MALAM DAN PERTANYAAN YANG BELUM TERJAWAB',
  'INNER',
  '01',
  'INNER SIDE',
  '20 JULI 2026',
  '2 MIN BACA',
  'Jam 2 pagi selalu jadi waktu di mana pikiran paling jujur tapi paling bising. Ada pertanyaan-pertanyaan sederhana tentang arah dan tujuan.',
  E'Jam 2 pagi selalu jadi waktu di mana pikiran paling jujur tapi paling bising. Ada pertanyaan-pertanyaan sederhana tentang arah, tujuan, dan pilihan yang kita buat kemarin. Tapi mungkin, memang ada jawaban yang belum waktunya kita dengar.\\n\\nMusik dan tulisan ini jadi tempat aman untuk menyimpan pertanyaan-pertanyaan itu tanpa harus memaksa menemukan jawaban malam ini. Tidak apa-apa tidak mengerti semuanya sekarang.',
  ARRAY['pikiran', 'malam', 'resah', 'refleksi'],
  NULL,
  true
),
(
  'tentang-rumah-tempat-pulang',
  'TENTANG RUMAH, TEMPAT PULANG',
  'HUMAN',
  '02',
  'HUMAN SIDE',
  '01 JULI 2026',
  '3 MIN BACA',
  'Rumah bukan selalu tentang tembok atau alamat. Rumah bisa jadi tentang rasa aman saat menjadi diri sendiri.',
  E'Pernah gak berada di tengah keramaian tapi merasa tidak berada di mana-mana? Rumah bukanlah tembok atau alamat.\\n\\nRumah adalah saat pikiran berhenti berpacu dan kamu merasa aman menjadi dirimu apa adanya di hadapan seseorang atau dalam kesendirianmu.',
  ARRAY['manusia', 'cerita', 'kehidupan'],
  NULL,
  true
),
(
  'kamera-analog-dan-waktu',
  'Kamera Analog & Seni Menunggu Hasil Film',
  'PASSION',
  '03',
  'PASSION SIDE',
  '18 JUNI 2026',
  '2 MIN BACA',
  'Nggak bisa langsung dibilang bagus atau jelek. Harus diputar, ditunggu, dan dicuci dulu.',
  E'Di zaman di mana semua hal serba instan, memotret dengan rol film mengajari kita tentang rasa sabar. Kita tidak bisa melihat hasilnya seketika.\\n\\nAda ruang untuk kejutan, bocoran cahaya, dan ketidaksempurnaan yang justru bikin setiap bingkai foto punya jiwa.',
  ARRAY['analog', 'passion', 'rekomendasi'],
  NULL,
  true
),
(
  'lirik-belum-jadi-lagu',
  'LIRIK YANG BELUM JADI LAGU',
  'SORSIDE',
  '04',
  'SORSIDE',
  '08 JULI 2026',
  '1 MIN BACA',
  'Beberapa baris di buku catatan tua yang belum ketemu akordnya tapi sayang kalau dibuang.',
  E'Di halaman belakang buku catatan tua, ada larik-larik yang terputus. Belum ketemu nadanya, belum pas akordnya.\\n\\nTapi rasanya terlalu berharga untuk dibuang. Mungkin suatu hari nanti, saat momen yang tepat tiba, baris ini akan menemukan rumahnya di sebuah lagu Sorside.',
  ARRAY['lirik', 'proses', 'dapur-rekam'],
  NULL,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  side = EXCLUDED.side,
  snippet = EXCLUDED.snippet,
  full_text = EXCLUDED.full_text,
  tags = EXCLUDED.tags,
  published = EXCLUDED.published;
`;

export const SUPABASE_SETUP_SQL = SUPABASE_NOESIS_SQL;

