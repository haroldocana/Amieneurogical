// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF NEXT-GEN (BATERÍA DE 8 MOTORES 3D)
// RAYCASTING LÁSER, HÁPTICA DINÁMICA, SINTETIZADOR BINAURAL Y FONDOS 360°
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { 
  Database, Target, VolumeX, Play, X, Stethoscope, Sparkles, Volume2 
} from 'lucide-react';

interface Props { 
  patientId?: string; 
  moduleId?: string; 
  onClose?: () => void; 
}

export type ModuleCategory = 'DIAGNOSTIC' | 'TREATMENT';
export type InteractiveParadigm = 
  | 'IDLE'
  | 'CPT_3D' 
  | 'BART_3D' 
  | 'N_BACK_3D' 
  | 'CHOICE_3D' 
  | 'AAT_3D' 
  | 'EMDR_3D' 
  | 'BIO_3D' 
  | 'MIRROR_3D';

export const VrPatientExperience: React.FC<Props> = ({ 
  patientId: propsPatientId, 
  onClose 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null => 
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;
  
  const activePatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';

  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState('clinical_office.jpeg');
  const [currentCategory, setCurrentCategory] = useState<ModuleCategory>('DIAGNOSTIC');
  const [currentDisorderId, setCurrentDisorderId] = useState<string>('PSICOPATIA');
  const [currentDisorderName, setCurrentDisorderName] = useState('Consultorio Clínico Base');
  const [phaseLabel, setPhaseLabel] = useState('En espera de inicio...');
  const [activeParadigm, setActiveParadigm] = useState<InteractiveParadigm>('IDLE');
  
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(null);
  const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video'>('image');

  const [hudStats, setHudStats] = useState<string>('Apunta con el láser del mando y presiona el gatillo');

  // THREE.JS CORE REFS
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // INTERACTIVITY & RAYCASTING REFS
  const interactiveGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const controller1Ref = useRef<THREE.Group | null>(null);
  const controller2Ref = useRef<THREE.Group | null>(null);

  // AUDIO CORE (WEB AUDIO API + BINAURAL + TTS)
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgOscillatorRef = useRef<OscillatorNode | null>(null);
  const bgGainRef = useRef<GainNode | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ESTADO DE SIMULACIÓN Y TELEMETRÍA CINEMÁTICA
  const paradigmStateRef = useRef({
    paradigm: 'IDLE' as InteractiveParadigm,
    isPhaseActive: false,
    hits: 0,
    errors: 0,
    omissions: 0,
    reactionTimes: [] as number[],
    lastSpawnTime: 0,
    cptTargetType: 'GO' as 'GO' | 'NOGO',
    balloonScale: 1.0,
    balloonPumps: 0,
    balloonMaxCap: 20,
    zOffset: -2.0,
    nbackIndex: 0,
    lastInteractionTime: 0
  });

  // =========================================================================
  // 1. MOTOR HÁPTICO DINÁMICO (VIBRACIÓN FÍSICA EN MANDOS PICO / QUEST)
  // =========================================================================
  const triggerHapticFeedback = (intensity = 0.5, durationMs = 60) => {
    if (!rendererRef.current) return;
    const session = rendererRef.current.xr.getSession();
    if (session && session.inputSources) {
      for (const source of session.inputSources) {
        if (source.gamepad && source.gamepad.hapticActuators && source.gamepad.hapticActuators.length > 0) {
          source.gamepad.hapticActuators[0].pulse(intensity, durationMs);
        }
      }
    }
  };

  // =========================================================================
  // 2. EFECTOS SONOROS CLÍNICOS SINTETIZADOS (PURO WEB AUDIO API)
  // =========================================================================
  const playSynthesizedTone = (type: 'PUMP' | 'POP' | 'GO_CHIME' | 'BUZZ' | 'CALM' | 'SELECT') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) audioContextRef.current = new AudioCtx();
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'suspended') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'PUMP') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
        triggerHapticFeedback(0.3, 35);
      } else if (type === 'POP') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.29);
        triggerHapticFeedback(1.0, 160);
      } else if (type === 'GO_CHIME') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
        triggerHapticFeedback(0.6, 50);
      } else if (type === 'BUZZ') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.31);
        triggerHapticFeedback(0.85, 110);
      } else if (type === 'CALM') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.51);
      } else if (type === 'SELECT') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.11);
        triggerHapticFeedback(0.4, 40);
      }
    } catch (e) {}
  };

  // =========================================================================
  // 3. GENERADOR DE AUDIO DE FONDO (BINAURAL, RUIDO MARRÓN, FRECUENCIAS CEREBRALES)
  // =========================================================================
  const startBackgroundAudio = (type: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) audioContextRef.current = new AudioCtx();
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      if (bgOscillatorRef.current) {
        try { bgOscillatorRef.current.stop(); bgOscillatorRef.current.disconnect(); } catch (e) {}
        bgOscillatorRef.current = null;
      }

      if (type === 'NONE') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'BETA_WAVES') {
        osc.type = 'sine';
        osc.frequency.value = 18; // 18 Hz para alerta y carga cognitiva
        gain.gain.value = 0.08;
        osc.start();
      } else if (type === 'ALPHA_WAVES') {
        osc.type = 'sine';
        osc.frequency.value = 10; // 10 Hz para relajación consciente
        gain.gain.value = 0.08;
        osc.start();
      } else if (type === 'THETA_WAVES') {
        osc.type = 'sine';
        osc.frequency.value = 5.5; // 5.5 Hz para trance hipnótico
        gain.gain.value = 0.09;
        osc.start();
      } else if (type === 'DELTA_WAVES') {
        osc.type = 'sine';
        osc.frequency.value = 2.0; // 2.0 Hz para sueño y desaceleración metabólica
        gain.gain.value = 0.12;
        osc.start();
      } else if (type === 'BROWN_NOISE') {
        osc.type = 'triangle';
        osc.frequency.value = 65;
        gain.gain.value = 0.05;
        osc.start();
      } else if (type === 'TENSION_DRUM' || type === 'HEARTBEAT') {
        osc.type = 'sine';
        osc.frequency.value = 45;
        gain.gain.value = 0.0;
        osc.start();
        heartbeatTimerRef.current = setInterval(() => {
          if (!ctx) return;
          const now = ctx.currentTime;
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        }, 900);
      } else if (type === 'BILATERAL_SWEEP') {
        osc.type = 'sine';
        osc.frequency.value = 320;
        gain.gain.value = 0.07;
        osc.start();
      } else {
        osc.type = 'sine';
        osc.frequency.value = 120;
        gain.gain.value = 0.04;
        osc.start();
      }

      bgOscillatorRef.current = osc;
      bgGainRef.current = gain;
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

  // =========================================================================
  // 4. RAYCASTING LÁSER 6DoF Y MANEJADOR DE LAS 8 TAREAS HOLOGRÁFICAS
  // =========================================================================
  const handleControllerSelect = useCallback((event: any) => {
    const controller = event.target;
    if (!interactiveGroupRef.current) return;

    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycasterRef.current.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycasterRef.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = raycasterRef.current.intersectObjects(interactiveGroupRef.current.children, true);
    
    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const s = paradigmStateRef.current;
      const now = Date.now();
      s.lastInteractionTime = now;

      // 1. TAREA CPT_3D (Atención e Inhibición Go/No-Go)
      if (s.paradigm === 'CPT_3D') {
        const rt = s.lastSpawnTime > 0 ? (now - s.lastSpawnTime) : 260;
        if (s.cptTargetType === 'GO') {
          playSynthesizedTone('GO_CHIME');
          s.hits += 1;
          s.reactionTimes.push(rt);
          setHudStats(`✅ Impacto Go! RT: ${rt} ms`);
        } else {
          playSynthesizedTone('BUZZ');
          s.errors += 1;
          setHudStats(`❌ Error de Comisión (Inhibición Fallida)`);
        }
      }

      // 2. TAREA BART_3D (Riesgo y Castigo / Psicopatía)
      else if (s.paradigm === 'BART_3D') {
        s.balloonPumps += 1;
        const explodeProb = s.balloonPumps / s.balloonMaxCap;
        if (Math.random() < explodeProb || s.balloonPumps >= s.balloonMaxCap) {
          playSynthesizedTone('POP');
          s.balloonPumps = 0;
          s.balloonScale = 1.0;
          s.balloonMaxCap = Math.floor(12 + Math.random() * 16);
          setHudStats(`💥 ¡EXPLOSIÓN! Insensibilidad al riesgo evaluada`);
        } else {
          playSynthesizedTone('PUMP');
          s.balloonScale += 0.12;
          s.hits += 1;
          setHudStats(`🎈 Riesgo Asumido: ${s.balloonPumps} bombeos`);
        }
      }

      // 3. TAREA N_BACK_3D (Memoria de Trabajo y Carga Cognitiva)
      else if (s.paradigm === 'N_BACK_3D') {
        playSynthesizedTone('SELECT');
        s.hits += 1;
        setHudStats(`🧠 Secuencia Registrada: Selección ${s.hits}`);
      }

      // 4. TAREA CHOICE_3D (Dilema Rápido / Toma de Decisiones)
      else if (s.paradigm === 'CHOICE_3D') {
        playSynthesizedTone('SELECT');
        s.hits += 1;
        const choice = hitObject.name === 'CHOICE_LEFT' ? 'Opción A' : 'Opción B';
        setHudStats(`⚖️ Decisión Registrada: ${choice}`);
      }

      // 5. TAREA AAT_3D (Aproximación / Evitación AAT)
      else if (s.paradigm === 'AAT_3D') {
        playSynthesizedTone('SELECT');
        s.zOffset -= 0.6; // Empuja el estímulo fóbico lejos
        s.hits += 1;
        setHudStats(`🛡️ Estímulo Evitado (+1 Rechazo Activo)`);
      }

      // 6. TAREA EMDR_3D (Reprocesamiento Sacádico)
      else if (s.paradigm === 'EMDR_3D') {
        playSynthesizedTone('CALM');
        setHudStats(`👁️ Sincronización sacádica en curso`);
      }

      // 7. TAREA BIO_3D (Respiración Fractal y Rescate Vagal)
      else if (s.paradigm === 'BIO_3D') {
        playSynthesizedTone('CALM');
        setHudStats(`🌸 Resonancia Vagal activa: Sigue el ritmo 6 RPM`);
      }

      // 8. TAREA MIRROR_3D (Espejo Somatomotor)
      else if (s.paradigm === 'MIRROR_3D') {
        playSynthesizedTone('SELECT');
        s.hits += 1;
        setHudStats(`🪞 Calibración somatosensorial completada`);
      }

      // Transmisión inmediata de la interacción al CDSS de la estación
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'CLINICAL_TEST_INTERACTION',
          paradigm: s.paradigm,
          patientId: activePatientId,
          hits: s.hits,
          errors: s.errors,
          timestamp: now
        }));
      }
    }
  }, [activePatientId]);

  // =========================================================================
  // 5. ENLACE WEBSOCKET Y SINCRONIZACIÓN DE TELEMETRÍA BIDIRECCIONAL
  // =========================================================================
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
            if (data.ecosystem) {
              const isVid = data.ecosystem.endsWith('.mp4') || data.mediaType === 'video';
              setCurrentMediaType(isVid ? 'video' : 'image');
              setActiveEcosystem(data.ecosystem);
              setCustomMediaUrl(data.ecosystem);
            }
            if (data.disorderName) setCurrentDisorderName(data.disorderName);
            if (data.category) setCurrentCategory(data.category);
            if (data.audioGuidance?.baselineScript) speakVoiceInstruction(data.audioGuidance.baselineScript);
          } else if (data.type === 'START_PIPELINE_PHASE') {
            const requestedParadigm = (data.paradigm || data.hologramType || 'CPT_3D') as InteractiveParadigm;
            setActiveParadigm(requestedParadigm);
            
            const s = paradigmStateRef.current;
            s.paradigm = requestedParadigm;
            s.isPhaseActive = true;
            s.hits = 0;
            s.errors = 0;
            s.balloonScale = 1.0;
            s.balloonPumps = 0;
            s.zOffset = -2.0;

            if (interactiveGroupRef.current) {
              interactiveGroupRef.current.clear();
            }

            setPhaseLabel(`Tarea Activa: ${requestedParadigm}`);
            setHudStats(`Prueba Iniciada: ${requestedParadigm}. Apunta y dispara con el láser.`);

            if (data.speechScript) speakVoiceInstruction(data.speechScript);
            if (data.bgAudio) startBackgroundAudio(data.bgAudio);
          } else if (data.type === 'STOP_ACTIVE_SESSION' || data.type === 'STOP_TEST') {
            setActiveParadigm('IDLE');
            paradigmStateRef.current.paradigm = 'IDLE';
            paradigmStateRef.current.isPhaseActive = false;
            if (interactiveGroupRef.current) interactiveGroupRef.current.clear();
            if (bgOscillatorRef.current) {
              try { bgOscillatorRef.current.stop(); } catch (e) {}
              bgOscillatorRef.current = null;
            }
            if (heartbeatTimerRef.current) {
              clearInterval(heartbeatTimerRef.current);
              heartbeatTimerRef.current = null;
            }
            setPhaseLabel('Sesión Concluida / Analizando Datos');
            setHudStats('Sesión Finalizada con Éxito');
            if (videoElementRef.current) { videoElementRef.current.pause(); }
          }
        };

        ws.onclose = () => setIsConnected(false);
      } catch (err) { setIsConnected(false); }
    };

    connectToStation();
    return () => { 
      isComponentMounted = false; 
      if (wsRef.current) wsRef.current.close();
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [activePatientId, speakVoiceInstruction]);

  // =========================================================================
  // 6. MOTOR THREE.JS Y RENDERIZADO DINÁMICO DE LOS 8 PARADIGMAS
  // =========================================================================
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

    // CAPA 1: ECOSISTEMA 360 (Esfera inmersiva)
    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    envGeo.scale(-1, 1, 1);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // CAPA 2: GRUPO CONTENEDOR HOLOGRÁFICO 3D
    const interactiveGroup = new THREE.Group();
    scene.add(interactiveGroup);
    interactiveGroupRef.current = interactiveGroup;

    // CONTROLADORES CON LÁSER DE RAYCASTING 6DoF
    const buildControllerLaser = () => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -5)
      ]);
      const material = new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.75, linewidth: 2 });
      return new THREE.Line(geometry, material);
    };

    const ctrl1 = renderer.xr.getController(0);
    ctrl1.addEventListener('selectstart', handleControllerSelect);
    ctrl1.add(buildControllerLaser());
    scene.add(ctrl1);
    controller1Ref.current = ctrl1;

    const ctrl2 = renderer.xr.getController(1);
    ctrl2.addEventListener('selectstart', handleControllerSelect);
    ctrl2.add(buildControllerLaser());
    scene.add(ctrl2);
    controller2Ref.current = ctrl2;

    try {
      const vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute';
      vrBtn.style.bottom = '30px';
      vrBtn.style.zIndex = '100000';
      container.appendChild(vrBtn);
    } catch (e) {}

    const clock = new THREE.Clock();

    // BUCLE PRINCIPAL DE ANIMACIÓN Y FÍSICA HOLOGRÁFICA
    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const s = paradigmStateRef.current;

      // CONSTRUCTOR DE ENTIDADES SI EL GRUPO ESTÁ VACÍO Y HAY UNA TAREA ACTIVA
      if (interactiveGroup.children.length === 0 && s.paradigm !== 'IDLE') {
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x00f0ff,
          metalness: 0.1,
          roughness: 0.05,
          transmission: 0.9,
          ior: 1.5,
          clearcoat: 1.0
        });

        // 1. CPT_3D
        if (s.paradigm === 'CPT_3D') {
          const cptMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
          cptMesh.name = 'CPT_3D';
          interactiveGroup.add(cptMesh);
        }
        // 2. BART_3D
        else if (s.paradigm === 'BART_3D') {
          const balloonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), glassMat);
          balloonMesh.name = 'BART_3D';
          interactiveGroup.add(balloonMesh);
        }
        // 3. N_BACK_3D
        else if (s.paradigm === 'N_BACK_3D') {
          for (let i = 0; i < 3; i++) {
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), glassMat.clone());
            cube.name = `N_BACK_3D_${i}`;
            cube.position.set(i * 0.45 - 0.45, 0, 0);
            interactiveGroup.add(cube);
          }
        }
        // 4. CHOICE_3D
        else if (s.paradigm === 'CHOICE_3D') {
          const optLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.08), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
          optLeft.name = 'CHOICE_LEFT';
          optLeft.position.set(-0.55, 0, 0);

          const optRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.08), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
          optRight.name = 'CHOICE_RIGHT';
          optRight.position.set(0.55, 0, 0);

          interactiveGroup.add(optLeft);
          interactiveGroup.add(optRight);
        }
        // 5. AAT_3D
        else if (s.paradigm === 'AAT_3D') {
          const aatMesh = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 16, 100), glassMat);
          aatMesh.name = 'AAT_3D';
          interactiveGroup.add(aatMesh);
        }
        // 6. EMDR_3D
        else if (s.paradigm === 'EMDR_3D') {
          const emdrMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 24), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
          emdrMesh.name = 'EMDR_3D';
          interactiveGroup.add(emdrMesh);
        }
        // 7. BIO_3D
        else if (s.paradigm === 'BIO_3D') {
          const bioMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.32, 0.08, 100, 16), glassMat);
          bioMesh.name = 'BIO_3D';
          interactiveGroup.add(bioMesh);
        }
        // 8. MIRROR_3D
        else if (s.paradigm === 'MIRROR_3D') {
          const handL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), glassMat.clone());
          handL.name = 'MIRROR_L';
          handL.position.set(-0.35, 0, 0);

          const handR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), glassMat.clone());
          handR.name = 'MIRROR_R';
          handR.position.set(0.35, 0, 0);

          interactiveGroup.add(handL);
          interactiveGroup.add(handR);
        }
      }

      // DINÁMICA ESPACIAL EN CADA FRAME
      if (interactiveGroup.children.length > 0 && s.paradigm !== 'IDLE') {
        interactiveGroup.position.set(0, 1.3, s.zOffset);

        if (s.paradigm === 'BART_3D') {
          const b = interactiveGroup.getObjectByName('BART_3D');
          if (b) {
            b.scale.lerp(new THREE.Vector3(s.balloonScale, s.balloonScale * 1.15, s.balloonScale), 0.1);
            b.rotation.y += 0.008;
          }
        } else if (s.paradigm === 'CPT_3D') {
          const cpt = interactiveGroup.getObjectByName('CPT_3D') as THREE.Mesh;
          if (cpt) {
            cpt.rotation.x += 0.02;
            cpt.rotation.y += 0.03;
            if (Math.floor(t * 2) % 3 === 0 && (Date.now() - s.lastSpawnTime > 1500)) {
              s.lastSpawnTime = Date.now();
              s.cptTargetType = Math.random() > 0.35 ? 'GO' : 'NOGO';
              (cpt.material as THREE.MeshStandardMaterial).color.setHex(s.cptTargetType === 'GO' ? 0x10b981 : 0xef4444);
            }
          }
        } else if (s.paradigm === 'EMDR_3D') {
          const em = interactiveGroup.getObjectByName('EMDR_3D');
          if (em) {
            em.position.x = Math.sin(t * Math.PI * 2 * 1.2) * 1.4; // 1.2 Hz sacádico
          }
        } else if (s.paradigm === 'BIO_3D') {
          const bio = interactiveGroup.getObjectByName('BIO_3D');
          if (bio) {
            const breath = 0.8 + Math.sin(t * Math.PI * 2 * 0.1) * 0.45; // 0.1 Hz = 6 RPM
            bio.scale.set(breath, breath, breath);
            bio.rotation.y += 0.01;
          }
        } else if (s.paradigm === 'AAT_3D') {
          const aat = interactiveGroup.getObjectByName('AAT_3D');
          if (aat) {
            s.zOffset += 0.003; // Aproximación lenta que induce urgencia
            aat.rotation.x += 0.015;
          }
        } else if (s.paradigm === 'MIRROR_3D') {
          const l = interactiveGroup.getObjectByName('MIRROR_L');
          const r = interactiveGroup.getObjectByName('MIRROR_R');
          if (l && r) {
            l.position.y = Math.sin(t * 2) * 0.12;
            r.position.y = Math.sin(t * 2) * 0.12; // Movimiento simétrico espejo
          }
        }
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      envGeo.dispose();
      envMat.dispose();
      renderer.dispose();
    };
  }, [handleControllerSelect]);

  // =========================================================================
  // 7. CARGA DE FONDO PANORÁMICO 360° (IMAGEN O VIDEO)
  // =========================================================================
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    if (currentMediaType === 'video' && customMediaUrl) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.src = customMediaUrl.startsWith('http') ? customMediaUrl : `${window.location.origin}/${customMediaUrl.replace(/^\/+/, '')}`;
      const tex = new THREE.VideoTexture(video);
      mat.map = tex;
      mat.needsUpdate = true;
      video.play().then(() => { if (isAudioUnlocked) video.muted = false; }).catch(() => {});
      videoElementRef.current = video;
      return;
    }

    const targetUrl = customMediaUrl || (activeEcosystem.startsWith('http') ? activeEcosystem : `${window.location.origin}/${activeEcosystem.replace(/^\/+/, '')}`);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 2048;
      c.height = 1024;
      c.getContext('2d')?.drawImage(img, 0, 0, 2048, 1024);
      mat.map = new THREE.CanvasTexture(c);
      mat.needsUpdate = true;
    };
    img.src = targetUrl;
  }, [activeEcosystem, customMediaUrl, currentMediaType, isAudioUnlocked]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      {!isAudioUnlocked && (
        <div className="absolute inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md text-center space-y-6">
            <VolumeX className="w-10 h-10 text-emerald-400 animate-pulse mx-auto" />
            <h2 className="text-2xl font-black text-white">Activar Sistema Next-Gen</h2>
            <p className="text-slate-400 text-sm">Habilita los sensores 6DoF, láser de raycasting, telemetría y audio espacial clínico.</p>
            <button 
              onClick={(e) => { e.stopPropagation(); unlockAudioContext(); }} 
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 cursor-pointer shadow-lg active:scale-95 transition"
            >
              <Play className="w-6 h-6 fill-white" /> INICIAR SESIÓN VR
            </button>
          </div>
        </div>
      )}

      {/* HUD Clínico */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-slate-950/90 px-4 py-2.5 rounded-xl border border-slate-800 text-xs shadow-lg pointer-events-none">
        <Database className="w-4 h-4 text-cyan-400" />
        <span className="text-slate-300 font-mono">PICO 3 PRO: <strong className="text-emerald-400">TELEMETRÍA 6DoF ACTIVA</strong></span>
        <div className="h-4 w-px bg-slate-800" />
        <Target className="w-3.5 h-3.5 text-purple-400" />
        <span>Holograma: <strong className="text-purple-300 font-mono">{activeParadigm}</strong></span>
      </div>

      {onClose && (
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="absolute top-6 right-6 z-30 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white cursor-pointer hover:bg-slate-800 shadow-lg active:scale-95 transition"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="absolute z-10 bottom-32 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center bg-slate-950/90 p-5 rounded-3xl border border-slate-800 shadow-2xl max-w-sm">
          <h1 className="text-slate-100 font-black text-sm uppercase">{currentDisorderName}</h1>
          <p className="text-[11px] text-amber-300 font-mono font-bold mt-1 mb-2">{hudStats}</p>
          <p className="text-[10px] text-slate-400 font-mono border-t border-slate-800 pt-2">Fase de Simulación: <strong>{phaseLabel}</strong></p>
        </div>
      </div>
      <div ref={mountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VrPatientExperience;
