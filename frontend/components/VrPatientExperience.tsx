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

  // Estados de la aplicación
  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState('NEUTRAL_LIVING_ROOM');
  const [isVideo, setIsVideo] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Iniciando entorno...');

  // Referencias Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  // =====================================================================
  // 1. WEBSOCKET - CONEXIÓN CON BACKEND EN RENDER (TUNEL RÍGIDO)
  // =====================================================================
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
          setStatusMessage('Conectado al Servidor');
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

            // Capturar payloads de Forense, Cluster B, IA o Cambio de Entorno
            if (data.type === 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA' || data.aiGeneratedAssetUrl) {
              if (data.aiGeneratedAssetUrl) {
                setCustomImageUrl(data.aiGeneratedAssetUrl);
                setStatusMessage('Cargando recurso de IA...');
              }
              if (data.environment || data.ecosystem || data.moduleId) {
                setActiveEcosystem(data.environment || data.ecosystem || data.moduleId);
              }
              if (data.isVideo !== undefined) setIsVideo(!!data.isVideo);
            } else if (data.environment || data.ecosystem || data.type === 'START_FORENSIC_BIO_VR' || data.type === 'START_TEST') {
              setCustomImageUrl(null);
              const env = data.environment || data.ecosystem || data.moduleId || 'NARCISSISM_COVERT';
              setActiveEcosystem(env);
              if (data.isVideo !== undefined) setIsVideo(!!data.isVideo);
              setStatusMessage(`Ensayo Activo: ${env}`);
            }

            if (data.type === 'STOP_TEST' || data.type === 'STOP_FORENSIC_BIO_VR') {
              setActiveEcosystem('NEUTRAL_LIVING_ROOM');
              setCustomImageUrl(null);
              setIsVideo(false);
              setStatusMessage('Evaluación detenida.');
            }
          } catch (error) {
            console.error('Error parseando paquete WS:', error);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
          setStatusMessage('Error de Red WebSocket');
        };

        ws.onclose = () => {
          setIsConnected(false);
          setStatusMessage('Reconectando...');
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.warn('Error iniciando WebSocket:', e);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [patientId, moduleId]);

  // =====================================================================
  // 2. MOTOR GRAPHIC WEBXR PROTEGIDO (NUNCA NEGRO EN STEREO FRAMEBUFFER)
  // =====================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617); // Azul medianoche profundo

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(0, 10, 0);
    scene.add(dirLight);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Rejilla de Suelo 3D de Respaldo Permanente (Evita fotograma negro en VR)
    const gridHelper = new THREE.GridHelper(60, 60, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Habitación/Caja 3D de respaldo con luz
    const boxGeo = new THREE.BoxGeometry(30, 15, 30);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.BackSide, wireframe: false });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    scene.add(boxMesh);

    // Esfera 360 Inmersiva principal
    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // Botón VR WebXR Nativo
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
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
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
      boxGeo.dispose();
      boxMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, []);

  // =====================================================================
  // 3. CARGA PROTEGIDA DE RECURSOS (MAPEO EXPANDIDO Y CONTROL DE ERRORES)
  // =====================================================================
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    // Limpieza de videos anteriores
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.src = '';
      videoElementRef.current.removeAttribute('src');
      videoElementRef.current.load();
      videoElementRef.current = null;
    }
    if (videoTextureRef.current) {
      videoTextureRef.current.dispose();
      videoTextureRef.current = null;
    }

    // Color base seguro mientras se realiza la carga
    mat.map = null;
    mat.color.setHex(0x0284c7);
    mat.needsUpdate = true;

    // Mapeo exhaustivo de claves de módulos (Forense, Cluster B, Fobias, TDAH, etc.)
    const mapEcosystemKey = (rawName: string): string => {
      const upper = rawName.toUpperCase();
      if (upper.includes('NARCISS') || upper.includes('CLUSTER') || upper.includes('FORENSI') || upper.includes('PSICOPAT') || upper.includes('OVERT') || upper.includes('COVERT')) {
        return 'NARCISSISM_COVERT';
      }
      if (upper.includes('07') || upper.includes('SES') || upper.includes('SIS') || upper.includes('SEXUAL')) {
        return 'SEXUAL_HEALTH_SYSTEMIC';
      }
      if (upper.includes('TDAH') || upper.includes('EXECUTIVE')) {
        return 'TDAH_EXECUTIVE';
      }
      if (upper.includes('TAG') || upper.includes('FOBIA') || upper.includes('VRET') || upper.includes('EXPOSICION')) {
        return 'NEUTRAL_LIVING_ROOM';
      }
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

      // Asignar textura ÚNICAMENTE cuando el video esté listo para reproducirse
      const handleCanPlay = () => {
        try {
          const texture = new THREE.VideoTexture(video);
          if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
          videoTextureRef.current = texture;
          
          mat.map = texture;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
          setStatusMessage('Video 360° Activo');

          video.play().catch((e) => console.warn('Autoplay retenido:', e));
        } catch (err) {
          console.error('Error asignando VideoTexture:', err);
        }
      };

      video.addEventListener('canplay', handleCanPlay, { once: true });

      video.addEventListener('error', () => {
        console.warn(`Video /video/${safeKey}.mp4 no encontrado. Fallback a imagen JPG...`);
        setStatusMessage('Cargando textura de respaldo...');

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
          `/ecosystems/${safeKey}.jpg`,
          (fallbackTex) => {
            if ('colorSpace' in fallbackTex) (fallbackTex as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
            mat.map = fallbackTex;
            mat.color.setHex(0xffffff);
            mat.needsUpdate = true;
            setStatusMessage('Entorno 360° (Imagen)');
          },
          undefined,
          () => {
            mat.map = null;
            mat.color.setHex(0x0284c7);
            mat.needsUpdate = true;
            setStatusMessage('Entorno 3D Procedural');
          }
        );
      });

      video.load();

    } else {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      const targetUrl = customImageUrl || `/ecosystems/${safeKey}.jpg`;

      loader.load(
        targetUrl,
        (texture) => {
          if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
          mat.map = texture;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
          setStatusMessage('Entorno Renderizado');
        },
        undefined,
        (err) => {
          console.warn(`Textura no encontrada (${targetUrl}). Intentando imagen por defecto...`, err);
          loader.load(
            '/ecosystems/NEUTRAL_LIVING_ROOM.jpg',
            (fallbackTex) => {
              mat.map = fallbackTex;
              mat.color.setHex(0xffffff);
              mat.needsUpdate = true;
              setStatusMessage('Entorno Base 360°');
            },
            undefined,
            () => {
              mat.map = null;
              mat.color.setHex(0x0284c7);
              mat.needsUpdate = true;
              setStatusMessage('Entorno 3D Procedural');
            }
          );
        }
      );
    }
  }, [activeEcosystem, isVideo, customImageUrl]);

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

      <div className="absolute z-10 bottom-24 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1 bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90 backdrop-blur-md shadow-2xl">
          <h1 className="text-slate-200 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> VISOR CLÍNICO AMIE • WEBXR
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Paciente: <strong className="text-cyan-300">{patientId}</strong>
          </p>
          <p className="text-[10px] text-slate-500 font-mono">{statusMessage}</p>
          
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
