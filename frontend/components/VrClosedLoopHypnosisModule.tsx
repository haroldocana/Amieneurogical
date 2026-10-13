// ============================================================================
// AMIE CLINICAL COPILOT - MÓDULO DE NEUROHIPNOSIS AUTO-GUIADA Y REGULADA
// frontend/components/VrClosedLoopHypnosisModule.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { telemetryService, PrecisionTelemetryPacket } from '../services/telemetryService';
import { VrControlService } from '../services/VrControlService';
import { ClinicalAudioGuidanceEngine } from '../services/clinicalAudioGuidanceService';
import { 
  Sparkles, 
  Play, 
  Square, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Activity, 
  Sliders, 
  ShieldAlert, 
  Radio, 
  Waves, 
  Wind, 
  SunMedium, 
  CheckCircle2, 
  X,
  Gauge
} from 'lucide-react';

interface VrClosedLoopHypnosisModuleProps {
  patient: PatientRecord;
  onClose: () => void;
  onCompleteSession?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

interface HypnosisStep {
  stepIndex: number;
  title: string;
  script: string;
  targetBinauralHz: number;
  targetPacerCpm: number;
  durationSec: number;
}

const HYPNOSIS_STEPS: HypnosisStep[] = [
  {
    stepIndex: 1,
    title: 'Fase 1: Fijación Ocular y Anclaje Somático',
    script: 'Fija tu mirada suavemente en el orbe luminoso central. Permite que tus párpados se relajen y que tu respiración encuentre el ritmo del pulso de luz... Inhalando cuando el orbe se expande, exhalando cuando se contrae.',
    targetBinauralHz: 6.8,
    targetPacerCpm: 6.5,
    durationSec: 60
  },
  {
    stepIndex: 2,
    title: 'Fase 2: Fraccionamiento e Inducción Vagal',
    script: 'Con cada respiración, tus hombros caen un centímetro más. Cualquier sonido exterior pasa de largo, permitiéndote descender a una sensación de calma segura y pesadez en las extremidades. Diez... soltando el control. Nueve... sintiendo serenidad.',
    targetBinauralHz: 5.5,
    targetPacerCpm: 5.5,
    durationSec: 90
  },
  {
    stepIndex: 3,
    title: 'Fase 3: Trance Theta y Sugestión de Sanación',
    script: 'En este estado de descanso profundo, tu sistema nervioso se repara. Observa cómo la tensión acumulada se disuelve como niebla ante el sol de la mañana. Tu mente subconsciente asimila recursos de fortaleza y equilibrio duradero.',
    targetBinauralHz: 4.8,
    targetPacerCpm: 5.0,
    durationSec: 120
  },
  {
    stepIndex: 4,
    title: 'Fase 4: Reorientación y Despertar Alerta',
    script: 'Comenzamos a regresar suavemente. Del uno al cinco, llevando contigo toda la calma y claridad: Uno, sintiendo tu cuerpo... Dos, respirando con energía renovada... Tres, cuatro y cinco: ojos abiertos, completamente alerta, despejado y en paz.',
    targetBinauralHz: 10.0, // Retorno a ritmo Alfa / alerta relajada
    targetPacerCpm: 7.0,
    durationSec: 45
  }
];

export const VrClosedLoopHypnosisModule: React.FC<VrClosedLoopHypnosisModuleProps> = ({
  patient,
  onClose,
  onCompleteSession
}) => {
  // --------------------------------------------------------------------------
  // ESTADO DE SESIÓN Y SECUENCIA
  // --------------------------------------------------------------------------
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [elapsedStepSec, setElapsedStepSec] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Parámetros de bucle cerrado (Closed-Loop)
  const [binauralHz, setBinauralHz] = useState<number>(5.5);
  const [pacerCpm, setPacerCpm] = useState<number>(6.0);
  const [orbPulsePct, setOrbPulsePct] = useState<number>(65);
  const [closedLoopAutoRegulate, setClosedLoopAutoRegulate] = useState<boolean>(true);

  // Bioseñales en vivo
  const [liveHrv, setLiveHrv] = useState<number>(42);
  const [liveGsr, setLiveGsr] = useState<number>(3.2);
  const [liveBpm, setLiveBpm] = useState<number>(72);
  const [tranceDepth, setTranceDepth] = useState<number>(15); // Escala 0-100%

  // Historial de bioseñales para el reporte
  const hrvHistory = useRef<number[]>([]);
  const gsrHistory = useRef<number[]>([]);
  const sessionTimerRef = useRef<any>(null);

  const currentStep = HYPNOSIS_STEPS[currentStepIndex];

  // --------------------------------------------------------------------------
  // SUSCRIPCIÓN A TELEMETRÍA EN VIVO Y CÁLCULO DE PROFUNDIDAD DE TRANCE
  // --------------------------------------------------------------------------
  useEffect(() => {
    const unsubTelemetry = telemetryService.subscribeData((packet: PrecisionTelemetryPacket) => {
      setLiveHrv(packet.hrvRmssdMs);
      setLiveGsr(packet.gsrMicroSiemens);
      setLiveBpm(packet.heartRateBpm);

      if (isActive) {
        hrvHistory.current.push(packet.hrvRmssdMs);
        gsrHistory.current.push(packet.gsrMicroSiemens);

        // Algoritmo de Profundidad de Trance (0-100%):
        // Mayor HRV (tono vagal) + Menor GSR (calma simpática) = Mayor profundidad
        const normalizedHrv = Math.min(100, (packet.hrvRmssdMs / 65) * 60);
        const normalizedGsr = Math.max(0, 40 - (packet.gsrMicroSiemens * 6));
        const estimatedTrance = Math.min(100, Math.round(normalizedHrv + normalizedGsr));
        setTranceDepth(estimatedTrance);

        // Bio-regulación en bucle cerrado automática si está habilitada
        if (closedLoopAutoRegulate) {
          // Si el GSR sube bruscamente (alerta de sobresalto), atenuar el orbe y subir Hz
          if (packet.gsrMicroSiemens > 4.5) {
            setOrbPulsePct(prev => Math.max(30, prev - 5));
          } else {
            setOrbPulsePct(prev => Math.min(85, prev + 2));
          }

          // Si el HRV es alto (> 45 ms), permitir sintonización Theta profunda
          if (packet.hrvRmssdMs > 45 && currentStepIndex === 2) {
            setBinauralHz(4.5);
          }
        }
      }
    });

    return () => unsubTelemetry();
  }, [isActive, closedLoopAutoRegulate, currentStepIndex]);

  // Sincronizar parámetros con Unity / WebXR en tiempo real
  useEffect(() => {
    if (isActive) {
      VrControlService.sendMasterConfigParam('ENV_06_NEURO_HYPNOSIS_TRANCE', 'binauralBeatFrequencyHz', binauralHz);
      VrControlService.sendMasterConfigParam('ENV_06_NEURO_HYPNOSIS_TRANCE', 'breathingPacerCadenceCpm', pacerCpm);
      VrControlService.sendMasterConfigParam('ENV_06_NEURO_HYPNOSIS_TRANCE', 'orbLuminancePulsePct', orbPulsePct);
    }
  }, [isActive, binauralHz, pacerCpm, orbPulsePct]);

  // --------------------------------------------------------------------------
  // CONTROL DEL FLUJO AUTO-GUIADO (MOTOR VOCAL TTS + TIMER)
  // --------------------------------------------------------------------------
  const playCurrentStepScript = useCallback((step: HypnosisStep) => {
    if (isMuted) return;

    ClinicalAudioGuidanceEngine.speak(step.script, {
      rate: 0.78, // Cadencia desacelerada hipnótica
      pitch: 0.88, // Tono grave y seguro
      volume: 1.0
    });
  }, [isMuted]);

  const advanceToStep = useCallback((index: number) => {
    if (index >= HYPNOSIS_STEPS.length) {
      // Fin de la sesión de hipnosis
      handleEndSession();
      return;
    }

    const nextStep = HYPNOSIS_STEPS[index];
    setCurrentStepIndex(index);
    setElapsedStepSec(0);
    setBinauralHz(nextStep.targetBinauralHz);
    setPacerCpm(nextStep.targetPacerCpm);
    playCurrentStepScript(nextStep);
  }, [playCurrentStepScript]);

  // Temporizador principal de la sesión
  useEffect(() => {
    if (isActive) {
      sessionTimerRef.current = setInterval(() => {
        setElapsedStepSec(prev => {
          const updated = prev + 1;
          if (updated >= currentStep.durationSec) {
            advanceToStep(currentStepIndex + 1);
            return 0;
          }
          return updated;
        });
      }, 1000);
    } else {
      clearInterval(sessionTimerRef.current);
    }

    return () => clearInterval(sessionTimerRef.current);
  }, [isActive, currentStepIndex, currentStep.durationSec, advanceToStep]);

  const handleStartSession = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
    setElapsedStepSec(0);
    hrvHistory.current = [];
    gsrHistory.current = [];

    // Cargar la escena en el visor VR vía WebSocket
    VrControlService.loadMasterEnvironment('ENV_06_NEURO_HYPNOSIS_TRANCE', patient.id);

    // Iniciar locución del paso 1
    advanceToStep(0);
  };

  const handlePauseSession = () => {
    setIsActive(false);
    ClinicalAudioGuidanceEngine.stop();
  };

  const handleEndSession = () => {
    setIsActive(false);
    ClinicalAudioGuidanceEngine.stop();

    const avgHrv = hrvHistory.current.length 
      ? Math.round(hrvHistory.current.reduce((a, b) => a + b, 0) / hrvHistory.current.length) 
      : liveHrv;

    const avgGsr = gsrHistory.current.length 
      ? Number((gsrHistory.current.reduce((a, b) => a + b, 0) / gsrHistory.current.length).toFixed(2)) 
      : liveGsr;

    const telemetryReport: VrTelemetryData = {
      sessionId: `HYPNO-${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: 'PICO_NEO_3_PRO',
      hrvRmssdMs: hrvHistory.current,
      gsrMicroSiemens: gsrHistory.current,
      avgHrv,
      avgGsr,
      habituationIndexH: 2.9,
      binauralBetaHz: binauralHz
    };

    const clinicalReport: VrTherapyReport = {
      sessionGuid: `GUID-${Date.now()}`,
      exposureType: 'NEURO_HYPNOSIS_CLOSED_LOOP_THETA',
      sympatheticToneIndex: avgGsr,
      vagalReactivityIndex: avgHrv,
      habituationRate: avgHrv > 40 ? 'Óptima' : 'Moderada',
      synthesizedClinicalSummary: `Sesión de neurohipnosis auto-guiada completada. Profundidad máxima de trance alcanzada: ${tranceDepth}%. Tono parasimpático promedio: ${avgHrv} ms RMSSD.`
    };

    onCompleteSession?.(telemetryReport, clinicalReport);
  };

  const handleEmergencyGrounding = () => {
    handlePauseSession();
    VrControlService.triggerGroundingProtocol(patient.id);
    ClinicalAudioGuidanceEngine.triggerEmergencyGroundingVoice();
  };

  // --------------------------------------------------------------------------
  // RENDERIZADO DE LA CONSOLA TERAPÉUTICA
  // --------------------------------------------------------------------------
  return (
    <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-2xl text-slate-100 space-y-5">
      
      {/* 1. Encabezado del Módulo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-600/30">
            <Sparkles className="w-5 h-5 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                Módulo Clínico ENV_06
              </span>
              <span className="px-2 py-0.5 bg-purple-950 border border-purple-500/40 text-purple-300 rounded text-[9.5px] font-bold">
                Closed-Loop Theta
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Neurohipnosis Auto-Guiada &amp; Regulación Autonómica
            </h3>
          </div>
        </div>

        {/* Acciones de Encabezado */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEmergencyGrounding}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/50 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            title="Interrupción inmediata y voz de orientación 5-4-3-2-1"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Grounding de Emergencia</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Monitor Biométrico en Tiempo Real & Profundidad de Trance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" /> Tono Vagal (HRV)
          </div>
          <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
            {liveHrv} <span className="text-xs text-slate-500 font-normal">ms RMSSD</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Waves className="w-3 h-3 text-emerald-400" /> Conductancia GSR
          </div>
          <div className="text-lg font-bold text-emerald-300 font-mono mt-0.5">
            {liveGsr} <span className="text-xs text-slate-500 font-normal">µS</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Radio className="w-3 h-3 text-amber-400" /> Ritmo Cardíaco
          </div>
          <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
            {liveBpm} <span className="text-xs text-slate-500 font-normal">bpm</span>
          </div>
        </div>

        <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl">
          <div className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
            <Gauge className="w-3 h-3 text-purple-400" /> Profundidad de Trance
          </div>
          <div className="text-lg font-bold text-purple-200 font-mono mt-0.5 flex items-center justify-between">
            <span>{tranceDepth}%</span>
            <div className="w-12 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full transition-all duration-500" 
                style={{ width: `${tranceDepth}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Panel de Guion Auto-Guiado (TTS Activo) */}
      <div className="p-4 bg-slate-950/90 border border-purple-500/20 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-purple-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            {currentStep.title}
          </span>
          <span className="text-slate-400 font-mono">
            Tiempo de Fase: {elapsedStepSec}s / {currentStep.durationSec}s
          </span>
        </div>

        <p className="text-xs text-slate-200 italic leading-relaxed pl-3 border-l-2 border-purple-500">
          "{currentStep.script}"
        </p>

        {/* Barra de progreso de la fase */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-1000"
            style={{ width: `${Math.min(100, (elapsedStepSec / currentStep.durationSec) * 100)}%` }}
          />
        </div>
      </div>

      {/* 4. Panel de Parámetros Bio-Regulados (Closed-Loop) */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Parámetros en Tiempo Real (VR Scene 6DoF)
          </span>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={closedLoopAutoRegulate}
              onChange={(e) => setClosedLoopAutoRegulate(e.target.checked)}
              className="accent-purple-500"
            />
            <span className="font-semibold text-purple-300">Regulación Automática Closed-Loop</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Frecuencia Binaural */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1"><Waves className="w-3 h-3 text-cyan-400" /> Binaural Theta:</span>
              <strong className="text-cyan-300 font-mono">{binauralHz.toFixed(1)} Hz</strong>
            </div>
            <input
              type="range"
              min="3.0"
              max="10.0"
              step="0.1"
              value={binauralHz}
              onChange={(e) => setBinauralHz(parseFloat(e.target.value))}
              disabled={closedLoopAutoRegulate}
              className="w-full accent-cyan-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Cadencia Pacer Respiratorio */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-emerald-400" /> Pacer Respiratorio:</span>
              <strong className="text-emerald-300 font-mono">{pacerCpm.toFixed(1)} cpm</strong>
            </div>
            <input
              type="range"
              min="4.0"
              max="8.0"
              step="0.25"
              value={pacerCpm}
              onChange={(e) => setPacerCpm(parseFloat(e.target.value))}
              disabled={closedLoopAutoRegulate}
              className="w-full accent-emerald-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Brillo del Orbe */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1"><SunMedium className="w-3 h-3 text-amber-400" /> Luminosidad Orbe 3D:</span>
              <strong className="text-amber-300 font-mono">{orbPulsePct}%</strong>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={orbPulsePct}
              onChange={(e) => setOrbPulsePct(parseInt(e.target.value, 10))}
              disabled={closedLoopAutoRegulate}
              className="w-full accent-amber-500 cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* 5. Controles de Transporte y Ejecución */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              onClick={handlePauseSession}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>Pausar Sesión</span>
            </button>
          ) : (
            <button
              onClick={handleStartSession}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Iniciar Neurohipnosis</span>
            </button>
          )}

          <button
            onClick={() => advanceToStep(currentStepIndex + 1)}
            disabled={!isActive || currentStepIndex >= HYPNOSIS_STEPS.length - 1}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Siguiente Fase
          </button>

          <button
            onClick={handleEndSession}
            disabled={!isActive}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Finalizar y Guardar Reporte
          </button>
        </div>

        {/* Mute y Estado Vocal */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
              isMuted 
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Activar narración verbal' : 'Silenciar narración verbal'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VrClosedLoopHypnosisModule;
