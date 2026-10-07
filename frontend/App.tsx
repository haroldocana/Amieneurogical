import React, { useState, useEffect } from 'react';
// IMPORTACIONES DE ENRUTAMIENTO Y VISUALIZADOR AÑADIDAS
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PicoVisorApp } from './components/PicoVisorApp';

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
import { VrModuleRouter } from './components/VrModuleRouter';
import { VrGammaInsightModule } from './components/VrGammaInsightModule';
import { VrDevelopmentalTraumaFullscreenMonitor } from './components/VrDevelopmentalTraumaFullscreenMonitor';
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

// 1. RENOMBRAMOS EL COMPONENTE ACTUAL A DoctorWorkstation
function DoctorWorkstation() {
  const [isPatientMode, setIsPatientMode] = useState<boolean>(false);
  const [isCheckingPlatform, setIsCheckingPlatform] = useState<boolean>(true);

  // -----------------------------------------------------------------------
  // DETECCIÓN DIRECTA PARA DISPOSITIVOS MÓVILES Y APK
  // -----------------------------------------------------------------------
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

  // MODALES PANTALLA COMPLETA
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
  const [isFullscreenDevTraumaOpen, setIsFullscreenDevTraumaOpen] = useState<boolean>(false);

  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);

  const closeAllModals = () => {
    setIsDsmModalOpen(false);
    setIsFullscreenConsoleOpen(false);
    setIsFullscreenDiagnosticOpen(false);
    setIsFullscreenHypnosisOpen(false);
    setIsFullscreenPhenotypeOpen(false);
    setIsFullscreenPainOpen(false);
    setIsFullscreenFndOpen(false);
    setIsFullscreenMemoryOpen(false);
    setIsFullscreenExecOpen(false);
    setIsFullscreenGammaOpen(false);
    setIsFullscreenDevTraumaOpen(false);
  };

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
      console.warn('Acceso a localStorage restringido:', e);
    }
  }, []);

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

  // -----------------------------------------------------------------------
  // VISTA PACIENTE / MÓVIL
  // -----------------------------------------------------------------------
  if (isCheckingPlatform) {
    return <div className="min-h-screen bg-slate-950"></div>;
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
  // VISTA WORKSTATION MÉDICA COMPLETA
  // -----------------------------------------------------------------------
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
      console.warn('Error en cierre de sesión:', e);
    }
    closeAllModals();
    setIsAuthenticated(false);
  };

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
          setAnalysis(sync
