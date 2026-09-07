import { 
  KeySlotId, 
  KeySlotInfo, 
  KeyCheckResult, 
  SystemKeysOverviewResponse 
} from './types';

const STORAGE_KEY_PREFIX = 'noesis_api_key_';

/**
 * Get custom API key stored in localStorage (if user provided custom key in UI)
 */
export function getLocalKeyOverride(slotId: KeySlotId): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${slotId}`) || '';
}

/**
 * Save custom API key to localStorage
 */
export function setLocalKeyOverride(slotId: KeySlotId, apiKey: string): void {
  if (typeof window === 'undefined') return;
  if (apiKey.trim()) {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${slotId}`, apiKey.trim());
  } else {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${slotId}`);
  }
}

/**
 * Mask API Key for secure display in UI (e.g., AIzaSy...x9A1)
 */
export function maskApiKey(key: string): string {
  if (!key) return 'Tidak diatur';
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

/**
 * Get all custom API keys stored in localStorage
 */
export function getAllLocalKeyOverrides(): Partial<Record<KeySlotId, string>> {
  return {
    groq_primary: getLocalKeyOverride('groq_primary'),
    groq_secondary: getLocalKeyOverride('groq_secondary'),
    gemini: getLocalKeyOverride('gemini'),
  };
}

/**
 * Cache in-memory for the keys overview to prevent spamming the API on every Settings mount.
 * Cache lasts for the entire app session until manually refreshed.
 */
let cachedOverview: SystemKeysOverviewResponse | null = null;

/**
 * Request server to check health status of API keys
 */
export async function checkAllKeysOverview(forceRefresh = false): Promise<SystemKeysOverviewResponse> {
  const customKeys: Record<string, string> = {
    groq_primary: getLocalKeyOverride('groq_primary'),
    groq_secondary: getLocalKeyOverride('groq_secondary'),
    gemini: getLocalKeyOverride('gemini'),
  };

  // Check cache first (returns cache if it exists and we are not forcing a refresh)
  if (!forceRefresh && cachedOverview) {
    return cachedOverview;
  }

  try {
    const res = await fetch('/api/keys/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customKeys }),
    });

    if (!res.ok) {
      throw new Error(`Server status HTTP ${res.status}`);
    }

    const data = await res.json();
    
    // Save to cache
    cachedOverview = data;

    return data;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Gagal terhubung ke server API';
    // Fallback response if endpoint fails or offline
    const now = new Date().toISOString();
    return {
      ok: false,
      timestamp: now,
      slots: {
        groq_primary: {
          id: 'groq_primary',
          label: 'Groq API Key (Primary)',
          envVarName: 'GROQ_API_KEY',
          isCustom: !!customKeys.groq_primary,
          maskedKey: maskApiKey(customKeys.groq_primary),
          status: 'error',
          message: errorMessage,
          lastCheckedAt: now,
        },
        groq_secondary: {
          id: 'groq_secondary',
          label: 'Groq API Key (Secondary)',
          envVarName: 'GROQ_API_KEY_SECONDARY',
          isCustom: !!customKeys.groq_secondary,
          maskedKey: maskApiKey(customKeys.groq_secondary),
          status: 'error',
          message: errorMessage,
          lastCheckedAt: now,
        },
        gemini: {
          id: 'gemini',
          label: 'Google Gemini API Key',
          envVarName: 'GEMINI_API_KEY',
          isCustom: !!customKeys.gemini,
          maskedKey: maskApiKey(customKeys.gemini),
          status: 'error',
          message: errorMessage,
          lastCheckedAt: now,
        },
      },
    };
  }
}

/**
 * Request server to test/ping a single specific API key slot
 */
export async function checkSingleKeySlot(
  slotId: KeySlotId,
  overrideKey?: string
): Promise<KeyCheckResult> {
  const apiKey = overrideKey ?? getLocalKeyOverride(slotId);

  try {
    const res = await fetch('/api/keys/check-single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, apiKey }),
    });

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Koneksi terputus';
    return {
      slotId,
      status: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}
