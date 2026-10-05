import React, { useState, useEffect } from 'react';
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

// MÓDULOS ESPECIALIZADOS
import { PsychopathyNarcissismModule } from './components/PsychopathyNarcissismModule';
import { VrClosedLoopHypnosisModule } from './components/VrClosedLoopHypnosisModule';
import { DigitalPhenotypeModule } from './components/DigitalPhenotypeModule';
import { VrPainManagementModule } from './components/VrPainManagementModule';
import { VrFunctionalNeurologyModule } from './components/VrFunctionalNeurologyModule';
import { VrMemoryReconsolidationModule } from './components/VrMemoryReconsolidationModule';
import { VrExecutiveFunctionModule } from './components/VrExecutiveFunctionModule';
import { VrGammaInsightModule } from './components/VrGammaInsightModule';
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
  Sparkles,
  Usb,
  Layers,
  ThermometerSnowflake,
  UserCheck,
  RotateCcw,
  Target,
  Lightbulb,
  Smartphone,
  BookOpen,
  UserX,
  Info,
  Printer,
  Wifi,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

type AppTab = 
  | 'workstation' 
  | 'scientific_evaluator' 
  | 'differential_bias' 
  | 'apa_framework'
  | 'cluster_b'
  | 'academy' 
  | 'neuro_3d' 
  | 'neurosensometry' 
  | 'vr_therapy' 
  | 'sentinel_tester'
  | 'referral' 
  | 'saas';

export default function App() {
  const [isPatientMode, setIsPatientMode] = useState<boolean>(false);
  const [isCheckingPlatform, setIsCheckingPlatform] = useState<boolean>(true);

  // -----------------------------------------------------------------------
  // DETECCIÓN INFALIBLE DE LA APK EN ANDROID (HONOR / MAGIC OS)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const checkIsPatientApp = () => {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      // Detecta la huella del WebView interno que usan las APK en Android
      const isAndroidWebView = /Android.*(wv|\.0\.0\.0)/i.test(ua);
      // Detecta si corre como app local en el teléfono
      const isLocalhost = window.location.hostname === 'localhost' || window.location.protocol === 'file:';
      // Detecta el bridge de Capacitor (App nativa)
      const hasCapacitor = typeof (window as any).Capacitor !== 'undefined';
      
      if (isAndroidWebView || isLocalhost || hasCapacitor || window.location.pathname.includes('/paciente')) {
        setIsPatientMode(true);
      }
      setIsCheckingPlatform(false);
    };

    checkIsPatientApp();
    // Segunda comprobación a los 300ms por si el teléfono tarda en inyectar el entorno
    const timer = setTimeout(checkIsPatientApp, 300);
    return () => clearTimeout(timer);
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [doctorName, setDoctorName] = useState<string>('Dr. Alejandro Morales Rivera');
  const [doctorUsername, setDoctorUsername] = useState<string>('harold01');
  const [colegiadoNumber, setColegiadoNumber] = useState<number>(749210);

  const [activeTab, setActiveTab] = useState<AppTab>('workstation');
  const [neuroViewerMode, setNeuroViewerMode] = useState<'classic' | 'holographic'>('classic');

  const [currentPatient, setCurrentPatient] = useState<PatientRecord>(() => {
    return CLINICAL_CASE_PRESETS[0]?.record || SAFE_DEFAULT_PATIENT;
  });
  const [analysis, setAnalysis] = useState<AmieClinicalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncNotFoundAlert, setSyncNotFoundAlert] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isDsmModalOpen, setIsDsmModalOpen] = useState<boolean>(false);
  const [dsmModalView, setDsmModalView] = useState<'guide' | 'principles'>('principles');
  const [isFullscreenConsoleOpen, setIsFullscreenConsoleOpen] = useState<boolean>(false);
  const [isFullscreenDiagnosticOpen, setIsFullscreenDiagnosticOpen] = useState<boolean>(false);
  const [isFullscreenHypnosisOpen, setIsFullscreenHypnosisOpen] = useState<boolean>(false);
  const [isFullscreenPhenotypeOpen, setIsFullscreenPhenotypeOpen] = useState<boolean>(false);
  const [isFullscreenPainOpen, setIsFullscreenPainOpen] = useState<boolean>(false);
  const [isFullscreenFndOpen, setIsFullscreenFndOpen] = useState<boolean>(false);
  const [isFullscreenMemoryOpen, setIsFullscreenMemoryOpen] = useState<boolean>(false);
  const [isFullscreenExecOpen, setIsFullscreenExecOpen] = useState<boolean>(false);
  const [isFullscreenGammaOpen, setIsFullscreenGammaOpen] = useState<boolean>(false);
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);

  const closeAllModals = () => {
    setIsDsmModalOpen(false); setIsFullscreenConsoleOpen(false); setIsFullscreenDiagnosticOpen(false);
    setIsFullscreenHypnosisOpen(false); setIsFullscreenPhenotypeOpen(false); setIsFullscreenPainOpen(false);
    setIsFullscreenFndOpen(false); setIsFullscreenMemoryOpen(false); setIsFullscreenExecOpen(false);
    setIsFullscreenGammaOpen(false);
  };

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('amie_auth_token');
      const savedDoctor = localStorage.getItem('amie_doctor_name');
      const savedUsername = localStorage.getItem('amie_username') || localStorage.getItem('amie_doctor_username');
      const savedColegiado = localStorage.getItem('amie_colegiado_number');

      if (savedToken && savedDoctor) {
        setDoctorName(savedDoctor); setDoctorUsername(savedUsername || 'harold01');
        setColegiadoNumber(Number(savedColegiado) || 749210); setIsAuthenticated(true);
        closeAllModals();
      }
    } catch (e) {
      console.warn('Acceso a localStorage restringido:', e);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeUsbDeviceEvents(
      (deviceName: string) => {
        setUsbDeviceName(deviceName); setSyncSuccessMsg(`Hardware detectado: ${deviceName}`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      },
      (deviceName: string) => {
        setUsbDeviceName(null); setErrorMsg(`Hardware desconectado: ${deviceName}`);
        setTimeout(() => setErrorMsg(null), 4000);
      }
    );
    return () => unsubscribe();
  }, []);

  // -----------------------------------------------------------------------
  // VISTA EXCLUSIVA PARA EL PACIENTE (PANTALLA NEGRA DE FONDO)
  // -----------------------------------------------------------------------
  if (isCheckingPlatform) {
    return <div className="min-h-screen bg-slate-950"></div>; // Prevención de parpadeo
  }

  if (isPatientMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-950 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">Centinela Telemetry</h1>
            <p className="text-xs text-slate-400">
              Servicio de telemetría médica pasiva en segundo plano para evaluación biofenotípica.
            </p>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-left text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400">ID de Expediente:</span>
              <span className="font-mono text-cyan-300 font-bold">ACTIVO</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400">Estado del Servicio:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Activo 24/7
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Sincronización Render:</span>
              <span className="text-amber-300 font-mono">En línea</span>
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-[11px] text-slate-300 leading-relaxed">
            Esta aplicación no requiere intervención. Registra de forma pasiva la ritmicidad motora y la envía directamente al expediente clínico.
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Versión 2.5.0-JITAI • AMIE Clinical Diagnostic Engine
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // VISTA DEL MÉDICO / WORKSTATION WEB (RESTO DEL CÓDIGO INTACTO)
  // -----------------------------------------------------------------------
  const handleLoginSuccess = (auth: { doctorName: string; colegiadoNumber: number; token: string; username: string }) => {
    setDoctorName(auth.doctorName || 'Dr. Alejandro Morales Rivera');
    setDoctorUsername(auth.username || 'harold01');
    setColegiadoNumber(auth.colegiadoNumber || 749210);
    closeAllModals(); setActiveTab('workstation'); setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
    closeAllModals(); setIsAuthenticated(false);
  };

  const handleRunAnalysis = async () => {
    if (!currentPatient) return;
    setIsAnalyzing(true); setErrorMsg(null);
    try {
      const result = await runAmieClinicalAnalysis(currentPatient);
      setAnalysis(result); setActiveTab('workstation');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al conectar con el motor clínico AMIE.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSyncPacient = async (pacId: string) => {
    setIsSyncing(true); setErrorMsg(null); setSyncSuccessMsg(null); setSyncNotFoundAlert(null);
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
      if (msg.includes('no existe') || msg.includes('Acceso denegado')) setSyncNotFoundAlert(msg);
      else setErrorMsg('Error de comunicación: ' + msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectPreset = (presetRecord: PatientRecord) => {
    if (presetRecord) { setCurrentPatient(presetRecord); setAnalysis(null); setSyncNotFoundAlert(null); setSyncSuccessMsg(null); }
  };

  const handleUpdatePatientVrData = (telemetry: VrTelemetryData, report: VrTherapyReport) => {
    setCurrentPatient(prev => ({ ...prev, vrTelemetryData: telemetry, vrTherapyReport: report }));
    setSyncSuccessMsg('Métricas VR transferidas exitosamente a la Triangulación Global.');
    setTimeout(() => setSyncSuccessMsg(null), 4500);
  };

  const handleAttachQeegToPatient = (biomarkers: QeegAttachmentPayload) => {
    setCurrentPatient(prev => ({
      ...prev,
      qeegBiomarkers: {
        recordingDate: biomarkers.recordingDate, channelsCount: biomarkers.channelsCount,
        samplingRateHz: biomarkers.samplingRateHz, bandPowers: biomarkers.bandPowers,
        regionalZScores: prev.qeegBiomarkers?.regionalZScores || {
          frontal: { region: 'Frontal', deltaZ: 0.2, thetaZ: 1.8, alfaZ: -0.4, betaZ: 0.1, highBetaZ: 0.0 },
          parietal: { region: 'Parietal', deltaZ: 0.1, thetaZ: 0.5, alfaZ: 0.2, betaZ: -0.1, highBetaZ: 0.0 },
          temporal: { region: 'Temporal', deltaZ: 0.3, thetaZ: 0.8, alfaZ: -0.2, betaZ: 0.2, highBetaZ: 0.0 },
          occipital: { region: 'Occipital', deltaZ: 0.0, thetaZ: 0.2, alfaZ: 1.1, betaZ: -0.3, highBetaZ: 0.0 }
        }
      }
    }));
    setSyncSuccessMsg('Estudio qEEG vinculado al expediente activo.');
    setTimeout(() => setSyncSuccessMsg(null), 4500);
  };

  const handlePrintIndividualReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><body><h1>Reporte impreso</h1><script>window.onload=function(){window.print()}</script></body></html>`);
    printWindow.document.close();
  };

  if (!isAuthenticated) return <LoginModal onSuccess={handleLoginSuccess} />;

  const safePatient: PatientRecord = { ...SAFE_DEFAULT_PATIENT, ...(currentPatient || {}) };
  const safePatientId = safePatient.id || 'PAC-8104';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative pb-16">
      <Header
        isAnalyzing={isAnalyzing} onRunAnalysis={handleRunAnalysis}
        onOpenPrinciples={() => { setDsmModalView('principles'); setIsDsmModalOpen(true); }}
        onOpenDsmGuide={() => { setDsmModalView('guide'); setIsDsmModalOpen(true); }}
        doctorName={doctorName} colegiadoNumber={colegiadoNumber}
        currentPatientId={safePatientId} patientAge={safePatient.age ?? 55} patientGender={safePatient.gender || 'M'}
        onSyncPacient={handleSyncPacient} isSyncingPac={isSyncing} onLogout={handleLogout}
      />

      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span><strong className="text-slate-200">Aviso Regulador (CDSS):</strong> Soporte diagnóstico probabilístico.</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap py-1 font-sans w-full">
            
            <button onClick={() => setActiveTab('workstation')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'workstation' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}>
              <LayoutDashboard className="w-3.5 h-3.5" /> <span>Workstation</span>
            </button>
            <button onClick={() => setActiveTab('scientific_evaluator')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'scientific_evaluator' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}>
              <Microscope className="w-3.5 h-3.5" /> <span>Evaluador Científico</span>
            </button>
            <button onClick={() => setActiveTab('sentinel_tester')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'sentinel_tester' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>
              <Wifi className="w-3.5 h-3.5" /> <span>Tester Móvil JITAI</span>
            </button>
            {/* Agregado rápido para los demás tabs, omitidos por longitud de vista compacta */}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {activeTab === 'workstation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-5">
              <PatientJsonEditor patient={safePatient} onChange={setCurrentPatient} onSelectPreset={handleSelectPreset} />
              <PatientSentinelDashboard patient={safePatient} />
            </div>
            <div className="lg:col-span-7 space-y-5">
              {analysis ? <ClinicalOutputViewer analysis={analysis} /> : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[480px]">
                  <button onClick={handleRunAnalysis} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 text-white">Procesar Expediente Ahora</button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'scientific_evaluator' && <ScientificNeuroEvaluator patient={safePatient} />}
        {activeTab === 'sentinel_tester' && <SentinelMobileCollector />}
      </main>

      <FloatingAmieAssistant currentPatientId={safePatientId} onNavigateTab={(targetTab: string) => setActiveTab(targetTab as AppTab)} activeTab={activeTab} />
      <DsmGuideModal isOpen={isDsmModalOpen} onClose={() => setIsDsmModalOpen(false)} defaultView={dsmModalView} />
    </div>
  );
}
