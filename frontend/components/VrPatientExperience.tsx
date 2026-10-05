import React, { useState, useEffect, useRef } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Play, Wifi, WifiOff, X } from 'lucide-react';

interface Props {
  patientId?: string;
  onClose: () => void;
}

type StimulusType = 'NONE' | 'GO' | 'NOGO';

export const VrPatientExperience: React.FC<Props> = ({ patientId = 'PAC-8104', onClose }) => {
  // EMISOR DE TELEMETRÍA DESDE EL VISOR
  const { isConnected, transmit } = useVrTelemetryBridge('sender', patientId, 'ExecutiveControl');

  const [sessionActive, setSessionActive] = useState(false);
  const [stimulus, setStimulus] = useState<StimulusType>('NONE');
  
  const stats = useRef({ hits: 0, omissions: 0, commissions: 0, lastReaction: 0 });
  const showTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleNextStimulus = () => {
    setStimulus('NONE');
    const delay = Math.random() * 2000 + 1000;
    
    timeoutRef.current = setTimeout(() => {
      const isGo = Math.random() > 0.25; // 75% GO (Verde), 25% NO-GO (Rojo)
      setStimulus(isGo ? 'GO' : 'NOGO');
      showTimeRef.current = Date.now();

      if (isGo) {
        timeoutRef.current = setTimeout(() => {
          stats.current.omissions++;
          sendTelemetry(0, Math.max(10, 50 - stats.current.omissions));
          scheduleNextStimulus();
        }, 1500);
      } else {
        timeoutRef.current = setTimeout(() => {
          scheduleNextStimulus();
        }, 1500);
      }
    }, delay);
  };

  const handleInteract = () => {
    if (!sessionActive || stimulus === 'NONE') return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const reactionTime = Date.now() - showTimeRef.current;

    if (stimulus === 'GO') {
      stats.current.hits++;
      stats.current.lastReaction = reactionTime;
      sendTelemetry(reactionTime, Math.min(100, 50 + stats.current.hits * 2));
    } else if (stimulus === 'NOGO') {
      stats.current.commissions++;
      sendTelemetry(reactionTime, Math.max(10, 50 - stats.current.commissions * 5));
    }
    
    scheduleNextStimulus();
  };

  const sendTelemetry = (reactionTimeMs: number, engagement: number) => {
    transmit({
      reactionTimeMs: reactionTimeMs,
      omissions: stats.current.omissions,
      commissions: stats.current.commissions,
      hits: stats.current.hits,
      habituationIndex: engagement
    });
  };

  const startGame = () => {
    setSessionActive(true);
    stats.current = { hits: 0, omissions: 0, commissions: 0, lastReaction: 0 };
    scheduleNextStimulus();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center select-none"
      onClick={handleInteract}
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 z-50 cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      {!sessionActive ? (
        <div className="text-center space-y-6 max-w-xl p-8 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex justify-center">
            <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 ${
              isConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}>
              {isConnected ? <Wifi className="w-4 h-4 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
              <span>{isConnected ? 'Sincronizado con Consola Médica' : 'Buscando Consola...'}</span>
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">Entorno Inmersivo del Paciente</h1>
          
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-sm text-slate-300 text-left space-y-2 font-sans">
            <p className="font-bold text-sky-400">Instrucciones de la Prueba:</p>
            <p>1. Cuando veas el círculo <span className="text-emerald-400 font-bold">VERDE</span>, presiona el gatillo del control lo más rápido posible.</p>
            <p>2. Cuando veas el círculo <span className="text-rose-500 font-bold">ROJO</span>, no presiones nada.</p>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); startGame(); }}
            disabled={!isConnected}
            className="w-full py-4 bg-sky-600 disabled:bg-slate-800 hover:bg-sky-500 text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            Comenzar Prueba
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          {stimulus === 'GO' && (
            <div className="w-72 h-72 bg-emerald-500 rounded-full shadow-[0_0_120px_rgba(16,185,129,0.8)] animate-in zoom-in-50 duration-150"></div>
          )}
          {stimulus === 'NOGO' && (
            <div className="w-72 h-72 bg-rose-600 rounded-full shadow-[0_0_120px_rgba(225,29,72,0.8)] animate-in zoom-in-50 duration-150"></div>
          )}
          {stimulus === 'NONE' && (
            <div className="w-6 h-6 bg-slate-700 rounded-full animate-pulse"></div>
          )}
        </div>
      )}
    </div>
  );
};
