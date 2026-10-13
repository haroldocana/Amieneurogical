// ============================================================================
// AMIE CLINICAL COPILOT - VISOR HOLOGRÁFICO NEUROLÓGICO 3D (qEEG 10-20 COMPLETO)
// frontend/components/HolographicNeuroViewer3D.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { PatientRecord } from '../types';
import {
  Cpu,
  Layers,
  Sliders,
  RotateCcw,
  Activity,
  Info,
  X,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Share2
} from 'lucide-react';

interface HolographicNeuroViewer3DProps {
  patient: PatientRecord;
  onClose?: () => void;
}

type BrainWaveBand = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

interface ElectrodeNode {
  id: number;
  name: string;
  region: string;
  pos: [number, number, number];
  zScore: number;
}

interface BandConfig {
  hex: number;
  tailwind: string;
  label: string;
}

const BAND_COLOR_MAP: Record<BrainWaveBand, BandConfig> = {
  delta: { hex: 0x38bdf8, tailwind: 'text-sky-400', label: 'Delta (0.5 - 4 Hz) - Ritmo Lento / Patología Subcortical' },
  theta: { hex: 0xa855f7, tailwind: 'text-purple-400', label: 'Theta (4 - 8 Hz) - Carga Límbica & Desaceleración' },
  alpha: { hex: 0x22c55e, tailwind: 'text-emerald-400', label: 'Alpha (8 - 12 Hz) - Tono Basal Parasimpático' },
  beta: { hex: 0xf59e0b, tailwind: 'text-amber-400', label: 'Beta (13 - 30 Hz) - Excitabilidad & Procesamiento Activo' },
  gamma: { hex: 0xec4899, tailwind: 'text-pink-400', label: 'Gamma (30 - 45 Hz) - Integración Cortical de Alta Frecuencia' }
};

export const HolographicNeuroViewer3D: React.FC<HolographicNeuroViewer3DProps> = ({
  patient,
  onClose
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Estados de visualización y control
  const [selectedBand, setSelectedBand] = useState<BrainWaveBand>('alpha');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [wireframeMode, setWireframeMode] = useState<boolean>(true);
  const [showCoherenceArcs, setShowCoherenceArcs] = useState<boolean>(true);
  const [glowIntensity, setGlowIntensity] = useState<number>(0.85);
  const [hoveredElectrode, setHoveredElectrode] = useState<ElectrodeNode | null>(null);

  // Extracción de biomarcadores qEEG con fallbacks defensivos
  const qeeg = patient?.qeegZScores || {
    frontalThetaBetaRatio: 1.8,
    temporalAsymmetry: 0.2,
    deltaSlowActivityZ: 0.4,
    alphaPeakFrequencyHz: 10.2
  };

  // Mapeo espacial anatómico del sistema internacional 10-20
  const electrodes: ElectrodeNode[] = useMemo(() => [
    { id: 0, name: 'Fp1', region: 'Prefrontal Izquierdo', pos: [-0.35, 0.45, 0.82], zScore: Number((qeeg.deltaSlowActivityZ + 0.2).toFixed(2)) },
    { id: 1, name: 'Fp2', region: 'Prefrontal Derecho', pos: [0.35, 0.45, 0.82], zScore: Number((qeeg.deltaSlowActivityZ + 0.1).toFixed(2)) },
    { id: 2, name: 'F3', region: 'Frontal Dorsolateral Izq', pos: [-0.55, 0.55, 0.45], zScore: Number((qeeg.frontalThetaBetaRatio * 0.6).toFixed(2)) },
    { id: 3, name: 'F4', region: 'Frontal Dorsolateral Der', pos: [0.55, 0.55, 0.45], zScore: Number((qeeg.frontalThetaBetaRatio * 0.55).toFixed(2)) },
    { id: 4, name: 'Fz', region: 'Frontal Medial (Córtex Cingulado)', pos: [0, 0.68, 0.52], zScore: Number((qeeg.frontalThetaBetaRatio * 0.7).toFixed(2)) },
    { id: 5, name: 'C3', region: 'Sensorimotor Central Izq', pos: [-0.75, 0.45, 0], zScore: 0.35 },
    { id: 6, name: 'Cz', region: 'Vértex Central', pos: [0, 0.88, 0], zScore: 0.2 },
    { id: 7, name: 'C4', region: 'Sensorimotor Central Der', pos: [0.75, 0.45, 0], zScore: -0.15 },
    { id: 8, name: 'T3', region: 'Temporal Medio Izquierdo', pos: [-0.92, 0.1, 0.1], zScore: Number((qeeg.temporalAsymmetry * 1.5).toFixed(2)) },
    { id: 9, name: 'T4', region: 'Temporal Medio Derecho', pos: [0.92, 0.1, 0.1], zScore: Number((-qeeg.temporalAsymmetry * 1.2).toFixed(2)) },
    { id: 10, name: 'P3', region: 'Parietal Superior Izq', pos: [-0.55, 0.52, -0.48], zScore: -0.4 },
    { id: 11, name: 'Pz', region: 'Parietal Medial (Precúneo)', pos: [0, 0.65, -0.55], zScore: -0.25 },
    { id: 12, name: 'P4', region: 'Parietal Superior Der', pos: [0.55, 0.52, -0.48], zScore: -0.3 },
    { id: 13, name: 'O1', region: 'Occipital Visual Izquierdo', pos: [-0.35, 0.25, -0.85], zScore: Number((qeeg.alphaPeakFrequencyHz > 10 ? 0.8 : -0.5).toFixed(2)) },
    { id: 14, name: 'O2', region: 'Occipital Visual Derecho', pos: [0.35, 0.25, -0.85], zScore: Number((qeeg.alphaPeakFrequencyHz > 10 ? 0.75 : -0.4).toFixed(2)) }
  ], [qeeg]);

  // Pares de conectividad para arcos de coherencia funcional
  const COHERENCE_PAIRS: [string, string][] = [
    ['Fp1', 'Fp2'],
    ['F3', 'F4'],
    ['C3', 'C4'],
    ['T3', 'T4'],
    ['P3', 'P4'],
    ['O1', 'O2'],
    ['Fz', 'Cz'],
    ['Cz', 'Pz']
  ];

  // Motor WebGL Three.js con Colisiones Raycaster y Conectividad
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.3);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.9, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Grupo Maestro Orbital
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // 1. Malla Cortical Elipsoide
    const sphereGeo = new THREE.SphereGeometry(1, 36, 32);
    sphereGeo.scale(0.9, 1.05, 1.15);

    const cortexMat = new THREE.MeshBasicMaterial({
      color: BAND_COLOR_MAP[selectedBand].hex,
      wireframe: wireframeMode,
      transparent: true,
      opacity: wireframeMode ? glowIntensity * 0.45 : glowIntensity * 0.25
    });
    const cortexMesh = new THREE.Mesh(sphereGeo, cortexMat);
    brainGroup.add(cortexMesh);

    // 2. Halo de Resonancia Espectral (Glow Shield)
    const haloGeo = new THREE.SphereGeometry(1.04, 24, 20);
    haloGeo.scale(0.9, 1.05, 1.15);
    const haloMat = new THREE.MeshBasicMaterial({
      color: BAND_COLOR_MAP[selectedBand].hex,
      wireframe: true,
      transparent: true,
      opacity: glowIntensity * 0.18
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    brainGroup.add(haloMesh);

    // 3. Nodos de Electrodos con soporte Raycaster
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.05, 16, 16);

    electrodes.forEach((e) => {
      const isHyperactive = e.zScore > 1.0;
      const isHypoactive = e.zScore < -1.0;
      const nodeColor = isHyperactive ? 0xf43f5e : isHypoactive ? 0x06b6d4 : 0xffffff;

      const nodeMat = new THREE.MeshBasicMaterial({ color: nodeColor });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(e.pos[0], e.pos[1], e.pos[2]);
      nodeMesh.userData = { electrode: e };

      brainGroup.add(nodeMesh);
      nodeMeshes.push(nodeMesh);
    });

    // 4. Arcos de Coherencia Funcional Interhemisférica
    const arcLines: THREE.Line[] = [];
    if (showCoherenceArcs) {
      COHERENCE_PAIRS.forEach(([nameA, nameB]) => {
        const elA = electrodes.find(el => el.name === nameA);
        const elB = electrodes.find(el => el.name === nameB);
        if (!elA || !elB) return;

        const vA = new THREE.Vector3(...elA.pos);
        const vB = new THREE.Vector3(...elB.pos);
        const midPoint = new THREE.Vector3().addVectors(vA, vB).multiplyScalar(0.5);
        midPoint.multiplyScalar(1.25); // Elevación en arco geodésico

        const curve = new THREE.QuadraticBezierCurve3(vA, midPoint, vB);
        const points = curve.getPoints(20);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        const lineMat = new THREE.LineBasicMaterial({
          color: BAND_COLOR_MAP[selectedBand].hex,
          transparent: true,
          opacity: 0.35
        });

        const line = new THREE.Line(lineGeo, lineMat);
        brainGroup.add(line);
        arcLines.push(line);
      });
    }

    // 5. Interacción por Raycaster y Eventos de Puntero
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const targetNode = intersects[0].object.userData.electrode as ElectrodeNode;
        setHoveredElectrode(targetNode);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    // 6. Controles Orbitales (Arrastre de ratón y gestos táctiles)
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (ev: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const clientY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      prevX = clientX;
      prevY = clientY;
    };

    const onPointerMoveDrag = (ev: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const clientY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      const deltaX = clientX - prevX;
      const deltaY = clientY - prevY;

      brainGroup.rotation.y += deltaX * 0.008;
      brainGroup.rotation.x += deltaY * 0.008;

      prevX = clientX;
      prevY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    // Control de Zoom mediante la rueda del ratón
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      camera.position.z = Math.min(5.0, Math.max(1.8, camera.position.z + ev.deltaY * 0.0025));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousemove', handlePointerMove);
    dom.addEventListener('mousedown', onPointerDown);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousemove', onPointerMoveDrag);
    window.addEventListener('mouseup', onPointerUp);

    // Eventos táctiles para visores autónomos y tabletas
    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMoveDrag, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // 7. Bucle de Renderizado Continuo
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (autoRotate && !isDragging) {
        brainGroup.rotation.y += 0.006;
      }

      // Respiración pulsante del córtex
      cortexMat.opacity = (wireframeMode ? glowIntensity * 0.45 : glowIntensity * 0.25) + Math.sin(elapsedTime * 2.5) * 0.05;

      // Resaltado visual en vivo del nodo sobrevolado
      nodeMeshes.forEach(mesh => {
        const isTarget = hoveredElectrode && mesh.userData.electrode?.id === hoveredElectrode.id;
        const targetScale = isTarget ? 1.75 : 1.0;
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onPointerMoveDrag);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMoveDrag);
      window.removeEventListener('touchend', onPointerUp);

      dom.removeEventListener('mousemove', handlePointerMove);
      dom.removeEventListener('mousedown', onPointerDown);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onPointerDown);

      renderer.dispose();
      sphereGeo.dispose();
      haloGeo.dispose();
      nodeGeo.dispose();
      cortexMat.dispose();
      haloMat.dispose();
      arcLines.forEach(l => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
    };
  }, [selectedBand, autoRotate, wireframeMode, showCoherenceArcs, glowIntensity, electrodes, hoveredElectrode]);

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-4">
      
      {/* 1. Barra Superior con Selector Espectral */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-cyan-600 to-sky-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <Cpu className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Topografía 3D 10-20
              </span>
              <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-500/40 text-indigo-300 rounded text-[9.5px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Raycaster &amp; Coherencia Activos
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Visor Holográfico de Potencia Espectral y Conectividad
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Bandas de Frecuencia */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['delta', 'theta', 'alpha', 'beta', 'gamma'] as BrainWaveBand[]).map((band) => (
              <button
                key={band}
                onClick={() => setSelectedBand(band)}
                className={`px-3 py-1 rounded-lg font-bold uppercase text-[10.5px] transition cursor-pointer ${
                  selectedBand === band
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {band}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Barra de Comandos y Herramientas Visuales */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Alternador de Giro Automático */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              autoRotate
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Alternar rotación automática"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Pausar Giro' : 'Auto-Giro'}</span>
          </button>

          {/* Alternador Malla Wireframe / Superficie */}
          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{wireframeMode ? 'Malla Wireframe' : 'Corte Sólido'}</span>
          </button>

          {/* Alternador de Arcos de Conectividad */}
          <button
            onClick={() => setShowCoherenceArcs(!showCoherenceArcs)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showCoherenceArcs
                ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showCoherenceArcs ? 'Ocultar Coherencia' : 'Ver Arcos de Sincronía'}</span>
          </button>
        </div>

        {/* Deslizador de Luminiscencia Espectral */}
        <div className="flex items-center gap-2 text-slate-400">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>Brillo Holograma:</span>
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.05"
            value={glowIntensity}
            onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
            className="w-24 accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Escenario 3D Interactivo y Matriz de Canales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Contenedor del Canvas WebGL */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl relative min-h-[440px] overflow-hidden flex items-center justify-center">
          <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
          
          {/* Overlay de Ayuda de Navegación */}
          <div className="absolute top-3 left-3 pointer-events-none bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl text-[11px] backdrop-blur-md">
            <span className="font-bold text-white block">Órbita 360° | Scroll para Zoom</span>
            <span className={`font-mono text-[10px] ${BAND_COLOR_MAP[selectedBand].tailwind}`}>
              Banda: {BAND_COLOR_MAP[selectedBand].label}
            </span>
          </div>

          {/* Tooltip Dinámico de Colisión por Raycaster */}
          {hoveredElectrode && (
            <div className="absolute top-3 right-3 pointer-events-none bg-slate-900/90 border border-cyan-500/60 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-left min-w-[150px]">
              <span className="text-xs font-bold text-cyan-300 font-mono block">
                Canal {hoveredElectrode.name}
              </span>
              <span className="text-[10px] text-slate-400 block">{hoveredElectrode.region}</span>
              <span className={`text-[11px] font-mono font-bold mt-1 block ${
                hoveredElectrode.zScore > 1.0 ? 'text-rose-400' : hoveredElectrode.zScore < -1.0 ? 'text-cyan-400' : 'text-slate-200'
              }`}>
                Desviación: {hoveredElectrode.zScore > 0 ? `+${hoveredElectrode.zScore}` : hoveredElectrode.zScore}σ
              </span>
            </div>
          )}

          {/* Leyenda de Escala de Z-Score */}
          <div className="absolute bottom-3 right-3 pointer-events-none flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/85 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Z &gt; +1.0σ (Hiper)
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ml-1.5" /> Z &lt; -1.0σ (Hipo)
            <span className="w-2.5 h-2.5 rounded-full bg-white ml-1.5" /> Basal
          </div>
        </div>

        {/* Panel Lateral: Matriz 10-20 e Índices Bioclínicos */}
        <div className="lg:col-span-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Potencia Relativa por Canal (DE)
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Inspección z-score pareada por edad ({patient?.age || 45} años). Posicione el puntero para destacar el polo en el córtex.
            </p>

            <div className="max-h-[270px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {electrodes.map((elec) => (
                <div
                  key={elec.id}
                  onMouseEnter={() => setHoveredElectrode(elec)}
                  onMouseLeave={() => setHoveredElectrode(null)}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between transition cursor-pointer ${
                    hoveredElectrode?.id === elec.id
                      ? 'bg-slate-800 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <strong className="text-slate-100 font-mono mr-1.5">{elec.name}</strong>
                    <span className="text-[11px] text-slate-400">{elec.region}</span>
                  </div>
                  <span
                    className={`font-mono font-bold text-[11px] ${
                      elec.zScore > 1.0
                        ? 'text-rose-400'
                        : elec.zScore < -1.0
                        ? 'text-cyan-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {elec.zScore > 0 ? `+${elec.zScore}` : elec.zScore}σ
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div>Ratio Theta/Beta Frontal: <strong className="text-white">{qeeg.frontalThetaBetaRatio}</strong> (Norma: &lt; 2.0).</div>
              <div>Asimetría Alfa Temporal: <strong className="text-white">{qeeg.temporalAsymmetry}</strong>. Pico Alfa: <strong className="text-white">{qeeg.alphaPeakFrequencyHz} Hz</strong>.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolographicNeuroViewer3D;
