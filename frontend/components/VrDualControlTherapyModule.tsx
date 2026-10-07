import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Wifi, WifiOff, X, RefreshCw, Plus, ShieldAlert, Target, Sun } from 'lucide-react';

// IMPORTACIONES DE WEBXR PARA LOS NUEVOS MÓDULOS 360
import { VRButton, XR, Controllers } from '@react-three/xr';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sphere, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  patientId?: string;
  onClose: () => void;
}

type EnvironmentType = 
  | 'IDLE' 
  | 'TDAH_EXECUTIVE' 
  | 'TEA_SOCIAL' 
  | 'TDM_DEPRESSION' 
  | 'TAG_ANXIETY'
  // MÓDULOS 360 Inmersivos (WebXR)
  | 'NEURO_HYPNOSIS' 
  | 'DUAL_CONTROL' 
  | 'DEV_TRAUMA' 
  | 'EMDR_MEMORY' 
  | 'GAMMA_INSIGHT' 
  | 'PAIN_MANAGEMENT';

export const VrPatientExperience: React.FC<Props> = ({ patientId = 'PAC-8104', onClose }) => {
  const { isConnected, remoteCommand, liveData, syncSession, transmit } = useVrTelemetryBridge('sender', patientId, 'HOLODECK_IDLE');

  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentType>('IDLE');
  
  // Estados para el Motor WebXR (Fotos 360, Videos 360 y EMDR)
  const [activeEcosystem, setActiveEcosystem] = useState<string>('NEUTRAL_VOID');
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isEmdrActive, setIsEmdrActive] = useState<boolean>(false);
  const [emdrHz, setEmdrHz] = useState<number>(1.5);

  // ============================================================================
  // 1. LÓGICA DE AUDIO INMERSIVO AUTOMÁTICO
  // ============================================================================
  useEffect(() => {
    // Evitamos reproducir audio en el vacío neutral o en la sala de espera
    if (activeEcosystem === 'NEUTRAL_VOID' || activeEnvironment === 'IDLE') return;

    // Busca un archivo .mp3 con el MISMO nombre que el ecosistema/imagen
    const audio = new Audio(`/audio/${activeEcosystem}.mp3`);
    audio.loop = true; // Bucle continuo
    audio.volume = 0.8; // Volumen al 80% para no aturdir

    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn(`Audio silenciado o no encontrado para: /audio/${activeEcosystem}.mp3`, error);
      });
    }

    // Al cambiar de escenario, detenemos el audio actual y limpiamos memoria
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [activeEcosystem, activeEnvironment]);

  // ============================================================================
  // 2. ENRUTADOR PRINCIPAL DEL HOLODECK Y TELEMETRÍA
  // ============================================================================
  useEffect(() => {
    if (!liveData) return;

    if (liveData.type === 'LOAD_MODULE') {
      setActiveEnvironment(liveData.moduleName as EnvironmentType);
      if (liveData.ecosystem) {
        setActiveEcosystem(liveData.ecosystem);
        setIsVideo(!!liveData.isVideo);
      }
    } 
    else if (liveData.type === 'START_AIMA_PROTOCOL') {
      if (liveData.ecosystem) {
        setActiveEcosystem(liveData.ecosystem);
        setIsVideo(false);
      }
    }
    else if (liveData.type === 'START_BILATERAL_STIMULATION') {
      setIsEmdrActive(true);
      if (liveData.initialHz) setEmdrHz(liveData.initialHz);
      if (liveData.ecosystem) {
        setActiveEcosystem(liveData.ecosystem);
        setIsVideo(!!liveData.isVideo);
      }
    }
    else if (liveData.type === 'STOP_TEST' || liveData.type === 'TRIGGER_GROUNDING_PROTOCOL') {
      setActiveEnvironment('IDLE');
      setIsEmdrActive(false);
      setIsVideo(false);
    }
  }, [liveData]);

  // Determinar si el módulo actual requiere el motor WebXR 360
  const isWebXRModule = [
    'DUAL_CONTROL', 'DEV_TRAUMA', 'EMDR_MEMORY', 'NEURO_HYPNOSIS', 'GAMMA_INSIGHT', 'PAIN_MANAGEMENT'
  ].includes(activeEnvironment);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white select-none touch-none overflow-hidden">
      
      {/* BOTÓN DE EMERGENCIA */}
      <button 
        onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 p-4 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 z-[10000] cursor-pointer backdrop-blur-md"
      >
        <X className="w-8 h-8" />
      </button>

      {/* ------------------------------------------------------------- */}
      {/* RENDERIZADO DEL MOTOR WEBXR (Entornos 360 y Video Pico 3) */}
      {/* ------------------------------------------------------------- */}
      {isWebXRModule && (
        <div className="absolute inset-0 z-[100]">
          <div className="absolute z-10 bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
             {/* El VRButton nativo de React Three Fiber para activar las Pico 3 */}
             <VRButton className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.5)] transition uppercase tracking-widest cursor-pointer" />
          </div>
          <Canvas>
            <XR>
              <Controllers />
              <Suspense fallback={null}>
                {isVideo ? (
                  // Carga los .mp4 desde la carpeta /video de tu GitHub
                  <VideoSphere url={`/video/${activeEcosystem}.mp4`} />
                ) : (
                  // Carga los .jpg desde la carpeta /ecosystems de tu GitHub
                  <Environment background={true} files={`/ecosystems/${activeEcosystem}.jpg`} />
                )}
              </Suspense>
              {isEmdrActive && <WebXrEmdrTarget hz={emdrHz} />}
            </XR>
          </Canvas>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RENDERIZADO DE ENTORNOS 2D CLÁSICOS (HTML/CSS DOM)          */}
      {/* ------------------------------------------------------------- */}
      {!isWebXRModule && (
        <>
          {activeEnvironment === 'IDLE' && <IdleWaitingRoom isConnected={isConnected} syncSession={syncSession} />}
          {activeEnvironment === 'TDAH_EXECUTIVE' && <AdhdExecutiveEnvironment remoteCommand={remoteCommand} transmit={transmit} />}
          {activeEnvironment === 'TAG_ANXIETY' && <ExposureAnxietyEnvironment liveData={liveData} />}
          {activeEnvironment === 'TEA_SOCIAL' && <SocialCognitionEnvironment liveData={liveData} />}
          {activeEnvironment === 'TDM_DEPRESSION' && <DepressionEnvironment liveData={liveData} transmit={transmit} />}
        </>
      )}
      
      {/* OVERLAY DE SEGURIDAD (Grounding Protocol - Se sobrepone a todo) */}
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
// COMPONENTES WEBXR (3D REALIDAD VIRTUAL INMERSIVA)
// ============================================================================

const WebXrEmdrTarget = ({ hz }: { hz: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      meshRef.current.position.x = Math.sin(time * Math.PI * hz) * 3;
    }
  });
  return (
    <Sphere ref={meshRef} args={[0.15, 32, 32]} position={[0, 1.5, -4]}>
      <meshBasicMaterial color="#a855f7" />
    </Sphere>
  );
};

const VideoSphere = ({ url }: { url: string }) => {
  const texture = useVideoTexture(url);
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
};

// ============================================================================
// COMPONENTES 2D LEGACY (HTML/CSS)
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
          <div className="w-64 h-80 bg-slate-800 rounded-full border-4 border-slate-700 flex flex-col items-center pt-24 relative overflow-hidden shadow-2xl">
            <div className="flex gap-8 mb-12 z-10">
              <div className={`w-10 h-10 rounded-full ${phase === 'OVERSTIMULATION' ? 'bg-rose-500 animate-pulse' : 'bg-sky-400'}`}>
                 <div className="w-4 h-4 bg-black rounded-full ml-3 mt-3"></div>
              </div>
              <div className={`w-10 h-10 rounded-full ${phase === 'OVERSTIMULATION' ? 'bg-rose-500 animate-pulse' : 'bg-sky-400'}`}>
                 <div className="w-4 h-4 bg-black rounded-full ml-3 mt-3"></div>
              </div>
            </div>
            <div className="w-16 h-2 bg-slate-600 rounded-full z-10"></div>
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

const DepressionEnvironment = ({ liveData, transmit }: any) => {
  const [phase, setPhase] = useState<'IDLE' | 'MOTOR' | 'REWARD'>('IDLE');
  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    if (liveData?.type === 'START_MOTOR_TRACKING') setPhase('MOTOR');
    if (liveData?.type === 'START_REWARD_STIMULUS') setPhase('REWARD');
  }, [liveData]);

  const handleTouchTarget = () => {
    transmit({ type: 'MOTOR_TARGET_HIT', timestamp: Date.now() });
    setTargetPos({ top: `${Math.random() * 60 + 20}%`, left: `${Math.random() * 60 + 20}%` });
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

const ExposureAnxietyEnvironment = ({ liveData }: any) => {
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (liveData?.type === 'START_EXPOSURE' || liveData?.type === 'UPDATE_EXPOSURE_LEVEL') {
      setLevel(liveData.level || 1);
    }
  }, [liveData]);

  const tunnelScale = 1 - (level * 0.15);
  const vignetteOpacity = level * 0.2;
  const colorIntensity = level > 3 ? 'border-rose-900' : 'border-slate-800';

  return (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
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
      
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,black_100%)] pointer-events-none" style={{ opacity: vignetteOpacity }}></div>
      <div className="absolute top-10 left-10 text-slate-500 font-mono text-sm">INTENSIDAD FÓBICA: NIVEL {level}</div>
    </div>
  );
};
