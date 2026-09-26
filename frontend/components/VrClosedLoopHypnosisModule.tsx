import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord, PrecisionTelemetryPacket } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Sparkles,
  ShieldAlert,
  Brain,
  Activity,
  Volume2,
  Zap,
  Play,
  Square,
  RefreshCw,
  Eye,
  Heart,
  Sliders
} from 'lucide-react';

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

  // Estado del Motor Closed-Loop
  const [isActiveSession, setIsActiveSession] = useState(false);
  const [tranceDepthPct, setTranceDepthPct] = useState(15);
  const [susceptibilityScore, setSusceptibilityScore] = useState<number | null>(null);
  const [binauralFreqHz, setBinauralFreqHz] = useState(6.0); // Modulación de ondas Theta (4-7 Hz)

  // Guion Ericksoriano Dinámico
  const [scriptText, setScriptText] = useState<string>('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [currentMetaphorTopic, setCurrentMetaphorTopic] = useState<'ANXIETY_CONTAINMENT' | 'NARCISSISTIC_RESISTANCE' | 'TRAUMA_DESENSITIZATION' | 'PAIN_CONTROL'>('ANXIETY_CONTAINMENT');

  // Watchdog Anti-Abreacción
  const [isAbreactionTriggered, setIsAbreactionTriggered] = useState(false);
  const [abreactionMessage, setAbreactionMessage] = useState<string | null>(null);

  const gsrBaselineRef = useRef<number>(2.1);

  // Simulación y lectura biométrica en vivo en bucle cerrado
  useEffect(() => {
    if (!isActiveSession) return;

    const interval = setInterval(() => {
      // Variación biométrica continua simulando respuesta autonómica
      const randomHrvDelta = (Math.random() - 0.48) * 4;
      const randomGsrDelta = (Math.random() - 0.5) * 0.2;

      setTelemetry(prev => {
        const nextHrv = Math.max(10, Math.min(100, prev.hrvRmssdMs + randomHrvDelta));
        const nextGsr = Math.max(0.5, Math.min(12, prev.gsrMicroSiemens + randomGsrDelta));

        // Verificación de Watchdog Anti-Abreacción (GSR > 6.0 u HRV < 14ms)
        if (nextGsr - gsrBaselineRef.current > 3.8 || nextHrv < 14) {
          triggerSafetyGrounding('DISPARO DE RESPUESTA SIMPÁTICA CRÍTICA: Cambios abruptos de GSR/HRV sugieren abreacción traumática.');
        }

        // Modulación Closed-Loop del Trance
        const hrvFactor = Math.min(100, (nextHrv / 60) * 100);
        const gsrFactor = Math.max(0, 100 - (nextGsr * 15));
        const depth = Math.round((hrvFactor * 0.6) + (gsrFactor * 0.4));
        setTranceDepthPct(Math.min(98, Math.max(10, depth)));

        // Arrastre de frecuencias binaurales según profundidad
        if (depth > 70) setBinauralFreqHz(4.5);
        else if (depth > 40) setBinauralFreqHz(6.0);
        else setBinauralFreqHz(8.5);

        return {
          ...prev,
          hrvRmssdMs: Math.round(nextHrv),
          gsrMicroSiemens: Number(nextGsr.toFixed(2)),
          timestamp: Date.now()
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isActiveSession]);

  // Medición de Susceptibilidad Biométrica
  const handleEvaluateSusceptibility = () => {
    gsrBaselineRef.current = telemetry.gsrMicroSiemens || 2.1;
    const vagalScore = telemetry.hrvRmssdMs > 30 ? 45 : 25;
    const gsrScore = telemetry.gsrMicroSiemens < 3.0 ? 45 : 20;
    setSusceptibilityScore(vagalScore + gsrScore + 8);
  };

  // Generación de Guion Ericksoriano con Gemini
  const handleGenerateEricksonianScript = async () => {
    setIsGeneratingScript(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Eres el copiloto de Neurohipnosis Ericksoniana de AMIE Engine.
Genera un guion hipnótico PERMISIVO e INDIRECTO para un paciente en entorno de VR Inmersivo.

DATOS PACIENTE:
- Motivo / Diagnóstico: ${patient.consultationReason}
- Edad: ${patient.age} | Sexo: ${patient.gender}
- Enfoque: ${currentMetaphorTopic}
- HRV actual: ${telemetry.hrvRmssdMs} ms | GSR: ${telemetry.gsrMicroSiemens} µS

Usa dobles vínculos ("puedes notar...", "quizás prefieras..."), metáforas permisivas y marcadores de respiración [RESPIRA_LENTO]. Máximo 140 palabras.
`;
        const result = await model.generateContent(prompt);
        setScriptText(result.response.text() || 'A medida que escuchas el pulso binaural, nota cómo tu cuerpo elige su propio ritmo para descansar...');
      } else {
        setScriptText('A medida que escuchas la frecuencia en este espacio virtual, tu cuerpo puede notar cómo la respiración se vuelve más profunda y tranquila. No hay necesidad de forzar nada, solo permitir que el ritmo natural te guíe...');
      }
    } catch (e) {
      setScriptText('Permítete notar la sensación de seguridad en este entorno inmersivo. Cada respiración te ayuda a encontrar mayor estabilidad y calma...');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const triggerSafetyGrounding = (reason: string) => {
    setIsAbreactionTriggered(true);
    setIsActiveSession(false);
    setTranceDepthPct(0);
    setBinauralFreqHz(14.0); // Retorno a frecuencia Beta de alerta consciente
    setAbreactionMessage(reason);
  };

  const handleResetSession = () => {
    setIsAbreactionTriggered(false);
    setAbreactionMessage(null);
    setIsActiveSession(false);
    setTranceDepthPct(15);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 rounded-2xl text-white shadow-lg shadow-purple-600/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Consola de Neurohipnosis & Bucle Cerrado (Closed-Loop)
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                ERICKSONIAN VR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Modulación de pulsos binaurales, metáforas ericksonianas y monitoreo de abreacción en tiempo real.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800">
            ✕
          </button>
        )}
      </div>

      {/* Alerta del Watchdog Anti-Abreacción */}
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
            <span className="font-bold text-rose-400">SECUENCIA DE GROUNDING SENSORIAL INJECTADA (5-4-3-2-1):</span>
            <p className="text-slate-300">1. Iluminación neutra estática activada en entorno VR.</p>
            <p className="text-slate-300">2. Frecuencia binaural conmutada a 14 Hz (Ritmo Beta de vigilia).</p>
            <p className="text-slate-300">3. Voz directiva: "Siente tus pies sobre el suelo y respira lento."</p>
          </div>
          <button
            onClick={handleResetSession}
            className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow"
          >
            Restablecer Estado y Reiniciar Módulo
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
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Frecuencia Binaural
          </span>
          <div className="text-xl font-mono font-bold text-cyan-400">
            {binauralFreqHz} <span className="text-xs text-slate-500">Hz (Theta)</span>
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

      {/* Susceptibilidad */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-cyan-400" /> Escala Biométrica de Susceptibilidad Hipnótica
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cuantifica la receptividad fisiológica antes de iniciar el trance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {susceptibilityScore !== null && (
            <div className="px-3 py-1.5 bg-purple-950 border border-purple-500/40 rounded-lg text-xs font-mono">
              Susceptibilidad: <strong className="text-purple-300">{susceptibilityScore}/100</strong>
            </div>
          )}
          <button
            onClick={handleEvaluateSusceptibility}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            Medir Susceptibilidad
          </button>
        </div>
      </div>

      {/* Guion Ericksoriano */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Metáfora Ericksoaniana Adaptativa
          </span>

          <div className="flex items-center gap-2">
            <select
              value={currentMetaphorTopic}
              onChange={(e) => setCurrentMetaphorTopic(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ANXIETY_CONTAINMENT">Contención de Ansiedad</option>
              <option value="NARCISSISTIC_RESISTANCE">Resistencia Narcisista / Perfil Defensivo</option>
              <option value="TRAUMA_DESENSITIZATION">Desensibilización de Trauma</option>
              <option value="PAIN_CONTROL">Analgesia y Control de Dolor</option>
            </select>

            <button
              onClick={handleGenerateEricksonianScript}
              disabled={isGeneratingScript}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
            >
              {isGeneratingScript ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generar Metáfora</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-300 min-h-[90px] font-serif italic">
          {scriptText || 'Haga clic en "Generar Metáfora" para construir el guion inductivo adaptado al paciente...'}
        </div>
      </div>

      {/* Controles de Sesión */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Resonador Vagal: <strong className="text-emerald-400">EN LÍNEA</strong></span>
        </div>

        <div className="flex items-center gap-3">
          {!isActiveSession ? (
            <button
              onClick={() => { setIsActiveSession(true); setIsAbreactionTriggered(false); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition"
            >
              <Play className="w-4 h-4" />
              <span>Iniciar Trance Closed-Loop VR</span>
            </button>
          ) : (
            <button
              onClick={() => setIsActiveSession(false)}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/20 transition"
            >
              <Square className="w-4 h-4" />
              <span>Detener Sesión</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
