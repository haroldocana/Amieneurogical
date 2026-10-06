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
  Sliders,
  Sunrise,
  ShieldCheck,
  Glasses
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
  const [binauralFreqHz, setBinauralFreqHz] = useState(6.0); // Modulación de ondas Theta (4-7 Hz)

  // Guion Ericksoriano Dinámico
  const [scriptText, setScriptText] = useState<string>('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [currentMetaphorTopic, setCurrentMetaphorTopic] = useState<'ANXIETY_CONTAINMENT' | 'NARCISSISTIC_RESISTANCE' | 'TRAUMA_DESENSITIZATION' | 'PAIN_CONTROL'>('ANXIETY_CONTAINMENT');

  // Watchdog Anti-Abreacción
  const [isAbreactionTriggered, setIsAbreactionTriggered] = useState(false);
  const [abreactionMessage, setAbreactionMessage] = useState<string | null>(null);

  const gsrBaselineRef = useRef<number>(2.1);

  // -------------------------------------------------------------------------
  // CONEXIÓN PUENTE VR (EMISOR EN METAVERSE)
  // -------------------------------------------------------------------------
  const { isConnected, transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', 'Neurohypnosis');

  // Transmisión en vivo de fisiología y profundidad del trance
  useEffect(() => {
    if (isActiveSession && !isAbreactionTriggered) {
      transmit({
        hrv: telemetry.hrvRmssdMs,
        gsr: telemetry.gsrMicroSiemens,
        stressLevel: tranceDepthPct, 
        habituationIndex: Math.floor(binauralFreqHz * 10), 
        omissions: susceptibilityScore || 0
      });
    }
  }, [telemetry.hrvRmssdMs, telemetry.gsrMicroSiemens, tranceDepthPct, binauralFreqHz, susceptibilityScore, isActiveSession, isAbreactionTriggered, transmit]);

  // Simulación y lectura biométrica en vivo en bucle cerrado
  useEffect(() => {
    if (!isActiveSession) return;

    const interval = setInterval(() => {
      // Variación biométrica (Si estamos despertando, forzamos el ritmo a subir)
      const awakeningModifier = sessionPhase === 'AWAKENING' ? 1.5 : 0;
      const randomHrvDelta = (Math.random() - 0.48) * 4 - awakeningModifier; 
      const randomGsrDelta = (Math.random() - 0.5) * 0.2 + (awakeningModifier * 0.1);

      setTelemetry(prev => {
        const nextHrv = Math.max(10, Math.min(100, prev.hrvRmssdMs + randomHrvDelta));
        const nextGsr = Math.max(0.5, Math.min(12, prev.gsrMicroSiemens + randomGsrDelta));

        // Verificación de Watchdog Anti-Abreacción (Desactivado temporalmente si estamos despertando intencionalmente)
        if (sessionPhase !== 'AWAKENING' && (nextGsr - gsrBaselineRef.current > 3.8 || nextHrv < 14)) {
          triggerSafetyGrounding('DISPARO DE RESPUESTA SIMPÁTICA CRÍTICA: Cambios abruptos de GSR/HRV sugieren abreacción traumática.');
        }

        // Modulación Closed-Loop del Trance
        const hrvFactor = Math.min(100, (nextHrv / 60) * 100);
        const gsrFactor = Math.max(0, 100 - (nextGsr * 15));
        const depth = Math.round((hrvFactor * 0.6) + (gsrFactor * 0.4));
        setTranceDepthPct(Math.min(98, Math.max(10, depth)));

        // Arrastre de frecuencias binaurales según profundidad o fase
        if (sessionPhase === 'AWAKENING') setBinauralFreqHz(14.0); // Beta para despertar
        else if (depth > 70) setBinauralFreqHz(4.5);
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
  }, [isActiveSession, sessionPhase]);

  // -------------------------------------------------------------------------
  // CONTROLADORES DE FASE Y HERRAMIENTAS DE TRAUMA
  // -------------------------------------------------------------------------
  const handleStartInduction = () => {
    setIsActiveSession(true);
    setSessionPhase('INDUCTION');
    setIsAbreactionTriggered(false);
    transmit({ type: 'LOAD_MODULE', patientId: patient?.id, moduleName: 'NEURO_HYPNOSIS' });
    transmit({ type: 'START_INDUCTION' });
  };

  const handleStartAwakening = () => {
    setSessionPhase('AWAKENING');
    setEmdrActive(false);
    transmit({ type: 'START_AWAKENING' }); // Lanza el Efecto Amanecer en VR
  };

  const toggleEmdr = () => {
    const newState = !emdrActive;
    setEmdrActive(newState);
    transmit({ type: 'TOGGLE_EMDR', active: newState });
  };

  const triggerSafetyGrounding = (reason: string) => {
    setIsAbreactionTriggered(true);
    setSessionPhase('IDLE');
    setIsActiveSession(false);
    setTranceDepthPct(0);
    setEmdrActive(false);
    setBinauralFreqHz(14.0); 
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
        setScriptText('A medida que escuchas la frecuencia en este espacio virtual, tu cuerpo puede notar cómo la respiración se vuelve más profunda y tranquila...');
      }
    } catch (e) {
      setScriptText('Permítete notar la sensación de seguridad en este entorno inmersivo. Cada respiración te ayuda a encontrar mayor estabilidad...');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // CONSOLIDACIÓN Y GUARDADO DE REPORTE FINAL EN MONGODB
  const handleEndSession = async () => {
    setIsActiveSession(false);
    setSessionPhase('IDLE');
    transmit({ type: 'STOP_TEST' });

    const sessionReport = {
      patientId: patient?.id || 'PAC-8104',
      sessionData: {
        taskName: 'Neurohypnosis',
        durationSeconds: 300,
        metrics: {
          avgHrv: telemetry.hrvRmssdMs,
          avgGsr: telemetry.gsrMicroSiemens,
          omissions: 0,
          commissions: 0,
          frontalEngagementPct: tranceDepthPct, 
          binauralBetaHz: binauralFreqHz
        },
        aiLogs: [
          `Sesión de Neurohipnosis VR concluida. Profundidad del trance alcanzada: ${tranceDepthPct}%. Frecuencia Binaural final: ${binauralFreqHz} Hz.`,
          scriptText ? `Guion Ericksoniano: "${scriptText.substring(0, 120)}..."` : 'Sin guion generado.'
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
              Modulación de pulsos binaurales, metáforas generativas y protocolo de aterrizaje seguro.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition">
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
            <span className="font-bold text-rose-400">SECUENCIA DE GROUNDING SENSORIAL INYECTADA (5-4-3-2-1):</span>
            <p className="text-slate-300">1. Iluminación neutra estática activada en entorno VR.</p>
            <p className="text-slate-300">2. Frecuencia binaural conmutada a 14 Hz (Ritmo Beta de vigilia).</p>
            <p className="text-slate-300">3. Voz directiva: "Siente tus pies sobre el suelo y respira lento."</p>
          </div>
          <button onClick={handleResetSession} className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow">
            Restablecer Estado y Reiniciar Módulo
          </button>
        </div>
      )}

      {/* Indicadores Biométricos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`bg-slate-950 p-4 rounded-xl border space-y-1 ${sessionPhase === 'AWAKENING' ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800'}`}>
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
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Frec. Binaural
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

      {/* Susceptibilidad & Herramientas de Trauma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" /> Escala de Susceptibilidad
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Cuantifica la receptividad antes del trance.</p>
          </div>
          <div className="flex items-center gap-3">
            {susceptibilityScore !== null && (
              <div className="px-3 py-1.5 bg-purple-950 border border-purple-500/40 rounded-lg text-xs font-mono">
                Puntaje: <strong className="text-purple-300">{susceptibilityScore}/100</strong>
              </div>
            )}
            <button onClick={handleEvaluateSusceptibility} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition">
              Medir Susceptibilidad
            </button>
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-400" /> Herramientas de Procesamiento
            </span>
            <p className="text-[11px] text-slate-400 mt-1">EMDR Bilateral y Grounding de Emergencia.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={toggleEmdr} 
              disabled={sessionPhase !== 'INDUCTION'}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${emdrActive ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 disabled:opacity-50'}`}
            >
              {emdrActive ? 'Detener EMDR' : 'Activar EMDR'}
            </button>
            <button 
              onClick={() => triggerSafetyGrounding('Aterrizaje manual iniciado por el terapeuta.')} 
              disabled={sessionPhase !== 'INDUCTION'}
              className="flex-1 py-2 bg-rose-950 border border-rose-500/50 text-rose-300 text-xs font-bold rounded-xl transition disabled:opacity-50 hover:bg-rose-900"
            >
              Abortar (Grounding)
            </button>
          </div>
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

      {/* Controles de Sesión Maestros */}
      <div>
        {/* INSTRUCCIONES DE INGRESO PARA EL PACIENTE */}
        {!isConnected && sessionPhase === 'IDLE' && (
          <div className="mb-4 p-3 bg-slate-900/80 border border-purple-500/30 border-dashed rounded-xl flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg shrink-0">
              <Glasses className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white block mb-0.5">Esperando conexión del paciente...</strong>
              Para habilitar la inducción, el paciente debe colocarse el visor <strong className="text-purple-300">Meta Quest 3S</strong> e iniciar la sesión vinculando su expediente: <span className="text-purple-300 font-mono bg-purple-900/30 px-1 rounded">{patient?.id || 'PAC-8104'}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Resonador Vagal: <strong className={isConnected ? "text-emerald-400" : "text-slate-500"}>{isConnected ? 'EN LÍNEA' : 'DESCONECTADO'}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            {sessionPhase === 'IDLE' && (
              <button 
                disabled={!isConnected}
                onClick={handleStartInduction} 
                className={`flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg transition ${
                  !isConnected 
                    ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105'
                }`}
              >
                {!isConnected ? 'Esperando Visor VR...' : <><Play className="w-4 h-4" /> <span>Iniciar Inducción Profunda</span></>}
              </button>
            )}

            {sessionPhase === 'INDUCTION' && (
              <button onClick={handleStartAwakening} className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-lg transition">
                <Sunrise className="w-4 h-4" /> <span>Iniciar Des-inducción (Amanecer)</span>
              </button>
            )}

            {(sessionPhase === 'AWAKENING' || sessionPhase === 'INDUCTION') && (
              <button onClick={handleEndSession} className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-black text-xs rounded-xl transition">
                <Square className="w-4 h-4" /> <span>Finalizar Apagado</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
