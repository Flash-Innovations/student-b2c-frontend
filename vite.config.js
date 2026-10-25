import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5180,
    proxy: {
      // B2C Backend Proxy
      '/api/b2c': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      // Practice Platform Backend Proxy (Unified Backend on port 5001)
      '/practice-api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/practice-api/, '')
      },
      // AI Backend Proxy (Mock Interviews & Assistants)
      '/ai-api': {
        target: 'http://localhost:5055',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai-api/, '')
      },
      // WebSocket Proxy for Gemini Live Audio Mock Interview
      '/ws/interview': {
        target: 'ws://localhost:5055',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
