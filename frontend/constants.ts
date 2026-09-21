import { PatientRecord, MedicalLicenseAccount } from './types';

// ============================================================================
// PRINCIPIOS DIAGNÓSTICOS DE JAMES MORRISON (DSM-5)
// ============================================================================
export const MORRISON_CLINICAL_PRINCIPLES = [
  { letter: 'A', title: 'Seguridad en Diagnóstico Diferencial', text: 'Establezca su diagnóstico diferencial en forma jerárquica conforme a la seguridad del paciente (trastornos orgánicos y tratables primero).' },
  { letter: 'B', title: 'Antecedentes Familiares', text: 'Los antecedentes familiares orientan el diagnóstico; revalúe tras entrevistar a la familia.' },
  { letter: 'C', title: 'Etiología Física & Tratamientos', text: 'Los trastornos físicos y su farmacoterapia pueden inducir o agravar los síntomas mentales.' },
  { letter: 'D', title: 'Descarte Somatomorfo', text: 'Descarte trastorno de síntomas somáticos cuando los síntomas no coincidan con la anatomía o los tratamientos no funcionen.' },
  { letter: 'E', title: 'Consumo de Sustancias', text: 'El consumo de sustancias (intoxicación/abstinencia) puede inducir casi cualquier cuadro psicopatológico.' },
  { letter: 'F', title: 'Prioridad al Estado de Ánimo', text: 'Por su alta prevalencia, letalidad y respuesta a tratamiento, siempre descarte trastornos del estado de ánimo.' },
  { letter: 'G', title: 'Antecedentes > Aspecto Actual', text: 'Los antecedentes longitudinales tienen mayor peso predictivo que el corte transversal actual.' },
  { letter: 'H', title: 'Recencia de Antecedentes', text: 'Los antecedentes más recientes tienen más valor diagnóstico que los de mayor antigüedad.' },
  { letter: 'I', title: 'Fuentes Colaterales', text: 'La información de informantes confiables con frecuencia supera los relatos con anosognosia o simulación.' },
  { letter: 'J', title: 'Signos > Síntomas', text: 'Los signos objetivos observables tienen más valor que las quejas subjetivas no verificadas.' },
  { letter: 'M', title: 'Navaja de Occam', text: 'Elija la explicación más simple y unificadora antes de acumular diagnósticos independientes.' },
  { letter: 'N', title: 'Caballos vs Cebras', text: 'Piense primero en las afecciones más comunes antes que en patologías exóticas.' },
  { letter: 'P', title: 'Predictor de Conducta', text: 'El elemento que mejor predice el comportamiento futuro es el comportamiento previo en circunstancias análogas.' },
  { letter: 'Q', title: 'Conteo de Criterios', text: 'A mayor número de síntomas cardinales de un trastorno, mayor probabilidad de certeza diagnóstica.' },
  { letter: 'W', title: 'Evitar TP en Cuadro Agudo', text: 'Evite diagnosticar trastornos de la personalidad durante un cuadro agudo del Eje I o crisis descompensatoria.' },
  { letter: 'X', title: 'Jerarquía de Tratabilidad', text: 'Enliste diagnósticos múltiples priorizando el más urgente y sensible al tratamiento médico.' }
];

// ============================================================================
// BASE DE DATOS LOCAL DE LICENCIAMIENTO SAAS (MOCK/DEMO)
// ============================================================================
export const INITIAL_LICENSES: MedicalLicenseAccount[] = [
  {
    id: 'LIC-00891',
    doctorName: 'Dr. Alejandro Morales Rivera',
    colegiadoNumber: 749210,
    username: 'dr.morales@hospitalgeneral.med',
    hospitalClinic: 'Hospital Central de Especialidades Psiquiátricas',
    specialty: 'Psiquiatría de Enlace & Neuropsiquiatría',
    tier: 'Institucional',
    storageBucketUri: 'gs://base-conocimiento-medica/licencias/dr.morales@hospitalgeneral.med.json',
    createdAt: '2024-01-15',
    expiresAt: '2026-12-31',
    status: 'Activa'
  },
  {
    id: 'LIC-00892',
    doctorName: 'Dra. Gabriela Enríquez Cotera',
    colegiadoNumber: 883194,
    username: 'dra.enriquez@neuromed.cl',
    hospitalClinic: 'Instituto de Neurociencias y Salud Mental',
    specialty: 'Neurología Clínica & Psicofarmacología',
    tier: 'Investigación',
    storageBucketUri: 'gs://base-conocimiento-medica/licencias/dra.enriquez@neuromed.cl.json',
    createdAt: '2024-03-01',
    expiresAt: '2026-03-01',
    status: 'Activa'
  }
];

// ============================================================================
// CASOS CLÍNICOS PRE-CARGADOS (PRESETS) - COMPATIBILIDAD DUAL
// ============================================================================
export const CLINICAL_CASE_PRESETS: { 
  name: string; 
  label: string; 
  description: string; 
  record: PatientRecord 
}[] = [
  {
    name: 'Caso 1: Trauma y Riesgo Autolítico (PAC-8104)',
    label: 'Caso 1: Trauma y Riesgo Autolítico (PAC-8104)',
    description: 'Ideación suicida estructurada tras colapso sociofuncional, insomnio de despertar precoz.',
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
    name: 'Caso 2: Ansiedad Generalizada y TDAH (PAC-2291)',
    label: 'Caso 2: Ansiedad Generalizada y TDAH (PAC-2291)',
    description: 'Dificultad severa para concentrarse en el trabajo y ataques de pánico ocasionales.',
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

// ============================================================================
// CONFIGURACIÓN MAESTRA DE ENTORNOS VR (52 TRASTORNOS CIE-11 / DSM-5)
// ============================================================================
export const MASTER_VR_ENVIRONMENTS = {
  version: "3.8.0-AMIE-CLINICAL",
  systemName: "AMIE VR 52-DISORDER MASTER CONFIGURATION",
  updatedAt: "2026-03-20T00:00:00Z",
  environmentsCount: 10,
  coveredDisordersCount: 52,
  defaultSamplingRateHz: 60,
  masterEnvironments: [
    {
      id: "ENV_01_CLASSROOM_OFFICE",
      name: "Aula / Oficina de Carga Atencional y Cognitiva",
      unitySceneName: "Scene_Classroom_CPT3D",
      supportedClinicalTasks: ["CPT_3D_GO_NO_GO", "N_BACK_MEMORY", "STROOP_3D_SPATIAL"],
      targetDisorders: [
        { code: "6A05.0", dsm5: "314.01", name: "TDAH Presentación Combinada" },
        { code: "6A05.1", dsm5: "314.00", name: "TDAH Presentación Inatenta" },
        { code: "6A05.2", dsm5: "314.01", name: "TDAH Presentación Hiperactiva/Impulsiva" }
      ],
      controllableParameters: {
        distractorDensity360: { type: "range", min: 0, max: 12, default: 4, unit: "active_distractors" }
      }
    }
  ]
};
