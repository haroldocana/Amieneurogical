import { useState, useEffect, useRef, useCallback } from 'react';

export interface VrMetrics {
  hrv?: number;
  gsr?: number;
  hrvBpm?: number;
  gsrValue?: number;
  reactionTimeMs?: number;
  omissions?: number;
  commissions?: number;
  stressLevel?: number;
  habituationIndex?: number;
  hits?: number;
  headYaw?: number;
  headPitch?: number;
  attentionIndex?: number;
  tranceDepth?: number;
  thetaWavePower?: number | string;
  emotionalValence?: number;
  arousalIndex?: number;
  vagalTone?: number;
  breathingCadence?: number;
  sudsLevel?: number;
  [key: string]: any;
}

export interface VrStreamPayload {
  patientId: string;
  moduleName: string;
  moduleId?: string;
  protocol?: string;
  category?: string;
  timestamp: number;
  type?: string;
  ecosystem?: string;
  environment?: string;
  isVideo?: boolean;
  initialHz?: number;
  metrics?: VrMetrics;
  reactionTimeMs?: number;
  omissions?: number;
  commissions?: number;
  habituationIndex?: number;
  hits?: number;
  hrv?: number;
  gsr?: number;
  hrvBpm?: number;
  gsrValue?: number;
  tranceDepth?: number;
  thetaWavePower?: number | string;
  emotionalValence?: number;
  arousalIndex?: number;
  vagalTone?: number;
  sudsLevel?: number;
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

    // Apunta directamente al Backend en Render
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

  // Normalizador resiliente multiprotocolo
  const normalizePacket = useCallback((raw: any): VrStreamPayload => {
    const rawMetrics = raw.metrics || {};

    // 🟢 Extracción universal de HRV y GSR tolerando cualquier variación de nombre
    const resolvedHrv = raw.hrv ?? raw.hrvBpm ?? raw.vagalTone ?? rawMetrics.hrv ?? rawMetrics.hrvBpm ?? 70;
    const resolvedGsr = raw.gsr ?? raw.gsrValue ?? raw.arousalIndex ?? rawMetrics.gsr ?? rawMetrics.gsrValue ?? 3.5;
    
    // 🟢 Extracción de métricas de control y tiempos de reacción
    const resolvedRt = raw.reactionTimeMs ?? rawMetrics.reactionTimeMs ?? 0;
    const resolvedOmissions = raw.omissions ?? rawMetrics.omissions ?? 0;
    const resolvedCommissions = raw.commissions ?? rawMetrics.commissions ?? 0;
    const resolvedHits = raw.hits ?? rawMetrics.hits ?? 0;
    const resolvedHabituation = raw.habituationIndex ?? rawMetrics.habituationIndex ?? 0;

    // 🟢 Métricas especializadas (Neurohipnosis, Cluster B y Biofeedback)
    const resolvedTrance = raw.tranceDepth ?? rawMetrics.tranceDepth ?? 0;
    const resolvedTheta = raw.thetaWavePower ?? rawMetrics.thetaWavePower ?? 0;
    const resolvedValence = raw.emotionalValence ?? rawMetrics.emotionalValence ?? 50;
    const resolvedStress = raw.stressLevel ?? rawMetrics.stressLevel ?? (resolvedGsr > 5.0 ? 80 : 35);
    const resolvedAttention = raw.attentionIndex ?? rawMetrics.attentionIndex ?? Math.max(0, 100 - (resolvedCommissions * 6));
    const resolvedSuds = raw.sudsLevel ?? rawMetrics.sudsLevel ?? 40;

    const consolidatedMetrics: VrMetrics = {
      ...rawMetrics,
      hrv: resolvedHrv,
      gsr: resolvedGsr,
      hrvBpm: resolvedHrv,
      gsrValue: resolvedGsr,
      reactionTimeMs: resolvedRt,
      omissions: resolvedOmissions,
      commissions: resolvedCommissions,
      habituationIndex: resolvedHabituation,
      hits: resolvedHits,
      stressLevel: resolvedStress,
      attentionIndex: resolvedAttention,
      tranceDepth: resolvedTrance,
      thetaWavePower: resolvedTheta,
      emotionalValence: resolvedValence,
      arousalIndex: resolvedGsr,
      vagalTone: resolvedHrv,
      sudsLevel: resolvedSuds,
      headYaw: raw.headYaw ?? rawMetrics.headYaw ?? 0,
      headPitch: raw.headPitch ?? rawMetrics.headPitch ?? 0
    };

    return {
      ...raw,
      patientId: raw.patientId || patientId,
      moduleName: raw.moduleName || raw.moduleId || moduleName,
      moduleId: raw.moduleId || raw.moduleName || moduleName,
      protocol: raw.protocol || 'GENERAL',
      timestamp: raw.timestamp || Date.now(),
      type: raw.type || 'METRICS',
      
      // Acceso directo en la raíz para compatibilidad con dashboards clásicos
      reactionTimeMs: resolvedRt,
      omissions: resolvedOmissions,
      commissions: resolvedCommissions,
      habituationIndex: resolvedHabituation,
      hits: resolvedHits,
      hrv: resolvedHrv,
      gsr: resolvedGsr,
      hrvBpm: resolvedHrv,
      gsrValue: resolvedGsr,
      tranceDepth: resolvedTrance,
      thetaWavePower: resolvedTheta,
      emotionalValence: resolvedValence,
      arousalIndex: resolvedGsr,
      vagalTone: resolvedHrv,
      sudsLevel: resolvedSuds,
      
      // Contenedor estructurado de métricas
      metrics: consolidatedMetrics
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

            // Sincronización de disparadores y comandos remotos
            if (data.type === 'START_TEST' || data.type === 'START_ASSAY') {
              setRemoteCommand('START_TEST');
            }
            if (data.type === 'STOP_TEST' || data.type === 'STOP_ASSAY') {
              setRemoteCommand('STOP_TEST');
            }

            // Validación flexible de paciente para evitar pérdidas de paquetes
            const incomingPatient = (data.patientId || '').toString().toUpperCase().trim();
            const localPatient = (patientId || '').toString().toUpperCase().trim();

            const isMatchingPatient = 
              !data.patientId || 
              incomingPatient === localPatient || 
              incomingPatient === 'PAC-8104' || 
              localPatient === 'PAC-8104';

            if (data && isMatchingPatient) {
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
