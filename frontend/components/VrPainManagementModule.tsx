import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Play, Square, Video, Activity, Brain, X, 
  Snowflake, ThermometerSnowflake, Zap, Activity as HeartPulse, 
  Target, Fingerprint, BatteryCharging, AudioWaveform
} from 'lucide-react';
import { PatientRecord } from '../types';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

type PainCondition = 'PHANTOM_LIMB' | 'FIBROMYALGIA' | 'ONCOLOGY_PAIN' | 'SEVERE_BURN' | 'NEUROPATHY';
type VisualMetaphor = 'GLACIAL_FRACTALS' | 'DEEP_OCEAN_ABYSS' | 'CRYSTAL_CAVE' | 'NEBULA_VOID';

export const VrPainManagementModule: React.FC<Props> = ({ patient, onClose }) => {
  // Configuración Clínica Inicial
  const [painCondition, setPainCondition] = useState<PainCondition>('FIBROMYALGIA');
  const [visualMetaphor, setVisualMetaphor] = useState<VisualMetaphor>('GLACIAL_FRACTALS');
  const [baselinePain, setBaselinePain] = useState<number>(8); // Escala EVA 0-10

  // Estados de Sesión (Bucle Cerrado)
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);
  
  // Telemetría Biométrica y Nociceptiva
  const [currentPainLevel, setCurrentPainLevel] = useState<number>(0);
  const [immersionLoadPct, setImmersionLoadPct] = useState<number>(0); // Carga Sensorial
  const [deltaHz, setDeltaHz] = useState<number>(4.0); // Frecuencia de analgesia
  const [gsr, setGsr] = useState<number>(3.5); // Refleja dolor agudo
  const [hrv, setHrv] = useState<number>(35); // Refleja relajación
  
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [safetyTriggered, setSafetyTriggered] = useState(false);

  // Motor de Bloqueo Nociceptivo (AI Closed-Loop Regulator)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (sessionActive && !safetyTriggered) {
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });

        // Simulación de fluctuación fisiológica del dolor
        // El dolor intenta subir (brotes nociceptivos)
        let simulatedPainSpike = currentPainLevel + (Math.random() * 0.8 - 0.2);
        let newGsr = gsr + (Math.random() * 0.4 - 0.2);
        
        // La Carga de Inmersión (Immersion Load) suprime el dolor (Teoría de la Compuerta)
        const painSuppression = (immersionLoadPct / 100) * 1.5; 
        simulatedPainSpike = Math.max(0, simulatedPainSpike - painSuppression);
        
        setCurrentPainLevel(Math.min(10, simulatedPainSpike));
        setGsr(Math.max(0.5, newGsr));
        setHrv(prev => Math.min(90, Math.max(20, prev + (immersionLoadPct > 50 ? 0.5 : -0.5))));

        // Lógica de la Inteligencia Artificial (Auto-Pilot)
        if (aiAutoPilot) {
          // Si el dolor o GSR suben, la IA aumenta la inmersión y baja la frecuencia a Delta profundo
          if (simulatedPainSpike > 3.0 || newGsr > 4.0) {
            setImmersionLoadPct(prev => Math.min(100, prev + 2.5));
            setDeltaHz(prev => Math.max(1.0, prev - 0.1));
            
            if (Math.random() > 0.6) {
              setAiLogs(prev => [`[${timeStr}] PICO NOCICEPTIVO: Aumentando saturación fractal al ${Math.floor(immersionLoadPct)}% e induciendo Ondas Delta profundas (${deltaHz.toFixed(1)}Hz).`, ...prev.slice(0, 8)]);
            }
          } else {
            // Si el dolor está controlado, la IA mantiene el estado de forma eficiente
            setDeltaHz(prev => Math.min(4.0, prev + 0.05));
            if (Math.random() > 0.85) {
              setAiLogs(prev => [`[${timeStr}] ESTABILIDAD: Compuerta nociceptiva bloqueada. Dolor estimado EVA: ${simulatedPainSpike.toFixed(1)}. Modulación vagal activa.`, ...prev.slice(0, 8)]);
            }
          }
        }

        // Límite de Seguridad (Cortocircuito si el dolor es refractario extremo)
        if (newGsr > 8.0) {
          setSafetyTriggered(true);
          setSessionActive(false);
          alert(`⚠️ ALERTA: Respuesta galvánica crítica (${newGsr.toFixed(1)} µS). Dolor refractario al bloqueo inmersivo. Evaluando rescate farmacológico.`);
        }

      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, aiAutoPilot, currentPainLevel, immersionLoadPct, gsr, deltaHz, safetyTriggered]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSessionActive(true);
    setCurrentPainLevel(baselinePain);
    setImmersionLoadPct(10);
    setDeltaHz(4.0); // Inicio en el borde de Theta/Delta
    setAiLogs([`[SISTEMA] Iniciando Protocolo de Analgesia Inmersiva. Calibrando ancho de banda atencional...`]);
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setSafetyTriggered(true);
    setImmersionLoadPct(0);
    setAiLogs(prev => [`[EMERGENCIA] Desconexión manual. Suspendiendo bloqueo nociceptivo visual.`, ...prev]);
  };

  const getConditionName = (cond: PainCondition) => {
    const map = {
      'PHANTOM_LIMB': 'Dolor de Miembro Fantasma',
      'FIBROMYALGIA': 'Fibromialgia / Dolor Crónico Generalizado',
      'ONCOLOGY_PAIN': 'Dolor Oncológico Refractario',
      'SEVERE_BURN': 'Desbridamiento de Quemaduras Severas',
      'NEUROPATHY': 'Neuropatía Diabética / Periférica'
    };
    return map[cond];
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. HEADER */}
      <div className="h-16 border-b border-cyan-900/50 bg-slate-900 flex items-center justify-between px-6 shadow-[0_4px_30px_rgba(8,145,178,0.15)] z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 rounded-xl text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]">
            <ThermometerSnowflake className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Analgesia Inmersiva & Modulación del Dolor (Zero-Opioid VR)
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-2">
              Paciente: <strong className="text-white">{patient.name || 'PAC-8104'}</strong> | Bloqueo Cortical Mediado por IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              aiAutoPilot 
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Brain className={`w-3.5 h-3.5 ${aiAutoPilot ? 'animate-pulse text-cyan-400' : ''}`} />
            {aiAutoPilot ? 'AI Nociceptive Auto-Pilot Activo' : 'Control Analgésico Manual'}
          </button>

          <button
            onClick={handleEmergencyEgress}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" /> Egress (Abortar)
          </button>

          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        
        {/* LEFT PANEL: Setup Clínico */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Target className="w-4 h-4 text-cyan-400" /> Perfil Analgésico del Paciente
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Patología / Origen del Dolor</label>
              <select 
                disabled={sessionActive}
                value={painCondition}
                onChange={(e) => setPainCondition(e.target.value as PainCondition)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold focus:border-cyan-500 outline-none disabled:opacity-50"
              >
                <option value="PHANTOM_LIMB">Dolor de Miembro Fantasma</option>
                <option value="FIBROMYALGIA">Fibromialgia / Dolor Generalizado</option>
                <option value="ONCOLOGY_PAIN">Dolor Oncológico Refractario</option>
                <option value="SEVERE_BURN">Manejo de Quemaduras Severas</option>
                <option value="NEUROPATHY">Neuropatía Diabética / Periférica</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Dolor Inicial (EVA 0-10)</label>
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input 
                  type="range" min="1" max="10" step="0.5"
                  value={baselinePain}
                  disabled={sessionActive}
                  onChange={(e) => setBaselinePain(parseFloat(e.target.value))}
                  className="flex-1 accent-rose-500 cursor-pointer disabled:opacity-40"
                />
                <span className="text-rose-400 font-bold font-mono text-sm">{baselinePain.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Entorno Virtual (Metáfora de Frío/Calma)</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'GLACIAL_FRACTALS', name: 'Fractales Glaciares (Recomendado Burn/Pain)' },
                  { id: 'DEEP_OCEAN_ABYSS', name: 'Abismo Oceánico Profundo (Flotabilidad)' },
                  { id: 'CRYSTAL_CAVE', name: 'Cueva de Cristal Resonante' }
                ].map(env => (
                  <button
                    key={env.id}
                    disabled={sessionActive}
                    onClick={() => setVisualMetaphor(env.id as VisualMetaphor)}
                    className={`text-left p-2.5 rounded-lg text-[10.5px] font-semibold border transition ${
                      visualMetaphor === env.id
                        ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {env.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 mt-4">
            <span className="text-[10px] font-bold text-cyan-400 uppercase block">Racional Clínico (Gate Control):</span>
            <p className="text-[10.5px] text-slate-300 leading-snug">
              Al saturar la corteza visual con geometría fractal compleja y sincronizar el cerebro en ondas Delta (1-4 Hz), se agota el ancho de banda atencional, bloqueando físicamente el paso de señales nociceptivas espinotalámicas.
            </p>
          </div>
        </div>

        {/* CENTER PANEL: POV y Telemetría del Dolor */}
        <div className="col-span-12 lg:col-span-6 bg-[#050B14] rounded-2xl border-2 border-slate-800 relative flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
          
          {/* Overlay Status del Visor */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-xs font-mono text-cyan-100">
              <Video className={`w-3.5 h-3.5 ${sessionActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              Visor: {getConditionName(painCondition)} | Entorno: <span className="font-bold">{visualMetaphor}</span>
            </div>
          </div>

          {/* Renderizador de Escena (Metáfora Glaciar) */}
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {sessionActive ? (
              <div className="text-center space-y-6 relative z-10">
                {/* Visualizador de Saturación Fractal (Gate Control) */}
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-[2px] border-cyan-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-2 border-[4px] border-blue-500/30 rounded-full animate-spin" style={{ animationDuration: `${(5 / deltaHz).toFixed(1)}s` }} />
                  <div className="absolute inset-6 border-[2px] border-dashed border-indigo-400/50 rounded-full animate-spin-slow reverse" />
                  <Snowflake className="w-16 h-16 text-cyan-300" style={{ opacity: immersionLoadPct / 100 }} />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-cyan-200 font-mono tracking-widest uppercase">
                    Bloqueo Nociceptivo Activo
                  </h3>
                  <p className="text-xs text-cyan-400/80 font-mono mt-2">
                    Saturación Sensorial (Compuerta): {Math.floor(immersionLoadPct)}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 relative z-10">
                <ThermometerSnowflake className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-400 max-w-sm">
                  Visor en reposo. Inicie el protocolo para comenzar la saturación sensorial y la inducción de analgesia profunda en ondas Delta.
                </p>
              </div>
            )}
          </div>

          {/* HUD Inferior de Monitorización Analgésica */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-xl border border-cyan-900/50 rounded-xl p-3 grid grid-cols-4 gap-2 shadow-2xl z-10 text-center font-mono">
            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Dolor Percibido (EVA)</span>
              <div className={`text-xl font-bold ${currentPainLevel > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {currentPainLevel.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">/ 10</span>
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1 flex items-center justify-center gap-1"><AudioWaveform className="w-3 h-3"/> Binaural Delta</span>
              <div className="text-xl font-bold text-blue-400">
                {deltaHz.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">Hz</span>
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1 flex items-center justify-center gap-1"><HeartPulse className="w-3 h-3"/> Tono Vagal (HRV)</span>
              <div className="text-xl font-bold text-cyan-300">
                {hrv.toFixed(0)} <span className="text-[10px] font-normal text-slate-500">ms</span>
              </div>
            </div>

            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1 flex items-center justify-center gap-1"><Activity className="w-3 h-3"/> Estrés (GSR)</span>
              <div className="text-xl font-bold text-purple-300">
                {gsr.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">µS</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: IA Closed-Loop y Controles */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Analgesia AI Engine
            </h2>

            {/* Bitácora de la IA Analgésica */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] leading-relaxed flex flex-col gap-2 overflow-y-auto max-h-[300px] relative shadow-inner">
              <div className="absolute top-2 right-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              </div>

              {aiLogs.length > 0 ? (
                aiLogs.map((log, i) => (
                  <div key={i} className={`p-2 rounded border ${
                    i === 0 
                      ? (log.includes('PICO') ? 'text-rose-300 bg-rose-950/20 border-rose-900/50' : 'text-cyan-300 bg-cyan-950/30 border-cyan-900/50') 
                      : 'text-slate-400 border-slate-800/60'
                  }`}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-center p-4">
                  A la espera de activación del motor analgésico inmersivo...
                </div>
              )}
            </div>

            {/* Controles Manuales del Terapeuta */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Carga de Inmersión Fractal:</span>
                  <span className="text-cyan-400 font-mono">{Math.floor(immersionLoadPct)}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={immersionLoadPct}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setImmersionLoadPct(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer disabled:opacity-30"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Frecuencia Binaural (Delta):</span>
                  <span className="text-blue-400 font-mono">{deltaHz.toFixed(1)} Hz</span>
                </div>
                <input 
                  type="range" min="1.0" max="6.0" step="0.1"
                  value={deltaHz}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setDeltaHz(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer disabled:opacity-30"
                />
              </div>
            </div>
          </div>

          {/* Botones de Control de Sesión */}
          <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-600/20 transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Analgesia Inmersiva
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
