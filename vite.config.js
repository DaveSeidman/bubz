import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/blow-a-bubble/',
  plugins: [
    react(),
  ],
  server: {
    port: 8080,
    host: true,
  },
});
