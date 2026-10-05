import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Play, Square, Video, Brain, X, 
  Zap, Target, Sparkles, Crosshair, Focus, Cpu,
  Activity, RotateCcw, CheckCircle2, ShieldCheck,
  Maximize2, Minimize2, Printer, FileText, Clock, Wifi, WifiOff
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
  // Configuración de la Tarea Ejecutiva (Controlada por el Profesional)
  const [executiveTask, setExecutiveTask] = useState<ExecutiveTask>('RESPONSE_INHIBITION');
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);

  // Control de Interfaz del Profesional
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Parámetros Neurocognitivos
  const [binauralBetaHz, setBinauralBetaHz] = useState<number>(15.0); // Foco Beta
  const [taskDifficultyMs, setTaskDifficultyMs] = useState<number>(800); // Latencia exigida
  
  // Métricas de Desempeño en Tiempo Real
  const [omissionErrors, setOmissionErrors] = useState<number>(0); // Inatención
  const [commissionErrors, setCommissionErrors] = useState<number>(0); // Impulsividad
  const [correctHits, setCorrectHits] = useState<number>(0);
  const [avgReactionTimeMs, setAvgReactionTimeMs] = useState<number>(0);
  const [frontalEngagementPct, setFrontalEngagementPct] = useState<number>(20); // Reclutamiento prefrontal
  
  // Historial dinámico para renderizar curvas biométricas en vivo
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [safetyTriggered, setSafetyTriggered] = useState(false);

  // -------------------------------------------------------------------------
  // RECEPCIÓN / TRANSMISIÓN DE TELEMETRÍA VR
  // -------------------------------------------------------------------------
  const { isConnected, transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', 'ExecutiveControl');

  // Transmisión y sincronización con el visor del paciente
  useEffect(() => {
    if (sessionActive && !safetyTriggered) {
      transmit({
        reactionTimeMs: Math.floor(avgReactionTimeMs),
        omissions: omissionErrors,
        commissions: commissionErrors,
        habituationIndex: Math.floor(frontalEngagementPct)
      });
    }
  }, [correctHits, omissionErrors, commissionErrors, avgReactionTimeMs, frontalEngagementPct, sessionActive, safetyTriggered]);

  // Motor de Telemetría en Vivo y Gráfica Continua
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (sessionActive && !safetyTriggered) {
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });
        setSessionDuration(prev => prev + 1);
        
        // Simulación / Cálculo de métricas fisiológicas entrantes
        const currentFrontal = Math.min(98, Math.max(10, frontalEngagementPct + (correctHits * 0.4) - (omissionErrors * 0.2)));
        const currentTR = avgReactionTimeMs > 0 ? avgReactionTimeMs : Math.floor(Math.random() * 200 + 250);
        
        setFrontalEngagementPct(currentFrontal);

        // Alimentar curva biométrica en tiempo real
        setTelemetryHistory(prev => [
          ...prev,
          {
            timeLabel: timeStr.substring(3, 8),
            primaryVal: Math.floor(currentTR),
            secondaryVal: Math.floor(currentFrontal)
          }
        ]);

        // Regulación Closed-Loop de IA
        if (aiAutoPilot) {
           if (correctHits > 4 && (correctHits % 4 === 0)) {
               setTaskDifficultyMs(prev => Math.max(300, prev - 40));
               setBinauralBetaHz(prev => Math.min(25.0, prev + 0.4));
               
               if (Math.random() > 0.5) {
                   setAiLogs(prev => [
                     `[${timeStr}] 🧠 NEUROPLASTICIDAD: Aumento de foco atencional. Latencia exigida: ${taskDifficultyMs}ms | Estimulación Beta: ${binauralBetaHz.toFixed(1)}Hz.`,
                     ...prev.slice(0, 8)
                   ]);
               }
           }
           if (commissionErrors > 2 && (commissionErrors % 2 === 0)) {
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
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, aiAutoPilot, taskDifficultyMs, binauralBetaHz, correctHits, omissionErrors, commissionErrors, safetyTriggered, avgReactionTimeMs, frontalEngagementPct]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSessionActive(true);
    setSessionDuration(0);
    setTelemetryHistory([]);
    setOmissionErrors(0);
    setCommissionErrors(0);
    setCorrectHits(0);
    setAvgReactionTimeMs(260);
    setFrontalEngagementPct(25);
    setTaskDifficultyMs(800);
    setBinauralBetaHz(15.0);
    setAiLogs([`[PROFESIONAL] Iniciando monitoreo en vivo. Tarea: ${getTaskTitle(executiveTask)}.`]);
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setSafetyTriggered(true);
    setAiLogs(prev => [`[EMERGENCIA] Desconexión solicitada por el profesional.`, ...prev]);
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    setAiLogs(prev => [`[SISTEMA] Sesión completada. Guardando reporte en MongoDB...`, ...prev]);

    const sessionReport = {
      patientId: patient?.id || 'PAC-8104',
      sessionData: {
        taskName: executiveTask,
        durationSeconds: sessionDuration || 300,
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
      console.log(`Reporte individual VR de Función Ejecutiva guardado.`);
    } catch (error) {
      console.error("Error al guardar reporte VR:", error);
    }
  };

  const getTaskTitle = (task: ExecutiveTask) => {
    const map = {
      'RESPONSE_INHIBITION': 'Inhibición de Respuesta (Go/No-Go TDAH)',
      'SUSTAINED_ATTENTION': 'Atención Sostenida (Vigilancia)',
      'WORKING_MEMORY_NBACK': 'Memoria de Trabajo Espacial (N-Back)'
    };
    return map[task];
  };

  const safePatientName = patient.patientNameAnonymized || patient.id || 'PAC-8104';

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  // Función de Impresión de Reporte Individual
  const handlePrintIndividualReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Individual VR — Función Ejecutiva</title>
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
          <div class="title">Entrenamiento de Función Ejecutiva (Executive Control VR)</div>
          <div class="subtitle">Evaluación Inmersiva Individual • Paciente: ${safePatientName} | Dispositivo: Meta Quest 3S / Pico Neo 3</div>
          <div class="subtitle">Tarea: ${getTaskTitle(executiveTask)} | Duración de Exposición: ${formatTime(sessionDuration)}</div>
        </div>

        <h3>1. MÉTRICAS EJECUTIVAS Y DE ATENCIÓN</h3>
        <div class="grid">
          <div class="card">
            <div class="card-label">Aciertos (Foco)</div>
            <div class="card-value">${correctHits}</div>
            <div style="font-size: 9px; color: #64748b;">Respuestas Válidas</div>
          </div>
          <div class="card">
            <div class="card-label">Omisiones (Inatención)</div>
            <div class="card-value">${omissionErrors}</div>
            <div style="font-size: 9px; color: #64748b;">Fallos de Atención</div>
          </div>
          <div class="card">
            <div class="card-label">Comisiones (Impulsividad)</div>
            <div class="card-value">${commissionErrors}</div>
            <div style="font-size: 9px; color: #64748b;">Freno Motor Incompleto</div>
          </div>
          <div class="card">
            <div class="card-label">Tiempo Reacción TR</div>
            <div class="card-value">${Math.floor(avgReactionTimeMs)} ms</div>
            <div style="font-size: 9px; color: #64748b;">Latencia Promedio</div>
          </div>
        </div>

        <h3>2. DICTAMEN CLÍNICO DE LA IA</h3>
        <div class="verdict">
          <strong>Conclusión Biométrica:</strong> Compromiso Prefrontal alcanzado: ${Math.floor(frontalEngagementPct)}%. Respuesta de inhibición motora evaluada con una latencia promedio de ${Math.floor(avgReactionTimeMs)} ms y ${commissionErrors} errores de impulsividad (comisiones).
        </div>

        <h3>3. BITÁCORA CLOSED-LOOP DE AUDITORÍA</h3>
        <div class="logs">
          ${aiLogs.map(l => `<div>${l}</div>`).join('')}
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // Cálculo de dimensiones SVG para curvas en vivo
  const maxPrimary = Math.max(...telemetryHistory.map(p => p.primaryVal), 1000);
  const maxSecondary = Math.max(...telemetryHistory.map(p => p.secondaryVal), 100);
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

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden ${isFullscreen ? 'p-2' : 'p-4 lg:p-6'}`}>
      
      {/* 1. HEADER DEL PROFESIONAL */}
      <div className="h-16 border-b border-sky-900/50 bg-slate-900 flex items-center justify-between px-6 rounded-2xl shadow-xl z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500 via-cyan-600 to-blue-700 rounded-xl text-white shadow-lg shadow-sky-500/30">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Consola del Profesional • Función Ejecutiva & Control Motor VR
            </h1>
            <p className="text-[10px] text-sky-300 font-mono flex items-center gap-2">
              Paciente: <strong className="text-white">{safePatientName}</strong> | Telemetría VR en Tiempo Real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón de Exportar Reporte Individual */}
          <button
            onClick={handlePrintIndividualReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Reporte Individual</span>
          </button>

          {/* Alternar Pantalla Completa */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800 transition hover:bg-slate-700 cursor-pointer"
            title={isFullscreen ? "Restaurar vista" : "Ver en Pantalla Completa"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-300" /> : <Maximize2 className="w-4 h-4 text-cyan-300" />}
          </button>

          <button 
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              aiAutoPilot 
                ? 'bg-sky-950 border-sky-500 text-sky-200 shadow-[0_0_12px_rgba(14,165,233,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiAutoPilot ? 'animate-spin text-sky-400' : ''}`} />
            {aiAutoPilot ? 'AI Auto-Pilot Activo' : 'Manual'}
          </button>

          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. LAYOUT PRINCIPAL DE LA CONSOLA MÉDICA */}
      <div className="flex-1 grid grid-cols-12 gap-4 mt-4 overflow-hidden">
        
        {/* PANEL IZQUIERDO: Parámetros Neurocognitivos */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Crosshair className="w-4 h-4 text-sky-400" /> Selección de Tarea Ejecutiva
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Paradigma Neurocognitivo VR</label>
              <select 
                disabled={sessionActive}
                value={executiveTask}
                onChange={(e) => setExecutiveTask(e.target.value as ExecutiveTask)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold focus:border-sky-500 outline-none disabled:opacity-50"
              >
                <option value="RESPONSE_INHIBITION">Inhibición de Respuesta (Go/No-Go)</option>
                <option value="SUSTAINED_ATTENTION">Atención Sostenida (Vigilancia)</option>
                <option value="WORKING_MEMORY_NBACK">Memoria de Trabajo Espacial (N-Back)</option>
              </select>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-sky-400" /> Reclutamiento Prefrontal</span>
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Compromiso Frontal:</span>
                  <span className="text-sky-300 font-mono">{Math.floor(frontalEngagementPct)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${frontalEngagementPct}%` }} className="h-full bg-sky-500 transition-all duration-300" />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Latencia Exigida (Dificultad IA):</span>
                  <span className="text-purple-400 font-mono">{taskDifficultyMs} ms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-sky-400 uppercase block">Monitoreo Profesional:</span>
            <p className="text-[10.5px] text-slate-300 leading-snug">
              Registra en vivo el freno de respuesta motora primaria. Las curvas inferiores grafican la evolución de latencias y reclutamiento prefrontal.
            </p>
          </div>
        </div>

        {/* PANEL CENTRAL: Gráficas de Curvas Neurofisiológicas en Tiempo Real */}
        <div className="col-span-12 lg:col-span-6 bg-[#020617] rounded-2xl border-2 border-slate-800 relative flex flex-col justify-between p-4 overflow-hidden shadow-2xl">
          
          <div className="flex items-center justify-between z-10 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-sky-500/30 text-xs font-mono text-sky-100">
              <Activity className={`w-3.5 h-3.5 ${sessionActive ? 'text-sky-400 animate-pulse' : 'text-slate-500'}`} />
              Telemetría en Vivo: <span className="font-bold text-white uppercase">{getTaskTitle(executiveTask)}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Tiempo: {formatTime(sessionDuration)}</span>
            </div>
          </div>

          {/* Lienzo Principal de Gráficas en Vivo SVG */}
          <div className="my-auto w-full space-y-3 p-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Latencia Reacción: {Math.floor(avgReactionTimeMs)} ms
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Compromiso Prefrontal: {Math.floor(frontalEngagementPct)}%
              </span>
            </div>

            <div className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800/80 p-3 flex items-center justify-center relative overflow-hidden">
              {telemetryHistory.length > 1 ? (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <line x1="20" y1="30" x2="780" y2="30" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="90" x2="780" y2="90" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="150" x2="780" y2="150" stroke="#1e293b" strokeDasharray="3,3" />

                  {/* Curva Verde: Compromiso Prefrontal % */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsSecondary}
                  />

                  {/* Curva Cyan: Latencia TR ms */}
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsPrimary}
                  />
                </svg>
              ) : (
                <div className="text-slate-600 text-xs italic font-mono text-center space-y-2">
                  <Activity className="w-8 h-8 text-slate-700 mx-auto animate-pulse" />
                  <p>Inicie la tarea cognitiva para graficar curvas neurofisiológicas en tiempo real...</p>
                </div>
              )}
            </div>
          </div>

          {/* HUD Inferior de Rendimiento Cognitivo */}
          <div className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/50 rounded-xl p-3 grid grid-cols-4 gap-2 shadow-2xl z-10 text-center font-mono">
            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Aciertos (Foco)</span>
              <div className="text-xl font-bold text-emerald-400">{correctHits}</div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Omisiones (Inatención)</span>
              <div className="text-xl font-bold text-amber-400">{omissionErrors}</div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Comisiones (Impulsividad)</span>
              <div className="text-xl font-bold text-rose-400">{commissionErrors}</div>
            </div>

            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">TR Promedio</span>
              <div className="text-xl font-bold text-cyan-300">{Math.floor(avgReactionTimeMs)} <span className="text-[10px] font-normal text-slate-500">ms</span></div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: AI Executive Coach & Controles */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-sky-400" /> AI Executive Coach
            </h2>

            {/* Bitácora de Entrenamiento */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] leading-relaxed flex flex-col gap-2 overflow-y-auto max-h-[300px] relative shadow-inner">
              {aiLogs.length > 0 ? (
                aiLogs.map((log, i) => (
                  <div key={i} className={`p-2 rounded border ${
                    i === 0 
                      ? 'text-sky-300 bg-sky-950/30 border-sky-900/50 font-semibold' 
                      : 'text-slate-400 border-slate-800/60'
                  }`}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-center p-4">
                  Esperando inicio del protocolo neurocognitivo...
                </div>
              )}
            </div>

            {/* Controles de Latencia y Frecuencia */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Dificultad Latencia:</span>
                  <span className="text-purple-300 font-mono">{taskDifficultyMs} ms</span>
                </div>
                <input 
                  type="range" min="200" max="1500" step="50"
                  value={taskDifficultyMs}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setTaskDifficultyMs(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer disabled:opacity-30"
                  style={{ direction: 'rtl' }}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Binaural Beta (Vigilia):</span>
                  <span className="text-cyan-300 font-mono">{binauralBetaHz.toFixed(1)} Hz</span>
                </div>
                <input 
                  type="range" min="12.0" max="30.0" step="0.5"
                  value={binauralBetaHz}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setBinauralBetaHz(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer disabled:opacity-30"
                />
              </div>
            </div>
          </div>

          {/* Botones de Control de Sesión */}
          <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-600/20 transition active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Tarea Cognitiva
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleEndSession}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-xs"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Concluir Sesión VR
                </button>

                <button
                  onClick={handleEmergencyEgress}
                  className="w-full flex items-center justify-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/50 font-semibold py-1.5 rounded-lg transition text-[11px] cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Abortar Prueba
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
