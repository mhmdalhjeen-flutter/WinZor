import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { VerificationGateProvider } from './context/VerificationGateContext';
import { ToastProvider } from './shared/Toast';
import { queryClient } from './lib/queryClient';
import './index.css';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VerificationGateProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </VerificationGateProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);