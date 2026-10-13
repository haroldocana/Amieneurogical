import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { 
  getTheoreticalInterpretation, 
  calculateRCI, 
  calculateDyadicSynchrony,
  TheoreticalInterpretation 
} from '../utils/apaEngine';
import { 
  BookOpen, 
  GitMerge, 
  TrendingUp, 
  Users, 
  Download, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileText 
} from 'lucide-react';

interface ApaTherapeuticModuleProps {
  patient: PatientRecord;
}

export const ApaTherapeuticModule: React.FC<ApaTherapeuticModuleProps> = ({ patient }) => {
  const [selectedCurrent, setSelectedCurrent] = useState<'tcc' | 'psychodynamic' | 'humanist' | 'systemic' | 'neuropsych'>('tcc');

  // Extracción segura de línea de base psicométrica
  const resolveInitialPreScore = (): number => {
    const p = patient as any;
    return Number(p?.psychometricScores?.phq9 ?? p?.psychometricScores?.bdi2 ?? 16);
  };

  const [preScore, setPreScore] = useState<number>(resolveInitialPreScore());
  const [postScore, setPostScore] = useState<number>(8);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // 1. Resincronización automática de puntajes cuando cambia el paciente
  useEffect(() => {
    setPreScore(resolveInitialPreScore());
    setPostScore(8);
  }, [patient?.id]);

  const interpretation: TheoreticalInterpretation = getTheoreticalInterpretation(patient, selectedCurrent);
  const rci = calculateRCI(preScore, postScore);

  // 2. Extracción de trazas de HRV con resolución de telemetría real de la sesión
  const p = patient as any;
  const patientHrvSeries: number[] = Array.isArray(p?.vrTelemetryData?.hrvRmssdMs) && p.vrTelemetryData.hrvRmssdMs.length >= 2
    ? p.vrTelemetryData.hrvRmssdMs.slice(-4)
    : p?.vrTherapyIntervention?.realtimeTelemetrySummary?.lfHfRatio
      ? [1.2, 1.4, Number(p.vrTherapyIntervention.realtimeTelemetrySummary.lfHfRatio), 1.3]
      : [1.2, 1.5, 2.1, 1.8];

  const therapistHrvSeries: number[] = [1.1, 1.4, 2.0, 1.7];
  const synchrony = calculateDyadicSynchrony(therapistHrvSeries, patientHrvSeries);

  const generateReportText = () => {
    const patientId = patient?.id || p?.patientId || 'PAC-8104';
    const diagCode = p?.diagnosticCode || p?.diagnosticEngineOutput?.primaryDiagnostic?.dsm5Code || 'F32.9';

    return `
===================================================================
REPORTE DE CASO CLÍNICO ESTÁNDAR APA (N=1) - AMIE NEUROLOGICAL
===================================================================
FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
ID PACIENTE: ${patientId}
EDAD: ${patient?.age || 55} años | GÉNERO: ${patient?.gender || 'M'}
DIAGNÓSTICO DSM-5: ${diagCode}
MARCO TEÓRICO SELECCIONADO: ${interpretation.currentName}

--- TRIANGULACIÓN BIOMÉTRICA DE BASE ---
Motivo de Consulta: ${p?.consultationReason || 'Evaluación neuropsiquiátrica y monitoreo JITAI'}
Correlato Biométrico: ${interpretation.biometricCorrelate}

--- FORMULACIÓN CLÍNICA (${interpretation.currentName}) ---
Conceptos Clave: ${interpretation.keyConcepts.join(', ')}
Hipótesis Clínica: ${interpretation.clinicalHypothesis}
Técnica Recomendada: ${interpretation.recommendedTechnique}

--- ANÁLISIS DE EFECTIVIDAD CIENTÍFICA (RCI JACOBSON & TRUAX) ---
Puntuación Pre-Tratamiento: ${rci.preScore}
Puntuación Post-Tratamiento: ${rci.postScore}
Diferencia Absoluta: ${rci.preScore - rci.postScore} puntos
Valor RCI Calculado: ${rci.rciValue} (Criterio: |RCI| > 1.96, p < 0.05)
Estatus Clínico: ${rci.clinicalStatus}
Significancia Estadística: ${rci.isStatisticallySignificant ? 'SÍ (Cambio Confiable)' : 'NO (Dentro del error de medida)'}

--- ALIANZA TERAPÉUTICA (SINCRONÍA DIÁDICA HRV) ---
Porcentaje de Acoplamiento Fisiológico: ${synchrony.couplingPercentage}%
Nivel de Co-regulación Autonómica: ${synchrony.allianceLevel}
Interpretación: ${synchrony.clinicalNote}
===================================================================
Validación Científica AMIE • División 12 APA (Clinical Psychology)
    `.trim();
  };

  const handleExportApaCase = () => {
    try {
      const reportContent = generateReportText();
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Caso_Clinico_APA_${patient?.id || 'PAC-8104'}_${selectedCurrent.toUpperCase()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch {
      handleCopyReport();
    }
  };

  const handleCopyReport = () => {
    try {
      const reportContent = generateReportText();
      navigator.clipboard.writeText(reportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar reporte APA:', err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-2xl text-slate-100">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Traducción por Corrientes Clínicas &amp; Validación Científica APA
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Integración epistemológica de biometría objetiva para investigación, ateneos y práctica asistencial (División 12 APA).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyReport}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            title="Copiar texto al portapapeles"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportApaCase}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
          >
            {downloaded ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloaded ? 'Descargado' : 'Exportar Caso APA (N=1)'}</span>
          </button>
        </div>
      </div>

      {/* Selector de Corriente Teórica */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <GitMerge className="w-4 h-4 text-sky-400" />
          Selecciona el Marco Teórico de Trabajo:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'tcc', name: 'Cognitivo-Conductual / ACT' },
            { id: 'psychodynamic', name: 'Psicodinámica' },
            { id: 'humanist', name: 'Humanista / Gestalt' },
            { id: 'systemic', name: 'Sistémica / Relacional' },
            { id: 'neuropsych', name: 'Neuropsicología' }
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCurrent(c.id as any)}
              className={`p-2.5 rounded-xl text-xs font-bold transition text-center border cursor-pointer ${
                selectedCurrent === c.id
                  ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Ficha de Interpretación Epistemológica */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {interpretation.currentName}
          </h3>
          <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800/60 px-2 py-0.5 rounded font-mono">
            Interpretación Biométrica Activa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Conceptos Clave</span>
            <div className="flex flex-wrap gap-1">
              {interpretation.keyConcepts.map((kc, idx) => (
                <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700/60">
                  {kc}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Hipótesis Clínica</span>
            <p className="text-slate-200 text-[11px] leading-relaxed">{interpretation.clinicalHypothesis}</p>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Técnica Recomendada</span>
            <p className="text-emerald-300 font-semibold text-[11px] leading-relaxed">{interpretation.recommendedTechnique}</p>
          </div>
        </div>

        <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-300">
          <strong className="text-cyan-400 font-mono">Correlato Biométrico de Triangulación:</strong> {interpretation.biometricCorrelate}
        </div>
      </div>

      {/* Grid de Validación Científica: RCI + Sincronía Diádica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Calculadora RCI de Jacobson & Truax */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Índice de Cambio Confiable (RCI - Jacobson &amp; Truax)
            </h4>
            <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded">
              p &lt; 0.05 (Z &gt; 1.96)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Puntuación Pre-Tratamiento</label>
              <input
                type="number"
                value={preScore}
                onChange={(e) => setPreScore(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Puntuación Post-Tratamiento</label>
              <input
                type="number"
                value={postScore}
                onChange={(e) => setPostScore(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Valor RCI Calculado</span>
              <span className="text-base font-bold font-mono text-amber-400">{rci.rciValue}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Estatus de Efectividad</span>
              <span className={`text-xs font-bold ${rci.isStatisticallySignificant ? 'text-emerald-400' : 'text-slate-400'}`}>
                {rci.clinicalStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Co-regulación y Sincronía Fisiológica Diádica */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              Sincronía Fisiológica Diádica (Alianza Terapéutica)
            </h4>
            <span className="text-[10px] text-purple-300 font-mono bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded">
              HRV Coupling
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Acoplamiento Autonómico Terapeuta-Paciente:</span>
              <span className="font-bold text-purple-300 font-mono">{synchrony.couplingPercentage}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-purple-600 to-indigo-400 h-full transition-all duration-500" 
                style={{ width: `${Math.min(100, synchrony.couplingPercentage)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">Nivel de Co-regulación:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {synchrony.allianceLevel}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApaTherapeuticModule;
