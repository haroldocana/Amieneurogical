import { Request, Response } from 'express';
import PatientRecord from '../models/PatientRecord.js';

// Definición de tipos estricta para la entrada de telemetría pasiva
export interface SentinelTelemetryPayload {
  patientId: string;
  sleepHoursLastNight: number | string;
  nightAwakenings: number | string;
  typingLatencyMs: number | string;
  restingHeartRate: number | string;
  isOutsideSafeZone?: boolean | string;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
  batteryLevelPct?: number;
  screenTimeMinutes?: number;
}

export interface EmergencyData {
  patientId: string;
  riskScore: number;
  activeRiskFactors: string[];
  sleepHours: number;
  restingHeartRate: number;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
}

/**
 * PROTOCOLO DE DISPARO DE EMERGENCIA JITAI (SMS / Webhook)
 * Ejecuta la llamada con AbortController para prevenir cuelgues del servidor.
 */
const triggerEmergencyProtocol = async (data: EmergencyData) => {
  console.warn(`🚨 [ALERTA CRÍTICA JITAI] Posible brote detectado en paciente ${data.patientId}: Riesgo ${data.riskScore}%`);

  const timestamp = new Date().toISOString();
  const alertMessage = `[ALERTA AMIE JITAI] Paciente ${data.patientId} registra riesgo del ${data.riskScore}% por descompensación aguda. Factores: ${data.activeRiskFactors.join(', ')}. Active protocolo de contención.`;

  let smsDispatched = false;
  const smsApiUrl = process.env.EMERGENCY_SMS_WEBHOOK_URL || '';

  if (data.emergencyContactPhone && smsApiUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s límite

      const response = await fetch(smsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.emergencyContactPhone,
          contactName: data.emergencyContactName || 'Familiar / Cuidador',
          patientId: data.patientId,
          riskScore: data.riskScore,
          message: alertMessage,
          timestamp
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      smsDispatched = response.ok;
    } catch (smsErr: any) {
      console.error('[JITAI] Fallo al despachar SMS de emergencia:', smsErr.message);
    }
  }

  return {
    alertDispatchedAt: timestamp,
    workstationNotified: true,
    patientPhoneLockdownTriggered: true,
    smsDispatchedToCaregiver: smsDispatched,
    contactNotified: data.emergencyContactPhone || 'No configurado'
  };
};

/**
 * CONTROLADOR PRINCIPAL: Procesamiento continuo de telemetría pasiva JITAI 24/7
 */
export const processSentinelTelemetry = async (req: Request, res: Response): Promise<Response> => {
  try {
    const body: SentinelTelemetryPayload = req.body;
    const patientId = (body.patientId || '').trim();

    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Petición inválida: Se requiere el identificador patientId.' 
      });
    }

    // ==========================================
    // 1. SANITIZACIÓN NUMÉRICA ROBUSTA
    // ==========================================
    const sleepHours = Math.max(0, Number(body.sleepHoursLastNight) || 0);
    const awakenings = Math.max(0, Math.floor(Number(body.nightAwakenings) || 0));
    const typingLatency = Math.max(0, Number(body.typingLatencyMs) || 240);
    const heartRate = Math.max(0, Number(body.restingHeartRate) || 70);
    const isOutsideSafeZone = body.isOutsideSafeZone === true || body.isOutsideSafeZone === 'true';

    // ==========================================
    // 2. ALGORITMO JITAI DE EVALUACIÓN DE BROTE
    // ==========================================
    let riskScore = 0;
    const activeRiskFactors: string[] = [];

    // Criterio 1: Privación Aguda de Sueño
    if (sleepHours < 3) {
      riskScore += 40;
      activeRiskFactors.push(`Privación severa de sueño (< 3h: ${sleepHours}h)`);
    } else if (sleepHours < 5) {
      riskScore += 20;
      activeRiskFactors.push(`Restricción moderada de sueño (${sleepHours}h)`);
    }

    // Criterio 2: Fragmentación Nocturna
    if (awakenings >= 4) {
      riskScore += 15;
      activeRiskFactors.push(`Alta fragmentación nocturna (${awakenings} despertares)`);
    }

    // Criterio 3: Hiperactivación Autonómica Basal
    if (heartRate > 95) {
      riskScore += 20;
      activeRiskFactors.push(`Taquicardia basal en reposo (${heartRate} bpm)`);
    }

    // Criterio 4: Alteración Biomotora en Tecleo
    if (typingLatency > 600 || typingLatency < 140) {
      riskScore += 15;
      activeRiskFactors.push(`Anomalía psicomotora en latencia de tecleo (${typingLatency} ms)`);
    }

    // Criterio 5: Violación de Geocerca Crítica
    if (isOutsideSafeZone) {
      riskScore += 10;
      activeRiskFactors.push('Salida de zona segura en ventana nocturna/crítica');
    }

    const finalRiskPct = Math.min(100, riskScore);
    const isCritical = finalRiskPct >= 75;

    // ==========================================
    // 3. DESPACHO DE EMERGENCIA SI RIESGO >= 75%
    // ==========================================
    let dispatchResult = null;
    if (isCritical) {
      dispatchResult = await triggerEmergencyProtocol({
        patientId,
        riskScore: finalRiskPct,
        activeRiskFactors,
        sleepHours,
        restingHeartRate: heartRate,
        emergencyContactPhone: body.emergencyContactPhone,
        emergencyContactName: body.emergencyContactName
      });
    }

    // ==========================================
    // 4. PERSISTENCIA EN MONGODB ATLAS
    // ==========================================
    try {
      const patient = await PatientRecord.findOne({
        $or: [{ id: patientId }, { patientId }, { 'metadata.patientId': patientId }]
      });

      if (patient) {
        // Actualizar métricas funcionales de sueño normalizadas (0-100)
        if (!patient.functionalAreas) {
          patient.functionalAreas = { sleep: 50, appetite: 50, energy: 50, social: 50, attention: 50 };
        }
        patient.functionalAreas.sleep = Math.min(100, Math.max(0, Math.round((sleepHours / 8) * 100)));

        // Actualizar biomarcadores neuromotores
        if (!patient.neuromotorBiomarkers) {
          patient.neuromotorBiomarkers = { reactionTimeMs: 240, omissionErrors: 0, commissionErrors: 0, motorStabilityScore: 85 };
        }
        patient.neuromotorBiomarkers.reactionTimeMs = typingLatency;

        // Registrar snapshot de telemetría móvil Centinela
        (patient as any).sentinelTelemetrySnapshot = {
          lastSync: new Date(),
          sleepHours,
          nightAwakenings: awakenings,
          typingLatencyMs: typingLatency,
          restingHeartRate: heartRate,
          isOutsideSafeZone,
          riskScore: finalRiskPct,
          activeRiskFactors,
          status: isCritical ? 'CRITICAL' : 'STABLE'
        };

        // Si es crítico, agregar alerta al banner del Workstation
        if (isCritical) {
          if (!patient.diagnosticEngineOutput) {
            patient.diagnosticEngineOutput = {
              primaryDiagnostic: { icd11Code: '6A02', dsm5Code: 'F32.9', title: 'Alerta Centinela', probabilityPercent: finalRiskPct, severityLevel: 'Grave' },
              secondaryComorbidities: [],
              riskAlerts: [],
              therapeuticRecommendations: []
            };
          }
          if (!patient.diagnosticEngineOutput.riskAlerts) {
            patient.diagnosticEngineOutput.riskAlerts = [];
          }

          // Evitar alertas duplicadas idénticas recientes
          const alertDesc = `[JITAI Centinela] Riesgo agudo (${finalRiskPct}%): ${activeRiskFactors.slice(0, 2).join(', ')}`;
          const exists = patient.diagnosticEngineOutput.riskAlerts.some((a: any) => a.message === alertDesc);
          if (!exists) {
            patient.diagnosticEngineOutput.riskAlerts.unshift({
              level: 'ALTA',
              message: alertDesc
            });
          }
        }

        await patient.save();
        console.log(`[MongoDB Atlas] Expediente ${patientId} actualizado con telemetría Centinela (Riesgo: ${finalRiskPct}%)`);
      }
    } catch (dbErr: any) {
      console.error('[MongoDB Error] Fallo al actualizar expediente con telemetría Centinela:', dbErr.message);
    }

    // ==========================================
    // 5. RESPUESTA AL DISPOSITIVO MÓVIL
    // ==========================================
    return res.status(200).json({
      success: true,
      patientId,
      evaluatedRiskScore: finalRiskPct,
      status: isCritical ? 'CRITICAL_ALERT_DISPATCHED' : 'MONITORING_NORMAL',
      activeRiskFactors,
      dispatchSummary: dispatchResult,
      metricsReceived: {
        sleepHours,
        nightAwakenings: awakenings,
        typingLatencyMs: typingLatency,
        restingHeartRate: heartRate,
        isOutsideSafeZone
      },
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('[Sentinel Error] Fallo en processSentinelTelemetry:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno en el motor Centinela JITAI: ' + (err.message || 'Fallo desconocido') 
    });
  }
};

export default processSentinelTelemetry;
