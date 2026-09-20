// ============================================================================
// AMIE / AIMA CLINICAL ENGINE - SYSTEM TYPE DEFINITIONS (COMPATIBLE 100%)
// ============================================================================

// --- BIOMETRÍA ACÚSTICA Y VOZ ---
export interface AcousticVoiceBiometrics {
  speechRateWpm: number;
  bradylaliaIndex: number;
  affectiveFlatteningScore: number;
  responseLatencyMs: number;
  prosodyVariabilityPct: number;
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

// --- MONITOREO PASIVO / SENSITIVO CENTINELA ---
export interface SentinelSleepMetrics {
  nightWakeups: number;
  hoursInDarkness: number;
  sleepEfficiencyPct: number;
  avgSleepDurationHours: number;
}

export interface SentinelBehavioralBiometrics {
  typingLatencyMs: number;
  screenActiveTimeMinutes: number;
  biomotorLatencyMs: number;
  activityRestlessnessIndex: number;
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

// --- BIOMARCADORES CEREBRALES (qEEG) ---
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

// --- TELEMETRÍA MULTISENSORIAL FISIOLÓGICA ---
export interface MultisensoryHardwareTelemetry {
  vagalToneHrvIndex: number;
  handGripPressureKg: number;
  camouflagingIndexPct: number;
  ocularFixationDurationMs: number;
  touchTapLatencyCompensatedMs: number;
  microExpressionState: 'Incongruencia Afectiva' | 'Micro-tensión Frontal' | 'Hipervigilancia Ocular' | 'Aplanamiento Motor' | 'Normorreactivo';
}

// --- HARDWARE VR & BIOMETRÍA INMERSIVA ---
export type SupportedVrDevice = 'PICO_NEO_3_PRO' | 'PICO_NEO_3_PRO_EYE' | 'META_QUEST_3' | 'META_QUEST_3S' | 'SIMULATION';

export interface ControllerTelemetry {
  hand: 'left' | 'right';
  triggerPressure: number;
  gripPressure: number;
  joystickVector: { x: number; y: number };
  accelerometer: { x: number; y: number; z: number };
  hapticFeedbackActive: boolean;
}

export interface HeadMotion6DoF {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  headJitterIndex: number;
}

export interface EyeTrackingPupilometry {
  pupilDiameterMm: number;
  saccadicRateHz: number;
  fixationDurationMs: number;
  gazeVector: { x: number; y: number; z: number };
  blinkFrequencyPerMin: number;
  source: 'PICO_EYE_TOBII' | 'DIY_OV9281_PUPILCORE' | 'MEDIA_PIPE' | 'SIMULATED';
}

export interface VrTelemetryData {
  sessionId: string;
  timestamp: string | number;
  deviceId?: SupportedVrDevice;
  gsrMicroSiemens: number[];
  hrvRmssdMs: number[];
  heartRateBpm?: number;
  habituationIndexH: number;
  stressPeaksCount: number;
  exposureDurationSec: number;
  headMotion6DoF?: HeadMotion6DoF;
  controllers?: {
    left: ControllerTelemetry;
    right: ControllerTelemetry;
  };
  pupilDiameterMm?: number;
  saccadicRateHz?: number;
  eyeTracking?: EyeTrackingPupilometry;
}

export interface VrTherapyReport {
  sessionGuid: string;
  exposureType: string;
  sympatheticToneIndex: number;
  vagalReactivityIndex: number;
  habituationRate: 'Óptima' | 'Moderada' | 'Ausente/Saturada';
  synthesizedClinicalSummary: string;
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
  estimatedEffectivenessPct: number;
  expectedResponse: 'Alta Respuesta Terapéutica' | 'Respuesta Parcial / Dosis Subóptima' | 'Riesgo de Viraje a Manía / Hipersensibilidad' | 'Baja Efectividad / Resistencia Farmacodinámica';
  biomarkerRationale: string;
  adverseEffectRisks: string[];
  recommendedDoseAdjustment?: string;
}

export interface TherapeuticAffinityScore {
  disorderName: string;
  affinityPct: number;
  status: 'Alta Concordancia' | 'Concordancia Moderada' | 'Descarte Sugerido';
  recommendedTherapy: 'DBT' | 'TCC' | 'MBT' | 'EMDR' | 'Remediación Cognitiva' | 'Integración Sensorial';
  psychopharmacologyScheme: string;
  biomarkerRationale: string;
}

// --- EXPEDIENTE COMPLETO DEL PACIENTE ---
export interface PatientRecord {
  id: string;
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
  vrTelemetryData?: VrTelemetryData;
  vrTherapyReport?: VrTherapyReport;
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
    cssrsLevel?: number;
    sadPersons?: number;
    whodas2?: number;
    gafEstimated?: number;
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
  immersionMetrics?: {
    vrScenario?: string;
    vrTolerance?: number;
    hypnoticSusceptibility?: number;
    tranceDepth?: string;
  };
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
    vrHabituationAssessment?: string;
    pupilometryAssessment?: string;
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
    psychotherapyStrategy: string[];
    pharmacologySuggestions: string[];
    psychiatryReferralUrgent: boolean;
    monitoringDirectives: string[];
    urgentActions: string[];
  };
  rawModelChainOfThought?: string;
}

// --- LICENCIAMIENTO SAAS & MULTI-TENANT ---
export interface DoctorUser {
  id?: string;
  username: string;
  doctorName: string;
  colegiadoNumber: number;
  email?: string;
  accountType?: 'INDIVIDUAL' | 'CORPORATE_MEMBER' | 'SUPER_ADMIN';
  organizationName?: string;
  authMethod?: 'LOCAL_PASSWORD' | 'MICROSOFT_SSO' | 'GOOGLE_SSO' | 'LDAP';
  licenseKey?: string;
  aiCredits: number;
  aiCreditsLimit: number;
  expiresAt?: string;
}
