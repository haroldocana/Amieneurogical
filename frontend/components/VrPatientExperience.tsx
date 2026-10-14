// ============================================================================
// AMIE CLINICAL COPILOT - EXPERIENCIA INMERSIVA WEBXR (PICO 3 / META QUEST)
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { 
  Wifi, 
  RefreshCw, 
  Video, 
  Image as ImageIcon, 
  Stethoscope, 
  Sparkles, 
  Volume2, 
  Database, 
  Brain,
  Zap,
  VolumeX,
  Glasses,
  X
} from 'lucide-react';

interface Props { 
  patientId?: string; 
  moduleId?: string; 
  onClose?: () => void; 
}

export type ModuleCategory = 'DIAGNOSTIC' | 'TREATMENT';

export const VrPatientExperience: React.FC<Props> = ({ 
  patientId: propsPatientId, 
  moduleId: propsModuleId, 
  onClose 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null => 
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;
  
  const activePatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';
  const initialModule = propsModuleId || getUrlParam('modulo') || getUrlParam('moduleId') || 'clinical_office';
  
  const initialUrlMode = (getUrlParam('modo') || getUrlParam('mode') || '').toUpperCase();
  const parsedCategory: ModuleCategory = 
    initialUrlMode.includes('TRAT') || initialUrlMode.includes('TREAT') ? 'TREATMENT' : 'DIAGNOSTIC';

  // Estados React
  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState(initialModule);
  const [currentCategory, setCurrentCategory] = useState<ModuleCategory>(parsedCategory);
  const [statusMessage, setStatusMessage] = useState('Iniciando Sistema Clínico...');
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'loading' | 'error'>('loading');
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [isFlickerActive, setIsFlickerActive] = useState<boolean>(false);
  const [flickerHz, setFlickerHz] = useState<number>(40.0);

  // Referencias para Three.js y Audio
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Referencias estables para evitar re-montar el WebSocket en cada actualización
  const activeEcosystemRef = useRef(activeEcosystem);
  activeEcosystemRef.current = activeEcosystem;

  const currentCategoryRef = useRef(currentCategory);
  currentCategoryRef.current = currentCategory;

  const isFlickerActiveRef = useRef(isFlickerActive);
  isFlickerActiveRef.current = isFlickerActive;

  const flickerHzRef = useRef(flickerHz);
  flickerHzRef.current = flickerHz;

  const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || 'https://amieneurogical.onrender.com';

  // 1. Desbloqueo acústico
  const ensureAudioContext = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => setIsAudioUnlocked(true)).catch(() => {});
      } else if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        setIsAudioUnlocked(true);
      }
    } catch (e) {}
  }, []);

  const playChimeTone = useCallback((freq = 528) => {
    try {
      ensureAudioContext();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {}
  }, [ensureAudioContext]);

  // 2. Síntesis de voz terapéutica
  const speakAiInstruction = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      playChimeTone(528);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.90;
      utterance.pitch = 0.96;

      const assignAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(v => 
          v.lang.startsWith('es') && 
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Castilian'))
        ) || voices.find(v => v.lang.startsWith('es'));
        
        if (spanishVoice) utterance.voice = spanishVoice;
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        assignAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          assignAndSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
    } catch (e) {}
  }, [playChimeTone]);

  // 3. Resolución de Entornos Clínicos
  const getClinicalConfig = useCallback((envKey: string) => {
    const up = envKey.toUpperCase().trim();
    
    if (up.includes('GAMMA') || up.includes('OPTO') || up.includes('ALZHEIMER') || up.includes('COSMIC')) {
      return { key: 'cosmic_stars', path: '/ecosystems/cosmic_stars.jpeg', name: 'Opto-Neuromodulación Gamma 40Hz', isVideo: false };
    }
    if (up.includes('ACROPHOBIA') || up.includes('ALTURAS') || up.includes('ROOF')) {
      return { key: 'acrophobia_roof', path: '/ecosystems/acrophobia_roof.jpeg', name: 'Exposición en Altura (Acrofobia)', isVideo: false };
    }
    if (up.includes('AEROPHOBIA') || up.includes('AVION') || up.includes('CABIN')) {
      return { key: 'aerophobia_cabin', path: '/ecosystems/aerophobia_cabin.jpeg', name: 'Simulación de Cabina (Aerofobia)', isVideo: false };
    }
    if (up.includes('EMDR') || up.includes('MEMORY')) {
      return { key: 'emdr_memory', path: '/ecosystems/emdr_memory.jpeg', name: 'Reconsolidación Sacádica EMDR', isVideo: false };
    }
    if (up.includes('HYPNOSIS') || up.includes('NEURO_HYP')) {
      return { key: 'neuro_hypnosis', path: '/ecosystems/neuro_hypnosis.jpeg', name: 'Neurohipnosis Closed-Loop', isVideo: false };
    }
    if (up.includes('PAIN') || up.includes('ANALGESIA')) {
      return { key: 'pain_management', path: '/ecosystems/pain_management.jpeg', name: 'Analgesia Criogénica Sub-Delta', isVideo: false };
    }
    if (up.includes('DUAL_CONTROL') || up.includes('SES') || up.includes('SEXUAL')) {
      return { key: 'dual_control', path: '/ecosystems/dual_control.jpeg', name: 'Control Dual Neurosexual (SES / SIS)', isVideo: false };
    }
    if (up.includes('SAFE_PLACE') || up.includes('FOREST') || up.includes('GROUNDING')) {
      return { key: 'safe_place_forest', path: '/ecosystems/safe_place_forest.jpeg', name: 'Santuario Biofílico (Grounding)', isVideo: false };
    }

    return { key: 'clinical_office', path: '/ecosystems/clinical_office.jpeg', name: 'Consultorio Clínico Base', isVideo: false };
  }, []);

  // -------------------------------------------------------------------------
  // 4. WEBSOCKET ESTABLE BLINDADO (SOLO SE MONTA UNA VEZ POR PACIENTE)
  // -------------------------------------------------------------------------
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let telemetryInterval: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;

    const rawWsUrl = (import.meta as any).env?.VITE_WS_URL || 
      BACKEND_URL.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://').replace(/\/+$/, '');

    const connect = () => {
      if (!isMounted) return;
      try {
        const ws = new WebSocket(rawWsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          console.log('✅ [AMIE VISOR] Conectado exitosamente. Enviando Handshake...');

          // Enviar confirmación al médico
          ws.send(JSON.stringify({ 
            type: 'HANDSHAKE', 
            role: 'receiver', 
            patientId: activePatientId,
            moduleId: activeEcosystemRef.current,
            category: currentCategoryRef.current,
            timestamp: Date.now() 
          }));

          ws.send(JSON.stringify({
            type: 'VISOR_ACK_READY',
            patientId: activePatientId,
            status: 'READY',
            timestamp: Date.now()
          }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            
            // Ping del médico
            if (data.type === 'PING_HANDSHAKE' || data.type === 'PING') {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'VISOR_ACK_READY', patientId: activePatientId, status: 'READY', timestamp: Date.now() }));
              }
              return;
            }

            // Sincronización del contexto clínico desde la laptop
            if (data.type === 'SYNC_CLINICAL_CONTEXT') {
              if (data.ecosystem) setActiveEcosystem(data.ecosystem);
              if (data.category) setCurrentCategory(data.category);
              if (data.audioGuidance?.baselineScript) {
                speakAiInstruction(data.audioGuidance.baselineScript);
              }
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'VISOR_ACK_READY', patientId: activePatientId, status: 'READY', timestamp: Date.now() }));
              }
              return;
            }

            // Cambio de fase del pipeline con locución de voz
            if (data.type === 'START_PIPELINE_PHASE') {
              if (data.speechScript) speakAiInstruction(data.speechScript);
              if (data.ecosystem) setActiveEcosystem(data.ecosystem);
              if (data.category) setCurrentCategory(data.category);
              if (data.frequencyHz && data.frequencyHz > 0) {
                setFlickerHz(data.frequencyHz);
                setIsFlickerActive(true);
              } else {
                setIsFlickerActive(false);
              }
              return;
            }

            // Estimulación fótica directa
            if (data.type === 'START_LIGHT_STIMULATION') {
              setActiveEcosystem('cosmic_stars');
              setCurrentCategory('TREATMENT');
              if (typeof data.frequencyHz === 'number') setFlickerHz(data.frequencyHz);
              setIsFlickerActive(true);
              return;
            }

            if (data.type === 'STOP_LIGHT_STIMULATION' || data.type === 'STOP_TEST') {
              setIsFlickerActive(false);
              return;
            }

            // Grounding de emergencia
            if (data.type === 'TRIGGER_GROUNDING_PROTOCOL') {
              setActiveEcosystem('safe_place_forest');
              setCurrentCategory('TREATMENT');
              setIsFlickerActive(false);
              speakAiInstruction('Protocolo de calma activado. Respira hondo y contempla el bosque protegido.');
              return;
            }

            // Cambio genérico de entorno
            const targetEnv = data.environmentId || data.ecosystem || data.moduleId;
            if (targetEnv) setActiveEcosystem(targetEnv);
            if (data.category) setCurrentCategory(data.category);

          } catch (e) {}
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 2500);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
        };
      } catch (err) {
        if (isMounted) {
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 2500);
        }
      }
    };

    connect();

    pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING', role: 'receiver', patientId: activePatientId, timestamp: Date.now() }));
      }
    }, 20000);

    telemetryInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'VR_TELEMETRY_FRAME',
          patientId: activePatientId,
          hrvBpm: Math.floor(65 + Math.random() * 8),
          gsrValue: Number((2.1 + Math.random() * 0.4).toFixed(2)),
          timestamp: Date.now()
        }));
      }
    }, 400);

    return () => {
      isMounted = false;
      if (pingInterval) clearInterval(pingInterval);
      if (telemetryInterval) clearInterval(telemetryInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activePatientId, BACKEND_URL, speakAiInstruction]);

  // 5. THREE.JS & WEBXR RUNNER
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Esfera 360 invertida
    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    envGeo.scale(-1, 1, 1);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // Retícula
    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.9, transparent: true, depthTest: false });
    const cursor = new THREE.Mesh(ringGeo, ringMat);
    scene.add(cursor);
    cursorRef.current = cursor;

    // Desbloqueo acústico al presionar pantalla o gatillo WebXR
    const handleTrigger = () => {
      ensureAudioContext();
    };

    const xrController = renderer.xr.getController(0);
    xrController.addEventListener('select', handleTrigger);
    scene.add(xrController);
    renderer.domElement.addEventListener('pointerdown', handleTrigger);

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

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const elapsedTime = clock.getElapsedTime();

      if (cursorRef.current && cameraRef.current) {
        const pCam = renderer.xr.isPresenting ? renderer.xr.getCamera() : cameraRef.current;
        const dir = new THREE.Vector3();
        pCam.getWorldDirection(dir);
        cursorRef.current.position.copy(pCam.position).add(dir.multiplyScalar(1.5));
        cursorRef.current.lookAt(pCam.position);
      }

      // Parpadeo fótico para Gamma 40Hz
      if (ambientLightRef.current) {
        if (isFlickerActiveRef.current) {
          const hz = flickerHzRef.current || 40.0;
          const pulse = Math.sin(elapsedTime * Math.PI * 2 * hz) > 0 ? 3.5 : 0.4;
          ambientLightRef.current.intensity = pulse;
        } else {
          ambientLightRef.current.intensity = 2.5;
        }
      }

      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      xrController.removeEventListener('select', handleTrigger);
      renderer.domElement.removeEventListener('pointerdown', handleTrigger);
      renderer.setAnimationLoop(null);
      envGeo.dispose();
      envMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, [ensureAudioContext]);

  // 6. Carga de imagen 360
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    if (mat.map) {
      mat.map.dispose();
      mat.map = null;
    }

    setMediaType('loading');
    const config = getClinicalConfig(activeEcosystem);
    setStatusMessage(`Cargando: ${config.name}...`);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 2048, 1024);
        const canvasTex = new THREE.CanvasTexture(canvas);
        canvasTex.generateMipmaps = false;
        canvasTex.minFilter = THREE.LinearFilter;
        mat.map = canvasTex;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
        setMediaType('image');
        setStatusMessage(`Activo: ${config.name}`);
      }
    };
    img.onerror = () => {
      // Procedural fallback
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#0369a1');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);
        const canvasTex = new THREE.CanvasTexture(canvas);
        mat.map = canvasTex;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
        setMediaType('image');
        setStatusMessage(`Entorno Adaptativo: ${config.name}`);
      }
    };
    img.src = `${typeof window !== 'undefined' ? window.location.origin : ''}${config.path}`;
  }, [activeEcosystem, getClinicalConfig]);

  const currentConfig = getClinicalConfig(activeEcosystem);

  return (
    <div onClick={ensureAudioContext} className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      
      {/* Panel Superior de Estado */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-mono">ENLACE: <strong className="text-emerald-400">ACTIVO</strong></span>
        </div>
        <div className="h-4 w-px bg-slate-800" />
        <div className="flex items-center gap-1.5 text-slate-400">
          {isAudioUnlocked ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
          <span>Audio: <strong className="text-slate-200">{isAudioUnlocked ? 'Activo' : 'Toca la pantalla'}</strong></span>
        </div>
        {isFlickerActive && (
          <>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              <span>Opto-Frecuencia: {flickerHz.toFixed(1)} Hz</span>
            </div>
          </>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition cursor-pointer active:scale-95 shadow-xl"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Cartel Flotante Informativo para el Paciente */}
      <div className="absolute z-10 bottom-36 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-2 bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 shadow-2xl max-w-sm">
          <div className="flex items-center gap-2 justify-center">
            {currentCategory === 'DIAGNOSTIC' ? (
              <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[10.5px] font-black uppercase flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-400" /> MODO DIAGNÓSTICO
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10.5px] font-black uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> MODO TRATAMIENTO
              </span>
            )}
          </div>
          <h1 className="text-slate-200 font-black text-xs uppercase tracking-wider">{currentConfig.name}</h1>
          <p className="text-[11px] text-slate-400">Paciente: <strong className="text-cyan-300 font-mono">{activePatientId}</strong></p>
          <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1.5 ${
            isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <RefreshCw className="w-3 h-3 animate-spin" />}
            <span>{isConnected ? '🟢 ENLAZADO CON ESTACIÓN MÉDICA' : '🔴 RECONECTANDO...'}</span>
          </div>
        </div>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
