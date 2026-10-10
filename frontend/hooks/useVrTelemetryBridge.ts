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
  headYaw?: number;
  headPitch?: number;
  attentionIndex?: number;
}

export interface VrStreamPayload {
  patientId: string;
  moduleName: string;
  timestamp: number;
  type?: string;
  ecosystem?: string;
  isVideo?: boolean;
  initialHz?: number;
  metrics?: VrMetrics;
  reactionTimeMs?: number;
  omissions?: number;
  commissions?: number;
  habituationIndex?: number;
  hits?: number;
  [key: string]: any;
}

// Determinación fija de la URL del WebSocket hacia el BACKEND de Render
const getSafeWsUrl = (): string => {
  if (typeof window !== 'undefined') {
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${protocol}//${window.location.hostname}:10000`;
    }

    // Apunta directamente al Backend en Render (evita el host del frontend)
    return 'wss://amieneurogical.onrender.com';
  }

  return 'wss://amieneurogical.onrender.com';
};

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

  const normalizePacket = useCallback((raw: any): VrStreamPayload => {
    const metrics = raw.metrics || {};
    return {
      ...raw,
      patientId: raw.patientId || patientId,
      moduleName: raw.moduleName || moduleName,
      timestamp: raw.timestamp || Date.now(),
      type: raw.type || 'METRICS',
      metrics: {
        ...metrics,
        reactionTimeMs: raw.reactionTimeMs ?? metrics.reactionTimeMs ?? 0,
        omissions: raw.omissions ?? metrics.omissions ?? 0,
        commissions: raw.commissions ?? metrics.commissions ?? 0,
        habituationIndex: raw.habituationIndex ?? metrics.habituationIndex ?? 0,
        hits: raw.hits ?? metrics.hits ?? 0,
        gsr: raw.gsr ?? metrics.gsr ?? 3.5,
        hrv: raw.hrv ?? metrics.hrv ?? 70,
        attentionIndex: raw.attentionIndex ?? metrics.attentionIndex ?? 85
      }
    };
  }, [patientId, moduleName]);

  useEffect(() => {
    if (!patientId) return;
    let isMounted = true;

    const connectWs = () => {
      try {
        const wsUrl = getSafeWsUrl();
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          try {
            ws.send(JSON.stringify({ 
              type: 'HANDSHAKE', 
              patientId, 
              role: mode, 
              moduleName, 
              timestamp: Date.now() 
            }));
          } catch (e) {
            console.warn('Error en handshake inicial:', e);
          }
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'HANDSHAKE_ACK' || data.type === 'PEER_CONNECTED') {
              setIsPeerConnected(true);
              return;
            }

            if (data.type === 'START_TEST') setRemoteCommand('START_TEST');
            if (data.type === 'STOP_TEST') setRemoteCommand('STOP_TEST');

            if (data && (data.patientId === patientId || !data.patientId)) {
              setIsPeerConnected(true);
              setLiveData(normalizePacket(data));
            }
          } catch (e) {
            console.warn('Error al procesar paquete WS:', e);
          }
        };

        ws.onerror = (err) => {
          if (!isMounted) return;
          console.warn('Conexión WebSocket en reintento:', err);
          setIsConnected(false);
          setIsPeerConnected(false);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          setIsPeerConnected(false);
          reconnectTimerRef.current = setTimeout(connectWs, 3000);
        };
      } catch (e) {
        console.error('Error al instanciar WebSocket:', e);
        if (isMounted) {
          setIsConnected(false);
          setIsPeerConnected(false);
          reconnectTimerRef.current = setTimeout(connectWs, 4000);
        }
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [mode, patientId, moduleName, normalizePacket]);

  const syncSession = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ 
          type: 'HANDSHAKE', 
          patientId, 
          role: mode, 
          moduleName, 
          timestamp: Date.now() 
        }));
      } catch (e) {
        console.warn('Error en syncSession:', e);
      }
    }
  }, [mode, patientId, moduleName]);

  const sendRemoteStart = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ 
          type: 'START_TEST', 
          patientId, 
          moduleName, 
          timestamp: Date.now() 
        }));
      } catch (e) {
        console.warn('Error en sendRemoteStart:', e);
      }
    }
  }, [patientId, moduleName]);

  const transmit = useCallback(async (metricsData: VrMetrics | any) => {
    const isObject = typeof metricsData === 'object' && metricsData !== null;
    const packetType = isObject && metricsData.type ? metricsData.type : 'METRICS';
    const metrics: VrMetrics = isObject && metricsData.metrics ? metricsData.metrics : metricsData;

    const payload: VrStreamPayload = normalizePacket({
      patientId,
      moduleName,
      timestamp: Date.now(),
      ...metricsData,
      type: packetType,
      metrics
    });

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(payload));
      } catch (e) {
        console.warn('Error en transmit:', e);
      }
    }
  }, [patientId, moduleName, normalizePacket]);

  return { 
    isConnected, 
    isPeerConnected, 
    isStreaming: isConnected && isPeerConnected, 
    liveData, 
    lastPacket: liveData, 
    remoteCommand, 
    syncSession, 
    sendRemoteStart, 
    transmit 
  };
};
