import React, { useState, useEffect } from 'react';
import { ShieldAlert, Play, Square, Video, Eye, HeartPulse, Brain, Waves, Sliders, X, Activity, User, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PatientRecord } from '../types';
import { calculateAdaptedProgram, TraumaTypology, DevelopmentalStage, AdaptedProgramConfig } from '../services/developmentalTraumaEngine';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrDevelopmentalTraumaFullscreenMonitor: React.FC<Props> = ({ patient, onClose }) => {
  // Estado de Selección de la Evaluación Evolutiva
  const [patientAge, setPatientAge] = useState<number>(patient.age || 28);
  const [traumaType, setTraumaType] = useState<TraumaTypology>('COMPLEX_REPETITIVE');
  
  // Configuración calculada dinámicamente
  const [programConfig, setProgramConfig] = useState<AdaptedProgramConfig>(
    calculateAdaptedProgram(patientAge, traumaType)
  );

  // Estados de Sesión en Vivo
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);

  // Métricas del Visor y Fisiología (Simuladas / LSL Link)
  const [binauralHz, setBinauralHz] = useState<number>(programConfig.recommendedBinauralHz);
  const [tranceDepth, setTranceDepth] = useState<number>(10);
  const [hrv, setHrv] = useState<number>(42);
  const [gsr, setGsr] = useState<number>(1.8);
  const [safetyTriggered, setSafetyTriggered] = useState<boolean>(false);

  // Recalcular configuración si cambia la edad o la tipología
  useEffect(() => {
    const newConfig = calculateAdaptedProgram(patientAge, traumaType);
    setProgramConfig(newConfig);
    if (!sessionActive) {
      setBinauralHz(newConfig.recommendedBinauralHz);
    }
  }, [patientAge, traumaType]);

  // Bucle Bio-Adaptativo en Tiempo Real
  useEffect(() => {
    let interval: any;
    if (sessionActive && !safetyTriggered) {
      interval = setInterval(() => {
        // Simulación de fluctuación fisiológica
        setHrv(prev => Math.min(80, Math.max(15, prev + (Math.random() * 3 - 1.2))));
        setGsr(prev => Math.max(0.4, prev + (Math.random() * 0.2 - 0.12)));

        // Verificación de Umbral de Seguridad
        if (gsr > programConfig.gsrSafetyThresholduS) {
          setSafetyTriggered(true);
          setSessionActive(false);
          alert(`⚠️ DESCONEXIÓN AUTOMÁTICA DE SEGURIDAD: Disparo de GSR (${gsr.toFixed(2)} uS) superó el límite de seguridad para la etapa ${programConfig.stageNameEs} (${programConfig.gsrSafetyThresholduS} uS).`);
          return;
        }

        // Modulación Bio-Adaptativa (AI Auto-Pilot)
        if (aiAutoPilot) {
          setTranceDepth(prev => Math.min(95, prev + 0.8));
          if (binauralHz > programConfig.minBinauralHz) {
            setBinauralHz(prev => Math.max(programConfig.minBinauralHz, +(prev - 0.05).toFixed(2)));
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, aiAutoPilot, gsr, programConfig, safetyTriggered]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSessionActive(true);
    setTranceDepth(15);
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setSafetyTriggered(true);
    setBinauralHz(12.0);
    setTranceDepth(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      {/* 1. BARRA SUPERIOR ESTRUCTURAL */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shadow-2xl z-20">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-600/20 border border-purple-500/40 rounded-xl">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              AIMA Fullscreen Monitor: Protocolo de Trauma Evolutivo
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-2">
              <User className="w-3 h-3" /> Paciente: {patient.name} | Etapa Detectada: <span className="font-bold text-amber-300">{programConfig.stageNameEs}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              aiAutoPilot ? 'bg-indigo-950 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiAutoPilot ? 'animate-spin' : ''}`} />
            {aiAutoPilot ? 'AI Auto-Pilot Activo' : 'Control Manual Terapeuta'}
          </button>

          <button
            onClick={handleEmergencyEgress}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition"
          >
            <ShieldAlert className="w-4 h-4" /> Abortar VR (Egress)
          </button>

          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition">
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 h-[calc(100vh-4rem)]">
        {/* 2. PANEL IZQUIERDO: Configuración por Etapa Evolutiva */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 p-5 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" /> Ajuste del Perfil Paciente
            </h2>

            {/* Ajuste de Edad */}
            <div className="space-y-2 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Edad del Paciente:</span>
                <span className="text-amber-400 font-bold font-mono text-sm">{patientAge} años</span>
              </div>
              <input 
                type="range" min="4" max="90" 
                value={patientAge}
                disabled={sessionActive}
                onChange={(e) => setPatientAge(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Seleccionar Tipología de Trauma */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Naturaleza del Trauma</label>
              {[
                { id: 'ATTACHMENT_DEVELOPMENTAL', name: 'Apego / Desarrollo (Infantil)' },
                { id: 'COMPLEX_REPETITIVE', name: 'TEPT Complejo (TEPT-C / Repetitivo)' },
                { id: 'SINGLE_EVENT_ACUTE', name: 'Evento Único Agudo (Asalto/Accidente)' },
                { id: 'INTERPERSONAL_ABUSE', name: 'Abuso Interpersonal / Bullying' },
                { id: 'MEDICAL_SOMATIC', name: 'Trauma Médico / Dolor Somático' },
                { id: 'LOSS_BEREAVEMENT', name: 'Duelo Traumático / Loss' }
              ].map(t => (
                <button
                  key={t.id}
                  disabled={sessionActive}
                  onClick={() => setTraumaType(t.id as TraumaTypology)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold border transition ${
                    traumaType === t.id
                      ? 'bg-purple-950/80 border-purple-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Justificación Neurobiológica */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Racional Clínico Adaptativo:</span>
            <p className="text-xs text-slate-300 leading-relaxed">{programConfig.clinicalRationale}</p>
          </div>
        </div>

        {/* 3. CENTRO: Monitor de Transmisión Visor (Pico Neo 3 POV) y HUD Biométrico */}
        <div className="flex-1 bg-black relative flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
            
            {/* Overlay Status del Visor */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono">
              <Video className={`w-3.5 h-3.5 ${sessionActive ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
              Live Feed: Pico Neo 3 | Metáfora: <span className="text-purple-300 font-bold">{programConfig.visualMetaphorNameEs}</span>
            </div>

            {/* Simulación Gráfica del Entorno según Fase */}
            {sessionActive ? (
              <div className="text-center space-y-3">
                <div className="w-24 h-24 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mx-auto"></div>
                <p className="text-sm font-mono text-purple-200">
                  Ejecutando Inducción Hypno-VR ({programConfig.stage}) a {binauralHz.toFixed(1)} Hz
                </p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-500">
                  Presione "Iniciar Protocolo Adaptado" para transmitir al visor
                </p>
              </div>
            )}

            {/* HUD Inferior de Telemetría Subcortical */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 grid grid-cols-4 gap-4 shadow-2xl">
              <div className="text-center border-r border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Tono Vagal (HRV)</span>
                <div className="text-lg font-bold font-mono text-emerald-400">{hrv.toFixed(1)} ms</div>
              </div>
              <div className="text-center border-r border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Estrés GSR (Límite {programConfig.gsrSafetyThresholduS}uS)</span>
                <div className={`text-lg font-bold font-mono ${gsr > programConfig.gsrSafetyThresholduS * 0.8 ? 'text-rose-400 animate-pulse' : 'text-rose-300'}`}>
                  {gsr.toFixed(2)} uS
                </div>
              </div>
              <div className="text-center border-r border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Frecuencia Binaural</span>
                <div className="text-lg font-bold font-mono text-cyan-300">{binauralHz.toFixed(1)} Hz</div>
              </div>
              <div className="text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Profundidad Trance</span>
                <div className="text-lg font-bold font-mono text-purple-300">{tranceDepth}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. PANEL DERECHO: Controles Manuales y Log de Seguridad */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Parámetros de Inducción
            </h3>

            {/* Frecuencia Binaural Manual */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Audio Binaural Target:</span>
                <span className="text-cyan-300 font-mono font-bold">{binauralHz.toFixed(1)} Hz</span>
              </div>
              <input 
                type="range" 
                min={programConfig.minBinauralHz} 
                max={programConfig.maxBinauralHz} 
                step="0.1"
                value={binauralHz}
                disabled={aiAutoPilot}
                onChange={(e) => setBinauralHz(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer disabled:opacity-30"
              />
              <span className="text-[10px] text-slate-500 block">Rango permitido para {programConfig.stageNameEs}: {programConfig.minBinauralHz}Hz - {programConfig.maxBinauralHz}Hz</span>
            </div>

            {/* Disparadores de Seguridad Activos */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase block">Monitoreo de Umbral Límite:</span>
              <p className="text-xs text-slate-400">
                Sensibilidad GSR: <span className="font-bold text-white">{programConfig.gsrSafetyThresholduS} µS</span>
              </p>
              <p className="text-xs text-slate-400">
                Velocidad Cinetosis VR: <span className="font-bold text-white">{programConfig.vrMotionSpeedMultiplier * 100}%</span>
              </p>
            </div>
          </div>

          {/* Botones de Ejecución */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/20 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Protocolo Adaptado
              </button>
            ) : (
              <button
                onClick={() => setSessionActive(false)}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl shadow-lg transition"
              >
                <Square className="w-4 h-4 fill-current" />
                Concluir Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
