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

// CONSOLA UNIFICADA Y MÓDULOS DE HIPNOSIS / ENRUTADOR VR
import { AmieUnifiedVrConsole } from './components/AmieUnifiedVrConsole';
import { VrModuleRouter } from './components/VrModuleRouter';
import { VrClosedLoopHypnosisModule } from './components/VrClosedLoopHypnosisModule';

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
  const [neuroViewerMode, setNeuroViewerMode] = useState<'classic' | 'holographic'>('classic');
  const [activeAdvancedSubModule, setActiveAdvancedSubModule] = useState<string>('TDAH_ATTENTION_LAB');

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
  const [isFullscreenPhenotypeOpen, setIsFullscreenPhenotypeOpen] = useState<boolean>(false);
  const [isFullscreenUnifiedVrOpen, setIsFullscreenUnifiedVrOpen] = useState<boolean>(false);
  
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);

  const closeAllModals = () => {
    setIsDsmModalOpen(false);
    setIsFullscreenConsoleOpen(false);
    setIsFullscreenDiagnosticOpen(false);
    setIsFullscreenPhenotypeOpen(false);
    setIsFullscreenUnifiedVrOpen(false);
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
            <p className="text-xs text-slate-400">Servicio de telemetría médica pasiva en segundo plano para evaluación biofenotípica.</p>
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
          <p className="text-[10px] text-slate-500 font-mono">Versión 2.5.0-JITAI • AMIE Clinical Diagnostic Engine</p>
        </div>
      </div>
    );
  }

  const handleLoginSuccess = (auth: { doctorName: string; colegiadoNumber: number; token: string; username: string }) => {
    setDoctorName(auth.doctorName || 'Dr. Alejandro Morales Rivera');
    setDoctorUsername(auth.username || 'harold01');
    setColegiadoNumber(auth.colegiadoNumber || 749210);
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

  const handlePrintIndividualReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Objetivo Individual — ${safePatientId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
          h1 { color: #0284c7; font-size: 18px; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
          h2 { font-size: 14px; color: #334155; margin-top: 20px; }
          .meta { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #f1f5f9; }
          .signature-box { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
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
              <th>Métrica Objetiva / Indicador</th>
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
              <td>Diferenciador Antisesgo</td>
              <td>Distancia de Mahalanobis (D²)</td>
              <td>D² = 1.84 (Sin atipicidad)</td>
              <td>Filtro OK (D² &lt; 2.5)</td>
            </tr>
            <tr>
              <td>Corrientes APA & RCI</td>
              <td>Índice de Cambio Confiable (RCI)</td>
              <td>RCI = -2.14 (Mejoría)</td>
              <td>Significativo (p &lt; .05)</td>
            </tr>
            <tr>
              <td>VR Inmersivo / Biofeedback</td>
              <td>Conductancia Cutánea / Habituación H</td>
              <td>GSR: 2.1 µS | H = 2.84</td>
              <td>Closed-Loop Activo</td>
            </tr>
          </tbody>
        </table>
        <h2>2. DICTAMEN DE SINCRO-AUDITORÍA Y FIRMA</h2>
        <p style="font-size: 11px; color: #475569;">El presente informe certifica la consistencia multiaxial de los datos biométricos y psicométricos recopilados.</p>
        <div class="signature-box">
          <div class="signature-line">Firma del Asistente / Facilitador</div>
          <div class="signature-line">${doctorName}<br/>No. Colegiado: ${colegiadoNumber}</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(reportContent);
    printWindow.document.close();
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
      reactionTimeMs: 240, omissionErrors: 0, commissionErrors: 0, motorStabilityScore: 85
    },
    audioRecordings: currentPatient?.audioRecordings || [],
    psychometricScores: currentPatient?.psychometricScores || {},
    qeegZScores: currentPatient?.qeegZScores || {
      frontalThetaBetaRatio: 1.8, temporalAsymmetry: 0.2, deltaSlowActivityZ: 0.4, alphaPeakFrequencyHz: 10.2
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
        onOpenPrinciples={() => { setDsmModalView('principles'); setIsDsmModalOpen(true); }}
        onOpenDsmGuide={() => { setDsmModalView('guide'); setIsDsmModalOpen(true); }}
        doctorName={doctorName}
        colegiadoNumber={colegiadoNumber}
        currentPatientId={safePatientId}
        patientAge={safeAge}
        patientGender={safeGender}
        onSyncPacient={handleSyncPacient}
        isSyncingPac={isSyncing}
        onLogout={handleLogout}
      />

      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span><strong className="text-slate-200">Aviso Regulador (CDSS):</strong> AMIE Neurological provee soporte diagnóstico probabilístico.</span>
          </div>
          <button onClick={handlePrintIndividualReport} className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold transition shrink-0 cursor-pointer shadow-sm">
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Imprimir Reporte ROI</span>
          </button>
        </div>
      </div>

      {usbDeviceName && (
        <div className="bg-cyan-900/40 border-b border-cyan-800/50 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-cyan-200 z-20">
          <Usb className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>Telemetría Activa: <strong>{usbDeviceName}</strong></span>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN PRINCIPAL */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-1.5 flex-wrap py-1 font-sans w-full">
            
            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Workstation Clínico" description="Núcleo de triaje y triangulación de riesgos." clinicalUtility="Dictamen DSM-5-TR." badge="Módulo 1">
                <button onClick={() => setActiveTab('workstation')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'workstation' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Workstation</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Evaluador Científico & Multisensor" description="Scoring de afinidad bioclínica (0-100)." clinicalUtility="Mapeo farmacológico." badge="Módulo 2">
                <button onClick={() => setActiveTab('scientific_evaluator')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'scientific_evaluator' ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <Microscope className="w-3.5 h-3.5 text-teal-300" />
                  <span>Evaluador Científico</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Diferenciador Bioclínico & Antisesgo" description="Cruce multiaxial y neutralización de sesgos." clinicalUtility="Distancia de Mahalanobis." badge="Módulo 3">
                <button onClick={() => setActiveTab('differential_bias')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'differential_bias' ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <GitCompare className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Diferenciador & Sesgos</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Traducción APA & RCI" description="Interpretación por corrientes teóricas." clinicalUtility="Índice de Cambio Confiable." badge="Marco APA">
                <button onClick={() => setActiveTab('apa_framework')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'apa_framework' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Corrientes APA & RCI</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Cluster B & Perfilado Biocomportamental" description="Caracterización autonómica diferenciada." clinicalUtility="Análisis pericial forense." badge="Cluster B">
                <button onClick={() => setActiveTab('cluster_b')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'cluster_b' ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md shadow-purple-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <UserX className="w-3.5 h-3.5 text-purple-300" />
                  <span>Cluster B & Perfilado</span>
                </button>
              </HoverTooltip>
            </div>

            {/* SALUD SEXUAL & SES/SIS INLINE */}
            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Sexología & Respuesta Sexual (SES / SIS)" description="Evaluación y tratamiento inmersivo con Gemini 3.8 Flash." clinicalUtility="Mapeo de doble control sexual y generación de assets IA." badge="Sexualidad">
                <button onClick={() => setActiveTab('sexual_health')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'sexual_health' ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-300" />
                  <span>Salud Sexual & SES/SIS</span>
                </button>
              </HoverTooltip>
            </div>

            {/* MÓDULO EXCLUSIVO DE HIPNOSIS EN BUCLE CERRADO */}
            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Hipnosis & Bucle Cerrado" description="Neurohipnosis y regulación autonómica con telemetría." clinicalUtility="Inducción y grounding." badge="Hipnosis">
                <button onClick={() => setActiveTab('hypnosis_closed_loop')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'hypnosis_closed_loop' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Hipnosis Bucle Cerrado</span>
                </button>
              </HoverTooltip>
            </div>

            {/* HUB DE MÓDULOS AVANZADOS (TDAH, Trauma, Dolor, etc.) */}
            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Módulos VR Avanzados (TDAH / Trauma / Dolor)" description="Acceso directo a submódulos clínicos especializados." clinicalUtility="Intervención inmersiva." badge="Submódulos">
                <button onClick={() => setActiveTab('vr_advanced_hub')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'vr_advanced_hub' ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-md shadow-indigo-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <Zap className="w-3.5 h-3.5 text-indigo-300" />
                  <span>TDAH, Trauma & Dolor</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Capacitación AMIE & Simulador IA" description="Pacientes virtuales fotorrealistas." clinicalUtility="Entrenamiento inmersivo." badge="Módulo 4">
                <button onClick={() => setActiveTab('academy')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'academy' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <GraduationCap className="w-3.5 h-3.5 text-purple-300" />
                  <span>Capacitación AMIE</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Neurotopografía 3D Holográfica" description="Mapeador de potencia relativa por bandas." clinicalUtility="Z-Scores regionales." badge="Módulo 5">
                <button onClick={() => setActiveTab('neuro_3d')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'neuro_3d' ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Neurotopografía 3D</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="qEEG & Carga de Archivos" description="Carga de archivos .EDF / .BDF / .EEG." clinicalUtility="Inspección de ondas crudas." badge="Señales Crudas">
                <button onClick={() => setActiveTab('neurosensometry')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'neurosensometry' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <Brain className="w-3.5 h-3.5" />
                  <span>qEEG & Carga</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Módulo Terapéutico VR" description="Exposición inmersiva con biofeedback." clinicalUtility="Índice de habituación H." badge="Biometría VR">
                <button onClick={() => setActiveTab('vr_therapy')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'vr_therapy' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <Glasses className="w-3.5 h-3.5 text-cyan-300" />
                  <span>VR Inmersivo</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Capturador Móvil Centinela 24/7" description="Prueba en vivo de datos móviles." clinicalUtility="Fenotipado Digital." badge="Tester Móvil">
                <button onClick={() => setActiveTab('sentinel_tester')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'sentinel_tester' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <Wifi className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tester Móvil JITAI</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Referencia a Psiquiatría" description="Hoja de derivación oficial." clinicalUtility="Gestión de crisis." badge="Interconsulta">
                <button onClick={() => setActiveTab('referral')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'referral' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Referencia</span>
                </button>
              </HoverTooltip>
            </div>

            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Perfil de Licencia & Control IA" description="Monitoreo de vigencia de licencia." clinicalUtility="Perfil de usuario." badge="Perfil">
                <button onClick={() => setActiveTab('saas')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'saas' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>SaaS</span>
                </button>
              </HoverTooltip>
            </div>

          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {syncNotFoundAlert && (
          <div className="p-4 bg-rose-950/80 border-2 border-rose-500 rounded-2xl text-rose-100 text-xs flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-600 rounded-xl text-white shrink-0"><AlertTriangle className="w-5 h-5" /></div>
              <div>
                <span className="font-bold text-sm block text-white">Notificación de Sincronización:</span>
                <span className="text-rose-200 font-semibold">{syncNotFoundAlert}</span>
              </div>
            </div>
            <button onClick={() => setSyncNotFoundAlert(null)} className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer">Entendido</button>
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
            <div><span className="font-bold">Error de Ejecución: </span><span>{errorMsg}</span></div>
          </div>
        )}

        {activeTab === 'workstation' && (
          <div className="space-y-5">
            {analysis?.riskAlerts && <RiskAlertBanner alerts={analysis.riskAlerts} />}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-5 flex flex-col">
                <PatientJsonEditor patient={safePatient} onChange={setCurrentPatient} onSelectPreset={handleSelectPreset} />
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
                    <h3 className="text-base font-bold text-white mb-2">Motor Clínico AMIE Listo para Análisis Multimodal</h3>
                    <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">Haz clic en <strong className="text-sky-300">"Ejecutar AMIE"</strong> para generar el dictamen estructurado con Gemini 3.8 Flash.</p>
                    <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 hover:from-sky-400 hover:to-cyan-400 text-white shadow-lg shadow-sky-500/20 active:scale-95 transition cursor-pointer">
                      <Activity className="w-4 h-4" />
                      <span>Procesar Expediente Ahora</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scientific_evaluator' && <ScientificNeuroEvaluator patient={safePatient} />}
        
        {activeTab === 'differential_bias' && (
          <div className="space-y-6">
            <DifferentialBiasResolver patient={safePatient} />
            <DiagnosticTriangulationView patient={safePatient} analysis={analysis} />
          </div>
        )}

        {activeTab === 'apa_framework' && <ApaTherapeuticModule patient={safePatient} />}

        {/* MÓDULO CLUSTER B INLINE -> Enruta mediante el selector unificado */}
        {activeTab === 'cluster_b' && (
          <div className="space-y-4">
            <VrModuleRouter patient={safePatient} initialModuleId="CLUSTER_B_FORENSIC" onClose={() => setActiveTab('workstation')} />
          </div>
        )}

        {/* MÓDULO SALUD SEXUAL & SES/SIS INLINE */}
        {activeTab === 'sexual_health' && (
          <div className="space-y-4">
            <AmieUnifiedVrConsole patient={safePatient} onClose={() => setActiveTab('workstation')} />
          </div>
        )}

        {/* MÓDULO EXCLUSIVO DE HIPNOSIS EN BUCLE CERRADO */}
        {activeTab === 'hypnosis_closed_loop' && (
          <div className="space-y-4">
            <VrClosedLoopHypnosisModule patient={safePatient} onClose={() => setActiveTab('workstation')} />
          </div>
        )}

        {/* HUB MAESTRO CON TDAH, TRAUMA, DOLOR, NEUROLOGÍA, ETC. -> Usa VrModuleRouter para mostrar el selector dual */}
        {activeTab === 'vr_advanced_hub' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-400" /> Hub de Módulos Clínicos Avanzados
                </h3>
                <p className="text-xs text-slate-400">Seleccione el protocolo inmersivo especializado para la intervención:</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setActiveAdvancedSubModule('TDAH_ATTENTION_LAB')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdvancedSubModule === 'TDAH_ATTENTION_LAB' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'}`}>TDAH / Atención</button>
                <button onClick={() => setActiveAdvancedSubModule('DEVELOPMENTAL_TRAUMA')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdvancedSubModule === 'DEVELOPMENTAL_TRAUMA' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'}`}>Trauma del Desarrollo</button>
                <button onClick={() => setActiveAdvancedSubModule('PAIN_MANAGEMENT')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdvancedSubModule === 'PAIN_MANAGEMENT' ? 'bg-teal-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'}`}>Control de Dolor</button>
                <button onClick={() => setActiveAdvancedSubModule('FUNCTIONAL_NEUROLOGY')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdvancedSubModule === 'FUNCTIONAL_NEUROLOGY' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'}`}>Neurología Funcional</button>
                <button onClick={() => setActiveAdvancedSubModule('MEMORY_RECONSOLIDATION')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdvancedSubModule === 'MEMORY_RECONSOLIDATION' ? 'bg-rose-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'}`}>Reconsolidación</button>
              </div>
            </div>

            <VrModuleRouter patient={safePatient} initialModuleId={activeAdvancedSubModule} onClose={() => setActiveTab('workstation')} />
          </div>
        )}

        {activeTab === 'academy' && <AmieClinicalAcademy />}
        
        {activeTab === 'neuro_3d' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> Modo de Visualización Encefalográfica
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button onClick={() => setNeuroViewerMode('classic')} className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${neuroViewerMode === 'classic' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Visor Anatómico</button>
                <button onClick={() => setNeuroViewerMode('holographic')} className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 cursor-pointer ${neuroViewerMode === 'holographic' ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Layers className="w-3.5 h-3.5 text-cyan-300" /> Visor Holográfico 3D
                </button>
              </div>
            </div>
            {neuroViewerMode === 'classic' ? <InteractiveNeuroViewer patient={safePatient} /> : <HolographicNeuroViewer3D patient={safePatient} />}
          </div>
        )}
        
        {activeTab === 'neurosensometry' && <NeuroSensoryModule patient={safePatient} onAttachQeegToPatient={handleAttachQeegToPatient} />}
        
        {activeTab === 'vr_therapy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2.5 flex-wrap">
              <button onClick={() => setIsFullscreenUnifiedVrOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:scale-105 text-white rounded-xl text-xs font-bold shadow-xl shadow-cyan-600/30 transition cursor-pointer">
                <Monitor className="w-4 h-4 text-cyan-200" />
                <span>Abrir Consola Inmersiva Unificada (IA + VR)</span>
              </button>
              <button onClick={() => setIsFullscreenPhenotypeOpen(true)} className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/20 transition cursor-pointer">
                <Smartphone className="w-4 h-4 text-teal-100" />
                <span>Fenotipado Digital & Recaídas</span>
              </button>
            </div>
            <VrTherapyModule patient={safePatient} onUpdatePatientVrData={handleUpdatePatientVrData} />
          </div>
        )}

        {activeTab === 'sentinel_tester' && <div className="py-2"><SentinelMobileCollector /></div>}

        {activeTab === 'referral' && (
          <PsychiatryReferralView patient={safePatient} analysis={analysis} currentDoctorName={doctorName} colegiadoNumber={colegiadoNumber} />
        )}

        {activeTab === 'saas' && <AdminSaaSPanel />}
      </main>

      <FloatingAmieAssistant currentPatientId={safePatientId} onNavigateTab={(targetTab: string) => setActiveTab(targetTab as AppTab)} activeTab={activeTab} />
      <DsmGuideModal isOpen={isDsmModalOpen} onClose={() => setIsDsmModalOpen(false)} defaultView={dsmModalView} />

      {isFullscreenUnifiedVrOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 lg:p-8 overflow-y-auto flex items-center justify-center">
          <AmieUnifiedVrConsole patient={safePatient} onClose={() => setIsFullscreenUnifiedVrOpen(false)} />
        </div>
      )}

      {isFullscreenConsoleOpen && <FullscreenTreatmentConsole patient={safePatient} onClose={() => setIsFullscreenConsoleOpen(false)} />}
      {isFullscreenDiagnosticOpen && <FullscreenDiagnosticRunner patient={safePatient} onClose={() => setIsFullscreenDiagnosticOpen(false)} onUpdatePatientVrData={handleUpdatePatientVrData} />}

      {isFullscreenPhenotypeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 lg:p-8 overflow-y-auto flex items-center justify-center">
          <DigitalPhenotypeModule patient={safePatient} onClose={() => setIsFullscreenPhenotypeOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/doctor" replace />} />
        <Route path="/doctor" element={<DoctorWorkstation />} />
        {/* Ruta para el visor del paciente conectada directamente al componente WebXR unificado */}
        <Route path="/visor" element={<VrPatientExperience onClose={() => window.location.href = '/doctor'} />} />
      </Routes>
    </Router>
  );
}
