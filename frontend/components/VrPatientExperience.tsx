import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, WifiOff, X, CheckCircle2 } from 'lucide-react';

interface Props {
  patientId?: string;
  moduleId?: string;
  onClose?: () => void;
}

export const VrPatientExperience: React.FC<Props> = ({ 
  patientId = 'PAC-8104', 
  moduleId = 'NARCISSISM_CLUSTER_B',
  onClose 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState('NEUTRAL_LIVING_ROOM');
  const [isVideo, setIsVideo] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  // Referencias Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  // 1. WEBSOCKET - CONEXIÓN CON BACKEND EN RENDER
  useEffect(() => {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//amieneurogical.onrender.com`;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          ws?.send(JSON.stringify({ 
            type: 'HANDSHAKE', 
            role: 'receiver', 
            patientId,
            moduleId 
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA' || data.aiGeneratedAssetUrl) {
              if (data.aiGeneratedAssetUrl) setCustomImageUrl(data.aiGeneratedAssetUrl);
              if (data.environment || data.ecosystem) setActiveEcosystem(data.environment || data.ecosystem);
              if (data.isVideo !== undefined) setIsVideo(!!data.isVideo);
            } else if (data.environment || data.ecosystem) {
              setCustomImageUrl(null);
              setActiveEcosystem(data.environment || data.ecosystem);
              if (data.isVideo !== undefined) setIsVideo(!!data.isVideo);
            }

            if (data.type === 'STOP_TEST') {
              setActiveEcosystem('NEUTRAL_LIVING_ROOM');
              setCustomImageUrl(null);
              setIsVideo(false);
            }
          } catch (error) {
            console.error('Error parseando paquete WS:', error);
          }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.warn('Error WebSocket:', e);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [patientId, moduleId]);

  // 2. MOTOR GRAPHIC WEBXR PROTEGIDO (Evita pantalla negra en Pico 3)
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // Fondo Slate permanente

    // Iluminación para asegurar visibilidad dentro de la gafa
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Rejilla de Suelo 3D (Garantiza que SIEMPRE haya una referencia espacial en VR)
    const gridHelper = new THREE.GridHelper(60, 60, 0x38bdf8, 0x334155);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Esfera 360 Inmersiva
    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // Botón VR WebXR
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
    } catch (e) {
      console.warn('VRButton error:', e);
    }

    // Bucle de Animación WebXR
    renderer.setAnimationLoop(() => {
      if (videoTextureRef.current) {
        videoTextureRef.current.needsUpdate = true;
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
      renderer.setAnimationLoop(null);
      envGeo.dispose();
      envMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, []);

  // 3. CARGA DE TEXTURAS / MEDIOS CON SOPORTE CORS
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.src = '';
      videoElementRef.current = null;
    }
    if (videoTextureRef.current) {
      videoTextureRef.current.dispose();
      videoTextureRef.current = null;
    }

    mat.map = null;
    mat.color.setHex(0x0284c7); // Cyan luminoso de respaldo
    mat.needsUpdate = true;

    const mapEcosystemKey = (rawName: string): string => {
      if (rawName.includes('07') || rawName.includes('SES/SIS')) return 'SEXUAL_HEALTH_SYSTEMIC';
      if (rawName.includes('NARCISSISM')) return 'NARCISSISM_COVERT';
      if (rawName.includes('TDAH')) return 'TDAH_EXECUTIVE';
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
      videoElementRef.current = video;

      video.play().then(() => {
        const texture = new THREE.VideoTexture(video);
        videoTextureRef.current = texture;
        mat.map = texture;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
      }).catch((e) => {
        console.warn('Autoplay error:', e);
      });
    } else {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      const targetUrl = customImageUrl || `/ecosystems/${safeKey}.jpg`;

      loader.load(
        targetUrl,
        (texture) => {
          mat.map = texture;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
        },
        undefined,
        () => {
          // Si no existe la imagen, pintar en color Cyan sólido sin colapsar
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

      <div className="absolute z-10 bottom-24 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1 bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90 shadow-2xl">
          <h1 className="text-slate-200 font-black text-sm uppercase flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> VISOR CLÍNICO AMIE • WEBXR
          </h1>
          <p className="text-[11px] text-slate-400">Paciente: <strong className="text-cyan-300">{patientId}</strong></p>
          <p className="text-[10px] text-slate-500 font-mono">Entorno: {activeEcosystem}</p>
          
          <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1.5 ${
            isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
            <span>{isConnected ? '🟢 Sincronizado con Servidor' : '🔴 Buscando Red...'}</span>
          </div>
        </div>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
