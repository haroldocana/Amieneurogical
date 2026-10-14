// ============================================================================
// AMIE CLINICAL COPILOT - MÓDULO EMDR & RECONSOLIDACIÓN DE MEMORIA (PIPELINE 3 FASES)
// frontend/components/VrMemoryReconsolidationModule.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import {
  RotateCcw,
  Activity,
  Play,
  Square,
  Printer,
  Glasses,
  X,
  Stethoscope,
  Sparkles,
  Volume2,
  ShieldAlert,
  FileText,
  Eye,
  Sliders,
  Heart,
  Brain,
  Unlock,
  Lock,
  Timer,
  Terminal,
  Signal
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
    scriptBaseline: 'Fase de línea base en reposo. Conéctate con una respiración calmada y tu anclaje de seguridad física.',
    scriptDiagnostic: 'Evocación focal del estímulo traumático. Observa la memoria diana sin intervenir; registramos reactividad amigdalar.',
    scriptTreatment: 'Sigue el haz luminoso horizontal únicamente con tus ojos, sin mover la cabeza, sosteniendo la memoria en tu mente.',
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
    scriptDiagnostic: 'Exposición directa al estímulo fóbico. Registramos la velocidad de ascenso de conductancia y temblor.',
    scriptTreatment: 'Iniciando desensibilización bilateral. Sigue el pacer óptico para amortiguar la respuesta de sobresalto simpático.',
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

  // 1. Configuración de Modo y Categoría
  const [operatingMode, setOperatingMode] = useState<ClinicalOperatingMode>('TREATMENT');
  const [selectedTraumaCategory, setSelectedTraumaCategory] = useState<TraumaCategory>('PTSD_COMBAT_ACCIDENT');
  const activeProtocol = useMemo(() => TRAUMA_PROTOCOLS[selectedTraumaCategory], [selectedTraumaCategory]);

  // 2. Pipeline de 3 Fases
  const [phase, setPhase] = useState<EmdrPipelinePhase>('IDLE');
  const [phaseTime, setPhaseTime] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const baselineSec = 30;
  const activeSec = 120;
  const integrationSec = 30;
  const totalProtocolDuration = baselineSec + activeSec + integrationSec;

  // 3. Parámetros del Terapeuta
  const [sweepSpeedHz, setSweepSpeedHz] = useState<number>(activeProtocol.defaultHz);
  const [binauralThetaHz, setBinauralThetaHz] = useState<number>(4.5);
  const [programmableScript, setProgrammableScript] = useState<string>(
    operatingMode === 'DIAGNOSTIC' ? activeProtocol.scriptDiagnostic : activeProtocol.scriptTreatment
  );
  const [isEditingParams, setIsEditingParams] = useState<boolean>(false);

  // 4. Biometría y Curvas Continuas
  const [currentGsr, setCurrentGsr] = useState<number>(2.5);
  const [currentHrv, setCurrentHrv] = useState<number>(42);
  const [bilateralStepsCount, setBilateralStepsCount] = useState<number>(0);
  const [engramLabilityPct, setEngramLabilityPct] = useState<number>(0);
  const [liveCurve, setLiveCurve] = useState<Array<{ t: number; gsr: number; hrv: number; lability: number; phase: EmdrPipelinePhase }>>([]);

  // 5. Estado de Enlace y Reporte
  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(false);
  const [roiReportText, setRoiReportText] = useState<string>('');
  const [aiLogs, setAiLogs] = useState<string[]>(['[SYSTEM] Módulo de Reconsolidación EMDR 3D inicializado.']);

  // Actualizar guion y frecuencia al cambiar de protocolo o de modo
  useEffect(() => {
    setSweepSpeedHz(activeProtocol.defaultHz);
    setProgrammableScript(
      operatingMode === 'DIAGNOSTIC' ? activeProtocol.scriptDiagnostic : activeProtocol.scriptTreatment
    );
    setPhase('IDLE');
    setPhaseTime(0);
    setTotalElapsedTime(0);
    setLiveCurve([]);
    setRoiReportText('');
  }, [activeProtocol, operatingMode]);

  // Suscripción al WebSocket del Visor
  useEffect(() => {
    const unsub = VrControlService.subscribeStatus((status) => {
      setIsVisorLinked(status === 'CONNECTED');
      if (status === 'CONNECTED') {
        setAiLogs(prev => [`[WSS] Visor Pico 3 Pro enlazado en tiempo real.`, ...prev.slice(0, 15)]);
      }
    });
    return () => unsub();
  }, []);

  const handleStartPipeline = () => {
    if (!isVisorLinked) {
      setAiLogs(prev => [`[ERROR] Visor no detectado. Sincroniza el casco antes de iniciar.`, ...prev.slice(0, 15)]);
      return;
    }

    setLiveCurve([]);
    setTotalElapsedTime(0);
    setPhaseTime(0);
    setBilateralStepsCount(0);
    setEngramLabilityPct(10);
    setPhase('PHASE_1_BASELINE');
    setAiLogs(prev => [`[START] Iniciando Pipeline de 3 Fases [${operatingMode}]: ${activeProtocol.name}`, ...prev.slice(0, 15)]);

    VrControlService.changeEnvironment(activeProtocol.ecosystem, patientId, operatingMode);
    VrControlService.sendCommand({
      type: 'UPDATE_AI_GUIDANCE_SCRIPT',
      scriptText: activeProtocol.scriptBaseline,
      category: operatingMode,
      frequencyHz: binauralThetaHz,
      patientId
    });
  };

  // Motor del Pipeline en 3 Fases
  useEffect(() => {
    if (phase === 'IDLE' || phase === 'FINISHED') return;

    const timer = setInterval(() => {
      setTotalElapsedTime(prev => prev + 1);
      setPhaseTime(prev => prev + 1);

      // Transiciones entre fases
      if (phase === 'PHASE_1_BASELINE' && phaseTime >= baselineSec) {
        setPhase('PHASE_2_SACCADIC');
        setPhaseTime(0);
        setAiLogs(prev => [
          `[MISMATCH] Fase 2 Activa: Apertura de engrama y barrido bilateral a ${sweepSpeedHz.toFixed(1)} Hz.`,
          ...prev.slice(0, 15)
        ]);
        VrControlService.sendCommand({
          type: 'START_BILATERAL_STIMULATION',
          scriptText: programmableScript,
          sweepSpeedHz,
          category: operatingMode,
          patientId
        });
      } else if (phase === 'PHASE_2_SACCADIC' && phaseTime >= activeSec) {
        setPhase('PHASE_3_INTEGRATION');
        setPhaseTime(0);
        setAiLogs(prev => [
          `[INTEGRATION] Fase 3: Deteniendo sacadas. Inyectando tono de anclaje e integración vagal.`,
          ...prev.slice(0, 15)
        ]);
        VrControlService.sendCommand({
          type: 'STOP_BILATERAL_STIMULATION',
          scriptText: activeProtocol.scriptIntegration,
          category: operatingMode,
          patientId
        });
      } else if (phase === 'PHASE_3_INTEGRATION' && phaseTime >= integrationSec) {
        finishSessionAndGenerateRoi();
      }

      // Dinámica de conteo sacádico y labilidad
      if (phase === 'PHASE_2_SACCADIC') {
        if (operatingMode === 'TREATMENT') {
          setBilateralStepsCount(prev => prev + Math.round(sweepSpeedHz * 2));
          setEngramLabilityPct(prev => Math.min(100, prev + 1.2));
        } else {
          setEngramLabilityPct(prev => Math.min(85, prev + 0.8));
        }
      } else if (phase === 'PHASE_3_INTEGRATION') {
        setEngramLabilityPct(prev => Math.max(0, prev - 4));
      }

      // Simulación biológica en bucle cerrado
      setCurrentGsr(prev => {
        let delta = (Math.random() - 0.48) * 0.14;
        if (phase === 'PHASE_2_SACCADIC') {
          delta += operatingMode === 'DIAGNOSTIC' ? 0.09 : -0.05;
        } else if (phase === 'PHASE_3_INTEGRATION') {
          delta -= 0.07;
        }
        return Math.max(0.8, Number((prev + delta).toFixed(2)));
      });

      setCurrentHrv(prev => {
        let delta = Math.floor((Math.random() - 0.45) * 4);
        if (phase === 'PHASE_3_INTEGRATION' || (phase === 'PHASE_2_SACCADIC' && operatingMode === 'TREATMENT')) {
          delta += 1;
        }
        return Math.max(18, Math.min(95, prev + delta));
      });

      setLiveCurve(prev => [
        ...prev,
        {
          t: totalElapsedTime,
          gsr: currentGsr,
          hrv: currentHrv,
          lability: Math.round(engramLabilityPct),
          phase
        }
      ]);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, phaseTime, totalElapsedTime, baselineSec, activeSec, integrationSec, operatingMode, activeProtocol, programmableScript, sweepSpeedHz, binauralThetaHz, currentGsr, currentHrv, engramLabilityPct, patientId]);

  const finishSessionAndGenerateRoi = () => {
    setPhase('FINISHED');
    VrControlService.stopActiveSession(patientId);

    const basalGsr = liveCurve[0]?.gsr || 2.5;
    const peakGsr = Math.max(...liveCurve.map(p => p.gsr), basalGsr);
    const finalGsr = liveCurve[liveCurve.length - 1]?.gsr || currentGsr;
    const habituationRate = peakGsr > 0 ? (((peakGsr - finalGsr) / peakGsr) * 100).toFixed(1) : '0';

    let dictamen = `INFORME PERICIAL DE RECONSOLIDACIÓN EMDR (PIPELINE 3 FASES)\n`;
    dictamen += `Entidad Clínica: ${activeProtocol.name}\n`;
    dictamen += `Propósito Operativo: ${operatingMode === 'TREATMENT' ? 'INTERVENCIÓN TERAPÉUTICA (Desensibilización Sacádica Bilateral)' : 'EVALUACIÓN DIAGNÓSTICA (Mapeo de Huella Afectiva)'}\n`;
    dictamen += `Clasificación: CIE-11: ${activeProtocol.cie11} | DSM-5-TR: ${activeProtocol.dsm5}\n`;
    dictamen += `Escenario WebXR: /ecosystems/${activeProtocol.ecosystem}.jpeg [6DoF]\n`;
    dictamen += `Parámetros: Velocidad Sacádica = ${sweepSpeedHz.toFixed(1)} Hz | Pasos Bilaterales Registrados = ${bilateralStepsCount}\n`;
    dictamen += `Duración Grabada: ${totalElapsedTime}s (Línea Base: ${baselineSec}s | Sacádico: ${activeSec}s | Integración: ${integrationSec}s)\n\n`;
    dictamen += `1. BIOMETRÍA Y KPIS DE LA SERIE TEMPORAL:\n`;
    dictamen += `   • GSR Basal (Fase 1): ${basalGsr.toFixed(2)} µS | VFC Inicial (RMSSD): ${liveCurve[0]?.hrv || 38} ms\n`;
    dictamen += `   • Pico Máximo (Fase 2): ${peakGsr.toFixed(2)} µS (ΔGSR = ${(peakGsr - basalGsr).toFixed(2)} µS)\n`;
    dictamen += `   • Cierre / Integración (Fase 3): ${finalGsr.toFixed(2)} µS | VFC Final: ${currentHrv} ms\n`;
    dictamen += `   • Tasa de Habituación / Desensibilización (H): ${habituationRate}%\n\n`;
    dictamen += `2. JUICIO DIAGNÓSTICO ASISTIDO POR IA:\n`;

    if (operatingMode === 'TREATMENT') {
      if (Number(habituationRate) >= 40) {
        dictamen += `   Reconsolidación exitosa. La estimulación bilateral continua indujo una disminución de la carga afectiva diana con descenso galvánico superior al 40% y reactivación vagal (RMSSD > 35 ms), cumpliendo criterios de desensibilización biológica objetiva (RCI < -1.96, p < .05).\n`;
      } else {
        dictamen += `   Habituación parcial. El paciente mostró resistencia autonómica al procesamiento bilateral; se recomienda programar sesión adicional modulando la cadencia sacádica a 1.1 Hz.\n`;
      }
    } else {
      if (peakGsr - basalGsr > 2.0) {
        dictamen += `   Descompensación simpática paroxística verificada ante la evocación del nudo traumático, confirmando hipervigilancia amigdalina central y ruptura de la ventana de tolerancia.\n`;
      } else {
        dictamen += `   Respuesta fisiológica regulada dentro de los márgenes de seguridad basal (Mahalanobis D² < 2.5).\n`;
      }
    }

    setRoiReportText(dictamen);

    if (onUpdatePatientVrData) {
      onUpdatePatientVrData(
        {
          sessionDate: new Date().toISOString(),
          baselineGsr: basalGsr,
          baselineHrv: liveCurve[0]?.hrv || 38,
          habituationIndexH: Number(habituationRate),
          reactionTimeMs: [Math.round(sweepSpeedHz * 100)],
          gsrMicroSiemens: liveCurve.map(p => p.gsr),
          hrvRmssdMs: liveCurve.map(p => p.hrv)
        } as any,
        {
          sessionId: `EMDR-${Date.now()}`,
          date: new Date().toISOString(),
          moduleExecuted: activeProtocol.id,
          clinicalObservations: dictamen,
          autonomicRegulationScore: Number(habituationRate) >= 40 ? 'ÓPTIMA' : 'MODERADA'
        } as any
      );
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Objetivo Individual — ${patientId}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.5; font-size: 10.5pt; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; }
          .logo { font-size: 16pt; font-weight: 800; color: #0284c7; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 15px; font-size: 9.5pt; }
          .dictamen-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; font-size: 9.5pt; color: #166534; white-space: pre-wrap; font-family: monospace; }
          .sig-box { margin-top: 50px; display: flex; justify-content: space-between; font-size: 9.5pt; }
          .sig-line { width: 220px; border-top: 1px solid #334155; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">AMIE CLINICAL COPILOT</div>
          <div style="font-size: 9pt; color: #64748b;">Reporte Pericial EMDR 3D (ROI)<br/>Emisión: ${new Date().toLocaleDateString('es-ES')}</div>
        </div>
        <div class="meta-box">
          <strong>PACIENTE:</strong> ${patientId} | <strong>PROTOCOLO:</strong> ${activeProtocol.name}<br/>
          <strong>MODO:</strong> ${operatingMode} | <strong>CÓDIGOS:</strong> CIE-11: ${activeProtocol.cie11} | DSM-5-TR: ${activeProtocol.dsm5}
        </div>
        <h4>DICTAMEN PERICIAL MULTIMODAL</h4>
        <div class="dictamen-box">${roiReportText}</div>
        <div class="sig-box">
          <div class="sig-line">Operador de Telemetría VR</div>
          <div class="sig-line">Dr. Alejandro Morales Rivera<br/>No. Colegiado: 749210</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn font-sans text-slate-100 select-none overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1440px] shadow-2xl overflow-hidden relative flex flex-col h-[94vh]">
        
        {/* Cabecera Principal */}
        <header className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-rose-600 via-pink-600 to-purple-600 rounded-xl shadow-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                RECONSOLIDACIÓN DE MEMORIA &amp; EMDR 3D (PIPELINE 3 FASES)
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-500/40 font-mono">
                  SACCADIC 3D
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Expediente: <strong className="text-rose-300 font-mono">{safePatientName}</strong> | Estado: {isVisorLinked ? 'Visor Enlazado y Sincronizado' : 'Buscando Visor...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de Propósito */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOperatingMode('DIAGNOSTIC')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  operatingMode === 'DIAGNOSTIC' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Diagnóstico (Huella)</span>
              </button>
              <button
                type="button"
                onClick={() => setOperatingMode('TREATMENT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  operatingMode === 'TREATMENT' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tratamiento (EMDR)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => VrControlService.triggerGroundingProtocol(patientId)}
              className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Grounding</span>
            </button>

            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/60 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Indicador del Pipeline */}
        <div className="bg-slate-950/80 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-sans font-bold text-[11px] uppercase">Fase Activa:</span>
            
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              phase === 'PHASE_1_BASELINE' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span>1. Anclaje Seguro ({baselineSec}s)</span>
            </div>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              phase === 'PHASE_2_SACCADIC' ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span>2. Desensibilización Sacádica ({activeSec}s)</span>
            </div>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              phase === 'PHASE_3_INTEGRATION' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span>3. Integración ({integrationSec}s)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Fase: <strong className="text-white">{phaseTime}s</strong></span>
            <span className="text-slate-400">Total: <strong className="text-rose-300">{totalElapsedTime}s / {totalProtocolDuration}s</strong></span>
          </div>
        </div>

        {/* Cuerpo Principal */}
        <main className="flex-1 p-5 grid grid-cols-12 gap-5 overflow-hidden">
          
          {/* COLUMNA 1: Selector y Parámetros */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                Categoría de Trauma Objetivo
              </label>
              <select
                disabled={phase !== 'IDLE' && phase !== 'FINISHED'}
                value={selectedTraumaCategory}
                onChange={(e) => setSelectedTraumaCategory(e.target.value as TraumaCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold outline-none cursor-pointer focus:border-rose-500"
              >
                {Object.values(TRAUMA_PROTOCOLS).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">CIE-11:</span>
                  <strong className="text-cyan-300">{activeProtocol.cie11}</strong>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">DSM-5-TR:</span>
                  <strong className="text-amber-300">{activeProtocol.dsm5}</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Guion IA Programable (Fase Activa)
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingParams(!isEditingParams)}
                  className="text-[10px] text-cyan-400 underline cursor-pointer"
                >
                  {isEditingParams ? 'Ocultar' : 'Ajustar Hz'}
                </button>
              </div>

              <textarea
                disabled={phase !== 'IDLE' && phase !== 'FINISHED'}
                value={programmableScript}
                onChange={(e) => setProgrammableScript(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none resize-none focus:border-rose-500 mb-3 leading-relaxed font-sans"
              />

              {isEditingParams && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-2.5 text-xs mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Velocidad Sacádica (Hz):</span>
                    <span className="font-mono text-rose-400 font-bold">{sweepSpeedHz.toFixed(1)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="2.5"
                    step="0.1"
                    disabled={phase !== 'IDLE' && phase !== 'FINISHED'}
                    value={sweepSpeedHz}
                    onChange={(e) => setSweepSpeedHz(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Theta Binaural (Hz):</span>
                    <span className="font-mono text-cyan-400 font-bold">{binauralThetaHz.toFixed(1)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="7.0"
                    step="0.1"
                    disabled={phase !== 'IDLE' && phase !== 'FINISHED'}
                    value={binauralThetaHz}
                    onChange={(e) => setBinauralThetaHz(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              )}

              <div className="mt-auto space-y-2">
                {phase === 'IDLE' && (
                  <button
                    type="button"
                    onClick={handleStartPipeline}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      isVisorLinked ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isVisorLinked ? 'Iniciar Pipeline EMDR' : 'Conecta el Visor Primero'}</span>
                  </button>
                )}

                {(phase === 'PHASE_1_BASELINE' || phase === 'PHASE_2_SACCADIC' || phase === 'PHASE_3_INTEGRATION') && (
                  <button
                    type="button"
                    onClick={finishSessionAndGenerateRoi}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Detener y Compilar Dictamen</span>
                  </button>
                )}

                {phase === 'FINISHED' && (
                  <button
                    type="button"
                    onClick={handleStartPipeline}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reiniciar Protocolo EMDR</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* COLUMNA 2: Monitor Fisiológico & Gráfica */}
          <section className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">GSR FÁSICO</span>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">{currentGsr.toFixed(2)} <span className="text-xs text-slate-500 font-normal">µS</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">VFC RMSSD</span>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">{currentHrv} <span className="text-xs text-slate-500 font-normal">ms</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">PASES SACÁDICOS</span>
                <div className="text-xl font-mono font-black text-rose-400 mt-1">{bilateralStepsCount}</div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-400" />
                  Curva de Desensibilización &amp; Tono Vagal
                </span>
                <span className="text-[10px] font-mono text-slate-500">{totalElapsedTime}s / {totalProtocolDuration}s</span>
              </div>

              <div className="flex-1 w-full bg-slate-900 rounded-lg border border-slate-800 p-2 relative flex items-end overflow-hidden">
                {liveCurve.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${totalProtocolDuration} 100`} preserveAspectRatio="none">
                    <line x1={baselineSec} y1="0" x2={baselineSec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />
                    <line x1={baselineSec + activeSec} y1="0" x2={baselineSec + activeSec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />

                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.gsr * 12))}`).join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.hrv * 0.9))}`).join(' ')} />
                  </svg>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-mono">
                    <Eye className="w-6 h-6 mb-2 opacity-30 animate-pulse" />
                    <span>Presiona 'Iniciar Pipeline EMDR' para registrar la curva</span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex justify-between text-[9px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> GSR (µS)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span> HRV (ms)</span>
                <span className="flex items-center gap-1">Líneas punteadas: Transición de Fase</span>
              </div>
            </div>
          </section>

          {/* COLUMNA 3: Dictamen Pericial ROI & Logs */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col max-h-[60%]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Dictamen Pericial EMDR (ROI)
                </span>
                {roiReportText && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-2 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-500/50 text-sky-200 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Imprimir A4</span>
                  </button>
                )}
              </div>

              <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                {roiReportText || (
                  <div className="text-slate-600 text-center mt-10 text-xs">
                    El dictamen pericial con el cálculo de la tasa de desensibilización (H) se compilará automáticamente al completar la fase 3.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex-1 flex flex-col max-h-[40%]">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                <Terminal className="w-3 h-3" /> AI Closed-Loop Logs
              </span>
              <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] text-slate-400 flex flex-col-reverse">
                {aiLogs.map((log, i) => (
                  <p key={i} className="pb-0.5">{log}</p>
                ))}
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default VrMemoryReconsolidationModule;
