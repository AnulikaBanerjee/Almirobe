interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-9 w-auto',
  md: 'h-14 w-auto',
  lg: 'h-16 w-auto',
};

export default function AppLogo({ size = 'md', className = '' }: AppLogoProps) {
  return (
    <img
      src="/almirah-mark.png"
      alt=""
      aria-hidden="true"
      className={`${sizeClasses[size]} object-contain drop-shadow-md ${className}`}
    />
  );
}
