// backend/controllers/sentinelController.ts
import { Request, Response } from 'express';

export const processSentinelTelemetry = async (req: Request, res: Response) => {
  try {
    const { 
      patientId, 
      sleepHoursLastNight, 
      nightAwakenings, 
      typingLatencyMs, 
      restingHeartRate, 
      isOutsideSafeZone 
    } = req.body;

    // ALGORITMO DE EVALUACIÓN DE RIESGO DE BROTE
    let riskScore = 0;

    // 1. Criterio de Privación de Sueño
    if (sleepHoursLastNight < 3) riskScore += 40;
    else if (sleepHoursLastNight < 5) riskScore += 20;

    // 2. Fragmentación Nocturna
    if (nightAwakenings >= 4) riskScore += 15;

    // 3. Hiperactivación Autonómica (Taquicardia en Reposo)
    if (restingHeartRate > 95) riskScore += 20;

    // 4. Enlentecimiento / Agitación Biomotora (Tecleo)
    if (typingLatencyMs > 600 || typingLatencyMs < 150) riskScore += 15;

    // 5. Salida de Zona Segura (Madrugada)
    if (isOutsideSafeZone) riskScore += 10;

    const isCritical = riskScore >= 80;

    // SI EL RIESGO ES CRÍTICO (POSIBLE BROTE) -> DISPARAR ALERTA JITAI
    if (isCritical) {
      await triggerEmergencyProtocol({
        patientId,
        riskScore,
        sleepHoursLastNight,
        restingHeartRate
      });
    }

    return res.status(200).json({
      success: true,
      evaluatedRiskScore: riskScore,
      status: isCritical ? 'CRITICAL_ALERT_DISPATCHED' : 'MONITORING_NORMAL'
    });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Función de disparo de emergencia JITAI
const triggerEmergencyProtocol = async (data: any) => {
  console.log(`[ALERTA CRÍTICA JITAI] Riesgo de brote detectado en paciente ${data.patientId}: ${data.riskScore}%`);
  
  // Aquí se integran servicios de mensajería (Twilio API para SMS o WhatsApp)
  // 1. Enviar SMS a la Red de Apoyo / Familiar
  // 2. Emitir evento WebSocket al Workstation del Psiquiatra
};
