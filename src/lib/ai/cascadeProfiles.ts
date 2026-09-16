import { KeySlotId } from './types';

export interface CascadeStep {
  provider: KeySlotId;
  model: string;
}

/**
 * Helper untuk Load Balancing Groq (50/50 Acak antara primary & secondary)
 */
function getBalancedGroqProviders(): [KeySlotId, KeySlotId] {
  return Math.random() < 0.5 
    ? ['groq_primary', 'groq_secondary'] 
    : ['groq_secondary', 'groq_primary'];
}

/**
 * Helper untuk Load Balancing Gemini (50/50 Acak antara primary & secondary)
 */
function getBalancedGeminiProviders(): [KeySlotId, KeySlotId] {
  return Math.random() < 0.5 
    ? ['gemini_primary', 'gemini_secondary'] 
    : ['gemini_secondary', 'gemini_primary'];
}

/**
 * Profil 1: Gemini First (Fokus Nalar Tinggi, Konsep, Brainstorming & Pemahaman Konteks Luas)
 * Model urutan:
 * 1. gemini-3.6-flash (50/50 Key A -> Key B)
 * 2. gemini-3.5-flash-lite (Anti-Macet 503, 50/50 Key A -> Key B)
 * 3. openai/gpt-oss-120b (Rescue Fallback Groq, 50/50 Key A -> Key B)
 * 4. openai/gpt-oss-20b (Final Safety Net, 50/50 Key A -> Key B)
 */
export function getGeminiFirstCascade(): CascadeStep[] {
  const [g1, g2] = getBalancedGeminiProviders();
  const [q1, q2] = getBalancedGroqProviders();

  return [
    // Tier 1: Gemini Flagship (3.6 Flash)
    { provider: g1, model: 'gemini-3.6-flash' },
    { provider: g2, model: 'gemini-3.6-flash' },

    // Tier 2: Ultra-Stable Gemini Lite (Anti High-Demand 503)
    { provider: g1, model: 'gemini-3.5-flash-lite' },
    { provider: g2, model: 'gemini-3.5-flash-lite' },

    // Tier 3: Rescue Fallback ke Groq Flagship
    { provider: q1, model: 'openai/gpt-oss-120b' },
    { provider: q2, model: 'openai/gpt-oss-120b' },

    // Tier 4: Final Safety Net ke Groq Fast
    { provider: q1, model: 'openai/gpt-oss-20b' },
    { provider: q2, model: 'openai/gpt-oss-20b' },
  ];
}

/**
 * Profil 2: Groq First (Fokus Kecepatan Kilat Sub-detik, Editor Actions, Grammar & Triage Ringkas)
 * Model urutan:
 * 1. openai/gpt-oss-20b (Kecepatan Instan, 50/50 Key A -> Key B)
 * 2. openai/gpt-oss-120b (Ketelitian Tinggi Groq, 50/50 Key A -> Key B)
 * 3. gemini-3.6-flash (Fallback Gemini Nalar, 50/50 Key A -> Key B)
 * 4. gemini-3.5-flash-lite (Final Safety Net, 50/50 Key A -> Key B)
 */
export function getGroqFirstCascade(): CascadeStep[] {
  const [q1, q2] = getBalancedGroqProviders();
  const [g1, g2] = getBalancedGeminiProviders();

  return [
    // Tier 1: Ultra-Fast Groq (20B)
    { provider: q1, model: 'openai/gpt-oss-20b' },
    { provider: q2, model: 'openai/gpt-oss-20b' },

    // Tier 2: Smarter Groq (120B)
    { provider: q1, model: 'openai/gpt-oss-120b' },
    { provider: q2, model: 'openai/gpt-oss-120b' },

    // Tier 3: Fallback ke Gemini Flagship (3.6 Flash)
    { provider: g1, model: 'gemini-3.6-flash' },
    { provider: g2, model: 'gemini-3.6-flash' },

    // Tier 4: Final Safety Net ke Gemini Lite
    { provider: g1, model: 'gemini-3.5-flash-lite' },
    { provider: g2, model: 'gemini-3.5-flash-lite' },
  ];
}

// Backward compatibility aliases agar fitur eksisting tidak error sebelum kita migrasi
export const getSmartCascade = getGeminiFirstCascade;
export const getFastCascade = getGroqFirstCascade;
export const getHeavyCascade = getGeminiFirstCascade;

/**
 * Profil Khusus Multimodal Audio (Voice-to-Note)
 * Hanya menggunakan Gemini karena audio raw binary didukung secara native oleh Gemini.
 */
export function getGeminiOnlyCascade(): CascadeStep[] {
  const [g1, g2] = getBalancedGeminiProviders();
  return [
    { provider: g1, model: 'gemini-3.6-flash' },
    { provider: g2, model: 'gemini-3.6-flash' },
    { provider: g1, model: 'gemini-3.5-flash-lite' },
    { provider: g2, model: 'gemini-3.5-flash-lite' },
  ];
}




