import { useEffect, useRef, useState } from 'react';
import { Layers, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  userName: string | null;
  onDone: () => void;
}

export default function WelcomeScreen({ userName, onDone }: WelcomeScreenProps) {
  const [phase, setPhase] = useState<'doors' | 'open' | 'reveal'>('doors');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('open'), 400);
    const t2 = setTimeout(() => setPhase('reveal'), 1600);
    const t3 = setTimeout(() => onDoneRef.current(), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const greeting = userName ? `Welcome, ${userName}` : 'Welcome back';

  return (
    <div className="fixed inset-0 z-[100] bg-ink-900 flex items-center justify-center overflow-hidden">
      {/* Ambient glow behind doors */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full blur-[100px] transition-all duration-1000"
        style={{
          backgroundColor: 'rgba(201, 169, 110, 0.15)',
          opacity: phase === 'doors' ? 0.05 : 0.25,
        }}
      />

      {/* Wardrobe doors */}
      <div className="relative w-full max-w-lg h-[400px] flex">
        {/* Left door */}
        <div
          className="flex-1 origin-right relative transition-transform duration-[1200ms]"
          style={{
            transformStyle: 'preserve-3d',
            transform: phase === 'doors' ? 'perspective(1400px) rotateY(0deg)' : 'perspective(1400px) rotateY(-105deg)',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="absolute inset-0 rounded-l-2xl border-2 border-wardrobe-wood-dark/60 closet-interior shadow-2xl overflow-hidden">
            {/* Wood panel detail */}
            <div className="absolute inset-2 rounded-xl border border-wardrobe-wood-dark/40 wood-grain opacity-40" />
            {/* Handle */}
            <div className="absolute top-1/2 right-3 -translate-y-1/2 w-1.5 h-16 rounded-full bg-gradient-to-b from-wardrobe-accent-gold to-amber-700 shadow-lg" />
            {/* Decorative panel lines */}
            <div className="absolute top-6 bottom-6 left-6 right-10 border border-wardrobe-wood-dark/20 rounded-lg" />
          </div>
        </div>

        {/* Right door */}
        <div
          className="flex-1 origin-left relative transition-transform duration-[1200ms]"
          style={{
            transformStyle: 'preserve-3d',
            transform: phase === 'doors' ? 'perspective(1400px) rotateY(0deg)' : 'perspective(1400px) rotateY(105deg)',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="absolute inset-0 rounded-r-2xl border-2 border-wardrobe-wood-dark/60 closet-interior shadow-2xl overflow-hidden">
            <div className="absolute inset-2 rounded-xl border border-wardrobe-wood-dark/40 wood-grain opacity-40" />
            <div className="absolute top-1/2 left-3 -translate-y-1/2 w-1.5 h-16 rounded-full bg-gradient-to-b from-wardrobe-accent-gold to-amber-700 shadow-lg" />
            <div className="absolute top-6 bottom-6 right-6 left-10 border border-wardrobe-wood-dark/20 rounded-lg" />
          </div>
        </div>

        {/* Light spilling through the gap */}
        {phase !== 'doors' && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-[300px] bg-gradient-to-b from-transparent via-wardrobe-accent-gold/40 to-transparent animate-fade-in"
            style={{ transitionDelay: '0.3s' }}
          />
        )}
      </div>

      {/* Welcome message — revealed after doors open */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="animate-welcome-fade" style={{ animationDelay: '0s' }}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-wardrobe-accent-gold to-amber-700 shadow-xl shadow-wardrobe-accent-gold/30 mb-4">
              <Layers className="w-7 h-7 text-ink-900" />
            </div>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-ink-50 mb-2 animate-welcome-text" style={{ animationDelay: '0.2s' }}>
            {greeting}
          </h1>
          <p className="text-wardrobe-accent-gold text-base sm:text-lg animate-welcome-text flex items-center gap-2" style={{ animationDelay: '0.5s' }}>
            <Sparkles className="w-4 h-4" />
            to your wardrobe
            <Sparkles className="w-4 h-4" />
          </p>
        </div>
      )}
    </div>
  );
}
