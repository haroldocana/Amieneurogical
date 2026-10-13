import React, { useState } from 'react';
import { 
  Brain, 
  Eye, 
  Activity, 
  HeartPulse, 
  Zap, 
  Fingerprint, 
  ShieldAlert, 
  Lightbulb, 
  UserCheck, 
  RotateCcw, 
  Tent, 
  HeartHandshake 
} from 'lucide-react';
import { PatientRecord } from '../types';
import { VrModuleRouter } from './VrModuleRouter';

interface Props {
  patient: PatientRecord;
  onClosePatient: () => void;
}

export interface ProtocolModuleConfig {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  ready: boolean;
  category: 'NEURODESARROLLO' | 'AFECTIVO' | 'NEUROMODULACION' | 'FORENSE_ESPECIALIZADO';
}

export const MasterModuleSelector: React.FC<Props> = ({ patient, onClosePatient }) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = p?.patientNameAnonymized || `Paciente ID: ${patientId}`;

  const modules: ProtocolModuleConfig[] = [
    {
      id: 'TDAH_EXECUTIVE',
      title: 'Función Ejecutiva (TDAH)',
      desc: 'Evaluación CPT Go/No-Go, inhibición motora y atención sostenida.',
      icon: <Brain className="w-6 h-6 text-sky-400" />,
      color: 'border-sky-500/30 bg-sky-900/20 hover:bg-sky-900/40 focus:ring-sky-500/50',
      ready: true,
      category: 'NEURODESARROLLO'
    },
    {
      id: 'TEA_SOCIAL',
      title: 'Cognición Social (TEA)',
      desc: 'Pupilometría, contacto visual y tolerancia a sobrecarga sensorial.',
      icon: <Eye className="w-6 h-6 text-indigo-400" />,
      color: 'border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-900/40 focus:ring-indigo-500/50',
      ready: true,
      category: 'NEURODESARROLLO'
    },
    {
      id: 'NEURO_HYPNOSIS',
      title: 'Neurohipnosis y Dolor',
      desc: 'Inducción de trance, modulación vagotónica y analgesia VR.',
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/40 focus:ring-purple-500/50',
      ready: true,
      category: 'NEUROMODULACION'
    },
    {
      id: 'TDM_DEPRESSION',
      title: 'Depresión Mayor (TDM)',
      desc: 'Latencia biomotora, aplanamiento afectivo y retardo psicomotor.',
      icon: <Activity className="w-6 h-6 text-slate-400" />,
      color: 'border-slate-500/30 bg-slate-900/20 hover:bg-slate-900/40 focus:ring-slate-500/50',
      ready: true,
      category: 'AFECTIVO'
    },
    {
      id: 'TAG_ANXIETY',
      title: 'Reactividad (TAG/TLP/Adicción)',
      desc: 'Biofeedback GSR/HRV, reactividad amigdalina y exposición VRET.',
      icon: <HeartPulse className="w-6 h-6 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-900/20 hover:bg-rose-900/40 focus:ring-rose-500/50',
      ready: true,
      category: 'AFECTIVO'
    },
    {
      id: 'NEURO_DEGEN',
      title: 'Deterioro Cognitivo',
      desc: 'Navegación espacial, memoria de trabajo y cinemática de temblor.',
      icon: <Fingerprint className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-900/20 hover:bg-amber-900/40 focus:ring-amber-500/50',
      ready: true,
      category: 'NEUROMODULACION'
    },
    {
      id: 'CLUSTER_B_FORENSIC',
      title: 'Perfilado Forense (Cluster B)',
      desc: 'Medida TriPM, Narcisismo y ensayos de provocación (Requiere Consentimiento).',
      icon: <ShieldAlert className="w-6 h-6 text-rose-500" />,
      color: 'border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/50 focus:ring-rose-500/50',
      ready: true,
      category: 'FORENSE_ESPECIALIZADO'
    },
    {
      id: 'GAMMA_INSIGHT',
      title: 'Opto-Neuromodulación',
      desc: 'Estimulación Gamma/Alpha/Theta para Alzheimer, Depresión y más.',
      icon: <Lightbulb className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/50 focus:ring-amber-500/50',
      ready: true,
      category: 'NEUROMODULACION'
    },
    {
      id: 'FND_MIRROR',
      title: 'Neurología Funcional (FND)',
      desc: 'Terapia de Espejo VR, desbloqueo premotor y parálisis conversiva.',
      icon: <UserCheck className="w-6 h-6 text-cyan-400" />,
      color: 'border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/50 focus:ring-cyan-500/50',
      ready: true,
      category: 'NEUROMODULACION'
    },
    {
      id: 'EMDR_MEMORY',
      title: 'Memoria y Fobias (EMDR)',
      desc: 'Desensibilización ocular, ecosistemas seguros y reconsolidación.',
      icon: <RotateCcw className="w-6 h-6 text-violet-400" />,
      color: 'border-violet-500/50 bg-violet-950/40 hover:bg-violet-900/50 focus:ring-violet-500/50',
      ready: true,
      category: 'AFECTIVO'
    },
    {
      id: 'DEV_TRAUMA',
      title: 'Trauma Evolutivo (AIMA)',
      desc: 'Regulación del apego, entornos uterinos/seguros y neurorecepción.',
      icon: <Tent className="w-6 h-6 text-pink-400" />,
      color: 'border-pink-500/50 bg-pink-950/40 hover:bg-pink-900/50 focus:ring-pink-500/50',
      ready: true,
      category: 'AFECTIVO'
    },
    {
      id: 'DUAL_CONTROL_SES_SIS',
      title: 'Control Dual (SES / SIS)',
      desc: 'Modelo Bancroft & Nagoski: Acelerador vs. Freno en terapia individual y de pareja.',
      icon: <HeartHandshake className="w-6 h-6 text-rose-400" />,
      color: 'border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/50 focus:ring-rose-500/50',
      ready: true,
      category: 'AFECTIVO'
    }
  ];

  // Enrutador dinámico unificado a través de VrModuleRouter
  if (activeModuleId) {
    return (
      <VrModuleRouter 
        patient={patient} 
        onClose={() => setActiveModuleId(null)} 
        initialModuleId={activeModuleId} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col font-sans text-slate-200 overflow-y-auto">
      {/* Cabecera Principal */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Motor Clínico AMIE • Selección de Protocolo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Expediente Activo:{' '}
            <strong className="text-sky-400 font-mono">
              {patientDisplayName} ({patientId})
            </strong>
          </p>
        </div>

        <button 
          type="button"
          onClick={onClosePatient} 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-lg active:scale-95 border border-slate-700/80"
        >
          Cerrar Expediente
        </button>
      </div>

      {/* Cuadrícula de Módulos */}
      <div className="p-8 max-w-7xl mx-auto w-full">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Brain className="w-5 h-5 text-slate-400" />
          Módulos Diagnósticos y Terapéuticos VR (Pico 3 Pro WebXR)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveModuleId(mod.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveModuleId(mod.id);
                }
              }}
              className={`group relative p-6 rounded-2xl border ${mod.color} cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 focus:outline-none focus:ring-2 overflow-hidden flex flex-col h-full text-left`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 shadow-inner">
                  {mod.icon}
                </div>
                <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-[10px] font-bold text-emerald-400 rounded-full flex items-center gap-1.5 backdrop-blur-sm font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Activo
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2 leading-tight group-hover:text-white transition-colors">
                {mod.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed flex-1">
                {mod.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MasterModuleSelector;
