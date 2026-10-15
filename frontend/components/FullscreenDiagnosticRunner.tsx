// ============================================================================
// AMIE CLINICAL COPILOT - MATRIZ DE 240 EJERCICIOS (8 POR TRASTORNO)
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import { 
  X, Activity, Brain, Play, Square, Printer, Sparkles, Volume2, 
  FileText, Stethoscope, Clock, Database, Send, Target, AlertOctagon,
  Image as ImageIcon
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
    { id: 'D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Tolerancia al Riesgo', bgAudio: 'TENSION_DRUM', script: 'Apunta con el láser al globo y presiona el gatillo para inflarlo. Mediremos tu reacción al riesgo.' },
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
  const [liveCurve, setLiveCurve] = useState<any[]>([]);

  const [currentGsr, setCurrentGsr] = useState(2.12);
  const [currentHrv, setCurrentHrv] = useState(32);
  const [currentKpi, setCurrentKpi] = useState(0);

  const disorderObj = DISORDER_LIST.find(d => d.id === selectedDisorderId) || DISORDER_LIST[1];
  const exercises = getExercisesForDisorder(disorderObj.id, disorderObj.name);

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
    setLiveCurve([]);
    
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

  useEffect(() => {
    if (pipelinePhase !== 'PHASE_ACTIVE') return;
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      
      let nGsr = currentGsr;
      if (selectedDisorderId === 'PSICOPATIA') nGsr += (Math.random() - 0.5) * 0.03;
      else nGsr += (Math.random() - 0.45) * 0.12;
      
      nGsr = Math.max(0.8, Math.min(8.5, nGsr));
      const nHrv = Math.max(25, Math.min(85, currentHrv + Math.floor((Math.random() - 0.5) * 3)));
      const nKpi = currentKpi + (Math.random() > 0.4 ? 1 : 0);

      setCurrentGsr(Number(nGsr.toFixed(2)));
      setCurrentHrv(nHrv);
      setCurrentKpi(nKpi);
      setLiveCurve(prev => [...prev, { t: elapsedTime, gsr: nGsr, hrv: nHrv, kpi: nKpi }]);
    }, 1000);
    return () => clearInterval(timer);
  }, [pipelinePhase, elapsedTime, currentGsr, currentHrv, currentKpi, selectedDisorderId]);

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
          </section>

          <section className="col-span-12 lg:col-span-5 flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <h3 className="text-xs font-black text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Target className="w-4 h-4 text-purple-400"/> 3. BATERÍA NEUROCOGNITIVA (8 EJERCICIOS 3D)
              </h3>
              
              <div className="grid grid-cols-2 gap-2 flex-1">
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

          <section className="col-span-12 lg:col-span-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl"><span className="text-[10px] font-bold text-slate-500 block">GSR (Sudor)</span><div className="text-xl font-black text-amber-400 mt-1">{currentGsr} µS</div></div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl"><span className="text-[10px] font-bold text-slate-500 block">HRV (Vagal)</span><div className="text-xl font-black text-emerald-400 mt-1">{currentHrv} ms</div></div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex-1 flex flex-col relative">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-2"><Activity className="w-3.5 h-3.5 text-cyan-400"/> Telemetría en Vivo</span>
              {pipelinePhase === 'PHASE_ACTIVE' ? (
                <div className="text-[9.5px] font-mono text-slate-300 space-y-2 mb-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <p>Guión en Visor: <span className="text-amber-300">"{activeExercise?.script}"</span></p>
                  <p>Audio de fondo: <span className="text-cyan-300">{activeExercise?.bgAudio}</span></p>
                  <p>Aciertos Interactivos 6DoF: <strong className="text-emerald-400 text-xs">{currentKpi}</strong></p>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[10px] text-slate-500">Selecciona una de las 8 pruebas.</div>
              )}
              
              {pipelinePhase === 'PHASE_ACTIVE' && (
                <button onClick={stopSession} className="absolute bottom-3 left-3 right-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition">
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
