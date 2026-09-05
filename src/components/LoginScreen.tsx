import { useState } from 'react';
import { Layers, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import type { AuthMode, AuthProvider, AuthUser } from '@/auth';
import DemoModeBanner from '@/components/DemoModeBanner';

interface LoginScreenProps {
  authProvider: AuthProvider;
  onAuthenticated: (user: AuthUser) => void;
}

export default function LoginScreen({ authProvider, onAuthenticated }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runAuth = async (action: () => Promise<AuthUser>) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const user = await action();
      onAuthenticated(user);
    } catch {
      setError('Sign in failed. Please try again.');
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

  const handleGoogleLogin = () => {
    void runAuth(() => authProvider.signInWithGoogle());
  };

  const handlePhoneLogin = () => {
    if (loading || !phone.trim()) return;
    void runAuth(() => authProvider.signInWithPhone(phone.trim()));
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
  };

  const inputClass = 'w-full bg-ink-900/60 border border-ink-700/50 rounded-xl pl-11 pr-4 py-3 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/50 focus:ring-1 focus:ring-wardrobe-accent-gold/30 transition-all';
  const labelClass = 'block text-xs font-medium text-ink-400 mb-2 uppercase tracking-wider';

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-900 via-ink-800 to-ink-900 text-ink-100 relative overflow-hidden flex flex-col">
      {authProvider.isDemo && <DemoModeBanner />}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-wardrobe-accent-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-wardrobe-accent-rose/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-wardrobe-accent-gold/10 rounded-full animate-float-slow pointer-events-none" />
      <div className="absolute bottom-32 right-16 w-24 h-24 border border-wardrobe-accent-rose/10 rounded-full animate-float-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-wardrobe-accent-gold to-amber-700 shadow-xl shadow-wardrobe-accent-gold/20 mb-4 animate-door-glow">
            <Layers className="w-8 h-8 text-ink-900" />
          </div>
          <h1 className="font-serif text-4xl text-ink-50 mb-2 tracking-wide">
            <span className="bg-gradient-to-r from-wardrobe-accent-gold via-amber-200 to-wardrobe-accent-gold bg-[length:200%_auto] animate-shimmer-gold bg-clip-text text-transparent">
              My Wardrobe
            </span>
          </h1>
          <p className="text-ink-400 text-sm">Your personal closet, beautifully organized</p>
        </div>

        {/* Auth card */}
        <div className="bg-ink-800/60 backdrop-blur-xl border border-ink-700/50 rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-900/50 border border-ink-700/30 mb-6">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 text-ink-900 shadow-md'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Welcome Back
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 text-ink-900 shadow-md'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Create Profile
            </button>
          </div>

          {/* Social login buttons */}
          <div className="space-y-2.5 mb-5">
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium text-ink-100 bg-ink-900/60 border border-ink-700/50 hover:bg-ink-700/40 hover:border-ink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Phone */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-ink-900/60 border border-ink-700/50 rounded-xl overflow-hidden focus-within:border-wardrobe-accent-gold/50 transition-all">
                <Phone className="w-4 h-4 text-ink-500 ml-3.5 flex-shrink-0" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="flex-1 bg-transparent px-3 py-3 text-sm text-ink-100 placeholder-ink-500 focus:outline-none"
                />
                <button
                  onClick={handlePhoneLogin}
                  disabled={loading || !phone.trim()}
                  className="flex items-center gap-1 px-4 py-3 text-xs font-medium text-sky-300 hover:text-sky-200 border-l border-ink-700/50 hover:bg-sky-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send Code
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-ink-700/40" />
            <span className="text-xs text-ink-500 uppercase tracking-wider">or with email</span>
            <div className="flex-1 h-px bg-ink-700/40" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className={labelClass}>Your Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className={inputClass}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className={`${inputClass} pr-11`}
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2.5 animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" />
                  Please wait...
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'Step Inside' : 'Create My Wardrobe'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-ink-500 mt-5">
            {mode === 'login' ? (
              <>
                New here?{' '}
                <button onClick={() => switchMode('signup')} className="text-wardrobe-accent-gold hover:text-amber-300 transition-colors font-medium">
                  Create your profile
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-wardrobe-accent-gold hover:text-amber-300 transition-colors font-medium">
                  Welcome back
                </button>
              </>
            )}
          </p>
        </div>

        {/* Tagline */}
        <div className="text-center mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-600">
          <Sparkles className="w-3 h-3 text-wardrobe-accent-gold/40" />
          <span>Where style meets organization</span>
        </div>
      </div>
      </div>
    </div>
  );
}
