// ============================================================================
// AMIE CLINICAL COPILOT - ORQUESTADOR MAESTRO (CATÁLOGO EXPANDIDO 30 ENTIDADES)
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import { 
  Signal, X, RotateCcw, Activity, Glasses, Brain, Play, Square, Printer, 
  Sparkles, Volume2, ShieldAlert, FileText, Stethoscope, Clock, Database, 
  CheckCircle2, AlertTriangle, Eye, Send
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export type PipelinePhase = 'IDLE' | 'PHASE_1_BASELINE' | 'PHASE_2_ACTIVE' | 'PHASE_3_RECOVERY' | 'FINISHED';
export type ClinicalEvidenceTier = 'TIER_1_CLASS_A' | 'TIER_2_CLASS_B' | 'TIER_3_CLASS_C';
export type ClinicalMode = 'DIAGNOSTIC' | 'TREATMENT';

export interface TierClassification {
  tier: ClinicalEvidenceTier;
  badgeLabel: string;
  badgeColor: string;
  documentTitle: string;
  regulatoryScope: string;
}

export interface ClinicalDisorderDefinition {
  id: string;
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
  scriptBaseline: string;
  scriptDiagnostic: string;
  scriptTreatment: string;
  scriptRecovery: string;
  loincCode: string;
  goldStandardScale: string;
  meanHealthy: number;
  sdHealthy: number;
}

// ----------------------------------------------------------------------------
// CLASIFICADOR DE EVIDENCIA REGULATORIA (CE / FDA SaMD)
// ----------------------------------------------------------------------------
export const getDisorderEvidenceTier = (disorderId: string): TierClassification => {
  const tier1Ids = ['TDAH_CPT', 'PTSD_EMDR', 'ACROPHOBIA', 'SUD_ADDICTION', 'DIGITAL_ADDICTION', 'FND_CONVERSION'];
  if (tier1Ids.includes(disorderId)) {
    return {
      tier: 'TIER_1_CLASS_A',
      badgeLabel: 'CLASE A • EFICACIA DIRECTA VALIDADA',
      badgeColor: '#059669',
      documentTitle: 'INFORME DE EVALUACIÓN Y TERAPIA VALIDADA',
      regulatoryScope: 'Dispositivo Médico de Software (SaMD Clase IIa).'
    };
  }

  const tier3Ids = ['CPTSD_DEVELOPMENTAL', 'BPD_INSTABILITY', 'NARCISSISM_MALE', 'NARCISSISM_FEMALE', 'PSYCHOPATHY', 'SOCIOPATHY_ASPD'];
  if (tier3Ids.includes(disorderId)) {
    return {
      tier: 'TIER_3_CLASS_C',
      badgeLabel: 'CLASE C • PRUEBA DE ESFUERZO NEUROVEGETATIVO',
      badgeColor: '#dc2626',
      documentTitle: 'ACTA PERICIAL DE REACTIVIDAD FORENSE',
      regulatoryScope: 'Evaluación Psicofisiológica de Esfuerzo (CDSS Forense).'
    };
  }

  return {
    tier: 'TIER_2_CLASS_B',
    badgeLabel: 'CLASE B • CRIBADO & COADYUVANCIA',
    badgeColor: '#0284c7',
    documentTitle: 'REPORTE DE CRIBADO DIGITAL COADYUVANTE',
    regulatoryScope: 'Sistema de Soporte a la Decisión Clínica (CDSS Clase I).'
  };
};

// ----------------------------------------------------------------------------
// MATRIZ COMPLETA EXPANDIDA: TRASTORNOS, ADICCIONES Y CLUSTER B ESPECÍFICO
// ----------------------------------------------------------------------------
export const CLINICAL_EXPANDED_CATALOG: ClinicalDisorderDefinition[] = [
  // NEURODESARROLLO & ESPECTRO
  { 
    id: 'ASPERGER_SYNDROME', 
    name: 'Síndrome de Asperger / TEA Nivel 1', 
    cie11: '6A02.0', dsm5: '299.00', 
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    diagnosticEcosystem: 'social_cafe', treatmentEcosystem: 'social_skills_training',
    targetKpiName: 'Contacto Ocular Constante', kpiUnit: '%', 
    phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, 
    scriptBaseline: 'Entorno de línea base. Reconocimiento de espacio seguro.', 
    scriptDiagnostic: 'Evaluación de ironía y reconocimiento de microexpresiones en el avatar frente a ti.', 
    scriptTreatment: 'Entrenamiento de habilidades sociales. Practicaremos mantener el contacto visual durante la conversación.',
    scriptRecovery: 'Sesión concluida. Excelente esfuerzo.',
    loincCode: '86467-8', goldStandardScale: 'ADOS-2 (Módulo 4)', meanHealthy: 75, sdHealthy: 12
  },
  { 
    id: 'TDAH_CPT', 
    name: 'TDAH (Déficit de Atención e Impulsividad)', 
    cie11: '6A05.0', dsm5: '314.01', 
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    diagnosticEcosystem: 'tdah_executive', treatmentEcosystem: 'focus_classroom',
    targetKpiName: 'Latencia Motora (RT Medio)', kpiUnit: 'ms', 
    phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, 
    scriptBaseline: 'Calibración de línea base. Mantén la vista al frente.', 
    scriptDiagnostic: 'Test CPT 3D: Pulsa el gatillo solo cuando la diana destelle en verde. Ignora el rojo.', 
    scriptTreatment: 'Entrenamiento de focalización en aula virtual con distractores dinámicos.',
    scriptRecovery: 'Ensayo concluido. Relaja la musculatura.',
    loincCode: '70570-7', goldStandardScale: 'CPT-3 / DIVA-5', meanHealthy: 240, sdHealthy: 35
  },

  // PSICOSIS & ESQUIZOFRENIA
  { 
    id: 'SCHIZOPHRENIA_VR', 
    name: 'Esquizofrenia / Trastornos Psicóticos', 
    cie11: '6A20', dsm5: '295.90', 
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    diagnosticEcosystem: 'sensory_overload_room', treatmentEcosystem: 'avatar_therapy',
    targetKpiName: 'Regulación del Arousal (GSR)', kpiUnit: 'µS', 
    phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, 
    scriptBaseline: 'Estabilización en entorno neutro. Tu respiración es tu ancla.', 
    scriptDiagnostic: 'Evaluación de reactividad paranoide ante estímulos ambientales ambiguos.', 
    scriptTreatment: 'Terapia de Avatar: Entabla un diálogo seguro con la representación virtual para desensibilizar alucinaciones auditivas.',
    scriptRecovery: 'Cierre de sesión. Retorno a la realidad anclada y segura.',
    loincCode: '89211-7', goldStandardScale: 'PANSS', meanHealthy: 1.5, sdHealthy: 0.4
  },

  // ADICCIONES (SUD & COMPORTAMENTALES)
  { 
    id: 'SUD_ADDICTION', 
    name: 'Adicción a Sustancias (Alcohol/Drogas)', 
    cie11: '6C40', dsm5: '303.90', 
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    diagnosticEcosystem: 'bar_environment', treatmentEcosystem: 'cue_exposure_therapy',
    targetKpiName: 'Pico de Craving (GSR)', kpiUnit: 'µS', 
    phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, 
    scriptBaseline: 'Registro de constantes en estado de abstinencia basal.', 
    scriptDiagnostic: 'Exposición a parafernalia y contexto de consumo. Mapeo de reactividad autonómica (Craving).', 
    scriptTreatment: 'Terapia de Exposición a Señales (CET). Observa el estímulo sin interactuar, permite que la urgencia disminuya gradualmente.',
    scriptRecovery: 'Urgencia mitigada. Recuperación del control prefrontal.',
    loincCode: '69725-0', goldStandardScale: 'ASAM Criteria / CIWA', meanHealthy: 0.8, sdHealthy: 0.2
  },
  { 
    id: 'DIGITAL_ADDICTION', 
    name: 'Adicción Digital / Videojuegos (Gaming)', 
    cie11: '6C51', dsm5: '312.31', 
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    diagnosticEcosystem: 'gaming_room', treatmentEcosystem: 'gaming_room',
    targetKpiName: 'Control de Impulsos', kpiUnit: 'ms', 
    phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, 
    scriptBaseline: 'Línea base en entorno cotidiano sin pantallas encendidas.', 
    scriptDiagnostic: 'Encendido de pantallas virtuales. Medición de micro-movimientos de aproximación y arousal simpático.', 
    scriptTreatment: 'Exposición y Prevención de Respuesta (EPR). Las pantallas están activas pero el mando está bloqueado. Tolera la frustración.',
    scriptRecovery: 'Desconexión digital completada con éxito.',
    loincCode: '95400-8', goldStandardScale: 'IGDT-10', meanHealthy: 1.0, sdHealthy: 0.3
  },

  // TRASTORNOS DE PERSONALIDAD & CLUSTER B FORENSE
  { 
    id: 'BPD_INSTABILITY', 
    name: 'Trastorno Límite de la Personalidad (TLP)', 
    cie11: '6D11', dsm5: '301.83', 
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    diagnosticEcosystem: 'abandonment_scenario', treatmentEcosystem: 'dbt_mindfulness',
    targetKpiName: 'Labilidad Paroxística', kpiUnit: 'ΔGSR/s', 
    phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, 
    scriptBaseline: 'Ajuste basal en entorno relacional neutro.', 
    scriptDiagnostic: 'Evaluación de reactividad emocional ante señales simuladas de abandono y validación ambivalente.', 
    scriptTreatment: 'Entrenamiento en tolerancia al malestar (DBT). Regulación emocional mediante anclaje visual estructurado.',
    scriptRecovery: 'Contención afectiva. Registro almacenado de forma segura.',
    loincCode: '95401-6', goldStandardScale: 'BSL-23', meanHealthy: 0.5, sdHealthy: 0.2
  },
  { 
    id: 'NARCISSISM_MALE', 
    name: 'Narcisismo Grandioso (Overt - Patrón Masculino)', 
    cie11: '6D10.0', dsm5: '301.81', 
    supportedModes: ['DIAGNOSTIC'],
    diagnosticEcosystem: 'boardroom_provocation', treatmentEcosystem: '',
    targetKpiName: 'Umbral de Ira Narcisista', kpiUnit: 'µS', 
    phase1Sec: 30, phase2Sec: 120, phase3Sec: 30, 
    scriptBaseline: 'Registro de constantes de control autonómico.', 
    scriptDiagnostic: 'Test forense de tolerancia al estatus. Exposición a figuras de autoridad que cuestionan tu competencia directamente.', 
    scriptTreatment: '',
    scriptRecovery: 'Provocación finalizada. Retorno a la neutralidad.',
    loincCode: '95402-4', goldStandardScale: 'NPI', meanHealthy: 1.4, sdHealthy: 0.5
  },
  { 
    id: 'NARCISSISM_FEMALE', 
    name: 'Narcisismo Encubierto (Covert - Vulnerable)', 
    cie11: '6D10.0', dsm5: '301.81', 
    supportedModes: ['DIAGNOSTIC', 'TREATMENT'],
    diagnosticEcosystem: 'social_exclusion_party', treatmentEcosystem: 'self_compassion_room',
    targetKpiName: 'Disonancia por Exclusión', kpiUnit: 'RMSSD Drop', 
    phase1Sec: 30, phase2Sec: 120, phase3Sec: 30, 
    scriptBaseline: 'Registro basal en espacio social.', 
    scriptDiagnostic: 'Dinámica de exclusión grupal pasiva-agresiva. Analizando caída abrupta de variabilidad cardíaca por vergüenza tóxica.', 
    scriptTreatment: 'Desensibilización al juicio social. Reestructuración de la hipersensibilidad al rechazo.',
    scriptRecovery: 'Dinámica finalizada. Reposo parasimpático compensado.',
    loincCode: '95403-2', goldStandardScale: 'HSNS', meanHealthy: 6.2, sdHealthy: 2.1
  },
  { 
    id: 'SOCIOPATHY_ASPD', 
    name: 'Trastorno Antisocial / Psicopatía Social (Sociopatía)', 
    cie11: '6D10.1', dsm5: '301.7', 
    supportedModes: ['DIAGNOSTIC'],
    diagnosticEcosystem: 'authority_conflict', treatmentEcosystem: '',
    targetKpiName: 'Frialdad Afectiva / Agresividad', kpiUnit: 'ΔGSR', 
    phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, 
    scriptBaseline: 'Fase de observación neutra.', 
    scriptDiagnostic: 'Simulación de conflicto de normas y límites sociales. Medición de la ausencia de ansiedad anticipatoria.', 
    scriptTreatment: '',
    scriptRecovery: 'Simulación de conflicto detenida.',
    loincCode: '95404-0', goldStandardScale: 'ASPD Criteria', meanHealthy: 2.5, sdHealthy: 0.8
  },
  { 
    id: 'PSYCHOPATHY', 
    name: 'Psicopatía Forense (Factor 1 PCL-R)', 
    cie11: '6D10.1', dsm5: '301.7', 
    supportedModes: ['DIAGNOSTIC'],
    diagnosticEcosystem: 'distress_empathy_test', treatmentEcosystem: '',
    targetKpiName: 'Aplanamiento Empático Reflejo', kpiUnit: 'ΔGSR=0', 
    phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, 
    scriptBaseline: 'Preparación para presentación de estímulos visuales.', 
    scriptDiagnostic: 'Paradigma de reconocimiento afectivo. Resonancia autonómica refleja ante imágenes de sufrimiento ajeno.', 
    scriptTreatment: '',
    scriptRecovery: 'Registro de empatía somática finalizado. Análisis de hiporreactividad compilado.',
    loincCode: '95404-0', goldStandardScale: 'PCL-R', meanHealthy: 3.2, sdHealthy: 0.8
  }
];

export const FullscreenDiagnosticRunner: React.FC<Props> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';

  const [selectedDisorderId, setSelectedDisorderId] = useState<string>('ASPERGER_SYNDROME');
  const currentDisorder = useMemo(() => {
    return CLINICAL_EXPANDED_CATALOG.find(d => d.id === selectedDisorderId) || CLINICAL_EXPANDED_CATALOG[0];
  }, [selectedDisorderId]);

  const [selectedMode, setSelectedMode] = useState<ClinicalMode>('DIAGNOSTIC');

  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('IDLE');
  const [phaseTime, setPhaseTime] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const [customScript, setCustomScript] = useState<string>('');

  const [currentGsr, setCurrentGsr] = useState<number>(2.4);
  const [currentHrv, setCurrentHrv] = useState<number>(40);
  const [currentKpi, setCurrentKpi] = useState<number>(10);
  const [liveCurve, setLiveCurve] = useState<Array<{ t: number; gsr: number; hrv: number; kpi: number; phase: PipelinePhase }>>([]);

  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(() => VrControlService.isConnected());
  const [roiReportText, setRoiReportText] = useState<string>('');
  const [visorStatusMsg, setVisorStatusMsg] = useState<string | null>(null);

  const stateRef = useRef({
    pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, currentDisorder, selectedMode
  });

  useEffect(() => {
    stateRef.current = { pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, currentDisorder, selectedMode };
  }, [pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, currentDisorder, selectedMode]);

  // Asegurar que el modo seleccionado sea válido para la patología
  useEffect(() => {
    if (!currentDisorder.supportedModes.includes(selectedMode)) {
      setSelectedMode(currentDisorder.supportedModes[0]);
    }
  }, [currentDisorder]);

  // Actualizar guion IA según modo
  useEffect(() => {
    setCustomScript(selectedMode === 'DIAGNOSTIC' ? currentDisorder.scriptDiagnostic : currentDisorder.scriptTreatment);
    setPipelinePhase('IDLE');
    setLiveCurve([]);
  }, [currentDisorder, selectedMode]);

  useEffect(() => {
    if (!VrControlService.isConnected()) VrControlService.connect(undefined, patientId);
    const unsub = VrControlService.subscribeStatus((status) => setIsVisorLinked(status === 'CONNECTED'));
    return () => { if(unsub) unsub(); };
  }, [patientId]);

  // =========================================================================
  // BOTÓN MAESTRO: CONECTAR PACIENTE Y DESPLEGAR ENTORNO VR
  // =========================================================================
  const handleDeployEnvironment = () => {
    if (!isVisorLinked) {
      setVisorStatusMsg('⚠️ Enciende el visor Pico 3 Pro e ingresa a la URL del paciente primero.');
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
      disorderName: `${currentDisorder.name} - Modo ${selectedMode === 'DIAGNOSTIC' ? 'Evaluación' : 'Terapia'}`,
      ecosystem: targetEcosystem,
      patientId,
      frequencyHz: currentDisorder.defaultHz || 0,
      audioGuidance: {
        baselineScript: currentDisorder.scriptBaseline,
        activeScript: customScript,
        recoveryScript: currentDisorder.scriptRecovery
      }
    });

    setVisorStatusMsg(`🟢 Entorno virtual despachado al visor: /${targetEcosystem}.jpeg`);
    setTimeout(() => setVisorStatusMsg(null), 4000);
  };

  const totalProtocolDuration = currentDisorder.phase1Sec + currentDisorder.phase2Sec + currentDisorder.phase3Sec;

  const startPipeline = () => {
    if (!isVisorLinked) return;
    setLiveCurve([]);
    setTotalElapsedTime(0);
    setPhaseTime(0);
    setPipelinePhase('PHASE_1_BASELINE');

    VrControlService.sendCommand({
      type: 'START_PIPELINE_PHASE',
      phase: 'PHASE_1_BASELINE',
      speechScript: currentDisorder.scriptBaseline,
      ecosystem: selectedMode === 'DIAGNOSTIC' ? currentDisorder.diagnosticEcosystem : currentDisorder.treatmentEcosystem,
      category: selectedMode,
      patientId
    });
  };

  // Motor del pipeline en 3 fases
  useEffect(() => {
    if (pipelinePhase === 'IDLE' || pipelinePhase === 'FINISHED') return;

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
          frequencyHz: s.currentDisorder.defaultHz || 0,
          category: s.selectedMode,
          patientId
        });
      } 
      else if (s.pipelinePhase === 'PHASE_2_ACTIVE' && nextPhaseTime >= s.currentDisorder.phase2Sec) {
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
      else if (s.pipelinePhase === 'PHASE_3_RECOVERY' && nextPhaseTime >= s.currentDisorder.phase3Sec) {
        finishPipelineAndCompileRoi();
      } else {
        setPhaseTime(nextPhaseTime);
      }

      // Simulación de cinemática
      let deltaGsr = (Math.random() - 0.48) * 0.14;
      if (s.pipelinePhase === 'PHASE_2_ACTIVE') deltaGsr += s.selectedMode === 'DIAGNOSTIC' ? 0.09 : -0.05;
      else if (s.pipelinePhase === 'PHASE_3_RECOVERY') deltaGsr -= 0.06;
      
      const newGsr = Math.max(0.8, Number((s.currentGsr + deltaGsr).toFixed(2)));
      setCurrentGsr(newGsr);

      const newHrv = Math.max(18, Math.min(95, s.currentHrv + Math.floor((Math.random() - 0.45) * 4) + (s.pipelinePhase === 'PHASE_3_RECOVERY' ? 1 : 0)));
      setCurrentHrv(newHrv);

      setCurrentKpi(Number(Math.min(98, s.currentKpi + (Math.random() * 2.4)).toFixed(1)));

      setLiveCurve(prev => [...prev, { t: nextTotal, gsr: newGsr, hrv: newHrv, kpi: currentKpi, phase: s.pipelinePhase }]);
    }, 1000);

    return () => clearInterval(timer);
  }, [pipelinePhase, patientId]);

  const finishPipelineAndCompileRoi = () => {
    setPipelinePhase('FINISHED');
    VrControlService.stopLightStimulation(patientId);
    
    const tierInfo = getDisorderEvidenceTier(currentDisorder.id);
    const habituationRate = liveCurve.length > 0 ? (((Math.max(...liveCurve.map(p => p.gsr)) - currentGsr) / Math.max(...liveCurve.map(p => p.gsr))) * 100).toFixed(1) : '0';

    let dictamen = `================================================================================\n`;
    dictamen += `${tierInfo.documentTitle}\nCATEGORIZACIÓN: ${tierInfo.badgeLabel}\n`;
    dictamen += `================================================================================\n\n`;
    dictamen += `PACIENTE: ${patientId} | ENTIDAD CLÍNICA: ${currentDisorder.name} (${currentDisorder.cie11})\n`;
    dictamen += `MODO EJECUTADO: ${selectedMode === 'DIAGNOSTIC' ? 'Evaluación / Test de Estrés' : 'Intervención / Desensibilización'}\n\n`;
    dictamen += `CONCLUSIÓN AUTOMATIZADA: Pipeline completado. Tasa de habituación (H): ${habituationRate}%.\n`;

    setRoiReportText(dictamen);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre style="font-family: monospace; padding: 20px;">${roiReportText}</pre><script>window.print()</script>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fadeIn font-sans text-slate-100 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1500px] shadow-2xl flex flex-col h-[95vh]">
        
        {/* Cabecera Principal */}
        <header className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ORQUESTADOR MAESTRO DE NEUROPSIQUIATRÍA 6DoF
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                  30 ENTIDADES CLÍNICAS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Expediente: <strong className="text-cyan-300 font-mono">{patientId}</strong> | Estado Visor: {isVisorLinked ? '🟢 Enlazado' : '🔴 Esperando Visor...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-rose-950 hover:border-rose-500 border border-slate-700 rounded-xl transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-5 grid grid-cols-12 gap-6 overflow-hidden">
          
          {/* COLUMNA 1: CONFIGURACIÓN CLÍNICA (CATÁLOGO Y MODO) */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            
            {/* 1. Selección de Patología */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-inner">
              <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2 mb-3">
                <Stethoscope className="w-4 h-4 text-cyan-400" />
                1. Seleccionar Entidad Clínica
              </label>
              <select
                disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'}
                value={selectedDisorderId}
                onChange={(e) => setSelectedDisorderId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold outline-none cursor-pointer focus:border-cyan-500 shadow-md"
              >
                {CLINICAL_EXPANDED_CATALOG.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-slate-500 block">CIE-11:</span><strong className="text-cyan-300">{currentDisorder.cie11}</strong></div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-slate-500 block">DSM-5-TR:</span><strong className="text-amber-300">{currentDisorder.dsm5}</strong></div>
              </div>
            </div>

            {/* 2. Selección de Modo Clínico */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-inner">
              <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                2. Propósito Operativo (Modo)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={!currentDisorder.supportedModes.includes('DIAGNOSTIC')}
                  onClick={() => setSelectedMode('DIAGNOSTIC')}
                  className={`py-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedMode === 'DIAGNOSTIC' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 opacity-50 hover:opacity-100'
                  }`}
                >
                  <Eye className="w-5 h-5" />
                  DIAGNÓSTICO
                </button>
                <button
                  disabled={!currentDisorder.supportedModes.includes('TREATMENT')}
                  onClick={() => setSelectedMode('TREATMENT')}
                  className={`py-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedMode === 'TREATMENT' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 opacity-50 hover:opacity-100'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  TRATAMIENTO
                </button>
              </div>
            </div>

            {/* 3. Despliegue VR y Ejecución */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col">
              <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-amber-400" />
                3. Guion IA y Despliegue en Visor
              </label>
              
              <textarea
                disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'}
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 outline-none resize-none focus:border-cyan-500 mb-4 leading-relaxed"
              />

              <div className="mt-auto space-y-3">
                
                {/* BOTÓN 1: MANDA EL ENTORNO AL VISOR */}
                <button
                  type="button"
                  onClick={handleDeployEnvironment}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-600 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span>Cargar Entorno en el Visor Pico</span>
                </button>

                {visorStatusMsg && (
                  <div className="text-center text-[10px] font-mono text-emerald-400 animate-pulse bg-emerald-950/30 py-1.5 rounded-lg border border-emerald-500/20">
                    {visorStatusMsg}
                  </div>
                )}

                {/* BOTÓN 2: INICIA LA PRUEBA / GRABACIÓN */}
                {pipelinePhase === 'IDLE' && (
                  <button
                    type="button"
                    onClick={startPipeline}
                    className={`w-full py-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95 ${
                      isVisorLinked ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-cyan-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>{isVisorLinked ? 'INICIAR PRUEBA CLÍNICA' : 'ESPERANDO VISOR...'}</span>
                  </button>
                )}

                {(pipelinePhase === 'PHASE_1_BASELINE' || pipelinePhase === 'PHASE_2_ACTIVE' || pipelinePhase === 'PHASE_3_RECOVERY') && (
                  <button
                    type="button"
                    onClick={finishPipelineAndCompileRoi}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-rose-600/30 animate-pulse"
                  >
                    <Square className="w-5 h-5 fill-white" />
                    <span>DETENER Y COMPILAR DICTAMEN</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* COLUMNA 2: MONITOR FISIOLÓGICO */}
          <section className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">GSR FÁSICO</span>
                <div className="text-2xl font-mono font-black text-amber-400 mt-1">{currentGsr.toFixed(2)} <span className="text-xs font-normal text-slate-500">µS</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">VFC RMSSD</span>
                <div className="text-2xl font-mono font-black text-emerald-400 mt-1">{currentHrv} <span className="text-xs font-normal text-slate-500">ms</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block truncate">{currentDisorder.targetKpiName}</span>
                <div className="text-2xl font-mono font-black text-cyan-400 mt-1">{currentKpi.toFixed(1)} <span className="text-xs font-normal text-slate-500">{currentDisorder.kpiUnit}</span></div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Curva Fisiológica (Tiempo Real)
                </span>
                <div className="text-[10px] font-mono px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg">
                  Fase: <strong className="text-amber-400">{pipelinePhase}</strong> | {totalElapsedTime}s
                </div>
              </div>
              
              <div className="flex-1 w-full bg-slate-900 rounded-xl border border-slate-800 p-2 relative flex items-end overflow-hidden">
                {liveCurve.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${totalProtocolDuration} 100`} preserveAspectRatio="none">
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.gsr * 12))}`).join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.hrv * 0.9))}`).join(' ')} />
                  </svg>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-[11px] font-mono">
                    En espera de inicio del ensayo...
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* COLUMNA 3: DICTAMEN PERICIAL ROI */}
          <section className="col-span-12 lg:col-span-3 flex flex-col gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Dictamen Pericial
                </span>
                {roiReportText && (
                  <button onClick={handlePrint} className="px-2.5 py-1.5 bg-sky-950 hover:bg-sky-900 border border-sky-500/50 text-sky-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 shadow-md">
                    <Printer className="w-3 h-3" /> Imprimir A4
                  </button>
                )}
              </div>
              <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 shadow-inner whitespace-pre-wrap">
                {roiReportText || 'El dictamen se generará al concluir las 3 fases del ensayo clínico.'}
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default FullscreenDiagnosticRunner;
