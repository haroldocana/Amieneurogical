import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { Fingerprint, Map, Activity, PlayCircle, StopCircle, RefreshCw, AlertTriangle, CheckCircle2, FileText, Save, HandMetal, Network } from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrCognitiveDeclineModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  
  // CORRECCIÓN CLAVE: Cambiamos a 'sender' y unificamos el nombre del módulo con el enrutador ('NEURO_DEGEN')
  const { isConnected, liveData, syncSession, transmit } = useVrTelemetryBridge('sender', patientId, 'NEURO_DEGEN');

  const [sessionPhase, setSessionPhase] = useState<'IDLE' | 'TREMOR_ANALYSIS' | 'SPATIAL_MAZE'>('IDLE');
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');

  // Métricas Simuladas
  const [tremorAmplitudeMm, setTremorAmplitudeMm] = useState(0);
  const [navErrors, setNavErrors] = useState(0);
  const [pathEfficiency, setPathEfficiency] = useState(100);

  useEffect(() => {
    if (sessionPhase === 'IDLE') return;
    
    const interval = setInterval(() => {
      if (sessionPhase === 'TREMOR_ANALYSIS') {
        // Simulamos un temblor parkinsoniano de reposo (ej. 4 a 8 mm)
        setTremorAmplitudeMm(prev => {
          const base = prev === 0 ? 5 : prev;
          return Math.max(1, Math.min(12, base + (Math.random() * 2 - 1)));
        });
      } else if (sessionPhase === 'SPATIAL_MAZE') {
        // Simulamos desorientación espacial (Alzheimer incipiente)
        if (Math.random() > 0.7) setNavErrors(prev => prev + 1);
        setPathEfficiency(prev => Math.max(30, prev - (Math.random() * 2)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionPhase]);

  const startTremorAnalysis = () => {
    setSessionPhase('TREMOR_ANALYSIS');
    setIsFinished(false);
    setTremorAmplitudeMm(0);
    syncSession();
    
    // ORDENAMOS AL VISOR CARGAR EL ENTORNO DE EVALUACIÓN NEURODEGENERATIVA
    transmit({ 
      type: 'LOAD_MODULE', 
      patientId, 
      moduleName: 'NEURO_DEGEN',
      ecosystem: 'LOW_POLY_WHITE_ROOM' // Sala estéril de calibración motora
    });

    transmit({ type: 'START_TREMOR_TEST' });
  };

  const startSpatialMaze = () => {
    setSessionPhase('SPATIAL_MAZE');
    
    // Cambiamos el entorno en las gafas al laberinto espacial
    transmit({ 
      type: 'LOAD_MODULE', 
      patientId, 
      moduleName: 'NEURO_DEGEN',
      ecosystem: 'ZEN_GARDEN' // O un laberinto virtual 3D
    });

    transmit({ type: 'START_MAZE_TEST' });
  };

  const handleGenerateReport = () => {
    setSessionPhase('IDLE');
    setIsFinished(true);
    transmit({ type: 'STOP_TEST' }); // Devuelve al paciente a la sala de espera

    let report = `Análisis de Marcadores Neurodegenerativos (Cinemática Hand-Tracking y Navegación 6DoF).\n\n`;
    
    if (tremorAmplitudeMm > 6) {
      report += "🔴 **Temblor de Reposo Detectado:** Amplitud cinemática superior a 6mm. Patrón consistente con actividad parkinsoniana o temblor esencial severo.\n";
    } else if (tremorAmplitudeMm > 3) {
      report += "🟡 **Micro-Temblores:** Temblor fisiológico exacerbado o signos extrapiramidales leves.\n";
    } else {
      report += "🟢 **Estabilidad Motora:** Sin hallazgos cinemáticos de temblor en reposo.\n";
    }

    if (pathEfficiency < 60 || navErrors > 4) {
      report += "🔴 **Déficit Visoespacial:** Pérdida severa de la eficiencia de ruta e incapacidad para retener mapas mentales (Alta tasa de errores: " + navErrors + "). Sugerente de deterioro cognitivo tipo Alzheimer.\n";
    } else if (pathEfficiency < 80) {
      report += "🟡 **Desorientación Leve:** Dificultad moderada en la memoria de trabajo espacial.\n";
    } else {
      report += "🟢 **Navegación Intacta:** Excelente retención de la memoria espacial y de trabajo.\n";
    }

    report += `\n**Dictamen AMIE:** Evaluación completada. Amplitud de temblor máx: ${tremorAmplitudeMm.toFixed(1)}mm. Eficiencia de memoria espacial: ${Math.round(pathEfficiency)}%.`;
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
            taskName: 'CognitiveDecline_Neuro',
            durationSeconds: 180,
            metrics: { tremorMm: tremorAmplitudeMm, navEfficiency: pathEfficiency, navErrors },
            aiLogs: [aiReport]
          }
        })
      });
      alert('✅ Evaluación Neurodegenerativa guardada exitosamente en el expediente.');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al intentar guardar en el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-200">
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-900/50 rounded-lg border border-amber-500/30">
            <Fingerprint className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">MÓDULO CLÍNICO • Deterioro Cognitivo (Neuro)</h2>
            <p className="text-xs text-slate-400">Paciente ID: <strong className="text-amber-300">{patientId}</strong></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
            <Activity className="w-4 h-4" /> {isConnected ? 'VR Conectado' : 'Esperando VR...'}
          </div>

          <button onClick={syncSession} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /><span>Sincronizar</span>
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer">Volver al Selector</button>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-12 gap-6 h-full overflow-hidden">
        <div className="col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Network className="w-4 h-4 text-amber-400" /> Fases de Evaluación</h3>
            <div className="space-y-3">
              {sessionPhase === 'IDLE' && !isFinished && (
                <button 
                  disabled={!isConnected}
                  onClick={startTremorAnalysis} 
                  className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg transition flex justify-center items-center gap-2 ${!isConnected ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'}`}
                >
                  <HandMetal className="w-5 h-5" /> 1. Análisis de Temblor (Manos)
                </button>
              )}
              {sessionPhase === 'TREMOR_ANALYSIS' && (
                <button onClick={startSpatialMaze} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg transition flex justify-center items-center gap-2 cursor-pointer">

<Map className="w-5 h-5" />
2. Navegación Espacial (Laberinto)
                </button>
              )}
              {(sessionPhase === 'TREMOR_ANALYSIS' || sessionPhase === 'SPATIAL_MAZE') && (
                <button onClick={handleGenerateReport} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 mt-2 cursor-pointer">
                  <StopCircle className="w-5 h-5" /> Finalizar Prueba IA
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 relative">
             <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-sky-400" /> Marcadores Biométricos</h3>
             <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">AMPLITUD DE TEMBLOR (REPOSO)</span>
                  <div className="flex items-end gap-2">
                    <div className={`text-3xl font-black ${tremorAmplitudeMm > 6 ? 'text-rose-400' : 'text-emerald-400'}`}>{tremorAmplitudeMm.toFixed(1)}</div>
                    <span className="text-xs text-slate-500 font-bold mb-1">mm</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">EFICIENCIA ESPACIAL (MEMORIA)</span>
                  <div className="flex items-end gap-2">
                    <div className={`text-3xl font-black ${pathEfficiency < 60 ? 'text-rose-400' : 'text-sky-400'}`}>{Math.round(pathEfficiency)}%</div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">ERRORES DE NAVEGACIÓN</span>
                  <div className="text-2xl font-black text-amber-400">{navErrors} <span className="text-xs text-slate-500 font-normal">desvíos</span></div>
                </div>
             </div>
          </div>
        </div>

        <div className="col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              {isFinished ? <FileText className="w-5 h-5 text-amber-400" /> : <Fingerprint className="w-5 h-5 text-amber-400" />} 
              {isFinished ? 'Dictamen Clínico (Neurodegenerativo)' : 'Monitorización Cognitiva y Motora VR'}
            </h3>
            {isFinished && (
              <button onClick={handleSaveToDatabase} disabled={isSaving} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 cursor-pointer">
                <Save className="w-4 h-4" /><span>Guardar Expediente</span>
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-6 overflow-hidden">
            {!isFinished ? (
               <div className="flex flex-col items-center justify-center h-full">
                 <div className="relative w-48 h-48 mb-6 flex items-center justify-center border-4 border-slate-800 rounded-full">
                    {sessionPhase === 'TREMOR_ANALYSIS' && <HandMetal className="w-20 h-20 text-amber-400 animate-bounce" />}

<Map className="w-20 h-20 text-sky-400 animate-pulse" />
{sessionPhase === 'SPATIAL_MAZE' && }
                    {sessionPhase === 'IDLE' && <Fingerprint className="w-16 h-16 text-slate-600" />}
                 </div>
                 <h4 className="text-lg font-bold text-slate-300">
                   {sessionPhase === 'TREMOR_ANALYSIS' ? 'Analizando Cinemática de Manos...' : sessionPhase === 'SPATIAL_MAZE' ? 'Evaluando Memoria y Navegación...' : 'En Espera de Conexión y Selección...'}
                 </h4>
               </div>
            ) : (
               <div className="h-full overflow-y-auto animate-in fade-in">
                  <div className="space-y-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {aiReport.split('\n').map((line, idx) => {
                      if (line.includes('🔴')) return <p key={idx} className="bg-rose-950/40 text-rose-300 p-3 rounded-lg flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5" /> <span>{line.replace('🔴 ', '')}</span></p>;
                      if (line.includes('🟡')) return <p key={idx} className="bg-amber-950/40 text-amber-300 p-3 rounded-lg flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5" /> <span>{line.replace('🟡 ', '')}</span></p>;
                      if (line.includes('🟢')) return <p key={idx} className="bg-emerald-950/40 text-emerald-300 p-3 rounded-lg flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5" /> <span>{line.replace('🟢 ', '')}</span></p>;
                      if (line.includes('**Dictamen')) return <p key={idx} className="text-amber-300 font-bold mt-6 p-4 bg-slate-900 rounded-lg">{line}</p>;
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
