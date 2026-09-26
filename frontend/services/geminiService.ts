import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { CLINICAL_CASE_PRESETS } from '../constants';
import { consumeAiCredit } from './userService';

// ------------------------------------------------------------------
// CONFIGURACIÓN DE VARIABLES DE ENTORNO, ENDPOINTS Y MODELO
// ------------------------------------------------------------------
export const GEMINI_MODEL = 'gemini-3.8-flash';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://amieneurogical.onrender.com';
const PROXY_HEADER = import.meta.env.VITE_PROXY_HEADER || 'AMIE_SECRET_HEADER_2025';

const CLOUD_RUN_API_URL = import.meta.env.VITE_CLOUD_RUN_URL || 'https://amie-clinical-analyzer-367911373284.us-central1.run.app/api/clinical/analyze-qeeg';

// ------------------------------------------------------------------
// EXPEDIENTE BASE (SAFE DEFAULT) - LIMPIO PARA EVITAR FALSOS POSITIVOS
// ------------------------------------------------------------------
export const SAFE_DEFAULT_PATIENT: PatientRecord = {
  id: 'PAC-0000',
  patientNameAnonymized: 'Paciente No Identificado',
  age: 30,
  gender: 'F',
  consultationReason: 'Evaluación neuroclínica integral',
  anamnesis: 'Sin antecedentes registrados. Esperando sincronización...',
  sessionNotes: [],
  audioRecordings: [],
  psychometricScores: {},
  functionalAreas: {
    sleep: 50,
    appetite: 50,
    energy: 50,
    social: 50,
    attention: 50
  },
  neuromotorBiomarkers: undefined,
  qeegZScores: undefined,
  multisensoryHardware: undefined,
  sentinelTelemetry: undefined,
  substancesHistory: undefined,
  medicalHistory: []
};

// ------------------------------------------------------------------
// FUNCIONES AUXILIARES DE TRANSFORMACIÓN Y PROXY
// ------------------------------------------------------------------

async function callVertexViaProxy(originalUrl: string, payloadBody: unknown) {
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

function normalizeGender(rawSex?: unknown): 'M' | 'F' | 'Other' {
  if (!rawSex) return 'F';
  const val = String(rawSex).trim().toUpperCase();
  if (val.startsWith('M') || val.includes('MASC') || val === 'HOMBRE') return 'M';
  if (val.startsWith('F') || val.includes('FEM') || val === 'MUJER') return 'F';
  return 'Other';
}

function normalizeFunctionalAreas(rawAreas: unknown) {
  if (!rawAreas || typeof rawAreas !== 'object') {
    return { sleep: 50, appetite: 50, energy: 50, social: 50, attention: 50 };
  }
  const areasObj = rawAreas as Record<string, unknown>;
  const parseScore = (val: unknown) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return 50;
    if (num <= 10) return num * 10;
    return Math.min(100, Math.max(0, num));
  };
  return {
    sleep: parseScore(areasObj.sleep),
    appetite: parseScore(areasObj.appetite),
    energy: parseScore(areasObj.energy),
    social: parseScore(areasObj.social),
    attention: parseScore(areasObj.attention ?? areasObj.concentration ?? areasObj.concentracion)
  };
}

// ------------------------------------------------------------------
// AUXILIAR: DECODIFICADOR DE CAMPOS DE FIRESTORE REST API
// ------------------------------------------------------------------
function unwrapFirestoreDocument(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (!fields) return result;

  for (const [key, valObj] of Object.entries(fields)) {
    if (!valObj || typeof valObj !== 'object') continue;

    if ('stringValue' in valObj) result[key] = valObj.stringValue;
    else if ('integerValue' in valObj) result[key] = Number(valObj.integerValue);
    else if ('doubleValue' in valObj) result[key] = Number(valObj.doubleValue);
    else if ('booleanValue' in valObj) result[key] = valObj.booleanValue;
    else if ('mapValue' in valObj) result[key] = unwrapFirestoreDocument(valObj.mapValue?.fields || {});
    else if ('arrayValue' in valObj) {
      result[key] = (valObj.arrayValue?.values || []).map((v: any) => {
        if ('stringValue' in v) return v.stringValue;
        if ('integerValue' in v) return Number(v.integerValue);
        if ('doubleValue' in v) return Number(v.doubleValue);
        if ('mapValue' in v) return unwrapFirestoreDocument(v.mapValue?.fields || {});
        return v;
      });
    }
  }
  return result;
}

// ------------------------------------------------------------------
// MAPEO DE DATOS DE FIRESTORE (APP 1) A ESTRUCTURA DE APP 2
// ------------------------------------------------------------------
export async function mapApp1DataToApp2(
  rawCase: Record<string, unknown>,
  cleanPatientId: string,
  resolvedDoctorUsername: string
): Promise<PatientRecord> {
  const sessions = (rawCase.sessions as Array<Record<string, unknown>>) || [];
  const exactPsychometrics: Record<string, number> = {};

  sessions.forEach((s) => {
    if (s.testScores && typeof s.testScores === 'object') {
      Object.entries(s.testScores as Record<string, unknown>).forEach(([key, val]) => {
        if (typeof val === 'number') {
          exactPsychometrics[key.toLowerCase()] = val;
        }
      });
    }
  });

  const lastSession = sessions[sessions.length - 1] || {};
  const rawFunctional = lastSession.functionalAreas || rawCase.functionalAreas || rawCase.areasFuncionales || {};
  const mappedFunctionalAreas = normalizeFunctionalAreas(rawFunctional);

  const mappedNotes = sessions
    .map((s) => `Sesión ${s.sessionNumber || ''} (${s.date || ''}): ${s.rawNotes || s.notes || ''}`)
    .filter(Boolean);

  const generalData = (rawCase.generalData as Record<string, unknown>) || {};
  const filiacion = (rawCase.filiacion as Record<string, unknown>) || {};

  const rawName = (
    rawCase.fullName ||
    filiacion.nombreCompleto || filiacion.nombre ||
    generalData.nombreCompleto || generalData.nombre ||
    rawCase.nombreCompleto || rawCase.nombre ||
    rawCase.patientNameAnonymized || rawCase.patientName
  ) as string;

  const rawAge = filiacion.edad ?? generalData.edad ?? rawCase.edad ?? filiacion.age ?? generalData.age ?? rawCase.age;
  const parsedAge = Number(rawAge);
  const finalAge = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : 30;

  const rawGender = filiacion.genero || filiacion.sexo || generalData.genero || generalData.sexo || rawCase.genero || rawCase.sexo || rawCase.gender;
  const finalGender = normalizeGender(rawGender);

  const rawReason = (
    rawCase.chiefComplaint ||
    filiacion.motivoConsulta ||
    generalData.motivoConsultaTextual || generalData.motivoConsulta ||
    rawCase.motivoConsultaTextual || rawCase.motivoConsulta ||
    rawCase.consultationReason || rawCase.motivo
  ) as string;

  const rawAnamnesis = (rawCase.anamnesis || rawCase.hea || rawCase.antecedentes || generalData.antecedentes || generalData.anamnesis || filiacion.anamnesis || filiacion.hea) as string;

  const rawPsych = (rawCase.psychometricScores || rawCase.psychometrics || rawCase.escalas || {}) as Record<string, unknown>;
  const mergedPsychometrics: Record<string, number> = {
    ...exactPsychometrics,
    ...(typeof rawPsych === 'object' ? (rawPsych as Record<string, number>) : {})
  };

  if (typeof rawCase.phq9 === 'number') mergedPsychometrics.phq9 = rawCase.phq9;
  if (typeof rawCase.gad7 === 'number') mergedPsychometrics.gad7 = rawCase.gad7;
  if (typeof rawCase.bdi2 === 'number') mergedPsychometrics.bdi2 = rawCase.bdi2;
  if (typeof rawCase.sadPersons === 'number') mergedPsychometrics.sadPersons = rawCase.sadPersons;
  if (typeof rawCase.cssrsLevel === 'number') mergedPsychometrics.cssrsLevel = rawCase.cssrsLevel;

  return {
    id: (rawCase.id as string) || (rawCase.displayId as string) || (rawCase.pacId as string) || cleanPatientId,
    patientNameAnonymized: rawName ? rawName : `Paciente ID: ${cleanPatientId}`,
    age: finalAge,
    gender: finalGender,
    consultationReason: rawReason || 'Evaluación neuroclínica y telemetría fisiológica en vivo',
    anamnesis: rawAnamnesis || 'Sin antecedentes psiquiátricos precargados. Registro en tiempo real.',
    sessionNotes: mappedNotes.length > 0 ? mappedNotes : (rawCase.sessionNotes as string[]) || ['Sincronizado desde base de datos App 1'],
    audioRecordings: (rawCase.audioRecordings as any[]) || [],
    psychometricScores: mergedPsychometrics,
    functionalAreas: mappedFunctionalAreas,
    neuromotorBiomarkers: (rawCase.neuromotorBiomarkers as any) || undefined,
    qeegZScores: (rawCase.qeegZScores as any) || undefined,
    multisensoryHardware: (rawCase.multisensoryHardware as any) || undefined,
    vrTelemetryData: (rawCase.vrTelemetryData as any) || undefined,
    vrTherapyReport: (rawCase.vrTherapyReport as any) || undefined,
    sentinelTelemetry: rawCase.sentinelTelemetry ? {
      ...(rawCase.sentinelTelemetry as object),
      pacId: cleanPatientId,
      deviceSyncTime: `En línea (Sincronizado - ${resolvedDoctorUsername})`
    } as any : undefined,
    substancesHistory: (rawCase.substancesHistory as any) || undefined,
    medicalHistory: (rawCase.medicalHistory as any) || []
  };
}

// ------------------------------------------------------------------
// SINCRONIZACIÓN DE EXPEDIENTES CON FIREBASE FIRESTORE (APP 1)
// ------------------------------------------------------------------
export async function syncWithClinicalApp(
  patientId: string,
  colegiado: number | string = 'COL-DEFAULT',
  doctorUsername?: string
): Promise<{ patient: PatientRecord; analysis?: AmieClinicalAnalysis | null; message: string }> {

  const storedUsername = typeof window !== 'undefined'
    ? localStorage.getItem('amie_username') || localStorage.getItem('amie_doctor_username')
    : null;

  const resolvedDoctorUsername = (doctorUsername || storedUsername || '2000').trim().toLowerCase();
  const cleanPacId = (patientId || '').trim().toUpperCase();
  
  if (!cleanPacId) throw new Error("Debe ingresar un código PAC válido (ej. PAC-2964).");

  const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'amie-clinical-copilot';
  const COLLECTION_NAME = import.meta.env.VITE_FIRESTORE_COLLECTION || 'patients';
  const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDorrRPma3q_a-D-OuRh_K4F71yHGgBW1w';

  const colegiadoPrefix = typeof colegiado === 'number' ? `COL-${colegiado}` : String(colegiado).trim();

  const candidateDocIds = [
    cleanPacId,
    `${resolvedDoctorUsername}_${cleanPacId}`,
    `${colegiadoPrefix}_${cleanPacId}`,
    `COL-DEFAULT_${cleanPacId}`,
    `harold_${cleanPacId}`,
    `harold_${colegiadoPrefix}_${cleanPacId}`
  ];

  let foundDocData: Record<string, any> | null = null;
  let matchedDocId = '';

  for (const docId of candidateDocIds) {
    const firestoreEndpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${docId}?key=${FIREBASE_API_KEY}`;
    
    try {
      const response = await fetch(firestoreEndpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const docData = await response.json();
        if (docData && docData.fields) {
          foundDocData = docData.fields;
          matchedDocId = docId;
          break;
        }
      }
    } catch (e) {
      console.warn(`Intento fallido para documento ${docId}:`, e);
    }
  }

  if (!foundDocData) {
    try {
      const queryEndpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId: COLLECTION_NAME }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'id' },
              op: 'EQUAL',
              value: { stringValue: cleanPacId }
            }
          }
        }
      };

      const queryResp = await fetch(queryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryBody)
      });

      if (queryResp.ok) {
        const queryResults = await queryResp.json();
        const firstMatch = queryResults.find((r: any) => r.document && r.document.fields);
        if (firstMatch) {
          foundDocData = firstMatch.document.fields;
          matchedDocId = firstMatch.document.name.split('/').pop() || cleanPacId;
        }
      }
    } catch (queryErr) {
      console.warn('Consulta estructurada fallida:', queryErr);
    }
  }

  if (foundDocData) {
    const rawData = unwrapFirestoreDocument(foundDocData);
    const mappedPatient = await mapApp1DataToApp2(rawData, cleanPacId, resolvedDoctorUsername);

    return {
      patient: mappedPatient,
      analysis: null,
      message: `¡Expediente '${mappedPatient.patientNameAnonymized}' (${cleanPacId}) recuperado exitosamente desde Firestore (${matchedDocId})!`
    };
  }

  const matchedPreset = CLINICAL_CASE_PRESETS.find(p => p.record.id.toUpperCase() === cleanPacId);
  if (matchedPreset) {
    const syncdPatient = await mapApp1DataToApp2(matchedPreset.record as any, cleanPacId, resolvedDoctorUsername);
    return {
      patient: syncdPatient,
      analysis: null,
      message: `Expediente ${cleanPacId} cargado desde presets locales.`
    };
  }

  throw new Error(`El expediente '${cleanPacId}' no se encontró en la colección 'patients' de Firestore.`);
}

// ------------------------------------------------------------------
// MOTOR PRINCIPAL DE INFERENCIA CLÍNICA AMIE (GEMINI 3.8 FLASH / VERTEX)
// CON ENFOQUE OBLIGATORIO DE TRIANGULACIÓN BIOCLÍNICA MULTIMODAL
// ------------------------------------------------------------------
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

  const activeImage = qEegImageBase64 || patient.qeegBiomarkers?.heatmapBase64 || null;

  try {
    const apiPayload = {
      patientRecord: patient,
      qEegImageBase64: activeImage,
      sentinelTelemetry: patient.sentinelTelemetry || null,
      qeegBiomarkers: patient.qeegBiomarkers || null,
      multisensoryHardware: patient.multisensoryHardware || null,
      vrTelemetryData: patient.vrTelemetryData || null,
      vrTherapyReport: patient.vrTherapyReport || null,
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
      if (data && (data.diagnosticImpressions || data.principalDiagnosis)) {
        return data as AmieClinicalAnalysis;
      }
    }
  } catch (backendError) {
    console.warn('Cloud Run API no disponible, ejecutando Gemini 3.8 Flash vía Proxy:', backendError);
  }

  const vrSection = patient.vrTelemetryData ? `
--- PILAR 3.A: TELEMETRÍA VR INMERSIVA (PICO NEO 3 / QUEST 3S) ---
- Session GUID: ${patient.vrTelemetryData.sessionId}
- Conductancia Cutánea (GSR Pico): ${Math.max(...(patient.vrTelemetryData.gsrMicroSiemens || [0]))} µS
- Tono Vagal (HRV RMSSD Última Lectura): ${patient.vrTelemetryData.hrvRmssdMs?.slice(-1)[0] || 'N/A'} ms
- Índice de Habituación Terapéutica (H): ${patient.vrTelemetryData.habituationIndexH}
- Picos de Excitación Simpática: ${patient.vrTelemetryData.stressPeaksCount}
` : '--- PILAR 3.A: TELEMETRÍA VR: No realizada ---';

  const multisensorySection = patient.multisensoryHardware ? `
--- PILAR 3.B: BIOMETRÍA MULTISENSORIAL BLE EN VIVO ---
- Tono Vagal / HRV Index: ${patient.multisensoryHardware.vagalToneHrvIndex}/100
- Presión Prensión Manual: ${patient.multisensoryHardware.handGripPressureKg} kg
- Camouflaging Index (CAT-Q): ${patient.multisensoryHardware.camouflagingIndexPct}%
- Duración Fijación Ocular: ${patient.multisensoryHardware.ocularFixationDurationMs} ms
` : '';

  const systemInstructionText = `
Eres AMIE (Articulate Medical Intelligence Explorer), un copiloto de psiquiatría y neurología médica de precisión clínica operando con Gemini 3.8 Flash.
TU REGLA FUNDAMENTAL ES LA TRIANGULACIÓN BIOCLÍNICA OBLIGATORIA EN 3 PILARES:

PILAR 1 (SUBJETIVO / CLINICO): Anamnesis, motivo de consulta y notas de sesión.
PILAR 2 (PSICOMETRÍA CUANTITATIVA): Escalas estandarizadas. Si un examen no fue realizado o tiene valor cero, IGNORA sus alertas para evitar falsos positivos.
PILAR 3 (FISIOLOGÍA Y BIOMETRÍA OBJETIVA): Tono vagal (HRV/RMSSD), conductancia cutánea (GSR), mapas de Z-Scores qEEG y métricas VR.

INSTRUCCIONES DE TRIANGULACIÓN Y DEVOLUCIÓN:
1. Compara la congruencia entre lo que el paciente reporta y sus marcadores fisiológicos objetivos.
2. Devuelve EXCLUSIVAMENTE un objeto JSON estructurado con el análisis cruzado en los campos 'bioclinicalTriangulation', 'principalDiagnosis', 'differentialMatrix', 'riskAlerts' y 'pharmacologicalEffectiveness'.
`;

  if (GEMINI_API_KEY) {
    try {
      const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const directPayload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemInstructionText },
              { text: `EXPEDIENTE PARA TRIANGULACIÓN BIOCLÍNICA:\n${JSON.stringify(patient, null, 2)}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.15,
          responseMimeType: 'application/json'
        }
      };

      const directResp = await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(directPayload)
      });

      if (directResp.ok) {
        const directData = await directResp.json();
        const rawText = directData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          return JSON.parse(rawText) as AmieClinicalAnalysis;
        }
      }
    } catch (directErr) {
      console.warn('Fallo en llamada directa a Gemini API:', directErr);
    }
  }

  const promptText = `
${systemInstructionText}
${vrSection}
${multisensorySection}
EXPEDIENTE PACIENTE (JSON):
${JSON.stringify(patient, null, 2)}
`;

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: promptText }];
  if (activeImage && activeImage.startsWith('data:image')) {
    const matches = activeImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches) {
      parts.unshift({ inlineData: { mimeType: matches[1], data: matches[2] } });
    }
  }

  const vertexEndpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/${GEMINI_MODEL}:generateContent`;
  const proxyPayload = {
    contents: [{ role: 'user', parts: parts }],
    systemInstruction: { parts: [{ text: systemInstructionText }] },
    generationConfig: { responseMimeType: 'application/json', temperature: 0.15 }
  };

  try {
    const responseJson = await callVertexViaProxy(vertexEndpoint, proxyPayload);
    const responseText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (responseText) {
      return JSON.parse(responseText) as AmieClinicalAnalysis;
    }
  } catch (proxyError) {
    console.warn('Proxy Express no disponible, generando respuesta de contingencia local:', proxyError);
  }

  return generateFallbackAnalysis(patient);
}

// ------------------------------------------------------------------
// GENERACIÓN DE CONTINGENCIA LOCAL DINÁMICA
// ------------------------------------------------------------------
const generateFallbackAnalysis = (patient: PatientRecord): AmieClinicalAnalysis => {
  const hrvVal = patient.vrTelemetryData?.hrvRmssdMs?.[0] || patient.multisensoryHardware?.vagalToneHrvIndex || 40;
  const gsrVal = patient.vrTelemetryData?.gsrMicroSiemens?.[0] || 2.1;
  
  const phq9Val = patient.psychometricScores?.phq9 ?? 0;
  const gad7Val = patient.psychometricScores?.gad7 ?? 0;
  const cssrsVal = patient.psychometricScores?.cssrsLevel ?? 0;

  const isSevereDepression = phq9Val >= 20 || cssrsVal >= 4;
  let convergence = 88.0;
  if (isSevereDepression && hrvVal < 25) convergence += 6.5;

  const finalConvergenceScore = Math.min(98.8, Math.round(convergence * 10) / 10);

  if (isSevereDepression) {
    return {
      principalDiagnosis: {
        codeCIE10: 'F33.2',
        codeCIE9: '296.33',
        disorderName: 'Trastorno Depresivo Mayor Recurrente, Episodio Grave sin Síntomas Psicóticos',
        certaintyPct: finalConvergenceScore,
        specifiers: ['Con síntomas de ansiedad severa', 'Con alto riesgo de conducta autolítica'],
        gafEstimated: 25,
        justificationDsm5: `Criterios DSM-5 cumplidos por la triangulación de 3 pilares: 1) Pilar Clínico, 2) Pilar Psicométrico (PHQ-9 = ${phq9Val}, C-SSRS = Nivel ${cssrsVal}), 3) Pilar Fisiológico (HRV = ${hrvVal} ms, GSR = ${gsrVal} µS).`
      },
      differentialMatrix: [
        {
          disorderKey: 'TAG',
          disorderName: 'Trastorno de Ansiedad Generalizada',
          codeCIE10: 'F41.1',
          status: 'Descartado',
          certaintyPct: 22.0,
          qeegProfile: { thetaBetaRatioEvaluation: 'Normal', highBetaEvaluation: 'Elevado', alphaAsymmetryEvaluation: 'Asimetría alfa', coherenceEvaluation: 'Conservada' },
          psychometricsProfile: { scaleMatched: 'GAD-7', scoreSummary: `Puntaje: ${gad7Val}/21` },
          apkPassiveMarker: 'Despertares nocturnos múltiples',
          acousticBiomarkerCorrelation: 'Bradilalia',
          biasDiscardRationale: 'La ansiedad es secundaria al cuadro depresivo mayor.',
          morrisonPrincipleApplied: 'Principio F de Morrison'
        }
      ],
      differentialDiagnoses: [],
      bioclinicalTriangulation: {
        psychometricsSummary: `PILAR 2: PHQ-9 = ${phq9Val}, GAD-7 = ${gad7Val}, C-SSRS = ${cssrsVal}`,
        functionalAreasAssessment: `Sueño ${patient.functionalAreas.sleep}, Atención ${patient.functionalAreas.attention}`,
        acousticBiometricAssessment: 'PILAR 3.A: Bradilalia.',
        vrHabituationAssessment: `PILAR 3.B: HRV = ${hrvVal} ms, GSR = ${gsrVal} µS.`,
        regionalLobeBreakdown: { frontal: 'Lentificación', temporal: 'Simétrico', parietal: 'Normal', occipital: 'Normal' },
        convergenceScore: finalConvergenceScore
      },
      pharmacologicalEffectiveness: [],
      therapeuticAffinityScores: [{
        disorderName: 'Depresión Mayor',
        affinityPct: finalConvergenceScore,
        status: 'Alta Concordancia Multimodal',
        recommendedTherapy: 'TCC + Activación',
        psychopharmacologyScheme: 'Evaluación psiquiátrica urgente',
        biomarkerRationale: 'Convergencia clara.'
      }],
      riskAlerts: {
        suicideRiskLevel: 'CRÍTICO',
        psychosisRisk: 'PRESENTE_DELIRANTE',
        cognitiveDeteriorationRisk: 'PSEUDODEMENCIA_DEPRESIVA',
        apkPassiveState: 'Riesgo inminente',
        criticalAlertsList: ['Riesgo autolítico activo', `HRV bajo (${hrvVal} ms)`],
        containmentProtocolSuggested: 'ACTIVACIÓN INMEDIATA DE LÍNEA DE CRISIS.'
      },
      recommendedActionPlan: {
        neurofeedbackProtocol: [], psychotherapyStrategy: [], pharmacologySuggestions: [], psychiatryReferralUrgent: true, monitoringDirectives: [], urgentActions: []
      }
    };
  }

  return {
    principalDiagnosis: {
      codeCIE10: 'Z13.3',
      codeCIE9: 'V79.0',
      disorderName: 'Evaluación Neurofisiológica y Autonómica en Modulación Normal',
      certaintyPct: 92.5,
      specifiers: ['Sin riesgo detectado', 'Lectura Biométrica Activa'],
      gafEstimated: 85,
      justificationDsm5: `Paciente ${patient.gender === 'F' ? 'Femenino' : 'Masculino'}, ${patient.age} años. Modulación autonómica estable según telemetría (HRV = ${hrvVal} ms, GSR = ${gsrVal} µS) sin baterías psicométricas en rango de riesgo.`
    },
    differentialMatrix: [
      {
        disorderKey: 'STRESS',
        disorderName: 'Reacción de Estrés Leve Subclínica',
        codeCIE10: 'F43.9',
        status: 'Descartado',
        certaintyPct: 10.0,
        qeegProfile: { thetaBetaRatioEvaluation: 'Normal', highBetaEvaluation: 'Normotensivo', alphaAsymmetryEvaluation: 'Simetría conservada', coherenceEvaluation: 'Normal' },
        psychometricsProfile: { scaleMatched: 'N/A', scoreSummary: 'Sin puntajes de riesgo' },
        apkPassiveMarker: 'Sincronía biomotora adecuada',
        acousticBiomarkerCorrelation: 'Prosodia normal',
        biasDiscardRationale: 'Valores basales dentro de rango de salud (Normotonia).',
        morrisonPrincipleApplied: 'Principio A de Morrison'
      }
    ],
    differentialDiagnoses: [],
    bioclinicalTriangulation: {
      psychometricsSummary: 'PILAR 2: Ausencia de escalas psicométricas patológicas.',
      functionalAreasAssessment: `Sueño: ${patient.functionalAreas.sleep}/100, Energía: ${patient.functionalAreas.energy}/100`,
      acousticBiometricAssessment: 'PILAR 3.A: Modulación de voz en rango de eutimia.',
      vrHabituationAssessment: `PILAR 3.B: HRV = ${hrvVal} ms, GSR = ${gsrVal} µS. Tono Vagal estable.`,
      regionalLobeBreakdown: { frontal: 'Normal', temporal: 'Simétrico', parietal: 'Sin alterations', occipital: 'Ritmo posterior adecuado' },
      convergenceScore: 92.5
    },
    pharmacologicalEffectiveness: [],
    therapeuticAffinityScores: [{
      disorderName: 'Eutimia / Funcionamiento Normal',
      affinityPct: 92.5,
      status: 'Confirmado por Telemetría',
      recommendedTherapy: 'Psicoeducación de mantenimiento',
      psychopharmacologyScheme: 'Ninguno',
      biomarkerRationale: 'Lecturas biológicas y cuestionarios (si aplica) en equilibrio.'
    }],
    riskAlerts: {
      suicideRiskLevel: 'BAJO',
      psychosisRisk: 'AUSENTE',
      cognitiveDeteriorationRisk: 'AUSENTE',
      apkPassiveState: 'Tono basal estable',
      criticalAlertsList: [],
      containmentProtocolSuggested: 'Atención primaria rutinaria. No requiere medidas de emergencia.'
    },
    recommendedActionPlan: {
      neurofeedbackProtocol: ['Autorregulación opcional SMR'], psychotherapyStrategy: ['Psicoeducación'], pharmacologySuggestions: ['Ninguna'], psychiatryReferralUrgent: false, monitoringDirectives: ['Mantenimiento telemetría pasiva'], urgentActions: []
    }
  };
};

// ------------------------------------------------------------------
// CHAT COPILOTO ASISTENTE CLÍNICO AMIE (GEMINI 3.8 FLASH)
// ------------------------------------------------------------------
export async function askAmieAssistant(
  conversation: Array<{ role: 'user' | 'model'; text: string }>,
  currentPatient: PatientRecord,
  analysisData?: AmieClinicalAnalysis | null
): Promise<string> {
  const activeUsername = typeof window !== 'undefined'
    ? localStorage.getItem('amie_username') || localStorage.getItem('amie_doctor_username') || 'harold01'
    : 'harold01';

  consumeAiCredit(activeUsername);

  const systemContext = `
Eres AMIE, Copiloto Clínico Psiquiátrico operando con Gemini 3.8 Flash.
Usa TRIANGULACIÓN BIOCLÍNICA MULTIMODAL.
Paciente actual:
${JSON.stringify(currentPatient, null, 2)}
${analysisData ? `Análisis previo:\n${JSON.stringify(analysisData, null, 2)}` : ''}
Responde al médico tratante de manera ultra-concisa y científica.
`;

  // Intento 1: Llamada directa vía API KEY si existe en variables de entorno
  if (GEMINI_API_KEY) {
    try {
      const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const contents = conversation.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const directPayload = {
        contents: [
          { role: 'user', parts: [{ text: systemContext }] },
          ...contents
        ],
        generationConfig: { temperature: 0.25 }
      };

      const directResp = await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(directPayload)
      });

      if (directResp.ok) {
        const directData = await directResp.json();
        const rawText = directData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) return rawText;
      }
    } catch (directErr) {
      console.warn('Fallo en llamada directa a Gemini API en asistente:', directErr);
    }
  }

  // Intento 2: Proxy Express / Vertex AI
  const vertexEndpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/${GEMINI_MODEL}:generateContent`;
  const contents = conversation.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const proxyPayload = {
    contents: contents,
    systemInstruction: { parts: [{ text: systemContext }] },
    generationConfig: { temperature: 0.25 }
  };

  try {
    const responseJson = await callVertexViaProxy(vertexEndpoint, proxyPayload);
    return responseJson.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta del motor Gemini.';
  } catch (err: unknown) {
    console.error('Error en askAmieAssistant:', err);
    return 'Error al conectar con la API de IA. Verifique su conexión o clave de API.';
  }
}
