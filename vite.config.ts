import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

const webcliHost = process.env.OCTRA_WEBCLI_HOST ?? '127.0.0.1';
const webcliPort = process.env.OCTRA_WEBCLI_PORT ?? '8420';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://${webcliHost}:${webcliPort}`,
        changeOrigin: true,
      },
    },
  },
});
