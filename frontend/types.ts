export interface AcousticVoiceBiometrics {
  speechRateWpm: number; // Words per minute (normal 120-160)
  bradylaliaIndex: number; // 0-100 (high = severe motor/speech retardation)
  affectiveFlatteningScore: number; // 0-100 (high = monotone/flat affect)
  responseLatencyMs: number; // Average pause before answering in ms
  prosodyVariabilityPct: number; // Pitch variation (low = depressed/schizophrenic flat prosody)
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

export interface SentinelSleepMetrics {
  nightWakeups: number; // e.g. >3 indicates high risk
  hoursInDarkness: number;
  sleepEfficiencyPct: number;
  avgSleepDurationHours: number;
}

export interface SentinelBehavioralBiometrics {
  typingLatencyMs: number;
  screenActiveTimeMinutes: number;
  biomotorLatencyMs: number; // screen-tap / movement interaction latency
  activityRestlessnessIndex: number; // 0-100
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
  pacId: string; // e.g. "PAC-4092"
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

export interface MultisensoryHardwareTelemetry {
  vagalToneHrvIndex: number; // 0-100 (RMSSD high = strong vagal parasympathetic tone)
  handGripPressureKg: number; // Manual isometric sensor
  camouflagingIndexPct: number; // CAT-Q masking for ASD (0-100%)
  ocularFixationDurationMs: number; // Saccades / gaze stability
  touchTapLatencyCompensatedMs: number; // Calibrated using event.timeStamp
  microExpressionState: 'Incongruencia Afectiva' | 'Micro-tensión Frontal' | 'Hipervigilancia Ocular' | 'Aplanamiento Motor' | 'Normorreactivo';
}

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

// --- MÓDULO VR QUEST 3S & TELEMETRÍA BIOMÉTRICA INMERSIVA ---
export interface VrTelemetryData {
  sessionId: string;
  timestamp: string;
  gsrMicroSiemens: number[]; // Serie temporal de conductancia cutánea (GSR)
  hrvRmssdMs: number[];      // Serie temporal de variabilidad cardíaca (RMSSD)
  habituationIndexH: number; // Métrica matemática de habituación
  stressPeaksCount: number;  // Picos simpáticos detectados
  exposureDurationSec: number;
  saccadicRateHz?: number;   // Frecuencia sacádica ocular en VR
}

export interface VrTherapyReport {
  sessionGuid: string;
  exposureType: string;
  sympatheticToneIndex: number; // 0 - 100
  vagalReactivityIndex: number;  // 0 - 100
  habituationRate: 'Óptima' | 'Moderada' | 'Ausente/Saturada';
  synthesizedClinicalSummary: string; // Informe sintetizado de la prueba individual VR
}

export interface PatientRecord {
  id: string; // PAC-XXXX format
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
  vrTelemetryData?: VrTelemetryData;     // Telemetría inmersiva para la triangulación
  vrTherapyReport?: VrTherapyReport;     // Informe sintético de la prueba VR
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
    vrHabituationAssessment?: string; // Evaluación triangulada de la biometría VR
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

// AMIE ACADEMY & SIMULATOR
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
