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
  Layers
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
  
  // Parámetros Multimodales (Audio Binaural + Visual Entrainment)
  const [binauralFreqHz, setBinauralFreqHz] = useState(6.0); // Theta (4-7 Hz)
  const [visualStrobeHz, setVisualStrobeHz] = useState(6.0);
  const [audioVolume, setAudioVolume] = useState(70); // % volumen espacial en visor

  // Metáforas Cinemáticas Proyectadas
  const [projectedText, setProjectedText] = useState<string>('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [metaphorTopic, setMetaphorTopic] = useState<'KINETIC_BREATHING' | 'DEEP_DISSOCIATION' | 'ROOT_GROUNDING'>('KINETIC_BREATHING');

  // Watchdog Anti-Abreacción
  const [isAbreactionTriggered, setIsAbreactionTriggered] = useState(false);
  const [abreactionMessage, setAbreactionMessage] = useState<string | null>(null);

  const gsrBaselineRef = useRef<number>(2.1);

  // -------------------------------------------------------------------------
  // CONEXIÓN PUENTE VR (EMISOR EN METAVERSE)
  // -------------------------------------------------------------------------
  const { isConnected, transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', 'NeurohypnosisMultimodal');

  // Transmisión en vivo de bucle cerrado al visor (Audio + Video)
  useEffect(() => {
    if (isActiveSession && !isAbreactionTriggered) {
      transmit({
        hrv: telemetry.hrvRmssdMs,
        gsr: telemetry.gsrMicroSiemens,
        stressLevel: tranceDepthPct, 
        binauralHz: binauralFreqHz,
        visualHz: visualStrobeHz,
        volume: audioVolume,
        emdr: emdrActive
      });
    }
  }, [telemetry.hrvRmssdMs, telemetry.gsrMicroSiemens, tranceDepthPct, binauralFreqHz, visualStrobeHz, audioVolume, emdrActive, isActiveSession, isAbreactionTriggered, transmit]);

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

        // Watchdog de Seguridad Anti-Abreacción
        if (sessionPhase !== 'AWAKENING' && (nextGsr - gsrBaselineRef.current > 3.8 || nextHrv < 14)) {
          triggerSafetyGrounding('DISPARO DE RESPUESTA SIMPÁTICA CRÍTICA: Alerta por alteración en conductancia cutánea.');
        }

        // Cálculo de Profundidad del Trance
        const hrvFactor = Math.min(100, (nextHrv / 60) * 100);
        const gsrFactor = Math.max(0, 100 - (nextGsr * 15));
        const depth = Math.round((hrvFactor * 0.6) + (gsrFactor * 0.4));
        setTranceDepthPct(Math.min(98, Math.max(10, depth)));

        // Ajuste automático de frecuencias de audio y visuales
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
    transmit({ type: 'LOAD_MODULE', patientId: patient?.id, moduleName: 'MULTIMODAL_HYPNOSIS' });
    transmit({ type: 'START_MULTIMODAL_SESSION', binauralHz: binauralFreqHz, visualHz: visualStrobeHz });
  };

  const handleStartAwakening = () => {
    setSessionPhase('AWAKENING');
    setEmdrActive(false);
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

  const handleGenerateTextMetaphor = async () => {
    setIsGeneratingText(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Genera una secuencia corta de 3 frases cinemáticas de inducción hipnótica (para proyectar en texto flotante en VR) orientadas a: ${metaphorTopic}.
Paciente: ${patient.consultationReason} (${patient.age} años).
Usa lenguaje permisivo, indirecto y evocador. Separa las frases con barras (|). Máximo 25 palabras en total.
`;
        const result = await model.generateContent(prompt);
        setProjectedText(result.response.text() || 'Sigue la expansión de la luz | Nota cómo el cuerpo descansa | Paz profunda.');
      } else {
        setProjectedText('Observa el ritmo de las partículas lumínicas | Cada exhalación profundiza la calma | Siente el apoyo del entorno.');
      }
    } catch (e) {
      setProjectedText('Permítete seguir el compás visual | El cuerpo encuentra su propio balance | Descanso.');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleEndSession = async () => {
    setIsActiveSession(false);
    setSessionPhase('IDLE');
    transmit({ type: 'STOP_TEST' });

    const sessionReport = {
      patientId: patient?.id || 'PAC-8104',
      sessionData: {
        taskName: 'NeurohypnosisMultimodal_ClosedLoop',
        durationSeconds: 300,
        metrics: {
          avgHrv: telemetry.hrvRmssdMs,
          avgGsr: telemetry.gsrMicroSiemens,
          frontalEngagementPct: tranceDepthPct,
          binauralFreqHz: binauralFreqHz
        },
        aiLogs: [
          `Sesión de Neurohipnosis Multimodal (Audio + Visual) concluida. Profundidad: ${tranceDepthPct}%. Frecuencia Binaural/Estroboscópica: ${binauralFreqHz} Hz.`,
          projectedText ? `Metáfora textual proyectada: "${projectedText}"` : 'Sin metáfora proyectada.'
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
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Consola de Neurohipnosis Multimodal • Audio Binaural & Estroboscopía VR
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                CLOSED-LOOP MULTIMODAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sincronización simultánea de audio binaural dinámico, pulsos visuales ópticos y texto cinematográfico en visor.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition">
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
            <span className="font-bold text-rose-400">PROTOCOLO DE GROUNDING MULTIMODAL INYECTADO:</span>
            <p className="text-slate-300">1. Audio binaural conmutado a tono de vigilia (14 Hz) con volumen seguro.</p>
            <p className="text-slate-300">2. Estroboscopio visual desactivado en el visor.</p>
            <p className="text-slate-300">3. Estabilización de iluminación ambiental al 100%.</p>
          </div>
          <button onClick={handleResetSession} className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow">
            Restablecer Estado y Reiniciar Consola
          </button>
        </div>
      )}

      {/* Indicadores Biométricos y Frecuencias */}
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
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Arrastre Binaural / Óptico
          </span>
          <div className="text-xl font-mono font-bold text-cyan-400">
            {binauralFreqHz} <span className="text-xs text-slate-500">Hz {sessionPhase === 'AWAKENING' ? '(Beta)' : '(Theta)'}</span>
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

      {/* Controles de Volumen y Susceptibilidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-cyan-400" /> Volumen de Paisaje Sonoro VR
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
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-400" /> Índice de Susceptibilidad Multimodal
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Cuantifica la respuesta al estímulo combinado (Audio + Visual).</p>
          </div>
          <div className="flex items-center gap-3">
            {susceptibilityScore !== null && (
              <div className="px-3 py-1 bg-purple-950 border border-purple-500/40 rounded-lg text-xs font-mono">
                Puntaje: <strong className="text-purple-300">{susceptibilityScore}/100</strong>
              </div>
            )}
            <button onClick={handleEvaluateSusceptibility} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer">
              Evaluar Susceptibilidad
            </button>
          </div>
        </div>
      </div>

      {/* Proyección de Metáforas en Texto Cinematográfico VR */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Secuencia Cinematográfica Textual en Visor
          </span>

          <div className="flex items-center gap-2">
            <select
              value={metaphorTopic}
              onChange={(e) => setMetaphorTopic(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="KINETIC_BREATHING">Respiración Lumínica Sincronizada</option>
              <option value="DEEP_DISSOCIATION">Disociación Espacial y Flotación</option>
              <option value="ROOT_GROUNDING">Anclaje Sensorial y Estabilidad</option>
            </select>

            <button
              onClick={handleGenerateTextMetaphor}
              disabled={isGeneratingText}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              {isGeneratingText ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generar Texto VR</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-300 min-h-[90px] font-mono flex items-center justify-center text-center">
          {projectedText ? (
            <span className="text-cyan-200 tracking-wide">✨ [{projectedText}]</span>
          ) : (
            <span className="text-slate-500 italic">Haga clic en "Generar Texto VR" para desplegar la secuencia que el paciente leerá suavemente en su espacio virtual...</span>
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
              Para iniciar la sesión multimodal, el paciente debe colocarse el visor <strong className="text-purple-300">Meta Quest 3S</strong> e iniciar la sesión vinculando su expediente: <span className="text-purple-300 font-mono bg-purple-900/30 px-1 rounded">{patient?.id || 'PAC-8104'}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Puente VR Multimodal: <strong className={isConnected ? "text-emerald-400" : "text-slate-500"}>{isConnected ? 'EN LÍNEA' : 'DESCONECTADO'}</strong></span>
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
                {!isConnected ? 'Esperando Visor VR...' : <><Play className="w-4 h-4" /> <span>Iniciar Sesión Multimodal</span></>}
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
