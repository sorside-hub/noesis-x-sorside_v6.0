import { Schema, Node as ProsemirrorNode } from '@tiptap/pm/model';

export type DetectedMedia =
  | { type: 'audio'; src: string; title: string }
  | { type: 'document'; src: string; title: string; filename: string }
  | { type: 'image'; src: string; alt: string; title: string };

const AUDIO_EXT_REGEX = /\.(mp3|wav|m4a|ogg|aac|flac|webm|opus)(\?.*)?$/i;
const DOC_EXT_REGEX = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf|odt|ods|odp|zip|rar|7z|tar|gz|json)(\?.*)?$/i;
const IMAGE_EXT_REGEX = /\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/i;

/**
 * Membersihkan nama file menjadi judul yang rapi
 */
export function cleanMediaTitle(raw: string): string {
  return raw
    .replace(/^📄\s*/, '')
    .replace(/\.[^/.]+$/, '')
    .replace(/^(audio|voice|doc|document|file|image|media)_/i, '')
    .replace(/_\d{10,13}(_[a-z0-9]+)?$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();
}

/**
 * Deteksi apakah sebuah URL (dengan opsional judul) adalah media audio, dokumen, atau gambar
 */
export function detectMediaUrl(url: string, explicitTitle?: string): DetectedMedia | null {
  const trimmedUrl = url.trim();
  if (!/^https?:\/\/[^\s]+|blob:[^\s]+/i.test(trimmedUrl)) {
    return null;
  }

  const filename = trimmedUrl.split('/').pop()?.split('?')[0] || '';
  const fallbackTitle = cleanMediaTitle(filename) || 'Lampiran';
  const title = explicitTitle?.trim() || fallbackTitle;

  const isSupabaseAttachment = trimmedUrl.includes('/storage/v1/object/public/noesis-attachments/');

  // 1. Audio check
  const isAudioExt = AUDIO_EXT_REGEX.test(trimmedUrl);
  const isSupabaseAudio = isSupabaseAttachment && (trimmedUrl.includes('audio_') || trimmedUrl.includes('voice_') || isAudioExt);
  if (isAudioExt || isSupabaseAudio) {
    return {
      type: 'audio',
      src: trimmedUrl,
      title: title || 'Voice Note',
    };
  }

  // 2. Image check
  const isImageExt = IMAGE_EXT_REGEX.test(trimmedUrl);
  const isSupabaseImage = isSupabaseAttachment && (trimmedUrl.includes('image_') || isImageExt);
  if (isImageExt || isSupabaseImage) {
    return {
      type: 'image',
      src: trimmedUrl,
      alt: title || 'Gambar',
      title: title || 'Gambar',
    };
  }

  // 3. Document check
  const isDocExt = DOC_EXT_REGEX.test(trimmedUrl);
  const isSupabaseDoc = isSupabaseAttachment && !isAudioExt && !isImageExt;
  if (isDocExt || isSupabaseDoc) {
    return {
      type: 'document',
      src: trimmedUrl,
      title: title || 'Dokumen',
      filename: filename || 'dokumen',
    };
  }

  return null;
}

/**
 * Menganalisis string teks yang dimasukkan (baik markdown `[Title](url)`, `![Alt](url)`, maupun raw URL)
 */
export function detectMediaFromText(rawText: string): DetectedMedia | null {
  const text = rawText.trim();
  if (!text) return null;

  // 1. Markdown Image: ![Alt](url)
  const imgMarkdownMatch = text.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+|blob:[^\s)]+)\)$/);
  if (imgMarkdownMatch) {
    const alt = imgMarkdownMatch[1]?.trim() || '';
    const url = imgMarkdownMatch[2]?.trim();
    const detected = detectMediaUrl(url, alt);
    if (detected && detected.type === 'image') {
      return detected;
    }
    // Fallback jika ekstensi tidak standar tapi menggunakan sintaks ![alt](url)
    return {
      type: 'image',
      src: url,
      alt: alt || 'Gambar',
      title: alt || 'Gambar',
    };
  }

  // 2. Markdown Link / Pill: [Title](url) atau 📄 [Title](url)
  const linkMarkdownMatch = text.match(/^(?:📄\s*)?\[([^\]]+)\]\((https?:\/\/[^\s)]+|blob:[^\s)]+)\)$/);
  if (linkMarkdownMatch) {
    const title = linkMarkdownMatch[1]?.trim() || '';
    const url = linkMarkdownMatch[2]?.trim();
    return detectMediaUrl(url, title);
  }

  // 3. Raw URL
  const rawUrlMatch = text.match(/^(https?:\/\/[^\s]+|blob:[^\s]+)$/);
  if (rawUrlMatch) {
    return detectMediaUrl(rawUrlMatch[1]);
  }

  return null;
}

/**
 * Membuat Prosemirror Node sesuai schema editor
 */
export function createMediaNode(schema: Schema, media: DetectedMedia): ProsemirrorNode | null {
  try {
    if (media.type === 'audio') {
      if (schema.nodes.audio) {
        return schema.nodes.audio.create({
          src: media.src,
          title: media.title,
        });
      }
    } else if (media.type === 'document') {
      if (schema.nodes.documentNode) {
        return schema.nodes.documentNode.create({
          src: media.src,
          title: media.title,
          filename: media.filename,
        });
      }
    } else if (media.type === 'image') {
      if (schema.nodes.image) {
        return schema.nodes.image.create({
          src: media.src,
          alt: media.alt,
          title: media.title,
        });
      }
    }
  } catch (err) {
    console.error('Failed to create media node:', err);
  }
  return null;
}
