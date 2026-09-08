import { runtimeConfig } from '../resources/motor-clinico-amiet-55307264/config';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { CLINICAL_CASE_PRESETS } from '../constants';
import { consumeAiCredit } from './userService';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://amieneurogical.onrender.com';
const PROXY_HEADER = import.meta.env.VITE_PROXY_HEADER || 'AMIE_SECRET_HEADER_2025';

const CLOUD_RUN_API_URL = import.meta.env.VITE_CLOUD_RUN_URL || 'https://amie-clinical-analyzer-367911373284.us-central1.run.app/api/clinical/analyze-qeeg';
const CLOUD_FUNCTION_SYNC_URL = import.meta.env.VITE_CLOUD_FUNCTION_SYNC_URL || 'https://sync-patient-expedient-367911373284.us-central1.run.app';

export const SAFE_DEFAULT_PATIENT: PatientRecord = {
  id: 'PAC-8104',
  patientNameAnonymized: 'Paciente ID: PAC-8104',
  age: 55,
  gender: 'M',
  consultationReason: 'Ideación suicida estructurada tras colapso sociofuncional, insomnio de despertar precoz y rumiación de ruina.',
  anamnesis: 'Hombre de 55 años, previamente activo en labores agrícolas y comerciales. Desde hace 3 meses presenta anhedonia total, despertar a las 02:30 AM con llanto e hiperalerta, baja de peso de 6 kg, convicción de ruina económica inminente ("debemos vender la granja") y verbalización de que "su familia estaría mejor sin él". Niega historia de manía/hipomanía.',
  sessionNotes: [
    'Sesión 1: Facies profundamente abatida, enlentecimiento psicomotor notable. Expresa sensación de vacío insoportable y culpa delirante de bancarrota familiar.',
    'Sesión 2: Acompañado por cónyuge quien reporta que el paciente pasa horas mirando al vacío y revisando un arma en el ático. Se interviene para decomiso de medios.'
  ],
  audioRecordings: [],
  psychometricScores: {
    phq9: 24,
    gad7: 16,
    bdi2: 42,
    bai: 18,
    mmse: 29,
    asrs: 6,
    aq10: 2,
    catq: 12,
    cssrsLevel: 5,
    sadPersons: 9,
    whodas2: 4.2,
    gafEstimated: 25
  },
  functionalAreas: {
    sleep: 15,
    appetite: 20,
    energy: 15,
    social: 10,
    attention: 35
  },
  neuromotorBiomarkers: {
    reactionTimeMs: 485,
    omissionErrors: 8,
    commissionErrors: 2,
    motorStabilityScore: 42
  },
  qeegZScores: {
    frontalThetaBetaRatio: 1.8,
    temporalAsymmetry: 0.4,
    alphaPeakFrequencyHz: 8.5,
    deltaSlowActivityZ: 1.9
  },
  multisensoryHardware: {
    vagalToneHrvIndex: 18,
    handGripPressureKg: 21.4,
    camouflagingIndexPct: 12,
    ocularFixationDurationMs: 4200,
    touchTapLatencyCompensatedMs: 485,
    microExpressionState: 'Aplanamiento Motor'
  },
  sentinelTelemetry: {
    pacId: 'PAC-8104',
    deviceSyncTime: 'En línea (Sincronizado)',
    sleepMetrics: {
      nightWakeups: 5,
      hoursInDarkness: 7.2,
      avgSleepDurationHours: 3.4,
      sleepEfficiencyPct: 41
    },
    behavioralBiometrics: {
      typingLatencyMs: 485,
      screenActiveTimeMinutes: 140,
      biomotorLatencyMs: 485,
      activityRestlessnessIndex: 82
    },
    safetyStatus: {
      riskLevel: 'CRÍTICO',
      activeContentionTriggered: true,
      passiveRiskRationale: 'Despertares nocturnos múltiples (>3x/noche) y latencia biomotora ralentizada (485 ms) con rumiación autolítica.',
      emergencyContact: {
        name: 'Rachel Murphy',
        relationship: 'Cónyuge / Red Primaria',
        phone: '+52 (55) 4192-8831'
      }
    },
    nightWakeups: 5,
    avgSleepDurationHours: 3.4,
    sleepEfficiencyPct: 41,
    biomotorLatencyMs: 485,
    screenOnNightTimeMinutes: 140,
    activityRestlessnessIndex: 82,
    crisisDistressTriggered: true,
    passiveRiskScore: 'CRÍTICO',
    passiveRiskRationale: 'Despertares nocturnos múltiples (>3x/noche) y latencia biomotora ralentizada (485 ms) con rumiación autolítica.',
    emergencyContact: {
      name: 'Rachel Murphy',
      relationship: 'Cónyuge / Red Primaria',
      phone: '+52 (55) 4192-8831'
    }
  },
  substancesHistory: {
    alcohol: 'Consumo ocasional previo, nulo en último mes',
    tobacco: 'Fumador leve (5 cig/día)',
    cannabis: 'Negativo',
    stimulants: 'Negativo',
    medicationsCurrent: ['Sertralina 50 mg/día']
  },
  medicalHistory: ['Úlcera péptica previa', 'Dislipidemia leve']
};

/**
 * Función auxiliar para canalizar llamadas a Vertex AI a través del Backend Proxy de Express
 */
async function callVertexViaProxy(originalUrl: string, payloadBody: any) {
  const response = await fetch(`${BACKEND_URL}/api-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-proxy': PROXY_HEADER
    },
    body: JSON.stringify({
      originalUrl,
      body: payloadBody
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Proxy Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Normaliza el género/sexo recibido del SaaS al tipo esperado 'M' | 'F' | 'Other'
 */
function normalizeGender(rawSex?: string): 'M' | 'F' | 'Other' {
  if (!rawSex) return 'F';
  const val = rawSex.trim().toUpperCase();
  if (val.startsWith('F') || val === 'FEMENINO' || val === 'MUJER') return 'F';
  if (val.startsWith('M') || val === 'MASCULINO' || val === 'HOMBRE') return 'M';
  return 'Other';
}

/**
 * Normaliza las áreas funcionales provenientes de la SaaS (escala 1-10 o 0-100)
 */
function normalizeFunctionalAreas(rawAreas: any) {
  if (!rawAreas || typeof rawAreas !== 'object') {
    return { sleep: 50, appetite: 50, energy: 50, social: 50, attention: 50 };
  }

  const parseScore = (val: any) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return 50;
    if (num <= 10) return num * 10;
    return Math.min(100, Math.max(0, num));
  };

  return {
    sleep: parseScore(rawAreas.sleep),
    appetite: parseScore(rawAreas.appetite),
    energy: parseScore(rawAreas.energy),
    social: parseScore(rawAreas.social),
    attention: parseScore(rawAreas.attention ?? rawAreas.concentration ?? rawAreas.concentracion),
  };
}

/**
 * Adaptador de Mapeo: Transforma el expediente emitido por App 1 al formato de App 2
 */
export async function mapApp1DataToApp2(
  rawCase: any,
  cleanPatientId: string,
  resolvedDoctorUsername: string
): Promise<PatientRecord> {
  const sessions = rawCase.sessions || [];

  const exactPsychometrics: Record<string, number> = {};
  sessions.forEach((s: any) => {
    if (s.testScores && typeof s.testScores === 'object') {
      Object.entries(s.testScores).forEach(([key, val]) => {
        if (typeof val === 'number') {
          exactPsychometrics[key.toLowerCase()] = val;
        }
      });
    }
  });

  const lastSession = sessions[sessions.length - 1] || {};
  const rawFunctional = lastSession.functionalAreas || rawCase.functionalAreas || {};
  const mappedFunctionalAreas = normalizeFunctionalAreas(rawFunctional);

  const mappedNotes = sessions
    .map((s: any) => `Sesión ${s.sessionNumber || ''} (${s.date || ''}): ${s.rawNotes || s.notes || ''}`)
    .filter(Boolean);

  return {
    ...SAFE_DEFAULT_PATIENT,
    id: rawCase.id || cleanPatientId,
    patientNameAnonymized: `Paciente ID: ${rawCase.id || cleanPatientId}`,
    age: Number(rawCase.generalData?.edad || rawCase.age) || 55,
    gender: normalizeGender(rawCase.generalData?.sexo || rawCase.gender),
    consultationReason: rawCase.generalData?.motivoConsultaTextual || rawCase.consultationReason || 'Evaluación neuroclínica integral',
    anamnesis: rawCase.generalData?.antecedentes || rawCase.anamnesis || 'Sin antecedentes registrados',
    sessionNotes: mappedNotes.length > 0 ? mappedNotes : ['Sincronizado desde base de datos App 1'],
    functionalAreas: mappedFunctionalAreas,
    psychometricScores: {
      ...SAFE_DEFAULT_PATIENT.psychometricScores,
      ...exactPsychometrics
    },
    sentinelTelemetry: {
      ...SAFE_DEFAULT_PATIENT.sentinelTelemetry!,
      pacId: cleanPatientId,
      deviceSyncTime: `En línea (Extraído de App 1 - ${resolvedDoctorUsername})`
    }
  };
}

/**
 * Conecta con la app clínica extrayendo expedientes y validando la propiedad por colegiado.
 */
export async function syncWithClinicalApp(
  patientId: string,
  colegiado: number,
  doctorUsername?: string
): Promise<{ patient: PatientRecord; analysis?: AmieClinicalAnalysis | null; message: string }> {
  const storedUsername = typeof window !== 'undefined'
    ? localStorage.getItem('amie_username') || localStorage.getItem('amie_doctor_username')
    : null;

  const resolvedDoctorUsername = (doctorUsername || storedUsername || 'harold01').trim().toLowerCase();
  const cleanPatientId = (patientId || 'PAC-8104').trim().toUpperCase();

  // 1. EXTRACCIÓN CON VALIDACIÓN DE SEGURIDAD POR COLEGIADO DESDE BUCKET
  try {
    const cloudUrl = `https://storage.googleapis.com/base-psicologiagt-usuario2/clinica/${resolvedDoctorUsername}/cases.json?t=${Date.now()}`;
    const response = await fetch(cloudUrl);

    if (response.ok) {
      const clinicalDatabase = await response.json();
      const rawCase = clinicalDatabase[cleanPatientId];

      if (rawCase) {
        // VALIDACIÓN DE PROPIEDAD DE EXPEDIENTE:
        const caseColegiado = Number(rawCase.colegiadoOwner || rawCase.generalData?.colegiadoTratante || colegiado);
        if (caseColegiado !== Number(colegiado)) {
          throw new Error(`Acceso Denegado: El expediente ${cleanPatientId} pertenece al Colegiado #${caseColegiado}, no al #${colegiado}.`);
        }

        const mappedPatient = await mapApp1DataToApp2(rawCase, cleanPatientId, resolvedDoctorUsername);

        let amieAnalysis: AmieClinicalAnalysis | null = null;
        try {
          amieAnalysis = await runAmieClinicalAnalysis(mappedPatient);
        } catch (aErr) {
          console.warn('Error al auto-ejecutar análisis AMIE:', aErr);
        }

        return {
          patient: mappedPatient,
          analysis: amieAnalysis,
          message: `Expediente ${cleanPatientId} autenticado y extraído para el Colegiado #${colegiado}.`
        };
      }
    }
  } catch (err: any) {
    if (err?.message && err.message.includes('Acceso Denegado')) {
      throw err;
    }
    console.warn('Fallo en Cloud Storage directo, buscando en microservicio protegido:', err);
  }

  // 2. FALLBACK A BACKEND PROTEGIDO CON AUTENTICACIÓN
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('amie_auth_token') || 'demo-jwt-bearer-token'
    : 'demo-jwt-bearer-token';

  const postBody = {
    patientId: cleanPatientId,
    doctorUsername: resolvedDoctorUsername,
    colegiado: Number(colegiado),
    requestTimestamp: new Date().toISOString(),
    sourceApp: 'AMIE-Clinical-Analyzer'
  };

  try {
    const response = await fetch(CLOUD_FUNCTION_SYNC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postBody)
    });

    if (response.status === 403) {
      throw new Error(`Acceso denegado: El profesional con Colegiado #${colegiado} no es el médico tratante del expediente ${cleanPatientId}.`);
    }

    if (response.status === 404) {
      throw new Error(`El expediente ${cleanPatientId} no existe en la base de datos de ${resolvedDoctorUsername}.`);
    }

    if (response.ok) {
      const data = await response.json();
      const mappedPatient = await mapApp1DataToApp2(data.patientRecord || data, cleanPatientId, resolvedDoctorUsername);

      return {
        patient: mappedPatient,
        analysis: data.preliminaryAnalysis || data.analysis || null,
        message: data.message || `Expediente ${cleanPatientId} sincronizado exitosamente.`
      };
    }
  } catch (err: any) {
    if (err?.message && (err.message.includes('Acceso denegado') || err.message.includes('no existe'))) {
      throw err;
    }
    console.warn('Fallo en solicitud de red a Cloud Function, verificando repositorio local:', err);
  }

  // 3. FALLBACK LOCAL PRESETS
  const matchedPreset = CLINICAL_CASE_PRESETS.find(p => p.record.id.toUpperCase() === cleanPatientId);
  if (matchedPreset) {
    const syncdPatient: PatientRecord = {
      ...SAFE_DEFAULT_PATIENT,
      ...matchedPreset.record,
      id: cleanPatientId,
      patientNameAnonymized: `Paciente ID: ${cleanPatientId}`,
      audioRecordings: [],
      sentinelTelemetry: {
        ...SAFE_DEFAULT_PATIENT.sentinelTelemetry!,
        ...(matchedPreset.record.sentinelTelemetry || {}),
        pacId: cleanPatientId,
        deviceSyncTime: `Sincronizado (${resolvedDoctorUsername} - Colegiado #${colegiado})`
      }
    };

    return {
      patient: syncdPatient,
      analysis: null,
      message: `Expediente ${cleanPatientId} cargado desde el repositorio clínico local.`
    };
  }

  throw new Error(`El expediente ${cleanPatientId} no existe o no se tiene autorización de lectura.`);
}

/**
 * Ejecuta el análisis diagnóstico con Vertex AI descontando 1 crédito de IA.
 */
export async function runAmieClinicalAnalysis(
  patient: PatientRecord,
  qEegImageBase64?: string
): Promise<AmieClinicalAnalysis> {
  const activeUsername = typeof window !== 'undefined'
    ? localStorage.getItem('amie_username') || localStorage.getItem('amie_doctor_username') || 'harold01'
    : 'harold01';

  consumeAiCredit(activeUsername);

  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('amie_auth_token') || 'demo-jwt-bearer-token' 
    : 'demo-jwt-bearer-token';

  const safeRecord: PatientRecord = {
    ...SAFE_DEFAULT_PATIENT,
    ...patient
  };

  const activeImage = qEegImageBase64 || safeRecord.qeegBiomarkers?.heatmapBase64 || null;

  try {
    const apiPayload = {
      patientRecord: safeRecord,
      qEegImageBase64: activeImage,
      sentinelTelemetry: safeRecord.sentinelTelemetry || null,
      qeegBiomarkers: safeRecord.qeegBiomarkers || null,
      multisensoryHardware: safeRecord.multisensoryHardware || null,
      vrTelemetryData: safeRecord.vrTelemetryData || null,
      vrTherapyReport: safeRecord.vrTherapyReport || null,
      timestamp: new Date().toISOString(),
      source: 'AMIE-Clinical-Analyzer-Web'
    };

    const response = await fetch(CLOUD_RUN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(apiPayload)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.principalDiagnosis && data.differentialMatrix) {
        return data as AmieClinicalAnalysis;
      }
    }
  } catch (backendError) {
    console.warn('Cloud Run API no disponible, ejecutando Vertex AI a través del Proxy Express:', backendError);
  }

  const patientJsonString = JSON.stringify(safeRecord, null, 2);

  // CONSTRUCCIÓN DEL PROMPT CON EXTRACCIÓN EXPLÍCITA DE TELEMETRÍA VR Y OTROS MÓDULOS
  const vrSection = safeRecord.vrTelemetryData ? `
--- MÓDULO VR QUEST 3S & TELEMETRÍA BIOMÉTRICA INMERSIVA ---
- Session GUID: ${safeRecord.vrTelemetryData.sessionId}
- Conductancia Cutánea (GSR Pico): ${Math.max(...(safeRecord.vrTelemetryData.gsrMicroSiemens || [0]))} µS
- Tono Vagal (HRV RMSSD Última Lectura): ${safeRecord.vrTelemetryData.hrvRmssdMs?.slice(-1)[0] || 'N/A'} ms
- Índice de Habituación Terapéutica (H): ${safeRecord.vrTelemetryData.habituationIndexH}
- Picos de Excitación Simpática: ${safeRecord.vrTelemetryData.stressPeaksCount}
- Resumen Informe VR Previo: ${safeRecord.vrTherapyReport?.synthesizedClinicalSummary || 'Sin informe registrado'}
` : '--- MÓDULO VR QUEST 3S: No se ha realizado o transferido prueba inmersiva ---';

  const multisensorySection = safeRecord.multisensoryHardware ? `
--- BIOMETRÍA MULTISENSORIAL EN VIVO ---
- Índice Tono Vagal (HRV): ${safeRecord.multisensoryHardware.vagalToneHrvIndex}/100
- Presión Prensión Manual: ${safeRecord.multisensoryHardware.handGripPressureKg} kg
- Índice Camouflaging (CAT-Q): ${safeRecord.multisensoryHardware.camouflagingIndexPct}%
- Duración Fijación Ocular: ${safeRecord.multisensoryHardware.ocularFixationDurationMs} ms
- Estado Microexpresiones: ${safeRecord.multisensoryHardware.microExpressionState}
` : '';

  const promptText = `
IDENTIDAD CLÍNICA (AMIE FRAMEWORK):
Eres AMIE (Articulate Medical Intelligence Explorer), operando como Copiloto Psiquiátrico y Neurológico Avanzado.
Tu función es el análisis bioclínico, la prevención activa y la generación de diagnósticos diferenciales para el profesional de la salud responsable bajo normativas HIPAA y RGPD.

MÉTODO DE ANÁLISIS E INTERPRETACIÓN DE DATOS (JSON):
Al recibir el expediente clínico del paciente, realizarás un análisis cruzado integral en 5 niveles:

1. EXTRAER Y EVALUAR SÍNTOMAS PRINCIPALES:
   - Motivo de consulta, anamnesis y notas históricas de cada sesión.
   - Carga sintomática en Ansiedad, Depresión, Psicosis, TDAH, TCA, Personalidad (TLP) y Deterioro Cognitivo.

2. TRIANGULACIÓN BIOCLÍNICA, PSICOMÉTRICA Y BIOMÉTRICA MULTIMODAL:
   - Cruza las notas subjetivas del terapeuta con los puntajes DSM-5/OMS (BDI-II, BAI, PHQ-9, GAD-7, ASRS, AQ-10, MMSE, C-SSRS, SAD PERSONS).
   - Analiza las Áreas Funcionales (Sueño, Apetito, Energía, Social, Atención).
   - Evalúa biomarcadores de hardware (Test Neuromotor USB: latencia en ms, omisiones, comisiones/falsas alarmas).
   - Analiza la potencias por banda qEEG (Delta, Theta, Alfa, Beta, High Beta) y Z-Scores por región (Frontal, Parietal, Temporal, Occipital).

3. INTEG RACIÓN DE TELEMETRÍA VR META QUEST 3S (FRECUENCIA CARDÍACA / GSR):
   ${vrSection}
   - Correlaciona matemáticamente la respuesta vegetativa inmersiva (variabilidad de la frecuencia cardíaca HRV y GSR) con la severidad del autoreporte psicométrico.
   - Si se observa incongruencia (e.g., autoreporte de angustia extrema pero respuesta vagal normalizada e índice H óptimo en VR), calcula el posible efecto de debiasing o sesgo en el informe final.

4. EVALUACIÓN DE MEDICIÓN PASIVA (APK CENTINELA - RIESGO SUICIDA):
   - Interpreta los parámetros anonimizados de la herramienta de medición pasiva vinculada al expediente PAC.
   - Si los despertares nocturnos (nightWakeups) son mayores a 3 por noche y la latencia biomotora refleja agitación o letargo severo, combina estos datos con las escalas psicométricas (SAD PERSONS / C-SSRS).
   - En caso de detectarse un estado de riesgo ALTO o CRÍTICO:
     a) Prioriza en el dictamen el protocolo de contención y restricción de medios.
     b) Emite las recomendaciones de contacto directo con el profesional responsable (Colegiado) o la red de apoyo designada.

5. MATRIZ DE DIAGNÓSTICOS DIFERENCIALES Y DESCARTE DE SESGOS (7 TRASTORNOS) & PRINCIPIOS MORRISON:
   - Evalúa y realiza cruces bioclínicos obligatorios entre: TDAH, TAG, TDM, TEA, TLP, TOC y DETERIORO_PRODROMO.
   - Aplica el Principio de Seguridad A (descarte orgánico/sustancias primero), Principio F (prioridad al estado de ánimo), Principio M (Navaja de Occam), Principio W (evitar TP en cuadro agudo) y Principio X (jerarquía de tratabilidad).

${multisensorySection}

EXPEDIENTE COMPLETO DEL PACIENTE EN FORMATO JSON:
${patientJsonString}

INSTRUCCIONES DE FORMATO DE RESPUESTA:
Devuelve EXCLUSIVAMENTE un objeto JSON válido.
`;

  const parts: any[] = [{ text: promptText }];

  if (activeImage && activeImage.startsWith('data:image')) {
    const matches = activeImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches) {
      parts.unshift({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      });
    }
  }

  const vertexEndpoint = 'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-1.5-flash:generateContent';

  const proxyPayload = {
    contents: [{ role: 'user', parts: parts }],
    systemInstruction: {
      parts: [
        {
          text: 'Eres AMIE (Articulate Medical Intelligence Explorer), un copiloto de psiquiatría y neurología médica de precisión clínica. Genera análisis diagnósticos rigurosos con formato JSON estructurado basado en la guía DSM-5 Morrison y triangulación bioclínica multimodal.'
        }
      ]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };

  const responseJson = await callVertexViaProxy(vertexEndpoint, proxyPayload);
  const responseText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(responseText) as AmieClinicalAnalysis;
}

/**
 * Canaliza el chat copiloto con Vertex AI descontando 1 crédito de IA por consulta.
 */
export async function askAmieAssistant(
  conversation: { role: 'user' | 'model'; text: string }[],
  currentPatient: PatientRecord,
  analysisData?: AmieClinicalAnalysis | null
): Promise<string> {
  const activeUsername = typeof window !== 'undefined'
    ? localStorage.getItem('amie_username') || localStorage.getItem('amie_doctor_username') || 'harold01'
    : 'harold01';

  consumeAiCredit(activeUsername);

  const systemContext = `
Eres AMIE (Articulate Medical Intelligence Explorer), Copiloto Clínico Psiquiátrico y Neurológico.
Estás dialogando directamente con el médico especialista tratante colegiado.
Información del paciente actual en estudio:
${JSON.stringify(currentPatient, null, 2)}

${analysisData ? `Análisis diagnóstico emitido previamente:\n${JSON.stringify(analysisData, null, 2)}` : ''}

Responde de forma concisa, profesional, técnica, fundamentada en la literatura médica psiquiátrica (DSM-5, psicofarmacología clínica de Stahl/Goodman & Gilman, neurociencias y principios diagnósticos de James Morrison).
`;

  const vertexEndpoint = 'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-1.5-flash:generateContent';

  const contents = conversation.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const proxyPayload = {
    contents: contents,
    systemInstruction: { parts: [{ text: systemContext }] },
    generationConfig: { temperature: 0.4 }
  };

  try {
    const responseJson = await callVertexViaProxy(vertexEndpoint, proxyPayload);
    return responseJson.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta del motor clínico.';
  } catch (err: any) {
    console.error('Error en askAmieAssistant:', err);
    return 'Error al conectar con el servidor proxy de AMIE: ' + (err.message || 'Fallo de red');
  }
}
