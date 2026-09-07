/**
 * Types for Multi-Key Failover & Status Health Checking
 */

import { CascadeStep } from './cascadeProfiles';

export type KeySlotId = 'groq_primary' | 'groq_secondary' | 'gemini';

export type KeyHealthStatus = 
  | 'active'
  | 'quota_exceeded'
  | 'invalid_key'
  | 'missing'
  | 'error';

export interface KeySlotInfo {
  id: KeySlotId;
  label: string;
  envVarName: string;
  isCustom: boolean; // Whether set via UI override vs server environment
  maskedKey: string;
  status: KeyHealthStatus;
  latencyMs?: number;
  message?: string;
  lastCheckedAt?: string;
}

export interface KeyCheckResult {
  slotId: KeySlotId;
  status: KeyHealthStatus;
  latencyMs?: number;
  message: string;
  timestamp: string;
}

export interface SystemKeysOverviewResponse {
  ok: boolean;
  timestamp: string;
  slots: Record<KeySlotId, KeySlotInfo>;
}

export interface SingleKeyCheckRequest {
  slotId: KeySlotId;
  apiKey?: string; // Optional custom key sent from client UI test
}

export interface FailoverExecutionOptions {
  cascade: CascadeStep[];
  customKeys?: Partial<Record<KeySlotId, string>>;
  envObj?: Record<string, string | undefined>;
}

export interface FailoverExecutionResult<T> {
  success: boolean;
  data?: T;
  usedSlot: KeySlotId;
  usedModel?: string;
  wasFallbackUsed: boolean;
  attempts: Array<{
    slotId: KeySlotId;
    modelTried: string;
    error?: string;
    status: KeyHealthStatus;
  }>;
}
