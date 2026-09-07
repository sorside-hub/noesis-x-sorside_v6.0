import { supabase, getSupabaseConfig } from './supabase';

const BUCKET_NAME = 'noesis-attachments';

/**
 * Menghasilkan slug URL yang aman dari judul atau nama file
 */
export const generateSafeSlug = (title?: string, defaultPrefix: string = 'media'): string => {
  if (!title || !title.trim()) return defaultPrefix;
  
  const nameWithoutExt = title.trim().replace(/\.[^/.]+$/, '');
  const slug = nameWithoutExt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 45);
    
  return slug || defaultPrefix;
};

/**
 * Mengunggah file Blob/File audio ke Supabase Storage
 */
export const uploadAudioBlob = async (
  file: Blob | File, 
  extension: string = 'webm',
  customTitle?: string
): Promise<string> => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Silakan atur koneksi Supabase di Pengaturan.');
  }

  const slug = generateSafeSlug(customTitle, 'audio');
  const fileName = `${slug}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension.toLowerCase()}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '31536000', // Cache 1 tahun
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Gagal mengunggah media: ${error.message}`);
  }

  // Dapatkan URL publik
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

/**
 * Mengunggah audio dari format Base64 ke Supabase Storage
 */
export const uploadBase64Audio = async (base64: string, mimeType: string): Promise<string> => {
  try {
    // Decode base64
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Tentukan ekstensi
    const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm';
    
    // Buat Blob
    const blob = new Blob([bytes], { type: mimeType });
    
    return await uploadAudioBlob(blob, ext);
  } catch (error: any) {
    throw new Error(`Gagal memproses audio untuk diunggah: ${error.message}`);
  }
};
export const deleteMediaByUrl = async (url: string): Promise<boolean> => {
  try {
    const config = getSupabaseConfig();
    if (!config.isConfigured) return false;

    // URL format: https://[ID].supabase.co/storage/v1/object/public/noesis-attachments/audio_123.webm
    const bucketStr = `/storage/v1/object/public/${BUCKET_NAME}/`;
    if (!url.includes(bucketStr)) return false;

    const path = url.split(bucketStr)[1];
    if (!path) return false;

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    
    if (error) {
      console.error('Failed to delete media from Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteMediaByUrl:', error);
    return false;
  }
};

import { db } from './db';


export const saveMediaMetadata = async (url: string, title: string, type: string = 'audio') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    // Save to IndexedDB
    await db.media_attachments.put({
      id,
      title,
      url,
      type,
      createdAt
    });
    
    // Save to Supabase
    if (userId) {
      const { error } = await supabase.from('media_attachments').insert([{
        id,
        title,
        url,
        type,
        created_at: createdAt,
        user_id: userId
      }]);
      if (error) {
        if (error.code === 'PGRST205') {
          console.warn('Skipping media_attachments sync (table does not exist in Supabase yet). Please run the Setup SQL in Settings.');
        } else {
          console.error('Failed to sync media attachment to Supabase:', error);
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('media-updated'));
    }
  } catch (error) {
    console.error('Failed to save media metadata:', error);
  }
};

/**
 * Menyimpan Voice Memo (rekaman suara cepat) ke Supabase Storage dan IndexedDB
 */
export const saveVoiceMemo = async (
  audioBlobOrBase64: Blob | string,
  mimeType: string = 'audio/webm',
  title?: string
): Promise<{ id: string; url: string; title: string }> => {
  const finalTitle = title?.trim() || `Voice Memo ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  
  let publicUrl = '';
  const config = getSupabaseConfig();
  
  if (config.isConfigured) {
    try {
      if (typeof audioBlobOrBase64 === 'string') {
        publicUrl = await uploadBase64Audio(audioBlobOrBase64, mimeType);
      } else {
        const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm';
        publicUrl = await uploadAudioBlob(audioBlobOrBase64, ext);
      }
    } catch (err) {
      console.warn('Failed uploading to Supabase, falling back to local Blob URL:', err);
    }
  }

  // Fallback to Data URL if Supabase is not configured or upload failed
  if (!publicUrl) {
    if (typeof audioBlobOrBase64 === 'string') {
      publicUrl = `data:${mimeType};base64,${audioBlobOrBase64}`;
    } else {
      publicUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlobOrBase64);
      });
    }
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Simpan ke IndexedDB lokal
  await db.media_attachments.put({
    id,
    title: finalTitle,
    url: publicUrl,
    type: 'voice_memo',
    createdAt
  });

  // Simpan ke Supabase table jika user login & url bukan data URL lokal
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId && !publicUrl.startsWith('data:')) {
      const { error } = await supabase.from('media_attachments').insert([{
        id,
        title: finalTitle,
        url: publicUrl,
        type: 'voice_memo',
        created_at: createdAt,
        user_id: userId
      }]);
      if (error && error.code !== 'PGRST205') {
        console.warn('Failed syncing voice memo to Supabase table:', error);
      }
    }
  } catch (err) {
    console.warn('Error syncing voice memo to remote table:', err);
  }

  return { id, url: publicUrl, title: finalTitle };
};


/**
 * Mengunggah sebarang jenis file (audio, gambar, dokumen) ke Supabase Storage & menyimpan metadata
 */
export const uploadMediaFile = async (file: File, customTitle?: string): Promise<string> => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Silakan atur koneksi Supabase di Pengaturan.');
  }
  const fileExt = file.name.split('.').pop() || 'bin';
  let type = 'document';
  if (file.type.startsWith('image/')) type = 'image';
  else if (file.type.startsWith('audio/')) type = 'audio';
  else if (file.type.startsWith('video/')) type = 'video';

  const title = customTitle?.trim() || file.name.replace(/\.[^/.]+$/, '') || 'Lampiran';
  const slug = generateSafeSlug(title, type);
  const fileName = `${slug}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt.toLowerCase()}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '31536000',
      upsert: false
    });
  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Gagal mengunggah media: ${error.message}`);
  }
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  await saveMediaMetadata(publicUrlData.publicUrl, title, type);
  return publicUrlData.publicUrl;
};

/**
 * Menghapus media secara permanen dari IndexedDB, Supabase Table, dan Supabase Storage
 */
export const deleteMediaAttachment = async (id: string, url: string): Promise<boolean> => {
  try {
    // 1. Hapus file fisik dari Supabase Storage terlebih dahulu untuk mencegah file yatim (orphan file)
    if (url) {
      await deleteMediaByUrl(url);
    }

    // 2. Hapus baris metadata dari Supabase Table jika terautentikasi
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      const { error } = await supabase.from('media_attachments').delete().match({ id, user_id: userId });
      if (error && error.code !== 'PGRST205') {
        await supabase.from('media_attachments').delete().match({ url, user_id: userId });
      }
    }

    // 3. Hapus baris metadata dari IndexedDB lokal
    await db.media_attachments.delete(id);

    // Trigger event ke UI
    window.dispatchEvent(new Event('media-updated'));
    return true;
  } catch (err) {
    console.error('Error deleting media attachment:', err);
    return false;
  }
};

export const moveMediaToTrash = async (id: string): Promise<boolean> => {
  try {
    const deletedAt = Date.now();
    let localItem = await db.media_attachments.get(id);
    if (!localItem) {
      localItem = await db.media_attachments.where('id').equals(id).first();
    }

    if (localItem) {
      await db.media_attachments.update(localItem.id, { deletedAt });
    } else {
      await db.media_attachments.update(id, { deletedAt });
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      const deletedAtIso = new Date(deletedAt).toISOString();
      // Update by ID first
      const { data: updatedById, error: errById } = await supabase
        .from('media_attachments')
        .update({ deleted_at: deletedAtIso })
        .match({ id, user_id: userId })
        .select();

      if (!errById && (!updatedById || updatedById.length === 0) && localItem?.url) {
        // Update by URL if ID match didn't find any row
        const { data: updatedByUrl, error: errByUrl } = await supabase
          .from('media_attachments')
          .update({ deleted_at: deletedAtIso })
          .match({ url: localItem.url, user_id: userId })
          .select();

        if (!errByUrl && (!updatedByUrl || updatedByUrl.length === 0) && localItem) {
          // If record doesn't exist in Supabase at all, upsert it with deleted_at
          await supabase.from('media_attachments').upsert([{
            id: localItem.id,
            title: localItem.title,
            url: localItem.url,
            type: localItem.type,
            created_at: localItem.createdAt || new Date().toISOString(),
            deleted_at: deletedAtIso,
            user_id: userId
          }]);
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Error moving media to trash:', err);
    return false;
  }
};

export const restoreMediaFromTrash = async (id: string): Promise<boolean> => {
  try {
    let localItem = await db.media_attachments.get(id);
    if (!localItem) {
      localItem = await db.media_attachments.where('id').equals(id).first();
    }

    if (localItem) {
      await db.media_attachments.update(localItem.id, { deletedAt: undefined });
    } else {
      await db.media_attachments.update(id, { deletedAt: undefined });
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      const { data: updatedById, error: errById } = await supabase
        .from('media_attachments')
        .update({ deleted_at: null })
        .match({ id, user_id: userId })
        .select();

      if (!errById && (!updatedById || updatedById.length === 0) && localItem?.url) {
        await supabase
          .from('media_attachments')
          .update({ deleted_at: null })
          .match({ url: localItem.url, user_id: userId });
      }
    }
    return true;
  } catch (err) {
    console.error('Error restoring media:', err);
    return false;
  }
};

export const renameMediaAttachment = async (id: string, newTitle: string): Promise<boolean> => {
  try {
    await db.media_attachments.update(id, { title: newTitle });
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { error } = await supabase.from('media_attachments').update({ title: newTitle }).match({ id });
      if (error && error.code !== 'PGRST205') {
        console.warn('Failed to rename media row in Supabase:', error);
      }
    }
    return true;
  } catch (err) {
    console.error('Error renaming media attachment:', err);
    return false;
  }
};

/**
 * Pindai (Scan) file di Supabase Storage & tabel media_attachments
 * dan sinkronkan dengan database lokal jika ada file yang belum terdaftar.
 */
export const syncMediaFromSupabaseStorage = async (): Promise<{ syncedCount: number; message: string }> => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Silakan atur koneksi Supabase di Pengaturan.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  // 1. Ambil semua media lokal
  const localItems = await db.media_attachments.toArray();
  const localUrlSet = new Set(localItems.map(i => i.url));

  let newSynced = 0;
  let removedCount = 0;

  const validCloudUrls = new Set<string>();
  const validCloudIds = new Set<string>();

  // 2. Cek baris di tabel database Supabase jika pengguna sudah login
  let remoteRowsFetched = false;
  if (userId) {
    const { data: remoteRows, error: remoteErr } = await supabase
      .from('media_attachments')
      .select('*');

    if (!remoteErr && remoteRows) {
      remoteRowsFetched = true;
      for (const row of remoteRows) {
        const deletedAt = row.deleted_at ? new Date(row.deleted_at).getTime() : undefined;
        const localItem = localItems.find(i => i.url === row.url || i.id === row.id);

        if (!deletedAt) {
          validCloudUrls.add(row.url);
          if (row.id) validCloudIds.add(row.id);
        }

        if (!localUrlSet.has(row.url) && !localItem) {
          await db.media_attachments.put({
            id: row.id || crypto.randomUUID(),
            title: row.title || 'Lampiran',
            url: row.url,
            type: row.type || 'audio',
            createdAt: row.created_at || new Date().toISOString(),
            deletedAt
          });
          localUrlSet.add(row.url);
          newSynced++;
        } else if (localItem) {
          if (deletedAt && !localItem.deletedAt) {
            await db.media_attachments.update(localItem.id, { deletedAt });
          }
        }
      }
    }
  }

  // 3. Pindai file langsung dari Supabase Storage Bucket
  const { data: storageFiles, error: storageErr } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  if (storageErr) {
    console.warn('Gagal membaca isi storage bucket:', storageErr);
  } else if (storageFiles && storageFiles.length > 0) {
    for (const file of storageFiles) {
      if (file.name === '.emptyFolderPlaceholder') continue;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file.name);

      const publicUrl = publicUrlData.publicUrl;
      validCloudUrls.add(publicUrl);

      if (!localUrlSet.has(publicUrl)) {
        // Tentukan tipe
        const nameLower = file.name.toLowerCase();
        const ext = nameLower.split('.').pop() || '';
        let type = 'document';
        if (['mp3', 'm4a', 'wav', 'webm', 'ogg', 'aac', 'flac'].includes(ext) || nameLower.startsWith('audio_')) {
          type = 'audio';
        } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext) || nameLower.startsWith('image_')) {
          type = 'image';
        } else if (['mp4', 'mov', 'mkv', 'avi'].includes(ext) || nameLower.startsWith('video_')) {
          type = 'video';
        }

        const title = file.name.replace(/\.[^/.]+$/, '') || 'Lampiran Storage';
        const createdAt = file.created_at || new Date().toISOString();
        const id = crypto.randomUUID();

        // Simpan ke IndexedDB lokal
        await db.media_attachments.put({
          id,
          title,
          url: publicUrl,
          type,
          createdAt
        });

        // Simpan ke Supabase DB
        if (userId) {
          const { error: insErr } = await supabase.from('media_attachments').insert([{
            id,
            title,
            url: publicUrl,
            type,
            created_at: createdAt,
            user_id: userId
          }]);
          if (insErr && insErr.code !== 'PGRST205') {
            console.warn('Failed inserting scanned media to supabase table:', insErr);
          }
        }

        localUrlSet.add(publicUrl);
        newSynced++;
      }
    }
  }

  // 4. Bersihkan media lokal yang sudah tidak ada di Supabase DB maupun Cloud Storage
  if (remoteRowsFetched) {
    for (const localItem of localItems) {
      if (!validCloudUrls.has(localItem.url) && !validCloudIds.has(localItem.id)) {
        await db.media_attachments.delete(localItem.id);
        removedCount++;
      }
    }
  }

  window.dispatchEvent(new Event('media-updated'));

  let message = 'Semua file di Cloud Storage sudah tersinkronisasi.';
  if (newSynced > 0 && removedCount > 0) {
    message = `Menyinkronkan storage: +${newSynced} media baru, -${removedCount} media terhapus.`;
  } else if (newSynced > 0) {
    message = `Berhasil menemukan & menyinkronkan ${newSynced} file dari Cloud Storage!`;
  } else if (removedCount > 0) {
    message = `Membersihkan ${removedCount} media yang sudah terhapus di Cloud Storage.`;
  }

  return {
    syncedCount: newSynced,
    message
  };
};
