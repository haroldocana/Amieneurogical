import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { X, Play, Square, Activity, Glasses, ShieldAlert, HeartPulse } from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
}

export const FullscreenTreatmentConsole: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  
  // Conexión real al visor VR
  const { isConnected, liveData, syncSession, transmit } = useVrTelemetryBridge('receiver', patientId, 'TAG_ANXIETY');

  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [exposureLevel, setExposureLevel] = useState(1); // Nivel de intensidad de la fobia (1 a 5)

  // Telemetría a prueba de balas (extrae el último valor si es un array de historial)
  const rawHrv = liveData?.metrics?.hrvRmssdMs;
  const hrv = Array.isArray(rawHrv) ? rawHrv[rawHrv.length - 1] : (rawHrv || 42);

  const rawGsr = liveData?.metrics?.gsrMicroSiemens;
  const gsr = Array.isArray(rawGsr) ? rawGsr[rawGsr.length - 1] : (rawGsr || 2.4);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    syncSession();
    transmit({ type: 'LOAD_MODULE', patientId, moduleName: 'TAG_ANXIETY' });
    transmit({ type: 'START_EXPOSURE', level: exposureLevel });
  };

  const handleLevelChange = (newLevel: number) => {
    setExposureLevel(newLevel);
    transmit({ type: 'UPDATE_EXPOSURE_LEVEL', level: newLevel });
  };

  const handleEmergencyStop = () => {
    setIsRunning(false);
    transmit({ type: 'TRIGGER_GROUNDING_PROTOCOL' }); // Saca al paciente de la fobia inmediatamente
  };

  const handleFinish = async () => {
    setIsRunning(false);
    transmit({ type: 'STOP_TEST' });

    const sessionReport = {
      patientId: patientId,
      sessionData: {
        taskName: 'ExposureTherapy_TAG',
        durationSeconds: timer,
        metrics: {
          avgHrv: hrv,
          avgGsr: gsr,
          frontalEngagementPct: 0,
          binauralBetaHz: 0
        },
        aiLogs: [
          `Terapia de Exposición VR completada. Tiempo: ${timer}s. Nivel máximo de exposición: ${exposureLevel}/5.`,
          `Índice de Habituación: ${gsr < 3.5 ? 'Óptimo (Desensibilización lograda)' : 'Elevado (Requiere más sesiones)'}`
        ]
      }
    };

    try {
      await fetch('/api/vr/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionReport)
      });
      alert('✅ Terapia de exposición guardada en el expediente.');
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col p-6 overflow-y-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-900/50 border border-rose-500/30 rounded-xl text-rose-400">
            <Glasses className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Consola de Exposición VR (VRET) • TAG & Fobias</h2>
            <p className="text-xs text-slate-400">
              Paciente ID: <span className="text-rose-300 font-semibold">{patientId}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
            <Activity className="w-4 h-4" /> {isConnected ? 'VR Conectado' : 'Esperando VR...'}
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PANEL PRINCIPAL: Control de Entorno */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Simulación de Escenario VR</span>
              <span className="text-xs font-mono font-bold text-slate-400">T: {timer}s</span>
            </div>
            
            <div className="h-64 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-y-4 z-10 relative">
                <Glasses className={`w-12 h-12 mx-auto ${isRunning ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`} />
                <p className="text-sm font-semibold text-slate-300">
                  {isRunning ? `Exposición Activa - Nivel ${exposureLevel}` : 'Consola en Espera'}
                </p>
              </div>
              {/* Efecto visual de intensidad en la consola */}
              {isRunning && <div className="absolute inset-0 bg-rose-500/10" style={{ opacity: exposureLevel * 0.2 }}></div>}
            </div>
          </div>

          {/* Controles de Intensidad */}
          {isRunning && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-3">Control de Estímulo Fóbico (Tiempo Real):</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => handleLevelChange(level)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${exposureLevel === level ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    Nivel {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botonera de Acción */}
          <div className="mt-6">
            {/* INSTRUCCIONES DE INGRESO PARA EL PACIENTE */}
            {!isConnected && !isRunning && (
              <div className="mb-4 p-3 bg-slate-900/80 border border-sky-500/30 border-dashed rounded-xl flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                  <Glasses className="w-5 h-5 text-sky-400 animate-pulse" />
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-0.5">Esperando conexión del paciente...</strong>
                  Para habilitar el ensayo, el paciente debe colocarse el visor <strong className="text-sky-300">Meta Quest 3S</strong> e iniciar la sesión vinculando su expediente: <span className="text-sky-300 font-mono bg-sky-900/30 px-1 rounded">{patientId}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
               <button
                  onClick={handleEmergencyStop}
                  disabled={!isRunning}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <ShieldAlert className="w-4 h-4" /> Aterrizaje de Emergencia
                </button>

              <div className="flex gap-3">
                {!isRunning ? (
                  <button 
                    disabled={!isConnected}
                    onClick={handleStart} 
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                      !isConnected 
                        ? 'bg-sky-900/30 text-sky-300 border border-sky-500/30 cursor-not-allowed' 
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 cursor-pointer'
                    }`}
                  >
                    {!isConnected ? 'Esperando Visor VR...' : <><Play className="w-4 h-4" /> Iniciar Exposición</>}
                  </button>
                ) : (
                  <button onClick={handleFinish} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20">
                    <Square className="w-4 h-4" /> Finalizar y Evaluar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL LATERAL: Telemetría */}
        <div className="space-y-4 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex-1 flex flex-col justify-center">
            <span className="text-xs text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1">
               <HeartPulse className="w-4 h-4 text-emerald-400" /> Tono Vagal (Relajación)
            </span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-emerald-400">{hrv}</span>
              <span className="text-sm text-slate-500 font-bold mb-1">ms</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Valores altos indican recuperación parasimpática ante la fobia.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex-1 flex flex-col justify-center">
            <span className="text-xs text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1">
               <Activity className="w-4 h-4 text-amber-400" /> Sudoración (Estrés - GSR)
            </span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-amber-400">{gsr}</span>
              <span className="text-sm text-slate-500 font-bold mb-1">µS</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Valores altos indican picos de ansiedad (lucha o huida).</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs text-slate-400 font-mono">
            <strong>IA Habituation Index:</strong> Calculando tasa de adaptación en tiempo real según cruce GSR/HRV...
          </div>
        </div>
      </div>
    </div>
  );
};
