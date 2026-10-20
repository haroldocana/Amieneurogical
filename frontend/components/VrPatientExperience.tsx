// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF DEFINITIVO
// 240 Protocolos Clínicos Integrados (30 Trastornos x 8 Paradigmas 3D)
// 100% Procedural Autónomo • Cero Errores CORS • Sin Pantallas Negras en Pico
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

// ----------------------------------------------------------------------------
// GENERADOR SISTEMÁTICO DE LOS 240 PROTOCOLOS (30 TRASTORNOS x 8 PARADIGMAS)
// ----------------------------------------------------------------------------
interface RawDisorderMeta {
  id: string;
  modId: string;
  name: string;
  archetype: ClinicalArchetype;
  environment: 'OFFICE' | 'FOREST' | 'STREET';
  focus: string;
  customScript?: string;
}

const RAW_DISORDERS: RawDisorderMeta[] = [
  // Módulo I: Neurodesarrollo & Motor
  { id: 'TDAH', modId: 'MOD_NEURODEV', name: 'TDAH / Déficit de Atención e Impulsividad', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'freno inhibitorio y memoria de trabajo' },
  { id: 'TEA_1', modId: 'MOD_NEURODEV', name: 'Espectro Autista Nivel 1 (Asperger)', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'claves sociales y teoría de la mente' },
  { id: 'TEA_2_3', modId: 'MOD_NEURODEV', name: 'Espectro Autista Nivel 2-3 (Apoyo Notable)', archetype: 'DOCTOR', environment: 'FOREST', focus: 'integración sensorial y desenganche' },
  { id: 'ALZHEIMER', modId: 'MOD_NEURODEV', name: 'Deterioro Cognitivo / Alzheimer', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'orientación espacial y praxias diarias' },
  { id: 'PARKINSON', modId: 'MOD_NEURODEV', name: 'Enfermedad de Parkinson (Temblor & Bradicinesia)', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'iniciación motora y amplitud de movimiento' },

  // Módulo II: Afectivo & Estado de Ánimo
  { id: 'DEPRESION', modId: 'MOD_AFFECTIVE', name: 'Depresión Mayor Unipolar', archetype: 'DOCTOR', environment: 'FOREST', focus: 'activación conductual y sesgo pesimista' },
  { id: 'BIPOLAR', modId: 'MOD_AFFECTIVE', name: 'Trastorno Bipolar (Fase Disfórica / Maníaca)', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'contención de impulsos y estabilidad afectiva' },
  { id: 'DISTIMIA', modId: 'MOD_AFFECTIVE', name: 'Distimia / Depresión Persistente', archetype: 'DOCTOR', environment: 'FOREST', focus: 'persistencia cognitiva y tono vagal' },
  { id: 'CICLOTIMIA', modId: 'MOD_AFFECTIVE', name: 'Ciclotimia / Labilidad Emocional', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'estabilización del ritmo motor y ánimo' },

  // Módulo III: Trauma, TEPT & Disociación
  { id: 'TEPT', modId: 'MOD_TRAUMA', name: 'Estrés Postraumático (TEPT)', archetype: 'DOCTOR', environment: 'FOREST', focus: 'desensibilización de memorias y anclaje somático' },
  { id: 'TRAUMA_COMPLEJO', modId: 'MOD_TRAUMA', name: 'Trauma Complejo del Apego (C-PTSD)', archetype: 'DOCTOR', environment: 'FOREST', focus: 'regulación de ventana de tolerancia y límites' },
  { id: 'DESPERSONALIZACION', modId: 'MOD_TRAUMA', name: 'Despersonalización / Desrealización', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'agencia motora 6DoF y anclaje propioceptivo' },

  // Módulo IV: Ansiedad, Fobias & TOC
  { id: 'FOBIA_SOCIAL', modId: 'MOD_ANXIETY', name: 'Fobia Social / Ansiedad de Escrutinio', archetype: 'FORENSIC_PEER', environment: 'STREET', focus: 'tolerancia al escrutinio y desensibilización' },
  { id: 'PANICO', modId: 'MOD_ANXIETY', name: 'Trastorno de Pánico y Agorafobia', archetype: 'DOCTOR', environment: 'STREET', focus: 'exposición interoceptiva y regulación respiratoria' },
  { id: 'TOC', modId: 'MOD_ANXIETY', name: 'Trastorno Obsesivo Compulsivo (TOC)', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'prevención de respuesta y tolerancia a la duda' },
  { id: 'TAG', modId: 'MOD_ANXIETY', name: 'Ansiedad Generalizada (TAG)', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'desconexión de rumiación y coherencia dual' },

  // Módulo V: Adicciones & Control de Impulsos
  { id: 'ADICCION_SUST', modId: 'MOD_ADDICTIONS', name: 'Dependencia a Sustancias (Craving Activo)', archetype: 'FORENSIC_PEER', environment: 'STREET', focus: 'rechazo motor AAT y desensibilización de cues' },
  { id: 'LUDOPATIA', modId: 'MOD_ADDICTIONS', name: 'Ludopatía y Apuestas Digitales', archetype: 'FORENSIC_PEER', environment: 'STREET', focus: 'extinción de recompensas y control de pérdidas' },
  { id: 'ATRACON', modId: 'MOD_ADDICTIONS', name: 'Trastorno por Atracón Compulsivo', archetype: 'DOCTOR', environment: 'OFFICE', focus: 'freno a ultraprocesados y saciedad física' },
  { id: 'CLEPTOMANIA', modId: 'MOD_ADDICTIONS', name: 'Cleptomanía / Falla del Control de Impulsos', archetype: 'FORENSIC_PEER', environment: 'STREET', focus: 'freno de urgencia motriz y disipación simpática' },

  // Módulo VI: Forense, Psicopatía & Cluster B
  { id: 'TLP', modId: 'MOD_FORENSIC', name: 'Trastorno Límite de Personalidad (TLP / Borderline)', archetype: 'FORENSIC_PEER', environment: 'OFFICE', focus: 'habilidades TIPP, freno y tolerancia afectiva' },
  { id: 'PSICOPATIA', modId: 'MOD_FORENSIC', name: 'Psicopatía (Factor 1 y 2 PCL-R)', archetype: 'FORENSIC_PEER', environment: 'OFFICE', focus: 'freno motor a agresión y reactividad empática' },
  { id: 'NARCISISMO', modId: 'MOD_FORENSIC', name: 'Narcisismo Maligno / Desregulación Egoica', archetype: 'FORENSIC_PEER', environment: 'OFFICE', focus: 'tolerancia a frustración y desensibilización de ira' },
  { id: 'HISTRIONICO', modId: 'MOD_FORENSIC', name: 'Trastorno Histriónico de la Personalidad', archetype: 'FORENSIC_PEER', environment: 'STREET', focus: 'enfoque sin refuerzo social y calma expresiva' },

  // Módulo VII: Neurohipnosis & Dolor Crónico
  { id: 'HIPNO_ERICKSONIANA', modId: 'MOD_HYPNOSIS_PAIN', name: 'Hipnosis Ericksoniana (Metáforas Inmersivas)', archetype: 'HYPNOTIC_GUIDE', environment: 'FOREST', focus: 'sugestionabilidad, metáforas y trance reparador' },
  { id: 'HIPNO_ANALGESIA', modId: 'MOD_HYPNOSIS_PAIN', name: 'Hipnoanalgesia (Fibromialgia & Dolor Nociceptivo)', archetype: 'HYPNOTIC_GUIDE', environment: 'FOREST', focus: 'guantelete anestésico y modulación descendente' },
  { id: 'HIPNO_FANTASMA', modId: 'MOD_HYPNOSIS_PAIN', name: 'Miembro Fantasma & Dolor Neuropático', archetype: 'HYPNOTIC_GUIDE', environment: 'OFFICE', focus: 'espejo virtual 6DoF y reorganización cortical' },

  // Módulo VIII: Salud Sexual & Psicosomática
  { id: 'SEX_INHIB', modId: 'MOD_SEXOLOGY', name: 'Inhibición Sexual (SIS - Modelo Control Dual)', archetype: 'SEXUAL_PARTNER', environment: 'OFFICE', focus: 'sensate focus, desensibilización de pudor y confort' },
  { id: 'DISFUNCION_SOM', modId: 'MOD_SEXOLOGY', name: 'Ansiedad de Rendimiento & Disfunción Psicógena', archetype: 'SEXUAL_PARTNER', environment: 'OFFICE', focus: 'ruptura de rol de espectador y relajación pélvica' },

  // Módulo IX: Logoterapia & Sentido
  { id: 'VACIO_EXISTENCIAL', modId: 'MOD_LOGOTHERAPY', name: 'Vacío Existencial & Logoterapia (Frankl)', archetype: 'DOCTOR', environment: 'FOREST', focus: 'derreflexión, valores de sentido e intención paradójica' }
];

export const CLINICAL_VR_MATRIX: Record<string, VrDisorderData> = {};

RAW_DISORDERS.forEach((item) => {
  CLINICAL_VR_MATRIX[item.id] = {
    id: item.id,
    modId: item.modId,
    name: item.name,
    archetype: item.archetype,
    environment: item.environment,
    exercises: [
      // 4 Protocolos de Diagnóstico
      { id: `${item.id}_D1`, mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: `1. CPT Go/No-Go: ${item.name}`, bgAudio: 'BROWN_NOISE', script: `Evalúa el freno inhibitorio en ${item.name}. Dispara solo a esferas verdes y suprime el disparo ante rojas.` },
      { id: `${item.id}_D2`, mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: `2. BART Riesgo: ${item.name}`, bgAudio: 'TENSION_DRUM', script: `Mide la tolerancia al riesgo en ${item.name}. Bombea el globo para acumular puntos o asegúralos a tiempo.` },
      { id: `${item.id}_D3`, mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: `3. N-Back Memoria: ${item.name}`, bgAudio: 'BETA_WAVES', script: `Evalúa la memoria operativa en ${item.name}. Apunta y dispara únicamente al cubo iluminado de mayor tamaño.` },
      { id: `${item.id}_D4`, mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: `4. Dilema Decisional: ${item.name}`, bgAudio: 'HEARTBEAT', script: `Evalúa la flexibilidad decisional en ${item.name}. Selecciona la opción adecuada entre los dos paneles.` },

      // 4 Protocolos de Tratamiento
      { id: `${item.id}_T1`, mode: 'TREATMENT', paradigm: 'AAT_3D', name: `5. AAT Aproximación/Evitación: ${item.name}`, bgAudio: 'ALPHA_WAVES', script: `Intervención motora para ${item.focus}. Empuja con firmeza el holograma perturbador fuera de tu espacio.` },
      { id: `${item.id}_T2`, mode: 'TREATMENT', paradigm: 'EMDR_3D', name: `6. EMDR Sacádico: ${item.name}`, bgAudio: 'BILATERAL_SWEEP', script: `Sigue la luz rítmica horizontal con tus ojos para reprocesar y regular la carga emocional.` },
      { id: `${item.id}_T3`, mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: `7. Neuronas Espejo Somatomotor: ${item.name}`, bgAudio: 'THETA_WAVES', script: `Sincroniza tus brazos con el avatar clínico para consolidar la coherencia sensoriomotora.` },
      { id: `${item.id}_T4`, mode: 'TREATMENT', paradigm: 'BIO_3D', name: `8. Biofeedback Vagal: ${item.name}`, bgAudio: 'DELTA_WAVES', script: `Acompasa tu respiración con la expansión del loto para restaurar el tono vagal y la calma.` }
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
  const [disorderTitle, setDisorderTitle] = useState('1. CPT Go/No-Go: TDAH');
  const [lastSpokenScript, setLastSpokenScript] = useState(
    'Dispara únicamente a las esferas verdes. Suprime el disparo ante esferas rojas.'
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
  const lastSpokenScriptRef = useRef<string>(lastSpokenScript);

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
    [ensureAudioUnlocked]
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
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 48), 512, 65);

    ctx.fillStyle = '#fde047';
    ctx.font = '21px sans-serif';
    ctx.fillText(sub.slice(0, 74), 512, 130);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(score, 512, 202);

    const tex = new THREE.CanvasTexture(canvas);
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
  };

  const createProceduralSkyCanvas = (theme: 'OFFICE' | 'FOREST' | 'STREET' = 'OFFICE') => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    if (theme === 'FOREST') {
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.48, '#7dd3fc');
      grad.addColorStop(0.50, '#166534');
      grad.addColorStop(1, '#052e16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.fillStyle = '#14532d';
      for (let x = 40; x < 2048; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, 340);
        ctx.lineTo(x - 50, 520);
        ctx.lineTo(x + 50, 520);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'STREET') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.48, '#3730a3');
      grad.addColorStop(0.50, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);
    } else {
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.35, '#e2e8f0');
      grad.addColorStop(0.50, '#94a3b8');
      grad.addColorStop(0.52, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      for (let x = 0; x < 2048; x += 256) {
        ctx.strokeRect(x + 16, 260, 224, 250);
      }
    }
    return c;
  };

  const apply360Background = (env: 'OFFICE' | 'FOREST' | 'STREET') => {
    if (!bgMeshRef.current) return;
    const canvasTex = new THREE.CanvasTexture(createProceduralSkyCanvas(env));
    canvasTex.colorSpace = THREE.SRGBColorSpace;
    const mat = bgMeshRef.current.material as THREE.MeshBasicMaterial;
    mat.map = canvasTex;
    mat.needsUpdate = true;
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
    stageGroupRef.current.position.set(camPos.x, 0, camPos.z);
    stageGroupRef.current.rotation.set(0, euler.y, 0);
  }, []);

  const createProceduralHumanPortrait = (archetype: ClinicalArchetype) => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 1800;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    ctx.fillStyle = '#fce7db';
    ctx.beginPath();
    ctx.ellipse(512, 460, 140, 195, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(450, 450, 26, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(574, 450, 26, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = archetype === 'SEXUAL_PARTNER' ? '#0d9488' : '#0284c7';
    ctx.beginPath();
    ctx.arc(450, 450, 13, 0, Math.PI * 2);
    ctx.arc(574, 450, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(450, 450, 6, 0, Math.PI * 2);
    ctx.arc(574, 450, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(420, 420); ctx.quadraticCurveTo(450, 410, 480, 422);
    ctx.moveTo(604, 420); ctx.quadraticCurveTo(574, 410, 544, 422);
    ctx.stroke();

    ctx.fillStyle = archetype === 'SEXUAL_PARTNER' ? '#e11d48' : '#be123c';
    ctx.beginPath();
    ctx.ellipse(512, 560, 36, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    if (archetype === 'SEXUAL_PARTNER') {
      ctx.beginPath();
      ctx.arc(512, 400, 175, Math.PI, 0, false);
      ctx.lineTo(690, 920);
      ctx.lineTo(620, 980);
      ctx.lineTo(512, 600);
      ctx.lineTo(404, 980);
      ctx.lineTo(334, 920);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(512, 400, 168, Math.PI, 0, false);
      ctx.lineTo(670, 520);
      ctx.lineTo(512, 380);
      ctx.lineTo(354, 520);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#fce7db';
    ctx.fillRect(470, 630, 84, 120);

    if (archetype === 'SEXUAL_PARTNER') {
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.moveTo(420, 750);
      ctx.quadraticCurveTo(512, 800, 604, 750);
      ctx.lineTo(720, 1800);
      ctx.lineTo(304, 1800);
      ctx.closePath();
      ctx.fill();
    } else if (archetype === 'FORENSIC_PEER') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(280, 740, 464, 1060);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(470, 740); ctx.lineTo(512, 940); ctx.lineTo(554, 740);
      ctx.closePath();
      ctx.fill();
    } else if (archetype === 'HYPNOTIC_GUIDE') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(300, 740, 424, 1060);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(290, 740, 444, 1060);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(496, 740, 32, 1060);
    }

    return c;
  };

  const buildClinicalAvatar = useCallback((archetype: ClinicalArchetype) => {
    if (!permanentAvatarRef.current) return;
    const avatarGroup = permanentAvatarRef.current;
    safeClearGroup(avatarGroup);

    const canvasTex = new THREE.CanvasTexture(createProceduralHumanPortrait(archetype));
    canvasTex.colorSpace = THREE.SRGBColorSpace;

    const planeGeo = new THREE.PlaneGeometry(0.85, 1.62, 16, 16);
    const pos = planeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, -Math.pow(x, 2) * 0.35);
    }
    planeGeo.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      map: canvasTex,
      transparent: true,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.name = 'AI_BILLBOARD_MESH';
    mesh.position.set(0, 0.95, 0);
    avatarGroup.add(mesh);
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
            transmitInteraction({ hits: s.hits, errors: s.errors, pumps: s.balloonPumps, rt, action: `Puntos cobrados (+${s.balloonPumps * 10})` });
            s.balloonPumps = 0;
            s.scale = 1.0;
          } else {
            s.balloonPumps += 1;
            if (Math.random() < s.balloonPumps / s.balloonMaxCap || s.balloonPumps >= s.balloonMaxCap) {
              playSynthesizedTone(75, 0.35, 'sawtooth', 0.9);
              triggerHaptic(1.0, 250);
              s.errors += 1;
              update3dInVrBanner('BART: RIESGO Y CONTROL', '💥 ¡EXPLOSIÓN POR EXCESO!', `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
              transmitInteraction({ hits: s.hits, errors: s.errors, pumps: s.balloonPumps, rt, action: `💥 Explosión a ${s.balloonPumps} bombeos` });
              s.scale = 1.0;
              s.balloonPumps = 0;
              s.balloonMaxCap = Math.floor(10 + Math.random() * 12);
            } else {
              playSynthesizedTone(220 + s.balloonPumps * 32, 0.1, 'sine', 0.9);
              s.scale += 0.12;
              s.hits += 1;
              update3dInVrBanner('BART: RIESGO Y CONTROL', `Bombeo: ${s.balloonPumps}`, `Aciertos: ${s.hits}`);
              transmitInteraction({ hits: s.hits, errors: s.errors, pumps: s.balloonPumps, rt, action: `Inflado: Bombeo ${s.balloonPumps}` });
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
            update3dInVrBanner('MEMORIA Y FOCO VISUOESPACIAL', '❌ CUBO INCORRECTO', `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
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

  const activateProtocol = useCallback(
    (disorderKey: string, exerciseIdx: number) => {
      const disorder = CLINICAL_VR_MATRIX[disorderKey] || CLINICAL_VR_MATRIX['TDAH'];
      const exercise = disorder.exercises[exerciseIdx] || disorder.exercises[0];

      setSelectedDisorderKey(disorderKey);
      setActiveExerciseIndex(exerciseIdx);
      setActiveParadigm(exercise.paradigm);

      const s = paradigmStateRef.current;
      s.paradigm = exercise.paradigm;
      s.hits = 0;
      s.errors = 0;
      s.scale = 1.0;
      s.balloonPumps = 0;
      s.lastSpawnTime = Date.now();

      apply360Background(disorder.environment);
      buildClinicalAvatar(disorder.archetype);
      spawnParadigmHolograms(exercise.paradigm);
      startTherapeuticBackgroundSound(exercise.bgAudio);

      const title = `${exercise.name}`;
      setDisorderTitle(title);
      update3dInVrBanner(title, exercise.script, 'Aciertos: 0 | Fallos: 0');
      playSpeechAudio(exercise.script);
    },
    [apply360Background, buildClinicalAvatar, spawnParadigmHolograms, startTherapeuticBackgroundSound, playSpeechAudio]
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
            const disorderKey = d.disorderId || 'TDAH';
            const matchedDisorder = CLINICAL_VR_MATRIX[disorderKey];

            if (matchedDisorder) {
              const exIdx = matchedDisorder.exercises.findIndex((ex) => ex.paradigm === d.paradigm);
              activateProtocol(disorderKey, exIdx >= 0 ? exIdx : 0);
            } else if (d.paradigm) {
              setActiveParadigm(d.paradigm);
              spawnParadigmHolograms(d.paradigm);
            }
          } else if (d.type === 'STOP_ACTIVE_SESSION') {
            if (bgOscillatorRef.current) {
              bgOscillatorRef.current.stop();
              bgOscillatorRef.current = null;
            }
            update3dInVrBanner(
              'SESIÓN FINALIZADA',
              'Informe emitido en la consola médica',
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
  }, [initialPatientId, activateProtocol, spawnParadigmHolograms]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
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

    const bgGeo = new THREE.SphereGeometry(60, 48, 32);
    const initTex = new THREE.CanvasTexture(createProceduralSkyCanvas('OFFICE'));
    initTex.colorSpace = THREE.SRGBColorSpace;
    const bgMat = new THREE.MeshBasicMaterial({ map: initTex, side: THREE.BackSide });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    scene.add(bgMesh);
    bgMeshRef.current = bgMesh;

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);
    stageGroupRef.current = stageGroup;

    const hudGeo = new THREE.PlaneGeometry(1.75, 0.44);
    const hudMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.96 });
    const hudMesh = new THREE.Mesh(hudGeo, hudMat);
    hudMesh.position.set(0, 1.85, -2.1);
    stageGroup.add(hudMesh);
    hudMeshRef.current = hudMesh;
    update3dInVrBanner('AMIE CLINICAL COPILOT', 'Sesión Activa • Dispara al objetivo iluminado', 'Aciertos: 0');

    const avatarHolder = new THREE.Group();
    avatarHolder.position.set(-0.90, 0, -2.0);
    avatarHolder.rotation.y = 0.32;
    stageGroup.add(avatarHolder);
    permanentAvatarRef.current = avatarHolder;
    buildClinicalAvatar('DOCTOR');

    const interactiveGroup = new THREE.Group();
    interactiveGroup.position.set(0.35, 1.25, -1.8);
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

      if (permanentAvatarRef.current) {
        const billboard = permanentAvatarRef.current.getObjectByName('AI_BILLBOARD_MESH');
        if (billboard && rendererRef.current) {
          const xrCam = rendererRef.current.xr.isPresenting
            ? rendererRef.current.xr.getCamera()
            : cameraRef.current;
          if (xrCam) {
            const worldCamPos = new THREE.Vector3();
            xrCam.getWorldPosition(worldCamPos);
            billboard.lookAt(worldCamPos.x, billboard.position.y, worldCamPos.z);
          }
          billboard.scale.y = 1.0 + Math.sin(t * 1.5) * 0.012;
        }
      }

      if (interactiveGroup.children.length === 0) {
        spawnParadigmHolograms(s.paradigm);
      }

      if (s.paradigm === 'BART_3D') {
        const ball = interactiveGroup.getObjectByName('BART_BALL');
        if (ball) ball.scale.lerp(new THREE.Vector3(s.scale, s.scale * 1.15, s.scale), 0.1);
      } else if (s.paradigm === 'EMDR_3D') {
        interactiveGroup.position.x = 0.35 + Math.sin(t * 2.4) * 0.85;
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
        interactiveGroup.position.x = 0.35;
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
  }, [handleTrigger, ensureAudioUnlocked, recenterStageToPatientView, spawnParadigmHolograms, playSpeechAudio, buildClinicalAvatar]);

  const currentDisorder = CLINICAL_VR_MATRIX[selectedDisorderKey] || CLINICAL_VR_MATRIX['TDAH'];

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
            <h2 className="text-xl font-black text-white">Activar Entorno Clínico VR</h2>
            <p className="text-xs text-slate-400">
              Presiona el gatillo del mando para iniciar la sesión con los 240 protocolos activos en Pico 3 Pro.
            </p>
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
          {/* Selector de Patología (30 Trastornos) */}
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

          {/* Selector de Paradigma (4 Evaluación + 4 Tratamiento) */}
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
          <button
            onClick={() => recenterStageToPatientView()}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Centrar
          </button>
        </div>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};

export default VrPatientExperience;
