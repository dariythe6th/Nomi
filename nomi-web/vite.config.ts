import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/motis': {
        target: 'https://api.transitous.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/motis/, '/api/v2'),
        headers: {
          'User-Agent': 'Nomi/0.1 (diploma project; contact: kravchenko@example.com)',
        },
      },
    },
  },
});