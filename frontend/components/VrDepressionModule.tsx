import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { Activity, PlayCircle, StopCircle, RefreshCw, AlertTriangle, CheckCircle2, FileText, Save, BatteryWarning, HeartCrack, Glasses } from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrDepressionModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  
  // CORRECCIÓN CLAVE: Cambiamos a 'sender' y unificamos el nombre del módulo con el enrutador ('TDM_DEPRESSION')
  const { isConnected, liveData, syncSession, transmit } = useVrTelemetryBridge('sender', patientId, 'TDM_DEPRESSION');

  const [sessionPhase, setSessionPhase] = useState<'IDLE' | 'MOTOR_TEST' | 'ANHEDONIA_TEST'>('IDLE');
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');

  // Métricas Simuladas para Retardo Psicomotor y Anhedonia
  const [motorLatencyMs, setMotorLatencyMs] = useState(0);
  const [movementVelocity, setMovementVelocity] = useState(100); // 100% es neurotípico
  const [emotionalReactivity, setEmotionalReactivity] = useState(10); // Escala 0-10

  useEffect(() => {
    if (sessionPhase === 'IDLE') return;
    
    const interval = setInterval(() => {
      if (sessionPhase === 'MOTOR_TEST') {
        // En TDM severo, la latencia sube (retardo psicomotor) y la velocidad baja (bradicinesia)
        setMotorLatencyMs(prev => Math.min(850, prev + (Math.random() * 50)));
        setMovementVelocity(prev => Math.max(45, prev - (Math.random() * 5)));
      } else if (sessionPhase === 'ANHEDONIA_TEST') {
        // En TDM, la reactividad ante estímulos positivos es baja (aplanamiento)
        setEmotionalReactivity(prev => Math.max(2, prev - (Math.random() * 1.5)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionPhase]);

  const startMotorTest = () => {
    setSessionPhase('MOTOR_TEST');
    setIsFinished(false);
    setMotorLatencyMs(300); // Latencia inicial normal
    setMovementVelocity(95);
    syncSession();
    
    // ORDENAMOS AL VISOR CARGAR EL ENTORNO DE DEPRESIÓN / TDM
    transmit({ 
      type: 'LOAD_MODULE', 
      patientId, 
      moduleName: 'TDM_DEPRESSION',
      ecosystem: 'LOW_POLY_WHITE_ROOM' // Entorno neutro de calibración motora
    });

    transmit({ type: 'START_MOTOR_TRACKING' });
  };

  const startAnhedoniaTest = () => {
    setSessionPhase('ANHEDONIA_TEST');
    
    // Cambiamos el entorno en las gafas al estímulo de recompensa
    transmit({ 
      type: 'LOAD_MODULE', 
      patientId, 
      moduleName: 'TDM_DEPRESSION',
      ecosystem: 'SAFE_PLACE_FOREST' // Refugio o estímulo positivo inmersivo
    });

    transmit({ type: 'START_REWARD_STIMULUS' });
  };

  const handleGenerateReport = () => {
    setSessionPhase('IDLE');
    setIsFinished(true);
    transmit({ type: 'STOP_TEST' }); // Devuelve al paciente a la sala de espera

    let report = `Análisis de Retardo Psicomotor y Reactividad Afectiva (Cinemática VR y Biofeedback).\n\n`;
    
    // Análisis de Retardo Motor
    if (motorLatencyMs > 600 || movementVelocity < 60) {
      report += "🔴 **Retardo Psicomotor Severo:** Latencia de inicio de movimiento prolongada y bradicinesia evidente. Sugiere depresión mayor melancólica o inhibición psicomotriz.\n";
    } else if (motorLatencyMs > 400) {
      report += "🟡 **Lentificación Motora Leve:** Tiempos de reacción reducidos, posible fatiga cognitiva o efecto secundario farmacológico.\n";
    } else {
      report += "🟢 **Cinemática Motora Intacta:** Velocidad y latencia de movimiento dentro de los parámetros neurotípicos.\n";
    }

    // Análisis de Anhedonia
    if (emotionalReactivity < 4) {
      report += "🔴 **Aplanamiento Afectivo (Anhedonia):** Nula o muy baja reactividad fisiológica (HRV/Pupilometría) ante estímulos de recompensa positivos.\n";
    } else if (emotionalReactivity < 7) {
      report += "🟡 **Reactividad Emocional Disminuida:** Respuesta embotada ante el refuerzo positivo.\n";
    } else {
      report += "🟢 **Reactividad Emocional Conservada:** Respuesta fisiológica normal ante estímulos gratificantes.\n";
    }

    report += `\n**Dictamen AMIE:** Patrón biomotor sugerente de Trastorno Depresivo Mayor (TDM). Latencia máxima registrada: ${Math.round(motorLatencyMs)}ms.`;
    setAiReport(report);
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/vr/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId,
          sessionData: {
            taskName: 'Depression_TDM',
            durationSeconds: 180,
            metrics: { 
              biomotorLatencyMs: motorLatencyMs, 
              movementVelocityPct: movementVelocity,
              emotionalReactivityScore: emotionalReactivity
            },
            aiLogs: [aiReport],
            completedAt: new Date().toISOString()
          }
        })
      });
      alert('✅ Evaluación TDM guardada en el expediente.');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error de red al intentar guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-200">
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-600">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">MÓDULO CLÍNICO • Depresión Mayor (TDM)</h2>
            <p className="text-xs text-slate-400">Paciente ID: <strong className="text-slate-300">{patientId}</strong></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
            <Activity className="w-4 h-4" /> {isConnected ? 'VR Conectado' : 'Esperando VR...'}
          </div>
          <button onClick={syncSession} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Sincronizar
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer">Volver al Selector</button>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-12 gap-6 h-full overflow-hidden">
        {/* PANEL IZQUIERDO: Controles */}
        <div className="col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><BatteryWarning className="w-4 h-4 text-slate-400" /> Fases de Evaluación</h3>
            <div className="space-y-3">
              
              {/* INSTRUCCIONES DE INGRESO PARA EL PACIENTE */}
              {!isConnected && sessionPhase === 'IDLE' && !isFinished && (
                <div className="mb-4 p-3 bg-slate-950 border border-slate-700 border-dashed rounded-xl flex flex-col items-center text-center gap-2">
                  <Glasses className="w-6 h-6 text-slate-500 animate-pulse" />
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300 block mb-1">Esperando conexión del paciente...</strong>
                    El paciente debe colocarse el visor e iniciar sesión con ID: <span className="text-slate-300 font-mono bg-slate-800 px-1 rounded">{patientId}</span>
                  </div>
                </div>
              )}

              {sessionPhase === 'IDLE' && !isFinished && (
                <button 
                  disabled={!isConnected}
                  onClick={startMotorTest} 
                  className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg transition flex justify-center items-center gap-2 cursor-pointer ${
                    !isConnected 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  <PlayCircle className="w-5 h-5" /> {!isConnected ? 'Esperando VR...' : '1. Test Biomotor (Latencia)'}
                </button>
              )}

              {sessionPhase === 'MOTOR_TEST' && (
                <button onClick={startAnhedoniaTest} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition flex justify-center items-center gap-2 cursor-pointer">
                  <HeartCrack className="w-5 h-5" /> 2. Test Anhedonia (Recompensa)
                </button>
              )}

              {(sessionPhase === 'MOTOR_TEST' || sessionPhase === 'ANHEDONIA_TEST') && (
                <button onClick={handleGenerateReport} className="w-full py-3 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 mt-2 cursor-pointer">
                  <StopCircle className="w-5 h-5" /> Finalizar Prueba IA
                </button>
              )}

            </div>
            <div className="mt-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
              La IA mide la lentitud física (retardo psicomotor) y la falta de respuesta fisiológica ante estímulos positivos (aplanamiento afectivo).
            </div>
          </div>

          {/* MÉTRICAS BIOMOTORAS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 relative">
             <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400" /> Marcadores de TDM</h3>
             
             <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">LATENCIA DE INICIO MOTOR</span>
                  <div className="flex items-end gap-2">
                    <div className={`text-3xl font-black ${motorLatencyMs > 500 ? 'text-rose-400' : 'text-slate-300'}`}>{Math.round(motorLatencyMs)}</div>
                    <span className="text-xs text-slate-500 font-bold mb-1">ms</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className={`h-full transition-all duration-500 ${motorLatencyMs > 500 ? 'bg-rose-500' : 'bg-slate-400'}`} style={{ width: `${Math.min(100, (motorLatencyMs / 1000) * 100)}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">VELOCIDAD CINEMÁTICA</span>
                  <div className="flex items-end gap-2">
                    <div className={`text-3xl font-black ${movementVelocity < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>{Math.round(movementVelocity)}%</div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className={`h-full transition-all duration-500 ${movementVelocity < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${movementVelocity}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">REACTIVIDAD EMOCIONAL</span>
                  <div className="flex items-end gap-2">
                    <div className={`text-3xl font-black ${emotionalReactivity < 5 ? 'text-rose-400' : 'text-sky-400'}`}>{emotionalReactivity.toFixed(1)}</div>
                    <span className="text-xs text-slate-500 font-bold mb-1">/ 10</span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              {isFinished ? <FileText className="w-5 h-5 text-slate-400" /> : <BatteryWarning className="w-5 h-5 text-slate-400" />} 
              {isFinished ? 'Dictamen Clínico (Depresión Mayor)' : 'Monitorización de Retardo Psicomotor VR'}
            </h3>
            {isFinished && (
              <button onClick={handleSaveToDatabase} disabled={isSaving} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                <Save className="w-4 h-4" /><span>{isSaving ? 'Guardando...' : 'Guardar Expediente'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative p-6">
            {sessionPhase === 'IDLE' && !isFinished ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500">
                 <BatteryWarning className="w-12 h-12 mb-3 opacity-20" />
                 <p className="text-sm">Inicia el "Test Biomotor" para medir la agilidad física del paciente en el visor.</p>
               </div>
            ) : !isFinished ? (
               <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                     {/* Visualización de la lentitud de movimiento */}
                     <div className={`w-32 h-32 rounded-full border-4 ${sessionPhase === 'MOTOR_TEST' ? 'border-slate-600' : 'border-indigo-500'} flex items-center justify-center`}>
                        <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                            style={{ 
                              animation: `spin ${100 / movementVelocity}s linear infinite`,
                              transformOrigin: '0 60px' 
                            }}>
                        </div>
                     </div>
                  </div>
                  
                  <h4 className={`text-lg font-bold mb-2 ${sessionPhase === 'MOTOR_TEST' ? 'text-slate-300' : 'text-indigo-400'}`}>
                    {sessionPhase === 'MOTOR_TEST' ? 'Evaluando Bradicinesia (Velocidad de Movimiento)' : 'Evaluando Reactividad ante Estímulo de Recompensa'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">CAPTURA CINEMÁTICA MEDIANTE ACELERÓMETROS 6DoF</p>
               </div>
            ) : (
               <div className="h-full overflow-y-auto animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <Activity className="w-8 h-8 text-slate-400" />
                    <div>
                      <h4 className="text-slate-300 font-bold text-sm">Motor Clínico AMIE (Perfil TDM)</h4>
                      <p className="text-xs text-slate-500">Análisis físico de inhibición psicomotriz y aplanamiento afectivo.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {aiReport.split('\n').map((line, idx) => {
                      if (line.includes('🔴')) return <p key={idx} className="bg-rose-950/40 text-rose-300 p-3 rounded-lg border border-rose-900/50 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🔴 ', '')}</span></p>;
                      if (line.includes('🟡')) return <p key={idx} className="bg-amber-950/40 text-amber-300 p-3 rounded-lg border border-amber-900/50 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🟡 ', '')}</span></p>;
                      if (line.includes('🟢')) return <p key={idx} className="bg-emerald-950/40 text-emerald-300 p-3 rounded-lg border border-emerald-900/50 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🟢 ', '')}</span></p>;
                      if (line.includes('**Dictamen')) return <p key={idx} className="text-slate-200 font-bold mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">{line}</p>;
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
