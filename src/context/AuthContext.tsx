import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { initRealtimeSync, syncPullFromCloud } from '../lib/cloudSync';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let activeSubscription: { unsubscribe: () => void } | null = null;

    const setupAuth = () => {
      setIsLoading(true);
      if (activeSubscription) {
        activeSubscription.unsubscribe();
        activeSubscription = null;
      }

      // Check active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (session?.user) {
          initRealtimeSync().catch(console.error);
          // Do not pull on initial mount to avoid slowing down initial load significantly, 
          // realtime sync will handle incoming updates, but if we want to ensure full sync on app start:
          syncPullFromCloud().catch(console.error);
        }
      }).catch((err) => {
        console.warn('Supabase auth session check failed:', err);
        setSession(null);
        setUser(null);
        setIsLoading(false);
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (session?.user) {
          initRealtimeSync().catch(console.error);
          if (event === 'SIGNED_IN') {
            syncPullFromCloud().catch(console.error);
          }
        }
      });

      activeSubscription = subscription;
    };

    setupAuth();

    const handleClientChanged = () => {
      setupAuth();
    };

    window.addEventListener('supabase-client-changed', handleClientChanged);

    return () => {
      if (activeSubscription) activeSubscription.unsubscribe();
      window.removeEventListener('supabase-client-changed', handleClientChanged);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
