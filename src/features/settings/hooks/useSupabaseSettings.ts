import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  supabase, 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  resetSupabaseConfig, 
  SupabaseConfigState 
} from '../../../lib/supabase';
import { syncPullFromCloud, syncPushAllToCloud, SyncSummary } from '../../../lib/cloudSync';
import { SUPABASE_SETUP_SQL } from '../components/SupabaseSetupSQL';

export function useSupabaseSettings() {
  const { user, isLoading } = useAuth();
  
  // Connection Config State
  const [config, setConfig] = useState<SupabaseConfigState>(getSupabaseConfig());
  const [showConfigDetails, setShowConfigDetails] = useState<boolean>(!config.isConfigured);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [inputAnonKey, setInputAnonKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [savingConnection, setSavingConnection] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(!getSupabaseConfig().isConfigured);
  const [connFeedback, setConnFeedback] = useState<{ type: 'success' | 'error'; message: string; latencyMs?: number } | null>(null);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Sync State & Progress
  const [syncPhase, setSyncPhase] = useState<'idle' | 'pull' | 'push'>('idle');
  const [syncProgressText, setSyncProgressText] = useState<string>('');
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Advanced Tools Accordion State
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  const refreshConfig = () => {
    const current = getSupabaseConfig();
    setConfig(current);
    setInputUrl(current.isCustom ? current.url : '');
    setInputAnonKey(current.isCustom ? current.anonKey : '');
    setIsEditing(!current.isConfigured);
  };

  useEffect(() => {
    refreshConfig();
    const handleClientChanged = () => refreshConfig();
    window.addEventListener('supabase-client-changed', handleClientChanged);
    return () => window.removeEventListener('supabase-client-changed', handleClientChanged);
  }, []);

  // Auto-dismiss feedback message after 4.5 seconds
  useEffect(() => {
    if (connFeedback) {
      const timer = setTimeout(() => {
        setConnFeedback(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [connFeedback]);

  const handleSaveConnection = async () => {
    const cleanUrl = inputUrl.trim();
    const cleanAnonKey = inputAnonKey.trim();

    if (!cleanUrl || !cleanAnonKey) {
      setConnFeedback({
        type: 'error',
        message: 'URL Proyek dan Anon Key tidak boleh kosong.'
      });
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setConnFeedback({
        type: 'error',
        message: 'Format URL Supabase tidak valid. Harus diawali dengan https://'
      });
      return;
    }

    setSavingConnection(true);
    setConnFeedback(null);
    try {
      saveSupabaseConfig(cleanUrl, cleanAnonKey);
      refreshConfig();
      setIsEditing(false);
      setConnFeedback({
        type: 'success',
        message: 'Kredensial Supabase berhasil disimpan dan diterapkan!'
      });
    } catch (err: any) {
      setConnFeedback({
        type: 'error',
        message: err.message || 'Gagal menyimpan konfigurasi.'
      });
    } finally {
      setSavingConnection(false);
    }
  };

  const handleResetConnection = () => {
    resetSupabaseConfig();
    refreshConfig();
    setIsEditing(true);
    setConnFeedback({
      type: 'success',
      message: 'Konfigurasi dikembalikan ke default environment variable.'
    });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setConnFeedback(null);
  };

  const handleCancelEdit = () => {
    const current = getSupabaseConfig();
    setInputUrl(current.isCustom ? current.url : '');
    setInputAnonKey(current.isCustom ? current.anonKey : '');
    setIsEditing(false);
    setConnFeedback(null);
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (err) {
      console.error('Failed to copy SQL to clipboard:', err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setAuthMessage('Cek email Anda untuk konfirmasi pendaftaran akun.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Terjadi kesalahan saat autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error('Error signing out:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePullSync = async () => {
    setSyncPhase('pull');
    setSyncError(null);
    setSyncMessage(null);
    setSyncSummary(null);
    setSyncProgressText('Menghubungkan ke Cloud & mengunduh data...');
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    try {
      const summary = await syncPullFromCloud();
      setSyncSummary(summary);
      setSyncMessage('Seluruh data berhasil diunduh dan disinkronkan ke perangkat ini.');
    } catch (err: any) {
      setSyncError(err.message || 'Gagal mengunduh data dari Cloud.');
    } finally {
      setSyncPhase('idle');
      syncTimeoutRef.current = setTimeout(() => {
        setSyncSummary(null);
        setSyncMessage(null);
        setSyncError(null);
      }, 5000);
    }
  };

  const handlePushSync = async () => {
    setSyncPhase('push');
    setSyncError(null);
    setSyncMessage(null);
    setSyncSummary(null);
    setSyncProgressText('Mengunggah data lokal ke Supabase...');
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    try {
      const summary = await syncPushAllToCloud();
      setSyncSummary(summary);
      setSyncMessage('Semua catatan dan riwayat percakapan lokal berhasil diunggah ke Cloud.');
    } catch (err: any) {
      setSyncError(err.message || 'Gagal mengunggah data ke Cloud.');
    } finally {
      setSyncPhase('idle');
      syncTimeoutRef.current = setTimeout(() => {
        setSyncSummary(null);
        setSyncMessage(null);
        setSyncError(null);
      }, 5000);
    }
  };




  return {
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
    SUPABASE_SETUP_SQL
  };
}
