import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Resolución segura de __dirname en módulos ES
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Carga todas las variables de entorno disponibles
  const env = loadEnv(mode, process.cwd(), '');

  const backendHttpTarget = env.VITE_API_URL || 'http://localhost:5000';
  const backendWsTarget = env.VITE_WS_URL || 'ws://localhost:5000';

  return {
    define: {
      'process.env.API_KEY': JSON.stringify(''),
    },

    // ------------------------------------------------------------------------
    // SERVIDOR DE DESARROLLO (OPTIMIZADO PARA VISORES VR PICO / META QUEST)
    // ------------------------------------------------------------------------
    server: {
      port: 3000,
      host: true, // Expone en 0.0.0.0 para acceso directo desde el visor VR en la misma red Wi-Fi
      cors: true,
      proxy: {
        // Enrutador HTTP hacia el backend Express / Microservicio de Telemetría
        '/api-proxy': {
          target: backendHttpTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (pathStr) => pathStr,
        },
        // Enrutador WebSocket para telemetría continua de 60 Hz
        '/ws-proxy': {
          target: backendWsTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // ------------------------------------------------------------------------
    // PIPELINE DE PLUGINS (REACT + PROGRESSIVE WEB APP CLINICA)
    // ------------------------------------------------------------------------
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        workbox: {
          // Permite empaquetar librerías pesadas como Three.js y WASM sin abortar el build
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024, // 12 MB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,wasm}'],
          // Excluye las rutas de WebSockets y API de telemetría para evitar interferencias
          navigateFallbackDenylist: [/^\/api-proxy/, /^\/ws-proxy/, /^\/api/],
          cleanupOutdatedCaches: true,
        },
        includeAssets: ['favicon.ico', 'robots.txt'],
        manifest: {
          name: 'AMIE Clinical Copilot - Centinela JITAI',
          short_name: 'AMIE Centinela',
          description: 'Copiloto Clínico Psiquiátrico, Telemetría Biomédica y WebXR',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],

    // ------------------------------------------------------------------------
    // RESOLUCIÓN DE RUTAS Y ALIASES (ESTRUCTURA SIN CARPETA SRC)
    // ------------------------------------------------------------------------
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // ------------------------------------------------------------------------
    // COMPILACIÓN Y CODE-SPLITTING DEFENSIVO PARA RENDIMIENTO EN VISORES
    // ------------------------------------------------------------------------
    build: {
      target: 'esnext', // Obligatorio para soportar top-level await en index.tsx
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          // Desacopla Three.js, Recharts y SDK de IA en fragmentos independientes
          manualChunks: {
            'vendor-three': [
              'three',
              '@react-three/fiber',
              '@react-three/drei',
              '@react-three/xr',
            ],
            'vendor-react': [
              'react',
              'react-dom',
              'react-router-dom',
            ],
            'vendor-charts': [
              'recharts',
            ],
            'vendor-ai': [
              '@google/generative-ai',
            ],
          },
        },
      },
    },
  };
});
