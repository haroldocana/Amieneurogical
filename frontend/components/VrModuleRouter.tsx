import React, { useState } from 'react';
import { Monitor, Glasses, ArrowRight, X } from 'lucide-react';
import { PatientRecord } from '../types';
import { immersionMedia } from '../services/immersionMediaService';

// IMPORTACIÓN DE MÓDULOS DE CONSOLA MÉDICA
import { VrExecutiveFunctionModule } from './VrExecutiveFunctionModule';
import { VrPatientExperience } from './VrPatientExperience';
import { VrDualControlTherapyModule } from './VrDualControlTherapyModule';
import { VrDevelopmentalTraumaFullscreenMonitor } from './VrDevelopmentalTraumaFullscreenMonitor';
import { VrMemoryReconsolidationModule } from './VrMemoryReconsolidationModule';
import { PsychopathyNarcissismModule } from './PsychopathyNarcissismModule';
import { ClusterBForenseVrModule } from './ClusterBForenseVrModule';
import { VrGammaInsightModule } from './VrGammaInsightModule';
import { VrFunctionalNeurologyModule } from './VrFunctionalNeurologyModule';
import { VrPainManagementModule } from './VrPainManagementModule';
import { VrClosedLoopHypnosisModule } from './VrClosedLoopHypnosisModule';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
  initialModuleId?: string;
}

export const VrModuleRouter: React.FC<Props> = ({ patient, onClose, initialModuleId = 'TDAH_EXECUTIVE' }) => {
  const [activeRole, setActiveRole] = useState<'NONE' | 'DOCTOR' | 'PATIENT'>('NONE');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModuleId);

  // Mapeo unificado hacia las claves de assets en el servicio multimedia
  const mapModuleToAssetKey = (modId: string): string => {
    switch (modId) {
      case 'NEURO_HYPNOSIS': return 'HYPNOSIS';
      case 'DUAL_CONTROL_SES_SIS': return 'SEXUAL_HEALTH';
      case 'CLUSTER_B_FORENSIC': return 'CLUSTER_B_FORENSIC';
      case 'TDAH_EXECUTIVE': return 'TDAH_ATTENTION_LAB';
      case 'DEV_TRAUMA': return 'DEVELOPMENTAL_TRAUMA';
      case 'PAIN_MANAGEMENT': return 'PAIN_MANAGEMENT';
      case 'FND_MIRROR': return 'FUNCTIONAL_NEUROLOGY';
      case 'EMDR_MEMORY': return 'MEMORY_RECONSOLIDATION';
      default: return 'ZEN_GARDEN';
    }
  };

  const availableModules = [
    { id: 'TDAH_EXECUTIVE', title: 'Función Ejecutiva (TDAH)' },
    { id: 'DUAL_CONTROL_SES_SIS', title: 'Laboratorio Relacional y Control Dual (AMIE)' },
    { id: 'DEV_TRAUMA', title: 'Trauma Evolutivo (AIMA)' },
    { id: 'EMDR_MEMORY', title: 'Memoria y Fobias (EMDR)' },
    { id: 'CLUSTER_B_FORENSIC', title: 'Perfilado Forense (Cluster B)' },
    { id: 'GAMMA_INSIGHT', title: 'Opto-Neuromodulación Gamma' },
    { id: 'FND_MIRROR', title: 'Neurología Funcional (FND)' },
    { id: 'PAIN_MANAGEMENT', title: 'Analgesia y Dolor' },
    { id: 'NEURO_HYPNOSIS', title: 'Neurohipnosis Closed-Loop' }
  ];

  if (activeRole === 'DOCTOR') {
    const handleBack = () => setActiveRole('NONE');

    switch (selectedModuleId) {
      case 'DUAL_CONTROL_SES_SIS':
        return <VrDualControlTherapyModule patient={patient} onClose={handleBack} />;
      case 'DEV_TRAUMA':
        return <VrDevelopmentalTraumaFullscreenMonitor patient={patient} onClose={handleBack} />;
      case 'EMDR_MEMORY':
        return <VrMemoryReconsolidationModule patient={patient} onClose={handleBack} />;
      case 'CLUSTER_B_FORENSIC':
        return <ClusterBForenseVrModule patient={patient} onClose={handleBack} />;
      case 'GAMMA_INSIGHT':
        return <VrGammaInsightModule patient={patient} onClose={handleBack} />;
      case 'FND_MIRROR':
        return <VrFunctionalNeurologyModule patient={patient} onClose={handleBack} />;
      case 'PAIN_MANAGEMENT':
        return <VrPainManagementModule patient={patient} onClose={handleBack} />;
      case 'NEURO_HYPNOSIS':
        return <VrClosedLoopHypnosisModule patient={patient} onClose={handleBack} />;
      case 'TDAH_EXECUTIVE':
      default:
        return <VrExecutiveFunctionModule patient={patient} onClose={handleBack} />;
    }
  }

  if (activeRole === 'PATIENT') {
    const assetKey = mapModuleToAssetKey(selectedModuleId);
    const textureUrl = immersionMedia.getEcosystemAssetUrl(assetKey);

    return (
      <VrPatientExperience 
        patientId={patient?.id || 'PAC-8104'} 
        initialModuleId={selectedModuleId} 
        onClose={() => setActiveRole('NONE')} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 flex items-center justify-center font-sans">
      <div className="bg-slate-950 border border-slate-800 text-white max-w-3xl w-full rounded-3xl p-8 space-y-6 shadow-2xl relative">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <span className="px-3 py-1 bg-sky-950 text-sky-400 border border-sky-800/50 rounded-full text-xs font-mono font-bold uppercase">
            Selección de Entorno VR • Sincronización Dual
          </span>
          <h2 className="text-2xl font-black text-white">¿Qué rol desempeñará este dispositivo?</h2>
          <p className="text-xs text-slate-400">Paciente asignado: <strong className="text-slate-200">{patient?.id || 'PAC-8104'}</strong></p>
          
          <div className="max-w-md mx-auto pt-2">
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">Protocolo / Módulo Activo:</label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              {availableModules.map(mod => (
                <option key={mod.id} value={mod.id}>{mod.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          <div 
            onClick={() => setActiveRole('DOCTOR')}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-6 rounded-2xl cursor-pointer transition group flex flex-col justify-between space-y-6 shadow-lg"
          >
            <div className="space-y-4">
              <div className="p-4 bg-sky-950 text-sky-400 border border-sky-800/40 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Monitor className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-300">1. Consola del Profesional</h3>
                <p className="text-xs text-slate-400 mt-1">Abrir en la computadora o Workstation del médico para monitorear telemetría, gráficas y exportar reportes del módulo seleccionado.</p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-sky-400 gap-2">
              <span>Abrir Monitor</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => setActiveRole('PATIENT')}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition group flex flex-col justify-between space-y-6 shadow-lg"
          >
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Glasses className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300">2. Visor del Paciente</h3>
                <p className="text-xs text-slate-400 mt-1">Abrir en el navegador web del Meta Quest 3S o Pico 3. Muestra la simulación inmersiva y emite la señal biométrica en línea.</p>
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
