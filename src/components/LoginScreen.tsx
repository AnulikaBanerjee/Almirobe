import { useState } from 'react';
import { Lock, Phone, User } from 'lucide-react';
import { ApiClientError } from '@/api/client';
import type { AuthMode, AuthProvider, AuthUser } from '@/auth';
import { validateEmailAddress } from '@/auth/emailValidation';
import DemoModeBanner from '@/components/DemoModeBanner';
import DesignSplitLayout from '@/components/layout/DesignSplitLayout';

interface LoginScreenProps {
  authProvider: AuthProvider;
  onAuthenticated: (user: AuthUser) => void;
}

type AuthTab = 'email' | 'phone';

export default function LoginScreen({ authProvider, onAuthenticated }: LoginScreenProps) {
  const [tab, setTab] = useState<AuthTab>('email');
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runAuth = async (action: () => Promise<AuthUser>) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const user = await action();
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : 'Sign in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (mode === 'signup') {
      const emailCheck = validateEmailAddress(email);
      if (!emailCheck.ok) {
        setError(emailCheck.message);
        return;
      }
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    void runAuth(() =>
      authProvider.signInWithEmail(
        { email: email.trim(), password, name: name.trim() || undefined },
        mode
      )
    );
  };

  const handleSendOtp = async () => {
    if (loading) return;
    setError('');
    if (!phone.trim()) {
      setError('Please enter your mobile number');
      return;
    }
    setLoading(true);
    try {
      const result = await authProvider.requestPhoneOtp(phone.trim());
      setOtpSent(true);
      setDebugOtp(result.debugCode ?? null);
    } catch (err) {
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Enter the OTP sent to your phone');
      return;
    }
    void runAuth(() => authProvider.verifyPhoneOtp(phone.trim(), otp.trim()));
  };

  const inputClass =
    'w-full bg-transparent border border-[#c9b08a] rounded-lg pl-11 pr-4 py-3 text-sm text-[#3d2f24] placeholder-[#9a8b78] focus:outline-none focus:border-[#8b5a2b]';

  return (
    <div className="min-h-screen bg-[#f4ead8] text-[#3d2f24] flex flex-col items-center justify-center px-3 py-8">
      {authProvider.isDemo && <DemoModeBanner />}
      <DesignSplitLayout artSrc="/designs/login.jpg" artAlt="Couple looking into an open wardrobe" tall>
        <h1 className="font-serif text-[2rem] sm:text-[2.35rem] leading-tight text-[#2b2118] mb-6">
          Hello,
          <br />
          Welcome back
        </h1>

        <div className="flex gap-2 mb-5 max-w-md">
          {([
            ['email', 'Email'],
            ['phone', 'Mobile OTP'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setError('');
                setOtpSent(false);
                setDebugOtp(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                tab === id
                  ? 'border-[#8b5a2b] bg-[#6b4423] text-[#faf6ee]'
                  : 'border-[#c9b08a] text-[#5c4d3d] hover:bg-[#f0e4d0]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-md">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8b78]" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8b78]" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className={inputClass}
                placeholder="Email address"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8b78]" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={6}
                className={inputClass}
                placeholder="Password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <div className="flex items-center justify-between text-sm text-[#5c4d3d] pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-[#c9b08a] text-[#6b4423] focus:ring-[#8b5a2b] accent-[#6b4423]"
                />
                Remember me
              </label>
              <button type="button" className="underline decoration-[#8b5a2b] underline-offset-2 hover:text-[#3d2f24]">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-100/80 border border-red-300/50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md text-sm font-medium text-[#faf6ee] bg-[#6b4423] hover:bg-[#5a381c] disabled:opacity-50"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : (e) => { e.preventDefault(); void handleSendOtp(); }} className="space-y-4 max-w-md">
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8b78]" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                required
                disabled={otpSent}
                className={inputClass}
                placeholder="Mobile (+91…)"
                autoComplete="tel"
              />
            </div>

            {otpSent && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8b78]" />
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                  required
                  className={inputClass}
                  placeholder="6-digit OTP"
                  autoComplete="one-time-code"
                />
              </div>
            )}

            {debugOtp && (
              <p className="text-[11px] text-[#6b5a48] bg-[#f0e4d0] rounded-lg px-3 py-2">
                Dev code: <strong>{debugOtp}</strong> (SMS provider not configured yet)
              </p>
            )}

            {error && (
              <div className="text-xs text-red-700 bg-red-100/80 border border-red-300/50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md text-sm font-medium text-[#faf6ee] bg-[#6b4423] hover:bg-[#5a381c] disabled:opacity-50"
            >
              {loading ? 'Please wait…' : otpSent ? 'Verify & login' : 'Send OTP'}
            </button>

            {otpSent && (
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setDebugOtp(null);
                }}
                className="w-full text-xs text-[#6b5a48] underline"
              >
                Change number
              </button>
            )}
          </form>
        )}

        {tab === 'email' && (
          <p className="text-sm text-[#5c4d3d] mt-5">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="font-semibold text-[#8b3d1a] hover:underline"
            >
              Click here
            </button>
          </p>
        )}

        <div className="flex items-center gap-3 mt-6">
          <a
            href="https://www.apple.com/app-store/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-black text-white rounded-md px-3 py-1.5 text-[11px] leading-tight"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M16.37 12.64c-.03-2.23 1.82-3.3 1.9-3.35-1.04-1.52-2.66-1.73-3.23-1.75-1.37-.14-2.68.81-3.38.81-.7 0-1.77-.79-2.91-.77-1.5.02-2.88.87-3.65 2.21-1.56 2.71-.4 6.72 1.12 8.92.74 1.08 1.63 2.28 2.79 2.24 1.12-.05 1.54-.72 2.89-.72 1.35 0 1.73.72 2.91.7 1.2-.02 1.97-1.1 2.7-2.18.85-1.24 1.2-2.45 1.22-2.51-.03-.01-2.33-.89-2.36-3.6ZM14.5 6.9c.62-.75 1.03-1.79.92-2.83-.89.04-1.97.6-2.61 1.35-.57.66-1.07 1.73-.93 2.74 1 .08 2.01-.51 2.62-1.26Z" />
            </svg>
            <span>
              Download on the
              <br />
              <span className="text-sm font-semibold">App Store</span>
            </span>
          </a>
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-black text-white rounded-md px-3 py-1.5 text-[11px] leading-tight"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#34A853" d="M3 20.5 8.3 12 3 3.5v17Z" />
              <path fill="#FBBC04" d="M3 3.5 12 10.2 21 3.5H3Z" />
              <path fill="#4285F4" d="M21 3.5 12 10.2 14.8 12 21 20.5V3.5Z" />
              <path fill="#EA4335" d="M3 20.5 12 13.8 21 20.5H3Z" />
            </svg>
            <span>
              GET IT ON
              <br />
              <span className="text-sm font-semibold">Google Play</span>
            </span>
          </a>
        </div>

        <button
          type="button"
          onClick={() => void runAuth(() => authProvider.signInWithGoogle())}
          disabled={loading}
          className="mt-4 text-sm text-[#6b5a48] hover:text-[#3d2f24] underline underline-offset-2"
        >
          Continue with Google
        </button>
      </DesignSplitLayout>
    </div>
  );
}
