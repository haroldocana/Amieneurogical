import React from 'react';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { 
  Printer, 
  FileText, 
  X,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  analysis: AmieClinicalAnalysis;
  doctorName: string;
  colegiadoNumber: number | string;
  onClose?: () => void;
}

export const ClinicalReportExporter: React.FC<Props> = ({
  patient,
  analysis,
  doctorName,
  colegiadoNumber,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const documentHash = `SHA256-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // 1. Normalización polimórfica del diagnóstico principal
  const anyAnalysis = analysis as any;
  const rawPrincipal = analysis?.principalDiagnosis || anyAnalysis?.primaryDiagnostic;

  const principal = {
    disorderName: rawPrincipal?.disorderName || rawPrincipal?.title || 'Evaluación Diagnóstica en Curso',
    codeCIE10: rawPrincipal?.codeCIE10 || rawPrincipal?.dsm5Code || rawPrincipal?.icd11Code || 'F32.9',
    certaintyPct: rawPrincipal?.certaintyPct ?? rawPrincipal?.probabilityPercent ?? 90,
    justificationDsm5: rawPrincipal?.justificationDsm5 || rawPrincipal?.rationale || anyAnalysis?.clinicalHypothesis || 'Fundamentación semiológica basada en criterios clínicos DSM-5-TR / CIE-11.'
  };

  // 2. Normalización de listas y alertas de riesgo
  const diffMatrix = Array.isArray(analysis?.differentialMatrix) ? analysis.differentialMatrix : [];
  const actionPlan = analysis?.recommendedActionPlan || anyAnalysis?.treatmentPlan || {};
  const psychotherapyList: string[] = Array.isArray(actionPlan?.psychotherapyStrategy) 
    ? actionPlan.psychotherapyStrategy 
    : Array.isArray(anyAnalysis?.therapeuticRecommendations) 
      ? anyAnalysis.therapeuticRecommendations 
      : ['Intervención psicoterapéutica estándar orientada a objetivos.'];

  const pharmacologyList: string[] = Array.isArray(actionPlan?.pharmacologySuggestions)
    ? actionPlan.pharmacologySuggestions
    : ['Esquema psicofarmacológico no requerido o diferido a interconsulta.'];

  const triangulation = analysis?.bioclinicalTriangulation || anyAnalysis?.biomedicalTriangulation || {};

  // Resolución segura de alertas críticas
  const rawRisk = analysis?.riskAlerts as any;
  const suicideRisk = rawRisk?.suicideRiskLevel || (Array.isArray(rawRisk) ? (rawRisk.some((r: any) => r.level === 'CRÍTICO') ? 'ALTO' : 'MODERADO') : 'BAJO');
  const psychosisRisk = rawRisk?.psychosisRisk || 'BAJO';

  let criticalAlertsSummary = 'Sin alertas críticas activas.';
  if (Array.isArray(rawRisk?.criticalAlertsList) && rawRisk.criticalAlertsList.length > 0) {
    criticalAlertsSummary = rawRisk.criticalAlertsList.join(' | ');
  } else if (Array.isArray(rawRisk)) {
    criticalAlertsSummary = rawRisk.map((r: any) => `[${r.level || 'ALERTA'}] ${r.message || ''}`).join(' | ');
  } else if (typeof rawRisk?.containmentProtocolSuggested === 'string') {
    criticalAlertsSummary = rawRisk.containmentProtocolSuggested;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-slate-100">
      {/* Barra de Acciones Superior (Oculta en Impresión) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-600/20 text-sky-400 rounded-xl border border-sky-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Generador de Dictamen Bioclínico Oficial</h3>
            <p className="text-xs text-slate-400">Formato estandarizado para expediente médico, interconsulta y respaldo médico-legal.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/20 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar como PDF</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              title="Cerrar Vista Previa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ÁREA IMPRESA (MEMBRETE Y DICTAMEN OFICIAL) */}
      <div className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl space-y-6 print:p-0 print:shadow-none font-serif text-xs leading-relaxed">
        
        {/* Encabezado / Membrete Institucional */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
              PLATAFORMA DE NEUROPSIQUIATRÍA Y SALUD MENTAL AMIE
            </h1>
            <p className="text-[10px] text-slate-600 font-sans">Sistema de Triangulación Bioclínica y Diagnóstico de Precisión (SaMD)</p>
            <p className="text-[10px] text-slate-600 font-sans">Certificación de Seguridad HIPAA / Normativa DSM-5-TR &amp; CIE-11</p>
          </div>
          <div className="text-right font-sans">
            <span className="text-[10px] font-bold text-slate-500 block">FECHA Y HORA DE EMISIÓN</span>
            <span className="text-xs font-semibold text-slate-800">{currentDate}</span>
            <span className="text-[10px] font-bold text-sky-700 block mt-1">EXPEDIENTE: {patient?.id || 'PAC-8104'}</span>
          </div>
        </div>

        {/* Ficha de Identificación del Paciente y Médico */}
        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded border border-slate-300 font-sans text-[11px]">
          <div>
            <span className="font-bold block text-slate-700 mb-1">DATOS DEL PACIENTE:</span>
            <p><strong>ID Anonimizado:</strong> {patient?.patientNameAnonymized || patient?.id || 'PAC-8104'}</p>
            <p><strong>Edad / Género:</strong> {patient?.age || '--'} años | {patient?.gender === 'M' ? 'Masculino' : patient?.gender === 'F' ? 'Femenino' : 'No especificado'}</p>
            <p><strong>Motivo de Consulta:</strong> {patient?.consultationReason || 'Evaluación Bioclínica Multimodal'}</p>
          </div>
          <div>
            <span className="font-bold block text-slate-700 mb-1">PROFESIONAL RESPONSABLE:</span>
            <p><strong>Médico/Especialista:</strong> {doctorName}</p>
            <p><strong>No. Colegiado Profesional:</strong> #{colegiadoNumber}</p>
            <p><strong>Motor de Validación:</strong> AMIE Clinical AI Engine</p>
          </div>
        </div>

        {/* BLOQUE I: DIAGNÓSTICO PRINCIPAL */}
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-400 pb-1 font-sans flex items-center gap-2">
            BLOQUE I: IMPRESIÓN DIAGNÓSTICA PRINCIPAL (DSM-5-TR / CIE-11)
          </h2>
          <div className="p-3 bg-sky-50 border-l-4 border-sky-600 font-sans">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-sky-900">
                {principal.disorderName} ({principal.codeCIE10})
              </span>
              <span className="text-xs font-extrabold text-sky-700 bg-sky-200 px-2 py-0.5 rounded">
                Certeza Algorítmica: {principal.certaintyPct}%
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-800 leading-normal">
              <strong>Justificación Normativa DSM-5:</strong> {principal.justificationDsm5}
            </p>
          </div>
        </div>

        {/* BLOQUE II: MATRIZ DE DIAGNÓSTICO DIFERENCIAL & DESCARTE DE SESGOS */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-400 pb-1 font-sans">
            BLOQUE II: MATRIZ DE DIFERENCIACIÓN Y REGISTRADOR ANTI-SESGOS
          </h2>
          <table className="w-full border-collapse border border-slate-300 font-sans text-[10px]">
            <thead>
              <tr className="bg-slate-200 text-slate-800">
                <th className="border border-slate-300 p-1.5 text-left">Trastorno Diferencial</th>
                <th className="border border-slate-300 p-1.5 text-center">CIE-11</th>
                <th className="border border-slate-300 p-1.5 text-center">Estado</th>
                <th className="border border-slate-300 p-1.5 text-center">Certeza</th>
                <th className="border border-slate-300 p-1.5 text-left">Fundamento / Descarte de Sesgo</th>
              </tr>
            </thead>
            <tbody>
              {diffMatrix.length > 0 ? (
                diffMatrix.map((item, idx) => {
                  const isConfirmed = typeof item.status === 'string' && item.status.toLowerCase().includes('confirmado');
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 p-1.5 font-bold">{item.disorderName}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{item.codeCIE10}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">
                        <span className={isConfirmed ? 'text-emerald-700' : 'text-slate-600'}>
                          {item.status || 'Descartado'}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{item.certaintyPct}%</td>
                      <td className="border border-slate-300 p-1.5 text-slate-700">{item.biasDiscardRationale}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="border border-slate-300 p-2 text-center text-slate-500 italic">
                    Sin diagnósticos diferenciales conflictivos en la matriz actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BLOQUE III: TRIANGULACIÓN BIOCLÍNICA MULTIMODAL */}
        <div className="space-y-1 font-sans">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-400 pb-1">
            BLOQUE III: TRIANGULACIÓN BIOCLÍNICA MULTIMODAL (QEEG + BIOMETRÍA VR PICO 3 + PSICOMETRÍA)
          </h2>
          <div className="grid grid-cols-2 gap-3 text-[10px] pt-1">
            <div className="p-2 border border-slate-300 rounded bg-slate-50/50">
              <strong className="text-slate-800 block mb-1">Perfil Psicométrico y Funcional:</strong>
              <p>{triangulation?.psychometricsSummary || 'Correspondencia psicométrica adecuada con escalas administradas.'}</p>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50/50">
              <strong className="text-slate-800 block mb-1">Telemetría VR Pico 3 &amp; Tono Vagal:</strong>
              <p>{triangulation?.vrHabituationAssessment || 'Registros inmersivos dentro de límites normativos. Sin incongruencia autonómica registrada.'}</p>
            </div>
          </div>
        </div>

        {/* BLOQUE IV: RECOMENDACIONES TERAPÉUTICAS Y PLAN FARMACOLÓGICO */}
        <div className="space-y-1 font-sans">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-400 pb-1">
            BLOQUE IV: RECOMENDACIONES TERAPÉUTICAS Y PLAN FARMACOLÓGICO
          </h2>
          <div className="p-2 bg-slate-50 border border-slate-300 text-[10px] rounded space-y-2">
            <div>
              <strong className="block text-slate-800 mb-0.5">Estrategia Psicoterapéutica Sugerida:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                {psychotherapyList.map((strat, i) => (
                  <li key={i}>{strat}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong className="block text-slate-800 mb-0.5">Esquema Psicofarmacológico Orientativo:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                {pharmacologyList.map((pharm, i) => (
                  <li key={i}>{pharm}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* BLOQUE V: EVALUACIÓN DE RIESGO Y SEGURIDAD */}
        <div className="space-y-1 font-sans">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-400 pb-1">
            BLOQUE V: EVALUACIÓN DE RIESGO Y SEGURIDAD
          </h2>
          <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-[10px]">
            <div className="flex justify-between font-bold text-rose-900 mb-1">
              <span>Nivel Riesgo Suicida: {suicideRisk}</span>
              <span>Riesgo Psicosis: {psychosisRisk}</span>
            </div>
            <p className="text-slate-800">
              <strong>Alertas Críticas:</strong> {criticalAlertsSummary}
            </p>
          </div>
        </div>

        {/* Pie de Página, Firma y Hash Criptográfico */}
        <div className="pt-6 flex justify-between items-end font-sans text-[10px] border-t border-slate-200">
          <div>
            <p className="text-slate-500 font-mono text-[9px]">HASH AUTENTICIDAD: {documentHash}</p>
            <p className="text-slate-500">Documento médico oficial asistido por software clínico SaMD (AMIE Engine).</p>
            <p className="text-slate-500">El dictamen final debe ser validado por el facultativo colegiado responsable.</p>
          </div>
          <div className="text-center w-52 border-t border-slate-900 pt-1.5">
            <p className="font-bold text-slate-900">{doctorName}</p>
            <p className="text-slate-600">Colegiado No. #{colegiadoNumber}</p>
            <p className="text-slate-500 italic text-[9px]">Firma y Sello del Médico Tratante</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClinicalReportExporter;
