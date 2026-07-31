import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { AuthGateProvider } from './context/AuthGateContext';
import { CheckoutProvider } from './context/CheckoutContext';
import { VerificationGateProvider } from './context/VerificationGateContext';
import { ToastProvider } from './shared/Toast';
import { queryClient } from './lib/queryClient';
import { persistOptions } from './lib/queryPersister';
import ErrorBoundary from './shared/ErrorBoundary';
import './index.css';
import { initPwaServiceWorker } from './pwa/registerServiceWorker';

initPwaServiceWorker();

onlineManager.setEventListener((setOnline) => {
  const onOnline = () => setOnline(true);
  const onOffline = () => setOnline(false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  setOnline(navigator.onLine);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
        onSuccess={() => {
          queryClient.resumePausedMutations().catch(() => {});
        }}
      >
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <AuthGateProvider>
              <CheckoutProvider>
                <VerificationGateProvider>
                  <ToastProvider>
                    <App />
                  </ToastProvider>
                </VerificationGateProvider>
              </CheckoutProvider>
            </AuthGateProvider>
          </AuthProvider>
        </BrowserRouter>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
