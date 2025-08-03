import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React refresh
      fastRefresh: true,
    }),
  ],
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true,
    cors: true, // Enable CORS
  },
  build: {
    outDir: 'build',
    sourcemap: true, // Enable source maps for debugging
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'], // Pre-bundle these dependencies
  },

});
