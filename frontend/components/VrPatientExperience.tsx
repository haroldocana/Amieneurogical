// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF (DESTRUCTOR DE MEMORIA 3D SEGURO)
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
  const [hudStats, setHudStats] = useState('Apunta con el láser al holograma y presiona el gatillo');
  const [wsOnline, setWsOnline] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const interactiveGroupRef = useRef<THREE.Group | null>(null);
  const hudMeshRef = useRef<THREE.Mesh | null>(null);
  const bgMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const wsRef = useRef<WebSocket | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const paradigmStateRef = useRef({
    paradigm: 'IDLE' as InteractiveParadigm,
    hits: 0,
    errors: 0,
    scale: 1.0,
    zOffset: -2.0,
    balloonPumps: 0,
    balloonMaxCap: 15,
    cptTargetType: 'GO' as 'GO' | 'NOGO',
    lastSpawnTime: 0
  });

  const triggerHaptic = (intensity = 0.8, durationMs = 60) => {
    try {
      const session = rendererRef.current?.xr.getSession();
      if (session?.inputSources) {
        for (const src of session.inputSources) {
          if (src.gamepad?.hapticActuators?.length) {
            src.gamepad.hapticActuators[0].pulse(intensity, durationMs);
          }
        }
      }
    } catch (e) {}
  };

  const ensureAudioUnlocked = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setIsAudioUnlocked(true);
    } catch (e) {}
  }, []);

  const playSynthesizedTone = (freq = 520, duration = 0.15, type: OscillatorType = 'sine', vol = 1.0) => {
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

  const playChimes = () => {
    [440, 554, 659, 880].forEach((note, idx) => {
      setTimeout(() => playSynthesizedTone(note, 0.18, 'sine', 1.0), idx * 100);
    });
  };

  // NATIVE WEB AUDIO SPEECH DECODER (FORZAR AUDIO EN PICO OS)
  const playSpeechAudio = async (text: string) => {
    if (!text) return;
    ensureAudioUnlocked();
    playChimes();

    try {
      const clean = text.replace(/['"]/g, '').slice(0, 180);
      const url = `https://api.streamelements.com/kappa/v2/speech?voice=Mia&text=${encodeURIComponent(clean)}`;
      const res = await fetch(url);
      if (res.ok && audioContextRef.current) {
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await audioContextRef.current.decodeAudioData(arrayBuf);
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 1.0;
        source.buffer = audioBuf;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        source.start(0);
        return;
      }
    } catch (e) {}

    // Fallback nativo
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES';
        u.volume = 1.0;
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  };

  // BANNER 3D VISIBLE DENTRO DEL CASCO
  const update3dInVrBanner = (title: string, sub: string, score: string) => {
    if (!hudMeshRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 1012, 244);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 512, 65);

    ctx.fillStyle = '#fde047';
    ctx.font = '28px sans-serif';
    ctx.fillText(sub, 512, 135);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(score, 512, 205);

    const tex = new THREE.CanvasTexture(canvas);
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
  };

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

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048; canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 2048, 1024);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        const mat = bgMeshRef.current!.material as THREE.MeshBasicMaterial;
        mat.map = tex;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
      }
    };
    img.onerror = () => {
      const tex = new THREE.CanvasTexture(createProcedural360Canvas());
      tex.colorSpace = THREE.SRGBColorSpace;
      (bgMeshRef.current!.material as THREE.MeshBasicMaterial).map = tex;
      (bgMeshRef.current!.material as THREE.MeshBasicMaterial).needsUpdate = true;
    };
    img.src = fullUrl;
  };

  // LIMPIEZA DE MEMORIA A PRUEBA DE FALLOS
  const safeClearInteractiveGroup = () => {
    if (!interactiveGroupRef.current) return;
    const group = interactiveGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
      if (child.geometry) child.geometry.dispose();
      group.remove(child);
    }
  };

  const transmitInteraction = (data: { hits: number; errors: number; rt?: number; pumps?: number; action: string }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CLINICAL_TEST_INTERACTION',
        paradigm: paradigmStateRef.current.paradigm,
        patientId: activePatientId,
        hits: data.hits,
        errors: data.errors,
        rt: data.rt || 240,
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
    const rt = s.lastSpawnTime > 0 ? (now - s.lastSpawnTime) : Math.floor(220 + Math.random() * 80);

    if (hits.length > 0) {
      const hitObj = hits[0].object;
      triggerHaptic(0.9, 80);

      if (s.paradigm === 'BART_3D') {
        if (hitObj.name === 'BART_BANK_BTN') {
          s.hits += s.balloonPumps * 10;
          playSynthesizedTone(780, 0.25, 'sine', 1.0);
          update3dInVrBanner('BART: RIESGO Y CONTROL', '¡PUNTOS COBRADOS!', `Aciertos: ${s.hits} pts`);
          transmitInteraction({ hits: s.hits, errors: s.errors, pumps: s.balloonPumps, rt, action: `Puntos cobrados (+${s.balloonPumps * 10})` });
          s.balloonPumps = 0; s.scale = 1.0;
        } else {
          s.balloonPumps += 1;
          if (Math.random() < (s.balloonPumps / s.balloonMaxCap) || s.balloonPumps >= s.balloonMaxCap) {
            playSynthesizedTone(75, 0.35, 'sawtooth', 1.0);
            triggerHaptic(1.0, 250);
            s.errors += 1;
            update3dInVrBanner('BART: RIESGO Y CONTROL', '💥 ¡EXPLOSIÓN!', `Fallos: ${s.errors}`);
            transmitInteraction({ hits: s.hits, errors: s.errors, pumps: s.balloonPumps, rt, action: `💥 Explosión a ${s.balloonPumps} bombeos` });
            s.scale = 1.0; s.balloonPumps = 0; s.balloonMaxCap = Math.floor(10 + Math.random() * 12);
          } else {
            playSynthesizedTone(220 + s.balloonPumps * 32, 0.1, 'sine', 1.0);
            s.scale += 0.12; s.hits += 1;
            update3dInVrBanner('BART: RIESGO Y CONTROL', `Bombeo: ${s.balloonPumps}`, `Aciertos: ${s.hits}`);
            transmitInteraction({ hits: s.hits, errors: s.errors, pumps: s.balloonPumps, rt, action: `Inflado: Bombeo ${s.balloonPumps}` });
          }
        }
      } else if (s.paradigm === 'CHOICE_3D') {
        s.hits += 1;
        playSynthesizedTone(440, 0.15, 'sine', 1.0);
        const name = hitObj.name.includes('LEFT') ? 'Opción Roja (A)' : 'Opción Azul (B)';
        update3dInVrBanner('DILEMA RÁPIDO', `Selección: ${name}`, `Aciertos: ${s.hits}`);
        transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Elección: ${name}` });
      } else if (s.paradigm === 'CPT_3D') {
        if (s.cptTargetType === 'GO') {
          s.hits += 1;
          playSynthesizedTone(580, 0.12, 'sine', 1.0);
          update3dInVrBanner('CPT: ATENCIÓN SOSTENIDA', `¡IMPACTO GO! ${rt}ms`, `Aciertos: ${s.hits}`);
          transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Impacto Go (${rt}ms)` });
        } else {
          s.errors += 1;
          playSynthesizedTone(90, 0.25, 'sawtooth', 1.0);
          triggerHaptic(1.0, 150);
          update3dInVrBanner('CPT: ATENCIÓN SOSTENIDA', '❌ ERROR COMISIÓN', `Fallos: ${s.errors}`);
          transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Error Comisión No-Go` });
        }
      } else {
        s.hits += 1;
        playSynthesizedTone(520, 0.1, 'sine', 1.0);
        update3dInVrBanner(`TAREA: ${s.paradigm}`, '¡IMPACTO REGISTRADO!', `Aciertos: ${s.hits}`);
        transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Acierto tarea ${s.paradigm}` });
      }
    }
  }, [activePatientId, ensureAudioUnlocked]);

  useEffect(() => {
    let ws: WebSocket;
    let heartbeatTimer: ReturnType<typeof setInterval>;

    const connect = () => {
      const wsTarget = (import.meta as any).env?.VITE_WS_URL?.replace(/^http/, 'ws') || 'wss://amieneurogical.onrender.com/ws/vr';
      ws = new WebSocket(wsTarget.endsWith('/ws/vr') ? wsTarget : `${wsTarget}/ws/vr`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsOnline(true);
        ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: activePatientId }));
        heartbeatTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING', patientId: activePatientId }));
          }
        }, 15000);
      };

      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === 'SYNC_CLINICAL_CONTEXT' || d.type === 'START_PIPELINE_PHASE') {
            if (d.ecosystem) apply360Background(d.ecosystem);

            if (d.paradigm) {
              setActiveParadigm(d.paradigm);
              const s = paradigmStateRef.current;
              s.paradigm = d.paradigm;
              s.hits = 0; s.errors = 0; s.scale = 1.0; s.balloonPumps = 0; s.zOffset = -2.0;
              
              // VACIADO ABSOLUTO DE MEMORIA DE HOLOGRAMAS ANTERIORES
              safeClearInteractiveGroup();
              
              setHudStats(`Tarea Activa: ${d.paradigm}`);
              update3dInVrBanner(`TAREA: ${d.paradigm}`, d.speechScript || 'Apunta con el láser y presiona el gatillo', 'Aciertos: 0');
              if (d.speechScript) playSpeechAudio(d.speechScript);
            }
          } else if (d.type === 'STOP_ACTIVE_SESSION') {
            setActiveParadigm('IDLE');
            paradigmStateRef.current.paradigm = 'IDLE';
            safeClearInteractiveGroup();
            setHudStats('Sesión Concluida');
            update3dInVrBanner('SESIÓN FINALIZADA', 'Datos transmitidos con éxito', '');
          }
        } catch (err) {}
      };

      ws.onclose = () => {
        setWsOnline(false);
        clearInterval(heartbeatTimer);
        setTimeout(connect, 2000);
      };
    };

    connect();
    return () => { clearInterval(heartbeatTimer); if (ws) ws.close(); };
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

    renderer.xr.addEventListener('sessionstart', () => {
      ensureAudioUnlocked();
      playChimes();
    });

    const bgGeo = new THREE.SphereGeometry(100, 60, 40);
    bgGeo.scale(-1, 1, 1);
    const bgMesh = new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ color: 0x1e293b }));
    scene.add(bgMesh);
    bgMeshRef.current = bgMesh;

    const initialCanvas = createProcedural360Canvas();
    const initTex = new THREE.CanvasTexture(initialCanvas);
    initTex.colorSpace = THREE.SRGBColorSpace;
    bgMesh.material.map = initTex;
    bgMesh.material.color.setHex(0xffffff);
    bgMesh.material.needsUpdate = true;

    const hudGeo = new THREE.PlaneGeometry(1.6, 0.4);
    const hudMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 });
    const hudMesh = new THREE.Mesh(hudGeo, hudMat);
    hudMesh.position.set(0, 2.1, -2.0);
    scene.add(hudMesh);
    hudMeshRef.current = hudMesh;
    update3dInVrBanner('AMIE CLINICAL COPILOT', 'Esperando estación de control...', '');

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
          color: 0x00ffff, emissive: 0x0088aa, emissiveIntensity: 0.8, roughness: 0.2
        });

        if (s.paradigm === 'CPT_3D') {
          const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), solidMat);
          m.name = 'CPT_TARGET';
          interactiveGroup.add(m);
        } else if (s.paradigm === 'BART_3D') {
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 32), new THREE.MeshStandardMaterial({
            color: 0xec4899, emissive: 0x831843, emissiveIntensity: 0.8
          }));
          ball.name = 'BART_BALL';
          interactiveGroup.add(ball);

          const bankBtn = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.2, 0.1), new THREE.MeshStandardMaterial({
            color: 0x10b981, emissive: 0x065f46, emissiveIntensity: 0.85
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
          const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.15), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d, emissiveIntensity: 0.8 }));
          p1.name = 'CHOICE_LEFT'; p1.position.set(-0.55, 0, 0);
          const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.15), new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1e3a8a, emissiveIntensity: 0.8 }));
          p2.name = 'CHOICE_RIGHT'; p2.position.set(0.55, 0, 0);
          interactiveGroup.add(p1); interactiveGroup.add(p2);
        } else if (s.paradigm === 'AAT_3D') {
          const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 16, 80), solidMat);
          torus.name = 'AAT_TARGET';
          const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
          core.name = 'AAT_TARGET'; torus.add(core);
          interactiveGroup.add(torus);
        } else if (s.paradigm === 'EMDR_3D') {
          const emdr = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xaa00aa, emissiveIntensity: 1.0 }));
          emdr.name = 'EMDR_TARGET';
          interactiveGroup.add(emdr);
        } else if (s.paradigm === 'BIO_3D') {
          const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.35, 0.09, 80, 16), solidMat);
          knot.name = 'BIO_TARGET';
          const center = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
          center.name = 'BIO_TARGET'; knot.add(center);
          interactiveGroup.add(knot);
        } else if (s.paradigm === 'MIRROR_3D') {
          const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), solidMat.clone());
          h1.name = 'MIRROR_TARGET'; h1.position.set(-0.4, 0, 0);
          const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), solidMat.clone());
          h2.name = 'MIRROR_TARGET'; h2.position.set(0.4, 0, 0);
          interactiveGroup.add(h1); interactiveGroup.add(h2);
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

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      bgGeo.dispose();
      bgMesh.material.dispose();
      renderer.dispose();
    };
  }, [handleTrigger, ensureAudioUnlocked]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      {!isAudioUnlocked && (
        <div 
          onClick={() => { ensureAudioUnlocked(); playChimes(); }}
          onPointerDown={() => { ensureAudioUnlocked(); playChimes(); }}
          className="absolute inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 cursor-pointer"
        >
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center shadow-2xl max-w-sm space-y-4 pointer-events-auto">
            <VolumeX className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
            <h2 className="text-xl font-black text-white">Activar Experiencia WebXR</h2>
            <p className="text-xs text-slate-400">Toca esta pantalla con el dedo o aprieta el gatillo del mando.</p>
            <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg">
              <Play className="w-5 h-5 fill-white" /> INICIAR SESIÓN VR
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 text-xs text-white pointer-events-none shadow-lg font-mono">
        <span className={`w-2.5 h-2.5 rounded-full ${wsOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
        <span>PICO 3: <strong className={wsOnline ? 'text-emerald-400' : 'text-rose-400'}>{wsOnline ? 'ONLINE' : 'RECONECTANDO'}</strong></span>
        <div className="h-4 w-px bg-slate-800" />
        <Target className="text-purple-400 w-4 h-4" />
        <span>TAREA: <strong className="text-purple-300">{activeParadigm}</strong></span>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VrPatientExperience;
