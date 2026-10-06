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
  type?: 'HANDSHAKE' | 'HANDSHAKE_ACK' | 'PEER_CONNECTED' | 'METRICS' | 'START_TEST' | 'STOP_TEST';
  metrics?: VrMetrics;
  // Compatibilidad directa para componentes que leen lastPacket
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
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);
  const [remoteCommand, setRemoteCommand] = useState<'START_TEST' | 'STOP_TEST' | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Normalizador de datos para garantizar lectura limpia en la UI
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
      type: raw.type || 'METRICS',
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
  // CONEXIÓN WEBSOCKET SEGURO (WSS) CON HANDSHAKE DE EMPAREJAMIENTO
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
          console.log(`[VR Telemetry Bridge] Conectado vía WSS (${mode}) para ${patientId}`);

          // 1. Envío automático de Handshake para enlazar la sala
          ws.send(JSON.stringify({
            type: 'HANDSHAKE',
            patientId,
            role: mode,
            moduleName,
            timestamp: Date.now()
          }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            // Eventos de emparejamiento entre PC y Visor
            if (data.type === 'HANDSHAKE_ACK' || data.type === 'PEER_CONNECTED') {
              setIsPeerConnected(true);
              return;
            }

            // Comandos remotos recibidos
            if (data.type === 'START_TEST') {
              setRemoteCommand('START_TEST');
              return;
            }

            if (data.type === 'STOP_TEST') {
              setRemoteCommand('STOP_TEST');
              return;
            }

            // Paquetes de telemetría biométrica
            if (data && (data.patientId === patientId || !data.patientId)) {
              setIsPeerConnected(true);
              setLiveData(normalizePacket(data));
            }
          } catch (e) {
            console.warn('[VR Telemetry Bridge] Error procesando paquete:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('[VR Telemetry Bridge] Error WSS, reintentando...', err);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          setIsPeerConnected(false);
          reconnectTimerRef.current = setTimeout(connectWs, 3000);
        };
      } catch (e) {
        console.error('[VR Telemetry Bridge] Error creando WebSocket:', e);
        setIsConnected(false);
        setIsPeerConnected(false);
      }
    };

    connectWs();

    // Polling HTTP secundario en caso de fallo estricto de WS
    const pollInterval = setInterval(async () => {
      if (mode === 'receiver' && (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)) {
        try {
          const res = await fetch(`${HTTP_URL}/api/vr/stream?patientId=${patientId}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.timestamp) {
              setLiveData(normalizePacket(data));
              setIsConnected(true);
              setIsPeerConnected(true);
            }
          }
        } catch (err) {
          // Esperando datos de manera silenciosa
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
  // MÉTODOS DE SINCRONIZACIÓN Y TRANSMISIÓN
  // -------------------------------------------------------------------------

  // Forza una solicitud de sincronización instantánea (Handshake manual)
  const syncSession = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'HANDSHAKE',
        patientId,
        role: mode,
        moduleName,
        timestamp: Date.now()
      }));
    }
  }, [mode, patientId, moduleName]);

  // Permite a la PC enviar la señal para arrancar el test en el casco
  const sendRemoteStart = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'START_TEST',
        patientId,
        moduleName,
        timestamp: Date.now()
      }));
    }
  }, [patientId, moduleName]);

  // Transmisión de métricas desde el casco Meta Quest
  const transmit = useCallback(async (metricsData: VrMetrics | any) => {
    if (mode !== 'sender') return;

    const metrics: VrMetrics = metricsData.metrics ? metricsData.metrics : metricsData;

    const payload: VrStreamPayload = normalizePacket({
      patientId,
      moduleName,
      timestamp: Date.now(),
      type: 'METRICS',
      metrics,
      ...metrics
    });

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      return;
    }

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
        console.error('[VR Telemetry Bridge] Fallo en transmisión HTTP:', relErr);
      }
    }
  }, [mode, patientId, moduleName]);

  return {
    isConnected: isConnected || isPeerConnected,
    isPeerConnected,
    isStreaming: isConnected || isPeerConnected,
    liveData,
    lastPacket: liveData,
    remoteCommand,
    syncSession,
    sendRemoteStart,
    transmit
  };
};
