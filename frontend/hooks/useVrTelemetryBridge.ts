// ============================================================================
// AMIE CLINICAL COPILOT - HOOK DE TELEMETRÍA VR Y BIOMARCADORES EN TIEMPO REAL
// frontend/hooks/useVrTelemetryBridge.ts
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { telemetryService, PrecisionTelemetryPacket } from '../services/telemetryService';
import { VrControlService, VrConnectionStatus } from '../services/vrControlService';

export interface VrTelemetryBridgeState {
  isConnected: boolean;
  isTelemetryConnected: boolean;
  vrWsStatus: VrConnectionStatus;
  status: VrConnectionStatus;
  liveTelemetry: PrecisionTelemetryPacket | null;
  telemetry: PrecisionTelemetryPacket | null;
  heartRate: number;
  hrvRmssd: number;
  gsrMicroSiemens: number;
  handGripKg: number;
  connect: (url?: string, patientId?: string) => void;
  disconnect: () => void;
  triggerGrounding: () => void;
}

export function useVrTelemetryBridge(patientId: string = 'PAC-8104'): VrTelemetryBridgeState {
  const [vrWsStatus, setVrWsStatus] = useState<VrConnectionStatus>('DISCONNECTED');
  const [isTelemetryConnected, setIsTelemetryConnected] = useState<boolean>(false);
  const [liveTelemetry, setLiveTelemetry] = useState<PrecisionTelemetryPacket | null>(null);

  // 1. Suscripción a telemetría de hardware (BLE / USB / Sensores)
  useEffect(() => {
    const unsubStatus = telemetryService.subscribeStatus((status) => {
      setIsTelemetryConnected(status.connected);
    });

    const unsubData = telemetryService.subscribeData((packet) => {
      setLiveTelemetry(packet);
    });

    return () => {
      unsubStatus();
      unsubData();
    };
  }, []);

  // 2. Suscripción al puente WebSocket de Realidad Virtual (Pico / Meta Quest)
  useEffect(() => {
    const unsubVr = VrControlService.subscribeStatus((status) => {
      setVrWsStatus(status);
    });

    VrControlService.connect(undefined, patientId);

    return () => {
      unsubVr();
    };
  }, [patientId]);

  const connect = useCallback((url?: string, customPatientId?: string) => {
    VrControlService.connect(url, customPatientId || patientId);
  }, [patientId]);

  const disconnect = useCallback(() => {
    VrControlService.disconnect();
  }, []);

  const triggerGrounding = useCallback(() => {
    VrControlService.triggerGroundingProtocol(patientId);
  }, [patientId]);

  const isConnected = vrWsStatus === 'CONNECTED' || isTelemetryConnected;

  return {
    isConnected,
    isTelemetryConnected,
    vrWsStatus,
    status: vrWsStatus,
    liveTelemetry,
    telemetry: liveTelemetry,
    heartRate: liveTelemetry?.heartRateBpm ?? 72,
    hrvRmssd: liveTelemetry?.hrvRmssdMs ?? 42,
    gsrMicroSiemens: liveTelemetry?.gsrMicroSiemens ?? 2.4,
    handGripKg: liveTelemetry?.handGripPressureKg ?? 0,
    connect,
    disconnect,
    triggerGrounding
  };
}

// Exportación dual para total compatibilidad (Rollup / Vite)
export default useVrTelemetryBridge;
