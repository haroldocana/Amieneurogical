import { PatientRecord, AmieClinicalAnalysis } from '../types';

/**
 * Transforma un expediente de AIMA en un Recurso FHIR DiagnosticReport (HL7)
 */
export const convertToFhirDiagnosticReport = (
  patient: PatientRecord,
  analysis: AmieClinicalAnalysis | null,
  colegiadoNumber: number
) => {
  const reportDate = new Date().toISOString();

  return {
    resourceType: "DiagnosticReport",
    id: `AIMA-RPT-${patient.id}`,
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0074",
            code: "PSY",
            display: "Psychiatry"
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "11526-1",
          display: "Psychiatry Diagnostic study note"
        }
      ],
      text: "Dictamen Bioclínico y Multimodal AMIE"
    },
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.patientNameAnonymized || `Paciente ID: ${patient.id}`
    },
    effectiveDateTime: reportDate,
    issued: reportDate,
    performer: [
      {
        display: `Médico Tratante (Colegiado #${colegiadoNumber})`
      }
    ],
    conclusion: analysis?.diagnosticImpressions?.[0]
      ? `${analysis.diagnosticImpressions[0].code} - ${analysis.diagnosticImpressions[0].title}. Certeza: ${analysis.diagnosticImpressions[0].confidencePct}%`
      : "Evaluación en proceso",
    conclusionCode: [
      {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-11",
            code: analysis?.diagnosticImpressions?.[0]?.code || "6B40",
            display: analysis?.diagnosticImpressions?.[0]?.title || "TEPT"
          }
        ]
      }
    ]
  };
};
