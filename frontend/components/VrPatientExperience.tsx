// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF DEFINITIVO
// Paradigmas Clínicos Estandarizados (Ensayos Go/No-Go Reales, BART con Pop, EMDR)
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Target, VolumeX, Play, RefreshCw, Volume2, Layers, Activity } from 'lucide-react';

interface Props { patientId?: string; moduleId?: string; onClose?: () => void; }

export type InteractiveParadigm = 'IDLE' | 'CPT_3D' | 'BART_3D' | 'N_BACK_3D' | 'CHOICE_3D' | 'AAT_3D' | 'EMDR_3D' | 'BIO_3D' | 'MIRROR_3D';
export type ClinicalArchetype = 'DOCTOR' | 'SEXUAL_PARTNER' | 'FORENSIC_PEER' | 'HYPNOTIC_GUIDE';

export const VrPatientExperience: React.FC<Props> = ({ patientId: propsPatientId }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;

  const initialPatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';
  const activePatientIdRef = useRef<string>(initialPatientId);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [activeParadigm, setActiveParadigm] = useState<InteractiveParadigm>('CPT_3D');
  const [wsOnline, setWsOnline] = useState(false);
  const [exerciseTitle, setExerciseTitle] = useState('1. Conners CPT Go/No-Go');
  const [lastSpokenScript, setLastSpokenScript] = useState('Dispara únicamente ante la esfera verde. Retén el disparo si aparece roja.');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const interactiveGroupRef = useRef<THREE.Group | null>(null);
  const permanentAvatarRef = useRef<THREE.Group | null>(null);
  const hudMeshRef = useRef<THREE.Mesh | null>(null);
  const bgMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const wsListRef = useRef<WebSocket[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Estados internos del ensayo neuropsicológico activo
  const trialStateRef = useRef({
    paradigm: 'CPT_3D' as InteractiveParadigm,
    hits: 0,
    errors: 0,
    // CPT Go/No-Go
    cptActive: false,
    cptType: 'GO' as 'GO' | 'NOGO',
    stimulusOnsetTime: 0,
    trialTimer: 0,
    // BART
    balloonPumps: 0,
    balloonMaxCap: 12,
    balloonScale: 1.0,
    // N-Back
    activeCube: 0,
    prevCube: -1
  });

  const ensureAudioUnlocked = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) audioContextRef.current = new AudioCtx();
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      setIsAudioUnlocked(true);
    } catch (e) {}
  }, []);

  const playTone = useCallback((freq = 520, duration = 0.12, type: OscillatorType = 'sine') => {
    try {
      ensureAudioUnlocked();
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'suspended') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }, [ensureAudioUnlocked]);

  const playSpeechAudio = useCallback((text: string) => {
    if (!text) return;
    setLastSpokenScript(text);
    ensureAudioUnlocked();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/['"]/g, '').slice(0, 260));
      u.lang = 'es-ES'; u.volume = 1.0; u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  }, [ensureAudioUnlocked]);

  const updateHUD = (title: string, sub: string, score: string) => {
    if (!hudMeshRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)'; ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, 1016, 248);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title.slice(0, 48), 512, 65);
    ctx.fillStyle = '#fde047'; ctx.font = '21px sans-serif'; ctx.fillText(sub.slice(0, 74), 512, 130);
    ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 30px monospace'; ctx.fillText(score, 512, 202);
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).map = new THREE.CanvasTexture(canvas);
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
  };

  const transmitTelemetry = (data: any) => {
    wsListRef.current.forEach((sock) => {
      if (sock?.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({ 
          type: 'CLINICAL_TEST_INTERACTION', 
          paradigm: trialStateRef.current.paradigm, 
          broadcast: true, 
          timestamp: Date.now(), 
          ...data 
        });
        sock.send(payload);
      }
    });
  };

  const safeClearGroup = (group: THREE.Group | null) => {
    if (!group) return;
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      if (child.material) { Array.isArray(child.material) ? child.material.forEach((m) => m.dispose()) : child.material.dispose(); }
      if (child.geometry) child.geometry.dispose();
      group.remove(child);
    }
  };

  // ============================================================================
  // GENERADOR DE ENSAYOS CLÍNICOS REALES (Trials con ISI y discriminación)
  // ============================================================================
  const setupParadigmVisuals = useCallback((paradigm: InteractiveParadigm) => {
    if (!interactiveGroupRef.current) return;
    safeClearGroup(interactiveGroupRef.current);
    const group = interactiveGroupRef.current;
    const t = trialStateRef.current;
    t.paradigm = paradigm;

    if (paradigm === 'CPT_3D' || paradigm === 'IDLE') {
      // Esfera que aparece y desaparece en ensayos temporizados
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 })
      );
      m.name = 'CPT_SPHERE';
      m.visible = false; // Se hace visible solo durante el ensayo
      group.add(m);
      t.cptActive = false;
      t.trialTimer = Date.now() + 1000; // Primer ensayo en 1s
    } else if (paradigm === 'BART_3D') {
      // Globo con botón de inflar y asegurar
      const balloon = new THREE.Mesh(
        new THREE.SphereGeometry(0.30, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0x9d174d, emissiveIntensity: 0.8 })
      );
      balloon.name = 'BART_BALLOON';
      group.add(balloon);

      const bankBtn = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.22, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46, emissiveIntensity: 0.9 })
      );
      bankBtn.name = 'BART_BANK_BTN';
      bankBtn.position.set(0, -0.55, 0);
      group.add(bankBtn);

      t.balloonPumps = 0;
      t.balloonScale = 1.0;
      t.balloonMaxCap = 5 + Math.floor(Math.random() * 8);
    } else if (paradigm === 'EMDR_3D') {
      const emdr = new THREE.Mesh(
        new THREE.SphereGeometry(0.20, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 1.0 })
      );
      emdr.name = 'EMDR_SPHERE';
      group.add(emdr);
    } else {
      // Paradigma genérico AAT / Choice
      const target = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.1, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0284c7 })
      );
      target.name = 'AAT_TARGET';
      group.add(target);
    }
  }, []);

  // Manejador del disparo del gatillo (Interacción Física)
  const handleTrigger = useCallback((event: any) => {
    ensureAudioUnlocked();
    if (!interactiveGroupRef.current) return;
    const ctrl = event.target;
    ctrl.updateMatrixWorld(true);

    const tempMat = new THREE.Matrix4().identity().extractRotation(ctrl.matrixWorld);
    raycasterRef.current.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
    raycasterRef.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMat).normalize();
    interactiveGroupRef.current.updateMatrixWorld(true);

    const hits = raycasterRef.current.intersectObjects(interactiveGroupRef.current.children, true);
    const t = trialStateRef.current;
    const now = Date.now();
    const rt = t.stimulusOnsetTime > 0 ? Math.min(850, Math.max(160, now - t.stimulusOnsetTime)) : 280;

    if (t.paradigm === 'CPT_3D') {
      const sphere = interactiveGroupRef.current.getObjectByName('CPT_SPHERE') as THREE.Mesh;
      if (sphere && sphere.visible) {
        if (t.cptType === 'GO') {
          // Acierto ante estímulo verde
          t.hits += 1;
          playTone(680, 0.1);
          sphere.visible = false; // Desaparece inmediatamente tras el acierto
          updateHUD('CPT: FRENO INHIBITORIO', `¡IMPACTO GO! (${rt}ms)`, `Aciertos: ${t.hits} | Fallos: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Impacto Go (${rt}ms)` });
        } else {
          // Error de comisión ante estímulo rojo (falla de freno inhibitorio)
          t.errors += 1;
          playTone(90, 0.25, 'sawtooth');
          sphere.visible = false;
          updateHUD('CPT: FRENO INHIBITORIO', '❌ ERROR COMISIÓN (Era Rojo)', `Aciertos: ${t.hits} | Fallos: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Error Comisión No-Go (${rt}ms)` });
        }
        t.trialTimer = now + 1200 + Math.random() * 800; // Próximo ensayo en 1.2 - 2.0s
      }
    } else if (t.paradigm === 'BART_3D') {
      const hitObj = hits.length > 0 ? hits[0].object : null;
      if (hitObj?.name === 'BART_BANK_BTN') {
        // Asegurar puntos
        const points = t.balloonPumps * 10;
        t.hits += points;
        playTone(780, 0.25);
        t.balloonPumps = 0;
        t.balloonScale = 1.0;
        t.balloonMaxCap = 5 + Math.floor(Math.random() * 8);
        updateHUD('BART: RIESGO ASEGURADO', `¡+${points} PUNTOS SALVADOS!`, `Puntos: ${t.hits} | Explosiones: ${t.errors}`);
        transmitTelemetry({ hits: t.hits, errors: t.errors, pumps: 0, rt, action: `Puntos asegurados (+${points})` });
      } else {
        // Inflar el globo
        t.balloonPumps += 1;
        if (t.balloonPumps >= t.balloonMaxCap) {
          // ¡EXPLOSIÓN!
          t.errors += 1;
          playTone(65, 0.4, 'sawtooth');
          t.balloonPumps = 0;
          t.balloonScale = 1.0;
          t.balloonMaxCap = 5 + Math.floor(Math.random() * 8);
          updateHUD('BART: ¡EXPLOSIÓN!', '💥 GLOBO REVENTADO POR RIESGO', `Puntos: ${t.hits} | Explosiones: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, pumps: 0, rt, action: '💥 Explosión de globo' });
        } else {
          // Inflado exitoso
          t.balloonScale += 0.12;
          playTone(220 + t.balloonPumps * 45, 0.08);
          updateHUD('BART: INFLANDO', `Bombeo actual: ${t.balloonPumps}`, `Puntos: ${t.hits} | Explosiones: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, pumps: t.balloonPumps, rt, action: `Bombeo ${t.balloonPumps}` });
        }
      }
    } else {
      // Otros paradigmas
      t.hits += 1;
      playTone(520, 0.1);
      updateHUD(`TAREA: ${t.paradigm}`, `Impacto registrado (${rt}ms)`, `Aciertos: ${t.hits} | Fallos: ${t.errors}`);
      transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Acierto en ${t.paradigm}` });
    }
  }, [ensureAudioUnlocked, playTone]);

  // Sincronización WebSocket con la Workstation
  useEffect(() => {
    const wsTarget = (import.meta as any).env?.VITE_WS_URL?.replace(/^http/, 'ws') || 'wss://amieneurogical.onrender.com/ws/vr';
    const ws = new WebSocket(wsTarget.endsWith('/ws/vr') ? wsTarget : `${wsTarget}/ws/vr`);
    
    ws.onopen = () => {
      setWsOnline(true);
      ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: initialPatientId }));
    };

    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'START_PIPELINE_PHASE' && d.paradigm) {
          setActiveParadigm(d.paradigm);
          setupParadigmVisuals(d.paradigm);
          setExerciseTitle(d.exerciseName || d.paradigm);
          updateHUD(d.exerciseName || d.paradigm, d.speechScript || 'Prueba activa.', 'Aciertos: 0 | Fallos: 0');
          if (d.speechScript) playSpeechAudio(d.speechScript);
        } else if (d.type === 'STOP_ACTIVE_SESSION') {
          updateHUD('SESIÓN FINALIZADA', 'Informe emitido en la consola médica.', `Aciertos: ${trialStateRef.current.hits} | Fallos: ${trialStateRef.current.errors}`);
        }
      } catch (err) {}
    };

    wsListRef.current.push(ws);
    return () => ws.close();
  }, [initialPatientId, setupParadigmVisuals, playSpeechAudio]);

  // Montaje Three.js WebXR
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    scene.add(new THREE.AmbientLight(0xffffff, 2.5));
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(2, 5, 3);
    scene.add(dir);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.45, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Cúpula 360° en memoria local
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const cctx = c.getContext('2d');
    if (cctx) {
      const grad = cctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#0f172a'); grad.addColorStop(0.5, '#1e293b'); grad.addColorStop(1, '#020617');
      cctx.fillStyle = grad; cctx.fillRect(0, 0, 1024, 512);
    }
    const bgMesh = new THREE.Mesh(
      new THREE.SphereGeometry(60, 32, 24),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.BackSide })
    );
    scene.add(bgMesh);
    bgMeshRef.current = bgMesh;

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);
    stageGroupRef.current = stageGroup;

    // HUD Superior
    const hudMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.75, 0.44),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.96 })
    );
    hudMesh.position.set(0, 1.85, -2.1);
    stageGroup.add(hudMesh);
    hudMeshRef.current = hudMesh;
    updateHUD('AMIE CLINICAL COPILOT', 'Sesión Clínica Activa • Apunta y dispara', 'Aciertos: 0');

    // Grupo de hologramas interactivos
    const interactiveGroup = new THREE.Group();
    interactiveGroup.position.set(0.25, 1.25, -1.8);
    stageGroup.add(interactiveGroup);
    interactiveGroupRef.current = interactiveGroup;
    setupParadigmVisuals('CPT_3D');

    // Punteros láser en ambos mandos
    const buildLaser = () => {
      const g = new THREE.Group();
      g.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -2.2)]),
        new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 3 })
      ));
      const r = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
      r.position.set(0, 0, -1.9);
      g.add(r);
      return g;
    };

    const c1 = renderer.xr.getController(0);
    c1.addEventListener('selectstart', handleTrigger);
    c1.add(buildLaser());
    scene.add(c1);

    const c2 = renderer.xr.getController(1);
    c2.addEventListener('selectstart', handleTrigger);
    c2.add(buildLaser());
    scene.add(c2);

    try { mountRef.current.appendChild(VRButton.createButton(renderer)); } catch (e) {}

    const clock = new THREE.Clock();

    // ========================================================================
    // BUCLE DE RENDERIZADO Y LÓGICA DE ENSAYOS TEMPORIZADOS (Trials)
    // ========================================================================
    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const now = Date.now();
      const trial = trialStateRef.current;

      // 1. LÓGICA CRONOMETRADA DE CONNERS CPT
      if (trial.paradigm === 'CPT_3D' && interactiveGroupRef.current) {
        const sphere = interactiveGroupRef.current.getObjectByName('CPT_SPHERE') as THREE.Mesh;
        if (sphere) {
          if (!sphere.visible && now >= trial.trialTimer) {
            // Iniciar nuevo estímulo
            trial.cptType = Math.random() < 0.75 ? 'GO' : 'NOGO'; // 75% Go, 25% No-Go
            const isGo = trial.cptType === 'GO';
            (sphere.material as THREE.MeshStandardMaterial).color.setHex(isGo ? 0x10b981 : 0xef4444);
            (sphere.material as THREE.MeshStandardMaterial).emissive.setHex(isGo ? 0x059669 : 0xb91c1c);
            sphere.visible = true;
            trial.stimulusOnsetTime = now;
            trial.cptActive = true;
          } else if (sphere.visible && now - trial.stimulusOnsetTime > 450) {
            // El estímulo desaparece tras 450ms
            sphere.visible = false;
            if (trial.cptType === 'GO' && trial.cptActive) {
              // Error de omisión (no disparó a tiempo ante verde)
              trial.errors += 1;
              playTone(110, 0.15, 'triangle');
              updateHUD('CPT: ERROR DE OMISIÓN', '⚠️ TIEMPO AGOTADO (Era Verde)', `Aciertos: ${trial.hits} | Fallos: ${trial.errors}`);
              transmitTelemetry({ hits: trial.hits, errors: trial.errors, rt: 450, action: 'Error de Omisión (Verde no disparado)' });
            }
            trial.cptActive = false;
            trial.trialTimer = now + 1200 + Math.random() * 800; // Intervalo entre estímulos (ISI)
          }
        }
      }

      // 2. LÓGICA DE GLOBO BART
      if (trial.paradigm === 'BART_3D' && interactiveGroupRef.current) {
        const balloon = interactiveGroupRef.current.getObjectByName('BART_BALLOON');
        if (balloon) {
          balloon.scale.lerp(new THREE.Vector3(trial.balloonScale, trial.balloonScale * 1.15, trial.balloonScale), 0.1);
        }
      }

      // 3. LÓGICA DE MOVIMIENTO SACÁDICO EMDR
      if (trial.paradigm === 'EMDR_3D' && interactiveGroupRef.current) {
        interactiveGroupRef.current.position.x = 0.25 + Math.sin(t * 2.5) * 0.95;
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, [handleTrigger, setupParadigmVisuals, playTone]);

  return (
    <div onClick={ensureAudioUnlocked} className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden cursor-crosshair">
      {!isAudioUnlocked && (
        <div onClick={ensureAudioUnlocked} className="absolute inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-8 cursor-pointer">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center shadow-2xl max-w-sm space-y-4">
            <VolumeX className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
            <h2 className="text-xl font-black text-white">Iniciar Sesión Inmersiva</h2>
            <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer">
              <Play className="w-5 h-5 fill-white" /> ENTRAR A LA PRUEBA VR
            </button>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-white shadow-lg font-mono">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${wsOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span>ESTADO: <strong className="text-emerald-400">{wsOnline ? 'SINCRONIZADO' : 'STANDALONE'}</strong></span>
          <div className="h-4 w-px bg-slate-800" />
          <Target className="text-cyan-400 w-4 h-4" />
          <span className="text-cyan-300 font-bold truncate max-w-[280px]">{exerciseTitle}</span>
        </div>
        <button onClick={() => playSpeechAudio(lastSpokenScript)} className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded border border-emerald-600 flex items-center gap-1 cursor-pointer">
          <Volume2 className="w-3 h-3" /> Repetir Voz
        </button>
      </div>
      <div ref={mountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VrPatientExperience;
