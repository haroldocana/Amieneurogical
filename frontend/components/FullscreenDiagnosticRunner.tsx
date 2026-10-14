// ============================================================================
// PROTOCOLO ESPECÍFICO: EVALUACIÓN Y GRADUACIÓN DE TEA EN WEBXR 6DoF
// ============================================================================

export const ASD_DIAGNOSTIC_PROTOCOL = {
  id: 'ASD_SEVERITY_ASSESSMENT',
  name: 'TEA: Evaluación de Grado & Atención Conjunta 6DoF',
  cie11: '6A02',
  dsm5: '299.00',
  category: 'DIAGNOSTIC',
  ecosystem: 'clinical_office',
  targetKpiName: 'Índice de Afectación TEA (Score / Grado)',
  kpiUnit: 'Score/100',
  phase1Sec: 30, // Calibración de línea base en reposo
  phase2Sec: 150, // Test de atención conjunta y contraste sensorial
  phase3Sec: 30, // Habituación y retorno a reposo
  scriptBaseline: 'Calibración de línea base. Permanece observando la sala con tranquilidad mientras ajustamos los sensores.',
  scriptActive: 'Observa al evaluador. Presta atención hacia dónde dirige la mirada y pulsa el gatillo cuando identifiques el objeto señalado.',
  scriptRecovery: 'Prueba completada. El entorno regresa a un estado de calma.',
  
  // Cálculo de inferencia para el informe pericial
  calculateGrade: (gazeAvoidancePct: number, rjaLatencyMs: number, deltaGsr: number) => {
    const normLatency = Math.min(100, (rjaLatencyMs / 2000) * 100);
    const normGsr = Math.min(100, (deltaGsr / 3.0) * 100);
    const compositeScore = Math.round((gazeAvoidancePct * 0.40) + (normLatency * 0.35) + (normGsr * 0.25));
    
    let level = 'Nivel 1 (Leve - Requiere ayuda)';
    if (compositeScore > 75) level = 'Nivel 3 (Severo - Requiere ayuda muy notable)';
    else if (compositeScore > 50) level = 'Nivel 2 (Moderado - Requiere ayuda notable)';
    else if (compositeScore <= 25) level = 'Subclínico / Rango Neurotípico';

    return { compositeScore, level };
  }
};
