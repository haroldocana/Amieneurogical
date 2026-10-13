const mongoose = require('mongoose');
const crypto = require('crypto');

const PatientRecordSchema = new mongoose.Schema({
  // 🟢 1. CAMPOS DE PRIMER NIVEL (Sincronización directa con React / App.tsx)
  id: { type: String, index: true },
  patientId: { type: String, index: true },
  age: { type: Number, default: 55 },
  gender: { type: String, default: 'M' },
  diagnosticCode: { type: String, default: 'F32.9' },

  // Ejes clínicos evaluados en la Chromebook
  functionalAreas: {
    sleep: { type: Number, default: 50 },
    appetite: { type: Number, default: 50 },
    energy: { type: Number, default: 50 },
    social: { type: Number, default: 50 },
    attention: { type: Number, default: 50 }
  },

  neuromotorBiomarkers: {
    reactionTimeMs: { type: Number, default: 240 },
    omissionErrors: { type: Number, default: 0 },
    commissionErrors: { type: Number, default: 0 },
    motorStabilityScore: { type: Number, default: 85 }
  },

  audioRecordings: { type: [mongoose.Schema.Types.Mixed], default: [] },
  psychometricScores: { type: mongoose.Schema.Types.Mixed, default: {} },

  qeegZScores: {
    frontalThetaBetaRatio: { type: Number, default: 1.8 },
    temporalAsymmetry: { type: Number, default: 0.2 },
    deltaSlowActivityZ: { type: Number, default: 0.4 },
    alphaPeakFrequencyHz: { type: Number, default: 10.2 }
  },

  qeegBiomarkers: { type: mongoose.Schema.Types.Mixed, default: null },
  vrTelemetryData: { type: mongoose.Schema.Types.Mixed, default: null },
  vrTherapyReport: { type: mongoose.Schema.Types.Mixed, default: null },

  // 🟢 2. METADATOS Y SESIÓN (Con generador UUID seguro)
  metadata: {
    patientId: { type: String, required: true, index: true, default: 'PAC-8104' },
    sessionGuid: { 
      type: String, 
      unique: true, 
      sparse: true, 
      default: () => `SESS-${crypto.randomUUID()}` 
    },
    timestamp: { type: Date, default: Date.now, index: true },
    facilityId: { type: String, default: 'AMIE-CLINIC-CENTRAL' },
    operatorId: { type: String, default: 'harold01', index: true }
  },

  // 🟢 3. PERFIL DEMOGRÁFICO
  demographicProfile: {
    age: { type: Number, default: 55 },
    biologicalSex: { type: String, enum: ['M', 'F', 'Other'], default: 'M' },
    genderIdentity: { type: String, default: 'M' },
    dailyDigitalExpositionHours: { type: Number, default: 0 },
    primaryMediaPlatforms: [String],
    socialContagionRiskIndex: { type: Number, min: 0, max: 100, default: 0 }
  },

  // 🟢 4. HARDWARE TELEMÉTRICO (Soporte nativo Pico 3, Quest y WebXR)
  hardwareTelemetricStack: {
    vrDevice: {
      model: { 
        type: String, 
        default: 'Pico3',
        enum: ['Pico3', 'PicoNeo3', 'MetaQuest3S', 'MetaQuestPro', 'WebXR_Generic', 'Simulated'] 
      },
      connectionType: { type: String, default: 'WebSocket_Secure' },
      handTrackingActive: { type: Boolean, default: true },
      passthroughEnabled: { type: Boolean, default: false },
      fps: { type: Number, default: 72 }
    },
    biometricSensors: {
      gsrConnected: { type: Boolean, default: true },
      ppgHeartRateConnected: { type: Boolean, default: true },
      qEegConnected: { type: Boolean, default: false },
      eegFormat: { type: String, default: 'EDF' },
      eegChannels: { type: Number, default: 8 }
    }
  },

  // 🟢 5. MOTOR ANTISESGOS (Mahalanobis D²)
  debiasingEngineMetrics: {
    rawInputData: mongoose.Schema.Types.Mixed,
    biasFiltersApplied: {
      rosenthalEffectSubtracted: { type: Boolean, default: false },
      socialDesirabilityCorrection: { type: Number, default: 0 },
      genderMaskingAdjustment: { type: Number, default: 0 },
      mahalanobisDistanceScore: { type: Number, default: 1.84 },
      outlierDetected: { type: Boolean, default: false }
    },
    debiasedConfidenceIndexPercent: { type: Number, default: 85 }
  },

  // 🟢 6. DICTAMEN DEL MOTOR DIAGNÓSTICO (DSM-5-TR / CIE-11)
  diagnosticEngineOutput: {
    primaryDiagnostic: {
      icd11Code: { type: String, default: '6A02' },
      dsm5Code: { type: String, default: 'F32.9' },
      title: { type: String, default: 'Sin Diagnóstico Especificado' },
      probabilityPercent: { type: Number, default: 85.0 },
      severityLevel: { type: String, default: 'Moderado' },
      justification: { type: String, default: '' }
    },
    secondaryComorbidities: [mongoose.Schema.Types.Mixed],
    riskAlerts: [mongoose.Schema.Types.Mixed],
    therapeuticRecommendations: [String]
  },

  // 🟢 7. INTERVENCIÓN Y BIOFEEDBACK VR (HRV, GSR, Habituación H)
  vrTherapyIntervention: {
    protocolId: { type: String, default: 'OVERT_EGO_THREAT' },
    protocolName: { type: String, default: 'Protocolo de Provocación Inmersiva' },
    targetCondition: { type: String, default: 'Cluster B' },
    currentProgressionLevel: { type: String, default: 'Nivel 1' },
    sessionParameters: mongoose.Schema.Types.Mixed,
    realtimeTelemetrySummary: {
      baselineGSR_uS: { type: Number, default: 2.1 },
      peakGSR_uS: { type: Number, default: 6.8 },
      postExposureGSR_uS: { type: Number, default: 3.4 },
      lfHfRatio: { type: Number, default: 1.2 },
      habituationIndexH: { type: Number, default: 2.84 },
      sudsInitial: { type: Number, default: 40 },
      sudsFinal: { type: Number, default: 25 }
    }
  },

  longitudinalProgressiveLevels: mongoose.Schema.Types.Mixed,

  federatedResearchContribution: {
    anonymizedDataExportReady: { type: Boolean, default: true },
    globalCohortContributionId: String,
    p_ValueContribution: { type: Number, default: 0.05 },
    calculatedHedgesG: { type: Number, default: 0.0 }
  }
}, { 
  timestamps: true,
  strict: false, // 👈 Evita descartar campos dinámicos de nuevos módulos VR
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Sincronización automática de IDs antes de validar
PatientRecordSchema.pre('validate', function(next) {
  if (!this.id && this.metadata && this.metadata.patientId) {
    this.id = this.metadata.patientId;
  }
  if (!this.patientId && this.id) {
    this.patientId = this.id;
  }
  if (!this.metadata) {
    this.metadata = {
      patientId: this.id || 'PAC-8104',
      sessionGuid: `SESS-${crypto.randomUUID()}`,
      timestamp: new Date(),
      facilityId: 'AMIE-CLINIC-CENTRAL',
      operatorId: 'harold01'
    };
  } else if (!this.metadata.patientId && this.id) {
    this.metadata.patientId = this.id;
  }
  next();
});

// Índices para consultas de alta velocidad
PatientRecordSchema.index({ 'metadata.operatorId': 1, 'metadata.patientId': 1 });
PatientRecordSchema.index({ id: 1, createdAt: -1 });

// 🟢 Prevención de OverwriteModelError en Node / Render
const PatientRecord = mongoose.models.PatientRecord || mongoose.model('PatientRecord', PatientRecordSchema);

module.exports = PatientRecord;
