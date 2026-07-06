import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // يمنع Vite من التبديل إلى 5174 — يجب أن يطابق Authorized JavaScript origins في Google
    strictPort: true,
  },
})
