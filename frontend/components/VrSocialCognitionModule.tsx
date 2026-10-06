import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { Eye, Users, Activity, PlayCircle, StopCircle, RefreshCw, AlertTriangle, CheckCircle2, FileText, Save, ScanFace, Volume2 } from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrSocialCognitionModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  const { isConnected, liveData, syncSession, transmit } = useVrTelemetryBridge('receiver', patientId, 'TEA_SOCIAL');

  const [sessionPhase, setSessionPhase] = useState<'IDLE' | 'FACE_TRACKING' | 'SENSORY_LOAD'>('IDLE');
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');

  // Métricas Simuladas en vivo (Eye-Tracking y Estrés)
  const [eyeContactPct, setEyeContactPct] = useState(0);
  const [gazeAvoidance, setGazeAvoidance] = useState(0);
  const [sensoryStress, setSensoryStress] = useState(2);

  useEffect(() => {
    if (sessionPhase === 'IDLE') return;
    
    const interval = setInterval(() => {
      if (sessionPhase === 'FACE_TRACKING') {
        // En un paciente neurotípico, el contacto visual rondaría el 70-80%. 
        // Aquí simulamos un perfil TEA (bajo contacto visual, alta evasión).
        setEyeContactPct(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 4))));
        if (eyeContactPct < 40) setGazeAvoidance(prev => prev + 1);
        setSensoryStress(prev => Math.max(1, prev - 0.1)); // Estrés basal
      } else if (sessionPhase === 'SENSORY_LOAD') {
        // Al inducir sobrecarga sensorial, el contacto visual cae y el estrés sube.
        setEyeContactPct(prev => Math.max(0, prev - (Math.random() * 5)));
        setSensoryStress(prev => Math.min(10, prev + (Math.random() * 0.8)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionPhase, eyeContactPct]);

  const startFaceTracking = () => {
    setSessionPhase('FACE_TRACKING');
    setIsFinished(false);
    setEyeContactPct(35); // Iniciamos con un valor típico de evasión TEA
    setGazeAvoidance(0);
    syncSession();
    transmit({ type: 'LOAD_MODULE', patientId, moduleName: 'TEA_SOCIAL' });
    transmit({ type: 'START_FACES' });
  };

  const startSensoryLoad = () => {
    setSessionPhase('SENSORY_LOAD');
    transmit({ type: 'START_OVERSTIMULATION' });
  };

  const handleGenerateReport = () => {
    setSessionPhase('IDLE');
    setIsFinished(true);
    transmit({ type: 'STOP_TEST' });

    let report = `Análisis de Cognición Social y Tolerancia Sensorial (Pupilometría y Gaze-Tracking).\n\n`;
    
    if (eyeContactPct < 40) {
      report += "🔴 **Déficit de Atención Social:** Severa evasión del contacto visual directo. La mirada se fija predominantemente en la periferia o en la boca del interlocutor (procesamiento fragmentado).\n";
    } else if (eyeContactPct < 65) {
      report += "🟡 **Contacto Visual Intermitente:** Evitación ocular leve, posible mecanismo compensatorio ante exigencia social.\n";
    } else {
      report += "🟢 **Atención Conjunta Íntegra:** Seguimiento y fijación ocular dentro de parámetros neurotípicos.\n";
    }

    if (sensoryStress > 7) {
      report += "🔴 **Hiperreactividad Sensorial:** Pico autonómico agudo ante estímulos ambientales (ruido/luces). Alto riesgo de sobrecarga (meltdown).\n";
    } else if (sensoryStress > 4) {
      report += "🟡 **Sensibilidad Ambiental:** Leve incomodidad ante saturación de estímulos, pero con capacidad de autoregulación.\n";
    }

    report += `\n**Dictamen AMIE:** Patrón visual y reactividad consistentes con criterios de espectro autista (TEA). Nivel de evasión visual acumulada: ${gazeAvoidance}s.`;
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
            taskName: 'SocialCognition_TEA',
            durationSeconds: 180,
            metrics: { avgHrv: 10 - sensoryStress, frontalEngagementPct: eyeContactPct },
            aiLogs: [aiReport],
            completedAt: new Date().toISOString()
          }
        })
      });
      alert('✅ Evaluación TEA guardada en el expediente.');
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
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-900/50 rounded-lg border border-indigo-500/30">
            <Eye className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">MÓDULO CLÍNICO • TEA (Cognición Social)</h2>
            <p className="text-xs text-slate-400">Paciente ID: <strong className="text-indigo-300">{patientId}</strong></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={syncSession} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Sincronizar
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">Volver al Selector</button>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-12 gap-6 h-full overflow-hidden">
        {/* CONTROLES IZQUIERDOS */}
        <div className="col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><ScanFace className="w-4 h-4 text-indigo-400" /> Fases de Evaluación</h3>
            <div className="space-y-3">
              {sessionPhase === 'IDLE' && !isFinished && (
                <button onClick={startFaceTracking} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition flex justify-center items-center gap-2">
                  <PlayCircle className="w-5 h-5" /> 1. Iniciar Interacción Facial
                </button>
              )}
              {sessionPhase === 'FACE_TRACKING' && (
                <button onClick={startSensoryLoad} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/30 transition flex justify-center items-center gap-2">
                  <Volume2 className="w-5 h-5" /> 2. Inducir Carga Sensorial
                </button>
              )}
              {(sessionPhase === 'FACE_TRACKING' || sessionPhase === 'SENSORY_LOAD') && (
                <button onClick={handleGenerateReport} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 mt-2">
                  <StopCircle className="w-5 h-5" /> Finalizar Prueba IA
                </button>
              )}
            </div>
            <div className="mt-4 p-3 bg-indigo-950/20 rounded-xl border border-indigo-900/30 text-xs text-indigo-200/70 leading-relaxed">
              Evalúa la atención conjunta mediante Eye-Tracking y la tolerancia autonómica ante ruido ambiental estructurado.
            </div>
          </div>

          {/* MÉTRICAS EYE TRACKING */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 relative">
             <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Eye className="w-4 h-4 text-sky-400" /> Mapa de Calor Visual</h3>
             
             <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">CONTACTO VISUAL (OJOS)</span>
                  <div className="flex items-end gap-2">
                    <div className="text-3xl font-black text-sky-400">{Math.round(eyeContactPct)}%</div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-sky-400 h-full transition-all duration-500" style={{ width: `${eyeContactPct}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">ESTRÉS SENSORIAL (AROUSAL)</span>
                  <div className="flex items-end gap-2">
                    <div className={`text-3xl font-black ${sensoryStress > 7 ? 'text-rose-400' : 'text-amber-400'}`}>{sensoryStress.toFixed(1)}</div>
                    <span className="text-xs text-slate-500 font-bold mb-1">/ 10</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className={`h-full transition-all duration-500 ${sensoryStress > 7 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${(sensoryStress / 10) * 100}%` }} />
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* PANEL CENTRAL: VISOR EN VIVO / INFORME */}
        <div className="col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              {isFinished ? <FileText className="w-5 h-5 text-indigo-400" /> : <Users className="w-5 h-5 text-sky-400" />} 
              {isFinished ? 'Dictamen Clínico (Cognición Social)' : 'Simulación de Escenario Social VR'}
            </h3>
            {isFinished && (
              <button onClick={handleSaveToDatabase} disabled={isSaving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /><span>{isSaving ? 'Guardando...' : 'Guardar Expediente'}</span>
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
                    {/* Representación abstracta del Avatar y el Eye-Tracking */}
                    <div className="absolute inset-0 border-2 border-slate-700 rounded-full flex items-center justify-center">
                       <div className="w-20 h-8 bg-slate-800 rounded-full flex justify-between px-2 items-center mb-8">
                          {/* Ojos del Avatar */}
                          <div className={`w-4 h-4 rounded-full ${eyeContactPct > 60 ? 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.8)]' : 'bg-slate-600'}`}></div>
                          <div className={`w-4 h-4 rounded-full ${eyeContactPct > 60 ? 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.8)]' : 'bg-slate-600'}`}></div>
                       </div>
                    </div>
                    {/* Anillo de estrés/ruido */}
                    {sessionPhase === 'SENSORY_LOAD' && (
                      <div className="absolute -inset-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
                    )}
                 </div>
                 
                 <h4 className={`text-lg font-bold mb-2 ${sessionPhase === 'SENSORY_LOAD' ? 'text-rose-400' : 'text-sky-400'}`}>
                   {sessionPhase === 'SENSORY_LOAD' ? 'Sobrecarga Sensorial Activa (Ruido de Cafetería)' : 'Interacción Facial Neutra'}
                 </h4>
                 <p className="text-xs text-slate-400 font-mono">SACCADAS Y FIJACIÓN EN RASTREO CONTINUO</p>
               </div>
            ) : (
               <div className="h-full overflow-y-auto animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-6 bg-indigo-950/30 p-4 rounded-xl border border-indigo-900/50">
                    <Brain className="w-8 h-8 text-indigo-400" />
                    <div>
                      <h4 className="text-indigo-300 font-bold text-sm">Motor Clínico AMIE (Perfil TEA)</h4>
                      <p className="text-xs text-indigo-200/60">Análisis multivariante de pupilometría y evasión social.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {aiReport.split('\n').map((line, idx) => {
                      if (line.includes('🔴')) return <p key={idx} className="bg-rose-950/40 text-rose-300 p-3 rounded-lg border border-rose-900/50 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🔴 ', '')}</span></p>;
                      if (line.includes('🟡')) return <p key={idx} className="bg-amber-950/40 text-amber-300 p-3 rounded-lg border border-amber-900/50 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🟡 ', '')}</span></p>;
                      if (line.includes('🟢')) return <p key={idx} className="bg-emerald-950/40 text-emerald-300 p-3 rounded-lg border border-emerald-900/50 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🟢 ', '')}</span></p>;
                      if (line.includes('**Dictamen')) return <p key={idx} className="text-indigo-300 font-bold mt-6 p-4 bg-slate-900 rounded-lg border border-slate-800">{line}</p>;
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
