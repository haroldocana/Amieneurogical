import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Wifi, WifiOff, X, RefreshCw, Plus, Infinity, ShieldAlert, ScanFace, Target, Sun } from 'lucide-react';

interface Props {
  patientId?: string;
  onClose: () => void;
}

export const VrPatientExperience: React.FC<Props> = ({ patientId = 'PAC-8104', onClose }) => {
  const { isConnected, remoteCommand, liveData, syncSession, transmit } = useVrTelemetryBridge('sender', patientId, 'HOLODECK_IDLE');

  type EnvironmentType = 'IDLE' | 'TDAH_EXECUTIVE' | 'NEURO_HYPNOSIS' | 'TAG_ANXIETY' | 'TEA_SOCIAL' | 'TDM_DEPRESSION';
  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentType>('IDLE');
  
  // Enrutador Principal del Holodeck
  useEffect(() => {
    if (liveData?.type === 'LOAD_MODULE') {
      setActiveEnvironment(liveData.moduleName as EnvironmentType);
    } else if (liveData?.type === 'STOP_TEST' || liveData?.type === 'TRIGGER_GROUNDING_PROTOCOL') {
      setActiveEnvironment('IDLE');
    }
  }, [liveData]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white select-none touch-none overflow-hidden">
      {/* BOTÓN DE EMERGENCIA */}
      <button 
        onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 p-4 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 z-[10000] cursor-pointer backdrop-blur-md"
      >
        <X className="w-8 h-8" />
      </button>

      {/* RENDERIZADO DINÁMICO DE ENTORNOS */}
      {activeEnvironment === 'IDLE' && <IdleWaitingRoom isConnected={isConnected} syncSession={syncSession} />}
      {activeEnvironment === 'TDAH_EXECUTIVE' && <AdhdExecutiveEnvironment remoteCommand={remoteCommand} transmit={transmit} />}
      {activeEnvironment === 'NEURO_HYPNOSIS' && <HypnosisEnvironment liveData={liveData} />}
      {activeEnvironment === 'TAG_ANXIETY' && <ExposureAnxietyEnvironment liveData={liveData} />}
      {activeEnvironment === 'TEA_SOCIAL' && <SocialCognitionEnvironment liveData={liveData} />}
      {activeEnvironment === 'TDM_DEPRESSION' && <DepressionEnvironment liveData={liveData} transmit={transmit} />}
      
      {/* OVERLAY DE SEGURIDAD (Si el médico activa el Grounding desde cualquier consola) */}
      {liveData?.type === 'TRIGGER_GROUNDING_PROTOCOL' && (
        <div className="absolute inset-0 bg-slate-900 z-[9000] flex flex-col items-center justify-center animate-in fade-in duration-500">
           <ShieldAlert className="w-24 h-24 text-sky-400 mb-8 animate-bounce" />
           <h1 className="text-5xl font-black text-white tracking-widest mb-4">RESPIRA LENTAMENTE</h1>
           <div className="flex items-center gap-4 text-2xl text-slate-300 font-mono bg-slate-950 px-8 py-4 rounded-2xl border border-slate-800">
             <span>INHALA (4s)</span> <span className="animate-pulse text-sky-400">---</span> <span>EXHALA (6s)</span>
           </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 0. SALA DE ESPERA NEUTRAL
// ============================================================================
const IdleWaitingRoom = ({ isConnected, syncSession }: { isConnected: boolean, syncSession: () => void }) => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center transition-colors duration-1000">
    <div className="text-center space-y-6 max-w-xl p-8 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-2xl">
      <div className="flex justify-center items-center gap-3">
        <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 ${isConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border-rose-500/50 text-rose-300'}`}>
          {isConnected ? <Wifi className="w-4 h-4 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
          <span>{isConnected ? 'Sincronizado con Consola Médica' : 'Buscando Red...'}</span>
        </div>
        <button onPointerDown={syncSession} className="p-2 bg-slate-800 text-sky-400 rounded-full border border-slate-700 active:scale-95"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <h1 className="text-2xl font-light tracking-wide text-slate-300">Sala de Reposo Inmersiva</h1>
      <p className="text-slate-500 text-sm">Aguarde un momento. El profesional cargará su entorno clínico en breve.</p>
    </div>
  </div>
);

// ============================================================================
// 1. ENTORNO TDAH (Función Ejecutiva Go/No-Go)
// ============================================================================
const AdhdExecutiveEnvironment = ({ remoteCommand, transmit }: any) => {
  const [stimulus, setStimulus] = useState<'NONE' | 'GO' | 'NOGO'>('NONE');
  const [flash, setFlash] = useState(false);
  const stats = useRef({ hits: 0, omissions: 0, commissions: 0, lastReaction: 0 });
  const showTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleNext = useCallback(() => {
    setStimulus('NONE');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const isGo = Math.random() > 0.25;
      setStimulus(isGo ? 'GO' : 'NOGO');
      showTime.current = Date.now();
      timeoutRef.current = setTimeout(() => {
        if (isGo) {
          stats.current.omissions++;
          transmit({ ...stats.current, reactionTimeMs: stats.current.lastReaction });
        }
        scheduleNext();
      }, 1500);
    }, Math.random() * 1500 + 1000);
  }, [transmit]);

  useEffect(() => {
    if (remoteCommand === 'START_TEST') scheduleNext();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [remoteCommand, scheduleNext]);

  const handleInteract = () => {
    setFlash(true); setTimeout(() => setFlash(false), 100);
    if (stimulus === 'NONE') return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rt = Date.now() - showTime.current;
    setStimulus('NONE');
    if (stimulus === 'GO') { stats.current.hits++; stats.current.lastReaction = rt; } 
    else { stats.current.commissions++; }
    transmit({ ...stats.current, reactionTimeMs: stats.current.lastReaction });
    scheduleNext();
  };

  return (
    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center cursor-crosshair" onPointerDown={handleInteract}>
      {flash && <div className="absolute inset-0 bg-white/10 z-0"></div>}
      {stimulus === 'NONE' && <Plus className="w-16 h-16 text-slate-600 opacity-50" strokeWidth={1} />}
      {stimulus === 'GO' && <div className="w-80 h-80 bg-emerald-500 rounded-full shadow-[0_0_150px_rgba(16,185,129,0.9)] animate-in zoom-in-50 duration-75"></div>}
      {stimulus === 'NOGO' && <div className="w-80 h-80 bg-rose-600 rounded-full shadow-[0_0_150px_rgba(225,29,72,0.9)] animate-in zoom-in-50 duration-75"></div>}
    </div>
  );
};

// ============================================================================
// 2. ENTORNO HIPNOSIS (Trance y EMDR)
// ============================================================================
const HypnosisEnvironment = ({ liveData }: any) => {
  const [phase, setPhase] = useState<'IDLE' | 'INDUCTION' | 'AWAKENING'>('IDLE');
  const [emdrActive, setEmdrActive] = useState(false);

  useEffect(() => {
    if (liveData?.type === 'START_INDUCTION') setPhase('INDUCTION');
    if (liveData?.type === 'START_AWAKENING') setPhase('AWAKENING');
    if (liveData?.type === 'TOGGLE_EMDR') setEmdrActive(liveData.active);
  }, [liveData]);

  return (
    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[3000ms] ${phase === 'AWAKENING' ? 'bg-gradient-to-t from-amber-600 via-orange-900 to-slate-900' : 'bg-black'}`}>
      {phase === 'INDUCTION' && (
        <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
           <div className="absolute w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[100px] animate-[ping_8s_ease-in-out_infinite]"></div>
           {emdrActive ? (
             <div className="relative w-full max-w-4xl h-32 flex items-center">
               <div className="w-16 h-16 bg-cyan-400 rounded-full blur-sm absolute shadow-[0_0_50px_rgba(34,211,238,1)] animate-[bounce-x_2s_ease-in-out_infinite_alternate]" style={{ animationName: 'emdrSweep', animationDuration: '1.5s', animationIterationCount: 'infinite' }}></div>
             </div>
           ) : (
             <Infinity className="w-24 h-24 text-sky-200 opacity-80 animate-pulse drop-shadow-[0_0_25px_rgba(186,230,253,0.8)]" />
           )}
           <style>{`@keyframes emdrSweep { 0% { left: 0%; transform: scale(1); } 50% { transform: scale(1.2); } 100% { left: calc(100% - 4rem); transform: scale(1); } }`}</style>
        </div>
      )}
      {phase === 'AWAKENING' && (
        <div className="relative flex flex-col items-center justify-center w-full h-full z-10 text-center">
           <div className="w-[800px] h-[800px] bg-amber-400/20 rounded-full blur-[150px] absolute -bottom-96"></div>
           <h2 className="text-4xl font-light text-amber-100/90 tracking-widest mb-4">SINTIENDO LA ENERGÍA REGRESAR</h2>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. NUEVO: ENTORNO TEA (Cognición Social y Sensorial)
// ============================================================================
const SocialCognitionEnvironment = ({ liveData }: any) => {
  const [phase, setPhase] = useState<'IDLE' | 'FACES' | 'OVERSTIMULATION'>('IDLE');

  useEffect(() => {
    if (liveData?.type === 'START_FACES') setPhase('FACES');
    if (liveData?.type === 'START_OVERSTIMULATION') setPhase('OVERSTIMULATION');
  }, [liveData]);

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all ${phase === 'OVERSTIMULATION' ? 'bg-slate-800' : 'bg-slate-950'}`}>
      {phase !== 'IDLE' && (
        <div className={`relative flex flex-col items-center ${phase === 'OVERSTIMULATION' ? 'animate-shake' : ''}`}>
          {/* Avatar Abstracto (Para rastreo de mirada) */}
          <div className="w-64 h-80 bg-slate-800 rounded-full border-4 border-slate-700 flex flex-col items-center pt-24 relative overflow-hidden shadow-2xl">
            {/* Ojos del Avatar (Punto de atención conjunta) */}
            <div className="flex gap-8 mb-12 z-10">
              <div className={`w-10 h-10 rounded-full ${phase === 'OVERSTIMULATION' ? 'bg-rose-500 animate-pulse' : 'bg-sky-400'}`}>
                 <div className="w-4 h-4 bg-black rounded-full ml-3 mt-3"></div>
              </div>
              <div className={`w-10 h-10 rounded-full ${phase === 'OVERSTIMULATION' ? 'bg-rose-500 animate-pulse' : 'bg-sky-400'}`}>
                 <div className="w-4 h-4 bg-black rounded-full ml-3 mt-3"></div>
              </div>
            </div>
            {/* Boca */}
            <div className="w-16 h-2 bg-slate-600 rounded-full z-10"></div>
            
            {/* Ruido Estático de Sobrecarga */}
            {phase === 'OVERSTIMULATION' && (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 mix-blend-overlay"></div>
            )}
          </div>
          <p className="mt-8 text-slate-500 font-mono tracking-widest text-sm">
            {phase === 'FACES' ? 'FASE 1: FIJACIÓN OCULAR' : 'FASE 2: RUIDO AMBIENTAL (75dB)'}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. NUEVO: ENTORNO TDM (Depresión - Latencia Motora y Anhedonia)
// ============================================================================
const DepressionEnvironment = ({ liveData, transmit }: any) => {
  const [phase, setPhase] = useState<'IDLE' | 'MOTOR' | 'REWARD'>('IDLE');
  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    if (liveData?.type === 'START_MOTOR_TRACKING') setPhase('MOTOR');
    if (liveData?.type === 'START_REWARD_STIMULUS') setPhase('REWARD');
  }, [liveData]);

  // Si el paciente toca el objetivo, se mueve a otro lado (Mide bradicinesia)
  const handleTouchTarget = () => {
    transmit({ type: 'MOTOR_TARGET_HIT', timestamp: Date.now() });
    setTargetPos({
      top: `${Math.random() * 60 + 20}%`,
      left: `${Math.random() * 60 + 20}%`
    });
  };

  return (
    <div className="absolute inset-0 bg-slate-950">
      {phase === 'MOTOR' && (
        <div className="absolute inset-0" onPointerDown={handleTouchTarget}>
          <div className="absolute text-slate-500 font-mono text-center w-full top-20">ESTIRE SU BRAZO Y TOQUE LA ESFERA</div>
          <div 
            className="absolute w-24 h-24 bg-indigo-500 rounded-full shadow-[0_0_50px_rgba(99,102,241,0.5)] flex items-center justify-center cursor-pointer transition-all duration-1000 ease-out"
            style={{ top: targetPos.top, left: targetPos.left, transform: 'translate(-50%, -50%)' }}
          >
            <Target className="w-12 h-12 text-white opacity-80" />
          </div>
        </div>
      )}
      
      {phase === 'REWARD' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-900 to-slate-950">
          <div className="w-[500px] h-[500px] bg-yellow-400/20 rounded-full blur-[100px] absolute animate-pulse"></div>
          <Sun className="w-48 h-48 text-yellow-300 animate-[spin_20s_linear_infinite]" />
          <div className="absolute text-xl font-light tracking-widest text-sky-100 mt-64">EVALUANDO REACTIVIDAD AFECTIVA</div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. NUEVO: ENTORNO TAG (Terapia de Exposición a Fobias)
// ============================================================================
const ExposureAnxietyEnvironment = ({ liveData }: any) => {
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (liveData?.type === 'START_EXPOSURE' || liveData?.type === 'UPDATE_EXPOSURE_LEVEL') {
      setLevel(liveData.level || 1);
    }
  }, [liveData]);

  // Simularemos Claustrofobia / Opresión visual
  const tunnelScale = 1 - (level * 0.15); // El tunel se hace más pequeño
  const vignetteOpacity = level * 0.2; // Los bordes se oscurecen más
  const colorIntensity = level > 3 ? 'border-rose-900' : 'border-slate-800';

  return (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Túnel Opresivo que se cierra según el nivel de exposición */}
      <div 
        className={`w-[1000px] h-[1000px] border-[100px] ${colorIntensity} rounded-full transition-all duration-1000 flex items-center justify-center`}
        style={{ transform: `scale(${tunnelScale})` }}
      >
        <div className={`w-[800px] h-[800px] border-[100px] ${colorIntensity} rounded-full flex items-center justify-center opacity-80`}>
          <div className={`w-[600px] h-[600px] border-[100px] ${colorIntensity} rounded-full flex items-center justify-center opacity-60`}>
            {level > 4 && <div className="text-rose-500 font-mono tracking-widest animate-pulse">MANTENGA LA RESPIRACIÓN</div>}
          </div>
        </div>
      </div>
      
      {/* Viñeta de oscurecimiento */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,black_100%)] pointer-events-none" style={{ opacity: vignetteOpacity }}></div>
      
      <div className="absolute top-10 left-10 text-slate-500 font-mono text-sm">
        INTENSIDAD FÓBICA: NIVEL {level}
      </div>
    </div>
  );
};
