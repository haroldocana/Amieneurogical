// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR MATEMÁTICO DE BIOMARCADORES PSICOFISIOLÓGICOS
// ============================================================================

/**
 * Calcula el Índice de Habituación H a partir de una serie de lecturas de GSR (Conductancia Cutánea).
 * H = (Pico Inicial - Nivel Final) / Tiempo de Exposición (en minutos)
 * Un índice H alto indica buena extinción/habituación al estímulo de estrés.
 */
export const calculateHabituationIndex = (gsrSeries: number[], durationSec: number): number => {
  if (!gsrSeries || gsrSeries.length < 2 || durationSec <= 0) return 0;
  
  // Garantiza que sliceEnd sea al menos 1 para evitar arrays vacíos y -Infinity
  const sliceEnd = Math.max(1, Math.floor(gsrSeries.length / 3));
  const initialPeak = Math.max(...gsrSeries.slice(0, sliceEnd));
  
  const finalLevel = gsrSeries[gsrSeries.length - 1];
  const durationMin = durationSec / 60;
  
  const h = (initialPeak - finalLevel) / durationMin;
  return Number(Math.max(0, h).toFixed(2));
};

/**
 * Clasifica la respuesta autonómica según la Variabilidad Cardíaca (RMSSD en ms)
 */
export const classifyVagalTone = (rmssdMs: number): { label: string; color: string } => {
  if (rmssdMs < 20) return { label: 'Rigidez Parasimpática / Alto Estrés', color: 'text-rose-400' };
  if (rmssdMs <= 45) return { label: 'Tono Vagal Moderado', color: 'text-amber-400' };
  return { label: 'Alta Regulación Parasimpática', color: 'text-emerald-400' };
};

/**
 * Calcula RMSSD (Root Mean Square of Successive Differences) a partir de intervalos R-R (ms)
 * Biomarcador principal del tono vagal / parasimpático.
 */
export const calculateRMSSD = (rrIntervalsMs: number[]): number => {
  if (!rrIntervalsMs || rrIntervalsMs.length < 2) return 0;
  
  let sumSquaredDiffs = 0;
  for (let i = 0; i < rrIntervalsMs.length - 1; i++) {
    const diff = rrIntervalsMs[i + 1] - rrIntervalsMs[i];
    sumSquaredDiffs += diff * diff;
  }
  
  const rmssd = Math.sqrt(sumSquaredDiffs / (rrIntervalsMs.length - 1));
  return Number(rmssd.toFixed(2));
};

/**
 * Calcula SDNN (Standard Deviation of NN intervals)
 * Refleja la flexibilidad autonómica global (simpática + parasimpática).
 */
export const calculateSDNN = (rrIntervalsMs: number[]): number => {
  if (!rrIntervalsMs || rrIntervalsMs.length < 2) return 0;
  
  const mean = rrIntervalsMs.reduce((acc, val) => acc + val, 0) / rrIntervalsMs.length;
  const variance = rrIntervalsMs.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / rrIntervalsMs.length;
  
  return Number(Math.sqrt(variance).toFixed(2));
};

/**
 * Calcula el Índice de Estrés de Baevsky (SI - Stress Index)
 * SI = AMo / (2 * VR * Mo)
 * Valores > 150 insinúan alta sobrecarga simpática / agotamiento emocional.
 */
export const calculateBaevskyStressIndex = (rrIntervalsMs: number[]): number => {
  if (!rrIntervalsMs || rrIntervalsMs.length < 10) return 0;

  const minRR = Math.min(...rrIntervalsMs) / 1000; // a segundos
  const maxRR = Math.max(...rrIntervalsMs) / 1000;
  const vr = maxRR - minRR; // Variabilidad R-R (MxDM)

  // Moda (Mo) y Amplitud de la Moda (AMo) con binning de 50ms
  const binSize = 50;
  const bins: Record<number, number> = {};
  let maxCount = 0;
  let modeBin = rrIntervalsMs[0];

  for (const val of rrIntervalsMs) {
    const binKey = Math.floor(val / binSize) * binSize;
    bins[binKey] = (bins[binKey] || 0) + 1;
    if (bins[binKey] > maxCount) {
      maxCount = bins[binKey];
      modeBin = binKey;
    }
  }

  const mo = (modeBin + binSize / 2) / 1000; // Moda en segundos
  const amo = (maxCount / rrIntervalsMs.length) * 100; // Amplitud en %

  if (vr === 0 || mo === 0) return 0;

  const stressIndex = amo / (2 * mo * vr);
  return Number(stressIndex.toFixed(1));
};

/**
 * Detección de Respuestas Galvánicas Fásicas (SCR Peaks / Respuestas Emocionales Puntuales)
 * Cuenta picos de micro-conductancia superiores a un umbral (ej. 0.05 uS)
 */
export const detectGSRScrs = (gsrSeries: number[], thresholdMicroSiemens = 0.05): number => {
  if (!gsrSeries || gsrSeries.length < 3) return 0;
  
  let scrCount = 0;
  for (let i = 1; i < gsrSeries.length - 1; i++) {
    const isLocalMax = gsrSeries[i] > gsrSeries[i - 1] && gsrSeries[i] > gsrSeries[i + 1];
    const diffFromPrev = gsrSeries[i] - gsrSeries[i - 1];
    
    if (isLocalMax && diffFromPrev >= thresholdMicroSiemens) {
      scrCount++;
    }
  }
  return scrCount;
};

/**
 * Asimetría Alfa Frontal (FAA - Frontal Alpha Asymmetry) por EEG
 * FAA = ln(Potencia Alfa Derecha) - ln(Potencia Alfa Izquierda)
 * Valores < 0 señalan hiperactividad frontal derecha (Sesgo de evitación / Depresión / Ansiedad).
 */
export const calculateFrontalAlphaAsymmetry = (leftAlphaPower: number, rightAlphaPower: number): number => {
  if (leftAlphaPower <= 0 || rightAlphaPower <= 0) return 0;
  const faa = Math.log(rightAlphaPower) - Math.log(leftAlphaPower);
  return Number(faa.toFixed(3));
};

/**
 * Ratio Theta/Beta (TBR) para Evaluación de TDAH y Control Inhibitorio
 * Valores elevados (> 4.5 en niños, > 3.0 en adultos) sugieren patrón neurobiológico atencional TDAH.
 */
export const calculateThetaBetaRatio = (thetaPower: number, betaPower: number): number => {
  if (betaPower <= 0) return 0;
  const tbr = thetaPower / betaPower;
  return Number(tbr.toFixed(2));
};

/**
 * Variación Pupilar Relativa / Pupilometría (PDR)
 * Ratio = (Diámetro Actual - Baseline) / Baseline
 * Mide activación simpática / carga cognitiva instantánea.
 */
export const calculatePupilDilationRatio = (currentMm: number, baselineMm: number): number => {
  if (baselineMm <= 0) return 0;
  const ratio = ((currentMm - baselineMm) / baselineMm) * 100;
  return Number(ratio.toFixed(2));
};
