import { useState, useEffect, useRef, useCallback } from 'react';

export interface VrMetrics {
  hrv?: number;
  gsr?: number;
  reactionTimeMs?: number;
  omissions?: number;
  commissions?: number;
  stressLevel?: number;
  habituationIndex?: number;
  hits?: number;
}

export interface VrStreamPayload {
  patientId: string;
  moduleName: string;
  timestamp: number;
  metrics: VrMetrics;
  // Compatibilidad directa para componentes que leen lastPacket.reactionTimeMs
  reactionTimeMs?: number;
  omissions?: number;
  commissions?: number;
  habituationIndex?: number;
  hits?: number;
}

// Configuración de URLs públicas seguras de tu servidor en Render
const BACKEND_DOMAIN = 'amieneurogical.onrender.com';
const WS_URL = `wss://${BACKEND_DOMAIN}`;
const HTTP_URL = `https://${BACKEND_DOMAIN}`;

export const useVrTelemetryBridge = (
  mode: 'sender' | 'receiver',
  patientId: string,
  moduleName: string = 'ExecutiveControl'
) => {
  const [liveData, setLiveData] = useState<VrStreamPayload | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Normalizador de datos para garantizar lectura limpia
  const normalizePacket = (raw: any): VrStreamPayload => {
    const metrics = raw.metrics || {};
    const reactionTimeMs = raw.reactionTimeMs ?? metrics.reactionTimeMs ?? 0;
    const omissions = raw.omissions ?? metrics.omissions ?? 0;
    const commissions = raw.commissions ?? metrics.commissions ?? 0;
    const habituationIndex = raw.habituationIndex ?? metrics.habituationIndex ?? 0;
    const hits = raw.hits ?? metrics.hits ?? 0;

    return {
      patientId: raw.patientId || patientId,
      moduleName: raw.moduleName || moduleName,
      timestamp: raw.timestamp || Date.now(),
      metrics: {
        ...metrics,
        reactionTimeMs,
        omissions,
        commissions,
        habituationIndex,
        hits
      },
      reactionTimeMs,
      omissions,
      commissions,
      habituationIndex,
      hits
    };
  };

  // -------------------------------------------------------------------------
  // CONEXIÓN WEBSOCKET SEGURO (WSS) + FALLBACK AUTOMÁTICO
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!patientId) return;

    let isMounted = true;

    const connectWs = () => {
      try {
        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          console.log(`[VR Telemetry Bridge] Conectado vía WSS a ${WS_URL} (${mode})`);
          
          // Registro inicial en el canal
          ws.send(JSON.stringify({
            type: 'JOIN_ROOM',
            patientId,
            role: mode,
            moduleName
          }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data && (data.patientId === patientId || !data.patientId)) {
              setLiveData(normalizePacket(data));
            }
          } catch (e) {
            console.warn('[VR Telemetry Bridge] Error procesando paquete:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('[VR Telemetry Bridge] Error WSS, intentando reconexión...', err);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Reintentar conexión en 3 segundos
          reconnectTimerRef.current = setTimeout(connectWs, 3000);
        };
      } catch (e) {
        console.error('[VR Telemetry Bridge] Error creando WebSocket:', e);
        setIsConnected(false);
      }
    };

    connectWs();

    // Polling HTTP secundario en caso de fallo del WebSocket
    const pollInterval = setInterval(async () => {
      if (mode === 'receiver' && (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)) {
        try {
          const res = await fetch(`${HTTP_URL}/api/vr/stream?patientId=${patientId}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.timestamp) {
              setLiveData(normalizePacket(data));
              setIsConnected(true);
            }
          }
        } catch (err) {
          // Modo silencioso esperando transmisión
        }
      }
    }, 1200);

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearInterval(pollInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [mode, patientId, moduleName]);

  // -------------------------------------------------------------------------
  // TRANSMISIÓN DE TELEMETRÍA (Sender - Visor Meta Quest 3S)
  // -------------------------------------------------------------------------
  const transmit = useCallback(async (metricsData: VrMetrics | any) => {
    if (mode !== 'sender') return;

    const metrics: VrMetrics = metricsData.metrics ? metricsData.metrics : metricsData;

    const payload: VrStreamPayload = normalizePacket({
      patientId,
      moduleName,
      timestamp: Date.now(),
      metrics,
      ...metrics
    });

    // 1. Envío prioritario mediante WebSocket en tiempo real
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      return;
    }

    // 2. Envío de respaldo por HTTP POST a la URL de Render
    try {
      await fetch(`${HTTP_URL}/api/vr/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      try {
        await fetch(`/api/vr/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (relErr) {
        console.error('[VR Telemetry Bridge] Fallo en transmisión:', relErr);
      }
    }
  }, [mode, patientId, moduleName]);

  return {
    isConnected,
    isStreaming: isConnected,
    liveData,
    lastPacket: liveData,
    transmit
  };
};
