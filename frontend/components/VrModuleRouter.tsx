import React, { useState } from 'react';
import { Monitor, Glasses, ArrowRight, X } from 'lucide-react';
import { PatientRecord } from '../types';
import { VrExecutiveFunctionModule } from './VrExecutiveFunctionModule';
import { VrPatientExperience } from './VrPatientExperience';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrModuleRouter: React.FC<Props> = ({ patient, onClose }) => {
  const [activeRole, setActiveRole] = useState<'NONE' | 'DOCTOR' | 'PATIENT'>('NONE');

  if (activeRole === 'DOCTOR') {
    return <VrExecutiveFunctionModule patient={patient} onClose={() => setActiveRole('NONE')} />;
  }

  if (activeRole === 'PATIENT') {
    return <VrPatientExperience patientId={patient?.id} onClose={() => setActiveRole('NONE')} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 flex items-center justify-center font-sans">
      <div className="bg-slate-950 border border-slate-800 text-white max-w-3xl w-full rounded-3xl p-8 space-y-8 shadow-2xl relative">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <span className="px-3 py-1 bg-sky-950 text-sky-400 border border-sky-800/50 rounded-full text-xs font-mono font-bold uppercase">
            Selección de Entorno VR
          </span>
          <h2 className="text-2xl font-black text-white">¿Qué rol desempeñará este dispositivo?</h2>
          <p className="text-xs text-slate-400">Paciente asignado: <strong className="text-slate-200">{patient?.id || 'PAC-8104'}</strong></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* OPCIÓN 1: COMPUTADORA DEL MÉDICO */}
          <div 
            onClick={() => setActiveRole('DOCTOR')}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-6 rounded-2xl cursor-pointer transition group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="p-4 bg-sky-950 text-sky-400 border border-sky-800/40 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Monitor className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-300">1. Consola del Profesional</h3>
                <p className="text-xs text-slate-400 mt-1">Abrir en la computadora o Workstation del médico para monitorear telemetría, gráficas y exportar reportes.</p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-sky-400 gap-2">
              <span>Abrir Monitor</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* OPCIÓN 2: VISOR META QUEST */}
          <div 
            onClick={() => setActiveRole('PATIENT')}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Glasses className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300">2. Visor del Paciente</h3>
                <p className="text-xs text-slate-400 mt-1">Abrir en el navegador web del Meta Quest 3S. Muestra la prueba interactiva y emite la señal biométrica.</p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-400 gap-2">
              <span>Iniciar Visor</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
