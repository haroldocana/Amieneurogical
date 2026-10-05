import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Play, Square, Video, Brain, X, 
  Zap, Target, Sparkles, Crosshair, Focus, Cpu,
  Activity, RotateCcw, CheckCircle2, ShieldCheck,
  Maximize2, Minimize2, Printer, FileText
} from 'lucide-react';
import { PatientRecord } from '../types';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

type ExecutiveTask = 'RESPONSE_INHIBITION' | 'SUSTAINED_ATTENTION' | 'WORKING_MEMORY_NBACK';
type TrialState = 'WAITING' | 'STIMULUS_PRESENTED' | 'RESPONSE_WINDOW' | 'INTER_TRIAL_INTERVAL';

interface TelemetryPoint {
  timeLabel: string;
  primaryVal: number;   // Tiempo de Reacción TR (ms)
  secondaryVal: number; // Compromiso Prefrontal (%)
}

export const VrExecutiveFunctionModule: React.FC<Props> = ({ patient, onClose }) => {
  // Configuración Clínica
  const [executiveTask, setExecutiveTask] = useState<ExecutiveTask>('RESPONSE_INHIBITION');
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);

  // Estados para Pantalla de Resultados
  const [showResults, setShowResults] = useState(false);
  const [isFullscreenResults, setIsFullscreenResults] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Parámetros de la Tarea y Biofeedback
  const [binauralBetaHz, setBinauralBetaHz] = useState<number>(15.0); // Rango Beta para foco atencional
  const [taskDifficultyMs, setTaskDifficultyMs] = useState<number>(800); // Latencia requerida (ms)
  
  // Estado Dinámico de la Tarea Simulada
  const [trialState, setTrialState] = useState<TrialState>('WAITING');
  const [targetType, setTargetType] = useState<'GO' | 'NO_GO' | null>(null);

  // Biometría y Desempeño
  const [omissionErrors, setOmissionErrors] = useState<number>(0); // Fallo de atención
  const [commissionErrors, setCommissionErrors] = useState<number>(0); // Impulsividad
  const [correctHits, setCorrectHits] = useState<number>(0);
  const [avgReactionTimeMs, setAvgReactionTimeMs] = useState<number>(0);
  const [frontalEngagementPct, setFrontalEngagementPct] = useState<number>(10); // Reclutamiento prefrontal
  
  // Historial dinámico para graficar curvas biométricas
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [safetyTriggered, setSafetyTriggered] = useState(false);

  // -------------------------------------------------------------------------
  // CONEXIÓN PUENTE VR (EMISOR EN METAVERSE / RECEPTOR TELEMETRÍA)
  // -------------------------------------------------------------------------
  const { transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', 'ExecutiveControl');

  // Transmisión en tiempo real al servidor
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

  // Motor Closed-Loop de Entrenamiento Cognitivo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let trialTimeout: ReturnType<typeof setTimeout> | null = null;

    if (sessionActive && !safetyTriggered) {
      
      // Ciclo base de actualización biométrica y ajuste IA (cada segundo)
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });
        setSessionDuration(prev => prev + 1);
        
        // Simulación de reclutamiento cortical
        const currentFrontal = Math.min(98, Math.max(5, frontalEngagementPct + (correctHits * 0.5) - (omissionErrors * 0.2)));
        setFrontalEngagementPct(currentFrontal);

        // Registrar punto en la gráfica biométrica
        setTelemetryHistory(prev => [
          ...prev,
          {
            timeLabel: timeStr.substring(3, 8),
            primaryVal: Math.floor(avgReactionTimeMs || 250),
            secondaryVal: Math.floor(currentFrontal)
          }
        ]);

        // Adaptación automática (Closed-Loop)
        if (aiAutoPilot) {
           if (correctHits > 5 && (correctHits % 5 === 0)) {
               setTaskDifficultyMs(prev => Math.max(300, prev - 50));
               setBinauralBetaHz(prev => Math.min(25.0, prev + 0.5));
               
               if (Math.random() > 0.5) {
                   setAiLogs(prev => [
                     `[${timeStr}] 🧠 NEUROPLASTICIDAD: Racha de aciertos. Incrementando carga cognitiva (Latencia: ${taskDifficultyMs}ms) y estimulación Beta (${binauralBetaHz.toFixed(1)}Hz).`,
                     ...prev.slice(0, 8)
                   ]);
               }
           }
           if (commissionErrors > 3 && (commissionErrors % 3 === 0)) {
               setTaskDifficultyMs(prev => Math.min(1200, prev + 100));
               setBinauralBetaHz(prev => Math.max(12.0, prev - 0.5));
               if (Math.random() > 0.5) {
                   setAiLogs(prev => [
                     `[${timeStr}] ⚠️ FATIGA FRONTAL: Impulsividad detectada. Reduciendo ritmo de tarea para evitar claudicación cortical.`,
                     ...prev.slice(0, 8)
                   ]);
               }
           }
        }
      }, 1000);

      // Máquina de Estados para la Simulación del Paradigma Go/No-Go
      const runTrialSequence = () => {
         if (!sessionActive || safetyTriggered) return;

         setTrialState('WAITING');
         const iti = Math.random() * 1500 + 500; // Inter-trial interval (500-2000ms)

         trialTimeout = setTimeout(() => {
             const isGoTarget = Math.random() > 0.3; // 70% GO, 30% NO-GO
             setTargetType(isGoTarget ? 'GO' : 'NO_GO');
             setTrialState('STIMULUS_PRESENTED');

             trialTimeout = setTimeout(() => {
                setTrialState('RESPONSE_WINDOW');
                
                const patientReacts = Math.random() > 0.2;
                const reactTime = Math.floor(Math.random() * 400 + 200);

                if (isGoTarget) {
                    if (patientReacts && reactTime <= taskDifficultyMs) {
                        setCorrectHits(c => c + 1);
                        setAvgReactionTimeMs(prev => prev === 0 ? reactTime : (prev + reactTime) / 2);
                    } else {
                        setOmissionErrors(e => e + 1);
                    }
                } else {
                    if (patientReacts) {
                        setCommissionErrors(e => e + 1);
                    }
                }
                
                trialTimeout = setTimeout(() => {
                    setTargetType(null);
                    if (sessionActive && !safetyTriggered) runTrialSequence();
                }, 500);

             }, taskDifficultyMs);

         }, iti);
      };

      runTrialSequence();
    }

    return () => {
      if (interval) clearInterval(interval);
      if (trialTimeout) clearTimeout(trialTimeout);
    };
  }, [sessionActive, aiAutoPilot, taskDifficultyMs, binauralBetaHz, correctHits, omissionErrors, commissionErrors, safetyTriggered, avgReactionTimeMs, frontalEngagementPct]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSessionActive(true);
    setShowResults(false);
    setIsFullscreenResults(false);
    setSessionDuration(0);
    setTelemetryHistory([]);
    setOmissionErrors(0);
    setCommissionErrors(0);
    setCorrectHits(0);
    setAvgReactionTimeMs(0);
    setFrontalEngagementPct(10);
    setTaskDifficultyMs(800);
    setBinauralBetaHz(15.0);
    setAiLogs([`[SISTEMA] Iniciando Entrenamiento Neurocognitivo. Paradigma: ${getTaskTitle(executiveTask)}.`]);
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setSafetyTriggered(true);
    setTrialState('WAITING');
    setTargetType(null);
    setAiLogs(prev => [`[EMERGENCIA] Desconexión de seguridad. Abortando estimulación cognitiva.`, ...prev]);
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    setTrialState('WAITING');
    setTargetType(null);
    setAiLogs(prev => [`[SISTEMA] Sesión completada. Consolidando reporte de función ejecutiva...`, ...prev]);

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
      console.log(`Reporte VR Control Ejecutivo guardado en MongoDB.`);
    } catch (error) {
      console.error("Error al guardar reporte VR:", error);
    }

    // Desplegar la pantalla de resultados e informe del módulo
    setShowResults(true);
  };

  const getTaskTitle = (task: ExecutiveTask) => {
    const map = {
      'RESPONSE_INHIBITION': 'Inhibición de Respuesta (TDAH / Impulsividad Motor)',
      'SUSTAINED_ATTENTION': 'Atención Sostenida (TDAH / Inatento)',
      'WORKING_MEMORY_NBACK': 'Memoria de Trabajo y Actualización (N-Back Spatial)'
    };
    return map[task];
  };

  const safePatientName = patient.patientNameAnonymized || patient.id || 'PAC-8104';

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
          <div class="subtitle">Tarea: ${getTaskTitle(executiveTask)} | Duración: ${formatTime(sessionDuration)}</div>
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

  // -------------------------------------------------------------------------
  // VISTA 1: PANTALLA DE RESULTADOS INDIVIDUALES (DESPUÉS DE CONCLUIR)
  // -------------------------------------------------------------------------
  if (showResults) {
    const maxPrimary = Math.max(...telemetryHistory.map(p => p.primaryVal), 1000);
    const maxSecondary = Math.max(...telemetryHistory.map(p => p.secondaryVal), 100);
    const width = 800;
    const height = 220;
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
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 lg:p-8 overflow-y-auto flex items-center justify-center">
        <div 
          className={`bg-slate-950 border border-slate-800 text-white space-y-6 transition-all duration-300 shadow-2xl font-sans ${
            isFullscreenResults 
              ? 'fixed inset-0 z-[100] w-screen h-screen p-6 overflow-y-auto rounded-none border-none' 
              : 'max-w-5xl w-full mx-auto p-6 rounded-2xl'
          }`}
        >
          {/* Header de Resultados */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-sky-600 to-blue-600 rounded-2xl text-white shadow-lg shadow-sky-600/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-white">
                    Entrenamiento de Función Ejecutiva (Executive Control VR)
                  </h2>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono bg-sky-950 text-sky-300 border border-sky-500/40 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-sky-400" /> RESULTADOS INDIVIDUALES
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Paciente: <strong className="text-slate-200">{safePatientName}</strong> | Tarea: <span className="text-cyan-300 font-mono">{getTaskTitle(executiveTask)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreenResults(!isFullscreenResults)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 transition hover:bg-slate-700 cursor-pointer"
                title={isFullscreenResults ? "Restaurar Tamaño" : "Ver en Pantalla Completa"}
              >
                {isFullscreenResults ? <Minimize2 className="w-5 h-5 text-cyan-300" /> : <Maximize2 className="w-5 h-5 text-cyan-300" />}
              </button>

              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 transition hover:bg-rose-900/50 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas Clave */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1 shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aciertos (Foco)</span>
              <div className="text-2xl font-black font-mono text-emerald-400">{correctHits}</div>
              <p className="text-[10px] text-slate-400 font-mono">Respuestas Válidas</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1 shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Omisiones (Inatención)</span>
              <div className="text-2xl font-black font-mono text-amber-400">{omissionErrors}</div>
              <p className="text-[10px] text-slate-400 font-mono">Fallos de Atención</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1 shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comisiones (Impulsividad)</span>
              <div className="text-2xl font-black font-mono text-rose-400">{commissionErrors}</div>
              <p className="text-[10px] text-slate-400 font-mono">Freno Motor Incompleto</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1 shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tiempo Reacción TR</span>
              <div className="text-2xl font-black font-mono text-cyan-300">{Math.floor(avgReactionTimeMs)} <span className="text-xs font-normal text-slate-400">ms</span></div>
              <p className="text-[10px] text-slate-400 font-mono">Latencia Promedio</p>
            </div>
          </div>

          {/* Curvas Biométricas SVG */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Curvas de Latencia Motora y Compromiso Prefrontal Dinámico
              </span>

              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className="text-slate-300">Tiempo de Reacción (ms)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Compromiso Prefrontal (%)</span>
                </span>
              </div>
            </div>

            <div className={`relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 p-2 flex items-center justify-center ${isFullscreenResults ? 'aspect-[16/4]' : 'aspect-[16/5]'}`}>
              {telemetryHistory.length > 1 ? (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <line x1="20" y1="40" x2="780" y2="40" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="110" x2="780" y2="110" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="180" x2="780" y2="180" stroke="#1e293b" strokeDasharray="3,3" />

                  {/* Compromiso Frontal % */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsSecondary}
                  />

                  {/* Tiempo Reacción ms */}
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
                <div className="text-slate-600 text-xs italic font-mono">
                  Registrando curva biométrica de sesión...
                </div>
              )}
            </div>
          </div>

          {/* Dictamen Clínico de la IA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Dictamen Específico del Módulo
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Compromiso Prefrontal alcanzado: {Math.floor(frontalEngagementPct)}%. Respuesta de inhibición motora evaluada con una latencia promedio de {Math.floor(avgReactionTimeMs)} ms y {commissionErrors} errores de impulsividad (comisiones).
              </p>
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 flex flex-col justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" /> Auditoría de Eventos Closed-Loop
              </span>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 max-h-24 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-400">
                {aiLogs.map((log, i) => (
                  <div key={i} className="truncate">• {log}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              onClick={handleStartSession}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" /> Re-Iniciar Prueba
            </button>

            <button
              onClick={handlePrintIndividualReport}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Exportar Reporte Individual (PDF/Print)
            </button>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // VISTA 2: CONSOLA EN VIVO DEL MÓDULO (DURANTE LA PRUEBA)
  // -------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. HEADER */}
      <div className="h-16 border-b border-sky-900/50 bg-slate-900 flex items-center justify-between px-6 shadow-[0_4px_30px_rgba(14,165,233,0.15)] z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500 via-cyan-600 to-blue-700 rounded-xl text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Entrenamiento de Función Ejecutiva (Executive Control VR)
            </h1>
            <p className="text-[10px] text-sky-300 font-mono flex items-center gap-2">
              Paciente: <strong className="text-white">{safePatientName}</strong> | Fortalecimiento Red Frontoestriatal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              aiAutoPilot 
                ? 'bg-sky-950 border-sky-500 text-sky-200 shadow-[0_0_12px_rgba(14,165,233,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiAutoPilot ? 'animate-spin text-sky-400' : ''}`} />
            {aiAutoPilot ? 'AI Adaptive Difficulty (Auto-Pilot)' : 'Control Manual'}
          </button>

          <button
            onClick={handleEmergencyEgress}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" /> Finalizar VR
          </button>

          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        
        {/* LEFT PANEL: Paradigmas Cognitivos */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-5">
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

            {/* Cuadro de Mandos Corticales */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-sky-400" /> Reclutamiento Prefrontal</span>
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Compromiso Frontal (Engagement):</span>
                  <span className="text-sky-300 font-mono">{Math.floor(frontalEngagementPct)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${frontalEngagementPct}%` }} className="h-full bg-sky-500 transition-all duration-300" />
                </div>
              </div>

               <div className="space-y-1 mt-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Latencia Exigida (Dificultad IA):</span>
                  <span className="text-purple-400 font-mono">{taskDifficultyMs} ms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 mt-4">
            <span className="text-[10px] font-bold text-sky-400 uppercase block">Neuroplasticidad Dirigida:</span>
            <p className="text-[10.5px] text-slate-300 leading-snug">
              Obliga a la corteza prefrontal a mantener vigilancia e inhibir el impulso motor primario, fortaleciendo el "freno" neural deficiente en el TDAH.
            </p>
          </div>
        </div>

        {/* CENTER PANEL: Simulador POV (Go/No-Go Tarea) */}
        <div className="col-span-12 lg:col-span-6 bg-[#020617] rounded-2xl border-2 border-slate-800 relative flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
          
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-sky-500/30 text-xs font-mono text-sky-100">
              <Video className={`w-3.5 h-3.5 ${sessionActive ? 'text-sky-400 animate-pulse' : 'text-slate-500'}`} />
              POV Paciente: <span className="font-bold text-white uppercase">{getTaskTitle(executiveTask)}</span>
            </div>
          </div>

          {/* Renderizador de Estímulo Central */}
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {sessionActive ? (
              <div className="text-center space-y-6 relative z-10">
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center bg-slate-900 rounded-3xl border border-slate-800">
                   {trialState === 'STIMULUS_PRESENTED' || trialState === 'RESPONSE_WINDOW' ? (
                       targetType === 'GO' ? (
                          <div className="w-24 h-24 bg-emerald-500 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.6)] animate-ping" style={{animationDuration: '1s'}} />
                       ) : (
                          <div className="w-24 h-24 bg-rose-600 rotate-45 shadow-[0_0_40px_rgba(225,29,72,0.6)] animate-pulse" />
                       )
                   ) : (
                       <div className="text-slate-600 font-bold text-2xl">+</div>
                   )}
                </div>
                
                <div>
                  <h3 className="text-lg font-bold font-mono tracking-widest text-slate-300">
                    {targetType === 'GO' ? 'OBJETIVO: ACCIÓN RÁPIDA' : targetType === 'NO_GO' ? 'DISTRACTOR: ¡INHIBIR!' : 'ESPERANDO ESTÍMULO...'}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 relative z-10">
                <Focus className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-400 max-w-sm">
                  Alineación completada. Al iniciar, el paciente deberá reaccionar a los estímulos objetivo y suprimir su respuesta ante los distractores.
                </p>
              </div>
            )}
          </div>

          {/* HUD Inferior de Rendimiento Cognitivo */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-xl border border-sky-900/50 rounded-xl p-3 grid grid-cols-4 gap-2 shadow-2xl z-10 text-center font-mono">
            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Aciertos (Foco)</span>
              <div className="text-xl font-bold text-emerald-400">
                {correctHits}
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Omission (Inatención)</span>
              <div className="text-xl font-bold text-amber-400">
                {omissionErrors}
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Comission (Impulsividad)</span>
              <div className="text-xl font-bold text-rose-400">
                {commissionErrors}
              </div>
            </div>

            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">T. Reacción Medio</span>
              <div className="text-xl font-bold text-cyan-300">
                {Math.floor(avgReactionTimeMs)} <span className="text-[10px] font-normal text-slate-500">ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Closed-Loop AI Logs & Controles */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-sky-400" /> AI Executive Coach
            </h2>

            {/* Bitácora de Entrenamiento */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] leading-relaxed flex flex-col gap-2 overflow-y-auto max-h-[300px] relative shadow-inner">
              <div className="absolute top-2 right-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              </div>

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

            {/* Controles Manuales */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Dificultad Latencia (ms):</span>
                  <span className="text-purple-300 font-mono">{taskDifficultyMs} ms</span>
                </div>
                <input 
                  type="range" min="200" max="1500" step="50"
                  value={taskDifficultyMs}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setTaskDifficultyMs(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer disabled:opacity-30 flex-row-reverse"
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
              <button
                onClick={handleEndSession}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                Concluir Sesión VR
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
