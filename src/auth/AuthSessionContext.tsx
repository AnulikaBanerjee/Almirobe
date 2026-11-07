import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiClient } from '@/api/client';
import { getStoredActiveProfileId, getStoredRefreshToken } from '@/api/sessionStorage';
import { createAuthProvider } from '@/auth/createAuthProvider';
import type { AuthProvider, AuthUser } from '@/auth/types';

interface AuthSessionContextValue {
  user: AuthUser | null;
  activeProfileId: string | null;
  isLoading: boolean;
  authProvider: AuthProvider;
  setUser: (user: AuthUser | null) => void;
  completeAuthentication: (user: AuthUser) => void;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const authProvider = useMemo(() => createAuthProvider(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(authProvider.id === 'api');

  useEffect(() => {
    if (authProvider.id !== 'api') {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      if (!getStoredRefreshToken()) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const refreshed = await apiClient.refreshSession();
        if (cancelled) return;
        if (!refreshed) {
          setIsLoading(false);
          return;
        }
        const me = await apiClient.me();
        if (cancelled) return;
        setUser({
          id: me.user.id,
          email: me.user.email,
          displayName: me.user.displayName,
        });
        setActiveProfileId(me.profile.id);
      } catch {
        apiClient.clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authProvider.id]);

  const signOut = useCallback(async () => {
    await authProvider.signOut();
    setUser(null);
    setActiveProfileId(null);
  }, [authProvider]);

  const completeAuthentication = useCallback(
    (authenticatedUser: AuthUser) => {
      setUser(authenticatedUser);
      if (authProvider.id === 'api') {
        setActiveProfileId(getStoredActiveProfileId());
      }
    },
    [authProvider.id]
  );

  const value = useMemo(
    () => ({
      user,
      activeProfileId,
      isLoading,
      authProvider,
      setUser,
      completeAuthentication,
      signOut,
    }),
    [user, activeProfileId, isLoading, authProvider, completeAuthentication, signOut]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return ctx;
}
