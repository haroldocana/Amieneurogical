import React, { useRef } from 'react';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { 
  Printer, 
  FileText, 
  ShieldCheck, 
  Brain, 
  Activity, 
  AlertTriangle, 
  Award, 
  Download,
  Building,
  UserCheck
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  analysis: AmieClinicalAnalysis;
  doctorName: string;
  colegiadoNumber: number;
  onClose?: () => void;
}

export const ClinicalReportExporter: React.FC<Props> = ({
  patient,
  analysis,
  doctorName,
  colegiadoNumber,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Barra de Acciones Superior */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-600/20 text-sky-400 rounded-xl border border-sky-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Generador de Dictamen Bioclínico Oficial</h3>
            <p className="text-xs text-slate-400">Formato estandarizado para expediente médico, interconsulta y respaldo legal.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar como PDF</span>
          </button>
        </div>
      </div>

      {/* ÁREA IMPRESA (MEMBRETE Y DICTAMEN OFICIAL) */}
      <div ref={printRef} className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl space-y-6 print:p-0 print:shadow-none font-serif text-xs leading-relaxed">
        
        {/* Encabezado / Membrete Institucional */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">PLATAFORMA DE NEUROPSIQUIATRÍA Y SALUD MENTAL AMIE</h1>
            <p className="text-[10px] text-slate-600 font-sans">Sistema de Triangulación Bioclínica y Diagnóstico de Precisión</p>
            <p className="text-[10px] text-slate-600 font-sans">Certificación de Seguridad HIPAA / RGPD / Normativa DSM-5-TR</p>
          </div>
          <div className="text-right font-sans">
            <span className="text-[10px] font-bold text-slate-500 block">FECHA Y HORA EMISIÓN</span>
            <span className="text-xs font-semibold text-slate-800">{currentDate}</span>
            <span className="text-[10px] font-bold text-sky-700 block mt-1">EXPEDIENTE: {patient.id}</span>
          </div>
        </div>

        {/* Ficha Identificación del Paciente y Médico */}
        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded border border-slate-300 font-sans text-[11px]">
          <div>
            <span className="font-bold block text-slate-700">DATOS DEL PACIENTE:</span>
            <p><strong>ID Anonimizado:</strong> {patient.patientNameAnonymized} ({patient.id})</p>
            <p><strong>Edad / Género:</strong> {patient.age} años | {patient.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
            <p><strong>Motivo de Consulta:</strong> {patient.consultationReason}</p>
          </div>
          <div>
            <span className="font-bold block text-slate-700">PROFESIONAL RESPONSABLE:</span>
            <p><strong>Médico/Especialista:</strong> {doctorName}</p>
            <p><strong>No. Colegiado Profesional:</strong> #{colegiadoNumber}</p>
            <p><strong>Estado del Sistema:</strong> Validado por Gemini 3.8 Flash Engine</p>
          </div>
        </div>

        {/* BLOQUE 1: DIAGNÓSTICO PRINCIPAL */}
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-400 pb-1 font-sans flex items-center gap-2">
            BLOQUE I: IMPRESIÓN DIAGNÓSTICA PRINCIPAL (DSM-5-TR / CIE-11)
          </h2>
          <div className="p-3 bg-sky-50 border-l-4 border-sky-600 font-sans">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-sky-900">
                {analysis.principalDiagnosis.disorderName} ({analysis.principalDiagnosis.codeCIE10})
              </span>
              <span className="text-xs font-extrabold text-sky-700 bg-sky-200 px-2 py-0.5 rounded">
                Certeza Algorítmica: {analysis.principalDiagnosis.certaintyPct}%
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-800 leading-normal">
              <strong>Justificación Normativa DSM-5:</strong> {analysis.principalDiagnosis.justificationDsm5}
            </p>
          </div>
        </div>

        {/* BLOQUE 2: MATRIZ DE DIAGNÓSTICO DIFERENCIAL & DESCARTE DE SESGOS */}
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
              {analysis.differentialMatrix?.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-300 p-1.5 font-bold">{item.disorderName}</td>
                  <td className="border border-slate-300 p-1.5 text-center">{item.codeCIE10}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-bold">
                    <span className={item.status.includes('Confirmado') ? 'text-emerald-700' : 'text-slate-600'}>
                      {item.status}
                    </span>
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center font-bold">{item.certaintyPct}%</td>
                  <td className="border border-slate-300 p-1.5 text-slate-700">{item.biasDiscardRationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BLOQUE 3: TRIANGULACIÓN BIOCLÍNICA MULTIMODAL */}
        <div className="space-y-1 font-sans">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-400 pb-1">
            BLOQUE III: TRIANGULACIÓN BIOCLÍNICA MULTIMODAL (QEEG + BIOMETRÍA VR / GEOID + PSICOMETRÍA)
          </h2>
          <div className="grid grid-cols-2 gap-3 text-[10px] pt-1">
            <div className="p-2 border border-slate-300 rounded">
              <strong className="text-slate-800 block mb-1">Perfil Psicométrico y Funcional:</strong>
              <p>{analysis.bioclinicalTriangulation.psychometricsSummary}</p>
            </div>
            <div className="p-2 border border-slate-300 rounded">
              <strong className="text-slate-800 block mb-1">Telemetría VR / GEOID HS500 & Tono Vagal:</strong>
              <p>{analysis.bioclinicalTriangulation.vrHabituationAssessment || 'Sin incongruencia vegetativa registrada.'}</p>
            </div>
          </div>
        </div>

        {/* BLOQUE 4: EVALUACIÓN Y PLAN FARMACOLÓGICO */}
        <div className="space-y-1 font-sans">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-400 pb-1">
            BLOQUE IV: RECOMENDACIONES TERAPÉUTICAS Y PLAN FARMACOLÓGICO
          </h2>
          <div className="p-2 bg-slate-50 border border-slate-300 text-[10px]">
            <strong className="block text-slate-800 mb-1">Estrategia Psicoterapéutica Sugerida:</strong>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
              {analysis.recommendedActionPlan.psychotherapyStrategy.map((strat, i) => (
                <li key={i}>{strat}</li>
              ))}
            </ul>

            <strong className="block text-slate-800 mt-2 mb-1">Esquema Psicofarmacológico Orientativo:</strong>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
              {analysis.recommendedActionPlan.pharmacologySuggestions.map((pharm, i) => (
                <li key={i}>{pharm}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* BLOQUE 5: ALERTAS DE RIESGO Y PROTOCOLO DE CONTENCIÓN */}
        <div className="space-y-1 font-sans">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-400 pb-1">
            BLOQUE V: EVALUACIÓN DE RIESGO Y SEGURIDAD
          </h2>
          <div className="p-2 bg-rose-50 border border-rose-300 rounded text-[10px]">
            <div className="flex justify-between font-bold text-rose-900 mb-1">
              <span>Nivel Riesgo Suicida: {analysis.riskAlerts.suicideRiskLevel}</span>
              <span>Riesgo Psicosis: {analysis.riskAlerts.psychosisRisk}</span>
            </div>
            <p className="text-slate-800">
              <strong>Alertas Críticas:</strong> {analysis.riskAlerts.criticalAlertsList.join(' | ')}
            </p>
          </div>
        </div>

        {/* Pie de Página y Firma Legal */}
        <div className="pt-8 flex justify-between items-end font-sans text-[10px]">
          <div>
            <p className="text-slate-500">Documento generado mediante software asistido por IA (AMIE v3.8).</p>
            <p className="text-slate-500">El dictamen final debe ser validado por el profesional de la salud tratante.</p>
          </div>
          <div className="text-center w-48 border-t border-slate-900 pt-1">
            <p className="font-bold text-slate-900">{doctorName}</p>
            <p className="text-slate-600">Colegiado No. #{colegiadoNumber}</p>
            <p className="text-slate-500 italic">Firma y Sello del Médico Tratante</p>
          </div>
        </div>

      </div>
    </div>
  );
};
