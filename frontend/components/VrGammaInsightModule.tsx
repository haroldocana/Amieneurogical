import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Play, Square, Video, Brain, X, 
  Zap, Sparkles, Lightbulb, Workflow, Cpu, Layers
} from 'lucide-react';
import { PatientRecord } from '../types';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

type RigiditySubtype = 
  | 'OCD_RUMINATION' 
  | 'ASD_RIGID_PERSEVERATION' 
  | 'ANOREXIA_SCHEMATIC_FIXATION' 
  | 'RESISTANT_DEPRESSION_RUMINATION';

export const VrGammaInsightModule: React.FC<Props> = ({ patient, onClose }) => {
  // Configuración Clínica
  const [rigiditySubtype, setRigiditySubtype] = useState<RigiditySubtype>('OCD_RUMINATION');
  const [sessionActive, setSessionActive] = useState(false);
  const [aiAutoPilot, setAiAutoPilot] = useState(true);

  // Parámetros de Estimulación Gamma y Desacoplamiento DMN
  const [gammaFlickerHz, setGammaFlickerHz] = useState<number>(40.0); // Frecuencia fija o modulada (40Hz estándar oro)
  const [visualContrastPct, setVisualContrastPct] = useState<number>(65); // Intensidad fótica en el visor
  
  // Biometría y Mapeo Cortical Dinámico
  const [gammaPowerUv2, setGammaPowerUv2] = useState<number>(4.2); // Potencia Espectral Gamma (µV²)
  const [dmnDeactivationPct, setDmnDeactivationPct] = useState<number>(12); // Desactivación de la Red por Defecto
  const [insightIndex, setInsightIndex] = useState<number>(15); // Índice de Flexibilidad Cognitiva (0-100)
  const [gsr, setGsr] = useState<number>(2.8);
  const [hrv, setHrv] = useState<number>(32);

  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [safetyTriggered, setSafetyTriggered] = useState(false);

  // Motor Closed-Loop de Resonancia Gamma
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (sessionActive && !safetyTriggered) {
      interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('es-GT', { hour12: false });

        // Fluctualización biométrica simulada
        setGsr(prev => Math.max(0.6, prev + (Math.random() * 0.15 - 0.1)));
        setHrv(prev => Math.min(75, Math.max(20, prev + (Math.random() * 2.0 - 0.8))));

        // Incremento progresivo de Potencia Gamma y Desacoplamiento DMN
        setGammaPowerUv2(prev => Math.min(38.0, prev + 0.8));
        setDmnDeactivationPct(prev => Math.min(94, prev + 1.2));
        setInsightIndex(prev => Math.min(96, prev + 0.9));

        // Lógica Autónoma de la IA (Closed-Loop)
        if (aiAutoPilot) {
          if (gammaPowerUv2 > 20.0 && dmnDeactivationPct > 60) {
            if (Math.random() > 0.7) {
              setAiLogs(prev => [
                `[${timeStr}] 💡 INSIGHT DETECTADO: Brote Gamma en 40Hz (${gammaPowerUv2.toFixed(1)} µV²). Inhibición de la Rumiación DMN al ${Math.floor(dmnDeactivationPct)}%. Presentando paradoja de cambio cognitivo.`,
                ...prev.slice(0, 8)
              ]);
            }
          } else {
            if (Math.random() > 0.8) {
              setAiLogs(prev => [
                `[${timeStr}] ⚡ RESONANCIA GAMMA: Ajustando estimulación fótica al ${gammaFlickerHz.toFixed(1)} Hz. Desincronizando bucle obsesivo prefrontal/cingulado.`,
                ...prev.slice(0, 8)
              ]);
            }
          }
        }

        // Seguridad por foto-sensibilidad o sobre-excitación
        if (gsr > 7.5) {
          setSafetyTriggered(true);
          setSessionActive(false);
          alert(`⚠️ ALERTA DE FOTO-EXCITACIÓN: Sobrecarga sensorial detectada (GSR: ${gsr.toFixed(1)} µS). Apagando estimulación fótica Gamma de inmediato.`);
        }

      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, aiAutoPilot, gammaPowerUv2, dmnDeactivationPct, gammaFlickerHz, gsr, safetyTriggered]);

  const handleStartSession = () => {
    setSafetyTriggered(false);
    setSessionActive(true);
    setGammaPowerUv2(5.0);
    setDmnDeactivationPct(15);
    setInsightIndex(18);
    setAiLogs([`[SISTEMA] Iniciando Estimulación Gamma 40Hz por Bucle Cerrado. Blanco: Desacoplamiento DMN (${rigiditySubtype}).`]);
  };

  const handleEmergencyEgress = () => {
    setSessionActive(false);
    setSafetyTriggered(true);
    setAiLogs(prev => [`[EMERGENCIA] Desconexión de seguridad. Suspendiendo pulsos Gamma fóticos/acústicos.`, ...prev]);
  };

  const getSubtypeTitle = (sub: RigiditySubtype) => {
    const map = {
      'OCD_RUMINATION': 'Bucle Obsesivo-Compulsivo (TOC / CIE-11: 6B20)',
      'ASD_RIGID_PERSEVERATION': 'Perseveración Rigida (Trastorno del Espectro Autista / TEA)',
      'ANOREXIA_SCHEMATIC_FIXATION': 'Fijación de Esquema Corporal (Anorexia Nerviosa / CIE-11: 6B80)',
      'RESISTANT_DEPRESSION_RUMINATION': 'Rumiación Autocrítica (Depresión Mayor Resistente / TDM)'
    };
    return map[sub];
  };

  const safePatientName = patient.patientNameAnonymized || patient.id || 'PAC-8104';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. HEADER */}
      <div className="h-16 border-b border-amber-900/50 bg-slate-900 flex items-center justify-between px-6 shadow-[0_4px_30px_rgba(245,158,11,0.15)] z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 via-orange-600 to-yellow-500 rounded-xl text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Lightbulb className="w-5 h-5 animate-pulse text-amber-100" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Inducción de Ondas Gamma (40 Hz) & Flexibilidad Cognitiva (Insight VR)
            </h1>
            <p className="text-[10px] text-amber-300 font-mono flex items-center gap-2">
              Paciente: <strong className="text-white">{safePatientName}</strong> | Desacoplamiento de la Red por Defecto (DMN)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAiAutoPilot(!aiAutoPilot)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              aiAutoPilot 
                ? 'bg-amber-950 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiAutoPilot ? 'animate-spin text-amber-400' : ''}`} />
            {aiAutoPilot ? 'AI Gamma Entrainment Auto-Pilot' : 'Control Manual'}
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
        
        {/* LEFT PANEL: Selección de Fenotipos Rígidos */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Workflow className="w-4 h-4 text-amber-400" /> Blanco Cortical de Rigidez
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Fenotipo Rígido a Romper</label>
              <select 
                disabled={sessionActive}
                value={rigiditySubtype}
                onChange={(e) => setRigiditySubtype(e.target.value as RigiditySubtype)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold focus:border-amber-500 outline-none disabled:opacity-50"
              >
                <option value="OCD_RUMINATION">Bucle Obsesivo-Compulsivo (TOC)</option>
                <option value="ASD_RIGID_PERSEVERATION">Perseveración Rígida (Autismo / TEA)</option>
                <option value="ANOREXIA_SCHEMATIC_FIXATION">Fijación de Esquema (Anorexia)</option>
                <option value="RESISTANT_DEPRESSION_RUMINATION">Rumiación Depresiva Autocrítica</option>
              </select>
            </div>

            {/* Mapeo de Indicadores de Insight */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-amber-400" /> Sincronía y Solución de Bucles
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Potencia Espectral Gamma (40Hz):</span>
                  <span className="text-amber-300 font-mono">{gammaPowerUv2.toFixed(1)} µV²</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${Math.min(100, (gammaPowerUv2 / 40) * 100)}%` }} className="h-full bg-amber-500 transition-all duration-500" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Inhibición Rumiación DMN:</span>
                  <span className="text-yellow-300 font-mono">{Math.floor(dmnDeactivationPct)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${dmnDeactivationPct}%` }} className="h-full bg-yellow-400 transition-all duration-500" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Índice de Insight / Shifting:</span>
                  <span className="text-emerald-400 font-mono">{Math.floor(insightIndex)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div style={{ width: `${insightIndex}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 mt-4">
            <span className="text-[10px] font-bold text-amber-400 uppercase block">Mecanismo Gamma 40Hz:</span>
            <p className="text-[10.5px] text-slate-300 leading-snug">
              Los pulsos fóticos/auditivos a 40 Hz rompen la hiper-sincronía lenta de la red por defecto (DMN), permitiendo que la corteza frontal reorganice sus esquemas y acepte nuevas alternativas cognitivas.
            </p>
          </div>
        </div>

        {/* CENTER PANEL: POV Visor 1ª Persona (Flicker & Insight Matrix) */}
        <div className="col-span-12 lg:col-span-6 bg-[#0c0a03] rounded-2xl border-2 border-slate-800 relative flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
          
          {/* Overlay Status del Visor */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/30 text-xs font-mono text-amber-100">
              <Video className={`w-3.5 h-3.5 ${sessionActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              Objetivo: <span className="font-bold text-white">{getSubtypeTitle(rigiditySubtype)}</span>
            </div>
          </div>

          {/* Renderizador de Estimulación Fótica 40Hz */}
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {sessionActive ? (
              <div className="text-center space-y-6 relative z-10">
                <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-[2px] border-amber-500/30 rounded-full animate-ping" style={{ animationDuration: '0.8s' }} />
                  <div className="absolute inset-3 border-[3px] border-yellow-400/50 border-t-amber-300 rounded-full animate-spin" style={{ animationDuration: '1.2s' }} />
                  <Lightbulb className="w-16 h-16 text-amber-300 animate-bounce" />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-amber-200 font-mono tracking-widest uppercase">
                    Resonancia Gamma 40 Hz Activa
                  </h3>
                  <p className="text-xs text-yellow-300 font-mono mt-2">
                    Frecuencia Fótica: {gammaFlickerHz.toFixed(1)} Hz | Contraste: {visualContrastPct}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 relative z-10">
                <Layers className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-400 max-w-sm">
                  Visor alineado. Al iniciar, la estimulación fótica Gamma a 40 Hz desincronizará la red de rumiación obsesiva.
                </p>
              </div>
            )}
          </div>

          {/* HUD Inferior de Telemetría Gamma */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-xl border border-amber-900/50 rounded-xl p-3 grid grid-cols-4 gap-2 shadow-2xl z-10 text-center font-mono">
            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Potencia Gamma (40Hz)</span>
              <div className="text-xl font-bold text-amber-300">
                {gammaPowerUv2.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">µV²</span>
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Inhibición DMN</span>
              <div className="text-xl font-bold text-yellow-300">
                {Math.floor(dmnDeactivationPct)}%
              </div>
            </div>

            <div className="border-r border-slate-800">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Frecuencia Fótica</span>
              <div className="text-xl font-bold text-amber-400">
                {gammaFlickerHz.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">Hz</span>
              </div>
            </div>

            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block mb-1">Índice Insight</span>
              <div className="text-xl font-bold text-emerald-400">
                {Math.floor(insightIndex)}%
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Closed-Loop AI Logs & Controles */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-amber-400" /> AI Gamma Controller
            </h2>

            {/* Bitácora de la IA */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] leading-relaxed flex flex-col gap-2 overflow-y-auto max-h-[300px] relative shadow-inner">
              <div className="absolute top-2 right-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>

              {aiLogs.length > 0 ? (
                aiLogs.map((log, i) => (
                  <div key={i} className={`p-2 rounded border ${
                    i === 0 
                      ? 'text-amber-300 bg-amber-950/30 border-amber-900/50 font-semibold' 
                      : 'text-slate-400 border-slate-800/60'
                  }`}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-center p-4">
                  A la espera de inducción de estimulación fótica 40Hz...
                </div>
              )}
            </div>

            {/* Controles Manuales del Terapeuta */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Frecuencia Fótica Gamma:</span>
                  <span className="text-amber-300 font-mono">{gammaFlickerHz.toFixed(1)} Hz</span>
                </div>
                <input 
                  type="range" min="30.0" max="50.0" step="0.5"
                  value={gammaFlickerHz}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setGammaFlickerHz(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer disabled:opacity-30"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Intensidad de Contraste Fótico:</span>
                  <span className="text-yellow-300 font-mono">{visualContrastPct}%</span>
                </div>
                <input 
                  type="range" min="20" max="100" step="5"
                  value={visualContrastPct}
                  disabled={aiAutoPilot || !sessionActive}
                  onChange={(e) => setVisualContrastPct(parseInt(e.target.value))}
                  className="w-full accent-yellow-500 cursor-pointer disabled:opacity-30"
                />
              </div>
            </div>
          </div>

          {/* Botones de Control de Sesión */}
          <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-600/20 transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Estimulación Gamma 40Hz
              </button>
            ) : (
              <button
                onClick={() => setSessionActive(false)}
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
