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
          <h2 className="text-3xl font-black mb-4">Error Interceptado</h2>
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

    // 4. ESFERA 360° INVERTIDA (Espacio de fondo negro preventivo)
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); 

    const material = new THREE.MeshBasicMaterial({ color: 0x020617, side: THREE.DoubleSide });
    const sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);

    // Variables globales para limpieza de memoria
    let mediaTexture: THREE.Texture | THREE.VideoTexture | null = null;
    let videoEl: HTMLVideoElement | null = null;

    // 5. CARGA DE ARCHIVOS
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
        material.color.setHex(0xffffff); // Quita el fondo negro
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

    // 7. CONTROLES DE ARRASTRE PARA DIRECT WEB (PC/Tablet)
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
      // Rotar cámara si NO está dentro de las gafas VR
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

    // 9. LIMPIEZA DE MEMORIA AL CERRAR
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
    if (!activeEcosystem || activeEcosystem === 'NEUTRAL_VOID' || active
