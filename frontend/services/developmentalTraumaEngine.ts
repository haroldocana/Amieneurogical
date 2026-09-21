// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR DE TRAUMA EVOLUTIVO Y ADAPTACIÓN HIPNO-VR
// ============================================================================

export type DevelopmentalStage = 'CHILDHOOD' | 'ADOLESCENCE' | 'EARLY_ADULT' | 'MATURE_ADULT' | 'GERIATRIC';

export type TraumaTypology = 
  | 'ATTACHMENT_DEVELOPMENTAL' // Trauma de Apego / Desarrollo
  | 'SINGLE_EVENT_ACUTE'        // Evento Único Agudo (Accidente/Asalto)
  | 'COMPLEX_REPETITIVE'        // Trauma Complejo Repetitivo (TEPT-C)
  | 'INTERPERSONAL_ABUSE'       // Abuso Interpersonal / Bullying
  | 'MEDICAL_SOMATIC'           // Trauma Médico / Dolor Somático
  | 'LOSS_BEREAVEMENT';         // Duelo Traumático / Pérdida

export interface AdaptedProgramConfig {
  stage: DevelopmentalStage;
  stageNameEs: string;
  recommendedBinauralHz: number;
  maxBinauralHz: number;
  minBinauralHz: number;
  visualMetaphorId: string;
  visualMetaphorNameEs: string;
  voiceStyle: 'PLAYFUL_PROTECTIVE' | 'EMPOWERING_NEUTRAL' | 'DIRECT_ERICKSONIAN' | 'SOMATIC_VISCERAL' | 'SERENE_REASSURING';
  gsrSafetyThresholduS: number;  // Disparo de seguridad
  minHrvThresholdMs: number;
  vrMotionSpeedMultiplier: number; // Modificador de velocidad para evitar mareo cinetósico
  clinicalRationale: string;
}

/**
 * Genera la configuración optimizada para el entorno VR basada en Edad y Tipología de Trauma
 */
export const calculateAdaptedProgram = (
  age: number,
  traumaType: TraumaTypology = 'COMPLEX_REPETITIVE'
): AdaptedProgramConfig => {
  // 1. Clasificación por Etapa Evolutiva (Base)
  let stage: DevelopmentalStage = 'EARLY_ADULT';
  if (age < 12) stage = 'CHILDHOOD';
  else if (age >= 12 && age < 18) stage = 'ADOLESCENCE';
  else if (age >= 18 && age < 36) stage = 'EARLY_ADULT';
  else if (age >= 36 && age < 65) stage = 'MATURE_ADULT';
  else stage = 'GERIATRIC';

  // 2. Matriz de Configuración Base por Etapa
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
        visualMetaphorNameEs: 'Habitación de Crónicas Serenes (Integración de Vida)',
        voiceStyle: 'SERENE_REASSURING',
        gsrSafetyThresholduS: 3.0,
        minHrvThresholdMs: 35,
        vrMotionSpeedMultiplier: 0.2,
        clinicalRationale: 'Evita la estimulación desorientadora. Utiliza frecuencias Alfa para favorecer la integración del recuerdo sin compromiso cenestésico ni riesgo de mareo.'
      };
      break;
  }

  // 3. Modulación Específica por Tipología de Trauma (Segunda Capa Bio-Adaptativa)
  switch (traumaType) {
    case 'ATTACHMENT_DEVELOPMENTAL':
      // Trauma de apego: Reduce el umbral de seguridad GSR para evitar disociación silenciosa
      config.gsrSafetyThresholduS = Math.max(1.8, +(config.gsrSafetyThresholduS - 0.5).toFixed(1));
      config.clinicalRationale += ' [Modulación Apego: Umbral GSR reducido para prevenir disociación severa por abandono.]';
      break;

    case 'MEDICAL_SOMATIC':
      // Trauma somático/dolor: Inyecta frecuencias binaurales tendientes a Delta/Theta bajo
      config.recommendedBinauralHz = Math.max(config.minBinauralHz, +(config.recommendedBinauralHz - 0.8).toFixed(1));
      config.voiceStyle = 'SOMATIC_VISCERAL';
      config.clinicalRationale += ' [Modulación Somática: Inducción de analgesia neuro-visceral y relajación muscular profunda.]';
      break;

    case 'COMPLEX_REPETITIVE':
      // TEPT Complejo: Reduce la velocidad de movimiento para no detonar hipervigilancia
      config.vrMotionSpeedMultiplier = +(config.vrMotionSpeedMultiplier * 0.8).toFixed(2);
      config.clinicalRationale += ' [Modulación C-PTSD: Velocidad de cámara reducida para mitigar la hipervigilancia de la amígdala.]';
      break;

    case 'INTERPERSONAL_ABUSE':
      // Abuso interpersonal: Prioriza voces no autoritarias
      if (stage !== 'CHILDHOOD') config.voiceStyle = 'EMPOWERING_NEUTRAL';
      config.clinicalRationale += ' [Modulación Abuso: Tono narrativo de reafirmación de límites y agencia personal.]';
      break;

    case 'LOSS_BEREAVEMENT':
      config.voiceStyle = 'SERENE_REASSURING';
      config.clinicalRationale += ' [Modulación Duelo: Enfoque en la consolidación afectiva y la integración del afecto perdiendo el dolor agudo.]';
      break;

    case 'SINGLE_EVENT_ACUTE':
    default:
      // Mantiene los valores estándar calibrados por etapa de edad
      break;
  }

  return config;
};
