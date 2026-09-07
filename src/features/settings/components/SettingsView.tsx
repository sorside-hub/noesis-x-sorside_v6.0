import React, { useRef, useState } from 'react';
import { 
  HardDrive, 
  Download,
  Upload,
  BookOpen,
  Layers,
  Sparkles,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Palette,
  Moon,
  Sun,
  Check
} from 'lucide-react';
import { VaultData, FileNode } from '../../../types/vault';
import { ApiKeyStatusSection } from './ApiKeyStatusSection';
import { SupabaseUnifiedCard } from './SupabaseUnifiedCard';
import { exportVaultToJSON, importVaultFromJSON } from '../../../lib/storage';
import { useTheme, ThemeMode } from '../../../hooks/useTheme';

interface SettingsViewProps {
  vault: VaultData;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ vault }) => {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'loading' | 'success' | 'error'; message: string } | null>(null);

  const handleExport = async () => {
    try {
      const jsonStr = await exportVaultToJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `noesis-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data catatan.');
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ type: 'loading', message: 'Mengimpor file backup...' });
    try {
      const text = await file.text();
      await importVaultFromJSON(text);
      setImportStatus({ type: 'success', message: 'Data berhasil diimpor! Memuat ulang...' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      setImportStatus({ type: 'error', message: 'Format backup tidak valid atau rusak.' });
      setTimeout(() => setImportStatus(null), 3500);
    }
    
    // reset input
    e.target.value = '';
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-bg-primary text-text-primary select-text">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-7 pb-28">
        
        {/* HEADER SECTION */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-text-heading tracking-tight">Settings</h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1">Konfigurasi AI, Sinkronisasi Cloud, dan Pencadangan Data Lokal.</p>
          </div>
          <span className="shrink-0 px-2.5 py-1 bg-bg-surface border border-border-default rounded-full text-xs font-mono font-semibold text-accent-primary shadow-xs">
            v6.0
          </span>
        </header>

        {/* 1. THEME & APPEARANCE */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 flex items-center gap-2">
            <Palette size={14} className="text-accent-primary" /> 
            Tema & Tampilan
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sophisticated Dark Option */}
            <button
              type="button"
              onClick={() => setTheme('sophisticated-dark')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                theme === 'sophisticated-dark'
                  ? 'bg-bg-surface border-accent-primary ring-1 ring-accent-primary shadow-xs'
                  : 'bg-bg-surface border-border-default hover:border-accent-primary/40 hover:bg-bg-hover'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-zinc-900 text-amber-300 border border-zinc-700/80 shadow-inner shrink-0">
                  <Moon size={16} className="fill-amber-300/20" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-text-heading block truncate">Dark Mode</span>
                  <span className="text-[11px] text-text-muted block truncate">Sophisticated Dark</span>
                </div>
              </div>
              {theme === 'sophisticated-dark' && (
                <div className="w-5 h-5 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={2.5} />
                </div>
              )}
            </button>

            {/* Editorial Light Option */}
            <button
              type="button"
              onClick={() => setTheme('editorial-light')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                theme === 'editorial-light'
                  ? 'bg-bg-surface border-accent-primary ring-1 ring-accent-primary shadow-xs'
                  : 'bg-bg-surface border-border-default hover:border-accent-primary/40 hover:bg-bg-hover'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 shadow-xs shrink-0">
                  <Sun size={16} className="text-amber-500" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-text-heading block truncate">Light Mode</span>
                  <span className="text-[11px] text-text-muted block truncate">Editorial Light</span>
                </div>
              </div>
              {theme === 'editorial-light' && (
                <div className="w-5 h-5 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={2.5} />
                </div>
              )}
            </button>

            {/* Warm Parchment (Read Mode) Option */}
            <button
              type="button"
              onClick={() => setTheme('warm-parchment')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                theme === 'warm-parchment'
                  ? 'bg-bg-surface border-accent-primary ring-1 ring-accent-primary shadow-xs'
                  : 'bg-bg-surface border-border-default hover:border-accent-primary/40 hover:bg-bg-hover'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-[#FAF0E6] text-[#9E5330] border border-[#E6D7C3] shadow-xs shrink-0">
                  <BookOpen size={16} className="text-[#9E5330]" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-text-heading block truncate">Read Mode</span>
                  <span className="text-[11px] text-text-muted block truncate">Warm Parchment</span>
                </div>
              </div>
              {theme === 'warm-parchment' && (
                <div className="w-5 h-5 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={2.5} />
                </div>
              )}
            </button>
          </div>
        </section>

        {/* 2. CLOUD SYNC & STORAGE (1 UNIFIED CARD) */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 flex items-center gap-2">
            <Sparkles size={14} className="text-accent-primary" /> 
            Sync & Cloud Storage
          </h2>
          <SupabaseUnifiedCard />
        </section>

        {/* 3. API KEYS & FAILOVER */}
        <section className="space-y-2.5">
          <ApiKeyStatusSection />
        </section>

        {/* 4. LOCAL BACKUP & DATA MANAGEMENT (COMPACT CARD) */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 flex items-center gap-2">
            <HardDrive size={14} className="text-accent-primary" /> 
            Local Backup & Data Management
          </h2>
          
          <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-xs divide-y divide-border-subtle">
            {/* Quick Stats Banner */}
            <div className="p-4 bg-bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary shrink-0">
                  <FileCheck size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text-heading">Local Storage Status</h3>
                  <p className="text-xs text-text-muted mt-0.5">IndexedDB Browser Storage (Offline-First)</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-bg-primary/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-bg-surface hover:bg-bg-hover text-text-primary rounded-xl text-xs font-semibold transition-all border border-border-default hover:border-accent-primary/40 shadow-xs cursor-pointer"
              >
                <Download size={14} className="text-accent-primary shrink-0" />
                <span>Export Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleImportClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-bg-surface hover:bg-bg-hover text-text-primary rounded-xl text-xs font-semibold transition-all border border-border-default hover:border-accent-primary/40 shadow-xs cursor-pointer"
              >
                <Upload size={14} className="text-accent-primary shrink-0" />
                <span>Import Backup (JSON)</span>
              </button>
            </div>

            {/* Import Status Alert */}
            {importStatus && (
              <div className={`p-3 text-center text-xs font-medium flex items-center justify-center gap-2 ${
                importStatus.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-t border-emerald-500/20' 
                  : importStatus.type === 'error'
                    ? 'bg-status-error-bg text-status-error border-t border-status-error/20'
                    : 'bg-bg-hover text-accent-primary'
              }`}>
                {importStatus.type === 'success' && <CheckCircle2 size={14} className="text-emerald-400" />}
                {importStatus.type === 'error' && <AlertCircle size={14} className="text-status-error" />}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};
