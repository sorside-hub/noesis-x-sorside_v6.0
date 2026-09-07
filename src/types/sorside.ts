export type SorsideCategory = 'stories' | 'thoughts' | 'origins';
export type SorsideSide = SorsideCategory | 'INNER' | 'HUMAN' | 'PASSION' | 'SORSIDE';

export interface AboutGlossaryItem {
  id: string;
  title: string;
  content: string;
  order_index: number;
  published: boolean;
  created_at?: string;
}

export interface SideMeta {
  side: SorsideSide;
  side_number: string;
  side_name: string;
  description: string;
  badgeClass: string;
}

export const SORSIDE_CATEGORIES: { id: SorsideCategory; label: string; badgeClass: string }[] = [
  {
    id: 'stories',
    label: 'stories',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'thoughts',
    label: 'thoughts',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'origins',
    label: 'origins',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  }
];

export const SORSIDE_SIDE_CONFIG: Record<string, SideMeta> = {
  stories: {
    side: 'stories',
    side_number: '01',
    side_name: 'STORIES',
    description: 'Cerita, narasi, dan catatan perjalanan',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  thoughts: {
    side: 'thoughts',
    side_number: '02',
    side_name: 'THOUGHTS',
    description: 'Refleksi, gagasan, dan renungan',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  origins: {
    side: 'origins',
    side_number: '03',
    side_name: 'ORIGINS',
    description: 'Asal-usul, proses kreatif, dan arsip',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  INNER: {
    side: 'INNER',
    side_number: '01',
    side_name: 'INNER SIDE',
    description: 'Refleksi batin, kesendirian, dan renungan malam',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  HUMAN: {
    side: 'HUMAN',
    side_number: '02',
    side_name: 'HUMAN SIDE',
    description: 'Kisah manusia, hubungan sosial, dan tempat berpulang',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  PASSION: {
    side: 'PASSION',
    side_number: '03',
    side_name: 'PASSION SIDE',
    description: 'Kreativitas, seni analog, musik, dan hobi',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  SORSIDE: {
    side: 'SORSIDE',
    side_number: '04',
    side_name: 'SORSIDE',
    description: 'Dapur rekam, lirik lagu, dan arsip kreatif Sorside',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  }
};

export interface SorsideArticle {
  id: string; // UUID from Supabase or unique identifier
  slug?: string; // unique slug identifier, e.g. 'malam-dan-pertanyaan'
  title: string;
  category: SorsideCategory | string;
  side?: SorsideSide;
  side_number?: string;
  side_name?: string;
  date: string; // Formatted date e.g. '25-07-2026'
  release_date?: string | null; // ISO timestamp string or formatted release date
  read_time?: string; // e.g. '2 MIN BACA'
  snippet: string | null;
  content: string; // Full text content
  full_text?: string; // Alias for backward compatibility
  tags?: string[];
  cover?: string | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export type SorsideReleaseType = 'SINGLE' | 'EP' | 'ALBUM';

export interface SorsideCreditItem {
  role: string;
  name: string;
}

export interface SorsideRelease {
  id: string; // UUID from Supabase or temporary identifier
  slug: string; // unique slug identifier, e.g. 'titik-koma'
  title: string;
  tagline?: string | null;
  type: SorsideReleaseType;
  release_date?: string | null; // e.g. '25-09-2026' or '2026-09-25'
  year?: string | null;
  song_count?: string | null;
  catalog_number?: string | null; // e.g. 'SS-001'
  cover_url?: string | null; // Cover image URL or Cloudinary ID
  cover?: string | null; // Alias for backward compatibility
  cover_art?: string | null; // Alias for backward compatibility
  origin_slug?: string | null; // Origin Story slug reference for the release
  lyrics?: string | null; // Song lyrics for Single release
  spotify_url?: string | null; // Spotify URL
  apple_music_url?: string | null; // Apple Music URL
  youtube_url?: string | null; // YouTube URL
  credits?: SorsideCreditItem[] | Record<string, any> | string | null; // JSONB credits array or object
  credits_text?: string | null; // Liner notes text helper
  published?: boolean;
  order_index?: number | null; // Display sort order
  created_at?: string;
  duration?: string | null;
  audio_url?: string | null;
  concept_story?: string | null;
  stream_links?: {
    spotify?: string | null;
    youtube?: string | null;
    apple_music?: string | null;
    [key: string]: any;
  } | null;
  tracks?: SorsideTrack[];
}

export interface SorsideTrack {
  id: string; // UUID from Supabase or temporary identifier
  release_id: string; // UUID of parent release
  track_number?: number; // Order in tracks table
  number: number; // Alias for track_number
  title: string;
  youtube_url?: string | null; // Track-specific YouTube stream URL
  lyrics?: string | null; // Track lyrics
  origin_slug?: string | null; // Article slug reference for this track
  duration?: string | null;
  audio_url?: string | null;
  story?: string | null;
  created_at?: string;
}
