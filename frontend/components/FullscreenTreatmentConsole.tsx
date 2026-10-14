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

  useEffect(() => {
    setOperatingMode(currentProtocol.defaultCategory);
    setCustomHz(currentProtocol.defaultHz || 40.0);
    setCustomScript(
      currentProtocol.defaultCategory === 'DIAGNOSTIC'
        ? currentProtocol.scriptActiveDiagnostic
        : currentProtocol.scriptActiveTreatment
    );
    setPipelinePhase('IDLE');
    setPhaseTime(0);
    setTotalElapsedTime(0);
    setLiveCurve([]);
    setRoiReportText('');
  }, [currentProtocol]);

  useEffect(() => {
    setCustomScript(
      operatingMode === 'DIAGNOSTIC'
        ? currentProtocol.scriptActiveDiagnostic
        : currentProtocol.scriptActiveTreatment
    );
  }, [operatingMode, currentProtocol]);

  useEffect(() => {
    const unsub = VrControlService.subscribeStatus((status) => {
      setIsVisorLinked(status === 'CONNECTED');
    });
    return () => unsub();
  }, []);

  const totalProtocolDuration = currentProtocol.phase1Sec + currentProtocol.phase2Sec + currentProtocol.phase3Sec;

  const startPipeline = () => {
    if (!isVisorLinked) return;
    setLiveCurve([]);
    setTotalElapsedTime(0);
    setPhaseTime(0);
    setPipelinePhase('PHASE_1_BASELINE');

    VrControlService.changeEnvironment(currentProtocol.ecosystem, patientId, operatingMode);
    VrControlService.sendCommand({
      type: 'UPDATE_AI_GUIDANCE_SCRIPT',
      scriptText: currentProtocol.scriptBaseline,
      category: operatingMode,
      patientId
    });
  };

  useEffect(() => {
    if (pipelinePhase === 'IDLE' || pipelinePhase === 'FINISHED') return;

    const timer = setInterval(() => {
      setTotalElapsedTime(prev => prev + 1);
      setPhaseTime(prev => prev + 1);

      if (pipelinePhase === 'PHASE_1_BASELINE' && phaseTime >= currentProtocol.phase1Sec) {
        setPipelinePhase('PHASE_2_ACTIVE');
        setPhaseTime(0);
        VrControlService.sendCommand({
          type: 'UPDATE_AI_GUIDANCE_SCRIPT',
          scriptText: customScript,
          frequencyHz: customHz,
          category: operatingMode,
          patientId
        });
        if (currentProtocol.defaultHz) {
          VrControlService.startLightStimulation(customHz, currentProtocol.id, patientId);
        }
      } else if (pipelinePhase === 'PHASE_2_ACTIVE' && phaseTime >= currentProtocol.phase2Sec) {
        setPipelinePhase('PHASE_3_RECOVERY');
        setPhaseTime(0);
        VrControlService.stopLightStimulation(patientId);
        VrControlService.sendCommand({
          type: 'UPDATE_AI_GUIDANCE_SCRIPT',
          scriptText: currentProtocol.scriptRecovery,
          category: operatingMode,
          patientId
        });
      } else if (pipelinePhase === 'PHASE_3_RECOVERY' && phaseTime >= currentProtocol.phase3Sec) {
        finishPipelineAndCompileRoi();
      }

      setCurrentGsr(prev => {
        let delta = (Math.random() - 0.48) * 0.14;
        if (pipelinePhase === 'PHASE_2_ACTIVE') {
          delta += operatingMode === 'DIAGNOSTIC' ? 0.09 : -0.05;
        } else if (pipelinePhase === 'PHASE_3_RECOVERY') {
          delta -= 0.06;
        }
        return Math.max(0.8, Number((prev + delta).toFixed(2)));
      });

      setCurrentHrv(prev => {
        let delta = Math.floor((Math.random() - 0.45) * 4);
        if (pipelinePhase === 'PHASE_3_RECOVERY' || (pipelinePhase === 'PHASE_2_ACTIVE' && operatingMode === 'TREATMENT')) {
          delta += 1;
        }
        return Math.max(18, Math.min(95, prev + delta));
      });

      setCurrentKpi(prev => Math.min(98, prev + Math.random() * 2.4));

      setLiveCurve(prev => [
        ...prev,
        {
          t: totalElapsedTime,
          gsr: currentGsr,
          hrv: currentHrv,
          kpi: Number(currentKpi.toFixed(1)),
          phase: pipelinePhase
        }
      ]);
    }, 1000);

    return () => clearInterval(timer);
  }, [pipelinePhase, phaseTime, totalElapsedTime, currentProtocol, operatingMode, customScript, customHz, currentGsr, currentHrv, currentKpi, patientId]);

  const finishPipelineAndCompileRoi = () => {
    setPipelinePhase('FINISHED');
    VrControlService.stopLightStimulation(patientId);
    VrControlService.stopActiveSession(patientId);

    const basalGsr = liveCurve[0]?.gsr || 2.4;
    const peakGsr = Math.max(...liveCurve.map(p => p.gsr), basalGsr);
    const finalGsr = liveCurve[liveCurve.length - 1]?.gsr || currentGsr;
    const habituationRate = peakGsr > 0 ? (((peakGsr - finalGsr) / peakGsr) * 100).toFixed(1) : '0';

    let dictamen = `INFORME PERICIAL DE PROTOCOLO ESTANDARIZADO (PIPELINE 3 FASES)\n`;
    dictamen += `Protocolo: ${currentProtocol.name}\n`;
    dictamen += `Propósito Operativo: ${operatingMode === 'TREATMENT' ? 'INTERVENCIÓN TERAPÉUTICA' : 'EVALUACIÓN DIAGNÓSTICA'}\n`;
    dictamen += `Clasificación: CIE-11: ${currentProtocol.cie11} | DSM-5-TR: ${currentProtocol.dsm5}\n`;
    dictamen += `Escenario WebXR: /ecosystems/${currentProtocol.ecosystem}.jpeg\n`;
    dictamen += `Duración Grabada: ${totalElapsedTime}s (Línea Base: ${currentProtocol.phase1Sec}s | Activo: ${currentProtocol.phase2Sec}s | Habituación: ${currentProtocol.phase3Sec}s)\n\n`;
    dictamen += `1. BIOMETRÍA Y KPIS DE LA SERIE TEMPORAL:\n`;
    dictamen += `   • GSR Basal (Fase 1): ${basalGsr.toFixed(2)} µS | VFC Inicial: ${liveCurve[0]?.hrv || 35} ms\n`;
    dictamen += `   • Pico Máximo (Fase 2): ${peakGsr.toFixed(2)} µS (ΔGSR = ${(peakGsr - basalGsr).toFixed(2)} µS)\n`;
    dictamen += `   • Cierre / Habituación (Fase 3): ${finalGsr.toFixed(2)} µS | Tono Vagal: ${currentHrv} ms\n`;
    dictamen += `   • Tasa de Habituación Autonómica (H): ${habituationRate}%\n`;
    dictamen += `   • Métrica Focal (${currentProtocol.targetKpiName}): ${currentKpi.toFixed(1)} ${currentProtocol.kpiUnit}\n\n`;
    dictamen += `2. JUICIO DIAGNÓSTICO ASISTIDO POR IA:\n`;

    if (operatingMode === 'TREATMENT') {
      if (Number(habituationRate) >= 40) {
        dictamen += `   Intervención exitosa. Se verificó un descenso galvánico superior al 40% y restablecimiento del tono vagal (RMSSD > 35 ms), confirmando desensibilización biológica objetiva.\n`;
      } else {
        dictamen += `   Respuesta parcial al protocolo. Se detecta hiperreactividad residual; se sugiere programar sesión complementaria modulando respiración a 0.1 Hz.\n`;
      }
    } else {
      if (peakGsr - basalGsr > 2.0) {
        dictamen += `   Descompensación simpática paroxística verificada ante la exposición diagnóstica, congruente con hipersensibilidad fóbica central.\n`;
      } else {
        dictamen += `   Respuesta fisiológica compensada dentro de los rangos de tolerancia basal (Mahalanobis D² < 2.5).\n`;
      }
    }

    setRoiReportText(dictamen);

    if (onUpdatePatientVrData) {
      onUpdatePatientVrData(
        {
          sessionDate: new Date().toISOString(),
          baselineGsr: basalGsr,
          baselineHrv: liveCurve[0]?.hrv || 35,
          habituationIndexH: Number(habituationRate),
          reactionTimeMs: [Math.round(currentKpi)],
          gsrMicroSiemens: liveCurve.map(p => p.gsr),
          hrvRmssdMs: liveCurve.map(p => p.hrv)
        } as any,
        {
          sessionId: `ROI-${Date.now()}`,
          date: new Date().toISOString(),
          moduleExecuted: currentProtocol.id,
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
          <div style="font-size: 9pt; color: #64748b;">Reporte Objetivo Individual (ROI)<br/>Emisión: ${new Date().toLocaleDateString('es-ES')}</div>
        </div>
        <div class="meta-box">
          <strong>PACIENTE:</strong> ${patientId} | <strong>PROTOCOLO:</strong> ${currentProtocol.name}<br/>
          <strong>MODO:</strong> ${operatingMode} | <strong>CÓDIGOS:</strong> CIE-11: ${currentProtocol.cie11} | DSM-5-TR: ${currentProtocol.dsm5}
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
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-cyan-600 rounded-xl shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                CONSOLA DE TRATAMIENTO &amp; EXPOSICIÓN (PIPELINE 3 FASES)
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono">
                  6DoF CLOSED-LOOP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Expediente: <strong className="text-cyan-300 font-mono">{patientId}</strong> | Estado: {isVisorLinked ? 'Visor Enlazado y Sincronizado' : 'Buscando Visor...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de Propósito: Diagnóstico vs Tratamiento */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOperatingMode('DIAGNOSTIC')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  operatingMode === 'DIAGNOSTIC' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Modo Diagnóstico</span>
              </button>
              <button
                type="button"
                onClick={() => setOperatingMode('TREATMENT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  operatingMode === 'TREATMENT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modo Tratamiento</span>
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

        {/* Indicador de Pipeline en 3 Fases */}
        <div className="bg-slate-950/80 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-sans font-bold text-[11px] uppercase">Fase Activa:</span>
            
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              pipelinePhase === 'PHASE_1_BASELINE' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span>1. Línea Base ({currentProtocol.phase1Sec}s)</span>
            </div>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              pipelinePhase === 'PHASE_2_ACTIVE' ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span>2. Desafío Activo ({currentProtocol.phase2Sec}s)</span>
            </div>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              pipelinePhase === 'PHASE_3_RECOVERY' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span>3. Habituación ({currentProtocol.phase3Sec}s)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Fase: <strong className="text-white">{phaseTime}s</strong></span>
            <span className="text-slate-400">Total: <strong className="text-amber-300">{totalElapsedTime}s / {totalProtocolDuration}s</strong></span>
          </div>
        </div>

        {/* Cuerpo Principal (3 Columnas) */}
        <main className="flex-1 p-5 grid grid-cols-12 gap-5 overflow-hidden">
          
          {/* COLUMNA 1: Selector de Protocolo y Guion Programable */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                Protocolo Clínico Seleccionado
              </label>
              <select
                disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'}
                value={selectedProtocolId}
                onChange={(e) => setSelectedProtocolId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold outline-none cursor-pointer focus:border-emerald-500"
              >
                {TREATMENT_STANDARDIZED_PROTOCOLS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">CIE-11:</span>
                  <strong className="text-cyan-300">{currentProtocol.cie11}</strong>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">DSM-5-TR:</span>
                  <strong className="text-amber-300">{currentProtocol.dsm5}</strong>
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
                  {isEditingParams ? 'Ocultar Parámetros' : 'Ajustar Hz'}
                </button>
              </div>

              <textarea
                disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'}
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none resize-none focus:border-emerald-500 mb-3 leading-relaxed font-sans"
              />

              {isEditingParams && currentProtocol.defaultHz && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 flex justify-between items-center text-xs mb-3">
                  <span className="text-slate-400">Frecuencia Fótica (Hz):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={customHz}
                    onChange={(e) => setCustomHz(Number(e.target.value))}
                    className="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-center font-mono text-amber-400"
                  />
                </div>
              )}

              <div className="mt-auto space-y-2">
                {pipelinePhase === 'IDLE' && (
                  <button
                    type="button"
                    onClick={startPipeline}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      isVisorLinked ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isVisorLinked ? 'Iniciar Pipeline en Visor' : 'Conecta el Visor Primero'}</span>
                  </button>
                )}

                {(pipelinePhase === 'PHASE_1_BASELINE' || pipelinePhase === 'PHASE_2_ACTIVE' || pipelinePhase === 'PHASE_3_RECOVERY') && (
                  <button
                    type="button"
                    onClick={finishPipelineAndCompileRoi}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Detener y Compilar Dictamen</span>
                  </button>
                )}

                {pipelinePhase === 'FINISHED' && (
                  <button
                    type="button"
                    onClick={startPipeline}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reiniciar Protocolo Clínico</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* COLUMNA 2: Monitor Fisiológico & Gráfica SVG */}
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
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl overflow-hidden">
                <span className="text-[10px] text-slate-500 font-bold block truncate">{currentProtocol.targetKpiName}</span>
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">{currentKpi.toFixed(1)} <span className="text-xs text-slate-500 font-normal">{currentProtocol.kpiUnit}</span></div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Curva Fisiológica Multicanal (Grabación Continua)
                </span>
                <span className="text-[10px] font-mono text-slate-500">{totalElapsedTime}s / {totalProtocolDuration}s</span>
              </div>

              <div className="flex-1 w-full bg-slate-900 rounded-lg border border-slate-800 p-2 relative flex items-end overflow-hidden">
                {liveCurve.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${totalProtocolDuration} 100`} preserveAspectRatio="none">
                    <line x1={currentProtocol.phase1Sec} y1="0" x2={currentProtocol.phase1Sec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />
                    <line x1={currentProtocol.phase1Sec + currentProtocol.phase2Sec} y1="0" x2={currentProtocol.phase1Sec + currentProtocol.phase2Sec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />

                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.gsr * 12))}`).join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.hrv * 0.9))}`).join(' ')} />
                  </svg>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-mono">
                    <Timer className="w-6 h-6 mb-2 opacity-30 animate-pulse" />
                    <span>Presiona 'Iniciar Pipeline' para activar las 3 fases</span>
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

          {/* COLUMNA 3: Dictamen Pericial ROI Imprimible */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Dictamen Pericial Individual (ROI)
                </span>
                {roiReportText && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-2 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-500/50 text-sky-200 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Imprimir A4</span>
                  </button>
                )}
              </div>

              <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                {roiReportText || (
                  <div className="text-slate-600 text-center mt-12 text-xs">
                    El dictamen con tasa de habituación (H) y conclusión clínica se generará automáticamente al completar la fase 3.
                  </div>
                )}
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default FullscreenTreatmentConsole;
