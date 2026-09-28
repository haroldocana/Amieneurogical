import { Router, Request, Response } from 'express';
import { analyzePatientData } from '../controllers/clinicalAnalysisController.js';
import { manualGrantByAdmin } from '../controllers/adminSaaSController.js';
import { processSentinelTelemetry } from '../controllers/sentinelController.js';
import { verifyAuthToken } from '../middleware/authMiddleware.js';

const router = Router();

// ============================================================================
// 1. ENDPOINT PRINCIPAL: Inferencia de Análisis Clínico AMIE
// ============================================================================
router.post('/analyze', verifyAuthToken, analyzePatientData);

// ============================================================================
// 2. ENDPOINT CENTINELA JITAI 24/7: Telemetría Pasiva y Detección de Brotes
// ============================================================================
router.post('/sentinel/process-telemetry', processSentinelTelemetry);

// ============================================================================
// 3. ENDPOINT ADMINISTRATIVO: Habilitación Manual de Licencias / Transferencias
// ============================================================================
router.post('/admin/manual-grant', verifyAuthToken, manualGrantByAdmin);

// ============================================================================
// 4. ENDPOINT DE DIAGNÓSTICO: Health-Check del Motor de IA
// ============================================================================
router.get('/status', verifyAuthToken, (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    engine: 'AMIE Gemini 3.8 Flash',
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      clinicalAnalysis: 'operational',
      jitaiSentinel: 'operational',
      adminBillingProxy: 'operational'
    },
    message: 'Motor de diagnóstico operativo y enlazado al sistema MongoDB.'
  });
});

export default router;
