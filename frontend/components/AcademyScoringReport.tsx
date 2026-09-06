import React, { useState } from 'react';
import { AcademyScoringResult, SimulatedCase } from '../types';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  BookOpen,
  RefreshCw,
  ArrowRight,
  Download,
  Share2,
  ShieldCheck,
  Check,
  Flame,
  Frown,
  PartyPopper
} from 'lucide-react';

interface AcademyScoringReportProps {
  score: AcademyScoringResult;
  simulatedCase: SimulatedCase;
  onRestartSimulation: () => void;
  onNextCase?: () => void;
}

export const AcademyScoringReport: React.FC<AcademyScoringReportProps> = ({
  score,
  simulatedCase,
  onRestartSimulation,
  onNextCase,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const isApproved = score.totalScore >= 70;

  const radarData = [
    { subject: 'Anamnesis & Rapport', score: (score.axisRapportAnamnesis / 25) * 100, fullMark: 100 },
    { subject: 'Agudeza Diagnóstica', score: (score.axisDiagnosticAcuity / 25) * 100, fullMark: 100 },
    { subject: 'Selección Evidencia', score: (score.axisEvidenceSelection / 25) * 100, fullMark: 100 },
    { subject: 'Ejecución Técnica', score: (score.axisTechnicalAdherence / 25) * 100, fullMark: 100 },
  ];

  const handleDownloadCertificate = () => {
    const reportText = `
========================================================================
       ACADEMIA CLÍNICA AMIE • CERTIFICADO DE DESEMPEÑO CLÍNICO
========================================================================
FECHA DE EVALUACIÓN: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
ESTADO DE ACREDITACIÓN: ${isApproved ? 'APROBADO CON ÉXITO' : 'NO APROBADO (REQUIERE REPASO)'}
CALIFICACIÓN TOTAL: ${score.totalScore} / 100 PUNTOS (${score.competencyLevel})

CASO EVALUADO: ${simulatedCase.title} (${simulatedCase.caseCode})
PACIENTE: ${simulatedCase.patientName} (${simulatedCase.age} años - Etapa: ${simulatedCase.stage})
DIAGNÓSTICO OFICIAL DSM-5: ${simulatedCase.goldStandardDiagnosis} [${simulatedCase.goldStandardCIE10}]
ENFOQUE TERAPÉUTICO DE ELECCIÓN: ${simulatedCase.goldStandardFramework}
ESQUEMA FARMACOLÓGICO: ${simulatedCase.goldStandardPharmacology}

DESGLOSE DE COMPETENCIAS CLÍNICAS (4 EJES):
------------------------------------------------------------------------
1. Eje A - Anamnesis & Manejo de Rapport: ${score.axisRapportAnamnesis} / 25 pts
2. Eje B - Agudeza Diagnóstica & Ciclo Evolutivo: ${score.axisDiagnosticAcuity} / 25 pts
3. Eje C - Selección Terapéutica Basada en Evidencia: ${score.axisEvidenceSelection} / 25 pts
4. Eje D - Ejecución Técnica y Protocolo Paso a Paso: ${score.axisTechnicalAdherence} / 25 pts

DICTAMEN PEDAGÓGICO DE SUPERVISIÓN:
${score.pedagogicalFeedback}

NOTA DEL SUPERVISOR DR. JAMES MORRISON:
"${score.morrisonSupervisorNote}"
========================================================================
Sello de Validación Digital AMIE Clinical Engine • ID Cert: AMIE-SIM-${Math.floor(100000 + Math.random() * 900000)}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AMIE_Acreditacion_${simulatedCase.caseCode}_Score${score.totalScore}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className={`border rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100 transition-all ${
      isApproved 
        ? 'bg-slate-900 border-emerald-500/60 shadow-emerald-950/30' 
        : 'bg-slate-900 border-rose-500/60 shadow-rose-950/30'
    }`}>
      {/* Dynamic Celebration vs Failure Banner */}
      {isApproved ? (
        /* VICTORY SCREEN (70 - 100 PTS) */
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          {/* Confetti & Glow Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="text-5xl animate-bounce">
              🥳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  ¡Felicitaciones! Caso Clínico Resuelto con Éxito
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <PartyPopper className="w-3.5 h-3.5" /> Acreditado
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed max-w-xl">
                Has demostrado excelente agudeza diagnóstica, diferenciando oportunamente las crisis del ciclo evolutivo de la patología psiquiátrica y aplicando con precisión los criterios DSM-5-TR.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Puntaje Obtenido</span>
              <span className="text-4xl font-black font-mono text-emerald-300">{score.totalScore}</span>
              <span className="text-xs text-slate-400 font-mono"> / 100 pts</span>
            </div>
          </div>
        </div>
      ) : (
        /* FAILURE SCREEN (< 70 PTS) */
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950 via-red-950 to-slate-900 border border-rose-500/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-4 relative z-10">
            <div className="text-5xl">
              😞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-rose-200 tracking-tight">
                  Intento No Aprobado (Calificación Insuficiente)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" /> &lt; 70 pts
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-1 leading-relaxed max-w-xl">
                Se detectaron omisiones críticas en la anamnesis, descarte de sesgo evolutivo o elección del protocolo psicoterapéutico/farmacológico. Revise los puntos débiles señalados abajo antes de reintentar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-rose-300 uppercase font-semibold block">Puntaje Final</span>
              <span className="text-4xl font-black font-mono text-rose-300">{score.totalScore}</span>
              <span className="text-xs text-slate-400 font-mono"> / 100 pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Radar Chart + 4-Axis Scorecards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-5 bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Matriz de Competencias del Profesional
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar
                  name="Profesional"
                  dataKey="score"
                  stroke={isApproved ? '#10b981' : '#f43f5e'}
                  fill={isApproved ? '#10b981' : '#f43f5e'}
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 Score Axis Cards (with Failure Highlighting if low score) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Eje A */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
            score.axisRapportAnamnesis < 17
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold block">Eje A: Anamnesis & Rapport</span>
                {score.axisRapportAnamnesis < 17 && (
                  <span className="text-[10px] font-bold text-rose-400 uppercase">Falla</span>
                )}
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Empatía, exploración del motivo cardinal y calibración de las defensas del paciente.
              </p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-slate-800/60 pt-2 font-mono">
              <span className="opacity-70 text-[10px]">Puntaje:</span>
              <span className={`text-base font-bold ${score.axisRapportAnamnesis < 17 ? 'text-rose-400' : 'text-cyan-300'}`}>
                {score.axisRapportAnamnesis} / 25 pts
              </span>
            </div>
          </div>

          {/* Eje B */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
            score.axisDiagnosticAcuity < 17
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold block">Eje B: Agudeza & Ciclo Vital</span>
                {score.axisDiagnosticAcuity < 17 && (
                  <span className="text-[10px] font-bold text-rose-400 uppercase">Falla</span>
                )}
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Diferenciación de crisis normativas del desarrollo vs patología formal DSM-5.
              </p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-slate-800/60 pt-2 font-mono">
              <span className="opacity-70 text-[10px]">Puntaje:</span>
              <span className={`text-base font-bold ${score.axisDiagnosticAcuity < 17 ? 'text-rose-400' : 'text-purple-300'}`}>
                {score.axisDiagnosticAcuity} / 25 pts
              </span>
            </div>
          </div>

          {/* Eje C */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
            score.axisEvidenceSelection < 17
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold block">Eje C: Selección Basada en Evidencia</span>
                {score.axisEvidenceSelection < 17 && (
                  <span className="text-[10px] font-bold text-rose-400 uppercase">Falla</span>
                )}
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Elección de corriente psicoterapéutica (TCC/DBT/EMDR) y esquema farmacológico.
              </p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-slate-800/60 pt-2 font-mono">
              <span className="opacity-70 text-[10px]">Puntaje:</span>
              <span className={`text-base font-bold ${score.axisEvidenceSelection < 17 ? 'text-rose-400' : 'text-amber-300'}`}>
                {score.axisEvidenceSelection} / 25 pts
              </span>
            </div>
          </div>

          {/* Eje D */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
            score.axisTechnicalAdherence < 17
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold block">Eje D: Ejecución Técnica & Protocolo</span>
                {score.axisTechnicalAdherence < 17 && (
                  <span className="text-[10px] font-bold text-rose-400 uppercase">Falla</span>
                )}
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Adherencia al procedimiento clínico paso a paso y medidas de seguridad/contención.
              </p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-slate-800/60 pt-2 font-mono">
              <span className="opacity-70 text-[10px]">Puntaje:</span>
              <span className={`text-base font-bold ${score.axisTechnicalAdherence < 17 ? 'text-rose-400' : 'text-emerald-300'}`}>
                {score.axisTechnicalAdherence} / 25 pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Remedial Study Recommendations if Failed */}
      {!isApproved && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 space-y-2 text-xs text-rose-200">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Lecturas y Principios Diagnósticos Sugeridos para Repaso:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-4 text-[11px] text-rose-100">
            <li><strong>Guía DSM-5 de James Morrison:</strong> Capítulo correspondiente a {simulatedCase.stage} ({simulatedCase.goldStandardDiagnosis}).</li>
            <li><strong>Principio de Seguridad A:</strong> Descartar siempre causa médica general o toxicometabólica antes de concluir etiología psiquiátrica.</li>
            <li><strong>Principio W:</strong> Evitar diagnosticar trastornos de personalidad durante un cuadro agudo del estado de ánimo.</li>
          </ul>
        </div>
      )}

      {/* Morrison Supervisor Feedback Box */}
      <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-cyan-300">
          <BookOpen className="w-4 h-4" />
          <span>Dictamen Pedagógico del Supervisor Clínico (James Morrison Feedback):</span>
        </div>
        <p className="text-slate-300 leading-relaxed italic pl-6">
          "{score.morrisonSupervisorNote}"
        </p>
        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <strong>Diagnóstico Gold Standard:</strong> {simulatedCase.goldStandardDiagnosis} ({simulatedCase.goldStandardCIE10})
        </div>
      </div>

      {/* Digital Accreditation Badge if Approved */}
      {isApproved && (
        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                Insignia Digital de Acreditación AMIE Emitida
              </div>
              <p className="text-slate-400 text-[11px]">
                Acreditación de resolución de caso clínico bajo estándares DSM-5-TR / AMIE Framework.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadCertificate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 active:scale-95 shrink-0"
          >
            {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloaded ? 'Descargado' : 'Descargar Acreditación'}</span>
          </button>
        </div>
      )}

      {/* Footer Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={onRestartSimulation}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{isApproved ? 'Practicar de Nuevo' : 'Reintentar Caso'}</span>
        </button>

        {onNextCase && (
          <button
            onClick={onNextCase}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 active:scale-95 transition"
          >
            <span>Siguiente Caso del Ciclo Evolutivo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
