// ============================================================================
// AMIE CLINICAL COPILOT - ENTRY POINT PRINCIPAL & SHIELD DE TELEMETRÍA
// frontend/index.tsx
// ============================================================================

// 1. Interceptor de red para Vertex AI / Proxy Express
try {
  await import('./vertex-ai-proxy-interceptor.js');
} catch (e) {
  console.warn('[AMIE Core] Interceptor de Vertex AI no disponible o en modo local directo:', e);
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// ----------------------------------------------------------------------------
// ESCUDO GLOBAL CONTRA EXCEPCIONES ASÍNCRONAS DE HARDWARE Y WEBGL
// (Captura errores que ocurren fuera del árbol de renderizado de React)
// ----------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const error = event.reason;
    const errorName = error?.name || '';
    const errorMsg = error?.message || String(error);

    // Ignorar cancelaciones intencionales del médico en diálogos de hardware
    if (errorName === 'NotFoundError' || errorMsg.includes('No port selected') || errorMsg.includes('User cancelled')) {
      event.preventDefault();
      console.log('ℹ️ [AMIE Hardware] Selección de dispositivo cancelada por el usuario.');
      return;
    }

    // Advertencia controlada para pérdida de contexto WebGL o reconexión WebXR
    if (errorMsg.includes('WebGL context was lost') || errorMsg.includes('XR session')) {
      event.preventDefault();
      console.warn('⚠️ [AMIE WebXR] Contexto gráfico reseteado o suspendido temporalmente:', errorMsg);
      return;
    }

    console.error('🛑 [AMIE Global Async Error]:', error);
  });

  window.addEventListener('error', (event: ErrorEvent) => {
    if (event.message?.includes('ResizeObserver loop limit exceeded')) {
      event.stopImmediatePropagation();
      return;
    }
  });
}

// ----------------------------------------------------------------------------
// MONTAJE Y BOOTSTRAP DEL ÁRBOL REACT
// ----------------------------------------------------------------------------
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se encontró el contenedor '#root' en index.html para montar la suite clínica AMIE.");
}

const root = ReactDOM.createRoot(rootElement);

// NOTA DE PRODUCCIÓN CLÍNICA:
// Se monta ErrorBoundary directamente como escudo raíz. Se desactiva StrictMode
// para evitar el doble ciclo de montaje/desmontaje en desarrollo, protegiendo
// los locks síncronos de Web Serial API, AudioContext y Three.js WebXR.
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
