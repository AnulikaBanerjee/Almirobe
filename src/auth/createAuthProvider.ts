import { DemoAuthProvider } from '@/auth/demoAuthProvider';
import type { AuthProvider, AuthProviderKind } from '@/auth/types';

function authProviderFromEnv(): AuthProviderKind {
  const value = import.meta.env.VITE_AUTH_PROVIDER;
  if (value === 'demo' || !value) return 'demo';
  console.warn(`Unknown VITE_AUTH_PROVIDER "${value}", falling back to demo.`);
  return 'demo';
}

/**
 * Single switch point for authentication backend.
 * To add Supabase later:
 *   1. Implement AuthProvider (e.g. SupabaseAuthProvider)
 *   2. Extend AuthProviderKind + env handling
 *   3. Set VITE_AUTH_PROVIDER=supabase — LoginScreen stays unchanged
 */
export function createAuthProvider(kind: AuthProviderKind = authProviderFromEnv()): AuthProvider {
  switch (kind) {
    case 'demo':
      return new DemoAuthProvider();
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
