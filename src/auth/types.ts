export interface AuthUser {
  id: string;
  displayName: string | null;
  email?: string;
}

export type AuthMode = 'login' | 'signup';

export interface EmailAuthInput {
  email: string;
  password: string;
  name?: string;
}

/**
 * Pluggable authentication layer. Implement for demo, Supabase, etc.
 * UI components depend on this interface — not on a specific provider SDK.
 */
export interface AuthProvider {
  readonly id: string;
  readonly isDemo: boolean;
  signInWithEmail(input: EmailAuthInput, mode: AuthMode): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signInWithPhone(phone: string): Promise<AuthUser>;
  signOut(): Promise<void>;
}

export type AuthProviderKind = 'demo';
