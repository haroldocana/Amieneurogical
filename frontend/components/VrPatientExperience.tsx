// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF (AUDIO RESILIENTE, PROCEDURAL 360 Y BART)
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Database, Target, VolumeX, Play, X } from 'lucide-react';

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

export const VrPatientExperience: React.FC<Props> = ({ patientId: propsPatientId, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;

  const activePatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [activeParadigm, setActiveParadigm] = useState<InteractiveParadigm>('IDLE');
  const [currentDisorderName, setCurrentDisorderName] = useState('Protocolo Clínico Activo');
  const [hudStats, setHudStats] = useState('Apunta al holograma con el láser y presiona el gatillo');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const interactiveGroupRef = useRef<THREE.Group | null>(null);
  const bgMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const wsRef = useRef<WebSocket | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const bgOscillatorRef = useRef<OscillatorNode | null>(null);

  const paradigmStateRef = useRef({
    paradigm: 'IDLE' as InteractiveParadigm,
    hits: 0,
    errors: 0,
    scale: 1.0,
    zOffset: -2.0,
    balloonPumps: 0,
    balloonBankedScore: 0,
    balloonMaxCap: 15,
    cptTargetType: 'GO' as 'GO' | 'NOGO',
    lastSpawnTime: 0,
    lastInteractionTime: 0,
    hoveredObject: null as THREE.Object3D | null
  });

  const triggerHaptic = (intensity = 0.6, durationMs = 50) => {
    try {
      const session = rendererRef.current?.xr.getSession();
      if (session && session.inputSources) {
        for (const src of session.inputSources) {
          if (src.gamepad && src.gamepad.hapticActuators && src.gamepad.hapticActuators.length > 0) {
            src.gamepad.hapticActuators[0].pulse(intensity, durationMs);
          }
        }
      }
    } catch (e) {}
  };

  const ensureAudioUnlocked = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {}
  };

  const playSynthesizedTone = (freq = 520, duration = 0.12, type: OscillatorType = 'sine', vol = 0.3) => {
    try {
      ensureAudioUnlocked();
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const playInstructionChimes = () => {
    ensureAudioUnlocked();
    const chords = [330, 440, 550, 660];
    chords.forEach((note, idx) => {
      setTimeout(() => {
        playSynthesizedTone(note, 0.18, 'sine', 0.25);
      }, idx * 110);
    });
  };

  const speakVoiceInstruction = (text: string) => {
    if (!text) return;
    playInstructionChimes();

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'es-ES';
        utt.volume = 1.0;
        window.speechSynthesis.speak(utt);
      }
    } catch (e) {}
  };

  const startBackgroundAudio = (type: string) => {
    try {
      ensureAudioUnlocked();
      const ctx = audioContextRef.current;
      if (!ctx) return;

      if (bgOscillatorRef.current) {
        try { bgOscillatorRef.current.stop(); bgOscillatorRef.current.disconnect(); } catch (e) {}
        bgOscillatorRef.current = null;
      }

      if (type === 'NONE') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'BETA_WAVES') { osc.frequency.value = 18; gain.gain.value = 0.08; }
      else if (type === 'ALPHA_WAVES') { osc.frequency.value = 10; gain.gain.value = 0.08; }
      else if (type === 'DELTA_WAVES') { osc.frequency.value = 2.5; gain.gain.value = 0.12; }
      else if (type === 'BROWN_NOISE') { osc.type = 'triangle'; osc.frequency.value = 70; gain.gain.value = 0.06; }
      else { osc.frequency.value = 45; gain.gain.value = 0.08; }

      osc.start();
      bgOscillatorRef.current = osc;
    } catch (e) {}
  };

  // GENERADOR PROCEDIMENTAL 360 (GARANTIZA LUZ INCLUSO SI FALLA LA IMAGEN)
  const createProcedural360Canvas = () => {
    const c = document.createElement('canvas');
    c.width = 2048; c.height = 1024;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.48, '#1e293b');
    grad.addColorStop(0.5, '#334155');
    grad.addColorStop(0.52, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 2048; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 512); ctx.lineTo(x, 1024); ctx.stroke();
    }
    for (let y = 512; y < 1024; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke();
    }

    ctx.fillStyle = '#38bdf8';
    for (let x = 120; x < 2048; x += 256) {
      ctx.beginPath(); ctx.arc(x, 220, 25, 0, Math.PI * 2); ctx.fill();
    }
    return c;
  };

  const apply360Background = (rawPath: string) => {
    if (!bgMeshRef.current || !rawPath) return;
    let cleanPath = rawPath.replace(/^\/+/, '');
    if (!cleanPath.startsWith('http') && !cleanPath.startsWith('ecosystems/')) {
      cleanPath = `ecosystems/${cleanPath}`;
    }
    const fullUrl = cleanPath.startsWith('http') ? cleanPath : `${window.location.origin}/${cleanPath}`;

    const applyTextureToMesh = (canvasOrImg: HTMLCanvasElement | HTMLImageElement) => {
      if (!bgMeshRef.current) return;
      const tex = new THREE.CanvasTexture(canvasOrImg as any);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      const mat = bgMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.map = tex;
      mat.color.setHex(0xffffff);
      mat.needsUpdate = true;
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048; canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 2048, 1024);
        applyTextureToMesh(canvas);
      }
    };
    img.onerror = () => {
      applyTextureToMesh(createProcedural360Canvas());
    };
    img.src = fullUrl;
  };

  const transmitInteraction = (data: { hits: number; errors: number; rt?: number; pumps?: number; action: string }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CLINICAL_TEST_INTERACTION',
        paradigm: paradigmStateRef.current.paradigm,
        patientId: activePatientId,
        hits: data.hits,
        errors: data.errors,
        rt: data.rt || 230,
        pumps: data.pumps || 0,
        action: data.action,
        timestamp: Date.now()
      }));
    }
  };

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
    const s = paradigmStateRef.current;
    const now = Date.now();
    const rt = s.lastSpawnTime > 0 ? (now - s.lastSpawnTime) : 240;

    if (hits.length > 0) {
      const hitObj = hits[0].object;
      triggerHaptic(0.85, 70);

      // 1. TAREA BART_3D (GLOBO DE RIESGO + BOTÓN GUARDAR)
      if (s.paradigm === 'BART_3D') {
        if (hitObj.name === 'BART_BANK_BTN') {
          s.balloonBankedScore += s.balloonPumps * 10;
          s.hits += s.balloonPumps;
          playSynthesizedTone(780, 0.2, 'sine', 0.4);
          triggerHaptic(0.9, 100);
          setHudStats(`💰 Puntos cobrados con éxito (+${s.balloonPumps * 10} pts)`);
          transmitInteraction({
            hits: s.hits,
            errors: s.errors,
            pumps: s.balloonPumps,
            rt,
            action: `Puntos cobrados (+${s.balloonPumps * 10})`
          });
          s.balloonPumps = 0;
          s.scale = 1.0;
        } else {
          s.balloonPumps += 1;
          const explodeProb = s.balloonPumps / s.balloonMaxCap;

          if (Math.random() < explodeProb || s.balloonPumps >= s.balloonMaxCap) {
            playSynthesizedTone(85, 0.35, 'sawtooth', 0.5);
            triggerHaptic(1.0, 200);
            s.errors += 1;
            setHudStats('💥 ¡EXPLOSIÓN! Globo reventado');
            transmitInteraction({
              hits: s.hits,
              errors: s.errors,
              pumps: s.balloonPumps,
              rt,
              action: `💥 Explosión del globo a ${s.balloonPumps} bombeos`
            });
            s.scale = 1.0;
            s.balloonPumps = 0;
            s.balloonMaxCap = Math.floor(10 + Math.random() * 12);
          } else {
            playSynthesizedTone(220 + s.balloonPumps * 28, 0.09, 'sine', 0.35);
            s.scale += 0.12;
            setHudStats(`🎈 Bombeo ${s.balloonPumps} | Apunta a "Cobrar" o sigue inflando`);
            transmitInteraction({
              hits: s.hits,
              errors: s.errors,
              pumps: s.balloonPumps,
              rt,
              action: `Inflado: Bombeo ${s.balloonPumps}`
            });
          }
        }
      }

      // 2. TAREA CHOICE_3D
      else if (s.paradigm === 'CHOICE_3D') {
        s.hits += 1;
        playSynthesizedTone(440, 0.15, 'sine');
        const name = hitObj.name.includes('LEFT') ? 'Opción Roja (A)' : 'Opción Azul (B)';
        setHudStats(`⚖️ Decisión Registrada: ${name}`);
        transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Elección: ${name}` });
      }

      // 3. TAREA CPT_3D
      else if (s.paradigm === 'CPT_3D') {
        if (s.cptTargetType === 'GO') {
          s.hits += 1;
          playSynthesizedTone(580, 0.12, 'sine');
          setHudStats(`✅ ¡Impacto Go! RT: ${rt} ms`);
          transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Impacto Go (${rt}ms)` });
        } else {
          s.errors += 1;
          playSynthesizedTone(90, 0.25, 'sawtooth');
          setHudStats(`❌ Error de Inhibición Motora`);
          transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Error Comisión No-Go` });
        }
      }

      // 4. RESTO DE TAREAS
      else {
        s.hits += 1;
        playSynthesizedTone(520, 0.1, 'sine');
        setHudStats(`¡Acierto 6DoF Registrado! (${s.hits})`);
        transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Acierto tarea ${s.paradigm}` });
      }
    } else {
      setHudStats('⚠️ Disparo al vacío: apunta directo al holograma iluminado.');
    }
  }, [activePatientId]);

  useEffect(() => {
    let isComponentMounted = true;
    const wsTarget = (import.meta as any).env?.VITE_WS_URL?.replace(/^http/, 'ws') || 'wss://amieneurogical.onrender.com/ws/vr';
    const ws = new WebSocket(wsTarget.endsWith('/ws/vr') ? wsTarget : `${wsTarget}/ws/vr`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: activePatientId }));
    };

    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'SYNC_CLINICAL_CONTEXT' || d.type === 'START_PIPELINE_PHASE') {
          if (d.ecosystem) apply360Background(d.ecosystem);
          if (d.disorderName) setCurrentDisorderName(d.disorderName);

          if (d.paradigm) {
            setActiveParadigm(d.paradigm);
            const s = paradigmStateRef.current;
            s.paradigm = d.paradigm;
            s.hits = 0;
            s.errors = 0;
            s.scale = 1.0;
            s.balloonPumps = 0;
            s.zOffset = -2.0;
            if (interactiveGroupRef.current) interactiveGroupRef.current.clear();
            setHudStats(`Prueba Activa: ${d.paradigm}. Apunta con el láser y presiona el gatillo.`);
          }
          if (d.speechScript) speakVoiceInstruction(d.speechScript);
          if (d.bgAudio) startBackgroundAudio(d.bgAudio);
        } else if (d.type === 'STOP_ACTIVE_SESSION' || d.type === 'STOP_TEST') {
          setActiveParadigm('IDLE');
          paradigmStateRef.current.paradigm = 'IDLE';
          if (interactiveGroupRef.current) interactiveGroupRef.current.clear();
          if (bgOscillatorRef.current) {
            try { bgOscillatorRef.current.stop(); } catch (err) {}
            bgOscillatorRef.current = null;
          }
          setHudStats('Sesión Concluida.');
        }
      } catch (err) {}
    };

    return () => {
      isComponentMounted = false;
      try { ws.close(); } catch (e) {}
    };
  }, [activePatientId]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    const dir = new THREE.DirectionalLight(0xffffff, 2.2);
    dir.position.set(0, 5, 2);
    scene.add(dir);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const bgGeo = new THREE.SphereGeometry(100, 60, 40);
    bgGeo.scale(-1, 1, 1);
    const bgMesh = new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ color: 0x1e293b }));
    scene.add(bgMesh);
    bgMeshRef.current = bgMesh;

    // Domo procedural inicial
    const initialCanvas = createProcedural360Canvas();
    const initTex = new THREE.CanvasTexture(initialCanvas);
    initTex.colorSpace = THREE.SRGBColorSpace;
    bgMesh.material.map = initTex;
    bgMesh.material.color.setHex(0xffffff);
    bgMesh.material.needsUpdate = true;

    const interactiveGroup = new THREE.Group();
    scene.add(interactiveGroup);
    interactiveGroupRef.current = interactiveGroup;

    const buildLaser = () => new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -5)]),
      new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2.5 })
    );

    const c1 = renderer.xr.getController(0);
    c1.addEventListener('selectstart', handleTrigger);
    c1.add(buildLaser());
    scene.add(c1);

    const c2 = renderer.xr.getController(1);
    c2.addEventListener('selectstart', handleTrigger);
    c2.add(buildLaser());
    scene.add(c2);

    try { container.appendChild(VRButton.createButton(renderer)); } catch (e) {}

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const s = paradigmStateRef.current;

      if (interactiveGroup.children.length === 0 && s.paradigm !== 'IDLE') {
        const solidMat = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x0088aa,
          emissiveIntensity: 0.8,
          roughness: 0.2
        });

        if (s.paradigm === 'CPT_3D') {
          const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), solidMat);
          m.name = 'CPT_TARGET';
          interactiveGroup.add(m);
        } else if (s.paradigm === 'BART_3D') {
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 32), new THREE.MeshStandardMaterial({
            color: 0xec4899,
            emissive: 0x831843,
            emissiveIntensity: 0.8
          }));
          ball.name = 'BART_BALL';
          interactiveGroup.add(ball);

          const bankBtn = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.08), new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x065f46,
            emissiveIntensity: 0.8
          }));
          bankBtn.name = 'BART_BANK_BTN';
          bankBtn.position.set(0, -0.65, 0);
          interactiveGroup.add(bankBtn);
        } else if (s.paradigm === 'N_BACK_3D') {
          for (let i = 0; i < 3; i++) {
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), solidMat.clone());
            cube.name = `CUBE_${i}`;
            cube.position.set(i * 0.45 - 0.45, 0, 0);
            interactiveGroup.add(cube);
          }
        } else if (s.paradigm === 'CHOICE_3D') {
          const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.15), new THREE.MeshStandardMaterial({
            color: 0xef4444, emissive: 0x7f1d1d, emissiveIntensity: 0.8
          }));
          p1.name = 'CHOICE_LEFT';
          p1.position.set(-0.55, 0, 0);

          const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.15), new THREE.MeshStandardMaterial({
            color: 0x3b82f6, emissive: 0x1e3a8a, emissiveIntensity: 0.8
          }));
          p2.name = 'CHOICE_RIGHT';
          p2.position.set(0.55, 0, 0);

          interactiveGroup.add(p1);
          interactiveGroup.add(p2);
        } else if (s.paradigm === 'AAT_3D') {
          const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 16, 80), solidMat);
          torus.name = 'AAT_TARGET';
          const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
          core.name = 'AAT_TARGET';
          torus.add(core);
          interactiveGroup.add(torus);
        } else if (s.paradigm === 'EMDR_3D') {
          const emdr = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), new THREE.MeshStandardMaterial({
            color: 0xff00ff, emissive: 0xaa00aa, emissiveIntensity: 1.0
          }));
          emdr.name = 'EMDR_TARGET';
          interactiveGroup.add(emdr);
        } else if (s.paradigm === 'BIO_3D') {
          const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.35, 0.09, 80, 16), solidMat);
          knot.name = 'BIO_TARGET';
          const center = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
          center.name = 'BIO_TARGET';
          knot.add(center);
          interactiveGroup.add(knot);
        } else if (s.paradigm === 'MIRROR_3D') {
          const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), solidMat.clone());
          h1.name = 'MIRROR_TARGET';
          h1.position.set(-0.4, 0, 0);
          const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), solidMat.clone());
          h2.name = 'MIRROR_TARGET';
          h2.position.set(0.4, 0, 0);
          interactiveGroup.add(h1);
          interactiveGroup.add(h2);
        }
      }

      if (interactiveGroup.children.length > 0 && s.paradigm !== 'IDLE') {
        interactiveGroup.position.set(0, 1.3, s.zOffset);

        if (s.paradigm === 'BART_3D') {
          const ball = interactiveGroup.getObjectByName('BART_BALL');
          if (ball) ball.scale.lerp(new THREE.Vector3(s.scale, s.scale * 1.15, s.scale), 0.1);
        } else if (s.paradigm === 'EMDR_3D') {
          interactiveGroup.position.x = Math.sin(t * 2.2) * 1.3;
        } else if (s.paradigm === 'BIO_3D') {
          const breath = 0.8 + Math.sin(t * Math.PI * 2 * 0.1) * 0.45;
          interactiveGroup.scale.set(breath, breath, breath);
          interactiveGroup.rotation.y += 0.01;
        } else if (s.paradigm === 'CPT_3D') {
          const cpt = interactiveGroup.getObjectByName('CPT_TARGET') as THREE.Mesh;
          if (cpt && Date.now() - s.lastSpawnTime > 1800) {
            s.lastSpawnTime = Date.now();
            s.cptTargetType = Math.random() > 0.35 ? 'GO' : 'NOGO';
            (cpt.material as THREE.MeshStandardMaterial).color.setHex(s.cptTargetType === 'GO' ? 0x10b981 : 0xef4444);
            (cpt.material as THREE.MeshStandardMaterial).emissive.setHex(s.cptTargetType === 'GO' ? 0x059669 : 0xb91c1c);
          }
        }
      }

      c1.updateMatrixWorld(true);
      const tempMat = new THREE.Matrix4().identity().extractRotation(c1.matrixWorld);
      raycasterRef.current.ray.origin.setFromMatrixPosition(c1.matrixWorld);
      raycasterRef.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMat).normalize();

      interactiveGroup.updateMatrixWorld(true);
      const hovers = raycasterRef.current.intersectObjects(interactiveGroup.children, true);
      if (hovers.length > 0) {
        const target = hovers[0].object as THREE.Mesh;
        if (target !== s.hoveredObject && target.material) {
          s.hoveredObject = target;
          triggerHaptic(0.25, 20);
        }
      } else {
        s.hoveredObject = null;
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      bgGeo.dispose();
      bgMesh.material.dispose();
      renderer.dispose();
    };
  }, [handleTrigger]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      {!isAudioUnlocked && (
        <div className="absolute inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center shadow-2xl max-w-sm space-y-4">
            <VolumeX className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
            <h2 className="text-xl font-black text-white">Activar Experiencia WebXR</h2>
            <p className="text-xs text-slate-400">Habilita los sensores 6DoF, láser de raycasting y audio espacial clínico.</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                ensureAudioUnlocked();
                playInstructionChimes();
                setIsAudioUnlocked(true);
              }}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition"
            >
              <Play className="w-5 h-5 fill-white" /> INICIAR SESIÓN VR
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 text-xs text-white pointer-events-none shadow-lg">
        <Database className="text-cyan-400 w-4 h-4" /> 6DoF ACTIVO | <Target className="text-purple-400 w-4 h-4" /> TAREA: {activeParadigm}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="absolute bottom-32 text-center bg-slate-950/90 p-4 rounded-3xl border border-slate-800 text-white z-10 pointer-events-none max-w-xs shadow-2xl">
        <p className="text-[11px] text-amber-300 font-mono font-bold">{hudStats}</p>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VrPatientExperience;
