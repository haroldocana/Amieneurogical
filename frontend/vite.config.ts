import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      // Marcador genérico, correctamente ignorado
      'process.env.API_KEY': JSON.stringify('api-key-this-is-not-used-can-be-ignored!'),
    },
    server: {
      proxy: {
        // Redirige las peticiones al backend Node.js (evita errores de CORS en desarrollo)
        '/api-proxy': 'http://localhost:5000',
        // Crucial para la transcripción en tiempo real de Vapi IA o telemetría en vivo
        '/ws-proxy': { target: 'ws://localhost:5000', ws: true },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'Centinela AMIE',
          short_name: 'Centinela',
          description: 'Monitoreo de Telemetría Clínica 24/7',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/paciente',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/2965/2965311.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/2965/2965311.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
