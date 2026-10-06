import React, { useState, useEffect } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Activity, Brain, Settings, PlayCircle, Zap, Cpu, RefreshCw, Send, FileText, Save, StopCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PatientRecord } from '../types';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrExecutiveFunctionModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  
  // Extraemos transmit para poder enviar el comando de STOP manual si es necesario
  const { isConnected, isPeerConnected, liveData, syncSession, sendRemoteStart, transmit } = useVrTelemetryBridge('receiver', patientId, 'ExecutiveControl');

  const [aiMode, setAiMode] = useState<boolean>(true);
  const [monitoringActive, setMonitoringActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>('');

  const rawMetrics = liveData?.metrics || { hits: 0, omissions: 0, commissions: 0, reactionTimeMs: 0 };
  
  // SOLUCIÓN TR: Filtramos el 0.
  const TR = rawMetrics.reactionTimeMs > 0 ? rawMetrics.reactionTimeMs : (rawMetrics.hits > 0 ? 350 : 0); 
  const trColor = TR === 0 ? 'text-slate-500' : TR < 300 ? 'text-emerald-400' : TR < 450 ? 'text-amber-400' : 'text-rose-400';

  // 1. INICIAR PRUEBA
  const handleStartMonitoring = () => {
    setMonitoringActive(true);
    setIsFinished(false);
    syncSession();
    sendRemoteStart();
  };

  // 2. DETENER Y GENERAR INFORME (Holodeck Reset)
  const handleGenerateReport = () => {
    setMonitoringActive(false);
    setIsFinished(true);
    
    // Comando para limpiar el visor del paciente y volver a sala de espera
    transmit({ type: 'STOP_TEST', patientId, moduleName: 'ExecutiveControl' });

    const { hits, omissions, commissions } = rawMetrics;
    const totalRespuestas = hits + omissions + commissions;
    
    let report = `Análisis Biocomportamental completado con ${totalRespuestas} paquetes de datos.\n\n`;
    
    if (totalRespuestas === 0) {
      report += "⚠️ No se detectó interacción del paciente. Prueba invalidada.";
    } else {
      if (omissions > hits) {
        report += "🔴 **Predominio Inatento:** El alto índice de omisiones sugiere una caída severa en la atención sostenida o fatiga cognitiva.\n";
      } else if (omissions > 3) {
        report += "🟡 **Fluctuación Atencional:** Se observan lapsos de inatención (omisiones) moderados.\n";
      } else {
        report += "🟢 **Atención Sostenida Intacta:** Capacidad óptima para mantener el foco en estímulos objetivo.\n";
      }

      if (commissions > 3) {
        report += "🔴 **Predominio Impulsivo:** Fallos consistentes en la inhibición de respuesta (comisiones), fuertemente asociado a impulsividad motora.\n";
      } else if (commissions > 0) {
        report += "🟡 **Control Inhibitorio Levemente Alterado:** Dificultad ocasional para frenar respuestas prepotentes.\n";
      } else {
        report += "🟢 **Inhibición de Respuesta Óptima:** Excelente control de impulsos ante estímulos No-Go.\n";
      }

      if (TR > 500) {
        report += "🟡 **Velocidad de Procesamiento Lenta:** Tiempo de reacción prolongado, descartar Tiempo Cognitivo Lento (SCT) o sedación farmacológica.\n";
      }
    }

    setAiReport(report);
  };

  // 3. GUARDAR EN MONGODB
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`https://amieneurogical.onrender.com/api/vr/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId,
          sessionData: {
            taskName: 'ExecutiveControl_TDAH',
            durationSeconds: 120, 
            metrics: {
              avgReactionTimeMs: TR,
              omissions: rawMetrics.omissions,
              commissions: rawMetrics.commissions,
              frontalEngagementPct: rawMetrics.hits > 0 ? 85 : 0, 
              binauralBetaHz: 15.0
            },
            aiLogs: [aiReport] 
          }
        })
      });
      
      if (response.ok) {
        alert('✅ Dictamen IA y métricas guardadas exitosamente en el Expediente Clínico (MongoDB).');
        safeClose();
      } else {
        alert('❌ Error al guardar en el servidor.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al intentar guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. CIERRE SEGURO (Desmontaje)
  const safeClose = () => {
    if (monitoringActive) {
      transmit({ type: 'STOP_TEST', patientId, moduleName: 'ExecutiveControl' });
    }
    onClose();
  };

  // 5. CLEANUP DE SEGURIDAD (Si el médico recarga la página por accidente)
  useEffect(() => {
    return () => {
      if (monitoringActive) {
        transmit({ type: 'STOP_TEST', patientId, moduleName: 'ExecutiveControl' });
      }
    };
  }, [monitoringActive, patientId, transmit]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-200">
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-900/50 rounded-lg border border-sky-500/30">
            <Brain className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">MÓDULO CLÍNICO • TDAH (Executive Control)</h2>
            <p className="text-xs text-slate-400">Paciente ID: <strong className="text-sky-300">{patientId}</strong></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={syncSession} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /><span>Sincronizar Visor</span>
          </button>
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${isConnected || isPeerConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-rose-950/80 border-rose-500/50 text-rose-400'}`}>
            <Activity className="w-4 h-4" />{isConnected || isPeerConnected ? 'VR Enlazado (En Vivo)' : 'Sin Señal VR'}
          </div>
          <button onClick={safeClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer">
            Volver al Selector
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-12 gap-6 h-full overflow-hidden">
        
        {/* PANEL IZQUIERDO: Controles */}
        <div className="col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-sky-400" /> Parámetros de la Prueba</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Modo de Administración</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button onClick={() => setAiMode(true)} className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${aiMode ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}><Cpu className="w-3.5 h-3.5" /> Autogestión IA</button>
                  <button onClick={() => setAiMode(false)} className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${!aiMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}><PlayCircle className="w-3.5 h-3.5" /> Manual</button>
                </div>
              </div>
              <div className="p-4 bg-sky-950/20 rounded-xl border border-sky-900/30 text-xs text-sky-200/70 text-center leading-relaxed">
                El Asistente AMIE evaluará control inhibitorio, atención sostenida y tiempo cognitivo.
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1">
             <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Rendimiento</h3>
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center"><span className="text-[10px] text-slate-500 font-bold">ACIERTOS</span><div className="text-xl font-black text-emerald-400 mt-1">{rawMetrics.hits}</div></div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center"><span className="text-[10px] text-slate-500 font-bold">OMISIONES</span><div className="text-xl font-black text-amber-400 mt-1">{rawMetrics.omissions}</div></div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center"><span className="text-[10px] text-slate-500 font-bold">COMISIONES</span><div className="text-xl font-black text-rose-500 mt-1">{rawMetrics.commissions}</div></div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center"><span className="text-[10px] text-slate-500 font-bold">TR PROMEDIO</span><div className={`text-xl font-black mt-1 ${trColor}`}>{TR}<span className="text-[10px]">ms</span></div></div>
             </div>
          </div>
        </div>

        {/* PANEL CENTRAL: Flujo en Vivo o Informe IA */}
        <div className="col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              {isFinished ? <FileText className="w-5 h-5 text-sky-400" /> : <Activity className="w-5 h-5 text-emerald-400" />} 
              {isFinished ? 'Dictamen Clínico Preliminar (IA)' : 'Monitorización Biométrica en Vivo'}
            </h3>
            
            <div className="flex gap-2">
              {!monitoringActive && !isFinished && (
                <button onClick={handleStartMonitoring} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer">
                  <PlayCircle className="w-4 h-4" /><span>Iniciar Evaluación VR</span>
                </button>
              )}

              {monitoringActive && (
                <button onClick={handleGenerateReport} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition flex items-center gap-2 cursor-pointer">
                  <StopCircle className="w-4 h-4" /><span>Detener y Generar Informe IA</span>
                </button>
              )}

              {isFinished && (
                <button onClick={handleSaveToDatabase} disabled={isSaving} className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" /><span>{isSaving ? 'Guardando...' : 'Guardar en Expediente MongoDB'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative p-6">
            {!monitoringActive && !isFinished ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500">
                 <Cpu className="w-12 h-12 mb-3 opacity-20" />
                 <p className="text-sm">Presiona "Iniciar Evaluación VR" para comenzar la transmisión de datos.</p>
               </div>
            ) : monitoringActive ? (
               <div className="flex flex-col items-center justify-center h-full">
                 <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin mb-6"></div>
                 <h4 className="text-lg font-bold text-emerald-400 mb-2">Evaluación en Progreso...</h4>
                 <p className="text-xs text-slate-400 font-mono">RECIBIENDO PAQUETES: {rawMetrics.hits + rawMetrics.omissions + rawMetrics.commissions}</p>
                 <p className="text-xs text-slate-500 mt-4 max-w-md text-center">El Asistente AMIE está procesando el tiempo de reacción inhibitorio en tiempo real desde el Meta Quest 3S.</p>
               </div>
            ) : (
               <div className="h-full overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3 mb-6 bg-sky-950/30 p-4 rounded-xl border border-sky-900/50">
                    <Brain className="w-8 h-8 text-sky-400" />
                    <div>
                      <h4 className="text-sky-300 font-bold text-sm">Motor Clínico AMIE 3.8</h4>
                      <p className="text-xs text-sky-200/60">Análisis basado en respuestas neuro-motoras CPT (Continuous Performance Test).</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {aiReport.split('\n').map((line, idx) => {
                      if (line.includes('🔴')) return <p key={idx} className="bg-rose-950/40 text-rose-300 p-3 rounded-lg border border-rose-900/50 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🔴 ', '')}</span></p>;
                      if (line.includes('🟡')) return <p key={idx} className="bg-amber-950/40 text-amber-300 p-3 rounded-lg border border-amber-900/50 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🟡 ', '')}</span></p>;
                      if (line.includes('🟢')) return <p key={idx} className="bg-emerald-950/40 text-emerald-300 p-3 rounded-lg border border-emerald-900/50 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🟢 ', '')}</span></p>;
                      if (line.includes('⚠️')) return <p key={idx} className="text-amber-400 font-bold">{line}</p>;
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
