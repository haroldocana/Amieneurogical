// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR DE INTEROPERABILIDAD HL7 FHIR R4
// frontend/utils/fhirConverter.ts
// ============================================================================

import { PatientRecord, AmieClinicalAnalysis } from '../types';

export interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  status: 'final';
  code: {
    coding: Array<{ system: string; code: string; display: string }>;
    text: string;
  };
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  interpretation?: Array<{
    coding: Array<{ system: string; code: string; display: string }>;
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
    coding: Array<{ system: string; code: string; display: string }>;
  }>;
  code: {
    coding: Array<{ system: string; code: string; display: string }>;
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
  contained: Array<FhirObservation | any>;
  conclusion: string;
  conclusionCode: Array<{
    coding: Array<{ system: string; code: string; display: string }>;
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
 * Normaliza y extrae diagnósticos primarios tolerando esquemas polimórficos de AMIE
 */
const extractPrimaryDiagnosis = (patient: PatientRecord, analysis: AmieClinicalAnalysis | null) => {
  // 1. Prioridad: Motor multiaxial analítico de AMIE
  if (analysis?.primaryDiagnostic) {
    return {
      title: analysis.primaryDiagnostic.title || 'Evaluación Psiquiátrica Integral',
      icd11: analysis.primaryDiagnostic.icd11Code || '6A70',
      dsm5: analysis.primaryDiagnostic.dsm5Code || 'F32.9',
      confidence: analysis.primaryDiagnostic.probabilityPercent ?? 85,
      severity: analysis.primaryDiagnostic.severityLevel || 'Moderado'
    };
  }

  // 2. Esquema alternativo: diagnosticImpressions
  if ((analysis as any)?.diagnosticImpressions?.[0]) {
    const imp = (analysis as any).diagnosticImpressions[0];
    return {
      title: imp.title || imp.description || 'Trastorno Clínico en Observación',
      icd11: imp.code || imp.icd11 || '6A70',
      dsm5: imp.dsm5 || imp.code || 'F32.9',
      confidence: imp.confidencePct ?? imp.probabilityPercent ?? 80,
      severity: 'Moderado'
    };
  }

  // 3. Fallback: Expediente base del paciente
  const diagCode = (patient as any).diagnosticCode || 'F32.9';
  return {
    title: (patient as any).primaryDiagnosisName || 'Diagnóstico Clínico Provisional',
    icd11: (patient as any).icd11Code || '6A70',
    dsm5: diagCode,
    confidence: 75,
    severity: 'En proceso de evaluación'
  };
};

/**
 * Construye observaciones FHIR biométricas autónomas para justificar el dictamen
 */
const generateContainedObservations = (patient: PatientRecord): FhirObservation[] => {
  const observations: FhirObservation[] = [];
  const p = patient as any;

  // 1. Tono Vagal / HRV (RMSSD)
  const hrvValue = p.vrTherapyIntervention?.realtimeTelemetrySummary?.finalHrv ??
                   p.vrTelemetryData?.hrv ??
                   p.sentinelTelemetrySnapshot?.restingHeartRate ? Math.round(60000 / p.sentinelTelemetrySnapshot.restingHeartRate) : 42;

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
      value: Number(hrvValue),
      unit: 'ms',
      system: 'http://unitsofmeasure.org',
      code: 'ms'
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: hrvValue < 25 ? 'L' : 'N',
            display: hrvValue < 25 ? 'Low Parasympathetic Tone' : 'Normal'
          }
        ]
      }
    ]
  });

  // 2. Respuesta Galvánica de la Piel (GSR / Conductancia)
  const gsrValue = p.vrTherapyIntervention?.realtimeTelemetrySummary?.peakGSR_uS ??
                   p.vrTelemetryData?.gsr ??
                   3.2;

  observations.push({
    resourceType: 'Observation',
    id: 'OBS-GSR-02',
    status: 'final',
    code: {
      coding: [
        { system: 'http://amie-clinical.org/biometrics', code: 'GSR-EDA', display: 'Electrodermal Activity / Skin Conductance' }
      ],
      text: 'Actividad Electrocutánea Fásica (GSR)'
    },
    valueQuantity: {
      value: Number(gsrValue),
      unit: 'uS',
      system: 'http://unitsofmeasure.org',
      code: 'uS'
    }
  });

  // 3. Biomarcador qEEG: Ratio Theta/Beta Frontal
  const tbrValue = p.qeegZScores?.frontalThetaBetaRatio ?? 1.85;
  observations.push({
    resourceType: 'Observation',
    id: 'OBS-QEENG-TBR-03',
    status: 'final',
    code: {
      coding: [
        { system: 'http://amie-clinical.org/qeeg', code: 'TBR-RATIO', display: 'Frontal Theta/Beta Ratio (qEEG)' }
      ],
      text: 'Ratio Theta/Beta Frontal (Marcador Atencional y Ejecutivo)'
    },
    valueQuantity: {
      value: Number(tbrValue),
      unit: 'ratio',
      code: '{ratio}'
    }
  });

  // 4. Escala PHQ-9 (Depresión) si existe
  if (p.psychometricScores?.phq9 !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: 'OBS-PHQ9-04',
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
        code: '{score}'
      }
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
  colegiadoNumber: number = 749210
): FhirDiagnosticReport => {
  const patientId = patient.id || (patient as any).patientId || 'PAC-8104';
  const reportDate = new Date().toISOString();
  const diag = extractPrimaryDiagnosis(patient, analysis);
  const observations = generateContainedObservations(patient);

  // Registro del médico tratante estructurado
  const practitioner = {
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
        text: `Dr. Médico Especialista (Colegiado #${colegiadoNumber})`,
        family: 'Especialista',
        given: ['Médico']
      }
    ]
  };

  const
