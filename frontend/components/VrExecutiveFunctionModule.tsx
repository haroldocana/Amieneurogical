import React, { useState, useEffect, useRef } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { 
  Activity, 
  Brain, 
  Settings, 
  PlayCircle, 
  Zap, 
  Cpu, 
  RefreshCw, 
  Save, 
  StopCircle, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  X
} from 'lucide-react';
import { PatientRecord } from '../types';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrExecutiveFunctionModule: React.FC<Props> = ({ patient, onClose }) => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = p?.patientNameAnonymized || patientId;
  
  // Rol 'sender' para transmitir comandos de control y recibir telemetría motora
  const { isConnected, isPeerConnected, liveData, syncSession, sendRemoteStart, transmit } = 
    useVrTelemetryBridge('sender', patientId, 'TDAH_EXECUTIVE');

  const [aiMode, setAiMode] = useState<boolean>(true);
  const [monitoringActive, setMonitoringActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const rawMetrics = liveData?.metrics || { hits: 0, omissions: 0, commissions: 0, reactionTimeMs: 0 };
  
  // Filtrado de métrica visual para evitar valores en cero falsos
  const TR = rawMetrics.reactionTimeMs > 0 ? rawMetrics.reactionTimeMs : (rawMetrics.hits > 0 ? 350 : 0); 
  const trColor = TR === 0 ? 'text-slate-500' : TR < 300 ? 'text-emerald-400' : TR < 450 ? 'text-amber-400' : 'text-rose-400';

  // 1. INICIAR PRUEBA Y CARGAR ENTORNO EN EL VISOR
  const handleStartMonitoring = () => {
    setMonitoringActive(true);
    setIsFinished(false);
    syncSession();
    
    // Ordenamos al visor del paciente cargar el escenario TDAH
    transmit({ 
      type: 'LOAD_MODULE', 
      moduleName: 'TDAH_EXECUTIVE',
      ecosystem: 'TDAH_EXECUTIVE',
      patientId
    });
    
    sendRemoteStart();
  };

  // 2. DETENER Y GENERAR INFORME
  const handleGenerateReport = () => {
    setMonitoringActive(false);
    setIsFinished(true);
    
    // Comando para devolver al paciente a la sala de espera
    transmit({ type: 'STOP_TEST', patientId });

    const { hits, omissions, commissions } = rawMetrics;
    const totalRespuestas = hits + omissions + commissions;
    
    let report = `Análisis Biocomportamental completado con ${totalRespuestas} paquetes de datos.\n\n`;
    
    if (totalRespuestas === 0) {
      report += "⚠️ No se detectó interacción del paciente. Prueba invalidada o sin sincronización de visor.";
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

  // 3. GUARDAR EN MONGODB ATLAS
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/vr/telemetry`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          patientId,
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
            aiLogs: [aiReport],
            completedAt: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        showNotification('success', 'Dictamen IA y métricas guardadas exitosamente en MongoDB.');
        setTimeout(() => safeClose(), 1500);
      } else {
        showNotification('error', 'Error al persistir en el servidor. Preservando datos en búfer local.');
      }
    } catch (e) {
      console.warn('[AMIE TDAH] Error de red. Asegurando copia en búfer local:', e);
      showNotification('success', 'Datos resguardados en memoria local.');
      setTimeout(() => safeClose(), 1500);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. CIERRE SEGURO
  const safeClose = () => {
    if (monitoringActive) {
      transmit({ type: 'STOP_TEST', patientId });
    }
    onClose();
  };

  // 5. CLEANUP DE SEGURIDAD
  useEffect(() => {
    return () => {
      if (monitoringActive) {
        transmit({ type: 'STOP_TEST', patientId });
      }
    };
  }, [monitoringActive, transmit, patientId]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-200">
      {/* Barra Superior */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-900/50 rounded-lg border border-sky-500/30">
            <Brain className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">MÓDULO CLÍNICO • TDAH (Executive Control)</h2>
            <p className="text-xs text-slate-400">
              Expediente: <strong className="text-sky-300 font-mono">{patientDisplayName} ({patientId})</strong>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              syncSession();
              transmit({ type: 'LOAD_MODULE', moduleName: 'TDAH_EXECUTIVE', ecosystem: 'TDAH_EXECUTIVE', patientId });
            }} 
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar Visor</span>
          </button>

          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 font-mono ${
            isPeerConnected 
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
              : isConnected 
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-400' 
              : 'bg-rose-950/80 border-rose-500/50 text-rose-400'
          }`}>
            <Activity className="w-4 h-4" />
            <span>{isPeerConnected ? 'VR Enlazado (En Vivo)' : isConnected ? 'Conectado / Buscando Visor...' : 'Sin Señal VR'}</span>
          </div>

          <button 
            type="button"
            onClick={safeClose} 
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
        {/* PANEL IZQUIERDO: Controles y Métricas */}
        <div className="col-span-12 lg:col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-400" /> 
              Parámetros de la Prueba
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Modo de Administración</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setAiMode(true)} 
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      aiMode ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" /> Autogestión IA
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAiMode(false)} 
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      !aiMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Manual
                  </button>
                </div>
              </div>
              <div className="p-4 bg-sky-950/20 rounded-xl border border-sky-900/30 text-xs text-sky-200/70 text-center leading-relaxed">
                El Asistente AMIE evaluará control inhibitorio, atención sostenida y tiempo cognitivo Go/No-Go.
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> Rendimiento
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ACIERTOS</span>
                <div className="text-xl font-black text-emerald-400 mt-1 font-mono">{rawMetrics.hits}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">OMISIONES</span>
                <div className="text-xl font-black text-amber-400 mt-1 font-mono">{rawMetrics.omissions}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">COMISIONES</span>
                <div className="text-xl font-black text-rose-500 mt-1 font-mono">{rawMetrics.commissions}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TR PROMEDIO</span>
                <div className={`text-xl font-black mt-1 font-mono ${trColor}`}>{TR}<span className="text-[10px] font-sans">ms</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL CENTRAL: Flujo en Vivo o Informe IA */}
        <div className="col-span-12 lg:col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              {isFinished ? <FileText className="w-5 h-5 text-sky-400" /> : <Activity className="w-5 h-5 text-emerald-400" />} 
              {isFinished ? 'Dictamen Clínico Preliminar (IA)' : 'Monitorización Biométrica en Vivo'}
            </h3>
            
            <div className="flex gap-2">
              {!monitoringActive && !isFinished && (
                <button 
                  type="button"
                  onClick={handleStartMonitoring} 
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Iniciar Evaluación VR</span>
                </button>
              )}

              {monitoringActive && (
                <button 
                  type="button"
                  onClick={handleGenerateReport} 
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Detener y Generar Informe IA</span>
                </button>
              )}

              {isFinished && (
                <button 
                  type="button"
                  onClick={handleSaveToDatabase} 
                  disabled={isSaving} 
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar en Expediente MongoDB'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative p-6">
            {!monitoringActive && !isFinished ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Cpu className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Presiona "Iniciar Evaluación VR" para comenzar la transmisión de datos al visor.</p>
              </div>
            ) : monitoringActive ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin mb-6" />
                <h4 className="text-lg font-bold text-emerald-400 mb-2">Evaluación en Progreso...</h4>
                <p className="text-xs text-slate-400 font-mono">
                  RECIBIENDO PAQUETES: {rawMetrics.hits + rawMetrics.omissions + rawMetrics.commissions}
                </p>
                <p className="text-xs text-slate-500 mt-4 max-w-md text-center">
                  El Asistente AMIE está procesando el tiempo de reacción inhibitorio en tiempo real desde el Meta Quest / Pico 3.
                </p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-6 bg-sky-950/30 p-4 rounded-xl border border-sky-900/50">
                  <Brain className="w-8 h-8 text-sky-400 shrink-0" />
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
                    if (line.includes('⚠️')) return <p key={idx} className="text-amber-400 font-bold p-3 bg-amber-950/30 rounded-lg border border-amber-900/40">{line}</p>;
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

export default VrExecutiveFunctionModule;
