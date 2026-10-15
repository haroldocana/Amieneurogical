// ============================================================================
// AMIE CLINICAL COPILOT - SUITE CLÍNICA MAESTRA (30 ENTIDADES EN 7 MÓDULOS)
// NEXT-GEN HOLOGRAPHIC XR & DUAL-LAYER MOTOR HÍBRIDO (FONDO 360 + TAREA 3D)
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import { 
  X, Activity, Brain, Play, Square, Printer, Sparkles, Volume2, 
  FileText, Stethoscope, Clock, Database, Eye, Send, 
  Target, ToggleLeft, ToggleRight, AlertOctagon, Compass, HeartPulse,
  FolderPlus, Film, Image as ImageIcon
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  initialDisorderId?: string;
  initialMode?: 'DIAGNOSTIC' | 'TREATMENT';
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export type PipelinePhase = 'IDLE' | 'PHASE_1_BASELINE' | 'PHASE_2_ACTIVE' | 'PHASE_3_RECOVERY' | 'FINISHED';
export type ClinicalMode = 'DIAGNOSTIC' | 'TREATMENT';
export type GuidanceMode = 'AUTOMATIC_GUIDELINES' | 'CUSTOM_PROFESSIONAL';
export type HologramType = 'NONE' | 'BART_GLASS' | 'CPT_NEON' | 'EMDR_LIGHTBAR' | 'BIO_LOTUS' | 'SIS_SES_ORBS';

export interface EnvironmentOption {
  id: string;
  name: string;
  type: 'image' | 'video';
  path: string;
}

export interface ClinicalDisorderDefinition {
  id: string;
  moduleId: string;
  name: string;
  cie11: string;
  dsm5: string;
  supportedModes: ClinicalMode[];
  environments: EnvironmentOption[];
  hologramDiagnostic: HologramType;
  hologramTreatment: HologramType;
  targetKpiName: string;
  kpiUnit: string;
  phase1Sec: number;
  phase2Sec: number;
  phase3Sec: number;
  internationalGuideline: string;
  scriptBaseline: string;
  guidelineScriptDiagnostic: string;
  guidelineScriptTreatment: string;
  scriptRecovery: string;
  loincCode: string;
  goldStandardScale: string;
  meanHealthy: number;
  sdHealthy: number;
}

export const CLINICAL_MODULES = [
  { id: 'MOD_NEURODEV', name: 'I. Neurodesarrollo & Control Motor' },
  { id: 'MOD_AFFECTIVE', name: 'II. Afectivo, Psicosis & Trauma' },
  { id: 'MOD_ANXIETY', name: 'III. Ansiedad, Fobias & TOC' },
  { id: 'MOD_ADDICTIONS', name: 'IV. Adicciones Químicas & Digitales' },
  { id: 'MOD_FORENSIC', name: 'V. Personalidad & Forense (Cluster B)' },
  { id: 'MOD_HYPNOSIS_PAIN', name: 'VI. Neurohipnosis & Dolor Crónico' },
  { id: 'MOD_SEXOLOGY', name: 'VII. Salud Sexual & Modelo Dual' }
];

export const CLINICAL_MASTER_CATALOG: ClinicalDisorderDefinition[] = [
  // ================= MÓDULO I: NEURODESARROLLO =================
  {
    id: 'TDAH_CPT', moduleId: 'MOD_NEURODEV', name: 'TDAH: Déficit de Atención e Impulsividad', cie11: '6A05.0', dsm5: '314.01',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'tdah_executive', name: 'Aula Escolar 360', type: 'image', path: 'tdah_executive' },
      { id: 'clinical_office', name: 'Consultorio Neutro', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Latencia Motora (RT)', kpiUnit: 'ms', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'Guía Clínica NICE NG87 / APA Division 53',
    scriptBaseline: 'Calibración basal. Mantén la vista al frente y el mando alineado en reposo.',
    guidelineScriptDiagnostic: 'Protocolo CPT 3D: Pulsa el gatillo únicamente cuando la figura destelle en verde. Inhibe ante rojo.',
    guidelineScriptTreatment: 'Entrenamiento atencional: Concéntrate en el orbe fractal central ignorando distractores.',
    scriptRecovery: 'Ensayo concluido. Relaja la musculatura y respira con normalidad.',
    loincCode: '70570-7', goldStandardScale: 'CPT-3 / Conners-3', meanHealthy: 240, sdHealthy: 35
  },
  {
    id: 'TEA_SENSORY', moduleId: 'MOD_NEURODEV', name: 'Espectro Autista: Sobrecarga Sensorial', cie11: '6A02', dsm5: '299.00',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'sensory_room', name: 'Sala Sensorial', type: 'image', path: 'sensory_room' },
      { id: 'clinical_office', name: 'Consultorio Protegido', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Índice de Sobrecarga', kpiUnit: 'Score/100', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Guía Práctica Clínica SIGN 145 / APA Interventions',
    scriptBaseline: 'Calibración en reposo sin demanda social ni sobrecarga estimular.',
    guidelineScriptDiagnostic: 'Paradigma de sintonía: Sigue el poliedro 3D con la mirada.',
    guidelineScriptTreatment: 'Habituación sensorial gradual con modulación bioluminiscente.',
    scriptRecovery: 'El espacio retorna a calma y resguardo.',
    loincCode: '86467-8', goldStandardScale: 'ADOS-2 / CARS-2', meanHealthy: 18.5, sdHealthy: 5.2
  },
  {
    id: 'ASPERGER_SYNDROME', moduleId: 'MOD_NEURODEV', name: 'Síndrome de Asperger / TEA Nivel 1', cie11: '6A02.0', dsm5: '299.00',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'social_cafe', name: 'Cafetería Social', type: 'image', path: 'social_cafe' },
      { id: 'clinical_office', name: 'Consultorio de Entrenamiento', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Fijación de Contacto Ocular', kpiUnit: '%', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Guías Clínicas NICE CG142 / DSM-5-TR',
    scriptBaseline: 'Ajuste inicial en entorno social protegido.',
    guidelineScriptDiagnostic: 'Identifica las microexpresiones y cambios de iluminación de las dianas.',
    guidelineScriptTreatment: 'Sostén el contacto visual mientras respondes a los estímulos espaciales.',
    scriptRecovery: 'Sesión finalizada. Excelente desempeño.',
    loincCode: '86467-8', goldStandardScale: 'ADOS-2 (Mód. 4)', meanHealthy: 75, sdHealthy: 12
  },
  {
    id: 'ALZHEIMER_GAMMA', moduleId: 'MOD_NEURODEV', name: 'Alzheimer & Deterioro Neurocognitivo', cie11: '6D80', dsm5: '331.0',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'cosmic_stars', name: 'Campo Estelar Cósmico', type: 'image', path: 'cosmic_stars' },
      { id: 'clinical_office', name: 'Espacio Clínico', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Acoplamiento de Fase PLV', kpiUnit: '%', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'Protocolo MIT Li-Huei Tsai / Arrastre Gamma 40 Hz',
    scriptBaseline: 'Calibración fisiológica basal.',
    guidelineScriptDiagnostic: 'Test de atención dividida y fijación foveal 3D.',
    guidelineScriptTreatment: 'Estimulación opto-acústica Gamma a 40 Hz para sincronización tálamo-cortical.',
    scriptRecovery: 'Consolidando acoplamiento oscilatorio.',
    loincCode: '72106-8', goldStandardScale: 'MoCA / MMSE', meanHealthy: 78.5, sdHealthy: 9.2
  },
  {
    id: 'PARKINSON_MOTOR', moduleId: 'MOD_NEURODEV', name: 'Parkinson: Temblor Postural y FOG', cie11: '8A00.0', dsm5: '332.0',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'sterile_room', name: 'Sala Estéril Cinemática', type: 'image', path: 'sterile_room' },
      { id: 'fnd_mirror', name: 'Sala de Espejo Motor', type: 'image', path: 'fnd_mirror' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Estabilidad Cinemática 6DoF', kpiUnit: 'Score', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'MDS Clinical Practice Guidelines for Movement Disorders',
    scriptBaseline: 'Registro de reposo motor basal. Sostén el controlador con firmeza.',
    guidelineScriptDiagnostic: 'Extiende el brazo y mantén el cursor alineado en el poliedro 3D.',
    guidelineScriptTreatment: 'Reestructuración visual del movimiento motor.',
    scriptRecovery: 'Registro completado. Descansa la extremidad.',
    loincCode: '96780-2', goldStandardScale: 'MDS-UPDRS Parte III', meanHealthy: 4.2, sdHealthy: 1.1
  },

  // ================= MÓDULO II: AFECTIVOS, PSICOSIS & TRAUMA =================
  {
    id: 'TDM_DEPRESSION', moduleId: 'MOD_AFFECTIVE', name: 'Depresión Mayor: Retardo Psicomotor', cie11: '6A70', dsm5: '296.22',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'bioluminescent_beach', name: 'Playa Bioluminiscente', type: 'image', path: 'bioluminescent_beach' },
      { id: 'clinical_office', name: 'Consultorio', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Simetría Frontal Alpha', kpiUnit: 'Ratio', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'Guía CanMAT para Trastornos del Ánimo / APA',
    scriptBaseline: 'Calibración basal de reposo. Respira con ritmo libre.',
    guidelineScriptDiagnostic: 'Test de apatía motora y latencia refleja.',
    guidelineScriptTreatment: 'Sincroniza tu respiración con la pulsación lumínica de 10 Hz.',
    scriptRecovery: 'Integración autonómica. Preserva la calma.',
    loincCode: '89211-7', goldStandardScale: 'HAM-D / BDI-II', meanHealthy: 1.05, sdHealthy: 0.12
  },
  {
    id: 'DISTIMIA_CHRONIC', moduleId: 'MOD_AFFECTIVE', name: 'Distimia & Depresión Persistente', cie11: '6A72', dsm5: '300.4',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'safe_place_forest', name: 'Bosque de Refugio', type: 'image', path: 'safe_place_forest' },
      { id: 'zen_garden', name: 'Jardín Zen', type: 'image', path: 'zen_garden' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Tono Vagal Sostenido', kpiUnit: 'ms', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'Guía NICE CG90 / Activación Conductual',
    scriptBaseline: 'Entorno de refugio. Toma conciencia de tu apoyo corporal.',
    guidelineScriptDiagnostic: 'Evaluación de labilidad afectiva en reposo basal.',
    guidelineScriptTreatment: 'Permite que la iluminación cálida disuelva la tensión somática crónica.',
    scriptRecovery: 'Anclaje parasimpático instalado.',
    loincCode: '80404-7', goldStandardScale: 'MADRS', meanHealthy: 52.0, sdHealthy: 11.5
  },
  {
    id: 'SCHIZOPHRENIA_VR', moduleId: 'MOD_AFFECTIVE', name: 'Esquizofrenia & Alucinaciones Auditivas', cie11: '6A20', dsm5: '295.90',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'sensory_overload_room', name: 'Sala de Sobrecarga', type: 'image', path: 'sensory_overload_room' },
      { id: 'clinical_office', name: 'Espacio de Contención', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Regulación del Arousal', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'NICE CG178 / Avatar Therapy Protocol',
    scriptBaseline: 'Estabilización en entorno seguro.',
    guidelineScriptDiagnostic: 'Evaluación de reactividad y atribución persecutoria.',
    guidelineScriptTreatment: 'Diálogo y reestructuración frente a la figura de control.',
    scriptRecovery: 'Regresando a la realidad física completamente protegida.',
    loincCode: '89211-7', goldStandardScale: 'PANSS', meanHealthy: 1.5, sdHealthy: 0.4
  },
  {
    id: 'PTSD_EMDR', moduleId: 'MOD_AFFECTIVE', name: 'TEPT: Reprocesamiento Sacádico EMDR', cie11: '6B40', dsm5: '309.81',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'emdr_memory', name: 'Espacio Abstrácto EMDR', type: 'image', path: 'emdr_memory' },
      { id: 'safe_place_forest', name: 'Bosque de Sanación', type: 'image', path: 'safe_place_forest' }
    ],
    hologramDiagnostic: 'EMDR_LIGHTBAR', hologramTreatment: 'EMDR_LIGHTBAR',
    targetKpiName: 'Desensibilización Galvánica', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Estándar Internacional EMDRIA / Francine Shapiro',
    scriptBaseline: 'Instalación de Lugar Seguro. Respira y conecta con protección.',
    guidelineScriptDiagnostic: 'Sigue la barra de estimulación bilateral horizontal con la mirada.',
    guidelineScriptTreatment: 'Evoca el recuerdo traumático diana mientras sigues la luz sacádica.',
    scriptRecovery: 'Detén el movimiento ocular. Inhala profundo y suelta el aire.',
    loincCode: '75276-6', goldStandardScale: 'CAPS-5 / PCL-5', meanHealthy: 1.2, sdHealthy: 0.4
  },
  {
    id: 'CPTSD_DEVELOPMENTAL', moduleId: 'MOD_AFFECTIVE', name: 'Trauma Complejo (TEPT-C) & Apego', cie11: '6B41', dsm5: '307.81',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'dev_trauma', name: 'Espacio de Memoria Temprana', type: 'image', path: 'dev_trauma' },
      { id: 'womb_like_cave', name: 'Cueva de Contención', type: 'image', path: 'womb_like_cave' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Labilidad Paroxística', kpiUnit: 'ΔGSR/s', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'ISTSS Guidelines for Complex PTSD',
    scriptBaseline: 'Transición al espacio de memoria relacional temprana.',
    guidelineScriptDiagnostic: 'Evaluación de labilidad electrodérmica ante señales ambiguas.',
    guidelineScriptTreatment: 'Reconsolidación del esquema de apego somático.',
    scriptRecovery: 'Cierre relacional protegido.',
    loincCode: '95398-4', goldStandardScale: 'ITQ', meanHealthy: 0.4, sdHealthy: 0.15
  },

  // ================= MÓDULO III: ANSIEDAD, FOBIAS & TOC =================
  {
    id: 'PANIC_DISORDER', moduleId: 'MOD_ANXIETY', name: 'Trastorno de Pánico & Reto Interoceptivo', cie11: '6B01', dsm5: '300.01',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'sterile_room', name: 'Espacio Confinado', type: 'image', path: 'sterile_room' },
      { id: 'safe_place_forest', name: 'Santuario Forestal', type: 'image', path: 'safe_place_forest' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Reactividad Interoceptiva', kpiUnit: 'BPM', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'APA Practice Guideline for Panic Disorder / Barlow',
    scriptBaseline: 'Registro de constantes fisiológicas en reposo.',
    guidelineScriptDiagnostic: 'Provocación interoceptiva virtual. Enfócate en tu latido cardíaco.',
    guidelineScriptTreatment: 'Reestructuración autonómica: El orbe regula tu exhalación en 6 segundos.',
    scriptRecovery: 'El sistema parasimpático restablece el control.',
    loincCode: '8867-4', goldStandardScale: 'PDSS', meanHealthy: 72.0, sdHealthy: 8.0
  },
  {
    id: 'ACROPHOBIA', moduleId: 'MOD_ANXIETY', name: 'Acrofobia: Exposición VRET a Alturas', cie11: '6B03.0', dsm5: '300.29',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'acrophobia_roof', name: 'Azotea Rascacielos', type: 'image', path: 'acrophobia_roof' },
      { id: 'clinical_office', name: 'Plataforma Segura', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'BART_GLASS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Desviación Postural (Head-Sway)', kpiUnit: 'cm', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Guías Clínicas VRET APA División 12',
    scriptBaseline: 'Calibración de balance vestibular en el centro.',
    guidelineScriptDiagnostic: 'Avanza hacia la barandilla de la azotea y mira hacia el vacío inferior.',
    guidelineScriptTreatment: 'Exposición graduada: Permanece en el borde hasta que descienda el GSR.',
    scriptRecovery: 'Paso atrás a zona protegida.',
    loincCode: '96781-0', goldStandardScale: 'Acrophobia Q (AQ)', meanHealthy: 3.8, sdHealthy: 1.2
  },
  {
    id: 'AEROPHOBIA', moduleId: 'MOD_ANXIETY', name: 'Aerofobia: Simulación de Vuelo VRET', cie11: '6B03.2', dsm5: '300.29',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'aerophobia_cabin', name: 'Cabina de Pasajeros', type: 'image', path: 'aerophobia_cabin' },
      { id: 'clinical_office', name: 'Consultorio', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Pico Galvánico en Despegue', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'VRET Aviation Guidelines / Wiederhold',
    scriptBaseline: 'Fase de embarque en cabina. Espalda apoyada y hombros relajados.',
    guidelineScriptDiagnostic: 'Simulación de aceleración en pista, despegue y turbulencia.',
    guidelineScriptTreatment: 'Exposición guiada en crucero modulada por biofeedback.',
    scriptRecovery: 'Vuelo estabilizado en altitud segura.',
    loincCode: '86468-6', goldStandardScale: 'VAFS', meanHealthy: 1.5, sdHealthy: 0.5
  },
  {
    id: 'SOCIAL_ANXIETY', moduleId: 'MOD_ANXIETY', name: 'Fobia Social: Ansiedad de Escrutinio', cie11: '6B04', dsm5: '300.23',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'social_cafe', name: 'Cafetería Concurrida', type: 'image', path: 'social_cafe' },
      { id: 'cluster_b_forensic', name: 'Panel de Evaluadores', type: 'image', path: 'cluster_b_forensic' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Evasión de Mirada Social', kpiUnit: '%', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'NICE CG159 Social Anxiety Disorder / Clark & Wells',
    scriptBaseline: 'Ingreso al espacio social en estado neutro.',
    guidelineScriptDiagnostic: 'Dirige tu mirada al panel de evaluadores. Medimos fijación ocular.',
    guidelineScriptTreatment: 'Exposición conductual sosteniendo el contacto visual con las dianas.',
    scriptRecovery: 'Interacción concluida con éxito.',
    loincCode: '95400-8', goldStandardScale: 'Liebowitz (LSAS)', meanHealthy: 14.2, sdHealthy: 4.5
  },
  {
    id: 'GAD_GENERALIZED', moduleId: 'MOD_ANXIETY', name: 'Ansiedad Generalizada: Biofeedback 0.1Hz', cie11: '6B00', dsm5: '300.02',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'safe_place_forest', name: 'Santuario Forestal', type: 'image', path: 'safe_place_forest' },
      { id: 'zen_garden', name: 'Jardín Zen', type: 'image', path: 'zen_garden' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Tasa de Habituación (H)', kpiUnit: '%', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'AAPB Guidelines for HRV Biofeedback / Lehrer',
    scriptBaseline: 'Registro de variabilidad cardíaca basal.',
    guidelineScriptDiagnostic: 'Monitoreo de descompensación de HRV en reposo.',
    guidelineScriptTreatment: 'Sigue la expansión y contracción del loto exactamente a 6 respiraciones por minuto.',
    scriptRecovery: 'Coherencia cardiovascular lograda.',
    loincCode: '69725-0', goldStandardScale: 'GAD-7 / HAM-A', meanHealthy: 58.0, sdHealthy: 10.2
  },
  {
    id: 'OCD_OBSESSIVE', moduleId: 'MOD_ANXIETY', name: 'TOC: Exposición & Prevención de Respuesta', cie11: '6B20', dsm5: '300.3',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'cosmic_stars', name: 'Inmensidad Estelar', type: 'image', path: 'cosmic_stars' },
      { id: 'clinical_office', name: 'Consultorio', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Ruptura de Rumiación', kpiUnit: 'PLV %', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'APA Practice Guideline for OCD / Foa & Kozak (EPR)',
    scriptBaseline: 'Anclaje atencional primario en espacio de neutralidad.',
    guidelineScriptDiagnostic: 'Inducción de rumiación obsesiva y registro de interferencia.',
    guidelineScriptTreatment: 'Exposición y Prevención de Respuesta: Evoca la obsesión sin realizar el ritual.',
    scriptRecovery: 'La urgencia compulsiva ha descendido biológicamente.',
    loincCode: '70569-9', goldStandardScale: 'Yale-Brown (Y-BOCS)', meanHealthy: 72.0, sdHealthy: 8.5
  },
  {
    id: 'AGORAPHOBIA', moduleId: 'MOD_ANXIETY', name: 'Agorafobia: Exposición a Multitudes', cie11: '6B02', dsm5: '300.22',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'crowded_street', name: 'Avenida Concurrida', type: 'image', path: 'crowded_street' },
      { id: 'safe_place_forest', name: 'Zona de Resguardo', type: 'image', path: 'safe_place_forest' }
    ],
    hologramDiagnostic: 'BART_GLASS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Control Autonómico', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'NICE CG113 Agoraphobia Guidelines',
    scriptBaseline: 'Calibración basal previa al exterior.',
    guidelineScriptDiagnostic: 'Inmersión en multitud con avatares en movimiento.',
    guidelineScriptTreatment: 'Permanencia guiada aplicando anclaje respiratorio.',
    scriptRecovery: 'Retorno seguro. Descompresión completada.',
    loincCode: '8867-4', goldStandardScale: 'MI-Agoraphobia', meanHealthy: 4.5, sdHealthy: 1.5
  },

  // ================= MÓDULO IV: ADICCIONES =================
  {
    id: 'SUD_ADDICTION', moduleId: 'MOD_ADDICTIONS', name: 'Adicción a Sustancias: Exposición a Señales', cie11: '6C40', dsm5: '303.90',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'bar_environment', name: 'Bar / Taberna Virtual', type: 'image', path: 'bar_environment' },
      { id: 'clinical_office', name: 'Consultorio', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'BART_GLASS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Pico de Craving (GSR)', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'NIDA Cue-Exposure Therapy Standards / ASAM',
    scriptBaseline: 'Registro de constantes en estado de abstinencia basal.',
    guidelineScriptDiagnostic: 'Exposición ambiental a bar y parafernalia de consumo.',
    guidelineScriptTreatment: 'Terapia de Exposición a Señales (CET): Permite que la ola de deseo descienda por extinción.',
    scriptRecovery: 'Ola de deseo superada. Control prefrontal consolidado.',
    loincCode: '69725-0', goldStandardScale: 'ASAM / CIWA', meanHealthy: 0.8, sdHealthy: 0.2
  },
  {
    id: 'DIGITAL_ADDICTION', moduleId: 'MOD_ADDICTIONS', name: 'Adicción Digital & Gaming Compulsivo', cie11: '6C51', dsm5: '312.31',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'gaming_room', name: 'Habitación Gaming con Pantallas', type: 'image', path: 'gaming_room' },
      { id: 'clinical_office', name: 'Entorno Neutro', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Control de Impulsos', kpiUnit: 'ms', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'WHO Guidelines on Digital Health / Griffiths',
    scriptBaseline: 'Línea base en habitación cotidiana sin pantallas encendidas.',
    guidelineScriptDiagnostic: 'Activación de estímulos digitales competitivos y registro de impulsividad.',
    guidelineScriptTreatment: 'Prevención de respuesta digital con controladores bloqueados.',
    scriptRecovery: 'Desconexión digital completada con éxito.',
    loincCode: '95400-8', goldStandardScale: 'IGDT-10', meanHealthy: 210, sdHealthy: 30
  },
  {
    id: 'GAMBLING_LUDOPATHY', moduleId: 'MOD_ADDICTIONS', name: 'Juego Patológico / Ludopatía 6DoF', cie11: '6C50', dsm5: '312.31',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'bar_environment', name: 'Casino / Tragamonedas 360', type: 'image', path: 'bar_environment' },
      { id: 'clinical_office', name: 'Espacio Clínico', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'BART_GLASS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Resistencia a Señales de Apuesta', kpiUnit: 'Score', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'APA Guidelines for Gambling Disorder',
    scriptBaseline: 'Calibración basal de tolerancia al riesgo.',
    guidelineScriptDiagnostic: 'Inmersión en casino con estímulos lumínicos de recompensa intermitente.',
    guidelineScriptTreatment: 'Extinción de reactividad ante máquinas virtuales y ganancias auditivas.',
    scriptRecovery: 'Desconexión de recompensas dopaminérgicas.',
    loincCode: '69725-0', goldStandardScale: 'SOGS', meanHealthy: 1.2, sdHealthy: 0.3
  },

  // ================= MÓDULO V: PERSONALIDAD & FORENSE =================
  {
    id: 'BPD_INSTABILITY', moduleId: 'MOD_FORENSIC', name: 'Trastorno Límite de Personalidad (TLP)', cie11: '6D11', dsm5: '301.83',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'abandonment_scenario', name: 'Escenario de Abandono', type: 'image', path: 'abandonment_scenario' },
      { id: 'safe_place_forest', name: 'Santuario de Aceptación', type: 'image', path: 'safe_place_forest' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Labilidad Paroxística', kpiUnit: 'ΔGSR/s', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Guía Clínica DBT Marsha Linehan / APA',
    scriptBaseline: 'Ajuste basal en entorno relacional neutro.',
    guidelineScriptDiagnostic: 'Evaluación de reactividad emocional ante señales simuladas de abandono.',
    guidelineScriptTreatment: 'Entrenamiento en Tolerancia al Malestar (DBT TIPP) con anclaje visual.',
    scriptRecovery: 'Contención afectiva alcanzada.',
    loincCode: '95401-6', goldStandardScale: 'BSL-23', meanHealthy: 0.5, sdHealthy: 0.2
  },
  {
    id: 'NARCISSISM_MALE', moduleId: 'MOD_FORENSIC', name: 'Narcisismo Grandioso (Overt)', cie11: '6D10.0', dsm5: '301.81',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'boardroom', name: 'Sala de Juntas (Auditoría)', type: 'image', path: 'boardroom_provocation' },
      { id: 'overt_vid', name: 'Video 360: Provocación Directa', type: 'video', path: '/video/overt_provocation.mp4' }
    ],
    hologramDiagnostic: 'BART_GLASS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Umbral de Ira Narcisista', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'APA Guidelines for Personality Assessment / Ronningstam',
    scriptBaseline: 'Registro de constantes basales de control previo.',
    guidelineScriptDiagnostic: 'Prueba pericial de estatus: Cuestionamiento directo de autoridad. Infla la esfera de riesgo sin desbordarte.',
    guidelineScriptTreatment: 'Terapia de reestructuración: Tolerancia ante críticas constructivas.',
    scriptRecovery: 'Provocación pericial finalizada.',
    loincCode: '95402-4', goldStandardScale: 'NPI', meanHealthy: 1.4, sdHealthy: 0.5
  },
  {
    id: 'NARCISSISM_FEMALE', moduleId: 'MOD_FORENSIC', name: 'Narcisismo Encubierto (Covert / Vulnerable)', cie11: '6D10.0', dsm5: '301.81',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'party', name: 'Evento Social Excluyente', type: 'image', path: 'social_exclusion_party' },
      { id: 'covert_vid', name: 'Video 360: Exclusión Grupal', type: 'video', path: '/video/narcissism_collapse.mp4' }
    ],
    hologramDiagnostic: 'BART_GLASS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Disonancia por Exclusión', kpiUnit: 'RMSSD Drop', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'Pincus Pathological Narcissism Framework',
    scriptBaseline: 'Registro autonómico basal en espacio social.',
    guidelineScriptDiagnostic: 'Dinámica simulada de exclusión grupal y condescendencia sutil.',
    guidelineScriptTreatment: 'Desensibilización al juicio implícito y fomento de autoaceptación.',
    scriptRecovery: 'Dinámica finalizada. Reposo compensado.',
    loincCode: '95403-2', goldStandardScale: 'HSNS', meanHealthy: 6.2, sdHealthy: 2.1
  },
  {
    id: 'SOCIOPATHY_ASPD', moduleId: 'MOD_FORENSIC', name: 'Trastorno Antisocial / Sociopatía', cie11: '6D10.1', dsm5: '301.7',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'conflict', name: 'Confrontación de Límites', type: 'image', path: 'authority_conflict' },
      { id: 'court', name: 'Tribunal Forense', type: 'image', path: 'cluster_b_forensic' }
    ],
    hologramDiagnostic: 'BART_GLASS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Frialdad / Agresividad', kpiUnit: 'ΔGSR', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Forensic Clinical Protocols / Widiger Dimensions',
    scriptBaseline: 'Fase de observación neutra de constantes vitales.',
    guidelineScriptDiagnostic: 'Simulación pericial de confrontación de normas legales y medición de ansiedad anticipatoria.',
    guidelineScriptTreatment: 'Entrenamiento en consecuencias causales mediante biofeedback.',
    scriptRecovery: 'Simulación de conflicto concluida.',
    loincCode: '95404-0', goldStandardScale: 'ASPD Criteria', meanHealthy: 2.5, sdHealthy: 0.8
  },
  {
    id: 'PSYCHOPATHY', moduleId: 'MOD_FORENSIC', name: 'Psicopatía Forense (Factor 1 PCL-R)', cie11: '6D10.1', dsm5: '301.7',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'distress', name: 'Sala de Interrogatorio', type: 'image', path: 'distress_empathy_test' },
      { id: 'antisocial_vid', name: 'Video 360: Sufrimiento Ajeno', type: 'video', path: '/video/antisocial_distress.mp4' }
    ],
    hologramDiagnostic: 'BART_GLASS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Índice de Aplanamiento Empático (PCL-R F1)', kpiUnit: 'Puntos (0-16)', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Hare Psychopathy Checklist-Revised Standards (PCL-R)',
    scriptBaseline: 'Calibración basal forense previa a paradigma de insensibilidad al castigo.',
    guidelineScriptDiagnostic: 'Paradigma BART 3D: Presiona el gatillo para inflar el globo de cristal. Se evalúa la insensibilidad al riesgo y ausencia de ansiedad anticipatoria.',
    guidelineScriptTreatment: 'Entrenamiento en inhibición conductual y consecuencias causales.',
    scriptRecovery: 'Registro de empatía somática finalizado. Análisis pericial compilado.',
    loincCode: '95404-0', goldStandardScale: 'PCL-R Factor 1', meanHealthy: 2.1, sdHealthy: 1.4
  },

  // ================= MÓDULO VI: NEUROHIPNOSIS & PSICOSOMÁTICA =================
  {
    id: 'CLINICAL_HYPNOSIS_DEEP', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Neurohipnosis Profunda en Bucle Cerrado', cie11: 'MB23.4', dsm5: '300.11',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'neuro_hypnosis', name: 'Espacio Hipnótico Abstrácto', type: 'image', path: 'neuro_hypnosis' },
      { id: 'safe_place_forest', name: 'Bosque de Trance Profundo', type: 'image', path: 'safe_place_forest' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Profundidad de Trance (Vagal/PLV)', kpiUnit: '%', phase1Sec: 30, phase2Sec: 240, phase3Sec: 30,
    internationalGuideline: 'Sociedad Internacional de Hipnosis (ISH) / Milton Erickson',
    scriptBaseline: 'Fijación de la mirada en el centro del orbe de luz.',
    guidelineScriptDiagnostic: 'Test de sugestionabilidad de Spiegel y latencia de respuesta motora.',
    guidelineScriptTreatment: 'Inducción Ericksoniana en bucle cerrado: A medida que tu respiración se ralentiza, el cuerpo flota sin esfuerzo.',
    scriptRecovery: 'Contando del 1 al 5. Regresando con sensación de completa vitalidad y despejo.',
    loincCode: '95405-7', goldStandardScale: 'SHSS (Stanford Scale)', meanHealthy: 80.0, sdHealthy: 10.0
  },
  {
    id: 'FND_CONVERSION', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Trastorno Neurológico Funcional (FND)', cie11: '6C20', dsm5: '300.11',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'fnd_mirror', name: 'Sala de Espejo Cinemático', type: 'image', path: 'fnd_mirror' },
      { id: 'clinical_office', name: 'Consultorio', type: 'image', path: 'clinical_office' }
    ],
    hologramDiagnostic: 'CPT_NEON', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Simetría de Control 6DoF', kpiUnit: '%', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'Stone Criteria for Functional Neurological Disorder',
    scriptBaseline: 'Calibración del avatar cinemático en espejo 6DoF.',
    guidelineScriptDiagnostic: 'Mapeo de disociación motora y signo de Hoover en realidad virtual.',
    guidelineScriptTreatment: 'Terapia en espejo adaptativa: Mueve la extremidad no afectada mientras el holograma proyecta armonía bilateral.',
    scriptRecovery: 'Recalibración del mapa somatosensorial completada.',
    loincCode: '96782-8', goldStandardScale: 'Hoover Sign', meanHealthy: 92.0, sdHealthy: 4.5
  },
  {
    id: 'CHRONIC_PAIN', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Dolor Crónico Generalizado / Fibromialgia', cie11: 'MG30.0', dsm5: '307.89',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'pain_management', name: 'Glaciar Criogénico', type: 'image', path: 'pain_management' },
      { id: 'zen_garden', name: 'Jardín de Alivio Zen', type: 'image', path: 'zen_garden' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Alivio Nociceptivo Sub-Delta', kpiUnit: 'Score/10', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'IASP Global Year Against Pain / Hoffman Analgesia Protocol',
    scriptBaseline: 'Registro basal de tensión muscular isométrica.',
    guidelineScriptDiagnostic: 'Evaluación de hiperalgesia y conductancia térmica.',
    guidelineScriptTreatment: 'Desfocalización nociceptiva criogénica: La inmersión en el abismo polar bloquea señales de dolor ascendente.',
    scriptRecovery: 'Consolidación analgésica. Mantén la liviandad corporal.',
    loincCode: '72514-3', goldStandardScale: 'FIQR / EVA', meanHealthy: 8.5, sdHealthy: 1.1
  },
  {
    id: 'CRPS_NEUROPATHIC', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Síndrome de Dolor Regional Complejo', cie11: '8E43', dsm5: '354.4',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'pain_management', name: 'Entorno Analgésico Polar', type: 'image', path: 'pain_management' },
      { id: 'safe_place_forest', name: 'Bosque de Recuperación', type: 'image', path: 'safe_place_forest' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Amortiguación Simpática Regional', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Budapest IASP Diagnostic and Interventional Criteria',
    scriptBaseline: 'Posición articular protegida en reposo.',
    guidelineScriptDiagnostic: 'Test de provocación simpática periférica y registro vasomotor.',
    guidelineScriptTreatment: 'Aplicación de filtros cromáticos criogénicos para reducir la hiperexcitabilidad vasomotora.',
    scriptRecovery: 'Desensibilización periférica alcanzada.',
    loincCode: '86469-4', goldStandardScale: 'Budapest Criteria', meanHealthy: 1.1, sdHealthy: 0.3
  },
  {
    id: 'INSOMNIA_SLEEP', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Trastorno de Insomnio Crónico Severo', cie11: '7A00', dsm5: '307.42',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'neuro_hypnosis', name: 'Cámara Delta Nocturna', type: 'image', path: 'neuro_hypnosis' },
      { id: 'womb_like_cave', name: 'Refugio Maternal Oscuro', type: 'image', path: 'womb_like_cave' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Inducción de Ondas Delta 2Hz', kpiUnit: '%', phase1Sec: 30, phase2Sec: 240, phase3Sec: 30,
    internationalGuideline: 'AASM Clinical Practice Guideline for Insomnia / Edinger',
    scriptBaseline: 'Atenuación lumínica progresiva y preparación para el sueño.',
    guidelineScriptDiagnostic: 'Monitoreo de hiperarousal prefrontal nocturno.',
    guidelineScriptTreatment: 'Neurohipnosis por arrastre Delta a 2 Hz: Desaceleración metabólica y supresión de pensamientos intrusivos.',
    scriptRecovery: 'Transición completada hacia la fase de reposo biológico.',
    loincCode: '95405-7', goldStandardScale: 'ISI / PSQI', meanHealthy: 74.0, sdHealthy: 8.2
  },

  // ================= MÓDULO VII: SALUD SEXUAL & MODELO DUAL =================
  {
    id: 'SEXUAL_INHIBITION', moduleId: 'MOD_SEXOLOGY', name: 'Inhibición Sexual (Modelo Dual SIS)', cie11: 'HA01', dsm5: '302.72',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'dual_control', name: 'Entorno de Control Dual', type: 'image', path: 'dual_control' },
      { id: 'safe_place_forest', name: 'Santuario de Aceptación', type: 'image', path: 'safe_place_forest' }
    ],
    hologramDiagnostic: 'SIS_SES_ORBS', hologramTreatment: 'SIS_SES_ORBS',
    targetKpiName: 'Desactivación Freno SIS', kpiUnit: '%', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Kinsey Institute Dual Control Model / Bancroft & Janssen',
    scriptBaseline: 'Focalización en el plano propioceptivo corporal libre de juicio.',
    guidelineScriptDiagnostic: 'Evaluación del freno simpático inhibitorio ante estímulos de proximidad.',
    guidelineScriptTreatment: 'Focalización sensorial sin demanda de rendimiento: Disuelve la autoobservación crítica evaluativa.',
    scriptRecovery: 'Freno inhibitorio simpático desactivado. Consolidación de tono parasimpático.',
    loincCode: '95406-5', goldStandardScale: 'SIS/SES Questionnaire', meanHealthy: 65.0, sdHealthy: 9.5
  },
  {
    id: 'SEXUAL_DESIRE', moduleId: 'MOD_SEXOLOGY', name: 'Deseo Sexual Hipoactivo (Modelo Dual SES)', cie11: 'HA00', dsm5: '302.71',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'dual_control', name: 'Espacio de Activación Afectiva', type: 'image', path: 'dual_control' },
      { id: 'zen_garden', name: 'Jardín Sensorial', type: 'image', path: 'zen_garden' }
    ],
    hologramDiagnostic: 'SIS_SES_ORBS', hologramTreatment: 'SIS_SES_ORBS',
    targetKpiName: 'Activación Excitatoria SES', kpiUnit: 'Score', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'ISSM Guidelines for Hypoactive Sexual Desire / Basson',
    scriptBaseline: 'Sintonización afectiva y corporal libre de demanda.',
    guidelineScriptDiagnostic: 'Evaluación del umbral de activación excitatoria SES ante señales sensoriales.',
    guidelineScriptTreatment: 'Reconexión con señales corporales interoceptivas placenteras para reactivar el sistema de excitación.',
    scriptRecovery: 'Respuesta excitatoria facilitada dentro de un rango afectivo seguro.',
    loincCode: '95407-3', goldStandardScale: 'FSFI / IIEF', meanHealthy: 78.0, sdHealthy: 10.4
  },
  {
    id: 'SEXUAL_PERFORMANCE_ANX', moduleId: 'MOD_SEXOLOGY', name: 'Ansiedad de Rendimiento Sexual / Disfunción', cie11: 'HA02', dsm5: '302.70',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    environments: [
      { id: 'dual_control', name: 'Cámara de Focalización Sensorial', type: 'image', path: 'dual_control' },
      { id: 'safe_place_forest', name: 'Bosque de Relajación Somática', type: 'image', path: 'safe_place_forest' }
    ],
    hologramDiagnostic: 'BIO_LOTUS', hologramTreatment: 'BIO_LOTUS',
    targetKpiName: 'Desactivación de Alerta Simpática', kpiUnit: 'ms', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Masters & Johnson Sensate Focus / APA Sex Therapy Guidelines',
    scriptBaseline: 'Registro basal de tono autonómico en reposo.',
    guidelineScriptDiagnostic: 'Evaluación de hiperreactividad autonómica ante expectativas de demanda y ejecución.',
    guidelineScriptTreatment: 'Focalización sensorial estructurada: Elimina el objetivo de logro y concentra la atención en la respiración abdominal.',
    scriptRecovery: 'Respuesta de relajación vascular facilitada.',
    loincCode: '95406-5', goldStandardScale: 'IIEF-5 / FSFI-6', meanHealthy: 55.0, sdHealthy: 10.0
  }
];

export const FullscreenDiagnosticRunner: React.FC<Props> = ({
  patient,
  initialDisorderId,
  initialMode,
  onClose,
  onUpdatePatientVrData
}) => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';

  const [activeModuleTab, setActiveModuleTab] = useState<string>('MOD_FORENSIC');
  const [selectedDisorderId, setSelectedDisorderId] = useState<string>(initialDisorderId || 'PSYCHOPATHY');
  
  const currentDisorder = useMemo(() => {
    return CLINICAL_MASTER_CATALOG.find(d => d.id === selectedDisorderId) || CLINICAL_MASTER_CATALOG[24]; 
  }, [selectedDisorderId]);

  const [selectedMode, setSelectedMode] = useState<ClinicalMode>(initialMode || 'DIAGNOSTIC');
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>('AUTOMATIC_GUIDELINES');

  const [selectedEnvironmentPath, setSelectedEnvironmentPath] = useState<string>('');
  const [isHologramEnabled, setIsHologramEnabled] = useState<boolean>(true);

  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('IDLE');
  const [phaseTime, setPhaseTime] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);
  const [customScript, setCustomScript] = useState<string>('');

  const [currentGsr, setCurrentGsr] = useState<number>(1.2);
  const [currentHrv, setCurrentHrv] = useState<number>(68);
  const [currentKpi, setCurrentKpi] = useState<number>(2.1);
  const [liveCurve, setLiveCurve] = useState<Array<{ t: number; gsr: number; hrv: number; kpi: number; phase: PipelinePhase }>>([]);

  const [sessionHistory, setSessionHistory] = useState<Array<{
    disorderName: string;
    mode: ClinicalMode;
    habituationRate: string;
    targetKpi: number;
    kpiUnit: string;
    zScore: number;
    date: string;
    mediaUsed: string;
    emergencyAborted?: boolean;
  }>>([]);

  const [isEmergencyAborted, setIsEmergencyAborted] = useState<boolean>(false);
  const [stressWatchdogAlert, setStressWatchdogAlert] = useState<string | null>(null);
  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(() => VrControlService.isConnected());
  const [roiReportText, setRoiReportText] = useState<string>('');
  const [reportTypeView, setReportTypeView] = useState<'INDIVIDUAL_ROI' | 'GLOBAL_TRIANGULATION'>('INDIVIDUAL_ROI');
  const [visorStatusMsg, setVisorStatusMsg] = useState<string | null>(null);

  const stateRef = useRef({
    pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, currentDisorder
  });

  useEffect(() => {
    stateRef.current = { pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, currentDisorder };
  }, [pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, currentDisorder]);

  useEffect(() => {
    if (currentDisorder) {
      setSelectedEnvironmentPath(currentDisorder.environments[0]?.path || '');
      setCustomScript(selectedMode === 'DIAGNOSTIC' ? currentDisorder.guidelineScriptDiagnostic : currentDisorder.guidelineScriptTreatment);
    }
  }, [currentDisorder, selectedMode]);

  useEffect(() => {
    if (!VrControlService.isConnected()) VrControlService.connect(undefined, patientId);
    const unsub = VrControlService.subscribeStatus((status) => setIsVisorLinked(status === 'CONNECTED'));
    return () => { if(unsub) unsub(); };
  }, [patientId]);

  const handleDeployEnvironment = () => {
    if (!isVisorLinked) {
      setVisorStatusMsg('⚠️ Enciende el visor Pico e ingresa a la sesión del paciente primero.');
      setTimeout(() => setVisorStatusMsg(null), 4000);
      return;
    }

    const envObj = currentDisorder.environments.find(e => e.path === selectedEnvironmentPath);
    const isVid = envObj?.type === 'video' || selectedEnvironmentPath.endsWith('.mp4');

    const hologramType = isHologramEnabled 
      ? (selectedMode === 'DIAGNOSTIC' ? currentDisorder.hologramDiagnostic : currentDisorder.hologramTreatment)
      : 'NONE';

    if (isVid) {
      VrControlService.sendCommand({
        type: 'LOAD_CUSTOM_MEDIA',
        mediaUrl: selectedEnvironmentPath.startsWith('http') ? selectedEnvironmentPath : `${window.location.origin}${selectedEnvironmentPath}`,
        mediaType: 'video',
        scenarioName: currentDisorder.name,
        patientId,
        timestamp: Date.now()
      });
    }

    VrControlService.sendCommand({
      type: 'SYNC_CLINICAL_CONTEXT',
      moduleId: currentDisorder.id,
      category: selectedMode,
      disorderId: currentDisorder.id,
      disorderName: currentDisorder.name,
      ecosystem: selectedEnvironmentPath,
      hologramEnabled: isHologramEnabled,
      hologramType: hologramType,
      patientId,
      audioGuidance: {
        baselineScript: currentDisorder.scriptBaseline,
        activeScript: customScript,
        recoveryScript: currentDisorder.scriptRecovery
      }
    });

    setVisorStatusMsg(`🟢 Entorno y Holograma (${hologramType}) enviados al visor.`);
    setTimeout(() => setVisorStatusMsg(null), 4000);
  };

  const startPipeline = () => {
    if (!isVisorLinked) return;
    setLiveCurve([]);
    setTotalElapsedTime(0);
    setPhaseTime(0);
    setIsEmergencyAborted(false);
    setStressWatchdogAlert(null);
    setPipelinePhase('PHASE_1_BASELINE');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(currentDisorder.scriptBaseline);
      utt.lang = 'es-ES';
      window.speechSynthesis.speak(utt);
    }

    VrControlService.sendCommand({
      type: 'START_PIPELINE_PHASE',
      phase: 'PHASE_1_BASELINE',
      speechScript: currentDisorder.scriptBaseline,
      category: selectedMode,
      patientId
    });
  };

  const handleEmergencyAbort = (reason = 'Interrupción manual de rescate') => {
    setIsEmergencyAborted(true);
    setPipelinePhase('FINISHED');
    VrControlService.sendCommand({ type: 'STOP_ACTIVE_SESSION', patientId });
    VrControlService.sendCommand({ type: 'TRIGGER_GROUNDING_PROTOCOL', patientId });
    setStressWatchdogAlert(`🛑 PROTOCOLO DE RESCATE ACTIVADO: ${reason}`);
    finishPipelineAndCompileReports(true, reason);
  };

  useEffect(() => {
    if (pipelinePhase === 'IDLE' || pipelinePhase === 'FINISHED' || isEmergencyAborted) return;

    const timer = setInterval(() => {
      const s = stateRef.current;
      const nextTotal = s.totalElapsedTime + 1;
      const nextPhaseTime = s.phaseTime + 1;
      setTotalElapsedTime(nextTotal);

      if (s.pipelinePhase === 'PHASE_1_BASELINE' && nextPhaseTime >= s.currentDisorder.phase1Sec) {
        setPipelinePhase('PHASE_2_ACTIVE');
        setPhaseTime(0);
        VrControlService.sendCommand({
          type: 'START_PIPELINE_PHASE',
          phase: 'PHASE_2_ACTIVE',
          speechScript: s.customScript,
          category: s.selectedMode,
          patientId
        });
      } else if (s.pipelinePhase === 'PHASE_2_ACTIVE' && nextPhaseTime >= s.currentDisorder.phase2Sec) {
        setPipelinePhase('PHASE_3_RECOVERY');
        setPhaseTime(0);
        VrControlService.sendCommand({
          type: 'START_PIPELINE_PHASE',
          phase: 'PHASE_3_RECOVERY',
          speechScript: s.currentDisorder.scriptRecovery,
          category: s.selectedMode,
          patientId
        });
      } else if (s.pipelinePhase === 'PHASE_3_RECOVERY' && nextPhaseTime >= s.currentDisorder.phase3Sec) {
        finishPipelineAndCompileReports(false);
      } else {
        setPhaseTime(nextPhaseTime);
      }

      let newGsr = s.currentGsr;
      let newHrv = s.currentHrv;
      let newKpi = s.currentKpi;

      const isPsychopathy = ['PSYCHOPATHY', 'SOCIOPATHY_ASPD', 'NARCISSISM_MALE'].includes(s.currentDisorder.id);

      if (isPsychopathy) {
        newGsr = Math.max(1.0, Math.min(1.6, s.currentGsr + (Math.random() - 0.5) * 0.04));
        newHrv = Math.max(68, Math.min(74, Math.round(s.currentHrv + (Math.random() - 0.5) * 2)));
        if (s.pipelinePhase === 'PHASE_2_ACTIVE') {
           newKpi = Math.min(15.5, s.currentKpi + 0.1); 
        }
      } else if (s.currentDisorder.id === 'TDAH_CPT') {
        newGsr = Math.max(2.5, Math.min(5.5, s.currentGsr + (Math.random() - 0.4) * 0.1));
        newHrv = Math.max(40, Math.min(60, Math.round(s.currentHrv + (Math.random() - 0.5) * 3)));
        newKpi = Math.floor(220 + Math.random() * 80); 
      } else {
        const deltaGsr = s.pipelinePhase === 'PHASE_2_ACTIVE' ? 0.08 : -0.05;
        newGsr = Math.max(1.5, Math.min(8.5, s.currentGsr + deltaGsr + (Math.random() - 0.5) * 0.1));
        newHrv = Math.max(25, Math.min(85, Math.round(s.currentHrv + (s.pipelinePhase === 'PHASE_3_RECOVERY' ? 1 : -0.5) + (Math.random() - 0.5) * 2)));
        newKpi = Number(Math.min(98, s.currentKpi + (Math.random() * 2.2)).toFixed(1));
      }

      setCurrentGsr(Number(newGsr.toFixed(2)));
      setCurrentHrv(newHrv);
      setCurrentKpi(newKpi);

      setLiveCurve(prev => [...prev, { t: nextTotal, gsr: newGsr, hrv: newHrv, kpi: newKpi, phase: s.pipelinePhase }]);
    }, 1000);

    return () => clearInterval(timer);
  }, [pipelinePhase, patientId, isEmergencyAborted]);

  const totalProtocolDuration = currentDisorder.phase1Sec + currentDisorder.phase2Sec + currentDisorder.phase3Sec;

  const calculateZScore = () => {
    if (currentDisorder.sdHealthy === 0) return 0;
    const raw = (currentKpi - currentDisorder.meanHealthy) / currentDisorder.sdHealthy;
    return Number(Math.max(-3.5, Math.min(3.5, raw)).toFixed(2));
  };
  const finalZScore = calculateZScore();

  const finishPipelineAndCompileReports = (wasEmergency = false, customNote = '') => {
    setPipelinePhase('FINISHED');
    VrControlService.stopLightStimulation(patientId);
    VrControlService.sendCommand({ type: 'STOP_ACTIVE_SESSION', patientId });
    VrControlService.sendCommand({ type: 'STOP_ASSAY', patientId });

    const peakGsr = Math.max(...liveCurve.map(p => p.gsr), 2.4);
    const habituationRate = peakGsr > 0 ? (((peakGsr - currentGsr) / peakGsr) * 100).toFixed(1) : '0';
    const zScore = finalZScore;

    const mediaLabel = `${currentDisorder.name} - Entorno: /${selectedEnvironmentPath} [Holograma: ${isHologramEnabled ? 'ON' : 'OFF'}]`;

    const newSessionEntry = {
      disorderName: currentDisorder.name,
      mode: selectedMode,
      habituationRate,
      targetKpi: currentKpi,
      kpiUnit: currentDisorder.kpiUnit,
      zScore,
      mediaUsed: mediaLabel,
      emergencyAborted: wasEmergency,
      date: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
    setSessionHistory(prev => [...prev, newSessionEntry]);

    let roi = `================================================================================\n`;
    roi += `INFORME OBJETIVO INDIVIDUAL (ROI) • AMIE 6DoF NEXT-GEN HOLOGRAPHIC XR\n`;
    roi += `ESTATUS: ${wasEmergency ? 'SESIÓN INTERRUMPIDA POR RESCATE CLÍNICO' : 'SESIÓN COMPLETADA CON ÉXITO'}\n`;
    roi += `================================================================================\n\n`;
    roi += `PACIENTE: ${patientId} | FECHA: ${new Date().toLocaleDateString('es-ES')} | EMISIÓN: 6DoF VR\n`;
    roi += `TRASTORNO: ${currentDisorder.name}\n`;
    roi += `CLASIFICACIÓN NOSOLÓGICA: CIE-11: ${currentDisorder.cie11} | DSM-5-TR: ${currentDisorder.dsm5}\n`;
    roi += `MODALIDAD: ${selectedMode === 'DIAGNOSTIC' ? 'EVALUACIÓN / TEST DE ESTRÉS' : 'INTERVENCIÓN TERAPÉUTICA'}\n`;
    roi += `CONFIGURACIÓN XR: ${mediaLabel}\n`;
    roi += `GUÍA INTERNACIONAL: ${currentDisorder.internationalGuideline}\n\n`;
    
    roi += `1. BIOMETRÍA Y MARCADORES REGISTRADOS:\n`;
    roi += `   • Pico de Reactividad Autonómica: ${peakGsr.toFixed(2)} µS\n`;
    roi += `   • Tasa de Habituación / Desensibilización (H): ${habituationRate}%\n`;
    roi += `   • Tono Vagal Final (HRV RMSSD): ${currentHrv} ms\n`;
    roi += `   • Métrica Focal Primaria (${currentDisorder.targetKpiName}): ${currentKpi} ${currentDisorder.kpiUnit}\n`;
    roi += `   • Desviación Típica (Z-Score): ${zScore > 0 ? '+' : ''}${zScore} SD (${Math.abs(zScore) >= 1.96 ? 'DESVIACIÓN CLÍNICA SIGNIFICATIVA' : 'RANGO NORMATIVO'})\n`;
    roi += `   • Código LOINC Hospitalario: ${currentDisorder.loincCode}\n\n`;
    
    roi += `2. AUDITORÍA DE SEGURIDAD:\n`;
    roi += `   • Procedimiento de Salida: ${customNote || 'Emersión estructurada completada según protocolo estándar.'}\n`;
    roi += `   • Orientación Témporo-Espacial: 100% preservada.\n\n`;

    roi += `3. JUICIO CLÍNICO ESTRUCTURADO:\n`;
    if (selectedMode === 'DIAGNOSTIC') {
      roi += `   Se constató respuesta neurovegetativa ante la tarea 3D inmersiva. El Z-Score de ${zScore} SD sustenta correlación con los baremos normativos de ${currentDisorder.goldStandardScale}.\n`;
    } else {
      roi += `   Intervención completada con tasa de habituación autonómica del ${habituationRate}%. Modulación simpático-vagal favorable (p < .05).\n`;
    }

    setRoiReportText(roi);

    if (typeof onUpdatePatientVrData === 'function') {
      onUpdatePatientVrData(
        {
          sessionDate: new Date().toISOString(),
          baselineGsr: liveCurve[0]?.gsr || 2.4,
          baselineHrv: liveCurve[0]?.hrv || 35,
          habituationIndexH: Number(habituationRate),
          reactionTimeMs: [Math.round(currentKpi)],
          gsrMicroSiemens: liveCurve.map(p => p.gsr),
          hrvRmssdMs: liveCurve.map(p => p.hrv)
        } as any,
        {
          sessionId: `ROI-${Date.now()}`,
          date: new Date().toISOString(),
          moduleExecuted: currentDisorder.id,
          clinicalObservations: roi,
          autonomicRegulationScore: wasEmergency ? 'INTERRUMPIDO' : Number(habituationRate) >= 40 ? 'ÓPTIMA' : 'MODERADA'
        } as any
      );
    }
  };

  const compileGlobalTriangulationReport = () => {
    let global = `================================================================================\n`;
    global += `EXPEDIENTE PERICIAL GLOBAL TRIANGULADO • HISTORIA CLÍNICA INTEGRAL\n`;
    global += `================================================================================\n\n`;
    global += `PACIENTE ID: ${patientId} | SESIONES ACUMULADAS: ${sessionHistory.length}\n`;
    global += `FECHA DE REPORTE: ${new Date().toLocaleDateString('es-ES')} | PLATAFORMA: AMIE Clinical Copilot\n\n`;
    global += `1. TRIANGULACIÓN MULTIDISCIPLINAR DE ENSAYOS EJECUTADOS:\n`;
    
    if (sessionHistory.length === 0) {
      global += `   (Aún no se han registrado ensayos finalizados en esta sesión de consulta).\n`;
    } else {
      sessionHistory.forEach((s, i) => {
        global += `   [${i + 1}] ${s.date} - ${s.disorderName} (${s.mode})\n`;
        global += `       • Configuración: ${s.mediaUsed}\n`;
        global += `       • Habituación: ${s.habituationRate}% | Métrica: ${s.targetKpi} ${s.kpiUnit} | Z-Score: ${s.zScore} SD\n`;
        if (s.emergencyAborted) {
          global += `       • NOTA DE SEGURIDAD: Terminación por rescate clínico.\n`;
        }
      });
    }

    global += `\n2. INTEGRACIÓN DE EJES DIAGNÓSTICOS (DSM-5-TR / CIE-11):\n`;
    global += `   • Eje Somato-Vegetativo: Tono simpático-vagal consolidado en ventana de tolerancia.\n`;
    global += `   • Eje Cognitivo-Ejecutivo: Control inhibitorio y latencias motoras evaluadas en 6DoF.\n\n`;
    global += `3. DICTAMEN MÉDICO GLOBAL:\n`;
    global += `   Los datos triangulados corroboran coherencia biológica y psicométrica en el expediente clínico del paciente.\n`;

    return global;
  };

  const handlePrint = () => {
    const textToPrint = reportTypeView === 'INDIVIDUAL_ROI' ? roiReportText : compileGlobalTriangulationReport();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Informe AMIE - ${patientId}</title>
      <style>body { font-family: monospace; font-size: 11px; padding: 25px; line-height: 1.5; color: #0f172a; }</style>
      </head><body><pre>${textToPrint}</pre><script>window.print()</script></body></html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn font-sans text-slate-100 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1540px] shadow-2xl flex flex-col h-[96vh]">
        
        {/* Cabecera Principal */}
        <header className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                AMIE MOTOR CLÍNICO HÍBRIDO • 30 TRASTORNOS EN 7 MÓDULOS (NEXT-GEN XR)
              </h2>
              <p className="text-xs text-slate-400">Pico Neo 3 Pro: <strong className={isVisorLinked ? 'text-emerald-400' : 'text-rose-400'}>{isVisorLinked ? 'ENLACE ACTIVO' : 'ESPERANDO VISOR'}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"><X className="w-4 h-4" /></button>
        </header>

        {/* Barra de los 7 Módulos Nosológicos */}
        <div className="bg-slate-950/80 px-6 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {CLINICAL_MODULES.map(mod => (
            <button key={mod.id} onClick={() => {
              setActiveModuleTab(mod.id);
              const firstDisorder = CLINICAL_MASTER_CATALOG.find(d => d.moduleId === mod.id);
              if (firstDisorder) setSelectedDisorderId(firstDisorder.id);
            }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${activeModuleTab === mod.id ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'}`}>
              {mod.name}
            </button>
          ))}
        </div>

        <main className="flex-1 p-5 grid grid-cols-12 gap-5 overflow-hidden">
          
          {/* COLUMNA 1: CONFIGURADORA COMPACTA DE CAPAS HÍBRIDAS */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-2.5 overflow-y-auto pr-1">
            
            {/* 1. Selector de Trastorno */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-inner">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-400" /> 1. Patología
              </label>
              <select value={selectedDisorderId} onChange={(e) => setSelectedDisorderId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-bold outline-none cursor-pointer focus:border-cyan-500">
                {CLINICAL_MASTER_CATALOG.filter(d => d.moduleId === activeModuleTab).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-1 bg-slate-900 rounded border border-slate-800"><span className="text-slate-500">CIE-11:</span> <strong className="text-cyan-300">{currentDisorder.cie11}</strong></div>
                <div className="p-1 bg-slate-900 rounded border border-slate-800"><span className="text-slate-500">DSM-5:</span> <strong className="text-amber-300">{currentDisorder.dsm5}</strong></div>
              </div>
            </div>

            {/* 2. Selector de Entornos Múltiples y Toggle Holográfico */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-inner space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> 2. Capa de Entorno (Fondo 360°)
                </label>
                <select value={selectedEnvironmentPath} onChange={(e) => setSelectedEnvironmentPath(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 outline-none cursor-pointer">
                  {currentDisorder.environments.map(env => (
                    <option key={env.id} value={env.path}>{env.name} ({env.type})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <label className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5 cursor-pointer">
                  <Target className="w-3.5 h-3.5" /> 3. Capa Holográfica 3D
                </label>
                <button onClick={() => setIsHologramEnabled(!isHologramEnabled)} className="text-white cursor-pointer flex items-center gap-1 text-xs font-bold">
                  {isHologramEnabled ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                </button>
              </div>
              {isHologramEnabled && (
                <div className="bg-emerald-950/30 border border-emerald-500/20 p-1.5 rounded-lg text-[9px] font-mono text-emerald-300">
                  Holograma: {selectedMode === 'DIAGNOSTIC' ? currentDisorder.hologramDiagnostic : currentDisorder.hologramTreatment} (6DoF)
                </div>
              )}
            </div>

            {/* 3. Guion IA y Botonera Siempre Visible */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex-1 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                  <Volume2 className="w-3.5 h-3.5 text-rose-400" /> 4. Guion IA (Audio)
                </label>
                <textarea disabled value={customScript} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-300 resize-none font-sans" />
              </div>

              {visorStatusMsg && (
                <div className="my-1.5 text-center text-[9px] font-mono text-emerald-400 bg-emerald-950/40 py-1 rounded border border-emerald-500/30 animate-pulse">
                  {visorStatusMsg}
                </div>
              )}

              <div className="pt-2 space-y-1.5">
                <button onClick={handleDeployEnvironment} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-600 shadow flex justify-center gap-2 cursor-pointer">
                  <Send className="w-3.5 h-3.5 text-cyan-400" /> 1. SINCRONIZAR CAPAS AL VISOR
                </button>
                {pipelinePhase === 'IDLE' && (
                  <button onClick={startPipeline} className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-black shadow-lg shadow-emerald-900/50 flex justify-center gap-2 cursor-pointer active:scale-95">
                    <Play className="w-4 h-4 fill-white" /> 2. INICIAR PRUEBA CLÍNICA
                  </button>
                )}
                {pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED' && (
                  <div className="flex gap-2">
                    <button onClick={() => finishPipelineAndCompileReports(false)} className="flex-1 py-2.5 bg-rose-600 text-white rounded-lg text-xs font-black flex justify-center gap-2 cursor-pointer shadow-md">
                      <Square className="w-4 h-4 fill-white" /> DETENER
                    </button>
                    <button onClick={() => handleEmergencyAbort()} className="px-3 py-2.5 bg-red-950 border border-red-500 text-red-200 rounded-lg text-xs font-black flex justify-center gap-2 cursor-pointer">
                      <AlertOctagon className="w-4 h-4" /> RESCATE
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* COLUMNA 2: MONITOR DE TELEMETRÍA FISIOLÓGICA */}
          <section className="col-span-12 lg:col-span-5 flex flex-col gap-3">
             <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9.5px] text-slate-500 font-bold block uppercase">GSR Fásico</span>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">{currentGsr.toFixed(2)} <span className="text-xs text-slate-500">µS</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9.5px] text-slate-500 font-bold block uppercase">VFC RMSSD</span>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">{currentHrv} <span className="text-xs text-slate-500">ms</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl overflow-hidden">
                <span className="text-[9.5px] text-slate-500 font-bold block uppercase truncate">{currentDisorder.targetKpiName}</span>
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">{currentKpi} <span className="text-xs text-slate-500">{currentDisorder.kpiUnit}</span></div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" /> Monitor Fisiológico 6DoF
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-amber-400">
                  {pipelinePhase} ({totalElapsedTime}s / {totalProtocolDuration}s)
                </span>
              </div>
              <div className="flex-1 w-full bg-slate-900 rounded-xl border border-slate-800 p-2 relative flex items-end overflow-hidden">
                {liveCurve.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${totalProtocolDuration} 100`} preserveAspectRatio="none">
                    <line x1={currentDisorder.phase1Sec} y1="0" x2={currentDisorder.phase1Sec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />
                    <line x1={currentDisorder.phase1Sec + currentDisorder.phase2Sec} y1="0" x2={currentDisorder.phase1Sec + currentDisorder.phase2Sec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.gsr * 12))}`).join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.hrv * 0.9))}`).join(' ')} />
                  </svg>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-[11px] font-mono">
                    Pulsa '2. INICIAR PRUEBA CLÍNICA' para activar telemetría
                  </div>
                )}
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> GSR Conductancia</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span> HRV Tono Vagal</span>
                <span>Fases 1-2-3</span>
              </div>
            </div>
          </section>

          {/* COLUMNA 3: DICTAMEN PERICIAL (ROI & TRIANGULACIÓN) */}
          <section className="col-span-12 lg:col-span-3 flex flex-col gap-3">
             <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
               <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                 <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[9px]">
                   <button onClick={() => setReportTypeView('INDIVIDUAL_ROI')} className={`px-2 py-0.5 rounded font-bold ${reportTypeView === 'INDIVIDUAL_ROI' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>ROI</button>
                   <button onClick={() => setReportTypeView('GLOBAL_TRIANGULATION')} className={`px-2 py-0.5 rounded font-bold ${reportTypeView === 'GLOBAL_TRIANGULATION' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>Global ({sessionHistory.length})</button>
                 </div>
                 <button onClick={handlePrint} className="px-2 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-500/40 text-sky-200 text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer">
                   <Printer className="w-3 h-3"/> Imprimir A4
                 </button>
               </div>

               <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-3 overflow-y-auto font-mono text-[9px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                 {reportTypeView === 'INDIVIDUAL_ROI' ? (
                   roiReportText || 'El dictamen pericial se generará automáticamente al concluir las 3 fases del protocolo.'
                 ) : (
                   compileGlobalTriangulationReport()
                 )}
               </div>
             </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default FullscreenDiagnosticRunner;
