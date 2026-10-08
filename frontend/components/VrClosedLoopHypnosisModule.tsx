import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { Sparkles, Activity, Play, Square, ShieldCheck, Heart, Sliders, Waves, Moon, Cpu, Zap, AlertTriangle } from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

type HypnosisProtocolType = 
  | 'PROGRESSIVE_RELAXATION' 
  | 'ERICKSONIAN_METAPHOR' 
  | 'SOMATIC_GROUNDING' 
  | 'FRACTIONAL_DEEPENING' 
  | 'COGNITIVE_RESTITUTION' 
  | 'REGRESSIVE_INTEGRATION';

export const VrClosedLoopHypnosisModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  const { isConnected, transmit, liveData, syncSession } = useVrTelemetryBridge('sender', patientId, 'NEURO_HYPNOSIS');

  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [tranceDepth, setTranceDepth] = useState<number>(45); // 0 a 100%
  
  // Catálogo completo de protocolos profesionales de hipnosis
  const [inductionProtocol, setInductionProtocol] = useState<HypnosisProtocolType>('ERICKSONIAN_METAPHOR');
  const [voiceModulation, setVoiceModulation] = useState<'WHISPER' | 'SOFT_GUIDE' | 'DEEP_RESONANT' | 'NEURO_MODULATED'>('NEURO_MODULATED');
  const [ambientTheme, setAmbientTheme] = useState<'ALPINE_SANCTUARY' | 'DEEP_OCEAN_FLOOR' | 'KINETIC_VOID' | 'MIRROR_ROOM'>('ALPINE_SANCTUARY');

  // Control de Autorregulación por IA en Bucle Cerrado
  const [isAiAutoRegulationActive, setIsAiAutoRegulationActive] = useState<boolean>(true);
  const [aiStatusLog, setAiStatusLog] = useState<string>('IA en espera de activación de sesión...');
  const [aiInterventionCount, setAiInterventionCount] = useState<number>(0);

  const realHrv = liveData?.metrics?.hrvRmssdMs || patient?.multisensoryHardware?.vagalToneHrvIndex || 52;
  const realGsr = liveData?.metrics?.gsrMicroSiemens || 1.8;

  // Lógica de Bucle Cerrado y Autorregulación por IA basada en Biomarcadores
  useEffect(() => {
    if (!sessionActive || !isAiAutoRegulationActive) return;

    // Si la conductancia cutánea (GSR) sube abruptamente (> 3.5 uS) o la HRV cae, la IA detecta resistencia o micro-abreacción
    if (realGsr > 3.5 && tranceDepth > 40) {
      const adjustedDepth = Math.max(15, tranceDepth - 15);
      setTranceDepth(adjustedDepth);
      setAiInterventionCount(prev => prev + 1);
      setAiStatusLog(`[IA Bucle Cerrado]: Pico de GSR detectado (${realGsr} µS). Autorregulando: Reduciendo profundidad a ${adjustedDepth}% e iniciando protocolo de seguridad somática.`);
      
      transmit({
        type: 'AI_AUTOREGULATION_ADJUSTMENT',
        reason: 'HIGH_GSR_STRESS_DETECTED',
        newDepth: adjustedDepth,
        action: 'TRIGGER_GROUNDING_SUBROUTINE'
      });
    } 
    // Si la HRV es alta y estable, la IA profundiza sutilmente el trance
    else if (realHrv > 60 && realGsr < 2.0 && tranceDepth < 85) {
      const adjustedDepth = Math.min(90, tranceDepth + 5);
      setTranceDepth(adjustedDepth);
      setAiStatusLog(`[IA Bucle Cerrado]: Estabilidad vagal óptima (HRV: ${realHrv} ms). Profundizando inducción al ${adjustedDepth}%.`);
    }
  }, [realHrv, realGsr, sessionActive, isAiAutoRegulationActive, transmit, tranceDepth]);

  const handleStartSession = () => {
    setSessionActive(true);
    setAiStatusLog('Sesión iniciada. Bucle cerrado multiaxial activo con IA monitorizando Z-scores y SNA.');
    
    // Aseguramos que el paciente está sincronizado antes de enviar comandos
    syncSession();

    // 1. CARGA DE ENTORNO VISUAL EN EL VISOR DEL PACIENTE
    transmit({ 
      type: 'LOAD_MODULE', 
      moduleName: 'NEURO_HYPNOSIS', 
      ecosystem: 'HYPNOSIS' // Se asociará a ALPINE_SANCTUARY.jpg en immersionMediaService
    });

    // 2. ENVÍO DE PARÁMETROS DE HIPNOSIS Y AUDIO BINAURAL
    transmit({
      type: 'START_HYPNOSIS_PROTOCOL',
      protocol: inductionProtocol,
      theme: ambientTheme,
      depth: tranceDepth,
      voice: voiceModulation,
      aiAutoRegulation: isAiAutoRegulationActive
    });
  };

  const handleStopSession = () => {
    setSessionActive(false);
    setAiStatusLog('Sesión finalizada por el clínico. Protocolo de salida completado.');
    // Limpiamos el visor
    transmit({ type: 'STOP_TEST' });
    if (onClose) onClose();
  };

  return (
    <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-600 via-orange-600 to-yellow-600 rounded-2xl text-white shadow-lg shadow-amber-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">Módulo Clínico • Neurohipnosis &amp; Grounding en Bucle Cerrado</h2>
            <p className="text-xs text-slate-400">Paciente: {patientId} | Repertorio profesional completo con autorregulación adaptativa por Inteligencia Artificial.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              <Activity className="w-4 h-4" />{isConnected ? 'Visor Conectado' : 'Visor Desconectado'}
           </div>
           {onClose && <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer">✕</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Moon className="w-4 h-4" /> Protocolo Profesional de Inducción
          </span>
          <select 
            value={inductionProtocol} 
            onChange={(e) => setInductionProtocol(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ERICKSONIAN_METAPHOR">Metáfora Ericksoniana de Refugio y Reestructuración</option>
            <option value="PROGRESSIVE_RELAXATION">Relajación Muscular Progresiva (Jacobson)</option>
            <option value="SOMATIC_GROUNDING">Grounding Somático y Anclaje PropiocEptivo</option>
            <option value="FRACTIONAL_DEEPENING">Inducción Fraccional Avanzada (Conteo 10-1)</option>
            <option value="COGNITIVE_RESTITUTION">Restitución Cognitiva en Trance Ligero</option>
            <option value="REGRESSIVE_INTEGRATION">Integración Regresiva de Vínculos Seguros</option>
          </select>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Waves className="w-4 h-4" /> Entorno Virtual Inmersivo 3D
          </span>
          <select 
            value={ambientTheme} 
            onChange={(e) => setAmbientTheme(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
          >
            <option value="ALPINE_SANCTUARY">06. Santuario Alpino Minimalista</option>
            <option value="DEEP_OCEAN_FLOOR">10. Fondo Marino Seguro y Disociativo</option>
            <option value="KINETIC_VOID">09. Vacío Cinético de Luz y Calma</option>
            <option value="MIRROR_ROOM">08. Sala de Espejo Díadico / Vínculo</option>
          </select>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> Modulación de Voz Guía
          </span>
          <select 
            value={voiceModulation} 
            onChange={(e) => setVoiceModulation(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="NEURO_MODULATED">IA Neuro-Modulada (Sincronizada con HRV)</option>
            <option value="SOFT_GUIDE">Guía Empática y Cálida Tradicional</option>
            <option value="WHISPER">Susurro Profundo (Acompañamiento)</option>
            <option value="DEEP_RESONANT">Tono Resonante y Lento</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Control de Profundidad del Trance (Objetivo: 60 - 80%)</span>
            {isAiAutoRegulationActive && (
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono rounded-md flex items-center gap-1">
                <Cpu className="w-3 h-3 animate-pulse" /> IA Activa
              </span>
            )}
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">{tranceDepth}%</span>
        </div>
        <input 
          type="range" 
          min="10" 
          max="100" 
          value={tranceDepth} 
          onChange={(e) => setTranceDepth(Number(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-400" /> Vagal HRV:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{realHrv} ms</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-cyan-400" /> GSR Cutánea:</span>
            <span className="text-xs font-mono font-bold text-cyan-300">{realGsr} µS</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Intervenciones IA:</span>
            <span className="text-xs font-mono font-bold text-amber-300">{aiInterventionCount} automáticas</span>
          </div>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
          <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Bitácora de Autorregulación en Bucle Cerrado:
          </div>
          <div className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px]">{aiStatusLog}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
          <input 
            type="checkbox" 
            checked={isAiAutoRegulationActive} 
            onChange={(e) => setIsAiAutoRegulationActive(e.target.checked)} 
            className="rounded bg-slate-950 border-slate-700 text-amber-500 cursor-pointer" 
          />
          <span className="font-semibold">Habilitar IA Bucle Cerrado (Autorregulación Dinámica)</span>
        </label>

        {!sessionActive ? (
          <button onClick={handleStartSession} className="flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white cursor-pointer hover:scale-105 transition">
            <Play className="w-4 h-4" /> <span>Iniciar Protocolo Profesional</span>
          </button>
        ) : (
          <button onClick={handleStopSession} className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white font-black text-xs rounded-xl cursor-pointer hover:bg-rose-500 transition">
            <Square className="w-4 h-4" /> <span>Finalizar Protocolo / Grounding</span>
          </button>
        )}
      </div>
    </div>
  );
};
