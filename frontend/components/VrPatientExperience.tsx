import React, { useState, useEffect, useRef, Component, ReactNode } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Wifi, WifiOff, X, RefreshCw, ShieldAlert, Target, Sun, AlertTriangle } from 'lucide-react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

interface Props { 
  patientId?: string; 
  initialModuleId?: string;
  onClose: () => void; 
}

type EnvironmentType = 
  | 'IDLE' | 'HOLODECK_IDLE' | 'TDAH_EXECUTIVE' | 'TEA_SOCIAL' 
  | 'TDM_DEPRESSION' | 'TAG_ANXIETY' | 'NEURO_HYPNOSIS' | 'DUAL_CONTROL' 
  | 'DEV_TRAUMA' | 'EMDR_MEMORY' | 'GAMMA_INSIGHT' | 'PAIN_MANAGEMENT' 
  | 'CLUSTER_B_FORENSIC' | 'FND_MIRROR';

// ============================================================================
// ESCUDO ANTIERRORES
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
          <h2 className="text-3xl font-black mb-4">Error Interceptado por AMIE Shield</h2>
          <p className="text-red-200 mb-6 max-w-xl font-mono text-xs bg-red-900/50 p-4 rounded-xl border border-red-800 break-all">
            {this.state.error?.message || 'Error de visualización 3D'}
          </p>
          <div className="flex gap-4">
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition cursor-pointer">Recargar Visor</button>
            <button onClick={this.props.onClose} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition cursor-pointer">Salir</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// MAPEO DE ARCHIVOS MULTIMEDIA 360 Y FALLBACKS
// ============================================================================
const KNOWN_JPG_FILES = new Set([
  'ACROPHOBIA_ROOF.jpg', 'AEROPHOBIA_CABIN.jpg', 'BIOLUMINESCENT_BEACH.jpg', 'CLINICAL_OFFICE.jpg',
  'CLUSTER_B_FORENSIC.jpg', 'COSMIC_STARS.jpg', 'DEV_TRAUMA.jpg', 'DUAL_CONTROL.jpg',
  'EMDR_MEMORY.jpg', 'FND_MIRROR.jpg', 'NEURO_HYPNOSIS.jpg', 'PAIN_MANAGEMENT.jpg',
  'PROTECTIVE_TREEHOUSE.jpg', 'SAFE_PLACE_FOREST.jpg', 'STERILE_ROOM.jpg',
  'TDAH_EXECUTIVE.jpg', 'WARM_HEARTH.jpg', 'WOMB_LIKE_CAVE.jpg', 'ZEN_GARDEN.jpg'
]);

const ECOSYSTEM_MAP: Record<string, string> = {
  'TDAH_ATTENTION_LAB': 'TDAH_EXECUTIVE.jpg', 'ExecutiveControl': 'TDAH_EXECUTIVE.jpg',
  'HYPNOSIS': 'NEURO_HYPNOSIS.jpg', 'SEXUAL_HEALTH': 'DUAL_CONTROL.jpg',
  'DEVELOPMENTAL_TRAUMA': 'DEV_TRAUMA.jpg', 'MEMORY_RECONSOLIDATION': 'EMDR_MEMORY.jpg',
  'FUNCTIONAL_NEUROLOGY': 'FND_MIRROR.jpg', 'SAFE_PLACE': 'SAFE_PLACE_FOREST.jpg'
};

const getSafeEcosystemFile = (ecosystemKey: string): string => {
  if (!ecosystemKey || ecosystemKey === 'NEUTRAL_VOID') return '/ecosystems/SAFE_PLACE_FOREST.jpg';
  const mapped = ECOSYSTEM_MAP[ecosystemKey];
  if (mapped && KNOWN_JPG_FILES.has(mapped)) return `/ecosystems/${mapped}`;
  const sanitized = ecosystemKey.trim();
  const withExt = (sanitized.endsWith('.jpg') || sanitized.endsWith('.jpeg')) ? sanitized : `${sanitized}.jpg`;
  if (KNOWN_JPG_FILES.has(withExt)) return `/ecosystems/${withExt}`;
  return '/ecosystems/SAFE_PLACE_FOREST.jpg';
};

// ============================================================================
// VISOR VR NATIVO PURO (BYPASS A REACT-THREE-FIBER = 0% CRASHES)
// ============================================================================
const NativeThreeVrViewer = ({ 
  ecosystemKey, 
  isVideo, 
  isEmdrActive, 
  emdrHz 
}: { 
  ecosystemKey: string; 
  isVideo: boolean; 
  isEmdrActive: boolean; 
  emdrHz: number;
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // 1. ESCENA Y CÁMARA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 0.1);

    // 2. RENDERIZADOR GL
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true; // Habilita WebXR Nativo
    container.appendChild(renderer.domElement);

    // 3. BOTÓN VR NATIVO OFICIAL
    let vrBtn: HTMLElement | null = null;
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute';
      vrBtn.style.bottom = '32px';
      vrBtn.style.left = '50%';
      vrBtn.style.transform = 'translateX(-50%)';
      vrBtn.style.padding = '14px 28px';
      vrBtn.style.borderRadius = '16px';
      vrBtn.style.background = 'rgba(147, 51, 234, 0.9)';
      vrBtn.style.border = '1px solid rgba(255, 255, 255, 0.3)';
      vrBtn.style.color = '#ffffff';
      vrBtn.style.fontFamily = 'sans-serif';
      vrBtn.style.fontSize = '14px';
      vrBtn.style.fontWeight = 'bold';
      vrBtn.style.boxShadow = '0 0 25px rgba(147, 51, 234, 0.6)';
      vrBtn.style.cursor = 'pointer';
      vrBtn.style.zIndex = '10000';
      container.appendChild(vrBtn);
    } catch (e) {
      console.warn("VRButton no disponible:", e);
    }

    // 4. ESFERA 360° INVERTIDA
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); 

    const material = new THREE.MeshBasicMaterial({ color: 0x020617, side: THREE.DoubleSide });
    const sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);

    let mediaTexture: THREE.Texture | THREE.VideoTexture | null = null;
    let videoEl: HTMLVideoElement | null = null;

    // 5. CARGA DE ARCHIVOS MULTIMEDIA
    if (isVideo) {
      videoEl = document.createElement('video');
      videoEl.src = `/video/${ecosystemKey}.mp4`;
      videoEl.crossOrigin = 'Anonymous';
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.play().then(() => {
        mediaTexture = new THREE.VideoTexture(videoEl!);
        if ('colorSpace' in mediaTexture) (mediaTexture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
        material.map = mediaTexture;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
      }).catch(e => console.warn("Video bloqueado:", e));
    } else {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(getSafeEcosystemFile(ecosystemKey), (texture) => {
        mediaTexture = texture;
        if ('colorSpace' in mediaTexture) (mediaTexture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
        material.map = mediaTexture;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
      });
    }

    // 6. ESTÍMULO EMDR
    let emdrMesh: THREE.Mesh | null = null;
    if (isEmdrActive) {
      const emdrGeo = new THREE.SphereGeometry(0.15, 32, 32);
      const emdrMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      emdrMesh = new THREE.Mesh(emdrGeo, emdrMat);
      emdrMesh.position.set(0, 1.5, -4);
      scene.add(emdrMesh);
    }

    // 7. CONTROLES TÁCTILES / RATÓN PARA DIRECT WEB
    let isPointerDown = false;
    let lon = 0, lat = 0;
    let pointerX = 0, pointerY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      pointerX = e.clientX;
      pointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      lon += (pointerX - e.clientX) * 0.1;
      lat += (e.clientY - pointerY) * 0.1;
      pointerX = e.clientX;
      pointerY = e.clientY;
    };

    const onPointerUp = () => { isPointerDown = false; };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 8. BUCLE DE ANIMACIÓN Y RENDERIZADO
    renderer.setAnimationLoop((time) => {
      if (!renderer.xr.isPresenting) {
        lat = Math.max(-85, Math.min(85, lat));
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta));
      }

      if (emdrMesh) {
        emdrMesh.position.x = Math.sin((time * 0.001) * Math.PI * emdrHz) * 3;
      }

      renderer.render(scene, camera);
    });

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 9. LIMPIEZA DE MEMORIA
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      
      renderer.setAnimationLoop(null);
      
      if (videoEl) { videoEl.pause(); videoEl.src = ''; }
      if (mediaTexture) mediaTexture.dispose();
      geometry.dispose();
      material.dispose();
      if (emdrMesh) {
        emdrMesh.geometry.dispose();
        (emdrMesh.material as THREE.Material).dispose();
      }
      
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, [ecosystemKey, isVideo, isEmdrActive, emdrHz]);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing bg-slate-950" />;
};

// ============================================================================
// EXPERIENCIA PRINCIPAL
// ============================================================================
export const VrPatientExperience: React.FC<Props> = ({ 
  patientId: propPatientId, 
  initialModuleId = 'HOLODECK_IDLE', 
  onClose 
}) => {
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const patientId = propPatientId || queryParams?.get('paciente') || 'PAC-8104';
  const urlModule = queryParams?.get('modulo');

  const { isConnected, liveData, syncSession, transmit } = useVrTelemetryBridge('receiver', patientId, 'HOLODECK_IDLE');

  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentType>(
    (urlModule || initialModuleId || 'IDLE') as EnvironmentType
  );
  const [activeEcosystem, setActiveEcosystem] = useState<string>('TDAH_EXECUTIVE');
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isEmdrActive, setIsEmdrActive] = useState<boolean>(false);
  const [emdrHz, setEmdrHz] = useState<number>(1.5);

  useEffect(() => {
    if (!activeEcosystem || activeEcosystem === 'NEUTRAL_VOID' || activeEnvironment === 'IDLE' || activeEnvironment === 'HOLODECK_IDLE') return;
    try {
      const audio = new Audio(`/audio/${activeEcosystem}.mp3`);
      audio.loop = true; 
      audio.volume = 0.8;
      const playPromise = audio.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
      return () => { audio.pause(); audio.src = ''; };
    } catch (e) {}
  }, [activeEcosystem, activeEnvironment]);

  useEffect(() => {
    if (!liveData) return;
    if (liveData.type === 'LOAD_MODULE') {
      if (liveData.moduleName) setActiveEnvironment(liveData.moduleName as EnvironmentType);
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

  const isWebXRModule = [
    'DUAL_CONTROL', 'DEV_TRAUMA', 'EMDR_MEMORY', 'NEURO_HYPNOSIS', 
    'GAMMA_INSIGHT', 'PAIN_MANAGEMENT', 'TDAH_EXECUTIVE',
    'CLUSTER_B_FORENSIC', 'FND_MIRROR'
  ].includes(activeEnvironment);

  return (
    <SafeVrWrapper onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-black text-white select-none overflow-hidden">
        <button onPointerDown={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-6 right-6 p-4 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 z-[10000] cursor-pointer backdrop-blur-md transition">
          <X className="w-8 h-8" />
        </button>

        {isWebXRModule && (
          <div className="absolute inset-0 z-[100]">
            <NativeThreeVrViewer 
              ecosystemKey={activeEcosystem} 
              isVideo={isVideo} 
              isEmdrActive={isEmdrActive} 
              emdrHz={emdrHz} 
            />
          </div>
        )}

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
// COMPONENTES SECUNDARIOS DE APOYO
// ============================================================================
const IdleWaitingRoom = ({ isConnected, syncSession }: { isConnected: boolean, syncSession: () => void }) => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center">
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
              <div className={`w-10 h-10 rounded-full ${phase === 'OVERSTIMULATION' ? 'bg-rose-500 animate-pulse' : 'bg-sky-400'}`}><div className="w-4 h-4 bg-black rounded-full ml-3 mt-3"></div></div>
              <div className={`w-10 h-10 rounded-full ${phase === 'OVERSTIMULATION' ? 'bg-rose-500 animate-pulse' : 'bg-sky-400'}`}><div className="w-4 h-4 bg-black rounded-full ml-3 mt-3"></div></div>
            </div>
            <div className="w-16 h-2 bg-slate-600 rounded-full z-10"></div>
          </div>
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
          <div className="absolute text-slate-500 font-mono text-center w-full top-20">TOQUE LA ESFERA</div>
          <div className="absolute w-24 h-24 bg-indigo-500 rounded-full shadow-[0_0_50px_rgba(99,102,241,0.5)] flex items-center justify-center cursor-pointer transition-all duration-1000" style={{ top: targetPos.top, left: targetPos.left, transform: 'translate(-50%, -50%)' }}>
            <Target className="w-12 h-12 text-white opacity-80" />
          </div>
        </div>
      )}
      {phase === 'REWARD' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-900 to-slate-950">
          <Sun className="w-48 h-48 text-yellow-300 animate-[spin_20s_linear_infinite]" />
        </div>
      )}
    </div>
  );
};

const ExposureAnxietyEnvironment = ({ liveData }: any) => {
  const [level, setLevel] = useState(1);
  useEffect(() => { if (liveData?.type === 'START_EXPOSURE' || liveData?.type === 'UPDATE_EXPOSURE_LEVEL') setLevel(liveData.level || 1); }, [liveData]);
  const tunnelScale = 1 - (level * 0.15);
  const colorIntensity = level > 3 ? 'border-rose-900' : 'border-slate-800';
  return (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className={`w-[1000px] h-[1000px] border-[100px] ${colorIntensity} rounded-full transition-all duration-1000 flex items-center justify-center`} style={{ transform: `scale(${tunnelScale})` }}>
        <div className={`w-[800px] h-[800px] border-[100px] ${colorIntensity} rounded-full flex items-center justify-center opacity-80`}>
          <div className={`w-[600px] h-[600px] border-[100px] ${colorIntensity} rounded-full flex items-center justify-center opacity-60`}></div>
        </div>
      </div>
    </div>
  );
};
