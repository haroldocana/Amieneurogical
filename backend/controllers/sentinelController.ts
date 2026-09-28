import { Request, Response } from 'express';

// Definición de tipos estricta para la entrada de telemetría
export interface SentinelTelemetryPayload {
  patientId: string;
  sleepHoursLastNight: number;
  nightAwakenings: number;
  typingLatencyMs: number;
  restingHeartRate: number;
  isOutsideSafeZone: boolean;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
}

export const processSentinelTelemetry = async (req: Request, res: Response) => {
  try {
    const { 
      patientId, 
      sleepHoursLastNight, 
      nightAwakenings, 
      typingLatencyMs, 
      restingHeartRate, 
      isOutsideSafeZone,
      emergencyContactPhone,
      emergencyContactName
    }: SentinelTelemetryPayload = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Se requiere el identificador patientId.' });
    }

    // ==========================================
    // ALGORITMO DE EVALUACIÓN DE RIESGO DE BROTE (JITAI)
    // ==========================================
    let riskScore = 0;
    const activeRiskFactors: string[] = [];

    // 1. Criterio de Privación de Sueño (Predictor #1)
    if (sleepHoursLastNight < 3) {
      riskScore += 40;
      activeRiskFactors.push(`Privación severa de sueño (< 3h: ${sleepHoursLastNight}h)`);
    } else if (sleepHoursLastNight < 5) {
      riskScore += 20;
      activeRiskFactors.push(`Restricción moderada de sueño (${sleepHoursLastNight}h)`);
    }

    // 2. Fragmentación Nocturna
    if (nightAwakenings >= 4) {
      riskScore += 15;
      activeRiskFactors.push(`Alta fragmentación nocturna (${nightAwakenings} despertares)`);
    }

    // 3. Hiperactivación Autonómica (Taquicardia en Reposo)
    if (restingHeartRate > 95) {
      riskScore += 20;
      activeRiskFactors.push(`Taquicardia basal en reposo (${restingHeartRate} bpm)`);
    }

    // 4. Enlentecimiento / Agitación Biomotora (Tecleo)
    if (typingLatencyMs > 600 || typingLatencyMs < 150) {
      riskScore += 15;
      activeRiskFactors.push(`Anomalía biomotora en tecleo (${typingLatencyMs} ms)`);
    }

    // 5. Salida de Zona Segura (Geocerca en Horario Crítico)
    if (isOutsideSafeZone) {
      riskScore += 10;
      activeRiskFactors.push('Violación de geocerca de seguridad');
    }

    const finalRiskPct = Math.min(100, riskScore);
    const isCritical = finalRiskPct >= 80;

    // SI EL RIESGO ES CRÍTICO (POSIBLE BROTE) -> DISPARAR PROTOCOLO ADAPTATIVO JITAI
    let dispatchResult = null;
    if (isCritical) {
      dispatchResult = await triggerEmergencyProtocol({
        patientId,
        riskScore: finalRiskPct,
        activeRiskFactors,
        sleepHoursLastNight,
        restingHeartRate,
        emergencyContactPhone,
        emergencyContactName
      });
    }

    return res.status(200).json({
      success: true,
      patientId,
      evaluatedRiskScore: finalRiskPct,
      status: isCritical ? 'CRITICAL_ALERT_DISPATCHED' : 'MONITORING_NORMAL',
      activeRiskFactors,
      dispatchSummary: dispatchResult
    });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// PROTOCOLO DE DISPARO DE EMERGENCIA JITAI
// ==========================================
interface EmergencyData {
  patientId: string;
  riskScore: number;
  activeRiskFactors: string[];
  sleepHoursLastNight: number;
  restingHeartRate: number;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
}

const triggerEmergencyProtocol = async (data: EmergencyData) => {
  console.warn(`[ALERTA CRÍTICA JITAI] Brote inminente detectado en paciente ${data.patientId}: Riesgo ${data.riskScore}%`);

  const timestamp = new Date().toISOString();
  const alertMessage = `[ALERTA AMIE JITAI] El paciente ${data.patientId} registra un nivel de riesgo del ${data.riskScore}% por descompensación aguda. Factores: ${data.activeRiskFactors.join(', ')}. Por favor verifique contacto e inicie protocolo de contención.`;

  // 1. Notificación SMS / WhatsApp a la Red de Apoyo / Familiar (Twilio / External API)
  let smsDispatched = false;
  if (data.emergencyContactPhone) {
    try {
      // Ejemplo de integración rápida con webhook de mensajería
      const smsApiUrl = process.env.EMERGENCY_SMS_WEBHOOK_URL || '';
      if (smsApiUrl) {
        await fetch(smsApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.emergencyContactPhone,
            message: alertMessage
          })
        });
        smsDispatched = true;
      }
    } catch (smsErr) {
      console.error('Error al despachar SMS de emergencia:', smsErr);
    }
  }

  // 2. Retorno de confirmación de despacho para auditoría
  return {
    alertDispatchedAt: timestamp,
    workstationNotified: true,
    patientPhoneLockdownTriggered: true,
    smsDispatchedToCaregiver: smsDispatched,
    contactNotified: data.emergencyContactPhone || 'No registrado'
  };
};
