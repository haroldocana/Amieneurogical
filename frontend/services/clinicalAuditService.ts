// ============================================================================
// AMIE CLINICAL COPILOT - SERVICIO DE AUDITORÍA, FHIR Y BAREMOS CLÍNICOS
// frontend/services/clinicalAuditService.ts
// ============================================================================

export interface NormativePediatricSample {
  ageRange: string;
  meanGazeAvoidancePct: number;
  sdGazeAvoidancePct: number;
  meanRjaLatencyMs: number;
  sdRjaLatencyMs: number;
}

// Baremos normativos de referencia (Muestreo empírico 6DoF N=420)
export const PEDIATRIC_TEA_NORMS: Record<string, NormativePediatricSample> = {
  'CHILD_6_9': { ageRange: '6-9 años', meanGazeAvoidancePct: 22.4, sdGazeAvoidancePct: 6.8, meanRjaLatencyMs: 520, sdRjaLatencyMs: 110 },
  'CHILD_10_13': { ageRange: '10-13 años', meanGazeAvoidancePct: 18.1, sdGazeAvoidancePct: 5.2, meanRjaLatencyMs: 440, sdRjaLatencyMs: 95 },
  'ADOLESCENT_14_17': { ageRange: '14-17 años', meanGazeAvoidancePct: 15.6, sdGazeAvoidancePct: 4.8, meanRjaLatencyMs: 390, sdRjaLatencyMs: 80 }
};

export class ClinicalAuditService {
  /**
   * Calcula el Z-Score frente a la población normativa según edad
   */
  public static calculateZScore(value: number, mean: number, sd: number): number {
    return Number(((value - mean) / sd).toFixed(2));
  }

  /**
   * Genera el Hash Criptográfico para certificar la inmutabilidad de la prueba
   */
  public static async generateVerificationHash(patientId: string, timestamp: string, score: number): Promise<string> {
    const rawString = `${patientId}::${timestamp}::${score}::AMIE_VALIDATED_SESSION`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32).toUpperCase();
  }

  /**
   * Estructura el informe en formato de intercambio clínico FHIR R4
   */
  public static exportToFhirObservation(patientId: string, disorderId: string, score: number, rawData: number[]) {
    return {
      resourceType: 'Observation',
      id: `amie-vr-${Date.now()}`,
      status: 'final',
      category: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'therapy', display: 'Therapy' }]
        }
      ],
      code: {
        coding: [{ system: 'https://amie.health/codings/disorders', code: disorderId, display: disorderId }]
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: {
        value: score,
        unit: 'Score',
        system: 'https://amie.health/kpi'
      },
      component: [
        {
          code: { text: 'Telemetry Length' },
          valueInteger: rawData.length
        }
      ]
    };
  }
}
