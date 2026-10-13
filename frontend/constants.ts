import { PatientRecord, MedicalLicenseAccount } from './types';

export interface MorrisonPrinciple {
  letter: string;
  title: string;
  text: string;
}

export interface ClinicalCasePreset {
  name: string;
  label: string;
  description: string;
  record: PatientRecord;
}

export interface VrEnvironmentTarget {
  code: string;
  dsm5: string;
  name: string;
}

export interface VrControllableParam {
  type: 'range' | 'toggle' | 'select';
  min?: number;
  max?: number;
  step?: number;
  default: number | boolean | string;
  unit?: string;
  options?: string[];
}

export interface VrEnvironmentConfig {
  id: string;
  name: string;
  unitySceneName: string;
  supportedClinicalTasks: string[];
  targetDisorders: VrEnvironmentTarget[];
  controllableParameters: Record<string, VrControllableParam>;
}

export interface MasterVrConfig {
  version: string;
  systemName: string;
  updatedAt: string;
  environmentsCount: number;
  coveredDisordersCount: number;
  defaultSamplingRateHz: number;
  masterEnvironments: VrEnvironmentConfig[];
}

// ============================================================================
// PRINCIPIOS DIAGNÓSTICOS DE JAMES MORRISON (DSM-5)
// ============================================================================
export const MORRISON_CLINICAL_PRINCIPLES: MorrisonPrinciple[] = [
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
    expiresAt: '2026-12-31',
    status: 'Activa'
  }
];

// ============================================================================
// CASOS CLÍNICOS PRE-CARGADOS (PRESETS CANÓNICOS)
// ============================================================================
export const CLINICAL_CASE_PRESETS: ClinicalCasePreset[] = [
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
  },
  {
    name: 'Caso 3: Peritaje Forense Cluster B & Narcisismo (PAC-2964)',
    label: 'Caso 3: Peritaje Forense Cluster B & Narcisismo (PAC-2964)',
    description: 'Evaluación pericial de rasgos de grandiosidad, manipulación maquiavélica y labilidad afectiva.',
    record: {
      id: 'PAC-2964',
      patientNameAnonymized: 'Paciente ID: PAC-2964',
      age: 41,
      gender: 'M',
      consultationReason: 'Peritaje judicial psiquiátrico por conflicto de custodia y denuncias cruzadas de violencia psicológica.',
      anamnesis: 'Varón de 41 años, ejecutivo. Patrón persistente de grandiosidad, necesidad de admiración y falta de empatía. Dificultad para tolerar frustraciones menores con descompensación de ira.',
      sessionNotes: [
        'Sesión 1: Actitud desafiante hacia el evaluador. Minimiza acusaciones y descalifica a terceros.',
        'Sesión 2: Ensayos de provocación 360° en VR evidencian elevación simpática paroxística (GSR > 6.5 µS).'
      ],
      psychometricScores: {
        phq9: 4,
        gad7: 7,
        pclR: 26,
        npi: 32,
        cssrsLevel: 0,
        sadPersons: 1
      },
      functionalAreas: {
        sleep: 75,
        appetite: 90,
        energy: 85,
        social: 40,
        attention: 80
      },
      sentinelTelemetry: {
        pacId: 'PAC-2964',
        deviceSyncTime: 'En línea (Sincronizado)',
        sleepMetrics: { nightWakeups: 0, hoursInDarkness: 7.5, sleepEfficiencyPct: 92, avgSleepDurationHours: 7.0 },
        behavioralBiometrics: { typingLatencyMs: 95, screenActiveTimeMinutes: 380, biomotorLatencyMs: 90, activityRestlessnessIndex: 45 },
        safetyStatus: {
          riskLevel: 'MODERADO',
          activeContentionTriggered: false,
          passiveRiskRationale: 'Sin riesgo autolítico. Reactividad hostil ante confrontación.',
          emergencyContact: { name: 'Lic. Andrés Valdés', relationship: 'Abogado Defensor', phone: '+52 55 9876 5432' }
        }
      },
      substancesHistory: {
        alcohol: 'Consumo de fin de semana (3-4 copas)',
        tobacco: 'Negativo',
        cannabis: 'Negativo',
        stimulants: 'Modafinilo ocasional sin prescripción',
        medicationsCurrent: []
      },
      medicalHistory: ['Hipertensión arterial estadio 1']
    }
  },
  {
    name: 'Caso 4: Trauma del Desarrollo & C-PTSD (PAC-1082)',
    label: 'Caso 4: Trauma del Desarrollo & C-PTSD (PAC-1082)',
    description: 'Trauma relacional temprano, hipervigilancia extrema y desregulación autonómica bilateral.',
    record: {
      id: 'PAC-1082',
      patientNameAnonymized: 'Paciente ID: PAC-1082',
      age: 34,
      gender: 'F',
      consultationReason: 'Flashbacks disociativos, dolor somático generalizado y bloqueo vincular severo.',
      anamnesis: 'Mujer de 34 años con antecedentes de negligencia emocional y maltrato en la infancia. Presenta hipervigilancia sensorial, sobresaltos motores continuos y colapso de tono vagal (HRV < 22 ms).',
      sessionNotes: [
        'Sesión 1: Postura encogida, evitación visual constante. Refiere dolor miofascial difuso.',
        'Sesión 2: Protocolo de santuario inmersivo y estimulación bilateral muestra descenso progresivo de conductancia.'
      ],
      psychometricScores: {
        phq9: 18,
        gad7: 17,
        itq: 48,
        des2: 36,
        cssrsLevel: 2,
        sadPersons: 4
      },
      functionalAreas: {
        sleep: 30,
        appetite: 45,
        energy: 25,
        social: 20,
        attention: 40
      },
      sentinelTelemetry: {
        pacId: 'PAC-1082',
        deviceSyncTime: 'En línea (Sincronizado)',
        sleepMetrics: { nightWakeups: 4, hoursInDarkness: 8.5, sleepEfficiencyPct: 52, avgSleepDurationHours: 4.2 },
        behavioralBiometrics: { typingLatencyMs: 310, screenActiveTimeMinutes: 210, biomotorLatencyMs: 320, activityRestlessnessIndex: 78 },
        safetyStatus: {
          riskLevel: 'ELEVADO',
          activeContentionTriggered: true,
          passiveRiskRationale: 'Patrón de pesadillas recurrentes y fluctuaciones galvánicas fásicas continuas.',
          emergencyContact: { name: 'Elena Gómez', relationship: 'Madre Adoptiva', phone: '+52 55 5555 4321' }
        }
      },
      substancesHistory: {
        alcohol: 'Abstinencia absoluta',
        tobacco: 'Negativo',
        cannabis: 'Negativo',
        stimulants: 'Negativo',
        medicationsCurrent: ['Pregabalina 75 mg/noche', 'Escitalopram 15 mg/día']
      },
      medicalHistory: ['Fibromialgia', 'Colon irritable']
    }
  }
];

// ============================================================================
// CONFIGURACIÓN MAESTRA DE 10 ENTORNOS VR (52 TRASTORNOS CIE-11 / DSM-5-TR)
// ============================================================================
export const MASTER_VR_ENVIRONMENTS: MasterVrConfig = {
  version: "3.8.0-AMIE-CLINICAL",
  systemName: "AMIE VR 52-DISORDER MASTER CONFIGURATION",
  updatedAt: "2026-03-20T00:00:00Z",
  environmentsCount: 10,
  coveredDisordersCount: 52,
  defaultSamplingRateHz: 60,
  masterEnvironments: [
    {
      id: "ENV_01_CLASSROOM_OFFICE",
      name: "01. Aula / Oficina de Carga Atencional y CPT 3D",
      unitySceneName: "Scene_Classroom_CPT3D",
      supportedClinicalTasks: ["CPT_3D_GO_NO_GO", "N_BACK_MEMORY", "STROOP_3D_SPATIAL"],
      targetDisorders: [
        { code: "6A05.0", dsm5: "314.01", name: "TDAH Presentación Combinada" },
        { code: "6A05.1", dsm5: "314.00", name: "TDAH Presentación Inatenta" },
        { code: "6A05.2", dsm5: "314.01", name: "TDAH Presentación Hiperactiva/Impulsiva" },
        { code: "6D70", dsm5: "331.83", name: "Trastorno Neurocognitivo Leve (Deterioro Ejecutivo)" },
        { code: "6A03", dsm5: "315.00", name: "Trastorno del Aprendizaje Específico" }
      ],
      controllableParameters: {
        distractorDensity360: { type: "range", min: 0, max: 12, step: 1, default: 4, unit: "distractores" },
        ambientAuditoryNoiseDb: { type: "range", min: 20, max: 80, step: 5, default: 45, unit: "dB" },
        targetStimulusPaceMs: { type: "range", min: 800, max: 2500, step: 100, default: 1500, unit: "ms" }
      }
    },
    {
      id: "ENV_02_FORENSIC_COURTROOM",
      name: "02. Sala de Audiencia Forense & Evaluación Cluster B",
      unitySceneName: "Scene_Forensic_Courtroom",
      supportedClinicalTasks: ["OVERT_EGO_THREAT", "COVERT_REJECTION", "EMPATHY_DEFICIT_TEST"],
      targetDisorders: [
        { code: "6D10.0", dsm5: "301.81", name: "Trastorno Narcisista de la Personalidad (Overt/Covert)" },
        { code: "6D10.1", dsm5: "301.7", name: "Trastorno de la Personalidad Antisocial / Disocial" },
        { code: "6D11", dsm5: "301.83", name: "Trastorno Límite de la Personalidad (TLP)" },
        { code: "6D10.2", dsm5: "301.50", name: "Trastorno Histriónico de la Personalidad" },
        { code: "6D10.3", dsm5: "301.0", name: "Trastorno Paranoide de la Personalidad" }
      ],
      controllableParameters: {
        provocationIntensityLevel: { type: "range", min: 1, max: 5, step: 1, default: 2, unit: "nivel" },
        interrogatorGazeHostility: { type: "range", min: 0, max: 100, step: 10, default: 40, unit: "%" },
        juryHostilityPresence: { type: "toggle", default: true }
      }
    },
    {
      id: "ENV_03_AUDITORIUM_EXPOSURE",
      name: "03. Auditorio Social & Exposición VRET",
      unitySceneName: "Scene_Auditorium_VRET",
      supportedClinicalTasks: ["PUBLIC_SPEAKING_STRESS", "SOCIAL_EVALUATION_DESENSITIZATION"],
      targetDisorders: [
        { code: "6B04", dsm5: "300.23", name: "Trastorno de Ansiedad Social (Fobia Social)" },
        { code: "6B00", dsm5: "300.02", name: "Trastorno de Ansiedad Generalizada (TAG)" },
        { code: "6B01", dsm5: "300.01", name: "Trastorno de Pánico" },
        { code: "6B02", dsm5: "300.22", name: "Agorafobia Espacial" },
        { code: "6B06", dsm5: "309.21", name: "Trastorno de Ansiedad por Separación en Adultos" }
      ],
      controllableParameters: {
        audienceCapacityCount: { type: "range", min: 5, max: 300, step: 25, default: 60, unit: "avatares" },
        audienceReactionState: { type: "select", options: ["NEUTRAL", "ATTENTIVE", "BORED", "CRITICAL"], default: "NEUTRAL" },
        stageLightingLux: { type: "range", min: 100, max: 2000, step: 100, default: 800, unit: "lux" }
      }
    },
    {
      id: "ENV_04_ACROPHOBIA_HIGH_ROOF",
      name: "04. Azotea Panorámica en Rascacielos (Acrofobia VRET)",
      unitySceneName: "Scene_Acrophobia_Roof3D",
      supportedClinicalTasks: ["HEIGHT_HIERARCHICAL_EXPOSURE", "POSTURAL_SWAY_TRACKING"],
      targetDisorders: [
        { code: "6B03.0", dsm5: "300.29", name: "Fobia Específica: Alturas (Acrofobia)" },
        { code: "6B03.1", dsm5: "300.29", name: "Fobia Específica: Entorno Natural" },
        { code: "6B01.Z", dsm5: "300.01", name: "Ataques de Pánico con Sensación de Caída" },
        { code: "8A20", dsm5: "332.0", name: "Trastorno Postural & Marcha con Ansiedad de Caída" }
      ],
      controllableParameters: {
        virtualHeightMeters: { type: "range", min: 5, max: 250, step: 10, default: 50, unit: "metros" },
        railingTransparencyPct: { type: "range", min: 0, max: 100, step: 10, default: 30, unit: "%" },
        windGustAudioDb: { type: "range", min: 0, max: 70, step: 5, default: 35, unit: "dB" }
      }
    },
    {
      id: "ENV_05_AEROPHOBIA_FLIGHT",
      name: "05. Cabina de Vuelo Comercial Presurizada (Aerofobia)",
      unitySceneName: "Scene_Aerophobia_Cabin",
      supportedClinicalTasks: ["TAKEOFF_TURBULENCE_EXPOSURE", "CLAUSTROPHOBIA_CONFINEMENT"],
      targetDisorders: [
        { code: "6B03.2", dsm5: "300.29", name: "Fobia Específica: Volar en Avión (Aerofobia)" },
        { code: "6B03.3", dsm5: "300.29", name: "Fobia Específica: Espacios Confinados (Claustrofobia)" },
        { code: "6B02", dsm5: "300.22", name: "Agorafobia en Medios de Transporte" },
        { code: "6B43", dsm5: "308.3", name: "Reacción de Estrés Agudo por Turbulencia" }
      ],
      controllableParameters: {
        flightPhase: { type: "select", options: ["BOARDING", "TAXI", "TAKEOFF", "CRUISE", "TURBULENCE", "LANDING"], default: "CRUISE" },
        turbulenceIntensityG: { type: "range", min: 0.0, max: 2.5, step: 0.1, default: 0.3, unit: "G" },
        cabinLightingMode: { type: "select", options: ["DAYLIGHT", "SUNSET", "NIGHT_DIMMED"], default: "DAYLIGHT" }
      }
    },
    {
      id: "ENV_06_NEURO_HYPNOSIS_TRANCE",
      name: "06. Matriz de Inducción Neurohipnótica & Trance Theta",
      unitySceneName: "Scene_NeuroHypnosis_Loop",
      supportedClinicalTasks: ["THETA_ENTRAINMENT_01HZ", "AUTONOMIC_RESET", "INTEROCEPTIVE_REGULATION"],
      targetDisorders: [
        { code: "6C40", dsm5: "307.80", name: "Dolor Crónico con Componente Emocional Primario" },
        { code: "7A00", dsm5: "307.42", name: "Trastorno de Insomnio Crónico" },
        { code: "6B00.Z", dsm5: "300.02", name: "Ansiedad Somatizada con Tensión Muscular" },
        { code: "6C20", dsm5: "300.82", name: "Trastorno de Distrés Corporal (Somatomorfo)" },
        { code: "8A40", dsm5: "346.90", name: "Migraña Tensional con Hiperexcitabilidad Central" }
      ],
      controllableParameters: {
        binauralBeatFrequencyHz: { type: "range", min: 3.0, max: 7.5, step: 0.1, default: 5.5, unit: "Hz" },
        breathingPacerCadenceCpm: { type: "range", min: 4.5, max: 8.0, step: 0.25, default: 6.0, unit: "cpm" },
        orbLuminancePulsePct: { type: "range", min: 10, max: 100, step: 5, default: 65, unit: "%" }
      }
    },
    {
      id: "ENV_07_SANCTUARY_FOREST",
      name: "07. Santuario Natural Biofílico & Bosque de Calma",
      unitySceneName: "Scene_Sanctuary_Forest3D",
      supportedClinicalTasks: ["SAFE_PLACE_INSTALLATION", "ATTACHMENT_SCHEMA_REPAIR", "VAGAL_RESTORATION"],
      targetDisorders: [
        { code: "6B41", dsm5: "307.81", name: "Trastorno de Estrés Postraumático Complejo (TEPT-C)" },
        { code: "6A70", dsm5: "296.22", name: "Trastorno Depresivo Mayor (Episodio Único Moderado)" },
        { code: "6A71", dsm5: "296.32", name: "Trastorno Depresivo Mayor Recurrente" },
        { code: "6A72", dsm5: "300.4", name: "Trastorno Distímico (Distimia)" },
        { code: "6B42", dsm5: "309.89", name: "Trastorno de Duelo Prolongado" }
      ],
      controllableParameters: {
        sunlightCanopyFilterPct: { type: "range", min: 20, max: 90, step: 5, default: 60, unit: "%" },
        biophilicAudioNatureDb: { type: "range", min: 20, max: 65, step: 5, default: 40, unit: "dB" },
        companionAvatarPresence: { type: "toggle", default: false }
      }
    },
    {
      id: "ENV_08_DUAL_CONTROL_LAB",
      name: "08. Laboratorio de Control Dual Neurosexual (SES / SIS)",
      unitySceneName: "Scene_DualControl_CouplesLab",
      supportedClinicalTasks: ["SENSATE_FOCUS_3D", "COUPLES_BIOFEEDBACK_SYNCHRONY", "INHIBITORY_BRAKE_REDUCTION"],
      targetDisorders: [
        { code: "HA00", dsm5: "302.71", name: "Trastorno del Deseo Sexual Hipoactivo Femenino/Masculino" },
        { code: "HA01", dsm5: "302.72", name: "Trastorno de la Excitación / Disfunción Eréctil Psicógena" },
        { code: "HA02", dsm5: "302.73", name: "Trastorno Orgásmico por Inhibición Simpática" },
        { code: "HA03", dsm5: "302.76", name: "Trastorno por Dolor Genito-Pélvico / Penetración" },
        { code: "QE50", dsm5: "V61.10", name: "Disfunción Relacional de Pareja con Distrés Autonómico" }
      ],
      controllableParameters: {
        demandFreeLightingKelvin: { type: "range", min: 2200, max: 4000, step: 100, default: 2700, unit: "K" },
        dyadicHeartRateSyncFeedback: { type: "toggle", default: true },
        sensoryLoadFocusStage: { type: "range", min: 1, max: 3, step: 1, default: 1, unit: "fase" }
      }
    },
    {
      id: "ENV_09_SOMATIC_PAIN_OCEAN",
      name: "09. Abismo Marino Criogénico & Analgesia Nociceptiva",
      unitySceneName: "Scene_DeepOcean_Analgesia",
      supportedClinicalTasks: ["GATE_CONTROL_DISTRACTION", "DELTA_ANALGESIA_INDUCTION", "SOMATIC_DEFOCALIZATION"],
      targetDisorders: [
        { code: "MG30.0", dsm5: "307.89", name: "Dolor Crónico Generalizado / Fibromialgia" },
        { code: "MG30.1", dsm5: "338.4", name: "Dolor Crónico por Cáncer / Refractario" },
        { code: "8E43", dsm5: "354.4", name: "Síndrome de Dolor Regional Complejo (CRPS / SDRC)" },
        { code: "8A80", dsm5: "356.9", name: "Neuropatía Periférica Sensitiva con Alodinia" },
        { code: "ND54", dsm5: "353.6", name: "Dolor de Miembro Fantasma Post-Amputación" }
      ],
      controllableParameters: {
        deltaBinauralFrequencyHz: { type: "range", min: 1.0, max: 4.0, step: 0.1, default: 2.5, unit: "Hz" },
        fractalVisualComplexityPct: { type: "range", min: 10, max: 100, step: 5, default: 75, unit: "%" },
        cryogenicBlueShiftIntensity: { type: "range", min: 0, max: 100, step: 5, default: 80, unit: "%" }
      }
    },
    {
      id: "ENV_10_MEMORY_RECONSOLIDATION",
      name: "10. Cámara Óptica de Reconsolidación de Memoria & EMDR 3D",
      unitySceneName: "Scene_EMDR_MemoryRecon",
      supportedClinicalTasks: ["SACCADIC_BILATERAL_SWEEP", "MISMATCH_PREDICTION_ERROR", "ENGRAM_REENCODING"],
      targetDisorders: [
        { code: "6B40", dsm5: "309.81", name: "Trastorno de Estrés Postraumático (TEPT Agudo/Crónico)" },
        { code: "6B20", dsm5: "300.3", name: "Trastorno Obsesivo-Compulsivo (TOC)" },
        { code: "6B80", dsm5: "307.1", name: "Trastornos de la Conducta Alimentaria (Anorexia/Bulimia)" },
        { code: "6C21", dsm5: "300.7", name: "Trastorno de Ansiedad por Enfermedad (Hipocondría)" },
        { code: "6E60", dsm5: "300.19", name: "Trastorno Facticio / Simulación por Ganancia Afectiva" }
      ],
      controllableParameters: {
        emdrSweepSpeedHz: { type: "range", min: 0.5, max: 3.0, step: 0.1, default: 1.8, unit: "Hz" },
        sphereColorHex: { type: "select", options: ["#38bdf8", "#10b981", "#a855f7", "#f59e0b"], default: "#38bdf8" },
        memoryLabilityWindowSec: { type: "range", min: 60, max: 600, step: 30, default: 300, unit: "seg" }
      }
    }
  ]
};

export default {
  MORRISON_CLINICAL_PRINCIPLES,
  INITIAL_LICENSES,
  CLINICAL_CASE_PRESETS,
  MASTER_VR_ENVIRONMENTS
};
