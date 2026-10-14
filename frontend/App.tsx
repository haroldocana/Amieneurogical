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

// GESTOR DE ESCENARIOS MULTIMEDIA (FOTOS Y VIDEOS 360°)
import { CustomMediaUploader } from './components/CustomMediaUploader';

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

// MÓDULO DE VOZ Y GUÍA AUDITIVA TERAPÉUTICA
import { ClinicalAudioGuidanceBar } from './components/ClinicalAudioGuidanceBar';
import { ClinicalAudioGuidanceEngine } from './services/clinicalAudioGuidanceService';

// TIPOS Y CONSTANTES
import { 
  PatientRecord, 
  AmieClinicalAnalysis, 
  VrTelemetryData, 
  VrTherapyReport 
} from './types';
import { CLINICAL_CASE_PRESETS, MASTER_VR_ENVIRONMENTS } from './constants';

// SERVICIOS CLÍNICOS
import { runAmieClinicalAnalysis, syncWithClinicalApp, SAFE_DEFAULT_PATIENT } from './services/geminiService';
import { telemetryService, PrecisionTelemetryPacket, TelemetryProtocol } from './services/telemetryService';
import { VrControlService, VrConnectionStatus } from './services/vrControlService';
import { 
  getUserProfile, 
  consumeAiCredit, 
  hasAvailableCredits, 
  rechargeAiCredits, 
  onCreditsUpdated, 
  UserProfile 
} from './services/userService';
import { subscribeUsbDeviceEvents } from './utils/checkUsbSupport';
import * as pdfClinicalExporter from './utils/pdfClinicalExporter';
import * as fhirExporter from './utils/fhirExporter';

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
  Printer,
  Wifi,
  Radio,
  Bluetooth,
  FileCode,
  Coins,
  Plus,
  Scale,
  HeartHandshake,
  Monitor,
  Eye,
  Crosshair,
  Flame,
  Shield,
  Compass,
  AlertOctagon,
  X
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
  const [isPatientMode, setIsPatientMode] = useState<boolean>(false);
  const [isCheckingPlatform, setIsCheckingPlatform] = useState<boolean>(true);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [doctorName, setDoctorName] = useState<string>('Dr. Alejandro Morales Rivera');
  const [doctorUsername, setDoctorUsername] = useState<string>('harold01');
  const [colegiadoNumber, setColegiadoNumber] = useState<number | string>(749210);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => getUserProfile());

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
  
  // Modales de Consolas Inmersivas
  const [isFullscreenConsoleOpen, setIsFullscreenConsoleOpen] = useState<boolean>(false);
  const [isFullscreenDiagnosticOpen, setIsFullscreenDiagnosticOpen] = useState<boolean>(false);
  const [diagnosticRunnerDisorderId, setDiagnosticRunnerDisorderId] = useState<string>('TDAH_CPT');
  const [diagnosticRunnerMode, setDiagnosticRunnerMode] = useState<'DIAGNOSTIC' | 'TREATMENT'>('DIAGNOSTIC');

  const [isFullscreenPhenotypeOpen, setIsFullscreenPhenotypeOpen] = useState<boolean>(false);
  const [isFullscreenUnifiedVrOpen, setIsFullscreenUnifiedVrOpen] = useState<boolean>(false);
  
  const [activeVrModuleId, setActiveVrModuleId] = useState<string | null>(null);

  // Hardware y Telemetría Biomédica
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

  useEffect(() => {
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

  // 1. Suscripción a Créditos IA
  useEffect(() => {
    let unsub: any = null;
    try {
      if (typeof onCreditsUpdated === 'function') {
        unsub = onCreditsUpdated((updated) => {
          setUserProfile(updated);
        });
      }
    } catch (e) {}

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // 2. Suscripción a Dispositivos USB
  useEffect(() => {
    let unsub: any = null;
    try {
      if (typeof subscribeUsbDeviceEvents === 'function') {
        unsub = subscribeUsbDeviceEvents(
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
      }
    } catch (e) {}

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // 3. Suscripción a Telemetría de Sensores
  useEffect(() => {
    let unsubStatus: any = null;
    let unsubData: any = null;

    try {
      if (telemetryService && typeof telemetryService.subscribeStatus === 'function') {
        unsubStatus = telemetryService.subscribeStatus((status) => {
          setTelemetryProtocol(status.protocol);
          setIsTelemetryConnected(status.connected);
          setTelemetryDeviceName(status.deviceName);
        });
      }
      if (telemetryService && typeof telemetryService.subscribeData === 'function') {
        unsubData = telemetryService.subscribeData((packet) => {
          setLiveTelemetry(packet);
        });
      }
    } catch (e) {}

    return () => {
      if (typeof unsubStatus === 'function') unsubStatus();
      if (typeof unsubData === 'function') unsubData();
    };
  }, []);

  // 4. Suscripción a WebSocket VR Pico 3 Pro
  useEffect(() => {
    let unsubVr: any = null;
    try {
      if (VrControlService && typeof VrControlService.subscribeStatus === 'function') {
        unsubVr = VrControlService.subscribeStatus((status) => {
          setVrWsStatus(status);
        });
      }
      if (VrControlService && typeof VrControlService.connect === 'function') {
        VrControlService.connect(undefined, currentPatient?.id || 'PAC-8104');
      }
    } catch (e) {}

    return () => {
      if (typeof unsubVr === 'function') unsubVr();
    };
  }, [currentPatient?.id]);

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

  // --------------------------------------------------------------------------
  // DISPARADOR DIRECTO: ABRE EL ORQUESTADOR EN EL TRASTORNO ESPECÍFICO
  // --------------------------------------------------------------------------
  const handleOpenDisorderConsole = (
    disorderId: string, 
    mode: 'DIAGNOSTIC' | 'TREATMENT' = 'DIAGNOSTIC',
    ecosystem = 'clinical_office',
    hz = 0
  ) => {
    VrControlService.syncClinicalContext({
      moduleId: disorderId,
      category: mode,
      disorderId,
      disorderName: disorderId.replace(/_/g, ' '),
      ecosystem,
      patientId: safePatientId,
      frequencyHz: hz,
      audioGuidance: {
        baselineScript: 'Iniciando sesión clínica. Respira pausadamente y mantén una postura cómoda.',
        activeScript: '',
        recoveryScript: ''
      }
    });

    setDiagnosticRunnerDisorderId(disorderId);
    setDiagnosticRunnerMode(mode);
    setIsFullscreenDiagnosticOpen(true);
    setSyncSuccessMsg(`Visor sincronizado con ${disorderId} [${mode}].`);
    setTimeout(() => setSyncSuccessMsg(null), 3500);
  };

  if (isCheckingPlatform) {
    return <div className="min-h-screen bg-slate-950"></div>;
  }

  // --------------------------------------------------------------------------
  // VISTA MODO PACIENTE (FULLSCREEN VR)
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
  // AUTENTICACIÓN
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
  // ACCIONES CLÍNICAS Y EXPORTACIONES
  // --------------------------------------------------------------------------
  const handleRunAnalysis = async () => {
    if (!currentPatient) return;

    if (!hasAvailableCredits(1)) {
      setErrorMsg('Saldo insuficiente de Créditos de IA. Recargue su bolsón en el panel superior.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
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
    setSyncSuccessMsg('Métricas inmersivas VR transferidas al expediente clínico.');
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

  const handleConnectBluetooth = async () => {
    setSyncSuccessMsg('Buscando dispositivos BLE médicos...');
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
    ClinicalAudioGuidanceEngine.triggerEmergencyGroundingVoice();
    setSyncSuccessMsg('EMERGENCIA VR: Protocolo de Grounding Visual y Voz de Calma 5-4-3-2-1 despachados.');
    setTimeout(() => setSyncSuccessMsg(null), 5000);
  };

  const handlePrintIndividualReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Objetivo Individual — ${safePatientId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; font-size: 11pt; }
          h1 { color: #0284c7; font-size: 16pt; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
          h2 { font-size: 13pt; color: #334155; margin-top: 20px; }
          .meta { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 10pt; margin-bottom: 20px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #f1f5f9; }
          .signature-box { margin-top: 50px; display: flex; justify-content: space-between; font-size: 10pt; }
          .signature-line { border-top: 1px solid #0f172a; width: 220px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <h1>AMIE CLINICAL ENGINE — REPORTE OBJETIVO INDIVIDUAL (ROI)</h1>
        <div class="meta">
          <strong>PACIENTE ID:</strong> ${safePatientId} | <strong>EDAD:</strong> ${safeAge} años | <strong>GÉNERO:</strong> ${safeGender}<br/>
          <strong>PROFESIONAL RESPONSABLE:</strong> ${doctorName} (No. Colegiado: ${colegiadoNumber})<br/>
          <strong>FECHA DE EMISIÓN:</strong> ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <h2>1. MATRIZ DE TRIANGULACIÓN Y RESUMEN DE MÓDULOS</h2>
        <table>
          <thead>
            <tr>
              <th>Módulo Clínico</th>
              <th>Métrica Objetiva</th>
              <th>Diferencial vs. Línea Base (Δ)</th>
              <th>Estatus de Validación</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Workstation & Centinela</td>
              <td>PHQ-9 / GAD-7 / Acústica F0</td>
              <td>Dentro de norma histórica</td>
              <td>Triangulado (3/3 Ejes)</td>
            </tr>
            <tr>
              <td>Evaluador Científico</td>
              <td>Afinidad Terapéutica / Tono Vagal</td>
              <td>HRV RMSSD: 38 ms</td>
              <td>Validado</td>
            </tr>
            <tr>
              <td>VR Inmersivo 6DoF</td>
              <td>Conductancia Cutánea / Habituación H</td>
              <td>GSR: 2.1 µS | H = 42.5%</td>
              <td>Closed-Loop Activo</td>
            </tr>
          </tbody>
        </table>
        <div class="signature-box">
          <div class="signature-line">Firma del Operador de Telemetría</div>
          <div class="signature-line">${doctorName}<br/>No. Colegiado: ${colegiadoNumber}</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  const handleExportPdfReport = () => {
    const exportPdf = 
      (pdfClinicalExporter as any).exportAmieClinicalPdf || 
      (pdfClinicalExporter as any).exportClinicalPdf || 
      (pdfClinicalExporter as any).default;

    if (typeof exportPdf === 'function') {
      try {
        const opened = exportPdf(safePatient, analysis, doctorName, colegiadoNumber);
        if (opened !== false) {
          setSyncSuccessMsg('Dictamen clínico oficial generado exitosamente.');
          setTimeout(() => setSyncSuccessMsg(null), 4000);
          return;
        }
      } catch (e) {
        console.warn('[AMIE PDF Export] Fallback a impresión nativa:', e);
      }
    }
    handlePrintIndividualReport();
  };

  const handleExportFhirBundle = () => {
    try {
      const convertFhir = 
        (fhirExporter as any).convertToFhirBundle || 
        (fhirExporter as any).exportFhirBundle;
      const downloadFhir = 
        (fhirExporter as any).downloadFhirJson || 
        (fhirExporter as any).downloadFhir;

      if (typeof convertFhir === 'function' && typeof downloadFhir === 'function') {
        const bundle = convertFhir(safePatient, analysis, colegiadoNumber);
        downloadFhir(bundle, `HL7_FHIR_R4_${safePatientId}.json`);
        setSyncSuccessMsg('Recurso HL7 FHIR R4 Bundle descargado con éxito.');
        setTimeout(() => setSyncSuccessMsg(null), 4000);
        return;
      }
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
  // RENDER PRINCIPAL DE LA ESTACIÓN MÉDICA
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative pb-16">
      
      {/* CABECERA PRINCIPAL */}
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

      {/* SUB-BARRA DE TELEMETRÍA Y CRÉDITOS */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono">
              <Radio className={`w-3 h-3 ${isTelemetryConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-[10px] uppercase font-bold">{telemetryProtocol}:</span>
              <span className="text-slate-200">{telemetryDeviceName}</span>
            </span>

            {isTelemetryConnected && liveTelemetry && (
              <span className="flex items-center gap-2 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 rounded-md text-[10px] text-emerald-300 font-mono">
                <span>FC: <strong>{liveTelemetry.heartRateBpm}</strong> bpm</span>
                <span>VFC: <strong>{liveTelemetry.hrvRmssdMs}</strong> ms</span>
                <span>GSR: <strong>{liveTelemetry.gsrMicroSiemens}</strong> µS</span>
                <span>Grip: <strong>{liveTelemetry.handGripPressureKg}</strong> kg</span>
              </span>
            )}

            <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] font-mono">
              <span className={`w-2 h-2 rounded-full ${vrWsStatus === 'CONNECTED' ? 'bg-cyan-400 animate-pulse' : vrWsStatus === 'CONNECTING' ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
              <span className="text-slate-400">VR Bridge: {vrWsStatus}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTareGrip}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10.5px] font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Scale className="w-3 h-3 text-amber-400" />
              <span>Tara Grip</span>
            </button>

            <button
              onClick={handleConnectBluetooth}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-950/70 hover:bg-blue-900 text-blue-200 rounded-lg text-[10.5px] font-semibold border border-blue-600/40 transition cursor-pointer"
            >
              <Bluetooth className="w-3 h-3 text-blue-400" />
              <span>Conectar BLE</span>
            </button>

            <button
              onClick={handleConnectUsb}
              className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-200 rounded-lg text-[10.5px] font-semibold border border-cyan-600/40 transition cursor-pointer"
            >
              <Usb className="w-3 h-3 text-cyan-400" />
              <span>Conectar USB</span>
            </button>

            <button
              onClick={handleTriggerGrounding}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/90 hover:bg-rose-900 text-rose-200 rounded-lg text-[10.5px] font-bold border border-rose-500/60 shadow-sm transition cursor-pointer animate-pulse"
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Grounding VR + Voz</span>
            </button>

            <button
              onClick={handleExportPdfReport}
              className="flex items-center gap-1.5 px-3 py-1 bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-500/40 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Dictamen PDF</span>
            </button>

            <button
              onClick={handleExportFhirBundle}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-sm"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>FHIR R4</span>
            </button>

            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-amber-500/40 rounded-lg font-mono text-[11px]">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-bold">{userProfile.availableAiCredits}</span>
              <span className="text-slate-500 text-[10px]">IA</span>
              <button 
                onClick={handleQuickRecharge}
                className="ml-1 p-0.5 hover:bg-amber-500/20 rounded text-amber-400 hover:text-amber-200 transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN PRINCIPAL (TABS) */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap py-1 font-sans w-full">
            
            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Workstation Clínico" description="Núcleo de triaje y triangulación de riesgos." clinicalUtility="Generación del dictamen normativo DSM-5-TR / CIE-11." badge="Módulo 1">
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
              <HoverTooltip title="Evaluador Científico & Multisensor" description="Scoring de afinidad bioclínica (0-100)." clinicalUtility="Mapeo de respuesta terapéutica." badge="Módulo 2">
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
              <HoverTooltip title="Diferenciador Bioclínico & Antisesgo" description="Distancia de Mahalanobis." clinicalUtility="Eliminación de sesgos de confirmación." badge="Módulo 3">
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
              <HoverTooltip title="Traducción APA & RCI" description="Corrientes teóricas y cálculo RCI." clinicalUtility="Cambio clínicamente confiable." badge="Marco APA">
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
              <HoverTooltip title="Cluster B & Perfilado" description="Caracterización de rasgos narcisistas y disociales." clinicalUtility="Análisis pericial forense." badge="Cluster B">
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
              <HoverTooltip title="Capacitación AMIE" description="Simulador de pacientes con IA." clinicalUtility="Entrenamiento inmersivo." badge="Módulo 4">
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
              <HoverTooltip title="Neurotopografía 3D" description="Potencia espectral continua en 3D." clinicalUtility="Comparativa normativo-clínica." badge="Módulo 5">
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
              <HoverTooltip title="qEEG & Carga" description="Lectura de archivos .EDF/.BDF/.CSV." clinicalUtility="Inspección multicanal." badge="Señales Crudas">
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
              <HoverTooltip title="VR Inmersivo" description="Consolas inmersivas y catálogo de entornos." clinicalUtility="Desensibilización y biofeedback." badge="Biometría VR">
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
              <HoverTooltip title="Tester Móvil JITAI" description="Ingesta de fenotipado 24/7." clinicalUtility="Fenotipado Digital" badge="Tester Móvil">
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
              <HoverTooltip title="Hoja de Derivación a Psiquiatría" description="Interconsulta oficial estructurada." clinicalUtility="Gestión de crisis." badge="Interconsulta">
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
              <HoverTooltip title="Panel SaaS & Licenciamiento" description="Supervisión de licencias." clinicalUtility="Gestión de cuentas." badge="Perfil">
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

      {/* CUERPO DE CONTENIDO DINÁMICO */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        
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
              <span className="font-bold">Aviso del Sistema: </span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* TAB 1: WORKSTATION */}
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
        
        {/* TAB 9: VR INMERSIVO & CONSOLAS MAESTRAS */}
        {activeTab === 'vr_therapy' && (
          <div className="space-y-6">
            
            {/* BARRA DE AUDIO GUÍA TERAPÉUTICO */}
            <ClinicalAudioGuidanceBar 
              initialProtocolId="VRET_EXPOSURE"
              onGroundingTriggered={() => {
                VrControlService.triggerGroundingProtocol(safePatientId);
                setSyncSuccessMsg('Protocolo de Grounding Visual activado.');
              }}
            />

            {/* GESTOR DE ESCENARIOS MULTIMEDIA (FOTOS Y VIDEOS 360°) */}
            <CustomMediaUploader patientId={safePatientId} />

            {/* MATRIZ CLÍNICA COMPLETA ORGANIZADA POR 7 CATEGORÍAS */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-cyan-400" />
                    MATRIZ MAESTRA 6DoF NOSOLÓGICA (7 MÓDULOS • 30 TRASTORNOS)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Haz clic en cualquier patología para abrir su consola de 3 fases e interactuar en tiempo real con el visor Pico Neo 3 Pro.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDisorderConsole('TDAH_CPT', 'DIAGNOSTIC')}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:scale-105 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-600/30 transition cursor-pointer"
                  >
                    Orquestador Maestro 30 Módulos
                  </button>
                  <button
                    onClick={() => setIsFullscreenUnifiedVrOpen(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Consola Unificada IA+VR
                  </button>
                </div>
              </div>

              {/* GRID COMPLETO DE LOS 7 MÓDULOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* 1. NEURODESARROLLO */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-emerald-400 uppercase block mb-1">Módulo I</span>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" /> Neurodesarrollo &amp; Control Motor
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Atención sostenida, impulsividad motora, sintonía visual social y arrastre fótico.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleOpenDisorderConsole('TDAH_CPT', 'DIAGNOSTIC', 'tdah_executive')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • TDAH (CPT 3D)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('TEA_SENSORY', 'DIAGNOSTIC', 'clinical_office')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Autismo (TEA)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('ASPERGER_SYNDROME', 'DIAGNOSTIC', 'social_cafe')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Asperger (Nivel 1)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('ALZHEIMER_GAMMA', 'TREATMENT', 'cosmic_stars', 40.0)} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Alzheimer (40 Hz)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('PARKINSON_MOTOR', 'DIAGNOSTIC', 'sterile_room')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer col-span-2">
                      • Parkinson (Temblor &amp; FOG)
                    </button>
                  </div>
                </div>

                {/* 2. AFECTIVO, PSICOSIS & TRAUMA */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-sky-400 uppercase block mb-1">Módulo II</span>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-sky-400" /> Afectivo, Psicosis &amp; Trauma
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Asimetría frontal Alpha, terapia de avatar para voces, reprocesamiento sacádico EMDR y apego.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleOpenDisorderConsole('TDM_DEPRESSION', 'TREATMENT', 'bioluminescent_beach', 10.0)} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Depresión Mayor
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('DISTIMIA_CHRONIC', 'TREATMENT', 'safe_place_forest')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Distimia Crónica
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('SCHIZOPHRENIA_VR', 'DIAGNOSTIC', 'sensory_overload_room')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Esquizofrenia (Voces)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('PTSD_EMDR', 'TREATMENT', 'emdr_memory', 1.4)} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • TEPT (EMDR 3D)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('CPTSD_DEVELOPMENTAL', 'DIAGNOSTIC', 'dev_trauma')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer col-span-2">
                      • Trauma Complejo &amp; Esquemas Apego
                    </button>
                  </div>
                </div>

                {/* 3. ANSIEDAD, FOBIAS & TOC */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-cyan-400 uppercase block mb-1">Módulo III</span>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <Glasses className="w-4 h-4 text-cyan-400" /> Ansiedad, Fobias &amp; TOC
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Desensibilización vestibular, cabina de vuelo VRET, fobia social, coherencia 0.1Hz y EPR.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleOpenDisorderConsole('PANIC_DISORDER', 'DIAGNOSTIC', 'sterile_room')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Pánico &amp; Espacios
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('ACROPHOBIA', 'TREATMENT', 'acrophobia_roof')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Acrofobia (Alturas)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('AEROPHOBIA', 'TREATMENT', 'aerophobia_cabin')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Aerofobia (Vuelo)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('SOCIAL_ANXIETY', 'DIAGNOSTIC', 'cluster_b_forensic')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Fobia Social
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('GAD_GENERALIZED', 'TREATMENT', 'neuro_hypnosis')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • TAG (Coherencia)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('OCD_OBSESSIVE', 'TREATMENT', 'cosmic_stars')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • TOC (EPR)
                    </button>
                  </div>
                </div>

                {/* 4. ADICCIONES */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-amber-400 uppercase block mb-1">Módulo IV</span>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" /> Adicciones Químicas &amp; Digitales
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Terapia de exposición a señales (CET), curva de craving y prevención de respuesta a pantallas.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleOpenDisorderConsole('SUD_ADDICTION', 'DIAGNOSTIC', 'bar_environment')} className="py-2 px-2 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 rounded-lg text-[11px] font-bold text-amber-200 text-left transition cursor-pointer">
                      • Sustancias / Alcohol
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('DIGITAL_ADDICTION', 'DIAGNOSTIC', 'gaming_room')} className="py-2 px-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 rounded-lg text-[11px] font-bold text-indigo-200 text-left transition cursor-pointer">
                      • Adicción Digital
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('GAMBLING_LUDOPATHY', 'DIAGNOSTIC', 'bar_environment')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer col-span-2">
                      • Ludopatía (Juego Compulsivo)
                    </button>
                  </div>
                </div>

                {/* 5. PERSONALIDAD & FORENSE */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-rose-400 uppercase block mb-1">Módulo V</span>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-rose-400" /> Personalidad &amp; Cluster B
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Labilidad afectiva (TLP), disonancia de estatus, aplanamiento somático y peritaje disocial PCL-R.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleOpenDisorderConsole('BPD_INSTABILITY', 'DIAGNOSTIC', 'abandonment_scenario')} className="py-2 px-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 rounded-lg text-[11px] font-bold text-rose-200 text-left transition cursor-pointer">
                      • TLP (Límite)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('NARCISSISM_MALE', 'DIAGNOSTIC', 'boardroom_provocation')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Narcisismo Overt
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('NARCISSISM_FEMALE', 'DIAGNOSTIC', 'social_exclusion_party')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Narcisismo Covert
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('SOCIOPATHY_ASPD', 'DIAGNOSTIC', 'authority_conflict')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Sociopatía (ASPD)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('PSYCHOPATHY', 'DIAGNOSTIC', 'distress_empathy_test')} className="py-2 px-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 rounded-lg text-[11px] font-bold text-red-200 text-left transition cursor-pointer col-span-2">
                      • Psicopatía Forense (PCL-R Factor 1)
                    </button>
                  </div>
                </div>

                {/* 6. NEUROHIPNOSIS & DOLOR CRÓNICO */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-purple-400 uppercase block mb-1">Módulo VI</span>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <ThermometerSnowflake className="w-4 h-4 text-purple-400" /> Neurohipnosis &amp; Psicosomática
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Trance profundo Ericksoniano en bucle cerrado, terapia en espejo 6DoF y analgesia polar.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleOpenDisorderConsole('CLINICAL_HYPNOSIS_DEEP', 'TREATMENT', 'neuro_hypnosis', 3.5)} className="py-2 px-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 rounded-lg text-[11px] font-bold text-purple-200 text-left transition cursor-pointer col-span-2">
                      • Neurohipnosis Profunda Closed-Loop (1-5)
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('FND_CONVERSION', 'TREATMENT', 'fnd_mirror')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Espejo FND
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('CHRONIC_PAIN', 'TREATMENT', 'pain_management', 0.5)} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Analgesia Nociceptiva
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('CRPS_NEUROPATHIC', 'TREATMENT', 'pain_management')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • SDRC Neuropático
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('INSOMNIA_SLEEP', 'TREATMENT', 'neuro_hypnosis', 2.0)} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Insomnio Delta 2Hz
                    </button>
                  </div>
                </div>

                {/* 7. SALUD SEXUAL & MODELO DUAL */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-rose-400 uppercase block mb-1">Módulo VII</span>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-rose-400" /> Sexología &amp; Modelo Dual
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Focalización sensorial sin demanda, desactivación del freno SIS y facilitación del deseo SES.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleOpenDisorderConsole('SEXUAL_INHIBITION', 'TREATMENT', 'dual_control')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Inhibición Freno SIS
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('SEXUAL_DESIRE', 'TREATMENT', 'dual_control')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer">
                      • Deseo Hipoactivo SES
                    </button>
                    <button onClick={() => handleOpenDisorderConsole('SEXUAL_PERFORMANCE_ANX', 'DIAGNOSTIC', 'dual_control')} className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200 text-left transition cursor-pointer col-span-2">
                      • Ansiedad de Rendimiento Sexual
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Módulo Original de Telemetría VR y Registro */}
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

      {/* ASISTENTE FLOTANTE AMIE */}
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

      {/* =====================================================================
          SISTEMA MODAL FLOTANTE DE ALTA PRIORIDAD (z-[9999])
      ====================================================================== */}

      {/* 1. MÓDULOS ESPECIALIZADOS DE VR */}
      {activeVrModuleId && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 lg:p-6 overflow-y-auto flex items-center justify-center animate-fadeIn">
          <div className="relative w-full max-w-7xl max-h-[94vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 lg:p-6">
            
            <button
              onClick={() => setActiveVrModuleId(null)}
              className="absolute top-4 right-4 z-50 px-3.5 py-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>Cerrar Módulo Específico</span>
            </button>

            {activeVrModuleId === 'GAMMA_INSIGHT' && (
              <VrGammaInsightModule patient={safePatient} onClose={() => setActiveVrModuleId(null)} />
            )}
            {activeVrModuleId === 'EMDR_MEMORY' && (
              <VrMemoryReconsolidationModule 
                patient={safePatient} 
                onClose={() => setActiveVrModuleId(null)} 
                onUpdatePatientVrData={handleUpdatePatientVrData}
              />
            )}
            {activeVrModuleId === 'FND_MIRROR' && (
              <VrFunctionalNeurologyModule patient={safePatient} onClose={() => setActiveVrModuleId(null)} />
            )}
            {activeVrModuleId === 'PAIN_MANAGEMENT' && (
              <VrPainManagementModule patient={safePatient} onClose={() => setActiveVrModuleId(null)} />
            )}
            {activeVrModuleId === 'NEURO_HYPNOSIS' && (
              <VrClosedLoopHypnosisModule patient={safePatient} onClose={() => setActiveVrModuleId(null)} />
            )}
            {activeVrModuleId === 'DEV_TRAUMA' && (
              <VrDevelopmentalTraumaFullscreenMonitor patient={safePatient} onClose={() => setActiveVrModuleId(null)} />
            )}
            {activeVrModuleId === 'DUAL_CONTROL_SES_SIS' && (
              <VrDualControlTherapyModule patient={safePatient} onClose={() => setActiveVrModuleId(null)} />
            )}
            {activeVrModuleId === 'TDAH_EXECUTIVE' && (
              <VrModuleRouter
                patient={safePatient}
                initialModuleId="TDAH_EXECUTIVE"
                onClose={() => setActiveVrModuleId(null)}
              />
            )}
            {activeVrModuleId === 'TEA_SENSORY' && (
              <VrModuleRouter
                patient={safePatient}
                initialModuleId="TEA_SENSORY"
                onClose={() => setActiveVrModuleId(null)}
              />
            )}
            {!['GAMMA_INSIGHT', 'EMDR_MEMORY', 'FND_MIRROR', 'PAIN_MANAGEMENT', 'NEURO_HYPNOSIS', 'DEV_TRAUMA', 'DUAL_CONTROL_SES_SIS', 'TDAH_EXECUTIVE', 'TEA_SENSORY'].includes(activeVrModuleId) && (
              <VrModuleRouter
                patient={safePatient}
                initialModuleId={activeVrModuleId}
                onClose={() => setActiveVrModuleId(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* 2. CONSOLA INMERSIVA UNIFICADA (IA + VR) */}
      {isFullscreenUnifiedVrOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 lg:p-8 overflow-y-auto flex items-center justify-center animate-fadeIn">
          <div className="relative w-full max-w-7xl max-h-[94vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4">
            <AmieUnifiedVrConsole
              patient={safePatient}
              onClose={() => setIsFullscreenUnifiedVrOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 3. FENOTIPADO DIGITAL & RECAÍDAS */}
      {isFullscreenPhenotypeOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 lg:p-8 overflow-y-auto flex items-center justify-center animate-fadeIn">
          <div className="relative w-full max-w-7xl max-h-[94vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4">
            <DigitalPhenotypeModule
              patient={safePatient}
              onClose={() => setIsFullscreenPhenotypeOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 4. ORQUESTADOR MAESTRO DE 30 ENTIDADES (FullscreenDiagnosticRunner) */}
      {isFullscreenDiagnosticOpen && (
        <FullscreenDiagnosticRunner
          patient={safePatient}
          initialDisorderId={diagnosticRunnerDisorderId}
          initialMode={diagnosticRunnerMode}
          onClose={() => setIsFullscreenDiagnosticOpen(false)}
          onUpdatePatientVrData={handleUpdatePatientVrData}
        />
      )}

      {/* 5. CONSOLA DE TRATAMIENTO GENÉRICA */}
      {isFullscreenConsoleOpen && (
        <FullscreenTreatmentConsole
          patient={safePatient}
          onClose={() => setIsFullscreenConsoleOpen(false)}
          onUpdatePatientVrData={handleUpdatePatientVrData}
        />
      )}

    </div>
  );
}

// ----------------------------------------------------------------------------
// ENRUTADOR PRINCIPAL
// ----------------------------------------------------------------------------
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/doctor" replace />} />
        <Route path="/doctor" element={<DoctorWorkstation />} />
        <Route path="/visor" element={<VrPatientExperience />} />
        <Route path="/paciente" element={<VrPatientExperience />} />
        <Route path="/vr" element={<VrPatientExperience />} />
        <Route path="*" element={<Navigate to="/doctor" replace />} />
      </Routes>
    </Router>
  );
}
