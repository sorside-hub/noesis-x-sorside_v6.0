import React from 'react';
import { Mail, Lock, AlertCircle, CheckCircle2, Loader2, LogIn } from 'lucide-react';

interface SupabaseAuthFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isSignUp: boolean;
  setIsSignUp: (val: boolean) => void;
  isSubmitting: boolean;
  authError: string | null;
  setAuthError: (val: string | null) => void;
  authMessage: string | null;
  setAuthMessage: (val: string | null) => void;
  handleAuth: (e: React.FormEvent) => void;
}

export const SupabaseAuthForm: React.FC<SupabaseAuthFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  isSubmitting,
  authError,
  setAuthError,
  authMessage,
  setAuthMessage,
  handleAuth,
}) => {
  return (
    <form onSubmit={handleAuth} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Alamat Email
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full bg-bg-primary border border-border-default rounded-lg py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/40 transition-shadow"
              required
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Kata Sandi
          </label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-bg-primary border border-border-default rounded-lg py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/40 transition-shadow"
              required
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          </div>
        </div>
      </div>

      {authError && (
        <div className="flex items-start gap-2 p-3 text-xs text-status-error bg-status-error-bg border border-status-error/20 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}
      {authMessage && (
        <div className="flex items-start gap-2 p-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <span>{authMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setAuthError(null);
            setAuthMessage(null);
          }}
          className="text-xs text-text-muted hover:text-accent-primary transition-colors cursor-pointer"
        >
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center px-4 py-2 text-xs font-semibold text-accent-contrast bg-accent-primary hover:opacity-90 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <LogIn className="w-3.5 h-3.5 mr-1.5" />
          )}
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </div>
    </form>
  );
};
