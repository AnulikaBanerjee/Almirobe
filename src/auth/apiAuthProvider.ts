import { apiClient } from '@/api/client';
import { requestGoogleIdToken } from '@/auth/googleSignIn';
import type { AuthProvider, AuthUser, EmailAuthInput, AuthMode, PhoneOtpSendResult } from '@/auth/types';

function toAuthUser(user: { id: string; email: string; displayName: string | null }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}

export class ApiAuthProvider implements AuthProvider {
  readonly id = 'api';
  readonly isDemo = false;

  async signInWithEmail(input: EmailAuthInput, mode: AuthMode): Promise<AuthUser> {
    const response =
      mode === 'signup'
        ? await apiClient.register({
            email: input.email,
            password: input.password,
            name: input.name,
          })
        : await apiClient.login({
            email: input.email,
            password: input.password,
          });
    return toAuthUser(response.user);
  }

  async signInWithGoogle(): Promise<AuthUser> {
    const idToken = await requestGoogleIdToken();
    const response = await apiClient.loginWithGoogle(idToken);
    return toAuthUser(response.user);
  }

  async requestPhoneOtp(phone: string): Promise<PhoneOtpSendResult> {
    return apiClient.sendPhoneOtp(phone);
  }

  async verifyPhoneOtp(phone: string, code: string): Promise<AuthUser> {
    const response = await apiClient.verifyPhoneOtp(phone, code);
    return toAuthUser(response.user);
  }

  async signOut(): Promise<void> {
    await apiClient.logout();
  }
}
