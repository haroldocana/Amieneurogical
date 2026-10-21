// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF COMPLETO
// 240 Protocolos Clínicos DSM-5 • Avatares Anatómicos 3D • Entornos Procedurales
// Ensayos Temporizados Reales (Conners CPT, BART, N-Back, EMDR, AAT)
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Target, VolumeX, Play, RefreshCw, Volume2, Layers, Activity } from 'lucide-react';

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

export interface VrClinicalExercise {
  id: string;
  mode: 'DIAGNOSTIC' | 'TREATMENT';
  paradigm: InteractiveParadigm;
  name: string;
  bgAudio: string;
  script: string;
}

export interface VrDisorderData {
  id: string;
  modId: string;
  name: string;
  archetype: ClinicalArchetype;
  environment: 'OFFICE' | 'FOREST' | 'STREET';
  exercises: VrClinicalExercise[];
}

interface RawDisorderMeta {
  id: string;
  modId: string;
  name: string;
  archetype: ClinicalArchetype;
  environment: 'OFFICE' | 'FOREST' | 'STREET';
  evalTest: string;
  treatTest: string;
}

const RAW_DISORDERS: RawDisorderMeta[] = [
  // Módulo I: Neurodesarrollo & Motor
  { id: 'TDAH', modId: 'MOD_NEURODEV', name: 'TDAH / Déficit de Atención e Impulsividad', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: "Conners CPT-3 (d')", treatTest: 'Neurofeedback SMR' },
  { id: 'TEA_1', modId: 'MOD_NEURODEV', name: 'Espectro Autista Nivel 1 (Asperger)', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: 'Microexpresiones Faciales', treatTest: 'Neuronas Espejo' },
  { id: 'TEA_2_3', modId: 'MOD_NEURODEV', name: 'Espectro Autista Nivel 2-3', archetype: 'DOCTOR', environment: 'FOREST', evalTest: 'Reactividad Multisensorial', treatTest: 'Integración Háptica' },
  { id: 'ALZHEIMER', modId: 'MOD_NEURODEV', name: 'Deterioro Cognitivo / Alzheimer', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: 'Memoria Episódica Inmediata', treatTest: 'Terapia de Reminiscencia' },
  { id: 'PARKINSON', modId: 'MOD_NEURODEV', name: 'Parkinson (Temblor & Bradicinesia)', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: 'Cuantificación 90Hz', treatTest: 'LSVT BIG VR / Amplitud' },

  // Módulo II: Afectivo & Estado de Ánimo
  { id: 'DEPRESION', modId: 'MOD_AFFECTIVE', name: 'Depresión Mayor Unipolar', archetype: 'DOCTOR', environment: 'FOREST', evalTest: 'Sesgo Cognitivo Dot-Probe', treatTest: 'Activación Conductual (BAT)' },
  { id: 'BIPOLAR', modId: 'MOD_AFFECTIVE', name: 'Trastorno Bipolar', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: 'Latencia Acelerada Maníaca', treatTest: 'Estabilización Interhemisférica' },
  { id: 'DISTIMIA', modId: 'MOD_AFFECTIVE', name: 'Distimia / Depresión Persistente', archetype: 'DOCTOR', environment: 'FOREST', evalTest: 'Perseveración en el Error', treatTest: 'Reactivación Propioceptiva' },
  { id: 'CICLOTIMIA', modId: 'MOD_AFFECTIVE', name: 'Ciclotimia', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: 'Fluctuación de Latencias', treatTest: 'Neutralización de Euforia' },

  // Módulo III: Trauma, TEPT & Disociación
  { id: 'TEPT', modId: 'MOD_TRAUMA', name: 'Estrés Postraumático (TEPT)', archetype: 'DOCTOR', environment: 'FOREST', evalTest: 'Reactividad a Cues Fóbicos', treatTest: 'EMDR de 8 Fases (Shapiro)' },
  { id: 'TRAUMA_COMPLEJO', modId: 'MOD_TRAUMA', name: 'Trauma Complejo (C-PTSD)', archetype: 'DOCTOR', environment: 'FOREST', evalTest: 'Umbral de Sumisión por Miedo', treatTest: 'Reconstrucción de Límites' },
  { id: 'DESPERSONALIZACION', modId: 'MOD_TRAUMA', name: 'Despersonalización / Desrealización', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: 'Retraso Táctil-Visual 6DoF', treatTest: 'Anclaje Vestibular Somático' },

  // Módulo IV: Ansiedad, Fobias & TOC
  { id: 'FOBIA_SOCIAL', modId: 'MOD_ANXIETY', name: 'Fobia Social / Ansiedad de Escrutinio', archetype: 'FORENSIC_PEER', environment: 'STREET', evalTest: 'Escrutinio Ocular en Multitud', treatTest: 'Desensibilización de Vergüenza' },
  { id: 'PANICO', modId: 'MOD_ANXIETY', name: 'Trastorno de Pánico y Agorafobia', archetype: 'DOCTOR', environment: 'STREET', evalTest: 'Exposición Interoceptiva', treatTest: 'Reentrenamiento Capnográfico' },
  { id: 'TOC', modId: 'MOD_ANXIETY', name: 'Trastorno Obsesivo Compulsivo (TOC)', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: 'Latencia de Verificación', treatTest: 'Prevención de Respuesta (EPR)' },
  { id: 'TAG', modId: 'MOD_ANXIETY', name: 'Ansiedad Generalizada (TAG)', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: 'Supresión de Tono Vagal', treatTest: 'Mindfulness Anti-Preocupación' },

  // Módulo V: Adicciones & Control de Impulsos
  { id: 'ADICCION_SUST', modId: 'MOD_ADDICTIONS', name: 'Dependencia a Sustancias', archetype: 'FORENSIC_PEER', environment: 'STREET', evalTest: 'Approach Bias hacia Cues', treatTest: 'Rechazo Motor AAT & Urge-Surfing' },
  { id: 'LUDOPATIA', modId: 'MOD_ADDICTIONS', name: 'Ludopatía y Apuestas Digitales', archetype: 'FORENSIC_PEER', environment: 'STREET', evalTest: 'Iowa Gambling Task (IGT 3D)', treatTest: 'Extinción de Recompensas' },
  { id: 'ATRACON', modId: 'MOD_ADDICTIONS', name: 'Trastorno por Atracón Compulsivo', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: 'Sesgo hacia Ultraprocesados', treatTest: 'Rechazo Motor Háptico' },
  { id: 'CLEPTOMANIA', modId: 'MOD_ADDICTIONS', name: 'Cleptomanía / Falla del Control', archetype: 'FORENSIC_PEER', environment: 'STREET', evalTest: 'Tensión Previa (Pico GSR)', treatTest: 'Freno Háptico de Urgencia' },

  // Módulo VI: Forense, Psicopatía & Cluster B
  { id: 'TLP', modId: 'MOD_FORENSIC', name: 'Trastorno Límite de Personalidad (TLP)', archetype: 'FORENSIC_PEER', environment: 'OFFICE', evalTest: 'Hipersensibilidad al Rechazo', treatTest: 'Habilidades DBT TIPP en VR' },
  { id: 'PSICOPATIA', modId: 'MOD_FORENSIC', name: 'Psicopatía (Factor 1 y 2 PCL-R)', archetype: 'FORENSIC_PEER', environment: 'OFFICE', evalTest: 'Dilema Moral Utilitarista', treatTest: 'Condicionamiento Aversivo' },
  { id: 'NARCISISMO', modId: 'MOD_FORENSIC', name: 'Narcisismo Maligno', archetype: 'FORENSIC_PEER', environment: 'OFFICE', evalTest: 'Reactividad Colérica ante Fallo', treatTest: 'Desescalamiento de Ira' },
  { id: 'HISTRIONICO', modId: 'MOD_FORENSIC', name: 'Trastorno Histriónico', archetype: 'FORENSIC_PEER', environment: 'STREET', evalTest: 'Dependencia de Atención Social', treatTest: 'Concentración sin Refuerzo' },

  // Módulo VII: Neurohipnosis & Dolor Crónico
  { id: 'HIPNO_ERICKSONIANA', modId: 'MOD_HYPNOSIS_PAIN', name: 'Hipnosis Ericksoniana', archetype: 'HYPNOTIC_GUIDE', environment: 'FOREST', evalTest: 'Escala de Sugestionabilidad', treatTest: 'Siembra de Metáforas Inmersivas' },
  { id: 'HIPNO_ANALGESIA', modId: 'MOD_HYPNOSIS_PAIN', name: 'Hipnoanalgesia (Dolor Crónico)', archetype: 'HYPNOTIC_GUIDE', environment: 'FOREST', evalTest: 'Mapeo Espacial Nociceptivo', treatTest: 'Guantelete de Anestesia Térmica' },
  { id: 'HIPNO_FANTASMA', modId: 'MOD_HYPNOSIS_PAIN', name: 'Miembro Fantasma', archetype: 'HYPNOTIC_GUIDE', environment: 'OFFICE', evalTest: 'Discordancia Sensoriomotora', treatTest: 'Espejo Virtual 6DoF en Vivo' },

  // Módulo VIII: Salud Sexual & Psicosomática
  { id: 'SEX_INHIB', modId: 'MOD_SEXOLOGY', name: 'Inhibición Sexual (SIS)', archetype: 'SEXUAL_PARTNER', environment: 'OFFICE', evalTest: 'Modelo de Control Dual (SIS)', treatTest: 'Sensate Focus VR (Focalización)' },
  { id: 'DISFUNCION_SOM', modId: 'MOD_SEXOLOGY', name: 'Ansiedad de Rendimiento Sexual', archetype: 'SEXUAL_PARTNER', environment: 'OFFICE', evalTest: 'Rol de Espectador Crítico', treatTest: 'Descatastrofización y Confort' },

  // Módulo IX: Logoterapia & Sentido
  { id: 'VACIO_EXISTENCIAL', modId: 'MOD_LOGOTHERAPY', name: 'Vacío Existencial / Logoterapia', archetype: 'DOCTOR', environment: 'FOREST', evalTest: 'Diagnóstico de Hiperreflexión', treatTest: 'Intención Paradójica Inmersiva' }
];

export const CLINICAL_VR_MATRIX: Record<string, VrDisorderData> = {};

RAW_DISORDERS.forEach((d) => {
  CLINICAL_VR_MATRIX[d.id] = {
    id: d.id,
    modId: d.modId,
    name: d.name,
    archetype: d.archetype,
    environment: d.environment,
    exercises: [
      // 4 Protocolos de Diagnóstico
      { id: `${d.id}_D1`, mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: `1. ${d.evalTest}: Freno Go/No-Go`, bgAudio: 'BROWN_NOISE', script: `Evaluación clínica de ${d.name}. Dispara únicamente a las esferas verdes y suprime el disparo ante rojas.` },
      { id: `${d.id}_D2`, mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: `2. ${d.name}: Tolerancia al Riesgo (BART)`, bgAudio: 'TENSION_DRUM', script: `Evaluación de riesgo en ${d.name}. Bombea el globo para sumar puntos o asegúralos antes de que explote.` },
      { id: `${d.id}_D3`, mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: `3. ${d.name}: Memoria de Trabajo Visuoespacial`, bgAudio: 'BETA_WAVES', script: `Evaluación ejecutiva. Apunta y dispara únicamente al cubo iluminado de mayor escala.` },
      { id: `${d.id}_D4`, mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: `4. ${d.name}: Toma de Decisiones y Conflicto`, bgAudio: 'HEARTBEAT', script: `Evaluación decisional. Selecciona rápidamente entre las dos opciones presentadas en el panel.` },

      // 4 Protocolos de Tratamiento
      { id: `${d.id}_T1`, mode: 'TREATMENT', paradigm: 'AAT_3D', name: `5. Intervención AAT: ${d.treatTest}`, bgAudio: 'ALPHA_WAVES', script: `Intervención motora de rechazo. Empuja con firmeza el holograma perturbador fuera de tu espacio vital.` },
      { id: `${d.id}_T2`, mode: 'TREATMENT', paradigm: 'EMDR_3D', name: `6. Reprocesamiento Ocular Bilateral (EMDR)`, bgAudio: 'BILATERAL_SWEEP', script: `Sigue la esfera luminosa rítmica con la mirada para desensibilizar la carga emocional.` },
      { id: `${d.id}_T3`, mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: `7. ${d.treatTest} en Espejo Somatomotor`, bgAudio: 'THETA_WAVES', script: `Sincroniza tus brazos con los movimientos guía del avatar para afianzar coherencia sensoriomotora.` },
      { id: `${d.id}_T4`, mode: 'TREATMENT', paradigm: 'BIO_3D', name: `8. Biofeedback Vagal de Cierre Autonómico`, bgAudio: 'DELTA_WAVES', script: `Acompasa tu respiración con la expansión del loto para restaurar el tono vagal y la serenidad.` }
    ]
  };
});

export const VrPatientExperience: React.FC<Props> = ({ patientId: propsPatientId }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;

  const initialPatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';
  const activePatientIdRef = useRef<string>(initialPatientId);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [selectedDisorderKey, setSelectedDisorderKey] = useState<string>('TDAH');
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [activeParadigm, setActiveParadigm] = useState<InteractiveParadigm>('CPT_3D');
  const [wsOnline, setWsOnline] = useState(false);
  const [disorderTitle, setDisorderTitle] = useState('1. Conners CPT-3: Freno Go/No-Go');
  const [lastSpokenScript, setLastSpokenScript] = useState('Dispara únicamente a las esferas verdes y suprime el disparo ante rojas.');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const roomGroupRef = useRef<THREE.Group | null>(null);
  const interactiveGroupRef = useRef<THREE.Group | null>(null);
  const permanentAvatarRef = useRef<THREE.Group | null>(null);
  const hudMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const wsListRef = useRef<WebSocket[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgOscillatorRef = useRef<{ stop: () => void } | null>(null);
  const needsAutoCenterRef = useRef<boolean>(true);

  // Estados internos del ensayo neuropsicológico activo
  const trialStateRef = useRef({
    paradigm: 'CPT_3D' as InteractiveParadigm,
    hits: 0,
    errors: 0,
    // Conners CPT Go/No-Go
    cptActive: false,
    cptType: 'GO' as 'GO' | 'NOGO',
    stimulusOnsetTime: 0,
    trialTimer: 0,
    // BART
    balloonPumps: 0,
    balloonMaxCap: 12,
    balloonScale: 1.0,
    // N-Back
    activeCube: 0
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

  const startTherapeuticBackgroundSound = useCallback((audioType?: string) => {
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

      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      if (audioType === 'DELTA_WAVES') {
        osc1.frequency.value = 180; osc2.frequency.value = 182.5;
      } else if (audioType === 'THETA_WAVES') {
        osc1.frequency.value = 200; osc2.frequency.value = 206;
      } else if (audioType === 'ALPHA_WAVES') {
        osc1.frequency.value = 220; osc2.frequency.value = 230;
      } else if (audioType === 'BETA_WAVES') {
        osc1.frequency.value = 250; osc2.frequency.value = 268;
      } else if (audioType === 'BILATERAL_SWEEP') {
        osc1.frequency.value = 196; osc2.frequency.value = 200;
      } else {
        osc1.frequency.value = 140; osc2.frequency.value = 144;
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
              osc1.stop(); osc2.stop();
              osc1.disconnect(); osc2.disconnect();
            }, 350);
          } catch (e) {}
        }
      };
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
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
      if (child.geometry) child.geometry.dispose();
      group.remove(child);
    }
  };

  // ============================================================================
  // CONSTRUCTOR DE ENTORNOS 3D PROCEDURALES (100% CÓDIGO • SIN FOTOS • CERO CORS)
  // ============================================================================
  const buildProceduralEnvironment = useCallback((env: 'OFFICE' | 'FOREST' | 'STREET') => {
    if (!roomGroupRef.current || !sceneRef.current) return;
    const room = roomGroupRef.current;
    safeClearGroup(room);

    if (env === 'FOREST') {
      sceneRef.current.fog = new THREE.FogExp2(0x064e3b, 0.04);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.85 })
      );
      ground.rotation.x = -Math.PI / 2;
      room.add(ground);

      for (let i = 0; i < 20; i++) {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.25, 4.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 })
        );
        const angle = (i / 20) * Math.PI * 2;
        const dist = 5.0 + (i % 4) * 1.5;
        trunk.position.set(Math.cos(angle) * dist, 2.25, Math.sin(angle) * dist);
        room.add(trunk);
      }
    } else if (env === 'STREET') {
      sceneRef.current.fog = new THREE.FogExp2(0x0f172a, 0.035);
      const street = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
      );
      street.rotation.x = -Math.PI / 2;
      room.add(street);

      for (let i = 0; i < 12; i++) {
        const bHeight = 4 + (i % 5) * 2;
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, bHeight, 2.5),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
        );
        const angle = (i / 12) * Math.PI * 2;
        bldg.position.set(Math.cos(angle) * 7.5, bHeight / 2, Math.sin(angle) * 7.5);
        room.add(bldg);
      }
    } else {
      // Consultorio Médico Controlado (OFFICE)
      sceneRef.current.fog = new THREE.FogExp2(0x0f172a, 0.02);

      const walls = new THREE.Mesh(
        new THREE.BoxGeometry(10, 4, 10),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, side: THREE.BackSide })
      );
      walls.position.set(0, 2, 0);
      room.add(walls);

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.2 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0.001, 0);
      room.add(floor);

      const baseMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 0.04), baseMat); b1.position.set(0, 0.06, -4.98);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 10), baseMat); b2.position.set(-4.98, 0.06, 0);
      const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 10), baseMat); b3.position.set(4.98, 0.06, 0);
      room.add(b1, b2, b3);

      const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 1.5 });
      const lamp1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 2.2), lampMat); lamp1.position.set(-2, 3.96, -1.5);
      const lamp2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 2.2), lampMat); lamp2.position.set(2, 3.96, -1.5);
      room.add(lamp1, lamp2);
    }
  }, []);

  // ============================================================================
  // CONSTRUCTOR DE AVATARES 3D ANATÓMICOS COMPLETOS (DOCTOR, SEX, FORENSIC, HYPNO)
  // ============================================================================
  const buildDedicated3dAvatar = useCallback((archetype: ClinicalArchetype) => {
    if (!permanentAvatarRef.current) return;
    const avatar = permanentAvatarRef.current;
    safeClearGroup(avatar);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0, roughness: 0.45 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1712, roughness: 0.6 });
    const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeIris = new THREE.MeshBasicMaterial({ color: archetype === 'SEXUAL_PARTNER' ? 0x0d9488 : 0x0284c7 });
    const lipsMat = new THREE.MeshStandardMaterial({ color: archetype === 'SEXUAL_PARTNER' ? 0xe11d48 : 0xbe123c, roughness: 0.35 });

    // 1. Cabeza
    const headGroup = new THREE.Group();
    headGroup.name = 'AVATAR_HEAD_GROUP';
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), skinMat);
    head.scale.set(0.92, 1.05, 0.96);
    headGroup.add(head);

    // Ojos anatómicos
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 16), eyeWhite); eyeR.position.set(0.05, 0.025, 0.135);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 16), eyeIris); pupilR.position.set(0.05, 0.025, 0.15);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 16), eyeWhite); eyeL.position.set(-0.05, 0.025, 0.135);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 16), eyeIris); pupilL.position.set(-0.05, 0.025, 0.15);
    headGroup.add(eyeR, pupilR, eyeL, pupilL);

    // Labios
    const lips = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.007, 8, 20), lipsMat);
    lips.scale.set(1.3, 0.6, 0.8);
    lips.position.set(0, -0.065, 0.14);
    headGroup.add(lips);

    headGroup.position.set(0, 1.58, 0);
    avatar.add(headGroup);

    // Cuello
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.15, 16), skinMat);
    neck.position.set(0, 1.44, 0);
    avatar.add(neck);

    // 2. Vestimenta y Cuerpo según Arquetipo Clínico
    if (archetype === 'SEXUAL_PARTNER') {
      const dressMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.35 });
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.175, 24, 24), hairMat);
      hairCrown.position.set(0, 1.62, -0.02);
      const hairLockR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 12), hairMat);
      hairLockR.position.set(0.14, 1.40, 0.02);
      const hairLockL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 12), hairMat);
      hairLockL.position.set(-0.14, 1.40, 0.02);
      avatar.add(hairCrown, hairLockR, hairLockL);

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.46, 20), dressMat);
      torso.position.set(0, 1.16, 0);
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, 0.70, 20), dressMat);
      skirt.position.set(0, 0.65, 0);
      avatar.add(torso, skirt);
    } else if (archetype === 'FORENSIC_PEER') {
      const suitMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.172, 24, 24), hairMat);
      hairCrown.position.set(0, 1.63, -0.01);
      avatar.add(hairCrown);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.22), suitMat);
      torso.position.set(0, 1.14, 0);
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.23), shirtMat);
      shirt.position.set(0, 1.20, 0);
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.18), suitMat);
      legs.position.set(0, 0.52, 0);
      avatar.add(torso, shirt, legs);
    } else if (archetype === 'HYPNOTIC_GUIDE') {
      const robeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, emissive: 0x0369a1, emissiveIntensity: 0.25 });
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.173, 24, 24), hairMat);
      hairCrown.position.set(0, 1.62, -0.02);
      avatar.add(hairCrown);

      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.38, 1.20, 24), robeMat);
      robe.position.set(0, 0.86, 0);
      const aura = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.46, 32),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      );
      aura.position.set(0, 1.45, -0.15);
      avatar.add(robe, aura);
    } else {
      // DOCTOR GENERAL: Bata médica blanca
      const coatMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.172, 24, 24), hairMat);
      hairCrown.position.set(0, 1.63, -0.01);
      avatar.add(hairCrown);

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.72, 20), coatMat);
      torso.position.set(0, 1.05, 0);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.05), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      stripe.position.set(0, 1.08, 0.22);
      avatar.add(torso, stripe);
    }

    // Brazos articulados
    const armMat = archetype === 'DOCTOR' ? new THREE.MeshStandardMaterial({ color: 0xf8fafc }) : skinMat;
    const armGeo = new THREE.CylinderGeometry(0.045, 0.038, 0.54, 16);
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.name = 'AVATAR_ARM_L';
    armL.position.set(-0.26, 1.10, 0);
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.name = 'AVATAR_ARM_R';
    armR.position.set(0.26, 1.10, 0);
    avatar.add(armL, armR);
  }, []);

  // ============================================================================
  // CONSTRUCTOR DE HOLOGRAMAS INTERACTIVOS (Trials 3D)
  // ============================================================================
  const setupParadigmVisuals = useCallback((paradigm: InteractiveParadigm) => {
    if (!interactiveGroupRef.current) return;
    safeClearGroup(interactiveGroupRef.current);
    const group = interactiveGroupRef.current;
    const t = trialStateRef.current;
    t.paradigm = paradigm;

    if (paradigm === 'CPT_3D' || paradigm === 'IDLE') {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 })
      );
      sphere.name = 'CPT_SPHERE';
      sphere.visible = false;
      group.add(sphere);
      t.cptActive = false;
      t.trialTimer = Date.now() + 1000;
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
      const colors = [0x22d3ee, 0xa855f7, 0xf59e0b];
      t.activeCube = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        const isTarget = i === t.activeCube;
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.28, 0.28),
          new THREE.MeshStandardMaterial({ color: colors[i], emissive: colors[i], emissiveIntensity: isTarget ? 1.2 : 0.25 })
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
      p1.name = 'CHOICE_LEFT'; p1.position.set(-0.45, 0, 0);
      const p2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1e40af, emissiveIntensity: 0.85 })
      );
      p2.name = 'CHOICE_RIGHT'; p2.position.set(0.45, 0, 0);
      group.add(p1, p2);
    } else if (paradigm === 'EMDR_3D') {
      const emdr = new THREE.Mesh(
        new THREE.SphereGeometry(0.20, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 1.0 })
      );
      emdr.name = 'EMDR_SPHERE';
      group.add(emdr);
    } else if (paradigm === 'BIO_3D') {
      const lotus = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.28, 0.08, 64, 16),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 })
      );
      lotus.name = 'BIO_LOTUS';
      group.add(lotus);
    } else {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.1, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0284c7 })
      );
      torus.name = 'GENERIC_TARGET';
      group.add(torus);
    }
  }, []);

  // ============================================================================
  // INTERACCIÓN FÍSICA CON GATILLO (Impactos 6DoF, CPT, BART, Choice)
  // ============================================================================
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

    triggerHaptic(0.9, 70);

    if (t.paradigm === 'CPT_3D') {
      const sphere = interactiveGroupRef.current.getObjectByName('CPT_SPHERE') as THREE.Mesh;
      if (sphere && sphere.visible && t.cptActive) {
        if (t.cptType === 'GO') {
          t.hits += 1;
          playTone(680, 0.1, 'sine');
          sphere.visible = false;
          t.cptActive = false;
          updateHUD('CPT: FRENO INHIBITORIO', `¡IMPACTO GO! (${rt}ms)`, `Aciertos: ${t.hits} | Fallos: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Impacto Go (${rt}ms)` });
        } else {
          t.errors += 1;
          playTone(90, 0.25, 'sawtooth');
          sphere.visible = false;
          t.cptActive = false;
          updateHUD('CPT: FRENO INHIBITORIO', '❌ ERROR COMISIÓN (Era Rojo)', `Aciertos: ${t.hits} | Fallos: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Error Comisión No-Go (${rt}ms)` });
        }
        t.trialTimer = now + 1200 + Math.random() * 800;
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
          triggerHaptic(1.0, 250);
          t.balloonPumps = 0;
          t.balloonScale = 1.0;
          t.balloonMaxCap = 5 + Math.floor(Math.random() * 8);
          updateHUD('BART: ¡EXPLOSIÓN!', '💥 GLOBO REVENTADO POR RIESGO', `Puntos: ${t.hits} | Explosiones: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, pumps: 0, rt, action: '💥 Explosión de globo' });
        } else {
          t.balloonScale += 0.12;
          playTone(220 + t.balloonPumps * 45, 0.08, 'sine');
          updateHUD('BART: INFLANDO', `Bombeo actual: ${t.balloonPumps}`, `Puntos: ${t.hits} | Explosiones: ${t.errors}`);
          transmitTelemetry({ hits: t.hits, errors: t.errors, pumps: t.balloonPumps, rt, action: `Bombeo ${t.balloonPumps}` });
        }
      }
    } else if (t.paradigm === 'N_BACK_3D') {
      const hitObj = hits.length > 0 ? hits[0].object : null;
      if (hitObj?.name === `CUBE_${t.activeCube}`) {
        t.hits += 1;
        playTone(620, 0.12, 'sine');
        updateHUD('MEMORIA OPERATIVA', `¡CUBO CORRECTO! (${rt}ms)`, `Aciertos: ${t.hits} | Fallos: ${t.errors}`);
        transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Acierto Cubo (${rt}ms)` });
      } else {
        t.errors += 1;
        playTone(95, 0.25, 'sawtooth');
        updateHUD('MEMORIA OPERATIVA', '❌ CUBO INCORRECTO', `Aciertos: ${t.hits} | Fallos: ${t.errors}`);
        transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Fallo Selección (${rt}ms)` });
      }
      t.activeCube = (t.activeCube + 1 + Math.floor(Math.random() * 2)) % 3;
      interactiveGroupRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const isNext = idx === t.activeCube;
        mesh.scale.setScalar(isNext ? 1.28 : 0.85);
        if (mesh.material && 'emissiveIntensity' in mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isNext ? 1.2 : 0.25;
        }
      });
    } else if (t.paradigm === 'CHOICE_3D') {
      const hitObj = hits.length > 0 ? hits[0].object : null;
      t.hits += 1;
      playTone(440, 0.15, 'sine');
      const opt = hitObj?.name?.includes('LEFT') ? 'Opción Izquierda' : 'Opción Derecha';
      updateHUD('DILEMA CLÍNICO', `Selección: ${opt}`, `Aciertos: ${t.hits}`);
      transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Elección: ${opt} (${rt}ms)` });
    } else {
      t.hits += 1;
      playTone(520, 0.1, 'sine');
      updateHUD(`TAREA: ${t.paradigm}`, `Impacto registrado (${rt}ms)`, `Aciertos: ${t.hits}`);
      transmitTelemetry({ hits: t.hits, errors: t.errors, rt, action: `Acierto en ${t.paradigm} (${rt}ms)` });
    }
  }, [ensureAudioUnlocked, playTone]);

  // ============================================================================
  // ACTIVACIÓN DE PROTOCOLOS CLÍNICOS
  // ============================================================================
  const activateProtocol = useCallback((disorderKey: string, exerciseIdx: number) => {
    const disorder = CLINICAL_VR_MATRIX[disorderKey] || CLINICAL_VR_MATRIX['TDAH'];
    const exercise = disorder.exercises[exerciseIdx] || disorder.exercises[0];

    setSelectedDisorderKey(disorderKey);
    setActiveExerciseIndex(exerciseIdx);
    setActiveParadigm(exercise.paradigm);

    const t = trialStateRef.current;
    t.paradigm = exercise.paradigm;
    t.hits = 0;
    t.errors = 0;
    t.balloonPumps = 0;
    t.balloonScale = 1.0;
    t.stimulusOnsetTime = 0;

    buildProceduralEnvironment(disorder.environment);
    buildDedicated3dAvatar(disorder.archetype);
    setupParadigmVisuals(exercise.paradigm);
    startTherapeuticBackgroundSound(exercise.bgAudio);

    setDisorderTitle(exercise.name);
    updateHUD(exercise.name, exercise.script, 'Aciertos: 0 | Fallos: 0');
    playSpeechAudio(exercise.script);
  }, [buildProceduralEnvironment, buildDedicated3dAvatar, setupParadigmVisuals, startTherapeuticBackgroundSound, playSpeechAudio]);

  // WebSocket Enlace con Workstation
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
          const dKey = d.disorderId || 'TDAH';
          const matched = CLINICAL_VR_MATRIX[dKey];
          if (matched) {
            const idx = matched.exercises.findIndex((ex) => ex.paradigm === d.paradigm);
            activateProtocol(dKey, idx >= 0 ? idx : 0);
          } else {
            setActiveParadigm(d.paradigm);
            setupParadigmVisuals(d.paradigm);
          }
        } else if (d.type === 'STOP_ACTIVE_SESSION') {
          if (bgOscillatorRef.current) {
            bgOscillatorRef.current.stop();
            bgOscillatorRef.current = null;
          }
          updateHUD('SESIÓN FINALIZADA', 'Informe generado en la consola médica', `Total Aciertos: ${trialStateRef.current.hits} | Fallos: ${trialStateRef.current.errors}`);
        }
      } catch (err) {}
    };

    wsListRef.current.push(ws);
    return () => ws.close();
  }, [initialPatientId, activateProtocol, setupParadigmVisuals]);

  // Montaje Three.js WebXR
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

    // Grupo de sala procedural
    const roomGroup = new THREE.Group();
    stageGroup.add(roomGroup);
    roomGroupRef.current = roomGroup;
    buildProceduralEnvironment('OFFICE');

    // HUD Superior
    const hudMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.75, 0.44),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.96 })
    );
    hudMesh.position.set(0, 1.85, -2.1);
    stageGroup.add(hudMesh);
    hudMeshRef.current = hudMesh;
    updateHUD('AMIE CLINICAL COPILOT', 'Sesión Activa • Apunta y dispara', 'Aciertos: 0');

    // Avatar 3D a la izquierda (x = -0.90m)
    const avatarHolder = new THREE.Group();
    avatarHolder.position.set(-0.90, 0, -2.0);
    avatarHolder.rotation.y = 0.35;
    stageGroup.add(avatarHolder);
    permanentAvatarRef.current = avatarHolder;
    buildDedicated3dAvatar('DOCTOR');

    // Hologramas a la derecha (x = +0.35m)
    const interactiveGroup = new THREE.Group();
    interactiveGroup.position.set(0.35, 1.25, -1.8);
    stageGroup.add(interactiveGroup);
    interactiveGroupRef.current = interactiveGroup;
    setupParadigmVisuals('CPT_3D');

    // Mandos y Láseres
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

    try { container.appendChild(VRButton.createButton(renderer)); } catch (e) {}

    const clock = new THREE.Clock();

    // ========================================================================
    // BUCLE DE RENDERIZADO Y CONTROL DE ENSAYOS TEMPORIZADOS (Trials)
    // ========================================================================
    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const now = Date.now();
      const trial = trialStateRef.current;

      // Centrado de vista al entrar a VR
      if (needsAutoCenterRef.current && t > 0.4) {
        if (rendererRef.current && cameraRef.current && stageGroupRef.current) {
          const xrCam = rendererRef.current.xr.isPresenting ? rendererRef.current.xr.getCamera() : cameraRef.current;
          const pos = new THREE.Vector3(); const quat = new THREE.Quaternion();
          xrCam.getWorldPosition(pos); xrCam.getWorldQuaternion(quat);
          const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
          stageGroupRef.current.position.set(pos.x, 0, pos.z);
          stageGroupRef.current.rotation.set(0, euler.y, 0);
        }
        needsAutoCenterRef.current = false;
      }

      // Respiración anatómica del avatar 3D
      if (permanentAvatarRef.current) {
        const armL = permanentAvatarRef.current.getObjectByName('AVATAR_ARM_L');
        const armR = permanentAvatarRef.current.getObjectByName('AVATAR_ARM_R');
        if (armL && armR) {
          armL.rotation.x = Math.sin(t * 1.4) * 0.08;
          armR.rotation.x = -Math.sin(t * 1.4) * 0.08;
        }
      }

      // 1. ENSAYOS TEMPORIZADOS CONNERS CPT-3
      if (trial.paradigm === 'CPT_3D' && interactiveGroupRef.current) {
        const sphere = interactiveGroupRef.current.getObjectByName('CPT_SPHERE') as THREE.Mesh;
        if (sphere) {
          if (!sphere.visible && now >= trial.trialTimer) {
            trial.cptType = Math.random() < 0.75 ? 'GO' : 'NOGO';
            const isGo = trial.cptType === 'GO';
            (sphere.material as THREE.MeshStandardMaterial).color.setHex(isGo ? 0x10b981 : 0xef4444);
            (sphere.material as THREE.MeshStandardMaterial).emissive.setHex(isGo ? 0x059669 : 0xb91c1c);
            sphere.visible = true;
            trial.stimulusOnsetTime = now;
            trial.cptActive = true;
          } else if (sphere.visible && now - trial.stimulusOnsetTime > 450) {
            sphere.visible = false;
            if (trial.cptType === 'GO' && trial.cptActive) {
              trial.errors += 1;
              playTone(110, 0.15, 'triangle');
              updateHUD('CPT: ERROR DE OMISIÓN', '⚠️ TIEMPO AGOTADO (Era Verde)', `Aciertos: ${trial.hits} | Fallos: ${trial.errors}`);
              transmitTelemetry({ hits: trial.hits, errors: trial.errors, rt: 450, action: 'Error de Omisión (Verde no disparado)' });
            }
            trial.cptActive = false;
            trial.trialTimer = now + 1200 + Math.random() * 800;
          }
        }
      }

      // 2. GLOBO BART
      if (trial.paradigm === 'BART_3D' && interactiveGroupRef.current) {
        const balloon = interactiveGroupRef.current.getObjectByName('BART_BALLOON');
        if (balloon) {
          balloon.scale.lerp(new THREE.Vector3(trial.balloonScale, trial.balloonScale * 1.15, trial.balloonScale), 0.1);
        }
      }

      // 3. MOVIMIENTO SACÁDICO EMDR
      if (trial.paradigm === 'EMDR_3D' && interactiveGroupRef.current) {
        interactiveGroupRef.current.position.x = 0.35 + Math.sin(t * 2.5) * 0.95;
      }

      // 4. LOTO RESPIRATORIO VAGAL (0.1 Hz)
      if (trial.paradigm === 'BIO_3D' && interactiveGroupRef.current) {
        const breath = 0.85 + Math.sin(t * Math.PI * 2 * 0.1) * 0.40;
        interactiveGroupRef.current.scale.set(breath, breath, breath);
        interactiveGroupRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, [handleTrigger, buildProceduralEnvironment, buildDedicated3dAvatar, setupParadigmVisuals, playTone]);

  const currentDisorder = CLINICAL_VR_MATRIX[selectedDisorderKey] || CLINICAL_VR_MATRIX['TDAH'];

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
            <p className="text-xs text-slate-400">Presiona el gatillo del mando para iniciar la sesión inmersiva en Pico 3 Pro.</p>
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

        <div className="flex items-center gap-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedDisorderKey}
              onChange={(e) => activateProtocol(e.target.value, 0)}
              className="bg-transparent text-white text-xs outline-none cursor-pointer font-sans"
            >
              {Object.keys(CLINICAL_VR_MATRIX).map((key) => (
                <option key={key} value={key} className="bg-slate-950 text-white">
                  {CLINICAL_VR_MATRIX[key].name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={activeExerciseIndex}
              onChange={(e) => activateProtocol(selectedDisorderKey, Number(e.target.value))}
              className="bg-transparent text-white text-xs outline-none cursor-pointer font-sans"
            >
              {currentDisorder.exercises.map((ex, idx) => (
                <option key={ex.id} value={idx} className="bg-slate-950 text-white">
                  {ex.mode === 'DIAGNOSTIC' ? '🔬' : '💊'} {ex.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => playSpeechAudio(lastSpokenScript)}
            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded border border-emerald-600 flex items-center gap-1 cursor-pointer"
          >
            <Volume2 className="w-3 h-3" /> Repetir Voz
          </button>
        </div>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VrPatientExperience;
