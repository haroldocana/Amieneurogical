// ============================================================================
// AMIE CLINICAL COPILOT - CONSOLA DE TRATAMIENTO & PIPELINE CLÍNICO DE 3 FASES
// frontend/components/FullscreenTreatmentConsole.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import {
  Sparkles,
  Activity,
  Play,
  Square,
  Printer,
  Volume2,
  ShieldAlert,
  Glasses,
  RotateCcw,
  FileText,
  X,
  Stethoscope,
  Signal,
  CheckCircle2,
  Sliders,
  Heart,
  Zap,
  Timer
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export type PipelinePhase = 'IDLE' | 'PHASE_1_BASELINE' | 'PHASE_2_ACTIVE' | 'PHASE_3_RECOVERY' | 'FINISHED';

export interface TreatmentProtocolDefinition {
  id: string;
  name: string;
  cie11: string;
  dsm5: string;
  defaultCategory: 'TREATMENT' | 'DIAGNOSTIC';
  ecosystem: string;
  targetKpiName: string;
  kpiUnit: string;
  defaultHz?: number;
  phase1Sec: number;
  phase2Sec: number;
  phase3Sec: number;
  scriptBaseline: string;
  scriptActiveDiagnostic: string;
  scriptActiveTreatment: string;
  scriptRecovery: string;
  clinicalObjective: string;
}

export const TREATMENT_STANDARDIZED_PROTOCOLS: TreatmentProtocolDefinition[] = [
  {
    id: 'VRET_ACROPHOBIA',
    name: '01. Exposición Jerárquica en Alturas (Acrofobia VRET)',
    cie11: '6B03.0',
    dsm5: '300.29',
    defaultCategory: 'DIAGNOSTIC',
    ecosystem: 'acrophobia_roof',
    targetKpiName: 'Oscilación Postural (Head-Sway)',
    kpiUnit: 'cm',
    phase1Sec: 30,
    phase2Sec: 120,
    phase3Sec: 30,
    scriptBaseline: 'Calibración de línea base en reposo. Permanece de pie observando la plataforma con respiración tranquila.',
    scriptActiveDiagnostic: 'Exposición a borde de azotea. Mira hacia el vacío perimetral. Evaluamos reactividad simpática y equilibrio.',
    scriptActiveTreatment: 'Desensibilización en altura. Sincroniza tu respiración en 4 tiempos mientras sostienes la mirada al frente.',
    scriptRecovery: 'Regresando a zona segura interior. Respira profundamente y permite que la tensión descienda.',
    clinicalObjective: 'Medición de taquicardia situacional fóbica y extinción mediante habituación visual en 6DoF.'
  },
  {
    id: 'VRET_AEROPHOBIA',
    name: '02. Simulación de Vuelo y Confinamiento (Aerofobia)',
    cie11: '6B03.2',
    dsm5: '300.29',
    defaultCategory: 'DIAGNOSTIC',
    ecosystem: 'aerophobia_cabin',
    targetKpiName: 'Pico Galvánico en Despegue',
    kpiUnit: 'µS',
    phase1Sec: 30,
    phase2Sec: 120,
    phase3Sec: 30,
    scriptBaseline: 'Fase de embarque en cabina. Mantén la espalda apoyada en el asiento y los hombros sueltos.',
    scriptActiveDiagnostic: 'Fase de aceleración y despegue con turbulencia. Evaluamos umbral de pánico respiratorio.',
    scriptActiveTreatment: 'Control de pánico en vuelo. Enfoca la atención en el anclaje somático de tus manos relajadas.',
    scriptRecovery: 'Vuelo estabilizado en altitud de crucero. La vibración cesa y el ritmo cardíaco se normaliza.',
    clinicalObjective: 'Registro de respuesta vasovagal ante ruidos de turbulencia y confinamiento espacial.'
  },
  {
    id: 'EMDR_RECONSOLIDATION',
    name: '03. Reprocesamiento Sacádico Bilateral (EMDR 3D / TEPT)',
    cie11: '6B40',
    dsm5: '309.81',
    defaultCategory: 'TREATMENT',
    ecosystem: 'emdr_memory',
    targetKpiName: 'Desensibilización ΔGSR',
    kpiUnit: 'µS',
    phase1Sec: 30,
    phase2Sec: 150,
    phase3Sec: 30,
    scriptBaseline: 'Instalación de recurso seguro. Conéctate con una sensación de contención corporal.',
    scriptActiveDiagnostic: 'Evocación del estímulo diana. Registramos el nivel de desbordamiento emocional sin intervención.',
    scriptActiveTreatment: 'Sigue el haz de luz horizontal únicamente con tus ojos, sin mover la cabeza, sosteniendo la memoria.',
    scriptRecovery: 'Detén el seguimiento visual. Inhala profundamente y suelta todo el aire dejando ir la huella de malestar.',
    clinicalObjective: 'Inducción de movimientos sacádicos para reconsolidación mnémica y caída de hiperarousal amigdalino.'
  },
  {
    id: 'NEURO_HYPNOSIS_THETA',
    name: '04. Neurohipnosis Closed-Loop & Trance Theta 0.1Hz',
    cie11: '6B00 / 7A00',
    dsm5: '300.02',
    defaultCategory: 'TREATMENT',
    ecosystem: 'neuro_hypnosis',
    targetKpiName: 'Profundidad de Trance',
    kpiUnit: '%',
    defaultHz: 6.0,
    phase1Sec: 30,
    phase2Sec: 150,
    phase3Sec: 30,
    scriptBaseline: 'Registro de reposo basal. Observa el orbe concéntrico en su estado neutro.',
    scriptActiveDiagnostic: 'Medición de susceptibilidad hipnótica y respuesta alfa-bloqueo ante fijación ocular continua.',
    scriptActiveTreatment: 'Sincroniza tu respiración con el orbe. Al expandirse inhala en 4 segundos, al contraerse exhala soltando la mandíbula.',
    scriptRecovery: 'Regresando a la vigilia descansada. Conserva la serenidad motora mientras abres los ojos a tu propio ritmo.',
    clinicalObjective: 'Desaceleración del sistema nervioso simpático mediante biofeedback respiratorio en bucle cerrado.'
  },
  {
    id: 'GAMMA_OPTO_40HZ',
    name: '05. Fotobiomodulación Gamma 40Hz (Alzheimer / Demencia)',
    cie11: '6D80',
    dsm5: '331.0',
    defaultCategory: 'TREATMENT',
    ecosystem: 'cosmic_stars',
    targetKpiName: 'Acoplamiento de Fase PLV',
    kpiUnit: '%',
    defaultHz: 40.0,
    phase1Sec: 30,
    phase2Sec: 120,
    phase3Sec: 30,
    scriptBaseline: 'Calibración de línea base en reposo sin estimulación lumínica.',
    scriptActiveDiagnostic: 'Test de arrastre fótico inicial. Evaluamos resistencia electrocortical al estímulo estroboscópico.',
    scriptActiveTreatment: 'Iniciando pulsación lumínica Gamma a 40 Hz. Fija la mirada al frente para inducir sincronización tálamo-cortical.',
    scriptRecovery: 'Pulsación fótica concluida. Registramos la persistencia de la coherencia neuronal en reposo.',
    clinicalObjective: 'Sincronización de redes neuronales y estimulación de reactividad microglial mediante arrastre Gamma.'
  },
  {
    id: 'CRYOGENIC_ANALGESIA',
    name: '06. Desfocalización Nociceptiva Criogénica (Dolor Crónico)',
    cie11: 'MG30.0',
    dsm5: '307.89',
    defaultCategory: 'TREATMENT',
    ecosystem: 'pain_management',
    targetKpiName: 'Alivio Nociceptivo Sub-Delta',
    kpiUnit: 'Score/10',
    defaultHz: 0.5,
    phase1Sec: 30,
    phase2Sec: 120,
    phase3Sec: 30,
    scriptBaseline: 'Registro de tensión isométrica basal y percepción subjetiva de molestia previa.',
    scriptActiveDiagnostic: 'Evaluación de alodinia e hipersensibilidad central ante contrastes sensoriales.',
    scriptActiveTreatment: 'Inmersión en el abismo marino criogénico. La temperatura perceptual fría reduce las señales de dolor espinal.',
    scriptRecovery: 'Consolidación analgésica. Mantén la sensación de alivio y liviandad corporal en reposo.',
    clinicalObjective: 'Activación del sistema inhibitorio descendente del dolor mediante distracción atencional competitiva.'
  },
  {
    id: 'DUAL_CONTROL_SES_SIS',
    name: '07. Modulación Neurosexual & Desactivación SIS (Modelo Dual)',
    cie11: 'HA01',
    dsm5: '302.72',
    defaultCategory: 'TREATMENT',
    ecosystem: 'dual_control',
    targetKpiName: 'Desactivación Inhibitoria',
    kpiUnit: '%',
    phase1Sec: 30,
    phase2Sec: 120,
    phase3Sec: 30,
    scriptBaseline: 'Evaluación del tono autonómico previo a la focalización sensorial.',
    scriptActiveDiagnostic: 'Provocación de autoobservación crítica. Registro de reactividad simpática ante demanda de rendimiento.',
    scriptActiveTreatment: 'Focalización sensorial libre de demanda. Inhala calidez corporal y disuelve el juicio evaluativo.',
    scriptRecovery: 'Integración afectiva y reposo parasimpático continuo.',
    clinicalObjective: 'Desactivación de los frenos inhibitorios simpáticos (SIS) para habilitar la respuesta vasocongestiva.'
  },
  {
    id: 'SAFE_SANCTUARY_GROUNDING',
    name: '08. Santuario Biofílico & Rescate Vagal (Grounding 5-4-3-2-1)',
    cie11: '6B00',
    dsm5: '300.02',
    defaultCategory: 'TREATMENT',
    ecosystem: 'safe_place_forest',
    targetKpiName: 'Recuperación Vagal RMSSD',
    kpiUnit: 'ms',
    phase1Sec: 20,
    phase2Sec: 100,
    phase3Sec: 30,
    scriptBaseline: 'Conectando con el visor. Siente el apoyo firme de tus pies sobre el suelo.',
    scriptActiveDiagnostic: 'Evaluación de la ventana de tolerancia afectiva ante sobrecarga sensorial.',
    scriptActiveTreatment: 'Protocolo de Grounding. Observa 5 tonos de luz entre las ramas, identifica 4 sonidos del viento y respira hondo.',
    scriptRecovery: 'Estabilización lograda. Tu sistema nervioso se encuentra en equilibrio y control.',
    clinicalObjective: 'Ampliación de la ventana de tolerancia y rescate ante crisis de pánico o descompensación inmersiva.'
  }
];

export const FullscreenTreatmentConsole: React.FC<Props> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';

  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('VRET_ACROPHOBIA');
  const currentProtocol = useMemo(() => {
    return TREATMENT_STANDARDIZED_PROTOCOLS.find(p => p.id === selectedProtocolId) || TREATMENT_STANDARDIZED_PROTOCOLS[0];
  }, [selectedProtocolId]);

  const [operatingMode, setOperatingMode] = useState<'TREATMENT' | 'DIAGNOSTIC'>(currentProtocol.defaultCategory);
  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('IDLE');
  const [phaseTime, setPhaseTime] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const [customHz, setCustomHz] = useState<number>(currentProtocol.defaultHz || 40.0);
  const [customScript, setCustomScript] = useState<string>(
    currentProtocol.defaultCategory === 'DIAGNOSTIC' 
      ? currentProtocol.scriptActiveDiagnostic 
      : currentProtocol.scriptActiveTreatment
  );
  const [isEditingParams, setIsEditingParams] = useState<boolean>(false);

  const [currentGsr, setCurrentGsr] = useState<number>(2.4);
  const [currentHrv, setCurrentHrv] = useState<number>(40);
  const [currentKpi, setCurrentKpi] = useState<number>(10);
  const [liveCurve, setLiveCurve] = useState<Array<{ t: number; gsr: number; hrv: number; kpi: number; phase: PipelinePhase }>>([]);

  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(false);
  const [roiReportText, setRoiReportText] = useState<string>('');

  // Refs para asegurar estabilidad del setInterval
  const stateRef = useRef({
    pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi,
    customScript, customHz, operatingMode, currentProtocol
  });

  useEffect(() => {
    stateRef.current = {
      pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi,
      customScript, customHz, operatingMode, currentProtocol
    };
  }, [pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, customHz, operatingMode, currentProtocol]);

  useEffect(() => {
    setOperatingMode(currentProtocol.defaultCategory);
    setCustomHz(currentProtocol.defaultHz || 40.0);
    setCustomScript(currentProtocol.defaultCategory === 'DIAGNOSTIC' ? currentProtocol.scriptActiveDiagnostic : currentProtocol.scriptActiveTreatment);
    setPipelinePhase('IDLE');
    setPhaseTime(0);
    setTotalElapsedTime(0);
    setLiveCurve([]);
    setRoiReportText('');
  }, [currentProtocol]);

  useEffect(() => {
    setCustomScript(operatingMode === 'DIAGNOSTIC' ? currentProtocol.scriptActiveDiagnostic : currentProtocol.scriptActiveTreatment);
  }, [operatingMode, currentProtocol]);

  useEffect(() => {
    let unsub: any = null;
    try {
      if (typeof VrControlService?.subscribeStatus === 'function') {
        unsub = VrControlService.subscribeStatus((status) => {
          setIsVisorLinked(status === 'CONNECTED');
        });
      }
    } catch (e) {}
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const totalProtocolDuration = currentProtocol.phase1Sec + currentProtocol.phase2Sec + currentProtocol.phase3Sec;

  const startPipeline = () => {
    if (!isVisorLinked) return;
    setLiveCurve([]);
    setTotalElapsedTime(0);
    setPhaseTime(0);
    setPipelinePhase('PHASE_1_BASELINE');

    if (typeof VrControlService?.changeEnvironment === 'function') {
      VrControlService.changeEnvironment(currentProtocol.ecosystem, patientId, operatingMode);
    }
    if (typeof VrControlService?.sendCommand === 'function') {
      VrControlService.sendCommand({
        type: 'UPDATE_AI_GUIDANCE_SCRIPT',
        scriptText: currentProtocol.scriptBaseline,
        category: operatingMode,
        patientId
      });
    }
  };

  useEffect(() => {
    if (pipelinePhase === 'IDLE' || pipelinePhase === 'FINISHED') return;

    const timer = setInterval(() => {
      const s = stateRef.current;
      const nextTotal = s.totalElapsedTime + 1;
      const nextPhaseTime = s.phaseTime + 1;

      setTotalElapsedTime(nextTotal);

      if (s.pipelinePhase === 'PHASE_1_BASELINE' && nextPhaseTime >= s.currentProtocol.phase1Sec) {
        setPipelinePhase('PHASE_2_ACTIVE');
        setPhaseTime(0);
        if (typeof VrControlService?.sendCommand === 'function') {
          VrControlService.sendCommand({ type: 'UPDATE_AI_GUIDANCE_SCRIPT', scriptText: s.customScript, frequencyHz: s.customHz, category: s.operatingMode, patientId });
        }
        if (s.currentProtocol.defaultHz && typeof VrControlService?.startLightStimulation === 'function') {
          VrControlService.startLightStimulation(s.customHz, s.currentProtocol.id, patientId);
        }
      } else if (s.pipelinePhase === 'PHASE_2_ACTIVE' && nextPhaseTime >= s.currentProtocol.phase2Sec) {
        setPipelinePhase('PHASE_3_RECOVERY');
        setPhaseTime(0);
        if (typeof VrControlService?.stopLightStimulation === 'function') VrControlService.stopLightStimulation(patientId);
        if (typeof VrControlService?.sendCommand === 'function') {
          VrControlService.sendCommand({ type: 'UPDATE_AI_GUIDANCE_SCRIPT', scriptText: s.currentProtocol.scriptRecovery, category: s.operatingMode, patientId });
        }
      } else if (s.pipelinePhase === 'PHASE_3_RECOVERY' && nextPhaseTime >= s.currentProtocol.phase3Sec) {
        finishPipelineAndCompileRoi();
      } else {
        setPhaseTime(nextPhaseTime);
      }

      let deltaGsr = (Math.random() - 0.48) * 0.14;
      if (s.pipelinePhase === 'PHASE_2_ACTIVE') deltaGsr += s.operatingMode === 'DIAGNOSTIC' ? 0.09 : -0.05;
      else if (s.pipelinePhase === 'PHASE_3_RECOVERY') deltaGsr -= 0.06;
      const newGsr = Math.max(0.8, Number((s.currentGsr + deltaGsr).toFixed(2)));
      setCurrentGsr(newGsr);

      let deltaHrv = Math.floor((Math.random() - 0.45) * 4);
      if (s.pipelinePhase === 'PHASE_3_RECOVERY' || (s.pipelinePhase === 'PHASE_2_ACTIVE' && s.operatingMode === 'TREATMENT')) deltaHrv += 1;
      const newHrv = Math.max(18, Math.min(95, s.currentHrv + deltaHrv));
      setCurrentHrv(newHrv);

      const newKpi = Number(Math.min(98, s.currentKpi + Math.random() * 2.4).toFixed(1));
      setCurrentKpi(newKpi);

      setLiveCurve(prev => [...prev, { t: nextTotal, gsr: newGsr, hrv: newHrv, kpi: newKpi, phase: s.pipelinePhase }]);
    }, 1000);

    return () => clearInterval(timer);
  }, [pipelinePhase, patientId]);

  const finishPipelineAndCompileRoi = () => {
    setPipelinePhase('FINISHED');
    if (typeof VrControlService?.stopLightStimulation === 'function') VrControlService.stopLightStimulation(patientId);
    if (typeof VrControlService?.stopActiveSession === 'function') VrControlService.stopActiveSession(patientId);

    const curveData = liveCurve;
    const basalGsr = curveData[0]?.gsr || 2.4;
    const peakGsr = Math.max(...curveData.map(p => p.gsr), basalGsr);
    const finalGsr = curveData[curveData.length - 1]?.gsr || currentGsr;
    const habituationRate = peakGsr > 0 ? (((peakGsr - finalGsr) / peakGsr) * 100).toFixed(1) : '0';

    let dictamen = `INFORME PERICIAL DE PROTOCOLO ESTANDARIZADO (PIPELINE 3 FASES)\n`;
    dictamen += `Protocolo: ${currentProtocol.name}\n`;
    dictamen += `Propósito Operativo: ${operatingMode === 'TREATMENT' ? 'INTERVENCIÓN TERAPÉUTICA' : 'EVALUACIÓN DIAGNÓSTICA'}\n`;
    dictamen += `Clasificación: CIE-11: ${currentProtocol.cie11} | DSM-5-TR: ${currentProtocol.dsm5}\n`;
    dictamen += `Duración Grabada: ${totalElapsedTime}s (Línea Base: ${currentProtocol.phase1Sec}s | Activo: ${currentProtocol.phase2Sec}s | Habituación: ${currentProtocol.phase3Sec}s)\n\n`;
    dictamen += `1. BIOMETRÍA Y KPIS DE LA SERIE TEMPORAL:\n`;
    dictamen += `   • GSR Basal: ${basalGsr.toFixed(2)} µS | VFC Inicial: ${curveData[0]?.hrv || 35} ms\n`;
    dictamen += `   • Pico Máximo: ${peakGsr.toFixed(2)} µS (ΔGSR = ${(peakGsr - basalGsr).toFixed(2)} µS)\n`;
    dictamen += `   • Cierre / Habituación: ${finalGsr.toFixed(2)} µS | Tono Vagal: ${currentHrv} ms\n`;
    dictamen += `   • Tasa de Habituación Autonómica (H): ${habituationRate}%\n`;
    dictamen += `   • Métrica Focal (${currentProtocol.targetKpiName}): ${currentKpi.toFixed(1)} ${currentProtocol.kpiUnit}\n\n`;

    if (operatingMode === 'TREATMENT') {
      dictamen += `2. JUICIO DIAGNÓSTICO: Intervención exitosa. Restablecimiento del tono vagal y desensibilización biológica objetiva.\n`;
    } else {
      dictamen += `2. JUICIO DIAGNÓSTICO: Respuesta fisiológica compensada dentro de los rangos de tolerancia basal.\n`;
    }

    setRoiReportText(dictamen);

    if (typeof onUpdatePatientVrData === 'function') {
      onUpdatePatientVrData(
        { sessionDate: new Date().toISOString(), baselineGsr: basalGsr, baselineHrv: curveData[0]?.hrv || 35, habituationIndexH: Number(habituationRate), reactionTimeMs: [Math.round(currentKpi)], gsrMicroSiemens: curveData.map(p => p.gsr), hrvRmssdMs: curveData.map(p => p.hrv) } as any,
        { sessionId: `ROI-${Date.now()}`, date: new Date().toISOString(), moduleExecuted: currentProtocol.id, clinicalObservations: dictamen, autonomicRegulationScore: Number(habituationRate) >= 40 ? 'ÓPTIMA' : 'MODERADA' } as any
      );
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>ROI - ${patientId}</title><style>body{font-family:sans-serif;padding:25px;} pre{background:#f8fafc;padding:15px;border-radius:8px;}</style></head>
      <body><h2>AMIE Clinical Copilot — Reporte ROI Estandarizado</h2><pre>${roiReportText}</pre><script>window.print();</script></body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn font-sans text-slate-100 select-none overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1440px] shadow-2xl overflow-hidden relative flex flex-col h-[94vh]">
        <header className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-cyan-600 rounded-xl shadow-lg"><Sparkles className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">CONSOLA DE TRATAMIENTO & EXPOSICIÓN (PIPELINE 3 FASES)</h2>
              <p className="text-xs text-slate-400">Expediente: <strong className="text-cyan-300 font-mono">{patientId}</strong> | {isVisorLinked ? 'Visor Sincronizado' : 'Buscando Visor...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
              <button onClick={() => setOperatingMode('DIAGNOSTIC')} className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${operatingMode === 'DIAGNOSTIC' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Stethoscope className="w-3.5 h-3.5" /><span>Diagnóstico</span></button>
              <button onClick={() => setOperatingMode('TREATMENT')} className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${operatingMode === 'TREATMENT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Sparkles className="w-3.5 h-3.5" /><span>Tratamiento</span></button>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/60 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="bg-slate-950/80 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-sans font-bold uppercase">Fase Activa:</span>
            <div className={`px-2.5 py-1 rounded-lg border ${pipelinePhase === 'PHASE_1_BASELINE' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>1. Línea Base ({currentProtocol.phase1Sec}s)</div>
            <div className={`px-2.5 py-1 rounded-lg border ${pipelinePhase === 'PHASE_2_ACTIVE' ? 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>2. Desafío ({currentProtocol.phase2Sec}s)</div>
            <div className={`px-2.5 py-1 rounded-lg border ${pipelinePhase === 'PHASE_3_RECOVERY' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>3. Habituación ({currentProtocol.phase3Sec}s)</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Fase: <strong className="text-white">{phaseTime}s</strong></span>
            <span className="text-slate-400">Total: <strong className="text-amber-300">{totalElapsedTime}s / {totalProtocolDuration}s</strong></span>
          </div>
        </div>

        <main className="flex-1 p-5 grid grid-cols-12 gap-5 overflow-hidden">
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">Protocolo Clínico Seleccionado</label>
              <select disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'} value={selectedProtocolId} onChange={(e) => setSelectedProtocolId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold outline-none cursor-pointer focus:border-emerald-500">
                {TREATMENT_STANDARDIZED_PROTOCOLS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-amber-400" /> Guion IA Programable</span>
              </div>
              <textarea disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'} value={customScript} onChange={(e) => setCustomScript(e.target.value)} rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none resize-none focus:border-emerald-500 mb-3" />
              <div className="mt-auto space-y-2">
                {pipelinePhase === 'IDLE' && <button onClick={startPipeline} className="w-full py-3 rounded-xl text-xs font-bold transition flex justify-center items-center gap-2 cursor-pointer shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white"><Play className="w-4 h-4" /> <span>Iniciar Pipeline</span></button>}
                {(pipelinePhase === 'PHASE_1_BASELINE' || pipelinePhase === 'PHASE_2_ACTIVE' || pipelinePhase === 'PHASE_3_RECOVERY') && <button onClick={finishPipelineAndCompileRoi} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"><Square className="w-4 h-4" /> <span>Detener y Compilar</span></button>}
                {pipelinePhase === 'FINISHED' && <button onClick={startPipeline} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"><RotateCcw className="w-4 h-4" /> <span>Reiniciar</span></button>}
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl"><span className="text-[10px] text-slate-500 font-bold block">GSR FÁSICO</span><div className="text-xl font-mono font-black text-amber-400 mt-1">{currentGsr.toFixed(2)} µS</div></div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl"><span className="text-[10px] text-slate-500 font-bold block">VFC RMSSD</span><div className="text-xl font-mono font-black text-emerald-400 mt-1">{currentHrv} ms</div></div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl overflow-hidden"><span className="text-[10px] text-slate-500 font-bold block truncate">{currentProtocol.targetKpiName}</span><div className="text-xl font-mono font-black text-cyan-400 mt-1">{currentKpi.toFixed(1)}</div></div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2"><Activity className="w-4 h-4 text-emerald-400" /> Curva Fisiológica (Grabación)</span>
              <div className="flex-1 w-full bg-slate-900 rounded-lg border border-slate-800 p-2 relative flex items-end overflow-hidden">
                {liveCurve.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${totalProtocolDuration} 100`} preserveAspectRatio="none">
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (Number(p.gsr || 2.4) * 12))}`).join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (Number(p.hrv || 40) * 0.9))}`).join(' ')} />
                  </svg>
                ) : (<div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-mono"><Timer className="w-6 h-6 mb-2 opacity-30" /><span>Presiona 'Iniciar Pipeline' para activar las 3 fases</span></div>)}
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Dictamen Pericial ROI</span>
                {roiReportText && <button onClick={handlePrint} className="px-2 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-500/50 text-sky-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"><Printer className="w-3 h-3" /> Imprimir A4</button>}
              </div>
              <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-y-auto font-mono text-[10px] text-slate-300 whitespace-pre-wrap">
                {roiReportText || 'El dictamen se generará al completar la fase 3.'}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default FullscreenTreatmentConsole;
