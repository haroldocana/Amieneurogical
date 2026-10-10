// Estructura del paquete de telemetría en tiempo real (60 FPS / Búfer 100ms)
interface VrTelemetryPacket {
  type: 'TELEMETRY_TICK';
  patientId: string;
  moduleId: string;
  timestamp: number;
  metrics: {
    reactionTimeMs: number;   // Tiempo de respuesta al estímulo (ms)
    attentionIndex: number;   // % Fijación / Atención estimada (0 - 100)
    gsrValue: number;         // Respuesta Galvánica de la Piel (uS)
    hrvBpm: number;           // Variabilidad de Frecuencia Cardíaca (BPM)
    headYaw: number;          // Rotación lateral de cabeza (Grados)
    headPitch: number;        // Inclinación vertical de cabeza (Grados)
  };
  kpis: {
    totalHits: number;        // Aciertos (Go)
    totalOmissions: number;   // Omisiones (Falta de respuesta)
    totalCommissions: number; // Comisiones (Falsos positivos)
    meanReactionTime: number; // Media móvil de reacción
  };
}

// Ejemplo de emisión activa desde la animación del visor 3D
useFrame(({ clock }) => {
  if (isTestRunning && isConnected) {
    const now = Date.now();
    // Emitir telemetría cada 100ms para no saturar la red del visor
    if (now - lastEmitTime.current > 100) {
      lastEmitTime.current = now;
      
      transmit({
        type: 'TELEMETRY_TICK',
        patientId,
        moduleId: 'TDAH_EXECUTIVE',
        timestamp: now,
        metrics: {
          reactionTimeMs: currentReactionTime,
          attentionIndex: Math.round(calculateAttentionIndex()),
          gsrValue: currentGSR,
          hrvBpm: currentHRV,
          headYaw: Math.round(camera.rotation.y * (180 / Math.PI)),
          headPitch: Math.round(camera.rotation.x * (180 / Math.PI)),
        },
        kpis: {
          totalHits: stats.hits,
          totalOmissions: stats.omissions,
          totalCommissions: stats.commissions,
          meanReactionTime: Math.round(stats.totalTime / (stats.hits || 1))
        }
      });
    }
  }
});
