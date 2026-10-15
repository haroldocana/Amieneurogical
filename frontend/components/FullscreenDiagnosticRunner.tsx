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
    targetKpiName: 'Simetría Frontal Alpha', kpiUnit: 'Ratio', defaultHz: 10.0, phase1Sec: 30, phase2Sec: 180
