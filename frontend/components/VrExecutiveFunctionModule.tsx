import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Play, Square, Brain, X, 
  Zap, Target, Crosshair, Cpu, Activity, 
  RotateCcw, CheckCircle2, ShieldCheck, Maximize2, 
  Minimize2, Printer, Clock, Wifi, WifiOff
} from 'lucide-react';
import { PatientRecord } from '../types';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

type ExecutiveTask = 'RESPONSE_INHIBITION' | 'SUSTAINED_ATTENTION' | 'WORKING_MEMORY_NBACK';

interface TelemetryPoint {
  timeLabel: string;
  primaryVal: number;   // TR real (ms)
  secondaryVal: number; // Reclutamiento Frontal real (%)
}

export const VrExecutiveFunctionModule: React.FC<Props> = ({ patient, onClose }) => {
  const [executiveTask, setExecutiveTask] = useState<ExecutiveTask>('RESPONSE_INHIBITION');
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);

  // Estados de Interfaz
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Parámetros de Control (Enviados al Visor)
  const [binauralBetaHz, setBinauralBetaHz] = useState<number>(15.0); 
  const [taskDifficultyMs, setTaskDifficultyMs] = useState<number>(800); 
  
  // METRICAS 100% REALES (Solo se actualizan al recibir paquetes del casco)
  const [omissionErrors, setOmissionErrors] = useState<number>(0); 
  const [commissionErrors, setCommissionErrors] = useState<number>(0); 
  const [correctHits, setCorrectHits] = useState<number>(0);
  const [avgReactionTimeMs, setAvgReactionTimeMs] = useState<number>(0);
  const [frontalEngagementPct, setFrontalEngagementPct] = useState<number>(0); 
  
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [aiLogs, setAiLogs] = useState<string[]>([]);

  // -------------------------------------------------------------------------
  // RECEPTOR DE TELEMETRÍA VR REAL
  // -------------------------------------------------------------------------
  const patientId = patient?.id || 'PAC-8104';
  const { isConnected, lastPacket, transmit } = useVrTelemetryBridge('receiver', patientId, 'ExecutiveControl');

  // Lectura estricta de paquetes reales provenientes del casco VR
  useEffect(() => {
    if (sessionActive && lastPacket) {
      const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });

      // Actualizar variables únicamente con los datos enviados por la app en Unity/Unreal/WebXR
      if (lastPacket.reactionTimeMs !== undefined) setAvgReactionTimeMs(lastPacket.reactionTimeMs);
      if (lastPacket.omissions !== undefined) setOmissionErrors(lastPacket.omissions);
      if (lastPacket.commissions !== undefined) setCommissionErrors(lastPacket.commissions);
      if (lastPacket.habituationIndex !== undefined) setFrontalEngagementPct(lastPacket.habituationIndex);
      if (lastPacket.hits !== undefined) setCorrectHits(lastPacket.hits);

      // Agregar punto REAL a la curva neurofisiológica
      setTelemetryHistory(prev => [
        ...prev,
        {
          timeLabel: timeStr.substring(3, 8),
          primaryVal: lastPacket.reactionTimeMs || 0,
          secondaryVal: lastPacket.habituationIndex || 0
        }
      ]);

      // Feedback del motor de auditoría clínica
      setAiLogs(prev => [
        `[${timeStr}] TELEMETRÍA RECIBIDA: TR=${lastPacket.reactionTimeMs || 0}ms | Engagement=${lastPacket.habituationIndex || 0}%`,
        ...prev.slice(0, 8)
      ]);
    }
  }, [lastPacket, sessionActive]);

  // Cronómetro de sesión
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (sessionActive) {
      timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sessionActive]);

  // Transmitir ajustes de dificultad del médico hacia el casco VR
  useEffect(() => {
    if (sessionActive && isConnected) {
      transmit({
        targetDifficultyMs: taskDifficultyMs,
        binauralBetaHz: binauralBetaHz,
        autoPilot: aiAutoPilot
      });
    }
  }, [taskDifficultyMs, binauralBetaHz, aiAutoPilot, sessionActive, isConnected]);

  const handleStartSession = () => {
    setSessionActive(true);
    setSessionDuration(0);
    setShowResults(false);
    setIsFullscreen(false);
    setTelemetryHistory([]);
    setCorrectHits(0);
    setOmissionErrors(0);
    setCommissionErrors(0);
    setAvgReactionTimeMs(0);
    setFrontalEngagementPct(0);
    setAiLogs([`[SISTEMA] Escuchando puerto de telemetría VR para el paciente ${patientId}...`]);
  };

  const handleEndSession = async () => {
    setSessionActive(false);

    const sessionReport = {
      patientId: patientId,
      sessionData: {
        taskName: executiveTask,
        durationSeconds: sessionDuration,
        metrics: {
          avgReactionTimeMs: Math.floor(avgReactionTimeMs),
          omissions: omissionErrors,
          commissions: commissionErrors,
          frontalEngagementPct: Math.floor(frontalEngagementPct),
          binauralBetaHz: Number(binauralBetaHz.toFixed(1))
        },
        aiLogs,
        completedAt: new Date().toISOString()
      }
    };

    try {
      await fetch('/api/vr/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionReport)
      });
    } catch (error) {
      console.error("Error guardando reporte:", error);
    }
    
    setShowResults(true);
  };

  const getTaskTitle = (task: ExecutiveTask) => {
    const map = {
      'RESPONSE_INHIBITION': 'Inhibición de Respuesta (Go/No-Go TDAH)',
      'SUSTAINED_ATTENTION': 'Atención Sostenida (Vigilancia)',
      'WORKING_MEMORY_NBACK': 'Memoria de Trabajo Espacial (N-Back)'
    };
    return map[task];
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  const handlePrintIndividualReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Real VR — ${getTaskTitle(executiveTask)}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 25px; color: #0f172a; line-height: 1.5; }
          .header { border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #0369a1; }
          .subtitle { font-size: 12px; color: #64748b; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; }
          .card-value { font-size: 18px; font-weight: bold; color: #0f172a; }
          .card-label { font-size: 10px; color: #64748b; text-transform: uppercase; }
          .verdict { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; font-size: 12px; color: #166534; margin-top: 15px; }
          .logs { background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 8px; font-mono; font-size: 10px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Entrenamiento de Función Ejecutiva VR (Datos Biométricos Reales)</div>
          <div class="subtitle">Paciente: ${patientId} | Duración de Exposición: ${formatTime(sessionDuration)}</div>
        </div>
        <h3>1. MÉTRICAS CLÍNICAS REGISTRADAS</h3>
        <div class="grid">
          <div class="card"><div class="card-label">Aciertos (Foco)</div><div class="card-value">${correctHits}</div></div>
          <div class="card"><div class="card-label">Omisiones (Inatención)</div><div class="card-value">${omissionErrors}</div></div>
          <div class="card"><div class="card-label">Comisiones (Impulsividad)</div><div class="card-value">${commissionErrors}</div></div>
          <div class="card"><div class="card-label">Tiempo Reacción TR</div><div class="card-value">${Math.floor(avgReactionTimeMs)} ms</div></div>
        </div>
        <h3>2. DICTAMEN CLÍNICO DEDUCIDO</h3>
        <div class="verdict">
          <strong>Evaluación:</strong> Reclutamiento Prefrontal: ${Math.floor(frontalEngagementPct)}%. Latencia de respuesta media: ${Math.floor(avgReactionTimeMs)} ms.
        </div>
        <h3>3. LOGS DE AUDITORÍA CLOSED-LOOP</h3>
        <div class="logs">${aiLogs.map(l => `<div>${l}</div>`).join('')}</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const width = 800;
  const height = 180;
  const padding = 20;
  const maxPrimary = 1000;
  const maxSecondary = 100;

  const pointsPrimary = telemetryHistory.map((p, idx) => {
    const x = padding + (idx / Math.max(telemetryHistory.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (p.primaryVal / maxPrimary) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const pointsSecondary = telemetryHistory.map((p, idx) => {
    const x = padding + (idx / Math.max(telemetryHistory.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (p.secondaryVal / maxSecondary) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // VISTA 1: DASHBOARD DE RESULTADOS INDIVIDUALES
  if (showResults) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 lg:p-8 overflow-y-auto flex items-center justify-center">
        <div className={`bg-slate-950 border border-slate-800 text-white space-y-6 transition-all duration-300 shadow-2xl font-sans ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen p-6 rounded-none' : 'max-w-5xl w-full mx-auto p-6 rounded-2xl'}`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-sky-600 to-blue-600 rounded-2xl text-white shadow-lg"><ShieldCheck className="w-6 h-6" /></div>
              <div>
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">Función Ejecutiva VR <span className="px-2.5 py-0.5 text-[10px] font-mono bg-sky-950 text-sky-300 rounded-full border border-sky-500/40">DATOS REALES</span></h2>
                <p className="text-xs text-slate-400">Paciente: <strong className="text-slate-200">{patientId}</strong></p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"><Maximize2 className="w-5 h-5 text-cyan-300" /></button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><span className="text-[10px] text-slate-400 uppercase">Aciertos</span><div className="text-2xl font-black text-emerald-400">{correctHits}</div></div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><span className="text-[10px] text-slate-400 uppercase">Omisiones</span><div className="text-2xl font-black text-amber-400">{omissionErrors}</div></div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><span className="text-[10px] text-slate-400 uppercase">Comisiones</span><div className="text-2xl font-black text-rose-400">{commissionErrors}</div></div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><span className="text-[10px] text-slate-400 uppercase">Tiempo Reacción TR</span><div className="text-2xl font-black text-cyan-300">{Math.floor(avgReactionTimeMs)} ms</div></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className={`w-full bg-slate-950 rounded-xl border border-slate-800 p-2 ${isFullscreen ? 'h-64' : 'h-48'}`}>
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <line x1="20" y1="30" x2="780" y2="30" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="20" y1="90" x2="780" y2="90" stroke="#1e293b" strokeDasharray="3,3" />
                <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={pointsSecondary} />
                <polyline fill="none" stroke="#22d3ee" strokeWidth="3" points={pointsPrimary} />
              </svg>
            </div>
          </div>

          <div className="flex justify-between border-t border-slate-800 pt-4">
            <button onClick={handleStartSession} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold"><RotateCcw className="w-4 h-4 text-cyan-400"/> Nueva Sesión</button>
            <button onClick={handlePrintIndividualReport} className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg"><Printer className="w-4 h-4"/> Exportar Reporte PDF</button>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: CONSOLA EN VIVO DEL PROFESIONAL
  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden ${isFullscreen ? 'p-2' : 'p-4 lg:p-6'}`}>
      
      {/* HEADER */}
      <div className="h-16 border-b border-sky-900/50 bg-slate-900 flex items-center justify-between px-6 rounded-2xl shadow-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-blue-700 rounded-xl"><Cpu className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100">Consola del Profesional • Función Ejecutiva</h1>
            <p className="text-[10px] text-sky-300 font-mono">Paciente: {patientId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* ESTADO DE CONEXIÓN REAL DEL VISOR */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${
            isConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isConnected ? 'VR Conectado (En Vivo)' : 'Sin Señal VR'}</span>
          </div>

          <button onClick={handlePrintIndividualReport} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold"><Printer className="w-4 h-4" /> Reporte</button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700">{isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-300"/> : <Maximize2 className="w-4 h-4 text-cyan-300"/></button>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="flex-1 grid grid-cols-12 gap-4 mt-4 overflow-hidden">
        
        {/* IZQUIERDA */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-800 pb-2"><Crosshair className="w-4 h-4 inline mr-2 text-sky-400"/> Tarea Ejecutiva</h2>
            <select disabled={sessionActive} value={executiveTask} onChange={(e) => setExecutiveTask(e.target.value as ExecutiveTask)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white">
              <option value="RESPONSE_INHIBITION">Inhibición de Respuesta (Go/No-Go)</option>
              <option value="SUSTAINED_ATTENTION">Atención Sostenida (Vigilancia)</option>
              <option value="WORKING_MEMORY_NBACK">Memoria de Trabajo Espacial</option>
            </select>

            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3 mt-4">
              <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">Compromiso Frontal:</span><span className="text-sky-300">{Math.floor(frontalEngagementPct)}%</span></div>
              <div className="h-2 w-full bg-slate-900 rounded-full"><div style={{ width: `${frontalEngagementPct}%` }} className="h-full bg-sky-500 transition-all"/></div>
              <div className="flex justify-between text-[10px] font-bold mt-2"><span className="text-slate-400">Dificultad Objetivo:</span><span className="text-purple-400">{taskDifficultyMs} ms</span></div>
            </div>
          </div>
        </div>

        {/* CENTRO (GRÁFICAS Y TELEMETRÍA EN VIVO) */}
        <div className="col-span-12 lg:col-span-6 bg-[#020617] rounded-2xl border-2 border-slate-800 flex flex-col justify-between p-4">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <div className="bg-black/70 px-3 py-1.5 rounded-full border border-sky-500/30 text-xs font-mono text-sky-100"><Activity className={`w-3.5 h-3.5 inline mr-2 ${sessionActive ? 'animate-pulse text-sky-400' : ''}`}/> Telemetría Biométrica Reanimada</div>
            <div className="text-xs font-mono text-slate-400"><Clock className="w-3.5 h-3.5 inline text-sky-400"/> {formatTime(sessionDuration)}</div>
          </div>

          <div className="w-full my-auto space-y-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-300"><span className="text-cyan-400">■</span> TR Real: {Math.floor(avgReactionTimeMs)} ms</span>
              <span className="text-emerald-400"><span className="text-emerald-400">■</span> Frontal Real: {Math.floor(frontalEngagementPct)}%</span>
            </div>
            <div className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800 p-3">
              {telemetryHistory.length > 0 ? (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <line x1="20" y1="30" x2="780" y2="30" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="90" x2="780" y2="90" stroke="#1e293b" strokeDasharray="3,3" />
                  <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={pointsSecondary} />
                  <polyline fill="none" stroke="#22d3ee" strokeWidth="3" points={pointsPrimary} />
                </svg>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono italic">
                  A la espera de los primeros paquetes enviados desde el visor VR...
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-sky-900/50 rounded-xl p-3 grid grid-cols-4 gap-2 text-center font-mono">
            <div className="border-r border-slate-800"><span className="text-[8.5px] uppercase text-slate-400 block">Aciertos</span><div className="text-xl font-bold text-emerald-400">{correctHits}</div></div>
            <div className="border-r border-slate-800"><span className="text-[8.5px] uppercase text-slate-400 block">Omisiones</span><div className="text-xl font-bold text-amber-400">{omissionErrors}</div></div>
            <div className="border-r border-slate-800"><span className="text-[8.5px] uppercase text-slate-400 block">Comisiones</span><div className="text-xl font-bold text-rose-400">{commissionErrors}</div></div>
            <div><span className="text-[8.5px] uppercase text-slate-400 block">TR Promedio</span><div className="text-xl font-bold text-cyan-300">{Math.floor(avgReactionTimeMs)}ms</div></div>
          </div>
        </div>

        {/* DERECHA */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-800 pb-2"><Zap className="w-4 h-4 inline mr-2 text-sky-400"/> AI Coach</h2>
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] overflow-y-auto max-h-[300px] space-y-2">
              {aiLogs.length > 0 ? aiLogs.map((log, i) => <div key={i} className={`p-2 rounded border ${i===0 ? 'text-sky-300 border-sky-900/50' : 'text-slate-400 border-slate-800/60'}`}>{log}</div>) : <div className="text-slate-600 text-center mt-4">Sin registro de eventos.</div>}
            </div>
          </div>

          <div className="pt-4 space-y-2">
            {!sessionActive ? (
              <button onClick={handleStartSession} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl transition"><Play className="w-4 h-4 inline mr-2"/> Iniciar Monitoreo Real</button>
            ) : (
              <button onClick={handleEndSession} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition"><Square className="w-4 h-4 inline mr-2"/> Concluir Sesión VR</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
