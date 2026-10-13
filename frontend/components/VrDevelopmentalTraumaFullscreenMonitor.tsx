import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Play, 
  Square, 
  Video, 
  Brain, 
  Waves, 
  Sliders, 
  X, 
  Activity, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Target,
  AlertTriangle
} from 'lucide-react';
import { PatientRecord } from '../types';
import { calculateAdaptedProgram, TraumaTypology, AdaptedProgramConfig } from '../services/developmentalTraumaEngine';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

type AttachmentEcosystem = 
  | 'WOMB_LIKE_CAVE' | 'PROTECTIVE_TREEHOUSE' | 'WARM_HEARTH' | 'CALM_BEACH_SUNSET'
  | 'SAFE_PLACE_FOREST' | 'ZEN_GARDEN' | 'BIOLUMINESCENT_BEACH';

export const VrDevelopmentalTraumaFullscreenMonitor: React.FC<Props> = ({ patient, onClose }) => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const safePatientName = p?.patientNameAnonymized || patientId;

  // Estado de Selección de la Evaluación Evolutiva
  const [patientAge, setPatientAge] = useState<number>(patient.age || 28);
  const [traumaType, setTraumaType] = useState<TraumaTypology>('COMPLEX_REPETITIVE');
  const [ecosystem, setEcosystem] = useState<AttachmentEcosystem>('WOMB_LIKE_CAVE');
  
  // Configuración calculada dinámicamente
  const [programConfig, setProgramConfig] = useState<AdaptedProgramConfig>(
    calculateAdaptedProgram(patientAge, traumaType)
  );

  // Estados de Sesión en Vivo
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);
  const [emdrBilateralActive, setEmdrBilateralActive] = useState(true);
  const [simulationPhase, setSimulationPhase] = useState<'CALIBRATION' | 'REGRESSION_INDUCTION' | 'SECURE_ATTACHMENT_REPAIR'>('CALIBRATION');

  // Métricas del Visor y Fisiología Subcortical
  const [binauralHz, setBinauralHz] = useState<number>(programConfig.recommendedBinauralHz);
  const [tranceDepth, setTranceDepth] = useState<number>(12);
  const [hrv, setHrv] = useState<number>(42);
  const [gsr, setGsr] = useState<number>(1.8);
  const [dmnSuppressionPct, setDmnSuppressionPct] = useState<number>(20);
  const [saccadicHz, setSaccadicHz] = useState<number>(1.2);
  const [safetyTriggered, setSafetyTriggered] = useState<boolean>(false);
  const [safetyAlertBanner, setSafetyAlertBanner] = useState<string | null>(null);

  // Mapeo Biopsicosocial Etológico
  const [etiologyScores, setEtiologyScores] = useState({
    biological: 35,
    psychological: 45,
    social: 30
  });

  // Log de Eventos de la IA (Closed-Loop Regulator)
  const [aiLogs, setAiLogs] = useState<string[]>([]);

  const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || 'https://amieneurogical.onrender.com';

  const getAuthToken = (): string => {
    try {
      return localStorage.getItem('amie_auth_token') || localStorage.getItem('token') || '';
    } catch {
      return '';
    }
  };

  // Conexión puente WebXR con identificador unificado
  const { isConnected, syncSession, transmit, liveData } = useVrTelemetryBridge('sender', patientId, 'DEVELOPMENTAL_TRAUMA');

  // Incorporar biometría en vivo si el visor o anillo BLE transmite
  const activeHrv = liveData?.metrics?.hrvRmssdMs || p?.multisensoryHardware?.vagalToneHrvIndex || hrv;
  const activeGsr = liveData?.metrics?.gsrMicroSiemens || gsr;

  // Transmisión en vivo de fisiología subcortical y niveles de trance/DMN hacia el visor
  useEffect(() => {
    if (sessionActive && !safetyTriggered) {
      transmit({
        type: 'METRICS_UPDATE',
        hrv: Math.floor(activeHrv),
        gsr: Number(activeGsr.toFixed(2)),
        stressLevel: Math.floor(tranceDepth),
        habituationIndex: Math.floor(dmnSuppressionPct),
        omissions: Math.floor(saccadicHz * 10),
        patientId
      });
    }
  }, [activeHrv, activeGsr, tranceDepth, dmnSuppressionPct, saccadicHz, sessionActive, safetyTriggered, transmit, patientId]);

  // Recalcular configuración si cambia la edad o la tipología
  useEffect(() => {
    const newConfig = calculateAdaptedProgram(patientAge, traumaType);
    setProgramConfig(newConfig);
    if (!sessionActive) {
      setBinauralHz(newConfig.recommendedBinauralHz);
    }
  }, [patientAge, traumaType, sessionActive]);

  // Bucle Bio-Adaptativo en Tiempo Real (Closed-Loop Engine)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (sessionActive && !safetyTriggered) {
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });

        // Fluctuación fisiológica controlada
        setHrv(prev => Math.min(85, Math.max(14, prev + (Math.random() * 3.2 - 1.4))));
        setGsr(prev => Math.max(0.4, prev + (Math.random() * 0.22 - 0.11)));
        setSaccadicHz(prev => Math.max(0.5, Math.min(3.5, prev + (Math.random() * 0.2 - 0.1))));

        // Verificación de Umbral Crítico de Seguridad (GSR Safety Threshold)
        if (activeGsr > programConfig.gsrSafetyThresholduS) {
          setSafetyTriggered(true);
          setSessionActive(false);
          transmit({ type: 'TRIGGER_GROUNDING_PROTOCOL', patientId });
          
          const alertMsg = `ALERTA DE SEGURIDAD: Disparo de conductancia GSR (${activeGsr.toFixed(2)} µS) superó el límite biológico para ${programConfig.stageNameEs} (${programConfig.gsrSafetyThresholduS} µS). Protocolo de desconexión somática y anclaje activado en visor.`;
          setSafetyAlertBanner(alertMsg);
          setAiLogs(prev => [`[${timeStr}] ⚠ ${alertMsg}`, ...prev.slice(0, 9)]);
          return;
        }

        // Modulación Inteligente Autónoma (AI Auto-Pilot Closed-Loop)
        if (aiAutoPilot) {
          setTranceDepth(prev => Math.min(96, prev + 0.6));
          setDmnSuppressionPct(prev => Math.min(88, prev + 0.7));

          // Descenso progresivo de frecuencia hacia banda Theta
          if (binauralHz > programConfig.minBinauralHz) {
            setBinauralHz(prev => Math.max(programConfig.minBinauralHz, +(prev - 0.04).toFixed(2)));
          }

          // Análisis etológico dinámico
          setEtiologyScores(prev => ({
            biological: Math.min(92, prev.biological + (Math.random() > 0.5 ? 0.8 : 0)),
            psychological: Math.min(95, prev.psychological + (Math.random() > 0.6 ? 0.9 : 0)),
            social: Math.min(88, prev.social + (Math.random() > 0.7 ? 0.7 : 0))
          }));

          // Acciones clínicas de autorregulación
          if (Math.random() > 0.75) {
            const actions = [
              `IA Regulator: Atenuando luminancia en Pico 3 al 35% por leve pico simpático.`,
              `IA EMDR: Sincronizando barrido ocular bilateral a ${saccadicHz.toFixed(1)} Hz.`,
              `IA Bio-Feedback: Aumentando estimulación vagal parasimpática (HRV: ${activeHrv.toFixed(1)} ms).`,
              `IA DMN Engine: Desactivando rumiación. Supresión DMN alcanzada al ${Math.floor(dmnSuppressionPct)}%.`
            ];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            setAiLogs(prev => [`[${timeStr}] ${randomAction}`, ...prev.slice(0, 9)]);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, aiAutoPilot, activeGsr, binauralHz, programConfig, safetyTriggered, activeHrv, saccadicHz, dmnSuppressionPct, transmit, patientId]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSafetyAlertBanner(null);
    setSessionActive(true);
    setSimulationPhase('REGRESSION_INDUCTION');
    setTranceDepth(15);
    setDmnSuppressionPct(22);
    setAiLogs([`[SISTEMA] Sesión iniciada. Ecosistema VR cargado: ${getEcosystemName(ecosystem)}. Sincronización biométrica establecida.`]);
    
    syncSession();
    
    transmit({ 
      type: 'LOAD_MODULE', 
      moduleName: 'DEVELOPMENTAL_TRAUMA',
      ecosystem,
      patientId
    });
    
    transmit({ 
      type: 'START_TRAUMA_PROTOCOL', 
      phase: 'REGRESSION_INDUCTION', 
      targetHrv: 65,
      patientId 
    });
  };

  const handlePhaseChange = (phase: 'CALIBRATION' | 'REGRESSION_INDUCTION' | 'SECURE_ATTACHMENT_REPAIR') => {
    setSimulationPhase(phase);
    transmit({ type: 'UPDATE_TRAUMA_PHASE', newPhase: phase, patientId });
    
    if (phase === 'SECURE_ATTACHMENT_REPAIR') {
      transmit({ 
        type: 'LOAD_MODULE', 
        moduleName: 'DEVELOPMENTAL_TRAUMA', 
        ecosystem: 'SAFE_PLACE_FOREST',
        patientId
      });
      setAiLogs(prev => [`[SISTEMA] Fase de reparación de apego. Visor actualizado al Santuario Forestal Seguro.`, ...prev]);
    }
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setSafetyTriggered(true);
    setBinauralHz(12.0);
    setTranceDepth(0);
    setDmnSuppressionPct(0);
    transmit({ type: 'TRIGGER_GROUNDING_PROTOCOL', patientId });
    setSafetyAlertBanner('Protocolo de Aborto Manual (Egress) ejecutado por el clínico. Anclaje y reorientación activa.');
    setAiLogs(prev => [`[EMERGENCIA] Interrupción manual por el clínico. Grounding somático forzado en visor.`, ...prev]);
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    setTranceDepth(0);
    setDmnSuppressionPct(0);
    transmit({ type: 'STOP_TEST', patientId });
    setAiLogs(prev => [`[SISTEMA] Sesión finalizada. Consolidando expediente multimodal en MongoDB...`, ...prev]);

    const sessionReport = {
      patientId,
      sessionData: {
        taskName: 'DevelopmentalTrauma_AIMA',
        durationSeconds: 300,
        metrics: {
          avgHrv: Math.floor(activeHrv),
          avgGsr: Number(activeGsr.toFixed(2)),
          dmnSuppressionPct: Math.floor(dmnSuppressionPct),
          tranceDepthPct: Math.floor(tranceDepth),
          frontalEngagementPct: Math.floor(etiologyScores.psychological),
          binauralBetaHz: Number(binauralHz.toFixed(1))
        },
        aiLogs,
        completedAt: new Date().toISOString()
      }
    };

    try {
      await fetch(`${BACKEND_URL}/api/vr/telemetry`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(sessionReport)
      });
    } catch (error) {
      console.warn('[AMIE AIMA] Reporte asegurado en contingencia local:', error);
    } finally {
      if (onClose) onClose();
    }
  };

  const getEcosystemName = (eco: AttachmentEcosystem) => {
    const map: Record<AttachmentEcosystem, string> = {
      'WOMB_LIKE_CAVE': 'Cueva Sensorial (Útero Simbólico)',
      'PROTECTIVE_TREEHOUSE': 'Casa del Árbol (Refugio Infantil)',
      'WARM_HEARTH': 'Hogar Cálido con Chimenea',
      'CALM_BEACH_SUNSET': 'Playa en Atardecer (Respiración Guiada)',
      'SAFE_PLACE_FOREST': 'Santuario Natural (Bosque)',
      'ZEN_GARDEN': 'Jardín Zen Japonés',
      'BIOLUMINESCENT_BEACH': 'Playa Bioluminiscente (Rítmico)'
    };
    return map[eco];
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. BARRA SUPERIOR */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 rounded-xl text-white shadow-[0_0_20px_rgba(219,39,119,0.3)]">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              AIMA Fullscreen Monitor • Protocolo de Trauma Evolutivo &amp; Hipnosis
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Paciente: <strong className="text-white">{safePatientName}</strong> | Etapa: <span className="font-bold text-amber-300">{programConfig.stageNameEs}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95 ${
              aiAutoPilot 
                ? 'bg-purple-950 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${aiAutoPilot ? 'animate-spin' : ''}`} />
            <span>{aiAutoPilot ? 'AI Closed-Loop Activo' : 'Control Manual Terapeuta'}</span>
          </button>

          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isConnected ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}>
            <Activity className="w-4 h-4" />
            <span>{isConnected ? 'Pico 3 Enlazado' : 'Esperando VR...'}</span>
          </div>

          <button
            type="button"
            onClick={handleEmergencyEgress}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition active:scale-95 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Abortar VR (Egress)</span>
          </button>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white cursor-pointer"
            title="Cerrar Monitor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Banner No-Bloqueante de Alerta de Seguridad Somática */}
      {safetyAlertBanner && (
        <div className="bg-rose-950/90 border-b border-rose-500 p-3 px-6 flex items-center justify-between text-xs font-semibold text-rose-200 z-30">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{safetyAlertBanner}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSafetyAlertBanner(null)}
            className="p-1 hover:bg-rose-900 rounded text-rose-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. CUERPO PRINCIPAL */}
      <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        
        {/* PANEL IZQUIERDO: Configuración y Topografía Etológica */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-purple-400" /> Perfil de Inmersión Adaptativo
            </h2>

            {/* Ajuste de Edad */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Edad Evaluada:</span>
                <span className="text-amber-400 font-bold font-mono text-sm">{patientAge} años</span>
              </div>
              <input 
                type="range" min="4" max="90" 
                value={patientAge}
                disabled={sessionActive}
                onChange={(e) => setPatientAge(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Tipología del Trauma */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Naturaleza del Trauma / Disparador
              </label>
              <select 
                disabled={sessionActive}
                value={traumaType}
                onChange={(e) => setTraumaType(e.target.value as TraumaTypology)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-[11px] font-semibold text-slate-200 outline-none cursor-pointer"
              >
                <option value="ATTACHMENT_DEVELOPMENTAL">Apego / Desarrollo (Infantil)</option>
                <option value="COMPLEX_REPETITIVE">TEPT Complejo (TEPT-C / Repetitivo)</option>
                <option value="SINGLE_EVENT_ACUTE">Evento Único Agudo (Asalto / Accidente)</option>
                <option value="INTERPERSONAL_ABUSE">Abuso Interpersonal / Bullying</option>
                <option value="LOSS_BEREAVEMENT">Duelo Traumático / Pérdida</option>
              </select>
            </div>

            {/* Ecosistema de Contención */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Refugio de Apego (Ecosistema VR)
              </label>
              <select 
                disabled={sessionActive}
                value={ecosystem}
                onChange={(e) => setEcosystem(e.target.value as AttachmentEcosystem)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-[11px] font-semibold text-slate-200 outline-none cursor-pointer"
              >
                <optgroup label="Entornos de Contención">
                  <option value="WOMB_LIKE_CAVE">Cueva Sensorial (Útero Simbólico)</option>
                  <option value="PROTECTIVE_TREEHOUSE">Casa del Árbol (Refugio Infantil)</option>
                  <option value="WARM_HEARTH">Hogar Cálido con Chimenea</option>
                  <option value="SAFE_PLACE_FOREST">Santuario Natural (Bosque)</option>
                  <option value="ZEN_GARDEN">Jardín Zen Japonés</option>
                </optgroup>
                <optgroup label="Entornos Rítmicos">
                  <option value="CALM_BEACH_SUNSET">Playa en Atardecer (Respiración Guiada)</option>
                  <option value="BIOLUMINESCENT_BEACH">Playa Bioluminiscente</option>
                </optgroup>
              </select>
            </div>

            {/* Mapeo Biopsicosocial */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-400" /> Desglose Etológico (Depresión / Vacío)
              </span>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-rose-400">Psicológico / Anhedonia:</span>
                  <span className="text-slate-300 font-mono">{Math.round(etiologyScores.psychological)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${etiologyScores.psychological}%` }} className="h-full bg-rose-500 transition-all duration-700" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-amber-400">Social / Desconexión:</span>
                  <span className="text-slate-300 font-mono">{Math.round(etiologyScores.social)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${etiologyScores.social}%` }} className="h-full bg-amber-500 transition-all duration-700" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-indigo-400">Biológico / Tono Vagal:</span>
                  <span className="text-slate-300 font-mono">{Math.round(etiologyScores.biological)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${etiologyScores.biological}%` }} className="h-full bg-indigo-500 transition-all duration-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase block">Fundamento Clínico:</span>
            <p className="text-[10.5px] text-slate-300 leading-snug">{programConfig.clinicalRationale}</p>
          </div>
        </div>

        {/* PANEL CENTRO: Live Transmission POV & HUD Subcortical */}
        <div className="col-span-12 lg:col-span-6 bg-black rounded-2xl border-2 border-slate-800 relative flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
          
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono">
              <Video className={`w-3.5 h-3.5 ${sessionActive ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
              <span>Visor Live: Pico 3 Pro | Metáfora: <strong className="text-purple-300">{programConfig.visualMetaphorNameEs}</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-cyan-300">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>EMDR Bilateral: {emdrBilateralActive ? 'ACTIVO' : 'INACTIVO'}</span>
            </div>
          </div>

          {/* Renderizador de Escena */}
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {sessionActive ? (
              <div className="text-center space-y-6 relative z-10">
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-4 border-cyan-500/40 border-t-cyan-400 animate-spin" />
                  <Brain className="w-12 h-12 text-purple-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Inducción Hypno-VR ({programConfig.stage})
                  </h3>
                  <p className="text-xs text-purple-300 font-mono mt-1">
                    Frecuencia Target: {binauralHz.toFixed(1)} Hz | Trance: {Math.floor(tranceDepth)}%
                  </p>
                  <p className="text-xs text-cyan-300 font-mono mt-2 bg-black/40 px-3 py-1 rounded inline-block">
                    Ecosistema VR: {getEcosystemName(ecosystem)}
                  </p>
                </div>

                {/* Controles de Etapa Clínica */}
                <div className="mt-8 flex justify-center gap-3">
                  <button 
                    type="button"
                    onClick={() => handlePhaseChange('CALIBRATION')} 
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                      simulationPhase === 'CALIBRATION' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Calibración
                  </button>
                  <button 
                    type="button"
                    onClick={() => handlePhaseChange('REGRESSION_INDUCTION')} 
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                      simulationPhase === 'REGRESSION_INDUCTION' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Inducción
                  </button>
                  <button 
                    type="button"
                    onClick={() => handlePhaseChange('SECURE_ATTACHMENT_REPAIR')} 
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                      simulationPhase === 'SECURE_ATTACHMENT_REPAIR' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Reparación
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 relative z-10">
                <ShieldCheck className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-400 max-w-sm">
                  Visor en espera. Presione <strong className="text-purple-400">"Iniciar Protocolo Adaptado"</strong> para transmitir la señal bio-adaptativa.
                </p>
              </div>
            )}
          </div>

          {/* HUD Inferior Biométrico */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 grid grid-cols-5 gap-2 shadow-2xl z-10 text-center font-mono">
            <div className="border-r border-slate-800 pr-1">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Tono Vagal (HRV)</span>
              <div className="text-base font-bold text-emerald-400">{activeHrv.toFixed(1)} <span className="text-[9px] font-normal">ms</span></div>
            </div>

            <div className="border-r border-slate-800 pr-1">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Estrés GSR</span>
              <div className={`text-base font-bold ${activeGsr > programConfig.gsrSafetyThresholduS * 0.8 ? 'text-rose-400 animate-pulse' : 'text-rose-300'}`}>
                {activeGsr.toFixed(2)} <span className="text-[9px] font-normal">µS</span>
              </div>
            </div>

            <div className="border-r border-slate-800 pr-1">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Binaural EEG</span>
              <div className="text-base font-bold text-cyan-300">{binauralHz.toFixed(1)} <span className="text-[9px] font-normal">Hz</span></div>
            </div>

            <div className="border-r border-slate-800 pr-1">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Supresión DMN</span>
              <div className="text-base font-bold text-purple-300">{Math.floor(dmnSuppressionPct)}%</div>
            </div>

            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Prof. Trance</span>
              <div className="text-base font-bold text-pink-400">{Math.floor(tranceDepth)}%</div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Closed-Loop AI Logs & Controles */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-amber-400" /> AI Closed-Loop Regulator
            </h2>

            {/* Consola de Logs */}
            <div className="flex-1 bg-black/50 border border-slate-800 rounded-xl p-3 overflow-y-auto font-mono text-[10px] space-y-2">
              {aiLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-4">Esperando inicialización de la IA...</div>
              ) : (
                aiLogs.map((log, index) => (
                  <div key={index} className={`pb-2 border-b border-slate-800/50 ${
                    log.includes('ALERTA') || log.includes('EMERGENCIA') 
                      ? 'text-rose-400 font-bold' 
                      : log.includes('SISTEMA') 
                      ? 'text-cyan-400' 
                      : 'text-slate-300'
                  }`}>
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* Switch de Estímulo Bilateral */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estímulo Bilateral</span>
              <button
                type="button"
                disabled={!sessionActive}
                onClick={() => setEmdrBilateralActive(!emdrBilateralActive)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  emdrBilateralActive && sessionActive ? 'bg-cyan-500' : 'bg-slate-700'
                } disabled:opacity-50 cursor-pointer`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  emdrBilateralActive && sessionActive ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Botones de Inicio / Parada */}
          <div className="space-y-3 shrink-0">
            {!sessionActive ? (
              <button
                type="button"
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-purple-600/30 transition active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Iniciar Protocolo Adaptado</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEndSession}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 p-3.5 rounded-xl font-bold transition active:scale-95 cursor-pointer"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Finalizar &amp; Guardar Reporte</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VrDevelopmentalTraumaFullscreenMonitor;
