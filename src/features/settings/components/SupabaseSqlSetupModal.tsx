import React, { useState } from 'react';
import { Database, ChevronDown, ChevronUp, Copy, Check, Code2, FileText, Radio } from 'lucide-react';
import { SUPABASE_NOESIS_SQL, SUPABASE_SORSIDE_CMS_SQL } from './SupabaseSetupSQL';

interface SupabaseSqlSetupModalProps {
  showAdvancedTools: boolean;
  setShowAdvancedTools: (val: boolean) => void;
  showSqlPreview: boolean;
  setShowSqlPreview: (val: boolean) => void;
  copiedSql?: boolean;
  handleCopySql?: () => void;
  sqlScript?: string;
}

export const SupabaseSqlSetupModal: React.FC<SupabaseSqlSetupModalProps> = ({
  showAdvancedTools,
  setShowAdvancedTools,
  showSqlPreview,
  setShowSqlPreview,
}) => {
  const [activeSchema, setActiveSchema] = useState<'noesis' | 'sorside'>('noesis');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentScript = activeSchema === 'noesis' ? SUPABASE_NOESIS_SQL : SUPABASE_SORSIDE_CMS_SQL;

  const handleCopyCurrentSql = async () => {
    try {
      await navigator.clipboard.writeText(currentScript);
      setCopiedKey(activeSchema);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (err) {
      console.error('Failed to copy SQL to clipboard:', err);
    }
  };

  return (
    <div className="p-4 bg-bg-surface">
      <button
        type="button"
        onClick={() => setShowAdvancedTools(!showAdvancedTools)}
        className="flex items-center justify-between w-full text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-accent-primary" />
          <span>SQL Schema & Setup Database</span>
        </span>
        {showAdvancedTools ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showAdvancedTools && (
        <div className="mt-3.5 space-y-4 pt-3 border-t border-border-subtle animate-in fade-in duration-150">
          {/* Schema Selector Tabs (Separate Noesis Note vs SORSIDE CMS) */}
          <div className="flex items-center p-1 bg-bg-primary rounded-xl border border-border-default gap-1">
            <button
              type="button"
              onClick={() => setActiveSchema('noesis')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSchema === 'noesis'
                  ? 'bg-bg-surface text-accent-primary shadow-xs border border-border-default'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Noesis Note (Sync & AI)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSchema('sorside')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSchema === 'sorside'
                  ? 'bg-bg-surface text-accent-primary shadow-xs border border-border-default'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover/50'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-accent-primary" />
              <span>2. SORSIDE Website CMS</span>
            </button>
          </div>

          {/* Description & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-bg-primary/50 border border-border-subtle">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-text-heading flex items-center gap-1.5">
                {activeSchema === 'noesis' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    <span>Skema Database Noesis Note</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-accent-primary inline-block" />
                    <span>Skema Database SORSIDE Website CMS</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {activeSchema === 'noesis'
                  ? 'Tabel catatan (nodes), metadata AI, pgvector 1024-d, riwayat chat, media & Supabase Realtime.'
                  : 'Tabel releases (Single/EP/Album), tracks lagu, dan artikel The Side beserta initial seed data bawaan.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCurrentSql}
              className={`shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer ${
                copiedKey === activeSchema
                  ? 'bg-status-success text-white'
                  : 'bg-accent-primary hover:bg-accent-hover text-white'
              }`}
            >
              {copiedKey === activeSchema ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL {activeSchema === 'noesis' ? 'Noesis' : 'SORSIDE'}</span>
                </>
              )}
            </button>
          </div>

          {/* Collapsible View / Hide SQL Preview */}
          <div>
            <button
              type="button"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="flex items-center gap-1.5 text-xs text-accent-primary hover:underline py-1 cursor-pointer font-medium"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showSqlPreview ? 'Sembunyikan SQL Script' : `Lihat SQL Script (${activeSchema === 'noesis' ? 'Noesis Note' : 'SORSIDE CMS'})`}</span>
            </button>

            {showSqlPreview && (
              <div className="relative mt-2">
                <pre className="p-3.5 bg-bg-primary border border-border-subtle rounded-xl text-[11px] font-mono text-text-secondary overflow-x-auto max-h-64 leading-relaxed select-all">
                  {currentScript}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

