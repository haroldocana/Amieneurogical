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
  reactionTimeMs?: number;
  omissions?: number;
  commissions?: number;
  habituationIndex?: number;
  hits?: number;
}

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

  const normalizePacket = (raw: any): VrStreamPayload => {
    const metrics = raw.metrics || {};
    return {
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

        ws.onerror = () => setIsConnected(false);
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

    const pollInterval = setInterval(async () => {
      if (mode === 'receiver' && (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)) {
        try {
          const res = await fetch(`${HTTP_URL}/api/vr/stream?patientId=${patientId}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.timestamp && data.status !== 'WAITING_STREAM') {
              setLiveData(normalizePacket(data));
              setIsConnected(true);
              setIsPeerConnected(true);
            }
          }
        } catch (err) {}
      }
    }, 1200);

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearInterval(pollInterval);
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
    if (mode !== 'sender') return;
    const metrics: VrMetrics = metricsData.metrics ? metricsData.metrics : metricsData;
    const payload: VrStreamPayload = normalizePacket({ patientId, moduleName, timestamp: Date.now(), type: 'METRICS', metrics, ...metrics });

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      return;
    }
    try { await fetch(`${HTTP_URL}/api/vr/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch (error) {}
  }, [mode, patientId, moduleName]);

  return { isConnected: isConnected || isPeerConnected, isPeerConnected, isStreaming: isConnected || isPeerConnected, liveData, lastPacket: liveData, remoteCommand, syncSession, sendRemoteStart, transmit };
};
