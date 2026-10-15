// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF CON PARADIGMAS 3D INTERACTIVOS
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { 
  Wifi, RefreshCw, Stethoscope, Sparkles, Volume2, 
  Database, Zap, Glasses, X, VolumeX, Play, Video, Target, Eye
} from 'lucide-react';

interface Props { 
  patientId?: string; 
  moduleId?: string; 
  onClose?: () => void; 
}

export type ModuleCategory = 'DIAGNOSTIC' | 'TREATMENT';
export type InteractiveParadigm = 'NONE' | 'BART_GLASS' | 'CPT_NEON' | 'EMDR_LIGHTBAR' | 'BIO_LOTUS' | 'SIS_SES_ORBS' | 'KINEMATIC_TARGET';

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
  const [currentDisorderId, setCurrentDisorderId] = useState<string>('PSYCHOPATHY');
  const [currentDisorderName, setCurrentDisorderName] = useState('Consultorio Clínico Base');
  const [phaseLabel, setPhaseLabel] = useState('En espera de inicio...');
  const [activeParadigm, setActiveParadigm] = useState<InteractiveParadigm>('BART_GLASS');
  
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(null);
  const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video'>('image');

  const [hudStats, setHudStats] = useState<string>('Gatillo: Interactuar 6DoF');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const interactiveGroupRef = useRef<THREE.Group | null>(null);

  const paradigmStateRef = useRef({
    paradigm: 'BART_GLASS' as InteractiveParadigm,
    isPhaseActive: false,
    balloonScale: 1.0,
    balloonPumps: 0,
    cptTargetType: 'GO' as 'GO' | 'NOGO',
    cptSpawnTime: 0,
    cptHits: 0,
    cptCommissions: 0
  });

  const playSynthesizedTone = (type: 'PUMP' | 'POP' | 'GO_CHIME' | 'BUZZ' | 'CALM') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'suspended') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'PUMP') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(180, now); osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.13);
      } else if (type === 'POP') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.26);
      } else if (type === 'GO_CHIME') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.16);
      } else if (type === 'BUZZ') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(95, now);
        gain.gain.setValueAtTime(0.35, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.31);
      }
    } catch (e) {}
  };

  const unlockAudioContext = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
        audioContextRef.current.resume();
      }
      if (videoElementRef.current) {
        videoElementRef.current.muted = false;
        videoElementRef.current.play().catch(() => {});
      }
      setIsAudioUnlocked(true);
      playSynthesizedTone('CALM');
    } catch (e) {}
  };

  const speakVoiceInstruction = useCallback((text: string) => {
    if (!isAudioUnlocked || !text) return;
    try {
      const existingAudio = document.getElementById('amie-tts-audio') as HTMLAudioElement;
      if (existingAudio) { existingAudio.pause(); existingAudio.remove(); }
      const encoded = encodeURIComponent(text);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=es-ES&client=tw-ob`;
      const audioEl = document.createElement('audio');
      audioEl.id = 'amie-tts-audio';
      audioEl.src = audioUrl;
      audioEl.crossOrigin = 'anonymous';
      audioEl.volume = 1.0;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      audioEl.play().catch(() => {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'es-ES';
          window.speechSynthesis.speak(u);
        }
      });
    } catch (e) {}
  }, [isAudioUnlocked]);

  const handleTriggerAction = useCallback(() => {
    const s = paradigmStateRef.current;
    if (s.paradigm === 'BART_GLASS') {
      s.balloonPumps += 1;
      const explodeProb = (s.balloonPumps / 22);
      if (Math.random() < explodeProb || s.balloonPumps >= 22) {
        playSynthesizedTone('POP');
        s.balloonPumps = 0; s.balloonScale = 1.0;
        setHudStats(`💥 ¡EXPLOSIÓN! Insensibilidad evaluada`);
      } else {
        playSynthesizedTone('PUMP');
        s.balloonScale += 0.12;
        setHudStats(`🎈 Inflado: ${s.balloonPumps} bombeos`);
      }
    } else if (s.paradigm === 'CPT_NEON') {
      if (s.cptTargetType === 'GO') {
        playSynthesizedTone('GO_CHIME');
        s.cptHits += 1;
        setHudStats(`✅ Acierto Go!`);
      } else {
        playSynthesizedTone('BUZZ');
        s.cptCommissions += 1;
        setHudStats(`❌ Error de Comisión`);
      }
    } else if (s.paradigm === 'BIO_LOTUS' || s.paradigm === 'EMDR_LIGHTBAR' || s.paradigm === 'SIS_SES_ORBS' || s.paradigm === 'KINEMATIC_TARGET') {
      playSynthesizedTone('CALM');
      setHudStats(`Sincronización activa • Mantén la atención`);
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CLINICAL_TEST_INTERACTION', patientId: activePatientId,
        hits: s.balloonPumps || s.cptHits, timestamp: Date.now()
      }));
    }
  }, [activePatientId]);

  useEffect(() => {
    let isComponentMounted = true;
    const wsTarget = (import.meta as any).env?.VITE_WS_URL?.replace(/^http/, 'ws') || 'wss://amieneurogical.onrender.com/ws/vr';
    
    const connectToStation = () => {
      try {
        const ws = new WebSocket(wsTarget.endsWith('/ws/vr') ? wsTarget : `${wsTarget}/ws/vr`);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: activePatientId }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'LOAD_CUSTOM_MEDIA') {
             setCurrentMediaType('video');
             setCustomMediaUrl(data.mediaUrl);
          } else if (data.type === 'SYNC_CLINICAL_CONTEXT') {
            if (data.hologramType) {
              setActiveParadigm(data.hologramType);
              paradigmStateRef.current.paradigm = data.hologramType;
              if (data.hologramType === 'NONE' && interactiveGroupRef.current) {
                interactiveGroupRef.current.visible = false;
              } else if (interactiveGroupRef.current) {
                interactiveGroupRef.current.visible = true;
              }
            }
            if (data.ecosystem) {
              const isVid = data.ecosystem.endsWith('.mp4');
              setCurrentMediaType(isVid ? 'video' : 'image');
              setCustomMediaUrl(data.ecosystem);
            }
            if (data.disorderName) setCurrentDisorderName(data.disorderName);
            if (data.audioGuidance?.baselineScript) speakVoiceInstruction(data.audioGuidance.baselineScript);
          } else if (data.type === 'START_PIPELINE_PHASE') {
            setPhaseLabel(data.phase);
            if (data.speechScript) speakVoiceInstruction(data.speechScript);
          } else if (data.type === 'STOP_ACTIVE_SESSION') {
            setPhaseLabel('Sesión Concluida');
            if (videoElementRef.current) { videoElementRef.current.pause(); }
          }
        };

        ws.onclose = () => setIsConnected(false);
      } catch (err) { setIsConnected(false); }
    };

    connectToStation();
    return () => { isComponentMounted = false; if (wsRef.current) wsRef.current.close(); };
  }, [activePatientId, speakVoiceInstruction]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(0, 5, 2);
    scene.add(dirLight);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    envGeo.scale(-1, 1, 1);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    const interactiveGroup = new THREE.Group();
    scene.add(interactiveGroup);
    interactiveGroupRef.current = interactiveGroup;

    const controller0 = renderer.xr.getController(0);
    controller0.addEventListener('selectstart', handleTriggerAction);
    scene.add(controller0);

    const controller1 = renderer.xr.getController(1);
    controller1.addEventListener('selectstart', handleTriggerAction);
    scene.add(controller1);

    try {
      const vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute'; vrBtn.style.bottom = '30px'; vrBtn.style.zIndex = '100000';
      container.appendChild(vrBtn);
    } catch (e) {}

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const s = paradigmStateRef.current;

      if (interactiveGroup.visible && interactiveGroup.children.length === 0) {
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0xff00ff, metalness: 0.1, roughness: 0.05, transmission: 0.9, ior: 1.5, clearcoat: 1.0
        });

        // 1. BART GLASS (Globo de riesgo)
        const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), glassMat);
        balloon.name = 'BART_GLASS'; balloon.position.set(0, 1.2, -2.0);
        interactiveGroup.add(balloon);

        // 2. CPT NEON (Dianas poliedricas Go/NoGo)
        const cpt = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
        cpt.name = 'CPT_NEON'; cpt.position.set(0, 1.3, -2.0);
        interactiveGroup.add(cpt);

        // 3. EMDR LIGHTBAR (Barra sacádica)
        const emdr = new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 24), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        emdr.name = 'EMDR_LIGHTBAR'; emdr.position.set(0, 1.4, -2.5);
        interactiveGroup.add(emdr);

        // 4. BIO LOTUS (Respiración Fractal a 0.1Hz)
        const lotus = new THREE.Mesh(new THREE.TorusKnotGeometry(0.3, 0.08, 100, 16), glassMat);
        lotus.name = 'BIO_LOTUS'; lotus.position.set(0, 1.3, -2.5);
        interactiveGroup.add(lotus);

        // 5. SIS SES ORBS (Control dual afectivo)
        const sisGroup = new THREE.Group();
        sisGroup.name = 'SIS_SES_ORBS';
        const orb1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
        orb1.position.set(-0.4, 1.3, -2.0);
        const orb2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
        orb2.position.set(0.4, 1.3, -2.0);
        sisGroup.add(orb1);
        sisGroup.add(orb2);
        interactiveGroup.add(sisGroup);
      }

      interactiveGroup.children.forEach(c => c.visible = c.name === s.paradigm);

      const activeMesh = interactiveGroup.getObjectByName(s.paradigm);
      if (activeMesh) {
        if (s.paradigm === 'BART_GLASS') {
          activeMesh.scale.lerp(new THREE.Vector3(s.balloonScale, s.balloonScale * 1.1, s.balloonScale), 0.1);
        } else if (s.paradigm === 'CPT_NEON') {
          activeMesh.rotation.x += 0.02; activeMesh.rotation.y += 0.03;
          if (Math.floor(t * 2) % 3 === 0 && (Date.now() - s.cptSpawnTime > 1600)) {
            s.cptSpawnTime = Date.now();
            s.cptTargetType = Math.random() > 0.3 ? 'GO' : 'NOGO';
            (activeMesh as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: s.cptTargetType === 'GO' ? 0x10b981 : 0xef4444 });
          }
        } else if (s.paradigm === 'EMDR_LIGHTBAR') {
          activeMesh.position.x = Math.sin(t * Math.PI * 2 * 1.2) * 1.4;
        } else if (s.paradigm === 'BIO_LOTUS') {
          const sc = 0.8 + Math.sin(t * Math.PI * 2 * 0.1) * 0.45; // 0.1Hz = 6 RPM
          activeMesh.scale.set(sc, sc, sc);
          activeMesh.rotation.y += 0.01;
        } else if (s.paradigm === 'SIS_SES_ORBS') {
          activeMesh.rotation.y += 0.02;
        }
      }

      renderer.render(scene, camera);
    });

    return () => { renderer.setAnimationLoop(null); renderer.dispose(); };
  }, [handleTriggerAction]);

  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    if (currentMediaType === 'video' && customMediaUrl) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous'; video.loop = true; video.muted = true; video.playsInline = true;
      video.src = customMediaUrl.startsWith('http') ? customMediaUrl : `${window.location.origin}${customMediaUrl}`;
      const tex = new THREE.VideoTexture(video);
      mat.map = tex; mat.needsUpdate = true;
      video.play().then(() => { if (isAudioUnlocked) video.muted = false; }).catch(()=>{});
      videoElementRef.current = video;
    } else if (customMediaUrl) {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
        c.getContext('2d')?.drawImage(img, 0, 0, 2048, 1024);
        mat.map = new THREE.CanvasTexture(c); mat.needsUpdate = true;
      };
      img.src = customMediaUrl;
    }
  }, [customMediaUrl, currentMediaType, isAudioUnlocked]);

  return (
    <div onClick={handleTriggerAction} className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden cursor-pointer">
      {!isAudioUnlocked && (
        <div className="absolute inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md text-center space-y-6">
            <VolumeX className="w-10 h-10 text-emerald-400 animate-pulse mx-auto" />
            <h2 className="text-2xl font-black text-white">Activar 6DoF y Audio</h2>
            <button onClick={(e) => { e.stopPropagation(); unlockAudioContext(); }} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3">
              <Play className="w-6 h-6 fill-white" /> INICIAR SESIÓN VR
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-slate-950/90 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
        <Database className="w-4 h-4 text-cyan-400" />
        <span className="text-slate-300 font-mono">PICO 3 PRO: <strong className="text-emerald-400">6DoF ACTIVO</strong></span>
        <div className="h-4 w-px bg-slate-800" />
        <Target className="w-3.5 h-3.5 text-purple-400" />
        <span>Holograma: <strong className="text-purple-300 font-mono">{activeParadigm}</strong></span>
      </div>

      {onClose && <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-6 right-6 z-30 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"><X className="w-5 h-5" /></button>}

      <div className="absolute z-10 bottom-32 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center bg-slate-950/90 p-5 rounded-3xl border border-slate-800 shadow-2xl">
          <h1 className="text-slate-100 font-black text-sm uppercase">{currentDisorderName}</h1>
          <p className="text-[11px] text-amber-300 font-mono font-bold">{hudStats}</p>
          <p className="text-[10px] text-slate-400 font-mono">Fase: <strong>{phaseLabel}</strong></p>
        </div>
      </div>
      <div ref={mountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VrPatientExperience;
