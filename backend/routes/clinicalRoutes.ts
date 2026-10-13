import { Router, Request, Response } from 'express';

// Controladores Clínicos y de Diagnóstico IA
import { analyzePatientData } from '../controllers/clinicalAnalysisController.js';
import { manualGrantByAdmin } from '../controllers/adminSaaSController.js';
import { processSentinelTelemetry } from '../controllers/sentinelController.js';

// Controladores SaaS y Bolsón de IA
import { getSaasProfile, rechargeAiTokens } from '../controllers/authAndLicenseController.js';

// Middlewares de Autenticación
// (Soporta verifyAuthToken / requireAuth y optionalAuth para Pico 3)
import { verifyAuthToken, optionalAuth } from '../middleware/authMiddleware.js';

// Modelo para persistencia de respaldo de telemetría VR
import mongoose from 'mongoose';

const router = Router();

// ============================================================================
// 1. ENDPOINT PRINCIPAL: Inferencia de Análisis Clínico AMIE (Gemini 2.5 / 3.8)
// ============================================================================
router.post('/analyze', verifyAuthToken, analyzePatientData);

// ============================================================================
// 2. ENDPOINT CENTINELA JITAI 24/7: Telemetría Pasiva y Detección de Brotes
// ============================================================================
// Puede ser invocado por dispositivos móviles en segundo plano
router.post('/sentinel/process-telemetry', processSentinelTelemetry);

// ============================================================================
// 3. ENDPOINTS SAAS: Licencias, Saldo y Recarga del Bolsón de IA
// ============================================================================
// Consulta del perfil de licencia y tokens disponibles para el Header y AdminSaaSPanel
router.get('/saas/profile', verifyAuthToken, getSaasProfile);

// Recarga directa de tokens por el profesional
router.post('/saas/recharge', verifyAuthToken, rechargeAiTokens);

// Habilitación manual por operador / transferencias bancarias
router.post('/admin/manual-grant', verifyAuthToken, manualGrantByAdmin);

// ============================================================================
// 4. ENDPOINTS TELEMETRÍA VR (PICO 3 / QUEST / CHROMIE SYNC)
// ============================================================================
// Usan optionalAuth para que la Pico 3 pueda archivar en MongoDB Atlas sin 401
router.post('/telemetry/save', optionalAuth, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const patientId = data.patientId || 'PAC-8104';
    const moduleId = data.moduleId || data.taskName || 'VR_SESSION';

    const VrSession = mongoose.models.VrSession || mongoose.model('VrSession', new mongoose.Schema({
      patientId: String,
      taskName: String,
      moduleId: String,
      protocol: String,
      category: String,
      metrics: mongoose.Schema.Types.Mixed,
      rawSessionData: mongoose.Schema.Types.Mixed
    }, { timestamps: true }));

    const saved = await VrSession.create({
      patientId,
      taskName: moduleId,
      moduleId,
      protocol: data.protocol || 'GENERAL',
      category: data.category || 'CLINICAL',
      metrics: {
        totalPackets: data.totalPackets,
        totalHits: data.totalHits,
        commissions: data.commissions,
        omissions: data.omissions,
        avgReactionTime: data.avgReactionTime,
        tranceDepth: data.tranceDepth,
        finalHrv: data.finalHrv,
        finalGsr: data.finalGsr
      },
      rawSessionData: data
    });

    return res.status(200).json({ success: true, sessionId: saved._id });
  } catch (err: any) {
    console.error('Error guardando telemetría desde ruta router:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/vr/telemetry', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { patientId, moduleId, taskName, kpis, sessionData } = req.body;
    const targetPatient = patientId || 'PAC-8104';
    const activeTask = moduleId || taskName || 'VR_MODULE';

    const VrSession = mongoose.models.VrSession || mongoose.model('VrSession');
    const saved = await VrSession.create({
      patientId: targetPatient,
      taskName: activeTask,
      moduleId: activeTask,
      metrics: kpis || sessionData?.metrics || {},
      rawSessionData: req.body
    });

    return res.status(200).json({ success: true, sessionId: saved._id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 5. ENDPOINTS DE DIAGNÓSTICO & HEALTH-CHECK (PÚBLICOS PARA RENDER Y MONITOR)
// ============================================================================
// ⚠️ Sin verifyAuthToken estricto para evitar 401 en health checks de Render y boot
router.get('/status', (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    engine: 'AMIE Gemini 3.8 Flash',
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      clinicalAnalysis: 'operational',
      jitaiSentinel: 'operational',
      adminBillingProxy: 'operational',
      vrTelemetryPipeline: 'operational'
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    message: 'Motor de diagnóstico AMIE operativo y enlazado al clúster MongoDB Atlas.'
  });
});

router.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

export default router;
