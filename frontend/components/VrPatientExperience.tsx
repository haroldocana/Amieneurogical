// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF DEFINITIVO COMPLETO
// 240 Protocolos Clínicos DSM-5 • Soporte Nativo JPEG 360° y Videos MP4
// Ensayos Estandarizados (30 Trials) • Hard Stop Inmediato • Cero Pantallas Negras
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Target, VolumeX, Play, Volume2, Layers, Activity } from 'lucide-react';

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
  { id: 'TDAH', modId: 'MOD_NEURODEV', name: 'TDAH / Déficit de Atención', archetype: 'DOCTOR', environment: 'OFFICE', evalTest: "Conners CPT-3 (d')", treatTest: 'Neurofeedback SMR' },
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
      { id: `${d.id}_D1`, mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: `1. ${d.evalTest}: Freno Go/No-Go`, bgAudio: 'BROWN_NOISE', script: `Evaluación clínica de ${d.name}. Dispara únicamente a las esferas verdes y suprime el disparo ante rojas.` },
      { id: `${d.id}_D2`, mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: `2. ${d.name}: Tolerancia al Riesgo (BART)`, bgAudio: 'TENSION_DRUM', script: `Evaluación de riesgo en ${d.name}. Bombea el globo para sumar puntos o asegúralos antes de que explote.` },
      { id: `${d.id}_D3`, mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: `3. ${d.name}: Memoria de Trabajo Visuoespacial`, bgAudio: 'BETA_WAVES', script: `Evaluación ejecutiva. Apunta y dispara únicamente al cubo iluminado de mayor escala.` },
      { id: `${d.id}_D4`, mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: `4. ${d.name}: Toma de Decisiones y Conflicto`, bgAudio: 'HEARTBEAT', script: `Evaluación decisional. Selecciona rápidamente entre las dos opciones presentadas en el panel.` },
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
  const [activeParadigm, setActiveParadigm] = useState<InteractiveParadigm>('IDLE');
  const [wsOnline, setWsOnline] = useState(false);
  const [disorderTitle, setDisorderTitle] = useState('AMIE CDSS • EN ESPERA');
  const [lastSpokenScript, setLastSpokenScript] = useState('Sistema listo. Esperando inicio de sesión.');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const roomGroupRef = useRef<THREE.Group | null>(null);
  const interactiveGroupRef = useRef<THREE.Group | null>(null);
  const permanentAvatarRef = useRef<THREE.Group | null>(null);
  const hudMeshRef = useRef<THREE.Mesh | null>(null);
  const bgSphereMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const wsListRef = useRef<WebSocket[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgOscillatorRef = useRef<{ stop: () => void } | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());

  // Elementos de pantalla virtual para MP4
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
    cptActive: false,
    cptType: 'GO' as 'GO' | 'NOGO',
    stimulusOnsetTime: 0,
    trialTimer: 0,
    balloonPumps: 0,
    balloonMaxCap: 12,
    balloonScale: 1.0,
    activeCube: 0
  });

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

  // Carga de entornos 360° JPEG
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

  // Reproductor de video MP4
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

  // Parada dura inmediata (Hard Stop)
  const executeHardStop = useCallback((reason = 'Sesión Finalizada por el Médico') => {
    const t = trialStateRef.current;
    t.isActiveSession = false;
    t.paradigm = 'IDLE';
    t.cptActive = false;
    t.currentTrial = 0;

    stopProvocationMp4Video();

    if (bgOscillatorRef.current) {
      bgOscillatorRef.current.stop();
      bgOscillatorRef.current = null;
    }

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
    } else if (paradigm === 'EMDR_3D') {
      const emdr = new THREE.Mesh(
        new THREE.SphereGeometry(0.20, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 1.0 })
      );
      emdr.name = 'EMDR_SPHERE';
      group.add(emdr);
    }
  }, [stopProvocationMp4Video]);

  // Interacción de gatillo en mandos
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

    wsListRef.current.push(ws);
    return () => ws.close();
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

    // Pantalla de Cine Virtual Flotante para Videos MP4
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
    interactiveGroup.position.set(0.35, 1.25, -1.8);
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

    const c2 = renderer.xr.getController(1);
    c2.addEventListener('selectstart', handleTrigger);
    c2.add(buildLaser());
    scene.add(c2);

    try { container.appendChild(VRButton.createButton(renderer)); } catch (e) {}

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const now = Date.now();
      const trial = trialStateRef.current;

      if (!trial.isActiveSession || trial.paradigm === 'IDLE') {
        renderer.render(scene, camera);
        return;
      }

      if (trial.paradigm === 'CPT_3D' && interactiveGroupRef.current) {
        const sphere = interactiveGroupRef.current.getObjectByName('CPT_SPHERE') as THREE.Mesh;
        if (sphere) {
          if (!sphere.visible && now >= trial.trialTimer) {
            trial.currentTrial += 1;
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

      if (trial.paradigm === 'BART_3D' && interactiveGroupRef.current) {
        const balloon = interactiveGroupRef.current.getObjectByName('BART_BALLOON');
        if (balloon) {
          balloon.scale.lerp(new THREE.Vector3(trial.balloonScale, trial.balloonScale * 1.15, trial.balloonScale), 0.1);
        }
      }

      if (trial.paradigm === 'EMDR_3D' && interactiveGroupRef.current) {
        interactiveGroupRef.current.position.x = 0.35 + Math.sin(t * 2.5) * 0.95;
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
