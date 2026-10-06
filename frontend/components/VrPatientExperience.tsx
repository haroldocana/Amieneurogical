import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Play, Wifi, WifiOff, X, RefreshCw, Plus } from 'lucide-react';

interface Props {
  patientId?: string;
  onClose: () => void;
}

type StimulusType = 'NONE' | 'GO' | 'NOGO';

export const VrPatientExperience: React.FC<Props> = ({ patientId = 'PAC-8104', onClose }) => {
  const { isConnected, remoteCommand, syncSession, transmit } = useVrTelemetryBridge('sender', patientId, 'ExecutiveControl');

  const [sessionActive, setSessionActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [stimulus, setStimulus] = useState<StimulusType>('NONE');
  const [flashFeedback, setFlashFeedback] = useState(false);
  
  const stats = useRef({ hits: 0, omissions: 0, commissions: 0, lastReaction: 0 });
  const showTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearActiveTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const scheduleNextStimulus = () => {
    setStimulus('NONE');
    clearActiveTimeout();
    
    const delay = Math.random() * 1500 + 1000;
    
    timeoutRef.current = setTimeout(() => {
      const isGo = Math.random() > 0.25;
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

  const handleInteract = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    if (!sessionActive) return;

    setFlashFeedback(true);
    setTimeout(() => setFlashFeedback(false), 100);

    if (stimulus === 'NONE') return;

    clearActiveTimeout();
    const reactionTime = Date.now() - showTimeRef.current;
    setStimulus('NONE');

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

  const startSequence = useCallback(() => {
    clearActiveTimeout();
    setSessionActive(true);
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        stats.current = { hits: 0, omissions: 0, commissions: 0, lastReaction: 0 };
        scheduleNextStimulus();
      }
    }, 1000);
  }, []);

  useEffect(() => {
    if (remoteCommand === 'START_TEST' && !sessionActive) {
      startSequence();
    }
  }, [remoteCommand, sessionActive, startSequence]);

  useEffect(() => {
    return () => clearActiveTimeout();
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white flex flex-col items-center justify-center select-none touch-none"
      onPointerDown={handleInteract}
    >
      {flashFeedback && <div className="absolute inset-0 bg-white/10 z-0 pointer-events-none transition-opacity duration-75"></div>}

      <button 
        onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 p-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 z-[10000] cursor-pointer"
      >
        <X className="w-8 h-8" />
      </button>

      {!sessionActive ? (
        <div className="text-center space-y-6 max-w-xl p-8 bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-700 shadow-2xl z-[10000]">
          <div className="flex justify-center items-center gap-3">
            <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 ${
              isConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}>
              {isConnected ? <Wifi className="w-4 h-4 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
              <span>{isConnected ? 'Sincronizado con Consola Médica' : 'Buscando Red...'}</span>
            </div>

            <button
              onPointerDown={(e) => { e.stopPropagation(); syncSession(); }}
              onClick={(e) => { e.stopPropagation(); syncSession(); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-full border border-slate-700 cursor-pointer transition active:scale-95"
              title="Forzar re-sincronización"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">Entorno Inmersivo VR</h1>
          
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm text-slate-300 text-left space-y-2 font-sans">
            <p className="font-bold text-sky-400">Instrucciones:</p>
            <p>1. Mantén la mirada fija en la <span className="font-bold text-white">cruz central (+)</span>.</p>
            <p>2. Presiona el gatillo al ver el círculo <span className="text-emerald-400 font-bold">VERDE</span>.</p>
            <p>3. NO presiones nada si ves el círculo <span className="text-rose-500 font-bold">ROJO</span>.</p>
          </div>

          <button 
            onPointerDown={(e) => { e.stopPropagation(); startSequence(); }}
            onClick={(e) => { e.stopPropagation(); startSequence(); }}
            className="w-full py-5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-2xl text-xl font-black flex items-center justify-center gap-3 transition cursor-pointer shadow-xl shadow-sky-600/30"
          >
            <Play className="w-6 h-6 fill-current" />
            Comenzar Prueba
          </button>
        </div>
      ) : (
        <div className="relative flex flex-col items-center justify-center w-full h-full cursor-pointer z-10">
          
          {countdown !== null && (
            <div className="text-9xl font-black text-sky-400 animate-ping">
              {countdown}
            </div>
          )}

          {countdown === null && stimulus === 'NONE' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <Plus className="w-16 h-16 text-slate-400" strokeWidth={1} />
            </div>
          )}

          {countdown === null && stimulus === 'GO' && (
            <div className="w-80 h-80 bg-emerald-500 rounded-full shadow-[0_0_150px_rgba(16,185,129,0.9)] animate-in zoom-in-50 duration-75"></div>
          )}

          {countdown === null && stimulus === 'NOGO' && (
            <div className="w-80 h-80 bg-rose-600 rounded-full shadow-[0_0_150px_rgba(225,29,72,0.9)] animate-in zoom-in-50 duration-75"></div>
          )}
        </div>
      )}
    </div>
  );
};
