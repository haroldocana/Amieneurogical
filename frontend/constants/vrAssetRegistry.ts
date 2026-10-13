export interface VrEnvironmentAsset {
  id: string;
  name: string;
  clinicalModule: 'CLUSTER_B_FORENSIC' | 'PHOBIA_VRET' | 'HYPNOSIS' | 'SEXUAL_HEALTH_SES_SIS' | 'SYSTEMIC_COUPLE' | 'NEURO_TRAUMA' | 'TDAH';
  localAssetUrl: string;
  mediaType: 'IMAGE_360';
  description: string;
  targetCondition: string;
}

export interface VrVideoAsset {
  id: string;
  name: string;
  clinicalModule: 'CLUSTER_B_FORENSIC';
  localAssetUrl: string;
  mediaType: 'VIDEO_CLINICAL';
  description: string;
  targetCondition: string;
  triggerType: 'OVERT_PROVOCATION' | 'COLLAPSE' | 'DISTRESS';
}

// ============================================================================
// 1. LOS 19 ESCENARIOS 360° (/ecosystems/)
// ============================================================================
export const AMIE_CLINICAL_ENVIRONMENTS: VrEnvironmentAsset[] = [
  // Cluster B / Narcisismo
  {
    id: 'CLUSTER_B_COURTROOM',
    name: '01. Peritaje Forense Cluster B (Narcisismo / Gaslighting)',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/ecosystems/cluster_b_forensic.jpg', // 👈 .jpg
    mediaType: 'IMAGE_360',
    description: 'Sala de contrainterrogatorio pericial para evaluación de defensas narcisistas, disonancia y triada oscura.',
    targetCondition: 'Trastornos Cluster B (F60.81, F60.3)'
  },
  {
    id: 'STERILE_EXAMINATION_ROOM',
    name: '02. Sala Neutra de Evaluación Estéril',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/ecosystems/sterile_room.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Ambiente despojado de estímulos distractores para análisis pericial y registro microfacial.',
    targetCondition: 'Cluster B / Evaluación Forense'
  },

  // Salud Sexual / Modelo Dual SES-SIS
  {
    id: 'DUAL_CONTROL_SES_SIS',
    name: '03. Modelo Dual de Control Sexual (SES / SIS)',
    clinicalModule: 'SEXUAL_HEALTH_SES_SIS',
    localAssetUrl: '/ecosystems/dual_control.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Entorno de mediación neurosexual para desactivación de frenos inhibitorios (SIS) y estimulación (SES).',
    targetCondition: 'Disfunciones Sexuales / Inhibición Psicosomática'
  },
  {
    id: 'CLINICAL_OFFICE_CONSULT',
    name: '04. Despacho Clínico de Mediación y Pareja',
    clinicalModule: 'SYSTEMIC_COUPLE',
    localAssetUrl: '/ecosystems/clinical_office.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Espacio de encuadre profesional para sintonía diádica y abordaje sistémico relacional.',
    targetCondition: 'Terapia de Pareja y Disfunciones Relacionales'
  },

  // Fobias y VRET
  {
    id: 'ACROPHOBIA_HIGH_ROOF',
    name: '05. Azotea Escénica en Altura (VRET Acrofobia)',
    clinicalModule: 'PHOBIA_VRET',
    localAssetUrl: '/ecosystems/acrophobia_roof.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Plataforma con barandilla perimetral para exposición jerarquizada en niveles 1 a 10.',
    targetCondition: 'Fobia Específica: Alturas (F40.2)'
  },
  {
    id: 'AEROPHOBIA_FLIGHT_CABIN',
    name: '06. Cabina de Vuelo Comercial (VRET Aerofobia)',
    clinicalModule: 'PHOBIA_VRET',
    localAssetUrl: '/ecosystems/aerophobia_cabin.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Interior de aeronave presurizada para desensibilización a despegue, turbulencia y confinamiento.',
    targetCondition: 'Fobia a Volar (F40.2)'
  },

  // Hipnosis, Regulación & Grounding
  {
    id: 'NEURO_HYPNOSIS_TRANCE',
    name: '07. Vacío de Neurohipnosis & Trance Focalizado',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/neuro_hypnosis.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Matriz lumínica concéntrica para inducción rápida y sincronización de ritmo respiratorio a 0.1 Hz.',
    targetCondition: 'Desregulación Autonómica / Dolor Psicógeno'
  },
  {
    id: 'BIOLUMINESCENT_OCEAN_BEACH',
    name: '08. Playa Bioluminiscente Marina (Grounding)',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/bioluminescent_beach.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Oleaje costero de baja frecuencia para amortiguación de taquicardia y aumento del tono vagal HRV.',
    targetCondition: 'Ataques de Pánico / Hiperactivación Basal'
  },
  {
    id: 'SAFE_FOREST_SANCTUARY',
    name: '09. Bosque de Espacio Seguro & Anclaje',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/safe_place_forest.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Entorno natural biofílico con filtrado de luz cenital para instalación de recursos de calma.',
    targetCondition: 'Ansiedad Generalizada (F41.1)'
  },
  {
    id: 'ZEN_GARDEN_REGULATION',
    name: '10. Jardín Zen de Contemplación y Enfoque',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/zen_garden.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Jardín seco japonés para respiración diafragmática guiada y modulación de GSR.',
    targetCondition: 'Estrés Agudo / Regulación Afectiva'
  },
  {
    id: 'WARM_HEARTH_CABIN',
    name: '11. Hogar de Chimenea Cálida & Contención',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/warm_hearth.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Luz cálida y textura leñosa para reducción de tono simpático y sensación de refugio térmico.',
    targetCondition: 'Depresión Mayor / Sensación de Vacío'
  },
  {
    id: 'WOMB_LIKE_CAVE_SAFETY',
    name: '12. Cueva Uterina de Contención Profunda',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/womb_like_cave.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Cúpula natural envolvente de bajo contraste para reducción de hipervigilancia extrema.',
    targetCondition: 'Trauma Complejo / Agorafobia Severa'
  },
  {
    id: 'COSMIC_STARS_EXPANSION',
    name: '13. Espacio Cósmico Estelar (Disociación Asistida)',
    clinicalModule: 'HYPNOSIS',
    localAssetUrl: '/ecosystems/cosmic_stars.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Perspectiva macroscópica de desidentificación del ego para reducción de rumiación obsesiva.',
    targetCondition: 'TOC / Ansiedad Existencial'
  },

  // Trauma, EMDR y Neurodesarrollo
  {
    id: 'EMDR_MEMORY_REPROCESS',
    name: '14. Cámara de Reprocesamiento EMDR & Movimiento Sacádico',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/emdr_memory.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Entorno de baja carga semántica optimizado para barridos sacádicos bilaterales de 1.2 a 1.5 Hz.',
    targetCondition: 'TEPT (F43.10) / Memorias Traumáticas'
  },
  {
    id: 'DEV_TRAUMA_ATTACHMENT',
    name: '15. Reparación de Trauma del Desarrollo & Apego',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/dev_trauma.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Escenario simbólico para reestructuración de esquemas tempranos desadaptativos y apego herido.',
    targetCondition: 'Trastornos de la Personalidad / Trauma Temprano'
  },
  {
    id: 'PROTECTIVE_TREEHOUSE_INNER_CHILD',
    name: '16. Casa del Árbol Protectora (Niño Interior)',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/protective_treehouse.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Refugio elevado y seguro para intervenciones en población infanto-juvenil o trabajo de partes.',
    targetCondition: 'Trauma Infantil / Disociación Estructural'
  },
  {
    id: 'FND_MIRROR_NEUROLOGICAL',
    name: '17. Sala de Terapia en Espejo (Neurología Funcional)',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/fnd_mirror.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Espejo corporal adaptativo para recalibración visuomotora en paresias y distonías funcionales.',
    targetCondition: 'Trastorno de Síntomas Neurológicos Funcionales (F44.4)'
  },
  {
    id: 'PAIN_MANAGEMENT_CHRONIC',
    name: '18. Desfocalización Somática de Dolor Crónico',
    clinicalModule: 'NEURO_TRAUMA',
    localAssetUrl: '/ecosystems/pain_management.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Inmersión analgésica por distracción atencional competitiva sobre corteza somatosensorial.',
    targetCondition: 'Fibromialgia / Dolor Crónico Neuropático'
  },
  {
    id: 'TDAH_EXECUTIVE_LAB',
    name: '19. Laboratorio de Funciones Ejecutivas TDAH',
    clinicalModule: 'TDAH',
    localAssetUrl: '/ecosystems/tdah_executive.jpeg',
    mediaType: 'IMAGE_360',
    description: 'Aula/Laboratorio con distractores controlados para tests continuos de rendimiento (CPT).',
    targetCondition: 'TDAH (F90.0) / Déficit Ejecutivo'
  }
];

// ============================================================================
// 2. VIDEOS CLÍNICOS DE PROVOCACIÓN Y NARCISISMO (/video/)
// ============================================================================
export const AMIE_CLINICAL_VIDEOS: VrVideoAsset[] = [
  {
    id: 'OVERT_PROVOCATION_VIDEO',
    name: 'Provocación Directa al Ego (Overt Provocation)',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/video/overt_provocation.mp4',
    mediaType: 'VIDEO_CLINICAL',
    description: 'Estímulo audiovisual de confrontación directa para medir umbral de ira narcisista y descompensación simpática.',
    targetCondition: 'Narcisismo Manifiesto / Cluster B',
    triggerType: 'OVERT_PROVOCATION'
  },
  {
    id: 'NARCISSISM_COLLAPSE_VIDEO',
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
    name: 'Distrés Antisocial & Falta de Empatía (Antisocial Distress)',
    clinicalModule: 'CLUSTER_B_FORENSIC',
    localAssetUrl: '/video/antisocial_distress.mp4',
    mediaType: 'VIDEO_CLINICAL',
    description: 'Exposición a dilemas de dolor ajeno para medir respuesta autonómica (embotamiento afectivo vs reactividad fisiológica).',
    targetCondition: 'Rasgos Psicopáticos / Trastorno Antisocial (F60.2)',
    triggerType: 'DISTRESS'
  }
];

export const getEnvironmentAssetById = (envId: string): VrEnvironmentAsset => {
  return AMIE_CLINICAL_ENVIRONMENTS.find(e => e.id === envId) || AMIE_CLINICAL_ENVIRONMENTS[0];
};

export const getVideoAssetById = (videoId: string): VrVideoAsset => {
  return AMIE_CLINICAL_VIDEOS.find(v => v.id === videoId) || AMIE_CLINICAL_VIDEOS[0];
};
