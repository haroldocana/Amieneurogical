import React, { useState } from 'react';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { AlertTriangle, Send, FileText, PhoneCall, ShieldAlert, CheckSquare, Square, Printer, Check, Copy } from 'lucide-react';

interface PsychiatryReferralViewProps {
  patient: PatientRecord;
  analysis: AmieClinicalAnalysis | null;
  currentDoctorName: string;
  colegiadoNumber: number;
}

export const PsychiatryReferralView: React.FC<PsychiatryReferralViewProps> = ({
  patient,
  analysis,
  currentDoctorName,
  colegiadoNumber,
}) => {
  const [copied, setCopied] = useState(false);
  const [containmentChecklist, setContainmentChecklist] = useState({
    mediaRestriction: true,
    constantCompanion: true,
    emergencyHotlineGiven: true,
    hospitalEscortReady: false,
    toxicologyOrdered: true
  });

  const toggleCheck = (k: keyof typeof containmentChecklist) => {
    setContainmentChecklist(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const referralText = `
HOJA DE REFERENCIA MÉDICA URGENTE A PSIQUIATRÍA / SALUD MENTAL
============================================================
Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
Médico Remitente: ${currentDoctorName}
No. de Colegiado: ${colegiadoNumber}
Institución: AMIE Medical Network - Unidad de Interconsulta

DATOS DEL PACIENTE:
- Código / ID: ${patient.id}
- Nombre / Identificador: ${patient.patientNameAnonymized}
- Edad: ${patient.age} años | Género: ${patient.gender}

MOTIVO DE REFERENCIA:
${patient.consultationReason}

IMPRESIÓN DIAGNÓSTICA DSM-5 (COGNITIVO-BIOCLÍNICO):
- Diagnóstico Principal: ${analysis?.principalDiagnosis.disorderName || 'En Evaluación Activa'}
- Código CIE-10: ${analysis?.principalDiagnosis.codeCIE10 || 'Pendiente'}
- Severidad GAF/EEAG: ${analysis?.principalDiagnosis.gafEstimated || patient.psychometricScores.gafEstimated || 'N/A'}/100

TRIANGULACIÓN DE RIESGO:
- Nivel de Riesgo Suicida (SAD PERSONS: ${patient.psychometricScores.sadPersons ?? 'N/A'}/10): ${analysis?.riskAlerts.suicideRiskLevel || 'EVALUAR'}
- Medición Pasiva APK Centinela: Despertares Nocturnos = ${patient.sentinelTelemetry?.nightWakeups ?? 'N/A'}, Latencia Biomotora = ${patient.sentinelTelemetry?.biomotorLatencyMs ?? 'N/A'} ms
- Riesgo Psicótico: ${analysis?.riskAlerts.psychosisRisk || 'Evaluación en curso'}

ACCIONES DE CONTENCIÓN INMEDIATA REALIZADAS:
${containmentChecklist.mediaRestriction ? '[X] Restricción de acceso a medios letales (armas, fármacos)' : '[ ] Restricción de medios letales'}
${containmentChecklist.constantCompanion ? '[X] Acompañamiento familiar o cuidador 24/7 establecido' : '[ ] Acompañamiento 24/7'}
${containmentChecklist.emergencyHotlineGiven ? '[X] Línea directa de emergencia provista a la red de apoyo' : '[ ] Línea directa'}
${containmentChecklist.toxicologyOrdered ? '[X] Perfil toxicológico y metabólico de exclusión solicitado' : '[ ] Toxicología'}

OBSERVACIONES CLÍNICAS:
${analysis?.principalDiagnosis.justificationDsm5 || patient.anamnesis}
============================================================
Firma del Médico Responsable: ____________________ (Colegiado #${colegiadoNumber})
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(referralText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-rose-600 to-amber-600 rounded-lg text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-white">
              Módulo de Referencia & Contención Psiquiátrica Urgente
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generación de informe de derivación oficial, protocolo de rescate y verificación de medidas de seguridad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span>{copied ? 'Copiado' : 'Copiar Informe'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Hoja de Referencia</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Checklist & Protocol */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <h3 className="font-bold text-xs uppercase tracking-wider text-rose-400 flex items-center gap-1.5 mb-3">
              <AlertTriangle className="w-4 h-4" /> Checklist de Contención Activa
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div
                onClick={() => toggleCheck('mediaRestriction')}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
              >
                {containmentChecklist.mediaRestriction ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
                <span>Restricción de medios letales en hogar (fármacos, armas de fuego, objetos punzantes).</span>
              </div>

              <div
                onClick={() => toggleCheck('constantCompanion')}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
              >
                {containmentChecklist.constantCompanion ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
                <span>Acompañamiento continuo y no-aislamiento por red de apoyo designada.</span>
              </div>

              <div
                onClick={() => toggleCheck('emergencyHotlineGiven')}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
              >
                {containmentChecklist.emergencyHotlineGiven ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
                <span>Línea telefónica de crisis 24/7 y contacto del médico colegiado provistos.</span>
              </div>

              <div
                onClick={() => toggleCheck('toxicologyOrdered')}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
              >
                {containmentChecklist.toxicologyOrdered ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
                <span>Laboratorios toxicológicos y metabólicos de urgencia ordenados.</span>
              </div>
            </div>
          </div>

          {patient.sentinelTelemetry && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Red de Apoyo Vinculada (APK)</span>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div className="font-bold text-slate-200">{patient.sentinelTelemetry.emergencyContact.name}</div>
                <div className="text-slate-400">{patient.sentinelTelemetry.emergencyContact.relationship}</div>
                <a
                  href={`tel:${patient.sentinelTelemetry.emergencyContact.phone}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono font-semibold"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> {patient.sentinelTelemetry.emergencyContact.phone}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right: Printable Referral Letter Document */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {referralText}
          </div>
        </div>
      </div>
    </div>
  );
};
