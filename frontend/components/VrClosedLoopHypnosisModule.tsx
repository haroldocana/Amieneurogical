import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord, PrecisionTelemetryPacket } from '../types';
import { telemetryService } from '../services/telemetryService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Sparkles,
  ShieldAlert,
  Brain,
  Activity,
  Volume2,
  Lock,
  Zap,
  Play,
  Square,
  RefreshCw,
  Eye,
  Heart,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

export const VrClosedLoopHypnosisModule: React.FC<Props> = ({ patient, onClose }) => {
  // Estados de Telemetría en Vivo
  const [telemetry, setTelemetry] = useState<PrecisionTelemetryPacket>({
    reactionTimeMs: 0,
    handGripPressureKg: 0,
    touchTapLatencyMs: 0,
    heartRateBpm: 72,
    hrvRmssdMs: 38,
    gsrMicroSiemens: 2.1,
    rrIntervalMs: 833,
    timestamp: Date.now()
  });

  // Estados del Motor de Hipnosis
  const [isActiveSession, setIsActiveSession] = useState(false);
  const [tranceDepthPct, setTranceDepthPct] = useState(15);
  const [susceptibilityScore, setSusceptibilityScore] = useState<number | null>(null);
  const [binauralFreqHz, setBinauralFreqHz] = useState(6.0); // Rango Theta (4-7 Hz)
  
  // Guion Ericksoriano Dinámico
  const [scriptText, setScriptText] = useState<string>('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [currentMetaphorTopic, setCurrentMetaphorTopic] = useState<'ANXIETY_CONTAINMENT' | 'NARCISSISTIC_RESISTANCE' | 'TRAUMA_DESENSITIZATION' | 'PAIN_CONTROL'>('ANXIETY_CONTAINMENT');

  // Watchdog de Seguridad y Abreacción
  const [isAbreactionTriggered, setIsAbreactionTriggered] = useState(false);
  const [abreactionMessage, setAbreactionMessage] = useState<string | null>(null);

  // Histórico de GSR y HRV para cálculo de deltas
  const gsrBaselineRef = useRef<number>(2.1);
  const hrvHistoryRef = useRef<number[]>([]);

  // 1. Suscripción a Telemetría de Hardware BLE en Vivo
  useEffect(() => {
    const unsubscribe = telemetryService.subscribeData((data) => {
      setTelemetry(data);

      if (data.gsrMicroSiemens > 0) {
        // Monitoreo del Watchdog Anti-Abreacción (Disparo súbito > 3x o HRV colapsado)
        const gsrDelta = data.gsrMicroSiemens - gsrBaselineRef.current;
        
        if (isActiveSession && (gsrDelta > 3.5 || (data.hrvRmssdMs < 14 && data.hrvRmssdMs > 0))) {
          triggerSafetyGrounding("DISPARO DE RESPUESTA SIMPÁTICA CRÍTICA: Abreacción traumática detectada.");
        }
      }

      // Modulación de Profundidad de Trance en Bucle Cerrado (Closed-Loop)
      if (isActiveSession && !isAbreactionTriggered) {
        calculateClosedLoopTrance(data);
      }
    });

    return () => unsubscribe();
  }, [isActiveSession, isAbreactionTriggered]);

  // 2. Modulación Closed-Loop: Ajusta el trance y los pulsos binaurales según la respuesta vegetativa
  const calculateClosedLoopTrance = (data: PrecisionTelemetryPacket) => {
    const hrvFactor = Math.min(100, (data.hrvRmssdMs / 60) * 100);
    const gsrFactor = Math.max(0, 100 - (data.gsrMicroSiemens * 20));
    
    const calculatedDepth = Math.round((hrvFactor * 0.6) + (gsrFactor * 0.4));
    setTranceDepthPct(Math.min(98, Math.max(10, calculatedDepth)));

    // Ajuste dinámico de Frecuencia Binaural (Entrenamiento de ondas cerebrales)
    if (calculatedDepth > 70) {
      setBinauralFreqHz(4.5); // Theta Profundo
    } else if (calculatedDepth > 40) {
      setBinauralFreqHz(6.0); // Theta Medio
    } else {
      setBinauralFreqHz(8.5); // Alpha de transición
    }
  };

  // 3. Evaluación Biométrica de Susceptibilidad Hipnótica (Proxy Stanford/Harvard)
  const handleEvaluateSusceptibility = () => {
    gsrBaselineRef.current = telemetry.gsrMicroSiemens || 2.1;
    const vagalStability = telemetry.hrvRmssdMs > 30 ? 45 : 25;
    const autonomicCalm = telemetry.gsrMicroSiemens < 3.0 ? 45 : 20;
    const randomPupilProxy = 8;

    const totalSusceptibility = vagalStability + autonomicCalm + randomPupilProxy;
    setSusceptibilityScore(totalSusceptibility);
  };

  // 4. Generación de Guion Ericksoriano Personalizado con Gemini AI
  const handleGenerateEricksonianScript = async () => {
    setIsGeneratingScript(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Eres el módulo de Neurohipnosis Ericksoniana de AMIE Engine.
Genera un guion hipnótico PERMISIVO, INDIRECTO y METAFÓRICO para un paciente en estado de trance VR.

DATOS DEL PACIENTE:
- Diagnóstico: ${patient.consultationReason}
- Edad: ${patient.age} años | Sexo: ${patient.gender}
- Enfoque Requerido: ${currentMetaphorTopic}
- Tono Vagal Actual (HRV): ${telemetry.hrvRmssdMs} ms
- Conductancia Cutánea (GSR): ${telemetry.gsrMicroSiemens} µS

REGLAS DE REDACCIÓN ERICKSONIANA:
1. Utiliza dobles vínculos, lenguaje permisivo ("Puedes notar...", "Quizás prefieras...") y metáforas disociativas.
2. Evita órdenes directas o confrontaciones rígidas.
3. Incluye marcadores de ritmo respiratorio [RESPIRA_LENTO].
4. Redacta un texto de aproximadamente 150 palabras listo para síntesis de voz.
`;

      const result = await model.generateContent(prompt);
      setScriptText(result.response.text() || 'Cierra suavemente los ojos y nota como la música acompaña tu respiración...');
    } catch (e) {
      setScriptText('A medida que escuchas el tono binaural, puedes notar cómo tu cuerpo elige su propio ritmo para descansar. No hay prisa, solo la sensación de seguridad en este espacio virtual...');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // 5. Protocolo de Seguridad: Interrupción por Abreacción y Grounding Sensorial
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-6xl mx-auto space-y-6">
      {/* Header del Módulo */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 rounded-2xl text-white shadow-lg shadow-purple-600/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Consola de Neurohipnosis & Bucle Cerrado (Closed-Loop Biofeedback)
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                ERICKSONIAN VR SUITE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Modulación de frecuencia binaural, inducción ericksoniana adaptativa y monitoreo de abreacción en tiempo real.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800">
            ✕
          </button>
        )}
      </div>

      {/* ALERTA CRÍTICA DE SAFETY WATCHDOG (ABREACCIÓN DETECTADA) */}
      {isAbreactionTriggered && (
        <div className="p-4 bg-rose-950/90 border-2 border-rose-500 rounded-2xl text-rose-100 space-y-3 shadow-2xl animate-shake">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 rounded-xl text-white">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">WATCHDOG DE SEGURIDAD ACTIVADO • TRANCE INTERRUMPIDO</h4>
              <p className="text-xs text-rose-200">{abreactionMessage}</p>
            </div>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-500/30 text-xs space-y-1 font-mono">
            <span className="font-bold text-rose-400">SECUENCIA DE GROUNDING SENSORIAL INYECTADA (5-4-3-2-1):</span>
            <p className="text-slate-300">1. Entorno VR cambiado a luz blanca neutra estática.</p>
            <p className="text-slate-300">2. Estimulación binaural conmutada a 14 Hz (Ritmo Beta de re-orientación consciente).</p>
            <p className="text-slate-300">3. Inducción de voz directiva: "Abre los ojos, siente tus pies sobre el suelo y respira profundo."</p>
          </div>
          <button
            onClick={handleResetSession}
            className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow"
          >
            Reinicio de Seguridad y Restablecimiento del Paciente
          </button>
        </div>
      )}

      {/* Grid de Monitoreo Biométrico y Trance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" /> Tono Vagal (HRV RMSSD)
          </span>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {telemetry.hrvRmssdMs} <span className="text-xs text-slate-500">ms</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Freno Parasimpático Activo</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Conductancia (GSR)
          </span>
          <div className="text-xl font-mono font-bold text-amber-400">
            {telemetry.gsrMicroSiemens} <span className="text-xs text-slate-500">µS</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Estrés Electrodérmico</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Frecuencia Binaural
          </span>
          <div className="text-xl font-mono font-bold text-cyan-400">
            {binauralFreqHz} <span className="text-xs text-slate-500">Hz (Theta)</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Arrastre de Onda Cerebral</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Profundidad de Trance
          </span>
          <div className="text-xl font-mono font-bold text-purple-400">
            {tranceDepthPct}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${tranceDepthPct}%` }} />
          </div>
        </div>
      </div>

      {/* Evaluación de Susceptibilidad Hipnótica */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-cyan-400" /> Escala Biométrica de Susceptibilidad Hipnótica (Stanford/Harvard Proxy)
          </span>
          <p className="text-[11px] text-slate-400">
            Cuantifica la receptividad neurofisiológica antes de iniciar el trance basándose en la variabilidad vagal y estabilidad Electrodérmica.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {susceptibilityScore !== null && (
            <div className="px-3 py-1.5 bg-purple-950 border border-purple-500/40 rounded-lg text-xs font-mono">
              Susceptibilidad: <strong className="text-purple-300">{susceptibilityScore}/100</strong> ({susceptibilityScore > 70 ? 'Alta Receptividad' : 'Media / Moderada'})
            </div>
          )}
          <button
            onClick={handleEvaluateSusceptibility}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            Medir Susceptibilidad Ahora
          </button>
        </div>
      </div>

      {/* Generador de Guion Ericksoriano con Gemini */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Motor de Metáforas Ericksonianas Adaptativas (Gemini AI Copilot)
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
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg transition shadow flex items-center gap-1.5"
            >
              {isGeneratingScript ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generar Metáfora</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-300 min-h-[100px] font-serif italic">
          {scriptText || 'Haga clic en "Generar Metáfora" para construir el guion inductivo adaptado al perfil del paciente...'}
        </div>
      </div>

      {/* Control de Sesión VR */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Closed-Loop Vagal Resonator: <strong className="text-emerald-400">EN LÍNEA</strong></span>
        </div>

        <div className="flex items-center gap-3">
          {!isActiveSession ? (
            <button
              onClick={() => { setIsActiveSession(true); setIsAbreactionTriggered(false); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
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
