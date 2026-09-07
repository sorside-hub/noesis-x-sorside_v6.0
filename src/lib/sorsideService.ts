import { supabase } from './supabase';
import { SorsideArticle, SorsideSide, SORSIDE_SIDE_CONFIG, SorsideReleaseType, SorsideRelease } from '../types/sorside';

const INDONESIAN_MONTHS = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

/**
 * Format a Date object, string or timestamp to DD-MM-YYYY (e.g. '25-07-2026')
 */
export const formatReleaseDate = (input?: Date | string | number | null): string => {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = input ? new Date(input) : new Date();
  if (isNaN(d.getTime())) {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Parses DD-MM-YYYY (e.g. '25-07-2026') or any date string to ISO 8601 string for PostgreSQL timestamp with time zone
 */
export const parseReleaseDateToISO = (input?: string | Date | number | null): string => {
  if (!input) {
    return new Date().toISOString();
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const dmyMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const dateObj = new Date(Date.UTC(year, month, day, 0, 0, 0));
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
    }
  }
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return new Date().toISOString();
};

/**
 * Default Cover Art WebP URL according to Sorside Discography Schema
 */
export const DEFAULT_SORSIDE_COVER_URL =
  'https://res.cloudinary.com/sorside/image/upload/v1784875625/cover-all.webp';

/**
 * Get Cloudinary cloud name from environment variables
 */
export const getCloudinaryCloudName = (): string => {
  return (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
};

/**
 * Resolves a cover image string (which can be a full URL, Data/Blob URI, or Cloudinary Public ID)
 * into a fully qualified image URL. Returns default cover-all.webp if empty or 'cover-all'.
 */
export const resolveCoverImageUrl = (coverInput?: string | null): string => {
  if (!coverInput) return DEFAULT_SORSIDE_COVER_URL;
  const trimmed = coverInput.trim();
  if (!trimmed || trimmed === 'cover-all' || trimmed === DEFAULT_SORSIDE_COVER_URL) {
    return DEFAULT_SORSIDE_COVER_URL;
  }

  // 1. Direct HTTP/HTTPS or Data/Blob URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // 2. Cloudinary Public ID
  const cloudName = getCloudinaryCloudName() || 'sorside';
  if (cloudName) {
    const cleanId = trimmed.replace(/^\/+/, '');
    return `https://res.cloudinary.com/${cloudName}/image/upload/${cleanId}`;
  }

  return DEFAULT_SORSIDE_COVER_URL;
};

/**
 * Format a Date object or ISO string to SORSIDE date convention (e.g. '20 JULI 2026')
 */
export const formatSorsideDate = (input?: Date | string | number | null): string => {
  const d = input ? new Date(input) : new Date();
  if (isNaN(d.getTime())) {
    return '20 JULI 2026';
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Generate a clean URL-friendly slug
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
};

/**
 * Calculate estimated reading time in minutes
 */
export const calculateReadTime = (text: string): string => {
  if (!text) return '1 MIN BACA';
  const clean = text.replace(/<[^>]*>/g, ' ').trim();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 180));
  return `${minutes} MIN BACA`;
};

/**
 * Converts HTML from TipTap/Editor into clean readable text for articles
 */
export const htmlToArticleText = (html: string): string => {
  if (!html) return '';
  // Quick DOM parser if available in browser
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Replace breaks and paragraphs with newlines
    const paragraphs = temp.querySelectorAll('p, h1, h2, h3, h4, li, blockquote');
    if (paragraphs.length > 0) {
      const parts: string[] = [];
      paragraphs.forEach((p) => {
        const text = p.textContent?.trim();
        if (text) parts.push(text);
      });
      return parts.join('\n\n');
    }
    return temp.textContent || temp.innerText || '';
  }
  return html.replace(/<[^>]*>/g, '').trim();
};

const isUUIDString = (str?: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

/**
 * Fetch all articles from SORSIDE public.articles
 */
export const fetchSorsideArticles = async (): Promise<SorsideArticle[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache')) {
      console.warn('Tabel public.articles belum dibuat di Supabase atau belum ada di schema cache. Menggunakan list kosong.');
      return [];
    }
    console.error('Error fetching Sorside articles:', error);
    throw error;
  }

  return (data || []).map((item) => {
    const formattedDate = formatReleaseDate(item.release_date || item.created_at);
    const category = item.category || 'stories';
    const textContent = item.content || item.full_text || '';
    return {
      id: item.id || item.slug,
      slug: item.slug || item.id,
      title: item.title,
      category,
      side: category as SorsideSide,
      snippet: item.snippet || (textContent ? textContent.slice(0, 160).replace(/\n+/g, ' ').trim() : ''),
      content: textContent,
      full_text: textContent,
      read_time: calculateReadTime(textContent),
      published: Boolean(item.published),
      release_date: item.release_date,
      date: formattedDate,
      created_at: item.created_at
    };
  });
};

/**
 * Upsert (Create or Edit) an article in public.articles
 */
export const upsertSorsideArticle = async (
  article: Partial<SorsideArticle> & {
    id?: string;
    slug?: string;
    title: string;
    category?: string;
    side?: SorsideSide;
    content?: string;
    full_text?: string;
    snippet?: string | null;
    published?: boolean;
    release_date?: string | null;
    date?: string;
  }
): Promise<SorsideArticle> => {
  const cleanSlug = generateSlug(article.slug || article.id || article.title);
  const cleanCategory = (article.category || article.side || 'stories').toLowerCase().trim();
  const textContent = article.content || article.full_text || '';
  const cleanSnippet = (article.snippet || textContent.slice(0, 160).replace(/\n+/g, ' ')).trim() || null;
  const isoReleaseDate = parseReleaseDateToISO(article.release_date || article.date);

  const payload: Record<string, any> = {
    title: article.title.trim(),
    slug: cleanSlug,
    category: cleanCategory,
    snippet: cleanSnippet,
    content: textContent,
    published: article.published !== undefined ? article.published : true,
    release_date: isoReleaseDate
  };

  const isUUID = isUUIDString(article.id);
  if (isUUID && article.id) {
    payload.id = article.id.trim();
  }

  const { data, error } = await supabase
    .from('articles')
    .upsert(payload, { onConflict: isUUID ? 'id' : 'slug' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting Sorside article:', error);
    throw error;
  }

  const formattedDate = formatReleaseDate(data.release_date || data.created_at);
  const category = data.category || 'stories';
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    category,
    side: category as SorsideSide,
    snippet: data.snippet,
    content: data.content,
    full_text: data.content,
    read_time: calculateReadTime(data.content),
    published: Boolean(data.published),
    release_date: data.release_date,
    date: formattedDate,
    created_at: data.created_at
  };
};

/**
 * Delete an article by ID or slug
 */
export const deleteSorsideArticle = async (id: string): Promise<void> => {
  const isUUID = isUUIDString(id);
  const query = supabase.from('articles').delete();
  const { error } = isUUID ? await query.eq('id', id) : await query.eq('slug', id);

  if (error) {
    console.error('Error deleting Sorside article:', error);
    throw error;
  }
};

/**
 * Toggle published status of an article
 */
export const togglePublishArticle = async (id: string, published: boolean): Promise<void> => {
  const isUUID = isUUIDString(id);
  const query = supabase.from('articles').update({ published });
  const { error } = isUUID ? await query.eq('id', id) : await query.eq('slug', id);

  if (error) {
    console.error('Error updating published status:', error);
    throw error;
  }
};

/**
 * Format date string or Date object to PostgreSQL DATE format (YYYY-MM-DD)
 */
export const formatToPostgresDate = (input?: string | Date | number | null): string => {
  if (!input) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const dmyMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

/**
 * Fetch all music releases from SORSIDE public.releases, including their tracks
 */
export const fetchSorsideReleases = async (): Promise<any[]> => {
  const { data: releasesData, error: relError } = await supabase
    .from('releases')
    .select('*')
    .order('order_index', { ascending: false })
    .order('release_date', { ascending: false });

  if (relError) {
    if (relError.code === 'PGRST205' || relError.code === '42P01' || relError.message?.includes('schema cache')) {
      console.warn('Tabel public.releases belum dibuat di Supabase atau belum ada di schema cache. Menggunakan list kosong.');
      return [];
    }
    console.error('Error fetching Sorside releases:', relError);
    throw relError;
  }

  // Also fetch tracks to attach to releases
  const { data: tracksData, error: trackError } = await supabase
    .from('tracks')
    .select('*')
    .order('track_number', { ascending: true });

  if (trackError) {
    // If tracks table is missing, don't crash
    if (trackError.code === 'PGRST205' || trackError.code === '42P01' || trackError.message?.includes('schema cache')) {
      console.warn('Tabel public.tracks belum dibuat di Supabase.');
    } else {
      console.warn('Warning fetching tracks:', trackError);
    }
  }

  const tracksByRelease: Record<string, any[]> = {};
  (tracksData || []).forEach((tr) => {
    const relKey = tr.release_id;
    if (!tracksByRelease[relKey]) {
      tracksByRelease[relKey] = [];
    }
    tracksByRelease[relKey].push({
      id: tr.id,
      release_id: tr.release_id,
      number: tr.track_number ?? 1,
      track_number: tr.track_number ?? 1,
      title: tr.title,
      youtube_url: tr.youtube_url || null,
      lyrics: tr.lyrics || null,
      origin_slug: tr.origin_slug || null,
      created_at: tr.created_at
    });
  });

  return (releasesData || []).map((rel) => {
    const relType: SorsideReleaseType =
      rel.type?.toUpperCase() === 'EP'
        ? 'EP'
        : rel.type?.toUpperCase() === 'ALBUM'
        ? 'ALBUM'
        : 'SINGLE';

    const attachedTracks = tracksByRelease[rel.id] || tracksByRelease[rel.slug] || [];
    const formattedDate = formatReleaseDate(rel.release_date || rel.created_at);
    
    let creditsData = rel.credits;
    if (typeof creditsData === 'string' && creditsData.trim().startsWith('[')) {
      try {
        creditsData = JSON.parse(creditsData);
      } catch {
        // Keep as string
      }
    }

    const creditsText = Array.isArray(creditsData)
      ? creditsData.map((c: any) => `${c.role}: ${c.name}`).join('\n')
      : typeof creditsData === 'object' && creditsData !== null
      ? creditsData.liner_notes || creditsData.text || ''
      : typeof creditsData === 'string'
      ? creditsData
      : '';

    const rawCover = (rel.cover_url || rel.cover || '').trim();
    const resolvedCover = (!rawCover || rawCover === 'cover-all')
      ? DEFAULT_SORSIDE_COVER_URL
      : resolveCoverImageUrl(rawCover);

    return {
      id: rel.id,
      slug: rel.slug || rel.id,
      title: rel.title,
      tagline: rel.tagline || null,
      type: relType,
      release_date: formattedDate,
      catalog_number: rel.catalog_number || null,
      cover_url: resolvedCover,
      cover: resolvedCover,
      cover_art: resolvedCover,
      origin_slug: rel.origin_slug || null,
      lyrics: rel.lyrics || null,
      spotify_url: rel.spotify_url || null,
      apple_music_url: rel.apple_music_url || null,
      youtube_url: rel.youtube_url || null,
      credits: creditsData || [],
      credits_text: creditsText,
      published: rel.published !== undefined ? Boolean(rel.published) : false,
      order_index: rel.order_index ?? 0,
      created_at: rel.created_at,
      song_count: relType === 'SINGLE' ? '1 SONG' : `${attachedTracks.length} ${attachedTracks.length === 1 ? 'SONG' : 'SONGS'}`,
      stream_links: {
        spotify: rel.spotify_url || null,
        apple_music: rel.apple_music_url || null,
        youtube: rel.youtube_url || null
      },
      tracks: attachedTracks
    };
  });
};

/**
 * Upsert (Create or Update) a Music Release in public.releases
 */
export const upsertSorsideRelease = async (
  release: any
): Promise<any> => {
  const cleanSlug = generateSlug(release.slug || release.title || 'release');
  const rawType = (release.type || 'Single').toString().toUpperCase();
  const normalizedType =
    rawType === 'EP'
      ? 'EP'
      : rawType === 'ALBUM'
      ? 'Album'
      : 'Single';

  const creditsJson =
    typeof release.credits === 'object' && release.credits !== null
      ? release.credits
      : release.credits_text
      ? { liner_notes: release.credits_text.trim() }
      : {};

  const orderIndexVal =
    typeof release.order_index === 'number'
      ? release.order_index
      : release.order_index
      ? parseInt(release.order_index, 10)
      : 0;

  const rawCoverInput = (release.cover_url || release.cover_art || release.cover || '').trim();
  const finalCoverUrl = (!rawCoverInput || rawCoverInput === 'cover-all')
    ? DEFAULT_SORSIDE_COVER_URL
    : resolveCoverImageUrl(rawCoverInput);

  const payload: Record<string, any> = {
    slug: cleanSlug,
    title: (release.title || '').trim(),
    tagline: release.tagline?.trim() || null,
    type: normalizedType,
    release_date: formatToPostgresDate(release.release_date || release.date),
    catalog_number: release.catalog_number?.trim() || null,
    cover_url: finalCoverUrl,
    origin_slug: release.origin_slug?.trim() || null,
    lyrics: normalizedType === 'Single' ? (release.lyrics?.trim() || null) : null,
    spotify_url: (release.spotify_url || release.stream_links?.spotify || '').trim() || null,
    apple_music_url: (release.apple_music_url || release.stream_links?.apple_music || '').trim() || null,
    youtube_url: (release.youtube_url || release.stream_links?.youtube || '').trim() || null,
    credits: creditsJson,
    published: release.published !== undefined ? Boolean(release.published) : false,
    order_index: isNaN(orderIndexVal) ? 0 : orderIndexVal
  };

  const isUUID = isUUIDString(release.id);
  if (isUUID && release.id) {
    payload.id = release.id.trim();
  }

  const { data, error } = await supabase
    .from('releases')
    .upsert(payload, { onConflict: isUUID ? 'id' : 'slug' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting Sorside release:', error);
    throw error;
  }

  // If multi-track (EP / Album) and tracks are provided in release object, save all tracks
  const syncedTracks: any[] = [];
  if (Array.isArray(release.tracks) && release.tracks.length > 0 && normalizedType !== 'Single') {
    for (let i = 0; i < release.tracks.length; i++) {
      const trk = release.tracks[i];
      const trackNum = i + 1;
      try {
        const savedTrk = await upsertSorsideTrack({
          ...trk,
          track_number: trackNum,
          number: trackNum,
          title: (trk.title || `Track ${trackNum}`).trim(),
          release_id: data.id
        });
        syncedTracks.push(savedTrk);
      } catch (tErr) {
        console.warn(`Failed to auto-sync track ${trk.title || trackNum} for release ${data.id}:`, tErr);
      }
    }
  }

  const relType: SorsideReleaseType =
    data.type?.toUpperCase() === 'EP'
      ? 'EP'
      : data.type?.toUpperCase() === 'ALBUM'
      ? 'ALBUM'
      : 'SINGLE';

  const creditsData = data.credits;
  const creditsText = Array.isArray(creditsData)
    ? creditsData.map((c: any) => `${c.role}: ${c.name}`).join('\n')
    : typeof creditsData === 'object' && creditsData !== null
    ? creditsData.liner_notes || creditsData.text || ''
    : typeof creditsData === 'string'
    ? creditsData
    : '';

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    tagline: data.tagline || null,
    type: relType,
    release_date: formatReleaseDate(data.release_date || data.created_at),
    catalog_number: data.catalog_number || null,
    cover_url: data.cover_url || finalCoverUrl,
    cover: data.cover_url || finalCoverUrl,
    cover_art: data.cover_url || finalCoverUrl,
    origin_slug: data.origin_slug || null,
    lyrics: data.lyrics || null,
    spotify_url: data.spotify_url || null,
    apple_music_url: data.apple_music_url || null,
    youtube_url: data.youtube_url || null,
    credits: creditsData || [],
    credits_text: creditsText,
    published: Boolean(data.published),
    order_index: data.order_index ?? 0,
    created_at: data.created_at,
    song_count: relType === 'SINGLE' ? '1 SONG' : `${(release.tracks || []).length} SONGS`,
    stream_links: {
      spotify: data.spotify_url || null,
      apple_music: data.apple_music_url || null,
      youtube: data.youtube_url || null
    },
    tracks: syncedTracks.length > 0 ? syncedTracks : (release.tracks || [])
  };
};

/**
 * Delete a music release by ID or slug
 */
export const deleteSorsideRelease = async (id: string): Promise<void> => {
  const isUUID = isUUIDString(id);
  const query = supabase.from('releases').delete();
  const { error } = isUUID ? await query.eq('id', id) : await query.eq('slug', id);

  if (error) {
    console.error('Error deleting Sorside release:', error);
    throw error;
  }
};

/**
 * Upsert a single track in public.tracks
 */
export const upsertSorsideTrack = async (track: any): Promise<any> => {
  let targetReleaseId = track.release_id;
  
  // If release_id is not a UUID, resolve it by searching releases by slug
  if (!isUUIDString(targetReleaseId) && targetReleaseId) {
    const { data: relData } = await supabase
      .from('releases')
      .select('id')
      .eq('slug', targetReleaseId)
      .maybeSingle();

    if (relData?.id) {
      targetReleaseId = relData.id;
    }
  }

  // Safety guard: release_id in PostgreSQL is UUID. If still not a valid UUID, don't pass invalid string syntax
  if (!isUUIDString(targetReleaseId)) {
    throw new Error(
      `Track "${track.title || 'Untitled'}" belum dapat disimpan: Album/EP harus disimpan terlebih dahulu agar terdaftar di database.`
    );
  }

  const trackNum = Number(track.track_number ?? track.number) || 1;
  const trackPayload: Record<string, any> = {
    release_id: targetReleaseId,
    track_number: trackNum,
    title: (track.title || `Track ${trackNum}`).trim(),
    youtube_url: track.youtube_url?.trim() || null,
    lyrics: track.lyrics?.trim() || null,
    origin_slug: track.origin_slug?.trim() || null
  };

  const isUUID = isUUIDString(track.id);
  if (isUUID && track.id) {
    trackPayload.id = track.id.trim();
  }

  const query = isUUID
    ? supabase.from('tracks').upsert(trackPayload, { onConflict: 'id' })
    : supabase.from('tracks').insert(trackPayload);

  const { data, error } = await query.select().single();

  if (error) {
    console.error('Error upserting track:', error);
    throw error;
  }

  return {
    id: data.id,
    release_id: data.release_id,
    number: data.track_number ?? 1,
    track_number: data.track_number ?? 1,
    title: data.title,
    youtube_url: data.youtube_url || null,
    lyrics: data.lyrics || null,
    origin_slug: data.origin_slug || null,
    created_at: data.created_at
  };
};

/**
 * Delete a track by ID
 */
export const deleteSorsideTrack = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting track:', error);
    throw error;
  }
};

/**
 * Parses release date / year / created_at timestamp for chronological ordering.
 */
export const getReleaseTimestamp = (rel: SorsideRelease): number => {
  const dStr = (rel.release_date || rel.year || '').trim();
  if (dStr) {
    // Check DD-MM-YYYY format
    const dmy = dStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmy) {
      return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)).getTime();
    }
    const parsed = Date.parse(dStr);
    if (!isNaN(parsed)) return parsed;

    // Check 4-digit year only
    const yearMatch = dStr.match(/(\d{4})/);
    if (yearMatch) {
      return new Date(parseInt(yearMatch[1], 10), 0, 1).getTime();
    }
  }
  if (rel.created_at) {
    const parsed = Date.parse(rel.created_at);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
};

/**
 * Auto-generate next catalog number based on existing releases.
 * Detects patterns like SS-001, SS-002, etc. (defaults to 'SS-' + pad3)
 * Guarantees that the returned catalog number is not already used.
 */
export const getNextCatalogNumber = (
  existingReleases: SorsideRelease[] = [],
  currentReleaseId?: string
): string => {
  const otherReleases = existingReleases.filter(
    (r) => !currentReleaseId || (r.id !== currentReleaseId && r.slug !== currentReleaseId)
  );

  let prefix = 'SS-';
  let padLength = 3;
  let maxNum = 0;

  for (const rel of otherReleases) {
    const cat = (rel.catalog_number || '').trim();
    if (!cat) continue;

    // Match prefix and number e.g. "SS-001", "SS-1", "SOR-005"
    const match = cat.match(/^([A-Za-z]+[-_]?\s*)(\d+)$/);
    if (match) {
      prefix = match[1];
      const digits = match[2];
      padLength = Math.max(padLength, digits.length);
      const num = parseInt(digits, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    } else {
      // Fallback: extract any trailing digits
      const digitsMatch = cat.match(/(\d+)/);
      if (digitsMatch) {
        const num = parseInt(digitsMatch[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let candidateNum = maxNum + 1;
  // Ensure strict uniqueness across all other releases
  while (true) {
    const candidate = `${prefix}${String(candidateNum).padStart(padLength, '0')}`;
    const exists = otherReleases.some(
      (r) => (r.catalog_number || '').trim().toUpperCase() === candidate.toUpperCase()
    );
    if (!exists) {
      return candidate;
    }
    candidateNum++;
  }
};

/**
 * Auto-generate next order index based on existing releases.
 * Finds the highest order_index and increments by 1.
 * Guarantees that the returned number is strictly positive and unique.
 */
export const getNextOrderIndex = (
  existingReleases: SorsideRelease[] = [],
  currentReleaseId?: string
): number => {
  const otherReleases = existingReleases.filter(
    (r) => !currentReleaseId || (r.id !== currentReleaseId && r.slug !== currentReleaseId)
  );

  let maxOrder = 0;
  for (const rel of otherReleases) {
    const val =
      typeof rel.order_index === 'number'
        ? rel.order_index
        : parseInt(String(rel.order_index || 0), 10);
    if (!isNaN(val) && val > maxOrder) {
      maxOrder = val;
    }
  }

  let candidateOrder = maxOrder + 1;
  if (candidateOrder <= 0) candidateOrder = 1;

  // Ensure strict uniqueness
  while (true) {
    const exists = otherReleases.some((r) => {
      const val =
        typeof r.order_index === 'number'
          ? r.order_index
          : parseInt(String(r.order_index || 0), 10);
      return val === candidateOrder;
    });
    if (!exists) {
      return candidateOrder;
    }
    candidateOrder++;
  }
};

/**
 * Checks if a catalog number is already in use by another release.
 */
export const findDuplicateCatalogNumber = (
  catalogNumber: string,
  existingReleases: SorsideRelease[] = [],
  currentReleaseId?: string
): SorsideRelease | null => {
  const trimmed = catalogNumber.trim().toUpperCase();
  if (!trimmed) return null;

  return (
    existingReleases.find((r) => {
      if (currentReleaseId && (r.id === currentReleaseId || r.slug === currentReleaseId)) {
        return false;
      }
      return (r.catalog_number || '').trim().toUpperCase() === trimmed;
    }) || null
  );
};

/**
 * Checks if an order index is already in use by another release.
 */
export const findDuplicateOrderIndex = (
  orderIndex: number | string,
  existingReleases: SorsideRelease[] = [],
  currentReleaseId?: string
): SorsideRelease | null => {
  const num =
    typeof orderIndex === 'number'
      ? orderIndex
      : parseInt(String(orderIndex).trim(), 10);
  if (isNaN(num) || num <= 0) return null;

  return (
    existingReleases.find((r) => {
      if (currentReleaseId && (r.id === currentReleaseId || r.slug === currentReleaseId)) {
        return false;
      }
      const val =
        typeof r.order_index === 'number'
          ? r.order_index
          : parseInt(String(r.order_index || 0), 10);
      return val === num;
    }) || null
  );
};

/**
 * Checks if there are any duplicate catalog numbers or order indexes in the releases list.
 */
export const checkReleaseDuplicates = (
  releases: SorsideRelease[] = []
): {
  hasDuplicates: boolean;
  duplicateCatalogs: string[];
  duplicateOrders: number[];
} => {
  const catalogCounts: Record<string, number> = {};
  const orderCounts: Record<number, number> = {};

  for (const rel of releases) {
    const cat = (rel.catalog_number || '').trim().toUpperCase();
    if (cat) {
      catalogCounts[cat] = (catalogCounts[cat] || 0) + 1;
    }
    const ord =
      typeof rel.order_index === 'number'
        ? rel.order_index
        : parseInt(String(rel.order_index || 0), 10);
    if (!isNaN(ord)) {
      orderCounts[ord] = (orderCounts[ord] || 0) + 1;
    }
  }

  const duplicateCatalogs = Object.keys(catalogCounts).filter((k) => catalogCounts[k] > 1);
  const duplicateOrders = Object.keys(orderCounts)
    .map(Number)
    .filter((k) => orderCounts[k] > 1);

  return {
    hasDuplicates: duplicateCatalogs.length > 0 || duplicateOrders.length > 0,
    duplicateCatalogs,
    duplicateOrders
  };
};

/**
 * Auto-resequence all releases chronologically by date (oldest to newest):
 * - Oldest gets SS-001 and order_index 1
 * - Next gets SS-002 and order_index 2
 * - Newest gets highest order_index
 * This ensures all releases in Supabase have strictly unique, sequential numbers.
 */
export const autoResequenceAllReleases = async (
  releases: SorsideRelease[]
): Promise<SorsideRelease[]> => {
  if (!releases || releases.length === 0) return [];

  // Sort chronologically by release_date (oldest first)
  const sorted = [...releases].sort((a, b) => {
    const timeA = getReleaseTimestamp(a);
    const timeB = getReleaseTimestamp(b);
    if (timeA !== timeB) return timeA - timeB;
    return (a.title || '').localeCompare(b.title || '');
  });

  // Determine which releases actually need updates
  const itemsToUpdate: Array<{
    rel: SorsideRelease;
    newOrderIndex: number;
    newCatalogNumber: string;
  }> = [];

  for (let i = 0; i < sorted.length; i++) {
    const rel = sorted[i];
    const newOrderIndex = i + 1;
    const newCatalogNumber = `SS-${String(i + 1).padStart(3, '0')}`;

    const currentOrder =
      typeof rel.order_index === 'number'
        ? rel.order_index
        : parseInt(String(rel.order_index || 0), 10);
    const currentCat = (rel.catalog_number || '').trim().toUpperCase();

    if (currentOrder !== newOrderIndex || currentCat !== newCatalogNumber) {
      itemsToUpdate.push({ rel, newOrderIndex, newCatalogNumber });
    }
  }

  // Helper to update a release by ID, falling back to slug
  const updateReleaseRow = async (
    rel: SorsideRelease,
    data: { order_index: number; catalog_number: string }
  ) => {
    // 1. Try by primary key id
    if (rel.id) {
      const res = await supabase.from('releases').update(data).eq('id', rel.id);
      if (!res.error) return;
      // If error was NOT related to column missing or not found, check slug fallback
      if (!rel.slug || rel.slug === rel.id) {
        throw res.error;
      }
    }

    // 2. Fallback to slug if id wasn't matched
    if (rel.slug) {
      const resSlug = await supabase.from('releases').update(data).eq('slug', rel.slug);
      if (resSlug.error) {
        throw resSlug.error;
      }
    }
  };

  // Pass 1: If multiple items need update, assign temporary unique negative order indexes
  // and temporary catalog numbers to safely bypass any UNIQUE constraints in Postgres
  if (itemsToUpdate.length > 1) {
    for (let i = 0; i < itemsToUpdate.length; i++) {
      const { rel } = itemsToUpdate[i];
      try {
        await updateReleaseRow(rel, {
          order_index: -(i + 1000),
          catalog_number: `TMP-${rel.id.slice(0, 8)}-${i + 1}`
        });
      } catch (pass1Err) {
        console.warn(`Pass 1 temp resequence warning for "${rel.title}":`, pass1Err);
        // Continue to pass 2
      }
    }
  }

  // Pass 2: Apply final target order_index and catalog_number
  for (const item of itemsToUpdate) {
    try {
      await updateReleaseRow(item.rel, {
        order_index: item.newOrderIndex,
        catalog_number: item.newCatalogNumber
      });
    } catch (err: any) {
      console.error(`Failed to update release "${item.rel.title}":`, err);
      throw new Error(`Gagal memperbarui "${item.rel.title}": ${err.message || 'Error Supabase'}`);
    }
  }

  const updatedReleases = sorted.map((rel, idx) => ({
    ...rel,
    order_index: idx + 1,
    catalog_number: `SS-${String(idx + 1).padStart(3, '0')}`
  }));

  // Return sorted according to discography display order (order_index descending, so newest first)
  return updatedReleases.sort((a, b) => (b.order_index || 0) - (a.order_index || 0));
};


