import React from 'react';
import { Server, Key, Eye, EyeOff, CheckCircle2, AlertCircle, RotateCcw, Save, Sparkles, ExternalLink, Loader2, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupabaseCredentialsFormProps {
  showConfigDetails: boolean;
  inputUrl: string;
  setInputUrl: (val: string) => void;
  inputAnonKey: string;
  setInputAnonKey: (val: string) => void;
  showKey: boolean;
  setShowKey: (val: boolean) => void;
  connFeedback: { type: 'success' | 'error'; message: string; latencyMs?: number } | null;
  savingConnection: boolean;
  config: { isConfigured: boolean; isCustom?: boolean };
  isEditing: boolean;
  handleStartEdit: () => void;
  handleCancelEdit: () => void;
  handleResetConnection: () => void;
  handleSaveConnection: () => void;
}

export const SupabaseCredentialsForm: React.FC<SupabaseCredentialsFormProps> = ({
  showConfigDetails,
  inputUrl,
  setInputUrl,
  inputAnonKey,
  setInputAnonKey,
  showKey,
  setShowKey,
  connFeedback,
  savingConnection,
  config,
  isEditing,
  handleStartEdit,
  handleCancelEdit,
  handleResetConnection,
  handleSaveConnection,
}) => {
  if (!showConfigDetails) return null;

  return (
    <div className="p-4 sm:p-5 bg-bg-primary/50 space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1.5 font-medium text-text-secondary">
          <Sparkles size={13} className="text-accent-primary" />
          Bring Your Own Database (BYODB)
        </span>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent-primary hover:underline hover:text-accent-secondary"
        >
          Dashboard Supabase <ExternalLink size={11} />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">
            Supabase Project URL
          </label>
          <div className="relative">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              readOnly={!isEditing}
              placeholder={!isEditing && !config.isCustom ? "Using Environment Variable .env" : "https://xxxxxxxxxxxx.supabase.co"}
              className={`w-full border rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-text-primary placeholder:text-text-muted transition-shadow ${
                isEditing ? 'bg-bg-surface border-border-default focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/40' : 'bg-bg-base/50 border-border-subtle/60 text-text-muted cursor-default'
              }`}
            />
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">
            Supabase Anon (Public) Key
          </label>
          <div className="relative">
            <input
              type={!isEditing ? 'password' : (showKey ? 'text' : 'password')}
              value={inputAnonKey}
              onChange={(e) => setInputAnonKey(e.target.value)}
              readOnly={!isEditing}
              placeholder={!isEditing && !config.isCustom ? "Using Environment Variable .env" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
              className={`w-full border rounded-lg py-2 pl-9 pr-9 text-xs font-mono text-text-primary placeholder:text-text-muted transition-shadow ${
                isEditing ? 'bg-bg-surface border-border-default focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/40' : 'bg-bg-base/50 border-border-subtle/60 text-text-muted cursor-default'
              }`}
            />
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title={showKey ? 'Sembunyikan' : 'Tampilkan'}
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {connFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`p-3 overflow-hidden rounded-lg text-xs flex items-start gap-2.5 ${
              connFeedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-status-error-bg border border-status-error/20 text-status-error'
            }`}
          >
            {connFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-status-error" />
            )}
            <div className="flex-1">
              <p>{connFeedback.message}</p>
              {connFeedback.latencyMs !== undefined && (
                <span className="text-[10px] opacity-75 font-mono">
                  Waktu respon: {connFeedback.latencyMs}ms
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div>
          {config.isCustom && isEditing && (
            <button
              type="button"
              onClick={handleResetConnection}
              disabled={savingConnection}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary bg-transparent hover:bg-bg-hover rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Kembalikan ke Environment Variable"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset .env</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-text-primary bg-bg-surface hover:bg-bg-hover rounded-lg transition-colors border border-border-default cursor-pointer shadow-2xs"
            >
              <Pencil className="w-3.5 h-3.5 text-accent-primary" />
              <span>Edit Credentials</span>
            </button>
          ) : (
            <>
              {config.isConfigured && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingConnection}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary bg-transparent hover:bg-bg-hover rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveConnection}
                disabled={savingConnection || !inputUrl.trim() || !inputAnonKey.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-accent-contrast bg-accent-primary hover:opacity-90 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save & Apply</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
