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
import { VrDevelopmentalTraumaFullscreenMonitor } from './components/VrDevelopmentalTraumaFullscreenMonitor';

// MÓDULO NUEVO: NEUROHIPNOSIS CLOSED-LOOP
import { VrClosedLoopHypnosisModule } from './components/VrClosedLoopHypnosisModule';

// MÓDULOS HIPNO-VR & CLOSED-LOOP
import { VrPainManagementModule } from './components/VrPainManagementModule';
import { VrFunctionalNeurologyModule } from './components/VrFunctionalNeurologyModule';
import { VrMemoryReconsolidationModule } from './components/VrMemoryReconsolidationModule';
import { VrExecutiveFunctionModule } from './components/VrExecutiveFunctionModule';
import { VrGammaInsightModule } from './components/VrGammaInsightModule';

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
  // Estado de Autenticación
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [doctorName, setDoctorName] = useState<string>('Dr. Alejandro Morales Rivera');
  const [doctorUsername, setDoctorUsername] = useState<string>('harold01');
  const [colegiadoNumber, setColegiadoNumber] = useState<number>(749210);

  // Navegación por Pestañas
  const [activeTab, setActiveTab] = useState<AppTab>('workstation');
  const [neuroViewerMode, setNeuroViewerMode] = useState<'classic' | 'holographic'>('classic');

  // Estado del Expediente del Paciente
  const [currentPatient, setCurrentPatient] = useState<PatientRecord>(() => {
    return CLINICAL_CASE_PRESETS[0]?.record || SAFE_DEFAULT_PATIENT;
  });
  const [analysis, setAnalysis] = useState<AmieClinicalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncNotFoundAlert, setSyncNotFoundAlert] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modales Guía DSM y Consolas Fullscreen
  const [isDsmModalOpen, setIsDsmModalOpen] = useState<boolean>(false);
  const [dsmModalView, setDsmModalView] = useState<'guide' | 'principles'>('principles');
  const [isFullscreenConsoleOpen, setIsFullscreenConsoleOpen] = useState<boolean>(false);
  const [isFullscreenDiagnosticOpen, setIsFullscreenDiagnosticOpen] = useState<boolean>(false);
  const [isFullscreenHypnosisOpen, setIsFullscreenHypnosisOpen] = useState<boolean>(false);
  
  // Modales Especializados Hipno-VR
  const [isFullscreenPainOpen, setIsFullscreenPainOpen] = useState<boolean>(false);
  const [isFullscreenFndOpen, setIsFullscreenFndOpen] = useState<boolean>(false);
  const [isFullscreenMemoryOpen, setIsFullscreenMemoryOpen] = useState<boolean>(false);
  const [isFullscreenExecOpen, setIsFullscreenExecOpen] = useState<boolean>(false);
  const [isFullscreenGammaOpen, setIsFullscreenGammaOpen] = useState<boolean>(false);

  // Estado Hardware USB
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);

  // Cierre Unificado de Modales Pantalla Completa
  const closeAllModals = () => {
    setIsDsmModalOpen(false);
    setIsFullscreenConsoleOpen(false);
    setIsFullscreenDiagnosticOpen(false);
    setIsFullscreenHypnosisOpen(false);
    setIsFullscreenPainOpen(false);
    setIsFullscreenFndOpen(false);
    setIsFullscreenMemoryOpen(false);
    setIsFullscreenExecOpen(false);
    setIsFullscreenGammaOpen(false);
  };

  // Recuperación de Sesión del Usuario
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
        closeAllModals();
      }
    } catch (e) {
      console.warn('Acceso a localStorage restringido o no disponible:', e);
    }
  }, []);

  // Suscripción a Eventos de Hardware USB Hot-Plugging
  useEffect(() => {
    const unsubscribe = subscribeUsbDeviceEvents(
      (deviceName: string) => {
        setUsbDeviceName(deviceName);
        setSyncSuccessMsg(`Hardware detectado: ${deviceName}`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      },
      (deviceName: string) => {
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
    closeAllModals();
    setActiveTab('workstation');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error durante el cierre de sesión:', e);
    }
    closeAllModals();
    setIsAuthenticated(false);
  };

  // Ejecución de Análisis Clínico Multimodal con Gemini
  const handleRunAnalysis = async () => {
    if (!currentPatient) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await runAmieClinicalAnalysis(currentPatient);
      setAnalysis(result);
      setActiveTab('workstation');
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
        setErrorMsg('Error de comunicación con el servidor: ' + msg);
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

  const handleUpdatePatientVrData = (telemetry: VrTelemetryData, report: VrTherapyReport) => {
    setCurrentPatient(prev => ({
      ...prev,
      vrTelemetryData: telemetry,
      vrTherapyReport: report
    }));
    setSyncSuccessMsg('Métricas VR transferidas exitosamente a la Triangulación Global.');
    setTimeout(() => setSyncSuccessMsg(null), 4500);
  };

  const handleAttachQeegToPatient = (biomarkers: QeegAttachmentPayload) => {
    setCurrentPatient(prev => ({
      ...prev,
      qeegBiomarkers: {
        recordingDate: biomarkers.recordingDate,
        channelsCount: biomarkers.channelsCount,
        samplingRateHz: biomarkers.samplingRateHz,
        bandPowers: biomarkers.bandPowers,
        regionalZScores: prev.qeegBiomarkers?.regionalZScores || {
          frontal: { region: 'Frontal', deltaZ: 0.2, thetaZ: 1.8, alfaZ: -0.4, betaZ: 0.1, highBetaZ: 0.0 },
          parietal: { region: 'Parietal', deltaZ: 0.1, thetaZ: 0.5, alfaZ: 0.2, betaZ: -0.1, highBetaZ: 0.0 },
          temporal: { region: 'Temporal', deltaZ: 0.3, thetaZ: 0.8, alfaZ: -0.2, betaZ: 0.2, highBetaZ: 0.0 },
          occipital: { region: 'Occipital', deltaZ: 0.0, thetaZ: 0.2, alfaZ: 1.1, betaZ: -0.3, highBetaZ: 0.0 }
        }
      }
    }));
    setSyncSuccessMsg('Estudio qEEG/Neurosensométrico vinculado al expediente activo.');
    setTimeout(() => setSyncSuccessMsg(null), 4500);
  };

  if (!isAuthenticated) {
    return <LoginModal onSuccess={handleLoginSuccess} />;
  }

  const safePatient: PatientRecord = {
    ...SAFE_DEFAULT_PATIENT,
    ...(currentPatient || {}),
    functionalAreas: currentPatient?.functionalAreas || SAFE_DEFAULT_PATIENT?.functionalAreas || {
      sleep: 50, appetite: 50, energy: 50, social: 50, attention: 50
    },
    neuromotorBiomarkers: currentPatient?.neuromotorBiomarkers || SAFE_DEFAULT_PATIENT?.neuromotorBiomarkers || {
      reactionTimeMs: 240,
      omissionErrors: 0,
      commissionErrors: 0,
      motorStabilityScore: 85
    },
    audioRecordings: currentPatient?.audioRecordings || [],
    psychometricScores: currentPatient?.psychometricScores || {},
    qeegZScores: currentPatient?.qeegZScores || {
      frontalThetaBetaRatio: 1.8,
      temporalAsymmetry: 0.2,
      deltaSlowActivityZ: 0.4,
      alphaPeakFrequencyHz: 10.2
    }
  };

  const safePatientId = safePatient.id || 'PAC-8104';
  const safeAge = safePatient.age ?? 55;
  const safeGender = safePatient.gender || 'M';

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

      {/* Indicador de Hardware USB Activo */}
      {usbDeviceName && (
        <div className="bg-cyan-900/40 border-b border-cyan-800/50 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-cyan-200 z-20">
          <Usb className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>Telemetría Activa: <strong>{usbDeviceName}</strong></span>
        </div>
      )}

      {/* Barra de Navegación Principal */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            
            <HoverTooltip
              title="Workstation Clínico"
              description="Núcleo de triaje y triangulación de riesgos, datos del expediente JSON, psicometría y dictamen AMIE."
              clinicalUtility="Generación del dictamen normativo DSM-5-TR / CIE-11."
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

            <HoverTooltip
              title="Evaluador Científico & Multisensor"
              description="Scoring de afinidad terapéutica (0-100%) para Depresión, TLP, Esquizofrenia y TEA."
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

            <HoverTooltip
              title="Diferenciador Bioclínico & Antisesgo"
              description="Cruce de 4 ejes (qEEG + Voz + Psicometría + APK) y decodificador NLP."
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

            <HoverTooltip
              title="Capacitación AMIE & Simulador IA"
              description="Pacientes virtuales fotorrealistas y casos por ciclo evolutivo."
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

            <HoverTooltip
              title="Neurotopografía 3D Holográfica"
              description="Mapeador de potencia relativa continua por bandas (Delta, Theta, Alpha, Beta)."
              clinicalUtility="Contraste de neurobiomarcadores con benchmarks."
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

            <HoverTooltip
              title="qEEG & Carga de Archivos"
              description="Carga de archivos nativos de electroencefalografía (.EDF/.BDF/.EEG/.CSV)."
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

            <HoverTooltip
              title="Módulo Terapéutico VR (Meta Quest 3S / Pico)"
              description="Exposición inmersiva con biofeedback en tiempo real (GSR, HRV)."
              clinicalUtility="Cálculo del índice de habituación H."
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

            <HoverTooltip
              title="Referencia a Psiquiatría"
              description="Generación estructurada de hoja de derivación oficial e interconsulta."
              clinicalUtility="Gestión de crisis y derivación urgente."
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

            <HoverTooltip
              title="Perfil de Licencia & Control IA"
              description="Monitoreo de vigencia de licencia y consumo del bolsón de IA en MongoDB."
              clinicalUtility="Perfil de usuario e indicadores."
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

      {/* Contenido Principal */}
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

        {/* Tab 1: Workstation */}
        {activeTab === 'workstation' && (
          <div className="space-y-5">
            {analysis?.riskAlerts && <RiskAlertBanner alerts={analysis.riskAlerts} />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-5 flex flex-col">
                <PatientJsonEditor
                  patient={safePatient}
                  onChange={setCurrentPatient}
                  onSelectPreset={handleSelectPreset}
                />
                <PatientSentinelDashboard patient={safePatient} />
                <SessionAudioAcoustics audioRecordings={safePatient.audioRecordings} />
                <BiomarkerDashboard patient={safePatient} />
              </div>

              <div className="lg:col-span-7 space-y-5">
                {analysis ? (
                  <>
                    <ClinicalOutputViewer analysis={analysis} />
                    <AmieChatCopilot patient={safePatient} analysis={analysis} />
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
                      Ingresa un código PAC en la barra superior o selecciona un caso prototípico. Haz clic en <strong className="text-sky-300">"Ejecutar AMIE"</strong> para generar el dictamen estructurado con Gemini.
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

        {/* Tab 2: Evaluador Científico */}
        {activeTab === 'scientific_evaluator' && <ScientificNeuroEvaluator patient={safePatient} />}
        
        {/* Tab 3: Diferenciador & Sesgos */}
        {activeTab === 'differential_bias' && (
          <div className="space-y-6">
            <DifferentialBiasResolver patient={safePatient} />
            <DiagnosticTriangulationView patient={safePatient} analysis={analysis} />
          </div>
        )}

        {/* Tab 4: Capacitación */}
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
              <InteractiveNeuroViewer patient={safePatient} />
            ) : (
              <HolographicNeuroViewer3D patient={safePatient} />
            )}
          </div>
        )}
        
        {/* Tab 6: Módulo qEEG */}
        {activeTab === 'neurosensometry' && (
          <NeuroSensoryModule 
            patient={safePatient} 
            onAttachQeegToPatient={handleAttachQeegToPatient} 
          />
        )}
        
        {/* Tab 7: Módulo VR Inmersivo */}
        {activeTab === 'vr_therapy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2.5 flex-wrap">
              <button
                onClick={() => setIsFullscreenGammaOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 transition"
              >
                <Lightbulb className="w-4 h-4 text-amber-100" />
                <span>Consola Gamma 40Hz (TOC / TEA)</span>
              </button>

              <button
                onClick={() => setIsFullscreenExecOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 transition"
              >
                <Target className="w-4 h-4 text-sky-200" />
                <span>Consola TDAH (Executive Control)</span>
              </button>

              <button
                onClick={() => setIsFullscreenMemoryOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition"
              >
                <RotateCcw className="w-4 h-4 text-rose-200" />
                <span>Consola Memoria & Fobias</span>
              </button>

              <button
                onClick={() => setIsFullscreenFndOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition"
              >
                <UserCheck className="w-4 h-4 text-indigo-200" />
                <span>Consola Mirror VR (FND)</span>
              </button>

              <button
                onClick={() => setIsFullscreenPainOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 transition"
              >
                <ThermometerSnowflake className="w-4 h-4 text-cyan-200" />
                <span>Consola Analgesia VR</span>
              </button>

              <button
                onClick={() => setIsFullscreenHypnosisOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 transition"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Consola Neurohipnosis Closed-Loop</span>
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
              patient={safePatient}
              onUpdatePatientVrData={handleUpdatePatientVrData}
            />
          </div>
        )}

        {/* Tab 8: Referencia */}
        {activeTab === 'referral' && (
          <PsychiatryReferralView
            patient={safePatient}
            analysis={analysis}
            currentDoctorName={doctorName}
            colegiadoNumber={colegiadoNumber}
          />
        )}

        {/* Tab 9: Panel SaaS & Licencias */}
        {activeTab === 'saas' && <AdminSaaSPanel />}
      </main>

      <FloatingAmieAssistant
        currentPatientId={safePatientId}
        onNavigateTab={(targetTab: string) => setActiveTab(targetTab as AppTab)}
        activeTab={activeTab}
      />

      <DsmGuideModal
        isOpen={isDsmModalOpen}
        onClose={() => setIsDsmModalOpen(false)}
        defaultView={dsmModalView}
      />

      {/* Modales Pantalla Completa */}
      {isFullscreenConsoleOpen && (
        <FullscreenTreatmentConsole
          patient={safePatient}
          onClose={() => setIsFullscreenConsoleOpen(false)}
          onUpdatePatientVrData={handleUpdatePatientVrData}
        />
      )}

      {isFullscreenDiagnosticOpen && (
        <FullscreenDiagnosticRunner
          patient={safePatient}
          onClose={() => setIsFullscreenDiagnosticOpen(false)}
          onUpdatePatientVrData={handleUpdatePatientVrData}
        />
      )}

      {/* Consola de Neurohipnosis de Bucle Cerrado (Closed-Loop) */}
      {isFullscreenHypnosisOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 lg:p-8 overflow-y-auto flex items-center justify-center">
          <VrClosedLoopHypnosisModule
            patient={safePatient}
            onClose={() => setIsFullscreenHypnosisOpen(false)}
          />
        </div>
      )}

      {isFullscreenPainOpen && (
        <VrPainManagementModule
          patient={safePatient}
          onClose={() => setIsFullscreenPainOpen(false)}
        />
      )}

      {isFullscreenFndOpen && (
        <VrFunctionalNeurologyModule
          patient={safePatient}
          onClose={() => setIsFullscreenFndOpen(false)}
        />
      )}

      {isFullscreenMemoryOpen && (
        <VrMemoryReconsolidationModule
          patient={safePatient}
          onClose={() => setIsFullscreenMemoryOpen(false)}
        />
      )}

      {isFullscreenExecOpen && (
        <VrExecutiveFunctionModule
          patient={safePatient}
          onClose={() => setIsFullscreenExecOpen(false)}
        />
      )}

      {isFullscreenGammaOpen && (
        <VrGammaInsightModule
          patient={safePatient}
          onClose={() => setIsFullscreenGammaOpen(false)}
        />
      )}
    </div>
  );
}
