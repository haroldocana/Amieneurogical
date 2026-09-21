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
import { NeuroSensoryModule } from './components/NeuroSensoryModule';
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
import { VrDevelopmentalTraumaFullscreenMonitor } from './components/VrDevelopmentalTraumaFullscreenMonitor';

// MÓDULOS DE FRONTERA HIPNO-VR & CLOSED-LOOP (SUITE COMPLETA 5/5)
import { VrPainManagementModule } from './components/VrPainManagementModule';         // Módulo 1: Analgesia
import { VrFunctionalNeurologyModule } from './components/VrFunctionalNeurologyModule'; // Módulo 2: Mirror VR (FND)
import { VrMemoryReconsolidationModule } from './components/VrMemoryReconsolidationModule'; // Módulo 3: Reconsolidación Memoria
import { VrExecutiveFunctionModule } from './components/VrExecutiveFunctionModule';   // Módulo 4: TDAH & Función Ejecutiva
import { VrGammaInsightModule } from './components/VrGammaInsightModule';             // Módulo 5: Gamma 40Hz & Insight

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
  Lightbulb
} from 'lucide-react';

type AppTab = 
  | 'workstation' 
  | 'scientific_evaluator' 
  | 'differential_bias' 
  | 'academy' 
  | 'neuro_3d' 
  | 'neurosensometry' 
  | 'vr_therapy' 
  | 'referral' 
  | 'saas';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. Alejandro Morales Rivera');
  const [doctorUsername, setDoctorUsername] = useState('harold01');
  const [colegiadoNumber, setColegiadoNumber] = useState<number>(749210);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<AppTab>('workstation');
  const [neuroViewerMode, setNeuroViewerMode] = useState<'classic' | 'holographic'>('classic');

  // Clinical Case State
  const [currentPatient, setCurrentPatient] = useState<PatientRecord>(() => {
    return CLINICAL_CASE_PRESETS[0]?.record || SAFE_DEFAULT_PATIENT;
  });
  const [analysis, setAnalysis] = useState<AmieClinicalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncNotFoundAlert, setSyncNotFoundAlert] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals & Fullscreen Controls
  const [isDsmModalOpen, setIsDsmModalOpen] = useState(false);
  const [dsmModalView, setDsmModalView] = useState<'guide' | 'principles'>('principles');
  const [isFullscreenConsoleOpen, setIsFullscreenConsoleOpen] = useState(false);
  const [isFullscreenDiagnosticOpen, setIsFullscreenDiagnosticOpen] = useState(false);
  const [isFullscreenHypnosisOpen, setIsFullscreenHypnosisOpen] = useState(false);
  
  // Modales de Módulos Hipno-VR Avanzados (5/5)
  const [isFullscreenPainOpen, setIsFullscreenPainOpen] = useState(false);     // Módulo 1: Analgesia
  const [isFullscreenFndOpen, setIsFullscreenFndOpen] = useState(false);       // Módulo 2: Mirror VR
  const [isFullscreenMemoryOpen, setIsFullscreenMemoryOpen] = useState(false); // Módulo 3: Reconsolidación Memoria
  const [isFullscreenExecOpen, setIsFullscreenExecOpen] = useState(false);     // Módulo 4: TDAH & Exec Control
  const [isFullscreenGammaOpen, setIsFullscreenGammaOpen] = useState(false);   // Módulo 5: Gamma 40Hz Insight

  // USB Device State
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);

  // Recuperación automática de sesión activa desde localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('amie_auth_token');
    const savedDoctor = localStorage.getItem('amie_doctor_name');
    const savedUsername = localStorage.getItem('amie_username') || localStorage.getItem('amie_doctor_username');
    const savedColegiado = localStorage.getItem('amie_colegiado_number');

    if (savedToken && savedDoctor) {
      setDoctorName(savedDoctor);
      setDoctorUsername(savedUsername || 'harold01');
      setColegiadoNumber(Number(savedColegiado) || 749210);
      setIsAuthenticated(true);
    }
  }, []);

  // Suscripción a eventos de hardware USB (Hot-Plugging)
  useEffect(() => {
    const unsubscribe = subscribeUsbDeviceEvents(
      (deviceName) => {
        setUsbDeviceName(deviceName);
        setSyncSuccessMsg(`Hardware conectado: ${deviceName}`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      },
      (deviceName) => {
        setUsbDeviceName(null);
        setErrorMsg(`Hardware desconectado: ${deviceName}`);
        setTimeout(() => setErrorMsg(null), 4000);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (auth: { doctorName: string; colegiadoNumber: number; token: string; username: string }) => {
    setDoctorName(auth.doctorName || 'Dr. Alejandro Morales Rivera');
    setDoctorUsername(auth.username || 'harold01');
    setColegiadoNumber(auth.colegiadoNumber || 749210);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    setIsAuthenticated(false);
  };

  const handleRunAnalysis = async () => {
    if (!currentPatient) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await runAmieClinicalAnalysis(currentPatient);
      setAnalysis(result);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error al conectar con el motor clínico AMIE.';
      setErrorMsg(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSyncPacient = async (pacId: string) => {
    setIsSyncing(true);
    setErrorMsg(null);
    setSyncSuccessMsg(null);
    setSyncNotFoundAlert(null);

    try {
      const syncResult = await syncWithClinicalApp(pacId, colegiadoNumber, doctorUsername);
      if (syncResult && syncResult.patient) {
        setCurrentPatient(syncResult.patient);
        if (syncResult.analysis) {
          setAnalysis(syncResult.analysis);
        }
        setSyncSuccessMsg(syncResult.message || `Expediente ${pacId} sincronizado exitosamente.`);
        setTimeout(() => setSyncSuccessMsg(null), 4500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fallo de conexión';
      if (msg.includes('no existe o no tiene datos cargados') || msg.includes('Acceso denegado')) {
        setSyncNotFoundAlert(msg);
      } else {
        setErrorMsg('Error de comunicación con Cloud Function: ' + msg);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectPreset = (presetRecord: PatientRecord) => {
    if (presetRecord) {
      setCurrentPatient(presetRecord);
      setAnalysis(null);
      setSyncNotFoundAlert(null);
      setSyncSuccessMsg(null);
    }
  };

  // Handler para transferir la biometría VR al expediente global del paciente
  const handleUpdatePatientVrData = (telemetry: VrTelemetryData, report: VrTherapyReport) => {
    setCurrentPatient(prev => ({
      ...prev,
      vrTelemetryData: telemetry,
      vrTherapyReport: report
    }));
    setSyncSuccessMsg('Métricas de VR transferidas exitosamente a la Triangulación Global.');
    setTimeout(() => setSyncSuccessMsg(null), 4500);
  };

  if (!isAuthenticated) {
    return <LoginModal onSuccess={handleLoginSuccess} />;
  }

  const safePatientId = currentPatient?.id || 'PAC-8104';
  const safeAge = currentPatient?.age ?? 55;
  const safeGender = currentPatient?.gender || 'M';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative pb-16">
      <Header
        isAnalyzing={isAnalyzing}
        onRunAnalysis={handleRunAnalysis}
        onOpenPrinciples={() => {
          setDsmModalView('principles');
          setIsDsmModalOpen(true);
        }}
        onOpenDsmGuide={() => {
          setDsmModalView('guide');
          setIsDsmModalOpen(true);
        }}
        doctorName={doctorName}
        colegiadoNumber={colegiadoNumber}
        currentPatientId={safePatientId}
        patientAge={safeAge}
        patientGender={safeGender}
        onSyncPacient={handleSyncPacient}
        isSyncingPac={isSyncing}
        onLogout={handleLogout}
      />

      {/* Barra superior secundaria para estado de USB */}
      {usbDeviceName && (
        <div className="bg-cyan-900/40 border-b border-cyan-800/50 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-cyan-200 z-20">
          <Usb className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>Telemetría Activa: <strong>{usbDeviceName}</strong></span>
        </div>
      )}

      {/* Primary Tab Navigation Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            
            {/* Workstation */}
            <HoverTooltip
              title="Workstation Clínico"
              description="Núcleo de triaje y triangulación de riesgos, datos del expediente JSON, psicometría y dictamen AMIE en 5 bloques."
              clinicalUtility="Generación del dictamen normativo DSM-5 con certezas >80%."
              badge="Módulo 1"
            >
              <button
                onClick={() => setActiveTab('workstation')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeTab === 'workstation'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Workstation</span>
              </button>
            </HoverTooltip>

            {/* Evaluador Científico */}
            <HoverTooltip
              title="Evaluador Científico & Multisensor"
              description="Scoring de afinidad terapéutica (0-100%) para Depresión, TLP, Esquizofrenia y TEA con telemetría de tono vagal y camouflaging."
              clinicalUtility="Mapeo de respuesta a psicofármacos y neuromodulación."
              badge="Módulo 2"
            >
              <button
                onClick={() => setActiveTab('scientific_evaluator')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeTab === 'scientific_evaluator'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Microscope className="w-3.5 h-3.5 text-teal-300" />
                <span>Evaluador Científico</span>
              </button>
            </HoverTooltip>

            {/* Diferenciador & Sesgos */}
            <HoverTooltip
              title="Diferenciador Bioclínico & Antisesgo"
              description="Cruce de 4 ejes (qEEG + Voz + Psicometría + APK), decodificador NLP de sesgos en notas y Gemelo Digital de Riesgo Iatrogénico."
              clinicalUtility="Eliminación de sesgos de confirmación y género."
              badge="Módulo 3"
            >
              <button
                onClick={() => setActiveTab('differential_bias')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeTab === 'differential_bias'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5 text-cyan-300" />
                <span>Diferenciador & Sesgos</span>
              </button>
            </HoverTooltip>

            {/* Capacitación AMIE */}
            <HoverTooltip
              title="Capacitación AMIE & Simulador IA"
              description="Pacientes virtuales fotorrealistas con micro-expresiones dinámicas, casos por ciclo evolutivo y generador Cisne Negro con scoring (0-100 pts)."
              clinicalUtility="Entrenamiento inmersivo acreditado bajo DSM-5-TR."
              badge="Módulo 4"
            >
              <button
                onClick={() => setActiveTab('academy')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeTab === 'academy'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-purple-300" />
                <span>Capacitación AMIE</span>
              </button>
            </HoverTooltip>

            {/* Neurotopografía 3D */}
            <HoverTooltip
              title="Neurotopografía 3D Holográfica"
              description="Mapeador de potencia relativa continua (µV²/Hz) por bandas (Delta, Theta, Alpha, Beta) con 4 vistas satelitales y seguimiento saccádico."
              clinicalUtility="Contraste de neurobiomarcadores con benchmarks de patología."
              badge="Módulo 5"
            >
              <button
                onClick={() => setActiveTab('neuro_3d')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeTab === 'neuro_3d'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Neurotopografía 3D</span>
              </button>
            </HoverTooltip>

            {/* qEEG & Carga */}
            <HoverTooltip
              title="qEEG & Carga de Archivos"
              description="Carga de archivos nativos de electroencefalografía (.EDF/.BDF/.EEG/.CSV), cálculo de espectros FFT y mapeo 10-20."
              clinicalUtility="Inspección de ondas crudas y potencias por canal."
              badge="Señales Crudas"
            >
              <button
                onClick={() => setActiveTab('neurosensometry')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeTab === 'neurosensometry'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>qEEG & Carga</span>
              </button>
            </HoverTooltip>

            {/* VR Quest 3S / Pico 3 Pro */}
            <HoverTooltip
              title="Módulo Terapéutico VR (Pico Neo 3 Pro / Quest 3S)"
              description="Exposición inmersiva con biofeedback en tiempo real (GSR, Geoid HS500 HRV) e informe individual sintetizado."
              clinicalUtility="Cálculo del índice de habituación H y transferencia a la triangulación global."
              badge="Biometría VR"
            >
              <button
                onClick={() => setActiveTab('vr_therapy')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeTab === 'vr_therapy'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Glasses className="w-3.5 h-3.5 text-cyan-300" />
                <span>VR Inmersivo</span>
              </button>
            </HoverTooltip>

            {/* Referencia */}
            <HoverTooltip
              title="Referencia a Psiquiatría"
              description="Generación estructurada de hoja de derivación oficial e interconsulta médica con checklist de contención 24/7."
              clinicalUtility="Gestión de crisis y derivación urgente protegida."
              badge="Interconsulta"
            >
              <button
                onClick={() => setActiveTab('referral')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeTab === 'referral'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Referencia</span>
              </button>
            </HoverTooltip>

            {/* SaaS */}
            <HoverTooltip
              title="Perfil de Licencia & Control IA"
              description="Monitoreo de vigencia de licencia, consumo del bolsón de IA y administración de contraseña."
              clinicalUtility="Perfil de usuario e indicadores institucionales."
              badge="Perfil"
            >
              <button
                onClick={() => setActiveTab('saas')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeTab === 'saas'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>SaaS</span>
              </button>
            </HoverTooltip>

          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {syncNotFoundAlert && (
          <div className="p-4 bg-rose-950/80 border-2 border-rose-500 rounded-2xl text-rose-100 text-xs flex items-center justify-between shadow-2xl animate-shake">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-600 rounded-xl text-white shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block text-white">Notificación de Sincronización:</span>
                <span className="text-rose-200 font-semibold">{syncNotFoundAlert}</span>
              </div>
            </div>
            <button
              onClick={() => setSyncNotFoundAlert(null)}
              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0"
            >
              Entendido
            </button>
          </div>
        )}

        {syncSuccessMsg && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-bold">Error de Ejecución: </span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Tab 1: Workstation Clínico */}
        {activeTab === 'workstation' && (
          <div className="space-y-5">
            {analysis?.riskAlerts && <RiskAlertBanner alerts={analysis.riskAlerts} />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-5 flex flex-col">
                <PatientJsonEditor
                  patient={currentPatient}
                  onChange={setCurrentPatient}
                  onSelectPreset={handleSelectPreset}
                />
                <PatientSentinelDashboard patient={currentPatient} />
                <SessionAudioAcoustics audioRecordings={currentPatient?.audioRecordings} />
                <BiomarkerDashboard patient={currentPatient} />
              </div>

              <div className="lg:col-span-7 space-y-5">
                {analysis ? (
                  <>
                    <ClinicalOutputViewer analysis={analysis} />
                    <AmieChatCopilot patient={currentPatient} analysis={analysis} />
                  </>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[480px] shadow-2xl">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/10 mb-4 animate-pulse">
                      <BrainCircuit className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">
                      Motor Clínico AMIE Listo para Análisis Multimodal
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                      Ingresa un código PAC en la barra superior o selecciona un caso prototípico. Haga clic en <strong className="text-sky-300">"Ejecutar AMIE"</strong> para generar el dictamen estructurado en 5 bloques.
                    </p>

                    <button
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 hover:from-sky-400 hover:to-cyan-400 text-white shadow-lg shadow-sky-500/20 active:scale-95 transition"
                    >
                      <Activity className="w-4 h-4" />
                      <span>Procesar Expediente Ahora</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scientific_evaluator' && <ScientificNeuroEvaluator patient={currentPatient} />}
        
        {/* Tab 3: Diferenciador & Sesgos + Matriz de Triangulación Bioclínica */}
        {activeTab === 'differential_bias' && (
          <div className="space-y-6">
            <DifferentialBiasResolver patient={currentPatient} />
            <DiagnosticTriangulationView patient={currentPatient} analysis={analysis} />
          </div>
        )}

        {activeTab === 'academy' && <AmieClinicalAcademy />}
        
        {/* Tab 5: Neurotopografía 3D */}
        {activeTab === 'neuro_3d' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Modo de Visualización Encefalográfica
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setNeuroViewerMode('classic')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    neuroViewerMode === 'classic'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Visor Anatómico
                </button>
                <button
                  onClick={() => setNeuroViewerMode('holographic')}
                  className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                    neuroViewerMode === 'holographic'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-300" />
                  Visor Holográfico 3D
                </button>
              </div>
            </div>

            {neuroViewerMode === 'classic' ? (
              <InteractiveNeuroViewer patient={currentPatient} />
            ) : (
              <HolographicNeuroViewer3D patient={currentPatient} />
            )}
          </div>
        )}
        
        {/* Tab 6: Módulo qEEG */}
        {activeTab === 'neurosensometry' && <NeuroSensoryModule />}
        
        {/* Tab 7: Módulo VR Inmersivo con Botones de las 5 Consolas Avanzadas */}
        {activeTab === 'vr_therapy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2.5 flex-wrap">
              {/* Módulo 5: Gamma 40Hz Insight */}
              <button
                onClick={() => setIsFullscreenGammaOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 transition"
              >
                <Lightbulb className="w-4 h-4 text-amber-100" />
                <span>Consola Gamma 40Hz (TOC / TEA)</span>
              </button>

              {/* Módulo 4: TDAH & Función Ejecutiva */}
              <button
                onClick={() => setIsFullscreenExecOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 transition"
              >
                <Target className="w-4 h-4 text-sky-200" />
                <span>Consola TDAH (Executive Control)</span>
              </button>

              {/* Módulo 3: Reconsolidación Memoria */}
              <button
                onClick={() => setIsFullscreenMemoryOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition"
              >
                <RotateCcw className="w-4 h-4 text-rose-200" />
                <span>Consola Memoria & Fobias</span>
              </button>

              {/* Módulo 2: Mirror VR */}
              <button
                onClick={() => setIsFullscreenFndOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition"
              >
                <UserCheck className="w-4 h-4 text-indigo-200" />
                <span>Consola Mirror VR (FND)</span>
              </button>

              {/* Módulo 1: Analgesia */}
              <button
                onClick={() => setIsFullscreenPainOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 transition"
              >
                <ThermometerSnowflake className="w-4 h-4 text-cyan-200" />
                <span>Consola Analgesia VR</span>
              </button>

              {/* Consola Hipnosis Trauma */}
              <button
                onClick={() => setIsFullscreenHypnosisOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 transition"
              >
                <Sparkles className="w-4 h-4 text-purple-200 animate-spin-slow" />
                <span>Consola Hipnosis & Trauma</span>
              </button>

              <button
                onClick={() => setIsFullscreenDiagnosticOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-purple-700 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-800/20 transition"
              >
                <Brain className="w-4 h-4" />
                <span>Consola Diagnóstico 3D</span>
              </button>

              <button
                onClick={() => setIsFullscreenConsoleOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 transition"
              >
                <Glasses className="w-4 h-4" />
                <span>Consola Tratamiento</span>
              </button>
            </div>

            <VrTherapyModule
              patient={currentPatient}
              onUpdatePatientVrData={handleUpdatePatientVrData}
            />
          </div>
        )}

        {activeTab === 'referral' && (
          <PsychiatryReferralView
            patient={currentPatient}
            analysis={analysis}
            currentDoctorName={doctorName}
            colegiadoNumber={colegiadoNumber}
          />
        )}
        {activeTab === 'saas' && <AdminSaaSPanel />}
      </main>

      <FloatingAmieAssistant
        currentPatientId={safePatientId}
        onNavigateTab={(targetTab) => setActiveTab(targetTab)}
        activeTab={activeTab}
      />

      <DsmGuideModal
        isOpen={isDsmModalOpen}
        onClose={() => setIsDsmModalOpen(false)}
        defaultView={dsmModalView}
      />

      {/* Modales Fullscreen */}
      {isFullscreenConsoleOpen && (
        <FullscreenTreatmentConsole
          patient={currentPatient}
          onClose={() => setIsFullscreenConsoleOpen(false)}
          onUpdatePatientVrData={handleUpdatePatientVrData}
        />
      )}

      {isFullscreenDiagnosticOpen && (
        <FullscreenDiagnosticRunner
          patient={currentPatient}
          onClose={() => setIsFullscreenDiagnosticOpen(false)}
          onUpdatePatientVrData={handleUpdatePatientVrData}
        />
      )}

      {isFullscreenHypnosisOpen && (
        <VrDevelopmentalTraumaFullscreenMonitor
          patient={currentPatient}
          onClose={() => setIsFullscreenHypnosisOpen(false)}
        />
      )}

      {/* Módulo 1: Analgesia Inmersiva */}
      {isFullscreenPainOpen && (
        <VrPainManagementModule
          patient={currentPatient}
          onClose={() => setIsFullscreenPainOpen(false)}
        />
      )}

      {/* Módulo 2: Neuro-Rehabilitación Mirror VR */}
      {isFullscreenFndOpen && (
        <VrFunctionalNeurologyModule
          patient={currentPatient}
          onClose={() => setIsFullscreenFndOpen(false)}
        />
      )}

      {/* Módulo 3: Reconsolidación Memoria & Fobias */}
      {isFullscreenMemoryOpen && (
        <VrMemoryReconsolidationModule
          patient={currentPatient}
          onClose={() => setIsFullscreenMemoryOpen(false)}
        />
      )}

      {/* Módulo 4: TDAH & Función Ejecutiva */}
      {isFullscreenExecOpen && (
        <VrExecutiveFunctionModule
          patient={currentPatient}
          onClose={() => setIsFullscreenExecOpen(false)}
        />
      )}

      {/* Módulo 5: Gamma 40Hz Insight (TOC/TEA) */}
      {isFullscreenGammaOpen && (
        <VrGammaInsightModule
          patient={currentPatient}
          onClose={() => setIsFullscreenGammaOpen(false)}
        />
      )}
    </div>
  );
}
