/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        elite: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        wardrobe: {
          wood: {
            light: '#f7f4ee',
            mid: '#ece7dc',
            dark: '#c9b896',
            darker: '#b08d4f',
          },
          panel: '#f8f6f1',
          frame: '#c4a35a',
          interior: '#fffdf8',
          accent: {
            gold: '#c9a96e',
            rose: '#b76e79',
          },
        },
        ink: {
          900: '#1a1614',
          850: '#25211c',
          800: '#2a2420',
          700: '#3a3330',
          600: '#4a423d',
          500: '#5e554f',
          400: '#7a7068',
          300: '#9a918a',
          200: '#c4bab2',
          100: '#e8e2dc',
          50: '#f5f1ec',
        },
      },
      keyframes: {
        doorOpenLeft: {
          '0%': { transform: 'perspective(1200px) rotateY(0deg)' },
          '100%': { transform: 'perspective(1200px) rotateY(-105deg)' },
        },
        doorOpenRight: {
          '0%': { transform: 'perspective(1200px) rotateY(0deg)' },
          '100%': { transform: 'perspective(1200px) rotateY(105deg)' },
        },
        doorCloseLeft: {
          '0%': { transform: 'perspective(1200px) rotateY(-105deg)' },
          '100%': { transform: 'perspective(1200px) rotateY(0deg)' },
        },
        doorCloseRight: {
          '0%': { transform: 'perspective(1200px) rotateY(105deg)' },
          '100%': { transform: 'perspective(1200px) rotateY(0deg)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        handleGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(201,169,110,0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(201,169,110,0.8)' },
        },
        basketFall: {
          '0%': { transform: 'translateY(-60px) rotate(0deg)', opacity: '0' },
          '60%': { transform: 'translateY(10px) rotate(-8deg)', opacity: '1' },
          '75%': { transform: 'translateY(-5px) rotate(6deg)' },
          '100%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
        },
        basketShake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(-3deg)' },
          '40%': { transform: 'rotate(3deg)' },
          '60%': { transform: 'rotate(-2deg)' },
          '80%': { transform: 'rotate(2deg)' },
        },
        clothesScatter: {
          '0%': { transform: 'translate(0, 0) rotate(0deg) scale(0.8)', opacity: '0' },
          '100%': { transform: 'translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1)', opacity: '1' },
        },
        basketTip: {
          '0%': { transform: 'rotate(0deg) translateY(0)' },
          '30%': { transform: 'rotate(-25deg) translateY(-10px)' },
          '60%': { transform: 'rotate(-45deg) translateY(5px)' },
          '100%': { transform: 'rotate(-75deg) translateY(20px)', opacity: '0.3' },
        },
        loginDoorOpen: {
          '0%': { transform: 'perspective(1400px) rotateY(0deg)', opacity: '1' },
          '100%': { transform: 'perspective(1400px) rotateY(-110deg)', opacity: '0.5' },
        },
        shimmerGold: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        welcomeFade: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        welcomeText: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        welcomeLetter: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        doorGlow: {
          '0%, 100%': { boxShadow: '0 0 30px rgba(201,169,110,0.2)' },
          '50%': { boxShadow: '0 0 60px rgba(201,169,110,0.4)' },
        },
      },
      animation: {
        'door-open-left': 'doorOpenLeft 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'door-open-right': 'doorOpenRight 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'door-close-left': 'doorCloseLeft 1.0s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'door-close-right': 'doorCloseRight 1.0s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'handle-glow': 'handleGlow 2s ease-in-out infinite',
        'basket-fall': 'basketFall 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'basket-shake': 'basketShake 0.5s ease-in-out',
        'basket-tip': 'basketTip 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'login-door-open': 'loginDoorOpen 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shimmer-gold': 'shimmerGold 3s linear infinite',
        'float-slow': 'floatSlow 4s ease-in-out infinite',
        'welcome-fade': 'welcomeFade 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'welcome-text': 'welcomeText 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'welcome-letter': 'welcomeLetter 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'door-glow': 'doorGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
