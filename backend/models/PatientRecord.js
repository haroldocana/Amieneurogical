const mongoose = require('mongoose');

const PatientRecordSchema = new mongoose.Schema({
  metadata: {
    patientId: { type: String, required: true, index: true },
    sessionGuid: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now, index: true },
    facilityId: { type: String, default: 'AMIE-CLINIC-CENTRAL' },
    operatorId: { type: String, required: true, index: true }
  },
  demographicProfile: {
    age: { type: Number, default: 0 },
    biologicalSex: { type: String, enum: ['M', 'F', 'Other'], default: 'M' },
    genderIdentity: String,
    dailyDigitalExpositionHours: Number,
    primaryMediaPlatforms: [String],
    socialContagionRiskIndex: { type: Number, min: 0, max: 100, default: 0 }
  },
  hardwareTelemetricStack: {
    vrDevice: {
      model: { type: String, default: 'MetaQuest3S' },
      connectionType: { type: String, default: 'USB' },
      handTrackingActive: { type: Boolean, default: true },
      passthroughEnabled: { type: Boolean, default: false },
      fps: { type: Number, default: 72 }
    },
    biometricSensors: {
      gsrConnected: { type: Boolean, default: false },
      ppgHeartRateConnected: { type: Boolean, default: false },
      qEegConnected: { type: Boolean, default: false },
      eegFormat: { type: String, default: 'EDF' },
      eegChannels: { type: Number, default: 8 }
    }
  },
  debiasingEngineMetrics: {
    rawInputData: mongoose.Schema.Types.Mixed,
    biasFiltersApplied: {
      rosenthalEffectSubtracted: { type: Boolean, default: false },
      socialDesirabilityCorrection: { type: Number, default: 0 },
      genderMaskingAdjustment: { type: Number, default: 0 },
      mahalanobisDistanceScore: { type: Number, default: 0 },
      outlierDetected: { type: Boolean, default: false }
    },
    debiasedConfidenceIndexPercent: { type: Number, default: 85 }
  },
  diagnosticEngineOutput: {
    primaryDiagnostic: {
      icd11Code: String,
      dsm5Code: String,
      title: String,
      probabilityPercent: Number,
      severityLevel: String
    },
    secondaryComorbidities: [mongoose.Schema.Types.Mixed]
  },
  vrTherapyIntervention: {
    protocolId: String,
    protocolName: String,
    targetCondition: String,
    currentProgressionLevel: String,
    sessionParameters: mongoose.Schema.Types.Mixed,
    realtimeTelemetrySummary: {
      baselineGSR_uS: Number,
      peakGSR_uS: Number,
      postExposureGSR_uS: Number,
      lfHfRatio: Number,
      habituationIndexH: Number,
      sudsInitial: Number,
      sudsFinal: Number
    }
  },
  longitudinalProgressiveLevels: mongoose.Schema.Types.Mixed,
  federatedResearchContribution: {
    anonymizedDataExportReady: { type: Boolean, default: true },
    globalCohortContributionId: String,
    p_ValueContribution: Number,
    calculatedHedgesG: Number
  }
}, { timestamps: true });

// Índice compuesto para acelerar búsquedas por colegiado/médico y paciente
PatientRecordSchema.index({ 'metadata.operatorId': 1, 'metadata.patientId': 1 });

module.exports = mongoose.model('PatientRecord', PatientRecordSchema);
