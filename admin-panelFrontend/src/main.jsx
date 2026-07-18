import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider, onlineManager } from '@tanstack/react-query'
import App from './App.jsx'
import { ToastProvider } from './shared/Toast.jsx'
import ErrorBoundary from './shared/ErrorBoundary'
import { queryClient } from './lib/queryClient'
import './style/index.css'
import { initPwaServiceWorker } from './pwa/registerServiceWorker'

initPwaServiceWorker()

onlineManager.setEventListener((setOnline) => {
  const onOnline = () => setOnline(true)
  const onOffline = () => setOnline(false)
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  setOnline(navigator.onLine)
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
