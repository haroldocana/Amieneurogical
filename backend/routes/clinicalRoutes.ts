import { Router, Request, Response } from 'express';
import { analyzePatientData } from '../controllers/clinicalAnalysisController.js';
import { verifyAuthToken } from '../middleware/authMiddleware.js';

const router = Router();

// 1. ENDPOINT PRINCIPAL: Análisis Clínico (Protegido con JWT y descuento de tokens)
router.post('/analyze', verifyAuthToken, analyzePatientData);

// 2. ENDPOINT DE DIAGNÓSTICO: Health-Check del Motor de IA (Opcional para el frontend)
router.get('/status', verifyAuthToken, (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    engine: 'AMIE Gemini 3.8 Flash',
    status: 'online',
    message: 'Motor de diagnóstico operativo y enlazado al sistema de facturación MongoDB.'
  });
});

export default router;
