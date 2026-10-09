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
import { NeuroSensoryModule, QeegAttachmentPayload } from './components/NeuroSensoryModule';
import { InteractiveNeuroViewer } from './components/InteractiveNeuroViewer';
import { HolographicNeuroViewer3D } from './components/HolographicNeuroViewer3D';
import { PsychiatryReferralView } from './components/PsychiatryReferralView';
import { AdminSaaSPanel } from './components/AdminSaaSPanel';
import { AmieClinicalAcademy } from './components/AmieClinicalAcademy';
import { FloatingAmieAssistant } from './components/FloatingAmieAssistant';
import { HoverTooltip } from './components/HoverTooltip';
import { LoginModal } from './components/LoginModal';
import { VrTherapyModule } from './components/VrTherapyModule';
import { FullscreenTreatmentConsole } from './components/FullscreenTreatmentConsole';
import { FullscreenDiagnosticRunner } from './components/FullscreenDiagnosticRunner';

// TODOS LOS MÓDULOS CLÍNICOS Y VR RECUPERADOS
import { AmieUnifiedVrConsole } from './components/AmieUnifiedVrConsole';
import { VrModuleRouter } from './components/VrModuleRouter';
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
import { DigitalPhenotypeModule } from './components/DigitalPhenotypeModule';
import { ApaTherapeuticModule } from './components/ApaTherapeuticModule';
import { SentinelMobileCollector } from './components/SentinelMobileCollector';

import { DiagnosticTriangulationView } from './components/DiagnosticTriangulationView';
import { PatientRecord, AmieClinicalAnalysis, VrTelemetryData, VrTherapyReport } from './types';
import { CLINICAL_CASE_PRESETS } from './constants';
import { runAmieClinicalAnalysis, syncWithClinicalApp, SAFE_DEFAULT_PATIENT } from './services/geminiService';
import { subscribeUsbDeviceEvents } from './utils/checkUsbSupport';
import {
  Activity,
  LayoutDashboard,
  Brain,
  ShieldAlert,
  KeyRound,
  AlertCircle,
  BrainCircuit,
  GraduationCap,
  GitCompare,
  Microscope,
  Cpu,
  Check,
  AlertTriangle,
  Glasses,
  Smartphone,
  BookOpen,
  UserX,
  Info,
  Printer,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  HeartHandshake,
  Monitor,
  Zap,
  Sparkles,
  Layers,
  Usb
} from 'lucide-react';

type AppTab =  
  | 'workstation'  
  | 'scientific_evaluator'  
  | 'differential_bias'  
  | 'apa_framework'
  | 'cluster_b'
  | 'sexual_health'
  | 'hypnosis_closed_loop'
  | 'vr_advanced_hub'
  | 'academy'  
  | 'neuro_3d'  
  | 'neurosensometry'  
  | 'vr_therapy'  
  | 'sentinel_tester'
  | 'referral'  
  | 'saas';

function DoctorWorkstation() {
  const [isPatientMode, setIsPatientMode] = useState<boolean>(false);
  const [isCheckingPlatform, setIsCheckingPlatform] = useState<boolean>(true);

  useEffect(() => {
    const checkIsPatientApp = () => {
      const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
      const isAndroidDevice = /android/i.test(ua);
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
      const isLocalhostOrFile = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' || window.location.protocol === 'capacitor:';
      const hasCapacitor = typeof (window as any).Capacitor !== 'undefined' || Boolean((window as any).Capacitor?.isNativePlatform?.());
      const isPatientUrl =  
        window.location.pathname.includes('/paciente') ||  
        window.location.search.includes('mode=paciente') ||  
        window.location.search.includes('paciente=true');

      if (isAndroidDevice || isMobileDevice || isLocalhostOrFile || hasCapacitor || isPatientUrl) {
        setIsPatientMode(true);
      } else {
        setIsPatientMode(false);
      }
      setIsCheckingPlatform(false);
    };

    checkIsPatientApp();
    const timer = setTimeout(checkIsPatientApp, 200);
    return () => clearTimeout(timer);
  }, []);

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
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncNotFoundAlert, setSyncNotFoundAlert] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isDsmModalOpen, setIsDsmModalOpen] = useState<boolean>(false);
  const [dsmModalView, setDsmModalView] = useState<'guide' | 'principles'>('principles');
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('amie_auth_token');
      const savedDoctor = localStorage.getItem('amie_doctor_name');
      const savedUsername = localStorage.getItem('amie_username') || localStorage.getItem('amie_doctor_username');
      const savedColegiado = localStorage.getItem('amie_colegiado_number');

      if (savedToken && savedDoctor) {
        setDoctorName(savedDoctor);
        setDoctorUsername(savedUsername || 'harold01');
        setColegiadoNumber(Number(savedColegiado) || 749210);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(true);
      }
    } catch (e) {
      setIsAuthenticated(true);
    }
  }, []);

  if (isCheckingPlatform) return <div className="min-h-screen bg-slate-950"></div>;

  const handleLoginSuccess = (auth: { doctorName: string; colegiadoNumber: number; token: string; username: string }) => {
    setDoctorName(auth.doctorName || 'Dr. Alejandro Morales Rivera');
    setDoctorUsername(auth.username || 'harold01');
    setColegiadoNumber(auth.colegiadoNumber || 749210);
    setActiveTab('workstation');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
    setIsAuthenticated(false);
  };

  const handleRunAnalysis = async () => {
    if (!currentPatient) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await runAmieClinicalAnalysis(currentPatient);
      if (result) setAnalysis(result);
      setActiveTab('workstation');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al conectar con el motor clínico AMIE.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSyncPacient = async (pacId: string) => {
    setIsSyncing(true);
    setErrorMsg(null);
    try {
      const syncResult = await syncWithClinicalApp(pacId, colegiadoNumber, doctorUsername);
      if (syncResult && syncResult.patient) {
        setCurrentPatient(syncResult.patient);
        if (syncResult.analysis) setAnalysis(syncResult.analysis);
        setSyncSuccessMsg(syncResult.message || `Expediente ${pacId} sincronizado exitosamente.`);
        setTimeout(() => setSyncSuccessMsg(null), 4500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fallo de conexión';
      if (msg.includes('no existe') || msg.includes('Acceso denegado')) {
        setSyncNotFoundAlert(msg);
      } else {
        setErrorMsg('Error de comunicación con el servidor: ' + msg);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectPreset = (presetRecord: PatientRecord) => {
    if (presetRecord) {
      setCurrentPatient(presetRecord);
      setSyncNotFoundAlert(null);
      setSyncSuccessMsg(null);
    }
  };

  if (!isAuthenticated) return <LoginModal onSuccess={handleLoginSuccess} />;

  const safePatient: PatientRecord = {
    ...SAFE_DEFAULT_PATIENT,
    ...(currentPatient || {}),
    functionalAreas: currentPatient?.functionalAreas || SAFE_DEFAULT_PATIENT?.functionalAreas || { sleep: 50, appetite: 50, energy: 50, social: 50, attention: 50 },
    neuromotorBiomarkers: currentPatient?.neuromotorBiomarkers || SAFE_DEFAULT_PATIENT?.neuromotorBiomarkers || { reactionTimeMs: 240, omissionErrors: 0, commissionErrors: 0, motorStabilityScore: 85 },
    audioRecordings: currentPatient?.audioRecordings || [],
    psychometricScores: currentPatient?.psychometricScores || {},
    qeegZScores: currentPatient?.qeegZScores || { frontalThetaBetaRatio: 1.8, temporalAsymmetry: 0.2, deltaSlowActivityZ: 0.4, alphaPeakFrequencyHz: 10.2 }
  };

  const safePatientId = safePatient.id || 'PAC-8104';
  const safeAge = safePatient.age ?? 55;
  const safeGender = safePatient.gender || 'M';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative pb-16">
      <Header
        isAnalyzing={isAnalyzing} onRunAnalysis={handleRunAnalysis}
        onOpenPrinciples={() => { setDsmModalView('principles'); setIsDsmModalOpen(true); }}
        onOpenDsmGuide={() => { setDsmModalView('guide'); setIsDsmModalOpen(true); }}
        doctorName={doctorName} colegiadoNumber={colegiadoNumber}
        currentPatientId={safePatientId} patientAge={safeAge} patientGender={safeGender}
        onSyncPacient={handleSyncPacient} isSyncingPac={isSyncing} onLogout={handleLogout}
      />

      {/* BARRA DE NAVEGACIÓN SUPERIOR CON TODAS LAS PESTAÑAS */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-1.5 flex-wrap py-1 font-sans w-full">
            
            <button onClick={() => setActiveTab('workstation')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'workstation' ? 'bg-sky-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-3.5 h-3.5" /><span>Workstation</span>
            </button>

            <button onClick={() => setActiveTab('scientific_evaluator')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'scientific_evaluator' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              <Microscope className="w-3.5 h-3.5" /><span>Evaluador Científico</span>
            </button>

            <button onClick={() => setActiveTab('apa_framework')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'apa_framework' ? 'bg-emerald-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              <BookOpen className="w-3.5 h-3.5" /><span>Corrientes APA</span>
            </button>

            <button onClick={() => setActiveTab('cluster_b')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'cluster_b' ? 'bg-purple-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              <UserX className="w-3.5 h-3.5" /><span>Cluster B & Perfilado</span>
            </button>

            <button onClick={() => setActiveTab('sexual_health')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'sexual_health' ? 'bg-rose-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              <HeartHandshake className="w-3.5 h-3.5" /><span>Salud Sexual</span>
            </button>

            <button onClick={() => setActiveTab('hypnosis_closed_loop')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'hypnosis_closed_loop' ? 'bg-amber-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              <Sparkles className="w-3.5 h-3.5" /><span>Hipnosis Bucle Cerrado</span>
            </button>

            <button onClick={() => setActiveTab('vr_advanced_hub')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'vr_advanced_hub' ? 'bg-indigo-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              <Zap className="w-3.5 h-3.5" /><span>TDAH, Trauma & Dolor</span>
            </button>

          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL Y ENRUTADOR DE MÓDULOS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        
        {activeTab === 'workstation' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-5 flex flex-col">
                <PatientJsonEditor patient={safePatient} onChange={setCurrentPatient} onSelectPreset={handleSelectPreset} />
                <BiomarkerDashboard patient={safePatient} />
              </div>
              <div className="lg:col-span-7 space-y-5">
                <ClinicalOutputViewer analysis={analysis} />
                <AmieChatCopilot patient={safePatient} analysis={analysis} />
              </div>
            </div>
          </div>
        )}

        {/* ========== MÓDULOS CLÍNICOS VR INTEGRADOS ========== */}

        {activeTab === 'cluster_b' && (
          <div className="space-y-4">
            <PsychopathyNarcissismModule patient={safePatient} onClose={() => setActiveTab('workstation')} />
          </div>
        )}

        {activeTab === 'sexual_health' && (
          <div className="space-y-4">
            <VrDualControlTherapyModule patient={safePatient} onClose={() => setActiveTab('workstation')} />
          </div>
        )}

        {activeTab === 'hypnosis_closed_loop' && (
          <div className="space-y-4">
            <VrClosedLoopHypnosisModule patient={safePatient} onClose={() => setActiveTab('workstation')} />
          </div>
        )}

        {activeTab === 'vr_advanced_hub' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
              <div className="text-xs font-bold text-slate-300">
                Hub de Submódulos Inmersivos (Visor Conectado)
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setActiveAdvancedSubModule('TDAH')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${activeAdvancedSubModule === 'TDAH' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>TDAH</button>
                <button onClick={() => setActiveAdvancedSubModule('TRAUMA')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${activeAdvancedSubModule === 'TRAUMA' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>Trauma</button>
                <button onClick={() => setActiveAdvancedSubModule('EMDR')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${activeAdvancedSubModule === 'EMDR' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>EMDR</button>
                <button onClick={() => setActiveAdvancedSubModule('NEURO')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${activeAdvancedSubModule === 'NEURO' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>Neurología</button>
                <button onClick={() => setActiveAdvancedSubModule('DOLOR')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${activeAdvancedSubModule === 'DOLOR' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>Analgesia</button>
                <button onClick={() => setActiveAdvancedSubModule('QEEG')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${activeAdvancedSubModule === 'QEEG' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>qEEG</button>
                <button onClick={() => setActiveAdvancedSubModule('DEPRE')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${activeAdvancedSubModule === 'DEPRE' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>TDM</button>
                <button onClick={() => setActiveAdvancedSubModule('COGNITIVE')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${activeAdvancedSubModule === 'COGNITIVE' ? 'bg-amber-700 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>Deterioro</button>
              </div>
            </div>

            {/* RENDERIZADO DEL SUBMÓDULO SELECCIONADO */}
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

        {activeTab === 'scientific_evaluator' && <ScientificNeuroEvaluator patient={safePatient} />}
        {activeTab === 'apa_framework' && <ApaTherapeuticModule patient={safePatient} />}

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
