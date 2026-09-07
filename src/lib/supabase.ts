import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'noesis_supabase_url';
const STORAGE_KEY_KEY = 'noesis_supabase_anon_key';

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isCustom: boolean;
  isEnvAvailable: boolean;
  isConfigured: boolean;
  activeSource: 'custom' | 'env' | 'placeholder';
}

export const getSupabaseConfig = (): SupabaseConfigState => {
  const customUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
  const customAnonKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const isCustom = Boolean(customUrl && customAnonKey);
  const isEnvAvailable = Boolean(envUrl && envAnonKey);

  let activeSource: 'custom' | 'env' | 'placeholder' = 'placeholder';
  let url = 'https://placeholder.supabase.co';
  let anonKey = 'placeholder_key';

  if (isCustom) {
    activeSource = 'custom';
    url = customUrl;
    anonKey = customAnonKey;
  } else if (isEnvAvailable) {
    activeSource = 'env';
    url = envUrl;
    anonKey = envAnonKey;
  }

  const isConfigured = activeSource !== 'placeholder';

  return {
    url,
    anonKey,
    isCustom,
    isEnvAvailable,
    isConfigured,
    activeSource
  };
};

let currentClient: SupabaseClient = createClient(
  getSupabaseConfig().url,
  getSupabaseConfig().anonKey
);

export const reinitSupabaseClient = (): SupabaseClient => {
  const config = getSupabaseConfig();
  currentClient = createClient(config.url, config.anonKey);
  window.dispatchEvent(new Event('supabase-client-changed'));
  return currentClient;
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  const cleanUrl = url.trim().replace(/\/$/, '');
  const cleanKey = anonKey.trim();
  localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
  localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  reinitSupabaseClient();
};

export const resetSupabaseConfig = () => {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_KEY_KEY);
  reinitSupabaseClient();
};

export const testSupabaseConnection = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; latencyMs?: number }> => {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      return { success: false, message: 'URL proyek dan Anon Key wajib diisi.' };
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return { success: false, message: 'URL harus diawali dengan https:// atau http://' };
    }

    const start = performance.now();
    const res = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`
      }
    });

    const latencyMs = Math.round(performance.now() - start);

    if (res.status === 200 || res.status === 404) {
      return {
        success: true,
        message: 'Koneksi ke Supabase berhasil terhubung!',
        latencyMs
      };
    } else if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        message: 'Autentikasi gagal: Anon Key tidak valid atau tidak memiliki izin.',
        latencyMs
      };
    } else {
      return {
        success: false,
        message: `Server Supabase merespons kode status ${res.status}.`,
        latencyMs
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghubungi URL Supabase. Periksa format URL dan koneksi internet.'
    };
  }
};

// Proxy export so all modules using `supabase` dynamically target the active client
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = (currentClient as any)[prop];
    if (typeof value === 'function') {
      return value.bind(currentClient);
    }
    return value;
  }
});

