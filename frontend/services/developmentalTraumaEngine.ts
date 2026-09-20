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
 * Genera la configuración optimizada para el entorno de la Pico Neo 3 basada en edad y trauma
 */
export const calculateAdaptedProgram = (
  age: number,
  traumaType: TraumaTypology
): AdaptedProgramConfig => {
  // 1. Clasificación por Etapa Evolutiva
  let stage: DevelopmentalStage = 'EARLY_ADULT';
  if (age < 12) stage = 'CHILDHOOD';
  else if (age >= 12 && age < 18) stage = 'ADOLESCENCE';
  else if (age >= 18 && age < 36) stage = 'EARLY_ADULT';
  else if (age >= 36 && age < 65) stage = 'MATURE_ADULT';
  else stage = 'GERIATRIC';

  // 2. Matriz de Configuración Adaptativa
  switch (stage) {
    case 'CHILDHOOD':
      return {
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
        vrMotionSpeedMultiplier: 0.3, // Movimientos muy lentos y estables
        clinicalRationale: 'Sistemas límbicos infantiles requieren estimulación de alta seguridad visual sin brusquedad. Uso de metáforas lúdicas para evitar desorganización del apego.'
      };

    case 'ADOLESCENCE':
      return {
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

    case 'EARLY_ADULT':
      return {
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

    case 'MATURE_ADULT':
      return {
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

    case 'GERIATRIC':
      return {
        stage,
        stageNameEs: 'Geriátrico / Adulto Mayor (65+ años)',
        recommendedBinauralHz: 8.0, // Frecuencia Alfa para mantener la orientación espacial
        minBinauralHz: 7.0,
        maxBinauralHz: 10.0,
        visualMetaphorId: 'SERENE_CHRONICLE_ROOM',
        visualMetaphorNameEs: 'Habitación de Crónicas Serenas (Integración de Vida)',
        voiceStyle: 'SERENE_REASSURING',
        gsrSafetyThresholduS: 3.0,
        minHrvThresholdMs: 35,
        vrMotionSpeedMultiplier: 0.2, // Estático o sin movimiento de cámara
        clinicalRationale: 'Evita la estimulación desorientadora. Utiliza frecuencias Alfa para favorecer la integración del recuerdo sin compromiso cenestésico ni riesgo de mareo.'
      };
  }
};
