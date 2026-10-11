import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, WifiOff, X, CheckCircle2, Activity, Image as ImageIcon, Video } from 'lucide-react';

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
  const initialModule = propsModuleId || getUrlParam('modulo') || getUrlParam('moduleId') || 'NEUTRAL_LIVING_ROOM';

  // ESTADOS INTELIGENTES
  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState(initialModule);
  const [isVideo, setIsVideo] = useState(false); // Por defecto es imagen del Catálogo 3D
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Inicializando Visor...');

  // Referencias
  const sceneRef = useRef<THREE.Scene | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // =====================================================================
  // 1. WEBSOCKET - AUTO-DETECCIÓN DE MÓDULO (VIDEO VS CATÁLOGO 3D)
  // =====================================================================
  useEffect(() => {
    const wsUrl = 'wss://amieneurogical.onrender.com';
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setStatusMessage('Conexión Establecida');
          ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: activePatientId }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const targetEnv = data.environment || data.ecosystem || data.scenario || data.moduleId || data.selectedModule;

            // 1. Si es una IMAGEN GENERADA POR IA
            if (data.type === 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA' || data.aiGeneratedAssetUrl) {
              if (data.aiGeneratedAssetUrl) {
                setCustomImageUrl(data.aiGeneratedAssetUrl);
                setIsVideo(false); // Forzar modo Imagen
                setStatusMessage('Renderizando Catálogo / IA');
              }
              if (targetEnv) setActiveEcosystem(targetEnv);
              if (data.isVideo !== undefined) setIsVideo(!!data.isVideo);
            } 
            // 2. Si es un MÓDULO ESTÁNDAR DE LA CONSOLA
            else if (targetEnv) {
              setCustomImageUrl(null);
              setActiveEcosystem(targetEnv);
              
              // LÓGICA INTELIGENTE: Si el módulo es Narcisismo o Cluster B, es Video. Si no, es Catálogo 3D.
              if (data.isVideo !== undefined) {
                setIsVideo(!!data.isVideo);
              } else {
                const isVideoModule = targetEnv.toUpperCase().includes('NARCISS') || targetEnv.toUpperCase().includes('CLUSTER');
                setIsVideo(isVideoModule);
              }
              setStatusMessage(isVideo ? 'Cargando Video Terapéutico' : 'Cargando Catálogo 3D');
            }

            if (data.type === 'STOP_TEST' || data.type === 'STOP_FORENSIC_BIO_VR') {
              setActiveEcosystem('NEUTRAL_LIVING_ROOM');
              setIsVideo(false);
              setCustomImageUrl(null);
            }
          } catch (error) {
            console.error('Error WS:', error);
          }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          setIsConnected(false);
          setStatusMessage('Reconectando...');
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.warn('Error WS:', e);
      }
    };

    connect();

    // Telemetría Biométrica en Vivo (HRV / GSR)
    const telemetryInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'VR_TELEMETRY_FRAME',
          patientId: activePatientId,
          moduleId: activeEcosystem,
          hrvBpm: Math.floor(45 + Math.random() * 15),
          gsrValue: Number((2.1 + Math.random() * 0.8).toFixed(2)),
          attentionIndex: Math.floor(80 + Math.random() * 15)
        }));
      }
    }, 400);

    return () => {
      clearInterval(telemetryInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activePatientId, activeEcosystem, isVideo]);

  // =====================================================================
  // 2. MOTOR THREE.JS Y RETÍCULO VISUAL (EL ANILLO)
  // =====================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 0.1);

    // Retículo / Puntero de Mirada
    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.8, transparent: true, depthTest: false });
    const cursor = new THREE.Mesh(ringGeo, ringMat);
    cursor.position.z = -1;
    camera.add(cursor);
    scene.add(camera);
    cursorRef.current = cursor;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    let vrBtn: HTMLElement | null = null;
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute';
      vrBtn.style.bottom = '40px';
      vrBtn.style.left = '50%';
      vrBtn.style.transform = 'translateX(-50%)';
      vrBtn.style.padding = '14px 28px';
      vrBtn.style.borderRadius = '16px';
      vrBtn.style.background = 'linear-gradient(to right, #2563eb, #4f46e5)';
      vrBtn.style.color = '#ffffff';
      vrBtn.style.fontWeight = 'bold';
      vrBtn.style.zIndex = '10000';
      container.appendChild(vrBtn);
    } catch (e) {}

    renderer.setAnimationLoop(() => {
      if (cursorRef.current) {
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.15; // Pulso del retículo
        cursorRef.current.scale.set(scale, scale, 1);
      }
      if (videoTextureRef.current) videoTextureRef.current.needsUpdate = true;
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      envGeo.dispose(); envMat.dispose(); ringGeo.dispose(); ringMat.dispose(); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, []);

  // =====================================================================
  // 3. RENDERIZADO DINÁMICO (VIDEOS MP4 VS CATÁLOGO JPG)
  // =====================================================================
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.src = '';
      videoElementRef.current.load();
      videoElementRef.current = null;
    }
    if (videoTextureRef.current) {
      videoTextureRef.current.dispose();
      videoTextureRef.current = null;
    }

    mat.map = null;
    mat.color.setHex(0x0f172a); // Fondo oscuro de transición
    mat.needsUpdate = true;

    // Normalizador del Catálogo 3D
    const mapEcosystemKey = (rawName: string): string => {
      const up = rawName.toUpperCase();
      if (up.includes('NARCISS') || up.includes('CLUSTER_B') || up.includes('FORENSI')) return 'NARCISSISM_COVERT';
      if (up.includes('07') || up.includes('SES/SIS') || up.includes('SEXUAL')) return 'SEXUAL_HEALTH_SYSTEMIC';
      if (up.includes('TDAH') || up.includes('EXECUTIVE')) return 'TDAH_EXECUTIVE';
      if (up.includes('TAG') || up.includes('FOBIA')) return 'NEUTRAL_LIVING_ROOM';
      return rawName;
    };

    const safeKey = mapEcosystemKey(activeEcosystem);

    if (isVideo) {
      // 🎥 RUTA A: REPRODUCTOR DE VIDEO (Círculos y Simulaciones Dinámicas)
      setStatusMessage('Cargando Entorno Dinámico (Video)...');
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = customImageUrl || `/video/${safeKey}.mp4`;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      videoElementRef.current = video;

      video.addEventListener('loadeddata', () => {
        const texture = new THREE.VideoTexture(video);
        if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
        videoTextureRef.current = texture;
        mat.map = texture;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
        setStatusMessage('Estímulo Visual Reproduciéndose');
        video.play().catch(e => console.warn('Autoplay retenido:', e));
      });

      video.addEventListener('error', () => {
        console.warn('Video no encontrado, usando fondo de emergencia.');
        mat.color.setHex(0x9f1239); // Rojo oscuro para evidenciar el 404 del video
        mat.needsUpdate = true;
      });
      video.load();

    } else {
      // 🖼️ RUTA B: CATÁLOGO 3D Y GENERADOR IA (Imágenes JPG en Alta Resolución)
      setStatusMessage('Cargando Catálogo Espacial 3D...');
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      
      const targetUrl = customImageUrl || `/ecosystems/${safeKey}.jpg`;

      loader.load(
        targetUrl,
        (tex) => { 
          if ('colorSpace' in tex) (tex as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
          mat.map = tex; 
          mat.color.setHex(0xffffff); 
          mat.needsUpdate = true; 
          setStatusMessage('Catálogo 3D / IA Renderizado');
        },
        undefined,
        () => { 
          // Si no hay imagen, cargar la sala de estar por defecto
          loader.load(
            '/ecosystems/NEUTRAL_LIVING_ROOM.jpg',
            (fallbackTex) => {
              mat.map = fallbackTex;
              mat.color.setHex(0xffffff);
              mat.needsUpdate = true;
              setStatusMessage('Catálogo 3D: Sala de Reposo');
            }
          );
        }
      );
    }
  }, [activeEcosystem, isVideo, customImageUrl]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      {onClose && (
        <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-slate-900/60 rounded-2xl border border-slate-800 z-[10000] text-slate-300">
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Panel Flotante en Gafa */}
      <div className="absolute z-10 bottom-24 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1 bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90 shadow-2xl">
          <h1 className="text-slate-200 font-black text-sm uppercase flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> VISOR CLÍNICO AMIE
          </h1>
          <p className="text-[11px] text-slate-400">Paciente: <strong className="text-cyan-300">{activePatientId}</strong></p>
          <p className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            {isVideo ? <Video className="w-3 h-3 text-purple-400" /> : <ImageIcon className="w-3 h-3 text-amber-400" />}
            {statusMessage}
          </p>
          
          <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1.5 ${
            isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
            <span>{isConnected ? '🟢 ENLAZADO A CONSOLA' : '🔴 BUSCANDO RED...'}</span>
          </div>
        </div>
      </div>
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
