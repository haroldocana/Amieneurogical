import { Router } from 'express';
import { analyzePatientData } from '../controllers/clinicalAnalysisController.js';
import { verifyAuthToken } from '../middleware/authMiddleware.js';

const router = Router();

// Endpoint del motor de análisis con protección de token y cobro
router.post('/analyze', verifyAuthToken, analyzePatientData);

export default router;
