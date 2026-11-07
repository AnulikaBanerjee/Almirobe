import type { ReactNode } from 'react';

interface OrnatePageFrameProps {
  children: ReactNode;
  className?: string;
  /** Taller scroll area for full-screen auth pages */
  tall?: boolean;
  /** Fill the parent height; children manage their own scroll regions */
  fill?: boolean;
}

export default function OrnatePageFrame({ children, className = '', tall, fill }: OrnatePageFrameProps) {
  return (
    <div
      className={`ornate-frame w-full mx-auto ${
        fill ? 'ornate-frame-fill h-full max-w-none flex flex-col min-h-0' : tall ? 'max-w-6xl' : 'max-w-5xl'
      } ${className}`}
    >
      <div className="ornate-frame-corners" aria-hidden="true" />
      <div
        className={
          fill
            ? 'relative flex-1 min-h-0 overflow-hidden flex flex-col'
            : `ornate-frame-scroll custom-scrollbar ${tall ? 'ornate-frame-scroll-tall' : ''}`
        }
      >
        {children}
      </div>
    </div>
  );
}
