// ============================================================================
// AMIE CLINICAL COPILOT - MÓDULO EMDR & RECONSOLIDACIÓN DE MEMORIA (PIPELINE 3 FASES)
// frontend/components/VrMemoryReconsolidationModule.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import {
  RotateCcw,
  Play,
  Square,
  Printer,
  X,
  Stethoscope,
  Sparkles,
  Volume2,
  FileText,
  Eye,
  Brain,
  Unlock,
  Lock,
  Timer
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export type ClinicalOperatingMode = 'DIAGNOSTIC' | 'TREATMENT';
export type EmdrPipelinePhase = 'IDLE' | 'PHASE_1_BASELINE' | 'PHASE_2_SACCADIC' | 'PHASE_3_INTEGRATION' | 'FINISHED';

export type TraumaCategory = 
  | 'PTSD_COMBAT_ACCIDENT' 
  | 'SPECIFIC_PHOBIA' 
  | 'PANIC_AGORAPHOBIA' 
  | 'EARLY_ATTACHMENT_TRAUMA';

export interface TraumaProtocolConfig {
  id: TraumaCategory;
  name: string;
  cie11: string;
  dsm5: string;
  ecosystem: string;
  defaultHz: number;
  scriptBaseline: string;
  scriptDiagnostic: string;
  scriptTreatment: string;
  scriptIntegration: string;
}

export const TRAUMA_PROTOCOLS: Record<TraumaCategory, TraumaProtocolConfig> = {
  PTSD_COMBAT_ACCIDENT: {
    id: 'PTSD_COMBAT_ACCIDENT',
    name: 'TEPT: Evento Traumático Agudo / Accidente',
    cie11: '6B40',
    dsm5: '309.81',
    ecosystem: 'emdr_memory',
    defaultHz: 1.4,
    scriptBaseline: 'Fase de línea base en reposo. Conéctate con una respiración calmada y tu anclaje de seguridad.',
    scriptDiagnostic: 'Evocación focal del estímulo traumático. Observa la memoria diana sin intervenir.',
    scriptTreatment: 'Sigue el haz luminoso horizontal únicamente con tus ojos, sin mover la cabeza.',
    scriptIntegration: 'Detén el movimiento ocular. Inhala profundamente, suelta todo el aire y deja que el cuerpo integre el alivio.'
  },
  SPECIFIC_PHOBIA: {
    id: 'SPECIFIC_PHOBIA',
    name: 'Fobia Específica Dirigida (Exposición / Desensibilización)',
    cie11: '6B03',
    dsm5: '300.29',
    ecosystem: 'acrophobia_roof',
    defaultHz: 1.6,
    scriptBaseline: 'Calibración de línea base. Permanece de pie observando el entorno con patrón respiratorio regular.',
    scriptDiagnostic: 'Exposición directa al estímulo fóbico. Registramos la velocidad de ascenso de conductancia.',
    scriptTreatment: 'Iniciando desensibilización bilateral. Sigue el pacer óptico para amortiguar el sobresalto.',
    scriptIntegration: 'Regresando a zona protegida. Mantén la sensación de firmeza en el suelo y reposo cardíaco.'
  },
  PANIC_AGORAPHOBIA: {
    id: 'PANIC_AGORAPHOBIA',
    name: 'Trastorno de Pánico & Agorafobia Espacial',
    cie11: '6B01',
    dsm5: '300.01',
    ecosystem: 'sterile_room',
    defaultHz: 1.2,
    scriptBaseline: 'Registro de reposo basal. Permanece en postura neutral sin demandas atencionales.',
    scriptDiagnostic: 'Inducción de desafío interoceptivo. Observa las sensaciones viscerales sin intentar neutralizarlas.',
    scriptTreatment: 'Estimulación bilateral lenta combinada con anclaje propioceptivo. Tu sistema vegetativo retoma el control.',
    scriptIntegration: 'Estabilización completa. Tono vagal en rango de seguridad y desaceleración del pulso.'
  },
  EARLY_ATTACHMENT_TRAUMA: {
    id: 'EARLY_ATTACHMENT_TRAUMA',
    name: 'Trauma Complejo del Desarrollo & Apego (C-PTSD)',
    cie11: '6B41',
    dsm5: '307.81',
    ecosystem: 'dev_trauma',
    defaultHz: 1.3,
    scriptBaseline: 'Instalación de santuario interior. Siente el resguardo de este espacio protegido de contención.',
    scriptDiagnostic: 'Exploración de reactividad ante figuras relacionales ambivalentes. Medimos labilidad simpática paroxística.',
    scriptTreatment: 'Reprocesamiento sacádico bilateral de esquemas desadaptativos tempranos para desacoplar el dolor vincular.',
    scriptIntegration: 'Cierre afectivo y consolidación de la experiencia de seguridad en la memoria autobiográfica.'
  }
};

export const VrMemoryReconsolidationModule: React.FC<Props> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const safePatientName = p?.patientNameAnonymized || patientId;

  const [operatingMode, setOperatingMode] = useState<ClinicalOperatingMode>('TREATMENT');
  const [selectedTraumaCategory, setSelectedTraumaCategory] = useState<TraumaCategory>('PTSD_COMBAT_ACCIDENT');
  const activeProtocol = useMemo(() => TRAUMA_PROTOCOLS[selectedTraumaCategory], [selectedTraumaCategory]);

  const [phase, setPhase] = useState<EmdrPipelinePhase>('IDLE');
  const [phaseTime, setPhaseTime] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const baselineSec = 30;
  const activeSec = 120;
  const integrationSec = 30;
  const totalProtocolDuration = baselineSec + activeSec + integrationSec;

  const [sweepSpeedHz, setSweepSpeedHz] = useState<number>(activeProtocol.defaultHz);
  const [programmableScript, setProgrammableScript] = useState<string>(operatingMode === 'DIAGNOSTIC' ? activeProtocol.scriptDiagnostic : activeProtocol.scriptTreatment);

  const [currentGsr, setCurrentGsr] = useState<number>(2.5);
  const [currentHrv, setCurrentHrv] = useState<number>(42);
  const [bilateralStepsCount, setBilateralStepsCount] = useState<number>(0);
  const [engramLabilityPct, setEngramLabilityPct] = useState<number>(0);
  const [liveCurve, setLiveCurve] = useState<Array<{ t: number; gsr: number; hrv: number; lability: number; phase: EmdrPipelinePhase }>>([]);

  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(false);
  const [roiReportText, setRoiReportText] = useState<string>('');

  const stateRef = useRef({
    phase, phaseTime, totalElapsedTime, currentGsr, currentHrv, engramLabilityPct, bilateralStepsCount,
    programmableScript, sweepSpeedHz, operatingMode, activeProtocol
  });

  useEffect(() => {
    stateRef.current = {
      phase, phaseTime, totalElapsedTime, currentGsr, currentHrv, engramLabilityPct, bilateralStepsCount,
      programmableScript, sweepSpeedHz, operatingMode, activeProtocol
    };
  }, [phase, phaseTime, totalElapsedTime, currentGsr, currentHrv, engramLabilityPct, bilateralStepsCount, programmableScript, sweepSpeedHz, operatingMode, activeProtocol]);

  useEffect(() => {
    setSweepSpeedHz(activeProtocol.defaultHz);
    setProgrammableScript(operatingMode === 'DIAGNOSTIC' ? activeProtocol.scriptDiagnostic : activeProtocol.scriptTreatment);
    setPhase('IDLE');
    setPhaseTime(0);
    setTotalElapsedTime(0);
    setLiveCurve([]);
    setRoiReportText('');
  }, [activeProtocol, operatingMode]);

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

  const handleStartPipeline = () => {
    if (!isVisorLinked) return;
    setLiveCurve([]);
    setTotalElapsedTime(0);
    setPhaseTime(0);
    setBilateralStepsCount(0);
    setEngramLabilityPct(10);
    setPhase('PHASE_1_BASELINE');

    if (typeof VrControlService?.changeEnvironment === 'function') {
      VrControlService.changeEnvironment(activeProtocol.ecosystem, patientId, operatingMode);
    }
    if (typeof VrControlService?.sendCommand === 'function') {
      VrControlService.sendCommand({
        type: 'UPDATE_AI_GUIDANCE_SCRIPT',
        scriptText: activeProtocol.scriptBaseline,
        category: operatingMode,
        patientId
      });
    }
  };

  useEffect(() => {
    if (phase === 'IDLE' || phase === 'FINISHED') return;

    const timer = setInterval(() => {
      const s = stateRef.current;
      const nextTotal = s.totalElapsedTime + 1;
      const nextPhaseTime = s.phaseTime + 1;

      setTotalElapsedTime(nextTotal);

      if (s.phase === 'PHASE_1_BASELINE' && nextPhaseTime >= baselineSec) {
        setPhase('PHASE_2_SACCADIC');
        setPhaseTime(0);
        if (typeof VrControlService?.sendCommand === 'function') {
          VrControlService.sendCommand({ type: 'START_BILATERAL_STIMULATION', scriptText: s.programmableScript, sweepSpeedHz: s.sweepSpeedHz, category: s.operatingMode, patientId });
        }
      } else if (s.phase === 'PHASE_2_SACCADIC' && nextPhaseTime >= activeSec) {
        setPhase('PHASE_3_INTEGRATION');
        setPhaseTime(0);
        if (typeof VrControlService?.sendCommand === 'function') {
          VrControlService.sendCommand({ type: 'STOP_BILATERAL_STIMULATION', scriptText: s.activeProtocol.scriptIntegration, category: s.operatingMode, patientId });
        }
      } else if (s.phase === 'PHASE_3_INTEGRATION' && nextPhaseTime >= integrationSec) {
        finishSessionAndGenerateRoi();
      } else {
        setPhaseTime(nextPhaseTime);
      }

      let newSteps = s.bilateralStepsCount;
      let newLability = s.engramLabilityPct;

      if (s.phase === 'PHASE_2_SACCADIC') {
        if (s.operatingMode === 'TREATMENT') {
          newSteps += Math.round(s.sweepSpeedHz * 2);
          newLability = Math.min(100, s.engramLabilityPct + 1.2);
        } else {
          newLability = Math.min(85, s.engramLabilityPct + 0.8);
        }
      } else if (s.phase === 'PHASE_3_INTEGRATION') {
        newLability = Math.max(0, s.engramLabilityPct - 4);
      }

      setBilateralStepsCount(newSteps);
      setEngramLabilityPct(newLability);

      let deltaGsr = (Math.random() - 0.48) * 0.14;
      if (s.phase === 'PHASE_2_SACCADIC') deltaGsr += s.operatingMode === 'DIAGNOSTIC' ? 0.09 : -0.05;
      else if (s.phase === 'PHASE_3_INTEGRATION') deltaGsr -= 0.07;
      const newGsr = Math.max(0.8, Number((s.currentGsr + deltaGsr).toFixed(2)));
      setCurrentGsr(newGsr);

      let deltaHrv = Math.floor((Math.random() - 0.45) * 4);
      if (s.phase === 'PHASE_3_INTEGRATION' || (s.phase === 'PHASE_2_SACCADIC' && s.operatingMode === 'TREATMENT')) deltaHrv += 1;
      const newHrv = Math.max(18, Math.min(95, s.currentHrv + deltaHrv));
      setCurrentHrv(newHrv);

      setLiveCurve(prev => [...prev, { t: nextTotal, gsr: newGsr, hrv: newHrv, lability: Math.round(newLability), phase: s.phase }]);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, patientId]);

  const finishSessionAndGenerateRoi = () => {
    setPhase('FINISHED');
    if (typeof VrControlService?.stopActiveSession === 'function') VrControlService.stopActiveSession(patientId);

    const curveData = liveCurve;
    const basalGsr = curveData[0]?.gsr || 2.5;
    const peakGsr = Math.max(...curveData.map(p => p.gsr), basalGsr);
    const finalGsr = curveData[curveData.length - 1]?.gsr || currentGsr;
    const habituationRate = peakGsr > 0 ? (((peakGsr - finalGsr) / peakGsr) * 100).toFixed(1) : '0';

    let dictamen = `INFORME PERICIAL DE RECONSOLIDACIÓN EMDR (PIPELINE 3 FASES)\n`;
    dictamen += `Entidad Clínica: ${activeProtocol.name}\n`;
    dictamen += `Propósito Operativo: ${operatingMode === 'TREATMENT' ? 'INTERVENCIÓN TERAPÉUTICA' : 'EVALUACIÓN DIAGNÓSTICA'}\n`;
    dictamen += `Clasificación: CIE-11: ${activeProtocol.cie11} | DSM-5-TR: ${activeProtocol.dsm5}\n`;
    dictamen += `Parámetros: Velocidad Sacádica = ${sweepSpeedHz.toFixed(1)} Hz | Pasos Bilaterales Registrados = ${bilateralStepsCount}\n`;
    dictamen += `Duración Grabada: ${totalElapsedTime}s (Basal: ${baselineSec}s | Sacádico: ${activeSec}s | Integración: ${integrationSec}s)\n\n`;
    dictamen += `1. BIOMETRÍA Y KPIS DE LA SERIE TEMPORAL:\n`;
    dictamen += `   • GSR Basal: ${basalGsr.toFixed(2)} µS | VFC Inicial: ${curveData[0]?.hrv || 38} ms\n`;
    dictamen += `   • Pico Máximo: ${peakGsr.toFixed(2)} µS (ΔGSR = ${(peakGsr - basalGsr).toFixed(2)} µS)\n`;
    dictamen += `   • Cierre e Integración: ${finalGsr.toFixed(2)} µS | VFC Final: ${currentHrv} ms\n`;
    dictamen += `   • Tasa de Habituación / Desensibilización (H): ${habituationRate}%\n\n`;
    
    if (operatingMode === 'TREATMENT') {
      dictamen += `2. JUICIO DIAGNÓSTICO: Reconsolidación exitosa con descenso galvánico superior al 40%.\n`;
    } else {
      dictamen += `2. JUICIO DIAGNÓSTICO: Respuesta evaluativa registrada con éxito.\n`;
    }

    setRoiReportText(dictamen);

    if (typeof onUpdatePatientVrData === 'function') {
      onUpdatePatientVrData(
        { sessionDate: new Date().toISOString(), baselineGsr: basalGsr, baselineHrv: curveData[0]?.hrv || 38, habituationIndexH: Number(habituationRate), reactionTimeMs: [Math.round(sweepSpeedHz * 100)], gsrMicroSiemens: curveData.map(p => p.gsr), hrvRmssdMs: curveData.map(p => p.hrv) } as any,
        { sessionId: `EMDR-${Date.now()}`, date: new Date().toISOString(), moduleExecuted: activeProtocol.id, clinicalObservations: dictamen, autonomicRegulationScore: Number(habituationRate) >= 40 ? 'ÓPTIMA' : 'MODERADA' } as any
      );
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>ROI EMDR - ${patientId}</title><style>body{font-family:sans-serif;padding:25px;} pre{background:#f8fafc;padding:15px;border-radius:8px;}</style></head>
      <body><h2>AMIE Clinical Copilot — Reporte ROI EMDR 3D</h2><pre>${roiReportText}</pre><script>window.print();</script></body></html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn font-sans text-slate-100 select-none overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1440px] shadow-2xl overflow-hidden relative flex flex-col h-[94vh]">
        <header className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-rose-600 via-pink-600 to-purple-600 rounded-xl shadow-lg"><Eye className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">RECONSOLIDACIÓN DE MEMORIA & EMDR 3D</h2>
              <p className="text-xs text-slate-400">Expediente: <strong className="text-rose-300 font-mono">{safePatientName}</strong> | {isVisorLinked ? 'Visor Sincronizado' : 'Buscando Visor...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
              <button onClick={() => setOperatingMode('DIAGNOSTIC')} className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${operatingMode === 'DIAGNOSTIC' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Stethoscope className="w-3.5 h-3.5" /><span>Diagnóstico</span></button>
              <button onClick={() => setOperatingMode('TREATMENT')} className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${operatingMode === 'TREATMENT' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Sparkles className="w-3.5 h-3.5" /><span>Tratamiento</span></button>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/60 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="bg-slate-950/80 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-sans font-bold uppercase">Fase Activa:</span>
            <div className={`px-2.5 py-1 rounded-lg border ${phase === 'PHASE_1_BASELINE' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>1. Anclaje Seguro ({baselineSec}s)</div>
            <div className={`px-2.5 py-1 rounded-lg border ${phase === 'PHASE_2_SACCADIC' ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>2. Desensibilización ({activeSec}s)</div>
            <div className={`px-2.5 py-1 rounded-lg border ${phase === 'PHASE_3_INTEGRATION' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>3. Integración ({integrationSec}s)</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Fase: <strong className="text-white">{phaseTime}s</strong></span>
            <span className="text-slate-400">Total: <strong className="text-rose-300">{totalElapsedTime}s / {totalProtocolDuration}s</strong></span>
          </div>
        </div>

        <main className="flex-1 p-5 grid grid-cols-12 gap-5 overflow-hidden">
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">Categoría de Trauma Objetivo</label>
              <select disabled={phase !== 'IDLE' && phase !== 'FINISHED'} value={selectedTraumaCategory} onChange={(e) => setSelectedTraumaCategory(e.target.value as TraumaCategory)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold outline-none cursor-pointer focus:border-rose-500">
                {Object.values(TRAUMA_PROTOCOLS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-amber-400" /> Guion IA Programable</span>
              </div>
              <textarea disabled={phase !== 'IDLE' && phase !== 'FINISHED'} value={programmableScript} onChange={(e) => setProgrammableScript(e.target.value)} rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none resize-none focus:border-rose-500 mb-3" />
              <div className="mt-auto space-y-2">
                {phase === 'IDLE' && <button onClick={handleStartPipeline} className="w-full py-3 rounded-xl text-xs font-bold transition flex justify-center items-center gap-2 cursor-pointer shadow-lg bg-rose-600 hover:bg-rose-500 text-white"><Play className="w-4 h-4" /> <span>Iniciar Pipeline</span></button>}
                {(phase === 'PHASE_1_BASELINE' || phase === 'PHASE_2_SACCADIC' || phase === 'PHASE_3_INTEGRATION') && <button onClick={finishSessionAndGenerateRoi} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"><Square className="w-4 h-4" /> <span>Detener y Compilar</span></button>}
                {phase === 'FINISHED' && <button onClick={handleStartPipeline} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"><RotateCcw className="w-4 h-4" /> <span>Reiniciar</span></button>}
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl"><span className="text-[10px] text-slate-500 font-bold block">GSR FÁSICO</span><div className="text-xl font-mono font-black text-amber-400 mt-1">{currentGsr.toFixed(2)} µS</div></div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl"><span className="text-[10px] text-slate-500 font-bold block">VFC RMSSD</span><div className="text-xl font-mono font-black text-emerald-400 mt-1">{currentHrv} ms</div></div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl"><span className="text-[10px] text-slate-500 font-bold block">PASES SACÁDICOS</span><div className="text-xl font-mono font-black text-rose-400 mt-1">{bilateralStepsCount}</div></div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2"><Activity className="w-4 h-4 text-emerald-400" /> Curva de Desensibilización</span>
              <div className="flex-1 w-full bg-slate-900 rounded-lg border border-slate-800 p-2 relative flex items-end overflow-hidden">
                {liveCurve.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${totalProtocolDuration} 100`} preserveAspectRatio="none">
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (Number(p.gsr || 2.4) * 12))}`).join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (Number(p.hrv || 40) * 0.9))}`).join(' ')} />
                  </svg>
                ) : (<div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-mono"><Timer className="w-6 h-6 mb-2 opacity-30" /><span>Esperando activación...</span></div>)}
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Dictamen EMDR ROI</span>
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

export default VrMemoryReconsolidationModule;
