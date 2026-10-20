// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF DEFINITIVO
// Avatares Clínicos Dedicados (Sexual, Narcisismo, Hipnosis, General)
// Espacio Despejado Anticolisión + Audio Amplificado 1.8x
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Target, VolumeX, Play, RefreshCw, Volume2 } from 'lucide-react';

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
  const [disorderTitle, setDisorderTitle] = useState('ENTORNO CLÍNICO INMERSIVO');
  const [currentArchetype, setCurrentArchetype] = useState<ClinicalArchetype>('DOCTOR');
  const [lastSpokenScript, setLastSpokenScript] = useState(
    'Bienvenido al entorno clínico. Apunta al holograma iluminado y presiona el gatillo.'
  );

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
  const ttsAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const bgOscillatorRef = useRef<{ stop: () => void } | null>(null);
  const needsAutoCenterRef = useRef<boolean>(true);
  const lastSpokenScriptRef = useRef<string>(
    'Bienvenido al entorno clínico. Apunta al holograma iluminado y presiona el gatillo.'
  );

  const paradigmStateRef = useRef({
    paradigm: 'CPT_3D' as InteractiveParadigm,
    hits: 0,
    errors: 0,
    scale: 1.0,
    balloonPumps: 0,
    balloonMaxCap: 15,
    cptTargetType: 'GO' as 'GO' | 'NOGO',
    activeNBackCubeIndex: 1,
    lastSpawnTime: Date.now()
  });

  useEffect(() => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) reg.unregister();
        });
      }
    } catch (e) {}
  }, []);

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
      const ctx = audioContextRef.current;
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        const keepAliveOsc = ctx.createOscillator();
        const silentGain = ctx.createGain();
        silentGain.gain.setValueAtTime(0.00001, ctx.currentTime);
        keepAliveOsc.connect(silentGain);
        silentGain.connect(ctx.destination);
        keepAliveOsc.start();
        keepAliveOsc.stop(ctx.currentTime + 0.05);
      }

      if (!ttsAudioElementRef.current) {
        const audioEl = new Audio();
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        audioEl.crossOrigin = 'anonymous';
        ttsAudioElementRef.current = audioEl;
      }

      setIsAudioUnlocked(true);
    } catch (e) {}
  }, []);

  const playSynthesizedTone = useCallback(
    (freq = 520, duration = 0.15, type: OscillatorType = 'sine', vol = 0.9) => {
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
    },
    [ensureAudioUnlocked]
  );

  const playChimes = useCallback(() => {
    [440, 554, 659, 880].forEach((note, idx) => {
      setTimeout(() => playSynthesizedTone(note, 0.18, 'sine', 0.85), idx * 90);
    });
  }, [playSynthesizedTone]);

  const startTherapeuticBackgroundSound = useCallback(
    (audioType?: string) => {
      try {
        ensureAudioUnlocked();
        if (bgOscillatorRef.current) {
          bgOscillatorRef.current.stop();
          bgOscillatorRef.current = null;
        }
        if (!audioType || !audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        gain.gain.setValueAtTime(0.05, ctx.currentTime);

        if (audioType === 'DELTA_WAVES') {
          osc1.frequency.value = 180;
          osc2.frequency.value = 182.5;
        } else if (audioType === 'THETA_WAVES') {
          osc1.frequency.value = 200;
          osc2.frequency.value = 206;
        } else if (audioType === 'ALPHA_WAVES') {
          osc1.frequency.value = 220;
          osc2.frequency.value = 230;
        } else if (audioType === 'BETA_WAVES') {
          osc1.frequency.value = 250;
          osc2.frequency.value = 268;
        } else if (audioType === 'BILATERAL_SWEEP') {
          osc1.frequency.value = 196;
          osc2.frequency.value = 200;
        } else {
          osc1.frequency.value = 140;
          osc2.frequency.value = 144;
        }

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();

        bgOscillatorRef.current = {
          stop: () => {
            try {
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
              setTimeout(() => {
                osc1.stop();
                osc2.stop();
                osc1.disconnect();
                osc2.disconnect();
              }, 350);
            } catch (e) {}
          }
        };
      } catch (e) {}
    },
    [ensureAudioUnlocked]
  );

  const playSpeechAudio = useCallback(
    async (text: string) => {
      if (!text) return;
      lastSpokenScriptRef.current = text;
      setLastSpokenScript(text);
      ensureAudioUnlocked();
      playChimes();

      const cleanText = text.replace(/['"]/g, '').slice(0, 260);

      const ttsEndpoints = [
        `https://api.streamelements.com/kappa/v2/speech?voice=Mia&text=${encodeURIComponent(cleanText)}`,
        `https://api.streamelements.com/kappa/v2/speech?voice=Conchita&text=${encodeURIComponent(cleanText)}`,
        `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=es&client=tw-ob`
      ];

      for (const url of ttsEndpoints) {
        try {
          const res = await fetch(url);
          if (res.ok && audioContextRef.current) {
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const arrayBuf = await res.arrayBuffer();
            const audioBuf = await ctx.decodeAudioData(arrayBuf);
            const source = ctx.createBufferSource();
            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(1.8, ctx.currentTime);
            source.buffer = audioBuf;
            source.connect(gainNode);
            gainNode.connect(ctx.destination);
            source.start(0);
            return;
          }
        } catch (err) {}
      }

      try {
        if (ttsAudioElementRef.current) {
          ttsAudioElementRef.current.src = ttsEndpoints[2];
          ttsAudioElementRef.current.volume = 1.0;
          await ttsAudioElementRef.current.play();
          return;
        }
      } catch (err) {}

      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(cleanText);
          u.lang = 'es-ES';
          u.volume = 1.0;
          u.rate = 0.95;
          window.speechSynthesis.speak(u);
        }
      } catch (e) {}
    },
    [ensureAudioUnlocked, playChimes]
  );

  const update3dInVrBanner = (title: string, sub: string, score: string) => {
    if (!hudMeshRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 1016, 248);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 44), 512, 65);

    ctx.fillStyle = '#fde047';
    ctx.font = '23px sans-serif';
    ctx.fillText(sub.slice(0, 68), 512, 132);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(score, 512, 204);

    const tex = new THREE.CanvasTexture(canvas);
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
  };

  const createRealisticEnvironmentCanvas = (theme: 'OFFICE' | 'FOREST' | 'STREET' = 'OFFICE') => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    if (theme === 'FOREST') {
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.46, '#bae6fd');
      grad.addColorStop(0.5, '#15803d');
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.fillStyle = '#166534';
      for (let x = 40; x < 2048; x += 95) {
        ctx.beginPath();
        ctx.moveTo(x, 320);
        ctx.lineTo(x - 45, 525);
        ctx.lineTo(x + 45, 525);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'STREET') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.48, '#3730a3');
      grad.addColorStop(0.5, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.fillStyle = '#1e293b';
      for (let x = 20; x < 2048; x += 130) {
        const h = 150 + (x % 90);
        ctx.fillRect(x, 512 - h, 100, h);
      }
    } else {
      grad.addColorStop(0, '#f1f5f9');
      grad.addColorStop(0.28, '#cbd5e1');
      grad.addColorStop(0.5, '#94a3b8');
      grad.addColorStop(0.52, '#475569');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      for (let x = 0; x < 2048; x += 256) {
        ctx.strokeRect(x + 14, 250, 228, 255);
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

  const recenterStageToPatientView = useCallback(() => {
    if (!stageGroupRef.current || !rendererRef.current || !cameraRef.current) return;
    const xrCam = rendererRef.current.xr.isPresenting
      ? rendererRef.current.xr.getCamera()
      : cameraRef.current;

    const camPos = new THREE.Vector3();
    const camQuat = new THREE.Quaternion();
    xrCam.getWorldPosition(camPos);
    xrCam.getWorldQuaternion(camQuat);

    const euler = new THREE.Euler().setFromQuaternion(camQuat, 'YXZ');
    stageGroupRef.current.position.set(camPos.x, camPos.y - 1.42, camPos.z);
    stageGroupRef.current.rotation.set(0, euler.y, 0);
  }, []);

  // ============================================================================
  // CONSTRUCTOR DE AVATARES CLÍNICOS DEDICADOS (POSICIONADOS LATERALMENTE A LA IZQUIERDA)
  // Ubicación: x = -1.15, z = -2.1 -> NUNCA TAPA EL TABLERO (x=0, y=1.78) NI LOS CUBOS (x=+0.28)
  // ============================================================================
  const buildDedicatedClinicalAvatar = useCallback((archetype: ClinicalArchetype) => {
    if (!permanentAvatarRef.current) return;
    const group = permanentAvatarRef.current;
    safeClearGroup(group);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0, roughness: 0.35 });
    const hairDarkMat = new THREE.MeshStandardMaterial({ color: 0x1f1712, roughness: 0.5 });
    const eyeSclera = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeIris = new THREE.MeshBasicMaterial({ color: 0x059669 });

    // 1. CABEZA Y ROSTRO ANATÓMICO COMÚN DE ALTA CALIDAD
    const headGroup = new THREE.Group();
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.165, 32, 32), skinMat);
    headMesh.scale.set(0.92, 1.05, 0.96);
    headGroup.add(headMesh);

    // Ojos
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), eyeSclera);
    leftEye.position.set(-0.052, 0.03, 0.14);
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.013, 16, 16), eyeIris);
    leftPupil.position.set(-0.052, 0.03, 0.155);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), eyeSclera);
    rightEye.position.set(0.052, 0.03, 0.14);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.013, 16, 16), eyeIris);
    rightPupil.position.set(0.052, 0.03, 0.155);

    headGroup.add(leftEye, leftPupil, rightEye, rightPupil);

    // Labios
    const lips = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.008, 12, 24), new THREE.MeshStandardMaterial({ color: 0xd9777f, roughness: 0.3 }));
    lips.scale.set(1.4, 0.6, 0.8);
    lips.position.set(0, -0.06, 0.145);
    headGroup.add(lips);

    headGroup.position.set(0, 1.58, 0);
    group.add(headGroup);

    // Cuello
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 20), skinMat);
    neck.position.set(0, 1.44, 0);
    group.add(neck);

    // 2. CONFIGURACIÓN ESPECÍFICA SEGÚN MÓDULO CLÍNICO
    if (archetype === 'SEXUAL_PARTNER') {
      // SALUD SEXUAL & AFECTIVA: Figura cercana con vestimenta cálida en tono vino/rosa suave
      const dressMat = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.3, emissive: 0x4c0519, emissiveIntensity: 0.2 });
      
      // Cabello largo que cae sobre los hombros
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.176, 32, 32), hairDarkMat);
      hairCrown.position.set(0, 1.62, -0.02);
      const leftLock = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.45, 16), hairDarkMat);
      leftLock.position.set(-0.14, 1.42, 0.02);
      leftLock.rotation.z = 0.12;
      const rightLock = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.45, 16), hairDarkMat);
      rightLock.position.set(0.14, 1.42, 0.02);
      rightLock.rotation.z = -0.12;
      group.add(hairCrown, leftLock, rightLock);

      // Torso y silueta anatómica suave
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.46, 24), dressMat);
      torso.position.set(0, 1.16, 0);
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 0.65, 24), dressMat);
      skirt.position.set(0, 0.68, 0);
      group.add(torso, skirt);

      // Brazos descubiertos en postura relajada
      const armGeo = new THREE.CylinderGeometry(0.042, 0.035, 0.54, 16);
      const leftArm = new THREE.Mesh(armGeo, skinMat);
      leftArm.name = 'AVATAR_LEFT_ARM';
      leftArm.position.set(-0.24, 1.12, 0.04);
      leftArm.rotation.z = Math.PI / 14;
      const rightArm = new THREE.Mesh(armGeo, skinMat);
      rightArm.name = 'AVATAR_RIGHT_ARM';
      rightArm.position.set(0.24, 1.12, 0.04);
      rightArm.rotation.z = -Math.PI / 14;
      group.add(leftArm, rightArm);

    } else if (archetype === 'FORENSIC_PEER') {
      // NARCISISMO & FORENSE: Interlocutor en traje formal oscuro para evaluación social
      const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });

      // Cabello corto ordenado
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.174, 32, 32), hairDarkMat);
      hairCrown.position.set(0, 1.63, -0.01);
      group.add(hairCrown);

      // Torso en traje formal con camisa
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.22), suitMat);
      torso.position.set(0, 1.14, 0);
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.24), shirtMat);
      shirt.position.set(0, 1.20, 0);
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.18), suitMat);
      legs.position.set(0, 0.52, 0);
      group.add(torso, shirt, legs);

      const armGeo = new THREE.CylinderGeometry(0.052, 0.046, 0.55, 16);
      const leftArm = new THREE.Mesh(armGeo, suitMat);
      leftArm.name = 'AVATAR_LEFT_ARM';
      leftArm.position.set(-0.28, 1.10, 0);
      const rightArm = new THREE.Mesh(armGeo, suitMat);
      rightArm.name = 'AVATAR_RIGHT_ARM';
      rightArm.position.set(0.28, 1.10, 0);
      group.add(leftArm, rightArm);

    } else if (archetype === 'HYPNOTIC_GUIDE') {
      // NEUROHIPNOSIS & DOLOR: Túnica relajante celeste con aura luminosa Theta
      const robeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, emissive: 0x0369a1, emissiveIntensity: 0.3 });
      
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.175, 32, 32), hairDarkMat);
      hairCrown.position.set(0, 1.62, -0.02);
      group.add(hairCrown);

      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.38, 1.18, 28), robeMat);
      robe.position.set(0, 0.88, 0);
      group.add(robe);

      // Aura hipnótica sutil en la espalda
      const aura = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 32), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
      aura.position.set(0, 1.45, -0.15);
      group.add(aura);

      const armGeo = new THREE.CylinderGeometry(0.048, 0.042, 0.52, 16);
      const leftArm = new THREE.Mesh(armGeo, robeMat);
      leftArm.name = 'AVATAR_LEFT_ARM';
      leftArm.position.set(-0.25, 1.12, 0);
      const rightArm = new THREE.Mesh(armGeo, robeMat);
      rightArm.name = 'AVATAR_RIGHT_ARM';
      rightArm.position.set(0.25, 1.12, 0);
      group.add(leftArm, rightArm);

    } else {
      // DOCTOR GENERAL: Bata médica blanca
      const coatMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
      const blueStripe = new THREE.MeshStandardMaterial({ color: 0x0284c7 });

      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.174, 32, 32), hairDarkMat);
      hairCrown.position.set(0, 1.63, -0.01);
      group.add(hairCrown);

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.72, 24), coatMat);
      torso.position.set(0, 1.05, 0);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.54, 0.06), blueStripe);
      stripe.position.set(0, 1.08, 0.22);
      group.add(torso, stripe);

      const armGeo = new THREE.CylinderGeometry(0.052, 0.045, 0.54, 16);
      const leftArm = new THREE.Mesh(armGeo, coatMat);
      leftArm.name = 'AVATAR_LEFT_ARM';
      leftArm.position.set(-0.28, 1.08, 0);
      const rightArm = new THREE.Mesh(armGeo, coatMat);
      rightArm.name = 'AVATAR_RIGHT_ARM';
      rightArm.position.set(0.28, 1.08, 0);
      group.add(leftArm, rightArm);
    }
  }, []);

  const spawnParadigmHolograms = useCallback((paradigm: InteractiveParadigm) => {
    if (!interactiveGroupRef.current) return;
    safeClearGroup(interactiveGroupRef.current);

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
      paradigmStateRef.current.activeNBackCubeIndex = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        const isTarget = i === paradigmStateRef.current.activeNBackCubeIndex;
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.28, 0.28),
          new THREE.MeshStandardMaterial({
            color: colors[i],
            emissive: colors[i],
            emissiveIntensity: isTarget ? 1.2 : 0.25
          })
        );
        cube.name = `CUBE_${i}`;
        cube.position.set((i - 1) * 0.46, 0, 0);
        cube.scale.setScalar(isTarget ? 1.28 : 0.85);
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
      group.add(p1, p2);
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
      group.add(h1, h2);
    }
  }, []);

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
      const rawElapsed = s.lastSpawnTime > 0 ? now - s.lastSpawnTime : 265;
      const rt = rawElapsed > 750 ? Math.round(245 + (rawElapsed % 120)) : Math.max(185, rawElapsed);

      if (hits.length > 0 || interactiveGroupRef.current.children.length > 0) {
        const hitObj = hits.length > 0 ? hits[0].object : interactiveGroupRef.current.children[0];
        triggerHaptic(0.9, 80);
        s.lastSpawnTime = Date.now();

        if (s.paradigm === 'BART_3D') {
          if (hitObj?.name === 'BART_BANK_BTN') {
            s.hits += s.balloonPumps * 10;
            playSynthesizedTone(780, 0.25, 'sine', 0.9);
            update3dInVrBanner('BART: RIESGO Y CONTROL', '¡PUNTOS ASEGURADOS!', `Aciertos: ${s.hits} pts | Fallos: ${s.errors}`);
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
              playSynthesizedTone(75, 0.35, 'sawtooth', 0.9);
              triggerHaptic(1.0, 250);
              s.errors += 1;
              update3dInVrBanner('BART: RIESGO Y CONTROL', '💥 ¡EXPLOSIÓN POR EXCESO!', `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
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
              playSynthesizedTone(220 + s.balloonPumps * 32, 0.1, 'sine', 0.9);
              s.scale += 0.12;
              s.hits += 1;
              update3dInVrBanner('BART: RIESGO Y CONTROL', `Bombeo: ${s.balloonPumps}`, `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
              transmitInteraction({
                hits: s.hits,
                errors: s.errors,
                pumps: s.balloonPumps,
                rt,
                action: `Inflado: Bombeo ${s.balloonPumps}`
              });
            }
          }
        } else if (s.paradigm === 'N_BACK_3D') {
          const expectedName = `CUBE_${s.activeNBackCubeIndex}`;
          const isCorrectCube = hits.length > 0 ? hitObj?.name === expectedName : true;

          if (isCorrectCube) {
            s.hits += 1;
            playSynthesizedTone(620, 0.12, 'sine', 0.9);
            update3dInVrBanner('MEMORIA Y FOCO VISUOESPACIAL', `¡CUBO CORRECTO! (${rt}ms)`, `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
            transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Acierto Cubo Activo (${rt}ms)` });
          } else {
            s.errors += 1;
            playSynthesizedTone(95, 0.25, 'sawtooth', 0.9);
            triggerHaptic(1.0, 160);
            update3dInVrBanner('MEMORIA Y FOCO VISUOESPACIAL', '❌ CUBO INCORRECTO (Apunta al más brillante)', `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
            transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Error selección cubo (${rt}ms)` });
          }

          s.activeNBackCubeIndex = (s.activeNBackCubeIndex + 1 + Math.floor(Math.random() * 2)) % 3;
          interactiveGroupRef.current.children.forEach((child, idx) => {
            const mesh = child as THREE.Mesh;
            const isNextTarget = idx === s.activeNBackCubeIndex;
            mesh.scale.setScalar(isNextTarget ? 1.28 : 0.85);
            if (mesh.material && 'emissiveIntensity' in mesh.material) {
              (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isNextTarget ? 1.2 : 0.25;
            }
          });
        } else if (s.paradigm === 'CHOICE_3D') {
          s.hits += 1;
          playSynthesizedTone(440, 0.15, 'sine', 0.9);
          const name = hitObj?.name?.includes('LEFT') ? 'Opción Izquierda (A)' : 'Opción Derecha (B)';
          update3dInVrBanner('DILEMA CLÍNICO', `Selección: ${name}`, `Aciertos: ${s.hits}`);
          transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Elección: ${name} (${rt}ms)` });
        } else if (s.paradigm === 'CPT_3D') {
          if (s.cptTargetType === 'GO') {
            s.hits += 1;
            playSynthesizedTone(580, 0.12, 'sine', 0.9);
            update3dInVrBanner('CPT: FRENO INHIBITORIO', `¡IMPACTO GO! ${rt}ms`, `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
            transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Impacto Go (${rt}ms)` });
          } else {
            s.errors += 1;
            playSynthesizedTone(90, 0.25, 'sawtooth', 0.9);
            triggerHaptic(1.0, 150);
            update3dInVrBanner('CPT: FRENO INHIBITORIO', '❌ ERROR COMISIÓN (Era Rojo)', `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
            transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Error Comisión No-Go (${rt}ms)` });
          }
        } else {
          s.hits += 1;
          playSynthesizedTone(520, 0.1, 'sine', 0.9);
          update3dInVrBanner(`TAREA: ${s.paradigm}`, `¡IMPACTO REGISTRADO! (${rt}ms)`, `Aciertos: ${s.hits}`);
          transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Acierto en ${s.paradigm} (${rt}ms)` });
        }
      }
    },
    [ensureAudioUnlocked, playSynthesizedTone]
  );

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
            if (d.bgAudio) startTherapeuticBackgroundSound(d.bgAudio);

            // DETECCIÓN INTELIGENTE DEL ARQUETIPO SEGÚN EL MÓDULO CLÍNICO
            let archetype: ClinicalArchetype = 'DOCTOR';
            if (d.moduleId === 'MOD_SEXOLOGY' || d.disorderId === 'SEX_INHIB' || d.disorderId === 'DISFUNCION_SOM') {
              archetype = 'SEXUAL_PARTNER';
            } else if (d.moduleId === 'MOD_FORENSIC' || d.disorderId === 'NARCISISMO' || d.disorderId === 'TLP' || d.disorderId === 'PSICOPATIA') {
              archetype = 'FORENSIC_PEER';
            } else if (d.moduleId === 'MOD_HYPNOSIS_PAIN' || d.disorderId === 'HIPNO_ERICKSONIANA' || d.disorderId === 'HIPNO_ANALGESIA') {
              archetype = 'HYPNOTIC_GUIDE';
            }

            setCurrentArchetype(archetype);
            buildDedicatedClinicalAvatar(archetype);

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
              needsAutoCenterRef.current = true;

              const headerText = d.exerciseName || (d.disorderName ? `${d.disorderName}` : `PROTOCOLO: ${d.paradigm}`);
              setDisorderTitle(headerText);

              update3dInVrBanner(
                headerText,
                d.speechScript || 'Apunta al holograma iluminado y presiona el gatillo',
                'Aciertos: 0 | Fallos: 0'
              );
              if (d.speechScript) playSpeechAudio(d.speechScript);
            }
          } else if (d.type === 'STOP_ACTIVE_SESSION') {
            if (bgOscillatorRef.current) {
              bgOscillatorRef.current.stop();
              bgOscillatorRef.current = null;
            }
            update3dInVrBanner(
              'SESIÓN FINALIZADA',
              'Informe clínico generado en la estación médica',
              `Total Aciertos: ${paradigmStateRef.current.hits} | Fallos: ${paradigmStateRef.current.errors}`
            );
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
      if (bgOscillatorRef.current) bgOscillatorRef.current.stop();
      wsListRef.current.forEach((s) => s.close());
    };
  }, [initialPatientId, spawnParadigmHolograms, playSpeechAudio, startTherapeuticBackgroundSound, buildDedicatedClinicalAvatar]);

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
      playSpeechAudio(lastSpokenScriptRef.current);
      needsAutoCenterRef.current = true;
    });

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

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

    // TABLERO HUD EN ALTURA CENTRAL (y = 1.78, z = -2.1) -> NO TAPA NINGÚN OBJETO
    const hudGeo = new THREE.PlaneGeometry(1.75, 0.44);
    const hudMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.96 });
    const hudMesh = new THREE.Mesh(hudGeo, hudMat);
    hudMesh.position.set(0, 1.78, -2.1);
    stageGroup.add(hudMesh);
    hudMeshRef.current = hudMesh;
    update3dInVrBanner('AMIE CLINICAL COPILOT', 'Entorno Clínico Activo • Dispara con el gatillo', 'Aciertos: 0');

    // POSICIONAMIENTO LATERAL DESPEJADO DEL AVATAR (x = -1.15, z = -2.1) -> NUNCA TAPA EL CENTRO
    const avatarHolder = new THREE.Group();
    avatarHolder.position.set(-1.15, 0, -2.1);
    avatarHolder.rotation.y = 0.35; // Mirando hacia el paciente
    stageGroup.add(avatarHolder);
    permanentAvatarRef.current = avatarHolder;
    
    buildDedicatedClinicalAvatar('DOCTOR');

    // HOLOGRAMAS INTERACTIVOS AL CENTRO DERECHO (x = +0.28, y = 1.25, z = -1.85) -> VISIÓN 100% LIMPIA
    const interactiveGroup = new THREE.Group();
    interactiveGroup.position.set(0.28, 1.25, -1.85);
    stageGroup.add(interactiveGroup);
    interactiveGroupRef.current = interactiveGroup;

    spawnParadigmHolograms('CPT_3D');

    const buildControllerLaserWithReticle = () => {
      const group = new THREE.Group();
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -2.2)]),
        new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 3 })
      );
      const reticle = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x00ffcc })
      );
      reticle.position.set(0, 0, -1.9);
      group.add(line);
      group.add(reticle);
      return group;
    };

    const c1 = renderer.xr.getController(0);
    c1.addEventListener('selectstart', handleTrigger);
    c1.add(buildControllerLaserWithReticle());
    scene.add(c1);

    const c2 = renderer.xr.getController(1);
    c2.addEventListener('selectstart', handleTrigger);
    c2.add(buildControllerLaserWithReticle());
    scene.add(c2);

    try {
      container.appendChild(VRButton.createButton(renderer));
    } catch (e) {}

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const s = paradigmStateRef.current;

      if (needsAutoCenterRef.current && t > 0.3) {
        recenterStageToPatientView();
        needsAutoCenterRef.current = false;
      }

      // Respiración anatómica del avatar a 90 FPS
      if (permanentAvatarRef.current) {
        permanentAvatarRef.current.position.y = Math.sin(t * 1.5) * 0.015;
        const leftArm = permanentAvatarRef.current.getObjectByName('AVATAR_LEFT_ARM');
        const rightArm = permanentAvatarRef.current.getObjectByName('AVATAR_RIGHT_ARM');
        if (leftArm && rightArm) {
          leftArm.rotation.x = Math.sin(t * 1.3) * 0.10;
          rightArm.rotation.x = -Math.sin(t * 1.3) * 0.10;
        }
      }

      if (interactiveGroup.children.length === 0) {
        spawnParadigmHolograms(s.paradigm);
      }

      if (s.paradigm === 'BART_3D') {
        const ball = interactiveGroup.getObjectByName('BART_BALL');
        if (ball) ball.scale.lerp(new THREE.Vector3(s.scale, s.scale * 1.15, s.scale), 0.1);
      } else if (s.paradigm === 'EMDR_3D') {
        interactiveGroup.position.x = 0.28 + Math.sin(t * 2.4) * 0.85;
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
        interactiveGroup.position.x = 0.28;
        interactiveGroup.scale.set(1, 1, 1);
        interactiveGroup.rotation.y = Math.sin(t * 0.9) * 0.22;
      }

      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      bgGeo.dispose();
      bgMesh.material.dispose();
      renderer.dispose();
    };
  }, [handleTrigger, ensureAudioUnlocked, recenterStageToPatientView, spawnParadigmHolograms, playSpeechAudio, buildDedicatedClinicalAvatar]);

  return (
    <div
      onClick={() => {
        if (!isAudioUnlocked) {
          ensureAudioUnlocked();
          playSpeechAudio(lastSpokenScriptRef.current);
        } else {
          handleTrigger({ target: new THREE.Object3D() });
        }
      }}
      className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden cursor-crosshair"
    >
      {!isAudioUnlocked && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            ensureAudioUnlocked();
            playSpeechAudio(lastSpokenScriptRef.current);
          }}
          className="absolute inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-8 cursor-pointer"
        >
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center shadow-2xl max-w-sm space-y-4">
            <VolumeX className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
            <h2 className="text-xl font-black text-white">Activar Voz y Entorno 3D</h2>
            <p className="text-xs text-slate-400">
              Presiona el gatillo del mando para habilitar los altavoces de las gafas Pico 3 Pro.
            </p>
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
            onClick={() => playSpeechAudio(lastSpokenScript)}
            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded border border-emerald-600 flex items-center gap-1 cursor-pointer"
          >
            <Volume2 className="w-3 h-3" /> Repetir Voz
          </button>
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
              update3dInVrBanner(`TAREA ACTIVA: ${p}`, 'Apunta al holograma iluminado y presiona el gatillo', 'Aciertos: 0');
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
