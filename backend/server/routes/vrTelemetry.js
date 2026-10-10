const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ESQUEMA MONGOOSE PARA SESIONES VR
const VrSessionSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  moduleId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  kpis: {
    totalHits: { type: Number, default: 0 },
    totalOmissions: { type: Number, default: 0 },
    totalCommissions: { type: Number, default: 0 },
    avgReactionTimeMs: { type: Number, default: 0 }
  },
  telemetryLog: [{
    timestamp: Number,
    reactionTimeMs: Number,
    attentionIndex: Number,
    gsrValue: Number,
    hrvBpm: Number,
    headYaw: Number,
    headPitch: Number
  }]
}, { timestamps: true });

const VrSession = mongoose.models.VrSession || mongoose.model('VrSession', VrSessionSchema);

// POST /api/vr/telemetry - Guardar datos de sesión
router.post('/telemetry', async (req, res) => {
  try {
    const { patientId, moduleId, kpis, telemetryLog } = req.body;

    if (!patientId || !moduleId) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros obligatorios: patientId o moduleId.' });
    }

    const sessionDoc = await VrSession.create({
      patientId,
      moduleId,
      kpis: kpis || {},
      telemetryLog: telemetryLog || []
    });

    console.log(`[MongoDB Success] Sesión guardada para ${patientId} en módulo ${moduleId}`);
    return res.status(201).json({ success: true, id: sessionDoc._id });
  } catch (err) {
    console.error('[MongoDB Error] Fallo al guardar la telemetría:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor al guardar en MongoDB.' });
  }
});

// GET /api/vr/patient/:patientId - Consultar historial
router.get('/patient/:patientId', async (req, res) => {
  try {
    const sessions = await VrSession.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    return res.json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Error al consultar historial en MongoDB.' });
  }
});

module.exports = router;
