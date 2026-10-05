import { useState, useEffect } from 'react';

// Estructura de los datos científicos que viajaran del VR a la PC
export interface VrStreamPayload {
  patientId: string;
  moduleName: string;
  timestamp: number;
  metrics: {
    hrv?: number;
    gsr?: number;
    reactionTimeMs?: number;
    omissions?: number;
    commissions?: number;
    stressLevel?: number;
    habituationIndex?: number;
  };
}

export const useVrTelemetryBridge = (mode: 'sender' | 'receiver', patientId: string, moduleName: string) => {
  const [liveData, setLiveData] = useState<VrStreamPayload | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // MODO RECEPTOR (PC del Médico): Escucha los datos del visor cada 1 segundo
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (mode === 'receiver' && patientId) {
      const pollData = async () => {
        try {
          // Llama al servidor de Render para preguntar si el visor envió algo nuevo
          const response = await fetch(`/api/vr/stream?patientId=${patientId}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.timestamp) {
              setLiveData(data);
              setIsStreaming(true);
            }
          }
        } catch (error) {
          // Se mantiene silencioso si el paciente aún no inicia la prueba
          setIsStreaming(false);
        }
      };

      // Inicia el monitoreo en vivo (Polling a 1000 ms)
      const interval = setInterval(pollData, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, patientId]);

  // -------------------------------------------------------------------------
  // MODO EMISOR (Visor Meta Quest 3): Envía los milisegundos y errores al servidor
  // -------------------------------------------------------------------------
  const transmit = async (metrics: VrStreamPayload['metrics']) => {
    if (mode === 'sender') {
      const payload: VrStreamPayload = {
        patientId,
        moduleName,
        timestamp: Date.now(),
        metrics
      };
      
      try {
        // Dispara la métrica exacta hacia el servidor en Render
        await fetch(`/api/vr/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error("Error transmitiendo biometría VR:", error);
      }
    }
  };

  return { liveData, isStreaming, transmit };
};
