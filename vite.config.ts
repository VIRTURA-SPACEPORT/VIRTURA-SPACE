import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { supabaseProjectUrl } from './config/project.ts';

const proxy = {
  '/supabase': {
    target: supabaseProjectUrl,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/supabase/, ''),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
