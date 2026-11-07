import type { AuthMode, AuthProvider, AuthUser, EmailAuthInput, PhoneOtpSendResult } from '@/auth/types';

const DEMO_SIGN_IN_DELAY_MS = 600;
const DEMO_OTP = '123456';

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
    return buildDemoUser('Me', 'me@demo.local');
  }

  async requestPhoneOtp(phone: string): Promise<PhoneOtpSendResult> {
    await delay(400);
    return {
      phone,
      expiresInSeconds: 300,
      debugCode: DEMO_OTP,
    };
  }

  async verifyPhoneOtp(phone: string, code: string): Promise<AuthUser> {
    await delay(DEMO_SIGN_IN_DELAY_MS);
    if (code.trim() !== DEMO_OTP) {
      throw new Error('Incorrect code. Demo OTP is 123456.');
    }
    const digits = phone.replace(/\D/g, '');
    const displayName = digits.length >= 4 ? `Guest •••${digits.slice(-4)}` : 'Me';
    const email = digits ? `phone-${digits}@demo.local` : 'phone@demo.local';
    return buildDemoUser(displayName, email);
  }

  async signOut(): Promise<void> {
    // Demo sessions are in-memory only — nothing to revoke remotely.
  }
}
