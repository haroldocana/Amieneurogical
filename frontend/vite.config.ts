import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      define: {
        // Marcador genérico, correctamente ignorado como indicas
        'process.env.API_KEY' : JSON.stringify('api-key-this-is-not-used-can-be-ignored!'),
      },
      server: {
        proxy: {
          // Redirige las peticiones al backend Node.js (evita errores de CORS en desarrollo)
          '/api-proxy': 'http://localhost:5000',
          // Crucial para la transcripción en tiempo real de Vapi IA o telemetría en vivo
          '/ws-proxy': { target: 'ws://localhost:5000', ws: true },
        },
      },
      // CORRECCIÓN AQUÍ: react() debe estar dentro de un arreglo [ ]
      plugins: [react()], 
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
