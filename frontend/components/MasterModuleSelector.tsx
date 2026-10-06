import React, { useState } from 'react';
import { Brain, Eye, Activity, HeartPulse, Zap, Fingerprint, ChevronRight, Users } from 'lucide-react';
import { PatientRecord } from '../types';
import { VrExecutiveFunctionModule } from './VrExecutiveFunctionModule';
import { VrClosedLoopHypnosisModule } from './VrClosedLoopHypnosisModule';
import { VrExposureTherapyModule } from './VrExposureTherapyModule';
import { VrSocialCognitionModule } from './VrSocialCognitionModule'; // <-- NUEVA IMPORTACIÓN

interface Props {
  patient: PatientRecord;
  onClosePatient: () => void;
}

export const MasterModuleSelector: React.FC<Props> = ({ patient, onClosePatient }) => {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  // Diccionario de Configuración Dinámica de Módulos
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
      ready: true // <-- ¡AHORA ESTÁ ACTIVO EL DE TEA!
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
      ready: false
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
      ready: false
    }
  ];

  // Enrutadores Dinámicos: Carga la consola específica según el módulo seleccionado
  if (activeModule === 'TDAH_EXECUTIVE') {
    return <VrExecutiveFunctionModule patient={patient} onClose={() => setActiveModule(null)} />;
  }

  if (activeModule === 'TEA_SOCIAL') {
    return <VrSocialCognitionModule patient={patient} onClose={() => setActiveModule(null)} />; // <-- ENRUTADOR AÑADIDO
  }

  if (activeModule === 'NEURO_HYPNOSIS') {
    return <VrClosedLoopHypnosisModule patient={patient} onClose={() => setActiveModule(null)} />;
  }

  if (activeModule === 'TAG_ANXIETY') {
    return <VrExposureTherapyModule patient={patient} onClose={() => setActiveModule(null)} />;
  }

  // Placeholder para los módulos que construiremos después
  if (activeModule) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-slate-200">
         <Brain className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
         <h2 className="text-2xl font-bold text-white mb-2">Módulo en Construcción</h2>
         <p className="text-slate-400 mb-6">La arquitectura WSS está lista. Faltan las interfaces y entornos 3D de esta especialidad.</p>
         <button onClick={() => setActiveModule(null)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition">Volver al Selector</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col font-sans text-slate-200 overflow-y-auto">
      {/* Cabecera */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Motor Clínico AMIE • Selección de Protocolo</h1>
          <p className="text-sm text-slate-400 mt-1">Expediente Activo: <strong className="text-sky-400">{patient?.id || 'PAC-8104'}</strong></p>
        </div>
        <button onClick={onClosePatient} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition cursor-pointer">
          Cerrar Expediente
        </button>
      </div>

      {/* Cuadrícula de Módulos (Holodeck Control) */}
      <div className="p-8 max-w-6xl mx-auto w-full">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Módulos Diagnósticos y Terapéuticos VR</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(mod => (
            <div 
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`group relative p-6 rounded-2xl border ${mod.color} cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 overflow-hidden flex flex-col h-full`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
                  {mod.icon}
                </div>
                {!mod.ready && (
                  <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-500 rounded-full">
                    Diseñando...
                  </span>
                )}
                {mod.ready && (
                  <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-[10px] font-bold text-emerald-400 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Activo
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-100 mb-2">{mod.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed flex-1">{mod.desc}</p>
              
              <div className="mt-6 flex items-center text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                <span>Cargar Entorno y Sensores</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Explicación de la Arquitectura Optimizada */}
        <div className="mt-8 p-6 bg-sky-950/20 border border-sky-900/30 rounded-2xl flex items-start gap-4">
           <Users className="w-6 h-6 text-sky-400 shrink-0 mt-1" />
           <div>
             <h4 className="text-sky-300 font-bold mb-1">Carga Selectiva de Sensores (Regla del 90%)</h4>
             <p className="text-sm text-sky-200/70 leading-relaxed">
               Para evitar la cinetosis y asegurar latencia cero, el entorno (Holodeck) permanecerá en reposo hasta que selecciones un módulo. El servidor enviará un paquete JSON al visor Meta Quest 3S activando <strong>únicamente</strong> los sensores requeridos por el protocolo clínico seleccionado.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};
