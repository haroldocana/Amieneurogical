// ============================================================================
// AMIE CLINICAL COPILOT - WORKSTATION MÉDICA & ORQUESTADOR GLOBAL MULTIMODAL
// frontend/App.tsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// MOTOR WEBXR / THREE.JS PARA VISORES PICO 3 PRO & META QUEST 3/3S
import { VrPatientExperience } from './components/VrPatientExperience';

// COMPONENTES PRINCIPALES DE CONSULTA Y TELEMETRÍA
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
import { DiagnosticTriangulationView } from './components/DiagnosticTriangulationView';

// CONSOLA UNIFICADA IA + VR
import { AmieUnifiedVrConsole } from './components/AmieUnifiedVrConsole';

// MÓDULOS DE ALTA ESPECIALIDAD CLÍNICA
import { PsychopathyNarcissismModule } from './components/PsychopathyNarcissismModule';
import { VrClosedLoopHypnosisModule } from './components/VrClosedLoopHypnosisModule';
import { DigitalPhenotypeModule } from './components/DigitalPhenotypeModule';
import { VrPainManagementModule } from './components/VrPainManagementModule';
import { VrFunctionalNeurologyModule } from './components/VrFunctionalNeurologyModule';
import { VrMemoryReconsolidationModule } from './components/VrMemoryReconsolidationModule';
import { VrModuleRouter } from './components/VrModuleRouter';
import { VrGammaInsightModule } from './components/VrGammaInsightModule';
import { VrDevelopmentalTraumaFullscreenMonitor } from './components/VrDevelopmentalTraumaFullscreenMonitor';
import { ApaTherapeuticModule } from './components/ApaTherapeuticModule';
import { SentinelMobileCollector } from './components/SentinelMobileCollector';
import { VrDualControlTherapyModule } from './components/VrDualControlTherapyModule';

// TIPOS Y CONSTANTES
import { 
  PatientRecord, 
  AmieClinicalAnalysis, 
  VrTelemetryData, 
  VrTherapyReport 
} from './types';
import { CLINICAL_CASE_PRESETS, MASTER_VR_ENVIRONMENTS } from './constants';

// SERVICIOS CLÍNICOS Y MOTORES MATEMÁTICOS DE PRECISIÓN
import { runAmieClinicalAnalysis, syncWithClinicalApp, SAFE_DEFAULT_PATIENT } from './services/geminiService';
import { telemetryService, PrecisionTelemetryPacket, TelemetryProtocol } from './services/telemetryService';
import { VrControlService, VrConnectionStatus } from './services/VrControlService';
import { 
  getUserProfile, 
  consumeAiCredit, 
  hasAvailableCredits, 
  rechargeAiCredits, 
  onCreditsUpdated, 
  UserProfile 
} from './services/userService';
import { subscribeUsbDeviceEvents } from './utils/checkUsbSupport';
import { exportAmieClinicalPdf } from './utils/pdfExporter';
import { convertToFhirBundle, downloadFhirJson } from './utils/fhirConverter';

// ICONOGRAFÍA LUCIDE
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
  Radio,
  Bluetooth,
  Flame,
  FileCode,
  Coins,
  Plus,
  Scale,
  ShieldCheck,
  HeartHandshake,
  Monitor
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

function DoctorWorkstation() {
  // --------------------------------------------------------------------------
  // 1. ESTADO DE MODO DE OPERACIÓN Y AUTENTICACIÓN
  // --------------------------------------------------------------------------
  const [isPatientMode, setIsPatientMode] = useState<boolean>(false);
  const [isCheckingPlatform, setIsCheckingPlatform] = useState<boolean>(true);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [doctorName, setDoctorName] = useState<string>('Dr. Alejandro Morales Rivera');
  const [doctorUsername, setDoctorUsername] = useState<string>('harold01');
  const [colegiadoNumber, setColegiadoNumber] = useState<number | string>(749210);

  // Perfil y saldo de créditos IA
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getUserProfile());

  // --------------------------------------------------------------------------
  // 2. ESTADO DE NAVEGACIÓN Y EXPEDIENTE
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<AppTab>('workstation');
  const [neuroViewerMode, setNeuroViewerMode] = useState<'classic' | 'holographic'>('classic');

  const [currentPatient, setCurrentPatient] = useState<PatientRecord>(() => {
    return CLINICAL_CASE_PRESETS[0]?.record || SAFE_DEFAULT_PATIENT;
  });
  const [analysis, setAnalysis] = useState<AmieClinicalAnalysis | null>(null);

  // Estados de carga e interacción asíncrona
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncNotFoundAlert, setSyncNotFoundAlert] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // 3. ESTADOS DE MODALES Y CONSOLAS INMERSIVAS
  // --------------------------------------------------------------------------
  const [isDsmModalOpen, setIsDsmModalOpen] = useState<boolean>(false);
  const [dsmModalView, setDsmModalView] = useState<'guide' | 'principles'>('principles');
  
  const [isFullscreenConsoleOpen, setIsFullscreenConsoleOpen] = useState<boolean>(false);
  const [isFullscreenDiagnosticOpen, setIsFullscreenDiagnosticOpen] = useState<boolean>(false);
  const [isFullscreenPhenotypeOpen, setIsFullscreenPhenotypeOpen] = useState<boolean>(false);
  const [isFullscreenUnifiedVrOpen, setIsFullscreenUnifiedVrOpen] = useState<boolean>(false);
  
  const [activeVrModuleId, setActiveVrModuleId] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // 4. ESTADO DE TELEMETRÍA, HARDWARE Y WEBSOCKETS VR
  // --------------------------------------------------------------------------
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);
  const [telemetryProtocol, setTelemetryProtocol] = useState<TelemetryProtocol>('DISCONNECTED');
  const [isTelemetryConnected, setIsTelemetryConnected] = useState<boolean>(false);
  const [telemetryDeviceName, setTelemetryDeviceName] = useState<string>('Sin hardware');
  const [liveTelemetry, setLiveTelemetry] = useState<PrecisionTelemetryPacket | null>(null);
  const [vrWsStatus, setVrWsStatus] = useState<VrConnectionStatus>('DISCONNECTED');

  const closeAllModals = () => {
    setIsDsmModalOpen(false);
    setIsFullscreenConsoleOpen(false);
    setIsFullscreenDiagnosticOpen(false);
    setIsFullscreenPhenotypeOpen(false);
    setIsFullscreenUnifiedVrOpen(false);
    setActiveVrModuleId(null);
  };

  // --------------------------------------------------------------------------
  // 5. CICLO DE VIDA Y SUSCRIPCIONES REACTIVAS
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Detección automática de visor VR Pico/Quest o query string
    const checkIsPatientApp = () => {
      const isPatientUrl = 
        window.location.search.includes('mode=paciente') || 
        window.location.search.includes('paciente=true') ||
        window.location.search.includes('rol=paciente');

      if (isPatientUrl) {
        setIsPatientMode(true);
      }
      setIsCheckingPlatform(false);
    };

    checkIsPatientApp();
    const timer = setTimeout(checkIsPatientApp, 200);
    return () => clearTimeout(timer);
  }, []);

  // Restauración de sesión médica
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
      }
    } catch (e) {
      console.warn('[AMIE] Almacenamiento local restringido:', e);
    }
  }, []);

  // Suscripción al gestor de créditos IA
  useEffect(() => {
    const unsubCredits = onCreditsUpdated((updated) => {
      setUserProfile(updated);
    });
    return () => unsubCredits();
  }, []);

  // Suscripción a eventos de hardware USB (Hotplug)
  useEffect(() => {
    const unsubscribe = subscribeUsbDeviceEvents(
      (deviceName: string) => {
        setUsbDeviceName(deviceName);
        setSyncSuccessMsg(`Sensor biomédico conectado: ${deviceName}`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      },
      (deviceName: string) => {
        setUsbDeviceName(null);
        setErrorMsg(`Sensor biomédico desconectado: ${deviceName}`);
        setTimeout(() => setErrorMsg(null), 4000);
      }
    );
    return () => unsubscribe();
  }, []);

  // Suscripción al TelemetryService (BLE, USB, Wi-Fi)
  useEffect(() => {
    const unsubStatus = telemetryService.subscribeStatus((status) => {
      setTelemetryProtocol(status.protocol);
      setIsTelemetryConnected(status.connected);
      setTelemetryDeviceName(status.deviceName);
    });

    const unsubData = telemetryService.subscribeData((packet) => {
      setLiveTelemetry(packet);
    });

    return () => {
      unsubStatus();
      unsubData();
    };
  }, []);

  // Suscripción al WebSocket de Puente VR (Render)
  useEffect(() => {
    const unsubVr = VrControlService.subscribeStatus((status) => {
      setVrWsStatus(status);
    });

    // Auto-conectar el puente VR en segundo plano
    VrControlService.connect(undefined, currentPatient?.id || 'PAC-8104');

    return () => unsubVr();
  }, [currentPatient?.id]);

  // --------------------------------------------------------------------------
  // 6. NORMALIZACIÓN DEFENSIVA DEL EXPEDIENTE
  // --------------------------------------------------------------------------
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

  if (isCheckingPlatform) {
    return <div className="min-h-screen bg-slate-950"></div>;
  }

  // --------------------------------------------------------------------------
  // 7. VISTA DIRECTA DE PACIENTE (VISOR WEBXR EN PICO 3 PRO / QUEST)
  // --------------------------------------------------------------------------
  if (isPatientMode) {
    return (
      <div className="relative w-screen h-screen">
        <button
          onClick={() => setIsPatientMode(false)}
          className="absolute top-4 right-4 z-[999999] px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xl backdrop-blur-md"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
          <span>Volver a Estación Médica</span>
        </button>

        <VrPatientExperience 
          patientId={safePatientId} 
          onClose={() => setIsPatientMode(false)} 
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 8. CONTROL DE ACCESO
  // --------------------------------------------------------------------------
  const handleLoginSuccess = (auth: { doctorName: string; colegiadoNumber: number; token: string; username: string }) => {
    setDoctorName(auth.doctorName || 'Dr. Alejandro Morales Rivera');
    setDoctorUsername(auth.username || 'harold01');
    setColegiadoNumber(auth.colegiadoNumber || 749210);
    closeAllModals();
    setActiveTab('workstation');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <LoginModal 
        onSuccess={handleLoginSuccess}
        onSelectPatientMode={() => setIsPatientMode(true)}
        onPatientMode={() => setIsPatientMode(true)}
      />
    );
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('amie_auth_token');
      localStorage.removeItem('amie_doctor_name');
    } catch {}
    closeAllModals();
    setIsAuthenticated(false);
  };

  // --------------------------------------------------------------------------
  // 9. ACCIONES PRINCIPALES (IA, HARDWARE, EXPORTACIONES)
  // --------------------------------------------------------------------------
  const handleRunAnalysis = async () => {
    if (!currentPatient) return;

    // Validación preventiva de créditos de IA
    if (!hasAvailableCredits(1)) {
      setErrorMsg('Saldo insuficiente de Créditos de IA. Recargue su bolsón en el panel superior.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      // Consumir 1 crédito de inferencia clínica
      consumeAiCredit(doctorUsername, 1);
      const result = await runAmieClinicalAnalysis(currentPatient);
      setAnalysis(result);
      setActiveTab('workstation');
      setSyncSuccessMsg('Triangulación bioclínica completada. 1 Crédito de IA consumido.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
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
      const syncResult = await syncWithClinicalApp(pacId, Number(colegiadoNumber), doctorUsername);
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
      if (msg.includes('no existe') || msg.includes('Acceso denegado')) {
        setSyncNotFoundAlert(msg);
      } else {
        setErrorMsg('Error de sincronización con servidor clínico: ' + msg);
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
    setSyncSuccessMsg('Métricas inmersivas VR transferidas a la Triangulación Global.');
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
    setSyncSuccessMsg('Estudio neurosensométrico vinculado con éxito al expediente.');
    setTimeout(() => setSyncSuccessMsg(null), 4500);
  };

  // Enlace y control de hardware
  const handleConnectBluetooth = async () => {
    setSyncSuccessMsg('Buscando dispositivos BLE médicos (Colmi Ring / Geoid ECG)...');
    const success = await telemetryService.connectBluetooth();
    if (success) {
      setSyncSuccessMsg('Sensor BLE vinculado correctamente.');
    } else {
      setErrorMsg('No se completó la vinculación Web Bluetooth.');
    }
    setTimeout(() => { setSyncSuccessMsg(null); setErrorMsg(null); }, 4000);
  };

  const handleConnectUsb = async () => {
    setSyncSuccessMsg('Abriendo puerto serie (Web Serial API)...');
    const success = await telemetryService.connectUsb();
    if (success) {
      setSyncSuccessMsg('Microcontrolador biomédico USB sincronizado.');
    } else {
      setErrorMsg('Conexión serial cancelada o puerto ocupado.');
    }
    setTimeout(() => { setSyncSuccessMsg(null); setErrorMsg(null); }, 4000);
  };

  const handleTareGrip = () => {
    const offset = telemetryService.executeZeroTare();
    setSyncSuccessMsg(`Tara de dinamometría manual calibrada a 0.0 kg (Offset: ${offset.toFixed(1)} kg).`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  const handleTriggerGrounding = () => {
    VrControlService.triggerGroundingProtocol(safePatientId);
    setSyncSuccessMsg('EMERGENCIA VR: Protocolo de Grounding y Retorno Inmediato despachado al visor.');
    setTimeout(() => setSyncSuccessMsg(null), 5000);
  };

  // Exportaciones clínicas oficiales
  const handleExportPdfReport = () => {
    const opened = exportAmieClinicalPdf(
      safePatient,
      analysis,
      doctorName,
      colegiadoNumber
    );
    if (!opened) {
      setErrorMsg('Ventana bloqueada. Active pop-ups para generar el dictamen oficial en PDF.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleExportFhirBundle = () => {
    try {
      const bundle = convertToFhirBundle(safePatient, analysis, colegiadoNumber);
      downloadFhirJson(bundle, `HL7_FHIR_R4_${safePatientId}.json`);
      setSyncSuccessMsg('Recurso HL7 FHIR R4 Bundle descargado con éxito.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch {
      setErrorMsg('Error al serializar el Bundle HL7 FHIR R4.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleQuickRecharge = () => {
    const newTotal = rechargeAiCredits(20);
    setSyncSuccessMsg(`+20 Créditos de IA acreditados. Saldo actual: ${newTotal}`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  // --------------------------------------------------------------------------
  // 10. RENDERIZADO DEL ENTORNO DE TRABAJO MÉDICO
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative pb-16">
      
      {/* 1. CABECERA PRINCIPAL CON SESIÓN Y EXPEDIENTE */}
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
        colegiadoNumber={Number(colegiadoNumber)}
        currentPatientId={safePatientId}
        patientAge={safeAge}
        patientGender={safeGender}
        onSyncPacient={handleSyncPacient}
        isSyncingPac={isSyncing}
        onLogout={handleLogout}
      />

      {/* 2. SUB-BARRA DE TELEMETRÍA, PROTOCOLO DE SEGURIDAD Y CRÉDITOS IA */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-3">
          
          {/* Indicadores de hardware en vivo */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono">
              <Radio className={`w-3 h-3 ${isTelemetryConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-[10px] uppercase font-bold">{telemetryProtocol}:</span>
              <span className="text-slate-200">{telemetryDeviceName}</span>
            </span>

            {/* Muestra rápida de bioseñales si hay conexión */}
            {isTelemetryConnected && liveTelemetry && (
              <span className="flex items-center gap-2 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 rounded-md text-[10px] text-emerald-300 font-mono">
                <span>FC: <strong>{liveTelemetry.heartRateBpm}</strong> bpm</span>
                <span>VFC: <strong>{liveTelemetry.hrvRmssdMs}</strong> ms</span>
                <span>GSR: <strong>{liveTelemetry.gsrMicroSiemens}</strong> µS</span>
                <span>Grip: <strong>{liveTelemetry.handGripPressureKg}</strong> kg</span>
              </span>
            )}

            {/* Conexión WebSocket con Puente VR */}
            <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] font-mono">
              <span className={`w-2 h-2 rounded-full ${vrWsStatus === 'CONNECTED' ? 'bg-cyan-400 animate-pulse' : vrWsStatus === 'CONNECTING' ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
              <span className="text-slate-400">VR Bridge: {vrWsStatus}</span>
            </span>
          </div>

          {/* Acciones de hardware y exportaciones clínicas */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Calibrar dinamometría */}
            <button
              onClick={handleTareGrip}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10.5px] font-semibold border border-slate-700 transition cursor-pointer"
              title="Ajusta la lectura actual de presión manual a 0 kg"
            >
              <Scale className="w-3 h-3 text-amber-400" />
              <span>Tara Grip</span>
            </button>

            {/* Conectar BLE */}
            <button
              onClick={handleConnectBluetooth}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-950/70 hover:bg-blue-900 text-blue-200 rounded-lg text-[10.5px] font-semibold border border-blue-600/40 transition cursor-pointer"
              title="Vincular anillo Colmi o banda Geoid por Bluetooth"
            >
              <Bluetooth className="w-3 h-3 text-blue-400" />
              <span>Conectar BLE</span>
            </button>

            {/* Conectar USB */}
            <button
              onClick={handleConnectUsb}
              className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-200 rounded-lg text-[10.5px] font-semibold border border-cyan-600/40 transition cursor-pointer"
              title="Vincular microcontrolador ESP32 / Biopac por puerto serie"
            >
              <Usb className="w-3 h-3 text-cyan-400" />
              <span>Conectar USB</span>
            </button>

            {/* Protocolo de Grounding de emergencia */}
            <button
              onClick={handleTriggerGrounding}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/90 hover:bg-rose-900 text-rose-200 rounded-lg text-[10.5px] font-bold border border-rose-500/60 shadow-sm transition cursor-pointer animate-pulse"
              title="Fuerza al visor VR a regresar inmediatamente al entorno de calma"
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Grounding VR</span>
            </button>

            {/* Exportar Dictamen Oficial en PDF */}
            <button
              onClick={handleExportPdfReport}
              className="flex items-center gap-1.5 px-3 py-1 bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-500/40 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-sm"
              title="Generar dictamen pericial con formato de receta médica oficial"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Dictamen PDF</span>
            </button>

            {/* Exportar HL7 FHIR R4 */}
            <button
              onClick={handleExportFhirBundle}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-sm"
              title="Descargar HL7 FHIR R4 Bundle interoperable (JSON)"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>FHIR R4</span>
            </button>

            {/* Saldo de Créditos IA */}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-amber-500/40 rounded-lg font-mono text-[11px]">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-bold">{userProfile.availableAiCredits}</span>
              <span className="text-slate-500 text-[10px]">IA</span>
              <button 
                onClick={handleQuickRecharge}
                className="ml-1 p-0.5 hover:bg-amber-500/20 rounded text-amber-400 hover:text-amber-200 transition"
                title="Recargar +20 créditos de inferencia"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVEGACIÓN PRINCIPAL DE MÓDULOS DE EVALUACIÓN */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap py-1 font-sans w-full">
            
            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Workstation Clínico"
                description="Núcleo de triaje y triangulación de riesgos, datos del expediente JSON, psicometría y dictamen AMIE."
                clinicalUtility="Generación del dictamen normativo DSM-5-TR / CIE-11."
                badge="Módulo 1"
              >
                <button
                  onClick={() => setActiveTab('workstation')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'workstation'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Workstation</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Evaluador Científico & Multisensor"
                description="Scoring de afinidad bioclínica (0-100) para Depresión, TLP, Esquizofrenia y TEA."
                clinicalUtility="Mapeo de respuesta a psicofármacos y neuromodulación."
                badge="Módulo 2"
              >
                <button
                  onClick={() => setActiveTab('scientific_evaluator')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'scientific_evaluator'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Microscope className="w-3.5 h-3.5 text-teal-300" />
                  <span>Evaluador Científico</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Diferenciador Bioclínico & Antisesgo"
                description="Cruce multiaxial y neutralización de sesgos mediante la Distancia de Mahalanobis."
                clinicalUtility="Eliminación de sesgos de confirmación y deseabilidad social."
                badge="Módulo 3"
              >
                <button
                  onClick={() => setActiveTab('differential_bias')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'differential_bias'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Diferenciador & Sesgos</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Traducción APA & RCI"
                description="Interpretación por corrientes teóricas (TCC, Psicodinámica, Gestalt, Sistémica) y cálculo RCI de Jacobson & Truax."
                clinicalUtility="Evaluación de cambio clínicamente confiable y alianza terapéutica."
                badge="Marco APA"
              >
                <button
                  onClick={() => setActiveTab('apa_framework')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'apa_framework'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Corrientes APA & RCI</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Cluster B & Perfilado Biocomportamental"
                description="Caracterización autonómica diferenciada entre rasgos narcisistas (Overt/Covert) y disociales."
                clinicalUtility="Análisis pericial forense y provocación inmersiva con consentimiento."
                badge="Cluster B"
              >
                <button
                  onClick={() => setActiveTab('cluster_b')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'cluster_b'
                      ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md shadow-purple-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5 text-purple-300" />
                  <span>Cluster B & Perfilado</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Capacitación AMIE & Simulador IA"
                description="Pacientes virtuales fotorrealistas y casos clínicos acreditados bajo DSM-5-TR."
                clinicalUtility="Entrenamiento inmersivo continuado."
                badge="Módulo 4"
              >
                <button
                  onClick={() => setActiveTab('academy')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'academy'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-purple-300" />
                  <span>Capacitación AMIE</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Neurotopografía 3D Holográfica"
                description="Mapeador de potencia relativa continua por bandas (Delta, Theta, Alpha, Beta)."
                clinicalUtility="Contraste de neurobiomarcadores con benchmarks normativos."
                badge="Módulo 5"
              >
                <button
                  onClick={() => setActiveTab('neuro_3d')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'neuro_3d'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Neurotopografía 3D</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="qEEG & Carga de Señales Crudas"
                description="Carga de archivos nativos de electroencefalografía (.EDF/.BDF/.EEG/.CSV)."
                clinicalUtility="Inspección espectral de ondas y potencia por canal."
                badge="Señales Crudas"
              >
                <button
                  onClick={() => setActiveTab('neurosensometry')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'neurosensometry'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>qEEG & Carga</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Módulo Terapéutico VR (Meta Quest 3S / Pico 3)"
                description="Catálogo de 10 entornos de exposición inmersiva y biofeedback con cálculo de habituación H."
                clinicalUtility="Desensibilización sistemática y autorregulación."
                badge="Biometría VR"
              >
                <button
                  onClick={() => setActiveTab('vr_therapy')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'vr_therapy'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Glasses className="w-3.5 h-3.5 text-cyan-300" />
                  <span>VR Inmersivo</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Capturador Móvil Centinela JITAI 24/7"
                description="Prueba en vivo de ingesta de datos móviles (tecleo, sueño, geocerca) para predecir brotes."
                clinicalUtility="Fenotipado Digital"
                badge="Tester Móvil"
              >
                <button
                  onClick={() => setActiveTab('sentinel_tester')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'sentinel_tester'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tester Móvil JITAI</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Hoja de Derivación a Psiquiatría"
                description="Generación estructurada de interconsulta oficial con estratificación de riesgo."
                clinicalUtility="Gestión de crisis y derivación urgente."
                badge="Interconsulta"
              >
                <button
                  onClick={() => setActiveTab('referral')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'referral'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Referencia</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip
                title="Panel SaaS & Licenciamiento"
                description="Supervisión de vigencia de licencias y sincronización con MongoDB."
                clinicalUtility="Gestión de cuentas institucionales."
                badge="Perfil"
              >
                <button
                  onClick={() => setActiveTab('saas')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    activeTab === 'saas'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-bold'
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
      </div>

      {/* 4. CUERPO DE CONTENIDO DINÁMICO */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        
        {/* Banner de alerta de expediente no localizado */}
        {syncNotFoundAlert && (
          <div className="p-4 bg-rose-950/80 border-2 border-rose-500 rounded-2xl text-rose-100 text-xs flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-600 rounded-xl text-white shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block text-white">Alerta de Sincronización:</span>
                <span className="text-rose-200 font-semibold">{syncNotFoundAlert}</span>
              </div>
            </div>
            <button
              onClick={() => setSyncNotFoundAlert(null)}
              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Mensaje de confirmación */}
        {syncSuccessMsg && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {/* Notificación de error no fatal */}
        {errorMsg && (
          <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-bold">Aviso del Sistema: </span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* TAB 1: WORKSTATION PRINCIPAL */}
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
                      Motor AMIE Listo para Triangulación Multimodal
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                      El expediente cuenta con métricas psicométricas y de hardware validadas. Haz clic en <strong className="text-sky-300">"Ejecutar AMIE"</strong> para activar la inferencia clínica guiada por Gemini 3.8 Flash.
                    </p>

                    <button
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 hover:from-sky-400 hover:to-cyan-400 text-white shadow-lg shadow-sky-500/20 active:scale-95 transition cursor-pointer"
                    >
                      <Activity className="w-4 h-4" />
                      <span>{isAnalyzing ? 'Procesando Triangulación...' : 'Procesar Expediente Ahora'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVALUADOR CIENTÍFICO */}
        {activeTab === 'scientific_evaluator' && <ScientificNeuroEvaluator patient={safePatient} />}
        
        {/* TAB 3: DIFERENCIADOR Y SESGOS */}
        {activeTab === 'differential_bias' && (
          <div className="space-y-6">
            <DifferentialBiasResolver patient={safePatient} />
            <DiagnosticTriangulationView patient={safePatient} analysis={analysis} />
          </div>
        )}

        {/* TAB 4: CORRIENTES APA & RCI */}
        {activeTab === 'apa_framework' && (
          <ApaTherapeuticModule patient={safePatient} />
        )}

        {/* TAB 5: CLUSTER B & NARCISISMO */}
        {activeTab === 'cluster_b' && (
          <PsychopathyNarcissismModule 
            patient={safePatient} 
            onClose={() => setActiveTab('workstation')} 
          />
        )}

        {/* TAB 6: CAPACITACIÓN ACADEMY */}
        {activeTab === 'academy' && <AmieClinicalAcademy />}
        
        {/* TAB 7: NEUROTOPOGRAFÍA 3D */}
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
                  className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                    neuroViewerMode === 'classic'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Visor Anatómico
                </button>
                <button
                  onClick={() => setNeuroViewerMode('holographic')}
                  className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 cursor-pointer ${
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
        
        {/* TAB 8: qEEG & CARGA */}
        {activeTab === 'neurosensometry' && (
          <NeuroSensoryModule 
            patient={safePatient} 
            onAttachQeegToPatient={handleAttachQeegToPatient} 
          />
        )}
        
        {/* TAB 9: VR INMERSIVO & CONSOLAS */}
        {activeTab === 'vr_therapy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2.5 flex-wrap">
              <button
                onClick={() => setIsFullscreenUnifiedVrOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:scale-105 text-white rounded-xl text-xs font-bold shadow-xl shadow-cyan-600/30 transition cursor-pointer"
              >
                <Monitor className="w-4 h-4 text-cyan-200" />
                <span>Abrir Consola Inmersiva Unificada (IA + VR)</span>
              </button>

              <button
                onClick={() => setIsFullscreenPhenotypeOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/20 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-teal-100" />
                <span>Fenotipado Digital & Recaídas</span>
              </button>

              <button
                onClick={() => setActiveVrModuleId('GAMMA_INSIGHT')}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 transition cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-amber-100" />
                <span>Consola Gamma 40Hz (TOC / TEA)</span>
              </button>

              <button
                onClick={() => setActiveVrModuleId('TDAH_EXECUTIVE')}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 transition cursor-pointer"
              >
                <Target className="w-4 h-4 text-sky-200" />
                <span>Consola TDAH (Executive Control)</span>
              </button>

              <button
                onClick={() => setActiveVrModuleId('EMDR_MEMORY')}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-200" />
                <span>Consola Memoria & Fobias</span>
              </button>

              <button
                onClick={() => setActiveVrModuleId('FND_MIRROR')}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-indigo-200" />
                <span>Consola Mirror VR (FND)</span>
              </button>

              <button
                onClick={() => setActiveVrModuleId('PAIN_MANAGEMENT')}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 transition cursor-pointer"
              >
                <ThermometerSnowflake className="w-4 h-4 text-cyan-200" />
                <span>Consola Analgesia VR</span>
              </button>

              <button
                onClick={() => setActiveVrModuleId('NEURO_HYPNOSIS')}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Consola Neurohipnosis Closed-Loop</span>
              </button>

              <button
                onClick={() => setActiveVrModuleId('DEV_TRAUMA')}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-800 via-pink-700 to-rose-700 hover:from-purple-700 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-800/20 transition cursor-pointer"
              >
                <Brain className="w-4 h-4 text-pink-200" />
                <span>Consola Trauma Evolutivo & AIMA</span>
              </button>

              <button
                onClick={() => setActiveVrModuleId('DUAL_CONTROL_SES_SIS')}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-600 via-pink-700 to-purple-800 hover:from-rose-500 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4 text-rose-200" />
                <span>Control Dual (SES / SIS)</span>
              </button>

              <button
                onClick={() => setIsFullscreenDiagnosticOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-purple-700 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-800/20 transition cursor-pointer"
              >
                <Brain className="w-4 h-4" />
                <span>Consola Diagnóstico 3D</span>
              </button>

              <button
                onClick={() => setIsFullscreenConsoleOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 transition cursor-pointer"
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

        {/* TAB 10: TESTER MÓVIL JITAI */}
        {activeTab === 'sentinel_tester' && (
          <div className="py-2">
            <SentinelMobileCollector />
          </div>
        )}

        {/* TAB 11: REFERENCIA PSIQUIÁTRICA */}
        {activeTab === 'referral' && (
          <PsychiatryReferralView
            patient={safePatient}
            analysis={analysis}
            currentDoctorName={doctorName}
            colegiadoNumber={Number(colegiadoNumber)}
          />
        )}

        {/* TAB 12: GESTIÓN SAAS */}
        {activeTab === 'saas' && <AdminSaaSPanel />}
      </main>

      {/* 5. ASISTENTE FLOTANTE AMIE Y MODALES GLOBALES */}
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

      {/* Enrutador de Escenas VR Activas */}
      {activeVrModuleId && (
        <VrModuleRouter
          patient={safePatient}
          initialModuleId={activeVrModuleId}
          onClose={() => setActiveVrModuleId(null)}
        />
      )}

      {/* Consola Inmersiva Unificada */}
      {isFullscreenUnifiedVrOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 lg:p-8 overflow-y-auto flex items-center justify-center">
          <AmieUnifiedVrConsole
            patient={safePatient}
            onClose={() => setIsFullscreenUnifiedVrOpen(false)}
          />
        </div>
      )}

      {/* Consola de Tratamiento 3D */}
      {isFullscreenConsoleOpen && (
        <FullscreenTreatmentConsole
          patient={safePatient}
          onClose={() => setIsFullscreenConsoleOpen(false)}
        />
      )}

      {/* Consola de Diagnóstico 3D */}
      {isFullscreenDiagnosticOpen && (
        <FullscreenDiagnosticRunner
          patient={safePatient}
          onClose={() => setIsFullscreenDiagnosticOpen(false)}
          onUpdatePatientVrData={handleUpdatePatientVrData}
        />
      )}

      {/* Consola de Fenotipado Digital */}
      {isFullscreenPhenotypeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 lg:p-8 overflow-y-auto flex items-center justify-center">
          <DigitalPhenotypeModule
            patient={safePatient}
            onClose={() => setIsFullscreenPhenotypeOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// ENRUTADOR PRINCIPAL CON ALIAS RESILIENTES PARA PICO 3 PRO Y QUEST
// ----------------------------------------------------------------------------
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/doctor" replace />} />
        <Route path="/doctor" element={<DoctorWorkstation />} />
        
        {/* Rutas directas para el Visor Pico 3 Pro y Meta Quest */}
        <Route path="/visor" element={<VrPatientExperience />} />
        <Route path="/paciente" element={<VrPatientExperience />} />
        <Route path="/vr" element={<VrPatientExperience />} />

        {/* Fallback de redirección segura */}
        <Route path="*" element={<Navigate to="/doctor" replace />} />
      </Routes>
    </Router>
  );
}
