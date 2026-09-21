import { PatientRecord } from './types';

// ============================================================================
// CASOS CLÍNICOS DE PRUEBA (PRESETS) - COMPATIBLES CON EL NUEVO TIPADO
// ============================================================================

export const CLINICAL_CASE_PRESETS: { label: string; record: PatientRecord }[] = [
  {
    label: "Caso 1: Trauma y Riesgo Autolítico (PAC-8104)",
    record: {
      id: 'PAC-8104',
      patientNameAnonymized: 'Paciente ID: PAC-8104',
      age: 55,
      gender: 'M',
      consultationReason: 'Ideación suicida estructurada tras colapso sociofuncional, insomnio de despertar precoz.',
      anamnesis: 'Hombre de 55 años. Desde hace 3 meses presenta anhedonia total, despertar a las 02:30 AM con llanto, y verbalización de ruina.',
      sessionNotes: [
        'Sesión 1: Facies profundamente abatida. Expresa sensación de vacío insoportable.',
        'Sesión 2: Acompañado por cónyuge. Se interviene para decomiso de medios.'
      ],
      psychometricScores: {
        phq9: 24,
        gad7: 16,
        bdi2: 42,
        bai: 18,
        cssrsLevel: 5,
        sadPersons: 9
      },
      functionalAreas: {
        sleep: 15,
        appetite: 20,
        energy: 15,
        social: 10,
        attention: 35
      },
      sentinelTelemetry: {
        pacId: 'PAC-8104',
        deviceSyncTime: 'En línea (Sincronizado)',
        sleepMetrics: { nightWakeups: 5, hoursInDarkness: 7.2, sleepEfficiencyPct: 41, avgSleepDurationHours: 3.4 },
        behavioralBiometrics: { typingLatencyMs: 485, screenActiveTimeMinutes: 140, biomotorLatencyMs: 485, activityRestlessnessIndex: 82 },
        safetyStatus: {
          riskLevel: 'CRÍTICO',
          activeContentionTriggered: true,
          passiveRiskRationale: 'Despertares nocturnos múltiples (>3x/noche) y latencia biomotora ralentizada.',
          emergencyContact: { name: 'Rachel Murphy', relationship: 'Cónyuge', phone: '+52 55 4192 8831' }
        }
      },
      substancesHistory: {
        alcohol: 'Nulo en último mes',
        tobacco: 'Fumador leve',
        cannabis: 'Negativo',
        stimulants: 'Negativo',
        medicationsCurrent: ['Sertralina 50 mg/día']
      },
      medicalHistory: ['Úlcera péptica']
    }
  },
  {
    label: "Caso 2: Ansiedad Generalizada y TDAH (PAC-2291)",
    record: {
      id: 'PAC-2291',
      patientNameAnonymized: 'Paciente ID: PAC-2291',
      age: 28,
      gender: 'F',
      consultationReason: 'Dificultad severa para concentrarse en el trabajo y ataques de pánico ocasionales.',
      anamnesis: 'Mujer de 28 años, diseñadora. Reporta que su mente "no se apaga". Historial de fracasos académicos a pesar de alto CI.',
      sessionNotes: [
        'Sesión 1: Inquieta, verborreica. Cambia de tema constantemente.',
        'Sesión 2: Reporta crisis de ansiedad tras olvidar entregar un proyecto.'
      ],
      psychometricScores: {
        phq9: 8,
        gad7: 19,
        asrs: 15,
        bai: 21,
        cssrsLevel: 1,
        sadPersons: 2
      },
      functionalAreas: {
        sleep: 60,
        appetite: 80,
        energy: 40,
        social: 70,
        attention: 20
      },
      sentinelTelemetry: {
        pacId: 'PAC-2291',
        deviceSyncTime: 'En línea (Sincronizado)',
        sleepMetrics: { nightWakeups: 1, hoursInDarkness: 8.0, sleepEfficiencyPct: 85, avgSleepDurationHours: 6.5 },
        behavioralBiometrics: { typingLatencyMs: 120, screenActiveTimeMinutes: 480, biomotorLatencyMs: 110, activityRestlessnessIndex: 95 },
        safetyStatus: {
          riskLevel: 'BAJO',
          activeContentionTriggered: false,
          passiveRiskRationale: 'Patrones motores compatibles con hiperactividad, sin riesgo autolítico.',
          emergencyContact: { name: 'Carlos Ruiz', relationship: 'Hermano', phone: '+52 55 1234 5678' }
        }
      },
      substancesHistory: {
        alcohol: 'Consumo social',
        tobacco: 'Negativo',
        cannabis: 'Consumo ocasional para dormir',
        stimulants: 'Alto consumo de cafeína (6 tazas/día)',
        medicationsCurrent: []
      },
      medicalHistory: ['Ninguno']
    }
  }
];
