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
    guidelineScriptTreatment: 'Ent
