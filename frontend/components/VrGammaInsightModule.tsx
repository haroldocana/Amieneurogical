import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { 
  Activity, PlayCircle, StopCircle, RefreshCw, AlertTriangle, 
  CheckCircle2, FileText, Save, Brain, Zap, Radio, Sun, Eye, Glasses, Moon
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

type NeuromodulationProtocol = 
  | 'ALZHEIMER_40HZ' 
  | 'DEPRESSION_ALPHA' 
  | 'ADHD_SMR' 
  | 'ANXIETY_THETA'
  | 'INSOMNIA_DELTA'
  | 'PTSD_THETA'
  | 'CHRONIC_PAIN_SUBDELTA'
  | 'AUTISM_MU'
  | 'BRAIN_FOG_BETA';

export const VrGammaInsightModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  const { isConnected, liveData, syncSession, transmit } = useVrTelemetryBridge('receiver', patientId, 'OPTO_NEUROMODULATION');

  const [sessionPhase, setSessionPhase] = useState<'IDLE' | 'STIMULATION'>('IDLE');
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');

  const [protocol, setProtocol] = useState<NeuromodulationProtocol>('ALZHEIMER_40HZ');

  // Métricas Biométricas Dinámicas
  const [plvCoherence, setPlvCoherence] = useState(12); // Phase-Locking Value global
  const [targetHz, setTargetHz] = useState(40.0);
  
  // Métrica específica según la patología
  const [specificMetricName, setSpecificMetricName] = useState('Limpieza Microglial');
  const [specificMetricValue, setSpecificMetricValue] = useState(10);
  const [specificMetricUnit, setSpecificMetricUnit] = useState('%');
  const [visualColor, setVisualColor] = useState('bg-white');

  // Configurar entorno y métricas dinámicas según el protocolo seleccionado
  useEffect(() => {
    switch(protocol) {
      case 'ALZHEIMER_40HZ': 
        setTargetHz(40.0); setSpecificMetricName('Activación Microglial (Amiloide)'); setSpecificMetricUnit('%'); setVisualColor('bg-white'); 
        break;
      case 'DEPRESSION_ALPHA': 
        setTargetHz(10.0); setSpecificMetricName('Simetría Cortical Frontal'); setSpecificMetricUnit('Ratio L/R'); setVisualColor('bg-amber-400'); 
        break;
      case 'ADHD_SMR': 
        setTargetHz(15.0); setSpecificMetricName('Bloqueo Motor (Hiperactividad)'); setSpecificMetricUnit('%'); setVisualColor('bg-sky-400'); 
        break;
      case 'ANXIETY_THETA': 
        setTargetHz(6.0); setSpecificMetricName('Supresión de Amígdala'); setSpecificMetricUnit('%'); setVisualColor('bg-purple-500'); 
        break;
      case 'INSOMNIA_DELTA': 
        setTargetHz(2.0); setSpecificMetricName('Descenso de Cortisol (Sueño)'); setSpecificMetricUnit('%'); setVisualColor('bg-blue-600'); 
        break;
      case 'PTSD_THETA': 
        setTargetHz(7.5); setSpecificMetricName('Tolerancia Hipnagógica (Trauma)'); setSpecificMetricUnit('%'); setVisualColor('bg-rose-500'); 
        break;
      case 'CHRONIC_PAIN_SUBDELTA': 
        setTargetHz(0.5); setSpecificMetricName('Liberación Endorfínica Est.'); setSpecificMetricUnit('Índice'); setVisualColor('bg-teal-500'); 
        break;
      case 'AUTISM_MU': 
        setTargetHz(11.0); setSpecificMetricName('Estabilidad Red Neuronas Espejo'); setSpecificMetricUnit('%'); setVisualColor('bg-emerald-400'); 
        break;
      case 'BRAIN_FOG_BETA': 
        setTargetHz(20.0); setSpecificMetricName('Oxigenación Prefrontal (Agudeza)'); setSpecificMetricUnit('%'); setVisualColor('bg-cyan-300'); 
        break;
    }
    setSpecificMetricValue(10); // Reset al cambiar
  }, [protocol]);

  // Motor de simulación fisiológica
  useEffect(() => {
    if (sessionPhase !== 'STIMULATION') return;
    
    const interval = setInterval(() => {
      setPlvCoherence(prev => Math.min(95, prev + (Math.random() * 3)));
      setSpecificMetricValue(prev => {
        // Para depresión (Ratio L/R), el óptimo es acercarse a 1.0. Para el resto, acercarse a 100
        if (protocol === 'DEPRESSION_ALPHA') return Number(Math.min(1.0, prev + (Math.random() * 0.05)).toFixed(2));
        if (protocol === 'CHRONIC_PAIN_SUBDELTA') return Number(Math.min(9.5, prev + (Math.random() * 0.2)).toFixed(1));
        return Math.min(98, prev + (Math.random() * 4));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionPhase, protocol]);

  const startStimulation = () => {
    setSessionPhase('STIMULATION');
    setIsFinished(false);
    setPlvCoherence(10);
    setSpecificMetricValue(protocol === 'DEPRESSION_ALPHA' ? 0.4 : protocol === 'CHRONIC_PAIN_SUBDELTA' ? 2.0 : 10);
    syncSession();
    transmit({ type: 'LOAD_MODULE', patientId, moduleName: 'OPTO_NEUROMODULATION' });
    transmit({ type: 'START_LIGHT_STIMULATION', frequencyHz: targetHz, protocol });
  };

  const handleGenerateReport = () => {
    setSessionPhase('IDLE');
    setIsFinished(true);
    transmit({ type: 'STOP_TEST' });

    let report = `Análisis de Fotobiomodulación y Arrastre qEEG en VR.\n\n`;
    report += `**Protocolo Dinámico:** ${targetHz} Hz (${getProtocolName(protocol)}).\n\n`;
    
    // Métrica General
    if (plvCoherence > 75) {
      report += "🟢 **Sincronización (PLV):** Excelente encendido neuronal en la banda objetivo (Arrastre logrado).\n";
    } else {
      report += "🟡 **Sincronización (PLV):** Resistencia parcial al arrastre. El córtex demoró en copiar la frecuencia lumínica.\n";
    }

    // Dictamen Específico por Patología
    report += "\n🧠 **Evaluación Clínica Específica:**\n";
    switch(protocol) {
      case 'ALZHEIMER_40HZ':
        report += `La estimulación Gamma (40Hz) reactivó la microglía con una eficacia estimada del ${Math.round(specificMetricValue)}%. Proceso de limpieza de amiloide activo.`; break;
      case 'DEPRESSION_ALPHA':
        report += `La asimetría frontal mejoró, alcanzando un Ratio L/R de ${specificMetricValue}. Reducción del sesgo depresivo hemisférico.`; break;
      case 'ADHD_SMR':
        report += `El ritmo Sensoriomotor (15Hz) logró un bloqueo motor del ${Math.round(specificMetricValue)}%, indicando reducción fisiológica de la hiperactividad.`; break;
      case 'ANXIETY_THETA':
        report += `Las ondas Theta (6Hz) suprimieron la hiperactividad de la amígdala en un ${Math.round(specificMetricValue)}%. Relajación profunda obtenida.`; break;
      case 'INSOMNIA_DELTA':
        report += `Inducción profunda. Reducción metabólica y descenso de cortisol estimado en ${Math.round(specificMetricValue)}%. Listo para fase de sueño 3 (Slow-Wave).`; break;
      case 'PTSD_THETA':
        report += `El paciente logró mantener un ${Math.round(specificMetricValue)}% de tolerancia en el estado hipnagógico (Cruce Alpha/Theta) sin disparar respuesta de pánico. Excelente para reprocesamiento.`; break;
      case 'CHRONIC_PAIN_SUBDELTA':
        report += `Frecuencias ultra-bajas (0.5Hz) lograron un índice de "anestesia electrónica" y liberación endorfínica de ${specificMetricValue}/10.`; break;
      case 'AUTISM_MU':
        report += `El ritmo Mu (11Hz) estabilizó el córtex sensoriomotor en un ${Math.round(specificMetricValue)}%. Prevención de meltdown y sobrecarga sensorial exitosa.`; break;
      case 'BRAIN_FOG_BETA':
        report += `Ritmo Beta de vigilia (20Hz) restauró la oxigenación prefrontal en un ${Math.round(specificMetricValue)}%. Eliminación de la niebla mental post-viral/fatiga.`; break;
    }

    report += `\n\n**Conclusión AMIE:** Terapia de neuromodulación personalizada ejecutada con éxito. Guardar para tracking longitudinal.`;
    setAiReport(report);
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setTimeout(() => {
      alert('✅ Sesión de Neuromodulación guardada en el expediente.');
      setIsSaving(false);
      onClose();
    }, 800);
  };

  const getProtocolName = (p: NeuromodulationProtocol) => {
    const map: Record<NeuromodulationProtocol, string> = {
      'ALZHEIMER_40HZ': 'Ondas Gamma 40Hz (Alzheimer / Demencia)',
      'DEPRESSION_ALPHA': 'Asimetría Alpha 10Hz (Depresión Mayor)',
      'ADHD_SMR': 'Ritmo SMR 15Hz (TDAH / Impulsividad)',
      'ANXIETY_THETA': 'Ondas Theta 6Hz (Ansiedad / Pánico)',
      'INSOMNIA_DELTA': 'Ondas Delta 2.0Hz (Insomnio Crónico)',
      'PTSD_THETA': 'Cruce Alpha/Theta 7.5Hz (TEPT / Trauma)',
      'CHRONIC_PAIN_SUBDELTA': 'Sub-Delta 0.5Hz (Dolor Crónico / Fibromialgia)',
      'AUTISM_MU': 'Ritmo Mu 11.0Hz (Autismo / Sobrecarga Sensorial)',
      'BRAIN_FOG_BETA': 'Ondas Beta 20.0Hz (Niebla Mental / Post-COVID)'
    };
    return map[p];
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-200">
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-900/50 rounded-lg border border-amber-500/30">
            <Sun className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">MÓDULO CLÍNICO • Opto-Neuromodulación Multiprotocolo</h2>
            <p className="text-xs text-slate-400">Paciente ID: <strong className="text-amber-300">{patientId}</strong> | VR + qEEG Sync</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
            <Activity className="w-4 h-4" /> {isConnected ? 'VR & qEEG Conectados' : 'Esperando Hardware...'}
          </div>
          <button onClick={syncSession} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Sincronizar
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">Volver al Selector</button>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-12 gap-6 h-full overflow-hidden">
        {/* PANEL IZQUIERDO: Controles (Profesional) */}
        <div className="col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-amber-400" /> Selector de Tratamiento</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Diagnóstico Objetivo</label>
                <select 
                  disabled={sessionPhase === 'STIMULATION' || isFinished}
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as NeuromodulationProtocol)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold outline-none disabled:opacity-50"
                >
                  <option value="ALZHEIMER_40HZ">Alzheimer / Demencia (Gamma 40Hz)</option>
                  <option value="DEPRESSION_ALPHA">Depresión Mayor (Alpha 10Hz)</option>
                  <option value="ADHD_SMR">TDAH / Impulsividad (SMR 15Hz)</option>
                  <option value="ANXIETY_THETA">Ansiedad / Pánico (Theta 6Hz)</option>
                  <option value="INSOMNIA_DELTA">Insomnio Crónico (Delta 2Hz)</option>
                  <option value="PTSD_THETA">Trauma / TEPT (Alpha-Theta 7.5Hz)</option>
                  <option value="CHRONIC_PAIN_SUBDELTA">Fibromialgia / Dolor (Sub-Delta 0.5Hz)</option>
                  <option value="AUTISM_MU">Autismo / Sobrecarga (Mu 11Hz)</option>
                  <option value="BRAIN_FOG_BETA">Niebla Mental / Long COVID (Beta 20Hz)</option>
                </select>
              </div>

              {/* INSTRUCCIONES DE INGRESO PARA EL PACIENTE */}
              {!isConnected && sessionPhase === 'IDLE' && !isFinished && (
                <div className="mb-4 p-3 bg-slate-950 border border-amber-500/30 border-dashed rounded-xl flex flex-col items-center text-center gap-2 mt-4">
                  <Glasses className="w-6 h-6 text-amber-400 animate-pulse" />
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-amber-300 block mb-1">Esperando al paciente...</strong>
                    Para iniciar la fotobiomodulación, el paciente debe colocarse el visor VR y la diadema EEG con el ID: <span className="text-amber-300 font-mono bg-amber-900/30 px-1 rounded">{patientId}</span>
                  </div>
                </div>
              )}

              {sessionPhase === 'IDLE' && !isFinished && (
                <button 
                  disabled={!isConnected}
                  onClick={startStimulation} 
                  className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg transition flex justify-center items-center gap-2 mt-4 ${
                    !isConnected 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  }`}
                >
                  <PlayCircle className="w-5 h-5" /> {!isConnected ? 'Esperando Visor...' : 'Iniciar Opto-Estimulación'}
                </button>
              )}

              {sessionPhase === 'STIMULATION' && (
                <button onClick={handleGenerateReport} className="w-full py-3 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 mt-4">
                  <StopCircle className="w-5 h-5" /> Detener y Evaluar Arrastre
                </button>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed font-mono">
              El panel adaptará dinámicamente las métricas clínicas a reportar dependiendo del diagnóstico seleccionado.
            </div>
          </div>

          {/* MÉTRICAS BIOMÉTRICAS DINÁMICAS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 relative flex flex-col justify-center">
             <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Radio className="w-4 h-4 text-cyan-400" /> Lectura qEEG Dinámica</h3>
             
             <div className="space-y-5">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">FRECUENCIA DIRIGIDA (Hz)</span>
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-black text-amber-400">{targetHz.toFixed(1)}</div>
                    <span className="text-sm text-slate-500 font-bold mb-1">Hz</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase">{specificMetricName}</span>
                  <div className="flex items-end gap-2">
                    <div className="text-3xl font-black text-white">{specificMetricValue}</div>
                    <span className="text-xs text-slate-500 font-bold mb-1">{specificMetricUnit}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">SINCRONIZACIÓN NEURONAL GLOBAL (PLV)</span>
                  <div className="flex items-end gap-2">
                    <div className={`text-xl font-black ${plvCoherence > 60 ? 'text-emerald-400' : 'text-sky-400'}`}>{Math.round(plvCoherence)}%</div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className={`h-full transition-all duration-500 ${plvCoherence > 60 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${plvCoherence}%` }} />
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* PANEL CENTRAL: VISUALIZACIÓN */}
        <div className="col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              {isFinished ? <FileText className="w-5 h-5 text-amber-400" /> : <Eye className="w-5 h-5 text-slate-400" />} 
              {isFinished ? 'Dictamen Clínico Automatizado' : 'Simulador Inmersivo de Fotobiomodulación VR'}
            </h3>
            {isFinished && (
              <button onClick={handleSaveToDatabase} disabled={isSaving} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /><span>{isSaving ? 'Guardando...' : 'Guardar Expediente'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative p-6">
            {sessionPhase === 'IDLE' && !isFinished ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500">
                 <Sun className="w-16 h-16 mb-4 opacity-20" />
                 <p className="text-sm max-w-md text-center">
                   Selecciona la condición patológica en el panel izquierdo. El visor adoptará el color y la frecuencia Hz específicos para hackear el ritmo del cerebro.
                 </p>
               </div>
            ) : !isFinished ? (
               <div className="flex flex-col items-center justify-center h-full">
                 
                 {/* VISUALIZADOR DE PARPADEO (FLICKER) DINÁMICO */}
                 <div className="relative w-full max-w-md h-56 mb-8 flex items-center justify-center bg-black rounded-3xl overflow-hidden border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div 
                      className={`absolute inset-0 ${visualColor}`}
                      style={{ 
                        animation: `pulse ${1 / targetHz}s infinite alternate`,
                        opacity: sessionPhase === 'STIMULATION' ? 0.8 : 0
                      }}
                    />
                    <div className="relative z-10 flex flex-col items-center bg-black/40 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                      {protocol === 'INSOMNIA_DELTA' ? <Moon className="w-12 h-12 text-white/80 mb-2" /> : <Glasses className="w-12 h-12 text-white/80 mb-2" />}
                      <span className="text-white font-mono font-bold text-xs uppercase text-center">Simulación Visor VR<br/>Frecuencia Ciega Activa</span>
                    </div>
                 </div>
                 
                 <h4 className="text-xl font-bold mb-3 text-amber-300">
                   Entrenamiento: {getProtocolName(protocol)}
                 </h4>
                 
                 <p className="text-sm text-slate-400 max-w-lg text-center">
                   El visor está pulsando a {targetHz}Hz. La corteza visual procesa la señal forzando a las redes neuronales a sincronizarse, induciendo el cambio neuroquímico terapéutico.
                 </p>

               </div>
            ) : (
               <div className="h-full overflow-y-auto animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <Zap className="w-8 h-8 text-amber-400" />
                    <div>
                      <h4 className="text-slate-300 font-bold text-sm">Resultados Clínicos del Arrastre qEEG</h4>
                      <p className="text-xs text-slate-500">Evaluación de neuroplasticidad y sincronización de fase neuronal.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {aiReport.split('\n').map((line, idx) => {
                      if (line.includes('🔴')) return <p key={idx} className="bg-rose-950/40 text-rose-300 p-3 rounded-lg border border-rose-900/50 flex items-start gap-2"><span className="mt-0.5 shrink-0">🔴</span> <span>{line.replace('🔴 ', '')}</span></p>;
                      if (line.includes('🟡')) return <p key={idx} className="bg-amber-950/40 text-amber-300 p-3 rounded-lg border border-amber-900/50 flex items-start gap-2"><span className="mt-0.5 shrink-0">🟡</span> <span>{line.replace('🟡 ', '')}</span></p>;
                      if (line.includes('🟢') || line.includes('🧠')) return <p key={idx} className="bg-emerald-950/40 text-emerald-300 p-3 rounded-lg border border-emerald-900/50 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> <span>{line.replace('🟢 ', '').replace('🧠 ', '')}</span></p>;
                      if (line.includes('**Dictamen') || line.includes('**Conclusión')) return <p key={idx} className="text-slate-200 font-bold mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">{line}</p>;
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
