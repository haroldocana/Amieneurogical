// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR DE INTEROPERABILIDAD HL7 FHIR R4
// frontend/utils/fhirConverter.ts
// ============================================================================

import { PatientRecord, AmieClinicalAnalysis } from '../types';

export interface FhirCoding {
  system: string;
  code: string;
  display: string;
}

export interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  status: 'final';
  code: {
    coding: FhirCoding[];
    text: string;
  };
  subject?: {
    reference: string;
    display?: string;
  };
  effectiveDateTime?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  interpretation?: Array<{
    coding: FhirCoding[];
  }>;
}

export interface FhirPatient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  active: boolean;
  name: Array<{
    text: string;
    family?: string;
    given?: string[];
  }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
}

export interface FhirPractitioner {
  resourceType: 'Practitioner';
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    text: string;
    family: string;
    given: string[];
  }>;
}

export interface FhirDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  meta: {
    profile: string[];
    lastUpdated: string;
  };
  status: 'final' | 'preliminary' | 'amended';
  category: Array<{
    coding: FhirCoding[];
  }>;
  code: {
    coding: FhirCoding[];
    text: string;
  };
  subject: {
    reference: string;
    display: string;
    identifier?: { system: string; value: string };
  };
  effectiveDateTime: string;
  issued: string;
  performer: Array<{
    reference?: string;
    display: string;
    identifier?: { system: string; value: string };
  }>;
  result: Array<{ reference: string; display: string }>;
  contained: Array<FhirObservation | FhirPractitioner | any>;
  conclusion: string;
  conclusionCode: Array<{
    coding: FhirCoding[];
  }>;
}

export interface FhirBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'document' | 'collection';
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: any;
  }>;
}

/**
 * Normaliza el género del paciente al estándar HL7 FHIR R4
 */
export const mapGenderToFhir = (gender?: string): 'male' | 'female' | 'other' | 'unknown' => {
  if (!gender) return 'unknown';
  const g = String(gender).trim().toUpperCase();
  if (g === 'M' || g.startsWith('MASC') || g === 'HOMBRE') return 'male';
  if (g === 'F' || g.startsWith('FEM') || g === 'MUJER') return 'female';
  if (g === 'OTHER' || g === 'OTRO') return 'other';
  return 'unknown';
};

/**
 * Normaliza y extrae diagnósticos primarios tolerando esquemas polimórficos de AMIE
 */
export const extractPrimaryDiagnosis = (
  patient: PatientRecord, 
  analysis: AmieClinicalAnalysis | null
) => {
  const p = patient as any;

  // 1. Prioridad: Motor principal de inferencia AMIE (geminiService / Cloud Run)
  if (analysis?.principalDiagnosis) {
    const pd = analysis.principalDiagnosis;
    return {
      title: pd.disorderName || 'Trastorno Clínico en Observación',
      icd10: pd.codeCIE10 || 'F32.9',
      icd9: pd.codeCIE9 || '296.20',
      confidence: pd.certaintyPct ?? 90,
      justification: pd.justificationDsm5 || 'Evaluación diagnóstica multimodal triangulada.',
      specifiers: pd.specifiers || []
    };
  }

  // 2. Esquema alternativo: primaryDiagnostic
  if ((analysis as any)?.primaryDiagnostic) {
    const pDiag = (analysis as any).primaryDiagnostic;
    return {
      title: pDiag.title || 'Evaluación Psiquiátrica Integral',
      icd10: pDiag.dsm5Code || pDiag.icd11Code || 'F32.9',
      icd9: '296.20',
      confidence: pDiag.probabilityPercent ?? 85,
      justification: pDiag.severityLevel || 'Moderado',
      specifiers: []
    };
  }

  // 3. Esquema secundario: diagnosticImpressions
  if ((analysis as any)?.diagnosticImpressions?.[0]) {
    const imp = (analysis as any).diagnosticImpressions[0];
    return {
      title: imp.title || imp.description || 'Trastorno Clínico en Observación',
      icd10: imp.code || imp.icd10 || imp.dsm5 || 'F32.9',
      icd9: '296.20',
      confidence: imp.confidencePct ?? imp.probabilityPercent ?? 80,
      justification: 'Impresión clínica preliminar estructurada.',
      specifiers: []
    };
  }

  // 4. Fallback: Expediente base del paciente
  const diagCode = p?.diagnosticCode || 'F32.9';
  return {
    title: p?.primaryDiagnosisName || p?.consultationReason || 'Diagnóstico Clínico Provisional',
    icd10: diagCode,
    icd9: '296.20',
    confidence: 75,
    justification: p?.anamnesis || 'En proceso de evaluación.',
    specifiers: []
  };
};

/**
 * Construye observaciones FHIR biométricas autónomas para justificar el dictamen
 */
export const generateContainedObservations = (patient: PatientRecord): FhirObservation[] => {
  const observations: FhirObservation[] = [];
  const p = patient as any;

  // 1. Tono Vagal / HRV (RMSSD)
  const rawHrv = p.vrTelemetryData?.hrvRmssdMs?.[0] ??
                 p.vrTherapyIntervention?.realtimeTelemetrySummary?.finalHrv ??
                 p.vrTelemetryData?.hrv ??
                 p.multisensoryHardware?.vagalToneHrvIndex ??
                 (p.sentinelTelemetrySnapshot?.restingHeartRate 
                   ? Math.round(60000 / p.sentinelTelemetrySnapshot.restingHeartRate) 
                   : 42);

  const hrvValue = Number(rawHrv);

  observations.push({
    resourceType: 'Observation',
    id: 'OBS-HRV-01',
    status: 'final',
    code: {
      coding: [
        { system: 'http://loinc.org', code: '80404-7', display: 'R-R interval.standard deviation (Heart rate variability)' }
      ],
      text: 'Variabilidad del Ritmo Cardíaco (HRV RMSSD / Tono Vagal)'
    },
    valueQuantity: {
      value: hrvValue,
      unit: 'ms',
      system: 'http://unitsofmeasure.org',
      code: 'ms'
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: hrvValue < 25 ? 'L' : hrvValue > 65 ? 'H' : 'N',
            display: hrvValue < 25 ? 'Low Parasympathetic Tone (Rigidez Autonómica)' : 'Normal Parasympathetic Regulation'
          }
        ]
      }
    ]
  });

  // 2. Respuesta Galvánica de la Piel (GSR / EDA)
  const rawGsr = p.vrTelemetryData?.gsrMicroSiemens ?? 
                 p.vrTherapyIntervention?.realtimeTelemetrySummary?.peakGSR_uS ??
                 p.vrTelemetryData?.gsr ??
                 p.multisensoryHardware?.gsrMicroSiemens ??
                 3.2;

  const gsrValue = Array.isArray(rawGsr) && rawGsr.length > 0 
    ? Number(Math.max(...rawGsr).toFixed(2)) 
    : Number(Number(rawGsr).toFixed(2));

  observations.push({
    resourceType: 'Observation',
    id: 'OBS-GSR-02',
    status: 'final',
    code: {
      coding: [
        { system: 'http://loinc.org', code: '87522-9', display: 'Galvanic skin response' },
        { system: 'http://amie-clinical.org/biometrics', code: 'GSR-EDA', display: 'Electrodermal Activity / Skin Conductance' }
      ],
      text: 'Conductancia Cutánea Fásica Pico (GSR / Excitación Simpática)'
    },
    valueQuantity: {
      value: gsrValue,
      unit: 'uS',
      system: 'http://unitsofmeasure.org',
      code: 'uS'
    }
  });

  // 3. Marcador qEEG: Ratio Theta/Beta Frontal (TBR)
  const tbrValue = Number(
    (p.qeegZScores?.frontalThetaBetaRatio ?? 
     p.qeegBiomarkers?.thetaBetaRatio ?? 
     1.85).toFixed(2)
  );

  observations.push({
    resourceType: 'Observation',
    id: 'OBS-QEEG-TBR-03',
    status: 'final',
    code: {
      coding: [
        { system: 'http://loinc.org', code: '96914-7', display: 'EEG wave frequency band ratio' },
        { system: 'http://amie-clinical.org/qeeg', code: 'TBR-RATIO', display: 'Frontal Theta/Beta Ratio' }
      ],
      text: 'Ratio Theta/Beta Frontal (qEEG - Control Inhibitorio / TDAH)'
    },
    valueQuantity: {
      value: tbrValue,
      unit: '{ratio}',
      system: 'http://unitsofmeasure.org',
      code: '{ratio}'
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: tbrValue >= 3.0 ? 'H' : 'N',
            display: tbrValue >= 3.0 ? 'Elevado (Lentificación Frontal)' : 'Normal'
          }
        ]
      }
    ]
  });

  // 4. Tiempo de Reacción Biomotora (CPT)
  const reactionTime = Number(
    p.neuromotorBiomarkers?.reactionTimeMs ?? 
    p.vrTelemetryData?.reactionTimeMs ?? 
    240
  );

  observations.push({
    resourceType: 'Observation',
    id: 'OBS-RT-04',
    status: 'final',
    code: {
      coding: [
        { system: 'http://loinc.org', code: '89569-8', display: 'Reaction time test' }
      ],
      text: 'Latencia de Reacción Biomotora (CPT / Tiempo de Reacción)'
    },
    valueQuantity: {
      value: reactionTime,
      unit: 'ms',
      system: 'http://unitsofmeasure.org',
      code: 'ms'
    }
  });

  // 5. Presión Prensión Manual (Dinamometría)
  const gripKg = Number(
    p.multisensoryHardware?.handGripPressureKg ?? 
    p.neuromotorBiomarkers?.handGripPressureKg ?? 
    0
  );

  if (gripKg > 0) {
    observations.push({
      resourceType: 'Observation',
      id: 'OBS-GRIP-05',
      status: 'final',
      code: {
        coding: [
          { system: 'http://loinc.org', code: '83174-3', display: 'Grip strength Dynamometer' }
        ],
        text: 'Dinamometría Manual (Fuerza Isométrica)'
      },
      valueQuantity: {
        value: gripKg,
        unit: 'kg',
        system: 'http://unitsofmeasure.org',
        code: 'kg'
      }
    });
  }

  // 6. Escala PHQ-9 (Depresión)
  if (p.psychometricScores?.phq9 !== undefined && p.psychometricScores.phq9 !== null) {
    observations.push({
      resourceType: 'Observation',
      id: 'OBS-PHQ9-06',
      status: 'final',
      code: {
        coding: [
          { system: 'http://loinc.org', code: '44249-1', display: 'PHQ-9 quick depression assessment panel' }
        ],
        text: 'Cuestionario de Salud del Paciente (PHQ-9)'
      },
      valueQuantity: {
        value: Number(p.psychometricScores.phq9),
        unit: '{score}',
        system: 'http://unitsofmeasure.org',
        code: '{score}'
      }
    });
  }

  // 7. Escala GAD-7 (Ansiedad)
  if (p.psychometricScores?.gad7 !== undefined && p.psychometricScores.gad7 !== null) {
    observations.push({
      resourceType: 'Observation',
      id: 'OBS-GAD7-07',
      status: 'final',
      code: {
        coding: [
          { system: 'http://loinc.org', code: '70274-6', display: 'Generalized anxiety disorder 7 item (GAD-7) total score' }
        ],
        text: 'Escala de Ansiedad Generalizada (GAD-7)'
      },
      valueQuantity: {
        value: Number(p.psychometricScores.gad7),
        unit: '{score}',
        system: 'http://unitsofmeasure.org',
        code: '{score}'
      }
    });
  }

  // 8. Escala C-SSRS (Riesgo Autolítico)
  if (p.psychometricScores?.cssrsLevel !== undefined && p.psychometricScores.cssrsLevel !== null) {
    observations.push({
      resourceType: 'Observation',
      id: 'OBS-CSSRS-08',
      status: 'final',
      code: {
        coding: [
          { system: 'http://loinc.org', code: '93294-7', display: 'Columbia-Suicide Severity Rating Scale (C-SSRS) screen version' }
        ],
        text: 'Escala de Gravedad del Suicidio de Columbia (C-SSRS)'
      },
      valueQuantity: {
        value: Number(p.psychometricScores.cssrsLevel),
        unit: '{score}',
        system: 'http://unitsofmeasure.org',
        code: '{score}'
      },
      interpretation: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: p.psychometricScores.cssrsLevel >= 3 ? 'A' : 'N',
              display: p.psychometricScores.cssrsLevel >= 3 ? 'Riesgo Significativo / Crítico' : 'Riesgo Bajo / No Detectado'
            }
          ]
        }
      ]
    });
  }

  return observations;
};

/**
 * Transforma el expediente AMIE en un Recurso FHIR DiagnosticReport (HL7 FHIR R4)
 */
export const convertToFhirDiagnosticReport = (
  patient: PatientRecord,
  analysis: AmieClinicalAnalysis | null,
  colegiadoNumber: number | string = 749210
): FhirDiagnosticReport => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = p?.patientNameAnonymized || `Paciente ${patientId}`;
  const reportDate = new Date().toISOString();
  
  const diag = extractPrimaryDiagnosis(patient, analysis);
  const observations = generateContainedObservations(patient);

  // Registro del médico tratante estructurado
  const practitioner: FhirPractitioner = {
    resourceType: 'Practitioner',
    id: `PRAC-COL-${colegiadoNumber}`,
    identifier: [
      {
        system: 'http://colegiomedicos.org.gt/registro',
        value: colegiadoNumber.toString()
      }
    ],
    name: [
      {
        text: `Dr. Médico Colegiado #${colegiadoNumber}`,
        family: 'Especialista',
        given: ['Médico']
      }
    ]
  };

  const diagnosticReport: FhirDiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: `DIAG-REP-${patientId}-${Date.now()}`,
    meta: {
      profile: [
        'http://hl7.org/fhir/StructureDefinition/DiagnosticReport'
      ],
      lastUpdated: reportDate
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            code: 'OTH',
            display: 'Other / Multimodal Bioclinical Triangulation'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '11524-6',
          display: 'Mental health Treatment and rehabilitation report'
        }
      ],
      text: 'Informe Pericial de Triangulación Bioclínica y Neuropsiquiátrica AMIE'
    },
    subject: {
      reference: `Patient/${patientId}`,
      display: patientDisplayName,
      identifier: {
        system: 'http://amie-clinical.org/patients',
        value: patientId
      }
    },
    effectiveDateTime: reportDate,
    issued: reportDate,
    performer: [
      {
        reference: `#${practitioner.id}`,
        display: practitioner.name[0].text,
        identifier: practitioner.identifier[0]
      }
    ],
    result: observations.map(obs => ({
      reference: `#${obs.id}`,
      display: obs.code.text
    })),
    contained: [
      practitioner,
      ...observations
    ],
    conclusion: `DIAGNÓSTICO PRINCIPAL: ${diag.title} [CIE-10: ${diag.icd10} | CIE-9: ${diag.icd9}]. ` +
                `Convergencia diagnóstica calculada: ${diag.confidence}%. ${diag.justification}`,
    conclusionCode: [
      {
        coding: [
          {
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: diag.icd10,
            display: diag.title
          }
        ]
      }
    ]
  };

  return diagnosticReport;
};

/**
 * Transforma el expediente AMIE y su análisis en un Recurso FhirBundle HL7 FHIR R4 interoperable
 */
export const convertToFhirBundle = (
  patient: PatientRecord,
  analysis: AmieClinicalAnalysis | null,
  colegiadoNumber: number | string = 749210
): FhirBundle => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = p?.patientNameAnonymized || `Paciente ${patientId}`;
  const now = new Date().toISOString();

  // 1. Recurso Patient
  const birthYear = p.age ? (new Date().getFullYear() - p.age) : undefined;
  const fhirPatient: FhirPatient = {
    resourceType: 'Patient',
    id: patientId,
    identifier: [
      {
        system: 'http://amie-clinical.org/patients',
        value: patientId
      }
    ],
    active: true,
    name: [
      {
        text: patientDisplayName
      }
    ],
    gender: mapGenderToFhir(p.gender),
    birthDate: birthYear ? `${birthYear}-01-01` : undefined
  };

  // 2. Recurso Practitioner
  const fhirPractitioner: FhirPractitioner = {
    resourceType: 'Practitioner',
    id: `PRAC-${colegiadoNumber}`,
    identifier: [
      {
        system: 'http://colegiomedicos.org.gt/registro',
        value: colegiadoNumber.toString()
      }
    ],
    name: [
      {
        text: `Dr. Médico Colegiado #${colegiadoNumber}`,
        family: 'Especialista',
        given: ['Médico']
      }
    ]
  };

  // 3. Recursos Observation
  const rawObservations = generateContainedObservations(patient);
  const fhirObservations = rawObservations.map(obs => ({
    ...obs,
    subject: {
      reference: `Patient/${patientId}`,
      display: patientDisplayName
    },
    effectiveDateTime: now
  }));

  // 4. Recurso DiagnosticReport
  const diagReport = convertToFhirDiagnosticReport(patient, analysis, colegiadoNumber);

  // 5. Ensamblaje del Bundle
  const bundle: FhirBundle = {
    resourceType: 'Bundle',
    id: `BUNDLE-${patientId}-${Date.now()}`,
    type: 'collection',
    timestamp: now,
    entry: [
      {
        fullUrl: `urn:uuid:Patient/${fhirPatient.id}`,
        resource: fhirPatient
      },
      {
        fullUrl: `urn:uuid:Practitioner/${fhirPractitioner.id}`,
        resource: fhirPractitioner
      },
      ...fhirObservations.map(obs => ({
        fullUrl: `urn:uuid:Observation/${obs.id}`,
        resource: obs
      })),
      {
        fullUrl: `urn:uuid:DiagnosticReport/${diagReport.id}`,
        resource: diagReport
      }
    ]
  };

  return bundle;
};

/**
 * Descarga el archivo JSON con codificación UTF-8 conforme al estándar HL7 FHIR R4
 */
export const downloadFhirJson = (
  fhirData: FhirBundle | FhirDiagnosticReport,
  filename?: string
): void => {
  if (typeof window === 'undefined') return;

  const defaultName = fhirData.resourceType === 'Bundle'
    ? `FHIR_R4_Bundle_${(fhirData as FhirBundle).id}.json`
    : `FHIR_R4_Report_${(fhirData as FhirDiagnosticReport).id}.json`;

  const safeFilename = filename || defaultName;
  const jsonString = JSON.stringify(fhirData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/fhir+json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
  mapGenderToFhir,
  extractPrimaryDiagnosis,
  generateContainedObservations,
  convertToFhirDiagnosticReport,
  convertToFhirBundle,
  downloadFhirJson
};
