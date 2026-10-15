import React, { useState, useEffect } from 'react';
import { Monitor, Glasses, ArrowRight, X, ExternalLink } from 'lucide-react';
import { PatientRecord } from '../types';

// IMPORTACIÓN DE MÓDULOS DE CONSOLA MÉDICA
import { VrExecutiveFunctionModule } from './VrExecutiveFunctionModule';
import { VrPatientExperience } from './VrPatientExperience';
import { VrDualControlTherapyModule } from './VrDualControlTherapyModule';
import { VrDevelopmentalTraumaFullscreenMonitor } from './VrDevelopmentalTraumaFullscreenMonitor';
import { VrMemoryReconsolidationModule } from './VrMemoryReconsolidationModule';
import { PsychopathyNarcissismModule } from './PsychopathyNarcissismModule';
import { ClusterBForenseVrModule } from './ClusterBForenseVrModule';
import { FullscreenDiagnosticRunner } from './FullscreenDiagnosticRunner';
import { VrGammaInsightModule } from './VrGammaInsightModule';
import { VrFunctionalNeurologyModule } from './VrFunctionalNeurologyModule';
import { VrPainManagementModule } from './VrPainManagementModule';
import { VrClosedLoopHypnosisModule } from './VrClosedLoopHypnosisModule';
import { VrDepressionModule } from './VrDepressionModule';
import { VrCognitiveDeclineModule } from './VrCognitiveDeclineModule';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
  initialModuleId?: string;
}

export const VrModuleRouter: React.FC<Props> = ({ 
  patient, 
  onClose, 
  initialModuleId = 'TDAH_EXECUTIVE' 
}) => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = p?.patientNameAnonymized || patientId;

  const [activeRole, setActiveRole] = useState<'NONE' | 'DOCTOR' | 'PATIENT'>('NONE');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModuleId);

  // Cierre accesible por teclado con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeRole === 'NONE') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, activeRole]);

  // Mapeo unificado hacia los assets 360° en minúsculas
  const mapModuleToAssetKey = (modId: string): string => {
    switch (modId) {
      case 'NARCISSISM_CLUSTER_B': return 'overt_provocation';
      case 'CLUSTER_B_FORENSIC': return 'cluster_b_forensic';
      case 'NEURO_HYPNOSIS': return 'neuro_hypnosis';
      case 'DUAL_CONTROL_SES_SIS': return 'dual_control';
      case 'TAG_ANXIETY': return 'safe_place_forest';
      case 'TDAH_EXECUTIVE': return 'tdah_executive';
      case 'DEV_TRAUMA': return 'dev_trauma';
      case 'PAIN_MANAGEMENT': return 'pain_management';
      case 'FND_MIRROR': return 'fnd_mirror';
      case 'EMDR_MEMORY': return 'emdr_memory';
      case 'GAMMA_INSIGHT': return 'cosmic_stars';
      case 'TDM_DEPRESSION': return 'low_poly_white_room';
      case 'COGNITIVE_DECLINE': return 'low_poly_white_room';
      default: return 'clinical_office';
    }
  };

  // Activación directa e instantánea del Visor en la Pico 3 (Sin recargar página)
  const handleActivatePatientInPlace = () => {
    setActiveRole('PATIENT');
  };

  // Abrir en pestaña dedicada con parámetros sanitizados
  const handleOpenDedicatedTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    const assetKey = mapModuleToAssetKey(selectedModuleId);
    const isVideo = selectedModuleId === 'NARCISSISM_CLUSTER_B';
    const params = new URLSearchParams({
      paciente: patientId,
      modulo: selectedModuleId,
      ecosystem: assetKey,
      isVideo: String(isVideo)
    });
    window.open(`/visor?${params.toString()}`, '_blank');
  };

  const availableModules = [
    { id: 'TDAH_EXECUTIVE', title: 'Función Ejecutiva y CPT (TDAH)' },
    { id: 'TDM_DEPRESSION', title: 'Depresión Mayor y Retardo Biomotor (TDM)' },
    { id: 'COGNITIVE_DECLINE', title: 'Deterioro Cognitivo y Temblor Cinemático (Neuro)' },
    { id: 'NARCISSISM_CLUSTER_B', title: 'Narcisismo y Cluster B (Videos Forenses 360°)' },
    { id: 'CLUSTER_B_FORENSIC', title: 'Perfilado Forense Cluster B (Audiencia IA)' },
    { id: 'NEURO_HYPNOSIS', title: 'Neurohipnosis Clínica (Inducción Theta Closed-Loop)' },
    { id: 'EMDR_MEMORY', title: 'Memoria y Fobias (EMDR Óptico Bilateral)' },
    { id: 'PAIN_MANAGEMENT', title: 'Analgesia Neurofuncional y Dolor' },
    { id: 'DEV_TRAUMA', title: 'Trauma Evolutivo & Apego (AIMA)' },
    { id: 'DUAL_CONTROL_SES_SIS', title: 'Laboratorio de Control Dual (SES / SIS)' },
    { id: 'FND_MIRROR', title: 'Neurología Funcional y Espejo (FND)' },
    { id: 'GAMMA_INSIGHT', title: 'Opto-Neuromodulación Gamma 40Hz (TOC / TEA)' },
    { id: 'TAG_ANXIETY', title: 'Reactividad y Fobias (VRET / Santuario)' }
  ];

  // 🟢 VISTA DEL DOCTOR (CHROMEBOOK / ESTACIÓN MÉDICA)
  if (activeRole === 'DOCTOR') {
    const handleBack = () => setActiveRole('NONE');

    switch (selectedModuleId) {
      case 'TDM_DEPRESSION':
        return <VrDepressionModule patient={patient} onClose={handleBack} />;
      case 'COGNITIVE_DECLINE':
        return <VrCognitiveDeclineModule patient={patient} onClose={handleBack} />;
      case 'NARCISSISM_CLUSTER_B':
        return <PsychopathyNarcissismModule patient={patient} onClose={handleBack} />;
      case 'TAG_ANXIETY':
        return (
          <FullscreenDiagnosticRunner 
            patient={patient} 
            initialDisorderId="GAD_GENERALIZED" 
            initialMode="TREATMENT" 
            onClose={handleBack} 
          />
        );
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

  // 🟢 VISTA DEL PACIENTE (PICO 3 / MOTOR THREE.JS Y WEBXR EN DIRECTO)
  if (activeRole === 'PATIENT') {
    return (
      <VrPatientExperience 
        patientId={patientId} 
        moduleId={selectedModuleId}
        onClose={() => setActiveRole('NONE')} 
      />
    );
  }

  // 🟢 MODAL DE ELECCIÓN DE ROL
  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 flex items-center justify-center font-sans text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="Enrutador de Módulos Clínicos VR"
    >
      <div className="bg-slate-950 border border-slate-800 text-white max-w-3xl w-full rounded-3xl p-8 space-y-6 shadow-2xl relative">
        
        <button 
          type="button"
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl cursor-pointer transition hover:bg-slate-800 active:scale-95"
          title="Cerrar Selector"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <span className="px-3 py-1 bg-sky-950 text-sky-400 border border-sky-800/50 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
            Selección de Entorno VR • Sincronización Dual
          </span>
          <h2 className="text-2xl font-black text-white">¿Qué rol desempeñará este dispositivo?</h2>
          <p className="text-xs text-slate-400">
            Paciente asignado: <strong className="text-slate-200 font-mono">{patientDisplayName} ({patientId})</strong>
          </p>
          
          <div className="max-w-md mx-auto pt-2">
            <label className="block text-[11px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider text-left">
              Protocolo / Módulo Activo:
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
            >
              {availableModules.map(mod => (
                <option key={mod.id} value={mod.id}>{mod.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Opción 1: Consola Doctor */}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => setActiveRole('DOCTOR')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveRole('DOCTOR');
              }
            }}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-6 rounded-2xl cursor-pointer transition group flex flex-col justify-between space-y-6 shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <div className="space-y-4">
              <div className="p-4 bg-sky-950 text-sky-400 border border-sky-800/40 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Monitor className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-300">1. Consola del Profesional</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Abrir en la computadora o Chromebook del terapeuta para monitorear telemetría, respuestas de estrés y exportar dictámenes.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-sky-400 gap-2">
              <span>Abrir Monitor Clínico</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Opción 2: Visor Paciente (Activación In-Place WebXR) */}
          <div 
            role="button"
            tabIndex={0}
            onClick={handleActivatePatientInPlace}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleActivatePatientInPlace();
              }
            }}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition group flex flex-col justify-between space-y-6 shadow-lg relative focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                  <Glasses className="w-8 h-8" />
                </div>
                <button
                  type="button"
                  onClick={handleOpenDedicatedTab}
                  title="Abrir en pestaña independiente"
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition cursor-pointer active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300">2. Visor del Paciente</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Seleccionar en el navegador del visor Pico 3 o Meta Quest. Inicia directamente el entorno 3D, el audio clínico y la emisión biométrica en tiempo real.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-400 gap-2">
              <span>Iniciar Visor en este Dispositivo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default VrModuleRouter;
