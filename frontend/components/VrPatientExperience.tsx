import React, { useState, useEffect, useRef, useCallback, Suspense, Component, ReactNode } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Wifi, WifiOff, X, RefreshCw, Plus, ShieldAlert, Target, Sun, AlertTriangle } from 'lucide-react';
import { VRButton, XR, Controllers } from '@react-three/xr';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sphere, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Props { 
  patientId?: string; 
  initialModuleId?: string;
  onClose: () => void; 
}

type EnvironmentType = 
  | 'IDLE' 
  | 'HOLODECK_IDLE'
  | 'TDAH_EXECUTIVE' 
  | 'TEA_SOCIAL' 
  | 'TDM_DEPRESSION' 
  | 'TAG_ANXIETY' 
  | 'NEURO_HYPNOSIS' 
  | 'DUAL_CONTROL' 
  | 'DEV_TRAUMA' 
  | 'EMDR_MEMORY' 
  | 'GAMMA_INSIGHT' 
  | 'PAIN_MANAGEMENT'
  | 'CLUSTER_B_FORENSIC'
  | 'FND_MIRROR';

// ============================================================================
// ESCUDO ANTIERRORES (Previene el pantallazo rojo y que te expulse de la app)
// ============================================================================
class SafeVrWrapper extends Component<{ children: ReactNode; onClose: () => void }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: any) { console.error("VR Crash Detectado:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[10000] bg-red-950 flex flex-col items-center justify-center p-6 text-white text-center">
          <AlertTriangle className="w-20 h-20 text-red-500 mb-6 animate-pulse" />
          <h2 className="text-3xl font-black mb-4">Error Crítico en el Entorno 3D</h2>
          <p className="text-red-200 mb-6 max-w-xl font-mono text-sm bg-red-900/50 p-4 rounded-xl border border-red-800">
            {this.state.error?.message || 'El archivo 360, video o textura no pudo cargarse.'}
          </p>
          <div className="flex gap-4">
            <button onClick={() => this.setState({ hasError: false })} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition cursor-pointer">Reintentar Carga</button>
            <button onClick={this.props.onClose} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition cursor-pointer">Salir del Visor</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// NORMALIZADOR DE ARCHIVOS ECOSYSTEM CON FALLBACK GARANTIZADO
// ============================================================================
const KNOWN_JPG_FILES = new Set([
  'ACROPHOBIA_ROOF.jpg',
  'AEROPHOBIA_CABIN.jpg',
  'BIOLUMINESCENT_BEACH.jpg',
  'CLINICAL_OFFICE.jpg',
  'CLUSTER_B_FORENSIC.jpg',
  'COSMIC_STARS.jpg',
  'DEV_TRAUMA.jpg',
  'DUAL_CONTROL.jpg',
  'EMDR_MEMORY.jpg',
  'FND_MIRROR.jpg',
  'NEURO_HYPNOSIS.jpg',
  'PAIN_MANAGEMENT.jpg',
  'PROTECTIVE_TREEHOUSE.jpg',
  'SAFE_PLACE_FOREST.jpg',
  'STERILE_ROOM.jpg',
  'TDAH_EXECUTIVE.jpg',
  'WARM_HEARTH.jpg',
  'WOMB_LIKE_CAVE.jpg',
  'ZEN_GARDEN.jpg'
]);

const ECOSYSTEM_MAP: Record<string, string> = {
  // Claves directas de archivos
  'WARM_HEARTH': 'WARM_HEARTH.jpg',
  'CLINICAL_OFFICE': 'CLINICAL_OFFICE.jpg',
  'STERILE_ROOM': 'STERILE_ROOM.jpg',
  'PROTECTIVE_TREEHOUSE': 'PROTECTIVE_TREEHOUSE.jpg',
  'BIOLUMINESCENT_BEACH': 'BIOLUMINESCENT_BEACH.jpg',
  'SAFE_PLACE_FOREST': 'SAFE_PLACE_FOREST.jpg',
  'COSMIC_STARS': 'COSMIC_STARS.jpg',
  'WOMB_LIKE_CAVE': 'WOMB_LIKE_CAVE.jpg',
  'ZEN_GARDEN': 'ZEN_GARDEN.jpg',
  'ACROPHOBIA_ROOF': 'ACROPHOBIA_ROOF.jpg',
  'AEROPHOBIA_CABIN': 'AEROPHOBIA_CABIN.jpg',
  'DUAL_CONTROL': 'DUAL_CONTROL.jpg',
  'PAIN_MANAGEMENT': 'PAIN_MANAGEMENT.jpg',
  'NEURO_HYPNOSIS': 'NEURO_HYPNOSIS.jpg',
  'DEV_TRAUMA': 'DEV_TRAUMA.jpg',
  'EMDR_MEMORY': 'EMDR_MEMORY.jpg',
  'CLUSTER_B_FORENSIC': 'CLUSTER_B_FORENSIC.jpg',
  'TDAH_EXECUTIVE': 'TDAH_EXECUTIVE.jpg',
  'FND_MIRROR': 'FND_MIRROR.jpg',

  // Aliases técnicos desde módulos
  'TDAH_ATTENTION_LAB': 'TDAH_EXECUTIVE.jpg',
  'ExecutiveControl': 'TDAH_EXECUTIVE.jpg',
  'HYPNOSIS': 'NEURO_HYPNOSIS.jpg',
  'SEXUAL_HEALTH': 'DUAL_CONTROL.jpg',
  'DEVELOPMENTAL_TRAUMA': 'DEV_TRAUMA.jpg',
  'MEMORY_RECONSOLIDATION': 'EMDR_MEMORY.jpg',
  'FUNCTIONAL_NEUROLOGY': 'FND_MIRROR.jpg',
  'SAFE_PLACE': 'SAFE_PLACE_FOREST.jpg',

  // Fallbacks de nombres antiguos en español
  'Salud Sexual': 'DUAL_CONTROL.jpg',
  'Hipnosis & Grounding': 'NEURO_HYPNOSIS.jpg',
  'Laboratorio de Atención': 'TDAH_EXECUTIVE.jpg',
  'Control de Dolor Crónico (Paisaje Subacuático)': 'PAIN_MANAGEMENT.jpg',
  'Forense Cluster B': 'CLUSTER_B_FORENSIC.jpg',
  'Neurología Funcional & Propiocepción': 'FND_MIRROR.jpg',
  'Reconsolidación de Memoria (Sala de Espejo)': 'EMDR_MEMORY.jpg',
  'Trauma del Desarrollo (Santuario de Vínculo Seguro)': 'DEV_TRAUMA.jpg'
};

const getSafeEcosystemFile = (ecosystemKey: string): string => {
  if (!ecosystemKey || ecosystemKey === 'NEUTRAL_VOID') {
    return '/ecosystems/SAFE_PLACE_FOREST.jpg';
  }
  
  // 1. Buscar en el diccionario de mapeo
  const mapped = ECOSYSTEM_MAP[ecosystemKey];
  if (mapped && KNOWN_JPG_FILES.has(mapped)) {
    return `/ecosystems/${mapped}`;
  }
  
  // 2. Comprobar si el nombre recibido es un archivo existente
  const sanitized = ecosystemKey.trim();
  const withExt = (sanitized.endsWith('.jpg') || sanitized.endsWith('.jpeg')) 
    ? sanitized 
    : `${sanitized}.jpg`;

  if (KNOWN_JPG_FILES.has(withExt)) {
    return `/ecosystems/${withExt}`;
  }
  
  // 3. Fallback seguro a imagen garantizada
  return '/ecosystems/SAFE_PLACE_FOREST.jpg';
};

// ============================================================================
// EXPERIENCIA PRINCIPAL DEL VISOR
// ============================================================================
export const VrPatientExperience: React.FC<Props> = ({ 
  patientId: propPatientId, 
  initialModuleId = 'HOLODECK_IDLE', 
  onClose 
}) => {
  // Soporte para parámetros en URL (/visor?paciente=PAC-8104&modulo=TDAH_EXECUTIVE)
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const patientId = propPatientId || queryParams?.get('paciente') || 'PAC-8104';
  const urlModule = queryParams?.get('modulo');

  // EL VISOR DEL PACIENTE DEBE SER SIEMPRE 'receiver'
  const { isConnected, remoteCommand, liveData, syncSession, transmit } = useVrTelemetryBridge('receiver', patientId, 'HOLODECK_IDLE');

  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentType>(
    (urlModule || initialModuleId || 'IDLE') as EnvironmentType
  );
  const [activeEcosystem, setActiveEcosystem] = useState<string>('SAFE_PLACE_FOREST');
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isEmdrActive, setIsEmdrActive] = useState<boolean>(false);
  const [emdrHz, setEmdrHz] = useState<number>(1.5);

  // 1. AUDIO INMERSIVO AUTOMÁTICO PROTEGIDO
  useEffect(() => {
    if (!activeEcosystem || activeEcosystem === 'NEUTRAL_VOID' || activeEnvironment === 'IDLE' || activeEnvironment === 'HOLODECK_IDLE') return;
    
    try {
      const audio = new Audio(`/audio/${activeEcosystem}.mp3`);
      audio.loop = true; 
      audio.volume = 0.8;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.warn(`Audio no encontrado o bloqueado: /audio/${activeEcosystem}.mp3`, error));
      }
      return () => { audio.pause(); audio.src = ''; };
    } catch (e) {
      console.warn("Fallo al reproducir audio:", e);
    }
  }, [activeEcosystem, activeEnvironment]);

  // 2. RECEPCIÓN DE TELEMETRÍA Y CAMBIO DE MÓDULO
  useEffect(() => {
    if (!liveData) return;
    if (liveData.type === 'LOAD_MODULE') {
      if (liveData.moduleName) {
        setActiveEnvironment(liveData.moduleName as EnvironmentType);
      }
      if (liveData.ecosystem) { 
        setActiveEcosystem(liveData.ecosystem); 
        setIsVideo(!!liveData.isVideo); 
      }
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

  // Módulos que se renderizan en 3D WebXR Canvas
  const isWebXRModule = [
    'DUAL_CONTROL', 
    'DEV_TRAUMA', 
    'EMDR_MEMORY', 
    'NEURO_HYPNOSIS', 
    'GAMMA_INSIGHT', 
    'PAIN_MANAGEMENT',
    'TDAH_EXECUTIVE',
    'CLUSTER_B_FORENSIC',
    'FND_MIRROR'
  ].includes(activeEnvironment);

  return (
    <SafeVrWrapper onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-black text-white select-none touch-none overflow-hidden">
        <button onPointerDown={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-6 right-6 p-4 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 z-[10000] cursor-pointer backdrop-blur-md transition">
          <X className="w-8 h-8" />
        </button>

        {/* RENDERIZADO WEBXR PROTEGIDO POR SUSPENSE Y ERROR BOUNDARY */}
        {isWebXRModule && (
          <div className="absolute inset-0 z-[100]">
            <div className="absolute z-10 bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
              <VRButton className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.5)] transition uppercase tracking-widest cursor-pointer" />
            </div>
            <Canvas>
              <XR>
                <Controllers />
                <Suspense fallback={null}>
                  {isVideo ? (
                    <VideoSphere url={`/video/${activeEcosystem}.mp4`} />
                  ) : (
                    <Environment 
                      background={true} 
                      files={getSafeEcosystemFile(activeEcosystem)} 
                    />
                  )}
                </Suspense>
                {isEmdrActive && <WebXrEmdrTarget hz={emdrHz} />}
              </XR>
            </Canvas>
          </div>
        )}

        {/* RENDERIZADO 2D LEGACY */}
        {!isWebXRModule && (
          <>
            {(activeEnvironment === 'IDLE' || activeEnvironment === 'HOLODECK_IDLE') && (
              <IdleWaitingRoom isConnected={isConnected} syncSession={syncSession} />
            )}
            {activeEnvironment === 'TAG_ANXIETY' && <ExposureAnxietyEnvironment liveData={liveData} />}
            {activeEnvironment === 'TEA_SOCIAL' && <SocialCognitionEnvironment liveData={liveData} />}
            {activeEnvironment === 'TDM_DEPRESSION' && <DepressionEnvironment liveData={liveData} transmit={transmit} />}
          </>
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
    </SafeVrWrapper>
  );
};

// ============================================================================
// COMPONENTES SECUNDARIOS
// ============================================================================

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
        <button onPointerDown={syncSession} className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-full border border-slate-700 active:scale-95 transition cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
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
        if (isGo) { stats.current.omissions++; transmit({ ...stats.current, reactionTimeMs: stats.current.lastReaction }); }
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
    if (stimulus === 'GO') { stats.current.hits++; stats.current.lastReaction = rt; } else { stats.current.commissions++; }
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
            {phase === 'OVERSTIMULATION' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 mix-blend-overlay"></div>}
          </div>
          <p className="mt-8 text-slate-500 font-mono tracking-widest text-sm">{phase === 'FACES' ? 'FASE 1: FIJACIÓN OCULAR' : 'FASE 2: RUIDO AMBIENTAL'}</p>
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
          <div className="absolute w-24 h-24 bg-indigo-500 rounded-full shadow-[0_0_50px_rgba(99,102,241,0.5)] flex items-center justify-center cursor-pointer transition-all duration-1000 ease-out" style={{ top: targetPos.top, left: targetPos.left, transform: 'translate(-50%, -50%)' }}>
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
  useEffect(() => { if (liveData?.type === 'START_EXPOSURE' || liveData?.type === 'UPDATE_EXPOSURE_LEVEL') setLevel(liveData.level || 1); }, [liveData]);
  const tunnelScale = 1 - (level * 0.15);
  const vignetteOpacity = level * 0.2;
  const colorIntensity = level > 3 ? 'border-rose-900' : 'border-slate-800';

  return (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className={`w-[1000px] h-[1000px] border-[100px] ${colorIntensity} rounded-full transition-all duration-1000 flex items-center justify-center`} style={{ transform: `scale(${tunnelScale})` }}>
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
