import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // relative asset paths so the build can be hosted anywhere
  plugins: [react()],
  server: { port: 5180 },
});
