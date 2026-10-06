import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Play, Wifi, WifiOff, X, RefreshCw, Plus, Infinity } from 'lucide-react';

interface Props {
  patientId?: string;
  onClose: () => void;
}

export const VrPatientExperience: React.FC<Props> = ({ patientId = 'PAC-8104', onClose }) => {
  // Ahora el visor escucha de forma genérica, no solo 'ExecutiveControl'
  const { isConnected, remoteCommand, liveData, syncSession, transmit } = useVrTelemetryBridge('sender', patientId, 'HOLODECK_IDLE');

  const [activeEnvironment, setActiveEnvironment] = useState<'IDLE' | 'TDAH_EXECUTIVE' | 'NEURO_HYPNOSIS'>('IDLE');
  
  // Escuchar comandos del servidor para cambiar el entorno VR
  useEffect(() => {
    if (liveData?.type === 'LOAD_MODULE') {
      setActiveEnvironment(liveData.moduleName as any);
    } else if (liveData?.type === 'STOP_TEST') {
      setActiveEnvironment('IDLE');
    }
  }, [liveData]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white select-none touch-none overflow-hidden">
      
      {/* Botón de Emergencia / Salida */}
      <button 
        onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 p-4 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 z-[10000] cursor-pointer backdrop-blur-md"
      >
        <X className="w-8 h-8" />
      </button>

      {/* ENRUTADOR DE ENTORNOS VR */}
      {activeEnvironment === 'IDLE' && (
        <IdleWaitingRoom isConnected={isConnected} syncSession={syncSession} />
      )}

      {activeEnvironment === 'TDAH_EXECUTIVE' && (
        <AdhdExecutiveEnvironment patientId={patientId} remoteCommand={remoteCommand} transmit={transmit} />
      )}

      {activeEnvironment === 'NEURO_HYPNOSIS' && (
        <HypnosisEnvironment patientId={patientId} remoteCommand={remoteCommand} transmit={transmit} />
      )}

    </div>
  );
};

// ============================================================================
// 1. SALA DE ESPERA NEUTRAL (Carga cero, previene mareos)
// ============================================================================
const IdleWaitingRoom = ({ isConnected, syncSession }: { isConnected: boolean, syncSession: () => void }) => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center">
    <div className="text-center space-y-6 max-w-xl p-8 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-2xl">
      <div className="flex justify-center items-center gap-3">
        <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 ${
          isConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
        }`}>
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
// 2. ENTORNO TDAH (El Go/No-Go que ya tenías optimizado)
// ============================================================================
const AdhdExecutiveEnvironment = ({ patientId, remoteCommand, transmit }: any) => {
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

    if (stimulus === 'GO') {
      stats.current.hits++; stats.current.lastReaction = rt;
    } else {
      stats.current.commissions++;
    }
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
// 3. NUEVO: ENTORNO NEUROHIPNOSIS (Modulación Vagal)
// ============================================================================
const HypnosisEnvironment = ({ remoteCommand, transmit }: any) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (remoteCommand === 'START_TEST') setIsActive(true);
  }, [remoteCommand]);

  // Simulación de envío de biometría vagal (HRV simulado para el ejemplo)
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      transmit({ metrics: { vagalToneHrvIndex: Math.random() * 20 + 60, stressLevel: Math.random() * 10 }});
    }, 2000);
    return () => clearInterval(interval);
  }, [isActive, transmit]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
      {!isActive ? (
         <div className="text-indigo-400 font-light text-xl animate-pulse">Preparando inducción inmersiva...</div>
      ) : (
        <div className="relative flex items-center justify-center w-full h-full">
           {/* Patrón de respiración (Glow expansivo) */}
           <div className="absolute w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[100px] animate-[ping_8s_ease-in-out_infinite]"></div>
           <div className="absolute w-[300px] h-[300px] bg-sky-600/40 rounded-full blur-[50px] animate-[ping_8s_ease-in-out_infinite_reverse]"></div>
           
           {/* Punto focal de fijación hipnótica */}
           <Infinity className="w-24 h-24 text-sky-200 opacity-80 animate-pulse drop-shadow-[0_0_15px_rgba(186,230,253,1)]" strokeWidth={1} />
        </div>
      )}
    </div>
  );
};
