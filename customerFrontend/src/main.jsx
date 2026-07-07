import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { VerificationGateProvider } from './context/VerificationGateContext';
import { ToastProvider } from './shared/Toast';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './shared/ErrorBoundary';
import './index.css';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <VerificationGateProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </VerificationGateProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);