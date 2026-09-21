import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Play, Square, Video, Eye, HeartPulse, Brain, Waves, Sliders, X, 
  Activity, User, Sparkles, AlertTriangle, ShieldCheck, Zap, Fingerprint, Network, Target, Compass
} from 'lucide-react';
import { PatientRecord } from '../types';
import { calculateAdaptedProgram, TraumaTypology, AdaptedProgramConfig } from '../services/developmentalTraumaEngine';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrDevelopmentalTraumaFullscreenMonitor: React.FC<Props> = ({ patient, onClose }) => {
  // Estado de Selección de la Evaluación Evolutiva
  const [patientAge, setPatientAge] = useState<number>(patient.age || 28);
  const [traumaType, setTraumaType] = useState<TraumaTypology>('COMPLEX_REPETITIVE');
  
  // Configuración calculada dinámicamente
  const [programConfig, setProgramConfig] = useState<AdaptedProgramConfig>(
    calculateAdaptedProgram(patientAge, traumaType)
  );

  // Estados de Sesión en Vivo
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);
  const [emdrBilateralActive, setEmdrBilateralActive] = useState(true);

  // Métricas del Visor y Fisiología Subcortical
  const [binauralHz, setBinauralHz] = useState<number>(programConfig.recommendedBinauralHz);
  const [tranceDepth, setTranceDepth] = useState<number>(12);
  const [hrv, setHrv] = useState<number>(42);
  const [gsr, setGsr] = useState<number>(1.8);
  const [dmnSuppressionPct, setDmnSuppressionPct] = useState<number>(20);
  const [saccadicHz, setSaccadicHz] = useState<number>(1.2);
  const [safetyTriggered, setSafetyTriggered] = useState<boolean>(false);

  // Mapeo Biopsicosocial Etológico (Evoluciona con la IA durante la sesión)
  const [etiologyScores, setEtiologyScores] = useState({
    biological: 35, // Aplanamiento Dopaminérgico / Rigidez Vagal
    psychological: 45, // Rumiación Obsesiva Digital / Anhedonia
    social: 30 // Aislamiento / Comparación Hiperconectada
  });

  // Log de Eventos de la IA (Closed-Loop Regulator)
  const [aiLogs, setAiLogs] = useState<string[]>([]);

  // Recalcular configuración si cambia la edad o la tipología
  useEffect(() => {
    const newConfig = calculateAdaptedProgram(patientAge, traumaType);
    setProgramConfig(newConfig);
    if (!sessionActive) {
      setBinauralHz(newConfig.recommendedBinauralHz);
    }
  }, [patientAge, traumaType, sessionActive]);

  // Bucle Bio-Adaptativo en Tiempo Real (Closed-Loop Engine)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (sessionActive && !safetyTriggered) {
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });

        // Fluctualización biométrica simulada a alta fidelidad
        setHrv(prev => Math.min(85, Math.max(14, prev + (Math.random() * 3.2 - 1.4))));
        setGsr(prev => Math.max(0.4, prev + (Math.random() * 0.22 - 0.11)));
        setSaccadicHz(prev => Math.max(0.5, Math.min(3.5, prev + (Math.random() * 0.2 - 0.1))));

        // Verificación de Umbral Crítico de Seguridad (GSR Safety Threshold)
        if (gsr > programConfig.gsrSafetyThresholduS) {
          setSafetyTriggered(true);
          setSessionActive(false);
          const alertMsg = `⚠️ ALERTA DE SEGURIDAD: Disparo de GSR (${gsr.toFixed(2)} µS) superó el límite permitido para la etapa ${programConfig.stageNameEs} (${programConfig.gsrSafetyThresholduS} µS). Iniciando desconexión inmediata.`;
          setAiLogs(prev => [`[${timeStr}] ${alertMsg}`, ...prev.slice(0, 9)]);
          alert(alertMsg);
          return;
        }

        // Modulación Inteligente Autónoma (AI Auto-Pilot Closed-Loop)
        if (aiAutoPilot) {
          setTranceDepth(prev => Math.min(96, prev + 0.6));
          setDmnSuppressionPct(prev => Math.min(88, prev + 0.7));

          // Descenso progresivo de Frecuencia Binaural hacia estado Theta
          if (binauralHz > programConfig.minBinauralHz) {
            setBinauralHz(prev => Math.max(programConfig.minBinauralHz, +(prev - 0.04).toFixed(2)));
          }

          // Descubrimiento dinámico de la etiología biopsicosocial por la IA
          setEtiologyScores(prev => ({
            biological: Math.min(92, prev.biological + (Math.random() > 0.5 ? 0.8 : 0)),
            psychological: Math.min(95, prev.psychological + (Math.random() > 0.6 ? 0.9 : 0)),
            social: Math.min(88, prev.social + (Math.random() > 0.7 ? 0.7 : 0))
          }));

          // Generación aleatoria de acciones reguladoras de la IA
          if (Math.random() > 0.75) {
            const actions = [
              `IA Regulator: Detectada elevación leve de picos simpáticos. Atenuando luminancia VR al 35%.`,
              `IA EMDR: Sincronizando barrido ocular bilateral a ${saccadicHz.toFixed(1)} Hz para desensibilización.`,
              `IA Bio-Feedback: Aumentando estimulación vagal. HRV regulado a ${hrv.toFixed(1)} ms.`,
              `IA DMN Engine: Desactivando hiperconectividad de rumiación. Supresión DMN alcanzada al ${Math.floor(dmnSuppressionPct)}%.`
            ];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            setAiLogs(prev => [`[${timeStr}] ${randomAction}`, ...prev.slice(0, 9)]);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, aiAutoPilot, gsr, binauralHz, programConfig, safetyTriggered, hrv, saccadicHz, dmnSuppressionPct]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSessionActive(true);
    setTranceDepth(15);
    setDmnSuppressionPct(22);
    setAiLogs([`[SISTEMA] Sesión iniciada. Sincronización biométrica con Meta Quest 3S / Pico Neo 3 establecida.`]);
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setSafetyTriggered(true);
    setBinauralHz(12.0);
    setTranceDepth(0);
    setDmnSuppressionPct(0);
    setAiLogs(prev => [`[EMERGENCIA] Interrupción manual por el clínico. Ancla de seguridad aplicada.`, ...prev]);
  };

  const safePatientName = patient.patientNameAnonymized || patient.id || 'PAC-8104';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. BARRA SUPERIOR ESTRUCTURAL */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 rounded-xl text-white shadow-[0_0_20px_rgba(219,39,119,0.3)]">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              AIMA Fullscreen Monitor • Protocolo de Trauma Evolutivo & Hipnosis
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Paciente: <strong className="text-white">{safePatientName}</strong> | Etapa Detectada: <span className="font-bold text-amber-300">{programConfig.stageNameEs}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              aiAutoPilot 
                ? 'bg-purple-950 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${aiAutoPilot ? 'animate-spin' : ''}`} />
            {aiAutoPilot ? 'AI Closed-Loop Activo' : 'Control Manual Terapeuta'}
          </button>

          <button
            onClick={handleEmergencyEgress}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" /> Abortar VR (Egress)
          </button>

          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. CUERPO PRINCIPAL EN 3 COLUMNAS */}
      <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        
        {/* PANEL IZQUIERDO: Perfil Paciente + Topografía Etológica (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-purple-400" /> Perfil de Inmersión Adaptativo
            </h2>

            {/* Ajuste de Edad */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Edad Evaluada:</span>
                <span className="text-amber-400 font-bold font-mono text-sm">{patientAge} años</span>
              </div>
              <input 
                type="range" min="4" max="90" 
                value={patientAge}
                disabled={sessionActive}
                onChange={(e) => setPatientAge(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Tipología del Trauma */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Naturaleza del Trauma / Disparador</label>
              {[
                { id: 'ATTACHMENT_DEVELOPMENTAL', name: 'Apego / Desarrollo (Infantil)' },
                { id: 'COMPLEX_REPETITIVE', name: 'TEPT Complejo (TEPT-C / Repetitivo)' },
                { id: 'SINGLE_EVENT_ACUTE', name: 'Evento Único Agudo (Asalto/Accidente)' },
                { id: 'INTERPERSONAL_ABUSE', name: 'Abuso Interpersonal / Bullying' },
                { id: 'LOSS_BEREAVEMENT', name: 'Duelo Traumático / Obsesión' }
              ].map(t => (
                <button
                  key={t.id}
                  disabled={sessionActive}
                  onClick={() => setTraumaType(t.id as TraumaTypology)}
                  className={`w-full text-left p-2 rounded-lg text-[11px] font-semibold border transition ${
                    traumaType === t.id
                      ? 'bg-purple-950/80 border-purple-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Mapeo de Causas Biopsicosociales */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-400" /> Desglose Etológico (Depresión / Vacío)
              </span>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-rose-400">Psicológico / Anhedonia:</span>
                  <span className="text-slate-300 font-mono">{etiologyScores.psychological}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${etiologyScores.psychological}%` }} className="h-full bg-rose-500 transition-all duration-700" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-amber-400">Social / Comparación Digital:</span>
                  <span className="text-slate-300 font-mono">{etiologyScores.social}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${etiologyScores.social}%` }} className="h-full bg-amber-500 transition-all duration-700" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-indigo-400">Biológico / Hipoactividad Vagal:</span>
                  <span className="text-slate-300 font-mono">{etiologyScores.biological}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${etiologyScores.biological}%` }} className="h-full bg-indigo-500 transition-all duration-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase block">Fundamento Clínico:</span>
            <p className="text-[10.5px] text-slate-300 leading-snug">{programConfig.clinicalRationale}</p>
          </div>
        </div>

        {/* PANEL CENTRO: Live Transmission POV Visor & Telemetría (6 cols) */}
        <div className="col-span-12 lg:col-span-6 bg-black rounded-2xl border-2 border-slate-800 relative flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
          
          {/* Header del POV */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono">
              <Video className={`w-3.5 h-3.5 ${sessionActive ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
              Visor Live: Meta Quest 3S | Metáfora: <strong className="text-purple-300">{programConfig.visualMetaphorNameEs}</strong>
            </div>

            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-cyan-300">
              <Waves className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              EMDR Bilateral: {emdrBilateralActive ? 'ACTIVO' : 'INACTIVO'}
            </div>
          </div>

          {/* Renderizador de Escena Simulada */}
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {sessionActive ? (
              <div className="text-center space-y-4 relative z-10">
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-4 border-cyan-500/40 border-t-cyan-400 animate-spin" />
                  <Brain className="w-12 h-12 text-purple-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Inducción Hypno-VR ({programConfig.stage})
                  </h3>
                  <p className="text-xs text-purple-300 font-mono mt-1">
                    Frecuencia Target: {binauralHz.toFixed(1)} Hz | Trance: {Math.floor(tranceDepth)}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 relative z-10">
                <ShieldCheck className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-400 max-w-sm">
                  Visor en espera. Presione <strong className="text-purple-400">"Iniciar Protocolo Adaptado"</strong> para transmitir la señal bio-adaptativa.
                </p>
              </div>
            )}
          </div>

          {/* HUD Inferior Biométrico Subcortical */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 grid grid-cols-5 gap-2 shadow-2xl z-10 text-center font-mono">
            <div className="border-r border-slate-800 pr-1">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Tono Vagal (HRV)</span>
              <div className="text-base font-bold text-emerald-400">{hrv.toFixed(1)} <span className="text-[9px] font-normal">ms</span></div>
            </div>

            <div className="border-r border-slate-800 pr-1">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Estrés GSR</span>
              <div className={`text-base font-bold ${gsr > programConfig.gsrSafetyThresholduS * 0.8 ? 'text-rose-400 animate-pulse' : 'text-rose-300'}`}>
                {gsr.toFixed(2)} <span className="text-[9px] font-normal">µS</span>
              </div>
            </div>

            <div className="border-r border-slate-800 pr-1">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Binaural EEG</span>
              <div className="text-base font-bold text-cyan-300">{binauralHz.toFixed(1)} <span className="text-[9px] font-normal">Hz</span></div>
            </div>

            <div className="border-r border-slate-800 pr-1">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Supresión DMN</span>
              <div className="text-base font-bold text-purple-300">{Math.floor(dmnSuppressionPct)}%</div>
            </div>

            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Prof. Trance</span>
              <div className="text-base font-bold text-pink-400">{Math.floor(tranceDepth)}%</div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Closed-Loop AI Logs & Controles de Ejecución (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-amber-400" /> AI Closed-Loop Regulator
            </h2>

            {/* Bitácora de Inteligencia Artificial */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] leading-relaxed flex flex-col gap-2 overflow-y-auto max-h-[260px] relative">
              <div className="absolute top-2 right-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              {aiLogs.length > 0 ? (
                aiLogs.map((log, i) => (
                  <div key={i} className={`p-2 rounded border border-slate-800/60 ${i === 0 ? 'text-cyan-300 bg-cyan-950/30 font-semibold' : 'text-slate-400'}`}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-center p-4">
                  A la espera de activación del bucle bio-adaptativo...
                </div>
              )}
            </div>

            {/* Parámetros Manuales de Resguardo */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Audio Binaural Target:</span>
                <span className="text-cyan-300 font-mono font-bold">{binauralHz.toFixed(1)} Hz</span>
              </div>
              <input 
                type="range" 
                min={programConfig.minBinauralHz} 
                max={programConfig.maxBinauralHz} 
                step="0.1"
                value={binauralHz}
                disabled={aiAutoPilot}
                onChange={(e) => setBinauralHz(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer disabled:opacity-30"
              />
              <span className="text-[9.5px] text-slate-500 block">Límite para {programConfig.stageNameEs}: {programConfig.minBinauralHz}Hz - {programConfig.maxBinauralHz}Hz</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase block">Límite de Seguridad Activo:</span>
              <p className="text-xs text-slate-300">
                GSR Safety Threshold: <strong className="text-white font-mono">{programConfig.gsrSafetyThresholduS} µS</strong>
              </p>
            </div>
          </div>

          {/* Botones de Control de Sesión */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/20 transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Protocolo Adaptado
              </button>
            ) : (
              <button
                onClick={() => setSessionActive(false)}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl shadow-lg transition active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
                Concluir Sesión VR
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
