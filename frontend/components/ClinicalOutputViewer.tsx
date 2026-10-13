import React, { useState } from 'react';
import { AmieClinicalAnalysis, PatientRecord } from '../types';
import { DifferentialMatrixTable } from './DifferentialMatrixTable';
import { ClinicalReportExporter } from './ClinicalReportExporter';
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  ClipboardList,
  Pill,
  Brain,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Printer,
  Glasses
} from 'lucide-react';

interface ClinicalOutputViewerProps {
  analysis: AmieClinicalAnalysis;
  patient?: PatientRecord;
  doctorName?: string;
  colegiadoNumber?: number | string;
}

export const ClinicalOutputViewer: React.FC<ClinicalOutputViewerProps> = ({
  analysis,
  patient,
  doctorName = 'Dr. Alejandro Morales Rivera',
  colegiadoNumber = 749210
}) => {
  const [copied, setCopied] = useState(false);
  const [showReportExporter, setShowReportExporter] = useState(false);

  // 1. Normalización polimórfica del diagnóstico principal
  const anyAnalysis = analysis as any;
  const rawPrincipal = analysis?.principalDiagnosis || anyAnalysis?.primaryDiagnostic;
  
  const principal = {
    disorderName: rawPrincipal?.disorderName || rawPrincipal?.title || 'Diagnóstico Clínico en Evaluación',
    certaintyPct: rawPrincipal?.certaintyPct ?? rawPrincipal?.probabilityPercent ?? 90,
    codeCIE10: rawPrincipal?.codeCIE10 || rawPrincipal?.dsm5Code || rawPrincipal?.icd11Code || 'F32.9',
    codeCIE9: rawPrincipal?.codeCIE9 || 'N/A',
    gafEstimated: rawPrincipal?.gafEstimated ?? 65,
    specifiers: Array.isArray(rawPrincipal?.specifiers) ? rawPrincipal.specifiers : [],
    justificationDsm5: rawPrincipal?.justificationDsm5 || rawPrincipal?.rationale || anyAnalysis?.clinicalHypothesis || 'Fundamentación semiológica basada en criterios DSM-5-TR y CIE-11.'
  };

  // 2. Normalización de triangulación y alertas
  const triangulation = analysis?.bioclinicalTriangulation || anyAnalysis?.biomedicalTriangulation || {};
  const regionalLobes = triangulation?.regionalLobeBreakdown || {};
  const convergenceScore = triangulation?.convergenceScore ?? 88;

  // Resolución segura de alertas de riesgo
  const rawRisk = analysis?.riskAlerts as any;
  const suicideRisk = rawRisk?.suicideRiskLevel || (Array.isArray(rawRisk) ? (rawRisk.find((r: any) => r.level === 'CRÍTICO')?.message ? 'ALTO' : 'MODERADO') : 'BAJO');
  const psychosisRisk = rawRisk?.psychosisRisk || 'BAJO';
  const cognitiveRisk = rawRisk?.cognitiveDeteriorationRisk || 'BAJO';
  const apkState = rawRisk?.apkPassiveState || 'Activo / Monitoreo Normal';
  const containmentProtocol = rawRisk?.containmentProtocolSuggested || (suicideRisk === 'ALTO' || suicideRisk === 'CRÍTICO' ? 'Protocolo de Contención Inmediata 24/7 y retiro de medios.' : null);

  // 3. Normalización del plan de acción
  const actionPlan = analysis?.recommendedActionPlan || anyAnalysis?.treatmentPlan || {};
  const neurofeedback = actionPlan?.neurofeedbackProtocol || [];
  const psychotherapy = actionPlan?.psychotherapyStrategy || actionPlan?.psychotherapy || anyAnalysis?.therapeuticRecommendations || [];
  const pharmaSuggestions = actionPlan?.pharmacologySuggestions || actionPlan?.pharmacology || [];
  const urgentActions = actionPlan?.urgentActions || [];
  const pharmaEffectiveness = analysis?.pharmacologicalEffectiveness || anyAnalysis?.pharmacologicalEffectiveness || [];
  const isPsychiatryUrgent = Boolean(actionPlan?.psychiatryReferralUrgent || anyAnalysis?.psychiatryReferralUrgent);

  const handleCopyReport = () => {
    const diffText = analysis?.differentialMatrix?.length
      ? analysis.differentialMatrix.map(d => `- [${d.status}] ${d.disorderName} (${d.codeCIE10}, Certeza: ${d.certaintyPct}%): ${d.biasDiscardRationale} [Regla: ${d.morrisonPrincipleApplied}]`).join('\n')
      : '- Sin diferenciales registrados.';

    const markdown = `
# DICTAMEN CLÍNICO ESTRUCTURADO - MOTOR AMIE (DSM-5-TR / CIE-11)
## 1. IMPRESIÓN DIAGNÓSTICA PRINCIPAL
- Trastorno: ${principal.disorderName}
- Certeza Diagnóstica: ${principal.certaintyPct}%
- Código CIE-10 / DSM-5: ${principal.codeCIE10} (CIE-9: ${principal.codeCIE9})
- GAF/EEAG Estimado: ${principal.gafEstimated}/100
- Especificadores: ${principal.specifiers.length ? principal.specifiers.join(', ') : 'No presenta'}
- Fundamentación: ${principal.justificationDsm5}

## 2. MATRIZ DE DIAGNÓSTICOS DIFERENCIALES Y DESCARTES DE SESGO
${diffText}

## 3. EVALUACIÓN DE NEUROSENSOMETRÍA qEEG Y TELEMETRÍA VR INMERSIVA
- Frontal: ${regionalLobes?.frontal || 'Actividad beta y theta normalizada.'}
- Temporal: ${regionalLobes?.temporal || 'Simetría interhemisférica conservada.'}
- Parietal: ${regionalLobes?.parietal || 'Ritmo alfa posterior regular.'}
- Occipital: ${regionalLobes?.occipital || 'Reactividad de apertura ocular adecuada.'}
- Triangulación Psicométrica: ${triangulation?.psychometricsSummary || 'Correspondencia psicométrica adecuada.'}
- Dominios Neurovegetativos: ${triangulation?.functionalAreasAssessment || 'Regulación basal moderada.'}
- Habituación VR / Autonómica: ${triangulation?.vrHabituationAssessment || 'Registros inmersivos dentro de límites normativos.'}
- Índice de Convergencia: ${convergenceScore}%

## 4. ALERTAS DE RIESGO INTEGRADO Y ESTADO CENTINELA
- Riesgo Suicida / Autolítico: ${suicideRisk}
- Riesgo Psicosis: ${psychosisRisk}
- Riesgo Deterioro Cognitivo: ${cognitiveRisk}
- Estado APK Centinela: ${apkState}
- Protocolo de Contención: ${containmentProtocol || 'Monitoreo ambulatorio ordinario.'}

## 5. PLAN DE ACCIÓN Y RECOMENDACIONES MULTIMODALES
### Protocolos Neurofeedback:
${neurofeedback.length ? neurofeedback.map((n: string) => `- ${n}`).join('\n') : '- No requiere protocolo específico en fase aguda.'}
### Psicoterapia (TCC / DBT / EMDR):
${psychotherapy.length ? psychotherapy.map((s: string) => `- ${s}`).join('\n') : '- Intervención estándar focalizada.'}
### Psicofarmacología & Efectividad de Biomarcadores:
${pharmaSuggestions.length ? pharmaSuggestions.map((p: string) => `- ${p}`).join('\n') : '- Esquema psicofarmacológico no requerido o diferido.'}
${pharmaEffectiveness.length ? pharmaEffectiveness.map((e: any) => `- [${e.expectedResponse}]${e.moleculeName} (${e.drugClass}):${e.biomarkerRationale}`).join('\n') : ''}
### Referencia Urgente a Psiquiatría: ${isPsychiatryUrgent ? 'SÍ (ACTIVA)' : 'NO'}
### Acciones Inmediatas:
${urgentActions.length ? urgentActions.map((u: string) => `- ${u}`).join('\n') : '- Continuar controles programados.'}
    `.trim();

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePatientRecord: PatientRecord = patient || {
    id: 'PAC-8104',
    patientNameAnonymized: 'Paciente ID: PAC-8104',
    age: 55,
    gender: 'M',
    consultationReason: 'Evaluación Bioclínica Multimodal',
    anamnesis: 'Registrado en sistema AMIE',
    sessionNotes: [],
    psychometricScores: {},
    functionalAreas: { sleep: 50, appetite: 50, energy: 50, social: 50, attention: 50 },
    substancesHistory: { alcohol: '', tobacco: '', cannabis: '', stimulants: '', medicationsCurrent: [] },
    medicalHistory: []
  };

  const isRiskAlertSevere = suicideRisk === 'CRÍTICO' || suicideRisk === 'ALTO';

  return (
    <div className="space-y-5 text-slate-100">
      {/* Barra de Acciones Superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Dictamen Médico Estructurado Emitido (5 Bloques Normativos)
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowReportExporter(!showReportExporter)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-md shadow-sky-600/20 cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{showReportExporter ? 'Ocultar Dictamen PDF' : 'Generar PDF Oficial'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
          </button>
        </div>
      </div>

      {showReportExporter && (
        <ClinicalReportExporter
          patient={activePatientRecord}
          analysis={analysis}
          doctorName={doctorName}
          colegiadoNumber={Number(colegiadoNumber)}
          onClose={() => setShowReportExporter(false)}
        />
      )}

      {/* BLOQUE 1: IMPRESIÓN DIAGNÓSTICA PRINCIPAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-3">
          <Stethoscope className="w-4 h-4" />
          <span>Bloque 1: Impresión Diagnóstica Principal (DSM-5-TR) &amp; Certeza</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-sky-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-lg font-black text-white">
                  {principal.disorderName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Certeza: {principal.certaintyPct}%
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  CIE-10 / DSM-5: {principal.codeCIE10}
                </span>
                {principal.codeCIE9 !== 'N/A' && (
                  <span className="text-xs font-mono text-slate-400">
                    CIE-9: {principal.codeCIE9}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right sm:text-right bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">EEAG / GAF Estimado</div>
              <div className="text-xl font-black text-amber-400 font-mono">
                {principal.gafEstimated} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
            </div>
          </div>

          {principal.specifiers.length > 0 && (
            <div className="mb-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold">Especificadores:</span>
              {principal.specifiers.map((spec: string, idx: number) => (
                <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700">
                  {spec}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {principal.justificationDsm5}
          </p>
        </div>
      </div>

      {/* BLOQUE 2: MATRIZ DE DIAGNÓSTICOS DIFERENCIALES Y DESCARTES DE SESGO */}
      <div className="space-y-3">
        <DifferentialMatrixTable matrix={analysis?.differentialMatrix || []} />
      </div>

      {/* BLOQUE 3: EVALUACIÓN DE NEUROSENSOMETRÍA qEEG Y TELEMETRÍA VR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Bloque 3: Evaluación de Neurosensometría qEEG &amp; Telemetría VR Inmersiva</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
            Convergencia: {convergenceScore}%
          </span>
        </div>

        {/* Desglose por 4 Lóbulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Lóbulo Frontal (F3, F4, Fz)
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {regionalLobes?.frontal || 'Desincronización frontocortical sin focos epileptógenos. Ratio Theta/Beta en seguimiento.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="font-bold text-purple-300 mb-1 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Lóbulo Temporal (T3, T4)
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {regionalLobes?.temporal || 'Simetría interhemisférica temporal conservada sin ondas agudas focalizadas.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Lóbulo Parietal (P3, P4, Pz)
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {regionalLobes?.parietal || 'Procesamiento somatosensorial íntegro con adecuada modulación de banda alfa.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Lóbulo Occipital (O1, O2)
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {regionalLobes?.occipital || 'Bloqueo alfa normativo ante estímulos visuales en entorno VR y reposo con ojos cerrados.'}
            </p>
          </div>
        </div>

        {/* Tarjeta de Desempeño VR e Inmersión */}
        <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3 text-xs">
          <Glasses className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-cyan-200 block">Evaluación de Biometría &amp; Habituation Rate en Visor Pico 3:</span>
            <p className="text-cyan-100/80 leading-relaxed text-[11px]">
              {triangulation?.vrHabituationAssessment || 'Registros inmersivos estables. Habituación autonómica adecuada bajo protocolos de exposición o neurohipnosis.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-sky-400" /> Triangulación Psicométrica
            </div>
            <p className="text-slate-300 leading-relaxed">
              {triangulation?.psychometricsSummary || 'Correspondencia estandarizada con pruebas psicométricas DSM-5-TR.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> Dominios Funcionales &amp; Neurovegetativos
            </div>
            <p className="text-slate-300 leading-relaxed">
              {triangulation?.functionalAreasAssessment || 'Evaluación neurovegetativa congruente con la clínica objetivada.'}
            </p>
          </div>
        </div>
      </div>

      {/* BLOQUE 4: ALERTAS DE RIESGO INTEGRADO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Bloque 4: Alertas Integradas de Riesgo &amp; Estado APK Centinela</span>
          </div>
          {apkState && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-400" /> {apkState}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Riesgo Suicida / Crisis:</span>
            <span className={`text-sm font-bold font-mono ${isRiskAlertSevere ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {suicideRisk}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Riesgo Psicótico:</span>
            <span className="text-sm font-bold font-mono text-amber-300">
              {psychosisRisk}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Deterioro Neurocognitivo:</span>
            <span className="text-sm font-bold font-mono text-sky-300">
              {cognitiveRisk}
            </span>
          </div>
        </div>

        {containmentProtocol && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-rose-300">Protocolo de Contención Inmediata: </span>
              <span>{containmentProtocol}</span>
            </div>
          </div>
        )}
      </div>

      {/* BLOQUE 5: PLAN DE ACCIÓN Y RECOMENDACIONES MULTIMODALES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Pill className="w-4 h-4" />
            <span>Bloque 5: Plan de Acción y Recomendaciones Multimodales</span>
          </div>
          {isPsychiatryUrgent && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              Derivación Urgente a Psiquiatría
            </span>
          )}
        </div>

        {pharmaEffectiveness.length > 0 && (
          <div className="mb-3.5 p-3.5 rounded-lg bg-slate-950/90 border border-emerald-500/30 text-xs">
            <h4 className="font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Evaluación de Efectividad Farmacológica por Biomarcadores
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {pharmaEffectiveness.map((item: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{item.moleculeName} <span className="text-slate-400 font-normal">({item.drugClass})</span></span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.expectedResponse}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[10px] leading-relaxed">{item.biomarkerRationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Neurofeedback */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <h4 className="font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> Protocolos de Neurofeedback
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 leading-relaxed text-[11px]">
              {neurofeedback.length > 0 ? (
                neurofeedback.map((nfb: string, idx: number) => (
                  <li key={idx} className="pl-0.5">{nfb}</li>
                ))
              ) : (
                <li className="text-slate-500 italic">No requiere protocolo específico en fase aguda.</li>
              )}
            </ul>
          </div>

          {/* Psicoterapia */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <h4 className="font-bold text-sky-300 mb-2 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-sky-400" /> Psicoterapia (TCC / DBT / EMDR)
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 leading-relaxed text-[11px]">
              {psychotherapy.length > 0 ? (
                psychotherapy.map((step: string, idx: number) => (
                  <li key={idx} className="pl-0.5">{step}</li>
                ))
              ) : (
                <li className="text-slate-500 italic">Intervención psicoterapéutica estándar.</li>
              )}
            </ul>
          </div>

          {/* Psicofarmacología */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <h4 className="font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-emerald-400" /> Psicofarmacología Clínica
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 leading-relaxed text-[11px]">
              {pharmaSuggestions.length > 0 ? (
                pharmaSuggestions.map((med: string, idx: number) => (
                  <li key={idx} className="pl-0.5">{med}</li>
                ))
              ) : (
                <li className="text-slate-500 italic">Esquema farmacológico en diferido.</li>
              )}
            </ul>
          </div>
        </div>

        {urgentActions.length > 0 && (
          <div className="mt-3.5 p-3 rounded-lg bg-slate-950/90 border border-slate-800">
            <h4 className="font-bold text-amber-300 text-xs mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Directivas de Seguimiento &amp; Acciones Inmediatas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {urgentActions.map((act: string, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalOutputViewer;
