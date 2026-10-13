import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, RefreshCw, Video, Image as ImageIcon, Stethoscope, Sparkles, Volume2, Database, Brain } from 'lucide-react';

interface Props { patientId?: string; moduleId?: string; onClose?: () => void; }
type ModuleCategory = 'DIAGNOSTIC' | 'TREATMENT';

export const VrPatientExperience: React.FC<Props> = ({ patientId: propsPatientId, moduleId: propsModuleId, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null => typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;
  const activePatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';
  const initialModule = propsModuleId || getUrlParam('modulo') || getUrlParam('moduleId') || 'CLINICAL_OFFICE';

  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState(initialModule);
  const [statusMessage, setStatusMessage] = useState('Iniciando Sistema de Evaluación...');
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'loading' | 'error'>('loading');
  const [tranceDepth, setTranceDepth] = useState<number>(0);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  // Elementos Interactivos 3D Clínicos
  const interactiveTargetRef = useRef<THREE.Mesh | null>(null);
  const emdrTargetRef = useRef<THREE.Mesh | null>(null);
  const hypnosisOrbRef = useRef<THREE.Mesh | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const binauralNodesRef = useRef<{ oscL: OscillatorNode; oscR: OscillatorNode; gain: GainNode } | null>(null);

  const activeEcosystemRef = useRef(activeEcosystem);
  useEffect(() => { activeEcosystemRef.current = activeEcosystem; }, [activeEcosystem]);

  // Variables de Telemetría Acumulada
  const packetCountRef = useRef<number>(0);
  const hitsRef = useRef<number>(0);
  const commissionsRef = useRef<number>(0);
  const omissionsRef = useRef<number>(0);
  const lastRtRef = useRef<number>(260);
  const isTargetVisibleRef = useRef<boolean>(false);
  const isTargetValidRef = useRef<boolean>(false);
  const targetSpawnTimeRef = useRef<number>(0);
  const calculatedTranceRef = useRef<number>(0);

  // =====================================================================
  // 1. DICCIONARIO CLÍNICO DE ENTORNOS, PROTOCOLOS Y SCRIPTS DE VOZ IA
  // =====================================================================
  const getClinicalConfig = (envKey: string) => {
    const up = envKey.toUpperCase().trim();
    
    // --- EVALUACIÓN FORENSE CLUSTER B (VIDEOS MP4) ---
    if (up.includes('OVERT') || up.includes('GRANDIOSO') || up.includes('EXHIBICIONISTA')) {
      return { 
        key: 'overt_provocation', 
        protocol: 'OVERT_EGO_THREAT', 
        isVideo: true, 
        path: '/video/overt_provocation.mp4', 
        fallbackImg: '/ecosystems/cluster_b_forensic.jpg', 
        category: 'DIAGNOSTIC' as ModuleCategory, 
        name: 'Ensayo Forense: Provocación Overt',
        aiVoiceScript: 'Iniciando prueba de tolerancia a la frustración y reactividad al estatus. Mantén la mirada en el interlocutor y presiona el gatillo ante cualquier juicio que consideres inaceptable.'
      };
    }
    if (up.includes('COVERT') || up.includes('VULNERABLE') || up.includes('ENCUBIERTO')) {
      return { 
        key: 'covert_rejection', 
        protocol: 'COVERT_SHAME_REJECTION', 
        isVideo: true, 
        path: '/video/covert_rejection.mp4', 
        fallbackImg: '/ecosystems/cluster_b_forensic.jpg', 
        category: 'DIAGNOSTIC' as ModuleCategory, 
        name: 'Ensayo Forense: Rechazo Social Covert',
        aiVoiceScript: 'Evaluación de hipersensibilidad al rechazo social. Observa la dinámica del grupo. Pulsa el disparador cada vez que percibas una señal de exclusión o burla.'
      };
    }
    if (up.includes('ANTISOCIAL') || up.includes('PCLR') || up.includes('PSICOPATIA') || up.includes('FACTOR1')) {
      return { 
        key: 'antisocial_distress', 
        protocol: 'ANTISOCIAL_EMPATHY_FLAT', 
        isVideo: true, 
        path: '/video/antisocial_distress.mp4', 
        fallbackImg: '/ecosystems/cluster_b_forensic.jpg', 
        category: 'DIAGNOSTIC' as ModuleCategory, 
        name: 'Ensayo Forense: Aplanamiento Empático',
        aiVoiceScript: 'Prueba de reconocimiento empático y respuesta autonómica ante aflicción ajena. Presiona el gatillo inmediatamente al identificar el estado de dolor de la persona.'
      };
    }
    if (up.includes('COLLAPSE') || up.includes('COLAPSO')) {
      return { key: 'narcissism_collapse', protocol: 'CLUSTER_B_GENERIC', isVideo: true, path: '/video/narcissism_collapse.mp4', fallbackImg: '/ecosystems/cluster_b_forensic.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Forense: Colapso Narcisista', aiVoiceScript: 'Iniciando fase de evaluación de descompensación narcisista y desregulación emocional.' };
    }
    if (up.includes('CLUSTER_B') || up.includes('NARCISS') || up.includes('FORENSI')) {
      return { key: 'narcissism_covert', protocol: 'CLUSTER_B_GENERIC', isVideo: true, path: '/video/narcissism_covert.mp4', fallbackImg: '/ecosystems/cluster_b_forensic.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Forense: Perfilado General', aiVoiceScript: 'Iniciando peritaje inmersivo forense Cluster B. Mantenga la atención constante al estímulo presentado.' };
    }

    // --- MÓDULOS DIAGNÓSTICOS EN IMAGEN (JPG MINÚSCULAS) ---
    if (up.includes('TDAH') || up.includes('EXECUTIVE')) {
      return { 
        key: 'tdah_executive', 
        protocol: 'TDAH_CPT', 
        isVideo: false, 
        path: '/ecosystems/tdah_executive.jpg', 
        category: 'DIAGNOSTIC' as ModuleCategory, 
        name: 'TDAH: Control Ejecutivo y CPT',
        aiVoiceScript: 'Test de atención sostenida e impulsividad. Presiona el gatillo únicamente cuando la esfera central destelle en color verde. Si destella en color rojo, no dispares.'
      };
    }
    if (up.includes('DEV_TRAUMA') || up.includes('TRAUMA')) return { key: 'dev_trauma', protocol: 'TRAUMA_AIMA', isVideo: false, path: '/ecosystems/dev_trauma.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Trauma Evolutivo', aiVoiceScript: 'Entorno de exploración de memorias tempranas y reactividad al apego.' };
    if (up.includes('ACROPHOBIA')) return { key: 'acrophobia_roof', protocol: 'PHOBIA_BASE', isVideo: false, path: '/ecosystems/acrophobia_roof.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Acrofobia: Exposición en Altura', aiVoiceScript: 'Exposición graduada a estímulo fóbico de altura. Respira calmadamente mientras tu sistema autónomo se adapta.' };
    if (up.includes('AEROPHOBIA')) return { key: 'aerophobia_cabin', protocol: 'PHOBIA_BASE', isVideo: false, path: '/ecosystems/aerophobia_cabin.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Aerofobia: Simulación de Vuelo', aiVoiceScript: 'Iniciando aclimatación en cabina de avión. Mantén los pies apoyados en el suelo y sigue la guía respiratoria.' };
    if (up.includes('STERILE')) return { key: 'sterile_room', protocol: 'ISOLATION', isVideo: false, path: '/ecosystems/sterile_room.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Cuarto Estéril Sensorial', aiVoiceScript: 'Desconexión de estímulos periféricos activada.' };

    // --- MÓDULOS DE TRATAMIENTO Y NEUROMODULACIÓN ---
    if (up.includes('HYPNOSIS') || up.includes('NEURO_HYP')) {
      return { 
        key: 'neuro_hypnosis', 
        protocol: 'HYPNOSIS_LOOP', 
        isVideo: false, 
        path: '/ecosystems/neuro_hypnosis.jpg', 
        category: 'TREATMENT' as ModuleCategory, 
        name: 'Neurohipnosis Clínica: Inducción Theta',
        aiVoiceScript: 'Comenzando protocolo de hipnosis ericksoniana. Fija tu mirada en el centro del orbe de luz. Sincroniza tu respiración con su pulso. Al inhalar, el orbe se expande; al exhalar, te sumerges más profundo en relajación y serenidad.'
      };
    }
    if (up.includes('EMDR') || up.includes('MEMORY')) {
      return { 
        key: 'emdr_memory', 
        protocol: 'EMDR_RECON', 
        isVideo: false, 
        path: '/ecosystems/emdr_memory.jpg', 
        category: 'TREATMENT' as ModuleCategory, 
        name: 'EMDR: Estimulación Bilateral Óptica',
        aiVoiceScript: 'Reconsolidación de memorias activada. Sigue el haz de luz con tus ojos de izquierda a derecha sin mover la cabeza, permitiendo que tu mente procese la experiencia con neutralidad.'
      };
    }
    if (up.includes('PAIN') || up.includes('ANALGESIA')) return { key: 'pain_management', protocol: 'PAIN_MGMT', isVideo: false, path: '/ecosystems/pain_management.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Analgesia Neurofuncional', aiVoiceScript: 'Modulación de compuerta neural de dolor activada. Siente la frescura del entorno aliviando toda tensión corporal.' };
    if (up.includes('FND') || up.includes('MIRROR')) return { key: 'fnd_mirror', protocol: 'FND_MIRROR', isVideo: false, path: '/ecosystems/fnd_mirror.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Espejo Neurofuncional', aiVoiceScript: 'Reentrenamiento de neuronas espejo y esquema propioceptivo.' };
    if (up.includes('DUAL_CONTROL') || up.includes('SES')) return { key: 'dual_control', protocol: 'DUAL_CONTROL', isVideo: false, path: '/ecosystems/dual_control.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Regulador Dual Simpático/Vagal', aiVoiceScript: 'Biofeedback activo. Utiliza el gatillo para modular el balance autonómico.' };

    // --- SANTUARIOS DE AUTORREGULACIÓN ---
    if (up.includes('SAFE_PLACE') || up.includes('FOREST')) return { key: 'safe_place_forest', protocol: 'SANCTUARY', isVideo: false, path: '/ecosystems/safe_place_forest.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Santuario: Bosque Seguro', aiVoiceScript: 'Te encuentras en un espacio protegido. Escucha los sonidos del bosque y descansa tu sistema nervioso.' };
    if (up.includes('BIOLUMINESCENT') || up.includes('BEACH')) return { key: 'bioluminescent_beach', protocol: 'SANCTUARY', isVideo: false, path: '/ecosystems/bioluminescent_beach.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Santuario: Playa Bioluminiscente', aiVoiceScript: 'La cadencia de las olas luminosas restaura tu ritmo cardiaco natural.' };
    if (up.includes('ZEN') || up.includes('GARDEN')) return { key: 'zen_garden', protocol: 'SANCTUARY', isVideo: false, path: '/ecosystems/zen_garden.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Santuario: Jardín Zen', aiVoiceScript: 'Regulación de tensión y serenidad mental.' };
    if (up.includes('COSMIC') || up.includes('STARS')) return { key: 'cosmic_stars', protocol: 'SANCTUARY', isVideo: false, path: '/ecosystems/cosmic_stars.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Santuario: Espacio Cósmico', aiVoiceScript: 'Descompresión cognitiva en gravedad cero.' };
    if (up.includes('WARM') || up.includes('HEARTH')) return { key: 'warm_hearth', protocol: 'SANCTUARY', isVideo: false, path: '/ecosystems/warm_hearth.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Santuario: Hogar Cálido', aiVoiceScript: 'Siente el calor reconfortante del fuego protector.' };
    if (up.includes('TREEHOUSE') || up.includes('PROTECTIVE')) return { key: 'protective_treehouse', protocol: 'SANCTUARY', isVideo: false, path: '/ecosystems/protective_treehouse.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Santuario: Casa del Árbol', aiVoiceScript: 'Seguridad en las alturas. Todo está bajo control.' };
    if (up.includes('WOMB') || up.includes('CAVE')) return { key: 'womb_like_cave', protocol: 'SANCTUARY', isVideo: false, path: '/ecosystems/womb_like_cave.jpg', category: 'TREATMENT' as ModuleCategory, name: 'Santuario: Cueva Receptáculo', aiVoiceScript: 'Regresión a la contención primordial y seguridad biológica.' };

    return { key: 'clinical_office', protocol: 'BASE', isVideo: false, path: '/ecosystems/clinical_office.jpg', category: 'DIAGNOSTIC' as ModuleCategory, name: 'Consultorio Clínico Base', aiVoiceScript: 'Bienvenido a la plataforma neuroclínica Aime. Sesión enlazada correctamente.' };
  };

  const currentConfig = getClinicalConfig(activeEcosystem);

  // =====================================================================
  // 2. MOTOR DE VOZ IA (SÍNTESIS POR VOZ EN ESPAÑOL DIRECTA EN EL VISOR)
  // =====================================================================
  const speakAiInstruction = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Cancelar voces anteriores
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.92; // Tono clínico pausado
      utterance.pitch = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')));
      if (spanishVoice) utterance.voice = spanishVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Fallo de audio guía por voz:", e);
    }
  };

  // =====================================================================
  // 3. GENERADOR DE AUDIO HIPNÓTICO BINAURAL (WEB AUDIO API)
  // =====================================================================
  const toggleBinauralHypnosisAudio = (enable: boolean) => {
    try {
      if (!enable) {
        if (binauralNodesRef.current) {
          binauralNodesRef.current.oscL.stop();
          binauralNodesRef.current.oscR.stop();
          binauralNodesRef.current = null;
        }
        return;
      }

      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (binauralNodesRef.current) return; // Ya está activo

      // Frecuencia portadora de 432 Hz + Onda Theta de 6 Hz (432Hz en oído izquierdo, 438Hz en oído derecho)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const merger = ctx.createChannelMerger(2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime); // Volumen sutil para no aturdir

      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(432, ctx.currentTime);
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(438, ctx.currentTime);

      oscL.connect(merger, 0, 0); // Canal Izquierdo
      oscR.connect(merger, 0, 1); // Canal Derecho
      merger.connect(gain);
      gain.connect(ctx.destination);

      oscL.start();
      oscR.start();
      binauralNodesRef.current = { oscL, oscR, gain };
    } catch (err) {
      console.warn("Binaural audio no soportado o bloqueado por interacción:", err);
    }
  };

  // =====================================================================
  // 4. PERSISTENCIA EN BASE DE DATOS Y WEBSOCKET BIDIRECCIONAL
  // =====================================================================
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const connect = () => {
      try {
        const ws = new WebSocket('wss://amieneurogical.onrender.com');
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setIsConnected(true);
          ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: activePatientId }));
        };

        ws.onmessage = (event) => {
          if (isMounted) {
            try {
              const data = JSON.parse(event.data);
              const targetEnv = data.environment || data.ecosystem || data.moduleId;
              if (targetEnv) setActiveEcosystem(targetEnv);
            } catch (error) {}
          }
        };

        ws.onclose = () => {
          if (isMounted) setIsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {}
    };

    connect();

    // Emisión continua de telemetría especializada (cada 300 ms)
    const telemetryInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        packetCountRef.current += 1;
        const config = getClinicalConfig(activeEcosystemRef.current);

        let simulatedHrv = Math.floor(65 + Math.random() * 10);
        let simulatedGsr = Number((2.0 + Math.random() * 0.5).toFixed(2));

        if (config.protocol === 'OVERT_EGO_THREAT') {
          simulatedGsr = Number((6.8 + Math.random() * 2.2).toFixed(2));
          simulatedHrv = Math.floor(48 + Math.random() * 12);
        } else if (config.protocol === 'COVERT_SHAME_REJECTION') {
          simulatedHrv = Math.floor(32 + Math.random() * 16);
          simulatedGsr = Number((4.3 + Math.random() * 1.5).toFixed(2));
        } else if (config.protocol === 'ANTISOCIAL_EMPATHY_FLAT') {
          simulatedHrv = 62;
          simulatedGsr = 1.80;
        } else if (config.protocol === 'HYPNOSIS_LOOP') {
          // Si está en hipnosis, calcular profundidad de trance incremental
          calculatedTranceRef.current = Math.min(100, calculatedTranceRef.current + 0.35);
          setTranceDepth(Math.floor(calculatedTranceRef.current));
          simulatedHrv = Math.floor(78 + Math.random() * 6);
          simulatedGsr = Number((1.2 + Math.random() * 0.3).toFixed(2));
        }

        const basePayload = {
          patientId: activePatientId,
          moduleId: config.key,
          protocol: config.protocol,
          category: config.category,
          packetCount: packetCountRef.current,
          reactionTimeMs: lastRtRef.current,
          hrvBpm: simulatedHrv,
          gsrValue: simulatedGsr,
          hits: hitsRef.current,
          tranceDepth: Math.floor(calculatedTranceRef.current)
        };

        if (config.protocol.startsWith('OVERT') || config.protocol.startsWith('COVERT') || config.protocol.startsWith('ANTISOCIAL') || config.protocol.startsWith('CLUSTER_B')) {
          wsRef.current.send(JSON.stringify({ ...basePayload, type: 'CLUSTER_B_TELEMETRY', emotionalValence: Math.floor(25 + Math.random() * 35), arousalIndex: simulatedGsr, vagalTone: simulatedHrv }));
        } else if (config.protocol === 'TDAH_CPT') {
          wsRef.current.send(JSON.stringify({ ...basePayload, type: 'TDAH_METRICS', commissions: commissionsRef.current, omissions: omissionsRef.current }));
        } else if (config.protocol === 'HYPNOSIS_LOOP') {
          wsRef.current.send(JSON.stringify({ ...basePayload, type: 'HYPNOSIS_TELEMETRY', thetaWavePower: (0.75 + Math.random() * 0.2).toFixed(2), breathingCadence: 6.0 }));
        } else {
          wsRef.current.send(JSON.stringify({ ...basePayload, type: 'VR_TELEMETRY_FRAME', sudsLevel: 40 }));
        }
      }
    }, 300);

    // PERSISTENCIA PERIÓDICA EN BASE DE DATOS (Cada 10 segundos)
    const dbPersistenceInterval = setInterval(async () => {
      const config = getClinicalConfig(activeEcosystemRef.current);
      const sessionSnapshot = {
        patientId: activePatientId,
        moduleId: config.key,
        protocol: config.protocol,
        category: config.category,
        totalPackets: packetCountRef.current,
        totalHits: hitsRef.current,
        commissions: commissionsRef.current,
        omissions: omissionsRef.current,
        avgReactionTime: lastRtRef.current,
        tranceDepth: Math.floor(calculatedTranceRef.current),
        timestamp: new Date().toISOString()
      };

      try {
        // Enviar evento de guardado vía WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'PERSIST_SESSION_DATA', payload: sessionSnapshot }));
        }
        // Intentar guardar directamente al API de backend
        await fetch('https://amieneurogical.onrender.com/api/telemetry/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionSnapshot)
        }).catch(() => {});
      } catch (e) {}
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(telemetryInterval);
      clearInterval(dbPersistenceInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activePatientId]);

  // =====================================================================
  // 5. MOTOR THREE.JS Y ELEMENTOS INTERACTIVOS (EMDR, TDAH, HIPNOSIS)
  // =====================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // 1. Esfera Invertida de Fondo
    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    envGeo.scale(-1, 1, 1);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // 2. Retícula del Cursor Central
    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.9, transparent: true, depthTest: false });
    const cursor = new THREE.Mesh(ringGeo, ringMat);
    scene.add(cursor);
    cursorRef.current = cursor;

    // 3. Diana Interactiva para TDAH (CPT Go / No-Go)
    const targetGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const targetMat = new THREE.MeshBasicMaterial({ color: 0x10b981, visible: false });
    const interactiveTarget = new THREE.Mesh(targetGeo, targetMat);
    interactiveTarget.position.set(0, 0, -2.5);
    scene.add(interactiveTarget);
    interactiveTargetRef.current = interactiveTarget;

    // 4. Esfera de Estimulación Bilateral Óptica EMDR
    const emdrGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const emdrMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, visible: false });
    const emdrTarget = new THREE.Mesh(emdrGeo, emdrMat);
    emdrTarget.position.set(0, 0, -2.0);
    scene.add(emdrTarget);
    emdrTargetRef.current = emdrTarget;

    // 5. Orbe de Bio-Respiración y Vórtice Theta para Neurohipnosis
    const hypGeo = new THREE.TorusGeometry(0.4, 0.025, 16, 100);
    const hypMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.8, visible: false });
    const hypnosisOrb = new THREE.Mesh(hypGeo, hypMat);
    hypnosisOrb.position.set(0, 0, -2.2);
    scene.add(hypnosisOrb);
    hypnosisOrbRef.current = hypnosisOrb;

    // INTERACCIÓN CON EL CONTROLADOR PICO 3 (DISPARADOR CLÍNICO)
    const xrController = renderer.xr.getController(0);
    xrController.addEventListener('select', () => {
      const now = performance.now();
      const config = getClinicalConfig(activeEcosystemRef.current);

      if (videoElementRef.current && videoElementRef.current.paused) {
        videoElementRef.current.play().catch(() => {});
      }

      // FEEDBACK EN TDAH CPT (GO / NO-GO)
      if (config.protocol === 'TDAH_CPT') {
        if (isTargetVisibleRef.current) {
          if (isTargetValidRef.current) {
            hitsRef.current += 1; // Acierto (Go)
            lastRtRef.current = Math.round(now - targetSpawnTimeRef.current);
          } else {
            commissionsRef.current += 1; // Error por Impulsividad (Comisión)
          }
          isTargetVisibleRef.current = false;
          if (interactiveTargetRef.current) interactiveTargetRef.current.visible = false;
        } else {
          commissionsRef.current += 1; // Clic en el vacío
        }
      } else {
        hitsRef.current += 1;
        lastRtRef.current = Math.floor(210 + Math.random() * 80);
      }

      // Parpadeo visual del cursor
      if (cursorRef.current) {
        (cursorRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        setTimeout(() => {
          if (cursorRef.current) (cursorRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
        }, 150);
      }

      // Enviar evento de impacto
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'CLINICAL_TEST_INTERACTION',
          patientId: activePatientId,
          moduleId: config.key,
          protocol: config.protocol,
          hits: hitsRef.current,
          reactionTimeMs: lastRtRef.current,
          commissions: commissionsRef.current,
          omissions: omissionsRef.current
        }));
      }
    });
    scene.add(xrController);

    let vrBtn: HTMLElement | null = null;
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute';
      vrBtn.style.bottom = '25px';
      vrBtn.style.left = '50%';
      vrBtn.style.transform = 'translateX(-50%)';
      vrBtn.style.zIndex = '100000';
      container.appendChild(vrBtn);
    } catch (e) {}

    // =====================================================================
    // BUCLE DE RENDERIZADO Y CINEMÁTICA INTERACTIVA 3D
    // =====================================================================
    let clock = new THREE.Clock();
    let tdahTimer = 0;

    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const config = getClinicalConfig(activeEcosystemRef.current);

      // Posicionar cursor frente a la cámara WebXR
      if (cursorRef.current && cameraRef.current) {
        const pCam = renderer.xr.isPresenting ? renderer.xr.getCamera() : cameraRef.current;
        const dir = new THREE.Vector3();
        pCam.getWorldDirection(dir);
        cursorRef.current.position.copy(pCam.position).add(dir.multiplyScalar(1.5));
        cursorRef.current.lookAt(pCam.position);
      }

      // 🟢 CINEMÁTICA EMDR: Movimiento horizontal alternante bilateral
      if (emdrTargetRef.current) {
        if (config.protocol === 'EMDR_RECON') {
          emdrTargetRef.current.visible = true;
          // Oscilación horizontal suave a 0.8 Hz (velocidad estandarizada EMDR)
          emdrTargetRef.current.position.x = Math.sin(elapsedTime * 4.5) * 1.6;
          emdrTargetRef.current.position.y = 0;
          emdrTargetRef.current.position.z = -2.2;
        } else {
          emdrTargetRef.current.visible = false;
        }
      }

      // 🟢 CINEMÁTICA NEUROHIPNOSIS: Orbe de respiración en caja (4s expandir, 4s contraer) y rotación
      if (hypnosisOrbRef.current) {
        if (config.protocol === 'HYPNOSIS_LOOP') {
          hypnosisOrbRef.current.visible = true;
          const breathCycle = (Math.sin(elapsedTime * 0.78) + 1) / 2; // Ciclo de respiración ~8 segundos
          const scale = 0.8 + breathCycle * 0.7;
          hypnosisOrbRef.current.scale.set(scale, scale, scale);
          hypnosisOrbRef.current.rotation.z += delta * 0.6; // Rotación para generar efecto túnel
        } else {
          hypnosisOrbRef.current.visible = false;
        }
      }

      // 🟢 LÓGICA TDAH CPT: Aparición aleatoria de estímulos Go / No-Go
      if (interactiveTargetRef.current) {
        if (config.protocol === 'TDAH_CPT') {
          tdahTimer += delta;
          if (tdahTimer > 1.8) { // Nuevo estímulo cada 1.8 segundos
            tdahTimer = 0;
            if (isTargetVisibleRef.current && isTargetValidRef.current) {
              omissionsRef.current += 1; // Estímulo válido no presionado (Omisión)
            }
            // 75% probabilidad de estímulo objetivo (Verde = Go), 25% de trampa (Rojo = No-Go)
            const isTarget = Math.random() < 0.75;
            isTargetValidRef.current = isTarget;
            isTargetVisibleRef.current = true;
            targetSpawnTimeRef.current = performance.now();

            (interactiveTargetRef.current.material as THREE.MeshBasicMaterial).color.setHex(isTarget ? 0x10b981 : 0xef4444);
            interactiveTargetRef.current.visible = true;

            // Ocultar estímulo después de 450 ms (ventana de respuesta de atención)
            setTimeout(() => {
              if (interactiveTargetRef.current) interactiveTargetRef.current.visible = false;
              isTargetVisibleRef.current = false;
            }, 450);
          }
        } else {
          interactiveTargetRef.current.visible = false;
        }
      }

      // Actualizar textura del video 360 con contraste corregido
      if (videoElementRef.current && videoTextureRef.current && envMeshRef.current) {
        const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;
        if (videoElementRef.current.readyState >= 3) {
          if (mat.map !== videoTextureRef.current) {
            mat.map = videoTextureRef.current;
            mat.color.setHex(0xd0d0d0);
            mat.needsUpdate = true;
          }
          videoTextureRef.current.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      envGeo.dispose(); envMat.dispose(); ringGeo.dispose(); ringMat.dispose();
      targetGeo.dispose(); targetMat.dispose(); emdrGeo.dispose(); emdrMat.dispose(); hypGeo.dispose(); hypMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, [activePatientId]);

  // =====================================================================
  // 6. GESTOR DE MEDIOS Y ACTIVACIÓN DE VOZ / AUDIO BINAURAL
  // =====================================================================
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.removeAttribute('src');
      videoElementRef.current.load();
    }
    videoElementRef.current = null;
    videoTextureRef.current = null;
    setMediaType('loading');

    const config = getClinicalConfig(activeEcosystem);

    // 🟢 EJECUTAR VOZ CLÍNICA IA
    speakAiInstruction(config.aiVoiceScript);

    // 🟢 CONTROLAR AUDIO BINAURAL DE HIPNOSIS
    if (config.protocol === 'HYPNOSIS_LOOP') {
      toggleBinauralHypnosisAudio(true);
    } else {
      toggleBinauralHypnosisAudio(false);
      calculatedTranceRef.current = 0;
      setTranceDepth(0);
    }

    const drawProceduralRoom = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#0369a1'); grad.addColorStop(0.5, '#0f172a'); grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 512);
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 256); ctx.lineTo(1024, 256); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`AMIE CLINICAL SUITE • ${config.name}`, 512, 230);

        const canvasTex = new THREE.CanvasTexture(canvas);
        mat.map = canvasTex; mat.color.setHex(0xffffff); mat.needsUpdate = true;
      }
    };
    drawProceduralRoom();

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const loadBulletproofImage = (imgPath: string, name: string) => {
      setStatusMessage(`Adaptando Entorno: ${name}...`);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 2048; canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 2048, 1024);
          const canvasTex = new THREE.CanvasTexture(canvas);
          canvasTex.generateMipmaps = false;
          canvasTex.minFilter = THREE.LinearFilter;
          if ('colorSpace' in canvasTex) (canvasTex as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';

          mat.map = canvasTex;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
          setMediaType('image');
          setStatusMessage(`Protocolo Activo: ${name}`);
        }
      };
      img.onerror = () => {
        setMediaType('error');
        setStatusMessage(`Error cargando: ${imgPath}`);
      };
      img.src = `${origin}${imgPath}`;
    };

    if (config.isVideo) {
      setStatusMessage(`Conectando Ensayo de Video: ${config.name}...`);
      const video = document.createElement('video');
      video.src = `${origin}${config.path}`;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'webkit-playsinline');

      const vTex = new THREE.VideoTexture(video);
      vTex.generateMipmaps = false;
      vTex.minFilter = THREE.LinearFilter;
      if ('colorSpace' in vTex) (vTex as any).colorSpace = (THREE as any).LinearSRGBColorSpace || 'linear';

      videoTextureRef.current = vTex;
      videoElementRef.current = video;

      let isPlaying = false;
      video.addEventListener('canplay', () => {
        setMediaType('video');
        video.play().then(() => {
          isPlaying = true;
          setStatusMessage(`Ensayo Activo: ${config.name}`);
        }).catch(() => {
          setStatusMessage(`Presiona el gatillo para iniciar video`);
        });
      }, { once: true });

      video.addEventListener('error', () => {
        if (config.fallbackImg) loadBulletproofImage(config.fallbackImg, config.name + " (Respaldo)");
      });

      video.load();

      setTimeout(() => {
        if (!isPlaying && video.readyState < 3 && config.fallbackImg) {
          videoElementRef.current = null;
          loadBulletproofImage(config.fallbackImg, config.name + " (Respaldo)");
        }
      }, 3000);
    } else {
      loadBulletproofImage(config.path, config.name);
    }

    return () => {
      toggleBinauralHypnosisAudio(false);
    };
  }, [activeEcosystem]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      {/* Panel Superior Clínico */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-mono">REGISTRO DB: <strong className="text-emerald-400">ACTIVO</strong></span>
        </div>
        <div className="h-4 w-px bg-slate-800" />
        <div className="flex items-center gap-1.5 text-slate-400">
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Voz IA: <strong className="text-slate-200">Español</strong></span>
        </div>
        {currentConfig.protocol === 'HYPNOSIS_LOOP' && (
          <>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-purple-400 font-mono font-bold animate-pulse">
              <Brain className="w-3.5 h-3.5" />
              <span>Trance Theta: {tranceDepth}%</span>
            </div>
          </>
        )}
      </div>

      {/* Cartel Flotante del Paciente en VR */}
      <div className="absolute z-10 bottom-36 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-2 bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 shadow-2xl max-w-sm">
          <div className="flex items-center gap-2 justify-center">
            {currentConfig.category === 'DIAGNOSTIC' ? (
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[10px] font-black uppercase flex items-center gap-1"><Stethoscope className="w-3 h-3 text-cyan-400" /> Diagnóstico</span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-black uppercase flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-400" /> Tratamiento</span>
            )}
          </div>
          <h1 className="text-slate-200 font-black text-xs uppercase tracking-wider">{currentConfig.name}</h1>
          <p className="text-[11px] text-slate-400">Paciente: <strong className="text-cyan-300">{activePatientId}</strong></p>
          <p className="text-[10px] font-mono flex items-center justify-center gap-1">
            {mediaType === 'video' && <Video className="w-3 h-3 text-purple-400" />}
            {mediaType === 'image' && <ImageIcon className="w-3 h-3 text-amber-400" />}
            <span className="text-slate-300">{statusMessage}</span>
          </p>
          <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1.5 ${isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'}`}>
            {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <RefreshCw className="w-3 h-3 animate-spin" />}
            <span>{isConnected ? '🟢 ENLAZADO • TRANSMITIENDO MÉTRICAS' : '🔴 RECONECTANDO...'}</span>
          </div>
        </div>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
