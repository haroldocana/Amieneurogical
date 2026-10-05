import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Play, Square, Video, Brain, X, 
  Zap, Target, Sparkles, Crosshair, Cpu,
  Activity, RotateCcw, CheckCircle2, ShieldCheck,
  Maximize2, Minimize2, Printer, FileText, Clock, Wifi
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
  primaryVal: number;   // Latencia TR (ms)
  secondaryVal: number; // Compromiso Prefrontal (%)
}

export const VrExecutiveFunctionModule: React.FC<Props> = ({ patient, onClose }) => {
  // Configuración de la Tarea
  const [executiveTask, setExecutiveTask] = useState<ExecutiveTask>('RESPONSE_INHIBITION');
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);

  // Control de Interfaz
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Parámetros Neurocognitivos
  const [binauralBetaHz, setBinauralBetaHz] = useState<number>(15.0); 
  const [taskDifficultyMs, setTaskDifficultyMs] = useState<number>(800); 
  
  // Métricas de Desempeño en Tiempo Real
  const [omissionErrors, setOmissionErrors] = useState<number>(0); 
  const [commissionErrors, setCommissionErrors] = useState<number>(0); 
  const [correctHits, setCorrectHits] = useState<number>(0);
  const [avgReactionTimeMs, setAvgReactionTimeMs] = useState<number>(260);
  const [frontalEngagementPct, setFrontalEngagementPct] = useState<number>(25); 
  
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [aiLogs, setAiLogs] = useState<string[]>([]);

  // Referencia mutable para el Simulador de Paciente (Evita bugs de React)
  const simRef = useRef({ hits: 0, omissions: 0, commissions: 0, tr: 260, frontal: 25 });

  // -------------------------------------------------------------------------
  // CONEXIÓN TELEMETRÍA VR
  // -------------------------------------------------------------------------
  const { transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', 'ExecutiveControl');

  // MOTOR DE SIMULACIÓN Y GRÁFICAS EN TIEMPO REAL
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (sessionActive) {
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });
        setSessionDuration(prev => prev + 1);
        
        const sim = simRef.current;

        // 1. SIMULADOR DE PACIENTE: Generar reacciones aleatorias
        if (Math.random() > 0.3) { // 70% probabilidad de evento por segundo
           const isGo = Math.random() > 0.3; // 70% Estímulo GO
           const reacts = Math.random() > 0.15; // 85% el paciente reacciona
           const reactMs = Math.floor(Math.random() * 300 + 200); // TR entre 200 y 500ms

           if (isGo) {
               if (reacts && reactMs <= taskDifficultyMs) {
                   sim.hits++;
                   sim.tr = reactMs;
                   sim.frontal = Math.min(98, sim.frontal + 2); // Sube compromiso
               } else {
                   sim.omissions++;
                   sim.frontal = Math.max(10, sim.frontal - 1); // Baja por inatención
               }
           } else {
               if (reacts) {
                   sim.commissions++; // Falla por impulsividad
                   sim.frontal = Math.max(10, sim.frontal - 2); 
               }
           }
        }

        // 2. SINCRONIZAR A LA UI
        setCorrectHits(sim.hits);
        setOmissionErrors(sim.omissions);
        setCommissionErrors(sim.commissions);
        setAvgReactionTimeMs(sim.tr);
        setFrontalEngagementPct(sim.frontal);

        // 3. ACTUALIZAR GRÁFICA SVG
        setTelemetryHistory(prev => [
          ...prev,
          {
            timeLabel: timeStr.substring(3, 8),
            primaryVal: sim.tr,
            secondaryVal: Math.floor(sim.frontal)
          }
        ]);

        // 4. INTELIGENCIA ARTIFICIAL AUTO-PILOT
        if (aiAutoPilot) {
           if (sim.hits > 0 && sim.hits % 6 === 0) {
               setTaskDifficultyMs(prev => Math.max(300, prev - 40));
               setBinauralBetaHz(prev => Math.min(25.0, prev + 0.4));
               if (Math.random() > 0.5) {
                   setAiLogs(prev => [
                     `[${timeStr}] 🧠 NEUROPLASTICIDAD: Aumento de foco atencional. Latencia exigida: ${taskDifficultyMs}ms | Estimulación Beta: ${binauralBetaHz.toFixed(1)}Hz.`,
                     ...prev.slice(0, 8)
                   ]);
               }
           }
           if (sim.commissions > 0 && sim.commissions % 3 === 0) {
               setTaskDifficultyMs(prev => Math.min(1200, prev + 80));
               setBinauralBetaHz(prev => Math.max(12.0, prev - 0.4));
               if (Math.random() > 0.5) {
                   setAiLogs(prev => [
                     `[${timeStr}] ⚠️ IMPULSIVIDAD MOTOR: Adaptando tiempo de respuesta a ${taskDifficultyMs}ms para prevenir claudicación frontal.`,
                     ...prev.slice(0, 8)
                   ]);
               }
           }
        }

        // 5. TRANSMITIR AL SERVIDOR
        transmit({
          reactionTimeMs: sim.tr,
          omissions: sim.omissions,
          commissions: sim.commissions,
          habituationIndex: Math.floor(sim.frontal)
        });

      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, aiAutoPilot, taskDifficultyMs, binauralBetaHz]);

  const handleStartSession = () => {
    setSessionActive(true);
    setSessionDuration(0);
    setShowResults(false);
    setIsFullscreen(false);
    setTelemetryHistory([]);
    
    // Resetear simulador
    simRef.current = { hits: 0, omissions: 0, commissions: 0, tr: 260, frontal: 25 };
    setCorrectHits(0);
    setOmissionErrors(0);
    setCommissionErrors(0);
    setAvgReactionTimeMs(260);
    setFrontalEngagementPct(25);
    setTaskDifficultyMs(800);
    
    setAiLogs([`[PROFESIONAL] Iniciando monitoreo clínico. Paradigma: ${getTaskTitle(executiveTask)}.`]);
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    setAiLogs(prev => [`[SISTEMA] Sesión completada. Guardando reporte en expediente...`, ...prev]);

    const sessionReport = {
      patientId: patient?.id || 'PAC-8104',
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
      console.error("Error al guardar:", error);
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
        <title>Reporte VR — ${getTaskTitle(executiveTask)}</title>
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
          <div class="title">Entrenamiento de Función Ejecutiva VR</div>
          <div class="subtitle">Paciente: ${patient.id || 'PAC-8104'} | Duración: ${formatTime(sessionDuration)}</div>
        </div>
        <h3>1. MÉTRICAS EJECUTIVAS Y DE ATENCIÓN</h3>
        <div class="grid">
          <div class="card"><div class="card-label">Aciertos (Foco)</div><div class="card-value">${correctHits}</div></div>
          <div class="card"><div class="card-label">Omisiones (Inatención)</div><div class="card-value">${omissionErrors}</div></div>
          <div class="card"><div class="card-label">Comisiones (Impulsividad)</div><div class="card-value">${commissionErrors}</div></div>
          <div class="card"><div class="card-label">Tiempo Reacción TR</div><div class="card-value">${Math.floor(avgReactionTimeMs)} ms</div></div>
        </div>
        <h3>2. DICTAMEN CLÍNICO DE LA IA</h3>
        <div class="verdict">
          <strong>Conclusión:</strong> Compromiso Prefrontal: ${Math.floor(frontalEngagementPct)}%. TR Promedio: ${Math.floor(avgReactionTimeMs)} ms.
        </div>
        <h3>3. BITÁCORA CLOSED-LOOP DE AUDITORÍA</h3>
        <div class="logs">${aiLogs.map(l => `<div>${l}</div>`).join('')}</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const maxPrimary = 1000;
  const maxSecondary = 100;
  const width = 800;
  const height = 180;
  const padding = 20;

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

  // VISTA 1: RESULTADOS INDIVIDUALES (DESPUÉS DE CONCLUIR)
  if (showResults) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 lg:p-8 overflow-y-auto flex items-center justify-center">
        <div className={`bg-slate-950 border border-slate-800 text-white space-y-6 transition-all duration-300 shadow-2xl font-sans ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen p-6 rounded-none' : 'max-w-5xl w-full mx-auto p-6 rounded-2xl'}`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-sky-600 to-blue-600 rounded-2xl text-white shadow-lg"><ShieldCheck className="w-6 h-6" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-white">Función Ejecutiva VR</h2>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono bg-sky-950 text-sky-300 rounded-full border border-sky-500/40"><CheckCircle2 className="w-3 h-3 inline mr-1" />RESULTADOS INDIVIDUALES</span>
                </div>
                <p className="text-xs text-slate-400">Paciente: <strong className="text-slate-200">{patient.id || 'PAC-8104'}</strong></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition">{isFullscreen ? <Minimize2 className="w-5 h-5 text-cyan-300" /> : <Maximize2 className="w-5 h-5 text-cyan-300" />}</button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Aciertos (Foco)</span>
              <div className="text-2xl font-black font-mono text-emerald-400">{correctHits}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Omisiones</span>
              <div className="text-2xl font-black font-mono text-amber-400">{omissionErrors}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Comisiones</span>
              <div className="text-2xl font-black font-mono text-rose-400">{commissionErrors}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tiempo Reacción TR</span>
              <div className="text-2xl font-black font-mono text-cyan-300">{Math.floor(avgReactionTimeMs)} <span className="text-xs text-slate-400">ms</span></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
             <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-200"><Activity className="w-4 h-4 inline mr-2 text-cyan-400" />Curvas SVG</span>
              <div className="flex gap-4 font-mono"><span className="text-cyan-300"><span className="text-cyan-400">■</span> TR (ms)</span><span className="text-emerald-400"><span className="text-emerald-400">■</span> Frontal (%)</span></div>
            </div>
            <div className={`w-full bg-slate-950 rounded-xl border border-slate-800 p-2 ${isFullscreen ? 'h-64' : 'h-48'}`}>
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <line x1="20" y1="30" x2="780" y2="30" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="20" y1="90" x2="780" y2="90" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="20" y1="150" x2="780" y2="150" stroke="#1e293b" strokeDasharray="3,3" />
                <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={pointsSecondary} />
                <polyline fill="none" stroke="#22d3ee" strokeWidth="3" points={pointsPrimary} />
              </svg>
            </div>
          </div>

          <div className="flex justify-between border-t border-slate-800 pt-4">
            <button onClick={handleStartSession} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition"><RotateCcw className="w-4 h-4 text-cyan-400"/> Re-Iniciar</button>
            <button onClick={handlePrintIndividualReport} className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition"><Printer className="w-4 h-4"/> Exportar PDF</button>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: CONSOLA DEL PROFESIONAL EN VIVO
  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden ${isFullscreen ? 'p-2' : 'p-4 lg:p-6'}`}>
      
      {/* HEADER */}
      <div className="h-16 border-b border-sky-900/50 bg-slate-900 flex items-center justify-between px-6 rounded-2xl shadow-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-blue-700 rounded-xl shadow-lg"><Cpu className="w-5 h-5 animate-pulse text-white" /></div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100">Consola del Profesional • Función Ejecutiva</h1>
            <p className="text-[10px] text-sky-300 font-mono">Paciente: {patient.id || 'PAC-8104'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handlePrintIndividualReport} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg transition"><Printer className="w-4 h-4" /> Imprimir Reporte</button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700">{isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-300"/> : <Maximize2 className="w-4 h-4 text-cyan-300"/>}</button>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300"><X className="w-5 h-5" /></button>
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
            </select>

            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3 mt-4">
              <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">Compromiso Frontal:</span><span className="text-sky-300">{Math.floor(frontalEngagementPct)}%</span></div>
              <div className="h-2 w-full bg-slate-900 rounded-full"><div style={{ width: `${frontalEngagementPct}%` }} className="h-full bg-sky-500 transition-all"/></div>
              <div className="flex justify-between text-[10px] font-bold mt-2"><span className="text-slate-400">Latencia Exigida:</span><span className="text-purple-400">{taskDifficultyMs} ms</span></div>
            </div>
          </div>
        </div>

        {/* CENTRO (GRÁFICAS EN VIVO) */}
        <div className="col-span-12 lg:col-span-6 bg-[#020617] rounded-2xl border-2 border-slate-800 flex flex-col justify-between p-4 shadow-2xl">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <div className="bg-black/70 px-3 py-1.5 rounded-full border border-sky-500/30 text-xs font-mono text-sky-100"><Activity className={`w-3.5 h-3.5 inline mr-2 ${sessionActive ? 'animate-pulse text-sky-400' : ''}`}/> Telemetría en Vivo</div>
            <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg"><Clock className="w-3.5 h-3.5 inline mr-1 text-sky-400"/> {formatTime(sessionDuration)}</div>
          </div>

          <div className="w-full my-auto space-y-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-300"><span className="text-cyan-400">■</span> TR: {Math.floor(avgReactionTimeMs)} ms</span>
              <span className="text-emerald-400"><span className="text-emerald-400">■</span> Frontal: {Math.floor(frontalEngagementPct)}%</span>
            </div>
            <div className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800 p-3">
              {telemetryHistory.length > 1 ? (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <line x1="20" y1="30" x2="780" y2="30" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="90" x2="780" y2="90" stroke="#1e293b" strokeDasharray="3,3" />
                  <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={pointsSecondary} />
                  <polyline fill="none" stroke="#22d3ee" strokeWidth="3" points={pointsPrimary} />
                </svg>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono italic">Presione 'Iniciar Monitoreo' para generar la gráfica...</div>
              )}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-sky-900/50 rounded-xl p-3 grid grid-cols-4 gap-2 text-center font-mono">
            <div className="border-r border-slate-800"><span className="text-[8.5px] uppercase font-bold text-slate-400 block">Aciertos (Foco)</span><div className="text-xl font-bold text-emerald-400">{correctHits}</div></div>
            <div className="border-r border-slate-800"><span className="text-[8.5px] uppercase font-bold text-slate-400 block">Omisiones</span><div className="text-xl font-bold text-amber-400">{omissionErrors}</div></div>
            <div className="border-r border-slate-800"><span className="text-[8.5px] uppercase font-bold text-slate-400 block">Comisiones</span><div className="text-xl font-bold text-rose-400">{commissionErrors}</div></div>
            <div><span className="text-[8.5px] uppercase font-bold text-slate-400 block">TR Promedio</span><div className="text-xl font-bold text-cyan-300">{Math.floor(avgReactionTimeMs)}<span className="text-[10px] text-slate-500">ms</span></div></div>
          </div>
        </div>

        {/* DERECHA */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-800 pb-2"><Zap className="w-4 h-4 inline mr-2 text-sky-400"/> AI Coach</h2>
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] overflow-y-auto max-h-[300px] space-y-2">
              {aiLogs.length > 0 ? aiLogs.map((log, i) => <div key={i} className={`p-2 rounded border ${i===0 ? 'text-sky-300 border-sky-900/50' : 'text-slate-400 border-slate-800/60'}`}>{log}</div>) : <div className="text-slate-600 text-center mt-4">Esperando monitoreo...</div>}
            </div>
          </div>

          <div className="pt-4 space-y-2">
            {!sessionActive ? (
              <button onClick={handleStartSession} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 text-white font-bold py-3 rounded-xl shadow-lg transition"><Play className="w-4 h-4 fill-current"/> Iniciar Monitoreo Médico</button>
            ) : (
              <button onClick={handleEndSession} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition"><Square className="w-4 h-4 fill-current"/> Concluir Sesión VR</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
