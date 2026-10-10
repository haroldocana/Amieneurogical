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

  // Referencias Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  // 1. CONEXIÓN DIRECTA Y FORZADA AL BACKEND EN RENDER (WEBSOCKETS)
  useEffect(() => {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    
    // 🔥 APUNTAR AL BACKEND DE RENDER (NO A WINDOW.LOCATION.HOST)
    const wsUrl = `${protocol}//amieneurogical.onrender.com`;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        console.log('🔌 Conectando WebSocket a:', wsUrl);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ WebSocket Conectado en VrPatientExperience');
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
            if (data.environment || data.ecosystem) {
              setActiveEcosystem(data.environment || data.ecosystem);
            }
            if (data.isVideo !== undefined) {
              setIsVideo(!!data.isVideo);
            }
            if (data.type === 'STOP_TEST') {
              setActiveEcosystem('NEUTRAL_LIVING_ROOM');
              setIsVideo(false);
            }
          } catch (error) {
            console.error('Error procesando mensaje WS:', error);
          }
        };

        ws.onerror = (err) => {
          console.warn('⚠️ Error WebSocket en VrPatientExperience:', err);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.warn('❌ WebSocket cerrado en VrPatientExperience. Reintentando...');
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.warn('Error iniciando WebSocket:', e);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
      }
    };
  }, [patientId, moduleId]);

  // 2. ESCENA THREE.JS CON RETÍCULA Y SOPORTE WEBXR
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Rejilla de suelo 3D visible
    const gridHelper = new THREE.GridHelper(50, 50, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Esfera 360 para fotos/videos
    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // Botón VR Nativo WebXR
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
      vrBtn.style.border = '1px solid rgba(255, 255, 255, 0.3)';
      vrBtn.style.color = '#ffffff';
      vrBtn.style.fontFamily = 'sans-serif';
      vrBtn.style.fontSize = '12px';
      vrBtn.style.fontWeight = 'bold';
      vrBtn.style.textTransform = 'uppercase';
      vrBtn.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)';
      vrBtn.style.cursor = 'pointer';
      vrBtn.style.zIndex = '10000';
      container.appendChild(vrBtn);
    } catch (e) {
      console.warn('VRButton no disponible:', e);
    }

    // Arrastre con puntero
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

    // Bucle de renderizado
    renderer.setAnimationLoop(() => {
      if (videoTextureRef.current) {
        videoTextureRef.current.needsUpdate = true;
      }
      if (!renderer.xr.isPresenting) {
        lat = Math.max(-85, Math.min(85, lat));
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(100 * Math.sin(phi) * Math.cos(theta), 100 * Math.cos(phi), 100 * Math.sin(phi) * Math.sin(theta));
      }
      renderer.render(scene, camera);
    });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.setAnimationLoop(null);
      envGeo.dispose();
      envMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, []);

  // 3. CARGA DE TEXTURAS (JPG O MP4)
  useEffect(() => {
    if (!envMeshRef.current || !activeEcosystem) return;
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

    if (isVideo) {
      const video = document.createElement('video');
      video.src = `/video/${activeEcosystem}.mp4`;
      video.crossOrigin = 'anonymous';
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
        console.warn('Autoplay bloqueado:', e);
        mat.color.setHex(0x0284c7);
        mat.needsUpdate = true;
      });
    } else {
      const loader = new THREE.TextureLoader();
      loader.load(
        `/ecosystems/${activeEcosystem}.jpg`,
        (texture) => {
          mat.map = texture;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
        },
        undefined,
        () => {
          mat.map = null;
          mat.color.setHex(0x0284c7);
          mat.needsUpdate = true;
        }
      );
    }
  }, [activeEcosystem, isVideo]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      {onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-4 bg-slate-900/60 hover:bg-slate-800 rounded-2xl border border-slate-800 z-[10000] cursor-pointer text-slate-300 hover:text-white backdrop-blur-md transition"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Interfaz de Estado Flotante en la Gafa */}
      <div className="absolute z-10 bottom-24 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1 bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90 backdrop-blur-md shadow-2xl">
          <h1 className="text-slate-200 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> VISOR CLÍNICO AMIE • WEBXR
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Paciente: <strong className="text-cyan-300">{patientId}</strong> | Bucle Cerrado
          </p>
          <p className="text-[10px] text-slate-500 font-mono">Entorno: {activeEcosystem}</p>
          
          <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1.5 ${
            isConnected 
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' 
              : 'bg-rose-950/80 border-rose-500 text-rose-400'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
            <span>{isConnected ? '🟢 Sincronizado con Servidor' : '🔴 Buscando Red...'}</span>
          </div>
        </div>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0 bg-slate-950 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
