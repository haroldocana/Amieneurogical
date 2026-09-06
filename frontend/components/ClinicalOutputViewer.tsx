import React, { useState } from 'react';
import { AmieClinicalAnalysis } from '../types';
import { DifferentialMatrixTable } from './DifferentialMatrixTable';
import {
  Stethoscope,
  GitFork,
  Activity,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Pill,
  Brain,
  Download,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Smartphone,
  Gauge,
  Sparkles
} from 'lucide-react';

interface ClinicalOutputViewerProps {
  analysis: AmieClinicalAnalysis;
}

export const ClinicalOutputViewer: React.FC<ClinicalOutputViewerProps> = ({ analysis }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReport = () => {
    const markdown = `
# DICTAMEN CLÍNICO ESTRUCTURADO - MOTOR AMIE (DSM-5)
## 1. IMPRESIÓN DIAGNÓSTICA PRINCIPAL
- Trastorno: ${analysis.principalDiagnosis.disorderName}
- Certeza Diagnóstica: ${analysis.principalDiagnosis.certaintyPct || 90}%
- Código CIE-10: ${analysis.principalDiagnosis.codeCIE10} (CIE-9: ${analysis.principalDiagnosis.codeCIE9 || 'N/A'})
- GAF/EEAG Estimado: ${analysis.principalDiagnosis.gafEstimated}/100
- Especificadores: ${analysis.principalDiagnosis.specifiers.join(', ')}
- Fundamentación: ${analysis.principalDiagnosis.justificationDsm5}

## 2. MATRIZ DE DIAGNÓSTICOS DIFERENCIALES Y DESCARTES DE SESGO (7 TRASTORNOS)
${analysis.differentialMatrix ? analysis.differentialMatrix.map(d => `- [${d.status}] ${d.disorderName} (${d.codeCIE10}, Certeza: ${d.certaintyPct}%): ${d.biasDiscardRationale} [Regla: ${d.morrisonPrincipleApplied}]`).join('\n') : ''}

## 3. EVALUACIÓN DE NEUROSENSOMETRÍA qEEG POR LÓBULOS Y BIOMARCADORES
- Frontal: ${analysis.bioclinicalTriangulation.regionalLobeBreakdown?.frontal || 'N/A'}
- Temporal: ${analysis.bioclinicalTriangulation.regionalLobeBreakdown?.temporal || 'N/A'}
- Parietal: ${analysis.bioclinicalTriangulation.regionalLobeBreakdown?.parietal || 'N/A'}
- Occipital: ${analysis.bioclinicalTriangulation.regionalLobeBreakdown?.occipital || 'N/A'}
- Triangulación Psicométrica: ${analysis.bioclinicalTriangulation.psychometricsSummary}
- Dominios Neurovegetativos: ${analysis.bioclinicalTriangulation.functionalAreasAssessment}
- Índice de Convergencia: ${analysis.bioclinicalTriangulation.convergenceScore}%

## 4. ALERTAS DE RIESGO INTEGRADO (SUICIDIO / PSICOSIS) Y APK CENTINELA
- Riesgo Suicida: ${analysis.riskAlerts.suicideRiskLevel}
- Riesgo Psicosis: ${analysis.riskAlerts.psychosisRisk}
- Riesgo Deterioro Cognitivo: ${analysis.riskAlerts.cognitiveDeteriorationRisk}
- Estado APK Centinela: ${analysis.riskAlerts.apkPassiveState || 'Activo'}
- Protocolo de Contención: ${analysis.riskAlerts.containmentProtocolSuggested || 'N/A'}

## 5. PLAN DE ACCIÓN Y RECOMENDACIONES MULTIMODALES
### Protocolos Neurofeedback:
${analysis.recommendedActionPlan.neurofeedbackProtocol ? analysis.recommendedActionPlan.neurofeedbackProtocol.map(n => `- ${n}`).join('\n') : '- N/A'}
### Psicoterapia (TCC / DBT / EMDR):
${analysis.recommendedActionPlan.psychotherapyStrategy.map(s => `- ${s}`).join('\n')}
### Psicofarmacología & Efectividad de Biomarcadores:
${analysis.recommendedActionPlan.pharmacologySuggestions.map(p => `- ${p}`).join('\n')}
${analysis.pharmacologicalEffectiveness ? analysis.pharmacologicalEffectiveness.map(e => `- [${e.expectedResponse}] ${e.moleculeName} (${e.drugClass}): ${e.biomarkerRationale}`).join('\n') : ''}
### Referencia Urgente a Psiquiatría: ${analysis.recommendedActionPlan.psychiatryReferralUrgent ? 'SÍ (ACTIVA)' : 'NO'}
### Acciones Inmediatas:
${analysis.recommendedActionPlan.urgentActions.map(u => `- ${u}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Dictamen Médico Estructurado Emitido (5 Bloques Normativos)
          </span>
        </div>
        <button
          onClick={handleCopyReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
          <span>{copied ? 'Copiado al Portapapeles' : 'Copiar Dictamen'}</span>
        </button>
      </div>

      {/* BLOQUE 1: IMPRESIÓN DIAGNÓSTICA PRINCIPAL (DSM-5) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-3">
          <Stethoscope className="w-4 h-4" />
          <span>Bloque 1: Impresión Diagnóstica Principal (DSM-5) & Certeza</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-sky-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-white">
                  {analysis.principalDiagnosis.disorderName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Certeza: {analysis.principalDiagnosis.certaintyPct || 92}%
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  CIE-10: {analysis.principalDiagnosis.codeCIE10}
                </span>
                {analysis.principalDiagnosis.codeCIE9 && (
                  <span className="text-xs font-mono text-slate-400">
                    CIE-9: {analysis.principalDiagnosis.codeCIE9}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right sm:text-right bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">EEAG / GAF Estimado</div>
              <div className="text-xl font-black text-amber-400 font-mono">
                {analysis.principalDiagnosis.gafEstimated} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
            </div>
          </div>

          {/* Specifiers */}
          {analysis.principalDiagnosis.specifiers && analysis.principalDiagnosis.specifiers.length > 0 && (
            <div className="mb-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold">Especificadores:</span>
              {analysis.principalDiagnosis.specifiers.map((spec, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700">
                  {spec}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {analysis.principalDiagnosis.justificationDsm5}
          </p>
        </div>
      </div>

      {/* BLOQUE 2: MATRIZ DE DIAGNÓSTICOS DIFERENCIALES Y DESCARTES DE SESGO */}
      <div className="space-y-3">
        <DifferentialMatrixTable matrix={analysis.differentialMatrix || []} />
      </div>

      {/* BLOQUE 3: EVALUACIÓN DE NEUROSENSOMETRÍA qEEG POR LÓBULOS Y BIOMARCADORES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Bloque 3: Evaluación de Neurosensometría qEEG por Lóbulos & Triangulación</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
            Convergencia: {analysis.bioclinicalTriangulation.convergenceScore}%
          </span>
        </div>

        {/* 4-Lobe Regional Breakdown */}
        {analysis.bioclinicalTriangulation.regionalLobeBreakdown && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Lóbulo Frontal (F3, F4, Fz)
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {analysis.bioclinicalTriangulation.regionalLobeBreakdown.frontal}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Lóbulo Temporal (T3, T4)
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {analysis.bioclinicalTriangulation.regionalLobeBreakdown.temporal}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Lóbulo Parietal (P3, P4, Pz)
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {analysis.bioclinicalTriangulation.regionalLobeBreakdown.parietal}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Lóbulo Occipital (O1, O2)
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {analysis.bioclinicalTriangulation.regionalLobeBreakdown.occipital}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-sky-400" /> Triangulación Psicométrica
            </div>
            <p className="text-slate-300 leading-relaxed">
              {analysis.bioclinicalTriangulation.psychometricsSummary}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> Dominios Funcionales & Neurovegetativos
            </div>
            <p className="text-slate-300 leading-relaxed">
              {analysis.bioclinicalTriangulation.functionalAreasAssessment}
            </p>
          </div>
        </div>
      </div>

      {/* BLOQUE 4: ALERTAS DE RIESGO INTEGRADO CON ESTADO APK */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Bloque 4: Alertas Integradas de Riesgo & Estado APK Centinela</span>
          </div>
          {analysis.riskAlerts.apkPassiveState && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-400" /> {analysis.riskAlerts.apkPassiveState}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Riesgo Suicida / Crisis:</span>
            <span className={`text-sm font-bold font-mono ${
              analysis.riskAlerts.suicideRiskLevel === 'CRÍTICO' || analysis.riskAlerts.suicideRiskLevel === 'ALTO'
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}>
              {analysis.riskAlerts.suicideRiskLevel}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Riesgo Psicótico:</span>
            <span className="text-sm font-bold font-mono text-amber-300">
              {analysis.riskAlerts.psychosisRisk}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Deterioro Neurocognitivo:</span>
            <span className="text-sm font-bold font-mono text-sky-300">
              {analysis.riskAlerts.cognitiveDeteriorationRisk}
            </span>
          </div>
        </div>

        {analysis.riskAlerts.containmentProtocolSuggested && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-rose-300">Protocolo de Contención Inmediata: </span>
              <span>{analysis.riskAlerts.containmentProtocolSuggested}</span>
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
          {analysis.recommendedActionPlan.psychiatryReferralUrgent && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              Derivación Urgente a Psiquiatría
            </span>
          )}
        </div>

        {/* Pharmacological Effectiveness Card if available */}
        {analysis.pharmacologicalEffectiveness && analysis.pharmacologicalEffectiveness.length > 0 && (
          <div className="mb-3.5 p-3.5 rounded-lg bg-slate-950/90 border border-emerald-500/30 text-xs">
            <h4 className="font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Evaluación de Efectividad Farmacológica por Biomarcadores
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.pharmacologicalEffectiveness.map((item, idx) => (
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
          {/* Neurofeedback Protocols */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <h4 className="font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> Protocolos de Neurofeedback
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 leading-relaxed text-[11px]">
              {analysis.recommendedActionPlan.neurofeedbackProtocol && analysis.recommendedActionPlan.neurofeedbackProtocol.length > 0 ? (
                analysis.recommendedActionPlan.neurofeedbackProtocol.map((nfb, idx) => (
                  <li key={idx} className="pl-0.5">{nfb}</li>
                ))
              ) : (
                <li className="text-slate-500 italic">No requiere protocolo específico en fase aguda.</li>
              )}
            </ul>
          </div>

          {/* Psicoterapia TCC/DBT/EMDR */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <h4 className="font-bold text-sky-300 mb-2 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-sky-400" /> Psicoterapia (TCC / DBT / EMDR)
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 leading-relaxed text-[11px]">
              {analysis.recommendedActionPlan.psychotherapyStrategy.map((step, idx) => (
                <li key={idx} className="pl-0.5">{step}</li>
              ))}
            </ul>
          </div>

          {/* Psicofarmacología */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <h4 className="font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-emerald-400" /> Psicofarmacología Clínica
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 leading-relaxed text-[11px]">
              {analysis.recommendedActionPlan.pharmacologySuggestions.map((med, idx) => (
                <li key={idx} className="pl-0.5">{med}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Urgent Actions & Directives */}
        {analysis.recommendedActionPlan.urgentActions && analysis.recommendedActionPlan.urgentActions.length > 0 && (
          <div className="mt-3.5 p-3 rounded-lg bg-slate-950/90 border border-slate-800">
            <h4 className="font-bold text-amber-300 text-xs mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Directivas de Seguimiento & Acciones Inmediatas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {analysis.recommendedActionPlan.urgentActions.map((act, idx) => (
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
