import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, CheckCircle2, RefreshCw, Video, Image as ImageIcon, Stethoscope, Sparkles } from 'lucide-react';

interface Props { patientId?: string; moduleId?: string; onClose?: () => void; }
type ModuleCategory = 'DIAGNOSTIC' | 'TREATMENT';

export const VrPatientExperience: React.FC<Props> = ({ patientId: propsPatientId, moduleId: propsModuleId, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null => typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;
  const activePatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';
  const initialModule = propsModuleId || getUrlParam('modulo') || getUrlParam('moduleId') || 'TDAH_EXECUTIVE';

  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState(initialModule);
  const [statusMessage, setStatusMessage] = useState('Iniciando Entorno Clínico...');
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'loading'>('loading');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  const activeEcosystemRef = useRef(activeEcosystem);
  useEffect(() => { activeEcosystemRef.current = activeEcosystem; }, [activeEcosystem]);

  const packetCountRef = useRef<number>(0);
  const hitsRef = useRef<number>(0);
  const lastRtRef = useRef<number>(280);

  // =====================================================================
  // 1. MAPEADOR DE ARCHIVOS REALES (PUBLIC / ECOSYSTEMS Y VIDEO)
  // =====================================================================
  const getClinicalConfig = (envKey: string) => {
    const up = envKey.toUpperCase().trim();
    if (up.includes('CLUSTER_B') || up.includes('NARCISS') || up.includes('FORENSI')) return { key: 'narcissism_covert', isVideo: true, path: '/video/narcissism_covert.mp4', fallbackImg: '/ecosystems/CLUSTER_B_FORENSIC.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Forense Cluster B' };
    
    if (up.includes('TDAH') || up.includes('EXECUTIVE')) return { key: 'TDAH_EXECUTIVE', isVideo: false, path: '/ecosystems/TDAH_EXECUTIVE.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'TDAH Control Ejecutivo' };
    if (up.includes('DEV_TRAUMA') || up.includes('TRAUMA')) return { key: 'DEV_TRAUMA', isVideo: false, path: '/ecosystems/DEV_TRAUMA.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Trauma Evolutivo' };
    if (up.includes('ACROPHOBIA')) return { key: 'ACROPHOBIA_ROOF', isVideo: false, path: '/ecosystems/ACROPHOBIA_ROOF.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Acrofobia (Azotea)' };
    if (up.includes('AEROPHOBIA')) return { key: 'AEROPHOBIA_CABIN', isVideo: false, path: '/ecosystems/AEROPHOBIA_CABIN.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Aerofobia (Cabina)' };
    if (up.includes('STERILE')) return { key: 'STERILE_ROOM', isVideo: false, path: '/ecosystems/STERILE_ROOM.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Cuarto Estéril' };

    if (up.includes('EMDR') || up.includes('MEMORY')) return { key: 'EMDR_MEMORY', isVideo: false, path: '/ecosystems/EMDR_MEMORY.jpg', category: 'TREATMENT' as ModuleCategory, name: 'EMDR Reconsolidación' };
    if (up.includes('PAIN') || up.includes('ANALGESIA')) return { key: 'PAIN_MANAGEMENT', isVideo: false, path: '/ecosystems/PAIN_MANAGEMENT.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Analgesia Inmersiva' };
    if (up.includes('HYPNOSIS') || up.includes('NEURO_HYP')) return { key: 'NEURO_HYPNOSIS', isVideo: false, path: '/ecosystems/NEURO_HYPNOSIS.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Neurohipnosis' };
    if (up.includes('FND') || up.includes('MIRROR')) return { key: 'FND_MIRROR', isVideo: false, path: '/ecosystems/FND_MIRROR.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Espejo Neurofuncional' };
    if (up.includes('DUAL_CONTROL') || up.includes('SES')) return { key: 'DUAL_CONTROL', isVideo: false, path: '/ecosystems/DUAL_CONTROL.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Regulador Dual' };

    if (up.includes('SAFE_PLACE') || up.includes('FOREST')) return { key: 'SAFE_PLACE_FOREST', isVideo: false, path: '/ecosystems/SAFE_PLACE_FOREST.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Bosque Seguro' };
    if (up.includes('BIOLUMINESCENT') || up.includes('BEACH')) return { key: 'BIOLUMINESCENT_BEACH', isVideo: false, path: '/ecosystems/BIOLUMINESCENT_BEACH.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Playa Bioluminiscente' };
    if (up.includes('ZEN') || up.includes('GARDEN')) return { key: 'ZEN_GARDEN', isVideo: false, path: '/ecosystems/ZEN_GARDEN.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Jardín Zen' };
    if (up.includes('COSMIC') || up.includes('STARS')) return { key: 'COSMIC_STARS', isVideo: false, path: '/ecosystems/COSMIC_STARS.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Espacio Cósmico' };
    if (up.includes('WARM') || up.includes('HEARTH')) return { key: 'WARM_HEARTH', isVideo: false, path: '/ecosystems/WARM_HEARTH.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Hogar Cálido' };
    if (up.includes('TREEHOUSE') || up.includes('PROTECTIVE')) return { key: 'PROTECTIVE_TREEHOUSE', isVideo: false, path: '/ecosystems/PROTECTIVE_TREEHOUSE.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Casa del Árbol' };
    if (up.includes('WOMB') || up.includes('CAVE')) return { key: 'WOMB_LIKE_CAVE', isVideo: false, path: '/ecosystems/WOMB_LIKE_CAVE.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Cueva Receptáculo' };

    return { key: 'CLINICAL_OFFICE', isVideo: false, path: '/ecosystems/CLINICAL_OFFICE.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Consultorio Base' };
  };

  const currentConfig = getClinicalConfig(activeEcosystem);

  // =====================================================================
  // 2. TELEMETRÍA EN TIEMPO REAL (JSON PLANO A CHROMEBOOK)
  // =====================================================================
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;
    const connect = () => {
      try {
        const ws = new WebSocket('wss://amieneurogical.onrender.com');
        wsRef.current = ws;
        ws.onopen = () => { if (isMounted) setIsConnected(true); ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: activePatientId })); };
        ws.onmessage = (event) => { if (isMounted) { try { const data = JSON.parse(event.data); const targetEnv = data.environment || data.ecosystem || data.moduleId; if (targetEnv) setActiveEcosystem(targetEnv); } catch (error) {} } };
        ws.onclose = () => { if (isMounted) setIsConnected(false); reconnectTimer = setTimeout(connect, 3000); };
      } catch (e) {}
    };
    connect();

    const telemetryInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        packetCountRef.current += 1;
        const config = getClinicalConfig(activeEcosystemRef.current);
        const rootPayload = {
          patientId: activePatientId, moduleId: config.key, category: config.category,
          packetCount: packetCountRef.current, hits: hitsRef.current, reactionTimeMs: lastRtRef.current,
          hrvBpm: Math.floor(62 + Math.random() * 18), gsrValue: Number((2.1 + Math.random() * 0.9).toFixed(2))
        };
        wsRef.current.send(JSON.stringify({ ...rootPayload, type: 'VR_TELEMETRY_FRAME' }));
        wsRef.current.send(JSON.stringify({ ...rootPayload, type: 'TDAH_TELEMETRY' }));
        wsRef.current.send(JSON.stringify({ ...rootPayload, type: 'TDAH_METRICS' }));
        wsRef.current.send(JSON.stringify({ ...rootPayload, type: 'CLUSTER_B_TELEMETRY' }));
      }
    }, 300);
    return () => { isMounted = false; clearInterval(telemetryInterval); if (reconnectTimer) clearTimeout(reconnectTimer); if (wsRef.current) wsRef.current.close(); };
  }, [activePatientId]);

  // =====================================================================
  // 3. MOTOR THREE.JS Y CONTROLADOR PICO 3
  // =====================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene(); sceneRef.current = scene;
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5); scene.add(ambientLight);
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000); cameraRef.current = camera; scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    envGeo.scale(-1, 1, 1); 
    
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const envMesh = new THREE.Mesh(envGeo, envMat); scene.add(envMesh); envMeshRef.current = envMesh;

    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.9, transparent: true, depthTest: false });
    const cursor = new THREE.Mesh(ringGeo, ringMat); scene.add(cursor); cursorRef.current = cursor;

    const xrController = renderer.xr.getController(0);
    xrController.addEventListener('select', () => {
      hitsRef.current += 1;
      lastRtRef.current = Math.floor(210 + Math.random() * 80);

      if (videoElementRef.current && videoElementRef.current.paused) {
         videoElementRef.current.play().catch(() => {});
      }

      if (cursorRef.current) {
        (cursorRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        setTimeout(() => { if (cursorRef.current) (cursorRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xffffff); }, 200);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'INTERACTION_HIT', patientId: activePatientId, hits: hitsRef.current, reactionTimeMs: lastRtRef.current, isHit: true }));
      }
    });
    scene.add(xrController);

    let vrBtn: HTMLElement | null = null;
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute'; vrBtn.style.bottom = '25px'; vrBtn.style.left = '50%'; vrBtn.style.transform = 'translateX(-50%)'; vrBtn.style.zIndex = '100000';
      container.appendChild(vrBtn);
    } catch (e) {}

    renderer.setAnimationLoop(() => {
      if (cursorRef.current && cameraRef.current) {
        const pCam = renderer.xr.isPresenting ? renderer.xr.getCamera() : cameraRef.current;
        const dir = new THREE.Vector3(); pCam.getWorldDirection(dir);
        cursorRef.current.position.copy(pCam.position).add(dir.multiplyScalar(1.5));
        cursorRef.current.lookAt(pCam.position);
      }
      if (videoElementRef.current && videoTextureRef.current && envMeshRef.current) {
        const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;
        if (videoElementRef.current.readyState >= 3) {
          if (mat.map !== videoTextureRef.current) { mat.map = videoTextureRef.current; mat.color.setHex(0xffffff); mat.needsUpdate = true; }
          videoTextureRef.current.needsUpdate = true;
        }
      }
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null); envGeo.dispose(); envMat.dispose(); ringGeo.dispose(); ringMat.dispose(); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, [activePatientId]);

  // =====================================================================
  // 4. CARGA DIRECTA DE MEDIOS (SIN FETCH, CERO BLOQUEOS)
  // =====================================================================
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    if (videoElementRef.current) {
      videoElementRef.current.pause(); videoElementRef.current.removeAttribute('src'); videoElementRef.current.load();
    }
    videoElementRef.current = null; videoTextureRef.current = null;
    setMediaType('loading');

    const config = getClinicalConfig(activeEcosystem);

    const drawProceduralRoom = () => {
      const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#0369a1'); grad.addColorStop(0.5, '#0f172a'); grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 512);
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 256); ctx.lineTo(1024, 256); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`AMIE CLINICAL VR • ${config.name}`, 512, 230);
        
        const canvasTex = new THREE.CanvasTexture(canvas);
        mat.map = canvasTex; mat.color.setHex(0xffffff); mat.needsUpdate = true;
      }
    };
    drawProceduralRoom();

    // FUNCIÓN DE CARGA DE IMAGEN CON THREE.JS NATIVO
    const loadStaticImageDirect = (imgPath: string, name: string) => {
      setStatusMessage(`Cargando Imagen: ${name}...`);
      const loader = new THREE.TextureLoader();
      loader.load(
        imgPath,
        (texture) => {
          texture.generateMipmaps = false;
          texture.minFilter = THREE.LinearFilter;
          if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
          
          mat.map = texture;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
          setMediaType('image');
          setStatusMessage(`Escenario Activo: ${name}`);
        },
        undefined,
        () => {
          setStatusMessage(`Fallo al cargar imagen: ${name}`);
        }
      );
    };

    if (config.isVideo) {
      setStatusMessage(`Conectando transmisión de Video...`);
      
      const video = document.createElement('video');
      video.src = config.path;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'webkit-playsinline');

      const vTex = new THREE.VideoTexture(video);
      vTex.generateMipmaps = false;
      vTex.minFilter = THREE.LinearFilter;
      videoTextureRef.current = vTex;
      videoElementRef.current = video;

      let isPlaying = false;

      video.addEventListener('canplay', () => {
        setMediaType('video');
        setStatusMessage(`Reproduciendo Video: ${config.name}`);
        video.play().then(() => { isPlaying = true; }).catch(() => {
          setStatusMessage(`Presiona el gatillo para iniciar el video`);
        });
      }, { once: true });

      video.addEventListener('error', () => {
        if (config.fallbackImg) loadStaticImageDirect(config.fallbackImg, config.name + " (Respaldo)");
      });

      video.load();

      // Temporizador de seguridad: si en 2.5s Android bloquea el video, pasa a la imagen JPG
      setTimeout(() => {
        if (!isPlaying && video.readyState < 3 && config.fallbackImg) {
          videoElementRef.current = null;
          loadStaticImageDirect(config.fallbackImg, config.name + " (Respaldo)");
        }
      }, 2500);

    } else {
      loadStaticImageDirect(config.path, config.name);
    }
  }, [activeEcosystem]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      <div className="absolute z-10 bottom-40 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1.5 bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 shadow-2xl max-w-sm">
          <div className="flex items-center gap-2 justify-center">
            {currentConfig.category === 'DIAGNOSTIC' ? (
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[10px] font-black uppercase flex items-center gap-1"><Stethoscope className="w-3 h-3 text-cyan-400" /> Diagnóstico</span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-black uppercase flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-400" /> Tratamiento / Santuario</span>
            )}
          </div>
          <h1 className="text-slate-200 font-black text-xs uppercase tracking-wider">{currentConfig.name}</h1>
          <p className="text-[11px] text-slate-400">Paciente: <strong className="text-cyan-300">{activePatientId}</strong></p>
          <p className="text-[10px] text-slate-300 font-mono flex items-center justify-center gap-1">
            {mediaType === 'video' && <Video className="w-3 h-3 text-purple-400" />}
            {mediaType === 'image' && <ImageIcon className="w-3 h-3 text-amber-400" />}
            {statusMessage}
          </p>
          <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1.5 ${isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'}`}>
            {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <RefreshCw className="w-3 h-3 animate-spin" />}
            <span>{isConnected ? '🟢 ENLAZADO Y EMITIENDO METRICAS' : '🔴 BUSCANDO RED...'}</span>
          </div>
        </div>
      </div>
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
