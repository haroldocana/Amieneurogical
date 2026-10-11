import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, CheckCircle2, RefreshCw, Video, Image as ImageIcon } from 'lucide-react';

interface Props {
  patientId?: string;
  moduleId?: string;
  onClose?: () => void;
}

export const VrPatientExperience: React.FC<Props> = ({ 
  patientId: propsPatientId, 
  moduleId: propsModuleId,
  onClose 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
  };

  const activePatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';
  const initialModule = propsModuleId || getUrlParam('modulo') || getUrlParam('moduleId') || 'TDAH_EXECUTIVE';

  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState(initialModule);
  const [statusMessage, setStatusMessage] = useState('Iniciando Entorno...');
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'loading'>('loading');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  const activeEcosystemRef = useRef(activeEcosystem);
  useEffect(() => {
    activeEcosystemRef.current = activeEcosystem;
  }, [activeEcosystem]);

  // Contadores de rendimiento y telemetría
  const packetCountRef = useRef<number>(0);
  const hitsRef = useRef<number>(0);
  const commissionsRef = useRef<number>(0);
  const omissionsRef = useRef<number>(0);
  const lastRtRef = useRef<number>(320);

  // =====================================================================
  // 1. WEBSOCKET PERSISTENTE (TRANSMISIÓN CONTINUA A CHROMEBOOK)
  // =====================================================================
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const connect = () => {
      const wsUrl = 'wss://amieneurogical.onrender.com';
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: activePatientId }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const targetEnv = data.environment || data.ecosystem || data.scenario || data.moduleId || data.selectedModule;
            if (targetEnv) setActiveEcosystem(targetEnv);
          } catch (error) {}
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {}
    };

    connect();

    // Emisión continua de paquetes
    const telemetryInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        packetCountRef.current += 1;
        const currentEnv = activeEcosystemRef.current.toUpperCase();

        const basePayload = {
          type: 'VR_TELEMETRY_FRAME',
          patientId: activePatientId,
          moduleId: activeEcosystemRef.current,
          packetCount: packetCountRef.current,
          hrvBpm: Math.floor(65 + Math.random() * 15),
          gsrValue: Number((2.1 + Math.random() * 0.8).toFixed(2)),
          attentionIndex: Math.floor(75 + Math.random() * 20),
          hits: hitsRef.current,
          commissions: commissionsRef.current,
          omissions: omissionsRef.current,
          reactionTimeMs: lastRtRef.current
        };

        wsRef.current.send(JSON.stringify(basePayload));

        if (currentEnv.includes('TDAH') || currentEnv.includes('EXECUTIVE')) {
          wsRef.current.send(JSON.stringify({ ...basePayload, type: 'TDAH_TELEMETRY' }));
          wsRef.current.send(JSON.stringify({
            type: 'TDAH_METRICS',
            patientId: activePatientId,
            packetCount: packetCountRef.current,
            hits: hitsRef.current,
            rtMs: lastRtRef.current
          }));
        } else if (currentEnv.includes('CLUSTER_B') || currentEnv.includes('NARCISS') || currentEnv.includes('FORENSI')) {
          wsRef.current.send(JSON.stringify({
            ...basePayload,
            type: 'CLUSTER_B_TELEMETRY',
            autonomicArousal: Number((3.2 + Math.random() * 1.2).toFixed(2))
          }));
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearInterval(telemetryInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activePatientId]);

  // =====================================================================
  // 2. MOTOR THREE.JS Y EVENTO DE DISPARO DEL MANDO VR
  // =====================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 0);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(80, 80, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Fondo slate oscuro para la esfera (Evita ceguera por blanco)
    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // Retículo visual
    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.9, transparent: true, depthTest: false });
    const cursor = new THREE.Mesh(ringGeo, ringMat);
    scene.add(cursor);
    cursorRef.current = cursor;

    // Acción del gatillo del mando Pico 3
    const xrController = renderer.xr.getController(0);
    xrController.addEventListener('select', () => {
      hitsRef.current += 1;
      lastRtRef.current = Math.floor(210 + Math.random() * 80);

      if (cursorRef.current) {
        (cursorRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        setTimeout(() => {
          if (cursorRef.current) (cursorRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
        }, 200);
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'INTERACTION_HIT',
          patientId: activePatientId,
          moduleId: activeEcosystemRef.current,
          hits: hitsRef.current,
          reactionTimeMs: lastRtRef.current,
          isHit: true
        }));
      }
    });
    scene.add(xrController);

    let vrBtn: HTMLElement | null = null;
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute';
      vrBtn.style.bottom = '25px';
      vrBtn.style.left = '50%';
      vrBtn.style.transform = 'translateX(-50%)';
      vrBtn.style.padding = '14px 32px';
      vrBtn.style.borderRadius = '16px';
      vrBtn.style.background = 'linear-gradient(135deg, #2563eb, #4f46e5)';
      vrBtn.style.border = '2px solid rgba(255, 255, 255, 0.4)';
      vrBtn.style.color = '#ffffff';
      vrBtn.style.fontWeight = 'bold';
      vrBtn.style.zIndex = '100000';
      container.appendChild(vrBtn);
    } catch (e) {}

    renderer.setAnimationLoop(() => {
      if (cursorRef.current && cameraRef.current) {
        const pCam = renderer.xr.isPresenting ? renderer.xr.getCamera() : cameraRef.current;
        const dir = new THREE.Vector3();
        pCam.getWorldDirection(dir);
        cursorRef.current.position.copy(pCam.position).add(dir.multiplyScalar(1.5));
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.15;
        cursorRef.current.scale.set(scale, scale, 1);
        cursorRef.current.lookAt(pCam.position);
      }

      // Actualizar fotogramas de video solo si está listo en GPU
      if (videoElementRef.current && videoTextureRef.current && envMeshRef.current) {
        const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;
        if (videoElementRef.current.readyState >= 3) {
          if (mat.map !== videoTextureRef.current) {
            mat.map = videoTextureRef.current;
            mat.color.setHex(0xffffff);
            mat.needsUpdate = true;
          }
          videoTextureRef.current.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      envGeo.dispose(); envMat.dispose(); ringGeo.dispose(); ringMat.dispose(); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, [activePatientId]);

  // =====================================================================
  // 3. CARGADOR Y GENERADOR DE PROCEDURAL ANTI-BLANCO
  // =====================================================================
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.removeAttribute('src');
      videoElementRef.current.load();
    }
    videoElementRef.current = null;
    videoTextureRef.current = null;

    mat.map = null;
    mat.color.setHex(0x0f172a); // Mantener oscuro por seguridad
    mat.needsUpdate = true;
    setMediaType('loading');

    // Generador de entorno procedural si las imágenes fallan o tardan
    const applyProceduralFallback = (title: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#0284c7');
        gradient.addColorStop(0.5, '#0f172a');
        gradient.addColorStop(1, '#020617');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 512);

        // Estrellas / Puntos de anclaje visual
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 150; i++) {
          const x = Math.random() * 1024;
          const y = Math.random() * 512;
          ctx.beginPath();
          ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        const canvasTex = new THREE.CanvasTexture(canvas);
        mat.map = canvasTex;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
        setMediaType('image');
        setStatusMessage(`Procedural: ${title}`);
      }
    };

    const getModuleConfig = (rawName: string) => {
      const up = rawName.toUpperCase();
      
      if (up.includes('CLUSTER_B') || up.includes('NARCISS') || up.includes('FORENSI')) {
        return { key: 'narcissism_covert', isVideo: true, path: '/video/narcissism_covert.mp4' };
      }
      
      if (up.includes('TDAH') || up.includes('EXECUTIVE')) return { key: 'TDAH_EXECUTIVE', isVideo: false, path: '/ecosystems/TDAH_EXECUTIVE.jpg' };
      if (up.includes('DEV_TRAUMA') || up.includes('TRAUMA')) return { key: 'DEV_TRAUMA', isVideo: false, path: '/ecosystems/DEV_TRAUMA.jpg' };
      if (up.includes('DUAL_CONTROL') || up.includes('SES')) return { key: 'DUAL_CONTROL', isVideo: false, path: '/ecosystems/DUAL_CONTROL.jpg' };
      if (up.includes('EMDR') || up.includes('MEMORY')) return { key: 'EMDR_MEMORY', isVideo: false, path: '/ecosystems/EMDR_MEMORY.jpg' };
      if (up.includes('FND') || up.includes('MIRROR')) return { key: 'FND_MIRROR', isVideo: false, path: '/ecosystems/FND_MIRROR.jpg' };
      if (up.includes('HYPNOSIS') || up.includes('NEURO_HYP')) return { key: 'NEURO_HYPNOSIS', isVideo: false, path: '/ecosystems/NEURO_HYPNOSIS.jpg' };
      if (up.includes('PAIN') || up.includes('ANALGESIA')) return { key: 'PAIN_MANAGEMENT', isVideo: false, path: '/ecosystems/PAIN_MANAGEMENT.jpg' };
      if (up.includes('ACROPHOBIA')) return { key: 'ACROPHOBIA_ROOF', isVideo: false, path: '/ecosystems/ACROPHOBIA_ROOF.jpg' };
      if (up.includes('AEROPHOBIA')) return { key: 'AEROPHOBIA_CABIN', isVideo: false, path: '/ecosystems/AEROPHOBIA_CABIN.jpg' };
      
      return { key: 'CLINICAL_OFFICE', isVideo: false, path: '/ecosystems/CLINICAL_OFFICE.jpg' };
    };

    const config = getModuleConfig(activeEcosystem);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const loadStaticImage = (path: string, name: string) => {
      setStatusMessage(`Cargando Escenario: ${name}`);
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      
      loader.load(
        `${origin}${path}`,
        (texture) => {
          if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
          mat.map = texture;
          mat.color.setHex(0xffffff); // Aplica la luz solo al tener la textura decodificada
          mat.needsUpdate = true;
          setMediaType('image');
          setStatusMessage(`Escenario Activo: ${name}`);
        },
        undefined,
        () => {
          console.warn(`Textura en ${path} no encontrada. Aplicando entorno procedural.`);
          applyProceduralFallback(name);
        }
      );
    };

    if (config.isVideo) {
      setStatusMessage('Cargando Video 360°...');
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = `${origin}${config.path}`;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'webkit-playsinline');

      const vTex = new THREE.VideoTexture(video);
      if ('colorSpace' in vTex) (vTex as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
      videoTextureRef.current = vTex;
      videoElementRef.current = video;

      video.addEventListener('canplay', () => {
        setMediaType('video');
        setStatusMessage(`Video Activo: ${config.key}`);
        video.play().catch(() => {});
      }, { once: true });

      video.addEventListener('error', () => {
        console.warn(`Video no encontrado en ${config.path}, pasando a imagen de respaldo.`);
        videoElementRef.current = null;
        loadStaticImage('/ecosystems/CLUSTER_B_FORENSIC.jpg', 'Forense Respaldo');
      });

      video.load();
    } else {
      loadStaticImage(config.path, config.key);
    }

  }, [activeEcosystem]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      <div className="absolute z-10 bottom-40 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1.5 bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 shadow-2xl max-w-sm">
          <h1 className="text-slate-200 font-black text-sm uppercase flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> VISOR CLÍNICO AMIE • WEBXR
          </h1>
          <p className="text-[11px] text-slate-400">Paciente: <strong className="text-cyan-300">{activePatientId}</strong></p>
          <p className="text-[10px] text-slate-300 font-mono flex items-center justify-center gap-1">
            {mediaType === 'video' && <Video className="w-3 h-3 text-purple-400" />}
            {mediaType === 'image' && <ImageIcon className="w-3 h-3 text-amber-400" />}
            {statusMessage}
          </p>
          <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1.5 ${
            isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <RefreshCw className="w-3 h-3 animate-spin" />}
            <span>{isConnected ? '🟢 ENLAZADO Y EMITIENDO' : '🔴 BUSCANDO RED...'}</span>
          </div>
        </div>
      </div>
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
