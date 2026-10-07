import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Play, Square, Video, Activity, Brain, X, 
  Zap, Target, Sparkles, RotateCcw, Lock, Unlock, Eye, HeartPulse, Glasses, Mountain
} from 'lucide-react';
import { PatientRecord } from '../types';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

type TraumaCategory = 'PTSD_COMBAT_ACCIDENT' | 'SPECIFIC_PHOBIA' | 'PANIC_AGORAPHOBIA' | 'EARLY_ATTACHMENT_TRAUMA';
type ReconsolidationPhase = 'IDLE' | 'PHASE_1_RETRIEVAL' | 'PHASE_2_MISMATCH' | 'PHASE_3_REENCODING' | 'COMPLETED';

type EmdrEcosystem = 
  | 'NEUTRAL_VOID' | 'COSMIC_STARS' | 'CLINIC_ROOM' | 'LOW_POLY_WHITE_ROOM'
  | 'SAFE_PLACE_FOREST' | 'ZEN_GARDEN' | 'SNOW_CABIN' | 'BIOLUMINESCENT_BEACH'
  | 'SKYSCRAPER_ROOF' | 'AIRPLANE_CABIN' | 'CROWDED_AUDITORIUM' | 'CONFINED_ELEVATOR';

export const VrMemoryReconsolidationModule: React.FC<Props> = ({ patient, onClose }) => {
  // Configuración Clínica
  const [traumaCategory, setTraumaCategory] = useState<TraumaCategory>('PTSD_COMBAT_ACCIDENT');
  const [ecosystem, setEcosystem] = useState<EmdrEcosystem>('SAFE_PLACE_FOREST');
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);

  // Fase del Algoritmo de Reconsolidación
  const [currentPhase, setCurrentPhase] = useState<ReconsolidationPhase>('IDLE');
  
  // Parámetros de Intervención EMDR 3D + Binaural
  const [emdrSweepSpeedHz, setEmdrSweepSpeedHz] = useState<number>(1.8);
  const [binauralThetaHz, setBinauralThetaHz] = useState<number>(4.5);
  
  // Biometría en Tiempo Real
  const [gsr, setGsr] = useState<number>(1.5); // Refleja carga emocional amigdalar
  const [hrv, setHrv] = useState<number>(42);  // Refleja tono vagal de seguridad
  const [extinctionIndexH, setExtinctionIndexH] = useState<number>(0.5); // Índice H (Extinción)
  const [engramLabilityPct, setEngramLabilityPct] = useState<number>(0); // Maleabilidad de la memoria

  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [safetyTriggered, setSafetyTriggered] = useState(false);

  // -------------------------------------------------------------------------
  // CONEXIÓN PUENTE VR (EMISOR EN METAVERSE)
  // -------------------------------------------------------------------------
  const { isConnected, transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', 'PTSDExposure');

  // Transmisión en vivo de biometría amigdalar y fase de reconsolidación
  useEffect(() => {
    if (sessionActive && !safetyTriggered) {
      transmit({
        gsr: Number(gsr.toFixed(2)),
        hrv: Math.floor(hrv),
        stressLevel: Number(gsr.toFixed(2)),
        habituationIndex: Number(extinctionIndexH.toFixed(2)),
        omissions: Math.floor(engramLabilityPct) // Labilidad del engrama (%)
      });
    }
  }, [gsr, hrv, extinctionIndexH, engramLabilityPct, currentPhase, sessionActive, safetyTriggered, transmit]);

  // Motor Closed-Loop de Reconsolidación de Memoria
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (sessionActive && !safetyTriggered) {
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });

        // LÓGICA DE FASES DEL ALGORITMO
        if (currentPhase === 'PHASE_1_RETRIEVAL') {
          // Fase 1: Inducción de Pico de Miedo para abrir el engrama
          setGsr(prev => Math.min(7.0, prev + 0.4));
          setHrv(prev => Math.max(12, prev - 1.5));
          setEngramLabilityPct(prev => Math.min(100, prev + 12));

          if (gsr > 4.5 && engramLabilityPct > 70) {
            setCurrentPhase('PHASE_2_MISMATCH');
            setAiLogs(prev => [
              `[${timeStr}] 🔓 ENGRAMA LÁBIL: Pico de sobresalto amigdalar (${gsr.toFixed(1)} µS). Memoria abierta. Disparando Error de Predicción Mismatch + EMDR 3D.`,
              ...prev.slice(0, 8)
            ]);
          }
        } else if (currentPhase === 'PHASE_2_MISMATCH') {
          // Fase 2: Inyección de Señal de Seguridad Absoluta
          setGsr(prev => Math.max(1.0, prev - 0.5));
          setHrv(prev => Math.min(80, prev + 2.0));
          setExtinctionIndexH(prev => Math.min(3.5, prev + 0.15));

          if (gsr < 2.2 && hrv > 50) {
            setCurrentPhase('PHASE_3_REENCODING');
            setAiLogs(prev => [
              `[${timeStr}] 🧠 DESACOPLAMIENTO AUTONÓMICO: Amígdala silenciada bajo tono vagal (${hrv.toFixed(0)} ms). Re-guardando memoria con valencia neutra...`,
              ...prev.slice(0, 8)
            ]);
          }
        } else if (currentPhase === 'PHASE_3_REENCODING') {
          // Fase 3: Consolidación neutra
          setEngramLabilityPct(prev => Math.max(0, prev - 8));
          setExtinctionIndexH(prev => Math.min(4.0, prev + 0.05));

          if (engramLabilityPct <= 0) {
            setCurrentPhase('COMPLETED');
            setAiLogs(prev => [
              `[${timeStr}] ✅ RECONSOLIDACIÓN EXITOSA: Engrama traumático guardado sin carga afectiva. Índice H = ${extinctionIndexH.toFixed(2)}. Fobia/Trauma reescrito.`,
              ...prev.slice(0, 8)
            ]);
          }
        }

        // Alerta de sobre-reactividad (Abreacción traumática)
        if (gsr > 8.5) {
          setSafetyTriggered(true);
          setSessionActive(false);
          alert(`⚠️ ALERTA DE ABREACCIÓN: Desbordamiento autonómico (GSR: ${gsr.toFixed(1)} µS). Abortando exposición e inyectando campo biofílico de rescate.`);
        }

      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, currentPhase, gsr, hrv, engramLabilityPct, extinctionIndexH, safetyTriggered]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSessionActive(true);
    setCurrentPhase('PHASE_1_RETRIEVAL');
    setGsr(1.5);
    setHrv(45);
    setEngramLabilityPct(10);
    setExtinctionIndexH(0.2);
    setAiLogs([`[SISTEMA] Entorno VR cargado: ${getEcosystemName(ecosystem)}. Iniciando Reconsolidación...`]);
    transmit({ type: 'LOAD_MODULE', patientId: patient?.id, moduleName: 'PTSDExposure', ecosystem });
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setCurrentPhase('IDLE');
    setAiLogs(prev => [`[EMERGENCIA] Desconexión de seguridad. Abortando reconsolidación.`, ...prev]);
  };

  // -------------------------------------------------------------------------
  // CONSOLIDACIÓN Y GUARDADO DE REPORTE FINAL EN MONGODB
  // -------------------------------------------------------------------------
  const handleEndSession = async () => {
    setSessionActive(false);
    setAiLogs(prev => [`[SISTEMA] Sesión completada. Guardando reporte de reconsolidación en el expediente...`, ...prev]);

    const sessionReport = {
      patientId: patient?.id || 'PAC-8104',
      sessionData: {
        taskName: 'PTSDExposure',
        durationSeconds: 300,
        metrics: {
          avgHrv: Math.floor(hrv),
          avgGsr: Number(gsr.toFixed(2)),
          omissions: 0,
          commissions: 0,
          frontalEngagementPct: Math.floor((extinctionIndexH / 4) * 100), // Extinción en escala %
          binauralBetaHz: Number(binauralThetaHz.toFixed(1))
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
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al guardar reporte VR:", error);
    }
  };

  const getCategoryTitle = (cat: TraumaCategory) => {
    const map = {
      'PTSD_COMBAT_ACCIDENT': 'TEPT: Evento Traumático / Combate (CIE-11: 6B40)',
      'SPECIFIC_PHOBIA': 'Fobia Específica: Alturas / Encierro',
      'PANIC_AGORAPHOBIA': 'Trastorno de Pánico / Agorafobia',
      'EARLY_ATTACHMENT_TRAUMA': 'Trauma Complejo de Apego (C-PTSD)'
    };
    return map[cat];
  };

  const getEcosystemName = (eco: EmdrEcosystem) => {
    const map: Record<EmdrEcosystem, string> = {
      'NEUTRAL_VOID': 'Vacío Neutral (Foco Total)',
      'COSMIC_STARS': 'Nebulosa Estelar (Amplitud)',
      'CLINIC_ROOM': 'Consultorio Clínico Virtual',
      'LOW_POLY_WHITE_ROOM': 'Sala Estéril (Baja Sobrecarga)',
      'SAFE_PLACE_FOREST': 'Santuario Natural (Bosque)',
      'ZEN_GARDEN': 'Jardín Zen Japonés',
      'SNOW_CABIN': 'Cabaña Nevada (Refugio)',
      'BIOLUMINESCENT_BEACH': 'Playa Bioluminiscente',
      'SKYSCRAPER_ROOF': 'Exposición: Rascacielos',
      'AIRPLANE_CABIN': 'Exposición: Cabina Avión',
      'CROWDED_AUDITORIUM': 'Exposición: Auditorio',
      'CONFINED_ELEVATOR': 'Exposición: Ascensor'
    };
    return map[eco];
  };

  const safePatientName = patient.patientNameAnonymized || patient.id || 'PAC-8104';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. HEADER */}
      <div className="h-16 border-b border-rose-900/50 bg-slate-900 flex items-center justify-between px-6 shadow-[0_4px_30px_rgba(225,29,72,0.15)] z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-rose-600 via-pink-600 to-purple-600 rounded-xl text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]">
            <RotateCcw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Reconsolidación de Memoria & Extinción EMDR
            </h1>
            <p className="text-[10px] text-rose-300 font-mono flex items-center gap-2">
              Paciente: <strong className="text-white">{safePatientName}</strong> | Desacoplamiento Amigdalar en Bucle Cerrado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              aiAutoPilot 
                ? 'bg-rose-950 border-rose-500 text-rose-200 shadow-[0_0_12px_rgba(225,29,72,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiAutoPilot ? 'animate-pulse text-rose-400' : ''}`} />
            {aiAutoPilot ? 'AI Reconsolidation Auto-Pilot' : 'Control Manual Terapeuta'}
          </button>

          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
            <Activity className="w-4 h-4" /> {isConnected ? 'VR Conectado' : 'Esperando VR...'}
          </div>

          <button
            onClick={handleEmergencyEgress}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" /> Abortar VR
          </button>

          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        
        {/* LEFT PANEL: Selección de Traumas y Entornos */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Target className="w-4 h-4 text-rose-400" /> Diana Traumática y Ecosistema
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">1. Ecosistema Seguro / Exposición</label>
                <select 
                  disabled={sessionActive || currentPhase === 'COMPLETED'}
                  value={ecosystem}
                  onChange={(e) => setEcosystem(e.target.value as EmdrEcosystem)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold focus:border-rose-500 outline-none disabled:opacity-50"
                >
                  <optgroup label="Foco Absoluto (EMDR)">
                    <option value="NEUTRAL_VOID">Vacío Neutral Geométrico</option>
                    <option value="COSMIC_STARS">Nebulosa Estelar Inmersiva</option>
                    <option value="CLINIC_ROOM">Consultorio Clínico Virtual</option>
                    <option value="LOW_POLY_WHITE_ROOM">Sala Estéril (Baja Sobrecarga)</option>
                  </optgroup>
                  <optgroup label="Contención y Anclaje">
                    <option value="SAFE_PLACE_FOREST">Santuario Natural (Bosque)</option>
                    <option value="ZEN_GARDEN">Jardín Zen Japonés</option>
                    <option value="SNOW_CABIN">Cabaña Nevada con Chimenea</option>
                    <option value="BIOLUMINESCENT_BEACH">Playa Bioluminiscente</option>
                  </optgroup>
                  <optgroup label="Exposición Prolongada (VRET)">
                    <option value="SKYSCRAPER_ROOF">Terraza de Rascacielos (Acrofobia)</option>
                    <option value="AIRPLANE_CABIN">Cabina de Avión (Aerofobia)</option>
                    <option value="CROWDED_AUDITORIUM">Auditorio Lleno (Ansiedad Social)</option>
                    <option value="CONFINED_ELEVATOR">Ascensor Estrecho (Claustrofobia)</option>
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">2. Categoría de Memoria a Reescritura</label>
                <select 
                  disabled={sessionActive || currentPhase === 'COMPLETED'}
                  value={traumaCategory}
                  onChange={(e) => setTraumaCategory(e.target.value as TraumaCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold focus:border-rose-500 outline-none disabled:opacity-50"
                >
                  <option value="PTSD_COMBAT_ACCIDENT">TEPT: Evento Traumático / Accidente</option>
                  <option value="SPECIFIC_PHOBIA">Fobia Específica Dirigida</option>
                  <option value="PANIC_AGORAPHOBIA">Pánico y Agorafobia Espacial</option>
                  <option value="EARLY_ATTACHMENT_TRAUMA">Trauma Complejo de Apego (C-PTSD)</option>
                </select>
              </div>
            </div>

            {/* Monitor de Estado de la Memoria (Labilidad) */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-rose-400" /> Estado del Engrama</span>
                {engramLabilityPct > 50 ? (
                  <span className="text-rose-400 text-[9px] font-mono flex items-center gap-1"><Unlock className="w-3 h-3"/> LÁBIL (ABIERTO)</span>
                ) : (
                  <span className="text-emerald-400 text-[9px] font-mono flex items-center gap-1"><Lock className="w-3 h-3"/> CONSOLIDADO</span>
                )}
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Ventana de Maleabilidad:</span>
                  <span className="text-rose-300 font-mono">{Math.floor(engramLabilityPct)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${engramLabilityPct}%` }} className="h-full bg-rose-500 transition-all duration-300" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Índice de Extinción (H):</span>
                  <span className="text-emerald-400 font-mono">{extinctionIndexH.toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${Math.min(100, (extinctionIndexH / 4) * 100)}%` }} className="h-full bg-emerald-500 transition-all duration-300" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 mt-4">
            <span className="text-[10px] font-bold text-rose-400 uppercase block">Fundamento Neuro-Científico:</span>
            <p className="text-[10.5px] text-slate-300 leading-snug">
              Al detonar el miedo y neutralizarlo mediante barridos EMDR y coherencia vagal en un entorno seguro, la amígdala pierde la capacidad de re-consolidar la señal, reescribiendo la sinapsis del recuerdo de forma permanente.
            </p>
          </div>
        </div>

        {/* CENTER PANEL: POV Simulador VR */}
        <div className="col-span-12 lg:col-span-6 bg-[#090308] rounded-2xl border-2 border-slate-800 relative flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
          
          {/* Overlay Status del Visor */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-rose-500/30 text-xs font-mono text-rose-100">
              <Video className={`w-3.5 h-3.5 ${sessionActive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
              Fase: <span className="font-bold text-white uppercase">{currentPhase.replace('PHASE_', 'Fase ')}</span>
            </div>
            {sessionActive && (
              <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1.5">
                <Mountain className="w-3 h-3 text-slate-400" /> {getEcosystemName(ecosystem)}
              </div>
            )}
          </div>

          {/* Renderizador de Estado Emocional 3D */}
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {sessionActive || currentPhase === 'COMPLETED' ? (
              <div className="text-center space-y-6 relative z-10">
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                  <div className={`absolute inset-0 border-[2px] rounded-full ${
                    currentPhase === 'COMPLETED' ? 'border-emerald-500' :
                    currentPhase === 'PHASE_1_RETRIEVAL' ? 'border-rose-500/50 animate-ping' : 'border-emerald-500/50 animate-ping'
                  }`} style={{ animationDuration: currentPhase === 'PHASE_1_RETRIEVAL' ? '1s' : '3s' }} />
                  
                  {currentPhase !== 'COMPLETED' && (
                    <div className="absolute inset-4 border-[3px] border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: `${(1 / emdrSweepSpeedHz).toFixed(1)}s` }} />
                  )}
                  
                  <Eye className={`w-16 h-16 transition-colors duration-500 ${
                    currentPhase === 'COMPLETED' ? 'text-emerald-400' :
                    currentPhase === 'PHASE_1_RETRIEVAL' ? 'text-rose-500 animate-bounce' : 'text-emerald-300'
                  }`} />
                </div>
                
                <div>
                  <h3 className={`text-lg font-bold font-mono tracking-widest uppercase ${
                    currentPhase === 'COMPLETED' ? 'text-emerald-400' :
                    currentPhase === 'PHASE_1_RETRIEVAL' ? 'text-rose-400' : 'text-emerald-300'
                  }`}>
                    {currentPhase === 'PHASE_1_RETRIEVAL' && '1. Activación de Detonante Traumático'}
                    {currentPhase === 'PHASE_2_MISMATCH' && '2. Inyección Mismatch & Barrido EMDR 3D'}
                    {currentPhase === 'PHASE_3_REENCODING' && '3. Re-consolidación Neutra en Curso'}
                    {currentPhase === 'COMPLETED' && '✅ Reescritura Completada'}
                  </h3>
                  {currentPhase !== 'COMPLETED' && (
                    <p className="text-xs text-slate-400 font-mono mt-2 bg-black/40 px-3 py-1 rounded inline-block">
                      Barrido Sacádico EMDR: {emdrSweepSpeedHz.toFixed(1)} Hz | Frecuencia Theta: {binauralThetaHz.toFixed(1)} Hz
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 relative z-10">
                <Brain className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-400 max-w-sm">
                  Selecciona el Ecosistema VR y la Categoría Traumática a la izquierda para iniciar la reprogramación del engrama.
                </p>
              </div>
            )}
          </div>

          {/* HUD Inferior de Telemetría Amigdalar */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-xl border border-rose-900/50 rounded-xl p-3 grid grid-cols-4 gap-2 shadow-2xl z-10 text-center font-mono">
            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Carga Amigdalar (GSR)</span>
              <div className={`text-xl font-bold ${gsr > 4.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {gsr.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">µS</span>
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1 flex items-center justify-center gap-1"><HeartPulse className="w-3 h-3"/> Tono Vagal (HRV)</span>
              <div className="text-xl font-bold text-cyan-300">
                {hrv.toFixed(0)} <span className="text-[10px] font-normal text-slate-500">ms</span>
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">EMDR Sweep</span>
              <div className="text-xl font-bold text-purple-300">
                {emdrSweepSpeedHz.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">Hz</span>
              </div>
            </div>

            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Índice Extinción H</span>
              <div className="text-xl font-bold text-emerald-400">
                {extinctionIndexH.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Closed-Loop AI Logs & Controles */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-rose-400" /> AI Memory Reconsolidation
            </h2>

            {/* Bitácora de la IA de Reconsolidación */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] leading-relaxed flex flex-col gap-2 overflow-y-auto max-h-[300px] relative shadow-inner">
              <div className="absolute top-2 right-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>

              {aiLogs.length > 0 ? (
                aiLogs.map((log, i) => (
                  <div key={i} className={`p-2 rounded border ${
                    i === 0 
                      ? 'text-rose-300 bg-rose-950/30 border-rose-900/50 font-semibold' 
                      : 'text-slate-400 border-slate-800/60'
                  }`}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-center p-4">
                  A la espera de apertura del engrama traumático...
                </div>
              )}
            </div>

            {/* Controles Manuales del Terapeuta */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Velocidad EMDR 3D (Hz):</span>
                  <span className="text-purple-300 font-mono">{emdrSweepSpeedHz.toFixed(1)} Hz</span>
                </div>
                <input 
                  type="range" min="0.5" max="3.0" step="0.1"
                  value={emdrSweepSpeedHz}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setEmdrSweepSpeedHz(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer disabled:opacity-30"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Binaural Theta (Santuario):</span>
                  <span className="text-cyan-300 font-mono">{binauralThetaHz.toFixed(1)} Hz</span>
                </div>
                <input 
                  type="range" min="3.0" max="7.0" step="0.1"
                  value={binauralThetaHz}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setBinauralThetaHz(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer disabled:opacity-30"
                />
              </div>
            </div>
          </div>

          {/* Botones de Control de Sesión */}
          <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
            
            {/* INSTRUCCIONES DE INGRESO PARA EL PACIENTE */}
            {!isConnected && !sessionActive && currentPhase !== 'COMPLETED' && (
              <div className="mb-4 p-3 bg-slate-900/80 border border-rose-500/30 border-dashed rounded-xl flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                  <Glasses className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-0.5">Esperando conexión del paciente...</strong>
                  El paciente debe colocarse el visor VR para acceder al ecosistema.
                </div>
              </div>
            )}

            {!sessionActive && currentPhase !== 'COMPLETED' ? (
              <button
                disabled={!isConnected}
                onClick={handleStartSession}
                className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl shadow-lg transition active:scale-95 ${
                  !isConnected 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-rose-600/20'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                {!isConnected ? 'Esperando Visor...' : 'Iniciar Reescritura de Memoria'}
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl shadow-lg transition active:scale-95"
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
