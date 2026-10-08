import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Wifi, WifiOff, X, RefreshCw, ShieldAlert } from 'lucide-react';
import { VRButton, XR, Controllers } from '@react-three/xr';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sphere, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import { immersionMedia } from '../services/immersionMediaService';

interface Props { patientId?: string; onClose: () => void; initialModuleId?: string; }

type EnvironmentType = 'IDLE' | 'TDAH_EXECUTIVE' | 'TEA_SOCIAL' | 'TDM_DEPRESSION' | 'TAG_ANXIETY' | 'NEURO_HYPNOSIS' | 'DUAL_CONTROL' | 'DEV_TRAUMA' | 'EMDR_MEMORY' | 'GAMMA_INSIGHT' | 'PAIN_MANAGEMENT';

export const VrPatientExperience: React.FC<Props> = ({ patientId = 'PAC-8104', onClose, initialModuleId = 'TDAH_EXECUTIVE' }) => {
  const { isConnected, liveData, syncSession } = useVrTelemetryBridge('sender', patientId, 'HOLODECK_IDLE');

  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentType>(initialModuleId as EnvironmentType || 'IDLE');
  const [activeEcosystem, setActiveEcosystem] = useState<string>('ZEN_GARDEN');
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isEmdrActive, setIsEmdrActive] = useState<boolean>(false);
  const [emdrHz, setEmdrHz] = useState<number>(1.5);

  // Mapeo dinámico de módulos hacia el servicio centralizado de assets visuales
  const getAssetKeyForEnvironment = (env: EnvironmentType): string => {
    switch (env) {
      case 'NEURO_HYPNOSIS': return 'HYPNOSIS';
      case 'DUAL_CONTROL': return 'SEXUAL_HEALTH';
      case 'CLUSTER_B_FORENSIC' as any: return 'CLUSTER_B_FORENSIC';
      case 'TDAH_EXECUTIVE': return 'TDAH_ATTENTION_LAB';
      case 'DEV_TRAUMA': return 'DEVELOPMENTAL_TRAUMA';
      case 'PAIN_MANAGEMENT': return 'PAIN_MANAGEMENT';
      case 'FND_MIRROR' as any: return 'FUNCTIONAL_NEUROLOGY';
      case 'EMDR_MEMORY': return 'MEMORY_RECONSOLIDATION';
      default: return 'ZEN_GARDEN';
    }
  };

  // 1. AUDIO INMERSIVO Y BINAURAL AUTOMÁTICO
  useEffect(() => {
    if (activeEnvironment === 'IDLE') return;
    immersionMedia.startBinauralBeats(200, 6, 0.12);
    return () => {
      immersionMedia.stopBinauralBeats();
    };
  }, [activeEnvironment]);

  // 2. ENRUTADOR Y TELEMETRÍA
  useEffect(() => {
    if (!liveData) return;
    if (liveData.type === 'LOAD_MODULE') {
      setActiveEnvironment(liveData.moduleName as EnvironmentType);
      if (liveData.ecosystem) { setActiveEcosystem(liveData.ecosystem); setIsVideo(!!liveData.isVideo); }
    } else if (liveData.type === 'START_AIMA_PROTOCOL') {
      if (liveData.ecosystem) { setActiveEcosystem(liveData.ecosystem); setIsVideo(false); }
    } else if (liveData.type === 'START_BILATERAL_STIMULATION') {
      setIsEmdrActive(true);
      if (liveData.initialHz) setEmdrHz(liveData.initialHz);
      if (liveData.ecosystem) { setActiveEcosystem(liveData.ecosystem); setIsVideo(!!liveData.isVideo); }
    } else if (liveData.type === 'STOP_TEST' || liveData.type === 'TRIGGER_GROUNDING_PROTOCOL') {
      setActiveEnvironment('IDLE'); setIsEmdrActive(false); setIsVideo(false);
    }
  }, [liveData]);

  const isWebXRModule = activeEnvironment !== 'IDLE';
  const currentAssetKey = getAssetKeyForEnvironment(activeEnvironment);
  
  // Resolución segura de la textura con respaldo ante fallos
  let texturePath = '/ecosystems/ZEN_GARDEN.jpg';
  try {
    texturePath = immersionMedia.getEcosystemAssetUrl(currentAssetKey) || '/ecosystems/ZEN_GARDEN.jpg';
  } catch (err) {
    console.warn('Error resolviendo textura, usando respaldo:', err);
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white select-none touch-none overflow-hidden">
      <button onPointerDown={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-6 right-6 p-4 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 z-[10000] cursor-pointer backdrop-blur-md">
        <X className="w-8 h-8" />
      </button>

      {/* RENDERIZADO WEBXR BLINDADO CONTRA CRASHES */}
      {isWebXRModule && (
        <div className="absolute inset-0 z-[100]">
          <div className="absolute z-10 bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
             <VRButton className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.5)] transition uppercase tracking-widest cursor-pointer" />
          </div>
          <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [0, 0, 0.1] }}>
            <XR>
              <Controllers />
              <Suspense fallback={<FallbackLoadingSphere />}>
                {isVideo ? (
                  <VideoSphere url={`/video/${activeEcosystem}.mp4`} />
                ) : (
                  <Environment background={true} files={texturePath} />
                )}
              </Suspense>
              {isEmdrActive && <WebXrEmdrTarget hz={emdrHz} />}
            </XR>
          </Canvas>
        </div>
      )}

      {/* RENDERIZADO 2D DE RESPALDO */}
      {!isWebXRModule && (
        <IdleWaitingRoom isConnected={isConnected} syncSession={syncSession} />
      )}
      
      {/* OVERLAY SEGURIDAD */}
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

// Componente de respaldo para evitar pantallazos rojos durante la carga en Suspense
const FallbackLoadingSphere = () => (
  <mesh>
    <sphereGeometry args={[500, 32, 32]} />
    <meshBasicMaterial color="#020617" side={THREE.BackSide} />
  </mesh>
);

const WebXrEmdrTarget = ({ hz }: { hz: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.position.x = Math.sin(clock.getElapsedTime() * Math.PI * hz) * 3;
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

const IdleWaitingRoom = ({ isConnected, syncSession }: { isConnected: boolean, syncSession: () => void }) => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center transition-colors duration-1000">
    <div className="text-center space-y-6 max-w-xl p-8 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-2xl">
      <div className="flex justify-center items-center gap-3">
        <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 ${isConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border-rose-500/50 text-rose-300'}`}>
          {isConnected ? <Wifi className="w-4 h-4 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
          <span>{isConnected ? 'Sincronizado' : 'Buscando Red...'}</span>
        </div>
        <button onPointerDown={syncSession} className="p-2 bg-slate-800 text-sky-400 rounded-full border border-slate-700 active:scale-95"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <h1 className="text-2xl font-light tracking-wide text-slate-300">Sala de Reposo Inmersiva</h1>
      <p className="text-slate-500 text-sm">Aguarde un momento. El profesional cargará su entorno clínico en breve.</p>
    </div>
  </div>
);
