import React, { useState } from 'react';
import { 
  Brain, Eye, Activity, HeartPulse, Zap, Fingerprint, ShieldAlert, 
  Lightbulb, UserCheck, RotateCcw, Tent, HeartHandshake 
} from 'lucide-react';
import { PatientRecord } from '../types';

// IMPORTACIONES DE MÓDULOS BASE
import { VrExecutiveFunctionModule } from './VrExecutiveFunctionModule';
import { VrClosedLoopHypnosisModule } from './VrClosedLoopHypnosisModule';
import { VrExposureTherapyModule } from './VrExposureTherapyModule';
import { VrSocialCognitionModule } from './VrSocialCognitionModule';
import { VrDepressionModule } from './VrDepressionModule';
import { VrCognitiveDeclineModule } from './VrCognitiveDeclineModule';
import { PsychopathyNarcissismModule } from './PsychopathyNarcissismModule';
import { VrGammaInsightModule } from './VrGammaInsightModule';

// IMPORTACIONES DE LOS NUEVOS MÓDULOS
import { VrFunctionalNeurologyModule } from './VrFunctionalNeurologyModule';
import { VrMemoryReconsolidationModule } from './VrMemoryReconsolidationModule';
import { VrDevelopmentalTraumaFullscreenMonitor } from './VrDevelopmentalTraumaFullscreenMonitor';
import { VrReactiveDesireModule } from './VrReactiveDesireModule';

interface Props {
  patient: PatientRecord;
  onClosePatient: () => void;
}

export const MasterModuleSelector: React.FC<Props> = ({ patient, onClosePatient }) => {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const modules = [
    {
      id: 'TDAH_EXECUTIVE',
      title: 'Función Ejecutiva (TDAH)',
      desc: 'Evaluación CPT Go/No-Go, inhibición motora y atención sostenida.',
      icon: <Brain className="w-6 h-6 text-sky-400" />,
      color: 'border-sky-500/30 bg-sky-900/20 hover:bg-sky-900/40',
      ready: true
    },
    {
      id: 'TEA_SOCIAL',
      title: 'Cognición Social (TEA)',
      desc: 'Pupilometría, contacto visual y tolerancia a sobrecarga sensorial.',
      icon: <Eye className="w-6 h-6 text-indigo-400" />,
      color: 'border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-900/40',
      ready: true
    },
    {
      id: 'NEURO_HYPNOSIS',
      title: 'Neurohipnosis y Dolor',
      desc: 'Inducción de trance, modulación vagotónica y analgesia VR.',
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/40',
      ready: true 
    },
    {
      id: 'TDM_DEPRESSION',
      title: 'Depresión Mayor (TDM)',
      desc: 'Latencia biomotora, aplanamiento afectivo y retardo psicomotor.',
      icon: <Activity className="w-6 h-6 text-slate-400" />,
      color: 'border-slate-500/30 bg-slate-900/20 hover:bg-slate-900/40',
      ready: true
    },
    {
      id: 'TAG_ANXIETY',
      title: 'Reactividad (TAG/TLP/Adicción)',
      desc: 'Biofeedback GSR/HRV, reactividad amigdalina y exposición VRET.',
      icon: <HeartPulse className="w-6 h-6 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-900/20 hover:bg-rose-900/40',
      ready: true 
    },
    {
      id: 'NEURO_DEGEN',
      title: 'Deterioro Cognitivo',
      desc: 'Navegación espacial, memoria de trabajo y cinemática de temblor.',
      icon: <Fingerprint className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-900/20 hover:bg-amber-900/40',
      ready: true
    },
    {
      id: 'CLUSTER_B_FORENSIC',
      title: 'Perfilado Forense (Cluster B)',
      desc: 'Medida TriPM, Narcisismo y ensayos de provocación (Requiere Consentimiento).',
      icon: <ShieldAlert className="w-6 h-6 text-rose-500" />,
      color: 'border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/50',
      ready: true
    },
    {
      id: 'GAMMA_INSIGHT',
      title: 'Opto-Neuromodulación',
      desc: 'Estimulación Gamma/Alpha/Theta para Alzheimer, Depresión y más.',
      icon: <Lightbulb className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/50',
      ready: true 
    },
    {
      id: 'FND_MIRROR',
      title: 'Neurología Funcional (FND)',
      desc: 'Terapia de Espejo VR, desbloqueo premotor y parálisis conversiva.',
      icon: <UserCheck className="w-6 h-6 text-cyan-400" />,
      color: 'border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/50',
      ready: true
    },
    {
      id: 'EMDR_MEMORY',
      title: 'Memoria y Fobias (EMDR)',
      desc: 'Desensibilización ocular, ecosistemas seguros y reconsolidación.',
      icon: <RotateCcw className="w-6 h-6 text-violet-400" />,
      color: 'border-violet-500/50 bg-violet-950/40 hover:bg-violet-900/50',
      ready: true
    },
    {
      id: 'DEV_TRAUMA',
      title: 'Trauma Evolutivo (AIMA)',
      desc: 'Regulación del apego, entornos uterinos/seguros y neurorecepción.',
      icon: <Tent className="w-6 h-6 text-pink-400" />,
      color: 'border-pink-500/50 bg-pink-950/40 hover:bg-pink-900/50',
      ready: true
    },
    {
      id: 'REACTIVE_DESIRE',
      title: 'Terapia de Pareja',
      desc: 'Deseo reactivo, modelo de control dual y biofeedback HRV en pareja.',
      icon: <HeartHandshake className="w-6 h-6 text-rose-300" />,
      color: 'border-rose-400/50 bg-rose-950/40 hover:bg-rose-900/50',
      ready: true
    }
  ];

  // ENRUTADOR DINÁMICO
  if (activeModule === 'TDAH_EXECUTIVE') return <VrExecutiveFunctionModule patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'TEA_SOCIAL') return <VrSocialCognitionModule patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'NEURO_HYPNOSIS') return <VrClosedLoopHypnosisModule patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'TAG_ANXIETY') return <VrExposureTherapyModule patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'TDM_DEPRESSION') return <VrDepressionModule patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'NEURO_DEGEN') return <VrCognitiveDeclineModule patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'CLUSTER_B_FORENSIC') return <PsychopathyNarcissismModule patient={patient} onUpdatePatientVrData={() => {}} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'GAMMA_INSIGHT') return <VrGammaInsightModule patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'FND_MIRROR') return <VrFunctionalNeurologyModule patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'EMDR_MEMORY') return <VrMemoryReconsolidationModule patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'DEV_TRAUMA') return <VrDevelopmentalTraumaFullscreenMonitor patient={patient} onClose={() => setActiveModule(null)} />;
  if (activeModule === 'REACTIVE_DESIRE') return <VrReactiveDesireModule patient={patient} onClose={() => setActiveModule(null)} />;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col font-sans text-slate-200 overflow-y-auto">
      {/* Cabecera */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Motor Clínico AMIE • Selección de Protocolo</h1>
          <p className="text-sm text-slate-400 mt-1">Expediente Activo: <strong className="text-sky-400">{patient?.id || 'PAC-8104'}</strong></p>
        </div>
        <button onClick={onClosePatient} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-lg">
          Cerrar Expediente
        </button>
      </div>

      {/* Cuadrícula de Módulos (Ahora son 12, se acoplan perfecto en 3 filas de 4 columnas) */}
      <div className="p-8 max-w-7xl mx-auto w-full">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Brain className="w-5 h-5 text-slate-400" />
          Módulos Diagnósticos y Terapéuticos VR
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map(mod => (
            <div 
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`group relative p-6 rounded-2xl border ${mod.color} cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 overflow-hidden flex flex-col h-full`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 shadow-inner">
                  {mod.icon}
                </div>
                <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-[10px] font-bold text-emerald-400 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Activo
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2 leading-tight">{mod.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed flex-1">{mod.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
