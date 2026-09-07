import { KeySlotId } from './types';

export interface CascadeStep {
  provider: KeySlotId;
  model: string;
}

/**
 * Helper untuk Load Balancing (50/50 Acak)
 */
function getBalancedProviders(): [KeySlotId, KeySlotId] {
  return Math.random() < 0.5 
    ? ['groq_primary', 'groq_secondary'] 
    : ['groq_secondary', 'groq_primary'];
}

/**
 * Mode 1: Smart Cascade (Fokus Nalar & Kepintaran)
 * Digunakan untuk: Chat, Deep Analysis, JSON Extraction
 * Model utama: openai/gpt-oss-120b -> openai/gpt-oss-20b -> gemini-3.5-flash
 */
export function getSmartCascade(): CascadeStep[] {
  const [first, second] = getBalancedProviders();
  return [
    { provider: first, model: 'openai/gpt-oss-120b' },
    { provider: second, model: 'openai/gpt-oss-120b' },
    { provider: first, model: 'openai/gpt-oss-20b' },
    { provider: second, model: 'openai/gpt-oss-20b' },
    { provider: 'gemini', model: 'gemini-3.5-flash' },
  ];
}

/**
 * Mode 2: Fast Cascade (Fokus Kecepatan/Latency)
 * Digunakan untuk: Editor Action (Grammar, Translate, Summarize)
 * Model utama: openai/gpt-oss-20b -> openai/gpt-oss-120b -> gemini-3.5-flash
 */
export function getFastCascade(): CascadeStep[] {
  const [first, second] = getBalancedProviders();
  return [
    { provider: first, model: 'openai/gpt-oss-20b' },
    { provider: second, model: 'openai/gpt-oss-20b' },
    { provider: first, model: 'openai/gpt-oss-120b' },
    { provider: second, model: 'openai/gpt-oss-120b' },
    { provider: 'gemini', model: 'gemini-3.5-flash' },
  ];
}

/**
 * Mode 3: Heavy Duty Cascade (Fokus Dokumen Raksasa & Background Tasks)
 * Digunakan untuk: Catatan > 6000 karakter & Background Memory Summary
 * Model utama: gemini-3.5-flash -> gemini-3.5-flash-lite (Bypass Groq, Total Workload Isolation)
 */
export function getHeavyCascade(): CascadeStep[] {
  return [
    { provider: 'gemini', model: 'gemini-3.5-flash' },
    { provider: 'gemini', model: 'gemini-3.5-flash-lite' },
  ];
}


