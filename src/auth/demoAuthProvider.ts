import type { AuthMode, AuthProvider, AuthUser, EmailAuthInput } from '@/auth/types';

const DEMO_SIGN_IN_DELAY_MS = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildDemoUser(displayName: string | null, email?: string): AuthUser {
  const normalizedEmail = email?.trim().toLowerCase();
  return {
    id: normalizedEmail ? `demo-${normalizedEmail}` : `demo-${Date.now()}`,
    displayName,
    email: normalizedEmail,
  };
}

export class DemoAuthProvider implements AuthProvider {
  readonly id = 'demo';
  readonly isDemo = true;

  async signInWithEmail(input: EmailAuthInput, mode: AuthMode): Promise<AuthUser> {
    await delay(DEMO_SIGN_IN_DELAY_MS);
    const displayName =
      mode === 'signup'
        ? input.name?.trim() || null
        : input.email.split('@')[0] || null;
    return buildDemoUser(displayName, input.email);
  }

  async signInWithGoogle(): Promise<AuthUser> {
    await delay(DEMO_SIGN_IN_DELAY_MS);
    return buildDemoUser(null);
  }

  async signInWithPhone(phone: string): Promise<AuthUser> {
    await delay(DEMO_SIGN_IN_DELAY_MS);
    const digits = phone.replace(/\D/g, '');
    const displayName = digits.length >= 4 ? `Guest •••${digits.slice(-4)}` : null;
    return buildDemoUser(displayName);
  }

  async signOut(): Promise<void> {
    // Demo sessions are in-memory only — nothing to revoke remotely.
  }
}
