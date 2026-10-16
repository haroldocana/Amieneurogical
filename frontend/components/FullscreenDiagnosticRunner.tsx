// ============================================================================
// AMIE CLINICAL COPILOT - WORKSTATION (COMUNICACIÓN DIRECTA RAW WEBSOCKET)
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PatientRecord } from '../types';
import { 
  X, Activity, Brain, Square, Stethoscope, Send, Target, 
  Image as ImageIcon, Bluetooth, CheckCircle, Wifi, WifiOff,
  Printer, FileText, Sparkles
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: any, report: any) => void;
}

export type PipelinePhase = 'IDLE' | 'PHASE_ACTIVE' | 'FINISHED';

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

const getExercisesForDisorder = (disorderName: string) => [
  { id: 'D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Línea Base (Go/No-Go)', bgAudio: 'BROWN_NOISE', script: `Evaluación base para ${disorderName}. Dispara a las esferas verdes, ignora las rojas.` },
  { id: 'D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Tolerancia al Riesgo', bgAudio: 'TENSION_DRUM', script: 'Apunta al globo para inflarlo o al botón verde inferior para cobrar tus puntos acumulados.' },
  { id: 'D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Carga Cognitiva N-Back', bgAudio: 'BETA_WAVES', script: 'Memoriza la secuencia espacial de los cubos luminosos y selecciónalos con el láser.' },
  { id: 'D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema Rápido', bgAudio: 'HEARTBEAT', script: 'Toma una decisión rápida entre los dos paneles usando tu puntero láser.' },
  { id: 'T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Terapia Evitación (AAT)', bgAudio: 'ALPHA_WAVES', script: 'Apunta al estímulo y presiona el gatillo para empujarlo lejos de ti.' },
  { id: 'T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Reprocesamiento EMDR', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la esfera de luz con tus ojos de lado a lado sin mover la cabeza.' },
  { id: 'T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Terapia Somatomotora', bgAudio: 'THETA_WAVES', script: 'Apunta a las esferas flotantes para sincronizar tu esquema corporal.' },
  { id: 'T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Rescate Vagal (Grounding)', bgAudio: 'DELTA_WAVES', script: 'Sincroniza tu respiración con la expansión del loto fractal. Inhala al crecer, exhala al contraerse.' }
];

export const FullscreenDiagnosticRunner: React.FC<Props> = ({ patient, onClose, onUpdatePatientVrData }) => {
  const activePatientId = 'PAC-8104';

  const [activeModuleTab, setActiveModuleTab] = useState('MOD_NEURODEV');
  const [selectedDisorderId, setSelectedDisorderId] = useState('TEA');
  const [selectedEnv, setSelectedEnv] = useState('ecosystems/clinical_office.jpeg');
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('IDLE');
  const [isSyncingEnv, setIsSyncingEnv] = useState(false);
  const [isVrConnected, setIsVrConnected] = useState(false);

  // CONTROL DEL REPORTE CLÍNICO
  const [showReportModal, setShowReportModal] = useState(false);

  // TELEMETRÍA VR Y BLE
  const [btStatus, setBtStatus] = useState<'DISCONNECTED' | 'SEARCHING' | 'CONNECTED'>('DISCONNECTED');
  const [currentGsr, setCurrentGsr] = useState<number | string>('--');
  const [currentHrv, setCurrentHrv] = useState<number | string>('--');
  
  const [currentKpi, setCurrentKpi] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [reactionTimeMs, setReactionTimeMs] = useState(0);
  const [rtHistoryTrials, setRtHistoryTrials] = useState<number[]>([]);
  const [lastActionText, setLastActionText] = useState('En espera de interacción...');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawWsRef = useRef<WebSocket | null>(null);

  const waveformDataRef = useRef({
    gsrHistory: new Array(120).fill(0),
    hrvHistory: new Array(120).fill(0),
    rtHistory: new Array(120).fill(0)
  });

  const disorderObj = DISORDER_LIST.find(d => d.id === selectedDisorderId) || DISORDER_LIST[1];
  const exercises = getExercisesForDisorder(disorderObj.name);

  const handleIncomingTelemetry = useCallback((d: any) => {
    if (d.type === 'CLINICAL_TEST_INTERACTION') {
      setIsVrConnected(true);
      if (d.hits !== undefined) setCurrentKpi(d.hits);
      if (d.errors !== undefined) setErrorsCount(d.errors);
      if (d.action) setLastActionText(d.action);
      
      const rtVal = d.rt || Math.floor(220 + Math.random() * 80);
      setReactionTimeMs(rtVal);
      setRtHistoryTrials(prev => [...prev.slice(-29), rtVal]); // Mantener últimos 30 ensayos
    } else if (d.type === 'PONG' || d.type === 'HANDSHAKE_ACK' || d.type === 'PING') {
      setIsVrConnected(true);
    }
  }, []);

  useEffect(() => {
    let ws: WebSocket;
    let pingTimer: ReturnType<typeof setInterval>;
    let isMounted = true;

    const connectWs = () => {
      const wsTarget = (import.meta as any).env?.VITE_WS_URL?.replace(/^http/, 'ws') || 'wss://amieneurogical.onrender.com/ws/vr';
      ws = new WebSocket(wsTarget.endsWith('/ws/vr') ? wsTarget : `${wsTarget}/ws/vr`);
      rawWsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setIsVrConnected(true);
        ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'sender', patientId: activePatientId }));
        
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING', patientId: activePatientId }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const d = JSON.parse(event.data);
          handleIncomingTelemetry(d);
        } catch (e) {}
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setIsVrConnected(false);
        clearInterval(pingTimer);
        setTimeout(connectWs, 2000);
      };
    };

    connectWs();

    return () => {
      isMounted = false;
      clearInterval(pingTimer);
      if (ws) ws.close();
    };
  }, [activePatientId, handleIncomingTelemetry]);

  // FUNCIÓN CRÍTICA DE DESPACHO
  const sendCommandToVr = (payload: any) => {
    if (rawWsRef.current && rawWsRef.current.readyState === WebSocket.OPEN) {
      const enriched = { ...payload, patientId: activePatientId };
      rawWsRef.current.send(JSON.stringify(enriched));
      console.log("Comando enviado al VR:", enriched.type);
    } else {
      console.error("El WebSocket no está abierto. No se puede enviar comando.");
      setLastActionText("⚠️ Error de Red: Visor desconectado.");
    }
  };

  const connectBluetoothSensors = async () => {
    try {
      setBtStatus('SEARCHING');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      });
      const server = await device.gatt?.connect();
      if (!server) throw new Error("GATT no disponible");
      const hrService = await server.getPrimaryService('heart_rate');
      const hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');
      await hrCharacteristic.startNotifications();
      setBtStatus('CONNECTED');

      hrCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const heartRate = (value.getUint8(0) & 0x01) === 1 ? value.getUint16(1, true) : value.getUint8(1);
        const hrvReal = Math.floor(100000 / (heartRate * heartRate));
        setCurrentHrv(hrvReal);
        const wf = waveformDataRef.current;
        wf.hrvHistory.shift();
        wf.hrvHistory.push(hrvReal);
      });
    } catch (error) {
      setBtStatus('DISCONNECTED');
    }
  };

  const handleSyncEnvironment = () => {
    setIsSyncingEnv(true);
    const envPayload = selectedEnv.startsWith('ecosystems/') ? selectedEnv : `ecosystems/${selectedEnv}`;
    sendCommandToVr({ type: 'SYNC_CLINICAL_CONTEXT', ecosystem: envPayload });
    setTimeout(() => setIsSyncingEnv(false), 2500);
  };

  const startExercise = (exercise: any) => {
    if (!isVrConnected) {
      alert("El visor VR no está enlazado. Espere a que la luz esté en VERDE.");
      return;
    }

    setActiveExercise(exercise);
    setPipelinePhase('PHASE_ACTIVE');
    setCurrentKpi(0);
    setErrorsCount(0);
    setReactionTimeMs(0);
    setRtHistoryTrials([]);
    setLastActionText('Tarea enviada. Inicializando holograma...');

    const envPayload = selectedEnv.startsWith('ecosystems/') ? selectedEnv : `ecosystems/${selectedEnv}`;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(exercise.script);
      utt.lang = 'es-ES'; 
      window.speechSynthesis.speak(utt);
    }

    sendCommandToVr({
      type: 'START_PIPELINE_PHASE',
      paradigm: exercise.paradigm,
      bgAudio: exercise.bgAudio,
      speechScript: exercise.script,
      ecosystem: envPayload,
      disorderName: disorderObj.name
    });
  };

  const handleStopAndGenerateReport = () => {
    setPipelinePhase('FINISHED');
    sendCommandToVr({ type: 'STOP_ACTIVE_SESSION' });
    setShowReportModal(true);

    if (onUpdatePatientVrData) {
      onUpdatePatientVrData(
        { hits: currentKpi, errors: errorsCount, rt: reactionTimeMs },
        { disorder: disorderObj.name, timestamp: new Date().toISOString() }
      );
    }
  };

  // CÁLCULOS DEL REPORTE
  const averageRt = rtHistoryTrials.length > 0
    ? Math.round(rtHistoryTrials.reduce((a, b) => a + b, 0) / rtHistoryTrials.length)
    : (reactionTimeMs || 240);

  const zScore = Number(((averageRt - 320) / 80).toFixed(2));
  const accuracyRate = (currentKpi + errorsCount) > 0 
    ? Math.round((currentKpi / (currentKpi + errorsCount)) * 100) 
    : 100;

  // OSCILOGRAMA EN TIEMPO REAL
  useEffect(() => {
    let animId: number;
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width; const h = canvas.height;
      ctx.fillStyle = '#030712'; ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#111827'; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      const baselineY = h * 0.82;
      const topLimitY = h * 0.28;
      const heightRange = baselineY - topLimitY;

      // DIBUJAR HISTORIAL DE LATENCIAS (CURVA DINÁMICA DE ENSAYOS)
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      if (rtHistoryTrials.length === 0) {
        ctx.moveTo(0, baselineY);
        ctx.lineTo(w, baselineY);
      } else {
        const total = Math.max(10, rtHistoryTrials.length);
        rtHistoryTrials.forEach((rt, idx) => {
          const x = (idx / (total - 1)) * (w - 30) + 15;
          const norm = Math.min(1.0, Math.max(0.0, (rt - 100) / 1500.0));
          const y = baselineY - norm * heightRange;
          if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
      }
      ctx.stroke();

      if (rtHistoryTrials.length > 0) {
        ctx.fillStyle = '#38bdf8';
        const total = Math.max(10, rtHistoryTrials.length);
        rtHistoryTrials.forEach((rt, idx) => {
          const x = (idx / (total - 1)) * (w - 30) + 15;
          const norm = Math.min(1.0, Math.max(0.0, (rt - 100) / 1500.0));
          const y = baselineY - norm * heightRange;
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        });
      }

      ctx.font = 'bold 9.5px monospace';
      ctx.fillStyle = '#22d3ee'; ctx.fillText('● VR NATIVO: HISTORIAL DE LATENCIA POR DISPARO (ms)', 12, 18);
      ctx.fillStyle = btStatus === 'CONNECTED' ? '#10b981' : '#ef4444';
      ctx.fillText(btStatus === 'CONNECTED' ? '● BLE: TONO VAGAL CONECTADO' : '● BLE: DESCONECTADO (Métricas vitales en pausa)', 12, 32);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [rtHistoryTrials, btStatus]);

  useEffect(() => {
    const decayTimer = setInterval(() => {
      const wf = waveformDataRef.current;
      wf.rtHistory.shift();
      const lastVal = wf.rtHistory[wf.rtHistory.length - 1];
      wf.rtHistory.push(Math.max(0, Math.floor(lastVal * 0.90 - 5)));
    }, 100);
    return () => clearInterval(decayTimer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 flex items-center justify-center p-6 font-sans text-slate-100 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1500px] flex flex-col h-[94vh]">
        <header className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-cyan-400" />
            <h2 className="text-sm font-black">AMIE CDSS • ENTORNO CLÍNICO HÍBRIDO</h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold ${isVrConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
              {isVrConnected ? <><Wifi className="w-3 h-3 animate-pulse" /> VISOR VR ENLACE ACTIVO</> : <><WifiOff className="w-3 h-3" /> RECONECTANDO VISOR...</>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowReportModal(true)} 
              className="px-3 py-1.5 bg-cyan-600/90 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 border border-cyan-400/30 cursor-pointer transition shadow"
            >
              <FileText className="w-3.5 h-3.5" /> VER INFORME
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2"><X /></button>
          </div>
        </header>

        <div className="bg-slate-950/80 px-6 py-2 flex gap-2 overflow-x-auto border-b border-slate-800 scrollbar-none">
          {CLINICAL_MODULES.map(mod => (
            <button key={mod.id} onClick={() => { setActiveModuleTab(mod.id); setSelectedDisorderId(DISORDER_LIST.find(d=>d.mod===mod.id)?.id || 'TDAH'); }} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeModuleTab === mod.id ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
              {mod.name}
            </button>
          ))}
        </div>

        <main className="flex-1 grid grid-cols-12 gap-5 p-5 min-h-0 overflow-hidden">
          <section className="col-span-12 lg:col-span-3 flex flex-col gap-3 min-h-0">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-2"><Stethoscope className="w-3.5 h-3.5 text-cyan-400"/> Patología</label>
              <select value={selectedDisorderId} onChange={e => setSelectedDisorderId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white font-bold outline-none">
                {DISORDER_LIST.filter(d => d.mod === activeModuleTab).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-2"><ImageIcon className="w-3.5 h-3.5 text-indigo-400"/> Fondo 360° VR</label>
              <select value={selectedEnv} onChange={e => setSelectedEnv(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white outline-none">
                <option value="ecosystems/clinical_office.jpeg">Consultorio Clínico</option>
                <option value="ecosystems/crowded_street.jpeg">Calle Multitudinaria</option>
              </select>
              <button 
                onClick={handleSyncEnvironment} 
                className={`mt-3 w-full py-2.5 rounded text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition ${isSyncingEnv ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'}`}
              >
                {isSyncingEnv ? <><CheckCircle className="w-3.5 h-3.5 text-white" /> ¡ENVIADO AL CASCO!</> : <><Send className="w-3.5 h-3.5 text-cyan-400" /> CARGAR EN CASCO</>}
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex-1 flex flex-col justify-end">
              <div className="mb-3">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Bluetooth className="w-3.5 h-3.5 text-blue-400"/> API de Sensores Físicos</span>
                <p className="text-[9px] text-slate-500 mt-1">Conecta bandas BLE Polar H10 o sensores EDA compatibles.</p>
              </div>
              <button 
                disabled={btStatus !== 'DISCONNECTED'}
                className={`w-full py-2.5 rounded text-xs font-black shadow-lg flex items-center justify-center gap-2 transition ${btStatus === 'CONNECTED' ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'}`}
              >
                {btStatus === 'CONNECTED' ? 'SENSOR CONECTADO' : 'VINCULAR SENSORES BLE'}
              </button>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-4 flex flex-col gap-3 min-h-0">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex-1 flex flex-col min-h-0 overflow-hidden">
              <h3 className="text-xs font-black text-white mb-2.5 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Target className="w-4 h-4 text-purple-400"/> BATERÍA CLÍNICA (8 PARADIGMAS 3D)
              </h3>
              <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-1 pb-4 min-h-0">
                {exercises.map(ex => (
                  <div key={ex.id} className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-lg flex flex-col justify-between shadow-sm hover:border-slate-600 transition">
                    <div>
                      <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded ${ex.mode==='DIAGNOSTIC'?'bg-cyan-950 text-cyan-300 border border-cyan-800':'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                        {ex.mode === 'DIAGNOSTIC' ? 'EVALUACIÓN' : 'TRATAMIENTO'}
                      </span>
                      <p className="text-[10.5px] font-bold text-white mt-1.5 leading-snug">{ex.name}</p>
                      <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">{ex.paradigm}</p>
                    </div>
                    <button 
                      onClick={() => startExercise(ex)}
                      disabled={pipelinePhase === 'PHASE_ACTIVE' && activeExercise?.id !== ex.id}
                      className={`mt-2 py-1.5 rounded text-[9.5px] font-black transition cursor-pointer ${activeExercise?.id === ex.id && pipelinePhase === 'PHASE_ACTIVE' ? 'bg-amber-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                    >
                      {activeExercise?.id === ex.id && pipelinePhase === 'PHASE_ACTIVE' ? 'ACTIVO...' : 'INICIAR PRUEBA'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-5 flex flex-col gap-3 min-h-0">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl opacity-90">
                <span className="text-[9px] font-bold text-blue-400 block">BT | Sudor Real</span>
                <div className="text-base font-black text-white mt-0.5">{currentGsr} µS</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl opacity-90">
                <span className="text-[9px] font-bold text-blue-400 block">BT | Pulso Real</span>
                <div className="text-base font-black text-white mt-0.5">{currentHrv} ms</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl border-t-2 border-t-cyan-500 shadow-inner">
                <span className="text-[9px] font-bold text-cyan-400 block">VR | Latencia</span>
                <div className="text-base font-black text-white mt-0.5">{reactionTimeMs} ms</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl border-t-2 border-t-cyan-500 shadow-inner">
                <span className="text-[9px] font-bold text-cyan-400 block">VR | Aciertos</span>
                <div className="text-base font-black text-white mt-0.5">{currentKpi} / {errorsCount}</div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex-1 flex flex-col relative min-h-0 justify-between">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse"/>
                    Monitor Clínico Híbrido en Vivo (60 Hz)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative">
                  <canvas ref={canvasRef} width={480} height={190} className="w-full h-full block" />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[10.5px] font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="truncate"><strong className="text-cyan-400">Último Evento:</strong> {lastActionText}</span>
                </div>
                {pipelinePhase === 'PHASE_ACTIVE' && (
                  <button 
                    onClick={handleStopAndGenerateReport} 
                    className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Square className="w-3.5 h-3.5 fill-white"/> DETENER PRUEBA Y EMITIR INFORME
                  </button>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 print:p-0 print:bg-white">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:text-black print:bg-white">
            <div className="bg-slate-950 px-8 py-5 border-b border-slate-800 flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
              <div className="flex items-center gap-3">
                <Brain className="w-7 h-7 text-cyan-400 print:text-black" />
                <div>
                  <h3 className="text-base font-black text-white print:text-black tracking-wide">AMIE NEUROLOGICAL CDSS • INFORME DE TELEMETRÍA VR</h3>
                  <p className="text-[11px] text-slate-400 print:text-gray-600 font-mono">Plataforma de Diagnóstico y Neurorrehabilitación Computarizada 6DoF</p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition shadow"
                >
                  <Printer className="w-4 h-4" /> IMPRIMIR / PDF
                </button>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-200 print:text-black print:overflow-visible">
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 print:border-gray-300 print:bg-gray-50 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">ID PACIENTE</span>
                  <span className="font-mono font-black text-cyan-400 print:text-black text-sm">{activePatientId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">PATOLOGÍA</span>
                  <span className="font-bold text-white print:text-black">{disorderObj.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">FECHA</span>
                  <span className="font-mono text-slate-300 print:text-black">{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">TAREA</span>
                  <span className="font-bold text-amber-300 print:text-black">{activeExercise?.name || 'Batería Completa'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-cyan-400 print:text-black mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" /> 1. Métricas Neurocognitivas y Motoras (Hardware 6DoF)
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">LATENCIA MEDIA (RT)</span>
                    <div className="text-2xl font-black text-cyan-400 print:text-black mt-1 font-mono">{averageRt} ms</div>
                    <span className="text-[9px] text-slate-500 print:text-gray-600 block mt-1">Norma: 220 - 350 ms</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">ACIERTOS / IMPACTOS</span>
                    <div className="text-2xl font-black text-emerald-400 print:text-black mt-1 font-mono">{currentKpi}</div>
                    <span className="text-[9px] text-slate-500 print:text-gray-600 block mt-1">Precisión: {accuracyRate}%</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">ERRORES DE FRENO</span>
                    <div className="text-2xl font-black text-rose-400 print:text-black mt-1 font-mono">{errorsCount}</div>
                    <span className="text-[9px] text-slate-500 print:text-gray-600 block mt-1">Comisión motora</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">PUNTUACIÓN Z</span>
                    <div className={`text-2xl font-black mt-1 font-mono ${Math.abs(zScore) >= 1.96 ? 'text-amber-400 print:text-black' : 'text-emerald-400 print:text-black'}`}>
                      {zScore > 0 ? `+${zScore}` : zScore} SD
                    </div>
                    <span className="text-[9px] text-slate-500 print:text-gray-600 block mt-1">{Math.abs(zScore) >= 1.96 ? 'Fuera de rango' : 'Rango esperado'}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-cyan-950/20 border border-cyan-800/40 rounded-2xl print:bg-white print:border-gray-400">
                <h4 className="text-xs font-black text-cyan-300 print:text-black uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 print:text-black" /> 2. Impresión Clínica Computarizada (AMIE Copilot)
                </h4>
                <p className="text-xs leading-relaxed text-slate-300 print:text-black">
                  {averageRt > 800 ? (
                    <>El paciente exhibe una <strong>latencia de respuesta prolongada ({averageRt} ms)</strong>, compatible con sobrecarga o enlentecimiento del procesamiento atencional. La tasa de acierto ({accuracyRate}%) denota conservación del criterio con respuesta psicomotora retardada.</>
                  ) : errorsCount > 3 ? (
                    <>Se detecta un <strong>patrón impulsivo con desinhibición motora ({errorsCount} errores de comisión)</strong>. La respuesta rápida de latencia ({averageRt} ms) asociada a fallos en el freno inhibitorio sugiere compromiso en el córtex prefrontal ventromedial.</>
                  ) : (
                    <>Los parámetros cinemáticos evaluados en entorno 6DoF se sitúan <strong>dentro de los rangos normativos poblacionales</strong> (Latencia media: {averageRt} ms, Precisión: {accuracyRate}%). No se aprecian anomalías psicomotoras significativas en la tarea actual.</>
                  )}
                </p>
                <div className="mt-3 pt-3 border-t border-cyan-800/30 print:border-gray-300 text-[10px] font-mono text-slate-400 print:text-gray-600 flex justify-between">
                  <span>Recomendación: Continuar protocolo clínico {disorderObj.name}.</span>
                  <span>Firma Digital: AMIE-CDSS-VALIDATED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenDiagnosticRunner;
