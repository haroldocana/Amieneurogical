// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF CON ESCENARIOS REALES,
// AVATAR MÉDICO 3D SIEMPRE ACTIVO Y MULTI-SALA WEBSOCKET
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Target, VolumeX, Play, RefreshCw } from 'lucide-react';

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

export const VrPatientExperience: React.FC<Props> = ({ patientId: propsPatientId }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;

  const initialPatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';
  const activePatientIdRef = useRef<string>(initialPatientId);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [activeParadigm, setActiveParadigm] = useState<InteractiveParadigm>('N_BACK_3D');
  const [wsOnline, setWsOnline] = useState(false);
  const [disorderTitle, setDisorderTitle] = useState('AVATAR CLÍNICO Y HOLOGRAMAS 3D ACTIVOS');

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

  const paradigmStateRef = useRef({
    paradigm: 'N_BACK_3D' as InteractiveParadigm,
    hits: 0,
    errors: 0,
    scale: 1.0,
    balloonPumps: 0,
    balloonMaxCap: 15,
    cptTargetType: 'GO' as 'GO' | 'NOGO',
    lastSpawnTime: Date.now()
  });

  const triggerHaptic = (intensity = 0.9, durationMs = 80) => {
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
      if (!ctx || ctx.state === 'suspended') return;
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
      setTimeout(() => playSynthesizedTone(note, 0.18, 'sine', 1.0), idx * 90);
    });
  };

  const playSpeechAudio = async (text: string) => {
    if (!text) return;
    ensureAudioUnlocked();
    playChimes();

    try {
      const clean = text.replace(/['"]/g, '').slice(0, 200);
      const url = `https://api.streamelements.com/kappa/v2/speech?voice=Mia&text=${encodeURIComponent(clean)}`;
      const res = await fetch(url);
      if (res.ok && audioContextRef.current) {
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await audioContextRef.current.decodeAudioData(arrayBuf);
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
        source.buffer = audioBuf;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        source.start(0);
        return;
      }
    } catch (e) {}

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

  const update3dInVrBanner = (title: string, sub: string, score: string) => {
    if (!hudMeshRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 1016, 248);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 44), 512, 65);

    ctx.fillStyle = '#fde047';
    ctx.font = '24px sans-serif';
    ctx.fillText(sub.slice(0, 62), 512, 130);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(score, 512, 202);

    const tex = new THREE.CanvasTexture(canvas);
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
  };

  // ESCENARIOS 360° REALISTAS (CONSULTORIO MÉDICO, BOSQUE Y CALLE SIN BOLAS EN EL TECHO)
  const createRealisticEnvironmentCanvas = (theme: 'OFFICE' | 'FOREST' | 'STREET' = 'OFFICE') => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    if (theme === 'FOREST') {
      grad.addColorStop(0, '#0c4a6e');
      grad.addColorStop(0.45, '#bae6fd');
      grad.addColorStop(0.5, '#15803d');
      grad.addColorStop(1, '#052e16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.fillStyle = '#14532d';
      for (let x = 40; x < 2048; x += 110) {
        ctx.beginPath();
        ctx.moveTo(x, 340);
        ctx.lineTo(x - 45, 530);
        ctx.lineTo(x + 45, 530);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'STREET') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.48, '#4338ca');
      grad.addColorStop(0.5, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.fillStyle = '#1e293b';
      for (let x = 20; x < 2048; x += 140) {
        const h = 140 + (x % 90);
        ctx.fillRect(x, 512 - h, 105, h);
      }
    } else {
      grad.addColorStop(0, '#e2e8f0');
      grad.addColorStop(0.25, '#cbd5e1');
      grad.addColorStop(0.5, '#94a3b8');
      grad.addColorStop(0.52, '#475569');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      for (let x = 0; x < 2048; x += 256) {
        ctx.strokeRect(x + 12, 260, 232, 250);
      }
    }
    return c;
  };

  const apply360Background = (rawPath: string) => {
    if (!bgMeshRef.current || !rawPath) return;
    const theme = rawPath.includes('forest') ? 'FOREST' : rawPath.includes('street') ? 'STREET' : 'OFFICE';

    const immediateTex = new THREE.CanvasTexture(createRealisticEnvironmentCanvas(theme));
    immediateTex.colorSpace = THREE.SRGBColorSpace;
    const mat = bgMeshRef.current.material as THREE.MeshBasicMaterial;
    mat.map = immediateTex;
    mat.color.setHex(0xffffff);
    mat.needsUpdate = true;

    let cleanPath = rawPath.replace(/^\/+/, '');
    if (!cleanPath.startsWith('http') && !cleanPath.startsWith('ecosystems/')) {
      cleanPath = `ecosystems/${cleanPath}`;
    }
    const fullUrl = cleanPath.startsWith('http') ? cleanPath : `${window.location.origin}/${cleanPath}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx && bgMeshRef.current) {
        ctx.drawImage(img, 0, 0, 2048, 1024);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const m = bgMeshRef.current.material as THREE.MeshBasicMaterial;
        m.map = tex;
        m.needsUpdate = true;
      }
    };
    img.src = fullUrl;
  };

  const safeClearInteractiveGroup = () => {
    if (!interactiveGroupRef.current) return;
    const group = interactiveGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
      if (child.geometry) child.geometry.dispose();
      group.remove(child);
    }
  };

  const recenterStageToPatientView = () => {
    if (!stageGroupRef.current || !cameraRef.current) return;
    const camPos = new THREE.Vector3();
    cameraRef.current.getWorldPosition(camPos);
    const eyeHeightOffset = camPos.y > 0.4 ? camPos.y - 1.45 : 0;
    stageGroupRef.current.position.y = eyeHeightOffset;
  };

  const spawnParadigmHolograms = (paradigm: InteractiveParadigm) => {
    if (!interactiveGroupRef.current) return;
    safeClearInteractiveGroup();

    const group = interactiveGroupRef.current;
    const solidMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.15
    });

    if (paradigm === 'CPT_3D' || paradigm === 'IDLE') {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.32, 2),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 })
      );
      m.name = 'CPT_TARGET';
      group.add(m);
    } else if (paradigm === 'BART_3D') {
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0x9d174d, emissiveIntensity: 0.85 })
      );
      ball.name = 'BART_BALL';
      group.add(ball);

      const bankBtn = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.22, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46, emissiveIntensity: 0.9 })
      );
      bankBtn.name = 'BART_BANK_BTN';
      bankBtn.position.set(0, -0.55, 0);
      group.add(bankBtn);
    } else if (paradigm === 'N_BACK_3D') {
      const colors = [0x22d3ee, 0xa855f7, 0xf59e0b];
      for (let i = 0; i < 3; i++) {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.28, 0.28),
          new THREE.MeshStandardMaterial({ color: colors[i], emissive: colors[i], emissiveIntensity: 0.6 })
        );
        cube.name = `CUBE_${i}`;
        cube.position.set((i - 1) * 0.45, 0, 0);
        group.add(cube);
      }
    } else if (paradigm === 'CHOICE_3D') {
      const p1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.85 })
      );
      p1.name = 'CHOICE_LEFT';
      p1.position.set(-0.45, 0, 0);
      const p2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1e40af, emissiveIntensity: 0.85 })
      );
      p2.name = 'CHOICE_RIGHT';
      p2.position.set(0.45, 0, 0);
      group.add(p1);
      group.add(p2);
    } else if (paradigm === 'AAT_3D') {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 16, 80), solidMat);
      torus.name = 'AAT_TARGET';
      group.add(torus);
    } else if (paradigm === 'EMDR_3D') {
      const emdr = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 1.0 })
      );
      emdr.name = 'EMDR_TARGET';
      group.add(emdr);
    } else if (paradigm === 'BIO_3D') {
      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.3, 0.08, 80, 16), solidMat);
      knot.name = 'BIO_TARGET';
      group.add(knot);
    } else if (paradigm === 'MIRROR_3D') {
      const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), solidMat.clone());
      h1.name = 'MIRROR_LEFT';
      h1.position.set(-0.42, 0, 0);
      const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), solidMat.clone());
      h2.name = 'MIRROR_RIGHT';
      h2.position.set(0.42, 0, 0);
      group.add(h1);
      group.add(h2);
    }

    recenterStageToPatientView();
  };

  // AVATAR MÉDICO 3D SIEMPRE PRESENTE FRENTE AL PACIENTE
  const createPermanentClinicalAvatar = (parentStage: THREE.Group) => {
    const avatarGroup = new THREE.Group();
    avatarGroup.name = 'CLINICAL_AVATAR_3D';

    const baseRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 0.06, 32),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x00f0ff, emissiveIntensity: 0.6 })
    );
    baseRing.position.set(0, 0.45, 0);
    avatarGroup.add(baseRing);

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, 0.72, 24),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
    );
    torso.position.set(0, 0.95, 0);
    avatarGroup.add(torso);

    const chestStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.55, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.4 })
    );
    chestStripe.position.set(0, 0.98, 0.22);
    avatarGroup.add(chestStripe);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.08, 0.14, 16),
      new THREE.MeshStandardMaterial({ color: 0xe0ac69 })
    );
    neck.position.set(0, 1.36, 0);
    avatarGroup.add(neck);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.4 })
    );
    head.position.set(0, 1.52, 0);
    avatarGroup.add(head);

    const eyeGeo = new THREE.SphereGeometry(0.026, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.065, 1.55, 0.16);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.065, 1.55, 0.16);
    avatarGroup.add(leftEye);
    avatarGroup.add(rightEye);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.012, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    halo.position.set(0, 1.76, 0);
    halo.rotation.x = Math.PI / 2;
    avatarGroup.add(halo);

    const armGeo = new THREE.CylinderGeometry(0.055, 0.048, 0.56, 16);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.name = 'AVATAR_LEFT_ARM';
    leftArm.position.set(-0.31, 0.98, 0.08);
    leftArm.rotation.z = Math.PI / 14;

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.name = 'AVATAR_RIGHT_ARM';
    rightArm.position.set(0.31, 0.98, 0.08);
    rightArm.rotation.z = -Math.PI / 14;

    avatarGroup.add(leftArm);
    avatarGroup.add(rightArm);

    avatarGroup.position.set(-0.65, 0, -1.95);
    avatarGroup.rotation.y = 0.28;
    parentStage.add(avatarGroup);
    permanentAvatarRef.current = avatarGroup;
  };

  const transmitInteraction = (data: { hits: number; errors: number; rt?: number; pumps?: number; action: string }) => {
    const basePayload = {
      type: 'CLINICAL_TEST_INTERACTION',
      paradigm: paradigmStateRef.current.paradigm,
      hits: data.hits,
      errors: data.errors,
      rt: data.rt || 240,
      pumps: data.pumps || 0,
      action: data.action,
      broadcast: true,
      timestamp: Date.now()
    };

    wsListRef.current.forEach((sock) => {
      if (sock && sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify({ ...basePayload, patientId: activePatientIdRef.current }));
        sock.send(JSON.stringify({ ...basePayload, patientId: 'PAC-8104' }));
      }
    });
  };

  const handleTrigger = useCallback(
    (event: any) => {
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
      const rt = s.lastSpawnTime > 0 ? Math.min(1400, now - s.lastSpawnTime) : Math.floor(215 + Math.random() * 85);

      if (hits.length > 0 || interactiveGroupRef.current.children.length > 0) {
        const hitObj = hits.length > 0 ? hits[0].object : interactiveGroupRef.current.children[0];
        triggerHaptic(0.9, 80);
        s.lastSpawnTime = Date.now();

        if (s.paradigm === 'BART_3D') {
          if (hitObj?.name === 'BART_BANK_BTN') {
            s.hits += s.balloonPumps * 10;
            playSynthesizedTone(780, 0.25, 'sine', 1.0);
            update3dInVrBanner('BART: RIESGO Y CONTROL', '¡PUNTOS COBRADOS!', `Aciertos: ${s.hits} pts`);
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
            if (Math.random() < s.balloonPumps / s.balloonMaxCap || s.balloonPumps >= s.balloonMaxCap) {
              playSynthesizedTone(75, 0.35, 'sawtooth', 1.0);
              triggerHaptic(1.0, 250);
              s.errors += 1;
              update3dInVrBanner('BART: RIESGO Y CONTROL', '💥 ¡EXPLOSIÓN!', `Fallos: ${s.errors}`);
              transmitInteraction({
                hits: s.hits,
                errors: s.errors,
                pumps: s.balloonPumps,
                rt,
                action: `💥 Explosión a ${s.balloonPumps} bombeos`
              });
              s.scale = 1.0;
              s.balloonPumps = 0;
              s.balloonMaxCap = Math.floor(10 + Math.random() * 12);
            } else {
              playSynthesizedTone(220 + s.balloonPumps * 32, 0.1, 'sine', 1.0);
              s.scale += 0.12;
              s.hits += 1;
              update3dInVrBanner('BART: RIESGO Y CONTROL', `Bombeo: ${s.balloonPumps}`, `Aciertos: ${s.hits}`);
              transmitInteraction({
                hits: s.hits,
                errors: s.errors,
                pumps: s.balloonPumps,
                rt,
                action: `Inflado: Bombeo ${s.balloonPumps}`
              });
            }
          }
        } else if (s.paradigm === 'CHOICE_3D') {
          s.hits += 1;
          playSynthesizedTone(440, 0.15, 'sine', 1.0);
          const name = hitObj?.name?.includes('LEFT') ? 'Opción Roja (A)' : 'Opción Azul (B)';
          update3dInVrBanner('DILEMA CLÍNICO', `Selección: ${name}`, `Aciertos: ${s.hits}`);
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
          update3dInVrBanner(`TAREA: ${s.paradigm}`, `¡IMPACTO REGISTRADO! (${rt}ms)`, `Aciertos: ${s.hits}`);
          transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Acierto en ${s.paradigm} (${rt}ms)` });
        }
      }
    },
    [ensureAudioUnlocked]
  );

  // CONEXIÓN WEBSOCKET MULTI-SALA
  useEffect(() => {
    let heartbeatTimer: ReturnType<typeof setInterval>;
    let isMounted = true;

    const createSocketForRoom = (roomId: string) => {
      const wsTarget =
        (import.meta as any).env?.VITE_WS_URL?.replace(/^http/, 'ws') || 'wss://amieneurogical.onrender.com/ws/vr';
      const url = wsTarget.endsWith('/ws/vr') ? wsTarget : `${wsTarget}/ws/vr`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (!isMounted) return;
        setWsOnline(true);
        ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: roomId }));
      };

      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.patientId) activePatientIdRef.current = d.patientId;

          if (d.type === 'SYNC_CLINICAL_CONTEXT' || d.type === 'START_PIPELINE_PHASE') {
            if (d.ecosystem) apply360Background(d.ecosystem);

            if (d.paradigm) {
              setActiveParadigm(d.paradigm);
              const s = paradigmStateRef.current;
              s.paradigm = d.paradigm;
              s.hits = 0;
              s.errors = 0;
              s.scale = 1.0;
              s.balloonPumps = 0;
              s.lastSpawnTime = Date.now();

              spawnParadigmHolograms(d.paradigm);
              const headerText = d.disorderName ? `${d.disorderName}` : `PROTOCOLO: ${d.paradigm}`;
              setDisorderTitle(headerText);

              update3dInVrBanner(
                headerText,
                d.speechScript || 'Apunta al holograma y presiona el gatillo',
                'Aciertos: 0 | Fallos: 0'
              );
              if (d.speechScript) playSpeechAudio(d.speechScript);
            }
          } else if (d.type === 'STOP_ACTIVE_SESSION') {
            update3dInVrBanner('SESIÓN FINALIZADA', 'Informe clínico generado en la estación médica', `Total Aciertos: ${paradigmStateRef.current.hits}`);
          }
        } catch (err) {}
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setTimeout(() => {
          if (isMounted) createSocketForRoom(roomId);
        }, 2500);
      };

      wsListRef.current.push(ws);
    };

    wsListRef.current = [];
    const rooms = Array.from(new Set(['PAC-8104', initialPatientId, '1', 'PAC-001', 'PAC-101']));
    rooms.forEach((r) => createSocketForRoom(r));

    heartbeatTimer = setInterval(() => {
      wsListRef.current.forEach((sock) => {
        if (sock.readyState === WebSocket.OPEN) {
          sock.send(JSON.stringify({ type: 'PING', patientId: 'PAC-8104' }));
        }
      });
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(heartbeatTimer);
      wsListRef.current.forEach((s) => s.close());
    };
  }, [initialPatientId]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    scene.add(new THREE.AmbientLight(0xffffff, 2.4));
    const dir = new THREE.DirectionalLight(0xffffff, 2.5);
    dir.position.set(2, 5, 3);
    scene.add(dir);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.45, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    renderer.xr.addEventListener('sessionstart', () => {
      ensureAudioUnlocked();
      playChimes();
      setTimeout(() => recenterStageToPatientView(), 400);
    });

    const bgGeo = new THREE.SphereGeometry(100, 60, 40);
    bgGeo.scale(-1, 1, 1);
    const bgMesh = new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    scene.add(bgMesh);
    bgMeshRef.current = bgMesh;

    const initTex = new THREE.CanvasTexture(createRealisticEnvironmentCanvas('OFFICE'));
    initTex.colorSpace = THREE.SRGBColorSpace;
    bgMesh.material.map = initTex;
    bgMesh.material.needsUpdate = true;

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);
    stageGroupRef.current = stageGroup;

    const hudGeo = new THREE.PlaneGeometry(1.75, 0.44);
    const hudMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.96 });
    const hudMesh = new THREE.Mesh(hudGeo, hudMat);
    hudMesh.position.set(0, 1.78, -2.1);
    stageGroup.add(hudMesh);
    hudMeshRef.current = hudMesh;
    update3dInVrBanner('AMIE CLINICAL COPILOT', 'Avatar Clínico y Cubos 3D Activos • Dispara con el gatillo', 'Aciertos: 0');

    // CREAR AVATAR MÉDICO 3D SIEMPRE VISIBLE
    createPermanentClinicalAvatar(stageGroup);

    // GRUPO DE HOLOGRAMAS INTERACTIVOS FRENTE A LOS OJOS
    const interactiveGroup = new THREE.Group();
    interactiveGroup.position.set(0.32, 1.28, -1.85);
    stageGroup.add(interactiveGroup);
    interactiveGroupRef.current = interactiveGroup;

    // Inicia mostrando los 3 cubos de Memoria Visuoespacial (N_BACK_3D)
    spawnParadigmHolograms('N_BACK_3D');

    const buildLaser = () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -5)]),
        new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 3 })
      );

    const c1 = renderer.xr.getController(0);
    c1.addEventListener('selectstart', handleTrigger);
    c1.add(buildLaser());
    scene.add(c1);

    const c2 = renderer.xr.getController(1);
    c2.addEventListener('selectstart', handleTrigger);
    c2.add(buildLaser());
    scene.add(c2);

    try {
      container.appendChild(VRButton.createButton(renderer));
    } catch (e) {}

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const s = paradigmStateRef.current;

      if (permanentAvatarRef.current) {
        permanentAvatarRef.current.position.y = Math.sin(t * 1.6) * 0.02;
        const leftArm = permanentAvatarRef.current.getObjectByName('AVATAR_LEFT_ARM');
        const rightArm = permanentAvatarRef.current.getObjectByName('AVATAR_RIGHT_ARM');
        if (leftArm && rightArm) {
          leftArm.rotation.x = Math.sin(t * 1.4) * 0.14;
          rightArm.rotation.x = -Math.sin(t * 1.4) * 0.14;
        }
      }

      if (interactiveGroup.children.length === 0) {
        spawnParadigmHolograms(s.paradigm);
      }

      if (s.paradigm === 'BART_3D') {
        const ball = interactiveGroup.getObjectByName('BART_BALL');
        if (ball) ball.scale.lerp(new THREE.Vector3(s.scale, s.scale * 1.15, s.scale), 0.1);
      } else if (s.paradigm === 'EMDR_3D') {
        interactiveGroup.position.x = Math.sin(t * 2.4) * 0.95;
      } else if (s.paradigm === 'BIO_3D') {
        const breath = 0.85 + Math.sin(t * Math.PI * 2 * 0.1) * 0.42;
        interactiveGroup.scale.set(breath, breath, breath);
        interactiveGroup.rotation.y += 0.012;
      } else if (s.paradigm === 'CPT_3D') {
        const cpt = interactiveGroup.getObjectByName('CPT_TARGET') as THREE.Mesh;
        if (cpt) {
          cpt.rotation.y += 0.02;
          cpt.rotation.x += 0.01;
          if (Date.now() - s.lastSpawnTime > 2000) {
            s.lastSpawnTime = Date.now();
            s.cptTargetType = Math.random() > 0.3 ? 'GO' : 'NOGO';
            (cpt.material as THREE.MeshStandardMaterial).color.setHex(s.cptTargetType === 'GO' ? 0x10b981 : 0xef4444);
            (cpt.material as THREE.MeshStandardMaterial).emissive.setHex(s.cptTargetType === 'GO' ? 0x059669 : 0xb91c1c);
          }
        }
      } else {
        interactiveGroup.position.x = 0.32;
        interactiveGroup.scale.set(1, 1, 1);
        interactiveGroup.rotation.y = Math.sin(t * 0.9) * 0.25;
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
    <div
      onClick={() => {
        if (!isAudioUnlocked) {
          ensureAudioUnlocked();
          playChimes();
        } else {
          handleTrigger({ target: new THREE.Object3D() });
        }
      }}
      className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden cursor-crosshair"
    >
      {!isAudioUnlocked && (
        <div
          onClick={() => {
            ensureAudioUnlocked();
            playChimes();
          }}
          className="absolute inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-8 cursor-pointer"
        >
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center shadow-2xl max-w-sm space-y-4">
            <VolumeX className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
            <h2 className="text-xl font-black text-white">Activar Entorno Clínico 3D</h2>
            <p className="text-xs text-slate-400">Toca la pantalla o presiona el gatillo del mando para activar la voz y el Avatar.</p>
            <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer">
              <Play className="w-5 h-5 fill-white" /> ENTRAR A LA SESIÓN
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-5 left-5 right-5 z-20 flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-white shadow-lg font-mono">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${wsOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span>PICO 3: <strong className="text-emerald-400">{wsOnline ? 'EN LÍNEA' : 'CONECTANDO'}</strong></span>
          <div className="h-4 w-px bg-slate-800" />
          <Target className="text-cyan-400 w-4 h-4" />
          <span className="text-cyan-300 font-bold">{disorderTitle}</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => recenterStageToPatientView()}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Centrar Vista
          </button>
          <select
            value={activeParadigm}
            onChange={(e) => {
              const p = e.target.value as InteractiveParadigm;
              setActiveParadigm(p);
              paradigmStateRef.current.paradigm = p;
              spawnParadigmHolograms(p);
              update3dInVrBanner(`TAREA ACTIVA: ${p}`, 'Apunta al holograma y presiona el gatillo', 'Aciertos: 0');
            }}
            className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="CPT_3D">1. Esfera CPT Go/No-Go</option>
            <option value="BART_3D">2. Globo de Riesgo BART</option>
            <option value="N_BACK_3D">3. Cubos Memoria N-Back</option>
            <option value="CHOICE_3D">4. Dilema 2 Opciones</option>
            <option value="AAT_3D">5. Anillo Aproximación AAT</option>
            <option value="EMDR_3D">6. Esfera Bilateral EMDR</option>
            <option value="MIRROR_3D">7. Espejo Somatomotor</option>
            <option value="BIO_3D">8. Loto Biofeedback Vagal</option>
          </select>
        </div>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VrPatientExperience;
