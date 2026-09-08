const mongoose = require('mongoose');

const PatientRecordSchema = new mongoose.Schema({
  metadata: {
    patientId: { type: String, required: true, index: true },
    sessionGuid: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    facilityId: String,
    operatorId: String
  },
  demographicProfile: {
    age: Number,
    biologicalSex: String,
    genderIdentity: String,
    dailyDigitalExpositionHours: Number,
    primaryMediaPlatforms: [String],
    socialContagionRiskIndex: Number
  },
  hardwareTelemetricStack: {
    vrDevice: {
      model: { type: String, default: 'MetaQuest3S' },
      connectionType: String,
      handTrackingActive: Boolean,
      passthroughEnabled: Boolean,
      fps: Number
    },
    biometricSensors: {
      gsrConnected: Boolean,
      ppgHeartRateConnected: Boolean,
      qEegConnected: Boolean,
      eegFormat: String,
      eegChannels: Number
    }
  },
  debiasingEngineMetrics: {
    rawInputData: mongoose.Schema.Types.Mixed,
    biasFiltersApplied: {
      rosenthalEffectSubtracted: Boolean,
      socialDesirabilityCorrection: Number,
      genderMaskingAdjustment: Number,
      mahalanobisDistanceScore: Number,
      outlierDetected: Boolean
    },
    debiasedConfidenceIndexPercent: Number
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

module.exports = mongoose.model('PatientRecord', PatientRecordSchema);
