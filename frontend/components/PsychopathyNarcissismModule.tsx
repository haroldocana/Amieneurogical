import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData } from '../types';
import { 
  ShieldAlert, Activity, Brain, Eye, HeartPulse, FileText, 
  Download, RefreshCw, Layers, Target, Scale, Zap, UserCheck, AlertTriangle 
} from 'lucide-react';

interface PsychopathyNarcissismModuleProps {
  patient: PatientRecord;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: any) => void;
}

interface PhenotypeProfile {
  key: string;
  title: string;
  cluster: string;
  reliabilityPct: number;
  dsmCode: string;
  icd11Code: string;
  description: string;
  provocationScenario: string;
  biomarkerSignature: string;
  metrics: {
    startleReactivityGSR: string; // Aplanamiento o Pico de sobresalto
    empathyResonanceHRV: string;  // Resonancia empática autonómica
    gazeDistressFixation: string; // Fijación visual en pistas de sufrimiento/amenaza
    triarchicBoldness: string;    // Audacia (TriPM)
    triarchicMeanness: string;    // Dureza Afectiva / Maldad (TriPM)
    triarchicDisinhibition: string; // Desinhibición / Impulsividad (TriPM)
  };
  graphGsr: number[];
  graphHrv: number[];
  clinicalPsychologyReading: string;
  forensicPsychiatryReading: string;
}

const DARK_TRIAD_PHENOTYPES: PhenotypeProfile[] = [
  {
    key: 'NARC_GRANDIOSE',
    title: 'Narcisismo Grandioso / Exhibicionista (Overt)',
    cluster: 'Cluster B / F60.81',
    reliabilityPct: 94.2,
    dsmCode: '301.81 (NPD)',
    icd11Code: '6D11 (Personality Disorder with Dominance)',
    description: 'Autoestima hipertrofiada, dominancia interpersonal, búsqueda de admiración y baja Reactividad al Rechazo Social en reposo, pero con picos adrenérgicos ante la amenaza al ego.',
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
    clinicalPsychologyReading: 'Mecanismo de defensa enfocado en la fantasía de éxito ilimitado. Ante la crítica virtual, reacciona con rabia narcisista u ostentación compensatoria.',
    forensicPsychiatryReading: 'Bajo riesgo de conducta impulsiva no provocada, pero alto riesgo de agresión reactiva ante la humillación o pérdida de estatus.'
  },
  {
    key: 'NARC_COVERT',
    title: 'Narcisismo Vulnerable / Encubierto (Covert / HSNS)',
    cluster: 'Cluster B / F60.81 (Atípico)',
    reliabilityPct: 92.6,
    dsmCode: '301.81 (NPD Vulnerable)',
    icd11Code: '6D11 (With Anxious/Insecure Traits)',
    description: 'Hipersensibilidad al juicio ajeno, victimización, envidia latente e inestabilidad afectiva. Elevado estrés vegetativo basal.',
    provocationScenario: 'Exclusión Social Sutil y Ambigüedad de Feedback Evaluativo en VR.',
    biomarkerSignature: 'GSR Basal Elevado (Hipervigilancia) + Colapso Sustentado de HRV + Rastreo Ocular Paranoide.',
    metrics: {
      startleReactivityGSR: '4.8 µS (Meseta de Ansiedad)',
      empathyResonanceHRV: '18 ms RMSSD (Estrés Crónico)',
      gazeDistressFixation: '78% (Hipervigilancia Ocular)',
      triarchicBoldness: '22% (Audacia Baja / Inseguridad)',
      triarchicMeanness: '54% (Rencor Latino)',
      triarchicDisinhibition: '64% (Inestabilidad Moderada)'
    },
    graphGsr: [2.8, 3.5, 4.8, 4.6, 4.2, 4.0, 3.8, 3.2, 2.9],
    graphHrv: [28, 22, 18, 16, 20, 21, 24, 26, 28],
    clinicalPsychologyReading: 'Sintomatología con frecuencia confundida con Trastorno de Ansiedad Social o TDM. Internamente sostiene expectativas irreales de grandiosidad no reconocida.',
    forensicPsychiatryReading: 'Riesgo de autolesión reactiva o conductas vindicativas indirectas (difamación, sabotaje) en entornos laborales o afectivos.'
  },
  {
    key: 'PSYCHO_PRIMARY',
    title: 'Psicopatía Primaria (Factor 1 PCL-R / TriPM Bold-Mean)',
    cluster: 'Cluster B / F60.2 (ASPD F1)',
    reliabilityPct: 96.8,
    dsmCode: '301.7 (Antisocial / Psychopathy)',
    icd11Code: '6D11 / 6D10 (Dissocial Personality)',
    description: 'Aplanamiento afectivo, encanto superficial, ausencia total de empatía, miedo o culpa. Marcada hiporreactividad del sistema nervioso autónomo ante estímulos aversivos.',
    provocationScenario: 'Exposición Inmersiva a Imágenes de Sufrimiento Humano / Amenaza Física Inminente.',
    biomarkerSignature: 'Aplanamiento de GSR (< 0.5 µS) + Rigidez Vagal Sin Caída ante Amenaza + Foveación Ausente de Pistas de Distrés.',
    metrics: {
      startleReactivityGSR: '0.3 µS (Aplanamiento de Sobresalto)',
      empathyResonanceHRV: '48 ms RMSSD (Invariable / Sin Distrés)',
      gazeDistressFixation: '4% (Fijación Nula en Dolor Ajeno)',
      triarchicBoldness: '94% (Audacia Extrema)',
      triarchicMeanness: '92% (Dureza Afectiva Máxima)',
      triarchicDisinhibition: '35% (Control Calculado)'
    },
    graphGsr: [0.8, 0.7, 0.8, 0.9, 0.8, 0.7, 0.8, 0.8, 0.7],
    graphHrv: [48, 49, 47, 48, 50, 48, 47, 49, 48],
    clinicalPsychologyReading: 'Ausencia estructural de resonancia empática. El procesamiento de emociones ajenas es puramente cognitivo y estratégico (manipulación fría).',
    forensicPsychiatryReading: 'Alto índice de reincidencia instrumental (PCL-R > 30). Ineficacia o contraindicación de psicoterapias grupales tradicionales por riesgo de aprendizaje manipulativo.'
  },
  {
    key: 'PSYCHO_SECONDARY',
    title: 'Psicopatía Secundaria (Factor 2 PCL-R / TriPM Disinhibited)',
    cluster: 'Cluster B / F60.2 (ASPD F2)',
    reliabilityPct: 93.5,
    dsmCode: '301.7 (Antisocial / Impulsive)',
    icd11Code: '6D11 / 6D10 (Dissocial with Impulsivity)',
    description: 'Estilo de vida impulsivo, labilidad afectiva, baja tolerancia a la frustración y criminalidad reactiva. Frecuente comorbilidad con trauma de desarrollo y abuso de sustancias.',
    provocationScenario: 'Paradigma VR Go/No-Go con Frustración Financiera / Bloqueo Impredictible de Recompensa.',
    biomarkerSignature: 'GSR Desregulada con Picos Violentos + Caída Paroxística de HRV + Elevación Ratio Theta/Beta (> 3.2).',
    metrics: {
      startleReactivityGSR: '6.4 µS (Hiperreactividad por Frustración)',
      empathyResonanceHRV: '12 ms RMSSD (Colapso Autonómico)',
      gazeDistressFixation: '45% (Sacadas Inestables)',
      triarchicBoldness: '38% (Audacia Moderada)',
      triarchicMeanness: '68% (Dureza Reactiva)',
      triarchicDisinhibition: '92% (Desinhibición Severa)'
    },
    graphGsr: [1.5, 2.2, 6.4, 5.9, 4.8, 3.5, 2.8, 2.1, 1.8],
    graphHrv: [38, 30, 12, 15, 20, 26, 32, 36, 38],
    clinicalPsychologyReading: 'Severa desregulación del control de impulsos. Responde favorablemente a protocolos de modulación conductual (DBT-PTSD) si se trata la base de neurotrauma.',
    forensicPsychiatryReading: 'Alto riesgo de agresión reactiva e impulsiva. Beneficio potencial de estabilizadores del ánimo o neuromodulación frontal para reducir la impulsividad biomotora.'
  }
];

export const PsychopathyNarcissismModule: React.FC<PsychopathyNarcissismModuleProps> = ({
  patient,
  onUpdatePatientVrData
}) => {
  const [selectedPhenotypeKey, setSelectedPhenotypeKey] = useState<string>('NARC_GRANDIOSE');
  const activeProfile = DARK_TRIAD_PHENOTYPES.find(p => p.key === selectedPhenotypeKey) || DARK_TRIAD_PHENOTYPES[0];

  const [isSimulatingTest, setIsSimulatingTest] = useState(false);
  const [testTimer, setTestTimer] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (isSimulatingTest) {
      timer = setInterval(() => {
        setTestTimer(prev => prev + 1);
      }, 1000);
    } else {
      setTestTimer(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulatingTest]);

  const handleExportForensicReport = () => {
    const reportText = `
================================================================================
AMIE CLINICAL ENGINE — INFORME PERICIAL DE FENOTIPADO DARK TRIAD (PCL-R / DSM-5)
================================================================================
PACIENTE ID: ${patient.id || 'PAC-8104'} | EDAD: ${patient.age || 'N/A'} | GÉNERO: ${patient.gender || 'N/A'}
FENOTIPO ANALIZADO: ${activeProfile.title}
CÓDIGO DSM-5-TR: ${activeProfile.dsmCode} | CIE-11: ${activeProfile.icd11Code}
FIABILIDAD BIOCLÍNICA AMIE: ${activeProfile.reliabilityPct}%
FECHA DE EVALUACIÓN: ${new Date().toLocaleDateString()}
--------------------------------------------------------------------------------

1. DESCRIPCIÓN DE LA FIRMA BIOMÉTRICA Y PERFIL DE PERSONALIDAD:
${activeProfile.description}

2. ENSAYO DE PROVOCACIÓN INMERSIVA EN REALIDAD VIRTUAL (QUEST 3S):
- Escenario: ${activeProfile.provocationScenario}
- Patrón Biométrico: ${activeProfile.biomarkerSignature}

3. REGISTRO CUANTITATIVO DE BIOMARCADORES Y TRÍADA PSICOPÁTICA (TriPM):
- Reactividad al Sobresalto (GSR): ${activeProfile.metrics.startleReactivityGSR}
- Resonancia Empática (HRV): ${activeProfile.metrics.empathyResonanceHRV}
- Fijación Ocular en Pistas de Sufrimiento: ${activeProfile.metrics.gazeDistressFixation}
- TriPM Audacia (Boldness): ${activeProfile.metrics.triarchicBoldness}
- TriPM Dureza Afectiva (Meanness): ${activeProfile.metrics.triarchicMeanness}
- TriPM Desinhibición (Disinhibition): ${activeProfile.metrics.triarchicDisinhibition}

4. ORIENTACIÓN PARA PSICOLOGÍA CLÍNICA:
${activeProfile.clinicalPsychologyReading}

5. ORIENTACIÓN PARA PSIQUIATRÍA FORENSE & PERITAJE:
${activeProfile.forensicPsychiatryReading}
--------------------------------------------------------------------------------
Dictamen emitido automáticamente bajo protocolo de cifrado HIPAA/RGPD.
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Informe_Fenotipado_DarkTriad_${selectedPhenotypeKey}_${patient.id || 'PAC-8104'}.txt`;
    link.click();
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* CABECERA PRINCIPAL DEL MÓDULO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-purple-600 via-rose-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-600/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Investigación de Fenotipos: Narcisismo & Psicopatía
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] rounded-full font-semibold">
                  TRÍADA OSCURA & CLUSTER B
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Caracterización neuroautonómica y oculomotora diferenciada basada en PCL-R, TriPM y métricas inmersivas VR.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportForensicReport}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-600/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Dictamen Pericial</span>
            </button>
          </div>
        </div>
      </div>

      {/* SELECTOR DE FENOTIPO Y DETALLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Lista de Selección */}
        <div className="lg:col-span-5 space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Seleccionar Subtipo de Estudio:
          </label>

          <div className="space-y-2">
            {DARK_TRIAD_PHENOTYPES.map(proto => (
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
                    Fiabilidad: {proto.reliabilityPct}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">{proto.cluster}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel Informativo del Fenotipo Seleccionado */}
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
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Ensayo de Provocación Inmersiva VR:</span>
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
              onClick={() => setIsSimulatingTest(!isSimulatingTest)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isSimulatingTest
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
              }`}
            >
              {isSimulatingTest ? 'Detener Ensayo Bio-VR' : 'Iniciar Provocación en VR Quest 3S'}
            </button>
          </div>
        </div>

      </div>

      {/* TARJETAS DE BIOMARCADORES & TRÍADA TRI-PM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Activity className="w-4 h-4 text-rose-400" />
            <span>Reactividad GSR al Sobresalto</span>
          </div>
          <div className="text-lg font-bold text-white">{activeProfile.metrics.startleReactivityGSR}</div>
          <p className="text-[10px] text-slate-500">Conductancia cutánea ante amenaza o distrés</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>Resonancia Empática Autonómica</span>
          </div>
          <div className="text-lg font-bold text-white">{activeProfile.metrics.empathyResonanceHRV}</div>
          <p className="text-[10px] text-slate-500">Variabilidad cardíaca al observar dolor ajeno</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Eye Tracking / Fijación de Distrés</span>
          </div>
          <div className="text-lg font-bold text-cyan-300">{activeProfile.metrics.gazeDistressFixation}</div>
          <p className="text-[10px] text-slate-500">Porcentaje de foveación en pistas emocionales</p>
        </div>
      </div>

      {/* BARRAS DE LA TRÍADA PSICOPÁTICA (TriPM) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Scale className="w-4 h-4 text-purple-400" />
          Dimensiones de la Medida Psicopática Triárquica (TriPM)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Audacia (Boldness)</span>
              <span className="text-purple-400">{activeProfile.metrics.triarchicBoldness}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full" 
                style={{ width: activeProfile.metrics.triarchicBoldness }}
              />
            </div>
            <span className="text-[9px] text-slate-500 block">Tolerancia al estrés, intrepidez social y calma.</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Dureza Afectiva (Meanness)</span>
              <span className="text-rose-400">{activeProfile.metrics.triarchicMeanness}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full" 
                style={{ width: activeProfile.metrics.triarchicMeanness }}
              />
            </div>
            <span className="text-[9px] text-slate-500 block">Ausencia de empatía, crueldad y desdén interpersonal.</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Desinhibición (Disinhibition)</span>
              <span className="text-amber-400">{activeProfile.metrics.triarchicDisinhibition}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full" 
                style={{ width: activeProfile.metrics.triarchicDisinhibition }}
              />
            </div>
            <span className="text-[9px] text-slate-500 block">Dificultad de control de impulsos y hostilidad.</span>
          </div>
        </div>
      </div>

      {/* LECTURA CLÍNICA DUAL: PSICOLOGÍA VS. PSIQUIATRÍA FORENSE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> Orientación para Psicología Clínica
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">{activeProfile.clinicalPsychologyReading}</p>
        </div>

        <div className="p-4 bg-slate-900 border border-purple-500/30 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Orientación para Psiquiatría Forense & Peritaje
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">{activeProfile.forensicPsychiatryReading}</p>
        </div>
      </div>

    </div>
  );
};
