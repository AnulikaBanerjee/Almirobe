import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppImageStorageProvider } from '@/images';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppImageStorageProvider>
      <App />
    </AppImageStorageProvider>
  </StrictMode>
);
