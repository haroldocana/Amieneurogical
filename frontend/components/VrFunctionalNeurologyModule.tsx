import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Play, Square, Video, Activity, Brain, X, 
  Zap, Target, Layers, Eye, RefreshCw, Sparkles, UserCheck, Move, CheckCircle2
} from 'lucide-react';
import { PatientRecord } from '../types';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

type FndSubtype = 'FUNCTIONAL_PARALYSIS' | 'PSYCHOGENIC_TREMOR' | 'FUNCTIONAL_GAIT_DISORDER' | 'PSYCHOGENIC_BLINDNESS';

export const VrFunctionalNeurologyModule: React.FC<Props> = ({ patient, onClose }) => {
  // Configuración Clínica
  const [fndSubtype, setFndSubtype] = useState<FndSubtype>('FUNCTIONAL_PARALYSIS');
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);

  // Parámetros de Inducción Hypno-VR y Neuro-Rehabilitación
  const [binauralHz, setBinauralHz] = useState<number>(6.8); // Rango Alpha/Theta (6-8Hz) ideal para re-aprendizaje motor
  const [motorAgencyGain, setMotorAgencyGain] = useState<number>(80); // Ganancia del espejo virtual (0-100%)
  
  // Métricas de Retroalimentación en Tiempo Real
  const [mnsActivationPct, setMnsActivationPct] = useState<number>(15); // Sistema de Neuronas Espejo
  const [premotorCoherence, setPremotorCoherence] = useState<number>(20); // Coherencia Corteza Premotora
  const [motorAgencyScore, setMotorAgencyScore] = useState<number>(10); // Sensación de Control del Paciente
  const [hrv, setHrv] = useState<number>(38);
  const [gsr, setGsr] = useState<number>(2.2);

  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [safetyTriggered, setSafetyTriggered] = useState(false);

  // Motor Closed-Loop de Desbloqueo Motor (AI Motor Re-Learning Engine)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (sessionActive && !safetyTriggered) {
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });

        // Fluctualización biométrica simulada
        setHrv(prev => Math.min(85, Math.max(15, prev + (Math.random() * 2.5 - 1.0))));
        setGsr(prev => Math.max(0.4, prev + (Math.random() * 0.18 - 0.1)));

        // Progresión de la Activación del Sistema de Neuronas Espejo (MNS)
        setMnsActivationPct(prev => Math.min(96, prev + (motorAgencyGain / 100) * 0.8));
        setPremotorCoherence(prev => Math.min(92, prev + 0.6));
        setMotorAgencyScore(prev => Math.min(95, prev + 0.7));

        // Lógica Autónoma de la IA (Closed-Loop Regulator)
        if (aiAutoPilot) {
          if (mnsActivationPct > 60 && premotorCoherence > 50) {
            if (Math.random() > 0.7) {
              setAiLogs(prev => [
                `[${timeStr}] DESBLOQUEO PREMOTOR: Coherencia alcanzada al ${Math.floor(premotorCoherence)}%. La señal espejo ha traspasado la inhibición conversiva.`,
                ...prev.slice(0, 8)
              ]);
            }
          } else {
            if (Math.random() > 0.8) {
              setAiLogs(prev => [
                `[${timeStr}] ESTIMULACIÓN ESPEJO: Ajustando ganancia motora al ${Math.floor(motorAgencyGain)}%. Activando neuronas espejo en corteza F5/BA44.`,
                ...prev.slice(0, 8)
              ]);
            }
          }
        }

        // Cortocircuito de seguridad si hay sobreexcitación/frustración
        if (gsr > 6.5) {
          setSafetyTriggered(true);
          setSessionActive(false);
          alert(`⚠️ ALERTA: Frustración o pánico motor detectado (GSR: ${gsr.toFixed(1)} µS). Interrumpiendo amplificación espejo para prevenir distrés.`);
        }

      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, aiAutoPilot, mnsActivationPct, premotorCoherence, motorAgencyGain, gsr, safetyTriggered]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSessionActive(true);
    setMnsActivationPct(18);
    setPremotorCoherence(22);
    setMotorAgencyScore(12);
    setAiLogs([`[SISTEMA] Iniciando Protocolo Hypno-VR de Mirror Visual Feedback 3D. Inhibiendo control prefrontal...`]);
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setSafetyTriggered(true);
    setMnsActivationPct(0);
    setAiLogs(prev => [`[EMERGENCIA] Desconexión manual solicitada. Suspendiendo señal espejo de avatar.`, ...prev]);
  };

  const getSubtypeTitle = (sub: FndSubtype) => {
    const map = {
      'FUNCTIONAL_PARALYSIS': 'Parálisis Funcional / Conversiva (Pérdida de Fuerza)',
      'PSYCHOGENIC_TREMOR': 'Temblor Psicógeno / Distonía Funcional',
      'FUNCTIONAL_GAIT_DISORDER': 'Trastorno Conversivo de la Marcha / Astasia-Abasia',
      'PSYCHOGENIC_BLINDNESS': 'Ceguera Conversiva / Defecto Sensorial Funcional'
    };
    return map[sub];
  };

  const safePatientName = patient.patientNameAnonymized || patient.id || 'PAC-8104';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. HEADER */}
      <div className="h-16 border-b border-indigo-900/50 bg-slate-900 flex items-center justify-between px-6 shadow-[0_4px_30px_rgba(79,70,229,0.15)] z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-600 rounded-xl text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Rehabilitación Neuro-Funcional & Mirror Visual Feedback 3D (Hypno-VR)
            </h1>
            <p className="text-[10px] text-indigo-300 font-mono flex items-center gap-2">
              Paciente: <strong className="text-white">{safePatientName}</strong> | Módulo de Desbloqueo Motor Conversivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              aiAutoPilot 
                ? 'bg-indigo-950 border-indigo-500 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiAutoPilot ? 'animate-spin text-indigo-400' : ''}`} />
            {aiAutoPilot ? 'AI Motor-Relearning Auto-Pilot' : 'Control Manual Terapeuta'}
          </button>

          <button
            onClick={handleEmergencyEgress}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" /> Abortar VR (Egress)
          </button>

          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        
        {/* LEFT PANEL: Diagnóstico FND & Etiología */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Target className="w-4 h-4 text-indigo-400" /> Clasificación del Trastorno Funcional
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Fenotipo Conversivo (FND / CIE-11: 6B60)</label>
              <select 
                disabled={sessionActive}
                value={fndSubtype}
                onChange={(e) => setFndSubtype(e.target.value as FndSubtype)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold focus:border-indigo-500 outline-none disabled:opacity-50"
              >
                <option value="FUNCTIONAL_PARALYSIS">Parálisis Funcional / Conversiva</option>
                <option value="PSYCHOGENIC_TREMOR">Temblor Psicógeno / Distonía</option>
                <option value="FUNCTIONAL_GAIT_DISORDER">Trastorno Conversivo de la Marcha</option>
                <option value="PSYCHOGENIC_BLINDNESS">Ceguera / Déficit Sensorial Conversivo</option>
              </select>
            </div>

            {/* Mapeo de Volición y Bloqueo Cortical */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" /> Indicadores de Desacoplamiento Volitivo
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Activación Neuronas Espejo (MNS):</span>
                  <span className="text-indigo-300 font-mono">{Math.floor(mnsActivationPct)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${mnsActivationPct}%` }} className="h-full bg-indigo-500 transition-all duration-500" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Coherencia Corteza Premotora:</span>
                  <span className="text-cyan-300 font-mono">{Math.floor(premotorCoherence)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${premotorCoherence}%` }} className="h-full bg-cyan-500 transition-all duration-500" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Restauración de Agencia Motora:</span>
                  <span className="text-emerald-400 font-mono">{Math.floor(motorAgencyScore)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${motorAgencyScore}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 mt-4">
            <span className="text-[10px] font-bold text-indigo-400 uppercase block">Principio de Retroalimentación Espejo:</span>
            <p className="text-[10.5px] text-slate-300 leading-snug">
              Al proyectar la extremidad virtual del avatar en perfecto movimiento sincrónico durante un estado de trance inductivo (Alpha/Theta), la imagen visual cortocircuita la inhibición emocional prefrontal, reactivando la vía motora bloqueada.
            </p>
          </div>
        </div>

        {/* CENTER PANEL: Simulador POV Visor 1ª Persona (Avatar Mirror) */}
        <div className="col-span-12 lg:col-span-6 bg-[#030712] rounded-2xl border-2 border-slate-800 relative flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
          
          {/* Overlay Status del Visor */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-indigo-500/30 text-xs font-mono text-indigo-100">
              <Video className={`w-3.5 h-3.5 ${sessionActive ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
              POV Visor VR: <span className="font-bold text-white">{getSubtypeTitle(fndSubtype)}</span>
            </div>
          </div>

          {/* Renderizador de Escena 3D (Simulación de Espejo Virtual) */}
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {sessionActive ? (
              <div className="text-center space-y-6 relative z-10">
                {/* Visualizador de Neuronas Espejo en Movimiento */}
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-[2px] border-indigo-500/20 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
                  <div className="absolute inset-2 border-[3px] border-cyan-500/40 border-t-indigo-400 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
                  <Move className="w-16 h-16 text-indigo-300 animate-bounce" />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-indigo-200 font-mono tracking-widest uppercase">
                    Mirror Visual Feedback 3D Activo
                  </h3>
                  <p className="text-xs text-cyan-300 font-mono mt-2">
                    Sincronización Avatar Espejo: {Math.floor(motorAgencyGain)}% | EEG Alpha: {binauralHz.toFixed(1)} Hz
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 relative z-10">
                <UserCheck className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-400 max-w-sm">
                  Visor listo. Inicie la sesión para proyectar el avatar en 1ª persona y comenzar la reactivación motora guiada por neuronas espejo.
                </p>
              </div>
            )}
          </div>

          {/* HUD Inferior de Telemetría Neuro-Motora */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-xl border border-indigo-900/50 rounded-xl p-3 grid grid-cols-4 gap-2 shadow-2xl z-10 text-center font-mono">
            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Activación Neuronas (MNS)</span>
              <div className="text-xl font-bold text-indigo-300">
                {Math.floor(mnsActivationPct)}%
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Coherencia Premotora</span>
              <div className="text-xl font-bold text-cyan-300">
                {Math.floor(premotorCoherence)}%
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Binaural Re-Learning</span>
              <div className="text-xl font-bold text-purple-300">
                {binauralHz.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">Hz</span>
              </div>
            </div>

            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Estrés GSR</span>
              <div className="text-xl font-bold text-emerald-400">
                {gsr.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">µS</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Closed-Loop AI Logs & Controles */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-indigo-400" /> AI Motor Closed-Loop Engine
            </h2>

            {/* Bitácora de la IA de Desbloqueo Motor */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] leading-relaxed flex flex-col gap-2 overflow-y-auto max-h-[300px] relative shadow-inner">
              <div className="absolute top-2 right-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              </div>

              {aiLogs.length > 0 ? (
                aiLogs.map((log, i) => (
                  <div key={i} className={`p-2 rounded border ${
                    i === 0 
                      ? 'text-indigo-300 bg-indigo-950/30 border-indigo-900/50 font-semibold' 
                      : 'text-slate-400 border-slate-800/60'
                  }`}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-center p-4">
                  A la espera de la transmisión de señal espejo al visor VR...
                </div>
              )}
            </div>

            {/* Controles Manuales del Terapeuta */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Ganancia Espejo Avatar 3D:</span>
                  <span className="text-indigo-400 font-mono">{Math.floor(motorAgencyGain)}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" 
                  value={motorAgencyGain}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setMotorAgencyGain(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer disabled:opacity-30"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Audio Binaural (Alpha/Theta):</span>
                  <span className="text-cyan-300 font-mono">{binauralHz.toFixed(1)} Hz</span>
                </div>
                <input 
                  type="range" min="5.0" max="10.0" step="0.1"
                  value={binauralHz}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setBinauralHz(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer disabled:opacity-30"
                />
              </div>
            </div>
          </div>

          {/* Botones de Control de Sesión */}
          <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Re-Aprendizaje Motor
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
