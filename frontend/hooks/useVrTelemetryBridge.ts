export type ClinicalModuleType = 
  | 'CLUSTER_B_FORENSIC' 
  | 'PHOBIA_VRET' 
  | 'HYPNOSIS' 
  | 'SEXUAL_HEALTH_SES_SIS' 
  | 'SYSTEMIC_COUPLE' 
  | 'NEURO_TRAUMA' 
  | 'TDAH'
  | 'TDM_DEPRESSION'
  | 'NEURO_DEGEN'
  | 'TEA_SOCIAL'
  | 'OPTO_NEUROMODULATION'
  | 'PAIN_MANAGEMENT';

export interface VrEnvironmentAsset {
  id: string;
  key: string;
  name: string;
  clinicalModule: ClinicalModuleType;
  localAssetUrl: string;
  mediaType: 'IMAGE_360';
  description: string;
  targetCondition: string;
}

export type VideoTriggerType = 
  | 'OVERT_PROVOCATION' 
  | 'COLLAPSE' 
  | 'DISTRESS' 
  | 'COVERT_REJECTION';

export interface VrVideoAsset {
  id: string;
  key: string;
  name: string;
  clinicalModule: 'CLUSTER_B_FORENSIC';
  localAssetUrl: string;
  mediaType: 'VIDEO_CLINICAL';
  description: string;
  targetCondition: string;
  triggerType: VideoTriggerType;
}

export type VrMediaAsset = VrEnvironmentAsset | VrVideoAsset;

// ============================================================================
// 1. ESCENARIOS 360° CLINICAMENTE ESTANDARIZADOS (.JPG MINÚSCULAS)
// ============================================================================
export const AMIE_CLINICAL_ENVIRONMENTS: VrEnvironmentAsset[] = [
  // --- CLUSTER B / NARCISISMO & EVALUACIÓN FORENSE ---
  {
    id: 'CLUSTER_B_COURTROOM',
    key: 'cluster_b_forensic',
    name: '01. Peritaje Forense Cluster B (Narcisismo / Gaslighting)',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/ecosystems/cluster_b_forensic.jpg',
    mediaType: 'IMAGE_360',
    description: 'Sala de contrainterrogatorio pericial para evaluación de defensas narcisistas, disonancia y tríada oscura.',
    targetCondition: 'Trastornos Cluster B (F60.81, F60.3)'
  },
  {
    id: 'STERILE_EXAMINATION_ROOM',
    key: 'sterile_room',
    name: '02. Sala Neutra de Evaluación Estéril',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/ecosystems/sterile_room.jpg',
    mediaType: 'IMAGE_360',
    description: 'Ambiente despojado de estímulos distractores para análisis pericial y registro microfacial.',
    targetCondition: 'Cluster B / Evaluación Forense'
  },
  {
    id: 'LOW_POLY_WHITE_ROOM',
    key: 'low_poly_white_room',
    name: '03. Sala Blanca Minimalista (Calibración Biocognitiva)',
    clinicalModule: 'TDM_DEPRESSION',
    localAssetUrl: '/ecosystems/low_poly_white_room.jpg',
    mediaType: 'IMAGE_360',
    description: 'Espacio de baja carga semántica para pruebas cinemáticas de temblor, latencia TDM y navegación.',
    targetCondition: 'Depresión Mayor (F32) / Deterioro Cognitivo (G30)'
  },

  // --- SALUD SEXUAL / MODELO DUAL SES-SIS & TERAPIA DE PAREJA ---
  {
    id: 'DUAL_CONTROL_SES_SIS',
    key: 'dual_control',
    name: '04. Modelo Dual de Control Sexual (SES / SIS)',
    clinicalModule: 'SEXUAL_HEALTH_SES_SIS',
    localAssetUrl: '/ecosystems/dual_control.jpg',
    mediaType: 'IMAGE_360',
    description: 'Entorno de mediación neurosexual para desactivación de frenos inhibitorios (SIS) y activación de deseo (SES).',
    targetCondition: 'Disfunciones Sexuales / Inhibición Psicosomática'
  },
  {
    id: 'CLINICAL_OFFICE_CONSULT',
    key: 'clinical_office',
    name: '05. Despacho Clínico de Mediación y Pareja',
    clinicalModule: 'SYSTEMIC_COUPLE',
    localAssetUrl: '/ecosystems/clinical_office.jpg',
    mediaType: 'IMAGE_360',
    description: 'Espacio de encuadre profesional para sintonía diádica, contacto ocular y abordaje relacional.',
    targetCondition: 'Terapia de Pareja y Disfunciones Relacionales'
  },

  // --- FOBIAS ESPECÍFICAS Y EXPOSICIÓN VRET ---
  {
    id: 'ACROPHOBIA_HIGH_ROOF',
    key: 'acrophobia_roof',
    name: '06. Azotea Escénica en Altura (VRET Acrofobia)',
    clinicalModule: 'PHOBIA_VRET',
    localAssetUrl: '/ecosystems/acrophobia_roof.jpg',
    mediaType: 'IMAGE_360',
    description: 'Plataforma con barandilla perimetral para exposición jerarquizada en niveles 1 a 10.',
    targetCondition: 'Fobia Específica: Alturas (F40.2)'
  },
  {
    id: 'AEROPHOBIA_FLIGHT_CABIN',
    key: 'aerophobia_cabin',
    name: '07. Cabina de Vuelo Comercial (VRET Aerofobia)',
    clinicalModule: 'PHOBIA_VRET',
    localAssetUrl: '/ecosystems/aerophobia_cabin.jpg',
    mediaType: 'IMAGE_360',
    description: 'Interior de aeronave presurizada para desensibilización a despegue, turbulencia y confinamiento.',
    targetCondition: 'Fobia a Volar (F40.2)'
  },

  // --- HIPNOSIS, REGULACIÓN Y GROUNDING ---
  {
    id: 'NEURO_HYPNOSIS_TRANCE',
    key: 'neuro_hypnosis',
    name: '08. Vacío de Neurohipnosis & Trance Focalizado',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/neuro_hypnosis.jpg',
    mediaType: 'IMAGE_360',
    description: 'Matriz lumínica concéntrica para inducción rápida y sincronización de ritmo respiratorio a 0.1 Hz.',
    targetCondition: 'Desregulación Autonómica / Dolor Psicógeno'
  },
  {
    id: 'ALPINE_SANCTUARY_MINIMAL',
    key: 'alpine_sanctuary',
    name: '09. Santuario Alpino Minimalista',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/alpine_sanctuary.jpg',
    mediaType: 'IMAGE_360',
    description: 'Refugio alpino de horizonte abierto para inducción Ericksoniana y grounding somático.',
    targetCondition: 'Trastorno de Ansiedad Generalizada / Neurohipnosis'
  },
  {
    id: 'BIOLUMINESCENT_OCEAN_BEACH',
    key: 'bioluminescent_beach',
    name: '10. Playa Bioluminiscente Marina (Grounding)',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/bioluminescent_beach.jpg',
    mediaType: 'IMAGE_360',
    description: 'Oleaje costero de baja frecuencia para amortiguación de taquicardia y aumento del tono vagal HRV.',
    targetCondition: 'Ataques de Pánico / Hiperactivación Basal'
  },
  {
    id: 'SAFE_FOREST_SANCTUARY',
    key: 'safe_place_forest',
    name: '11. Bosque de Espacio Seguro & Anclaje',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/safe_place_forest.jpg',
    mediaType: 'IMAGE_360',
    description: 'Entorno natural biofílico con filtrado de luz cenital para instalación de recursos de calma.',
    targetCondition: 'Ansiedad Generalizada (F41.1)'
  },
  {
    id: 'ZEN_GARDEN_REGULATION',
    key: 'zen_garden',
    name: '12. Jardín Zen de Contemplación y Enfoque',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/zen_garden.jpg',
    mediaType: 'IMAGE_360',
    description: 'Jardín seco japonés para respiración diafragmática guiada y modulación de GSR.',
    targetCondition: 'Estrés Agudo / Regulación Afectiva'
  },
  {
    id: 'WARM_HEARTH_CABIN',
    key: 'warm_hearth',
    name: '13. Hogar de Chimenea Cálida & Contención',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/warm_hearth.jpg',
    mediaType: 'IMAGE_360',
    description: 'Luz cálida y textura leñosa para reducción de tono simpático y sensación de refugio térmico.',
    targetCondition: 'Depresión Mayor / Sensación de Vacío'
  },
  {
    id: 'WOMB_LIKE_CAVE_SAFETY',
    key: 'womb_like_cave',
    name: '14. Cueva Uterina de Contención Profunda',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/womb_like_cave.jpg',
    mediaType: 'IMAGE_360',
    description: 'Cúpula natural envolvente de bajo contraste para reducción de hipervigilancia extrema.',
    targetCondition: 'Trauma Complejo / Agorafobia Severa'
  },
  {
    id: 'COSMIC_STARS_EXPANSION',
    key: 'cosmic_stars',
    name: '15. Espacio Cósmico Estelar (Disociación Asistida / Opto-Gamma)',
    clinicalModule: 'OPTO_NEUROMODULATION',
    localAssetUrl: '/ecosystems/cosmic_stars.jpg',
    mediaType: 'IMAGE_360',
    description: 'Perspectiva macroscópica para fotobiomodulación Gamma 40Hz y reducción de rumiación obsesiva.',
    targetCondition: 'TOC / Alzheimer / Desincronización Cortical'
  },
  {
    id: 'SNOW_CABIN_REFUGE',
    key: 'snow_cabin',
    name: '16. Cabaña Nevada con Chimenea',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/snow_cabin.jpg',
    mediaType: 'IMAGE_360',
    description: 'Ambiente térmico contrastante para regulación y reprocesamiento de memorias traumáticas.',
    targetCondition: 'TEPT / Duelo Traumático'
  },

  // --- TRAUMA, EMDR Y NEURODESARROLLO ---
  {
    id: 'EMDR_MEMORY_REPROCESS',
    key: 'emdr_memory',
    name: '17. Cámara de Reprocesamiento EMDR & Movimiento Sacádico',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/emdr_memory.jpg',
    mediaType: 'IMAGE_360',
    description: 'Entorno de baja carga semántica optimizado para barridos sacádicos bilaterales de 1.2 a 1.5 Hz.',
    targetCondition: 'TEPT (F43.10) / Memorias Traumáticas'
  },
  {
    id: 'DEV_TRAUMA_ATTACHMENT',
    key: 'dev_trauma',
    name: '18. Reparación de Trauma del Desarrollo & Apego',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/dev_trauma.jpg',
    mediaType: 'IMAGE_360',
    description: 'Escenario simbólico para reestructuración de esquemas tempranos desadaptativos y apego herido.',
    targetCondition: 'Trastornos de la Personalidad / Trauma Temprano'
  },
  {
    id: 'PROTECTIVE_TREEHOUSE_INNER_CHILD',
    key: 'protective_treehouse',
    name: '19. Casa del Árbol Protectora (Niño Interior)',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/protective_treehouse.jpg',
    mediaType: 'IMAGE_360',
    description: 'Refugio elevado y seguro para intervenciones en población infanto-juvenil o trabajo de partes.',
    targetCondition: 'Trauma Infantil / Disociación Estructural'
  },
  {
    id: 'FND_MIRROR_NEUROLOGICAL',
    key: 'fnd_mirror',
    name: '20. Sala de Terapia en Espejo (Neurología Funcional)',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/fnd_mirror.jpg',
    mediaType: 'IMAGE_360',
    description: 'Espejo corporal adaptativo para recalibración visuomotora en paresias y distonías funcionales.',
    targetCondition: 'Trastorno de Síntomas Neurológicos Funcionales (F44.4)'
  },
  {
    id: 'PAIN_MANAGEMENT_CHRONIC',
    key: 'pain_management',
    name: '21. Desfocalización Somática de Dolor Crónico',
    clinicalModule: 'PAIN_MANAGEMENT',
    localAssetUrl: '/ecosystems/pain_management.jpg',
    mediaType: 'IMAGE_360',
    description: 'Inmersión analgésica por distracción atencional competitiva sobre corteza somatosensorial.',
    targetCondition: 'Fibromialgia / Dolor Crónico Neuropático'
  },
  {
    id: 'TDAH_EXECUTIVE_LAB',
    key: 'tdah_executive',
    name: '22. Laboratorio de Funciones Ejecutivas TDAH',
    clinicalModule: 'TDAH',
    localAssetUrl: '/ecosystems/tdah_executive.jpg',
    mediaType: 'IMAGE_360',
    description: 'Aula/Laboratorio con distractores controlados para tests continuos de rendimiento (CPT).',
    targetCondition: 'TDAH (F90.0) / Déficit Ejecutivo'
  }
];

// ============================================================================
// 2. VIDEOS CLÍNICOS DE PROVOCACIÓN FORENSE Y NARCISISMO (/video/)
// ============================================================================
export const AMIE_CLINICAL_VIDEOS: VrVideoAsset[] = [
  {
    id: 'OVERT_PROVOCATION_VIDEO',
    key: 'overt_provocation',
    name: 'Provocación Directa al Ego (Overt Provocation)',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/video/overt_provocation.mp4',
    mediaType: 'VIDEO_CLINICAL',
    description: 'Estímulo audiovisual de confrontación directa para medir umbral de ira narcisista y descompensación simpática.',
    targetCondition: 'Narcisismo Manifiesto / Cluster B',
    triggerType: 'OVERT_PROVOCATION'
  },
  {
    id: 'COVERT_REJECTION_VIDEO',
    key: 'covert_rejection',
    name: 'Rechazo Social Encubierto (Covert Rejection)',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/video/covert_rejection.mp4',
    mediaType: 'VIDEO_CLINICAL',
    description: 'Dinámica de micro-desprecio y exclusión social para evaluar hipersensibilidad al rechazo y vergüenza tóxica.',
    targetCondition: 'Narcisismo Vulnerable / TLP',
    triggerType: 'COVERT_REJECTION'
  },
  {
    id: 'NARCISSISM_COLLAPSE_VIDEO',
    key: 'narcissism_collapse',
    name: 'Colapso Narcisista & Retiro de Refuerzo (Collapse)',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/video/narcissism_collapse.mp4',
    mediaType: 'VIDEO_CLINICAL',
    description: 'Simulación de pérdida de control y retirada de validación externa para evaluar micro-disociación y respuesta galvánica.',
    targetCondition: 'Narcisismo Encubierto / Desregulación Borderline',
    triggerType: 'COLLAPSE'
  },
  {
    id: 'ANTISOCIAL_DISTRESS_VIDEO',
    key: 'antisocial_distress',
    name: 'Distrés Antisocial & Falta de Empatía (Antisocial Distress)',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/video/antisocial_distress.mp4',
    mediaType: 'VIDEO_CLINICAL',
    description: 'Exposición a dilemas de dolor ajeno para medir respuesta autonómica (embotamiento afectivo vs reactividad fisiológica).',
    targetCondition: 'Rasgos Psicopáticos / Trastorno Antisocial (F60.2)',
    triggerType: 'DISTRESS'
  }
];

// ============================================================================
// 3. RESOLUTORES Y BÚSQUEDA POLIMÓRFICA RESILIENTE
// ============================================================================

/**
 * Busca un entorno 360° por ID, clave estandarizada o coincidencia parcial.
 * Si no encuentra coincidencia, retorna un entorno clínico seguro por defecto.
 */
export const getEnvironmentAssetById = (envId: string): VrEnvironmentAsset => {
  if (!envId) return AMIE_CLINICAL_ENVIRONMENTS[0];
  
  const query = envId.toLowerCase().trim().replace(/[\s-]+/g, '_');

  const found = AMIE_CLINICAL_ENVIRONMENTS.find(e => 
    e.id.toLowerCase() === query ||
    e.key.toLowerCase() === query ||
    e.localAssetUrl.toLowerCase().includes(query) ||
    query.includes(e.key.toLowerCase())
  );

  return found || AMIE_CLINICAL_ENVIRONMENTS[0];
};

/**
 * Busca un video clínico por ID, clave estandarizada o tipo de disparador.
 */
export const getVideoAssetById = (videoId: string): VrVideoAsset => {
  if (!videoId) return AMIE_CLINICAL_VIDEOS[0];

  const query = videoId.toLowerCase().trim().replace(/[\s-]+/g, '_');

  const found = AMIE_CLINICAL_VIDEOS.find(v => 
    v.id.toLowerCase() === query ||
    v.key.toLowerCase() === query ||
    v.triggerType.toLowerCase() === query ||
    v.localAssetUrl.toLowerCase().includes(query) ||
    query.includes(v.key.toLowerCase())
  );

  return found || AMIE_CLINICAL_VIDEOS[0];
};

/**
 * Resuelve cualquier recurso multimedia (video o imagen 360°) bajo un identificador unificado.
 */
export const resolveImmersionMedia = (identifier: string, isVideo = false): VrMediaAsset => {
  return isVideo ? getVideoAssetById(identifier) : getEnvironmentAssetById(identifier);
};
