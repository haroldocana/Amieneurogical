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
  Layers,
  Video,
  Film
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

type ClinicalVrMode = 'HYPNOSIS' | 'PHOBIA_VRET' | 'CLUSTER_B_FORENSIC' | 'SYSTEMIC_COUPLE';
type InteractionType = 'DYNAMIC_AI' | 'PRE_RECORDED_VIDEO';

// 12 Escenarios Maestros Espaciales de AMIE
const AMIE_12_ENVIRONMENTS = [
  { id: 'FORENSIC_COURTROOM', name: '01. Sala de Audiencias / Tribunal Pericial' },
  { id: 'CORPORATE_OFFICE', name: '02. Oficina Ejecutiva de Confrontación' },
  { id: 'MINIMALIST_ROOM', name: '03. Sala Neutra de Contrainterrogatorio' },
  { id: 'AGORAPHOBIA_STREET', name: '04. Plaza Pública Abierta (Agorafobia)' },
  { id: 'HEIGHTS_BALCONY', name: '05. Balcón Escénico en Altura (Acrofobia)' },
  { id: 'ALPINE_SANCTUARY', name: '06. Santuario Alpino Minimalista (Grounding)' },
  { id: 'NEUTRAL_LIVING_ROOM', name: '07. Sala de Estar Sistémica (Mediación)' },
  { id: 'MIRROR_ROOM', name: '08. Sala de Espejo Díadico / Vínculo' },
  { id: 'KINETIC_VOID', name: '09. Vacío Cinético de Respiración Lumínica' },
  { id: 'DEEP_OCEAN_FLOOR', name: '10. Fondo Marino Disociativo y Seguro' },
  { id: 'COGNITIVE_LAB', name: '11. Laboratorio de Pruebas Ejecutivas TDAH' },
  { id: 'SAFE_HAVEN_GARDEN', name: '12. Jardín Zen de Regulación Emocional' }
];

export const AmieUnifiedVrConsole: React.FC<Props> = ({ patient, onClose }) => {
  const [vrMode, setVrMode] = useState<ClinicalVrMode>('CLUSTER_B_FORENSIC');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('FORENSIC_COURTROOM');
  const [interactionType, setInteractionType] = useState<InteractionType>('PRE_RECORDED_VIDEO');
  
  // Selección específica para los videos con audio integrado de Narcisismo
  const [selectedNarcissismVideo, setSelectedNarcissismVideo] = useState<'VIDEO_1_OVERT' | 'VIDEO_2_COVERT'>('VIDEO_1_OVERT');
  const [subCategoryOption, setSubCategoryOption] = useState<string>('OVERT_NARCISSISM');
  const [aiVoiceTone, setAiVoiceTone] = useState<'ARROGANT_COLD' | 'DEFENSIVE_HOSTILE' | 'SOFT_WHISPER'>('ARROGANT_COLD');

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
  const [tranceOrStressDepth, setTranceOrStressDepth] = useState(25);
  const [binauralOrStrobeHz, setBinauralOrStrobeHz] = useState(6.0);
  const [audioVolume, setAudioVolume] = useState(80);

  const [envStatusMsg, setEnvStatusMsg] = useState<string>('Motor espacial y multimedia en espera...');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [isAbreactionTriggered, setIsAbreactionTriggered] = useState(false);
  const [abreactionReason, setAbreactionReason] = useState<string | null>(null);
  const gsrBaselineRef = useRef<number>(2.1);

  const { isConnected, transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', `UnifiedVR_${vrMode}`);

  useEffect(() => {
    if (sessionActive && !isAbreactionTriggered) {
      transmit({
        mode: vrMode,
        environment: selectedEnvironment,
        interaction: interactionType,
        hrv: telemetry.hrvRmssdMs,
        gsr: telemetry.gsrMicroSiemens,
        depth: tranceOrStressDepth,
        frequencyHz: binauralOrStrobeHz,
        volume: audioVolume
      });
    }
  }, [telemetry, tranceOrStressDepth, binauralOrStrobeHz, audioVolume, sessionActive, isAbreactionTriggered, vrMode, selectedEnvironment, interactionType, transmit]);

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
    setEnvStatusMsg('Cargando escenario espacial y configurando flujo multimedia para el visor...');

    try {
      if (interactionType === 'DYNAMIC_AI') {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (apiKey) {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

          const prompt = `
Actúa como el motor de renderizado espacial procedural de AMIE Engine.
Configura el escenario: ${selectedEnvironment} bajo el modo clínico: ${vrMode}.
Devuelve una confirmación técnica concisa (máximo 15 palabras).
`;
          const result = await model.generateContent(prompt);
          setEnvStatusMsg(result.response.text() || 'Entorno procedural y Gemini Live TTS listos.');
        } else {
          setEnvStatusMsg('Entorno espacial cargado en modo local optimizado.');
        }
      } else {
        setEnvStatusMsg(`Video clínico con audio integrado (${selectedNarcissismVideo}) vinculado al escenario ${selectedEnvironment}.`);
      }

      transmit({
        type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
        environment: selectedEnvironment,
        mode: vrMode,
        interactionType,
        mediaSource: interactionType === 'PRE_RECORDED_VIDEO' ? selectedNarcissismVideo : 'GEMINI_AI_STREAM',
        voiceStyle: aiVoiceTone
      });

      setSessionActive(true);
      setIsAbreactionTriggered(false);
    } catch (e) {
      setEnvStatusMsg('Error al compilar el entorno. Usando respaldo por defecto.');
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
        taskName: `UnifiedVR_${vrMode}_${interactionType}`,
        durationSeconds: 360,
        metrics: {
          mode: vrMode,
          environment: selectedEnvironment,
          interaction: interactionType,
          mediaUsed: interactionType === 'PRE_RECORDED_VIDEO' ? selectedNarcissismVideo : 'AI_STREAM',
          avgHrv: telemetry.hrvRmssdMs,
          avgGsr: telemetry.gsrMicroSiemens,
          finalDepth: tranceOrStressDepth
        },
        aiLogs: [`Sesión inmersiva finalizada (${vrMode} en ${selectedEnvironment}). Interacción: ${interactionType}.`],
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
                Consola Inmersiva Unificada • 12 Escenarios, IA & Videos Clínicos
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-full">
                AMIE MULTIMODAL CORE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Plataforma para Neurohipnosis, Fobias VRET, Forense Cluster B (con videos de audio integrado) y Sistémica.
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

      {/* Selectores Principales */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4" /> 1. Configuración de Escenario (12 Mundos) y Tipo de Interacción
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Módulo Clínico VR:</label>
            <select
              value={vrMode}
              onChange={(e) => setVrMode(e.target.value as ClinicalVrMode)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
            >
              <option value="CLUSTER_B_FORENSIC">Forense Cluster B (Narcisismo / TLP)</option>
              <option value="HYPNOSIS">Neurohipnosis y Relajación</option>
              <option value="PHOBIA_VRET">Fobias y Ansiedad (VRET)</option>
              <option value="SYSTEMIC_COUPLE">Terapia de Pareja y Sistémica</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Seleccionar de los 12 Escenarios 3D:</label>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none font-mono text-xs"
            >
              {AMIE_12_ENVIRONMENTS.map((env) => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Tipo de Interacción con el Paciente / Avatar:</label>
            <select
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value as InteractionType)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-bold focus:outline-none"
            >
              <option value="PRE_RECORDED_VIDEO">🎞️ Videos Clínicos (Con Audio Integrado)</option>
              <option value="DYNAMIC_AI">⚡ IA Dinámica en Vivo (Gemini Live TTS)</option>
            </select>
          </div>
        </div>

        {/* Sub-configuración según la interacción elegida */}
        {interactionType === 'PRE_RECORDED_VIDEO' ? (
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
              <Film className="w-4 h-4" /> Videos de Narcisismo con Audio Original Incluido:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedNarcissismVideo('VIDEO_1_OVERT')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedNarcissismVideo === 'VIDEO_1_OVERT'
                    ? 'bg-rose-950/80 border-rose-500 text-white shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-rose-300">Video 1: Perfil Overt (Grandioso)</div>
                  <div className="text-[10px] text-slate-400">Audio original con diálogo de desvalorización y prepotencia.</div>
                </div>
                <Play className="w-4 h-4 text-rose-400" />
              </button>

              <button
                onClick={() => setSelectedNarcissismVideo('VIDEO_2_COVERT')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  selectedNarcissismVideo === 'VIDEO_2_COVERT'
                    ? 'bg-purple-950/80 border-purple-500 text-white shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-purple-300">Video 2: Perfil Covert (Vulnerable)</div>
                  <div className="text-[10px] text-slate-400">Audio original con patrón de victimización y rencor oculto.</div>
                </div>
                <Play className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Configuración de Gemini Live para Avatar Dinámico:
            </span>
            <select
              value={aiVoiceTone}
              onChange={(e) => setAiVoiceTone(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none"
            >
              <option value="ARROGANT_COLD">Frío, Desafiante y Arrogante (Forense)</option>
              <option value="DEFENSIVE_HOSTILE">Defensivo, Reactivo y Hostil</option>
              <option value="SOFT_WHISPER">Susurro Cálido y Pausado (Relajación)</option>
            </select>
          </div>
        )}

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
          <strong>Estado del Renderizado:</strong> {envStatusMsg}
        </div>
      </div>

      {/* Telemetría y Controles en Vivo */}
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

      {/* Botonera de Control Maestro */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Visor VR (Meta Quest 3S / Pico): <strong className={isConnected ? "text-emerald-400" : "text-slate-500"}>{isConnected ? 'EN LÍNEA' : 'ESPERANDO VISOR'}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          {!sessionActive ? (
            <button
              disabled={!isConnected || isGeneratingAi}
              onClick={handleInitializeAndRenderEnvironment}
              className={`flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg transition ${
                !isConnected 
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:scale-105 text-white cursor-pointer'
              }`}
            >
              {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{!isConnected ? 'Esperando Visor VR...' : 'Renderizar Escenario y Arrancar Sesión'}</span>
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
