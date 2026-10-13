import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Resolución segura de __dirname en ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Carga variables de entorno locales y de Render
  const env = loadEnv(mode, process.cwd(), '');

  const backendHttpTarget = env.VITE_API_URL || 'http://localhost:10000';
  const backendWsTarget = env.VITE_WS_URL || 'ws://localhost:10000';
  const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';

  return {
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
    },

    // ------------------------------------------------------------------------
    // SERVIDOR DE DESARROLLO (WEBXR & ACCESO DESDE VISORES EN RED LOCAL)
    // ------------------------------------------------------------------------
    server: {
      port: 3000,
      host: true, // Expone en 0.0.0.0 para conexión directa desde Meta Quest / Pico 3
      cors: true,
      proxy: {
        // Enrutador HTTP hacia el backend Express
        '/api-proxy': {
          target: backendHttpTarget,
          changeOrigin: true,
          secure: false,
        },
        // Enrutador WebSocket para telemetría de 60 Hz en tiempo real
        '/ws-proxy': {
          target: backendWsTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // ------------------------------------------------------------------------
    // PIPELINE DE PLUGINS (REACT + PWA CLÍNICA)
    // ------------------------------------------------------------------------
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        workbox: {
          // Permite cachear librerías 3D pesadas y assets WebXR sin abortar el build
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024, // 12 MB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,wasm}'],
          // Excluye sockets y endpoints dinámicos del cache offline
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
    // RESOLUCIÓN DE RUTAS (ESTRUCTURA SIN CARPETA SRC)
    // ------------------------------------------------------------------------
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // ------------------------------------------------------------------------
    // COMPILACIÓN Y CODE-SPLITTING POR FUNCIÓN (CERO CONFLICTOS EN THREE.JS)
    // ------------------------------------------------------------------------
    build: {
      target: 'esnext',
      outDir: 'dist',
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Confinamiento integral de Three.js y sus extensiones JSM
              if (
                id.includes('three') ||
                id.includes('@react-three/fiber') ||
                id.includes('@react-three/drei') ||
                id.includes('@react-three/xr')
              ) {
                return 'vendor-three';
              }
              // Núcleo de React y enrutamiento
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router-dom')
              ) {
                return 'vendor-react';
              }
              // Gráficas de bioseñales
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              // SDK de Inteligencia Artificial
              if (id.includes('@google/generative-ai')) {
                return 'vendor-ai';
              }
            }
          },
        },
      },
    },
  };
});
