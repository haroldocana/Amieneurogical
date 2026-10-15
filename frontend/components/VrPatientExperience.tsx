// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF (PICO NEO 3 PRO / QUEST)
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { 
  Wifi, 
  RefreshCw, 
  Stethoscope, 
  Sparkles, 
  Volume2, 
  Database, 
  Zap, 
  Glasses, 
  X,
  VolumeX,
  Play,
  Video
} from 'lucide-react';

interface Props { 
  patientId?: string; 
  moduleId?: string; 
  onClose?: () => void; 
}

export type ModuleCategory = 'DIAGNOSTIC' | 'TREATMENT';

export const VrPatientExperience: React.FC<Props> = ({ 
  patientId: propsPatientId, 
  onClose 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null => 
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;
  
  const activePatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';

  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState('clinical_office');
  const [currentCategory, setCurrentCategory] = useState<ModuleCategory>('DIAGNOSTIC');
  const [currentDisorderName, setCurrentDisorderName] = useState('Consultorio Clínico Base');
  const [phaseLabel, setPhaseLabel] = useState('En espera de inicio...');
  const [isFlickerActive, setIsFlickerActive] = useState<boolean>(false);
  const [flickerHz, setFlickerHz] = useState<number>(40.0);
  
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(null);
  const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video'>('image');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const isFlickerActiveRef = useRef(isFlickerActive);
  isFlickerActiveRef.current = isFlickerActive;
  const flickerHzRef = useRef(flickerHz);
  flickerHzRef.current = flickerHz;

  const unlockAudioContext = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume();
      }
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
      }
      if (videoElementRef.current) {
        videoElementRef.current.muted = false;
        videoElementRef.current.play().catch(() => {});
      }
      setIsAudioUnlocked(true);
    } catch (e) {
      console.warn('[AMIE WebXR] Error al desbloquear audio/video:', e);
    }
  };

  const speakVoiceInstruction = useCallback((text: string) => {
    if (!isAudioUnlocked) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.90;
      utterance.pitch = 0.98;

      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[AMIE Audio] Error en síntesis de voz:', e);
    }
  }, [isAudioUnlocked]);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isComponentMounted = true;

    const rawWsUrl = (import.meta as any).env?.VITE_WS_URL || (import.meta as any).env?.VITE_API_URL;
    let wsTarget = 'wss://amieneurogical.onrender.com/ws/vr';
    if (rawWsUrl) {
      wsTarget = rawWsUrl.replace(/^http/, 'ws');
      if (!wsTarget.endsWith('/ws/vr')) {
        wsTarget = `${wsTarget.replace(/\/+$/, '')}/ws/vr`;
      }
    }

    const connectToStation = () => {
      if (!isComponentMounted) return;
      try {
        const ws = new WebSocket(wsTarget);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isComponentMounted) return;
          setIsConnected(true);

          ws.send(JSON.stringify({
            type: 'HANDSHAKE',
            role: 'receiver',
            patientId: activePatientId,
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
          if (!isComponentMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'PING_HANDSHAKE' || data.type === 'PING') {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'VISOR_ACK_READY',
                  patientId: activePatientId,
                  status: 'READY',
                  timestamp: Date.now()
                }));
              }
              return;
            }

            if (data.type === 'LOAD_CUSTOM_MEDIA') {
              if (data.scenarioName) setCurrentDisorderName(data.scenarioName);
              const isVid = data.mediaType === 'video' || (data.mediaUrl && data.mediaUrl.match(/\.(mp4|webm|ogv)$/i));
              setCurrentMediaType(isVid ? 'video' : 'image');
              setCustomMediaUrl(data.mediaUrl || null);
              setPhaseLabel('Escenario 360 Activo');
              return;
            }

            if (data.type === 'CHANGE_ENVIRONMENT') {
              const env = data.environment || '';
              if (env.includes('overt_provocation') || env.includes('narcissism') || env.includes('antisocial') || env.endsWith('.mp4')) {
                setCurrentMediaType('video');
                const vUrl = env.startsWith('/') || env.startsWith('http') ? env : `/video/${env}.mp4`;
                setCustomMediaUrl(vUrl);
                setPhaseLabel('Video 360 Activo');
              } else {
                setCurrentMediaType('image');
                setCustomMediaUrl(null);
                setActiveEcosystem(env);
              }
              return;
            }

            if (data.type === 'SYNC_CLINICAL_CONTEXT') {
              const isVid = data.mediaType === 'video' || data.ecosystem?.endsWith('.mp4') ||
                ['overt_provocation', 'narcissism_collapse', 'antisocial_distress', 'covert_rejection'].some(k => data.ecosystem?.includes(k));

              if (isVid) {
                setCurrentMediaType('video');
                const path = data.mediaUrl || (data.ecosystem?.startsWith('/') ? data.ecosystem : `/video/${data.ecosystem}.mp4`);
                setCustomMediaUrl(path);
              } else if (data.ecosystem) {
                setActiveEcosystem(data.ecosystem);
                setCustomMediaUrl(null);
                setCurrentMediaType('image');
              }

              if (data.category) setCurrentCategory(data.category);
              if (data.disorderName) setCurrentDisorderName(data.disorderName);

              if (data.audioGuidance?.baselineScript) {
                speakVoiceInstruction(data.audioGuidance.baselineScript);
              }

              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'VISOR_ACK_READY',
                  patientId: activePatientId,
                  status: 'READY',
                  timestamp: Date.now()
                }));
              }
              return;
            }

            if (data.type === 'START_PIPELINE_PHASE' || data.type === 'START_ASSAY') {
              const labels: Record<string, string> = {
                'PHASE_1_BASELINE': '1. Calibración de Línea Base',
                'PHASE_2_ACTIVE': '2. Desafío / Intervención Activa',
                'PHASE_3_RECOVERY': '3. Habituación y Retorno a Calma'
              };
              if (data.phase) setPhaseLabel(labels[data.phase] || data.phase);

              if (data.speechScript) {
                speakVoiceInstruction(data.speechScript);
              }
              if (data.ecosystem) {
                if (data.ecosystem.endsWith('.mp4') || data.mediaType === 'video') {
                  setCurrentMediaType('video');
                  setCustomMediaUrl(data.ecosystem);
                }
              }
              if (data.category) setCurrentCategory(data.category);

              if (data.frequencyHz && data.frequencyHz > 0) {
                setFlickerHz(data.frequencyHz);
                setIsFlickerActive(true);
              } else {
                setIsFlickerActive(false);
              }
              return;
            }

            if (data.type === 'TRIGGER_GROUNDING_PROTOCOL') {
              setCustomMediaUrl(null);
              setCurrentMediaType('image');
              setActiveEcosystem('safe_place_forest');
              setCurrentCategory('TREATMENT');
              setIsFlickerActive(false);
              setPhaseLabel('Rescate Vagal (Grounding)');
              speakVoiceInstruction('Respira profundamente. Estás en un lugar seguro. Relaja los hombros.');
              return;
            }

            if (data.type === 'STOP_LIGHT_STIMULATION' || data.type === 'STOP_TEST' || data.type === 'STOP_ACTIVE_SESSION' || data.type === 'STOP_ASSAY') {
              setIsFlickerActive(false);
              setPhaseLabel('Sesión Concluida');
              return;
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          if (!isComponentMounted) return;
          setIsConnected(false);
          reconnectTimer = setTimeout(connectToStation, 2500);
        };

        ws.onerror = () => {
          if (!isComponentMounted) return;
          setIsConnected(false);
        };
      } catch (err) {
        if (isComponentMounted) {
          setIsConnected(false);
          reconnectTimer = setTimeout(connectToStation, 2500);
        }
      }
    };

    connectToStation();

    return () => {
      isComponentMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activePatientId, speakVoiceInstruction]);

  // Inicialización WebXR Three.js
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

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

    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    envGeo.scale(-1, 1, 1);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    let vrBtn: HTMLElement | null = null;
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute';
      vrBtn.style.bottom = '30px';
      vrBtn.style.left = '50%';
      vrBtn.style.transform = 'translateX(-50%)';
      vrBtn.style.zIndex = '100000';
      vrBtn.style.padding = '14px 28px';
      vrBtn.style.backgroundColor = '#0284c7';
      vrBtn.style.color = '#ffffff';
      vrBtn.style.fontWeight = 'bold';
      vrBtn.style.borderRadius = '16px';
      vrBtn.style.border = 'none';
      vrBtn.style.cursor = 'pointer';
      container.appendChild(vrBtn);
    } catch (e) {}

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const elapsedTime = clock.getElapsedTime();

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && Math.floor(elapsedTime * 10) % 4 === 0) {
        wsRef.current.send(JSON.stringify({
          type: 'VR_TELEMETRY_FRAME',
          patientId: activePatientId,
          hrvBpm: 68,
          gsrValue: 2.1,
          timestamp: Date.now()
        }));
      }

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
      renderer.setAnimationLoop(null);
      envGeo.dispose();
      envMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, [activePatientId]);

  // Inyección Dinámica de Imagen 360° o Video 360° en la Esfera
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    if (mat.map) {
      mat.map.dispose();
      mat.map = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.src = '';
      videoElementRef.current = null;
    }

    // A. RUTA DE VIDEO 360°
    if (currentMediaType === 'video' && customMediaUrl) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.loop = true;
      video.muted = true; // Crucial para autorizar autoplay en WebXR de Pico Browser
      video.autoplay = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      const fullSrc = customMediaUrl.startsWith('http')
        ? customMediaUrl
        : `${typeof window !== 'undefined' ? window.location.origin : ''}${customMediaUrl.startsWith('/') ? '' : '/'}${customMediaUrl}`;
      video.src = fullSrc;

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBAFormat;
      videoTexture.generateMipmaps = false;

      mat.map = videoTexture;
      mat.color.setHex(0xffffff);
      mat.needsUpdate = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (isAudioUnlocked) video.muted = false;
        }).catch(err => {
          console.warn('[AMIE Video] Autoplay diferido en Pico:', err);
        });
      }

      videoElementRef.current = video;
      return;
    }

    // B. RUTA DE IMAGEN 360°
    const targetImageUrl = customMediaUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/ecosystems/${activeEcosystem}.jpeg`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 2048, 1024);
        const tex = new THREE.CanvasTexture(canvas);
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        mat.map = tex;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
      }
    };
    img.onerror = () => {
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
        mat.map = new THREE.CanvasTexture(canvas);
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
      }
    };
    img.src = targetImageUrl;

    return () => {
      if (videoElementRef.current) {
        videoElementRef.current.pause();
        videoElementRef.current.src = '';
        videoElementRef.current = null;
      }
    };
  }, [activeEcosystem, customMediaUrl, currentMediaType, isAudioUnlocked]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      
      {/* Escudo de Desbloqueo Físico de Audio/Video */}
      {!isAudioUnlocked && (
        <div className="absolute inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <VolumeX className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Activar Experiencia VR</h2>
              <p className="text-slate-400 text-sm">El visor requiere tu autorización para reproducir audio clínico y video inmersivo en los auriculares integrados.</p>
            </div>
            <button
              onClick={unlockAudioContext}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 active:scale-95 transition flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white" />
              INICIAR SESIÓN VR
            </button>
          </div>
        </div>
      )}

      {/* Barra de Estado Superior */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-mono">PICO 3 PRO: <strong className="text-emerald-400">ENLAZADO</strong></span>
        </div>
        <div className="h-4 w-px bg-slate-800" />
        <div className="flex items-center gap-1.5 text-slate-300">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Audio: <strong className={isAudioUnlocked ? 'text-emerald-400' : 'text-amber-400'}>{isAudioUnlocked ? 'Activo' : 'Bloqueado'}</strong></span>
        </div>
        {currentMediaType === 'video' && (
          <>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1 text-indigo-400 font-mono font-bold">
              <Video className="w-3.5 h-3.5" />
              <span>Video 360</span>
            </div>
          </>
        )}
        {isFlickerActive && (
          <>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              <span>{flickerHz.toFixed(1)} Hz</span>
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

      {/* Cartel Flotante Informativo en el Visor */}
      <div className="absolute z-10 bottom-32 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-2 bg-slate-950/90 p-5 rounded-3xl border border-slate-800 shadow-2xl max-w-sm">
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
          <h1 className="text-slate-100 font-black text-sm uppercase tracking-wide">{currentDisorderName}</h1>
          <p className="text-[11px] text-slate-400 font-mono">Fase: <strong className="text-amber-300">{phaseLabel}</strong></p>
          
          <div className={`mt-2 px-3.5 py-1.5 rounded-full border text-[10.5px] font-bold inline-flex items-center gap-2 ${
            isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
          }`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{isConnected ? '🟢 ENLAZADO CON ESTACIÓN MÉDICA' : '🔴 RECONECTANDO...'}</span>
          </div>
        </div>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
