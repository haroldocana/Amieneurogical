// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR MATEMÁTICO DE BIOMARCADORES PSICOFISIOLÓGICOS
// ============================================================================

/**
 * Encuentra el valor máximo de un arreglo garantizando inmunidad a NaN y sin desbordar la pila.
 */
export const safeMax = (arr?: number[]): number => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  let max = -Infinity;
  let hasValid = false;

  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (typeof val === 'number' && Number.isFinite(val)) {
      if (!hasValid || val > max) {
        max = val;
        hasValid = true;
      }
    }
  }
  return hasValid ? max : 0;
};

/**
 * Encuentra el valor mínimo de un arreglo garantizando inmunidad a NaN y sin desbordar la pila.
 */
export const safeMin = (arr?: number[]): number => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  let min = Infinity;
  let hasValid = false;

  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (typeof val === 'number' && Number.isFinite(val)) {
      if (!hasValid || val < min) {
        min = val;
        hasValid = true;
      }
    }
  }
  return hasValid ? min : 0;
};

/**
 * Filtra los intervalos R-R para eliminar artefactos ectópicos fisiológicamente imposibles.
 * Retiene exclusivamente intervalos NN válidos entre 300 ms (200 lpm) y 2000 ms (30 lpm).
 */
export const filterRRIntervals = (rawRRIntervalsMs?: number[]): number[] => {
  if (!Array.isArray(rawRRIntervalsMs) || rawRRIntervalsMs.length === 0) {
    return [];
  }
  return rawRRIntervalsMs.filter(
    (rr) => typeof rr === 'number' && Number.isFinite(rr) && rr >= 300 && rr <= 2000
  );
};

/**
 * Calcula el Índice de Habituación H a partir de lecturas de GSR (Conductancia Cutánea).
 * $$H = \frac{\text{Pico Inicial} - \text{Meseta Final}}{\Delta t_{\text{minutos}}}$$
 * - $H \ge 1.5$: Buena extinción / habituación autónoma.
 * - $H \in [0, 1.5)$: Habituación lenta o estabilización parcial.
 * - $H < 0$: Sensibilización (rebote reactivo / agravamiento de la carga fóbica).
 */
export const calculateHabituationIndex = (
  gsrSeries?: number[],
  durationSec: number = 0
): number => {
  if (!Array.isArray(gsrSeries) || gsrSeries.length < 2 || durationSec <= 0) {
    return 0;
  }

  // 1. Filtrar valores espurios o no finitos
  const cleanSeries = gsrSeries.filter(
    (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0
  );
  if (cleanSeries.length < 2) return 0;

  // 2. Extraer el pico de la fase inicial (primer tercio de la serie)
  const initialWindowSize = Math.max(1, Math.floor(cleanSeries.length / 3));
  const initialWindow = cleanSeries.slice(0, initialWindowSize);
  const initialPeak = safeMax(initialWindow);

  // 3. Meseta final suavizada (último 15% de muestras para neutralizar micro-artefactos)
  const finalWindowSize = Math.max(1, Math.floor(cleanSeries.length * 0.15));
  const finalWindow = cleanSeries.slice(cleanSeries.length - finalWindowSize);
  const finalPlateau = finalWindow.reduce((acc, val) => acc + val, 0) / finalWindowSize;

  const durationMin = durationSec / 60;
  if (durationMin <= 0) return 0;

  const h = (initialPeak - finalPlateau) / durationMin;
  return Number(h.toFixed(2));
};

/**
 * Clasifica clínicamente el Índice de Habituación H.
 */
export const classifyHabituation = (
  hIndex: number
): { label: string; status: 'SUCCESS' | 'PLATEAU' | 'SENSITIZATION'; color: string } => {
  if (!Number.isFinite(hIndex)) {
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
 * Clasifica la respuesta autonómica según la Variabilidad Cardíaca (RMSSD en ms).
 */
export const classifyVagalTone = (
  rmssdMs: number
): { label: string; color: string } => {
  if (!Number.isFinite(rmssdMs) || rmssdMs <= 0) {
    return { label: 'Lectura Inválida / Sin Datos', color: 'text-slate-400' };
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
 * Calcula RMSSD (Root Mean Square of Successive Differences) a partir de intervalos R-R (ms).
 * Biomarcador primario de la actividad parasimpática y tono vagal eferente.
 * $$RMSSD = \sqrt{\frac{1}{N - 1} \sum_{i=1}^{N - 1} (RR_{i+1} - RR_i)^2}$$
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
 * Calcula SDNN (Standard Deviation of NN intervals).
 * Refleja la flexibilidad autonómica global (integración simpática + parasimpática).
 * $$SDNN = \sqrt{\frac{1}{N - 1} \sum_{i=1}^{N} (RR_i - \overline{RR})^2}$$
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

  const variance = sumSquaredDiffs / (n - 1);
  return Number(Math.sqrt(variance).toFixed(2));
};

/**
 * Calcula pNN50: Porcentaje de pares de intervalos R-R sucesivos cuya diferencia absoluta es > 50 ms.
 * Estándar clínico de reactividad vagal rápida según Task Force ESC/NASPE.
 * $$pNN50 = \frac{\text{Conteo}(\vert{}RR_{i+1} - RR_i\vert{} > 50\text{ ms})}{N - 1} \times 100$$
 */
export const calculatePNN50 = (rawRRIntervalsMs?: number[]): number => {
  const rrIntervalsMs = filterRRIntervals(rawRRIntervalsMs);
  if (rrIntervalsMs.length < 2) return 0;

  let nn50Count = 0;
  const totalPairs = rrIntervalsMs.length - 1;

  for (let i = 0; i < totalPairs; i++) {
    const diff = Math.abs(rrIntervalsMs[i + 1] - rrIntervalsMs[i]);
    if (diff > 50) {
      nn50Count++;
    }
  }

  const pnn50 = (nn50Count / totalPairs) * 100;
  return Number(pnn50.toFixed(2));
};

/**
 * Deriva la frecuencia cardíaca promedio (BPM) a partir de la serie de intervalos R-R.
 */
export const calculateMeanBPMFromRR = (rawRRIntervalsMs?: number[]): number => {
  const rrIntervalsMs = filterRRIntervals(rawRRIntervalsMs);
  if (rrIntervalsMs.length === 0) return 0;

  const sum = rrIntervalsMs.reduce((acc, val) => acc + val, 0);
  const meanRR = sum / rrIntervalsMs.length;

  if (meanRR <= 0) return 0;
  const bpm = 60000 / meanRR;
  return Number(bpm.toFixed(1));
};

/**
 * Calcula el Balance Simpático / Parasimpático estimado (LF/HF Ratio en dominio del tiempo).
 * Valores > 2.0 denotan predominio simpático; valores < 1.0 denotan predominio vagal.
 */
export const calculateLFHFRatio = (rawRRIntervalsMs?: number[]): number => {
  const rr = filterRRIntervals(rawRRIntervalsMs);
  if (rr.length < 10) return 1.2;

  const sdnn = calculateSDNN(rr);
  const rmssd = calculateRMSSD(rr);

  if (rmssd <= 0.001) return 5.0;

  const estimatedRatio = sdnn / rmssd;
  return Number(Math.max(0.2, Math.min(6.0, estimatedRatio)).toFixed(2));
};

/**
 * Calcula el Índice de Estrés de Baevsky (SI - Stress Index).
 * $$SI = \frac{AMo}{2 \cdot VR \cdot Mo}$$
 * donde $AMo$ es la amplitud modal en $\%$, $Mo$ es la moda en segundos y $VR$ es la variabilidad R-R en segundos.
 * Valores $> 150$ indican tensión simpática; $> 500$ sobrecarga vegetativa aguda.
 */
export const calculateBaevskyStressIndex = (rawRRIntervalsMs?: number[]): number => {
  const rrIntervalsMs = filterRRIntervals(rawRRIntervalsMs);
  if (rrIntervalsMs.length < 10) return 0;

  // Filtrado robusto interpercentil (P5 - P95) para evitar distorsión de VR por ectopias
  const sorted = [...rrIntervalsMs].sort((a, b) => a - b);
  const p05 = sorted[Math.floor(sorted.length * 0.05)];
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
  
  const vrMs = p95 - p05;
  const vr = vrMs / 1000; // Segundos

  // Rigidez autonómica extrema: taquicardia fija o varianza nula
  if (vr <= 0.02) return 1000;

  // Binning estandarizado de 50 ms para identificar Moda (Mo) y Amplitud (AMo)
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
 * Clasifica clínicamente el Índice de Estrés de Baevsky (SI).
 */
export const classifyBaevskyStress = (
  si: number
): { label: string; severity: 'OPTIMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL'; color: string } => {
  if (!Number.isFinite(si) || si <= 0) {
    return { label: 'Sin datos', severity: 'OPTIMAL', color: 'text-slate-400' };
  }
  if (si < 50) {
    return { label: 'Predominio Parasimpático / Vagotonía', severity: 'OPTIMAL', color: 'text-emerald-400' };
  }
  if (si <= 150) {
    return { label: 'Euestrés Normativo (Homeostasis)', severity: 'OPTIMAL', color: 'text-sky-400' };
  }
  if (si <= 350) {
    return { label: 'Tensión Simpática Moderada', severity: 'MODERATE', color: 'text-amber-400' };
  }
  if (si <= 600) {
    return { label: 'Sobrecarga Simpática Elevada', severity: 'HIGH', color: 'text-orange-400' };
  }
  return { label: 'Rigidez Autonómica Crítica / Paroxismo', severity: 'CRITICAL', color: 'text-rose-400' };
};

/**
 * Detección Fásica de Respuestas Galvánicas (SCR Peaks - Trough-to-Peak Tracking).
 * Registra picos electrodérmicos cuya amplitud acumulada desde el valle hasta el ápice supere el umbral.
 * Umbral normativo: $\ge 0.05\text{ }\mu\text{S}$.
 */
export const detectGSRScrs = (
  gsrSeries?: number[],
  thresholdMicroSiemens: number = 0.05
): number => {
  if (!Array.isArray(gsrSeries) || gsrSeries.length < 3) return 0;

  const clean = gsrSeries.filter(
    (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0
  );
  if (clean.length < 3) return 0;

  let scrCount = 0;
  let minVal = clean[0];
  let isRising = false;

  for (let i = 1; i < clean.length; i++) {
    const diff = clean[i] - clean[i - 1];

    if (diff > 0) {
      if (!isRising) {
        isRising = true;
        minVal = clean[i - 1];
      }
    } else if (diff < 0) {
      if (isRising) {
        isRising = false;
        const peakVal = clean[i - 1];
        const amplitude = peakVal - minVal;
        if (amplitude >= thresholdMicroSiemens) {
          scrCount++;
        }
        minVal = clean[i];
      } else {
        if (clean[i] < minVal) {
          minVal = clean[i];
        }
      }
    }
  }

  // Comprobación si la serie culmina en el vértice de una deflexión ascendente
  if (isRising) {
    const peakVal = clean[clean.length - 1];
    if (peakVal - minVal >= thresholdMicroSiemens) {
      scrCount++;
    }
  }

  return scrCount;
};

/**
 * Asimetría Alfa Frontal (FAA - Frontal Alpha Asymmetry) por EEG.
 * $$FAA = \ln(\text{Alfa Derecho}) - \ln(\text{Alfa Izquierdo})$$
 * - $FAA < 0$: Mayor actividad cortical derecha (retirada, sesgo fóbico o depresivo).
 * - $FAA > 0$: Mayor actividad cortical izquierda (aproximación, afecto positivo).
 */
export const calculateFrontalAlphaAsymmetry = (
  leftAlphaPower: number,
  rightAlphaPower: number
): number => {
  if (
    typeof leftAlphaPower !== 'number' ||
    typeof rightAlphaPower !== 'number' ||
    !Number.isFinite(leftAlphaPower) ||
    !Number.isFinite(rightAlphaPower) ||
    leftAlphaPower <= 0 ||
    rightAlphaPower <= 0
  ) {
    return 0;
  }
  const faa = Math.log(rightAlphaPower) - Math.log(leftAlphaPower);
  return Number(faa.toFixed(3));
};

/**
 * Clasifica clínicamente la Asimetría Alfa Frontal (FAA).
 */
export const classifyFAA = (
  faa: number
): { label: string; bias: 'APPROACH' | 'NEUTRAL' | 'WITHDRAWAL'; color: string } => {
  if (!Number.isFinite(faa)) {
    return { label: 'Indeterminado', bias: 'NEUTRAL', color: 'text-slate-400' };
  }
  if (faa > 0.08) {
    return { label: 'Sesgo de Aproximación (Activación Izquierda / Eutimia)', bias: 'APPROACH', color: 'text-emerald-400' };
  }
  if (faa < -0.08) {
    return { label: 'Sesgo de Evitación (Hiperactivación Derecha / Disforia)', bias: 'WITHDRAWAL', color: 'text-rose-400' };
  }
  return { label: 'Equilibrio Hemisférico Frontal (Bilateral)', bias: 'NEUTRAL', color: 'text-sky-400' };
};

/**
 * Ratio Theta/Beta (TBR) para Evaluación de Control Inhibitorio y TDAH.
 * Valores $> 3.0$ en adultos o $> 4.5$ en población infantil sugieren lentificación frontal.
 */
export const calculateThetaBetaRatio = (
  thetaPower: number,
  betaPower: number
): number => {
  if (
    typeof thetaPower !== 'number' ||
    typeof betaPower !== 'number' ||
    !Number.isFinite(thetaPower) ||
    !Number.isFinite(betaPower) ||
    thetaPower <= 0 ||
    betaPower <= 0
  ) {
    return 0;
  }
  const tbr = thetaPower / betaPower;
  return Number(Math.min(20, Math.max(0.1, tbr)).toFixed(2));
};

/**
 * Clasifica clínicamente el Ratio Theta/Beta (TBR).
 */
export const classifyThetaBetaRatio = (
  tbr: number,
  isPediatric: boolean = false
): { label: string; indicatesExecutiveDeficit: boolean; color: string } => {
  if (!Number.isFinite(tbr) || tbr <= 0) {
    return { label: 'Lectura no disponible', indicatesExecutiveDeficit: false, color: 'text-slate-400' };
  }

  const threshold = isPediatric ? 4.5 : 3.0;

  if (tbr >= threshold) {
    return {
      label: `Lentificación Cortical Frontal (Sugerente de TDAH / Inatención, TBR: ${tbr})`,
      indicatesExecutiveDeficit: true,
      color: 'text-rose-400'
    };
  }
  return {
    label: `Control Inhibitorio y Alerta Cortical Conservada (TBR: ${tbr})`,
    indicatesExecutiveDeficit: false,
    color: 'text-emerald-400'
  };
};

/**
 * Variación Pupilar Relativa / Pupilometría (PDR).
 * Cuantifica la dilatación simpática reactiva a carga cognitiva o impacto emocional.
 * $$PDR = \frac{\text{Diámetro Actual} - \text{Diámetro Basal}}{\text{Diámetro Basal}} \times 100$$
 */
export const calculatePupilDilationRatio = (
  currentMm: number,
  baselineMm: number
): number => {
  if (
    typeof currentMm !== 'number' ||
    typeof baselineMm !== 'number' ||
    !Number.isFinite(currentMm) ||
    !Number.isFinite(baselineMm) ||
    baselineMm <= 0 ||
    currentMm <= 0
  ) {
    return 0;
  }
  const ratio = ((currentMm - baselineMm) / baselineMm) * 100;
  return Number(ratio.toFixed(2));
};
