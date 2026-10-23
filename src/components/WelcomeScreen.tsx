import { useEffect, useRef } from 'react';

interface WelcomeScreenProps {
  userName: string | null;
  onDone: () => void;
}

export default function WelcomeScreen({ userName, onDone }: WelcomeScreenProps) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const greeting = userName?.trim() ? `Welcome ${userName.trim()}` : 'Welcome';
  const letters = Array.from(greeting);

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#fffdf8] via-[#f7f1e6] to-[#efe6d4]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.22),transparent_58%)]" />
      <h1
        className="relative z-10 px-6 text-center font-elite italic text-ink-800"
        style={{ fontSize: 'clamp(2.4rem, 7vw, 4.6rem)', letterSpacing: '0.04em', fontWeight: 500 }}
        aria-label={greeting}
      >
        {letters.map((char, index) => (
          <span
            key={`${char}-${index}`}
            className="inline-block animate-welcome-letter"
            style={{
              animationDelay: `${index * 45}ms`,
              opacity: 0,
              whiteSpace: char === ' ' ? 'pre' : undefined,
              minWidth: char === ' ' ? '0.35em' : undefined,
            }}
          >
            {char}
          </span>
        ))}
      </h1>
    </div>
  );
}
