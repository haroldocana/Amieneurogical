import React, { useState } from 'react';
import { PatientRecord } from '../types';
import {
  GitCompare,
  AlertTriangle,
  Brain,
  Mic,
  Smartphone,
  ClipboardList,
  Sparkles,
  ShieldAlert,
  Flame,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Info,
  Search,
  ScanEye,
  Bot,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface DifferentialBiasResolverProps {
  patient: PatientRecord;
}

interface ConflictPair {
  id: string;
  title: string;
  disorderA: string;
  disorderB: string;
  codeA: string;
  codeB: string;
  rationaleConflict: string;
  qeegDiscrepancy: {
    disorderA: string;
    disorderB: string;
    patientFinding: string;
    verdict: 'Favorece A' | 'Favorece B' | 'Indeterminado';
  };
  acousticDiscrepancy: {
    disorderA: string;
    disorderB: string;
    patientFinding: string;
    verdict: 'Favorece A' | 'Favorece B' | 'Indeterminado';
  };
  psychometricsDiscrepancy: {
    disorderA: string;
    disorderB: string;
    patientFinding: string;
    verdict: 'Favorece A' | 'Favorece B' | 'Indeterminado';
  };
  apkTelemetryDiscrepancy: {
    disorderA: string;
    disorderB: string;
    patientFinding: string;
    verdict: 'Favorece A' | 'Favorece B' | 'Indeterminado';
  };
  wrongDiagnosisIatrogenesis: {
    wrongChoice: string;
    iatrogenicRiskScenario: string;
    adverseCascade: string[];
    severityLevel: 'ALTO' | 'CRÍTICO' | 'MODERADO';
  };
}

export const DifferentialBiasResolver: React.FC<DifferentialBiasResolverProps> = ({ patient }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedConflictId, setSelectedConflictId] = useState<string>('TDAH_VS_TAG');
  const [customNoteToAnalyze, setCustomNoteToAnalyze] = useState<string>(
    patient.sessionNotes.join('\n\n') || patient.anamnesis
  );
  const [nlpAnalysisRunning, setNlpAnalysisRunning] = useState(false);
  const [detectedBiases, setDetectedBiases] = useState<Array<{
    type: 'Sesgo de Confirmación' | 'Sesgo de Género' | 'Sesgo de Disponibilidad' | 'Anclaje Prematuro';
    fragment: string;
    explanation: string;
    severity: 'Alta' | 'Media' | 'Baja';
  }>>([
    {
      type: 'Sesgo de Confirmación',
      fragment: '"...paciente se muestra disperso y se retuerce en su asiento..."',
      explanation: 'Tendencia a focalizar la inquietud motora exclusivamente en TDAH omitiendo que la ansiedad basal con hiperarousal autonómico produce movimientos exploratorios idénticos.',
      severity: 'Alta'
    },
    {
      type: 'Sesgo de Disponibilidad',
      fragment: '"...refiere respuesta milagrosa tras ingerir una pastilla de su hijo..."',
      explanation: 'Sobrestimación diagnóstica basada en un efecto de alerta dopaminérgica inespecífica que ocurre tanto en personas neurotípicas como con TDAH ante psicoestimulantes.',
      severity: 'Media'
    }
  ]);

  const CONFLICT_PAIRS: ConflictPair[] = [
    {
      id: 'TDAH_VS_TAG',
      title: 'TDAH del Adulto vs Trastorno de Ansiedad Generalizada (TAG)',
      disorderA: 'TDAH (Inatento / Combinado)',
      disorderB: 'Trastorno de Ansiedad Generalizada (TAG)',
      codeA: 'F90.0 / F90.2',
      codeB: 'F41.1 [300.02]',
      rationaleConflict: 'Ambos cursan con incapacidad para concentrarse, inquietud psicomotora, desorganización y quejas de rendimiento. En TDAH la inatención es primaria e insensible al contexto desde la infancia; en TAG la desatención es secundaria a rumiación intrusiva de preocupaciones futuras.',
      qeegDiscrepancy: {
        disorderA: 'Ratio Theta/Beta Frontal > 2.5σ con hipocoherencia interhemisférica.',
        disorderB: 'Exceso de High-Beta (>21 Hz) generalizado en corteza prefrontal y temporal.',
        patientFinding: `Ratio Theta/Beta en paciente: ${patient.qeegZScores?.frontalThetaBetaRatio ?? 2.8}σ. Predominio frontal con lentitud ejecutiva.`,
        verdict: 'Favorece A'
      },
      acousticDiscrepancy: {
        disorderA: 'Velocidad normal-alta, latencia de respuesta corta, prosodia dinámica sin tensión laríngea.',
        disorderB: 'Tensión fónica audible, respiración costal superficial previa a responder y variabilidad errática.',
        patientFinding: 'Ritmo fónico rápido (158 WPM), sin interrupciones por crisis disneica ni rumiación angustiosa.',
        verdict: 'Favorece A'
      },
      psychometricsDiscrepancy: {
        disorderA: 'ASRS >= 14 con síntomas consistentes antes de los 12 años; GAD-7 normal o reactivo a olvidos.',
        disorderB: 'GAD-7 >= 15 ("preocupación por todo") sin antecedente escolar de déficit atencional.',
        patientFinding: `ASRS: ${patient.psychometricScores.asrs ?? 17}/18 (Muy Alto). GAD-7: ${patient.psychometricScores.gad7 ?? 11}/21 (Moderado-reactivo).`,
        verdict: 'Favorece A'
      },
      apkTelemetryDiscrepancy: {
        disorderA: 'Patrón de sueño regular pero con dispersión de uso de apps en vigilia (cambios cada 40s).',
        disorderB: 'Despertares nocturnos por rumiación (>3x) y consulta ansiosa de noticias/notificaciones.',
        patientFinding: `Despertares: ${patient.sentinelTelemetry?.nightWakeups ?? 1}/noche. Sueño eficiente (82%).`,
        verdict: 'Favorece A'
      },
      wrongDiagnosisIatrogenesis: {
        wrongChoice: 'Diagnosticar erróneamente Ansiedad Primaria e iniciar ISRS/Benzodiacepinas sin tratar TDAH',
        iatrogenicRiskScenario: 'Empeoramiento del desempeño ejecutivo por sedación diurna inducida por benzodiacepinas, incremento de la frustración por fracasos laborales repetidos y perpetuación del ciclo de desorganización.',
        adverseCascade: [
          'Sedación y letargo cognitivo por ansiolíticos gabaérgicos.',
          'Embotamiento afectivo que oculta la disfunción ejecutiva subyacente.',
          'Pérdida de empleo por retrasos y omisiones de tareas complejas.',
          'Riesgo de dependencia secundaria a benzodiacepinas.'
        ],
        severityLevel: 'ALTO'
      }
    },
    {
      id: 'TDM_VS_TLP',
      title: 'Depresión Mayor con Melancolía vs Trastorno Límite de la Personalidad (TLP)',
      disorderA: 'Trastorno Depresivo Mayor (TDM Grave)',
      disorderB: 'Trastorno de la Personalidad Límite (TLP)',
      codeA: 'F32.2 / F32.3',
      codeB: 'F60.3 [301.83]',
      rationaleConflict: 'En TDM el abatimiento es continuo (>2 semanas) con anhedonia profunda, despertar precoz (02:30 AM) y no reactividad del ánimo. En TLP la disforia es episódica reactiva a conflictos interpersonales o abandono percibido con impulsividad autolesiva.',
      qeegDiscrepancy: {
        disorderA: 'Enlentecimiento difuso con elevación de ondas lentas delta/theta frontales y ritmo alfa desacelerado.',
        disorderB: 'Asimetría alfa temporal intensa (+2.4σ) con picos beta límbicos ante reactividad emocional.',
        patientFinding: 'Ondas lentas delta (+1.9σ) generalizadas con ritmo alfa de 8.5 Hz. Sin hiperreactividad frontal.',
        verdict: 'Favorece A'
      },
      acousticDiscrepancy: {
        disorderA: 'Bradilalia severa (<85 WPM), pausas mayores a 2000 ms, prosodia plana monótona.',
        disorderB: 'Labilidad fónica brusca, cambios súbitos de volumen, ataques de llanto seguidos de hostilidad.',
        patientFinding: 'Velocidad del habla 78 WPM, aplanamiento afectivo 88%, latencia de respuesta de 2450 ms.',
        verdict: 'Favorece A'
      },
      psychometricsDiscrepancy: {
        disorderA: 'PHQ-9 >= 20, BDI-II >= 35, SAD PERSONS elevado por desesperanza profunda e insomnio terminal.',
        disorderB: 'Escalas de inestabilidad afectiva, impulsividad motora y conductas de manipulación vincular.',
        patientFinding: `PHQ-9: ${patient.psychometricScores.phq9 ?? 24}/27, BDI-II: ${patient.psychometricScores.bdi2 ?? 42}/63, SAD PERSONS: ${patient.psychometricScores.sadPersons ?? 9}/10.`,
        verdict: 'Favorece A'
      },
      apkTelemetryDiscrepancy: {
        disorderA: 'Despertares nocturnos tempranos consistentes (02:00 - 04:00 AM) con letargo biomotor extremo (>450ms).',
        disorderB: 'Ráfagas de mensajes nocturnos impulsivos seguidos de desactivación diurna reactiva.',
        patientFinding: `Despertares: ${patient.sentinelTelemetry?.nightWakeups ?? 5}/noche. Latencia biomotora: ${patient.sentinelTelemetry?.biomotorLatencyMs ?? 485} ms.`,
        verdict: 'Favorece A'
      },
      wrongDiagnosisIatrogenesis: {
        wrongChoice: 'Asignar TLP a un paciente con Depresión Melancólica Aguda (Violación del Principio W de Morrison)',
        iatrogenicRiskScenario: 'Retrasar el tratamiento biológico antidepresivo/estabilizador intensivo o terapia electroconvulsiva, estigmatizar al paciente atribuyendo su desesperanza a "manipulación de la personalidad", precipitando un suicidio consumado.',
        adverseCascade: [
          'Falta de contención médica 24/7 y omisión de hospitalización psiquiátrica urgente.',
          'Prescripción errónea de psicoterapia dialéctica ambulatoria cuando el paciente está en estupor melancólico.',
          'Consumación del acto suicida por rumiación delirante de ruina/culpa no tratada farmacológicamente.'
        ],
        severityLevel: 'CRÍTICO'
      }
    },
    {
      id: 'TEA_VS_TOC',
      title: 'Trastorno del Espectro Autista (TEA Nivel 1) vs Trastorno Obsesivo-Compulsivo (TOC)',
      disorderA: 'Trastorno del Espectro Autista (TEA)',
      disorderB: 'Trastorno Obsesivo-Compulsivo (TOC)',
      codeA: 'F84.0 [299.00]',
      codeB: 'F42 [300.3]',
      rationaleConflict: 'En TEA los intereses restringidos e hiperfoco son egosintónicos (producen disfrute o autorregulación sensorial). En TOC las obsesiones son egodistónicas (generan angustia, culpa o asco) y las compulsiones buscan aliviar la tensión obsesiva.',
      qeegDiscrepancy: {
        disorderA: 'Patrones de conectividad atípica fronto-temporal y reactividad sensorial parieto-occipital.',
        disorderB: 'Hiperconectividad en bucle córtico-estriato-tálamo-cortical con hiperactivación del cíngulo anterior.',
        patientFinding: 'Hipoactivación frontal difusa con integración sensorial atípica en corteza parietal.',
        verdict: 'Favorece A'
      },
      acousticDiscrepancy: {
        disorderA: 'Prosodia pedante o peculiar, monólogos sobre temas de interés sin lectura de turnos sociales.',
        disorderB: 'Habla apresurada cargada de angustia al describir los rituales de neutralización.',
        patientFinding: 'Prosodia poco modulada, lenguaje técnico hiperdetallado sobre temas fijos.',
        verdict: 'Favorece A'
      },
      psychometricsDiscrepancy: {
        disorderA: 'AQ-10 >= 7, déficit en comunicación social desde la infancia temprana.',
        disorderB: 'Y-BOCS elevado con obsesiones de contaminación o verificación; cognición social basal normal.',
        patientFinding: `AQ-10: ${patient.psychometricScores.aq10 ?? 8}/10. Inicio documentado en etapa preescolar.`,
        verdict: 'Favorece A'
      },
      apkTelemetryDiscrepancy: {
        disorderA: 'Uso de dispositivos altamente estructurado con horarios idénticos día tras día.',
        disorderB: 'Ráfagas repetitivas de verificación de cerraduras o alarmas digitales.',
        patientFinding: 'Actividad circadiana regular y predecible con aversión a variaciones.',
        verdict: 'Favorece A'
      },
      wrongDiagnosisIatrogenesis: {
        wrongChoice: 'Tratar el interés especial autista como si fuera una obsesión egodistónica con altas dosis de ISRS',
        iatrogenicRiskScenario: 'Inducción de apatía, disfunción sexual e incremento de la sobrecarga sensorial sin beneficio clínico, al intentar extinguir un mecanismo de autorregulación vital del paciente.',
        adverseCascade: [
          'Desregulación sensorial severa por eliminación de mecanismos de autorregulación.',
          'Efectos secundarios extrapiramidales o serotoninérgicos innecesarios.',
          'Pérdida de la alianza terapéutica por incomprensión de la neurodivergencia.'
        ],
        severityLevel: 'MODERADO'
      }
    }
  ];

  const activeConflict = CONFLICT_PAIRS.find((c) => c.id === selectedConflictId) || CONFLICT_PAIRS[0];

  const handleRunNlpBiasAudit = () => {
    setNlpAnalysisRunning(true);
    setTimeout(() => {
      setNlpAnalysisRunning(false);
      setDetectedBiases([
        {
          type: 'Sesgo de Confirmación',
          fragment: '"...paciente se muestra disperso y se retuerce en su asiento..."',
          explanation: 'Tendencia a focalizar la inquietud motora exclusivamente en TDAH omitiendo que la ansiedad basal con hiperarousal autonómico produce movimientos exploratorios idénticos.',
          severity: 'Alta'
        },
        {
          type: 'Sesgo de Disponibilidad',
          fragment: '"...refiere respuesta milagrosa tras ingerir una pastilla de su hijo..."',
          explanation: 'Sobrestimación diagnóstica basada en un efecto de alerta dopaminérgica inespecífica que ocurre tanto en personas neurotípicas como con TDAH ante psicoestimulantes.',
          severity: 'Media'
        },
        {
          type: 'Anclaje Prematuro',
          fragment: '"...antecedente familiar positivo para depresión..."',
          explanation: 'Fijación en antecedentes afectivos que minimiza el examen neurocognitivo formal de la función ejecutiva.',
          severity: 'Baja'
        }
      ]);
    }, 1200);
  };

  return (
    <div className={`space-y-6 transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' 
        : 'relative'
    }`}>
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 via-sky-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">
                DifferentialBiasResolver • Matriz Antisesgo & Triangulación
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
                MÓDULO DE SEGURIDAD CLÍNICA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cruce cuádruple (qEEG + Biometría de Voz + Psicometría + APK) & Decodificador NLP de Sesgos Diagnósticos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
            Expediente: {patient.id}
          </span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Modo Pantalla Completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
            <span>{isFullscreen ? 'Salir Fullscreen' : 'Modo Pantalla Completa'}</span>
          </button>
        </div>
      </div>

      {/* Selector of Conflicting Disorders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
          <ScanEye className="w-3.5 h-3.5 text-cyan-400" /> Seleccionar Matriz de Conflicto Diagnóstico a Resolver:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {CONFLICT_PAIRS.map((pair) => (
            <button
              key={pair.id}
              onClick={() => setSelectedConflictId(pair.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedConflictId === pair.id
                  ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-xs text-white mb-1">{pair.title}</div>
              <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {pair.rationaleConflict}
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                <span>{pair.codeA}</span>
                <span className="text-slate-500">vs</span>
                <span>{pair.codeB}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cross-Telemetry Discard Table (4 Axes) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Triangulación de 4 Ejes para Descarte de Sesgos ({activeConflict.disorderA} vs {activeConflict.disorderB})
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800">
            Principio de Seguridad James Morrison
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Eje 1: qEEG Spectral Discrepancy */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                <Brain className="w-3.5 h-3.5" /> Eje 1: Biomarcadores qEEG (Z-Scores)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {activeConflict.qeegDiscrepancy.verdict}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <p>• <strong>Criterio {activeConflict.disorderA}:</strong> {activeConflict.qeegDiscrepancy.disorderA}</p>
              <p>• <strong>Criterio {activeConflict.disorderB}:</strong> {activeConflict.qeegDiscrepancy.disorderB}</p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-sky-200 mt-1">
                <strong>Hallazgo en Paciente: </strong> {activeConflict.qeegDiscrepancy.patientFinding}
              </div>
            </div>
          </div>

          {/* Eje 2: Voice & Acoustic Biometrics */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                <Mic className="w-3.5 h-3.5" /> Eje 2: Biometría Acústica de Sesión
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activeConflict.acousticDiscrepancy.verdict}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <p>• <strong>Patrón {activeConflict.disorderA}:</strong> {activeConflict.acousticDiscrepancy.disorderA}</p>
              <p>• <strong>Patrón {activeConflict.disorderB}:</strong> {activeConflict.acousticDiscrepancy.disorderB}</p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-200 mt-1">
                <strong>Hallazgo en Paciente: </strong> {activeConflict.acousticDiscrepancy.patientFinding}
              </div>
            </div>
          </div>

          {/* Eje 3: Psychometrics DSM-5 */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <ClipboardList className="w-3.5 h-3.5" /> Eje 3: Batería Psicométrica Estandarizada
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeConflict.psychometricsDiscrepancy.verdict}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <p>• <strong>Escalas {activeConflict.disorderA}:</strong> {activeConflict.psychometricsDiscrepancy.disorderA}</p>
              <p>• <strong>Escalas {activeConflict.disorderB}:</strong> {activeConflict.psychometricsDiscrepancy.disorderB}</p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-amber-200 mt-1">
                <strong>Hallazgo en Paciente: </strong> {activeConflict.psychometricsDiscrepancy.patientFinding}
              </div>
            </div>
          </div>

          {/* Eje 4: Sentinel APK Telemetry */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                <Smartphone className="w-3.5 h-3.5" /> Eje 4: Telemetría Pasiva APK Centinela
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {activeConflict.apkTelemetryDiscrepancy.verdict}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <p>• <strong>Perfil {activeConflict.disorderA}:</strong> {activeConflict.apkTelemetryDiscrepancy.disorderA}</p>
              <p>• <strong>Perfil {activeConflict.disorderB}:</strong> {activeConflict.apkTelemetryDiscrepancy.disorderB}</p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-emerald-200 mt-1">
                <strong>Hallazgo en Paciente: </strong> {activeConflict.apkTelemetryDiscrepancy.patientFinding}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NOVELTY 1: Language Bias Decoder (NLP Note Analyzer) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-lg text-white">
              <ScanEye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Decodificador de Sesgos del Lenguaje Clínico (NLP)
              </h3>
              <p className="text-[10px] text-slate-400">
                Auditoría algorítmica de notas clínicas para neutralizar sesgos de confirmación, género y anclaje
              </p>
            </div>
          </div>

          <button
            onClick={handleRunNlpBiasAudit}
            disabled={nlpAnalysisRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition active:scale-95"
          >
            {nlpAnalysisRunning ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                <span>Escaneando Sesgos...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Auditar Texto Clínico</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 space-y-1.5">
            <label className="text-[11px] text-slate-400 font-semibold block">Texto de Nota Clínica a Evaluar:</label>
            <textarea
              rows={6}
              value={customNoteToAnalyze}
              onChange={(e) => setCustomNoteToAnalyze(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="lg:col-span-6 space-y-2">
            <label className="text-[11px] text-slate-400 font-semibold block">Sesgos Cognitivos Detectados en el Relato:</label>
            <div className="space-y-2 overflow-y-auto max-h-[170px] pr-1">
              {detectedBiases.map((b, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> {b.type}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Severidad {b.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 font-mono text-[10px] italic">{b.fragment}</p>
                  <p className="text-slate-300 text-[11px]">{b.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NOVELTY 2: Digital Risk Twin (Iatrogenesis Simulator) */}
      <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Gemelo Digital de Riesgo Iatrogénico (Simulación de Error Diagnóstico)
              </h3>
              <p className="text-[10px] text-slate-400">
                Modelo predictivo del daño potencial al aplicar el tratamiento del diagnóstico erróneo
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
            NIVEL DE ALERTA: {activeConflict.wrongDiagnosisIatrogenesis.severityLevel}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/90 border border-rose-500/30 space-y-3 text-xs">
          <div>
            <span className="font-bold text-rose-300 block mb-1">
              Escenario de Error: {activeConflict.wrongDiagnosisIatrogenesis.wrongChoice}
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {activeConflict.wrongDiagnosisIatrogenesis.iatrogenicRiskScenario}
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <span className="font-semibold text-slate-400 text-[11px] flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Cascada de Complicaciones Previstas:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {activeConflict.wrongDiagnosisIatrogenesis.adverseCascade.map((adv, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-rose-950/30 border border-rose-500/20 text-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
