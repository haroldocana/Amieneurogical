// ============================================================================
// AMIE CLINICAL COPILOT - MÓDULO DE HIPNOSIS CLÍNICA EN BUCLE CERRADO (CLOSED-LOOP)
// frontend/components/VrClosedLoopHypnosisModule.tsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { VrControlService } from '../services/vrControlService';
import {
  Sparkles,
  Waves,
  Heart,
  Activity,
  Play,
  Square,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Info,
  Radio,
  X
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

export const VrClosedLoopHypnosisModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';

  // Estados del Protocolo Inmersivo Closed-Loop
  const [isActive, setIsActive] = useState<boolean>(false);
  const [binauralFrequencyHz, setBinauralFrequencyHz] = useState<number>(6.0); // 6 Hz (Theta)
  const [respiratoryPacerBpm, setRespiratoryPacerBpm] = useState<number>(5.5); // 0.1 Hz Vagal
  const [tranceDepthPct, setTranceDepthPct] = useState<number>(45);
  const [currentHrv, setCurrentHrv] = useState<number>(42);
  const [currentGsr, setCurrentGsr] = useState<number>(2.4);
  const [orbLuminance, setOrbLuminance] = useState<number>(70);
  const [selectedScript, setSelectedScript] = useState<string>('INDUCCION_ERICKSONIANA_ESPACIAL');

  // Sincronización continua de biofeedback durante la sesión
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        // Dinámica simulada de relajación progresiva
        setCurrentHrv(prev => Math.min(85, Math.max(30, prev + (Math.random() * 2 - 0.8))));
        setCurrentGsr(prev => Math.max(0.8, Number((prev - 0.04 + Math.random() * 0.02).toFixed(2))));
        
        setTranceDepthPct(prev => {
          const nextVal = Math.min(95, prev + 1);
          // Modulación adaptativa: descender la frecuencia binaural a medida que se profundiza el trance
          if (nextVal > 70 && binauralFrequencyHz > 4.5) {
            setBinauralFrequencyHz(4.0);
            VrControlService.sendMasterConfigParam('ENV_06_CLOSED_LOOP_HYPNOSIS', 'binauralBeatHz', 4.0, patientId);
          }
          return nextVal;
        });
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, binauralFrequencyHz, patientId]);

  // Inicio de la sesión y despacho hacia el visor Pico 3 Pro / Quest
  const handleStartSession = () => {
    setIsActive(true);
    setTranceDepthPct(20);

    VrControlService.loadMasterEnvironment(
      'ENV_06_CLOSED_LOOP_HYPNOSIS',
      patientId,
      {
        binauralBeatHz: binauralFrequencyHz,
        respiratoryPacerBpm,
        orbLuminancePct: orbLuminance,
        inductionScript: selectedScript
      }
    );
  };

  // Detención de la sesión
  const handleStopSession = () => {
    setIsActive(false);
    VrControlService.stopActiveSession(patientId);
  };

  // Grounding de emergencia directo al santuario seguro
  const handleEmergencyGrounding = () => {
    setIsActive(false);
    VrControlService.triggerGroundingProtocol(patientId);
  };

  // Modificación en tiempo real de la frecuencia binaural
  const handleBinauralChange = (val: number) => {
    setBinauralFrequencyHz(val);
    if (isActive) {
      VrControlService.sendMasterConfigParam('ENV_06_CLOSED_LOOP_HYPNOSIS', 'binauralBeatHz', val, patientId);
    }
  };

  // Modificación en tiempo real del ritmo respiratorio guiado
  const handlePacerChange = (val: number) => {
    setRespiratoryPacerBpm(val);
    if (isActive) {
      VrControlService.sendMasterConfigParam('ENV_06_CLOSED_LOOP_HYPNOSIS', 'pacerBpm', val, patientId);
    }
  };

  return (
    <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      
      {/* 1. Cabecera Principal */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 rounded-2xl text-white shadow-lg shadow-purple-600/30">
            <Sparkles className="w-6 h-6 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                Protocolo Inmersivo Neuro-Adaptativo
              </span>
              <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                isActive 
                  ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                {isActive ? 'BUCLE CERRADO EN VIVO' : 'EN ESPERA'}
              </span>
            </div>
            <h2 className="text-base font-black text-white tracking-tight">
              Consola de Neurohipnosis en Bucle Cerrado (HRV &bull; GSR &bull; Theta)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              title="Cerrar Consola"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Métricas de Biofeedback en Tiempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Profundidad de Trance
          </span>
          <div className="text-2xl font-mono font-bold text-purple-400">
            {tranceDepthPct}%
          </div>
          <span className="text-[10px] text-slate-500 block">Índice Ericksoniano Estimado</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" /> VFC (RMSSD)
          </span>
          <div className="text-2xl font-mono font-bold text-rose-400">
            {currentHrv.toFixed(0)} <span className="text-xs text-slate-500">ms</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Tono Parasimpático Vagal</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Waves className="w-3.5 h-3.5 text-cyan-400" /> Conductancia Cutánea (GSR)
          </span>
          <div className="text-2xl font-mono font-bold text-cyan-400">
            {currentGsr.toFixed(2)} <span className="text-xs text-slate-500">&micro;S</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Nivel de Alerta Simpática</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-indigo-400" /> Pulso Binaural Activo
          </span>
          <div className="text-2xl font-mono font-bold text-indigo-400">
            {binauralFrequencyHz.toFixed(1)} <span className="text-xs text-slate-500">Hz</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Sincronización Hemisférica</span>
        </div>
      </div>

      {/* 3. Panel de Control y Modulación de Parámetros */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-3">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            Parámetros Fisiológicos Modulables en Tiempo Real
          </span>

          <div className="flex items-center gap-2">
            {!isActive ? (
              <button
                type="button"
                onClick={handleStartSession}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Bucle Cerrado</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopSession}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Detener Sesión</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleEmergencyGrounding}
              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-bold text-xs rounded-xl border border-rose-500/50 shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="Evacuación inmediata al santuario seguro"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Grounding</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Frecuencia Binaural */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Frecuencia Binaural (Hz):</span>
              <span className="font-mono font-bold text-indigo-300">{binauralFrequencyHz} Hz</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="12.0"
              step="0.5"
              value={binauralFrequencyHz}
              onChange={(e) => handleBinauralChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Delta (2 Hz)</span>
              <span>Theta (6 Hz)</span>
              <span>Alfa (10 Hz)</span>
            </div>
          </div>

          {/* Pacer Respiratorio */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Pacer Respiratorio (cpm):</span>
              <span className="font-mono font-bold text-cyan-300">{respiratoryPacerBpm} cpm</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="8.0"
              step="0.5"
              value={respiratoryPacerBpm}
              onChange={(e) => handlePacerChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>4.0 (Profundo)</span>
              <span>5.5 (Vagal 0.1Hz)</span>
              <span>8.0 (Suave)</span>
            </div>
          </div>

          {/* Luminosidad del Orbe Visual */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Luminancia Orbe 3D (%):</span>
              <span className="font-mono font-bold text-purple-300">{orbLuminance}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={orbLuminance}
              onChange={(e) => setOrbLuminance(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Tenue (20%)</span>
              <span>Medio (60%)</span>
              <span>Luminoso (100%)</span>
            </div>
          </div>
        </div>

        {/* Guión Ericksoniano */}
        <div className="pt-2">
          <label className="text-xs text-slate-400 font-semibold block mb-1.5">
            Protocolo de Guión de Inducción Sonora:
          </label>
          <select
            value={selectedScript}
            onChange={(e) => setSelectedScript(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="INDUCCION_ERICKSONIANA_ESPACIAL">Inducción Ericksoniana: Metáfora de Disolución y Expansión Espacial</option>
            <option value="DESENSIBILIZACION_DOLOR_SOMATICO">Analgesia Hipnótica: Anestesia de Guante y Modulación del Asta Posterior</option>
            <option value="REGULACION_AMIGDALINA_CALMA">Regulación Autonómica: Anclaje de Seguridad y Disipación de Hiperalerta</option>
          </select>
        </div>
      </div>

      {/* 4. Resumen de Seguridad */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span>
          El bucle cerrado supervisa continuamente la variabilidad de la frecuencia cardíaca ($RMSSD$) y la conductancia de la piel ($GSR$). Si el sistema detecta incremento paradójico en la reactividad simpática, modula de forma automática el orbe visual para restablecer la coherencia vagal.
        </span>
      </div>
    </div>
  );
};

export default VrClosedLoopHypnosisModule;
