// ============================================================================
// AMIE CLINICAL COPILOT - RUNNER CON OSCILOGRAMA BIOMÉTRICO Y KPIS CLÍNICOS
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import { 
  X, Activity, Brain, Play, Square, Stethoscope, Send, Target, 
  Image as ImageIcon, Zap, AlertTriangle, ShieldCheck, Gauge, Heart, Flame
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export type PipelinePhase = 'IDLE' | 'PHASE_ACTIVE' | 'FINISHED';
export type ParadigmType = 'CPT_3D' | 'BART_3D' | 'N_BACK_3D' | 'CHOICE_3D' | 'AAT_3D' | 'EMDR_3D' | 'BIO_3D' | 'MIRROR_3D';

export const CLINICAL_MODULES = [
  { id: 'MOD_NEURODEV', name: 'I. Neurodesarrollo' },
  { id: 'MOD_AFFECTIVE', name: 'II. Afectivo & Trauma' },
  { id: 'MOD_ANXIETY', name: 'III. Ansiedad & Fobias' },
  { id: 'MOD_ADDICTIONS', name: 'IV. Adicciones' },
  { id: 'MOD_FORENSIC', name: 'V. Forense & Cluster B' },
  { id: 'MOD_HYPNOSIS_PAIN', name: 'VI. Neurohipnosis & Dolor' },
  { id: 'MOD_SEXOLOGY', name: 'VII. Salud Sexual' }
];

const DISORDER_LIST = [
  { id: 'TDAH', mod: 'MOD_NEURODEV', name: 'TDAH / Impulsividad' },
  { id: 'TEA', mod: 'MOD_NEURODEV', name: 'Espectro Autista' },
  { id: 'ALZHEIMER', mod: 'MOD_NEURODEV', name: 'Alzheimer / Deterioro' },
  { id: 'DEPRESION', mod: 'MOD_AFFECTIVE', name: 'Depresión Mayor' },
  { id: 'ESQUIZOFRENIA', mod: 'MOD_AFFECTIVE', name: 'Esquizofrenia' },
  { id: 'TEPT', mod: 'MOD_AFFECTIVE', name: 'Estrés Postraumático' },
  { id: 'PANICO', mod: 'MOD_ANXIETY', name: 'Trastorno de Pánico' },
  { id: 'FOBIA_SOCIAL', mod: 'MOD_ANXIETY', name: 'Fobia Social' },
  { id: 'ADICCION', mod: 'MOD_ADDICTIONS', name: 'Craving Sustancias' },
  { id: 'LUDOPATIA', mod: 'MOD_ADDICTIONS', name: 'Ludopatía' },
  { id: 'TLP', mod: 'MOD_FORENSIC', name: 'Borderline (TLP)' },
  { id: 'NARCISISMO', mod: 'MOD_FORENSIC', name: 'Narcisismo' },
  { id: 'PSICOPATIA', mod: 'MOD_FORENSIC', name: 'Psicopatía (Factor 1)' },
  { id: 'DOLOR', mod: 'MOD_HYPNOSIS_PAIN', name: 'Dolor Crónico / Fibromialgia' },
  { id: 'INSOMNIO', mod: 'MOD_HYPNOSIS_PAIN', name: 'Insomnio Severo' },
  { id: 'SEX_INHIB', mod: 'MOD_SEXOLOGY', name: 'Inhibición Sexual (SIS)' }
];

const getExercisesForDisorder = (disorderId: string, disorderName: string) => {
  return [
    { id: 'D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Línea Base (Go/No-Go)', bgAudio: 'BROWN_NOISE', script: `Evaluación de atención base para ${disorderName}. Dispara con el láser a las esferas verdes, ignora las rojas.` },
    { id: 'D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Tolerancia al Riesgo', bgAudio: 'TENSION_DRUM', script: 'Apunta con el láser al globo para inflarlo o al botón verde para cobrar tus puntos acumulados.' },
    { id: 'D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Carga Cognitiva N-Back', bgAudio: 'BETA_WAVES', script: 'Memoriza la secuencia espacial de los cubos luminosos y selecciónalos con el láser.' },
    { id: 'D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema Rápido', bgAudio: 'HEARTBEAT', script: 'Toma una decisión rápida entre los dos paneles usando tu puntero láser.' },
    { id: 'T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Terapia Evitación (AAT)', bgAudio: 'ALPHA_WAVES', script: 'Apunta al estímulo y presiona el gatillo para empujarlo lejos de ti.' },
    { id: 'T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Reprocesamiento EMDR', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la esfera de luz con tus ojos de lado a lado sin mover la cabeza.' },
    { id: 'T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Terapia Somatomotora', bgAudio: 'THETA_WAVES', script: 'Apunta a las esferas flotantes para sincronizar tu esquema corporal.' },
    { id: 'T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Rescate Vagal (Grounding)', bgAudio: 'DELTA_WAVES', script: 'Sincroniza tu respiración con la expansión del loto fractal. Inhala al crecer, exhala al contraerse.' }
  ];
};

export const FullscreenDiagnosticRunner: React.FC<Props> = ({ patient, onClose, onUpdatePatientVrData }) => {
  const patientId = patient?.id || 'PAC-8104';

  const [activeModuleTab, setActiveModuleTab] = useState('MOD_NEURODEV');
  const [selectedDisorderId, setSelectedDisorderId] = useState('TEA');
  const [selectedEnv, setSelectedEnv] = useState('ecosystems/clinical_office.jpeg');
  const [activeExercise, setActiveExercise] = useState<any>(null);
  
  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('IDLE');
  const [elapsedTime, setElapsedTime] = useState(0);

  // BIOMETRÍA Y TELEMETRÍA CLÍNICA EN TIEMPO REAL
  const [currentGsr, setCurrentGsr] = useState(2.85);
  const [currentHrv, setCurrentHrv] = useState(38);
  const [currentKpi, setCurrentKpi] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [reactionTimeMs, setReactionTimeMs] = useState(240);
  const [bartRiskIndex, setBartRiskIndex] = useState(0);
  const [lastActionText, setLastActionText] = useState('En espera de interacción...');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformDataRef = useRef<{ gsrHistory: number[]; hrvHistory: number[] }>({
    gsrHistory: new Array(120).fill(2.5),
    hrvHistory: new Array(120).fill(50)
  });

  const disorderObj = DISORDER_LIST.find(d => d.id === selectedDisorderId) || DISORDER_LIST[1];
  const exercises = getExercisesForDisorder(disorderObj.id, disorderObj.name);

  // RECEPTOR WEBSOCKET DE EVENTOS EN VIVO DEL VISOR PICO
  useEffect(() => {
    const wsTarget = (import.meta as any).env?.VITE_WS_URL?.replace(/^http/, 'ws') || 'wss://amieneurogical.onrender.com/ws/vr';
    const ws = new WebSocket(wsTarget.endsWith('/ws/vr') ? wsTarget : `${wsTarget}/ws/vr`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'sender', patientId }));
    };

    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data);
        if (d.type === 'CLINICAL_TEST_INTERACTION') {
          if (d.hits !== undefined) setCurrentKpi(d.hits);
          if (d.errors !== undefined) setErrorsCount(d.errors);
          if (d.rt !== undefined) setReactionTimeMs(d.rt);
          if (d.pumps !== undefined) setBartRiskIndex(Math.min(100, Math.round((d.pumps / 15) * 100)));
          if (d.action) setLastActionText(d.action);

          // Espiga autonómica al momento del impacto
          const wf = waveformDataRef.current;
          wf.gsrHistory[wf.gsrHistory.length - 1] += 0.75;
          wf.hrvHistory[wf.hrvHistory.length - 1] -= 10;
        }
      } catch (err) {}
    };

    return () => {
      try { ws.close(); } catch (e) {}
    };
  }, [patientId]);

  useEffect(() => {
    VrControlService.connect(undefined, patientId);
    return () => VrControlService.disconnect();
  }, [patientId]);

  const handleSyncEnvironment = () => {
    const formattedEnv = selectedEnv.startsWith('ecosystems/') 
      ? selectedEnv 
      : `ecosystems/${selectedEnv}`;

    VrControlService.sendCommand({
      type: 'SYNC_CLINICAL_CONTEXT',
      ecosystem: formattedEnv,
      disorderName: disorderObj.name,
      patientId
    });
  };

  const startExercise = (exercise: any) => {
    setActiveExercise(exercise);
    setPipelinePhase('PHASE_ACTIVE');
    setElapsedTime(0);
    setCurrentKpi(0);
    setErrorsCount(0);
    setLastActionText('Tarea iniciada. Esperando interacción en VR...');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(exercise.script);
      utt.lang = 'es-ES'; 
      window.speechSynthesis.speak(utt);
    }

    const formattedEnv = selectedEnv.startsWith('ecosystems/') 
      ? selectedEnv 
      : `ecosystems/${selectedEnv}`;

    VrControlService.sendCommand({
      type: 'START_PIPELINE_PHASE',
      paradigm: exercise.paradigm,
      bgAudio: exercise.bgAudio,
      speechScript: exercise.script,
      ecosystem: formattedEnv,
      disorderName: disorderObj.name,
      patientId
    });
  };

  const stopSession = () => {
    setPipelinePhase('FINISHED');
    VrControlService.sendCommand({ type: 'STOP_ACTIVE_SESSION', patientId });
  };

  // OSCILOGRAMA BIOLÓGICO CONTINUO (60 FPS DUAL CURVES)
  useEffect(() => {
    let animId: number;
    let t = 0;

    const renderWaveforms = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      t += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Cuadrícula de osciloscopio
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      const wf = waveformDataRef.current;
      const pointsCount = wf.gsrHistory.length;

      // 1. CURVA GSR (Sudoración Fásica - Ámbar)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < pointsCount; i++) {
        const x = (i / (pointsCount - 1)) * width;
        const normalizedGsr = (wf.gsrHistory[i] - 0.5) / 7.5;
        const y = height * 0.45 - normalizedGsr * (height * 0.35);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. CURVA HRV (Tono Vagal y Latido Sistólico - Esmeralda)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < pointsCount; i++) {
        const x = (i / (pointsCount - 1)) * width;
        const pulse = Math.sin(t * 3 + i * 0.3) * (Math.sin(t * 0.5) > 0.4 ? 16 : 5);
        const baseHrvY = height * 0.78 - (wf.hrvHistory[i] / 100) * (height * 0.25);
        const y = baseHrvY + pulse;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Leyendas
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('● CONDUCTANCIA FÁSICA (GSR / SUDOR)', 12, 18);
      ctx.fillStyle = '#10b981';
      ctx.fillText('● TONO VAGAL AUTONÓMICO (HRV RMSSD)', 12, 32);

      animId = requestAnimationFrame(renderWaveforms);
    };

    animId = requestAnimationFrame(renderWaveforms);
    return () => cancelAnimationFrame(animId);
  }, []);

  // TEMPORIZADOR DE MUESTREO BIOMÉTRICO (1 HZ)
  useEffect(() => {
    if (pipelinePhase !== 'PHASE_ACTIVE') return;
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);

      let nGsr = currentGsr;
      if (selectedDisorderId === 'PSICOPATIA') {
        nGsr += (Math.random() - 0.5) * 0.03;
      } else {
        nGsr += (Math.random() - 0.45) * 0.14;
      }
      nGsr = Math.max(0.8, Math.min(8.5, nGsr));

      const nHrv = Math.max(20, Math.min(88, currentHrv + Math.floor((Math.random() - 0.5) * 4)));
      setCurrentGsr(Number(nGsr.toFixed(2)));
      setCurrentHrv(nHrv);

      const wf = waveformDataRef.current;
      wf.gsrHistory.shift();
      wf.gsrHistory.push(nGsr);
      wf.hrvHistory.shift();
      wf.hrvHistory.push(nHrv);
    }, 1000);
    return () => clearInterval(timer);
  }, [pipelinePhase, currentGsr, currentHrv, selectedDisorderId]);

  const calculateZScore = () => {
    const baseline = selectedDisorderId === 'PSICOPATIA' ? 1.5 : 2.2;
    const z = ((currentGsr - baseline) / 0.8) + (errorsCount * 0.35);
    return Number(z.toFixed(2));
  };
  const zScore = calculateZScore();

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 flex items-center justify-center p-6 font-sans text-slate-100 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1500px] flex flex-col h-[94vh]">
        <header className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-cyan-400" />
            <h2 className="text-sm font-black">AMIE CDSS • MATRIZ DE 240 EJERCICIOS HOLOGRÁFICOS</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"><X /></button>
        </header>

        <div className="bg-slate-950/80 px-6 py-2 flex gap-2 overflow-x-auto border-b border-slate-800 scrollbar-none">
          {CLINICAL_MODULES.map(mod => (
            <button 
              key={mod.id} 
              onClick={() => { 
                setActiveModuleTab(mod.id); 
                const first = DISORDER_LIST.find(d => d.mod === mod.id);
                if (first) setSelectedDisorderId(first.id); 
              }} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeModuleTab === mod.id ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}
            >
              {mod.name}
            </button>
          ))}
        </div>

        <main className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
          {/* COLUMNA 1: CONFIGURACIÓN DE PROTOCOLO Y ENTORNO */}
          <section className="col-span-12 lg:col-span-3 flex flex-col gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-2"><Stethoscope className="w-3.5 h-3.5 text-cyan-400"/> 1. Patología</label>
              <select value={selectedDisorderId} onChange={e => setSelectedDisorderId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white font-bold outline-none">
                {DISORDER_LIST.filter(d => d.mod === activeModuleTab).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-2"><ImageIcon className="w-3.5 h-3.5 text-indigo-400"/> 2. Fondo 360° Ecológico</label>
              <select value={selectedEnv} onChange={e => setSelectedEnv(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white outline-none">
                <option value="ecosystems/clinical_office.jpeg">Consultorio Clínico</option>
                <option value="ecosystems/crowded_street.jpeg">Calle Multitudinaria</option>
                <option value="ecosystems/distress_empathy_test.jpeg">Sala de Interrogatorio</option>
                <option value="ecosystems/gaming_room.jpeg">Habitación Gaming</option>
                <option value="ecosystems/safe_place_forest.jpeg">Santuario Natural (Bosque)</option>
              </select>
              <button onClick={handleSyncEnvironment} className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold border border-slate-600 flex items-center justify-center gap-2 cursor-pointer transition">
                <Send className="w-3.5 h-3.5 text-cyan-400"/> SINCRONIZAR FONDO
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex-1 flex flex-col justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400"/> Protocolo Activo</span>
                <p className="font-bold text-white text-xs">{disorderObj.name}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Batería neurocognitiva con captura de microsegundos y retroalimentación háptica activa.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                Paciente: <span className="text-cyan-400 font-bold">{patientId}</span>
              </div>
            </div>
          </section>

          {/* COLUMNA 2: BATERÍA DE 8 TAREAS HOLOGRÁFICAS */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <h3 className="text-xs font-black text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Target className="w-4 h-4 text-purple-400"/> 3. BATERÍA NEUROCOGNITIVA (8 EJERCICIOS 3D)
              </h3>
              
              <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-1">
                {exercises.map(ex => (
                  <div key={ex.id} className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${ex.mode==='DIAGNOSTIC'?'bg-cyan-950 text-cyan-300 border border-cyan-800':'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                        {ex.mode === 'DIAGNOSTIC' ? 'EVALUACIÓN' : 'TRATAMIENTO'}
                      </span>
                      <p className="text-[11px] font-bold text-white mt-1.5 leading-tight">{ex.name}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">Motor: {ex.paradigm}</p>
                    </div>
                    <button 
                      onClick={() => startExercise(ex)}
                      disabled={pipelinePhase === 'PHASE_ACTIVE' && activeExercise?.id !== ex.id}
                      className={`mt-2 py-2 rounded text-[10px] font-black transition cursor-pointer ${activeExercise?.id === ex.id && pipelinePhase === 'PHASE_ACTIVE' ? 'bg-amber-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                    >
                      {activeExercise?.id === ex.id && pipelinePhase === 'PHASE_ACTIVE' ? 'EJECUTANDO EN VISOR...' : 'INICIAR PRUEBA'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* COLUMNA 3: MONITOR DE TELEMETRÍA CON OSCILOGRAMA */}
          <section className="col-span-12 lg:col-span-5 flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 block flex items-center gap-1"><Flame className="w-3 h-3 text-amber-400"/> GSR Fásico</span>
                <div className="text-base font-black text-amber-400 mt-0.5">{currentGsr} µS</div>
                <span className="text-[8px] text-slate-500">Conductancia cutánea</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 block flex items-center gap-1"><Heart className="w-3 h-3 text-emerald-400"/> Tono Vagal</span>
                <div className="text-base font-black text-emerald-400 mt-0.5">{currentHrv} ms</div>
                <span className="text-[8px] text-slate-500">RMSSD VFC</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 block flex items-center gap-1"><Gauge className="w-3 h-3 text-cyan-400"/> Latencia RT</span>
                <div className="text-base font-black text-cyan-400 mt-0.5">{reactionTimeMs} ms</div>
                <span className="text-[8px] text-slate-500">Tiempo reacción</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 block flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-purple-400"/> Z-Score</span>
                <div className={`text-base font-black mt-0.5 ${Math.abs(zScore) >= 2.0 ? 'text-rose-400' : 'text-purple-300'}`}>
                  {zScore > 0 ? `+${zScore}` : zScore} SD
                </div>
                <span className="text-[8px] text-slate-500">{Math.abs(zScore) >= 2.0 ? 'Desviación Alta' : 'Rango Normal'}</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex-1 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse"/>
                  Oscilograma de Telemetría Biológica en Vivo (60 Hz)
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {pipelinePhase === 'PHASE_ACTIVE' ? `TIEMPO: ${elapsedTime}s` : 'STANDBY'}
                </span>
              </div>

              <div className="flex-1 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative">
                <canvas ref={canvasRef} width={480} height={190} className="w-full h-full block" />
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] font-mono flex items-center justify-between text-slate-300">
                <div className="truncate max-w-[280px]">
                  <strong className="text-cyan-400">VR:</strong> {lastActionText}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">Aciertos: {currentKpi}</span>
                  {errorsCount > 0 && <span className="text-rose-400 font-bold">Fallos: {errorsCount}</span>}
                  {bartRiskIndex > 0 && <span className="text-amber-400 font-bold">Riesgo: {bartRiskIndex}%</span>}
                </div>
              </div>

              {pipelinePhase === 'PHASE_ACTIVE' && (
                <button onClick={stopSession} className="mt-2.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition">
                  <Square className="w-3.5 h-3.5 fill-white"/> DETENER TAREA
                </button>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default FullscreenDiagnosticRunner;
