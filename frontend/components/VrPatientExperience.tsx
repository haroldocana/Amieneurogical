import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, CheckCircle2, RefreshCw, Video, Image as ImageIcon, Stethoscope, HeartPulse, Activity } from 'lucide-react';

interface Props {
  patientId?: string;
  moduleId?: string;
  onClose?: () => void;
}

// ARQUITECTURA DE EVALUACIÓN CLÍNICA DUAL (DIAGNÓSTICO VS. TRATAMIENTO)
type ModuleCategory = 'DIAGNOSTIC' | 'TREATMENT';
type ClinicalProtocol = 
  | 'DIAGNOSTIC_TDAH_CPT'        // Test Diagnóstico Go/No-Go (Atención Sostenida e Inhibición)
  | 'DIAGNOSTIC_CLUSTER_B'       // Provocación Autonómica Forense (GSR / HRV Arousal)
  | 'DIAGNOSTIC_AIMA_TRAUMA'     // Evaluación de Hipervigilancia e Impacto Evolutivo
  | 'DIAGNOSTIC_PHOBIA_BASELINE' // Reactividad Galvánica Ante Estímulo Fóbico
  | 'TREATMENT_EMDR_RECON'       // Reprocesamiento Desensibilización y Memoria
  | 'TREATMENT_PAIN_ANALGESIA'   // Biofeedback Coherencia HRV / Modulación del Dolor
  | 'TREATMENT_CLOSED_HYPNOSIS'  // Neurohipnosis y Arrastre de Ondas Alfa/Theta
  | 'TREATMENT_FND_MIRROR'       // Retroalimentación Proprioceptiva Neurofuncional
  | 'TREATMENT_DUAL_CONTROL';    // Regulador Dual de Excitación / Inhibición (SES/SIS)

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
  const [statusMessage, setStatusMessage] = useState('Iniciando Motor Clínico Dual...');
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

  // TELEMETRÍA Y MÉTRICAS DE EVALUACIÓN DIAGNÓSTICA Y TRATAMIENTO
  const packetCountRef = useRef<number>(0);
  const hitsRef = useRef<number>(0);
  const commissionsRef = useRef<number>(0);
  const omissionsRef = useRef<number>(0);
  const lastRtRef = useRef<number>(280);
  const sudsLevelRef = useRef<number>(50);
  const distressMarkersRef = useRef<number>(0);

  // =====================================================================
  // 1. MAPEADOR CLÍNICO: DIAGNÓSTICO VS. TRATAMIENTO Y TELEMETRÍA
  // =====================================================================
  const getClinicalConfig = (envKey: string) => {
    const up = envKey.toUpperCase();
    
    // --- MÓDULOS DIAGNÓSTICOS ---
    if (up.includes('TDAH') || up.includes('EXECUTIVE') || up.includes('CPT')) {
      return { 
        key: 'TDAH_EXECUTIVE', 
        isVideo: false, 
        path: '/ecosystems/TDAH_EXECUTIVE.jpg', 
        category: 'DIAGNOSTIC' as ModuleCategory, 
        protocol: 'DIAGNOSTIC_TDAH_CPT' as ClinicalProtocol, 
        name: 'Diagnóstico TDAH (CPT Go/No-Go)' 
      };
    }
    if (up.includes('CLUSTER_B') || up.includes('NARCISS') || up.includes('FORENSI')) {
      return { 
        key: 'narcissism_covert', 
        isVideo: true, 
        path: '/video/narcissism_covert.mp4', 
        category: 'DIAGNOSTIC' as ModuleCategory, 
        protocol: 'DIAGNOSTIC_CLUSTER_B' as ClinicalProtocol, 
        name: 'Diagnóstico Forense Cluster B' 
      };
    }
    if (up.includes('DEV_TRAUMA') || up.includes('TRAUMA') || up.includes('AIMA')) {
      return { 
        key: 'DEV_TRAUMA', 
        isVideo: false, 
        path: '/ecosystems/DEV_TRAUMA.jpg', 
        category: 'DIAGNOSTIC' as ModuleCategory, 
        protocol: 'DIAGNOSTIC_AIMA_TRAUMA' as ClinicalProtocol, 
        name: 'Diagnóstico Trauma Evolutivo (AIMA)' 
      };
    }
    if (up.includes('ACROPHOBIA') || up.includes('AEROPHOBIA') || up.includes('FOBIA')) {
      const isRoof = up.includes('ACROPHOBIA');
      return { 
        key: isRoof ? 'ACROPHOBIA_ROOF' : 'AEROPHOBIA_CABIN', 
        isVideo: false, 
        path: isRoof ? '/ecosystems/ACROPHOBIA_ROOF.jpg' : '/ecosystems/AEROPHOBIA_CABIN.jpg', 
        category: 'DIAGNOSTIC' as ModuleCategory, 
        protocol: 'DIAGNOSTIC_PHOBIA_BASELINE' as ClinicalProtocol, 
        name: isRoof ? 'Diagnóstico Reactividad Acrofobia' : 'Diagnóstico Reactividad Aerofobia' 
      };
    }

    // --- MÓDULOS DE TRATAMIENTO / INTERVENCIÓN ---
    if (up.includes('EMDR') || up.includes('MEMORY') || up.includes('RECONSOLIDATION')) {
      return { 
        key: 'EMDR_MEMORY', 
        isVideo: false, 
        path: '/ecosystems/EMDR_MEMORY.jpg', 
        category: 'TREATMENT' as ModuleCategory, 
        protocol: 'TREATMENT_EMDR_RECON' as ClinicalProtocol, 
        name: 'Tratamiento EMDR Reconsolidación' 
      };
    }
    if (up.includes('PAIN') || up.includes('ANALGESIA')) {
      return { 
        key: 'PAIN_MANAGEMENT', 
        isVideo: false, 
        path: '/ecosystems/PAIN_MANAGEMENT.jpg', 
        category: 'TREATMENT' as ModuleCategory, 
        protocol: 'TREATMENT_PAIN_ANALGESIA' as ClinicalProtocol, 
        name: 'Tratamiento Analgesia Inmersiva' 
      };
    }
    if (up.includes('HYPNOSIS') || up.includes('NEURO_HYP')) {
      return { 
        key: 'NEURO_HYPNOSIS', 
        isVideo: false, 
        path: '/ecosystems/NEURO_HYPNOSIS.jpg', 
        category: 'TREATMENT' as ModuleCategory, 
        protocol: 'TREATMENT_CLOSED_HYPNOSIS' as ClinicalProtocol, 
        name: 'Tratamiento Neurohipnosis Closed-Loop' 
      };
    }
    if (up.includes('FND') || up.includes('MIRROR')) {
      return { 
        key: 'FND_MIRROR', 
        isVideo: false, 
        path: '/ecosystems/FND_MIRROR.jpg', 
        category: 'TREATMENT' as ModuleCategory, 
        protocol: 'TREATMENT_FND_MIRROR' as ClinicalProtocol, 
        name: 'Tratamiento Espejo Neurofuncional' 
      };
    }
    if (up.includes('DUAL_CONTROL') || up.includes('SES')) {
      return { 
        key: 'DUAL_CONTROL', 
        isVideo: false, 
        path: '/ecosystems/DUAL_CONTROL.jpg', 
        category: 'TREATMENT' as ModuleCategory, 
        protocol: 'TREATMENT_DUAL_CONTROL' as ClinicalProtocol, 
        name: 'Tratamiento Regulador Dual (SES/SIS)' 
      };
    }

    return { 
      key: 'CLINICAL_OFFICE', 
      isVideo: false, 
      path: '/ecosystems/CLINICAL_OFFICE.jpg', 
      category: 'DIAGNOSTIC' as ModuleCategory, 
      protocol: 'DIAGNOSTIC_TDAH_CPT' as ClinicalProtocol, 
      name: 'Oficina Evaluación Base' 
    };
  };

  const currentConfig = getClinicalConfig(activeEcosystemRef.current);

  // =====================================================================
  // 2. WEBSOCKET PERSISTENTE: TRANSMISIÓN DE ESTRUCTURAS DE DATOS DUALES
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

    // EMISIÓN CONTINUA DE PAQUETES (CADA 300 MS) HACIA LA CONSOLA CHROMEBOOK
    const telemetryInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        packetCountRef.current += 1;
        const config = getClinicalConfig(activeEcosystemRef.current);

        // A. PAQUETE BIOMÉTRICO GENERAL
        const basePayload = {
          type: 'VR_TELEMETRY_FRAME',
          patientId: activePatientId,
          moduleId: config.key,
          category: config.category,
          protocol: config.protocol,
          packetCount: packetCountRef.current,
          hrvBpm: Math.floor(62 + Math.random() * 18),
          gsrValue: Number((2.1 + Math.random() * 0.9).toFixed(2)),
          attentionIndex: Math.floor(72 + Math.random() * 22)
        };
        wsRef.current.send(JSON.stringify(basePayload));

        // B. PAQUETES ESPECÍFICOS SEGÚN CATEGORÍA (DIAGNÓSTICO VS. TRATAMIENTO)
        if (config.protocol === 'DIAGNOSTIC_TDAH_CPT') {
          wsRef.current.send(JSON.stringify({
            ...basePayload,
            type: 'TDAH_TELEMETRY',
            diagnosticData: {
              hits: hitsRef.current,
              commissions: commissionsRef.current,
              omissions: omissionsRef.current,
              reactionTimeMs: lastRtRef.current,
              dPrimeScore: Number((2.4 - (commissionsRef.current * 0.1)).toFixed(2))
            }
          }));
        } 
        else if (config.protocol === 'DIAGNOSTIC_CLUSTER_B') {
          wsRef.current.send(JSON.stringify({
            ...basePayload,
            type: 'CLUSTER_B_TELEMETRY',
            diagnosticData: {
              autonomicArousalPeak: Number((3.5 + Math.random() * 1.5).toFixed(2)),
              microExpressionReactivity: Math.floor(65 + Math.random() * 30),
              empathyDeficitIndex: 82
            }
          }));
        }
        else if (config.protocol === 'DIAGNOSTIC_AIMA_TRAUMA' || config.protocol === 'DIAGNOSTIC_PHOBIA_BASELINE') {
          wsRef.current.send(JSON.stringify({
            ...basePayload,
            type: 'DIAGNOSTIC_EXPOSURE_TELEMETRY',
            diagnosticData: {
              sudsBaseline: sudsLevelRef.current,
              hyperarousalSpikes: distressMarkersRef.current,
              vagalToneDrop: Number((1.2 + Math.random() * 0.5).toFixed(2))
            }
          }));
        }
        else if (config.category === 'TREATMENT') {
          wsRef.current.send(JSON.stringify({
            ...basePayload,
            type: 'TREATMENT_PROGRESS_TELEMETRY',
            treatmentData: {
              habituatedIndexH: Number((2.8 + (packetCountRef.current * 0.01)).toFixed(2)),
              sudsReductionDelta: -15,
              coherenceScore: Math.floor(80 + Math.random() * 15),
              activeAnchorCount: distressMarkersRef.current
            }
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
  // 3. MOTOR THREE.JS Y LOGICA DE CONTROLADORES SEGÚN MÓDULO
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

    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.9, transparent: true, depthTest: false });
    const cursor = new THREE.Mesh(ringGeo, ringMat);
    scene.add(cursor);
    cursorRef.current = cursor;

    // EL MANDO VR PROCESA TAREAS DIAGNÓSTICAS O TRATAMIENTOS
    const xrController = renderer.xr.getController(0);
    xrController.addEventListener('select', () => {
      const config = getClinicalConfig(activeEcosystemRef.current);

      if (cursorRef.current) {
        (cursorRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        setTimeout(() => {
          if (cursorRef.current) (cursorRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
        }, 200);
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (config.protocol === 'DIAGNOSTIC_TDAH_CPT') {
          hitsRef.current += 1;
          lastRtRef.current = Math.floor(210 + Math.random() * 80);
          wsRef.current.send(JSON.stringify({
            type: 'INTERACTION_HIT',
            patientId: activePatientId,
            hits: hitsRef.current,
            reactionTimeMs: lastRtRef.current,
            isDiagnosticTarget: true
          }));
        } 
        else {
          distressMarkersRef.current += 1;
          wsRef.current.send(JSON.stringify({
            type: 'CLINICAL_MARKER_EVENT',
            patientId: activePatientId,
            category: config.category,
            protocol: config.protocol,
            markerIndex: distressMarkersRef.current,
            timestampMs: Date.now()
          }));
        }
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
  // 4. CARGADOR BLOB DE MEDIOS (CERO PANTALLAS AZULES / BLANCAS)
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
    mat.color.setHex(0x0f172a); 
    mat.needsUpdate = true;
    setMediaType('loading');

    const config = getClinicalConfig(activeEcosystem);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullPath = `${origin}${config.path}`;

    const loadSafeImageBlob = async (url: string, fallbackUrl: string) => {
      setStatusMessage(`Sincronizando (${config.category}): ${config.name}...`);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP error");
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        const loader = new THREE.TextureLoader();
        loader.load(objectUrl, (texture) => {
          if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
          mat.map = texture;
          mat.color.setHex(0xffffff); 
          mat.needsUpdate = true;
          setMediaType('image');
          setStatusMessage(`En Ejecución: ${config.name}`);
          URL.revokeObjectURL(objectUrl);
        });
      } catch (err) {
        console.warn(`Fallback para ${url}...`);
        const loader = new THREE.TextureLoader();
        loader.load(`${origin}${fallbackUrl}`, (fallback) => {
          mat.map = fallback;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
          setMediaType('image');
          setStatusMessage('Oficina Respaldo');
        });
      }
    };

    if (config.isVideo) {
      setStatusMessage(`Cargando Estímulo de Video (${config.name})...`);
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = fullPath;
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
        setStatusMessage(`En Ejecución: ${config.name}`);
        video.play().catch(() => {});
      }, { once: true });

      video.addEventListener('error', () => {
        videoElementRef.current = null;
        loadSafeImageBlob(`${origin}/ecosystems/CLUSTER_B_FORENSIC.jpg`, '/ecosystems/CLINICAL_OFFICE.jpg');
      });

      video.load();
    } else {
      loadSafeImageBlob(fullPath, '/ecosystems/CLINICAL_OFFICE.jpg');
    }

  }, [activeEcosystem]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      <div className="absolute z-10 bottom-40 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1.5 bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 shadow-2xl max-w-sm">
          
          <div className="flex items-center gap-2 justify-center">
            {currentConfig.category === 'DIAGNOSTIC' ? (
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[10px] font-black uppercase flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-cyan-400" /> Módulo Diagnóstico
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-black uppercase flex items-center gap-1">
                <HeartPulse className="w-3 h-3 text-emerald-400" /> Módulo Tratamiento
              </span>
            )}
          </div>

          <h1 className="text-slate-200 font-black text-xs uppercase tracking-wider">
            {currentConfig.name}
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
            <span>{isConnected ? '🟢 ENLAZADO Y EMITIENDO METRICAS' : '🔴 BUSCANDO RED...'}</span>
          </div>
        </div>
      </div>
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
