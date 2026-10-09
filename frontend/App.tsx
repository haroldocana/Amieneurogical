import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PicoVisorApp } from './components/PicoVisorApp';
import { VrPatientExperience } from './components/VrPatientExperience';

import { Header } from './components/Header';
import { PatientJsonEditor } from './components/PatientJsonEditor';
import { BiomarkerDashboard } from './components/BiomarkerDashboard';
import { PatientSentinelDashboard } from './components/PatientSentinelDashboard';
import { SessionAudioAcoustics } from './components/SessionAudioAcoustics';
import { RiskAlertBanner } from './components/RiskAlertBanner';
import { ClinicalOutputViewer } from './components/ClinicalOutputViewer';
import { AmieChatCopilot } from './components/AmieChatCopilot';
import { DsmGuideModal } from './components/DsmGuideModal';
import { ScientificNeuroEvaluator } from './components/ScientificNeuroEvaluator';
import { DifferentialBiasResolver } from './components/DifferentialBiasResolver';
import { NeuroSensoryModule } from './components/NeuroSensoryModule';
import { InteractiveNeuroViewer } from './components/InteractiveNeuroViewer';
import { HolographicNeuroViewer3D } from './components/HolographicNeuroViewer3D';
import { PsychiatryReferralView } from './components/PsychiatryReferralView';
import { AdminSaaSPanel } from './components/AdminSaaSPanel';
import { AmieClinicalAcademy } from './components/AmieClinicalAcademy';
import { LoginModal } from './components/LoginModal';

// MÓDULOS CLÍNICOS Y VR
import { PsychopathyNarcissismModule } from './components/PsychopathyNarcissismModule';
import { VrDualControlTherapyModule } from './components/VrDualControlTherapyModule';
import { VrClosedLoopHypnosisModule } from './components/VrClosedLoopHypnosisModule';
import { VrExecutiveFunctionModule } from './components/VrExecutiveFunctionModule';
import { VrDevelopmentalTraumaFullscreenMonitor } from './components/VrDevelopmentalTraumaFullscreenMonitor';
import { VrFunctionalNeurologyModule } from './components/VrFunctionalNeurologyModule';
import { VrMemoryReconsolidationModule } from './components/VrMemoryReconsolidationModule';
import { VrPainManagementModule } from './components/VrPainManagementModule';
import { VrCognitiveDeclineModule } from './components/VrCognitiveDeclineModule';
import { VrDepressionModule } from './components/VrDepressionModule';
import { VrGammaInsightModule } from './components/VrGammaInsightModule';

// OTROS MÓDULOS ESPECIALIZADOS
import { ApaTherapeuticModule } from './components/ApaTherapeuticModule';
import { PatientRecord, AmieClinicalAnalysis } from './types';
import { CLINICAL_CASE_PRESETS } from './constants';
import { runAmieClinicalAnalysis, syncWithClinicalApp, SAFE_DEFAULT_PATIENT } from './services/geminiService';
import {
  Activity, LayoutDashboard, Brain, BookOpen, UserX, HeartHandshake, Zap, Sparkles, GraduationCap, Smartphone, ShieldCheck, Glasses, Stethoscope
} from 'lucide-react';

type AppTab =  
  | 'workstation'  
  | 'scientific_evaluator'  
  | 'neurosensometry'
  | 'neuro_3d'
  | 'apa_framework'
  | 'cluster_b'
  | 'sexual_health'
  | 'hypnosis_closed_loop'
  | 'vr_advanced_hub'
  | 'academy'  
  | 'sentinel_tester'
  | 'referral'  
  | 'saas';

function DoctorWorkstation() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [doctorName, setDoctorName] = useState<string>('Dr. Alejandro Morales Rivera');
  const [doctorUsername, setDoctorUsername] = useState<string>('harold01');
  const [colegiadoNumber, setColegiadoNumber] = useState<number>(749210);

  const [activeTab, setActiveTab] = useState<AppTab>('workstation');
  const [activeAdvancedSubModule, setActiveAdvancedSubModule] = useState<string>('TDAH');

  const [currentPatient, setCurrentPatient] = useState<PatientRecord>(() => {
    return CLINICAL_CASE_PRESETS[0]?.record || SAFE_DEFAULT_PATIENT;
  });

  const [analysis, setAnalysis] = useState<AmieClinicalAnalysis>(() => ({
    dsmVCode: 'F32.9',
    dsmVDiagnosisName: 'Trastorno Depresivo Mayor (Provisional)',
    diagnosticConfidenceScore: 88,
    icd11Code: '6A70',
    clinicalRationale: 'Cuadro clínico inicial cargado de forma segura en workstation.',
    severityLevel: 'Moderado',
    psychiatryReferralUrgent: false,
    differentialDiagnoses: [],
    treatmentPlan: { psychotherapeutic: ['TCC'], pharmacological: ['A valorar por psiquiatría'] },
    riskAssessment: { suicideRisk: 'Bajo', riskFactors: [], protectiveFactors: [] }
  }));

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    setIsAuthenticated(true); // Auto login temporal para desarrollo
  }, []);

  const handleLoginSuccess = (auth: any) => {
    setDoctorName(auth.doctorName || 'Dr. Alejandro Morales Rivera');
    setDoctorUsername(auth.username || 'harold01');
    setColegiadoNumber(auth.colegiadoNumber || 749210);
    setActiveTab('workstation');
    setIsAuthenticated(true);
  };

  const handleRunAnalysis = async () => {
    if (!currentPatient) return;
    setIsAnalyzing(true);
    try {
      const result = await runAmieClinicalAnalysis(currentPatient);
      if (result) setAnalysis(result);
      setActiveTab('workstation');
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSyncPacient = async (pacId: string) => {
    setIsSyncing(true);
    try {
      const syncResult = await syncWithClinicalApp(pacId, colegiadoNumber, doctorUsername);
      if (syncResult && syncResult.patient) {
        setCurrentPatient(syncResult.patient);
        if (syncResult.analysis) setAnalysis(syncResult.analysis);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isAuthenticated) return <LoginModal onSuccess={handleLoginSuccess} />;

  const safePatient: PatientRecord = {
    ...SAFE_DEFAULT_PATIENT,
    ...(currentPatient || {}),
    functionalAreas: currentPatient?.functionalAreas || SAFE_DEFAULT_PATIENT.functionalAreas,
    neuromotorBiomarkers: currentPatient?.neuromotorBiomarkers || SAFE_DEFAULT_PATIENT.neuromotorBiomarkers,
    qeegZScores: currentPatient?.qeegZScores || SAFE_DEFAULT_PATIENT.qeegZScores
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative pb-16">
      <Header
        isAnalyzing={isAnalyzing} onRunAnalysis={handleRunAnalysis}
        onOpenPrinciples={() => {}} onOpenDsmGuide={() => {}}
        doctorName={doctorName} colegiadoNumber={colegiadoNumber}
        currentPatientId={safePatient.id || 'PAC-8104'} patientAge={safePatient.age || 55} patientGender={safePatient.gender || 'M'}
        onSyncPacient={handleSyncPacient} isSyncingPac={isSyncing} onLogout={() => setIsAuthenticated(false)}
      />

      {/* BARRA DE NAVEGACIÓN COMPLETA */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-2 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 w-max pb-1">
            
            <button onClick={() => setActiveTab('workstation')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'workstation' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-4 h-4" /> Workstation
            </button>

            <button onClick={() => setActiveTab('scientific_evaluator')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'scientific_evaluator' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Activity className="w-4 h-4" /> Evaluador Clínico
            </button>

            <button onClick={() => setActiveTab('neurosensometry')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'neurosensometry' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Brain className="w-4 h-4 text-indigo-300" /> qEEG & Sensores
            </button>

            <button onClick={() => setActiveTab('neuro_3d')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'neuro_3d' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Brain className="w-4 h-4 text-purple-300" /> Neuro 3D
            </button>

            <button onClick={() => setActiveTab('apa_framework')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'apa_framework' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <BookOpen className="w-4 h-4" /> Corrientes APA
            </button>

            <button onClick={() => setActiveTab('cluster_b')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'cluster_b' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <UserX className="w-4 h-4" /> Cluster B
            </button>

            <button onClick={() => setActiveTab('sexual_health')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'sexual_health' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <HeartHandshake className="w-4 h-4" /> Salud Sexual
            </button>

            <button onClick={() => setActiveTab('hypnosis_closed_loop')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'hypnosis_closed_loop' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Sparkles className="w-4 h-4" /> Hipnosis
            </button>

            <button onClick={() => setActiveTab('vr_advanced_hub')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'vr_advanced_hub' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Zap className="w-4 h-4" /> Hub VR Avanzado
            </button>

            <button onClick={() => setActiveTab('academy')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'academy' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <GraduationCap className="w-4 h-4" /> Academia
            </button>

            <button onClick={() => setActiveTab('sentinel_tester')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'sentinel_tester' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Smartphone className="w-4 h-4" /> Sentinel
            </button>

            <button onClick={() => setActiveTab('referral')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'referral' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Stethoscope className="w-4 h-4" /> Derivación
            </button>
            
            <button onClick={() => setActiveTab('saas')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'saas' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:bg-slate-800'}`}>
              <ShieldCheck className="w-4 h-4" /> SaaS Admin
            </button>

            {/* BOTÓN PARA ABRIR EL VISOR VR */}
            <button onClick={() => window.open('/visor', '_blank')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer bg-fuchsia-600 hover:bg-fuchsia-500 text-white border border-fuchsia-400 ml-2 shadow-[0_0_8px_rgba(192,38,211,0.6)]">
              <Glasses className="w-4 h-4" /> Visor VR (Paciente)
            </button>

          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        
        {activeTab === 'workstation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-5 flex flex-col">
              <PatientJsonEditor patient={safePatient} onChange={setCurrentPatient} onSelectPreset={(p) => setCurrentPatient(p)} />
              <BiomarkerDashboard patient={safePatient} />
            </div>
            <div className="lg:col-span-7 space-y-5">
              <ClinicalOutputViewer analysis={analysis} />
              <AmieChatCopilot patient={safePatient} analysis={analysis} />
            </div>
          </div>
        )}

        {/* Módulos de Renderizado Dinámico */}
        {activeTab === 'neurosensometry' && <NeuroSensoryModule patient={safePatient} />}
        {activeTab === 'neuro_3d' && <InteractiveNeuroViewer patient={safePatient} />}
        {activeTab === 'scientific_evaluator' && <ScientificNeuroEvaluator patient={safePatient} />}
        {activeTab === 'apa_framework' && <ApaTherapeuticModule patient={safePatient} />}
        {activeTab === 'cluster_b' && <PsychopathyNarcissismModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
        {activeTab === 'sexual_health' && <VrDualControlTherapyModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
        {activeTab === 'hypnosis_closed_loop' && <VrClosedLoopHypnosisModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
        {activeTab === 'academy' && <AmieClinicalAcademy />}
        {activeTab === 'sentinel_tester' && <PatientSentinelDashboard patient={safePatient} />}
        {activeTab === 'saas' && <AdminSaaSPanel />}
        {activeTab === 'referral' && <PsychiatryReferralView patient={safePatient} />}

        {activeTab === 'vr_advanced_hub' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-300">Hub de Tratamiento e Intervención VR</div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setActiveAdvancedSubModule('TDAH')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeAdvancedSubModule === 'TDAH' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400'}`}>TDAH</button>
                <button onClick={() => setActiveAdvancedSubModule('TRAUMA')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeAdvancedSubModule === 'TRAUMA' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400'}`}>Trauma</button>
                <button onClick={() => setActiveAdvancedSubModule('EMDR')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeAdvancedSubModule === 'EMDR' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400'}`}>EMDR</button>
                <button onClick={() => setActiveAdvancedSubModule('NEURO')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeAdvancedSubModule === 'NEURO' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400'}`}>Neurología</button>
                <button onClick={() => setActiveAdvancedSubModule('DOLOR')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeAdvancedSubModule === 'DOLOR' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400'}`}>Analgesia</button>
                <button onClick={() => setActiveAdvancedSubModule('QEEG')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeAdvancedSubModule === 'QEEG' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400'}`}>qEEG (Gamma)</button>
                <button onClick={() => setActiveAdvancedSubModule('DEPRE')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeAdvancedSubModule === 'DEPRE' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400'}`}>TDM</button>
                <button onClick={() => setActiveAdvancedSubModule('COGNITIVE')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${activeAdvancedSubModule === 'COGNITIVE' ? 'bg-amber-700 text-white' : 'bg-slate-950 text-slate-400'}`}>Deterioro</button>
              </div>
            </div>

            {activeAdvancedSubModule === 'TDAH' && <VrExecutiveFunctionModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
            {activeAdvancedSubModule === 'TRAUMA' && <VrDevelopmentalTraumaFullscreenMonitor patient={safePatient} onClose={() => setActiveTab('workstation')} />}
            {activeAdvancedSubModule === 'EMDR' && <VrMemoryReconsolidationModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
            {activeAdvancedSubModule === 'NEURO' && <VrFunctionalNeurologyModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
            {activeAdvancedSubModule === 'DOLOR' && <VrPainManagementModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
            {activeAdvancedSubModule === 'QEEG' && <VrGammaInsightModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
            {activeAdvancedSubModule === 'DEPRE' && <VrDepressionModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
            {activeAdvancedSubModule === 'COGNITIVE' && <VrCognitiveDeclineModule patient={safePatient} onClose={() => setActiveTab('workstation')} />}
          </div>
        )}

      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/doctor" replace />} />
        <Route path="/doctor" element={<DoctorWorkstation />} />
        <Route path="/visor" element={<VrPatientExperience onClose={() => window.location.href = '/doctor'} />} />
      </Routes>
    </Router>
  );
}
