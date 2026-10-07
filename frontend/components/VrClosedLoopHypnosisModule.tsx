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
  Sunrise,
  ShieldCheck,
  Glasses,
  Volume2,
  Mic,
  Radio
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

export const VrClosedLoopHypnosisModule: React.FC<Props> = ({ patient, onClose }) => {
  // Telemetría Fisiológica
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

  // Estado del Motor Closed-Loop y Fases de Sesión
  const [sessionPhase, setSessionPhase] = useState<'IDLE' | 'INDUCTION' | 'AWAKENING'>('IDLE');
  const [isActiveSession, setIsActiveSession] = useState(false);
  const [emdrActive, setEmdrActive] = useState(false);
  const [tranceDepthPct, setTranceDepthPct] = useState(15);
  const [susceptibilityScore, setSusceptibilityScore] = useState<number | null>(null);
  
  // Parámetros Multimodales
  const [binauralFreqHz, setBinauralFreqHz] = useState(6.0); // Theta (4-7 Hz)
  const [visualStrobeHz, setVisualStrobeHz] = useState(6.0);
  const [audioVolume, setAudioVolume] = useState(70);

  // NUEVO: Selector de Modo de Asistencia (Audio IA en Vivo vs Solo Texto)
  const [useAiRealtimeAudio, setUseAiRealtimeAudio] = useState(true);
  const [audioVoiceStyle, setAudioVoiceStyle] = useState<'SOFT_WHISPER' | 'DEEP_CALM' | 'BALANCED_THERAPIST'>('SOFT_WHISPER');

  // Metáforas y Audio Generado por Gemini
  const [projectedText, setProjectedText] = useState<string>('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [metaphorTopic, setMetaphorTopic] = useState<'KINETIC_BREATHING' | 'DEEP_DISSOCIATION' | 'ROOT_GROUNDING'>('KINETIC_BREATHING');
  const [audioStreamStatus, setAudioStreamStatus] = useState<'STANDBY' | 'SYNTHESIZING' | 'STREAMING_ACTIVE'>('STANDBY');

  // Watchdog Anti-Abreacción
  const [isAbreactionTriggered, setIsAbreactionTriggered] = useState(false);
  const [abreactionMessage, setAbreactionMessage] = useState<string | null>(null);

  const gsrBaselineRef = useRef<number>(2.1);

  // -------------------------------------------------------------------------
  // CONEXIÓN PUENTE VR
  // -------------------------------------------------------------------------
  const { isConnected, transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', 'NeurohypnosisMultimodalAudio');

  // Transmisión de bucle cerrado al visor
  useEffect(() => {
    if (isActiveSession && !isAbreactionTriggered) {
      transmit({
        hrv: telemetry.hrvRmssdMs,
        gsr: telemetry.gsrMicroSiemens,
        stressLevel: tranceDepthPct, 
        binauralHz: binauralFreqHz,
        visualHz: visualStrobeHz,
        volume: audioVolume,
        aiAudioActive: useAiRealtimeAudio,
        emdr: emdrActive
      });
    }
  }, [telemetry.hrvRmssdMs, telemetry.gsrMicroSiemens, tranceDepthPct, binauralFreqHz, visualStrobeHz, audioVolume, useAiRealtimeAudio, emdrActive, isActiveSession, isAbreactionTriggered, transmit]);

  // Simulación biométrica en bucle cerrado
  useEffect(() => {
    if (!isActiveSession) return;

    const interval = setInterval(() => {
      const awakeningModifier = sessionPhase === 'AWAKENING' ? 1.5 : 0;
      const randomHrvDelta = (Math.random() - 0.48) * 4 - awakeningModifier; 
      const randomGsrDelta = (Math.random() - 0.5) * 0.2 + (awakeningModifier * 0.1);

      setTelemetry(prev => {
        const nextHrv = Math.max(10, Math.min(100, prev.hrvRmssdMs + randomHrvDelta));
        const nextGsr = Math.max(0.5, Math.min(12, prev.gsrMicroSiemens + randomGsrDelta));

        if (sessionPhase !== 'AWAKENING' && (nextGsr - gsrBaselineRef.current > 3.8 || nextHrv < 14)) {
          triggerSafetyGrounding('DISPARO DE RESPUESTA SIMPÁTICA CRÍTICA: Alerta por alteración en conductancia cutánea.');
        }

        const hrvFactor = Math.min(100, (nextHrv / 60) * 100);
        const gsrFactor = Math.max(0, 100 - (nextGsr * 15));
        const depth = Math.round((hrvFactor * 0.6) + (gsrFactor * 0.4));
        setTranceDepthPct(Math.min(98, Math.max(10, depth)));

        if (sessionPhase === 'AWAKENING') {
          setBinauralFreqHz(14.0);
          setVisualStrobeHz(14.0);
        } else if (depth > 70) {
          setBinauralFreqHz(4.5);
          setVisualStrobeHz(4.5);
        } else if (depth > 40) {
          setBinauralFreqHz(6.0);
          setVisualStrobeHz(6.0);
        } else {
          setBinauralFreqHz(8.5);
          setVisualStrobeHz(8.5);
        }

        return {
          ...prev,
          hrvRmssdMs: Math.round(nextHrv),
          gsrMicroSiemens: Number(nextGsr.toFixed(2)),
          timestamp: Date.now()
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isActiveSession, sessionPhase]);

  // -------------------------------------------------------------------------
  // CONTROLADORES DE SESIÓN
  // -------------------------------------------------------------------------
  const handleStartInduction = () => {
    setIsActiveSession(true);
    setSessionPhase('INDUCTION');
    setIsAbreactionTriggered(false);
    transmit({ type: 'LOAD_MODULE', patientId: patient?.id, moduleName: 'MULTIMODAL_AUDIO_HYPNOSIS' });
    transmit({ 
      type: 'START_MULTIMODAL_SESSION', 
      binauralHz: binauralFreqHz, 
      visualHz: visualStrobeHz,
      aiAudioEnabled: useAiRealtimeAudio,
      voiceStyle: audioVoiceStyle 
    });
  };

  const handleStartAwakening = () => {
    setSessionPhase('AWAKENING');
    setEmdrActive(false);
    setAudioStreamStatus('STANDBY');
    transmit({ type: 'START_AWAKENING_SEQUENCE' });
  };

  const toggleEmdr = () => {
    const newState = !emdrActive;
    setEmdrActive(newState);
    transmit({ type: 'TOGGLE_EMDR_MULTIMODAL', active: newState });
  };

  const triggerSafetyGrounding = (reason: string) => {
    setIsAbreactionTriggered(true);
    setSessionPhase('IDLE');
    setIsActiveSession(false);
    setTranceDepthPct(0);
    setEmdrActive(false);
    setBinauralFreqHz(14.0);
    setVisualStrobeHz(14.0);
    setAudioStreamStatus('STANDBY');
    setAbreactionMessage(reason);
    transmit({ type: 'TRIGGER_GROUNDING_PROTOCOL' });
  };

  const handleResetSession = () => {
    setIsAbreactionTriggered(false);
    setAbreactionMessage(null);
    setIsActiveSession(false);
    setSessionPhase('IDLE');
    setTranceDepthPct(15);
  };

  const handleEvaluateSusceptibility = () => {
    gsrBaselineRef.current = telemetry.gsrMicroSiemens || 2.1;
    const vagalScore = telemetry.hrvRmssdMs > 30 ? 45 : 25;
    const gsrScore = telemetry.gsrMicroSiemens < 3.0 ? 45 : 20;
    setSusceptibilityScore(vagalScore + gsrScore + 12);
  };

  // Generación de Guion Textual y Síntesis de Voz en Tiempo Real con Gemini
  const handleGenerateAiInductionContent = async () => {
    setIsGeneratingContent(true);
    setAudioStreamStatus('SYNTHESIZING');
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Actúa como un sintetizador clínico de inducción ericksoniana en tiempo real para AMIE Engine.
Genera un guion terapéutico enfocado en: ${metaphorTopic}.
Paciente: ${patient.consultationReason} (${patient.age} años).
HRV actual: ${telemetry.hrvRmssdMs} ms | GSR: ${telemetry.gsrMicroSiemens} µS.
Estilo de voz requerido: ${audioVoiceStyle}.
Usa lenguaje indirecto, pausas marcadas [PAUSA_3S], y doble vínculo. Máximo 40 palabras.
`;
        const result = await model.generateContent(prompt);
        const textOutput = result.response.text() || 'Nota cómo la respiración marca el ritmo de la calma...';
        setProjectedText(textOutput);

        // Si el usuario seleccionó usar audio IA en tiempo real, transmitimos el comando de streaming de voz al visor
        if (useAiRealtimeAudio) {
          setAudioStreamStatus('STREAMING_ACTIVE');
          transmit({
            type: 'STREAM_AI_VOICE',
            script: textOutput,
            voiceStyle: audioVoiceStyle,
            volume: audioVolume
          });
        } else {
          setAudioStreamStatus('STANDBY');
        }
      } else {
        setProjectedText('Observa el compás de las partículas de luz | Cada exhalación profundiza el descanso.');
        setAudioStreamStatus('STANDBY');
      }
    } catch (e) {
      setProjectedText('Permítete seguir el ritmo visual | El cuerpo encuentra su propio balance.');
      setAudioStreamStatus('STANDBY');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleEndSession = async () => {
    setIsActiveSession(false);
    setSessionPhase('IDLE');
    setAudioStreamStatus('STANDBY');
    transmit({ type: 'STOP_TEST' });

    const sessionReport = {
      patientId: patient?.id || 'PAC-8104',
      sessionData: {
        taskName: 'NeurohypnosisMultimodal_AiAudioStream',
        durationSeconds: 300,
        metrics: {
          avgHrv: telemetry.hrvRmssdMs,
          avgGsr: telemetry.gsrMicroSiemens,
          frontalEngagementPct: tranceDepthPct,
          aiAudioUsed: useAiRealtimeAudio
        },
        aiLogs: [
          `Sesión de Neurohipnosis con Audio IA en tiempo real concluida. Profundidad: ${tranceDepthPct}%. Estilo de voz: ${audioVoiceStyle}.`,
          projectedText ? `Guion sintetizado: "${projectedText}"` : 'Sin guion generado.'
        ],
        completedAt: new Date().toISOString()
      }
    };

    try {
      await fetch('/api/vr/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionReport)
      });
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al guardar reporte VR:", error);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl text-white shadow-lg shadow-purple-600/30">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Consola de Neurohipnosis • Audio IA en Tiempo Real & Estroboscopía VR
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                GEMINI LIVE AUDIO STREAM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Generación y transmisión en streaming de voz terapéutica y pulsos visuales sincronizados al visor del paciente.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer">
            ✕
          </button>
        )}
      </div>

      {/* Alerta Watchdog */}
      {isAbreactionTriggered && (
        <div className="p-4 bg-rose-950/90 border-2 border-rose-500 rounded-2xl text-rose-100 space-y-3 shadow-2xl animate-shake">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 rounded-xl text-white">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">WATCHDOG DE SEGURIDAD ACTIVADO • TRANCE DETENIDO</h4>
              <p className="text-xs text-rose-200">{abreactionMessage}</p>
            </div>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-500/30 text-xs space-y-1 font-mono">
            <span className="font-bold text-rose-400">PROTOCOLO DE GROUNDING INYECTADO:</span>
            <p className="text-slate-300">1. Transmisión de voz IA interrumpida instantáneamente.</p>
            <p className="text-slate-300">2. Audio conmutado a tono de seguridad (14 Hz).</p>
            <p className="text-slate-300">3. Estroboscopio óptico neutralizado.</p>
          </div>
          <button onClick={handleResetSession} className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer">
            Restablecer Estado y Reiniciar Consola
          </button>
        </div>
      )}

      {/* Indicadores Biométricos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            <Radio className="w-3.5 h-3.5 text-cyan-400" /> Estado de Audio IA
          </span>
          <div className="text-xs font-mono font-bold text-cyan-400 pt-1">
            {audioStreamStatus === 'STREAMING_ACTIVE' ? '🟢 Transmitiendo Voz' : audioStreamStatus === 'SYNTHESIZING' ? '🟡 Sintetizando...' : '⚪ En Espera'}
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Profundidad Trance
          </span>
          <div className="text-xl font-mono font-bold text-purple-400">
            {tranceDepthPct}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${tranceDepthPct}%` }} />
          </div>
        </div>
      </div>

      {/* Controles de Configuración de Voz IA y Volumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-cyan-400" /> Volumen Espacial en Visor
            </span>
            <span className="text-xs font-mono font-bold text-cyan-300">{audioVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={audioVolume}
            onChange={(e) => setAudioVolume(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-purple-400" /> Habilitar Síntesis de Voz IA en Vivo
            </span>
            <input
              type="checkbox"
              checked={useAiRealtimeAudio}
              onChange={(e) => setUseAiRealtimeAudio(e.target.checked)}
              className="w-4 h-4 accent-purple-600 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={audioVoiceStyle}
              onChange={(e) => setAudioVoiceStyle(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="SOFT_WHISPER">Susurro Suave y Cálido (Relajación)</option>
              <option value="DEEP_CALM">Voz Profunda y Lenta (Trance Profundo)</option>
              <option value="BALANCED_THERAPIST">Terapeuta Neutral y Permisivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generador y Proyección de Inducción con IA */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Motor de Guion e Inducción Terapéutica (Gemini AI)
          </span>

          <div className="flex items-center gap-2">
            <select
              value={metaphorTopic}
              onChange={(e) => setMetaphorTopic(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="KINETIC_BREATHING">Respiración Lumínica y Expansión</option>
              <option value="DEEP_DISSOCIATION">Disociación Segura y Flotación</option>
              <option value="ROOT_GROUNDING">Anclaje de Estabilidad y Raíz</option>
            </select>

            <button
              onClick={handleGenerateAiInductionContent}
              disabled={isGeneratingContent}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              {isGeneratingContent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Sintetizar & Transmitir Voz IA</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-300 min-h-[90px] font-mono flex items-center justify-center text-center">
          {projectedText ? (
            <span className="text-cyan-200 tracking-wide">🎙️ [{projectedText}]</span>
          ) : (
            <span className="text-slate-500 italic">Haga clic en "Sintetizar & Transmitir Voz IA" para generar el contenido dinámico adaptado a los biomarcadores del paciente...</span>
          )}
        </div>
      </div>

      {/* Controles Maestros de Sesión */}
      <div>
        {!isConnected && sessionPhase === 'IDLE' && (
          <div className="mb-4 p-3 bg-slate-900/80 border border-purple-500/30 border-dashed rounded-xl flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg shrink-0">
              <Glasses className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white block mb-0.5">Esperando conexión del paciente...</strong>
              Para iniciar la transmisión de audio IA en vivo, el paciente debe colocarse el visor <strong className="text-purple-300">Meta Quest 3S</strong> vinculado al expediente: <span className="text-purple-300 font-mono bg-purple-900/30 px-1 rounded">{patient?.id || 'PAC-8104'}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Puente VR Gemini Live: <strong className={isConnected ? "text-emerald-400" : "text-slate-500"}>{isConnected ? 'EN LÍNEA' : 'DESCONECTADO'}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            {sessionPhase === 'IDLE' && (
              <button 
                disabled={!isConnected}
                onClick={handleStartInduction} 
                className={`flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg transition ${
                  !isConnected 
                    ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 cursor-pointer'
                }`}
              >
                {!isConnected ? 'Esperando Visor VR...' : <><Play className="w-4 h-4" /> <span>Iniciar Sesión con Voz IA</span></>}
              </button>
            )}

            {sessionPhase === 'INDUCTION' && (
              <button onClick={handleStartAwakening} className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer">
                <Sunrise className="w-4 h-4" /> <span>Iniciar Des-inducción (Amanecer)</span>
              </button>
            )}

            {(sessionPhase === 'AWAKENING' || sessionPhase === 'INDUCTION') && (
              <button onClick={handleEndSession} className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-black text-xs rounded-xl transition cursor-pointer">
                <Square className="w-4 h-4" /> <span>Finalizar y Guardar Reporte</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
