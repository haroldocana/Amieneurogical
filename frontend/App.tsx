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
import { PsychiatryReferralView } from './components/PsychiatryReferralView';
import { AdminSaaSPanel } from './components/AdminSaaSPanel';
import { AmieClinicalAcademy } from './components/AmieClinicalAcademy';
import { FloatingAmieAssistant } from './components/FloatingAmieAssistant';
import { HoverTooltip } from './components/HoverTooltip';
import { LoginModal } from './components/LoginModal';
import { PatientRecord, AmieClinicalAnalysis } from './types';
import { CLINICAL_CASE_PRESETS } from './constants';
import { runAmieClinicalAnalysis, syncWithClinicalApp, SAFE_DEFAULT_PATIENT } from './services/geminiService';
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
  AlertTriangle
} from 'lucide-react';

type AppTab = 'workstation' | 'scientific_evaluator' | 'differential_bias' | 'academy' | 'neuro_3d' | 'neurosensometry' | 'referral' | 'saas';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. Alejandro Morales Rivera');
  const [doctorUsername, setDoctorUsername] = useState('harold01');
  const [colegiadoNumber, setColegiadoNumber] = useState<number>(749210);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<AppTab>('workstation');

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

  // Modals
  const [isDsmModalOpen, setIsDsmModalOpen] = useState(false);
  const [dsmModalView, setDsmModalView] = useState<'guide' | 'principles'>('principles');

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

  const handleLoginSuccess = (auth: { doctorName: string; colegiadoNumber: number; token: string; username: string }) => {
    setDoctorName(auth.doctorName || 'Dr. Alejandro Morales Rivera');
    setDoctorUsername(auth.username || 'harold01');
    setColegiadoNumber(auth.colegiadoNumber || 749210);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('amie_auth_token');
      localStorage.removeItem('amie_doctor_name');
      localStorage.removeItem('amie_username');
      localStorage.removeItem('amie_doctor_username');
      localStorage.removeItem('amie_colegiado_number');
      localStorage.removeItem('amie_ai_credits');
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
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al conectar con el motor clínico AMIE.');
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
    } catch (err: any) {
      if (err?.message && err.message.includes('no existe o no tiene datos cargados')) {
        setSyncNotFoundAlert(err.message);
      } else {
        setErrorMsg('Error de comunicación con Cloud Function: ' + (err?.message || 'Fallo de conexión'));
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
        {activeTab === 'differential_bias' && <DifferentialBiasResolver patient={currentPatient} />}
        {activeTab === 'academy' && <AmieClinicalAcademy />}
        {activeTab === 'neuro_3d' && <InteractiveNeuroViewer patient={currentPatient} />}
        {activeTab === 'neurosensometry' && <NeuroSensoryModule />}
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
    </div>
  );
}
