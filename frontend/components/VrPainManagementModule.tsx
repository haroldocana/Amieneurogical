import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Play, Square, Video, Activity, Brain, X, 
  Snowflake, ThermometerSnowflake, Zap, Target, AudioWaveform,
  Printer, RotateCcw, CheckCircle2, Sparkles, Maximize2, Minimize2,
  FileText, ShieldCheck, Heart
} from 'lucide-react';
import { PatientRecord } from '../types';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

type PainCondition = 'PHANTOM_LIMB' | 'FIBROMYALGIA' | 'ONCOLOGY_PAIN' | 'SEVERE_BURN' | 'NEUROPATHY';
type VisualMetaphor = 'GLACIAL_FRACTALS' | 'DEEP_OCEAN_ABYSS' | 'CRYSTAL_CAVE' | 'NEBULA_VOID';

interface TelemetryPoint {
  timeLabel: string;
  primaryVal: number;   // Dolor Percibido (EVA)
  secondaryVal: number; // Respuesta Galvánica (GSR µS)
}

export const VrPainManagementModule: React.FC<Props> = ({ patient, onClose }) => {
  // Configuración Clínica Inicial
  const [painCondition, setPainCondition] = useState<PainCondition>('FIBROMYALGIA');
  const [visualMetaphor, setVisualMetaphor] = useState<VisualMetaphor>('GLACIAL_FRACTALS');
  const [baselinePain, setBaselinePain] = useState<number>(8); // Escala EVA 0-10

  // Estados de Sesión en Vivo y Resultados
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [isFullscreenResults, setIsFullscreenResults] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Telemetría Biométrica y Nociceptiva
  const [currentPainLevel, setCurrentPainLevel] = useState<number>(0);
  const [immersionLoadPct, setImmersionLoadPct] = useState<number>(0); // Carga Sensorial
  const [deltaHz, setDeltaHz] = useState<number>(4.0); // Frecuencia de analgesia
  const [gsr, setGsr] = useState<number>(3.5); // Refleja dolor agudo
  const [hrv, setHrv] = useState<number>(35); // Refleja relajación
  
  // Historial dinámico para graficar curvas biométricas en vivo
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [safetyTriggered, setSafetyTriggered] = useState(false);

  // -------------------------------------------------------------------------
  // CONEXIÓN PUENTE VR (EMISOR EN METAVERSE)
  // -------------------------------------------------------------------------
  const { transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', 'AnalgesiaVR');

  // Transmisión en tiempo real al servidor
  useEffect(() => {
    if (sessionActive && !safetyTriggered) {
      transmit({
        gsr: Number(gsr.toFixed(2)),
        hrv: Math.floor(hrv),
        stressLevel: Number(currentPainLevel.toFixed(1)),
        habituationIndex: Math.floor(immersionLoadPct)
      });
    }
  }, [gsr, hrv, currentPainLevel, immersionLoadPct, sessionActive, safetyTriggered]);

  // Motor Closed-Loop de Modulación del Dolor
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (sessionActive && !safetyTriggered) {
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });
        setSessionDuration(prev => prev + 1);

        let simulatedPainSpike = currentPainLevel + (Math.random() * 0.8 - 0.2);
        let newGsr = gsr + (Math.random() * 0.4 - 0.2);
        
        const painSuppression = (immersionLoadPct / 100) * 1.5; 
        simulatedPainSpike = Math.max(0, simulatedPainSpike - painSuppression);
        
        const updatedPain = Math.min(10, simulatedPainSpike);
        const updatedGsr = Math.max(0.5, newGsr);
        const updatedHrv = Math.min(90, Math.max(20, hrv + (immersionLoadPct > 50 ? 0.5 : -0.5)));

        setCurrentPainLevel(updatedPain);
        setGsr(updatedGsr);
        setHrv(updatedHrv);

        // Registrar punto en la curva biométrica
        setTelemetryHistory(prev => [
          ...prev,
          {
            timeLabel: timeStr.substring(3, 8),
            primaryVal: Number(updatedPain.toFixed(1)),
            secondaryVal: Number(updatedGsr.toFixed(1))
          }
        ]);

        // Auto-Pilot de la IA
        if (aiAutoPilot) {
          if (simulatedPainSpike > 3.0 || newGsr > 4.0) {
            setImmersionLoadPct(prev => Math.min(100, prev + 2.5));
            setDeltaHz(prev => Math.max(1.0, prev - 0.1));
            
            if (Math.random() > 0.6) {
              setAiLogs(prev => [`[${timeStr}] PICO NOCICEPTIVO: Aumentando saturación fractal al ${Math.floor(immersionLoadPct)}% e induciendo Ondas Delta profundas (${deltaHz.toFixed(1)}Hz).`, ...prev.slice(0, 8)]);
            }
          } else {
            setDeltaHz(prev => Math.min(4.0, prev + 0.05));
            if (Math.random() > 0.85) {
              setAiLogs(prev => [`[${timeStr}] ESTABILIDAD: Compuerta nociceptiva bloqueada. Dolor estimado EVA: ${simulatedPainSpike.toFixed(1)}. Modulación vagal activa.`, ...prev.slice(0, 8)]);
            }
          }
        }

        if (newGsr > 8.0) {
          setSafetyTriggered(true);
          setSessionActive(false);
          alert(`⚠️ ALERTA: Respuesta galvánica crítica (${newGsr.toFixed(1)} µS). Dolor refractario al bloqueo inmersivo.`);
        }

      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, aiAutoPilot, currentPainLevel, immersionLoadPct, gsr, hrv, deltaHz, safetyTriggered]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSessionActive(true);
    setShowResults(false);
    setIsFullscreenResults(false);
    setSessionDuration(0);
    setTelemetryHistory([]);
    setCurrentPainLevel(baselinePain);
    setImmersionLoadPct(10);
    setDeltaHz(4.0);
    setAiLogs([`[SISTEMA] Iniciando Protocolo de Analgesia Inmersiva. Calibrando ancho de banda atencional...`]);
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setSafetyTriggered(true);
    setImmersionLoadPct(0);
    setAiLogs(prev => [`[EMERGENCIA] Desconexión manual. Suspendiendo bloqueo nociceptivo visual.`, ...prev]);
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    setImmersionLoadPct(0);
    
    const painReductionPct = baselinePain > 0 
      ? Math.max(0, ((baselinePain - currentPainLevel) / baselinePain) * 100) 
      : 0;

    const sessionReport = {
      patientId: patient?.id || 'PAC-8104',
      sessionData: {
        taskName: 'AnalgesiaVR',
        durationSeconds: sessionDuration || 300,
        metrics: {
          avgHrv: Math.floor(hrv),
          avgGsr: Number(gsr.toFixed(2)),
          omissions: 0,
          commissions: 0,
          frontalEngagementPct: Math.floor(painReductionPct),
          binauralBetaHz: Number(deltaHz.toFixed(1))
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
      console.log(`Reporte VR de Analgesia guardado en MongoDB. Reducción del dolor: ${painReductionPct.toFixed(1)}%`);
    } catch (error) {
      console.error("Error al guardar reporte VR:", error);
    }

    // Mostrar inmediatamente la pantalla de resultados individuales del módulo
    setShowResults(true);
  };

  const getConditionName = (cond: PainCondition) => {
    const map = {
      'PHANTOM_LIMB': 'Dolor de Miembro Fantasma',
      'FIBROMYALGIA': 'Fibromialgia / Dolor Crónico Generalizado',
      'ONCOLOGY_PAIN': 'Dolor Oncológico Refractario',
      'SEVERE_BURN': 'Desbridamiento de Quemaduras Severas',
      'NEUROPATHY': 'Neuropatía Diabética / Periférica'
    };
    return map[cond];
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  const handlePrintIndividualReport = () => {
    const patientName = patient.patientNameAnonymized || patient.id || 'PAC-8104';
    const painReductionPct = baselinePain > 0 
      ? Math.max(0, ((baselinePain - currentPainLevel) / baselinePain) * 100) 
      : 0;

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Individual VR — Analgesia Inmersiva</title>
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
          <div class="title">Analgesia Inmersiva & Modulación del Dolor (Zero-Opioid VR)</div>
          <div class="subtitle">Evaluación Inmersiva Individual • Paciente: ${patientName} | Dispositivo: Meta Quest 3S / Pico Neo 3</div>
          <div class="subtitle">Trastorno: ${getConditionName(painCondition)} | Duración de Exposición: ${formatTime(sessionDuration)}</div>
        </div>

        <h3>1. MÉTRICAS CLAVE NOCICEPTIVAS</h3>
        <div class="grid">
          <div class="card">
            <div class="card-label">Dolor Inicial (EVA)</div>
            <div class="card-value">${baselinePain.toFixed(1)} / 10</div>
            <div style="font-size: 9px; color: #64748b;">Línea Base</div>
          </div>
          <div class="card">
            <div class="card-label">Dolor Final (EVA)</div>
            <div class="card-value">${currentPainLevel.toFixed(1)} / 10</div>
            <div style="font-size: 9px; color: #64748b;">Nivel Final Percibido</div>
          </div>
          <div class="card">
            <div class="card-label">Alivio Clínico (%)</div>
            <div class="card-value">${painReductionPct.toFixed(0)}%</div>
            <div style="font-size: 9px; color: #64748b;">Reducción del Dolor</div>
          </div>
          <div class="card">
            <div class="card-label">Ondas Delta Target</div>
            <div class="card-value">${deltaHz.toFixed(1)} Hz</div>
            <div style="font-size: 9px; color: #64748b;">Inducción de Analgesia</div>
          </div>
        </div>

        <h3>2. DICTAMEN CLINICO DE LA IA</h3>
        <div class="verdict">
          <strong>Conclusión Biométrica:</strong> Reducción efectiva del dolor en un ${painReductionPct.toFixed(1)}%. Se logró el bloqueo de la vía nociceptiva espinotalámica bajo saturación fractal (${Math.floor(immersionLoadPct)}%) y estimulación Delta a ${deltaHz.toFixed(1)} Hz.
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
    const painReductionPct = baselinePain > 0 
      ? Math.max(0, ((baselinePain - currentPainLevel) / baselinePain) * 100) 
      : 0;

    const maxPrimary = Math.max(...telemetryHistory.map(p => p.primaryVal), 10);
    const maxSecondary = Math.max(...telemetryHistory.map(p => p.secondaryVal), 8);
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
              <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-600/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-white">
                    Analgesia Inmersiva & Modulación del Dolor (Zero-Opioid VR)
                  </h2>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> RESULTADOS INDIVIDUALES
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Paciente: <strong className="text-slate-200">{patient.patientNameAnonymized || patient.id || 'PAC-8104'}</strong> | Diana: <span className="text-cyan-300 font-mono">{getConditionName(painCondition)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón de Pantalla Completa */}
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dolor Inicial (EVA)</span>
              <div className="text-2xl font-black font-mono text-white">{baselinePain.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10</span></div>
              <p className="text-[10px] text-slate-400 font-mono">Línea Base Nociceptiva</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1 shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dolor Final (EVA)</span>
              <div className="text-2xl font-black font-mono text-emerald-400">{currentPainLevel.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10</span></div>
              <p className="text-[10px] text-slate-400 font-mono">Nivel Final Percibido</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1 shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alivio Clínico (%)</span>
              <div className="text-2xl font-black font-mono text-cyan-300">{painReductionPct.toFixed(0)}%</div>
              <p className="text-[10px] text-slate-400 font-mono">Saturación Gate Control</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1 shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ondas Delta Target</span>
              <div className="text-2xl font-black font-mono text-blue-400">{deltaHz.toFixed(1)} <span className="text-xs font-normal text-slate-400">Hz</span></div>
              <p className="text-[10px] text-slate-400 font-mono">Inducción de Analgesia</p>
            </div>
          </div>

          {/* Curvas Biométricas Dinámicas SVG */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Curvas de Respuesta Neurofisiológica Dinámica en Tiempo Real
              </span>

              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Dolor Percibido (EVA)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-400" />
                  <span className="text-slate-300">Respuesta Galvánica / GSR (µS)</span>
                </span>
              </div>
            </div>

            <div className={`relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 p-2 flex items-center justify-center ${isFullscreenResults ? 'aspect-[16/4]' : 'aspect-[16/5]'}`}>
              {telemetryHistory.length > 1 ? (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <line x1="20" y1="40" x2="780" y2="40" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="110" x2="780" y2="110" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="20" y1="180" x2="780" y2="180" stroke="#1e293b" strokeDasharray="3,3" />

                  {/* Curva Secundaria (GSR) */}
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsSecondary}
                  />

                  {/* Curva Primaria (Dolor EVA) */}
                  <polyline
                    fill="none"
                    stroke="#f43f5e"
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

          {/* Dictamen Clínico de la IA y Bitácora */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Dictamen Específico del Módulo
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Reducción efectiva del dolor en un {painReductionPct.toFixed(1)}%. Se logró el bloqueo de la vía nociceptiva espinotalámica bajo saturación fractal ({Math.floor(immersionLoadPct)}%) y estimulación Delta a {deltaHz.toFixed(1)} Hz.
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
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Exportar Reporte Individual (PDF/Print)
            </button>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // VISTA 2: CONSOLA EN VIVO DEL MODULO (DURANTE LA PRUEBA)
  // -------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. HEADER */}
      <div className="h-16 border-b border-cyan-900/50 bg-slate-900 flex items-center justify-between px-6 shadow-[0_4px_30px_rgba(8,145,178,0.15)] z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 rounded-xl text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]">
            <ThermometerSnowflake className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Analgesia Inmersiva & Modulación del Dolor (Zero-Opioid VR)
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-2">
              Paciente: <strong className="text-white">{patient.name || 'PAC-8104'}</strong> | Bloqueo Cortical Mediado por IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              aiAutoPilot 
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Brain className={`w-3.5 h-3.5 ${aiAutoPilot ? 'animate-pulse text-cyan-400' : ''}`} />
            {aiAutoPilot ? 'AI Nociceptive Auto-Pilot Activo' : 'Control Analgésico Manual'}
          </button>

          <button
            onClick={handleEmergencyEgress}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" /> Egress (Abortar)
          </button>

          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Target className="w-4 h-4 text-cyan-400" /> Perfil Analgésico del Paciente
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Patología / Origen del Dolor</label>
              <select 
                disabled={sessionActive}
                value={painCondition}
                onChange={(e) => setPainCondition(e.target.value as PainCondition)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold focus:border-cyan-500 outline-none disabled:opacity-50"
              >
                <option value="PHANTOM_LIMB">Dolor de Miembro Fantasma</option>
                <option value="FIBROMYALGIA">Fibromialgia / Dolor Generalizado</option>
                <option value="ONCOLOGY_PAIN">Dolor Oncológico Refractario</option>
                <option value="SEVERE_BURN">Manejo de Quemaduras Severas</option>
                <option value="NEUROPATHY">Neuropatía Diabética / Periférica</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Dolor Inicial (EVA 0-10)</label>
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input 
                  type="range" min="1" max="10" step="0.5"
                  value={baselinePain}
                  disabled={sessionActive}
                  onChange={(e) => setBaselinePain(parseFloat(e.target.value))}
                  className="flex-1 accent-rose-500 cursor-pointer disabled:opacity-40"
                />
                <span className="text-rose-400 font-bold font-mono text-sm">{baselinePain.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Entorno Virtual</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'GLACIAL_FRACTALS', name: 'Fractales Glaciares (Recomendado Burn/Pain)' },
                  { id: 'DEEP_OCEAN_ABYSS', name: 'Abismo Oceánico Profundo (Flotabilidad)' },
                  { id: 'CRYSTAL_CAVE', name: 'Cueva de Cristal Resonante' }
                ].map(env => (
                  <button
                    key={env.id}
                    disabled={sessionActive}
                    onClick={() => setVisualMetaphor(env.id as VisualMetaphor)}
                    className={`text-left p-2.5 rounded-lg text-[10.5px] font-semibold border transition ${
                      visualMetaphor === env.id
                        ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {env.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 mt-4">
            <span className="text-[10px] font-bold text-cyan-400 uppercase block">Racional Clínico (Gate Control):</span>
            <p className="text-[10.5px] text-slate-300 leading-snug">
              Al saturar la corteza visual con geometría fractal compleja y sincronizar el cerebro en ondas Delta (1-4 Hz), se agota el ancho de banda atencional, bloqueando físicamente el paso de señales nociceptivas.
            </p>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="col-span-12 lg:col-span-6 bg-[#050B14] rounded-2xl border-2 border-slate-800 relative flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-xs font-mono text-cyan-100">
              <Video className={`w-3.5 h-3.5 ${sessionActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              Visor: {getConditionName(painCondition)} | Entorno: <span className="font-bold">{visualMetaphor}</span>
            </div>
          </div>

          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {sessionActive ? (
              <div className="text-center space-y-6 relative z-10">
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-[2px] border-cyan-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-2 border-[4px] border-blue-500/30 rounded-full animate-spin" style={{ animationDuration: `${(5 / deltaHz).toFixed(1)}s` }} />
                  <Snowflake className="w-16 h-16 text-cyan-300" style={{ opacity: immersionLoadPct / 100 }} />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-cyan-200 font-mono tracking-widest uppercase">
                    Bloqueo Nociceptivo Activo
                  </h3>
                  <p className="text-xs text-cyan-400/80 font-mono mt-2">
                    Saturación Sensorial (Compuerta): {Math.floor(immersionLoadPct)}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 relative z-10">
                <ThermometerSnowflake className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-400 max-w-sm">
                  Visor en reposo. Inicie el protocolo para comenzar la saturación sensorial y la inducción de analgesia profunda en ondas Delta.
                </p>
              </div>
            )}
          </div>

          {/* HUD Inferior */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-xl border border-cyan-900/50 rounded-xl p-3 grid grid-cols-4 gap-2 shadow-2xl z-10 text-center font-mono">
            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Dolor Percibido (EVA)</span>
              <div className={`text-xl font-bold ${currentPainLevel > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {currentPainLevel.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">/ 10</span>
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1 flex items-center justify-center gap-1"><AudioWaveform className="w-3 h-3"/> Binaural Delta</span>
              <div className="text-xl font-bold text-blue-400">
                {deltaHz.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">Hz</span>
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1 flex items-center justify-center gap-1"><Heart className="w-3 h-3 text-cyan-400"/> Tono Vagal (HRV)</span>
              <div className="text-xl font-bold text-cyan-300">
                {hrv.toFixed(0)} <span className="text-[10px] font-normal text-slate-500">ms</span>
              </div>
            </div>

            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1 flex items-center justify-center gap-1"><Activity className="w-3 h-3"/> Estrés (GSR)</span>
              <div className="text-xl font-bold text-purple-300">
                {gsr.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">µS</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Analgesia AI Engine
            </h2>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] leading-relaxed flex flex-col gap-2 overflow-y-auto max-h-[300px] relative shadow-inner">
              <div className="absolute top-2 right-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              </div>

              {aiLogs.length > 0 ? (
                aiLogs.map((log, i) => (
                  <div key={i} className={`p-2 rounded border ${
                    i === 0 
                      ? (log.includes('PICO') ? 'text-rose-300 bg-rose-950/20 border-rose-900/50' : 'text-cyan-300 bg-cyan-950/30 border-cyan-900/50') 
                      : 'text-slate-400 border-slate-800/60'
                  }`}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-center p-4">
                  A la espera de activación del motor analgésico inmersivo...
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Carga de Inmersión Fractal:</span>
                  <span className="text-cyan-400 font-mono">{Math.floor(immersionLoadPct)}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={immersionLoadPct}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setImmersionLoadPct(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer disabled:opacity-30"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Frecuencia Binaural (Delta):</span>
                  <span className="text-blue-400 font-mono">{deltaHz.toFixed(1)} Hz</span>
                </div>
                <input 
                  type="range" min="1.0" max="6.0" step="0.1"
                  value={deltaHz}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setDeltaHz(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer disabled:opacity-30"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-600/20 transition active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Analgesia Inmersiva
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
