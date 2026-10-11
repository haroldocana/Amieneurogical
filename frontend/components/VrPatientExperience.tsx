import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, WifiOff, X, CheckCircle2, Video, Image as ImageIcon } from 'lucide-react';

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
  const initialModule = propsModuleId || getUrlParam('modulo') || getUrlParam('moduleId') || 'NARCISSISM_CLUSTER_B';

  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState(initialModule);
  const [isVideo, setIsVideo] = useState(true);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Verificando Red...');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // =====================================================================
  // 1. WEBSOCKET (CON REINTENTO SILENCIOSO)
  // =====================================================================
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const connect = () => {
      // Intenta conectar al backend principal
      const wsUrl = 'wss://amieneurogical.onrender.com';
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setStatusMessage('🟢 Sincronizado con Consola');
          ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: activePatientId }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const targetEnv = data.environment || data.ecosystem || data.scenario || data.moduleId || data.selectedModule;

            if (data.type === 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA' || data.aiGeneratedAssetUrl) {
              if (data.aiGeneratedAssetUrl) {
                setCustomImageUrl(data.aiGeneratedAssetUrl);
                setIsVideo(false);
              }
              if (targetEnv) setActiveEcosystem(targetEnv);
              if (data.isVideo !== undefined) setIsVideo(!!data.isVideo);
            } else if (targetEnv) {
              setCustomImageUrl(null);
              setActiveEcosystem(targetEnv);
              const isVid = data.isVideo !== undefined 
                ? !!data.isVideo 
                : (targetEnv.toUpperCase().includes('NARCISS') || targetEnv.toUpperCase().includes('CLUSTER') || targetEnv.toUpperCase().includes('FORENSI'));
              setIsVideo(isVid);
            }

            if (data.type === 'STOP_TEST' || data.type === 'STOP_FORENSIC_BIO_VR') {
              setActiveEcosystem('NEUTRAL_LIVING_ROOM');
              setIsVideo(false);
              setCustomImageUrl(null);
            }
          } catch (error) {
            console.error('Error parseando mensaje WS:', error);
          }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          setStatusMessage('Buscando Red WSS...');
          reconnectTimer = setTimeout(connect, 4000);
        };
      } catch (e) {
        console.warn('Error WebSocket:', e);
      }
    };

    connect();

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
      isMounted = false;
      clearInterval(telemetryInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activePatientId, activeEcosystem]);

  // =====================================================================
  // 2. MOTOR THREE.JS Y RETÍCULO (CON PROTECCIÓN GPU)
  // =====================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617); // Fondo siempre definido para evitar crash

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

    // Entorno 360 Inmersivo (Inicia en azul seguro)
    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // Anillo Visual 3D
    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.9, transparent: true, depthTest: false });
    const cursor = new THREE.Mesh(ringGeo, ringMat);
    scene.add(cursor);
    cursorRef.current = cursor;

    // Eventos universales para forzar reproducción de video sin bloqueos
    const forceVideoPlay = () => {
      if (videoElementRef.current && videoElementRef.current.paused) {
        videoElementRef.current.play().catch(() => {});
      }
    };
    renderer.xr.addEventListener('sessionstart', forceVideoPlay);
    window.addEventListener('click', forceVideoPlay);
    window.addEventListener('pointerdown', forceVideoPlay);

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

    // BUCLE PRINCIPAL PROTEGIDO
    renderer.setAnimationLoop(() => {
      // 1. Lógica del Retículo
      if (cursorRef.current && cameraRef.current) {
        const pCam = renderer.xr.isPresenting ? renderer.xr.getCamera() : cameraRef.current;
        const dir = new THREE.Vector3();
        pCam.getWorldDirection(dir);
        cursorRef.current.position.copy(pCam.position).add(dir.multiplyScalar(1.5));
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.15;
        cursorRef.current.scale.set(scale, scale, 1);
        cursorRef.current.lookAt(pCam.position);
      }

      // 2. Inyección Segura de VideoTexture (EVITA PANTALLA NEGRA)
      if (videoElementRef.current && videoTextureRef.current && envMeshRef.current) {
        const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;
        // Solo asigna la textura si la GPU tiene suficientes datos del video (HAVE_FUTURE_DATA)
        if (videoElementRef.current.readyState >= 3) {
          if (mat.map !== videoTextureRef.current) {
            mat.map = videoTextureRef.current;
            mat.color.setHex(0xffffff);
            mat.needsUpdate = true;
            setStatusMessage('Video Estímulo en Reproducción');
          }
          videoTextureRef.current.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    });

    const handleResize = () => {
      if (!container) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.xr.removeEventListener('sessionstart', forceVideoPlay);
      window.removeEventListener('click', forceVideoPlay);
      window.removeEventListener('pointerdown', forceVideoPlay);
      renderer.setAnimationLoop(null);
      envGeo.dispose(); envMat.dispose(); ringGeo.dispose(); ringMat.dispose(); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, []);

  // =====================================================================
  // 3. CARGA DE ARCHIVOS MULTIMEDIA (VIDEOS E IMÁGENES)
  // =====================================================================
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    // Limpiar anterior
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

    // Fondo azul temporal seguro
    mat.map = null;
    mat.color.setHex(0x0284c7); 
    mat.needsUpdate = true;

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
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = customImageUrl || `/video/${safeKey}.mp4`;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'webkit-playsinline'); // Vital para Android WebXR
      videoElementRef.current = video;

      const texture = new THREE.VideoTexture(video);
      if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
      videoTextureRef.current = texture;

      video.addEventListener('error', () => {
        console.warn(`Video /video/${safeKey}.mp4 falló. Cambiando a imagen JPG.`);
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
          `/ecosystems/${safeKey}.jpg`,
          (tex) => { mat.map = tex; mat.color.setHex(0xffffff); mat.needsUpdate = true; }
        );
      });

      // NO asiganamos la textura aquí, se asigna en el AnimationLoop
      video.load();
      setStatusMessage('Decodificando Video para VR...');

    } else {
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
          setStatusMessage('Catálogo 3D Cargado');
        },
        undefined,
        () => {
          mat.map = null;
          mat.color.setHex(0x0284c7);
          mat.needsUpdate = true;
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

      {/* Interfaz Flotante de Estado */}
      <div className="absolute z-10 bottom-24 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1 bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90 shadow-2xl">
          <h1 className="text-slate-200 font-black text-sm uppercase flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> VISOR CLÍNICO AMIE • WEBXR
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
            <span>{isConnected ? '🟢 ENLAZADO A CONSOLA' : '🔴 BUSCANDO RED WSS...'}</span>
          </div>
        </div>
      </div>
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
