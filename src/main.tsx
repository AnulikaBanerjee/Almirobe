import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthSessionProvider } from '@/auth/AuthSessionContext';
import { AppImageStorageProvider } from '@/images';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <AppImageStorageProvider>
          <App />
        </AppImageStorageProvider>
      </AuthSessionProvider>
    </QueryClientProvider>
  </StrictMode>
);
