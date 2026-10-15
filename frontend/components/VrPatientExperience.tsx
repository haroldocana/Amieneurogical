// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF NEXT-GEN (BATERÍA DE 8 MOTORES 3D)
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Database, Target, VolumeX, Play, X } from 'lucide-react';

export const VrPatientExperience: React.FC<{ patientId?: string, onClose?: () => void }> = ({ patientId, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [activeParadigm, setActiveParadigm] = useState('IDLE');
  const [hudStats, setHudStats] = useState('Apunta con el láser del mando y presiona el gatillo');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const bgMeshRef = useRef<THREE.Mesh | null>(null);
  const raycaster = useRef(new THREE.Raycaster());

  const audioContextRef = useRef<AudioContext | null>(null);
  const bgOscillatorRef = useRef<OscillatorNode | null>(null);

  const stateRef = useRef({ hits: 0, scale: 1.0, paradigm: 'IDLE', zOffset: -2.0, lastInteraction: 0 });

  // 1. REPRODUCTOR DE VOZ CLÍNICA ROBUSTO (BYPASS HTML5 AUDIO)
  const speakVoiceInstruction = (text: string) => {
    if (!text) return;
    try {
      const existing = document.getElementById('amie-tts-audio') as HTMLAudioElement;
      if (existing) { existing.pause(); existing.remove(); }
      const encoded = encodeURIComponent(text);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=es-ES&client=tw-ob`;
      const audioEl = document.createElement('audio');
      audioEl.id = 'amie-tts-audio';
      audioEl.src = audioUrl;
      audioEl.crossOrigin = 'anonymous';
      audioEl.volume = 1.0;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      audioEl.play().catch(() => {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'es-ES';
          window.speechSynthesis.speak(u);
        }
      });
    } catch (e) {}
  };

  // 2. SINTETIZADOR BINAURAL / AUDIO DE FONDO
  const startBackgroundAudio = (type: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) audioContextRef.current = new AudioCtx();
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

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

  // 3. RAYCASTING Y COLISIÓN CON LOS MANDOS 6DoF
  const handleTrigger = useCallback((event: any) => {
    if (!groupRef.current) return;
    const ctrl = event.target;
    const tempMat = new THREE.Matrix4().identity().extractRotation(ctrl.matrixWorld);
    raycaster.current.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
    raycaster.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMat);

    const hits = raycaster.current.intersectObjects(groupRef.current.children, true);
    if (hits.length > 0) {
      const s = stateRef.current;
      s.hits++;
      setHudStats(`¡Acierto 6DoF Registrado! (${s.hits})`);
      
      // Vibración háptica en el mando
      if (ctrl.inputSource?.gamepad?.hapticActuators?.[0]) {
        ctrl.inputSource.gamepad.hapticActuators[0].pulse(0.75, 60);
      }

      if (s.paradigm === 'BART_3D') s.scale += 0.15;
      else if (s.paradigm === 'AAT_3D') s.zOffset -= 0.5;
    }
  }, []);

  // 4. SINCRONIZACIÓN WEBSOCKET CON LA WORKSTATION
  useEffect(() => {
    const wsTarget = (import.meta as any).env?.VITE_WS_URL?.replace(/^http/, 'ws') || 'wss://amieneurogical.onrender.com/ws/vr';
    const ws = new WebSocket(wsTarget.endsWith('/ws/vr') ? wsTarget : `${wsTarget}/ws/vr`);

    ws.onopen = () => ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId }));

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === 'SYNC_CLINICAL_CONTEXT') {
        if (bgMeshRef.current && d.ecosystem) {
          const cleanPath = d.ecosystem.replace(/^\/+/, '');
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = `${window.location.origin}/${cleanPath}`;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 1024;
            canvas.getContext('2d')?.drawImage(img, 0, 0, 2048, 1024);
            (bgMeshRef.current!.material as THREE.MeshBasicMaterial).map = new THREE.CanvasTexture(canvas);
            (bgMeshRef.current!.material as THREE.MeshBasicMaterial).needsUpdate = true;
          };
        }
      } else if (d.type === 'START_PIPELINE_PHASE') {
        setActiveParadigm(d.paradigm);
        stateRef.current = { hits: 0, scale: 1.0, paradigm: d.paradigm, zOffset: -2.0, lastInteraction: Date.now() };
        if (groupRef.current) groupRef.current.clear();
        setHudStats(`Prueba Iniciada: ${d.paradigm}. Apunta al holograma con el láser.`);
        if (d.speechScript) speakVoiceInstruction(d.speechScript);
        if (d.bgAudio) startBackgroundAudio(d.bgAudio);
      } else if (d.type === 'STOP_ACTIVE_SESSION') {
        setActiveParadigm('IDLE');
        stateRef.current.paradigm = 'IDLE';
        if (groupRef.current) groupRef.current.clear();
        if (bgOscillatorRef.current) {
          try { bgOscillatorRef.current.stop(); } catch (err) {}
          bgOscillatorRef.current = null;
        }
        setHudStats('Sesión Finalizada');
      }
    };
    return () => ws.close();
  }, [patientId]);

  // 5. MOTOR THREE.JS CON OBJETOS EMISIVOS VISIBLES (SIN CRISTAL INVISIBLE)
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(0, 5, 2);
    scene.add(dir);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const bgGeo = new THREE.SphereGeometry(100, 60, 40);
    bgGeo.scale(-1, 1, 1);
    const bgMesh = new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    scene.add(bgMesh);
    bgMeshRef.current = bgMesh;

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const buildLaser = () => new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -5)]),
      new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2 })
    );

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

    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const s = stateRef.current;

      // Generar geometrías sólidas con emisión de luz (100% visibles)
      if (group.children.length === 0 && s.paradigm !== 'IDLE') {
        const solidNeon = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x0077aa,
          emissiveIntensity: 0.8,
          roughness: 0.2
        });

        if (s.paradigm === 'CPT_3D') {
          group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), solidNeon));
        } else if (s.paradigm === 'BART_3D') {
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0x831843, emissiveIntensity: 0.6 }));
          ball.name = 'BALL';
          group.add(ball);
        } else if (s.paradigm === 'N_BACK_3D') {
          for (let i = 0; i < 3; i++) {
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), solidNeon.clone());
            cube.position.set(i * 0.45 - 0.45, 0, 0);
            group.add(cube);
          }
        } else if (s.paradigm === 'CHOICE_3D') {
          const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.1), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d, emissiveIntensity: 0.8 }));
          p1.position.set(-0.55, 0, 0);
          const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.1), new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1e3a8a, emissiveIntensity: 0.8 }));
          p2.position.set(0.55, 0, 0);
          group.add(p1);
          group.add(p2);
        } else if (s.paradigm === 'AAT_3D') {
          group.add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 16, 80), solidNeon));
        } else if (s.paradigm === 'EMDR_3D') {
          group.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xaa00aa, emissiveIntensity: 1.0 })));
        } else if (s.paradigm === 'BIO_3D') {
          group.add(new THREE.Mesh(new THREE.TorusKnotGeometry(0.32, 0.08, 80, 16), solidNeon));
        } else if (s.paradigm === 'MIRROR_3D') {
          const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), solidNeon.clone());
          h1.position.set(-0.4, 0, 0);
          const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), solidNeon.clone());
          h2.position.set(0.4, 0, 0);
          group.add(h1);
          group.add(h2);
        }
      }

      // Animaciones de las dianas
      if (group.children.length > 0 && s.paradigm !== 'IDLE') {
        group.position.set(0, 1.3, s.zOffset);

        if (s.paradigm === 'BART_3D') {
          const ball = group.getObjectByName('BALL');
          if (ball) ball.scale.lerp(new THREE.Vector3(s.scale, s.scale * 1.15, s.scale), 0.1);
        } else if (s.paradigm === 'EMDR_3D') {
          group.position.x = Math.sin(t * 2.8) * 1.5;
        } else if (s.paradigm === 'BIO_3D') {
          const breath = 0.8 + Math.sin(t * Math.PI * 2 * 0.1) * 0.45;
          group.scale.set(breath, breath, breath);
          group.rotation.y += 0.01;
        } else if (s.paradigm === 'N_BACK_3D') {
          group.rotation.y += 0.005;
        }
      }

      renderer.render(scene, camera);
    });

    return () => renderer.setAnimationLoop(null);
  }, [handleTrigger]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative select-none">
      {!isAudioUnlocked && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-8">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center shadow-2xl max-w-sm">
            <VolumeX className="w-10 h-10 text-emerald-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-black text-white mb-2">Activar 6DoF y Audio</h2>
            <p className="text-xs text-slate-400 mb-6">Presiona el botón para habilitar las bocinas y los mandos láser.</p>
            <button 
              onClick={() => { 
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtx) audioContextRef.current = new AudioCtx();
                setIsAudioUnlocked(true); 
              }} 
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition"
            >
              <Play className="w-5 h-5 fill-white" /> INICIAR SESIÓN VR
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 text-xs text-white pointer-events-none">
        <Database className="text-cyan-400 w-4 h-4" /> 6DoF ACTIVO | <Target className="text-purple-400 w-4 h-4" /> TAREA: {activeParadigm}
      </div>

      {onClose && (
        <button onClick={onClose} className="absolute top-6 right-6 z-30 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white hover:bg-slate-800 transition">
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
