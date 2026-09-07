import React from 'react';
import { Loader2, Cloud, Sliders, ChevronUp, ChevronDown, LogOut } from 'lucide-react';
import { useSupabaseSettings } from '../hooks/useSupabaseSettings';
import { SupabaseCredentialsForm } from './SupabaseCredentialsForm';
import { SupabaseAuthForm } from './SupabaseAuthForm';
import { SupabaseSyncActions } from './SupabaseSyncActions';
import { SupabaseSqlSetupModal } from './SupabaseSqlSetupModal';

export const SupabaseUnifiedCard: React.FC = () => {
  const {
    user,
    isLoading,
    config,
    showConfigDetails,
    setShowConfigDetails,
    inputUrl,
    setInputUrl,
    inputAnonKey,
    setInputAnonKey,
    showKey,
    setShowKey,
    savingConnection,
    isEditing,
    connFeedback,
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    isSignUp,
    setIsSignUp,
    authError,
    setAuthError,
    authMessage,
    setAuthMessage,
    syncPhase,
    syncProgressText,
    syncError,
    syncMessage,
    syncSummary,
    showAdvancedTools,
    setShowAdvancedTools,
    showSqlPreview,
    setShowSqlPreview,
    copiedSql,
    handleSaveConnection,
    handleResetConnection,
    handleStartEdit,
    handleCancelEdit,
    handleCopySql,
    handleAuth,
    handleSignOut,
    handlePullSync,
    handlePushSync,
    SUPABASE_SETUP_SQL,
  } = useSupabaseSettings();

  if (isLoading) {
    return (
      <div className="bg-bg-surface border border-border-default rounded-xl p-8 flex items-center justify-center text-text-muted text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-accent-primary" />
        Memeriksa status Cloud Sync...
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-xs divide-y divide-border-subtle">
      {/* 1. TOP HEADER: Status Koneksi & Akun Ringkas */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-heading">Supabase Cloud Sync</h3>
              {user ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-hover text-text-muted border border-border-default">
                  Logged Out
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {user
                ? `Akun aktif: ${user.email}`
                : 'Hubungkan database & akun untuk sinkronisasi otomatis antar-perangkat.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfigDetails(!showConfigDetails)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-primary hover:bg-bg-hover rounded-lg transition-colors border border-border-default cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-accent-primary" />
            <span>Credentials</span>
            {showConfigDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-status-error bg-status-error-bg hover:bg-status-error-bg/80 rounded-lg transition-colors border border-status-error/20 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. COLLAPSIBLE CREDENTIAL CONFIGURATION (BYODB) */}
      <SupabaseCredentialsForm
        showConfigDetails={showConfigDetails}
        inputUrl={inputUrl}
        setInputUrl={setInputUrl}
        inputAnonKey={inputAnonKey}
        setInputAnonKey={setInputAnonKey}
        showKey={showKey}
        setShowKey={setShowKey}
        connFeedback={connFeedback}
        savingConnection={savingConnection}
        config={config}
        isEditing={isEditing}
        handleStartEdit={handleStartEdit}
        handleCancelEdit={handleCancelEdit}
        handleResetConnection={handleResetConnection}
        handleSaveConnection={handleSaveConnection}
      />

      {/* 3. AUTH FORM OR CLOUD SYNC CONTROLS */}
      <div className="p-4 sm:p-5">
        {user ? (
          <SupabaseSyncActions
            syncPhase={syncPhase}
            syncProgressText={syncProgressText}
            syncError={syncError}
            syncMessage={syncMessage}
            syncSummary={syncSummary}
            handlePullSync={handlePullSync}
            handlePushSync={handlePushSync}
          />
        ) : (
          <SupabaseAuthForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            isSubmitting={isSubmitting}
            authError={authError}
            setAuthError={setAuthError}
            authMessage={authMessage}
            setAuthMessage={setAuthMessage}
            handleAuth={handleAuth}
          />
        )}
      </div>

      {/* 4. ADVANCED TOOLS: SQL SETUP SCRIPT (COLLAPSIBLE) */}
      <SupabaseSqlSetupModal
        showAdvancedTools={showAdvancedTools}
        setShowAdvancedTools={setShowAdvancedTools}
        showSqlPreview={showSqlPreview}
        setShowSqlPreview={setShowSqlPreview}
        copiedSql={copiedSql}
        handleCopySql={handleCopySql}
        sqlScript={SUPABASE_SETUP_SQL}
      />
    </div>
  );
};
