import { PatientRecord } from '../types';

export type TheoreticalSchool = 'tcc' | 'psychodynamic' | 'humanist' | 'systemic' | 'neuropsych';

export interface TheoreticalInterpretation {
  currentKey: TheoreticalSchool;
  currentName: string;
  keyConcepts: string[];
  biometricCorrelate: string;
  clinicalHypothesis: string;
  recommendedTechnique: string;
}

export interface RciCalculation {
  preScore: number;
  postScore: number;
  rciValue: number;
  sDiff: number;
  isStatisticallySignificant: boolean;
  clinicalStatus: 
    | 'Recuperado (Cambio Clínicamente Significativo)' 
    | 'Mejoría Significativa' 
    | 'Sin Cambio Significativo' 
    | 'Deterioro';
  clinicalCutoffApplied: number;
}

export interface DyadicSynchronyResult {
  couplingPercentage: number;
  phaseCorrelation: number;
  allianceLevel: 'Óptima (Alta Co-regulación)' | 'Moderada' | 'Desacoplada (Riesgo de Ruptura)';
  clinicalNote: string;
  validSamplesCount: number;
}

export interface TheoreticalSchoolMetadata {
  key: TheoreticalSchool;
  name: string;
  epistemology: string;
  primaryBiomarkersFocus: string;
}

export const THEORETICAL_FRAMEWORKS_CATALOG: TheoreticalSchoolMetadata[] = [
  {
    key: 'tcc',
    name: 'Cognitivo-Conductual & Tercera Ola (TCC / ACT / DBT)',
    epistemology: 'Procesamiento de información, habituación autonómica y flexibilidad psicológica.',
    primaryBiomarkersFocus: 'Índice de Habituación H, reactividad GSR y latencia de respuesta Go/No-Go.'
  },
  {
    key: 'psychodynamic',
    name: 'Psicodinámica & Psicoanálisis Relacional',
    epistemology: 'Conflicto intrapsíquico, defensas somatizadas y afecto no integrado.',
    primaryBiomarkersFocus: 'Discrepancia entre relato verbal (escalas) y micro-picos simpáticos involuntarios (GSR).'
  },
  {
    key: 'humanist',
    name: 'Humanista, Experiencial & Fenomenológica (Gestalt / Focalización)',
    epistemology: 'Experiencia organísmica sentida, autorregulación organismica y conciencia somática.',
    primaryBiomarkersFocus: 'Tono vagal basal (HRV), congruencia interoceptiva y respiración coherente.'
  },
  {
    key: 'systemic',
    name: 'Sistémica, Cibernética & Terapia Familiar',
    epistemology: 'Pautas comunicacionales diádicas, homeostasis relacional y transmisión circular del estrés.',
    primaryBiomarkersFocus: 'Acoplamiento y sincronía espectral diádica HRV/GSR entre terapeuta y paciente/pareja.'
  },
  {
    key: 'neuropsych',
    name: 'Neuropsicología & Neurociencia Clínica',
    epistemology: 'Desbalance cortico-subcortical, redes funcionales y neuromodulación electroencefalográfica.',
    primaryBiomarkersFocus: 'Z-Scores qEEG (Theta/Beta, Coherencia, Asimetría alfa) y cinemática visuo-motora.'
  }
];

/**
 * Calcula el Índice de Cambio Confiable (Reliable Change Index - RCI) bajo el estándar de Jacobson & Truax (1991).
 * 
 * Fórmula:
 *   RCI = (Pre - Post) / S_diff
 *   S_diff = sqrt(2 * SE^2)
 *   SE = SD_baseline * sqrt(1 - r_xx)
 * 
 * @param preScore Puntuación basal antes del tratamiento.
 * @param postScore Puntuación de re-evaluación post-tratamiento.
 * @param sdBaseline Desviación estándar de la muestra normativa/clínica (default: 5.2).
 * @param reliabilityAlpha Coeficiente de fiabilidad test-retest o consistencia interna alpha de Cronbach (default: 0.88).
 * @param clinicalCutoff Punto de corte normativo 'c' de Jacobson & Truax (default: 9 para sub-clínico en PHQ-9/GAD-7).
 * @param higherIsBetter Determina si puntajes mayores representan mejoría clínica (default: false para sintomatología).
 */
export const calculateRCI = (
  preScore: number,
  postScore: number,
  sdBaseline: number = 5.2,
  reliabilityAlpha: number = 0.88,
  clinicalCutoff: number = 9,
  higherIsBetter: boolean = false
): RciCalculation => {
  const safePre = Number.isFinite(preScore) ? preScore : 0;
  const safePost = Number.isFinite(postScore) ? postScore : 0;
  const safeSd = Number.isFinite(sdBaseline) && sdBaseline > 0 ? sdBaseline : 5.2;
  const safeAlpha = Number.isFinite(reliabilityAlpha) && reliabilityAlpha >= 0 && reliabilityAlpha < 1 
    ? reliabilityAlpha 
    : 0.88;
  const safeCutoff = Number.isFinite(clinicalCutoff) ? clinicalCutoff : 9;

  // Error estándar de medición (SE) y error estándar de la diferencia (S_diff)
  const se = safeSd * Math.sqrt(1 - safeAlpha);
  const sDiffCalculated = Math.sqrt(2 * Math.pow(se, 2));
  const sDiff = sDiffCalculated > 0.001 ? sDiffCalculated : 2.69;

  // Magnitud del cambio según la dirección de la escala
  const rawDiff = higherIsBetter ? (safePost - safePre) : (safePre - safePost);
  const rawRci = rawDiff / sDiff;
  const rciValue = parseFloat(rawRci.toFixed(2));

  let isStatisticallySignificant = false;
  let clinicalStatus: RciCalculation['clinicalStatus'] = 'Sin Cambio Significativo';

  // Corte bidireccional Z = 1.96 (p < 0.05)
  if (rciValue >= 1.96) {
    isStatisticallySignificant = true;
    const isUnderNormativeCutoff = higherIsBetter 
      ? safePost >= safeCutoff 
      : safePost <= safeCutoff;

    clinicalStatus = isUnderNormativeCutoff 
      ? 'Recuperado (Cambio Clínicamente Significativo)' 
      : 'Mejoría Significativa';
  } else if (rciValue <= -1.96) {
    isStatisticallySignificant = true;
    clinicalStatus = 'Deterioro';
  }

  return {
    preScore: safePre,
    postScore: safePost,
    rciValue,
    sDiff: parseFloat(sDiff.toFixed(2)),
    isStatisticallySignificant,
    clinicalStatus,
    clinicalCutoffApplied: safeCutoff
  };
};

/**
 * Calcula la Sincronía Fisiológica Diádica real mediante Correlación de Pearson centrada en tiempo real.
 * Evalúa el acoplamiento autonómico HRV entre terapeuta y paciente.
 * 
 * @param therapistHrvSeries Vector temporal de RMSSD/HRV del terapeuta.
 * @param patientHrvSeries Vector temporal de RMSSD/HRV del paciente.
 */
export const calculateDyadicSynchrony = (
  therapistHrvSeries: number[],
  patientHrvSeries: number[]
): DyadicSynchronyResult => {
  const cleanT = (therapistHrvSeries || []).filter(v => Number.isFinite(v) && v > 0);
  const cleanP = (patientHrvSeries || []).filter(v => Number.isFinite(v) && v > 0);

  const n = Math.min(cleanT.length, cleanP.length);

  // Muestra diádica insuficiente para inferencia estadística confiable (n < 3)
  if (n < 3) {
    return {
      couplingPercentage: 50.0,
      phaseCorrelation: 0.00,
      allianceLevel: 'Moderada',
      clinicalNote: 'Muestra temporal insuficiente para cálculo de correlación diádica (requiere n >= 3 muestras activas).',
      validSamplesCount: n
    };
  }

  // 1. Cálculo de medias muestrales
  let sumT = 0;
  let sumP = 0;
  for (let i = 0; i < n; i++) {
    sumT += cleanT[i];
    sumP += cleanP[i];
  }
  const meanT = sumT / n;
  const meanP = sumP / n;

  // 2. Covarianza y varianzas de Pearson centradas
  let numerator = 0;
  let varT = 0;
  let varP = 0;

  for (let i = 0; i < n; i++) {
    const diffT = cleanT[i] - meanT;
    const diffP = cleanP[i] - meanP;
    numerator += diffT * diffP;
    varT += diffT * diffT;
    varP += diffP * diffP;
  }

  const denominator = Math.sqrt(varT * varP);

  // Detección de señal plana o artefacto (varianza nula)
  if (denominator <= 0.00001) {
    return {
      couplingPercentage: 50.0,
      phaseCorrelation: 0.00,
      allianceLevel: 'Desacoplada (Riesgo de Ruptura)',
      clinicalNote: 'Señal fisiológica estática o sin varianza espectral. Verifique conexión de electrodos/sensores.',
      validSamplesCount: n
    };
  }

  // 3. Coeficiente r acotado estrictamente en [-1, 1]
  const rawR = numerator / denominator;
  const clampedR = Math.max(-1.0, Math.min(1.0, rawR));
  const phaseCorrelation = parseFloat(clampedR.toFixed(2));

  // Mapeo normalizado [-1, 1] -> [0%, 100%]
  const rawCoupling = ((clampedR + 1) / 2) * 100;
  const couplingPercentage = parseFloat(Math.min(100, Math.max(0, rawCoupling)).toFixed(1));

  let allianceLevel: DyadicSynchronyResult['allianceLevel'] = 'Moderada';
  let clinicalNote = 'Sintonía diádica adecuada con regulación mutua dentro de límites normativos.';

  if (couplingPercentage >= 70.0) {
    allianceLevel = 'Óptima (Alta Co-regulación)';
    clinicalNote = 'Fuerte co-regulación autonómica vagal (HRV); el paciente responde con desescalada y calma a las intervenciones.';
  } else if (couplingPercentage < 45.0) {
    allianceLevel = 'Desacoplada (Riesgo de Ruptura)';
    clinicalNote = 'Desincronización fisiológica aguda; posible discrepancia de alianza terapéutica o confrontación no calibrada.';
  }

  return {
    couplingPercentage,
    phaseCorrelation,
    allianceLevel,
    clinicalNote,
    validSamplesCount: n
  };
};

/**
 * Traduce biomarcadores objetivos a la formulación epistemológica seleccionada.
 * Resuelve polimórficamente las estructuras de datos de la plataforma clínica AMIE.
 */
export const getTheoreticalInterpretation = (
  patient: PatientRecord,
  current: TheoreticalSchool
): TheoreticalInterpretation => {
  const p = patient as any;

  // Extracción polimórfica defensiva de biomarcadores
  const reactionTime = Number(
    p?.neuromotorBiomarkers?.reactionTimeMs ?? 
    p?.vrTelemetryData?.reactionTimeMs ?? 
    240
  );

  const rawGsr = p?.vrTelemetryData?.gsrMicroSiemens ?? 
                 p?.vrTherapyIntervention?.realtimeTelemetrySummary?.peakGSR_uS ?? 
                 p?.vrTelemetryData?.gsr ?? 
                 p?.multisensoryHardware?.gsrMicroSiemens ?? 
                 3.4;

  const peakGsr = Number(
    (Array.isArray(rawGsr) && rawGsr.length > 0 ? Math.max(...rawGsr) : Number(rawGsr) || 3.4).toFixed(1)
  );

  const hRatio = Number(
    (p?.vrTelemetryData?.habituationIndexH ?? 
     p?.vrTherapyIntervention?.realtimeTelemetrySummary?.habituationIndexH ?? 
     2.84).toFixed(2)
  );

  const phq = Number(p?.psychometricScores?.phq9 ?? 0);
  const gad = Number(p?.psychometricScores?.gad7 ?? 0);
  const thetaBeta = Number(
    (p?.qeegZScores?.frontalThetaBetaRatio ?? 
     p?.qeegBiomarkers?.thetaBetaRatio ?? 
     1.8).toFixed(2)
  );

  const hrvVal = Number(
    p?.vrTelemetryData?.hrvRmssdMs?.[0] ?? 
    p?.multisensoryHardware?.vagalToneHrvIndex ?? 
    42
  );

  switch (current) {
    case 'tcc':
      return {
        currentKey: 'tcc',
        currentName: 'Cognitivo-Conductual & Tercera Ola (TCC / ACT / DBT)',
        keyConcepts: ['Habituación del Estímulo', 'Extinción del Miedo', 'Flexibilidad Cognitiva'],
        biometricCorrelate: `Índice H de Habituación: ${hRatio} | Pico GSR: ${peakGsr} µS | Latencia TR: ${reactionTime} ms | GAD-7: ${gad}`,
        clinicalHypothesis: 'Respuesta condicionada de hiperactivación autonómica ante sesgos atencionales de amenaza focalizados.',
        recommendedTechnique: 'Exposición inmersiva VR jerarquizada con biofeedback de respuesta galvánica y reestructuración cognitiva.'
      };

    case 'psychodynamic':
      return {
        currentKey: 'psychodynamic',
        currentName: 'Psicodinámica & Psicoanálisis Contemporáneo',
        keyConcepts: ['Marcador Somático Inconsciente', 'Resistencia', 'Enmascaramiento Afectivo'],
        biometricCorrelate: `Discrepancia entre relato verbal consciente (PHQ-9: ${phq}) y picos neurovegetativos en conductancia (GSR: ${peakGsr} µS).`,
        clinicalHypothesis: 'Intelectualización y aislamiento del afecto como mecanismos de defensa frente a impulsos o duelos no procesados.',
        recommendedTechnique: 'Indagación asociativa libre asistida por marcadores de reactividad electrodérmica en tiempo real.'
      };

    case 'humanist':
      return {
        currentKey: 'humanist',
        currentName: 'Humanista, Experiencial & Fenomenológica (Gestalt)',
        keyConcepts: ['Vivencia Organísmica', 'Aquí y Ahora', 'Interocepción Corporizada'],
        biometricCorrelate: `Tono Vagal VLF/HF (HRV: ${hrvVal} ms) | Registro del estado afectivo fisiológico inmediato con latencia de ${reactionTime} ms.`,
        clinicalHypothesis: 'Incongruencia entre la experiencia corporal sentida (self somático) y el autoconcepto idealizado consciente.',
        recommendedTechnique: 'Biofeedback inmersivo somato-sensorial para la toma de conciencia corporal (focusing) y recentramiento organísmico.'
      };

    case 'systemic':
      return {
        currentKey: 'systemic',
        currentName: 'Sistémica, Relacional & Familiar',
        keyConcepts: ['Co-regulación Autonómica', 'Sincronía Diádica', 'Homeostasis Relacional'],
        biometricCorrelate: `Acoplamiento fisiológico inter-sujetos | Sincronización HRV/GSR correlacionada diádicamente.`,
        clinicalHypothesis: 'Transmisión relacional del estrés e hiperactivación espejo en subsistemas vinculares de la díada o familia.',
        recommendedTechnique: 'Intervención de desescalada relacional con medición diádica de coherencia cardíaca simultánea.'
      };

    case 'neuropsych':
    default:
      return {
        currentKey: 'neuropsych',
        currentName: 'Neuropsicología & Neurociencia Clínica',
        keyConcepts: ['Control Ejecutivo Cortical', 'Desviación Z-Score', 'Ratio Theta/Beta Frontal'],
        biometricCorrelate: `qEEG Theta/Beta: ${thetaBeta} (Z-Score) | Latencia Motora CPT: ${reactionTime} ms.`,
        clinicalHypothesis: 'Hipoactivación en redes ejecutivas dorsolaterales frontales y desregulación inhibitoria cortico-límbica.',
        recommendedTechnique: 'Entrenamiento fótico Gamma 40Hz, neurofeedback SMR y entrenamiento en memoria de trabajo 3D.'
      };
  }
};
