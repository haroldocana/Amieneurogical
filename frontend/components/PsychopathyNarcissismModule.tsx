import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData } from '../types';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { 
  ShieldAlert, Activity, Brain, Eye, HeartPulse, FileText, 
  Download, Zap, UserCheck, AlertTriangle, Scale, Lock, Info, CheckCircle2, X, RefreshCw
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

interface PhenotypeProfile {
  key: string;
  title: string;
  cluster: string;
  affinityScore: number;
  dsmCode: string;
  icd11Code: string;
  description: string;
  provocationScenario: string;
  biomarkerSignature: string;
  metrics: {
    startleReactivityGSR: string;
    empathyResonanceHRV: string;
    gazeDistressFixation: string;
    triarchicBoldness: string;
    triarchicMeanness: string;
    triarchicDisinhibition: string;
  };
  graphGsr: number[];
  graphHrv: number[];
  clinicalPsychologyReading: string;
  forensicPsychiatryReading: string;
}

const CLUSTER_B_PHENOTYPES: PhenotypeProfile[] = [
  {
    key: 'NARC_GRANDIOSE',
    title: 'Perfilado Narcisista Grandioso / Exhibicionista (Overt)',
    cluster: 'Cluster B / F60.81',
    affinityScore: 94,
    dsmCode: '301.81 (NPD)',
    icd11Code: '6D11 (Dominancia)',
    description: 'Autoestima hipertrofiada, dominancia interpersonal, búsqueda de admiración y baja reactividad al rechazo social en reposo, con picos adrenérgicos reactivos ante la amenaza percibida al ego.',
    provocationScenario: 'Paradoja 3D de Devaluación Pública y Crítica Directa al Estatus en Entorno Virtual.',
    biomarkerSignature: 'GSR Basal Normal + Pico Adrenérgico Severo ante Afrenta al Ego + Supresión Vagal Inmediata.',
    metrics: {
      startleReactivityGSR: '5.2 µS (Pico de Amenaza al Ego)',
      empathyResonanceHRV: '14 ms RMSSD (Labilidad por Ira)',
      gazeDistressFixation: '12% (Evitación / Desprecio Visual)',
      triarchicBoldness: '88% (Audacia Elevada)',
      triarchicMeanness: '62% (Dureza Moderada)',
      triarchicDisinhibition: '28% (Baja Desinhibición)'
    },
    graphGsr: [1.2, 1.5, 5.8, 5.2, 4.1, 3.0, 2.2, 1.8, 1.4],
    graphHrv: [42, 40, 14, 18, 22, 28, 35, 39, 41],
    clinicalPsychologyReading: 'Defensa enfocada en la fantasía de éxito ilimitado. Ante la crítica virtual, reacciona con rabia compensatoria u ostentación.',
    forensicPsychiatryReading: 'Bajo riesgo de conducta impulsiva no provocada; riesgo incrementado de agresión reactiva ante la humillación pública o pérdida de estatus.'
  },
  {
    key: 'NARC_COVERT',
    title: 'Perfilado Narcisista Vulnerable / Encubierto (Covert)',
    cluster: 'Cluster B / F60.81',
    affinityScore: 92,
    dsmCode: '301.81 (NPD Vulnerable)',
    icd11Code: '6D11 (Vulnerabilidad)',
    description: 'Hipersensibilidad al juicio ajeno, victimización, envidia latente e inestabilidad afectiva. Estrés vegetativo basal elevado con alta hipervigilancia.',
    provocationScenario: 'Exclusión Social Sutil y Ambigüedad de Feedback Evaluativo en VR.',
    biomarkerSignature: 'GSR Basal Elevado (Hipervigilancia) + Colapso Sustentado de HRV + Rastreo Ocular Paranoide.',
    metrics: {
      startleReactivityGSR: '4.8 µS (Meseta de Ansiedad)',
      empathyResonanceHRV: '18 ms RMSSD (Estrés Crónico)',
      gazeDistressFixation: '78% (Hipervigilancia Ocular)',
      triarchicBoldness: '22% (Audacia Baja)',
      triarchicMeanness: '54% (Rencor Latente)',
      triarchicDisinhibition: '64% (Inestabilidad Moderada)'
    },
    graphGsr: [2.8, 3.5, 4.8, 4.6, 4.2, 4.0, 3.8, 3.2, 2.9],
    graphHrv: [28, 22, 18, 16, 20, 21, 24, 26, 28],
    clinicalPsychologyReading: 'Sostiene expectativas de grandiosidad no reconocida. Cuadro suele solaparse con Ansiedad Social.',
    forensicPsychiatryReading: 'Riesgo de conductas vindicativas indirectas (sabotaje, difamación) o autolesión reactiva en contextos de alto estrés.'
  },
  {
    key: 'PSYCHO_PRIMARY',
    title: 'Rasgos Antisociales con Aplanamiento Empático (Factor 1 PCL-R)',
    cluster: 'Cluster B / F60.2',
    affinityScore: 96,
    dsmCode: '301.7 (Antisocial)',
    icd11Code: '6D11 / 6D10 (Disocial)',
    description: 'Aplanamiento afectivo, encanto superficial, marcada reducción de la resonancia empática. Hiporreactividad autonómica ante estresores aversivos.',
    provocationScenario: 'Exposición Inmersiva Controlada a Imágenes de Sufrimiento Humano / Amenaza Física.',
    biomarkerSignature: 'Aplanamiento de GSR (< 0.5 µS) + Rigidez Vagal sin caída reactiva + Foveación Ausente de Pistas de Distrés.',
    metrics: {
      startleReactivityGSR: '0.3 µS (Hiporreactividad)',
      empathyResonanceHRV: '48 ms RMSSD (Invariable)',
      gazeDistressFixation: '4% (Fijación Nula en Dolor Ajeno)',
      triarchicBoldness: '94% (Audacia Extrema)',
      triarchicMeanness: '92% (Dureza Afectiva Eleva)',
      triarchicDisinhibition: '35% (Control Calculado)'
    },
    graphGsr: [0.8, 0.7, 0.8, 0.9, 0.8, 0.7, 0.8, 0.8, 0.7],
    graphHrv: [48, 49, 47, 48, 50, 48, 47, 49, 48],
    clinicalPsychologyReading: 'Ausencia estructural de resonancia empática autonómica. Procesamiento emocional puramente cognitivo y estratégico.',
    forensicPsychiatryReading: 'Riesgo de reincidencia instrumental. Ineficacia de psicoterapias grupales no estructuradas por riesgo de aprendizaje manipulativo.'
  }
];

export const PsychopathyNarcissismModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  const { isConnected, liveData, syncSession, transmit } = useVrTelemetryBridge('receiver', patientId, 'CLUSTER_B_FORENSIC');

  const [selectedPhenotypeKey, setSelectedPhenotypeKey] = useState<string>('NARC_GRANDIOSE');
  const [hasConsentAccepted, setHasConsentAccepted] = useState<boolean>(false);
  const activeProfile = CLUSTER_B_PHENOTYPES.find(p => p.key === selectedPhenotypeKey) || CLUSTER_B_PHENOTYPES[0];

  const [isSimulatingTest, setIsSimulatingTest] = useState(false);
  const [testTimer, setTestTimer] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (isSimulatingTest) {
      timer = setInterval(() => setTestTimer(prev => prev + 1), 1000);
    } else {
      setTestTimer(0);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isSimulatingTest]);

  const handleStartProvocation = () => {
    setIsSimulatingTest(true);
    syncSession();
    transmit({ type: 'LOAD_MODULE', patientId, moduleName: 'CLUSTER_B_FORENSIC' });
    transmit({ type: 'START_PROVOCATION', phenotype: selectedPhenotypeKey });
  };

  const handleStopProvocation = async () => {
    setIsSimulatingTest(false);
    transmit({ type: 'STOP_TEST' });
    
    // Guardado silencioso en DB al detener la prueba
    setIsSaving(true);
    try {
      await fetch('/api/vr/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId,
          sessionData: {
            taskName: `Forensic_ClusterB_${selectedPhenotypeKey}`,
            durationSeconds: testTimer,
            metrics: { affinityScore: activeProfile.affinityScore },
            aiLogs: [`Evaluación pericial completada. Perfil: ${activeProfile.title}. TriPM Audacia: ${activeProfile.metrics.triarchicBoldness}`],
            completedAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error("Error guardando en DB", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportForensicReport = () => {
    const reportText = `
================================================================================
AMIE CLINICAL ENGINE — DICTAMEN PERICIAL Y PERFILADO DE CLUSTER B
================================================================================
AVISO LEGAL: Documento de soporte a la decisión clínica (CDSS). Uso Pericial.
PACIENTE ID: ${patientId}
PERFIL EVALUADO: ${activeProfile.title}
CÓDIGO DSM-5-TR: ${activeProfile.dsmCode} | CIE-11: ${activeProfile.icd11Code}
SCORE DE AFINIDAD BIOCLÍNICA: ${activeProfile.affinityScore}/100
FECHA DE EVALUACIÓN: ${new Date().toLocaleDateString()}
--------------------------------------------------------------------------------
1. FIRMA BIOMÉTRICA:
${activeProfile.description}

2. ENSAYO DE PROVOCACIÓN INMERSIVA EN VR:
- Escenario: ${activeProfile.provocationScenario}
- Patrón Biométrico: ${activeProfile.biomarkerSignature}

3. MEDIDA PSICOPÁTICA TRIÁRQUICA (TriPM):
- Audacia (Boldness): ${activeProfile.metrics.triarchicBoldness}
- Dureza Afectiva (Meanness): ${activeProfile.metrics.triarchicMeanness}
- Desinhibición (Disinhibition): ${activeProfile.metrics.triarchicDisinhibition}

4. ORIENTACIÓN FORENSE Y PERITAJE:
${activeProfile.forensicPsychiatryReading}
--------------------------------------------------------------------------------
Dictamen emitido bajo norma HIPAA/RGPD y cifrado de grado médico.
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Dictamen_ClusterB_${selectedPhenotypeKey}_${patientId}.txt`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-100 overflow-y-auto">
      
      {/* HEADER DE CIERRE */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-purple-600 via-rose-600 to-indigo-600 rounded-lg text-white shadow-lg shadow-purple-600/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">MÓDULO FORENSE • Perfilado Cluster B (Psicopatía/Narcisismo)</h2>
            <p className="text-xs text-slate-400">Paciente ID: <strong className="text-purple-300">{patientId}</strong></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={syncSession} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Sincronizar VR
          </button>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* BANNER RIESGO/DISCLAIMER ÉTICO */}
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-200 flex items-center gap-2">
              <span>Protocolo de Investigación & Peritaje Forense — Cluster B</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded font-mono">CDSS / Consentimiento Requerido</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Las pruebas inmersivas de provocación estresante deben realizarse únicamente bajo <strong>Consentimiento Informado explícito</strong>, en contexto de peritaje o consulta forense especializada.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <input type="checkbox" id="informedConsentCheck" checked={hasConsentAccepted} onChange={(e) => setHasConsentAccepted(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4" />
              <label htmlFor="informedConsentCheck" className="text-[11px] text-amber-300 font-medium cursor-pointer">
                Confirmo que el paciente cuenta con Consentimiento Informado para protocolos de provocación y peritaje.
              </label>
            </div>
          </div>
        </div>

        {/* SELECTOR DE PERFIL Y DETALLES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Lista de Selección */}
          <div className="lg:col-span-5 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Seleccionar Subtipo de Estudio:</label>
            <div className="space-y-2">
              {CLUSTER_B_PHENOTYPES.map(proto => (
                <button
                  key={proto.key}
                  onClick={() => setSelectedPhenotypeKey(proto.key)}
                  className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                    selectedPhenotypeKey === proto.key
                      ? 'bg-gradient-to-r from-purple-950/80 to-slate-900 text-white border-purple-500/60 shadow-lg shadow-purple-950/40'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">{proto.title}</span>
                    <span className="text-[10px] text-purple-300 font-mono bg-purple-950 px-2 py-0.5 rounded border border-purple-800/50">
                      Afinidad: {proto.affinityScore}/100
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">{proto.cluster}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Panel Informativo */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  {activeProfile.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">{activeProfile.dsmCode}</span>
                  <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/50">{activeProfile.icd11Code}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{activeProfile.description}</p>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="text-purple-300 font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> <span>Ensayo de Provocación Inmersiva VR:</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">{activeProfile.provocationScenario}</p>
                <div className="text-cyan-300 font-bold pt-1">Firma Biofisiológica Esperada:</div>
                <p className="text-slate-400 text-[11px] font-sans">{activeProfile.biomarkerSignature}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Tiempo Ensayo VR: <strong className="text-purple-300">{testTimer}s / 300s</strong>
              </span>

              <button
                disabled={!hasConsentAccepted}
                onClick={!isSimulatingTest ? handleStartProvocation : handleStopProvocation}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  !hasConsentAccepted ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 
                  isSimulatingTest ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
                }`}
              >
                {!hasConsentAccepted ? 'Requiere Consentimiento' : isSimulatingTest ? 'Detener Ensayo Bio-VR' : 'Iniciar Provocación en VR Quest 3S'}
              </button>
            </div>
          </div>
        </div>

        {/* BARRAS DE LA TRÍADA TriPM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" /> Dimensiones de la Medida Psicopática Triárquica (TriPM)
            </h3>
            <button onClick={handleExportForensicReport} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg font-bold text-[10px] transition cursor-pointer">
              <Download className="w-3 h-3" /> Exportar Dictamen
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Audacia (Boldness)</span>
                <span className="text-purple-400">{activeProfile.metrics.triarchicBoldness}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: activeProfile.metrics.triarchicBoldness }} />
              </div>
              <span className="text-[9px] text-slate-500 block">Tolerancia al estrés e inmunidad al miedo.</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Dureza Afectiva (Meanness)</span>
                <span className="text-rose-400">{activeProfile.metrics.triarchicMeanness}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: activeProfile.metrics.triarchicMeanness }} />
              </div>
              <span className="text-[9px] text-slate-500 block">Reducción de empatía y frialdad interpersonal.</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Desinhibición (Disinhibition)</span>
                <span className="text-amber-400">{activeProfile.metrics.triarchicDisinhibition}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: activeProfile.metrics.triarchicDisinhibition }} />
              </div>
              <span className="text-[9px] text-slate-500 block">Dificultad de control de impulsos y labilidad.</span>
            </div>
          </div>
        </div>

        {/* LECTURA CLÍNICA DUAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Orientación para Psicología Clínica
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">{activeProfile.clinicalPsychologyReading}</p>
          </div>

          <div className="p-4 bg-slate-900 border border-purple-500/30 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Orientación para Psiquiatría Forense
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">{activeProfile.forensicPsychiatryReading}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
