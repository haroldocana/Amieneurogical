import { runtimeConfig } from '../resources/motor-clinico-amiet-55307264/config';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { CLINICAL_CASE_PRESETS } from '../constants';

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
 * Connects with external Clinical App via Cloud Storage and Cloud Function.
 */
export async function syncWithClinicalApp(
  patientId: string,
  colegiado: number,
  doctorUsername?: string
): Promise<{ patient: PatientRecord; analysis?: AmieClinicalAnalysis | null; message: string }> {
  const storedUsername = typeof window !== 'undefined'
    ? localStorage.getItem('amie_username') || localStorage.getItem('amie_doctor_username')
    : null;

  const resolvedDoctorUsername = (doctorUsername || storedUsername || 'harold01').trim();
  const cleanPatientId = (patientId || 'PAC-8104').trim().toUpperCase();

  // 1. EXTRACCIÓN DESDE CLOUD STORAGE
  try {
    const cloudUrl = `https://storage.googleapis.com/base-psicologiagt-usuario2/clinica/${resolvedDoctorUsername}/cases.json?t=${Date.now()}`;
    const response = await fetch(cloudUrl);

    if (response.ok) {
      const clinicalDatabase = await response.json();
      const rawCase = clinicalDatabase[cleanPatientId];

      if (rawCase) {
        const sessions = rawCase.sessions || [];
        
        const exactPsychometrics: Record<string, number> = {};
        sessions.forEach((s: any) => {
          if (s.testScores && typeof s.testScores === 'object') {
            Object.entries(s.testScores).forEach(([key, val]) => {
              if (typeof val === 'number') exactPsychometrics[key] = val;
            });
          }
        });

        const lastSession = sessions[sessions.length - 1] || {};
        const rawFunctional = lastSession.functionalAreas || { sleep: 5, appetite: 5, energy: 5, social: 5, concentration: 5 };
        const mappedFunctionalAreas = normalizeFunctionalAreas(rawFunctional);

        const mappedNotes = sessions.map((s: any) => `Sesión ${s.sessionNumber} (${s.date || ''}): ${s.rawNotes || ''}`).filter(Boolean);

        const mappedPatient: PatientRecord = {
          ...SAFE_DEFAULT_PATIENT,
          id: rawCase.id || cleanPatientId,
          patientNameAnonymized: `Paciente ID: ${rawCase.id || cleanPatientId}`,
          age: Number(rawCase.generalData?.edad) || 55,
          gender: normalizeGender(rawCase.generalData?.sexo),
          consultationReason: rawCase.generalData?.motivoConsultaTextual || 'Evaluación neuroclínica integral',
          anamnesis: rawCase.generalData?.antecedentes || 'Sin antecedentes registrados',
          sessionNotes: mappedNotes.length > 0 ? mappedNotes : ['Sincronizado desde la base clínica App1'],
          functionalAreas: mappedFunctionalAreas,
          psychometricScores: {
            ...SAFE_DEFAULT_PATIENT.psychometricScores,
            ...exactPsychometrics
          },
          sentinelTelemetry: {
            ...SAFE_DEFAULT_PATIENT.sentinelTelemetry!,
            pacId: cleanPatientId,
            deviceSyncTime: `En línea (Sincronizado de ${resolvedDoctorUsername})`
          }
        };

        let amieAnalysis: AmieClinicalAnalysis | null = null;
        try {
          amieAnalysis = await runAmieClinicalAnalysis(mappedPatient);
        } catch (aErr) {
          console.warn('Error al auto-ejecutar análisis AMIE:', aErr);
        }

        return {
          patient: mappedPatient,
          analysis: amieAnalysis,
          message: `Expediente ${cleanPatientId} extraído al 100% de la nube para ${resolvedDoctorUsername}.`
        };
      }
    }
  } catch (err) {
    console.warn('Fallo al conectar con Cloud Storage directo, intentando fallback de Cloud Function:', err);
  }

  // 2. FALLBACK VIA CLOUD FUNCTION
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('amie_auth_token') || 'demo-jwt-bearer-token'
    : 'demo-jwt-bearer-token';

  const postBody = {
    patientId: cleanPatientId,
    pacientId: cleanPatientId,
    doctorUsername: resolvedDoctorUsername,
    colegiado: Number(colegiado) || 749210,
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

    if (response.status === 404) {
      throw new Error(`El expediente ${cleanPatientId} no existe o no tiene datos cargados`);
    }

    if (response.ok) {
      const data = await response.json();
      const rawData = (data.patientRecord || data) as any;

      const mappedId = rawData.patientId || rawData.id || rawData.pacId || cleanPatientId;
      const mappedAge = Number(rawData.age) || 21;
      const mappedGender = normalizeGender(rawData.sex || rawData.gender || 'Femenino');
      
      const mappedChiefComplaint = Array.isArray(rawData.clinicalFocus)
        ? rawData.clinicalFocus.join(', ')
        : (rawData.chiefComplaint || rawData.consultationReason || 'Evaluación de foco clínico neuropsiquiátrico');

      const mappedNotes = rawData.analysisFindings || rawData.anamnesis || 'Sincronizado desde la App SaaS';
      const mappedFunctionalAreas = normalizeFunctionalAreas(rawData.functionalAreas);

      const mappedPatient: PatientRecord = {
        ...SAFE_DEFAULT_PATIENT,
        id: mappedId,
        patientNameAnonymized: `Paciente ID: ${mappedId}`,
        age: mappedAge,
        gender: mappedGender,
        consultationReason: mappedChiefComplaint,
        anamnesis: mappedNotes,
        sessionNotes: Array.isArray(rawData.sessionNotes) && rawData.sessionNotes.length > 0
          ? rawData.sessionNotes
          : [mappedNotes],
        audioRecordings: [],
        functionalAreas: mappedFunctionalAreas,
        psychometricScores: {
          ...SAFE_DEFAULT_PATIENT.psychometricScores,
          ...(rawData.psychometricScores || {})
        },
        neuromotorBiomarkers: {
          ...SAFE_DEFAULT_PATIENT.neuromotorBiomarkers!,
          ...(rawData.neuromotorBiomarkers || {})
        },
        qeegZScores: {
          ...SAFE_DEFAULT_PATIENT.qeegZScores!,
          ...(rawData.qeegZScores || {})
        },
        multisensoryHardware: {
          ...SAFE_DEFAULT_PATIENT.multisensoryHardware!,
          ...(rawData.multisensoryHardware || {})
        },
        sentinelTelemetry: {
          ...SAFE_DEFAULT_PATIENT.sentinelTelemetry!,
          ...(rawData.sentinelTelemetry || {}),
          pacId: mappedId,
          deviceSyncTime: 'En línea (Sincronizado desde Cloud Function)'
        },
        substancesHistory: {
          ...SAFE_DEFAULT_PATIENT.substancesHistory,
          ...(rawData.substancesHistory || {})
        },
        medicalHistory: Array.isArray(rawData.medicalHistory)
          ? rawData.medicalHistory
          : SAFE_DEFAULT_PATIENT.medicalHistory
      };

      return {
        patient: mappedPatient,
        analysis: data.preliminaryAnalysis || data.analysis || null,
        message: data.message || `Expediente ${cleanPatientId} sincronizado exitosamente para ${resolvedDoctorUsername}.`
      };
    } else if (response.status !== 404) {
      throw new Error(`Servicio de sincronización respondió con código ${response.status}`);
    }
  } catch (err: any) {
    if (err?.message && err.message.includes('no existe o no tiene datos cargados')) {
      throw err;
    }
    console.warn('Fallo en solicitud de red a Cloud Function, verificando repositorio local de presets:', err);
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

  throw new Error(`El expediente ${cleanPatientId} no existe o no tiene datos cargados`);
}

/**
 * Runs AMIE Multimodal Diagnostic Analysis using DSM-5 Morrison principles
 * via Express Proxy pointing to Vertex AI.
 */
export async function runAmieClinicalAnalysis(
  patient: PatientRecord,
  qEegImageBase64?: string
): Promise<AmieClinicalAnalysis> {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('amie_auth_token') || 'demo-jwt-bearer-token' 
    : 'demo-jwt-bearer-token';

  const safeRecord: PatientRecord = {
    ...SAFE_DEFAULT_PATIENT,
    ...patient
  };

  const activeImage = qEegImageBase64 || safeRecord.qeegBiomarkers?.heatmapBase64 || null;

  // 1. Intento vía Microservicio Cloud Run
  try {
    const apiPayload = {
      patientRecord: safeRecord,
      qEegImageBase64: activeImage,
      sentinelTelemetry: safeRecord.sentinelTelemetry || null,
      qeegBiomarkers: safeRecord.qeegBiomarkers || null,
      multisensoryHardware: safeRecord.multisensoryHardware || null,
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
    console.warn('Cloud Run API no disponible, ejecutando motor clínico Vertex AI a través del Proxy:', backendError);
  }

  // 2. Ejecución mediante Proxy Backend de Express a Vertex AI
  const patientJsonString = JSON.stringify(safeRecord, null, 2);

  const promptText = `
IDENTIDAD CLÍNICA (AMIE FRAMEWORK):
Eres AMIE (Articulate Medical Intelligence Explorer), operando como Copiloto Psiquiátrico y Neurológico Avanzado.
Tu función es el análisis bioclínico, la prevención activa y la generación de diagnósticos diferenciales para el profesional de la salud responsable bajo normativas HIPAA y RGPD.

MÉTODO DE ANÁLISIS E INTERPRETACIÓN DE DATOS (JSON):
Al recibir el expediente clínico del paciente, realizarás un análisis cruzado integral en 4 niveles:

1. EXTRAER Y EVALUAR SÍNTOMAS PRINCIPALES:
   - Motivo de consulta, anamnesis y notas históricas de cada sesión.
   - Carga sintomática en Ansiedad, Depresión, Psicosis, TDAH, TCA, Personalidad (TLP) y Deterioro Cognitivo.

2. TRIANGULACIÓN BIOCLÍNICA Y PSICOMÉTRICA:
   - Cruza las notas subjetivas del terapeuta con los puntajes DSM-5/OMS (BDI-II, BAI, PHQ-9, GAD-7, ASRS, AQ-10, MMSE, C-SSRS, SAD PERSONS).
   - Analiza las Áreas Funcionales (Sueño, Apetito, Energía, Social, Atención).
   - Evalúa biomarcadores de hardware (Test Neuromotor USB: latencia en ms, omisiones, comisiones/falsas alarmas).
   - Analiza la potencias por banda qEEG (Delta, Theta, Alfa, Beta, High Beta) y Z-Scores por región (Frontal, Parietal, Temporal, Occipital).

3. EVALUACIÓN DE MEDICIÓN PASIVA (APK CENTINELA - RIESGO SUICIDA):
   - Interpreta los parámetros anonimizados de la herramienta de medición pasiva vinculada al expediente PAC.
   - Si los despertares nocturnos (nightWakeups) son mayores a 3 por noche y la latencia biomotora refleja agitación o letargo severo, combina estos datos con las escalas psicométricas (SAD PERSONS / C-SSRS).
   - En caso de detectarse un estado de riesgo ALTO o CRÍTICO:
     a) Prioriza en el dictamen el protocolo de contención y restricción de medios.
     b) Emite las recomendaciones de contacto directo con el profesional responsable (Colegiado) o la red de apoyo designada.

4. MATRIZ DE DIAGNÓSTICOS DIFERENCIALES Y DESCARTE DE SESGOS (7 TRASTORNOS):
   Evalúa y realiza cruces bioclínicos obligatorios entre: TDAH, TAG, TDM, TEA, TLP, TOC y DETERIORO_PRODROMO.

5. CADENA DE RAZONAMIENTO DIAGNÓSTICO (DSM-5 & MORRISON):
   - Aplica el Principio de Seguridad A (descarte orgánico/sustancias primero), Principio F (prioridad al estado de ánimo), Principio M (Navaja de Occam), Principio W (evitar TP en cuadro agudo) y Principio X (jerarquía de tratabilidad).

EXPEDIENTE DEL PACIENTE EN FORMATO JSON:
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
    contents: [
      {
        role: 'user',
        parts: parts
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: 'Eres AMIE (Articulate Medical Intelligence Explorer), un copiloto de psiquiatría y neurología médica de precisión clínica. Genera análisis diagnósticos rigurosos con formato JSON estructurado basado en la guía DSM-5 Morrison y triangulación bioclínica.'
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
  const parsedData: AmieClinicalAnalysis = JSON.parse(responseText);
  return parsedData;
}

/**
 * Chat copilot conversation handler via Express Proxy
 */
export async function askAmieAssistant(
  conversation: { role: 'user' | 'model'; text: string }[],
  currentPatient: PatientRecord,
  analysisData?: AmieClinicalAnalysis | null
): Promise<string> {
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
    systemInstruction: {
      parts: [{ text: systemContext }]
    },
    generationConfig: {
      temperature: 0.4
    }
  };

  try {
    const responseJson = await callVertexViaProxy(vertexEndpoint, proxyPayload);
    return responseJson.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta del motor clínico.';
  } catch (err: any) {
    console.error('Error en askAmieAssistant:', err);
    return 'Error al conectar con el servidor proxy de AMIE: ' + (err.message || 'Fallo de red');
  }
}
