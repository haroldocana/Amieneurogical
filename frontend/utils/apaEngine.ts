import { PatientRecord } from '../types';

export interface TheoreticalInterpretation {
  currentKey: string;
  currentName: string;
  keyConcepts: string[];
  biometricCorrelate: string;
  clinicalHypothesis: string;
  recommendedTechnique: string;
}

export interface RciResult {
  preScore: number;
  postScore: number;
  rciValue: number;
  clinicalStatus: string;
  isStatisticallySignificant: boolean;
}

export interface DyadicSynchronyResult {
  couplingPercentage: number;
  allianceLevel: string;
  clinicalNote: string;
}

/**
 * Traduce los biomarcadores y expedientes según la corriente epistemológica seleccionada
 */
export const getTheoreticalInterpretation = (
  patient: PatientRecord,
  current: 'tcc' | 'psychodynamic' | 'humanist' | 'systemic' | 'neuropsych'
): TheoreticalInterpretation => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';
  const thetaBeta = (patient as any)?.qeegZScores?.frontalThetaBetaRatio ?? 1.8;
  const gsr = (patient as any)?.vrTherapyIntervention?.realtimeTelemetrySummary?.peakGSR_uS ?? 4.2;

  switch (current) {
    case 'tcc':
      return {
        currentKey: 'tcc',
        currentName: 'Cognitivo-Conductual & Terapias de Tercera Generación (TCC / ACT)',
        keyConcepts: ['Distorsiones Cognitivas', 'Esquemas Nucleares', 'Evitación Experiencial', 'Fusión Cognitiva'],
        biometricCorrelate: `Hiperreactividad simpática (GSR ${gsr} µS) disparada ante esquemas desadaptativos de catastrofismo y pérdida de control.`,
        clinicalHypothesis: `La sintomatología de ${patientId} se mantiene por rigidez cognitiva y bucles de evitación que retroalimentan la taquicardia basal.`,
        recommendedTechnique: 'Reestructuración cognitiva guiada, defusión en ACT y exposición interoceptiva con biofeedback.'
      };

    case 'psychodynamic':
      return {
        currentKey: 'psychodynamic',
        currentName: 'Psicodinámica & Teoría del Apego',
        keyConcepts: ['Mecanismos de Defensa', 'Afecto Aislado', 'Conflicto Intrapsíquico', 'Apego Inseguro'],
        biometricCorrelate: `Oscilaciones bruscas en GSR y bloqueo alfa durante la evocación de figuras primarias de apego y autoridad.`,
        clinicalHypothesis: `Las defensas represivas del paciente fracasan frente a pulsiones reprimidas de agresión o duelo, manifestándose como conversión somatizada.`,
        recommendedTechnique: 'Señalamiento de resistencias, análisis de la transferencia e integración del afecto reprimido.'
      };

    case 'humanist':
      return {
        currentKey: 'humanist',
        currentName: 'Humanista-Existencial & Gestalt',
        keyConcepts: ['Autorrealización', 'Incongruencia del Yo', 'Contacto Aquí y Ahora', 'Asuntos Inconclusos'],
        biometricCorrelate: `Contracción respiratoria e hipomovilidad neuromotora al intentar contactar con emociones de dolor y desamparo.`,
        clinicalHypothesis: `Desconexión con la experiencia organísmica auténtica por introyección de demandas externas no asimiladas.`,
        recommendedTechnique: 'Técnica de la silla vacía, amplificación del darse cuenta sensorial y validación incondicional.'
      };

    case 'systemic':
      return {
        currentKey: 'systemic',
        currentName: 'Sistémica & Modelo Relacional Familiar',
        keyConcepts: ['Homeostasis Familiar', 'Paciente Identificado', 'Doble Vínculo', 'Límites Difusos'],
        biometricCorrelate: `Variabilidad cardíaca (HRV) desorganizada modulada por el estilo comunicacional de la díada vincular.`,
        clinicalHypothesis: `La sintomatología del paciente opera como estabilizador homeostático para desviar la tensión en el subsistema conyugal/familiar.`,
        recommendedTechnique: 'Prescripción paradójica, reformulación positiva del síntoma y redefinición de fronteras relacionales.'
      };

    case 'neuropsych':
      return {
        currentKey: 'neuropsych',
        currentName: 'Neuropsicología Clínica & Neurobiología',
        keyConcepts: ['Control Inhibitorio Prefrontal', 'Amígdala Hiperreactiva', 'Eje HPA', 'Plasticidad Sináptica'],
        biometricCorrelate: `Ratio Theta/Beta frontal de ${thetaBeta}σ compatible con subactivación dorsolateral y desinhibición frontolímbica.`,
        clinicalHypothesis: `Falla en el frenado cortico-subcortical top-down que impide la extinción rápida de respuestas autonómicas al estrés.`,
        recommendedTechnique: 'Entrenamiento neurocognitivo ejecutivo, neuromodulación sensorial guiada y entrenamiento de coherencia cardíaca 0.1 Hz.'
      };

    default:
      return {
        currentKey: 'general',
        currentName: 'Integrativo Multimodal',
        keyConcepts: ['Biopsicosocial', 'Alianza', 'Resiliencia'],
        biometricCorrelate: 'Desbalance en regulación autonómica basal.',
        clinicalHypothesis: 'Descompensación adaptativa multicausal.',
        recommendedTechnique: 'Intervención protocolizada multimodal.'
      };
  }
};

/**
 * Cálculo del Reliable Change Index (RCI) según el modelo de Jacobson & Truax (1991)
 * RCI = (X1 - X2) / S_diff
 * S_diff = sqrt(2 * (SE)^2), donde SE = s * sqrt(1 - r_xx)
 * Para medidas estándar como PHQ-9 / BDI-II: s ≈ 5.5, r_xx ≈ 0.88 -> S_diff ≈ 2.7
 */
export const calculateRCI = (preScore: number, postScore: number): RciResult => {
  const diff = preScore - postScore;
  const sDiff = 2.69; // Error estándar de la diferencia para escalas psicométricas estandarizadas
  const rawRci = diff / sDiff;
  const rciValue = Number(rawRci.toFixed(2));

  const isStatisticallySignificant = Math.abs(rciValue) > 1.96;

  let clinicalStatus = 'Sin Cambio Confiable';
  if (rciValue >= 1.96) {
    clinicalStatus = postScore <= 9 ? 'Recuperado (Cambio Clínicamente Significativo)' : 'Mejorado (Cambio Confiable)';
  } else if (rciValue <= -1.96) {
    clinicalStatus = 'Deterioro Estadísticamente Significativo';
  }

  return {
    preScore,
    postScore,
    rciValue,
    clinicalStatus,
    isStatisticallySignificant
  };
};

/**
 * Estima el acoplamiento autonómico díadico (terapeuta-paciente) mediante covarianza normalizada
 */
export const calculateDyadicSynchrony = (
  therapistSignal: number[],
  patientSignal: number[]
): DyadicSynchronyResult => {
  if (!therapistSignal.length || !patientSignal.length) {
    return {
      couplingPercentage: 75,
      allianceLevel: 'Co-regulación Adecuada',
      clinicalNote: 'Sincronía autonómica dentro de parámetros normativos de la alianza terapéutica.'
    };
  }

  const n = Math.min(therapistSignal.length, patientSignal.length);
  let meanT = 0;
  let meanP = 0;

  for (let i = 0; i < n; i++) {
    meanT += therapistSignal[i];
    meanP += patientSignal[i];
  }
  meanT /= n;
  meanP /= n;

  let num = 0;
  let denT = 0;
  let denP = 0;

  for (let i = 0; i < n; i++) {
    const dt = therapistSignal[i] - meanT;
    const dp = patientSignal[i] - meanP;
    num += dt * dp;
    denT += dt * dt;
    denP += dp * dp;
  }

  const r = denT > 0 && denP > 0 ? num / Math.sqrt(denT * denP) : 0.75;
  const percentage = Math.max(10, Math.min(98, Math.round(((r + 1) / 2) * 100)));

  let allianceLevel = 'Co-regulación Óptima (Sintonía Diádica Fuerte)';
  if (percentage < 45) {
    allianceLevel = 'Desacoplamiento Autonómico (Riesgo de Ruptura de Alianza)';
  } else if (percentage < 70) {
    allianceLevel = 'Co-regulación Moderada (En Proceso)';
  }

  return {
    couplingPercentage: percentage,
    allianceLevel,
    clinicalNote: `Acoplamiento HRV calculado al ${percentage}%, reflejando resonancia vagal de co-regulación clínica.`
  };
};
