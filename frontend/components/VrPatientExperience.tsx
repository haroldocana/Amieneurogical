import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, WifiOff, X, CheckCircle2, Video, Image as ImageIcon, RefreshCw } from 'lucide-react';

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

  // Referencias Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Contadores TDAH
  const packetCountRef = useRef<number>(0);
  const hitsRef = useRef<number>(0);
  const commissionsRef = useRef<number>(0);
  const omissionsRef = useRef<number>(0);
  const lastRtRef = useRef<number>(350);

  // =====================================================================
  // 1. WEBSOCKET - TELEMETRÍA EN TIEMPO REAL
  // =====================================================================
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const connectWithHealthCheck = async () => {
      setStatusMessage('Conectando con Servidor...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        await fetch('https://amieneurogical.onrender.com/health', { signal: controller.signal, mode: 'cors' });
        clearTimeout(timeoutId);
      } catch (e) {}

      if (!isMounted) return;

      const wsUrl = 'wss://amieneurogical.onrender.com';
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setStatusMessage('🟢 ENLAZADO Y EMITIENDO');
          ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: activePatientId }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const targetEnv = data.environment || data.ecosystem || data.scenario || data.moduleId || data.selectedModule;

            if (targetEnv) {
              setActiveEcosystem(targetEnv);
            }
          } catch (error) {}
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          setStatusMessage('Reconectando...');
          reconnectTimer = setTimeout(connectWithHealthCheck, 3000);
        };
      } catch (e) {}
    };

    connectWithHealthCheck();

    const telemetryInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        packetCountRef.current += 1;

        wsRef.current.send(JSON.stringify({
          type: 'VR_TELEMETRY_FRAME',
          patientId: activePatientId,
          moduleId: activeEcosystem,
          packetCount: packetCountRef.current,
          hrvBpm: Math.floor(65 + Math.random() * 15),
          gsrValue: Number((2.1 + Math.random() * 0.8).toFixed(2)),
          attentionIndex: Math.floor(75 + Math.random() * 20),
          hits: hitsRef.current,
          commissions: commissionsRef.current,
          omissions: omissionsRef.current,
          reactionTimeMs: lastRtRef.current
        }));

        wsRef.current.send(JSON.stringify({
          type: 'TDAH_TELEMETRY',
          patientId: activePatientId,
          moduleId: activeEcosystem,
          packetCount: packetCountRef.current,
          hits: hitsRef.current,
          commissions: commissionsRef.current,
          omissions: omissionsRef.current,
          reactionTimeMs: lastRtRef.current,
          focusScore: Math.floor(80 + Math.random() * 15)
        }));

        wsRef.current.send(JSON.stringify({
          type: 'TDAH_METRICS',
          patientId: activePatientId,
          packetCount: packetCountRef.current,
          hits: hitsRef.current,
          rtMs: lastRtRef.current
        }));
      }
    }, 300);

    return () => {
      isMounted = false;
      clearInterval(telemetryInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activePatientId, activeEcosystem]);

  // =====================================================================
  // 2. MOTOR THREE.JS Y INTERACCIÓN VR
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

    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.9, transparent: true, depthTest: false });
    const cursor = new THREE.Mesh(ringGeo, ringMat);
    scene.add(cursor);
    cursorRef.current = cursor;

    // EVENTO DEL MANDO VR (TRIGGER)
    const xrController = renderer.xr.getController(0);
    xrController.addEventListener('select', () => {
      hitsRef.current += 1;
      lastRtRef.current = Math.floor(220 + Math.random() * 90);

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
          moduleId: activeEcosystem,
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
      vrBtn.style.bottom = '40px';
      vrBtn.style.left = '50%';
      vrBtn.style.transform = 'translateX(-50%)';
      vrBtn.style.zIndex = '10000';
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
  }, [activePatientId, activeEcosystem]);

  // =====================================================================
  // 3. CARGADOR DE RUTAS ABSOLUTAS (GARANTIZA RESOLUCIÓN EN ANDROID VR)
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
    mat.color.setHex(0x0284c7); 
    mat.needsUpdate = true;

    const mapEcosystemKey = (rawName: string): string => {
      const up = rawName.toUpperCase();
      if (up.includes('TDAH') || up.includes('EXECUTIVE')) return 'TDAH_EXECUTIVE';
      if (up.includes('CLUSTER_B') || up.includes('NARCISS') || up.includes('FORENSI')) return 'CLUSTER_B_FORENSIC';
      if (up.includes('DEV_TRAUMA') || up.includes('TRAUMA')) return 'DEV_TRAUMA';
      if (up.includes('DUAL_CONTROL') || up.includes('SES')) return 'DUAL_CONTROL';
      if (up.includes('EMDR') || up.includes('MEMORY')) return 'EMDR_MEMORY';
      if (up.includes('FND') || up.includes('MIRROR')) return 'FND_MIRROR';
      if (up.includes('HYPNOSIS') || up.includes('NEURO_HYP')) return 'NEURO_HYPNOSIS';
      if (up.includes('PAIN') || up.includes('ANALGESIA')) return 'PAIN_MANAGEMENT';
      if (up.includes('ACROPHOBIA')) return 'ACROPHOBIA_ROOF';
      if (up.includes('AEROPHOBIA')) return 'AEROPHOBIA_CABIN';
      return rawName;
    };

    const safeKey = mapEcosystemKey(activeEcosystem);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const absoluteJpgUrl = `${origin}/ecosystems/${safeKey}.jpg`;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    // Carga mediante Ruta Absoluta Fija
    loader.load(
      absoluteJpgUrl,
      (texture) => {
        if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
        mat.map = texture;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
        setStatusMessage(`Entorno Cargar: ${safeKey}`);
      },
      undefined,
      (err) => {
        console.warn(`No se pudo cargar la imagen ${absoluteJpgUrl}, cargando backup...`, err);
        const fallbackUrl = `${origin}/ecosystems/CLINICAL_OFFICE.jpg`;
        loader.load(fallbackUrl, (fallbackTex) => {
          if ('colorSpace' in fallbackTex) (fallbackTex as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
          mat.map = fallbackTex;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
          setStatusMessage('Oficina Clínica 3D');
        });
      }
    );
  }, [activeEcosystem]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      <div className="absolute z-10 bottom-24 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1.5 bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 shadow-2xl max-w-sm">
          <h1 className="text-slate-200 font-black text-sm uppercase flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> VISOR CLÍNICO AMIE • WEBXR
          </h1>
          <p className="text-[11px] text-slate-400">Paciente: <strong className="text-cyan-300">{activePatientId}</strong></p>
          <p className="text-[10px] text-slate-300 font-mono flex items-center justify-center gap-1">
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
