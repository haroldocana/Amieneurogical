// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR DE TRAUMA EVOLUTIVO Y ADAPTACIÓN HIPNO-VR
// ============================================================================

export type DevelopmentalStage = 
  | 'CHILDHOOD' 
  | 'ADOLESCENCE' 
  | 'EARLY_ADULT' 
  | 'MATURE_ADULT' 
  | 'GERIATRIC';

export type TraumaTypology = 
  | 'ATTACHMENT_DEVELOPMENTAL' // Trauma de Apego / Desarrollo Infantil
  | 'SINGLE_EVENT_ACUTE'       // Evento Único Agudo (Accidente / Agresión)
  | 'COMPLEX_REPETITIVE'       // Trauma Complejo Repetitivo (TEPT-C / CIE-11: 6B41)
  | 'INTERPERSONAL_ABUSE'      // Abuso Interpersonal / Violencia / Bullying
  | 'MEDICAL_SOMATIC'          // Trauma Médico / Dolor Somático Iatrogénico
  | 'LOSS_BEREAVEMENT';        // Duelo Traumático / Pérdida Paroxística

export type VoiceStyleType = 
  | 'PLAYFUL_PROTECTIVE' 
  | 'EMPOWERING_NEUTRAL' 
  | 'DIRECT_ERICKSONIAN' 
  | 'SOMATIC_VISCERAL' 
  | 'SERENE_REASSURING';

export type RecommendedEcosystemKey = 
  | 'WOMB_LIKE_CAVE'
  | 'PROTECTIVE_TREEHOUSE'
  | 'WARM_HEARTH'
  | 'CALM_BEACH_SUNSET'
  | 'SAFE_PLACE_FOREST'
  | 'ZEN_GARDEN'
  | 'BIOLUMINESCENT_BEACH';

export interface AdaptedProgramConfig {
  stage: DevelopmentalStage;
  stageNameEs: string;
  recommendedBinauralHz: number;
  maxBinauralHz: number;
  minBinauralHz: number;
  visualMetaphorId: string;
  visualMetaphorNameEs: string;
  recommendedEcosystemKey: RecommendedEcosystemKey;
  voiceStyle: VoiceStyleType;
  gsrSafetyThresholduS: number;  // Umbral crítico de interrupción autonómica
  minHrvThresholdMs: number;     // Tono vagal mínimo antes de inducir anclaje
  vrMotionSpeedMultiplier: number; // Factor cinemático para prevenir cinetosis
  clinicalRationale: string;
}

export interface TraumaMetadata {
  key: TraumaTypology;
  labelEs: string;
  clinicalFocus: string;
}

export const TRAUMA_TYPOLOGIES_LIST: TraumaMetadata[] = [
  {
    key: 'ATTACHMENT_DEVELOPMENTAL',
    labelEs: 'Apego / Desarrollo (Infantil)',
    clinicalFocus: 'Heridas tempranas de sintonización y esquemas primarios de abandono.'
  },
  {
    key: 'COMPLEX_REPETITIVE',
    labelEs: 'TEPT Complejo (TEPT-C / Repetitivo)',
    clinicalFocus: 'Exposición acumulativa, hipervigilancia amigdalar y desregulación afectiva crónica.'
  },
  {
    key: 'SINGLE_EVENT_ACUTE',
    labelEs: 'Evento Único Agudo (Asalto / Accidente)',
    clinicalFocus: 'Desensibilización focal de memorias paroxísticas no integradas.'
  },
  {
    key: 'INTERPERSONAL_ABUSE',
    labelEs: 'Abuso Interpersonal / Bullying',
    clinicalFocus: 'Restauración de agencia, límites personales y autoeficacia corporal.'
  },
  {
    key: 'MEDICAL_SOMATIC',
    labelEs: 'Trauma Médico / Dolor Somático',
    clinicalFocus: 'Modulación de memoria nociceptiva y reactividad iatrogénica.'
  },
  {
    key: 'LOSS_BEREAVEMENT',
    labelEs: 'Duelo Traumático / Pérdida',
    clinicalFocus: 'Procesamiento de ruptura vincular e integración afectiva pacífica.'
  }
];

/**
 * Determina la etapa evolutiva garantizando defensividad ante valores anómalos
 */
export const getStageFromAge = (rawAge: number): DevelopmentalStage => {
  if (!Number.isFinite(rawAge) || rawAge <= 0) return 'EARLY_ADULT';
  if (rawAge < 12) return 'CHILDHOOD';
  if (rawAge < 18) return 'ADOLESCENCE';
  if (rawAge < 36) return 'EARLY_ADULT';
  if (rawAge < 65) return 'MATURE_ADULT';
  return 'GERIATRIC';
};

/**
 * Genera la configuración optimizada para el entorno VR basada en Edad y Tipología de Trauma
 */
export const calculateAdaptedProgram = (
  age: number,
  traumaType: TraumaTypology = 'COMPLEX_REPETITIVE'
): AdaptedProgramConfig => {
  // 1. Sanitización de Edad Biológica (Prevención de NaN / negativos / desbordamientos)
  const safeAge = Number.isFinite(age) ? Math.max(4, Math.min(105, age)) : 28;
  const stage = getStageFromAge(safeAge);

  // 2. Matriz de Configuración Base por Etapa Evolutiva
  let config: AdaptedProgramConfig;

  switch (stage) {
    case 'CHILDHOOD':
      config = {
        stage,
        stageNameEs: 'Infancia (4-11 años)',
        recommendedBinauralHz: 7.5,
        minBinauralHz: 6.5,
        maxBinauralHz: 9.0,
        visualMetaphorId: 'PROTECTIVE_SANCTUARY_3D',
        visualMetaphorNameEs: 'Santuario del Guardián Mágico (Jardín Protector)',
        recommendedEcosystemKey: 'PROTECTIVE_TREEHOUSE',
        voiceStyle: 'PLAYFUL_PROTECTIVE',
        gsrSafetyThresholduS: 2.5,
        minHrvThresholdMs: 40,
        vrMotionSpeedMultiplier: 0.3,
        clinicalRationale: 'Sistemas límbicos infantiles requieren estimulación de alta seguridad visual sin brusquedad. Uso de metáforas lúdicas para evitar desorganización del apego.'
      };
      break;

    case 'ADOLESCENCE':
      config = {
        stage,
        stageNameEs: 'Adolescencia (12-17 años)',
        recommendedBinauralHz: 6.5,
        minBinauralHz: 5.0,
        maxBinauralHz: 8.0,
        visualMetaphorId: 'IDENTITY_SHIELD_AVATAR',
        visualMetaphorNameEs: 'Escudo de Identidad y Reconfiguración de Agencia 6DoF',
        recommendedEcosystemKey: 'ZEN_GARDEN',
        voiceStyle: 'EMPOWERING_NEUTRAL',
        gsrSafetyThresholduS: 3.5,
        minHrvThresholdMs: 35,
        vrMotionSpeedMultiplier: 0.7,
        clinicalRationale: 'Enfoque centrado en la reconstrucción del Yo y la autonomía. Evita tonos paternalistas para no detonar reactividad defensiva.'
      };
      break;

    case 'EARLY_ADULT':
      config = {
        stage,
        stageNameEs: 'Adulto Joven (18-35 años)',
        recommendedBinauralHz: 5.2,
        minBinauralHz: 4.0,
        maxBinauralHz: 7.0,
        visualMetaphorId: 'EMDR_BILATERAL_SPHERE',
        visualMetaphorNameEs: 'Desensibilización Hipno-Bilateral (VR-HD 3D)',
        recommendedEcosystemKey: 'SAFE_PLACE_FOREST',
        voiceStyle: 'DIRECT_ERICKSONIAN',
        gsrSafetyThresholduS: 4.5,
        minHrvThresholdMs: 25,
        vrMotionSpeedMultiplier: 1.0,
        clinicalRationale: 'Máxima tolerancia a la inducción Theta profunda. Procesamiento enfocado en la deconstrucción de flashbacks de alta intensidad.'
      };
      break;

    case 'MATURE_ADULT':
      config = {
        stage,
        stageNameEs: 'Adulto Maduro (36-64 años)',
        recommendedBinauralHz: 4.8,
        minBinauralHz: 3.8,
        maxBinauralHz: 6.5,
        visualMetaphorId: 'SOMATIC_BODY_MAP_3D',
        visualMetaphorNameEs: 'Mapa Somático 3D y Disolución Nodal Traumática',
        recommendedEcosystemKey: 'WARM_HEARTH',
        voiceStyle: 'SOMATIC_VISCERAL',
        gsrSafetyThresholduS: 4.0,
        minHrvThresholdMs: 30,
        vrMotionSpeedMultiplier: 0.8,
        clinicalRationale: 'Aborda la huella somática del TEPT Complejo (C-PTSD) acumulado. Sincronización con el tono vagal para aliviar la carga alostática.'
      };
      break;

    case 'GERIATRIC':
    default:
      config = {
        stage,
        stageNameEs: 'Geriátrico / Adulto Mayor (65+ años)',
        recommendedBinauralHz: 8.0,
        minBinauralHz: 7.0,
        maxBinauralHz: 10.0,
        visualMetaphorId: 'SERENE_CHRONICLE_ROOM',
        visualMetaphorNameEs: 'Habitación de Crónicas Serenas (Integración de Vida)',
        recommendedEcosystemKey: 'BIOLUMINESCENT_BEACH',
        voiceStyle: 'SERENE_REASSURING',
        gsrSafetyThresholduS: 3.0,
        minHrvThresholdMs: 35,
        vrMotionSpeedMultiplier: 0.2,
        clinicalRationale: 'Evita la estimulación desorientadora. Utiliza frecuencias Alfa para favorecer la integración del recuerdo sin compromiso cinestésico ni riesgo de cinetosis.'
      };
      break;
  }

  // 3. Modulación Específica por Tipología de Trauma (Segunda Capa Bio-Adaptativa)
  switch (traumaType) {
    case 'ATTACHMENT_DEVELOPMENTAL':
      // Reducción preventiva del umbral GSR para evitar disociación silenciosa por abandono
      config.gsrSafetyThresholduS = Math.max(1.8, Number((config.gsrSafetyThresholduS - 0.5).toFixed(1)));
      config.recommendedEcosystemKey = 'WOMB_LIKE_CAVE';
      config.clinicalRationale += ' [Modulación Apego: Umbral GSR reducido para prevenir disociación severa por abandono. Refugio intrauterino asignado.]';
      break;

    case 'MEDICAL_SOMATIC':
      // Inducción hacia rango Theta/Delta bajo para analgesia neuro-visceral
      config.recommendedBinauralHz = Math.max(config.minBinauralHz, Number((config.recommendedBinauralHz - 0.8).toFixed(1)));
      config.voiceStyle = 'SOMATIC_VISCERAL';
      config.recommendedEcosystemKey = 'WARM_HEARTH';
      config.clinicalRationale += ' [Modulación Somática: Inducción de analgesia neuro-visceral y relajación muscular profunda.]';
      break;

    case 'COMPLEX_REPETITIVE':
      // Reducción cinemática para mitigar la hipervigilancia de la amígdala
      config.vrMotionSpeedMultiplier = Number((config.vrMotionSpeedMultiplier * 0.8).toFixed(2));
      config.clinicalRationale += ' [Modulación C-PTSD: Velocidad de cámara reducida para mitigar la hipervigilancia de la amígdala.]';
      break;

    case 'INTERPERSONAL_ABUSE':
      // Tono de empoderamiento y límites definidos sin imposición
      if (stage !== 'CHILDHOOD') {
        config.voiceStyle = 'EMPOWERING_NEUTRAL';
      }
      config.recommendedEcosystemKey = 'PROTECTIVE_TREEHOUSE';
      config.clinicalRationale += ' [Modulación Abuso: Tono narrativo de reafirmación de límites y agencia personal. Entorno de refugio elevado.]';
      break;

    case 'LOSS_BEREAVEMENT':
      config.voiceStyle = 'SERENE_REASSURING';
      config.recommendedEcosystemKey = 'BIOLUMINESCENT_BEACH';
      config.clinicalRationale += ' [Modulación Duelo: Enfoque en la consolidación afectiva y la integración del afecto atenuando el dolor agudo.]';
      break;

    case 'SINGLE_EVENT_ACUTE':
    default:
      config.recommendedEcosystemKey = 'SAFE_PLACE_FOREST';
      // Mantiene los valores basales calibrados por etapa de edad
      break;
  }

  return config;
};
