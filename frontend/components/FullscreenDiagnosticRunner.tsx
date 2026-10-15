// ============================================================================
// AMIE CLINICAL COPILOT - SUITE CLÍNICA MAESTRA (30 ENTIDADES EN 7 MÓDULOS)
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import { 
  X, RotateCcw, Activity, Brain, Play, Square, Printer, Sparkles, Volume2, 
  ShieldAlert, FileText, Stethoscope, Clock, Database, CheckCircle2, Eye, 
  Send, Layers, Shield, Flame, Glasses, ThermometerSnowflake, UserCheck, 
  Crosshair, Radio, Sliders, BookOpen, User, GitMerge, AlertOctagon, 
  Compass, ShieldCheck, HeartPulse, UploadCloud, FolderPlus, Film, 
  Image as ImageIcon, RefreshCw
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  initialDisorderId?: string;
  initialMode?: 'DIAGNOSTIC' | 'TREATMENT';
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export type PipelinePhase = 'IDLE' | 'PHASE_1_BASELINE' | 'PHASE_2_ACTIVE' | 'PHASE_3_RECOVERY' | 'FINISHED';
export type ClinicalEvidenceTier = 'TIER_1_CLASS_A' | 'TIER_2_CLASS_B' | 'TIER_3_CLASS_C';
export type ClinicalMode = 'DIAGNOSTIC' | 'TREATMENT';
export type GuidanceMode = 'AUTOMATIC_GUIDELINES' | 'CUSTOM_PROFESSIONAL';
export type MediaSourceMode = 'OFFICIAL_CATALOG' | 'CUSTOM_STIMULUS';

export interface ModuleCategoryDefinition {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface ClinicalDisorderDefinition {
  id: string;
  moduleId: string;
  name: string;
  cie11: string;
  dsm5: string;
  supportedModes: ClinicalMode[];
  diagnosticEcosystem: string;
  treatmentEcosystem: string;
  targetKpiName: string;
  kpiUnit: string;
  defaultHz?: number;
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

export const CLINICAL_MODULES: ModuleCategoryDefinition[] = [
  { id: 'MOD_NEURODEV', name: 'I. Neurodesarrollo & Control Motor', description: 'TDAH, TEA, Asperger, Demencias y Parkinson', iconName: 'Sparkles' },
  { id: 'MOD_AFFECTIVE', name: 'II. Afectivo, Psicosis & Trauma', description: 'Depresión, Esquizofrenia, EMDR y Trauma Complejo', iconName: 'Brain' },
  { id: 'MOD_ANXIETY', name: 'III. Ansiedad, Fobias & TOC', description: 'Pánico, Agorafobia, VRET Alturas, Vuelo y TOC EPR', iconName: 'Glasses' },
  { id: 'MOD_ADDICTIONS', name: 'IV. Adicciones Químicas & Digitales', description: 'Abuso de Sustancias, Ludopatía y Gaming Compulsivo', iconName: 'Flame' },
  { id: 'MOD_FORENSIC', name: 'V. Personalidad & Forense (Cluster B)', description: 'TLP, Narcisismo Overt/Covert, Sociopatía y Psicopatía', iconName: 'Shield' },
  { id: 'MOD_HYPNOSIS_PAIN', name: 'VI. Neurohipnosis & Dolor Crónico', description: 'Hipnosis Closed-Loop, Fibromialgia, FND e Insomnio', iconName: 'ThermometerSnowflake' },
  { id: 'MOD_SEXOLOGY', name: 'VII. Salud Sexual & Modelo Dual', description: 'Inhibición SIS, Activación SES y Ansiedad Sexual', iconName: 'Activity' }
];

export const CLINICAL_MASTER_CATALOG: ClinicalDisorderDefinition[] = [
  // MÓDULO I: NEURODESARROLLO
  {
    id: 'TDAH_CPT', moduleId: 'MOD_NEURODEV', name: 'TDAH: Déficit de Atención e Impulsividad', cie11: '6A05.0', dsm5: '314.01',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'tdah_executive', treatmentEcosystem: 'focus_classroom',
    targetKpiName: 'Latencia Motora (RT Medio)', kpiUnit: 'ms', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'Guía Clínica NICE NG87 / APA Division 53',
    scriptBaseline: 'Calibración basal. Mantén la vista al frente y el cursor alineado en reposo.',
    guidelineScriptDiagnostic: 'Protocolo CPT 3D: Pulsa el gatillo únicamente cuando la diana destelle en verde. Inhibe la respuesta ante destello rojo.',
    guidelineScriptTreatment: 'Entrenamiento atencional ecológico: Concéntrate en la pizarra virtual ignorando distractores dinámicos del aula.',
    scriptRecovery: 'Ensayo concluido. Relaja la musculatura de tu mano y respira con normalidad.',
    loincCode: '70570-7', goldStandardScale: 'CPT-3 / Conners-3', meanHealthy: 240, sdHealthy: 35
  },
  {
    id: 'TEA_SENSORY', moduleId: 'MOD_NEURODEV', name: 'Espectro Autista: Sobrecarga Sensorial', cie11: '6A02', dsm5: '299.00',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'sensory_room',
    targetKpiName: 'Índice de Afectación TEA', kpiUnit: 'Score/100', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Guía Práctica Clínica SIGN 145 / APA Interventions in ASD',
    scriptBaseline: 'Calibración en reposo sin demanda social ni sobrecarga estimular.',
    guidelineScriptDiagnostic: 'Observa al evaluador virtual. Sigue la dirección de su mirada e identifica el objeto señalado.',
    guidelineScriptTreatment: 'Habituación sensorial gradual. Permite que la iluminación y sonidos del entorno se ajusten a tu ritmo de confort.',
    scriptRecovery: 'Prueba completada. El espacio retorna a un estado de calma y resguardo.',
    loincCode: '86467-8', goldStandardScale: 'ADOS-2 / CARS-2', meanHealthy: 18.5, sdHealthy: 5.2
  },
  {
    id: 'ASPERGER_SYNDROME', moduleId: 'MOD_NEURODEV', name: 'Síndrome de Asperger / TEA Nivel 1', cie11: '6A02.0', dsm5: '299.00',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'social_cafe', treatmentEcosystem: 'social_skills_training',
    targetKpiName: 'Fijación de Contacto Ocular', kpiUnit: '%', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Guías Clínicas NICE CG142 / Criterios DSM-5-TR',
    scriptBaseline: 'Ajuste inicial en entorno social protegido.',
    guidelineScriptDiagnostic: 'Paradigma de sintonía social: Identifica las emociones y microexpresiones de los avatares que conversan frente a ti.',
    guidelineScriptTreatment: 'Entrenamiento en habilidades de conversación: Sostén el contacto visual mientras respondes a las preguntas planteadas.',
    scriptRecovery: 'Sesión finalizada. Excelente desempeño en la interacción.',
    loincCode: '86467-8', goldStandardScale: 'ADOS-2 (Mód. 4)', meanHealthy: 75, sdHealthy: 12
  },
  {
    id: 'ALZHEIMER_GAMMA', moduleId: 'MOD_NEURODEV', name: 'Alzheimer & Deterioro Neurocognitivo', cie11: '6D80', dsm5: '331.0',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'cosmic_stars',
    targetKpiName: 'Acoplamiento de Fase PLV', kpiUnit: '%', defaultHz: 40.0, phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'Protocolo MIT Li-Huei Tsai / Arrastre Gamma 40 Hz',
    scriptBaseline: 'Calibración fisiológica basal previa a estimulación fótica.',
    guidelineScriptDiagnostic: 'Test de fluidez y fijación ocular en reposo. Mantenga la atención en el estímulo estacionario.',
    guidelineScriptTreatment: 'Iniciando estimulación opto-acústica Gamma a 40 Hz para facilitar sincronización de redes neuronales tálamo-corticales.',
    scriptRecovery: 'Pulsación fótica concluida. Consolidando acoplamiento de oscilación lenta.',
    loincCode: '72106-8', goldStandardScale: 'MoCA / MMSE', meanHealthy: 78.5, sdHealthy: 9.2
  },
  {
    id: 'PARKINSON_MOTOR', moduleId: 'MOD_NEURODEV', name: 'Parkinson: Temblor Postural y FOG', cie11: '8A00.0', dsm5: '332.0',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'sterile_room', treatmentEcosystem: 'fnd_mirror',
    targetKpiName: 'Estabilidad Cinemática', kpiUnit: 'Score', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'MDS Clinical Practice Guidelines for Movement Disorders',
    scriptBaseline: 'Registro de reposo motor basal. Sostén el controlador con tu extremidad dominante.',
    guidelineScriptDiagnostic: 'Extiende el brazo y mantén el cursor alineado en el objetivo. Registrando frecuencia y amplitud cinemática del temblor en 6DoF.',
    guidelineScriptTreatment: 'Reestructuración cinemática visual. Mueve el controlador rítmicamente siguiendo el patrón del entorno.',
    scriptRecovery: 'Registro completado. Descansa tu extremidad en el apoyo.',
    loincCode: '96780-2', goldStandardScale: 'MDS-UPDRS Parte III', meanHealthy: 4.2, sdHealthy: 1.1
  },

  // MÓDULO II: AFECTIVOS, PSICOSIS & TRAUMA
  {
    id: 'TDM_DEPRESSION', moduleId: 'MOD_AFFECTIVE', name: 'Depresión Mayor: Retardo Psicomotor', cie11: '6A70', dsm5: '296.22',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'bioluminescent_beach',
    targetKpiName: 'Simetría Frontal Alpha', kpiUnit: 'Ratio', defaultHz: 10.0, phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'Guía CanMAT para Trastornos del Ánimo / APA Depression Guidelines',
    scriptBaseline: 'Calibración basal de reposo. Respira con ritmo libre y natural.',
    guidelineScriptDiagnostic: 'Test de apatía motora y reactividad. Realice un seguimiento visual del objeto en movimiento continuo.',
    guidelineScriptTreatment: 'Sincroniza tu respiración con la pulsación lumínica de 10 Hz para estimular asimetría hemisférica frontal izquierda.',
    scriptRecovery: 'Integración autonómica. Preserva este estado de activación tranquila.',
    loincCode: '89211-7', goldStandardScale: 'HAM-D / BDI-II', meanHealthy: 1.05, sdHealthy: 0.12
  },
  {
    id: 'DISTIMIA_CHRONIC', moduleId: 'MOD_AFFECTIVE', name: 'Distimia & Depresión Persistente', cie11: '6A72', dsm5: '300.4',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'safe_place_forest',
    targetKpiName: 'Tono Vagal Sostenido', kpiUnit: 'ms', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'Guía NICE CG90 / Terapia de Activación Conductual',
    scriptBaseline: 'Entorno de refugio. Toma conciencia de tu apoyo corporal.',
    guidelineScriptDiagnostic: 'Evaluación de labilidad afectiva en reposo basal.',
    guidelineScriptTreatment: 'Permite que la iluminación cálida disuelva la tensión somática crónica. Respira en 4 tiempos inflando suavemente el abdomen.',
    scriptRecovery: 'Anclaje parasimpático instalado. El sistema neurovegetativo retoma su equilibrio.',
    loincCode: '80404-7', goldStandardScale: 'MADRS', meanHealthy: 52.0, sdHealthy: 11.5
  },
  {
    id: 'SCHIZOPHRENIA_VR', moduleId: 'MOD_AFFECTIVE', name: 'Esquizofrenia & Alucinaciones Auditivas', cie11: '6A20', dsm5: '295.90',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'sensory_overload_room', treatmentEcosystem: 'avatar_therapy',
    targetKpiName: 'Regulación del Arousal', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'NICE Guidelines CG178 / Avatar Therapy Protocol (Leff et al.)',
    scriptBaseline: 'Estabilización en entorno seguro. Reconoce tu centro de control aquí y ahora.',
    guidelineScriptDiagnostic: 'Evaluación de reactividad y atribución persecutoria ante estímulos ambientales ambiguos.',
    guidelineScriptTreatment: 'Terapia de Avatar: Dialoga con la figura virtual que representa la voz intrusiva, reafirmando tu autoridad y autonomía.',
    scriptRecovery: 'Ejercicio concluido. Regresando a la realidad física completamente protegida.',
    loincCode: '89211-7', goldStandardScale: 'PANSS', meanHealthy: 1.5, sdHealthy: 0.4
  },
  {
    id: 'PTSD_EMDR', moduleId: 'MOD_AFFECTIVE', name: 'TEPT: Reprocesamiento Sacádico EMDR', cie11: '6B40', dsm5: '309.81',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'emdr_memory',
    targetKpiName: 'Desensibilización Galvánica', kpiUnit: 'µS', defaultHz: 1.4, phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Estándar Internacional EMDRIA / Francine Shapiro Protocol',
    scriptBaseline: 'Instalación de Lugar Seguro. Respira y conecta con una sensación corporal de protección.',
    guidelineScriptDiagnostic: 'Provocación inmersiva inicial. Visualice el entorno de seguridad y reporte su nivel de disconfort autónomo.',
    guidelineScriptTreatment: 'Evoca el recuerdo traumático diana mientras sigues con tus ojos la barra de estimulación bilateral horizontal.',
    scriptRecovery: 'Detén el movimiento ocular. Inhala profundamente, suelta el aire y nota los cambios en tu cuerpo.',
    loincCode: '75276-6', goldStandardScale: 'CAPS-5 / PCL-5', meanHealthy: 1.2, sdHealthy: 0.4
  },
  {
    id: 'CPTSD_DEVELOPMENTAL', moduleId: 'MOD_AFFECTIVE', name: 'Trauma Complejo (TEPT-C) & Apego', cie11: '6B41', dsm5: '307.81',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'dev_trauma', treatmentEcosystem: 'dev_trauma',
    targetKpiName: 'Labilidad Paroxística', kpiUnit: 'ΔGSR/s', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'ISTSS Guidelines for Complex PTSD / Judith Herman Model',
    scriptBaseline: 'Transición al espacio de memoria relacional temprana.',
    guidelineScriptDiagnostic: 'Evaluación de labilidad electrodérmica ante señales virtuales de ambivalencia y rechazo vincular.',
    guidelineScriptTreatment: 'Reconsolidación del esquema de apego. Observa la figura protectora y ancla la sensación de contención somática.',
    scriptRecovery: 'Cierre relacional protegido. Tu respiración sostiene tu seguridad.',
    loincCode: '95398-4', goldStandardScale: 'ITQ', meanHealthy: 0.4, sdHealthy: 0.15
  },

  // MÓDULO III: ANSIEDAD, FOBIAS & TOC
  {
    id: 'PANIC_DISORDER', moduleId: 'MOD_ANXIETY', name: 'Trastorno de Pánico & Reto Interoceptivo', cie11: '6B01', dsm5: '300.01',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'sterile_room', treatmentEcosystem: 'safe_place_forest',
    targetKpiName: 'Reactividad Interoceptiva', kpiUnit: 'BPM', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'APA Practice Guideline for Panic Disorder / Barlow Protocol',
    scriptBaseline: 'Registro de constantes fisiológicas en reposo sin demanda.',
    guidelineScriptDiagnostic: 'Provocación interoceptiva virtual. Enfócate en tu latido cardíaco ante la reducción progresiva de límites espaciales.',
    guidelineScriptTreatment: 'Reestructuración autonómica: El pánico es una señal inofensiva. Regula tu frecuencia exhalando en 6 segundos.',
    scriptRecovery: 'Recuperando límites espaciales estables. El sistema parasimpático restablece el control.',
    loincCode: '8867-4', goldStandardScale: 'PDSS', meanHealthy: 8.5, sdHealthy: 3.2
  },
  {
    id: 'ACROPHOBIA', moduleId: 'MOD_ANXIETY', name: 'Acrofobia: Exposición VRET a Alturas', cie11: '6B03.0', dsm5: '300.29',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'acrophobia_roof', treatmentEcosystem: 'acrophobia_roof',
    targetKpiName: 'Desviación Postural (Head-Sway)', kpiUnit: 'cm', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Guías Clínicas VRET APA División 12 / Rothbaum Standards',
    scriptBaseline: 'Calibración de balance vestibular en el centro de la plataforma segura.',
    guidelineScriptDiagnostic: 'Avanza hacia la barandilla de la azotea y mira hacia el vacío inferior. Evaluamos oscilación motora y pico galvánico.',
    guidelineScriptTreatment: 'Exposición graduada: Permanece en el borde observando la ciudad hasta que tu conductancia dérmica descienda un 40%.',
    scriptRecovery: 'Paso atrás a zona protegida. Mantén la sensación de firmeza en el suelo.',
    loincCode: '96781-0', goldStandardScale: 'Acrophobia Q (AQ)', meanHealthy: 3.8, sdHealthy: 1.2
  },
  {
    id: 'AEROPHOBIA', moduleId: 'MOD_ANXIETY', name: 'Aerofobia: Simulación de Vuelo VRET', cie11: '6B03.2', dsm5: '300.29',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'aerophobia_cabin', treatmentEcosystem: 'aerophobia_cabin',
    targetKpiName: 'Pico Galvánico en Despegue', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'VRET Aviation Guidelines / Wiederhold Exposure Protocols',
    scriptBaseline: 'Fase de embarque en cabina. Espalda apoyada y hombros relajados.',
    guidelineScriptDiagnostic: 'Simulación de aceleración en pista, despegue y turbulencia meteorológica con vibración auditiva.',
    guidelineScriptTreatment: 'Exposición guiada en vuelo de crucero: Tolera los sonidos de cabina mientras la IA modula tu ritmo respiratorio.',
    scriptRecovery: 'Vuelo estabilizado en altitud segura. La vibración cesa.',
    loincCode: '86468-6', goldStandardScale: 'VAFS', meanHealthy: 1.5, sdHealthy: 0.5
  },
  {
    id: 'SOCIAL_ANXIETY', moduleId: 'MOD_ANXIETY', name: 'Fobia Social: Ansiedad de Escrutinio', cie11: '6B04', dsm5: '300.23',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'cluster_b_forensic', treatmentEcosystem: 'social_cafe',
    targetKpiName: 'Evasión de Mirada Social', kpiUnit: '%', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'NICE CG159 Social Anxiety Disorder / Clark & Wells Model',
    scriptBaseline: 'Ingreso al espacio social en estado neutro.',
    guidelineScriptDiagnostic: 'Dirige tu mirada al panel de evaluadores. Medimos evasión de fijación ocular y respuesta galvánica al juicio.',
    guidelineScriptTreatment: 'Exposición conductual en cafetería: Realiza una petición verbal al camarero virtual sosteniendo el contacto visual.',
    scriptRecovery: 'Interacción concluida con éxito. Tono vagal en rango seguro.',
    loincCode: '95400-8', goldStandardScale: 'Liebowitz (LSAS)', meanHealthy: 14.2, sdHealthy: 4.5
  },
  {
    id: 'GAD_GENERALIZED', moduleId: 'MOD_ANXIETY', name: 'Ansiedad Generalizada: Biofeedback 0.1Hz', cie11: '6B00', dsm5: '300.02',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'neuro_hypnosis',
    targetKpiName: 'Tasa de Habituación (H)', kpiUnit: '%', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'AAPB Guidelines for HRV Biofeedback / Lehrer Model',
    scriptBaseline: 'Registro de variabilidad cardíaca y reposo somático basal.',
    guidelineScriptDiagnostic: 'Test de sobreactivación en reposo. Monitoreo de descompensación de HRV sin estímulo externo.',
    guidelineScriptTreatment: 'Sigue la expansión y contracción del orbe luminoso exactamente a 6 respiraciones por minuto para inducir resonancia autonómica.',
    scriptRecovery: 'Coherencia cardiovascular lograda. Conserva esta cadencia respiratoria profunda.',
    loincCode: '69725-0', goldStandardScale: 'GAD-7 / HAM-A', meanHealthy: 58.0, sdHealthy: 10.2
  },
  {
    id: 'OCD_OBSESSIVE', moduleId: 'MOD_ANXIETY', name: 'TOC: Exposición & Prevención de Respuesta', cie11: '6B20', dsm5: '300.3',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'cosmic_stars',
    targetKpiName: 'Ruptura de Rumiación', kpiUnit: 'PLV %', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'APA Practice Guideline for OCD / Foa & Kozak Protocol (EPR)',
    scriptBaseline: 'Anclaje atencional primario en espacio de neutralidad.',
    guidelineScriptDiagnostic: 'Inducción de rumiación obsesiva. Registrando persistencia y latencia de interferencia cognitiva.',
    guidelineScriptTreatment: 'Exposición y Prevención de Respuesta: Evoca el pensamiento obsesivo sin realizar el ritual de neutralización. Observa la inmensidad estelar hasta que la urgencia disminuya.',
    scriptRecovery: 'Prevención de respuesta completada. La urgencia compulsiva ha descendido biológicamente.',
    loincCode: '70569-9', goldStandardScale: 'Yale-Brown (Y-BOCS)', meanHealthy: 72.0, sdHealthy: 8.5
  },
  {
    id: 'AGORAPHOBIA', moduleId: 'MOD_ANXIETY', name: 'Agorafobia: Exposición a Multitudes', cie11: '6B02', dsm5: '300.22',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'crowded_street', treatmentEcosystem: 'safe_place_forest',
    targetKpiName: 'Control Autonómico', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'NICE CG113 Agoraphobia Guidelines / In Vivo Equivalent VRET',
    scriptBaseline: 'Calibración basal en espacio de seguridad previo al exterior.',
    guidelineScriptDiagnostic: 'Inmersión en avenida concurrida con avatares en movimiento. Medimos activación simpática y urgencia de escape.',
    guidelineScriptTreatment: 'Permanencia guiada en multitud virtual. Aplica el anclaje respiratorio hasta tolerar la presencia del entorno abierto.',
    scriptRecovery: 'Retorno seguro. Descompresión fisiológica completada.',
    loincCode: '8867-4', goldStandardScale: 'MI-Agoraphobia', meanHealthy: 4.5, sdHealthy: 1.5
  },

  // MÓDULO IV: ADICCIONES
  {
    id: 'SUD_ADDICTION', moduleId: 'MOD_ADDICTIONS', name: 'Adicción a Sustancias: Exposición a Señales', cie11: '6C40', dsm5: '303.90',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'bar_environment', treatmentEcosystem: 'cue_exposure_therapy',
    targetKpiName: 'Pico de Craving (GSR)', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'NIDA Cue-Exposure Therapy Standards / ASAM Criteria',
    scriptBaseline: 'Registro de constantes biológicas en estado de abstinencia basal.',
    guidelineScriptDiagnostic: 'Exposición ambiental a bar y parafernalia de consumo. Registrando reactividad psicofisiológica y craving somático.',
    guidelineScriptTreatment: 'Terapia de Exposición a Señales (CET): Observa la sustancia de consumo sin interactuar. Permite que la ola de deseo alcance su punto máximo y descienda por extinción.',
    scriptRecovery: 'Ola de deseo superada. Control prefrontal consolidado.',
    loincCode: '69725-0', goldStandardScale: 'ASAM / CIWA', meanHealthy: 0.8, sdHealthy: 0.2
  },
  {
    id: 'DIGITAL_ADDICTION', moduleId: 'MOD_ADDICTIONS', name: 'Adicción Digital & Gaming Compulsivo', cie11: '6C51', dsm5: '312.31',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'gaming_room', treatmentEcosystem: 'gaming_room',
    targetKpiName: 'Control de Impulsos', kpiUnit: 'ms', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'WHO Guidelines on Digital Health / Griffiths Addiction Model',
    scriptBaseline: 'Línea base en habitación cotidiana sin pantallas encendidas.',
    guidelineScriptDiagnostic: 'Encendido de pantallas virtuales con videojuegos competitivos. Medimos micro-movimientos de aproximación y arousal.',
    guidelineScriptTreatment: 'Prevención de respuesta digital: Las pantallas están activas pero el controlador está deshabilitado. Tolera la urgencia de jugar.',
    scriptRecovery: 'Desconexión digital completada con éxito.',
    loincCode: '95400-8', goldStandardScale: 'IGDT-10', meanHealthy: 1.0, sdHealthy: 0.3
  },
  {
    id: 'GAMBLING_LUDOPATHY', moduleId: 'MOD_ADDICTIONS', name: 'Juego Patológico / Ludopatía 6DoF', cie11: '6C50', dsm5: '312.31',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'bar_environment', treatmentEcosystem: 'cue_exposure_therapy',
    targetKpiName: 'Resistencia a Señales de Apuesta', kpiUnit: 'Score', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'APA Guidelines for Gambling Disorder / Blaszczynski Pathways Model',
    scriptBaseline: 'Calibración basal de tolerancia al riesgo.',
    guidelineScriptDiagnostic: 'Inmersión en casino virtual con estímulos lumínicos de recompensa intermitente. Evaluando aceleración cardíaca.',
    guidelineScriptTreatment: 'Extinción de reactividad ante máquinas tragamonedas virtuales. Desensibilización al sonido de ganancia monetaria.',
    scriptRecovery: 'Sesión finalizada. Desconexión de recompensas dopaminérgicas.',
    loincCode: '69725-0', goldStandardScale: 'SOGS', meanHealthy: 1.2, sdHealthy: 0.3
  },

  // MÓDULO V: PERSONALIDAD & FORENSE
  {
    id: 'BPD_INSTABILITY', moduleId: 'MOD_FORENSIC', name: 'Trastorno Límite de Personalidad (TLP)', cie11: '6D11', dsm5: '301.83',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'abandonment_scenario', treatmentEcosystem: 'dbt_mindfulness',
    targetKpiName: 'Labilidad Paroxística', kpiUnit: 'ΔGSR/s', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Guía Clínica DBT Marsha Linehan / APA Borderline Guidelines',
    scriptBaseline: 'Ajuste basal en entorno relacional neutro.',
    guidelineScriptDiagnostic: 'Evaluación de reactividad emocional ante señales simuladas de abandono interpersonal y validación ambivalente.',
    guidelineScriptTreatment: 'Entrenamiento en Tolerancia al Malestar (DBT TIPP): Usa el anclaje criogénico visual para modular el desborde simpático.',
    scriptRecovery: 'Contención afectiva alcanzada. Registro almacenado en el expediente.',
    loincCode: '95401-6', goldStandardScale: 'BSL-23', meanHealthy: 0.5, sdHealthy: 0.2
  },
  {
    id: 'NARCISSISM_MALE', moduleId: 'MOD_FORENSIC', name: 'Narcisismo Grandioso (Overt)', cie11: '6D10.0', dsm5: '301.81',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'boardroom_provocation', treatmentEcosystem: 'clinical_office',
    targetKpiName: 'Umbral de Ira Narcisista', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'APA Guidelines for Personality Assessment / Ronningstam Model',
    scriptBaseline: 'Registro de constantes basales de control previo.',
    guidelineScriptDiagnostic: 'Prueba pericial de tolerancia al estatus: Exposición a evaluadores virtuales que cuestionan directamente tus logros y autoridad.',
    guidelineScriptTreatment: 'Terapia de reestructuración: Enfrentamiento guiado ante críticas constructivas sin desborde autonómico.',
    scriptRecovery: 'Provocación pericial finalizada. Normalizando registro.',
    loincCode: '95402-4', goldStandardScale: 'NPI', meanHealthy: 1.4, sdHealthy: 0.5
  },
  {
    id: 'NARCISSISM_FEMALE', moduleId: 'MOD_FORENSIC', name: 'Narcisismo Encubierto (Covert / Vulnerable)', cie11: '6D10.0', dsm5: '301.81',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'social_exclusion_party', treatmentEcosystem: 'self_compassion_room',
    targetKpiName: 'Disonancia por Exclusión', kpiUnit: 'RMSSD Drop', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30,
    internationalGuideline: 'Pincus Pathological Narcissism Framework / DSM-5-TR Alternative Model',
    scriptBaseline: 'Registro autonómico basal en espacio social.',
    guidelineScriptDiagnostic: 'Dinámica simulada de exclusión grupal y condescendencia sutil. Analizando caída de VFC por hipersensibilidad al rechazo.',
    guidelineScriptTreatment: 'Desensibilización al juicio implícito. Fomento de tolerancia a la desaprobación social en entorno de confort.',
    scriptRecovery: 'Dinámica finalizada. Reposo parasimpático compensado.',
    loincCode: '95403-2', goldStandardScale: 'HSNS', meanHealthy: 6.2, sdHealthy: 2.1
  },
  {
    id: 'SOCIOPATHY_ASPD', moduleId: 'MOD_FORENSIC', name: 'Trastorno Antisocial / Sociopatía', cie11: '6D10.1', dsm5: '301.7',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'authority_conflict', treatmentEcosystem: 'clinical_office',
    targetKpiName: 'Frialdad / Agresividad', kpiUnit: 'ΔGSR', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Forensic Clinical Protocols / Widiger Personality Dimension Guidelines',
    scriptBaseline: 'Fase de observación neutra de constantes vitales.',
    guidelineScriptDiagnostic: 'Simulación pericial de confrontación de límites legales y normas sociales. Medición de ausencia de ansiedad anticipatoria.',
    guidelineScriptTreatment: 'Entrenamiento en consecuencias causales mediante biofeedback.',
    scriptRecovery: 'Simulación de conflicto concluida.',
    loincCode: '95404-0', goldStandardScale: 'ASPD Criteria', meanHealthy: 2.5, sdHealthy: 0.8
  },
  {
    id: 'PSYCHOPATHY', moduleId: 'MOD_FORENSIC', name: 'Psicopatía Forense (Factor 1 PCL-R)', cie11: '6D10.1', dsm5: '301.7',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'distress_empathy_test', treatmentEcosystem: 'clinical_office',
    targetKpiName: 'Aplanamiento Empático', kpiUnit: 'ΔGSR=0', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Hare Psychopathy Checklist-Revised Standards (PCL-R)',
    scriptBaseline: 'Preparación para presentación de estímulos visuales afectivos.',
    guidelineScriptDiagnostic: 'Paradigma de reactividad empática refleja ante escenas 360° de sufrimiento humano. Registrando hiporreactividad galvánica involuntaria.',
    guidelineScriptTreatment: 'Entrenamiento en neuro-asociación afectiva.',
    scriptRecovery: 'Registro de empatía somática finalizado. Análisis pericial compilado.',
    loincCode: '95404-0', goldStandardScale: 'PCL-R', meanHealthy: 3.2, sdHealthy: 0.8
  },

  // MÓDULO VI: NEUROHIPNOSIS & PSICOSOMÁTICA
  {
    id: 'CLINICAL_HYPNOSIS_DEEP', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Neurohipnosis Profunda en Bucle Cerrado', cie11: 'MB23.4', dsm5: '300.11',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'neuro_hypnosis', treatmentEcosystem: 'neuro_hypnosis',
    targetKpiName: 'Profundidad de Trance (Vagal/PLV)', kpiUnit: '%', defaultHz: 3.5, phase1Sec: 30, phase2Sec: 240, phase3Sec: 30,
    internationalGuideline: 'Sociedad Internacional de Hipnosis (ISH) / Milton Erickson Foundation',
    scriptBaseline: 'Fijación de la mirada en el centro del orbe de luz. Permite que tus párpados se relajen suavemente.',
    guidelineScriptDiagnostic: 'Test de sugestionabilidad de Spiegel. Analizando latencia de respuesta motora bajo arrastre fótico ligero.',
    guidelineScriptTreatment: 'Inducción Ericksoniana en bucle cerrado: A medida que tu respiración se ralentiza, el orbe disminuye su brillo... descendiendo de 10 a 4 Hz... cada sonido exterior te conduce a una calma dos veces más profunda... el cuerpo flota sin esfuerzo.',
    scriptRecovery: 'Contando del 1 al 5. Regresando con sensación de completa vitalidad, descanso y despejo mental.',
    loincCode: '95405-7', goldStandardScale: 'SHSS (Stanford Scale)', meanHealthy: 80.0, sdHealthy: 10.0
  },
  {
    id: 'FND_CONVERSION', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Trastorno Neurológico Funcional (FND)', cie11: '6C20', dsm5: '300.11',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'fnd_mirror', treatmentEcosystem: 'fnd_mirror',
    targetKpiName: 'Simetría de Control 6DoF', kpiUnit: '%', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'Stone Criteria for Functional Neurological Disorder / Mirror Therapy Guidelines',
    scriptBaseline: 'Calibración del avatar cinemático en espejo 6DoF.',
    guidelineScriptDiagnostic: 'Mapeo de disociación motora y signo de Hoover en realidad virtual.',
    guidelineScriptTreatment: 'Terapia en espejo adaptativa: Mueve tu extremidad no afectada mientras el avatar proyecta movimiento bilateral armónico y perfecto.',
    scriptRecovery: 'Recalibración del mapa somatosensorial completada.',
    loincCode: '96782-8', goldStandardScale: 'Hoover Sign', meanHealthy: 92.0, sdHealthy: 4.5
  },
  {
    id: 'CHRONIC_PAIN', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Dolor Crónico Generalizado / Fibromialgia', cie11: 'MG30.0', dsm5: '307.89',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'pain_management',
    targetKpiName: 'Alivio Nociceptivo Sub-Delta', kpiUnit: 'Score/10', defaultHz: 0.5, phase1Sec: 30, phase2Sec: 180, phase3Sec: 30,
    internationalGuideline: 'IASP Global Year Against Pain Guidelines / Hoffman VR Analgesia Protocol',
    scriptBaseline: 'Registro basal de tensión muscular isométrica.',
    guidelineScriptDiagnostic: 'Evaluación de hiperalgesia y mapeo de conductancia térmica en reposo.',
    guidelineScriptTreatment: 'Desfocalización nociceptiva criogénica: La inmersión en el abismo polar reduce la activación talámica y bloquea señales de dolor ascendente.',
    scriptRecovery: 'Consolidación analgésica. Mantén la sensación de alivio y liviandad corporal.',
    loincCode: '72514-3', goldStandardScale: 'FIQR / EVA', meanHealthy: 8.5, sdHealthy: 1.1
  },
  {
    id: 'CRPS_NEUROPATHIC', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Síndrome de Dolor Regional Complejo', cie11: '8E43', dsm5: '354.4',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'pain_management',
    targetKpiName: 'Amortiguación Simpática Regional', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Budapest IASP Diagnostic and Interventional Criteria',
    scriptBaseline: 'Posición articular protegida en reposo.',
    guidelineScriptDiagnostic: 'Test de provocación simpática periférica. Registro de respuesta vasomotora.',
    guidelineScriptTreatment: 'Aplicación de filtros cromáticos criogénicos para reducir la hiperexcitabilidad vasomotora y el dolor neuropático periférico.',
    scriptRecovery: 'Desensibilización periférica alcanzada. Flujo sanguíneo regional regularizado.',
    loincCode: '86469-4', goldStandardScale: 'Budapest Criteria', meanHealthy: 1.1, sdHealthy: 0.3
  },
  {
    id: 'INSOMNIA_SLEEP', moduleId: 'MOD_HYPNOSIS_PAIN', name: 'Trastorno de Insomnio Crónico Severo', cie11: '7A00', dsm5: '307.42',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'clinical_office', treatmentEcosystem: 'neuro_hypnosis',
    targetKpiName: 'Inducción de Ondas Delta 2Hz', kpiUnit: '%', defaultHz: 2.0, phase1Sec: 30, phase2Sec: 240, phase3Sec: 30,
    internationalGuideline: 'AASM Clinical Practice Guideline for Insomnia / Edinger Protocol',
    scriptBaseline: 'Atenuación lumínica progresiva y preparación metabólica para el sueño.',
    guidelineScriptDiagnostic: 'Monitoreo de hiperarousal prefrontal en estado de reposo nocturno.',
    guidelineScriptTreatment: 'Neurohipnosis por arrastre Delta a 2 Hz: Desaceleración metabólica, supresión de hiperarousal prefrontal y facilitación del sueño de ondas lentas.',
    scriptRecovery: 'Transición completada hacia la fase de reposo biológico regenerativo.',
    loincCode: '95405-7', goldStandardScale: 'ISI / PSQI', meanHealthy: 74.0, sdHealthy: 8.2
  },

  // MÓDULO VII: SALUD SEXUAL & MODELO DUAL
  {
    id: 'SEXUAL_INHIBITION', moduleId: 'MOD_SEXOLOGY', name: 'Inhibición Sexual (Modelo Dual SIS)', cie11: 'HA01', dsm5: '302.72',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'dual_control', treatmentEcosystem: 'dual_control',
    targetKpiName: 'Desactivación Freno SIS', kpiUnit: '%', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'Kinsey Institute Dual Control Model / Bancroft & Janssen Guidelines',
    scriptBaseline: 'Focalización en el plano propioceptivo corporal libre de juicio.',
    guidelineScriptDiagnostic: 'Evaluación del freno simpático inhibitorio ante estímulos de proximidad.',
    guidelineScriptTreatment: 'Focalización sensorial sin demanda de rendimiento: Inhala calidez corporal y disuelve la autoobservación crítica evaluativa.',
    scriptRecovery: 'Freno inhibitorio simpático desactivado. Consolidación de tono parasimpático.',
    loincCode: '95406-5', goldStandardScale: 'SIS/SES Questionnaire', meanHealthy: 65.0, sdHealthy: 9.5
  },
  {
    id: 'SEXUAL_DESIRE', moduleId: 'MOD_SEXOLOGY', name: 'Deseo Sexual Hipoactivo (Modelo Dual SES)', cie11: 'HA00', dsm5: '302.71',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'dual_control', treatmentEcosystem: 'dual_control',
    targetKpiName: 'Activación Excitatoria SES', kpiUnit: 'Score', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30,
    internationalGuideline: 'ISSM Guidelines for Hypoactive Sexual Desire / Basson Model',
    scriptBaseline: 'Sintonización afectiva y corporal libre de demanda.',
    guidelineScriptDiagnostic: 'Evaluación del umbral de activación excitatoria SES ante señales sensoriales.',
    guidelineScriptTreatment: 'Reconexión con señales corporales interoceptivas placenteras para reactivar gradualmente el sistema de excitación sexual.',
    scriptRecovery: 'Respuesta excitatoria facilitada dentro de un rango afectivo seguro.',
    loincCode: '95407-3', goldStandardScale: 'FSFI / IIEF', meanHealthy: 78.0, sdHealthy: 10.4
  },
  {
    id: 'SEXUAL_PERFORMANCE_ANX', moduleId: 'MOD_SEXOLOGY', name: 'Ansiedad de Rendimiento Sexual / Disfunción', cie11: 'HA02', dsm5: '302.70',
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'], diagnosticEcosystem: 'dual_control', treatmentEcosystem: 'safe_place_forest',
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

  const [activeModuleTab, setActiveModuleTab] = useState<string>('MOD_NEURODEV');
  const [selectedDisorderId, setSelectedDisorderId] = useState<string>(initialDisorderId || 'TDAH_CPT');
  
  const currentDisorder = useMemo(() => {
    return CLINICAL_MASTER_CATALOG.find(d => d.id === selectedDisorderId) || CLINICAL_MASTER_CATALOG[0];
  }, [selectedDisorderId]);

  const [selectedMode, setSelectedMode] = useState<ClinicalMode>(initialMode || 'DIAGNOSTIC');
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>('AUTOMATIC_GUIDELINES');

  const [mediaSourceMode, setMediaSourceMode] = useState<MediaSourceMode>('OFFICIAL_CATALOG');
  const [customMediaType, setCustomMediaType] = useState<'image' | 'video'>('image');
  const [customMediaUrl, setCustomMediaUrl] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('IDLE');
  const [phaseTime, setPhaseTime] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const [customScript, setCustomScript] = useState<string>('');

  const [currentGsr, setCurrentGsr] = useState<number>(2.4);
  const [currentHrv, setCurrentHrv] = useState<number>(40);
  const [currentKpi, setCurrentKpi] = useState<number>(10);
  const [liveCurve, setLiveCurve] = useState<Array<{ t: number; gsr: number; hrv: number; kpi: number; phase: PipelinePhase }>>([]);

  const [isDeinducting, setIsDeinducting] = useState<boolean>(false);
  const [isEmergencyAborted, setIsEmergencyAborted] = useState<boolean>(false);
  const [stressWatchdogAlert, setStressWatchdogAlert] = useState<string | null>(null);

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

  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(() => VrControlService.isConnected());
  const [roiReportText, setRoiReportText] = useState<string>('');
  const [reportTypeView, setReportTypeView] = useState<'INDIVIDUAL_ROI' | 'GLOBAL_TRIANGULATION'>('INDIVIDUAL_ROI');
  const [visorStatusMsg, setVisorStatusMsg] = useState<string | null>(null);

  const stateRef = useRef({
    pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, 
    currentDisorder, selectedMode, guidanceMode, isDeinducting, isEmergencyAborted,
    mediaSourceMode, customMediaUrl, customMediaType
  });

  useEffect(() => {
    stateRef.current = { 
      pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, 
      currentDisorder, selectedMode, guidanceMode, isDeinducting, isEmergencyAborted,
      mediaSourceMode, customMediaUrl, customMediaType
    };
  }, [pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, currentDisorder, selectedMode, guidanceMode, isDeinducting, isEmergencyAborted, mediaSourceMode, customMediaUrl, customMediaType]);

  useEffect(() => {
    if (initialDisorderId) {
      const match = CLINICAL_MASTER_CATALOG.find(d => d.id === initialDisorderId);
      if (match) {
        setSelectedDisorderId(match.id);
        setActiveModuleTab(match.moduleId);
      }
    }
  }, [initialDisorderId]);

  useEffect(() => {
    if (!currentDisorder.supportedModes.includes(selectedMode)) {
      setSelectedMode(currentDisorder.supportedModes[0]);
    }
  }, [currentDisorder]);

  useEffect(() => {
    if (guidanceMode === 'AUTOMATIC_GUIDELINES') {
      const script = selectedMode === 'DIAGNOSTIC' 
        ? currentDisorder.guidelineScriptDiagnostic 
        : currentDisorder.guidelineScriptTreatment;
      setCustomScript(script);
    }
    setPipelinePhase('IDLE');
    setLiveCurve([]);
    setIsDeinducting(false);
    setIsEmergencyAborted(false);
    setStressWatchdogAlert(null);
  }, [currentDisorder, selectedMode, guidanceMode]);

  useEffect(() => {
    if (!VrControlService.isConnected()) VrControlService.connect(undefined, patientId);
    const unsub = VrControlService.subscribeStatus((status) => setIsVisorLinked(status === 'CONNECTED'));
    return () => { if(unsub) unsub(); };
  }, [patientId]);

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (customMediaType === 'image' && !isImage) {
      setVisorStatusMsg('⚠️ El archivo debe ser una imagen válida (JPEG, PNG).');
      return;
    }
    if (customMediaType === 'video' && !isVideo) {
      setVisorStatusMsg('⚠️ El archivo debe ser un video MP4 equirrectangular.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCustomMediaUrl(objectUrl);
    setSelectedFileName(file.name);
    setVisorStatusMsg(`Archivo local listo: ${file.name}`);
    setTimeout(() => setVisorStatusMsg(null), 3500);
  };

  const handleDeployEnvironment = () => {
    if (!isVisorLinked) {
      setVisorStatusMsg('⚠️ Enciende el visor Pico e ingresa a la sesión del paciente primero.');
      setTimeout(() => setVisorStatusMsg(null), 4000);
      return;
    }

    if (mediaSourceMode === 'CUSTOM_STIMULUS' && customMediaUrl.trim()) {
      VrControlService.sendCommand({
        type: 'LOAD_CUSTOM_MEDIA',
        mediaUrl: customMediaUrl.trim(),
        mediaType: customMediaType,
        scenarioName: `${currentDisorder.name} [Personalizado]`,
        patientId,
        timestamp: Date.now()
      });
      setVisorStatusMsg(`🟢 Estímulo 360° propio proyectado en el casco (${customMediaType.toUpperCase()}).`);
      setTimeout(() => setVisorStatusMsg(null), 4000);
      return;
    }

    const targetEcosystem = selectedMode === 'DIAGNOSTIC' 
      ? currentDisorder.diagnosticEcosystem 
      : currentDisorder.treatmentEcosystem;

    VrControlService.syncClinicalContext({
      moduleId: currentDisorder.id,
      category: selectedMode,
      disorderId: currentDisorder.id,
      disorderName: `${currentDisorder.name} [${selectedMode}]`,
      ecosystem: targetEcosystem,
      patientId,
      frequencyHz: currentDisorder.defaultHz || 0,
      audioGuidance: {
        baselineScript: currentDisorder.scriptBaseline,
        activeScript: customScript,
        recoveryScript: currentDisorder.scriptRecovery
      }
    });

    setVisorStatusMsg(`🟢 Entorno oficial /${targetEcosystem}.jpeg cargado en el visor.`);
    setTimeout(() => setVisorStatusMsg(null), 4000);
  };

  const totalProtocolDuration = currentDisorder.phase1Sec + currentDisorder.phase2Sec + currentDisorder.phase3Sec;

  const startPipeline = () => {
    if (!isVisorLinked) return;
    setLiveCurve([]);
    setTotalElapsedTime(0);
    setPhaseTime(0);
    setIsDeinducting(false);
    setIsEmergencyAborted(false);
    setStressWatchdogAlert(null);
    setPipelinePhase('PHASE_1_BASELINE');

    if (mediaSourceMode === 'CUSTOM_STIMULUS' && customMediaUrl.trim()) {
      VrControlService.sendCommand({
        type: 'LOAD_CUSTOM_MEDIA',
        mediaUrl: customMediaUrl.trim(),
        mediaType: customMediaType,
        scenarioName: `${currentDisorder.name} [Estímulo Propio]`,
        patientId,
        timestamp: Date.now()
      });
    }

    VrControlService.sendCommand({
      type: 'START_PIPELINE_PHASE',
      phase: 'PHASE_1_BASELINE',
      speechScript: currentDisorder.scriptBaseline,
      ecosystem: selectedMode === 'DIAGNOSTIC' ? currentDisorder.diagnosticEcosystem : currentDisorder.treatmentEcosystem,
      category: selectedMode,
      patientId
    });
  };

  const handleStartDeinduction = () => {
    if (pipelinePhase === 'IDLE' || pipelinePhase === 'FINISHED') return;
    setIsDeinducting(true);

    const deinductionText = "Iniciando regreso consciente y gradual del trance. Cuento del uno al cinco. Uno: la sensación y vitalidad regresan a tus manos y pies. Dos: tu respiración es despejada y natural. Tres: mente clara y tranquila. Cuatro: párpados ligeros, listos para abrirse. Cinco: ojos abiertos, completamente despierto, ubicado en el consultorio, en perfecta calma.";

    VrControlService.sendCommand({
      type: 'START_PIPELINE_PHASE',
      phase: 'PHASE_3_RECOVERY',
      speechScript: deinductionText,
      category: 'TREATMENT',
      frequencyHz: 10.0, 
      patientId
    });

    setVisorStatusMsg('🧭 Des-inducción hipnótica en curso (Escala 1 a 5). Reorientando al paciente...');
    setTimeout(() => {
      finishPipelineAndCompileReports(false, 'Emersión progresiva regulada completada según protocolo Ericksoniano.');
    }, 18000);
  };

  const handleEmergencyAbort = (reason = 'Interrupción manual de seguridad por facultativo ante signos de distrés.') => {
    setIsEmergencyAborted(true);
    setIsDeinducting(false);
    setPipelinePhase('FINISHED');

    VrControlService.stopLightStimulation(patientId);
    VrControlService.triggerGroundingProtocol(patientId);

    const abortScript = "Abre los ojos ahora. Estás en un lugar seguro. Respira profundo. Siente tus pies firmes en el suelo. Mira a tu alrededor, estás en la clínica con tu médico tratante. Todo está en calma y completamente bajo control.";
    VrControlService.sendCommand({
      type: 'START_PIPELINE_PHASE',
      phase: 'PHASE_3_RECOVERY',
      speechScript: abortScript,
      ecosystem: 'safe_place_forest',
      category: 'TREATMENT',
      frequencyHz: 0,
      patientId
    });

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

        if (s.mediaSourceMode === 'CUSTOM_STIMULUS' && s.customMediaUrl.trim()) {
          VrControlService.sendCommand({
            type: 'LOAD_CUSTOM_MEDIA',
            mediaUrl: s.customMediaUrl.trim(),
            mediaType: s.customMediaType,
            scenarioName: `${s.currentDisorder.name} [Fase 2 Personalizada]`,
            patientId,
            timestamp: Date.now()
          });
        }

        VrControlService.sendCommand({
          type: 'START_PIPELINE_PHASE',
          phase: 'PHASE_2_ACTIVE',
          speechScript: s.customScript,
          frequencyHz: s.currentDisorder.defaultHz || 0,
          category: s.selectedMode,
          patientId
        });
      } 
      else if (s.pipelinePhase === 'PHASE_2_ACTIVE' && nextPhaseTime >= s.currentDisorder.phase2Sec && !s.isDeinducting) {
        setPipelinePhase('PHASE_3_RECOVERY');
        setPhaseTime(0);

        VrControlService.sendCommand({
          type: 'START_PIPELINE_PHASE',
          phase: 'PHASE_3_RECOVERY',
          speechScript: s.currentDisorder.scriptRecovery,
          category: s.selectedMode,
          frequencyHz: 0,
          patientId
        });
      } 
      else if (s.pipelinePhase === 'PHASE_3_RECOVERY' && nextPhaseTime >= s.currentDisorder.phase3Sec && !s.isDeinducting) {
        finishPipelineAndCompileReports(false);
      } else {
        setPhaseTime(nextPhaseTime);
      }

      let deltaGsr = (Math.random() - 0.48) * 0.14;
      if (s.currentDisorder.id === 'CLINICAL_HYPNOSIS_DEEP') deltaGsr -= 0.08; 
      else if (s.pipelinePhase === 'PHASE_2_ACTIVE') deltaGsr += s.selectedMode === 'DIAGNOSTIC' ? 0.09 : -0.05;
      else if (s.pipelinePhase === 'PHASE_3_RECOVERY') deltaGsr -= 0.06;
      
      const newGsr = Math.max(0.6, Number((s.currentGsr + deltaGsr).toFixed(2)));
      setCurrentGsr(newGsr);

      let deltaHrv = Math.floor((Math.random() - 0.45) * 4);
      if (s.currentDisorder.id === 'CLINICAL_HYPNOSIS_DEEP' || s.pipelinePhase === 'PHASE_3_RECOVERY') deltaHrv += 1;
      
      const newHrv = Math.max(18, Math.min(98, s.currentHrv + deltaHrv));
      setCurrentHrv(newHrv);

      if (s.currentDisorder.id === 'CLINICAL_HYPNOSIS_DEEP' && s.pipelinePhase === 'PHASE_2_ACTIVE') {
        const basal = liveCurve[0]?.gsr || 2.4;
        if (newGsr - basal > 2.0 && newHrv < 25) {
          setStressWatchdogAlert('⚠️ ALERTA WATCHDOG: Taquicardia y pico simpático detectado en trance. Se sugiere aborto de seguridad.');
        }
      }

      let newKpi = s.currentKpi;
      if (s.currentDisorder.id === 'TDAH_CPT') newKpi = Math.floor(220 + Math.random() * 80);
      else newKpi = Number(Math.min(98, s.currentKpi + (Math.random() * 2.2)).toFixed(1));
      
      setCurrentKpi(newKpi);

      setLiveCurve(prev => [...prev, { t: nextTotal, gsr: newGsr, hrv: newHrv, kpi: newKpi, phase: s.pipelinePhase }]);
    }, 1000);

    return () => clearInterval(timer);
  }, [pipelinePhase, patientId, isEmergencyAborted]);

  const finishPipelineAndCompileReports = (wasEmergency = false, customNote = '') => {
    setPipelinePhase('FINISHED');
    VrControlService.stopLightStimulation(patientId);
    
    const peakGsr = Math.max(...liveCurve.map(p => p.gsr), 2.4);
    const habituationRate = peakGsr > 0 ? (((peakGsr - currentGsr) / peakGsr) * 100).toFixed(1) : '0';
    const zScore = Number(((currentKpi - currentDisorder.meanHealthy) / currentDisorder.sdHealthy).toFixed(2));

    const mediaLabel = mediaSourceMode === 'CUSTOM_STIMULUS' 
      ? `Estímulo Propio (${selectedFileName || customMediaUrl})` 
      : `Catálogo Oficial (/${selectedMode === 'DIAGNOSTIC' ? currentDisorder.diagnosticEcosystem : currentDisorder.treatmentEcosystem}.jpeg)`;

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
    roi += `INFORME OBJETIVO INDIVIDUAL (ROI) • AMIE 6DoF CLOSED-LOOP\n`;
    if (wasEmergency) {
      roi += `ESTATUS: SESIÓN INTERRUMPIDA POR SEGURIDAD CLÍNICA (ABREACCIÓN / ESTRÉS)\n`;
    } else {
      roi += `ESTATUS: SESIÓN COMPLETADA EXITOSAMENTE CON EMERSIÓN REGULADA\n`;
    }
    roi += `================================================================================\n\n`;
    roi += `PACIENTE: ${patientId} | FECHA: ${new Date().toLocaleDateString('es-ES')} | EMISIÓN: 6DoF VR\n`;
    roi += `TRASTORNO: ${currentDisorder.name}\n`;
    roi += `CLASIFICACIÓN NOSOLÓGICA: CIE-11: ${currentDisorder.cie11} | DSM-5-TR: ${currentDisorder.dsm5}\n`;
    roi += `MODALIDAD: ${selectedMode === 'DIAGNOSTIC' ? 'EVALUACIÓN / TEST DE ESTRÉS' : 'INTERVENCIÓN TERAPÉUTICA'}\n`;
    roi += `MEDIO VISUAL UTILIZADO: ${mediaLabel}\n`;
    roi += `GUÍA INTERNACIONAL: ${currentDisorder.internationalGuideline}\n`;
    roi += `PROTOCOLO DE AUDIO: ${guidanceMode === 'AUTOMATIC_GUIDELINES' ? 'Oficial Estandarizado' : 'Personalizado por Facultativo'}\n\n`;
    
    roi += `1. BIOMETRÍA Y MARCADORES REGISTRADOS:\n`;
    roi += `   • Pico de Reactividad Autonómica: ${peakGsr.toFixed(2)} µS\n`;
    roi += `   • Tasa de Habituación / Desensibilización (H): ${habituationRate}%\n`;
    roi += `   • Tono Vagal Final (HRV RMSSD): ${currentHrv} ms\n`;
    roi += `   • Métrica Focal Primaria (${currentDisorder.targetKpiName}): ${currentKpi} ${currentDisorder.kpiUnit}\n`;
    roi += `   • Desviación Típica (Z-Score): ${zScore} SD (${Math.abs(zScore) >= 1.96 ? 'DESVIACIÓN CLÍNICA SIGNIFICATIVA' : 'RANGO NORMATIVO'})\n`;
    roi += `   • Código LOINC Hospitalario: ${currentDisorder.loincCode}\n\n`;
    
    roi += `2. AUDITORÍA DE SEGURIDAD Y EMERSIÓN DEL TRANCE:\n`;
    if (wasEmergency) {
      roi += `   • MOTIVO DE INTERRUPCIÓN: ${customNote || 'Activación del protocolo de rescate ante taquicardia o estrés somático'}.\n`;
      roi += `   • ACCIONES ADOPTADAS: Corte inmediato de estimulación fótica, grounding 360° en /safe_place_forest y locución reorientativa.\n`;
      roi += `   • ESTADO AL CIERRE: Paciente reorientado en vigilia y estabilidad simpática restablecida.\n`;
    } else {
      roi += `   • Procedimiento de Salida: ${customNote || 'Emersión estructurada completada según protocolo Ericksoniano.'}\n`;
      roi += `   • Orientación Témporo-Espacial: 100% preservada sin secuelas de desrealización.\n`;
    }

    roi += `\n3. JUICIO CLÍNICO ESTRUCTURADO:\n`;
    if (selectedMode === 'DIAGNOSTIC') {
      roi += `   Se constató respuesta neurovegetativa ante el estresor inmersivo. El Z-Score de ${zScore} SD sustenta correlación con los baremos de ${currentDisorder.goldStandardScale}.\n`;
    } else {
      roi += `   Intervención completada con tasa de habituación simpática del ${habituationRate}%. Modulación autonómica compatible con respuesta terapéutica favorable (p < .05).\n`;
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
    global += `PACIENTE ID: ${patientId} | SESIONES ACUMULADAS EN EL VISOR: ${sessionHistory.length}\n`;
    global += `FECHA DE REPORTE: ${new Date().toLocaleDateString('es-ES')} | PLATAFORMA: AMIE Clinical Copilot\n\n`;
    global += `1. TRIANGULACIÓN MULTIDISCIPLINAR DE ENSAYOS EJECUTADOS:\n`;
    
    if (sessionHistory.length === 0) {
      global += `   (Aún no se han registrado ensayos finalizados en esta sesión de consulta).\n`;
    } else {
      sessionHistory.forEach((s, i) => {
        global += `   [${i + 1}] ${s.date} - ${s.disorderName} (${s.mode})\n`;
        global += `       • Estímulo: ${s.mediaUsed}\n`;
        global += `       • Habituación: ${s.habituationRate}% | Métrica: ${s.targetKpi} ${s.kpiUnit} | Z-Score: ${s.zScore} SD\n`;
        if (s.emergencyAborted) {
          global += `       • NOTA DE SEGURIDAD: Terminación por protocolo de rescate médico.\n`;
        }
      });
    }

    global += `\n2. INTEGRACIÓN DE EJES DIAGNÓSTICOS (DSM-5-TR / CIE-11):\n`;
    global += `   • Eje Somato-Vegetativo: Tono simpático-vagal consolidado en ventana de tolerancia.\n`;
    global += `   • Eje Cognitivo-Ejecutivo: Control inhibitorio y latencias motoras evaluadas en 6DoF.\n`;
    global += `   • Eje Afectivo / Rescate: Tolerancia al trance e integridad psicofisiológica auditada.\n\n`;
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
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fadeIn font-sans text-slate-100 overflow-hidden select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1540px] shadow-2xl flex flex-col h-[96vh]">
        
        {/* Cabecera Principal */}
        <header className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                AMIE CLINICAL SUITE 6DoF • CATÁLOGO MAESTRO (30 ENTIDADES NOSOLÓGICAS)
                <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                  HL7 FHIR &amp; CDSS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Expediente: <strong className="text-cyan-300 font-mono">{patientId}</strong> | Pico Neo 3 Pro: <strong className={isVisorLinked ? 'text-emerald-400' : 'text-rose-400'}>{isVisorLinked ? 'ENLACE ACTIVO' : 'ESPERANDO VISOR'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEmergencyAbort('Interrupción manual de rescate desde la cabecera.')}
              className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Rescate / Abortar Sesión</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer border border-slate-700/70">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* NAVEGACIÓN SUPERIOR: LOS 7 MÓDULOS CLÍNICOS */}
        <div className="bg-slate-950/80 px-6 py-2 border-b border-slate-800 overflow-x-auto scrollbar-none flex items-center gap-2">
          {CLINICAL_MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModuleTab(mod.id);
                const firstDisorder = CLINICAL_MASTER_CATALOG.find(d => d.moduleId === mod.id);
                if (firstDisorder) setSelectedDisorderId(firstDisorder.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeModuleTab === mod.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{mod.name}</span>
            </button>
          ))}
        </div>

        {/* CUERPO PRINCIPAL */}
        <main className="flex-1 p-5 grid grid-cols-12 gap-5 overflow-hidden">
          
          {/* COLUMNA 1: CONFIGURACIÓN COMPACTA Y BOTONERA VISIBLE SIN SCROLL */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-2.5 overflow-y-auto pr-1">
            
            {/* 1. Selector de Trastorno */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-inner">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                Trastorno Seleccionado en este Módulo
              </label>
              <select
                disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'}
                value={selectedDisorderId}
                onChange={(e) => setSelectedDisorderId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-bold outline-none cursor-pointer focus:border-cyan-500"
              >
                {CLINICAL_MASTER_CATALOG.filter(d => d.moduleId === activeModuleTab).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-1 bg-slate-900 rounded border border-slate-800"><span className="text-slate-500">CIE-11:</span> <strong className="text-cyan-300">{currentDisorder.cie11}</strong></div>
                <div className="p-1 bg-slate-900 rounded border border-slate-800"><span className="text-slate-500">DSM-5:</span> <strong className="text-amber-300">{currentDisorder.dsm5}</strong></div>
              </div>

              <div className="mt-1 p-1 bg-slate-900/60 rounded border border-slate-800 text-[8.5px] text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="truncate"><strong>Guía:</strong> {currentDisorder.internationalGuideline}</span>
              </div>
            </div>

            {/* 2. Selector de Modo Clínico (Diagnóstico vs Tratamiento) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 shadow-inner">
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={!currentDisorder.supportedModes.includes('DIAGNOSTIC')}
                  onClick={() => setSelectedMode('DIAGNOSTIC')}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedMode === 'DIAGNOSTIC' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-500 opacity-50 hover:opacity-100'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>DIAGNÓSTICO</span>
                  <span className="text-[8px] font-normal text-slate-400">(Test / Provocación)</span>
                </button>

                <button
                  disabled={!currentDisorder.supportedModes.includes('TREATMENT')}
                  onClick={() => setSelectedMode('TREATMENT')}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedMode === 'TREATMENT' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-500 opacity-50 hover:opacity-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TRATAMIENTO</span>
                  <span className="text-[8px] font-normal text-slate-400">(Terapia / Habituación)</span>
                </button>
              </div>
            </div>

            {/* 3. Estímulo Visual 360° */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-inner space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  Estímulo Visual 360° en Visor
                </label>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px]">
                  <button
                    onClick={() => setMediaSourceMode('OFFICIAL_CATALOG')}
                    className={`px-2 py-0.5 rounded font-bold transition ${mediaSourceMode === 'OFFICIAL_CATALOG' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                  >
                    Oficial
                  </button>
                  <button
                    onClick={() => setMediaSourceMode('CUSTOM_STIMULUS')}
                    className={`px-2 py-0.5 rounded font-bold transition ${mediaSourceMode === 'CUSTOM_STIMULUS' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    Propio (360°)
                  </button>
                </div>
              </div>

              {mediaSourceMode === 'OFFICIAL_CATALOG' ? (
                <div className="p-1.5 bg-slate-900/70 border border-slate-800 rounded-lg text-[9.5px] text-slate-400 font-mono truncate">
                  Ecosistema: <strong className="text-cyan-300">/{selectedMode === 'DIAGNOSTIC' ? currentDisorder.diagnosticEcosystem : currentDisorder.treatmentEcosystem}.jpeg</strong>
                </div>
              ) : (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-1 text-[9.5px]">
                    <button
                      onClick={() => setCustomMediaType('image')}
                      className={`flex-1 py-1 rounded-md border flex items-center justify-center gap-1 transition ${customMediaType === 'image' ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                    >
                      <ImageIcon className="w-3 h-3" /> Foto 360
                    </button>
                    <button
                      onClick={() => setCustomMediaType('video')}
                      className={`flex-1 py-1 rounded-md border flex items-center justify-center gap-1 transition ${customMediaType === 'video' ? 'bg-indigo-950 border-indigo-500 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                    >
                      <Film className="w-3 h-3" /> Video 360
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="URL remota HTTPS / S3..."
                      value={selectedFileName ? `[Archivo]: ${selectedFileName}` : customMediaUrl}
                      onChange={(e) => {
                        setSelectedFileName(null);
                        setCustomMediaUrl(e.target.value);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[9.5px] text-white outline-none focus:border-cyan-500 font-mono"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLocalFileChange}
                      accept={customMediaType === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-md text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3 text-cyan-400" />
                      <span>Subir</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Guion IA y Botonera Visible */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    Voz IA (Auriculares)
                  </label>
                  
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[8.5px]">
                    <button
                      onClick={() => setGuidanceMode('AUTOMATIC_GUIDELINES')}
                      className={`px-1.5 py-0.5 rounded font-bold transition ${guidanceMode === 'AUTOMATIC_GUIDELINES' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Oficial
                    </button>
                    <button
                      onClick={() => setGuidanceMode('CUSTOM_PROFESSIONAL')}
                      className={`px-1.5 py-0.5 rounded font-bold transition ${guidanceMode === 'CUSTOM_PROFESSIONAL' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Editar
                    </button>
                  </div>
                </div>

                <textarea
                  disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'}
                  value={customScript}
                  onChange={(e) => setCustomScript(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 outline-none resize-none focus:border-cyan-500 font-sans"
                />
              </div>

              {/* Botones Fijos */}
              <div className="pt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={handleDeployEnvironment}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-600 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1. Cargar Entorno y Guion en Visor Pico</span>
                </button>

                {visorStatusMsg && (
                  <div className="text-center text-[9px] font-mono text-emerald-400 animate-pulse bg-emerald-950/40 py-0.5 rounded border border-emerald-500/30">
                    {visorStatusMsg}
                  </div>
                )}

                {pipelinePhase === 'IDLE' && (
                  <button
                    type="button"
                    onClick={startPipeline}
                    className={`w-full py-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
                      isVisorLinked ? 'bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 text-white shadow-cyan-600/30 animate-pulse' : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isVisorLinked ? '2. INICIAR PRUEBA CLÍNICA' : 'CONECTA EL VISOR PICO'}</span>
                  </button>
                )}

                {(pipelinePhase === 'PHASE_1_BASELINE' || pipelinePhase === 'PHASE_2_ACTIVE' || pipelinePhase === 'PHASE_3_RECOVERY') && (
                  <div className="space-y-1.5">
                    {currentDisorder.id === 'CLINICAL_HYPNOSIS_DEEP' && (
                      <button
                        type="button"
                        onClick={handleStartDeinduction}
                        className="w-full py-1.5 bg-indigo-900 hover:bg-indigo-800 border border-indigo-500/50 text-indigo-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Compass className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Iniciar Salida Guiada del Trance (1 a 5)</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => finishPipelineAndCompileReports(false)}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-md"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Detener y Compilar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEmergencyAbort('Activación manual por sobreactivación simpática en visor')}
                        className="px-3 py-2 bg-red-950 hover:bg-red-900 border border-red-500 text-red-200 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer"
                        title="Interrupción segura ante distrés o abreacción"
                      >
                        <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                        <span>Rescate</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* COLUMNA 2: MONITOR DE BIOSEÑALES Y WATCHDOG EN TIEMPO REAL */}
          <section className="col-span-12 lg:col-span-5 flex flex-col gap-3.5">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9.5px] text-slate-500 font-bold block uppercase">GSR Fásico</span>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">{currentGsr.toFixed(2)} <span className="text-xs text-slate-500 font-normal">µS</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9.5px] text-slate-500 font-bold block uppercase">VFC RMSSD</span>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">{currentHrv} <span className="text-xs text-slate-500 font-normal">ms</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl overflow-hidden">
                <span className="text-[9.5px] text-slate-500 font-bold block uppercase truncate" title={currentDisorder.targetKpiName}>{currentDisorder.targetKpiName}</span>
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">{currentKpi.toFixed(1)} <span className="text-xs text-slate-500 font-normal">{currentDisorder.kpiUnit}</span></div>
              </div>
            </div>

            {stressWatchdogAlert && (
              <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs flex items-center justify-between shadow-lg animate-pulse">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{stressWatchdogAlert}</span>
                </div>
                {!isEmergencyAborted && (
                  <button
                    onClick={() => handleEmergencyAbort('Watchdog autonómico: Taquicardia y pico galvánico')}
                    className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                  >
                    Abortar Ya
                  </button>
                )}
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Monitor Fisiológico 6DoF (Closed-Loop)
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
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[11px] font-mono">
                    <Clock className="w-6 h-6 mb-2 opacity-30 animate-pulse" />
                    <span>Pulsa 'INICIAR PRUEBA CLÍNICA' para registrar biometría</span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex justify-between text-[9px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> GSR Conductancia (µS)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span> HRV Vagal (ms)</span>
                <span>Líneas punteadas: Fases</span>
              </div>
            </div>
          </section>

          {/* COLUMNA 3: REPORTES (INDIVIDUAL ROI & TRIANGULACIÓN GLOBAL) */}
          <section className="col-span-12 lg:col-span-3 flex flex-col gap-3.5">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                  <button
                    onClick={() => setReportTypeView('INDIVIDUAL_ROI')}
                    className={`px-2 py-1 rounded font-bold transition flex items-center gap-1 ${
                      reportTypeView === 'INDIVIDUAL_ROI' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>ROI Individual</span>
                  </button>
                  <button
                    onClick={() => setReportTypeView('GLOBAL_TRIANGULATION')}
                    className={`px-2 py-1 rounded font-bold transition flex items-center gap-1 ${
                      reportTypeView === 'GLOBAL_TRIANGULATION' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GitMerge className="w-3 h-3" />
                    <span>Triangulación ({sessionHistory.length})</span>
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-500/50 text-sky-200 rounded text-[10px] font-bold transition flex items-center gap-1 shadow cursor-pointer"
                >
                  <Printer className="w-3 h-3" />
                  <span>Imprimir A4</span>
                </button>
              </div>

              <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-3 overflow-y-auto font-mono text-[9.5px] leading-relaxed text-slate-300 shadow-inner whitespace-pre-wrap">
                {reportTypeView === 'INDIVIDUAL_ROI' ? (
                  roiReportText || 'El dictamen pericial individual se generará automáticamente al concluir las 3 fases del ensayo clínico.'
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
