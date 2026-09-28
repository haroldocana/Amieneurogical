// ------------------------------------------------------------------
// FILTRO AUTOMÁTICO DE PRESENCIA POR ANÁLISIS DE SEÑAL
// ------------------------------------------------------------------
useEffect(() => {
  const unsubData = telemetryService.subscribeData((packet) => {
    lastPacketTimestampRef.current = Date.now();

    // Solo evaluar en conexiones de hardware real (USB / BLE / Wi-Fi)
    if (connectionStatus.connected && connectionStatus.protocol !== 'SIMULATED') {
      
      // 1. AUTO-DETECCIÓN: Comprobación de micro-variabilidad fisiológica
      if (packet.heartRateBpm === lastBpmValueRef.current && packet.heartRateBpm > 0) {
        consecutiveSameBpmCountRef.current += 1;
      } else {
        lastBpmValueRef.current = packet.heartRateBpm;
        consecutiveSameBpmCountRef.current = 0;
      }

      // 2. AUTO-DETECCIÓN: Incoherencia espectral (Ruido de aire / luz ambiental)
      const expectedRr = packet.heartRateBpm > 0 ? (60000 / packet.heartRateBpm) : 0;
      const isAmbientNoise = Math.abs(expectedRr - packet.rrIntervalMs) > 300 || packet.hrvRmssdMs > 200;

      // Si el valor se congela por lectura en mesa (>10 paquetes idénticos) o detecta ruido de luz
      if (consecutiveSameBpmCountRef.current > 10 || isAmbientNoise || packet.heartRateBpm <= 30) {
        setIsOffBody(true); // AUTOMÁTICO: Aplanar a 0
        latestTelemetryRef.current = {
          ...packet,
          heartRateBpm: 0,
          hrvRmssdMs: 0,
          gsrMicroSiemens: 0,
          rrIntervalMs: 0
        };
        return;
      }

      // El anillo está en el dedo con pulso biológico real
      setIsOffBody(false);
    } else {
      setIsOffBody(false);
    }

    latestTelemetryRef.current = packet;
  });

  return () => unsubData();
}, [connectionStatus.connected, connectionStatus.protocol]);
