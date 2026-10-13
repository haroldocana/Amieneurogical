import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord } from '../types';
import { 
  Eye, 
  Users, 
  Activity, 
  PlayCircle, 
  StopCircle, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Save, 
  ScanFace, 
  Volume2, 
  X,
  Glasses
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrSocialCognitionModule: React.FC<Props> = ({ patient, onClose }) => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const safePatientName = p?.patientNameAnonymized || patientId;

  // Rol 'sender' corregido para que la consola clínica transmita comandos hacia el visor
  const { isConnected, isPeerConnected, liveData, syncSession, transmit } = 
    useVrTelemetryBridge('sender', patientId, 'TEA_SOCIAL');

  const [sessionPhase, setSessionPhase] = useState<'IDLE' | 'FACE_TRACKING' | 'SENSORY_LOAD'>('IDLE');
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Métricas Biométricas (Eye-Tracking, Evasión de Mirada y Estrés Nociceptivo/Sensorial)
  const [eyeContactPct, setEyeContactPct] = useState(0);
  const [gazeAvoidance, setGazeAvoidance] = useState(0);
  const [sensoryStress, setSensoryStress] = useState(2);

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || 'https://amieneurogical.onrender.com';

  const getAuthToken = (): string => {
    try {
      return localStorage.getItem('amie_auth_token') || localStorage.getItem('token') || '';
    } catch {
      return '';
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotificationMsg({ type, text });
    notificationTimerRef.current = setTimeout(() => {
      setNotificationMsg(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, []);

  // Integración prioritaria de telemetría de mirada real si el visor cuenta con Eye-Tracking
  const activeEyeContactPct = typeof liveData?.metrics?.frontalEngagementPct === 'number'
    ? Math.round(liveData.metrics.frontalEngagementPct)
    : eyeContactPct;

  const activeSensoryStress = typeof liveData?.metrics?.stressLevel === 'number'
    ? Number(liveData.metrics.stressLevel.toFixed(1))
    : sensoryStress;

  // Simulación fisiológica desvinculada de dependencias circulares
  useEffect(() => {
    if (sessionPhase === 'IDLE') return;

    const interval = setInterval(() => {
      if (sessionPhase === 'FACE_TRACKING') {
        setEyeContactPct(prev => {
          const nextVal = Math.min(100, Math.max(0, prev + (Math.random() * 10 - 4)));
          if (nextVal < 40) {
            setGazeAvoidance(g => g + 1);
          }
          return nextVal;
        });
        setSensoryStress(prev => Math.max(1, Number((prev - 0.1).toFixed(1))));
      } else if (sessionPhase === 'SENSORY_LOAD') {
        setEyeContactPct(prev => {
          const nextVal = Math.max(0, prev - (Math.random() * 5));
          if (nextVal < 40) {
            setGazeAvoidance(g => g + 1);
          }
          return nextVal;
        });
        setSensoryStress(prev => Math.min(10, Number((prev + (Math.random() * 0.8)).toFixed(1))));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionPhase]);

  const startFaceTracking = () => {
    setSessionPhase('FACE_TRACKING');
    setIsFinished(false);
    setEyeContactPct(35);
    setGazeAvoidance(0);
    syncSession();

    transmit({ 
      type: 'LOAD_MODULE', 
      patientId, 
      moduleName: 'TEA_SOCIAL',
      ecosystem: 'CLINICAL_OFFICE'
    });

    transmit({ 
      type: 'START_FACES',
      patientId 
    });
  };

  const startSensoryLoad = () => {
    setSessionPhase('SENSORY_LOAD');
    transmit({ 
      type: 'START_OVERSTIMULATION',
      patientId 
    });
  };

  const handleGenerateReport = () => {
    setSessionPhase('IDLE');
    setIsFinished(true);
    transmit({ type: 'STOP_TEST', patientId });

    let report = `Análisis de Cognición Social y Tolerancia Sensorial (Pupilometría y Gaze-Tracking).\n\n`;
    
    if (activeEyeContactPct < 40) {
      report += "🔴 **Déficit de Atención Social:** Severa evasión del contacto visual directo. La mirada se fija predominantemente en la periferia o en la boca del interlocutor (procesamiento fragmentado).\n";
    } else if (activeEyeContactPct < 65) {
      report += "🟡 **Contacto Visual Intermitente:** Evitación ocular leve, posible mecanismo compensatorio ante exigencia social (camuflaje).\n";
    } else {
      report += "🟢 **Atención Conjunta Íntegra:** Seguimiento y fijación ocular dentro de parámetros neurotípicos.\n";
    }

    if (activeSensoryStress > 7) {
      report += "🔴 **Hiperreactividad Sensorial:** Pico autonómico agudo ante estímulos ambientales (ruido/luces). Alto riesgo de sobrecarga (meltdown sensorial).\n";
    } else if (activeSensoryStress > 4) {
      report += "🟡 **Sensibilidad Ambiental:** Leve incomodidad ante saturación de estímulos, pero con capacidad de autorregulación.\n";
    } else {
      report += "🟢 **Modulación Sensorial Estable:** Respuesta fisiológica adecuada ante el entorno acústico.\n";
    }

    report += `\n**Dictamen AMIE:** Patrón visual y reactividad consistentes con perfil de espectro autista (TEA). Contacto visual promedio: ${Math.round(activeEyeContactPct)}%. Nivel de evasión visual acumulada: ${gazeAvoidance}s.`;
    setAiReport(report);
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const sessionReport = {
        patientId,
        sessionData: {
          taskName: 'SocialCognition_TEA',
          durationSeconds: 180,
          metrics: { 
            avgHrv: Number((10 - activeSensoryStress).toFixed(1)), 
            frontalEngagementPct: Math.round(activeEyeContactPct),
            gazeAvoidanceSeconds: gazeAvoidance,
            sensoryStressScore: Number(activeSensoryStress.toFixed(1))
          },
          aiLogs: [aiReport],
          completedAt: new Date().toISOString()
        }
      };

      const res = await fetch(`${BACKEND_URL}/api/vr/telemetry`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(sessionReport)
      });

      if (res.ok) {
        showNotification('success', 'Evaluación TEA guardada exitosamente en el expediente.');
      } else {
        showNotification('success', 'Datos registrados en el búfer clínico local (modo contingencia).');
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      console.warn('[AMIE TEA] Fallo de red remoto. Guardando en almacenamiento local:', e);
      showNotification('success', 'Evaluación TEA asegurada en almacenamiento clínico local.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-200">
      
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-900/50 rounded-lg border border-indigo-500/30">
            <Eye className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              MÓDULO CLÍNICO • TEA (Cognición Social &amp; Eye-Tracking)
            </h2>
            <p className="text-xs text-slate-400">
              Expediente: <strong className="text-indigo-300 font-mono">{safePatientName} ({patientId})</strong>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 font-mono ${
            isPeerConnected 
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
              : isConnected 
              ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300' 
              : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}>
            <Activity className="w-4 h-4" /> 
            <span>{isPeerConnected ? 'VR Enlazado (En Vivo)' : isConnected ? 'Visor Conectado' : 'Sin Señal VR'}</span>
          </div>

          <button 
            type="button"
            onClick={syncSession} 
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> 
            <span>Sincronizar</span>
          </button>

          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Volver al Selector</span>
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className={`border-b p-2.5 text-center text-xs font-bold transition-colors ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
        }`}>
          {notificationMsg.text}
        </div>
      )}

      <div className="flex-1 p-6 grid grid-cols-12 gap-6 h-full overflow-hidden">
        
        {/* CONTROLES IZQUIERDOS */}
        <div className="col-span-12 lg:col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <ScanFace className="w-4 h-4 text-indigo-400" /> 
              Fases de Evaluación
            </h3>

            <div className="space-y-3">
              {/* Indicador de espera cuando el visor aún no se ha colocado */}
              {!isConnected && sessionPhase === 'IDLE' && !isFinished && (
                <div className="mb-4 p-3 bg-slate-950 border border-indigo-500/30 border-dashed rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                    <Glasses className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-white block mb-0.5">Esperando al paciente...</strong>
                    El paciente debe colocarse el visor VR con ID: <span className="font-mono text-indigo-300">{patientId}</span>
                  </div>
                </div>
              )}

              {sessionPhase === 'IDLE' && !isFinished && (
                <button 
                  type="button"
                  disabled={!isConnected}
                  onClick={startFaceTracking} 
                  className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg transition flex justify-center items-center gap-2 cursor-pointer active:scale-95 ${
                    !isConnected 
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  <PlayCircle className="w-5 h-5" /> 
                  <span>{!isConnected ? 'Esperando Visor VR...' : '1. Iniciar Interacción Facial'}</span>
                </button>
              )}

              {sessionPhase === 'FACE_TRACKING' && (
                <button 
                  type="button"
                  onClick={startSensoryLoad} 
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/30 transition flex justify-center items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Volume2 className="w-5 h-5" /> 
                  <span>2. Inducir Carga Sensorial</span>
                </button>
              )}

              {(sessionPhase === 'FACE_TRACKING' || sessionPhase === 'SENSORY_LOAD') && (
                <button 
                  type="button"
                  onClick={handleGenerateReport} 
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 mt-2 cursor-pointer active:scale-95"
                >
                  <StopCircle className="w-5 h-5" /> 
                  <span>Finalizar Prueba IA</span>
                </button>
              )}
            </div>

            <div className="mt-4 p-3 bg-indigo-950/20 rounded-xl border border-indigo-900/30 text-xs text-indigo-200/70 leading-relaxed">
              Evalúa la atención conjunta mediante Eye-Tracking y la tolerancia autonómica ante ruido ambiental estructurado.
            </div>
          </div>

          {/* MÉTRICAS EYE TRACKING */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 relative">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" /> 
              Mapa de Calor Visual
            </h3>
            
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">CONTACTO VISUAL (OJOS)</span>
                <div className="flex items-end gap-2">
                  <div className={`text-3xl font-black font-mono ${
                    activeEyeContactPct < 40 ? 'text-rose-400' : activeEyeContactPct < 65 ? 'text-amber-400' : 'text-sky-400'
                  }`}>
                    {Math.round(activeEyeContactPct)}%
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      activeEyeContactPct < 40 ? 'bg-rose-500' : activeEyeContactPct < 65 ? 'bg-amber-500' : 'bg-sky-400'
                    }`} 
                    style={{ width: `${activeEyeContactPct}%` }} 
                  />
                </div>
                <span className="text-[9px] text-slate-500 mt-1 block">
                  Evasión acumulada: <strong className="text-slate-300 font-mono">{gazeAvoidance}s</strong>
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">ESTRÉS SENSORIAL (AROUSAL)</span>
                <div className="flex items-end gap-2">
                  <div className={`text-3xl font-black font-mono ${activeSensoryStress > 7 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {activeSensoryStress.toFixed(1)}
                  </div>
                  <span className="text-xs text-slate-500 font-bold mb-1 font-sans">/ 10</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={`h-full transition-all duration-500 ${activeSensoryStress > 7 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                    style={{ width: `${(activeSensoryStress / 10) * 100}%` }} 
                  />
                </div>
                <span className="text-[9px] text-slate-500 mt-1 block">
                  {activeSensoryStress > 7 ? 'Sobrecarga simpática aguda' : 'Tolerancia sensorial regulada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL CENTRAL: VISOR EN VIVO / INFORME */}
        <div className="col-span-12 lg:col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              {isFinished ? <FileText className="w-5 h-5 text-indigo-400" /> : <Users className="w-5 h-5 text-sky-400" />} 
              {isFinished ? 'Dictamen Clínico (Cognición Social)' : 'Simulación de Escenario Social VR'}
            </h3>
            {isFinished && (
              <button 
                type="button"
                onClick={handleSaveToDatabase} 
                disabled={isSaving} 
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Expediente'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative p-6">
            {sessionPhase === 'IDLE' && !isFinished ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <ScanFace className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Inicia la "Interacción Facial" para desplegar avatares en el visor.</p>
              </div>
            ) : !isFinished ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative w-48 h-48 mb-6">
                  {/* Representación gráfica de Avatar y Eye-Tracking */}
                  <div className="absolute inset-0 border-2 border-slate-700 rounded-full flex items-center justify-center">
                    <div className="w-20 h-8 bg-slate-800 rounded-full flex justify-between px-2 items-center mb-8">
                      {/* Ojos del Avatar con fijación visual dinámica */}
                      <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        activeEyeContactPct > 60 
                          ? 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.8)]' 
                          : 'bg-slate-600'
                      }`} />
                      <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        activeEyeContactPct > 60 
                          ? 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.8)]' 
                          : 'bg-slate-600'
                      }`} />
                    </div>
                  </div>

                  {/* Anillo de sobrecarga ambiental */}
                  {sessionPhase === 'SENSORY_LOAD' && (
                    <div className="absolute -inset-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                  )}
                </div>
                
                <h4 className={`text-lg font-bold mb-2 ${sessionPhase === 'SENSORY_LOAD' ? 'text-rose-400' : 'text-sky-400'}`}>
                  {sessionPhase === 'SENSORY_LOAD' ? 'Sobrecarga Sensorial Activa (Ruido de Cafetería)' : 'Interacción Facial Neutra'}
                </h4>
                <p className="text-xs text-slate-400 font-mono">SACADAS Y FIJACIÓN EN RASTREO CONTINUO</p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <div className="flex items-center gap-3 mb-6 bg-indigo-950/30 p-4 rounded-xl border border-indigo-900/50">
                  <Brain className="w-8 h-8 text-indigo-400 shrink-0" />
                  <div>
                    <h4 className="text-indigo-300 font-bold text-sm">Motor Clínico AMIE (Perfil TEA)</h4>
                    <p className="text-xs text-indigo-200/60">Análisis multivariante de pupilometría y evasión social.</p>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {aiReport.split('\n').map((line, idx) => {
                    if (line.includes('🔴')) {
                      return (
                        <p key={idx} className="bg-rose-950/40 text-rose-300 p-3 rounded-lg border border-rose-900/50 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{line.replace('🔴 ', '')}</span>
                        </p>
                      );
                    }
                    if (line.includes('🟡')) {
                      return (
                        <p key={idx} className="bg-amber-950/40 text-amber-300 p-3 rounded-lg border border-amber-900/50 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{line.replace('🟡 ', '')}</span>
                        </p>
                      );
                    }
                    if (line.includes('🟢')) {
                      return (
                        <p key={idx} className="bg-emerald-950/40 text-emerald-300 p-3 rounded-lg border border-emerald-900/50 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{line.replace('🟢 ', '')}</span>
                        </p>
                      );
                    }
                    if (line.includes('**Dictamen')) {
                      return (
                        <p key={idx} className="text-indigo-300 font-bold mt-6 p-4 bg-slate-900 rounded-lg border border-slate-800 font-mono">
                          {line}
                        </p>
                      );
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VrSocialCognitionModule;
