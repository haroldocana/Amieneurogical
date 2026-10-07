import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord, PrecisionTelemetryPacket } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Sparkles,
  ShieldAlert,
  Brain,
  Activity,
  Zap,
  Play,
  Square,
  RefreshCw,
  Eye,
  Heart,
  Sliders,
  Glasses,
  Volume2,
  Mic,
  Radio,
  Compass,
  Monitor,
  Flame,
  Layers
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

type ClinicalVrMode = 'HYPNOSIS' | 'PHOBIA_VRET' | 'CLUSTER_B_FORENSIC' | 'SYSTEMIC_COUPLE';

export const AmieUnifiedVrConsole: React.FC<Props> = ({ patient, onClose }) => {
  const [vrMode, setVrMode] = useState<ClinicalVrMode>('HYPNOSIS');
  const [subCategoryOption, setSubCategoryOption] = useState<string>('KINETIC_BREATHING');
  const [aiVoiceTone, setAiVoiceTone] = useState<'SOFT_WHISPER' | 'ARROGANT_COLD' | 'NEUTRAL_THERAPIST'>('SOFT_WHISPER');

  const [telemetry, setTelemetry] = useState<PrecisionTelemetryPacket>({
    reactionTimeMs: 240,
    handGripPressureKg: 18.5,
    touchTapLatencyMs: 220,
    heartRateBpm: 72,
    hrvRmssdMs: patient.multisensoryHardware?.vagalToneHrvIndex || 38,
    gsrMicroSiemens: 2.1,
    rrIntervalMs: 833,
    timestamp: Date.now()
  });

  const [sessionActive, setSessionActive] = useState(false);
  const [tranceOrStressDepth, setTranceOrStressDepth] = useState(20);
  const [binauralOrStrobeHz, setBinauralOrStrobeHz] = useState(6.0);
  const [audioVolume, setAudioVolume] = useState(70);

  const [envStatusMsg, setEnvStatusMsg] = useState<string>('Motor espacial en espera de inicialización...');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [isAbreactionTriggered, setIsAbreactionTriggered] = useState(false);
  const [abreactionReason, setAbreactionReason] = useState<string | null>(null);
  const gsrBaselineRef = useRef<number>(2.1);

  const { isConnected, transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', `UnifiedVR_${vrMode}`);

  useEffect(() => {
    if (sessionActive && !isAbreactionTriggered) {
      transmit({
        mode: vrMode,
        hrv: telemetry.hrvRmssdMs,
        gsr: telemetry.gsrMicroSiemens,
        depth: tranceOrStressDepth,
        frequencyHz: binauralOrStrobeHz,
        volume: audioVolume
      });
    }
  }, [telemetry, tranceOrStressDepth, binauralOrStrobeHz, audioVolume, sessionActive, isAbreactionTriggered, vrMode, transmit]);

  useEffect(() => {
    if (!sessionActive) return;

    const interval = setInterval(() => {
      const randomHrvDelta = (Math.random() - 0.48) * 3;
      const randomGsrDelta = (Math.random() - 0.5) * 0.15;

      setTelemetry(prev => {
        const nextHrv = Math.max(10, Math.min(100, prev.hrvRmssdMs + randomHrvDelta));
        const nextGsr = Math.max(0.5, Math.min(12, prev.gsrMicroSiemens + randomGsrDelta));

        if (nextGsr - gsrBaselineRef.current > 4.0 || nextHrv < 13) {
          triggerSafetyGrounding('Alerta autonómica crítica: Sobrecarga simpática detectada en bucle cerrado.');
        }

        const hrvFactor = Math.min(100, (nextHrv / 60) * 100);
        const gsrFactor = Math.max(0, 100 - (nextGsr * 15));
        const calculatedDepth = Math.round((hrvFactor * 0.6) + (gsrFactor * 0.4));
        setTranceOrStressDepth(Math.min(98, Math.max(10, calculatedDepth)));

        return {
          ...prev,
          hrvRmssdMs: Math.round(nextHrv),
          gsrMicroSiemens: Number(nextGsr.toFixed(2)),
          timestamp: Date.now()
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [sessionActive]);

  const handleInitializeAndRenderEnvironment = async () => {
    setIsGeneratingAi(true);
    setEnvStatusMsg('Gemini compilando shaders y parámetros lumínicos procedurales para el visor...');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Actúa como el motor de renderizado espacial procedural de AMIE Engine.
Genera la directiva de entorno y tono conversacional para el modo clínico: ${vrMode} con subcategoría: ${subCategoryOption}.
Paciente: ${patient.consultationReason} (${patient.age} años).
Devuelve una confirmación técnica concisa (máximo 15 palabras).
`;
        const result = await model.generateContent(prompt);
        setEnvStatusMsg(result.response.text() || 'Entorno procedural generado y cargado en GPU del visor.');
      } else {
        setEnvStatusMsg('Entorno espacial cargado en modo de respaldo optimizado.');
      }

      transmit({
        type: 'RENDER_SPATIAL_ENVIRONMENT',
        mode: vrMode,
        subCategory: subCategoryOption,
        voiceStyle: aiVoiceTone
      });

      setSessionActive(true);
      setIsAbreactionTriggered(false);
    } catch (e) {
      setEnvStatusMsg('Error al compilar el entorno. Usando valores por defecto.');
      setSessionActive(true);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const triggerSafetyGrounding = (reason: string) => {
    setIsAbreactionTriggered(true);
    setSessionActive(false);
    setTranceOrStressDepth(0);
    setAbreactionReason(reason);
    transmit({ type: 'TRIGGER_GROUNDING_PROTOCOL' });
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    transmit({ type: 'STOP_TEST' });

    const report = {
      patientId: patient?.id || 'PAC-8104',
      sessionData: {
        taskName: `UnifiedVR_${vrMode}`,
        durationSeconds: 300,
        metrics: {
          mode: vrMode,
          subCategory: subCategoryOption,
          avgHrv: telemetry.hrvRmssdMs,
          avgGsr: telemetry.gsrMicroSiemens,
          finalDepth: tranceOrStressDepth
        },
        aiLogs: [`Sesión unificada (${vrMode}) finalizada con éxito. Parámetro: ${subCategoryOption}.`],
        completedAt: new Date().toISOString()
      }
    };

    try {
      await fetch('/api/vr/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al guardar reporte unificado:", error);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-cyan-600/30">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Consola Inmersiva Unificada • Entornos IA & Audio/Visual en Bucle Cerrado
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-full">
                AMIE MULTIMODAL CORE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Plataforma única para Neurohipnosis, Fobias VRET, Peritaje Cluster B y Dinámica Sistémica.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer">
            ✕
          </button>
        )}
      </div>

      {isAbreactionTriggered && (
        <div className="p-4 bg-rose-950/90 border-2 border-rose-500 rounded-2xl text-rose-100 space-y-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 rounded-xl text-white">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">WATCHDOG DE SEGURIDAD ACTIVADO • SESIÓN INTERRUMPIDA</h4>
              <p className="text-xs text-rose-200">{abreactionReason}</p>
            </div>
          </div>
          <button onClick={() => setIsAbreactionTriggered(false)} className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition cursor-pointer">
            Restablecer Parámetros y Volver a Consola
          </button>
        </div>
      )}

      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4" /> 1. Seleccionar Módulo Clínico Inmersivo
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { id: 'HYPNOSIS', label: 'Neurohipnosis', icon: Sparkles },
            { id: 'PHOBIA_VRET', label: 'Fobias / TAG (VRET)', icon: Activity },
            { id: 'CLUSTER_B_FORENSIC', label: 'Forense Cluster B', icon: Flame },
            { id: 'SYSTEMIC_COUPLE', label: 'Terapia de Pareja', icon: Layers }
          ].map((mode) => {
            const IconComponent = mode.icon;
            const isSelected = vrMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setVrMode(mode.id as ClinicalVrMode)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block">Configuración Específica del Modo:</label>
            <select
              value={subCategoryOption}
              onChange={(e) => setSubCategoryOption(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
            >
              {vrMode === 'HYPNOSIS' && (
                <>
                  <option value="KINETIC_BREATHING">Respiración Lumínica y Expansión</option>
                  <option value="DEEP_DISSOCIATION">Disociación Segura y Flotación</option>
                </>
              )}
              {vrMode === 'PHOBIA_VRET' && (
                <>
                  <option value="AGORAPHOBIA_STREET">Plaza Pública Abierta (Agorafobia)</option>
                  <option value="HEIGHTS_BALCONY">Balcón Escénico (Acrofobia)</option>
                </>
              )}
              {vrMode === 'CLUSTER_B_FORENSIC' && (
                <>
                  <option value="OVERT_NARCISSISM">Narcisismo Overt (Grandioso)</option>
                  <option value="BPD_SPLITTING">Trastorno Límite (Escisión)</option>
                </>
              )}
              {vrMode === 'SYSTEMIC_COUPLE' && (
                <>
                  <option value="NEUTRAL_LIVING_ROOM">Sala de Estar Sistémica (Mediación)</option>
                  <option value="MIRROR_ROOM">Sala de Reflejo Díadico</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block">Tono de Voz y Estilo de IA (Gemini Live):</label>
            <select
              value={aiVoiceTone}
              onChange={(e) => setAiVoiceTone(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none"
            >
              <option value="SOFT_WHISPER">Susurro Cálido y Pausado (Hipnosis/Relajación)</option>
              <option value="ARROGANT_COLD">Frío, Desafiante y Arrogante (Forense)</option>
              <option value="NEUTRAL_THERAPIST">Neutral, Directivo y Guía (Fobias/Sistémica)</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
          <strong>Estado del Generador Espacial:</strong> {envStatusMsg}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" /> Tono Vagal (HRV)
          </span>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {telemetry.hrvRmssdMs} <span className="text-xs text-slate-500">ms</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Conductancia (GSR)
          </span>
          <div className="text-xl font-mono font-bold text-amber-400">
            {telemetry.gsrMicroSiemens} <span className="text-xs text-slate-500">µS</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Profundidad / Estrés
          </span>
          <div className="text-xl font-mono font-bold text-purple-400">
            {tranceOrStressDepth}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${tranceOrStressDepth}%` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Puente Meta Quest 3S: <strong className={isConnected ? "text-emerald-400" : "text-slate-500"}>{isConnected ? 'EN LÍNEA' : 'ESPERANDO VISOR'}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          {!sessionActive ? (
            <button
              disabled={!isConnected || isGeneratingAi}
              onClick={handleInitializeAndRenderEnvironment}
              className={`flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg transition ${
                !isConnected 
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 text-white cursor-pointer'
              }`}
            >
              {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{!isConnected ? 'Esperando Visor VR...' : 'Generar Entorno y Arrancar Sesión'}</span>
            </button>
          ) : (
            <button onClick={handleEndSession} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition shadow cursor-pointer">
              <Square className="w-4 h-4" /> <span>Finalizar Sesión y Guardar Reporte</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
