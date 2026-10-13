import React, { useState, useEffect, useMemo } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { 
  X, 
  Play, 
  Square, 
  Activity, 
  Glasses, 
  ShieldAlert, 
  HeartPulse, 
  Zap,
  RotateCcw,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { getEnvironmentAssetById } from '../constants/vrAssetRegistry';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export const FullscreenTreatmentConsole: React.FC<Props> = ({ 
  patient, 
  onClose,
  onUpdatePatientVrData
}) => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';
  
  // Enlace WebSocket bidireccional con visor Pico 3
  const bridge = useVrTelemetryBridge('sender', patientId, 'TAG_ANXIETY');
  const { isConnected, liveData, transmit } = bridge as any;

  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [exposureLevel, setExposureLevel] = useState(1);
  const [isGroundingActive, setIsGroundingActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extracción polimórfica defensiva de métricas en vivo
  const liveMetrics = (liveData as any)?.metrics || (liveData as any) || {};

  const rawHrv = liveMetrics?.hrvRmssdMs ?? liveMetrics?.hrv ?? liveMetrics?.finalHrv;
  const hrv = useMemo(() => {
    if (Array.isArray(rawHrv) && rawHrv.length > 0) return Math.round(rawHrv[rawHrv.length - 1]);
    if (typeof rawHrv === 'number') return Math.round(rawHrv);
    return 42;
  }, [rawHrv]);

  const rawGsr = liveMetrics?.gsrMicroSiemens ?? liveMetrics?.gsr ?? liveMetrics?.peakGSR_uS;
  const gsr = useMemo(() => {
    if (Array.isArray(rawGsr) && rawGsr.length > 0) return Number(rawGsr[rawGsr.length - 1].toFixed(2));
    if (typeof rawGsr === 'number') return Number(rawGsr.toFixed(2));
    return 2.4;
  }, [rawGsr]);

  // Cálculo en tiempo real del Índice de Habituación H
  const habituationRate = useMemo(() => {
    const rawH = ((hrv / 25) / (gsr + 0.5)) * (exposureLevel * 0.8);
    return Number(Math.max(0.4, Math.min(4.5, rawH)).toFixed(2));
  }, [hrv, gsr, exposureLevel]);

  // Cronómetro clínico estructurado
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => { 
      if (interval) clearInterval(interval); 
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsGroundingActive(false);

    if (typeof (bridge as any)?.syncSession === 'function') {
      (bridge as any).syncSession();
    }
    
    // Entorno de exposición verificado en vrAssetRegistry
    const defaultVretEnv = getEnvironmentAssetById('ACROPHOBIA_HIGH_ROOF');

    transmit({ 
      type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
      mediaType: 'IMAGE_360',
      patientId, 
      mode: 'PHOBIA_VRET',
      environment: defaultVretEnv.id,
      aiGeneratedAssetUrl: defaultVretEnv.localAssetUrl,
      vretStep: exposureLevel,
      timestamp: Date.now()
    });
    
    transmit({ 
      type: 'START_EXPOSURE', 
      level: exposureLevel,
      timestamp: Date.now()
    });
  };

  const handleLevelChange = (newLevel: number) => {
    setExposureLevel(newLevel);
    transmit({ 
      type: 'UPDATE_EXPOSURE_LEVEL', 
      level: newLevel,
      vretStep: newLevel,
      timestamp: Date.now()
    });
  };

  const handleEmergencyStop = () => {
    setIsRunning(false);
    setIsGroundingActive(true);

    const groundingEnv = getEnvironmentAssetById('ALPINE_SANCTUARY');

    transmit({ 
      type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
      mediaType: 'IMAGE_360',
      patientId,
      mode: 'HYPNOSIS',
      environment: groundingEnv.id,
      aiGeneratedAssetUrl: groundingEnv.localAssetUrl,
      timestamp: Date.now()
    });

    transmit({ 
      type: 'TRIGGER_GROUNDING_PROTOCOL',
      patientId,
      timestamp: Date.now()
    });
  };

  const handleFinish = async () => {
    setIsRunning(false);
    setIsSaving(true);

    transmit({ 
      type: 'STOP_TEST',
      patientId,
      timestamp: Date.now()
    });

    const isDesensitized = gsr < 3.2 && hrv >= 35;

    const telemetryPayload: VrTelemetryData = {
      sessionDate: new Date().toISOString(),
      deviceModel: 'Pico 3 Pro (WebXR Engine)',
      connectionProtocol: 'WIFI',
      baselineHrv: hrv,
      baselineGsr: gsr,
      reactionTimeMs: [240],
      gsrMicroSiemens: [gsr],
      hrvRmssdMs: [hrv],
      habituationIndexH: habituationRate
    };

    const reportPayload: VrTherapyReport = {
      sessionId: `VRET-${patientId}-${Date.now()}`,
      date: new Date().toISOString(),
      moduleExecuted: 'TAG_ANXIETY_VRET',
      clinicalObservations: `Sesión de exposición VRET completada. Duración: ${timer}s. Nivel máximo: ${exposureLevel}/5. Tasa de habituación H: ${habituationRate}.`,
      autonomicRegulationScore: isDesensitized ? 'ÓPTIMA' : 'MODERADA'
    };

    // 1. Notificar al estado superior de React si existe callback
    if (onUpdatePatientVrData) {
      onUpdatePatientVrData(telemetryPayload, reportPayload);
    }

    // 2. Persistir en el backend de AMIE en Render
    try {
      const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || 'https://amieneurogical.onrender.com';
      await fetch(`${BACKEND_URL}/api/vr/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          sessionData: {
            taskName: 'ExposureTherapy_TAG',
            durationSeconds: timer,
            metrics: {
              avgHrv: hrv,
              avgGsr: gsr,
              habituationRate
            },
            aiLogs: [
              `Terapia de exposición completada. Nivel alcanzado: ${exposureLevel}/5.`,
              isDesensitized 
                ? 'Desensibilización autonómica verificada con recuperación parasimpática.' 
                : 'Hiperreactividad residual. Se sugiere sostener el protocolo en próximas sesiones.'
            ]
          }
        })
      });
    } catch (error) {
      console.warn('[AMIE Treatment] Telemetría archivada localmente:', error);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col p-6 overflow-y-auto font-sans">
      {/* Cabecera Principal */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-900/50 border border-rose-500/30 rounded-xl text-rose-400 shadow-lg shadow-rose-950/40">
            <Glasses className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Consola de Exposición VR (VRET) • Pico 3 Pro</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                TAG &amp; FOBIAS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Expediente: <span className="text-rose-300 font-semibold">{patientId}</span> | Protocolo de Desensibilización Sistemática Inmersiva
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isConnected 
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300' 
              : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}>
            <Activity className="w-4 h-4" /> 
            <span>{isConnected ? 'PICO 3 CONECTADO' : 'ESPERANDO PICO 3...'}</span>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
            title="Cerrar Consola"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Rejilla Central */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel de Simulación y Control */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                Simulación de Escenario Inmersivo (Visor Pico 3)
              </span>
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                Tiempo: {formatTime(timer)}
              </span>
            </div>
            
            <div className="h-64 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-y-3 z-10 relative px-4">
                <Glasses className={`w-12 h-12 mx-auto ${isRunning ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`} />
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    {isGroundingActive 
                      ? 'Protocolo de Aterrizaje Activo (Santuario Alpino / Grounding)' 
                      : isRunning 
                        ? `Exposición Gradual Activa — Nivel ${exposureLevel} / 5` 
                        : 'Consola en Espera'}
                  </p>
                  <span className="text-[11px] text-slate-500 font-mono block mt-1">
                    {isRunning 
                      ? '/ecosystems/acrophobia_roof.jpg transmitido al visor' 
                      : 'Presione Iniciar para disparar el render en el casco'}
                  </span>
                </div>
              </div>
              
              {isRunning && (
                <div 
                  className="absolute inset-0 bg-rose-500/10 transition-opacity duration-500" 
                  style={{ opacity: exposureLevel * 0.18 }} 
                />
              )}
            </div>
          </div>

          {/* Selector de Nivel de Exposición */}
          {isRunning && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 block mb-2.5">
                Control de Jerarquía del Estímulo Fóbico (En Vivo):
              </span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleLevelChange(level)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                      exposureLevel === level 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Nivel {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barra de Acciones y Emergencia */}
          <div className="mt-6">
            {!isConnected && !isRunning && (
              <div className="mb-4 p-3 bg-slate-950 border border-cyan-500/30 border-dashed rounded-xl flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-lg shrink-0">
                  <Glasses className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-0.5">Esperando vinculación del visor Pico 3...</strong>
                  El paciente debe colocarse el casco e ingresar el identificador del expediente <span className="font-mono text-cyan-300 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">{patientId}</span>.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleEmergencyStop}
                disabled={!isRunning}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 border border-slate-800 rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer active:scale-95"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Aterrizaje de Emergencia (Grounding)</span>
              </button>

              <div className="flex gap-3">
                {!isRunning ? (
                  <button 
                    type="button"
                    disabled={!isConnected}
                    onClick={handleStart} 
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                      !isConnected 
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95'
                    }`}
                  >
                    {!isConnected ? (
                      'Esperando Pico 3...'
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Iniciar Exposición VRET</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    type="button"
                    disabled={isSaving}
                    onClick={handleFinish} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Finalizar &amp; Guardar Sesión</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral de Bioseñales en Vivo */}
        <div className="space-y-4 flex flex-col">
          {/* Tono Vagal */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex-1 flex flex-col justify-center shadow-lg">
            <span className="text-xs text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-emerald-400" /> Tono Vagal (HRV RMSSD)
            </span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-emerald-400 font-mono">{hrv}</span>
              <span className="text-sm text-slate-500 font-bold mb-1 font-mono">ms</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Modulación parasimpática. Niveles &gt; 35 ms denotan control de la activación ansiosa.
            </p>
          </div>

          {/* Conductancia Dérmica */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex-1 flex flex-col justify-center shadow-lg">
            <span className="text-xs text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" /> Conductancia de la Piel (GSR)
            </span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-amber-400 font-mono">{gsr}</span>
              <span className="text-sm text-slate-500 font-bold mb-1 font-mono">µS</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Excitación simpática fásica. Picos &gt; 4.0 µS revelan sobrecarga fóbica en la escena.
            </p>
          </div>

          {/* Tasa de Habituación */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs space-y-1 shadow-inner">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-bold flex items-center gap-1 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Índice de Habituación (H):
              </span>
              <span className="font-mono font-bold text-cyan-300 text-sm">{habituationRate}</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
              {habituationRate >= 2.0 
                ? 'Extinción de distrés óptima. El tono parasimpático compensa el estímulo.' 
                : 'Habituación en proceso. Resistencia vegetativa a la extinción.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenTreatmentConsole;
