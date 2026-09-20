// ============================================================================
// AMIE / AIMA CLINICAL ENGINE - SYSTEM TYPE DEFINITIONS (COMPATIBLE 100%)
// ============================================================================

// --- BIOMETRÍA ACÚSTICA Y VOZ ---
export interface AcousticVoiceBiometrics {
  speechRateWpm: number; // Palabras por minuto (normal 120-160)
  bradylaliaIndex: number; // 0-100 (alto = inhibición psicomotora/inhibición severa)
  affectiveFlatteningScore: number; // 0-100 (alto = aplanamiento afectivo / monotonía)
  responseLatencyMs: number; // Latencia de respuesta en ms
  prosodyVariabilityPct: number; // Variabilidad de tono
  acousticStressMarker: 'Normal' | 'Labilidad Emocional' | 'Aplanamiento Afectivo' | 'Presión del Habla (Taquilalia)' | 'Inhibición Severa';
}

export interface SessionAudioRecording {
  id: string;
  sessionNumber: number;
  date: string;
  durationSeconds: number;
  audioTitle: string;
  transcriptText: string;
  acousticBiometrics: AcousticVoiceBiometrics;
  audioWaveformData?: number[];
}

// --- MONITOREO PASIVO / SENSITIVO CENTINELA (APK / SENSOR MÓVIL) ---
export interface SentinelSleepMetrics {
  nightWakeups: number; // >3 indica riesgo de descompensación
  hoursInDarkness: number;
  sleepEfficiencyPct: number;
  avgSleepDurationHours: number;
}

export interface SentinelBehavioralBiometrics {
  typingLatencyMs: number;
  screenActiveTimeMinutes: number;
  biomotorLatencyMs: number; // Latencia de toque/movimiento
  activityRestlessnessIndex: number; // 0-100 (agitación motora)
}

export interface SentinelSafetyStatus {
  riskLevel: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRÍTICO';
  activeContentionTriggered: boolean;
  passiveRiskRationale: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface PatientSentinelData {
  pacId: string;
  deviceSyncTime: string;
  sleepMetrics: SentinelSleepMetrics;
  behavioralBiometrics: SentinelBehavioralBiometrics;
  safetyStatus: SentinelSafetyStatus;
  nightWakeups?: number;
  biomotorLatencyMs?: number;
  screenOnNightTimeMinutes?: number;
  avgSleepDurationHours?: number;
  sleepEfficiencyPct?: number;
  activityRestlessnessIndex?: number;
  crisisDistressTriggered?: boolean;
  passiveRiskScore?: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRÍTICO';
  passiveRiskRationale?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

// --- BIOMARCADORES CEREBRALES (qEEG / EEGLAB) ---
export interface QeegBandPowers {
  delta: number;
  theta: number;
  alfa: number;
  beta: number;
  highBeta: number;
  gamma?: number;
}

export interface QeegRegionZScores {
  region: 'Frontal' | 'Parietal' | 'Temporal' | 'Occipital';
  deltaZ: number;
  thetaZ: number;
  alfaZ: number;
  betaZ: number;
  highBetaZ: number;
  gammaZ?: number;
  coherenceZ?: number;
  interpretation?: string;
}

export interface QeegBiomarkers {
  recordingDate?: string;
  channelsCount?: number;
  samplingRateHz?: number;
  bandPowers: QeegBandPowers;
  regionalZScores: {
    frontal: QeegRegionZScores;
    parietal: QeegRegionZScores;
    temporal: QeegRegionZScores;
    occipital: QeegRegionZScores;
  };
  heatmapBase64?: string;
  thetaBetaRatio?: number;
  alphaPeakFrequencyHz?: number;
}

// --- TELEMETRÍA MULTISENSORIAL FISIOLÓGICA (GSR, HRV, GRIP) ---
export interface MultisensoryHardwareTelemetry {
  vagalToneHrvIndex: number; // 0-100 (RMSSD alto = tono parasimpático sano)
  handGripPressureKg: number; // Presión de agarre isométrica
  camouflagingIndexPct: number; // Escala CAT-Q de enmascaramiento TEA
  ocularFixationDurationMs: number; // Estabilidad de mirada
  touchTapLatencyCompensatedMs: number;
  microExpressionState: 'Incongruencia Afectiva' | 'Micro-tensión Frontal' | 'Hipervigilancia Ocular' | 'Aplanamiento Motor' | 'Normorreactivo';
}

// --- HARDWARE VR PICO NEO 3 PRO & BIOMETRÍA INMERSIVA Y OCULAR ---
export type SupportedVrDevice = 'PICO_NEO_3_PRO' | 'PICO_NEO_3_PRO_EYE' | 'META_QUEST_3' | 'META_QUEST_3S' | 'SIMULATION';

export interface ControllerTelemetry {
  hand: 'left' | 'right';
  triggerPressure: number; // 0.0 a 1.0 (medida de impulsividad)
  gripPressure: number;    // 0.0 a 1.0 (medida de tensión)
  joystickVector: { x: number; y: number };
  accelerometer: { x: number; y: number; z: number }; // Temblor motor / Agitación
  hapticFeedbackActive: boolean;
}

export interface HeadMotion6DoF {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  headJitterIndex: number; // Indice de micro-movimiento/agitación (TDAH/Ansiedad)
}

export interface EyeTrackingPupilometry {
  pupilDiameterMm: number;    // Diámetro pupilar (Carga cognitiva/estrés)
  saccadicRateHz: number;      // Tasa de movimientos sacádicos
  fixationDurationMs: number;  // Tiempo de fijación visual
  gazeVector: { x: number; y: number; z: number };
  blinkFrequencyPerMin: number;
  source: 'PICO_EYE_TOBII' | 'DIY_OV9281_PUPILCORE' | 'MEDIA_PIPE' | 'SIMULATED';
}

export interface VrTelemetryData {
  sessionId: string;
  timestamp: string | number;
  deviceId?: SupportedVrDevice;
  
  // Series Temporales Biométricas (Polar H10 + GSR)
  gsrMicroSiemens: number[]; // Serie temporal de conductancia cutánea
  hrvRmssdMs: number[];      // Serie temporal de variabilidad cardíaca
  heartRateBpm?: number;     // Frecuencia cardíaca instantánea
  
  // Análisis Matemático de Respuesta VR
  habituationIndexH: number; // Métrica de habituación
  stressPeaksCount: number;  // Picos simpáticos
  exposureDurationSec: number;
  
  // Telemetría Pico Neo 3 Pro
  headMotion6DoF?: HeadMotion6DoF;
  controllers?: {
    left: ControllerTelemetry;
    right: ControllerTelemetry;
  };
  
  // Biometría Ocular & Pupilometría
  pupilDiameterMm?: number;
  saccadicRateHz?: number;
  eyeTracking?: EyeTrackingPupilometry;
}

export interface VrTherapyReport {
  sessionGuid: string;
  exposureType: string;
  sympatheticToneIndex: number; // 0 - 100
  vagalReactivityIndex: number;  // 0 - 100
  habituationRate: 'Óptima' | 'Moderada' | 'Ausente/Saturada';
  synthesizedClinicalSummary: string; // Resumen ejecutivo para el dictamen
}

// --- PERFIL DE PSICOFARMACOLOGÍA ---
export interface CurrentPsychopharmacologyItem {
  drugName: string;
  dosage: string;
  durationMonths: number;
  adherenceStatus: 'Adherente' | 'Irregular' | 'Abandono Reciente' | 'Suspendido por Efecto Adverso';
}

export interface PharmacologicalEffectivenessEvaluation {
  drugClass: string;
  moleculeName: string;
  dosageAssessed: string;
  estimatedEffectivenessPct: number; // 0-100%
  expectedResponse: 'Alta Respuesta Terapéutica' | 'Respuesta Parcial / Dosis Subóptima' | 'Riesgo de Viraje a Manía / Hipersensibilidad' | 'Baja Efectividad / Resistencia Farmacodinámica';
  biomarkerRationale: string;
  adverseEffectRisks: string[];
  recommendedDoseAdjustment?: string;
}

export interface TherapeuticAffinityScore {
  disorderName: string;
  affinityPct: number; // 0-100%
  status: 'Alta Concordancia' | 'Concordancia Moderada' | 'Descarte Sugerido';
  recommendedTherapy: 'DBT' | 'TCC' | 'MBT' | 'EMDR' | 'Remediación Cognitiva' | 'Integración Sensorial';
  psychopharmacologyScheme: string;
  biomarkerRationale: string;
}

// --- EXPEDIENTE COMPLETO DEL PACIENTE ---
export interface PatientRecord {
  id: string; // PAC-XXXX
  patientNameAnonymized: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  consultationReason: string;
  anamnesis: string;
  sessionNotes: string[];
  audioRecordings?: SessionAudioRecording[];
  sentinelTelemetry?: PatientSentinelData;
  qeegBiomarkers?: QeegBiomarkers;
  multisensoryHardware?: MultisensoryHardwareTelemetry;
  vrTelemetryData?: VrTelemetryData;       // Telemetría Pico Neo 3 Pro + Polar H10
  vrTherapyReport?: VrTherapyReport;       // Informe sintetizado VR
  psychopharmacologyCurrent?: CurrentPsychopharmacologyItem[];
  psychometricScores: {
    phq9?: number;
    gad7?: number;
    bdi2?: number;
    bai?: number;
    mmse?: number;
    asrs?: number;
    aq10?: number;
    catq?: number;
    cssrsLevel?: number; // 0-5
    sadPersons?: number; // 0-10
    whodas2?: number; // 1-5
    gafEstimated?: number; // 1-100
  };
  functionalAreas: {
    sleep: number;
    appetite: number;
    energy: number;
    social: number;
    attention: number;
  };
  neuromotorBiomarkers?: {
    reactionTimeMs: number;
    omissionErrors: number;
    commissionErrors: number;
    motorStabilityScore: number;
  };
  qeegZScores?: {
    frontalThetaBetaRatio: number;
    temporalAsymmetry: number;
    alphaPeakFrequencyHz: number;
    deltaSlowActivityZ: number;
  };
  substancesHistory: {
    alcohol: string;
    tobacco: string;
    cannabis: string;
    stimulants: string;
    medicationsCurrent: string[];
  };
  medicalHistory: string[];
}

// --- MATRIZ DIFERENCIAL Y SESGOS ---
export type ClinicalDisorderKey = 
  | 'TDAH' 
  | 'TAG' 
  | 'TDM' 
  | 'TEA' 
  | 'TLP' 
  | 'TOC' 
  | 'DETERIORO_PRODROMO';

export interface DifferentialDisorderComparison {
  disorderKey: ClinicalDisorderKey;
  disorderName: string;
  codeCIE10: string;
  status: 'Confirmado Principal' | 'Descartado' | 'Posible / A Investigar' | 'Comórbido';
  certaintyPct: number;
  qeegProfile: {
    thetaBetaRatioEvaluation: string;
    highBetaEvaluation: string;
    alphaAsymmetryEvaluation: string;
    coherenceEvaluation: string;
  };
  psychometricsProfile: {
    scaleMatched: string;
    scoreSummary: string;
  };
  apkPassiveMarker: string;
  acousticBiomarkerCorrelation: string;
  biasDiscardRationale: string;
  morrisonPrincipleApplied: string;
}

// --- DICTAMEN INTEGRAL DEL MOTOR CLINICO AMIE ---
export interface DiagnosticImpressionItem {
  code: string;
  title: string;
  confidencePct: number;
  rationale: string;
}

export interface AmieClinicalAnalysis {
  principalDiagnosis: {
    codeCIE10: string;
    codeCIE9?: string;
    disorderName: string;
    certaintyPct: number;
    specifiers: string[];
    gafEstimated: number;
    justificationDsm5: string;
  };

  // Propiedades opcionales para compatibilidad fluida con PDF, FHIR y UI
  diagnosticImpressions?: DiagnosticImpressionItem[];
  treatmentRecommendations?: string[];
  biasMitigationNotes?: string[];

  differentialMatrix: DifferentialDisorderComparison[];
  differentialDiagnoses: Array<{
    candidate: string;
    codeCIE10: string;
    status: 'Descartado' | 'Posible / A investigar' | 'Comórbido';
    rationale: string;
    safetyRuleApplied: string;
  }>;
  bioclinicalTriangulation: {
    psychometricsSummary: string;
    functionalAreasAssessment: string;
    neuromotorInterpretation?: string;
    acousticBiometricAssessment: string;
    qeegInterpretation?: string;
    vrHabituationAssessment?: string; // Evaluación triangulada Pico Neo 3 + Polar H10
    pupilometryAssessment?: string;  // Evaluación de sesgos atencionales por pupilometría
    
    // Campos extendidos para exportación de biomarcadores
    autonomicTone?: string;
    habituationRate?: string;
    cognitiveLoad?: string;

    regionalLobeBreakdown: {
      frontal: string;
      temporal: string;
      parietal: string;
      occipital: string;
    };
    convergenceScore: number;
  };
  pharmacologicalEffectiveness: PharmacologicalEffectivenessEvaluation[];
  therapeuticAffinityScores?: TherapeuticAffinityScore[];
  riskAlerts: {
    suicideRiskLevel: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRÍTICO';
    psychosisRisk: 'AUSENTE' | 'LEVE / ATENUADO' | 'PROMISORIO' | 'ACTIVO FRANCO';
    cognitiveDeteriorationRisk: 'NORMAL' | 'LEVE (DCL)' | 'MODERADO' | 'SEVERO';
    apkPassiveState: string;
    criticalAlertsList: string[];
    containmentProtocolSuggested?: string;
  };
  recommendedActionPlan: {
    neurofeedbackProtocol: string[];
    psychotherapyStrategy: string[]; // TCC / DBT / EMDR
    pharmacologySuggestions: string[];
    psychiatryReferralUrgent: boolean;
    monitoringDirectives: string[];
    urgentActions: string[];
  };
  rawModelChainOfThought?: string;
}

// --- LICENCIAMIENTO SAAS & INSTITUCIONAL ---
export interface MedicalLicenseAccount {
  id: string;
  doctorName: string;
  colegiadoNumber: number;
  username: string;
  hospitalClinic: string;
  specialty: string;
  tier: 'Institucional' | 'Clínica Privada' | 'Investigación';
  storageBucketUri: string;
  createdAt: string;
  expiresAt: string;
  status: 'Activa' | 'Suspendida' | 'En Validación';
}

export interface TopographicLobeScore {
  lobe: 'Frontal' | 'Parietal' | 'Temporal' | 'Occipital';
  deltaZ: number;
  thetaZ: number;
  alphaZ: number;
  betaZ: number;
  highBetaZ?: number;
  gammaZ: number;
  coherenceIndex: number;
  interpretation: string;
}

// --- AMIE CLINICAL ACADEMY & SIMULADOR IA ---
export type LifeCycleStage = 'INFANCIA' | 'ADOLESCENCIA' | 'ADULTEZ' | 'ADULTEZ_MAYOR';
export type AvatarEmotionState = 'Neutral' | 'Defensivo' | 'Ansioso' | 'Afligido' | 'Aliviado';
export type PsychotherapyFramework = 'TCC' | 'DBT' | 'ACT' | 'EMDR' | 'SISTEMICA' | 'PSICODINAMICA_BREVE';
export type PharmacologyClass = 'ISRS' | 'ISRN' | 'ANTIPSICOTICOS_ATIPICOS' | 'ESTABILIZADORES_ANIMO' | 'ESTIMULANTES';

export interface SimulatedCase {
  id: string;
  caseCode: string; // PAC-SIM-XX
  title: string;
  patientName: string;
  age: number;
  gender: 'M' | 'F';
  stage: LifeCycleStage;
  avatarUrl: string;
  initialEmotion: AvatarEmotionState;
  consultationReason: string;
  clinicalBackstory: string;
  normativeDevelopmentVsPathologyClues: string;
  psychometricsBase: {
    bdi2?: number;
    bai?: number;
    asrs?: number;
    aq10?: number;
    catq?: number;
    sadPersons?: number;
    mmse?: number;
  };
  qeegSummary: string;
  goldStandardDiagnosis: string;
  goldStandardCIE10: string;
  goldStandardFramework: PsychotherapyFramework;
  goldStandardPharmacology: string;
  simulatedPersonaPrompt: string;
}

export interface AcademyScoringResult {
  totalScore: number; // 0-100
  axisRapportAnamnesis: number; // 0-25
  axisDiagnosticAcuity: number; // 0-25
  axisEvidenceSelection: number; // 0-25
  axisTechnicalAdherence: number; // 0-25
  pedagogicalFeedback: string;
  morrisonSupervisorNote: string;
  competencyLevel: 'Experto Clínico' | 'Avanzado' | 'Competente' | 'En Desarrollo';
}
