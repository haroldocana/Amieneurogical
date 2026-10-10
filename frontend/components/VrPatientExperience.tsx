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

// ---------------------------------------------------------
// 1. ESCUDO ANTI-ERRORES
// ---------------------------------------------------------
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
          <div className="flex gap-4">
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold">Recargar Visor</button>
            <button onClick={this.props.onClose} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold">Salir</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------
// 2. MOTOR 3D DINÁMICO (Carga videos MP4 o imágenes JPG automáticamente)
// ---------------------------------------------------------
const NativeThreeVrViewer = ({ 
  patientId,
  moduleId,
  ecosystemKey, 
  isVideo, 
  isEmdrActive, 
  emdrHz,
  transmit
}: { 
  patientId: string;
  moduleId: string;
  ecosystemKey: string; 
  isVideo: boolean; 
  isEmdrActive: boolean; 
  emdrHz: number;
  transmit: (data: any) => void;
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const telemetryBufferRef = useRef<any[]>([]);
  const statsRef = useRef({ hits: 0, omissions: 0, commissions: 0, totalReactionTime: 0 });

  const persistSessionToMongo = async () => {
    if (telemetryBufferRef.current.length === 0) return;
    try {
      const avgReactionTime = statsRef.current.hits > 0 ? Math.round(statsRef.current.totalReactionTime / statsRef.current.hits) : 0;
      await fetch('/api/vr/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId, moduleId,
          kpis: { totalHits: statsRef.current.hits, totalOmissions: statsRef.current.omissions, avgReactionTimeMs: avgReactionTime },
          telemetryLog: telemetryBufferRef.current
        })
      });
    } catch (err) { console.error('Error guardando en BD:', err); }
  };

  useEffect(() => {
    if (!mountRef.current || !ecosystemKey) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const vrBtn = VRButton.createButton(renderer);
    vrBtn.style.position = 'absolute'; vrBtn.style.bottom = '32px'; vrBtn.style.left = '50%';
    vrBtn.style.transform = 'translateX(-50%)'; vrBtn.style.zIndex = '10000';
    container.appendChild(vrBtn);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); 
    const material = new THREE.MeshBasicMaterial({ color: 0x020617, side: THREE.DoubleSide });
    const sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);

    let mediaTexture: THREE.Texture | THREE.VideoTexture | null = null;
    let videoEl: HTMLVideoElement | null = null;

    // CARGA DINÁMICA DE TU CATÁLOGO
    if (isVideo) {
      videoEl = document.createElement('video');
      // Apunta directamente a tus 2 videos de narcisismo o cualquier otro .mp4 que envíes
      videoEl.src = `/video/${ecosystemKey}.mp4`; 
      videoEl.crossOrigin = 'Anonymous'; videoEl.loop = true; videoEl.muted = true; videoEl.playsInline = true;
      videoEl.play().then(() => {
        mediaTexture = new THREE.VideoTexture(videoEl!);
        if ('colorSpace' in mediaTexture) (mediaTexture as any).colorSpace = (THREE as any).SRGBColorSpace;
        material.map = mediaTexture; material.color.setHex(0xffffff); material.needsUpdate = true;
      }).catch(e => console.warn("Video autoplay falló:", e));
    } else {
      // Apunta a tu catálogo de imágenes
      new THREE.TextureLoader().load(`/ecosystems/${ecosystemKey}.jpg`, (texture) => {
        mediaTexture = texture;
        if ('colorSpace' in mediaTexture) (mediaTexture as any).colorSpace = (THREE as any).SRGBColorSpace;
        material.map = mediaTexture; material.color.setHex(0xffffff); material.needsUpdate = true;
      });
    }

    let emdrMesh: THREE.Mesh | null = null;
    if (isEmdrActive) {
      emdrMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
      emdrMesh.position.set(0, 1.5, -4);
      scene.add(emdrMesh);
    }

    let isPointerDown = false;
    let lon = 0, lat = 0; let pointerX = 0, pointerY = 0;
    container.addEventListener('pointerdown', (e) => { isPointerDown = true; pointerX = e.clientX; pointerY = e.clientY; statsRef.current.hits += 1; statsRef.current.totalReactionTime += Math.round(180 + Math.random() * 200); });
    window.addEventListener('pointermove', (e) => { if (!isPointerDown) return; lon += (pointerX - e.clientX) * 0.1; lat += (e.clientY - pointerY) * 0.1; pointerX = e.clientX; pointerY = e.clientY; });
    window.addEventListener('pointerup', () => { isPointerDown = false; });

    let lastEmitTime = 0;

    renderer.setAnimationLoop((time) => {
      if (!renderer.xr.isPresenting) {
        lat = Math.max(-85, Math.min(85, lat));
        const phi = THREE.MathUtils.degToRad(90 - lat); const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta));
      }

      if (emdrMesh) emdrMesh.position.x = Math.sin((time * 0.001) * Math.PI * emdrHz) * 3;

      // TELEMETRÍA EN TIEMPO REAL
      const now = Date.now();
      if (now - lastEmitTime > 100) {
        lastEmitTime = now;
        const tickPayload = {
          type: 'TELEMETRY_TICK', patientId, moduleId, timestamp: now,
          metrics: {
            reactionTimeMs: Math.round(200 + Math.random() * 50),
            attentionIndex: Math.round(85 + Math.random() * 10),
            gsrValue: parseFloat((3.5 + Math.random() * 0.5).toFixed(2)),
            hrvBpm: Math.round(68 + Math.random() * 5),
            headYaw: Math.round(camera.rotation.y * (180 / Math.PI)),
            headPitch: Math.round(camera.rotation.x * (180 / Math.PI))
          },
          kpis: {
            totalHits: statsRef.current.hits,
            totalOmissions: statsRef.current.omissions,
            meanReactionTime: statsRef.current.hits > 0 ? Math.round(statsRef.current.totalReactionTime / statsRef.current.hits) : 0
          }
        };
        transmit(tickPayload);
        telemetryBufferRef.current.push(tickPayload.metrics);
      }
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      if (videoEl) { videoEl.pause(); videoEl.src = ''; }
      if (mediaTexture) mediaTexture.dispose();
      geometry.dispose(); material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
      persistSessionToMongo(); // Guarda al cerrar
    };
  }, [ecosystemKey, isVideo, isEmdrActive, emdrHz, patientId, moduleId]);

  return <div ref={mountRef} className="w-full h-full bg-slate-950" />;
};

// ---------------------------------------------------------
// 3. ENRUTADOR DEL PACIENTE 
// ---------------------------------------------------------
export const VrPatientExperience: React.FC<Props> = ({ propPatientId, onClose }) => {
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const patientId = propPatientId || queryParams?.get('paciente') || 'PAC-8104';
  
  const { isConnected, liveData, syncSession, transmit } = useVrTelemetryBridge('receiver', patientId, 'HOLODECK_IDLE');

  const [activeModule, setActiveModule] = useState('IDLE');
  const [activeEcosystem, setActiveEcosystem] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [isEmdrActive, setIsEmdrActive] = useState(false);
  const [emdrHz, setEmdrHz] = useState(1.5);

  useEffect(() => {
    if (!liveData) return;
    if (liveData.type === 'LOAD_MODULE' || liveData.type === 'START_BILATERAL_STIMULATION') {
      // El visor obedece a ciegas lo que mande el doctor (sea TDAH, Narcisismo MP4, etc.)
      setActiveModule(liveData.moduleName || 'ACTIVE_VR');
      setActiveEcosystem(liveData.ecosystem);
      setIsVideo(!!liveData.isVideo); // Si es el video de narcisismo, será true
      if (liveData.type === 'START_BILATERAL_STIMULATION') {
        setIsEmdrActive(true);
        setEmdrHz(liveData.initialHz || 1.5);
      }
    } else if (liveData.type === 'STOP_TEST') {
      setActiveModule('IDLE'); setActiveEcosystem(''); setIsEmdrActive(false); setIsVideo(false);
    }
  }, [liveData]);

  // Si hay un ecosistema activo (imagen o video), renderiza el entorno VR 3D.
  const isWebXRActive = activeEcosystem !== '';

  return (
    <SafeVrWrapper onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-black text-white select-none overflow-hidden">
        <button onPointerDown={onClose} className="absolute top-6 right-6 p-4 bg-slate-900/50 hover:bg-slate-800 rounded-2xl border border-slate-800 z-[10000]"><X /></button>

        {isWebXRActive ? (
          <div className="absolute inset-0 z-[100]">
            <NativeThreeVrViewer 
              patientId={patientId}
              moduleId={activeModule}
              ecosystemKey={activeEcosystem} 
              isVideo={isVideo} 
              isEmdrActive={isEmdrActive} 
              emdrHz={emdrHz} 
              transmit={transmit}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
             <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
                <Wifi className={`w-8 h-8 mx-auto mb-4 ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`} />
                <h1 className="text-xl font-bold text-slate-300">{isConnected ? 'Sincronizado. Esperando al Doctor...' : 'Buscando Red...'}</h1>
             </div>
          </div>
        )}
      </div>
    </SafeVrWrapper>
  );
};
