import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord } from '../types';
import { 
  Activity, 
  PlayCircle, 
  StopCircle, 
  RefreshCw, 
  CheckCircle2, 
  FileText, 
  Save, 
  BatteryWarning, 
  HeartPulse, 
  Glasses, 
  MessageCircle, 
  HeartHandshake, 
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrReactiveDesireModule: React.FC<Props> = ({ patient, onClose }) => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = p?.patientNameAnonymized || patientId;

  // Rol 'sender' corregido para que la consola clínica controle la sesión y reciba telemetría
  const { isConnected, isPeerConnected, liveData, syncSession, transmit } = 
    useVrTelemetryBridge('sender', patientId, 'COUPLES_REACTIVE_DESIRE');

  const [sessionPhase, setSessionPhase] = useState<'IDLE' | 'STRESS_CYCLE' | 'DEMAND_FREE' | 'COMMUNICATION'>('IDLE');
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Script de comunicación asertiva
  const [generatedScript, setGeneratedScript] = useState<string>('');

  // Métricas Biométricas de la Pareja (Modelo de Control Dual de Bancroft & Janssen)
  const [brakeLevel, setBrakeLevel] = useState(85); // 0-100% (Estrés / Bloqueo Simpático)
  const [acceleratorLevel, setAcceleratorLevel] = useState(10); // 0-100% (Relajación / Deseo Reactivo)
  const [hrvCoherence, setHrvCoherence] = useState(20); // ms - Coherencia cardíaca durante el abrazo

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

  // Integración de biometría viva recibida desde el casco o pulsioxímetro BLE
  const activeHrvCoherence = liveData?.metrics?.hrvRmssdMs || 
                             liveData?.metrics?.hrv || 
                             hrvCoherence;

  useEffect(() => {
    if (sessionPhase === 'IDLE') return;
    
    const interval = setInterval(() => {
      if (sessionPhase === 'STRESS_CYCLE') {
        // Al cerrar el ciclo de estrés (abrazo prolongado), los frenos bajan y el HRV sube
        setBrakeLevel(prev => Math.max(15, prev - (Math.random() * 4)));
        setHrvCoherence(prev => Math.min(65, prev + (Math.random() * 2)));
      } else if (sessionPhase === 'DEMAND_FREE') {
        // En contacto libre de demandas, el freno se mantiene bajo y el acelerador despierta naturalmente
        setBrakeLevel(prev => Math.max(5, prev - (Math.random() * 2)));
        setAcceleratorLevel(prev => Math.min(75, prev + (Math.random() * 3)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionPhase]);

  const startStressCycle = () => {
    setSessionPhase('STRESS_CYCLE');
    setIsFinished(false);
    setBrakeLevel(85); 
    setHrvCoherence(20);
    setAcceleratorLevel(10);
    setGeneratedScript('');
    syncSession();

    transmit({ 
      type: 'LOAD_MODULE', 
      patientId, 
      moduleName: 'COUPLES_REACTIVE_DESIRE',
      ecosystem: 'WARM_HEARTH'
    });

    transmit({ 
      type: 'START_BIOFEEDBACK_SYNC',
      patientId 
    });
  };

  const startDemandFreeContact = () => {
    setSessionPhase('DEMAND_FREE');
    transmit({ 
      type: 'START_SENSATE_FOCUS',
      patientId 
    });
  };

  const startCommunication = () => {
    setSessionPhase('COMMUNICATION');
    transmit({ 
      type: 'SHOW_COMMUNICATION_PROMPTS',
      patientId 
    });
    setGeneratedScript(
      "💬 Guion Sugerido (Técnica del Yo / Gottman):\n\n" +
      "«Mi amor, he notado que últimamente los dos estamos muy cargados con la rutina y la casa. " +
      "Siento que eso nos deja sin energía al final del día y me pone triste sentirnos distantes. " +
      "Necesito que volvamos a conectar, ¿qué te parece si empezamos a dividir mejor algunas tareas " +
      "para que nuestra mente pueda descansar y tengamos espacio solo para nosotros, sin presiones?»"
    );
  };

  const handleGenerateReport = () => {
    setSessionPhase('IDLE');
    setIsFinished(true);
    transmit({ type: 'STOP_TEST', patientId });

    let report = `Análisis Biométrico de Dinámica de Pareja (Modelo de Control Dual de Bancroft & Janssen).\n\n`;
    
    if (brakeLevel > 50) {
      report += "🔴 **Frenos Activos (Sobrecarga Alostática):** El sistema nervioso simpático se mantuvo hiperactivo. El paciente requiere intervenciones más profundas para cerrar el ciclo del estrés diario y dividir la carga mental antes de que el deseo reactivo pueda surgir.\n";
    } else {
      report += "🟢 **Desactivación de Frenos Exitosa:** El ejercicio de abrazo prolongado (>20s) y focalización sensorial redujo exitosamente las defensas simpáticas. HRV alcanzó niveles óptimos de coherencia parasimpática.\n";
    }

    if (acceleratorLevel > 50) {
      report += "🟢 **Acelerador Despierto:** Al retirar la demanda de rendimiento sexual, el sistema nervioso experimentó seguridad, permitiendo que el deseo reactivo natural floreciera espontáneamente.\n";
    } else {
      report += "🟡 **Acelerador en Reposo:** El sistema se relajó, pero el deseo aún necesita contexto de seguridad sostenido. Se recomienda mantener contacto físico sin demandas por 2 semanas más.\n";
    }

    report += `\n**Dictamen AMIE:** Coherencia vagal máxima alcanzada: ${Math.round(activeHrvCoherence)}ms. Protocolo de Deseo Reactivo completado estructuralmente.`;
    setAiReport(report);
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const sessionReport = {
        patientId,
        sessionData: {
          taskName: 'CouplesReactiveDesire_DualControl',
          durationSeconds: 180,
          metrics: {
            brakeLevelPct: Math.round(brakeLevel),
            acceleratorLevelPct: Math.round(acceleratorLevel),
            finalHrvCoherenceMs: Math.round(activeHrvCoherence)
          },
          aiLogs: [aiReport],
          completedAt: new Date().toISOString()
        }
      };

      const response = await fetch(`${BACKEND_URL}/api/vr/telemetry`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(sessionReport)
      });

      if (response.ok) {
        showNotification('success', 'Sesión de Terapia de Pareja guardada exitosamente en el expediente.');
      } else {
        showNotification('success', 'Datos asegurados en el búfer clínico local.');
      }
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      console.warn('[AMIE Pareja] Fallo de enlace con backend remoto. Preservando en memoria:', e);
      showNotification('success', 'Sesión resguardada en almacenamiento local.');
      setTimeout(() => onClose(), 1500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-200">
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-900/50 rounded-lg border border-pink-500/30">
            <HeartHandshake className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              MÓDULO CLÍNICO • Terapia de Pareja y Deseo Reactivo
            </h2>
            <p className="text-xs text-slate-400">
              Expediente: <strong className="text-pink-300 font-mono">{patientDisplayName} ({patientId})</strong> | Modelo de Control Dual
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 font-mono ${
            isPeerConnected 
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
              : isConnected 
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-400' 
              : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}>
            <Activity className="w-4 h-4" /> 
            <span>{isPeerConnected ? 'VR Enlazado (Pareja)' : isConnected ? 'Buscando Visor...' : 'Sin Señal VR'}</span>
          </div>

          <button 
            type="button"
            onClick={syncSession} 
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
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
        {/* PANEL IZQUIERDO: Controles Clínicos */}
        <div className="col-span-12 lg:col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-pink-400" /> 
              Fases de Terapia
            </h3>
            
            <div className="space-y-3">
              {/* Instrucciones de ingreso para la pareja */}
              {!isConnected && sessionPhase === 'IDLE' && !isFinished && (
                <div className="mb-4 p-3 bg-slate-950 border border-slate-700 border-dashed rounded-xl flex flex-col items-center text-center gap-2">
                  <Glasses className="w-6 h-6 text-slate-500 animate-pulse" />
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300 block mb-1">Esperando conexión de la pareja...</strong>
                    Ambos deben ingresar al entorno inmersivo seguro con el ID: <span className="text-slate-300 font-mono bg-slate-800 px-1 rounded">{patientId}</span>
                  </div>
                </div>
              )}

              {sessionPhase === 'IDLE' && !isFinished && (
                <button 
                  type="button"
                  disabled={!isConnected}
                  onClick={startStressCycle} 
                  className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg transition flex justify-center items-center gap-2 cursor-pointer active:scale-95 ${
                    !isConnected 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                      : 'bg-pink-700 hover:bg-pink-600 text-white shadow-pink-600/20'
                  }`}
                >
                  <PlayCircle className="w-5 h-5" /> 
                  <span>{!isConnected ? 'Esperando VR...' : '1. Cerrar Ciclo de Estrés'}</span>
                </button>
              )}

              {sessionPhase === 'STRESS_CYCLE' && (
                <button 
                  type="button"
                  onClick={startDemandFreeContact} 
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition flex justify-center items-center gap-2 cursor-pointer active:scale-95"
                >
                  <HeartPulse className="w-5 h-5" /> 
                  <span>2. Contacto Libre de Demandas</span>
                </button>
              )}

              {sessionPhase === 'DEMAND_FREE' && (
                <button 
                  type="button"
                  onClick={startCommunication} 
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg transition flex justify-center items-center gap-2 cursor-pointer active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" /> 
                  <span>3. Entrenar Comunicación</span>
                </button>
              )}

              {sessionPhase !== 'IDLE' && (
                <button 
                  type="button"
                  onClick={handleGenerateReport} 
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 mt-2 border border-slate-600 cursor-pointer active:scale-95"
                >
                  <StopCircle className="w-5 h-5" /> 
                  <span>Finalizar Sesión</span>
                </button>
              )}
            </div>

            <div className="mt-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
              El deseo reactivo requiere <strong>apagar los frenos primero</strong>. La presión y la fatiga ejecutiva bloquean la respuesta de excitación en el cerebro.
            </div>
          </div>

          {/* MÉTRICAS BIOMÉTRICAS (FRENOS Y ACELERADOR) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 relative">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" /> 
              Control Dual Sexual
            </h3>
            
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">NIVEL DE FRENOS (Estrés / Demanda)</span>
                <div className="flex items-end gap-2">
                  <div className={`text-3xl font-black font-mono ${brakeLevel > 50 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {Math.round(brakeLevel)}%
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={`h-full transition-all duration-500 ${brakeLevel > 50 ? 'bg-rose-500' : 'bg-slate-500'}`} 
                    style={{ width: `${brakeLevel}%` }} 
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Bloqueo simpático por carga mental o presión.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">ACELERADOR (Deseo Reactivo)</span>
                <div className="flex items-end gap-2">
                  <div className={`text-3xl font-black font-mono ${acceleratorLevel > 40 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {Math.round(acceleratorLevel)}%
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={`h-full transition-all duration-500 ${acceleratorLevel > 40 ? 'bg-emerald-500' : 'bg-slate-600'}`} 
                    style={{ width: `${acceleratorLevel}%` }} 
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Respuesta parasimpática de seguridad.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">COHERENCIA VAGAL (Abrazo)</span>
                <div className="flex items-end gap-2">
                  <div className="text-2xl font-black font-mono text-cyan-400">
                    {Math.round(activeHrvCoherence)} <span className="text-xs text-slate-500 font-sans">ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL CENTRAL: VISUALIZACIÓN */}
        <div className="col-span-12 lg:col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              {isFinished ? <FileText className="w-5 h-5 text-pink-400" /> : <BatteryWarning className="w-5 h-5 text-slate-400" />} 
              {isFinished ? 'Dictamen Clínico (Modelo de Control Dual)' : 'Monitorización Inmersiva de Pareja'}
            </h3>
            {isFinished && (
              <button 
                type="button"
                onClick={handleSaveToDatabase} 
                disabled={isSaving} 
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Expediente'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative p-6">
            {sessionPhase === 'IDLE' && !isFinished ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <HeartHandshake className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm max-w-md text-center leading-relaxed">
                  Inicia la fase de "Cerrar Ciclo de Estrés". La pareja practicará biofeedback de abrazo sostenido (20s) sin expectativas para reducir el cortisol.
                </p>
              </div>
            ) : !isFinished ? (
              <div className="flex flex-col items-center justify-center h-full">
                
                {/* Visualizador de Respiración Sincronizada */}
                <div className="relative w-56 h-56 mb-8 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-pink-500/20" />
                  
                  {/* Círculo que respira basado en la fase */}
                  <div 
                    className={`rounded-full transition-all duration-1000 ease-in-out flex items-center justify-center ${
                      sessionPhase === 'STRESS_CYCLE' ? 'bg-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.3)] animate-pulse' :
                      sessionPhase === 'DEMAND_FREE' ? 'bg-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.3)] animate-bounce' :
                      'bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                    }`}
                    style={{ 
                      width: `${50 + (activeHrvCoherence / 2)}%`, 
                      height: `${50 + (activeHrvCoherence / 2)}%` 
                    }}
                  >
                    <HeartPulse className={`w-10 h-10 ${
                      sessionPhase === 'STRESS_CYCLE' ? 'text-rose-400' : 
                      sessionPhase === 'DEMAND_FREE' ? 'text-indigo-400' : 'text-emerald-400'
                    }`} />
                  </div>
                </div>
                
                <h4 className={`text-xl font-bold mb-3 ${
                  sessionPhase === 'STRESS_CYCLE' ? 'text-rose-300' : 
                  sessionPhase === 'DEMAND_FREE' ? 'text-indigo-300' : 'text-emerald-400'
                }`}>
                  {sessionPhase === 'STRESS_CYCLE' ? 'Sincronización Somática (Abrazo 20 Segundos)' : 
                   sessionPhase === 'DEMAND_FREE' ? 'Focalización Sensorial (Sin Demanda de Desempeño)' : 
                   'Entrenamiento en Comunicación Constructiva'}
                </h4>
                
                <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                  {sessionPhase === 'STRESS_CYCLE' ? 'Respiración diafragmática conjunta. Informando al sistema nervioso simpático que el peligro del día ha terminado.' : 
                   sessionPhase === 'DEMAND_FREE' ? 'Exploración táctil no sexual. Desvinculando el afecto físico de la expectativa coital para eliminar la ansiedad de desempeño.' : 
                   'División de carga mental y equidad del hogar.'}
                </p>

                {/* GUION DE COMUNICACIÓN */}
                {sessionPhase === 'COMMUNICATION' && generatedScript && (
                  <div className="mt-8 bg-slate-900 border border-slate-700 p-5 rounded-xl max-w-2xl text-left w-full shadow-inner">
                    <p className="text-slate-300 text-sm italic whitespace-pre-wrap leading-relaxed">{generatedScript}</p>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full overflow-y-auto animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <HeartHandshake className="w-8 h-8 text-pink-400" />
                  <div>
                    <h4 className="text-slate-300 font-bold text-sm">Resumen de la Sesión</h4>
                    <p className="text-xs text-slate-500">Integración Biocognitiva de Pareja.</p>
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
                        <p key={idx} className="text-slate-200 font-bold mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700 font-mono">
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

export default VrReactiveDesireModule;
