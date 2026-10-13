// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR MATEMÁTICO DE BIOMARCADORES PSICOFISIOLÓGICOS
// ============================================================================

/**
 * Encuentra el valor máximo de un arreglo sin riesgo de desbordar la pila de llamadas.
 */
const safeMax = (arr: number[]): number => {
  if (!arr || arr.length === 0) return 0;
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
};

/**
 * Encuentra el valor mínimo de un arreglo sin riesgo de desbordar la pila de llamadas.
 */
const safeMin = (arr: number[]): number => {
  if (!arr || arr.length === 0) return 0;
  let min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
  }
  return min;
};

/**
 * Filtra los intervalos R-R para eliminar artefactos ectópicos fisiológicamente imposibles.
 * Retiene solo intervalos R-R entre 300 ms (200 lpm) y 2000 ms (30 lpm).
 */
export const filterRRIntervals = (rawRRIntervalsMs?: number[]): number[] => {
  if (!Array.isArray(rawRRIntervalsMs) || rawRRIntervalsMs.length === 0) {
    return [];
  }
  return rawRRIntervalsMs.filter(
    (rr) => typeof rr === 'number' && !isNaN(rr) && rr >= 300 && rr <= 2000
  );
};

/**
 * Calcula el Índice de Habituación H a partir de lecturas de GSR (Conductancia Cutánea).
 * $$H = \frac{\text{Pico Inicial} - \text{Meseta Final}}{\Delta t_{\text{minutos}}}$$
 * - $H > 1.5$: Buena extinción/habituación.
 * - $H \in [0, 1.5]$: Habituación lenta o estabilización parcial.
 * - $H < 0$: Sensibilización (empeoramiento de la respuesta fóbica/reactiva).
 */
export const calculateHabituationIndex = (
  gsrSeries?: number[],
  durationSec: number = 0
): number => {
  if (!Array.isArray(gsrSeries) || gsrSeries.length < 2 || durationSec <= 0) {
    return 0;
  }

  // 1. Filtrar valores espurios o nulos
  const cleanSeries = gsrSeries.filter((v) => typeof v === 'number' && !isNaN(v) && v >= 0);
  if (cleanSeries.length < 2) return 0;

  // 2. Extraer el pico de la fase inicial (primer tercio de la sesión)
  const initialWindowSize = Math.max(1, Math.floor(cleanSeries.length / 3));
  const initialWindow = cleanSeries.slice(0, initialWindowSize);
  const initialPeak = safeMax(initialWindow);

  // 3. Meseta final suavizada (último 15% de muestras para evitar artefactos de desconexión)
  const finalWindowSize = Math.max(1, Math.floor(cleanSeries.length * 0.15));
  const finalWindow = cleanSeries.slice(cleanSeries.length - finalWindowSize);
  const finalPlateau = finalWindow.reduce((acc, val) => acc + val, 0) / finalWindowSize;

  const durationMin = durationSec / 60;
  if (durationMin <= 0) return 0;

  const h = (initialPeak - finalPlateau) / durationMin;
  return Number(h.toFixed(2));
};

/**
 * Clasifica clínicamente el Índice de Habituación H
 */
export const classifyHabituation = (hIndex: number): { label: string; status: 'SUCCESS' | 'PLATEAU' | 'SENSITIZATION'; color: string } => {
  if (isNaN(hIndex)) {
    return { label: 'Sin datos suficientes', status: 'PLATEAU', color: 'text-slate-400' };
  }
  if (hIndex >= 1.5) {
    return { label: 'Habituación Óptima (Extinción Exitosa)', status: 'SUCCESS', color: 'text-emerald-400' };
  }
  if (hIndex >= 0) {
    return { label: 'Habituación Leve / Meseta', status: 'PLATEAU', color: 'text-amber-400' };
  }
  return { label: 'Sensibilización Autonómica (Alerta: Rebote Reactivo)', status: 'SENSITIZATION', color: 'text-rose-400' };
};

/**
 * Clasifica la respuesta autonómica según la Variabilidad Cardíaca (RMSSD en ms)
 */
export const classifyVagalTone = (
  rmssdMs: number
): { label: string; color: string } => {
  if (isNaN(rmssdMs) || rmssdMs <= 0) {
    return { label: 'Lectura Inválida', color: 'text-slate-400' };
  }
  if (rmssdMs < 20) {
    return { label: 'Rigidez Parasimpática / Alto Estrés', color: 'text-rose-400' };
  }
  if (rmssdMs <= 45) {
    return { label: 'Tono Vagal Moderado', color: 'text-amber-400' };
  }
  return { label: 'Alta Regulación Parasimpática', color: 'text-emerald-400' };
};

/**
 * Calcula RMSSD (Root Mean Square of Successive Differences) a partir de intervalos R-R (ms)
 * Biomarcador primario del tono vagal parasimpático.
 */
export const calculateRMSSD = (rawRRIntervalsMs?: number[]): number => {
  const rrIntervalsMs = filterRRIntervals(rawRRIntervalsMs);
  if (rrIntervalsMs.length < 2) return 0;

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
export const calculateSDNN = (rawRRIntervalsMs?: number[]): number => {
  const rrIntervalsMs = filterRRIntervals(rawRRIntervalsMs);
  if (rrIntervalsMs.length < 2) return 0;

  const n = rrIntervalsMs.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += rrIntervalsMs[i];
  }
  const mean = sum / n;

  let sumSquaredDiffs = 0;
  for (let i = 0; i < n; i++) {
    const diff = rrIntervalsMs[i] - mean;
    sumSquaredDiffs += diff * diff;
  }

  // Desviación estándar muestral (N - 1)
  const variance = sumSquaredDiffs / (n - 1);
  return Number(Math.sqrt(variance).toFixed(2));
};

/**
 * Calcula el Balance Simpático / Parasimpático aproximado (LF/HF Ratio)
 * Valores > 2.0 denotan predominio simpático; valores < 1.0 denotan predominio vagal/reposo.
 */
export const calculateLFHFRatio = (rawRRIntervalsMs?: number[]): number => {
  const rr = filterRRIntervals(rawRRIntervalsMs);
  if (rr.length < 10) return 1.2; // Baseline normativo

  const sdnn = calculateSDNN(rr);
  const rmssd = calculateRMSSD(rr);

  if (rmssd <= 0) return 3.5;

  // Estimación temporal validada: SDNN/RMSSD guarda alta covarianza con LF/HF espectral
  const estimatedRatio = sdnn / rmssd;
  return Number(Math.max(0.2, Math.min(6.0, estimatedRatio)).toFixed(2));
};

/**
 * Calcula el Índice de Estrés de Baevsky (SI - Stress Index)
 * $$SI = \frac{AMo}{2 \cdot VR \cdot Mo}$$
 * Valores > 150 indican sobrecarga simpática o agotamiento adaptativo.
 */
export const calculateBaevskyStressIndex = (rawRRIntervalsMs?: number[]): number => {
  const rrIntervalsMs = filterRRIntervals(rawRRIntervalsMs);
  if (rrIntervalsMs.length < 10) return 0;

  const minRR = safeMin(rrIntervalsMs) / 1000; // Segundos
  const maxRR = safeMax(rrIntervalsMs) / 1000;
  const vr = maxRR - minRR; // Variabilidad R-R (MxDM)

  if (vr <= 0.01) return 250; // Taquicardia fija / rigidez extrema

  // Binning de 50 ms para identificar Moda (Mo) y Amplitud (AMo)
  const binSize = 50;
  const bins: Record<number, number> = {};
  let maxCount = 0;
  let modeBin = rrIntervalsMs[0];

  for (let i = 0; i < rrIntervalsMs.length; i++) {
    const val = rrIntervalsMs[i];
    const binKey = Math.floor(val / binSize) * binSize;
    bins[binKey] = (bins[binKey] || 0) + 1;
    if (bins[binKey] > maxCount) {
      maxCount = bins[binKey];
      modeBin = binKey;
    }
  }

  const mo = (modeBin + binSize / 2) / 1000; // Moda en segundos
  if (mo <= 0) return 0;

  const amo = (maxCount / rrIntervalsMs.length) * 100; // Amplitud en porcentaje

  const stressIndex = amo / (2 * mo * vr);
  return Number(Math.max(1, Math.min(1000, stressIndex)).toFixed(1));
};

/**
 * Detección de Respuestas Galvánicas Fásicas (SCR Peaks)
 * Cuenta picos de microconductancia dérmica superiores al umbral dinámico (ej. 0.05 µS).
 */
export const detectGSRScrs = (
  gsrSeries?: number[],
  thresholdMicroSiemens = 0.05
): number => {
  if (!Array.isArray(gsrSeries) || gsrSeries.length < 3) return 0;

  let scrCount = 0;
  for (let i = 1; i < gsrSeries.length - 1; i++) {
    const isLocalMax =
      gsrSeries[i] > gsrSeries[i - 1] && gsrSeries[i] >= gsrSeries[i + 1];
    const diffFromPrev = gsrSeries[i] - gsrSeries[i - 1];

    if (isLocalMax && diffFromPrev >= thresholdMicroSiemens) {
      scrCount++;
    }
  }
  return scrCount;
};

/**
 * Asimetría Alfa Frontal (FAA - Frontal Alpha Asymmetry) por EEG
 * $$FAA = \ln(\text{Alfa Derecho}) - \ln(\text{Alfa Izquierdo})$$
 * - $FAA < 0$: Hiperactivación frontal derecha (evitación, sesgo depresivo o ansiedad).
 * - $FAA > 0$: Activación frontal izquierda (aproximación, afecto positivo).
 */
export const calculateFrontalAlphaAsymmetry = (
  leftAlphaPower: number,
  rightAlphaPower: number
): number => {
  if (
    typeof leftAlphaPower !== 'number' ||
    typeof rightAlphaPower !== 'number' ||
    leftAlphaPower <= 0 ||
    rightAlphaPower <= 0 ||
    isNaN(leftAlphaPower) ||
    isNaN(rightAlphaPower)
  ) {
    return 0;
  }
  const faa = Math.log(rightAlphaPower) - Math.log(leftAlphaPower);
  return Number(faa.toFixed(3));
};

/**
 * Ratio Theta/Beta (TBR) para Evaluación de Control Inhibitorio y TDAH
 * Valores > 3.0 en adultos o > 4.5 en niños sugieren lentificación frontal.
 */
export const calculateThetaBetaRatio = (
  thetaPower: number,
  betaPower: number
): number => {
  if (
    typeof thetaPower !== 'number' ||
    typeof betaPower !== 'number' ||
    betaPower <= 0 ||
    isNaN(betaPower) ||
    isNaN(thetaPower)
  ) {
    return 0;
  }
  const tbr = thetaPower / betaPower;
  return Number(tbr.toFixed(2));
};

/**
 * Variación Pupilar Relativa / Pupilometría (PDR)
 * Mide dilatación simpática reactiva a carga cognitiva o impacto emocional.
 */
export const calculatePupilDilationRatio = (
  currentMm: number,
  baselineMm: number
): number => {
  if (
    typeof currentMm !== 'number' ||
    typeof baselineMm !== 'number' ||
    baselineMm <= 0 ||
    isNaN(baselineMm) ||
    isNaN(currentMm)
  ) {
    return 0;
  }
  const ratio = ((currentMm - baselineMm) / baselineMm) * 100;
  return Number(ratio.toFixed(2));
};
