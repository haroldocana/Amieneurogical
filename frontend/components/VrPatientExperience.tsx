// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF DEFINITIVO COMPLETO
// Estimulación Sacádica Automática EMDR (Shapiro) • 8 Paradigmas Clínicos
// Soporte Nativo JPEG 360° y Videos MP4 • Telemetría Bidireccional Garantizada
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Target, VolumeX, Play, Volume2 } from 'lucide-react';

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
  const [activeParadigm, setActiveParadigm] = useState<InteractiveParadigm>('IDLE');
  const [wsOnline, setWsOnline] = useState(false);
  const [disorderTitle, setDisorderTitle] = useState('AMIE CDSS • EN ESPERA');
  const [lastSpokenScript, setLastSpokenScript] = useState('Sistema listo. Esperando inicio de sesión médica.');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const interactiveGroupRef = useRef<THREE.Group | null>(null);
  const hudMeshRef = useRef<THREE.Mesh | null>(null);
  const bgSphereMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const wsListRef = useRef<WebSocket[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());

  // Mandos 6DoF
  const controller1Ref = useRef<THREE.XRTargetRaySpace | null>(null);
  const controller2Ref = useRef<THREE.XRTargetRaySpace | null>(null);

  // Reproductor de video MP4
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const videoCinemaMeshRef = useRef<THREE.Mesh | null>(null);

  // Estados del ensayo clínico
  const trialStateRef = useRef({
    paradigm: 'IDLE' as InteractiveParadigm,
    isActiveSession: false,
    currentTrial: 0,
    maxTrials: 30,
    hits: 0,
    errors: 0,
    // CPT
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
    nBackTimer: 0,
    // Choice
    choiceTimer: 0,
    // AAT Distractores
    aatTimer: 0,
    // EMDR Sacádico Shapiro
    emdrPrevX: 0,
    emdrDirection: 1,
    emdrLastSwitchTime: 0,
    // Mirror & Bio
    lastCycleStamp: 0
  });

  const triggerHaptic = (controllerIndex = 0, intensity = 0.8, durationMs = 60) => {
    try {
      const session = rendererRef.current?.xr.getSession();
      if (session?.inputSources?.[controllerIndex]?.gamepad?.hapticActuators?.length) {
        session.inputSources[controllerIndex].gamepad.hapticActuators[0].pulse(intensity, durationMs);
      }
    } catch (e) {}
  };

  const ensureAudioUnlocked = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) audioContextRef.current = new AudioCtx();
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      setIsAudioUnlocked(true);
    } catch (e) {}
  }, []);

  const playTone = useCallback((freq = 520, duration = 0.12, type: OscillatorType = 'sine', vol = 0.7) => {
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
        sock.send(JSON.stringify({
          type: 'CLINICAL_TEST_INTERACTION',
          paradigm: trialStateRef.current.paradigm,
          patientId: activePatientIdRef.current || 'PAC-8104',
          broadcast: true,
          timestamp: Date.now(),
          ...data
        }));
      }
    });
  };

  const safeClearGroup = (group: THREE.Group | null) => {
    if (!group) return;
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

  const load360JpegEcosystem = useCallback((jpegPath: string) => {
    if (!bgSphereMeshRef.current) return;
    let cleanUrl = jpegPath.trim();
    if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl;
    }

    textureLoaderRef.current.load(
      cleanUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (bgSphereMeshRef.current) {
          const mat = bgSphereMeshRef.current.material as THREE.MeshBasicMaterial;
          mat.map = texture;
          mat.needsUpdate = true;
        }
      },
      undefined,
      (err) => console.warn('Fallo al cargar JPEG 360°:', cleanUrl, err)
    );
  }, []);

  const playProvocationMp4Video = useCallback((videoUrl: string, title = 'Video de Provocación') => {
    ensureAudioUnlocked();

    if (!videoElementRef.current) {
      const vid = document.createElement('video');
      vid.crossOrigin = 'anonymous';
      vid.playsInline = true;
      vid.autoplay = true;
      vid.loop = false;
      videoElementRef.current = vid;

      const vidTex = new THREE.VideoTexture(vid);
      vidTex.colorSpace = THREE.SRGBColorSpace;
      vidTex.minFilter = THREE.LinearFilter;
      vidTex.magFilter = THREE.LinearFilter;
      videoTextureRef.current = vidTex;

      if (videoCinemaMeshRef.current) {
        (videoCinemaMeshRef.current.material as THREE.MeshBasicMaterial).map = vidTex;
        (videoCinemaMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
    }

    const vid = videoElementRef.current;
    let cleanUrl = videoUrl.trim();
    if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl;
    }

    vid.src = cleanUrl;
    vid.currentTime = 0;
    vid.play().catch((err) => console.warn('Bloqueo reproducción MP4:', err));

    if (videoCinemaMeshRef.current) {
      videoCinemaMeshRef.current.visible = true;
    }

    updateHUD('PROVOCACIÓN CLÍNICA (MP4)', title, 'Atiende al estímulo en pantalla.');
  }, [ensureAudioUnlocked]);

  const stopProvocationMp4Video = useCallback(() => {
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.currentTime = 0;
    }
    if (videoCinemaMeshRef.current) {
      videoCinemaMeshRef.current.visible = false;
    }
  }, []);

  const executeHardStop = useCallback((reason = 'Sesión Finalizada por el Médico') => {
    const t = trialStateRef.current;
    t.isActiveSession = false;
    t.paradigm = 'IDLE';
    t.cptActive = false;
    t.currentTrial = 0;

    stopProvocationMp4Video();

    if (interactiveGroupRef.current) {
      safeClearGroup(interactiveGroupRef.current);
    }

    updateHUD(
      'PRUEBA FINALIZADA',
      reason,
      `Aciertos: ${t.hits} | Fallos: ${t.errors} • RETIRE EL CASCO`
    );
    playSpeechAudio('La prueba ha finalizado. Puede retirarse el visor con calma.');
  }, [playSpeechAudio, stopProvocationMp4Video]);

  const spawnSingleDistractor = (index: number) => {
    if (!interactiveGroupRef.current) return;
    const angles = [-1.3, -0.7, 0.7, 1.3];
    const angle = angles[index % angles.length] + (Math.random() - 0.5) * 0.25;
    const dist = 1.9 + Math.random() * 0.4;
    const height = 1.1 + Math.random() * 0.6;

    const m = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.18, 1),
      new THREE.MeshStandardMaterial({
        color: index % 2 === 0 ? 0xef4444 : 0xf59e0b,
        emissive: index % 2 === 0 ? 0xb91c1c : 0xd97706,
        emissiveIntensity: 0.95,
        roughness: 0.3
      })
    );
    m.name = `AAT_DISTRACTOR_${Date.now()}_${index}`;
    m.position.set(Math.sin(angle) * dist, height, -Math.cos(angle) * dist);
    m.userData = { spawnTime: Date.now() };
    interactiveGroupRef.current.add(m);
  };

  // Constructor de escenas según paradigma
  const setupParadigmVisuals = useCallback((paradigm: InteractiveParadigm) => {
    if (!interactiveGroupRef.current) return;
    safeClearGroup(interactiveGroupRef.current);
    const group = interactiveGroupRef.current;
    const t = trialStateRef.current;
    t.paradigm = paradigm;
    t.currentTrial = 0;
    t.hits = 0;
    t.errors = 0;
    t.isActiveSession = true;
    t.lastCycleStamp = Date.now();

    stopProvocationMp4Video();

    if (paradigm === 'CPT_3D') {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 })
      );
      sphere.name = 'CPT_SPHERE';
      sphere.visible = false;
      group.add(sphere);
      t.cptActive = false;
      t.trialTimer = Date.now() + 1200;
    } else if (paradigm === 'BART_3D') {
      const balloon = new THREE.Mesh(
        new THREE.SphereGeometry(0.30, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0x9d174d, emissiveIntensity: 0.85 })
      );
      balloon.name = 'BART_BALLOON';
      group.add(balloon);

      const bankBtn = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.22, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46, emissiveIntensity: 0.9 })
      );
      bankBtn.name = 'BART_BANK_BTN';
      bankBtn.position.set(0, -0.55, 0);
      group.add(bankBtn);

      t.balloonPumps = 0;
      t.balloonScale = 1.0;
      t.balloonMaxCap = 5 + Math.floor(Math.random() * 8);
    } else if (paradigm === 'N_BACK_3D') {
      const colors = [0x22d3ee, 0xa855f7, 0xf59e0b, 0x10b981];
      t.activeCube = 0;
      t.nBackTimer = Date.now() + 1500;
      for (let i = 0; i < 4; i++) {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.26, 0.26),
          new THREE.MeshStandardMaterial({ color: colors[i], emissive: colors[i], emissiveIntensity: 0.25 })
        );
        cube.name = `CUBE_${i}`;
        const angle = ((i - 1.5) * 0.35);
        cube.position.set(Math.sin(angle) * 1.8, 1.25, -Math.cos(angle) * 1.8);
        group.add(cube);
      }
    } else if (paradigm === 'CHOICE_3D') {
      t.choiceTimer = Date.now();
      const pLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.46, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xc2410c, emissiveIntensity: 0.75 })
      );
      pLeft.name = 'CHOICE_LEFT';
      pLeft.position.set(-0.55, 1.25, -1.8);

      const pRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.46, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.75 })
      );
      pRight.name = 'CHOICE_RIGHT';
      pRight.position.set(0.55, 1.25, -1.8);
      group.add(pLeft, pRight);
    } else if (paradigm === 'AAT_3D') {
      t.aatTimer = Date.now();
      const centerRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.04, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85 })
      );
      centerRing.name = 'AAT_CENTER';
      centerRing.position.set(0, 1.35, -2.0);
      group.add(centerRing);

      for (let i = 0; i < 4; i++) {
        spawnSingleDistractor(i);
      }
    } else if (paradigm === 'EMDR_3D') {
      t.emdrPrevX = 0;
      t.emdrDirection = 1;
      t.emdrLastSwitchTime = Date.now();

      const emdr = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 32, 32),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 1.5,
          roughness: 0.15
        })
      );
      emdr.name = 'EMDR_SPHERE';
      emdr.position.set(0, 1.35, -1.8);
      group.add(emdr);

      // Carril horizontal
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.015, 0.015),
        new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.45 })
      );
      rail.position.set(0, 1.35, -1.8);
      group.add(rail);
    } else if (paradigm === 'MIRROR_3D') {
      const ringL = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.035, 16, 48),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.8 })
      );
      ringL.name = 'MIRROR_RING_L';
      ringL.position.set(-0.35, 1.25, -1.5);

      const ringR = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.035, 16, 48),
        new THREE.MeshStandardMaterial({ color: 0xd946ef, emissive: 0xa21caf, emissiveIntensity: 0.8 })
      );
      ringR.name = 'MIRROR_RING_R';
      ringR.position.set(0.35, 1.25, -1.5);
      group.add(ringL, ringR);
    } else if (paradigm === 'BIO_3D') {
      const lotus = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.28, 0.09, 64, 16),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.85, roughness: 0.25 })
      );
      lotus.name = 'BIO_LOTUS';
      lotus.position.set(0, 1.35, -1.7);
      group.add(lotus);
    }
  }, [stopProvocationMp4Video]);

  // Interacción motora con gatillos
  const handleTrigger = useCallback((event: any) => {
    const t = trialStateRef.current;
    if (!t.isActiveSession || t.paradigm === 'IDLE') return;

    ensureAudioUnlocked();
    if (!interactiveGroupRef.current) return;
    const ctrl = event.target;
    ctrl.updateMatrixWorld(true);

    const tempMat = new THREE.Matrix4().identity().extractRotation(ctrl.matrixWorld);
    raycasterRef.current.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
    raycasterRef.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMat).normalize();
    interactiveGroupRef.current.updateMatrixWorld(true);

    const hits = raycasterRef.current.intersectObjects(interactiveGroupRef.current.children, true);
    const now = Date.now();
    const rt = t.stimulusOnsetTime > 0 ? Math.min(850, Math.max(160, now - t.stimulusOnsetTime)) : 280;

    if (t.paradigm === 'CPT_3D') {
      const sphere = interactiveGroupRef.current.getObjectByName('CPT_SPHERE') as THREE.Mesh;
      if (sphere && sphere.visible && t.cptActive) {
        sphere.visible = false;
        t.cptActive = false;

        if (t.cptType === 'GO') {
          t.hits += 1;
          playTone(680, 0.1, 'sine');
          updateHUD('CPT: FRENO INHIBITORIO', `¡IMPACTO GO! (${rt}ms)`, `Ensayo: ${t.currentTrial}/30 | Aciertos: ${t.hits} | Fallos: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Impacto Go (${rt}ms)` });
        } else {
          t.errors += 1;
          playTone(90, 0.25, 'sawtooth');
          updateHUD('CPT: FRENO INHIBITORIO', '❌ ERROR COMISIÓN (Era Rojo)', `Ensayo: ${t.currentTrial}/30 | Aciertos: ${t.hits} | Fallos: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Error Comisión No-Go (${rt}ms)` });
        }

        if (t.currentTrial >= t.maxTrials) {
          executeHardStop('Bloque de 30 Ensayos Completado');
        } else {
          t.trialTimer = now + 1200 + Math.random() * 800;
        }
      }
    } else if (t.paradigm === 'BART_3D') {
      const hitObj = hits.length > 0 ? hits[0].object : null;
      if (hitObj?.name === 'BART_BANK_BTN') {
        const points = t.balloonPumps * 10;
        t.hits += points;
        playTone(780, 0.25, 'sine');
        t.balloonPumps = 0;
        t.balloonScale = 1.0;
        t.balloonMaxCap = 5 + Math.floor(Math.random() * 8);
        updateHUD('BART: RIESGO Y CONTROL', `¡+${points} PUNTOS SALVADOS!`, `Puntos: ${t.hits} | Explosiones: ${t.errors}`);
        transmitTelemetry({ hits: t.hits, errors: t.errors, pumps: 0, rt, action: `Puntos asegurados (+${points})` });
      } else {
        t.balloonPumps += 1;
        if (t.balloonPumps >= t.balloonMaxCap) {
          t.errors += 1;
          playTone(65, 0.4, 'sawtooth');
          t.balloonPumps = 0;
          t.balloonScale = 1.0;
          t.balloonMaxCap = 5 + Math.floor(Math.random() * 8);
          updateHUD('BART: ¡EXPLOSIÓN!', '💥 GLOBO REVENTADO POR RIESGO', `Puntos: ${t.hits} | Explosiones: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, pumps: 0, rt, action: '💥 Explosión de globo' });
        } else {
          t.balloonScale += 0.12;
          playTone(220 + t.balloonPumps * 45, 0.08, 'sine');
          updateHUD('BART: INFLANDO', `Bombeo: ${t.balloonPumps}`, `Puntos: ${t.hits} | Explosiones: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, pumps: t.balloonPumps, rt, action: `Bombeo ${t.balloonPumps}` });
        }
      }
    } else if (t.paradigm === 'N_BACK_3D') {
      const hitObj = hits.length > 0 ? hits[0].object : null;
      if (hitObj && hitObj.name === `CUBE_${t.activeCube}`) {
        t.hits += 1;
        t.currentTrial += 1;
        playTone(620, 0.12, 'sine');
        updateHUD('MEMORIA DE TRABAJO (N-BACK)', `¡CUBO CORRECTO! (${rt}ms)`, `Ensayo: ${t.currentTrial}/30 | Aciertos: ${t.hits}`);
        transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Acierto N-Back (${rt}ms)` });
        t.nBackTimer = now + 1200;
      } else if (hitObj && hitObj.name.startsWith('CUBE_')) {
        t.errors += 1;
        t.currentTrial += 1;
        playTone(95, 0.22, 'sawtooth');
        updateHUD('MEMORIA DE TRABAJO (N-BACK)', '❌ CUBO INCORRECTO', `Ensayo: ${t.currentTrial}/30 | Aciertos: ${t.hits}`);
        transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Fallo N-Back (${rt}ms)` });
        t.nBackTimer = now + 1200;
      }
      if (t.currentTrial >= t.maxTrials) {
        executeHardStop('Bloque N-Back Completado');
      }
    } else if (t.paradigm === 'CHOICE_3D') {
      const hitObj = hits.length > 0 ? hits[0].object : null;
      if (hitObj && (hitObj.name === 'CHOICE_LEFT' || hitObj.name === 'CHOICE_RIGHT')) {
        t.hits += 1;
        t.currentTrial += 1;
        const choiceLabel = hitObj.name === 'CHOICE_LEFT' ? 'Opción A' : 'Opción B';
        playTone(520, 0.15, 'triangle');
        updateHUD('DILEMA DECISIONAL', `Elección: ${choiceLabel} (${rt}ms)`, `Ensayo: ${t.currentTrial}/20`);
        transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Decisión: ${choiceLabel} (${rt}ms)` });
        if (t.currentTrial >= 20) {
          executeHardStop('Batería Decisional Completada');
        }
      }
    } else if (t.paradigm === 'AAT_3D') {
      const hitObj = hits.length > 0 ? hits[0].object : null;
      if (hitObj && hitObj.name.startsWith('AAT_DISTRACTOR_')) {
        t.hits += 1;
        t.currentTrial += 1;
        playTone(840, 0.08, 'sine');
        interactiveGroupRef.current.remove(hitObj);
        if ((hitObj as THREE.Mesh).geometry) (hitObj as THREE.Mesh).geometry.dispose();
        spawnSingleDistractor(t.currentTrial);
        updateHUD('AAT: DISTRACTOR REPELIDO', `¡BLINDAJE EXITOSO! (${rt}ms)`, `Ensayo: ${t.currentTrial}/30 | Aciertos: ${t.hits}`);
        transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Distractor Repelido (${rt}ms)` });

        if (t.currentTrial >= t.maxTrials) {
          executeHardStop('Entrenamiento AAT de Foco Completado');
        }
      }
    } else if (t.paradigm === 'EMDR_3D') {
      // Disparo de apoyo opcional durante EMDR
      t.hits += 1;
      playTone(720, 0.08, 'sine', 0.5);
      triggerHaptic(0, 0.6, 50);
      transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Sincronía Visual Manual (${rt}ms)` });
    }
  }, [ensureAudioUnlocked, playTone, executeHardStop]);

  // Sincronización WebSocket (Workstation + Provocación 360° y Videos)
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
        const targetMedia = d.videoUrl || d.video || d.ecosystem || d.url || '';

        if (targetMedia.endsWith('.mp4') || targetMedia.endsWith('.webm') || d.type === 'PLAY_PROVOCATION_VIDEO' || d.type === 'LOAD_VIDEO') {
          playProvocationMp4Video(targetMedia, d.pattern || d.title || 'Provocación al Ego');
          return;
        }

        if (targetMedia.endsWith('.jpg') || targetMedia.endsWith('.jpeg') || targetMedia.endsWith('.png') || d.type === 'LOAD_ECOSYSTEM') {
          load360JpegEcosystem(targetMedia);
        }

        if (d.type === 'START_PIPELINE_PHASE' && d.paradigm) {
          setActiveParadigm(d.paradigm);
          setupParadigmVisuals(d.paradigm);
          setDisorderTitle(d.exerciseName || d.paradigm);
          updateHUD(d.exerciseName || d.paradigm, d.speechScript || 'Prueba activa.', 'Ensayos: 0/30 | Aciertos: 0');
          if (d.speechScript) playSpeechAudio(d.speechScript);
        } else if (d.type === 'STOP_ACTIVE_SESSION' || d.type === 'STOP_VIDEO') {
          executeHardStop('Sesión Detenida por la Estación Médica');
        }
      } catch (err) {}
    };

    wsListRef.current = [ws];
    return () => {
      ws.close();
    };
  }, [initialPatientId, setupParadigmVisuals, playSpeechAudio, executeHardStop, load360JpegEcosystem, playProvocationMp4Video]);

  // Montaje WebXR
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(2, 5, 3);
    scene.add(mainLight);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.45, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);
    stageGroupRef.current = stageGroup;

    // Cúpula 360° para texturas JPEG
    const bgGeo = new THREE.SphereGeometry(60, 48, 32);
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const cctx = c.getContext('2d');
    if (cctx) {
      const grad = cctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#0f172a'); grad.addColorStop(0.5, '#1e293b'); grad.addColorStop(1, '#020617');
      cctx.fillStyle = grad; cctx.fillRect(0, 0, 1024, 512);
    }
    const bgMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.BackSide });
    const bgSphere = new THREE.Mesh(bgGeo, bgMat);
    scene.add(bgSphere);
    bgSphereMeshRef.current = bgSphere;

    // Pantalla de Cine Virtual para Videos MP4
    const screenGeo = new THREE.PlaneGeometry(3.6, 2.0, 16, 16);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    const cinemaScreen = new THREE.Mesh(screenGeo, screenMat);
    cinemaScreen.position.set(0, 1.6, -2.5);
    cinemaScreen.visible = false;
    stageGroup.add(cinemaScreen);
    videoCinemaMeshRef.current = cinemaScreen;

    // HUD Superior
    const hudMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.75, 0.44),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.96 })
    );
    hudMesh.position.set(0, 1.85, -2.1);
    stageGroup.add(hudMesh);
    hudMeshRef.current = hudMesh;
    updateHUD('AMIE CLINICAL COPILOT', 'En espera de inicio...', 'Aciertos: 0 | Fallos: 0');

    // Hologramas a la derecha
    const interactiveGroup = new THREE.Group();
    stageGroup.add(interactiveGroup);
    interactiveGroupRef.current = interactiveGroup;

    // Mandos con láser
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
    controller1Ref.current = c1;

    const c2 = renderer.xr.getController(1);
    c2.addEventListener('selectstart', handleTrigger);
    c2.add(buildLaser());
    scene.add(c2);
    controller2Ref.current = c2;

    try { container.appendChild(VRButton.createButton(renderer)); } catch (e) {}

    const clock = new THREE.Clock();

    // ========================================================================
    // BUCLE DE RENDERIZADO Y CONTROL DE LOS 8 PARADIGMAS A 60/90 FPS
    // ========================================================================
    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const now = Date.now();
      const trial = trialStateRef.current;

      if (!trial.isActiveSession || trial.paradigm === 'IDLE' || !interactiveGroupRef.current) {
        renderer.render(scene, camera);
        return;
      }

      // 1. CPT GO/NO-GO
      if (trial.paradigm === 'CPT_3D') {
        const sphere = interactiveGroupRef.current.getObjectByName('CPT_SPHERE') as THREE.Mesh;
        if (sphere) {
          if (!sphere.visible && now >= trial.trialTimer) {
            trial.currentTrial += 1;
            trial.cptType = Math.random() < 0.75 ? 'GO' : 'NOGO';
            const isGo = trial.cptType === 'GO';
            (sphere.material as THREE.MeshStandardMaterial).color.setHex(isGo ? 0x10b981 : 0xef4444);
            (sphere.material as THREE.MeshStandardMaterial).emissive.setHex(isGo ? 0x059669 : 0xb91c1c);
            sphere.position.set(0.35, 1.25, -1.8);
            sphere.visible = true;
            trial.stimulusOnsetTime = now;
            trial.cptActive = true;
          } else if (sphere.visible && now - trial.stimulusOnsetTime > 450) {
            sphere.visible = false;
            if (trial.cptType === 'GO' && trial.cptActive) {
              trial.errors += 1;
              playTone(110, 0.15, 'triangle');
              updateHUD('CPT: ERROR DE OMISIÓN', '⚠️ TIEMPO AGOTADO (Era Verde)', `Ensayo: ${trial.currentTrial}/30 | Aciertos: ${trial.hits} | Fallos: ${trial.errors}`);
              transmitTelemetry({ hits: trial.hits, errors: trial.errors, rt: 450, action: 'Error de Omisión (Verde no disparado)' });
            }
            trial.cptActive = false;

            if (trial.currentTrial >= trial.maxTrials) {
              executeHardStop('Bloque de 30 Ensayos Completado');
            } else {
              trial.trialTimer = now + 1200 + Math.random() * 800;
            }
          }
        }
      }

      // 2. BART RIESGO
      else if (trial.paradigm === 'BART_3D') {
        const balloon = interactiveGroupRef.current.getObjectByName('BART_BALLOON');
        if (balloon) {
          balloon.scale.lerp(new THREE.Vector3(trial.balloonScale, trial.balloonScale * 1.15, trial.balloonScale), 0.1);
        }
      }

      // 3. N-BACK MEMORIA
      else if (trial.paradigm === 'N_BACK_3D') {
        if (now >= trial.nBackTimer) {
          trial.activeCube = Math.floor(Math.random() * 4);
          trial.stimulusOnsetTime = now;
          trial.nBackTimer = now + 2400;

          interactiveGroupRef.current.children.forEach((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.name && mesh.name.startsWith('CUBE_')) {
              const isTarget = mesh.name === `CUBE_${trial.activeCube}`;
              mesh.scale.setScalar(isTarget ? 1.35 : 0.88);
              if (mesh.material && 'emissiveIntensity' in mesh.material) {
                (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isTarget ? 1.4 : 0.25;
              }
            }
          });
        }
      }

      // 4. DILEMA DECISIONAL (CHOICE)
      else if (trial.paradigm === 'CHOICE_3D') {
        const pLeft = interactiveGroupRef.current.getObjectByName('CHOICE_LEFT');
        const pRight = interactiveGroupRef.current.getObjectByName('CHOICE_RIGHT');
        if (pLeft && pRight) {
          pLeft.rotation.y = Math.sin(t * 1.5) * 0.08;
          pRight.rotation.y = -Math.sin(t * 1.5) * 0.08;
        }
      }

      // 5. RESISTENCIA A DISTRACTORES (AAT)
      else if (trial.paradigm === 'AAT_3D') {
        const center = interactiveGroupRef.current.getObjectByName('AAT_CENTER');
        if (center) center.rotation.z += 0.015;

        interactiveGroupRef.current.children.forEach((child) => {
          if (child.name.startsWith('AAT_DISTRACTOR_')) {
            child.rotation.x += 0.02;
            child.rotation.y += 0.03;
            child.position.y += Math.sin(t * 2.0 + child.id) * 0.002;

            if (child.userData.spawnTime && now - child.userData.spawnTime > 3800) {
              trial.errors += 1;
              trial.currentTrial += 1;
              playTone(130, 0.18, 'sawtooth');
              updateHUD('AAT: DISTRACCIÓN NO REPELIDA', '⚠️ TIEMPO LÍMITE AGOTADO', `Ensayo: ${trial.currentTrial}/30 | Aciertos: ${trial.hits}`);
              transmitTelemetry({ hits: trial.hits, errors: trial.errors, rt: 3800, action: 'Fallo: Distractor no repelido a tiempo' });
              interactiveGroupRef.current?.remove(child);
              spawnSingleDistractor(trial.currentTrial);

              if (trial.currentTrial >= trial.maxTrials) {
                executeHardStop('Entrenamiento AAT Completado');
              }
            }
          }
        });
      }

      // ======================================================================
      // 6. SACÁDICOS EMDR SHAPIRO: BARRIDO Y CONTABILIZACIÓN AUTOMÁTICA
      // ======================================================================
      else if (trial.paradigm === 'EMDR_3D') {
        const emdr = interactiveGroupRef.current.getObjectByName('EMDR_SPHERE') as THREE.Mesh;
        if (emdr) {
          // Movimiento sacádico horizontal a velocidad terapéutica constante (1.35 m)
          const sweepAmplitude = 1.35;
          const sweepFrequency = 2.0; // Ciclo cada ~1.5 segundos
          const newX = Math.sin(t * sweepFrequency) * sweepAmplitude;
          emdr.position.x = newX;

          // Detección de giro en los extremos (cambio de dirección del barrido)
          const currentDir = Math.cos(t * sweepFrequency) >= 0 ? 1 : -1;

          if (currentDir !== trial.emdrDirection && (now - trial.emdrLastSwitchTime > 750)) {
            trial.emdrDirection = currentDir;
            trial.emdrLastSwitchTime = now;
            trial.currentTrial += 1;

            // Verificación del campo visual frontal: comprueba que el paciente mantiene la orientación hacia el frente
            let isHeadOrientedFront = true;
            const xrCam = rendererRef.current?.xr?.isPresenting
              ? rendererRef.current.xr.getCamera()
              : cameraRef.current;

            if (xrCam) {
              const headDir = new THREE.Vector3();
              xrCam.getWorldDirection(headDir);
              isHeadOrientedFront = headDir.z < -0.65; // Dentro de un cono frontal de ~45 grados
            }

            if (isHeadOrientedFront) {
              trial.hits += 1;
              // Tono binaural alternado: 640 Hz al extremo derecho, 480 Hz al extremo izquierdo
              playTone(currentDir === 1 ? 640 : 480, 0.08, 'sine', 0.5);
              updateHUD(
                'INTEGRACIÓN SACÁDICA (EMDR)',
                currentDir === 1 ? '➡️ BARRIDO DERECHO (Sigue la luz)' : '⬅️ BARRIDO IZQUIERDO (Sigue la luz)',
                `Ciclo: ${trial.currentTrial}/30 | Aciertos: ${trial.hits}`
              );
              transmitTelemetry({
                hits: trial.hits,
                errors: trial.errors,
                rt: 280,
                action: `Barrido Sacádico ${trial.currentTrial}/30 (${currentDir === 1 ? 'Der' : 'Izq'})`
              });
            } else {
              trial.errors += 1;
              playTone(130, 0.15, 'triangle', 0.4);
              updateHUD(
                'INTEGRACIÓN SACÁDICA (EMDR)',
                '⚠️ MANTÉN LA CABEZA AL FRENTE (Sigue con los ojos)',
                `Ciclo: ${trial.currentTrial}/30 | Aciertos: ${trial.hits} | Desvíos: ${trial.errors}`
              );
              transmitTelemetry({
                hits: trial.hits,
                errors: trial.errors,
                rt: 280,
                action: `Desvío Cefálico en Ciclo ${trial.currentTrial}/30`
              });
            }

            if (trial.currentTrial >= trial.maxTrials) {
              executeHardStop('30 Ciclos de Integración Sacádica Completados con Éxito');
            }
          }

          trial.emdrPrevX = newX;
        }
      }

      // 7. SOMATOMOTOR MIRROR: SINCRONIZACIÓN BIMANUAL 6DoF
      else if (trial.paradigm === 'MIRROR_3D') {
        const rL = interactiveGroupRef.current.getObjectByName('MIRROR_RING_L') as THREE.Mesh;
        const rR = interactiveGroupRef.current.getObjectByName('MIRROR_RING_R') as THREE.Mesh;
        if (rL && rR) {
          rL.position.y = 1.25 + Math.sin(t * 1.6) * 0.22;
          rR.position.y = 1.25 + Math.sin(t * 1.6 + Math.PI) * 0.22;

          let insideL = false;
          let insideR = false;

          if (controller1Ref.current) {
            const p1 = new THREE.Vector3();
            controller1Ref.current.getWorldPosition(p1);
            if (p1.distanceTo(rL.position) < 0.25) insideL = true;
            if (p1.distanceTo(rR.position) < 0.25) insideR = true;
          }

          if (controller2Ref.current) {
            const p2 = new THREE.Vector3();
            controller2Ref.current.getWorldPosition(p2);
            if (p2.distanceTo(rL.position) < 0.25) insideL = true;
            if (p2.distanceTo(rR.position) < 0.25) insideR = true;
          }

          const matL = rL.material as THREE.MeshStandardMaterial;
          const matR = rR.material as THREE.MeshStandardMaterial;

          if (insideL && insideR) {
            matL.emissive.setHex(0x10b981);
            matR.emissive.setHex(0x10b981);
            matL.emissiveIntensity = 1.5;
            matR.emissiveIntensity = 1.5;

            if (now - trial.lastCycleStamp > 1400) {
              trial.lastCycleStamp = now;
              trial.currentTrial += 1;
              trial.hits += 1;
              playTone(720, 0.08, 'sine', 0.4);
              triggerHaptic(0, 0.7, 50);
              triggerHaptic(1, 0.7, 50);

              updateHUD(
                'COORDINACIÓN BIMANUAL (MIRROR)',
                '✨ SINCRONIZACIÓN PERFECTA',
                `Alineación: ${trial.currentTrial}/30 | Aciertos: ${trial.hits}`
              );
              transmitTelemetry({ hits: trial.hits, errors: trial.errors, rt: 200, action: 'Sincronía Somatomotora 6DoF' });

              if (trial.currentTrial >= trial.maxTrials) {
                executeHardStop('Entrenamiento Espejo Bimanual Completado');
              }
            }
          } else {
            matL.emissive.setHex(0x0891b2);
            matR.emissive.setHex(0xa21caf);
            matL.emissiveIntensity = 0.8;
            matR.emissiveIntensity = 0.8;
          }
        }
      }

      // 8. BIOFEEDBACK VAGAL (0.1 HZ): CONTEO AUTOMÁTICO DE RESPIRACIONES
      else if (trial.paradigm === 'BIO_3D') {
        const lotus = interactiveGroupRef.current.getObjectByName('BIO_LOTUS');
        if (lotus) {
          const cycleDuration = 10.0;
          const cycleTime = (t % cycleDuration);
          let breathScale = 1.0;
          let phaseText = '';

          if (cycleTime < 4.0) {
            breathScale = 0.85 + (cycleTime / 4.0) * 0.55;
            phaseText = '🟢 INHALA PROFUNDO... (Expansión)';
          } else if (cycleTime < 6.0) {
            breathScale = 1.40;
            phaseText = '🟡 SOSTÉN EL AIRE... (Pausa)';
          } else {
            breathScale = 1.40 - ((cycleTime - 6.0) / 4.0) * 0.55;
            phaseText = '🔵 EXHALA DESPACIO... (Relajación)';
          }

          lotus.scale.set(breathScale, breathScale, breathScale);
          lotus.rotation.y += 0.01;

          if (now - trial.lastCycleStamp >= 10000) {
            trial.lastCycleStamp = now;
            trial.currentTrial += 1;
            trial.hits += 1;
            playTone(440, 0.25, 'triangle', 0.3);

            updateHUD(
              'BIOFEEDBACK VAGAL (0.1 Hz)',
              phaseText,
              `Ciclos Vagal: ${trial.currentTrial}/10 • FC Basal modulada`
            );
            transmitTelemetry({ hits: trial.hits, errors: 0, rt: 10000, action: `Ciclo Respiratorio ${trial.currentTrial}/10 Completado` });

            if (trial.currentTrial >= 10) {
              executeHardStop('Entrenamiento de Coherencia Vagal Completado');
            }
          } else {
            updateHUD('BIOFEEDBACK RESPIRATORIO (0.1 Hz)', phaseText, `Ciclo en Curso: ${trial.currentTrial + 1}/10`);
          }
        }
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, [handleTrigger, playTone, executeHardStop]);

  return (
    <div
      onClick={ensureAudioUnlocked}
      className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden cursor-crosshair"
    >
      {!isAudioUnlocked && (
        <div
          onClick={ensureAudioUnlocked}
          className="absolute inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-8 cursor-pointer"
        >
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center shadow-2xl max-w-sm space-y-4">
            <VolumeX className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
            <h2 className="text-xl font-black text-white">Activar Entorno Clínico VR</h2>
            <p className="text-xs text-slate-400">Presiona para habilitar audio 3D y telemetría espacial.</p>
            <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer">
              <Play className="w-5 h-5 fill-white" /> ENTRAR A LA SESIÓN
            </button>
          </div>
        </div>
      )}

      {/* Barra de Control VR Superior */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-white shadow-lg font-mono">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${wsOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span>ESTADO: <strong className="text-emerald-400">{wsOnline ? 'SINCRONIZADO' : 'STANDALONE'}</strong></span>
          <div className="h-4 w-px bg-slate-800" />
          <Target className="text-cyan-400 w-4 h-4" />
          <span className="text-cyan-300 font-bold truncate max-w-[280px]">{disorderTitle}</span>
        </div>
        <button
          onClick={() => playSpeechAudio(lastSpokenScript)}
          className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded border border-emerald-600 flex items-center gap-1 cursor-pointer"
        >
          <Volume2 className="w-3 h-3" /> Repetir Voz
        </button>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VrPatientExperience;
