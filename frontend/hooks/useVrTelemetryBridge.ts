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
  type?: string;
  ecosystem?: string;
  metrics?: VrMetrics;
  reactionTimeMs?: number;
  omissions?: number;
  commissions?: number;
  habituationIndex?: number;
  hits?: number;
  [key: string]: any;
}

const BACKEND_DOMAIN = 'amieneurogical.onrender.com';
const WS_URL = `wss://${BACKEND_DOMAIN}`;

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

  const normalizePacket = (raw: any): VrStreamPayload => {
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
        hits: raw.hits ?? metrics.hits ?? 0
      }
    };
  };

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
          ws.send(JSON.stringify({ type: 'HANDSHAKE', patientId, role: mode, moduleName, timestamp: Date.now() }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'HANDSHAKE_ACK' || data.type === 'PEER_CONNECTED') {
              setIsPeerConnected(true);
              return;
            }
            if (data.type === 'START_TEST') return setRemoteCommand('START_TEST');
            if (data.type === 'STOP_TEST') return setRemoteCommand('STOP_TEST');

            if (data && (data.patientId === patientId || !data.patientId)) {
              setIsPeerConnected(true);
              setLiveData(normalizePacket(data));
            }
          } catch (e) {}
        };

        ws.onerror = () => {
          if (!isMounted) return;
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
        setIsConnected(false);
        setIsPeerConnected(false);
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [mode, patientId, moduleName]);

  const syncSession = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'HANDSHAKE', patientId, role: mode, moduleName, timestamp: Date.now() }));
    }
  }, [mode, patientId, moduleName]);

  const sendRemoteStart = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'START_TEST', patientId, moduleName, timestamp: Date.now() }));
    }
  }, [patientId, moduleName]);

  const transmit = useCallback(async (metricsData: VrMetrics | any) => {
    // ⚠️ ELIMINADO: if (mode !== 'sender') return; 
    // Ahora la consola del doctor TAMBIÉN puede enviar comandos (ej. LOAD_MODULE)
    
    const metrics: VrMetrics = metricsData.metrics ? metricsData.metrics : metricsData;
    const payload: VrStreamPayload = normalizePacket({ patientId, moduleName, timestamp: Date.now(), type: 'METRICS', metrics, ...metricsData });

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      return;
    }
  }, [patientId, moduleName]);

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
